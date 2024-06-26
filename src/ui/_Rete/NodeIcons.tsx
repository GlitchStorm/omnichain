import * as ANT_ICONS from "@ant-design/icons";
import {
    BorderOutlined,
    DeleteOutlined,
    CopyOutlined,
} from "@ant-design/icons";

import { nodeRegistryStorage } from "../../state/nodeRegistry";

/*
Note: the node registry from state can be freely be used here,
since this file is only used on the frontend.
*/

export const getMenuIcon = (itemName: string) => {
    const ICONS: Record<string, any> = {
        // Node makers (root menu) icons
        ...Object.fromEntries(
            Object.values(nodeRegistryStorage.get()).map((node) => [
                node.config.baseConfig.nodeName,
                (ANT_ICONS as any)[node.icon] || BorderOutlined,
            ])
        ),
        // Node menu icons
        ["Duplicate"]: CopyOutlined,
        ["Delete"]: DeleteOutlined,
    };
    const Icon = ICONS[itemName] || ICONS[`${itemName}Node`] || BorderOutlined;
    return <Icon />;
};
