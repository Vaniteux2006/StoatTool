import { Accessor } from "solid-js";
import type { Client } from "../Client.js";
import { UserVoiceState } from "../events/v1.js";
/**
 * Voice Participant
 */
export declare class VoiceParticipant {
    #private;
    protected client: Client;
    readonly userId: string;
    readonly joinedAt: Date;
    readonly isReceiving: Accessor<boolean>;
    readonly isPublishing: Accessor<boolean>;
    readonly isScreensharing: Accessor<boolean>;
    readonly isCamera: Accessor<boolean>;
    /**
     * Construct Server Ban
     * @param client Client
     * @param data Data
     */
    constructor(client: Client, data: UserVoiceState);
    /**
     * Update the state
     * @param data Data
     */
    update(data: Partial<UserVoiceState>): void;
}
//# sourceMappingURL=VoiceParticipant.d.ts.map