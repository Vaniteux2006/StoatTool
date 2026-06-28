import { createSignal } from "solid-js";
/**
 * Voice Participant
 */
export class VoiceParticipant {
    client;
    userId;
    joinedAt;
    isReceiving;
    isPublishing;
    isScreensharing;
    isCamera;
    #setReceiving;
    #setPublishing;
    #setScreensharing;
    #setCamera;
    /**
     * Construct Server Ban
     * @param client Client
     * @param data Data
     */
    constructor(client, data) {
        this.client = client;
        this.userId = data.id;
        this.joinedAt = new Date(data.joined_at);
        const [isReceiving, setReceiving] = createSignal(data.is_receiving);
        this.isReceiving = isReceiving;
        this.#setReceiving = setReceiving;
        const [isPublishing, setPublishing] = createSignal(data.is_publishing);
        this.isPublishing = isPublishing;
        this.#setPublishing = setPublishing;
        const [isScreensharing, setScreensharing] = createSignal(data.screensharing);
        this.isScreensharing = isScreensharing;
        this.#setScreensharing = setScreensharing;
        const [isCamera, setCamera] = createSignal(data.camera);
        this.isCamera = isCamera;
        this.#setCamera = setCamera;
    }
    /**
     * Update the state
     * @param data Data
     */
    update(data) {
        if (typeof data.is_receiving === 'boolean') {
            this.#setReceiving(data.is_receiving);
        }
        if (typeof data.is_publishing === 'boolean') {
            this.#setPublishing(data.is_publishing);
        }
        if (typeof data.screensharing === 'boolean') {
            this.#setScreensharing(data.screensharing);
        }
        if (typeof data.camera === 'boolean') {
            this.#setCamera(data.camera);
        }
    }
}
