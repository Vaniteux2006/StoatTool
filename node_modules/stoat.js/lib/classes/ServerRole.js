/**
 * Server Role
 */
export class ServerRole {
    client;
    serverId;
    id;
    name;
    permissions;
    colour;
    hoist;
    rank;
    /**
     * Construct server role
     * @param client Client
     * @param serverId Server ID
     * @param id Role ID
     * @param data Role data
     */
    constructor(client, serverId, id, data) {
        this.client = client;
        this.serverId = serverId;
        this.id = id;
        this.name = data.name;
        this.permissions = {
            a: BigInt(data.permissions.a),
            d: BigInt(data.permissions.d)
        };
        this.colour = data.colour ?? undefined;
        this.hoist = data.hoist || false;
        this.rank = data.rank ?? 0;
    }
    /**
     * Write to string as a role mention
     * @returns Formatted String
     */
    toString() {
        return `<%${this.id}>`;
    }
    /**
     * Server attached to this role
     */
    get server() {
        return this.client.servers.get(this.serverId);
    }
    /**
     * Whether this role is assigned to our server member
     */
    get assigned() {
        return this.server?.member?.roles.includes(this.id) || false;
    }
    /**
     * Delete this role
     */
    delete() {
        return this.server.deleteRole(this.id);
    }
}
