import { ReactiveSet } from "@solid-primitives/set";
import type { Channel as APIChannel } from "stoat-api";
import { File } from "../classes/File.js";
import type { Merge } from "../lib/merge.js";
import type { Hydrate } from "./index.js";
export type HydratedChannel = {
    id: string;
    channelType: APIChannel["channel_type"];
    name: string;
    description?: string;
    icon?: File;
    active: boolean;
    typingIds: ReactiveSet<string>;
    recipientIds: ReactiveSet<string>;
    userId?: string;
    ownerId?: string;
    serverId?: string;
    permissions?: bigint;
    defaultPermissions?: {
        a: bigint;
        d: bigint;
    };
    rolePermissions?: Record<string, {
        a: bigint;
        d: bigint;
    }>;
    nsfw: boolean;
    lastMessageId?: string;
    voice?: {
        maxUsers?: number;
    };
};
export declare const channelHydration: Hydrate<Merge<APIChannel>, HydratedChannel>;
//# sourceMappingURL=channel.d.ts.map