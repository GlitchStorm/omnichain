import {
    BorderOutlined,
    DeleteOutlined,
    CopyOutlined,
} from "@ant-design/icons";

import * as MAKERS from ".";

const ICONS: Record<string, any> = {
    // Node makers (root menu) icons
    ...Object.fromEntries(
        Object.values(MAKERS).map((M) => [M.name, M.icon || BorderOutlined])
    ),
    // Node menu icons
    ["Duplicate"]: CopyOutlined,
    ["Delete"]: DeleteOutlined,
};

export const getMenuIcon = (itemName: string) => {
    const Icon = ICONS[itemName] || ICONS[`${itemName}Node`] || BorderOutlined;
    return <Icon />;
};
