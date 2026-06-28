import type { Setter } from "solid-js";
import type { Channel, ChannelUnread, Emoji, Error, FieldsChannel, FieldsMember, FieldsServer, FieldsUser, Member, MemberCompositeKey, Message, RelationshipStatus, Role, Server, User } from "stoat-api";
import type { Client } from "../Client.js";
/**
 * Version 1 of the events protocol
 */
export type ProtocolV1 = {
    client: ClientMessage;
    server: ServerMessage;
    types: {
        policyChange: PolicyChange;
    };
};
/**
 * Messages sent to the server
 */
type ClientMessage = {
    type: "Authenticate";
    token: string;
} | {
    type: "BeginTyping";
    channel: string;
} | {
    type: "EndTyping";
    channel: string;
} | {
    type: "Ping";
    data: number;
} | {
    type: "Pong";
    data: number;
};
/**
 * Messages sent from the server
 */
type ServerMessage = {
    type: "Error";
    data: Error;
} | {
    type: "Bulk";
    v: ServerMessage[];
} | {
    type: "Authenticated";
} | ({
    type: "Ready";
} & Partial<ReadyData>) | {
    type: "Ping";
    data: number;
} | {
    type: "Pong";
    data: number;
} | ({
    type: "Message";
} & Message) | {
    type: "MessageUpdate";
    id: string;
    channel: string;
    data: Partial<Message>;
} | {
    type: "MessageAppend";
    id: string;
    channel: string;
    append: Pick<Partial<Message>, "embeds">;
} | {
    type: "MessageDelete";
    id: string;
    channel: string;
} | {
    type: "MessageReact";
    id: string;
    channel_id: string;
    user_id: string;
    emoji_id: string;
} | {
    type: "MessageUnreact";
    id: string;
    channel_id: string;
    user_id: string;
    emoji_id: string;
} | {
    type: "MessageRemoveReaction";
    id: string;
    channel_id: string;
    emoji_id: string;
} | {
    type: "BulkMessageDelete";
    channel: string;
    ids: string[];
} | ({
    type: "ChannelCreate";
} & Channel) | {
    type: "ChannelUpdate";
    id: string;
    data: Partial<Channel>;
    clear?: FieldsChannel[];
} | {
    type: "ChannelDelete";
    id: string;
} | {
    type: "ChannelGroupJoin";
    id: string;
    user: string;
} | {
    type: "ChannelGroupLeave";
    id: string;
    user: string;
} | {
    type: "ChannelStartTyping";
    id: string;
    user: string;
} | {
    type: "ChannelStopTyping";
    id: string;
    user: string;
} | {
    type: "ChannelAck";
    id: string;
    user: string;
    message_id: string;
} | {
    type: "ServerCreate";
    id: string;
    server: Server;
    channels: Channel[];
} | {
    type: "ServerUpdate";
    id: string;
    data: Partial<Server>;
    clear?: FieldsServer[];
} | {
    type: "ServerDelete";
    id: string;
} | {
    type: "ServerMemberUpdate";
    id: MemberCompositeKey;
    data: Partial<Member>;
    clear?: FieldsMember[];
} | {
    type: "ServerMemberJoin";
    id: string;
    user: string;
} | {
    type: "ServerMemberLeave";
    id: string;
    user: string;
} | {
    type: "ServerRoleUpdate";
    id: string;
    role_id: string;
    data: Partial<Role>;
} | {
    type: "ServerRoleDelete";
    id: string;
    role_id: string;
} | {
    type: "UserUpdate";
    id: string;
    data: Partial<User>;
    clear?: FieldsUser[];
} | {
    type: "UserRelationship";
    user: User;
    status: RelationshipStatus;
} | {
    type: "UserPresence";
    id: string;
    online: boolean;
} | {
    type: "UserSettingsUpdate";
    id: string;
    update: {
        [key: string]: [number, string];
    };
} | {
    type: "UserPlatformWipe";
    user_id: string;
    flags: number;
} | ({
    type: "EmojiCreate";
} & Emoji) | {
    type: "EmojiDelete";
    id: string;
} | ({
    type: "Auth";
} & ({
    event_type: "DeleteSession";
    user_id: string;
    session_id: string;
} | {
    event_type: "DeleteAllSessions";
    user_id: string;
    exclude_session_id: string;
})) | {
    type: "VoiceChannelJoin";
    id: string;
    state: UserVoiceState;
} | {
    type: "VoiceChannelLeave";
    id: string;
    user: string;
} | {
    type: "VoiceChannelMove";
    user: string;
    from: string;
    to: string;
    state: UserVoiceState;
} | {
    type: "UserVoiceStateUpdate";
    id: string;
    channel_id: string;
    data: Partial<UserVoiceState>;
} | {
    type: "UserMoveVoiceChannel";
    node: string;
    token: string;
};
/**
 * Policy change type
 */
type PolicyChange = {
    created_time: string;
    effective_time: string;
    description: string;
    url: string;
};
/**
 * Voice state for a user
 */
export type UserVoiceState = {
    id: string;
    joined_at: number;
    is_receiving: boolean;
    is_publishing: boolean;
    screensharing: boolean;
    camera: boolean;
};
/**
 * Voice state for a channel
 */
type ChannelVoiceState = {
    id: string;
    participants: UserVoiceState[];
};
/**
 * Initial synchronisation packet
 */
type ReadyData = {
    users: User[];
    servers: Server[];
    channels: Channel[];
    members: Member[];
    emojis: Emoji[];
    voice_states: ChannelVoiceState[];
    user_settings: Record<string, unknown>;
    channel_unreads: ChannelUnread[];
    policy_changes: PolicyChange[];
};
/**
 * Handle an event for the Client
 * @param client Client
 * @param event Event
 * @param setReady Signal state change
 */
export declare function handleEvent(client: Client, event: ServerMessage, setReady: Setter<boolean>): Promise<void>;
export {};
//# sourceMappingURL=v1.d.ts.map