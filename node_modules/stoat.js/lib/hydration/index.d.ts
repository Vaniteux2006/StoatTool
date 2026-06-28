/**
 * Functions to map from one object to another
 */
export type MappingFns<Input, Output, Key extends keyof Output> = Record<Key, (value: Input, context: unknown) => Output[Key]>;
/**
 * Key mapping information
 */
export type KeyMapping<Input, Output> = Record<keyof Input, keyof Output>;
/**
 * Hydration information
 */
export type Hydrate<Input, Output> = {
    keyMapping: Partial<KeyMapping<Input, Output>>;
    functions: MappingFns<Input, Output, keyof Output>;
    initialHydration: () => Partial<Output>;
};
declare const hydrators: {
    bot: Hydrate<{
        _id: string;
        owner: string;
        token: string;
        public: boolean;
        analytics?: boolean;
        discoverable?: boolean;
        interactions_url?: string;
        terms_of_service_url?: string;
        privacy_policy_url?: string;
        flags?: number;
    }, import("./bot.js").HydratedBot>;
    channel: Hydrate<import("../lib/merge.js").Merge<{
        channel_type: "SavedMessages";
        _id: string;
        user: string;
    } | {
        channel_type: "DirectMessage";
        _id: string;
        active: boolean;
        recipients: string[];
        last_message_id?: string | null;
    } | {
        channel_type: "Group";
        _id: string;
        name: string;
        owner: string;
        description?: string | null;
        recipients: string[];
        icon?: {
            _id: string;
            tag: string;
            filename: string;
            metadata: {
                type: "File";
            } | {
                type: "Text";
            } | {
                type: "Image";
                width: number;
                height: number;
            } | {
                type: "Video";
                width: number;
                height: number;
            } | {
                type: "Audio";
            };
            content_type: string;
            size: number;
            deleted?: boolean | null;
            reported?: boolean | null;
            message_id?: string | null;
            user_id?: string | null;
            server_id?: string | null;
            object_id?: string | null;
        } | null;
        last_message_id?: string | null;
        permissions?: number | null;
        nsfw?: boolean;
    } | {
        channel_type: "TextChannel";
        _id: string;
        server: string;
        name: string;
        description?: string | null;
        icon?: {
            _id: string;
            tag: string;
            filename: string;
            metadata: {
                type: "File";
            } | {
                type: "Text";
            } | {
                type: "Image";
                width: number;
                height: number;
            } | {
                type: "Video";
                width: number;
                height: number;
            } | {
                type: "Audio";
            };
            content_type: string;
            size: number;
            deleted?: boolean | null;
            reported?: boolean | null;
            message_id?: string | null;
            user_id?: string | null;
            server_id?: string | null;
            object_id?: string | null;
        } | null;
        last_message_id?: string | null;
        default_permissions?: {
            a: number;
            d: number;
        } | null;
        role_permissions?: {
            [key: string]: {
                a: number;
                d: number;
            };
        };
        nsfw?: boolean;
        voice?: {
            max_users?: number | null;
        } | null;
    }>, import("./channel.js").HydratedChannel>;
    channelUnread: Hydrate<import("../lib/merge.js").Merge<{
        _id: {
            channel: string;
            user: string;
        };
        last_id?: string | null;
        mentions?: string[];
    }>, import("./channelUnread.js").HydratedChannelUnread>;
    channelWebhook: Hydrate<import("../lib/merge.js").Merge<{
        id: string;
        name: string;
        avatar?: {
            _id: string;
            tag: string;
            filename: string;
            metadata: {
                type: "File";
            } | {
                type: "Text";
            } | {
                type: "Image";
                width: number;
                height: number;
            } | {
                type: "Video";
                width: number;
                height: number;
            } | {
                type: "Audio";
            };
            content_type: string;
            size: number;
            deleted?: boolean | null;
            reported?: boolean | null;
            message_id?: string | null;
            user_id?: string | null;
            server_id?: string | null;
            object_id?: string | null;
        } | null;
        creator_id: string;
        channel_id: string;
        permissions: number;
        token?: string | null;
    }>, import("./channelWebhook.js").HydratedChannelWebhook>;
    emoji: Hydrate<import("../lib/merge.js").Merge<{
        _id: string;
        parent: {
            type: "Server";
            id: string;
        } | {
            type: "Detached";
        };
        creator_id: string;
        name: string;
        animated?: boolean;
        nsfw?: boolean;
    }>, import("./emoji.js").HydratedEmoji>;
    message: Hydrate<import("../lib/merge.js").Merge<{
        _id: string;
        nonce?: string | null;
        channel: string;
        author: string;
        user?: {
            _id: string;
            username: string;
            discriminator: string;
            display_name?: string | null;
            avatar?: {
                _id: string;
                tag: string;
                filename: string;
                metadata: {
                    type: "File";
                } | {
                    type: "Text";
                } | {
                    type: "Image";
                    width: number;
                    height: number;
                } | {
                    type: "Video";
                    width: number;
                    height: number;
                } | {
                    type: "Audio";
                };
                content_type: string;
                size: number;
                deleted?: boolean | null;
                reported?: boolean | null;
                message_id?: string | null;
                user_id?: string | null;
                server_id?: string | null;
                object_id?: string | null;
            } | null;
            relations?: {
                _id: string;
                status: "None" | "User" | "Friend" | "Outgoing" | "Incoming" | "Blocked" | "BlockedOther";
            }[];
            badges?: number;
            status?: {
                text?: string | null;
                presence?: ("Online" | "Idle" | "Focus" | "Busy" | "Invisible") | null;
            } | null;
            flags?: number;
            privileged?: boolean;
            bot?: {
                owner: string;
            } | null;
            relationship: "None" | "User" | "Friend" | "Outgoing" | "Incoming" | "Blocked" | "BlockedOther";
            online: boolean;
        } | null;
        member?: {
            _id: {
                server: string;
                user: string;
            };
            joined_at: string;
            nickname?: string | null;
            avatar?: {
                _id: string;
                tag: string;
                filename: string;
                metadata: {
                    type: "File";
                } | {
                    type: "Text";
                } | {
                    type: "Image";
                    width: number;
                    height: number;
                } | {
                    type: "Video";
                    width: number;
                    height: number;
                } | {
                    type: "Audio";
                };
                content_type: string;
                size: number;
                deleted?: boolean | null;
                reported?: boolean | null;
                message_id?: string | null;
                user_id?: string | null;
                server_id?: string | null;
                object_id?: string | null;
            } | null;
            roles?: string[];
            timeout?: string | null;
            can_publish?: boolean;
            can_receive?: boolean;
        } | null;
        webhook?: {
            name: string;
            avatar?: string | null;
        } | null;
        content?: string | null;
        system?: ({
            type: "text";
            content: string;
        } | {
            type: "user_added";
            id: string;
            by: string;
        } | {
            type: "user_remove";
            id: string;
            by: string;
        } | {
            type: "user_joined";
            id: string;
        } | {
            type: "user_left";
            id: string;
        } | {
            type: "user_kicked";
            id: string;
        } | {
            type: "user_banned";
            id: string;
        } | {
            type: "channel_renamed";
            name: string;
            by: string;
        } | {
            type: "channel_description_changed";
            by: string;
        } | {
            type: "channel_icon_changed";
            by: string;
        } | {
            type: "channel_ownership_changed";
            from: string;
            to: string;
        } | {
            type: "message_pinned";
            id: string;
            by: string;
        } | {
            type: "message_unpinned";
            id: string;
            by: string;
        } | {
            type: "call_started";
            by: string;
            finished_at?: string | null;
        }) | null;
        attachments?: {
            _id: string;
            tag: string;
            filename: string;
            metadata: {
                type: "File";
            } | {
                type: "Text";
            } | {
                type: "Image";
                width: number;
                height: number;
            } | {
                type: "Video";
                width: number;
                height: number;
            } | {
                type: "Audio";
            };
            content_type: string;
            size: number;
            deleted?: boolean | null;
            reported?: boolean | null;
            message_id?: string | null;
            user_id?: string | null;
            server_id?: string | null;
            object_id?: string | null;
        }[] | null;
        edited?: string | null;
        embeds?: ({
            type: "Website";
            url?: string | null;
            original_url?: string | null;
            special?: ({
                type: "None";
            } | {
                type: "GIF";
            } | {
                type: "YouTube";
                id: string;
                timestamp?: string | null;
            } | {
                type: "Lightspeed";
                content_type: "Channel";
                id: string;
            } | {
                type: "Twitch";
                content_type: "Video" | "Channel" | "Clip";
                id: string;
            } | {
                type: "Spotify";
                content_type: string;
                id: string;
            } | {
                type: "Soundcloud";
            } | {
                type: "Bandcamp";
                content_type: "Album" | "Track";
                id: string;
            } | {
                type: "AppleMusic";
                album_id: string;
                track_id?: string | null;
            } | {
                type: "Streamable";
                id: string;
            }) | null;
            title?: string | null;
            description?: string | null;
            image?: {
                url: string;
                width: number;
                height: number;
                size: "Large" | "Preview";
            } | null;
            video?: {
                url: string;
                width: number;
                height: number;
            } | null;
            site_name?: string | null;
            icon_url?: string | null;
            colour?: string | null;
        } | {
            type: "Image";
            url: string;
            width: number;
            height: number;
            size: "Large" | "Preview";
        } | {
            type: "Video";
            url: string;
            width: number;
            height: number;
        } | {
            type: "Text";
            icon_url?: string | null;
            url?: string | null;
            title?: string | null;
            description?: string | null;
            media?: {
                _id: string;
                tag: string;
                filename: string;
                metadata: {
                    type: "File";
                } | {
                    type: "Text";
                } | {
                    type: "Image";
                    width: number;
                    height: number;
                } | {
                    type: "Video";
                    width: number;
                    height: number;
                } | {
                    type: "Audio";
                };
                content_type: string;
                size: number;
                deleted?: boolean | null;
                reported?: boolean | null;
                message_id?: string | null;
                user_id?: string | null;
                server_id?: string | null;
                object_id?: string | null;
            } | null;
            colour?: string | null;
        } | {
            type: "None";
        })[] | null;
        mentions?: string[] | null;
        role_mentions?: string[] | null;
        replies?: string[] | null;
        reactions?: {
            [key: string]: string[];
        };
        interactions?: {
            reactions?: string[] | null;
            restrict_reactions?: boolean;
        };
        masquerade?: {
            name?: string | null;
            avatar?: string | null;
            colour?: string | null;
        } | null;
        pinned?: boolean | null;
        flags?: number;
    }>, import("./message.js").HydratedMessage>;
    server: Hydrate<{
        _id: string;
        owner: string;
        name: string;
        description?: string | null;
        channels: string[];
        categories?: {
            id: string;
            title: string;
            channels: string[];
        }[] | null;
        system_messages?: {
            user_joined?: string | null;
            user_left?: string | null;
            user_kicked?: string | null;
            user_banned?: string | null;
        } | null;
        roles?: {
            [key: string]: {
                name: string;
                permissions: {
                    a: number;
                    d: number;
                };
                colour?: string | null;
                hoist?: boolean;
                rank?: number;
            };
        };
        default_permissions: number;
        icon?: {
            _id: string;
            tag: string;
            filename: string;
            metadata: {
                type: "File";
            } | {
                type: "Text";
            } | {
                type: "Image";
                width: number;
                height: number;
            } | {
                type: "Video";
                width: number;
                height: number;
            } | {
                type: "Audio";
            };
            content_type: string;
            size: number;
            deleted?: boolean | null;
            reported?: boolean | null;
            message_id?: string | null;
            user_id?: string | null;
            server_id?: string | null;
            object_id?: string | null;
        } | null;
        banner?: {
            _id: string;
            tag: string;
            filename: string;
            metadata: {
                type: "File";
            } | {
                type: "Text";
            } | {
                type: "Image";
                width: number;
                height: number;
            } | {
                type: "Video";
                width: number;
                height: number;
            } | {
                type: "Audio";
            };
            content_type: string;
            size: number;
            deleted?: boolean | null;
            reported?: boolean | null;
            message_id?: string | null;
            user_id?: string | null;
            server_id?: string | null;
            object_id?: string | null;
        } | null;
        flags?: number;
        nsfw?: boolean;
        analytics?: boolean;
        discoverable?: boolean;
    }, import("./server.js").HydratedServer>;
    serverMember: Hydrate<import("../lib/merge.js").Merge<{
        _id: {
            server: string;
            user: string;
        };
        joined_at: string;
        nickname?: string | null;
        avatar?: {
            _id: string;
            tag: string;
            filename: string;
            metadata: {
                type: "File";
            } | {
                type: "Text";
            } | {
                type: "Image";
                width: number;
                height: number;
            } | {
                type: "Video";
                width: number;
                height: number;
            } | {
                type: "Audio";
            };
            content_type: string;
            size: number;
            deleted?: boolean | null;
            reported?: boolean | null;
            message_id?: string | null;
            user_id?: string | null;
            server_id?: string | null;
            object_id?: string | null;
        } | null;
        roles?: string[];
        timeout?: string | null;
        can_publish?: boolean;
        can_receive?: boolean;
    }>, import("./serverMember.js").HydratedServerMember>;
    session: Hydrate<{
        _id: string;
        name: string;
    }, import("./session.js").HydratedSession>;
    user: Hydrate<{
        _id: string;
        username: string;
        discriminator: string;
        display_name?: string | null;
        avatar?: {
            _id: string;
            tag: string;
            filename: string;
            metadata: {
                type: "File";
            } | {
                type: "Text";
            } | {
                type: "Image";
                width: number;
                height: number;
            } | {
                type: "Video";
                width: number;
                height: number;
            } | {
                type: "Audio";
            };
            content_type: string;
            size: number;
            deleted?: boolean | null;
            reported?: boolean | null;
            message_id?: string | null;
            user_id?: string | null;
            server_id?: string | null;
            object_id?: string | null;
        } | null;
        relations?: {
            _id: string;
            status: "None" | "User" | "Friend" | "Outgoing" | "Incoming" | "Blocked" | "BlockedOther";
        }[];
        badges?: number;
        status?: {
            text?: string | null;
            presence?: ("Online" | "Idle" | "Focus" | "Busy" | "Invisible") | null;
        } | null;
        flags?: number;
        privileged?: boolean;
        bot?: {
            owner: string;
        } | null;
        relationship: "None" | "User" | "Friend" | "Outgoing" | "Incoming" | "Blocked" | "BlockedOther";
        online: boolean;
    }, import("./user.js").HydratedUser>;
};
export type Hydrators = typeof hydrators;
type ExtractInput<T> = T extends Hydrate<infer I, any> ? I : never;
type ExtractOutput<T> = T extends Hydrate<any, infer O> ? O : never;
/**
 * Hydrate some input with a given type
 * @param type Type
 * @param input Input Object
 * @param initial Whether this is the initial hydration
 * @returns Hydrated Object
 */
export declare function hydrate<T extends keyof Hydrators>(type: T, input: Partial<ExtractInput<Hydrators[T]>>, context: unknown, initial?: boolean): ExtractOutput<Hydrators[T]>;
export {};
//# sourceMappingURL=index.d.ts.map