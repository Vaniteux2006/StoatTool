import type { Role as APIRole } from "stoat-api";
import type { Client } from "../Client.js";
/**
 * Server Role
 */
export declare class ServerRole {
    protected client: Client;
    protected serverId: string;
    readonly id: string;
    readonly name: string;
    readonly permissions: {
        a: bigint;
        d: bigint;
    };
    readonly colour?: string;
    readonly hoist: boolean;
    readonly rank: number;
    /**
     * Construct server role
     * @param client Client
     * @param serverId Server ID
     * @param id Role ID
     * @param data Role data
     */
    constructor(client: Client, serverId: string, id: string, data: APIRole);
    /**
     * Write to string as a role mention
     * @returns Formatted String
     */
    toString(): string;
    /**
     * Server attached to this role
     */
    get server(): import("./Server.js").Server | undefined;
    /**
     * Whether this role is assigned to our server member
     */
    get assigned(): boolean;
    /**
     * Delete this role
     */
    delete(): Promise<void>;
}
//# sourceMappingURL=ServerRole.d.ts.map