import {
    EntrypointNode,
    ModuleInputNode,
    ModuleOutputNode,
    ModuleNode,
} from ".";

import * as NODE_MAKERS from ".";

import { NodeContextObj } from "./context";
import { deleteNode, duplicateNode } from "../state/editor";
import { showContextMenu } from "../state/editorContextMenu";
import { isGraphActive } from "../state/executor";

const makeRootMenu = (nodeContext: NodeContextObj) => {
    const { pathToGraph, editor, area } = nodeContext;

    if (!editor || !area) {
        throw new Error("Context menu: editor/area missing!");
    }

    const entrypointsCount = editor
        .getNodes()
        .filter((n) => n instanceof EntrypointNode).length;

    const moduleInputsCount = editor
        .getNodes()
        .filter((n) => n instanceof ModuleInputNode).length;

    const moduleOutputsCount = editor
        .getNodes()
        .filter((n) => n instanceof ModuleOutputNode).length;

    const { x, y } = area.area.pointer;

    const filtered = Object.entries(NODE_MAKERS)
        .filter(([key]) => {
            if (pathToGraph.length === 1) {
                if (key === EntrypointNode.name) {
                    // Prevent adding more than 1 entrypoint
                    return entrypointsCount < 1;
                }
                // Block module-specific nodes in main graph
                return ![ModuleInputNode.name, ModuleOutputNode.name].includes(
                    key
                );
            }
            if (pathToGraph.length === 2) {
                // Prevent adding more than one module input
                if (key === ModuleInputNode.name) {
                    return moduleInputsCount < 1;
                }
                // Prevent adding more than one module output
                if (key === ModuleOutputNode.name) {
                    return moduleOutputsCount < 1;
                }
                // Main-graph-specific nodes are forbidden inside modules
                return ![ModuleNode.name, EntrypointNode.name].includes(key);
            }
            return true;
        })
        .map(([key, Maker]) => ({
            key,
            label: key.replace("Node", "").trim(),
            handler: async () => {
                const n = new (Maker as any)(nodeContext);
                await editor.addNode(n);
                await area.translate(n.id, { x, y });
            },
        }));

    return filtered;
};

const makeNodeMenu = (nodeContext: NodeContextObj, context: any) => {
    return [
        {
            key: "duplicate",
            label: "Duplicate",
            handler: () => duplicateNode(context.id, nodeContext),
        },
        {
            key: "delete",
            label: "Delete",
            handler: () => deleteNode(context.id, nodeContext),
        },
    ];
};

const _makeMenu = (ctx: any, nodeContext: NodeContextObj) => {
    if (ctx === "root") {
        return makeRootMenu(nodeContext);
    }

    return makeNodeMenu(nodeContext, ctx);
};

export const makeContextMenu = (nodeContext: NodeContextObj) => {
    const { editor, area } = nodeContext;
    if (!area) return;

    const findContextMenu = (target: HTMLElement): string | null => {
        let dataAttr = target.dataset.contextMenu;
        if (dataAttr) return dataAttr;
        for (
            let parent = target.parentElement;
            parent;
            parent = parent.parentElement
        ) {
            dataAttr = parent.dataset.contextMenu;
            if (dataAttr) return dataAttr;
        }
        return null;
    };

    area.addPipe((ctx) => {
        if (ctx.type === "contextmenu") {
            ctx.data.event.preventDefault();
            if (isGraphActive(nodeContext.pathToGraph[0])) return;

            const target = ctx.data.event.target as HTMLElement;
            let menuCtx = findContextMenu(target);
            if (menuCtx) {
                const isRoot = menuCtx === "root";
                if (!isRoot) {
                    menuCtx = editor.getNode(menuCtx);
                }
                const items = _makeMenu(menuCtx, nodeContext);
                const { clientX, clientY } = ctx.data.event;
                const { layerX, layerY } = ctx.data.event as any;
                showContextMenu({
                    items,
                    clientX,
                    clientY,
                    layerX,
                    layerY,
                    isRoot,
                });
            }
        }
        return ctx;
    });
};
