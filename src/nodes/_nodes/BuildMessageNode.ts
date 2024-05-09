import { makeNode } from "./_Base";

import { MsgUtils } from "../../util/MsgUtils";

const doc = [
    "Creates a message with the assistant role",
    "and outputs it to a different node. Can optionally",
    "be sent from a specific avatar by specifying its name",
    "(purely cosmetic, does not affect the OpenAI-compatible API).",
    "Files can be passed in as a single file or an array of files.",
    "If both a single file and an array of files are passed in,",
    "the single file will be appended to the array.",
]
    .join(" ")
    .trim();

export const BuildMessageNode = makeNode(
    {
        nodeName: "BuildMessageNode",
        nodeIcon: "CommentOutlined",
        dimensions: [350, 265],
        doc,
    },
    {
        inputs: [
            { name: "content", type: "string", label: "content" },
            { name: "filesArray", type: "fileArray", label: "files (array)" },
            { name: "fileSingle", type: "file", label: "file (single)" },
        ],
        outputs: [{ name: "message", type: "chatMessage", label: "message" }],
        controls: [
            {
                name: "avatarName",
                control: {
                    type: "text",
                    defaultValue: "",
                    config: {
                        label: "avatar",
                    },
                },
            },
        ],
    },
    {
        dataFlow: {
            inputs: ["content", "fileSingle", "filesArray"],
            outputs: [],
            async logic(_node, context, controls, fetchInputs) {
                const inputs = await fetchInputs();
                const files = [...((inputs.filesArray || [])[0] || [])];
                const fileSingle = (inputs.fileSingle || [])[0];
                if (fileSingle) {
                    files.push(fileSingle);
                }
                const message = MsgUtils.freshFromAssistant(
                    context.graphId,
                    (inputs.content || [])[0] || "",
                    (controls.avatarName || undefined) as string | undefined,
                    files
                );
                return { message };
            },
        },
    }
);
