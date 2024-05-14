import { createRoot } from "react-dom/client";
import { NodeEditor } from "rete";
import { AreaPlugin, AreaExtensions } from "rete-area-plugin";
import { ConnectionPlugin } from "rete-connection-plugin";
import { ReactPlugin } from "rete-react-plugin";
import { ReadonlyPlugin } from "rete-readonly-plugin";
import { v4 as uuid } from "uuid";
// import {
//     AutoArrangePlugin,
//     Presets as ArrangePresets,
//     ArrangeAppliers,
// } from "rete-auto-arrange-plugin";

import type { NodeContextObj } from "../../nodes/context";

// Components
import { makeContextMenu } from "./ContextMenu";
import { GraphWatcher } from "./GraphWatcher";
import { AreaSelectionWatcher } from "./AreaSelectionWatcher";
import { NodeCustomizer } from "./NodeCustomizer";
import { FlowCustomizer } from "./FlowCustomizer";
import { GraphTemplate } from "./GraphTemplate";
import { integrateMagCon } from "./magconnection";

// State
import {
    clearEditorState,
    editorTargetStorage,
    setEditorState,
} from "../../state/editor";
import { initGraph, updateNodeControl, graphStorage } from "../../state/graphs";
import {
    controlObservable,
    controlDisabledObservable,
} from "../../state/watcher";
import { isGraphActive } from "../../state/executor";
import { updateNodeSelection } from "../../state/nodeSelection";
import { nodeRegistryStorage } from "../../state/nodeRegistry";

// const { TransitionApplier } = ArrangeAppliers;

export async function createEditor(container: HTMLElement) {
    const graphId = editorTargetStorage.get();

    if (!graphId) {
        throw new Error("Tried to create editor without graph!");
    }

    const editor = new NodeEditor<any>();
    const area = new AreaPlugin<any, any>(container);
    const connection = new ConnectionPlugin<any, any>();
    const readonly = new ReadonlyPlugin<any>();
    const render = new ReactPlugin<any, any>({
        createRoot,
    });

    const nodeSelector = AreaExtensions.selector();
    const nodeSelectorPlugin = AreaExtensions.selectableNodes(
        area,
        nodeSelector,
        {
            accumulating: AreaExtensions.accumulateOnCtrl(),
        }
    );

    const instanceId = uuid();

    const nodeContext: NodeContextObj = {
        headless: false,
        graphId,
        instanceId,
        getGraph() {
            return graphStorage.get()[graphId];
        },
        onEvent(_event) {
            // No events from visual editor
        },
        async onControlChange(node, control, value) {
            await updateNodeControl(graphId, node, control, value);
            controlObservable.next({ graphId, node, control, value });
        },
        async onExternalAction(_action) {
            // No external actions from visual editor
        },
        getControlObservable() {
            return controlObservable;
        },
        getControlDisabledObservable() {
            return controlDisabledObservable;
        },
        getControlValue(node, control) {
            const graph = graphStorage.get()[graphId];
            return graph.nodes.find((n) => n.nodeId === node)?.controls[
                control
            ] as string | number | null;
        },
        getAllControls(nodeId) {
            const graph = graphStorage.get()[graphId];
            const controls = graph.nodes.find(
                (n) => n.nodeId === nodeId
            )?.controls;
            return controls || {};
        },
        getApiKeyByName(_name) {
            // No API keys in visual editor
            return null;
        },
        getFlowActive() {
            return isGraphActive(graphId);
        },
    };

    // const arrange = new AutoArrangePlugin<any>();
    makeContextMenu(editor, area, nodeContext);
    // const applier = new TransitionApplier<any, never>({
    //     duration: 120,
    //     timingFunction: (t) => t,
    //     async onTick() {
    //         await AreaExtensions.zoomAt(area, editor.getNodes());
    //     },
    // });

    editor.use(readonly.root);
    area.use(readonly.area);
    connection.use(readonly.connection as any);

    editor.use(area);
    area.use(render);
    render.addPreset(NodeCustomizer.presetForNodes(editor));

    area.use(connection);
    integrateMagCon(editor, area, connection);
    // area.use(arrange);

    connection.addPreset(FlowCustomizer.getFlowBuilder(connection));
    // arrange.addPreset(ArrangePresets.classic.setup());

    try {
        await initGraph(graphId, editor, area, nodeContext);

        AreaSelectionWatcher.observe(editor, area);
        GraphWatcher.observe(graphId, editor, area);

        // Default content for new graphs
        if (editor.getNodes().length === 0) {
            await GraphTemplate.empty(
                editor,
                nodeContext,
                nodeRegistryStorage.get()
            );
            await AreaExtensions.zoomAt(area, editor.getNodes());
            // Use of the ordering extension, unused
            // await arrange.layout({ applier });
            // AreaExtensions.simpleNodesOrder(area);
        }
    } catch (error) {
        console.error(error);
    }

    setEditorState(editor, area, nodeSelectorPlugin.unselect);

    return {
        // nodeContext,
        readonly,
        destroy: () => {
            // Cleanup editor
            clearEditorState();
            // Clear selection
            const selectedNodes = editor
                .getNodes()
                .filter((n) => n.selected)
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                .map((n) => n.id);
            for (const id of selectedNodes) {
                nodeSelectorPlugin.unselect(id);
            }
            updateNodeSelection([]);
            // Cleanup area
            area.destroy();
        },
    };
}
