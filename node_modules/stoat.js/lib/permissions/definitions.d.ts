/**
 * Permission against User
 */
export declare const UserPermission: {
    Access: number;
    ViewProfile: number;
    SendMessage: number;
    Invite: number;
};
/**
 * Permission against Server / Channel
 */
export declare const Permission: {
    ManageChannel: bigint;
    ManageServer: bigint;
    ManagePermissions: bigint;
    ManageRole: bigint;
    ManageCustomisation: bigint;
    KickMembers: bigint;
    BanMembers: bigint;
    TimeoutMembers: bigint;
    AssignRoles: bigint;
    ChangeNickname: bigint;
    ManageNicknames: bigint;
    ChangeAvatar: bigint;
    RemoveAvatars: bigint;
    ViewChannel: bigint;
    ReadMessageHistory: bigint;
    SendMessage: bigint;
    ManageMessages: bigint;
    ManageWebhooks: bigint;
    InviteOthers: bigint;
    SendEmbeds: bigint;
    UploadFiles: bigint;
    Masquerade: bigint;
    React: bigint;
    Connect: bigint;
    Speak: bigint;
    Video: bigint;
    MuteMembers: bigint;
    DeafenMembers: bigint;
    MoveMembers: bigint;
    Listen: bigint;
    MentionEveryone: bigint;
    MentionRoles: bigint;
    GrantAllSafe: bigint;
};
/**
 * Maximum safe value
 */
export declare const U32_MAX: number;
/**
 * Permissions allowed for a user while in timeout
 */
export declare const ALLOW_IN_TIMEOUT: bigint;
/**
 * Default permissions if we can only view
 */
export declare const DEFAULT_PERMISSION_VIEW_ONLY: bigint;
/**
 * Default base permissions for channels
 */
export declare const DEFAULT_PERMISSION: bigint;
/**
 * Permissions in saved messages channel
 */
export declare const DEFAULT_PERMISSION_SAVED_MESSAGES: bigint;
/**
 * Permissions in direct message channels / default permissions for group DMs
 */
export declare const DEFAULT_PERMISSION_DIRECT_MESSAGE: bigint;
/**
 * Permissions in server text / voice channel
 */
export declare const DEFAULT_PERMISSION_SERVER: bigint;
//# sourceMappingURL=definitions.d.ts.map