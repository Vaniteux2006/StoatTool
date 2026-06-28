import { ReactiveMap } from "@solid-primitives/map";
import { ReactiveSet } from "@solid-primitives/set";
import { File } from "../classes/File.js";
import { MessageWebhook } from "../classes/Message.js";
import { MessageEmbed } from "../classes/MessageEmbed.js";
import { SystemMessage } from "../classes/SystemMessage.js";
export const messageHydration = {
    keyMapping: {
        _id: "id",
        channel: "channelId",
        author: "authorId",
        system: "systemMessage",
        edited: "editedAt",
        mentions: "mentionIds",
        replies: "replyIds",
    },
    functions: {
        id: (message) => message._id,
        nonce: (message) => message.nonce,
        channelId: (message) => message.channel,
        authorId: (message) => message.author,
        webhook: (message, ctx) => message.webhook
            ? new MessageWebhook(ctx, message.webhook, message.author)
            : undefined,
        content: (message) => message.content,
        systemMessage: (message, ctx) => SystemMessage.from(ctx, message, message.system),
        attachments: (message, ctx) => message.attachments.map((file) => new File(ctx, file)),
        editedAt: (message) => new Date(message.edited),
        embeds: (message, ctx) => message.embeds.map((embed) => MessageEmbed.from(ctx, embed)),
        mentionIds: (message) => message.mentions,
        roleMentionIds: (message) => message.role_mentions,
        replyIds: (message) => message.replies,
        reactions: (message) => {
            const map = new ReactiveMap();
            if (message.reactions) {
                for (const reaction of Object.keys(message.reactions)) {
                    map.set(reaction, new ReactiveSet(message.reactions[reaction]));
                }
            }
            return map;
        },
        interactions: (message) => message.interactions,
        masquerade: (message) => message.masquerade,
        pinned: (message) => message.pinned,
        flags: (message) => message.flags,
    },
    initialHydration: () => ({
        reactions: new ReactiveMap(),
    }),
};
/**
 * Flags attributed to messages
 */
export var MessageFlags;
(function (MessageFlags) {
    /**
     * Message will not send push / desktop notifications
     */
    MessageFlags[MessageFlags["SuppressNotifications"] = 1] = "SuppressNotifications";
    /**
     * Message will mention all users who can see the channel
     */
    MessageFlags[MessageFlags["MentionsEveryone"] = 2] = "MentionsEveryone";
    /**
     * Message will mention all users who are online and can see the channel.
     * This cannot be true if MentionsEveryone is true
     */
    MessageFlags[MessageFlags["MentionsOnline"] = 3] = "MentionsOnline";
})(MessageFlags || (MessageFlags = {}));
