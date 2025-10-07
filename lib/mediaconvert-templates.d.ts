export interface AudioTranscodingPreset {
    name: string;
    bitrate: number;
    sampleRate: number;
    channels: number;
}
export declare const audioPresets: AudioTranscodingPreset[];
interface MediaConvertJobTemplate {
    Role: string;
    Settings: {
        OutputGroups: Array<Record<string, unknown>>;
        AdAvailOffset: number;
        Inputs: Array<Record<string, unknown>>;
    };
}
export declare function createJobTemplate(roleArn: string, outputBucket: string): MediaConvertJobTemplate;
export {};
