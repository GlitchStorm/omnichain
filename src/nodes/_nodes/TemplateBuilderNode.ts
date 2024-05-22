import { makeNode } from "./_Base";

export const TemplateBuilderNode = makeNode(
    {
        nodeName: "TemplateBuilderNode",
        nodeIcon: "FileTextOutlined",
        dimensions: [580, 475],
        doc: "Build a prompt by combining a template with values.",
    },
    {
        inputs: [{ name: "parts", type: "slot", multi: true }],
        outputs: [{ name: "result", type: "string" }],
        controls: [
            {
                name: "val",
                control: {
                    type: "text",
                    defaultValue: "",
                    config: { large: true },
                },
            },
        ],
    },
    {
        async dataFlow(nodeId, context) {
            const inputs = (await context.fetchInputs(nodeId)) as {
                parts?: {
                    name: string;
                    value: string;
                }[];
            };
            const controls = context.getAllControls(nodeId);

            let tmpl = controls.val as string;

            for (const { name, value } of inputs.parts ?? []) {
                const escaped = ("{" + name + "}").replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                );
                const regex = new RegExp(escaped, "g");
                tmpl = tmpl.replace(regex, value);
            }

            return { result: tmpl };
        },
    }
);
