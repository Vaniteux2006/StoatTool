import { decodeTime } from "ulid";
/**
 * System Message
 */
export class SystemMessage {
    client;
    type;
    /**
     * Construct System Message
     * @param client Client
     * @param type Type
     */
    constructor(client, type) {
        this.client = client;
        this.type = type;
    }
    /**
     * Create an System Message from an API System Message
     * @param client Client
     * @param embed Data
     * @returns System Message
     */
    static from(client, parent, message) {
        switch (message.type) {
            case "text":
                return new TextSystemMessage(client, message);
            case "user_added":
            case "user_remove":
                return new UserModeratedSystemMessage(client, message);
            case "user_joined":
            case "user_left":
            case "user_kicked":
            case "user_banned":
                return new UserSystemMessage(client, message);
            case "channel_renamed":
                return new ChannelRenamedSystemMessage(client, message);
            case "channel_description_changed":
            case "channel_icon_changed":
                return new ChannelEditSystemMessage(client, message);
            case "channel_ownership_changed":
                return new ChannelOwnershipChangeSystemMessage(client, message);
            case "message_pinned":
            case "message_unpinned":
                return new MessagePinnedSystemMessage(client, message);
            case "call_started":
                return new CallStartedSystemMessage(client, parent, message);
            default:
                return new TextSystemMessage(client, {
                    type: "text",
                    content: `${message.type} is not supported.`,
                });
        }
    }
}
/**
 * Text System Message
 */
export class TextSystemMessage extends SystemMessage {
    content;
    /**
     * Construct System Message
     * @param client Client
     * @param systemMessage System Message
     */
    constructor(client, systemMessage) {
        super(client, systemMessage.type);
        this.content = systemMessage.content;
    }
}
/**
 * User System Message
 */
export class UserSystemMessage extends SystemMessage {
    userId;
    /**
     * Construct System Message
     * @param client Client
     * @param systemMessage System Message
     */
    constructor(client, systemMessage) {
        super(client, systemMessage.type);
        this.userId = systemMessage.id;
    }
    /**
     * User this message concerns
     */
    get user() {
        return this.client.users.get(this.userId);
    }
}
/**
 * User Moderated System Message
 */
export class UserModeratedSystemMessage extends UserSystemMessage {
    byId;
    /**
     * Construct System Message
     * @param client Client
     * @param systemMessage System Message
     */
    constructor(client, systemMessage) {
        super(client, systemMessage);
        this.byId = systemMessage.by;
    }
    /**
     * User this action was performed by
     */
    get by() {
        return this.client.users.get(this.byId);
    }
}
/**
 * Channel Edit System Message
 */
export class ChannelEditSystemMessage extends SystemMessage {
    byId;
    /**
     * Construct System Message
     * @param client Client
     * @param systemMessage System Message
     */
    constructor(client, systemMessage) {
        super(client, systemMessage.type);
        this.byId = systemMessage.by;
    }
    /**
     * User this action was performed by
     */
    get by() {
        return this.client.users.get(this.byId);
    }
}
/**
 * Channel Renamed System Message
 */
export class ChannelRenamedSystemMessage extends ChannelEditSystemMessage {
    name;
    /**
     * Construct System Message
     * @param client Client
     * @param systemMessage System Message
     */
    constructor(client, systemMessage) {
        super(client, systemMessage);
        this.name = systemMessage.name;
    }
}
/**
 * Channel Ownership Change System Message
 */
export class ChannelOwnershipChangeSystemMessage extends SystemMessage {
    fromId;
    toId;
    /**
     * Construct System Message
     * @param client Client
     * @param systemMessage System Message
     */
    constructor(client, systemMessage) {
        super(client, systemMessage.type);
        this.fromId = systemMessage.from;
        this.toId = systemMessage.to;
    }
    /**
     * User giving away channel ownership
     */
    get from() {
        return this.client.users.get(this.fromId);
    }
    /**
     * User receiving channel ownership
     */
    get to() {
        return this.client.users.get(this.toId);
    }
}
/**
 * Message Pinned System Message
 */
export class MessagePinnedSystemMessage extends SystemMessage {
    messageId;
    byId;
    /**
     * Construct System Message
     * @param client Client
     * @param systemMessage System Message
     */
    constructor(client, systemMessage) {
        super(client, systemMessage.type);
        this.messageId = systemMessage.id;
        this.byId = systemMessage.by;
    }
    /**
     * Message that was pinned/unpinned
     */
    get message() {
        return this.client.messages.get(this.messageId);
    }
    /**
     * User that pinned/unpinned
     */
    get by() {
        return this.client.users.get(this.byId);
    }
}
/**
 * Call Started System Message
 */
export class CallStartedSystemMessage extends SystemMessage {
    byId;
    startedAt;
    finishedAt;
    /**
     * Construct System Message
     * @param client Client
     * @param parent Message
     * @param systemMessage System Message
     */
    constructor(client, parent, systemMessage) {
        super(client, systemMessage.type);
        this.byId = systemMessage.by;
        this.startedAt = new Date(decodeTime(parent._id));
        this.finishedAt = systemMessage.finished_at != null ? new Date(systemMessage.finished_at) : null;
    }
    /**
     * User that started the call
     */
    get by() {
        return this.client.users.get(this.byId);
    }
}
