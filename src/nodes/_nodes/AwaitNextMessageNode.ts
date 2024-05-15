import { makeNode } from "./_Base";

import type { ChatMessage } from "../../data/types";

const doc = [
    "Waits for a new user message to appear on the message queue.",
    "If a new message is detected, this node saves it to the session,",
    "so it can be read by other nodes, and triggers the 'trigger out' output.",
    "Every time a new message is detected, it replaces the previous one",
    "in the session.",
]
    .join(" ")
    .trim();

export const AwaitNextMessageNode = makeNode(
    {
        nodeName: "AwaitNextMessageNode",
        nodeIcon: "CommentOutlined",
        dimensions: [300, 175],
        doc,
    },
    {
        inputs: [
            {
                name: "triggerIn",
                type: "trigger",
                label: "trigger in",
                multi: true,
            },
        ],
        outputs: [
            { name: "triggerOut", type: "trigger", label: "trigger out" },
        ],
        controls: [
            {
                name: "waitTimeMs",
                control: {
                    type: "number",
                    defaultValue: 100,
                    config: {
                        label: "Polling interval (ms)",
                        min: 1,
                    },
                },
            },
        ],
    },
    {
        async controlFlow(nodeId, context) {
            const waitTime = context.getAllControls(nodeId)
                .waitTimeMs as number;

            const check = async () => {
                const messages = (await context.onExternalAction({
                    type: "checkQueue",
                })) as ChatMessage[];
                if (messages.length) {
                    const last = messages[messages.length - 1];
                    if (last.role === "user") {
                        return true;
                    }
                }
                return false;
            };

            while (context.getFlowActive() && !(await check())) {
                await new Promise((resolve) => setTimeout(resolve, waitTime));
            }

            if (!context.getFlowActive()) return null;

            await context.onExternalAction({
                type: "grabNextMessage",
            });

            return "triggerOut";
        },
    }
);
