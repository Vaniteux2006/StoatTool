import type { ChannelUnread as APIChannelUnread } from "stoat-api";
import { ChannelUnread } from "../classes/ChannelUnread.js";
import { Channel } from "../classes/index.js";
import type { HydratedChannelUnread } from "../hydration/channelUnread.js";
import { ClassCollection } from "./Collection.js";
/**
 * Collection of Channel Unreads
 */
export declare class ChannelUnreadCollection extends ClassCollection<ChannelUnread, HydratedChannelUnread> {
    /**
     * Load unread information from server
     */
    sync(): Promise<void>;
    /**
     * Clear all unread data
     */
    reset(): void;
    /**
     * Get or create
     * @param id Id
     * @param data Data
     */
    getOrCreate(id: string, data: APIChannelUnread): ChannelUnread;
    /**
     * Get channel unread data for a specific Channel
     * @param channel Channel
     * @returns Unread
     */
    for(channel: Channel): ChannelUnread;
}
//# sourceMappingURL=ChannelUnreadCollection.d.ts.map