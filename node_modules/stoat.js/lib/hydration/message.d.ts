import { ReactiveMap } from "@solid-primitives/map";
import { ReactiveSet } from "@solid-primitives/set";
import type { Interactions, Masquerade, Message } from "stoat-api";
import { File } from "../classes/File.js";
import { MessageWebhook } from "../classes/Message.js";
import { MessageEmbed } from "../classes/MessageEmbed.js";
import { SystemMessage } from "../classes/SystemMessage.js";
import type { Merge } from "../lib/merge.js";
import type { Hydrate } from "./index.js";
export type HydratedMessage = {
    id: string;
    nonce?: string;
    channelId: string;
    authorId?: string;
    webhook?: MessageWebhook;
    content?: string;
    systemMessage?: SystemMessage;
    attachments?: File[];
    editedAt?: Date;
    embeds?: MessageEmbed[];
    mentionIds?: string[];
    roleMentionIds?: string[];
    replyIds?: string[];
    reactions: ReactiveMap<string, ReactiveSet<string>>;
    interactions?: Interactions;
    masquerade?: Masquerade;
    pinned?: boolean;
    flags?: MessageFlags;
};
export declare const messageHydration: Hydrate<Merge<Message>, HydratedMessage>;
/**
 * Flags attributed to messages
 */
export declare enum MessageFlags {
    /**
     * Message will not send push / desktop notifications
     */
    SuppressNotifications = 1,
    /**
     * Message will mention all users who can see the channel
     */
    MentionsEveryone = 2,
    /**
     * Message will mention all users who are online and can see the channel.
     * This cannot be true if MentionsEveryone is true
     */
    MentionsOnline = 3
}
//# sourceMappingURL=message.d.ts.map