// MediaConvert templates for audio transcoding

export interface AudioTranscodingPreset {
  name: string;
  bitrate: number;
  sampleRate: number;
  channels: number;
}

export const audioPresets: AudioTranscodingPreset[] = [
  {
    name: 'low-quality',
    bitrate: 128000,
    sampleRate: 44100,
    channels: 2,
  },
  {
    name: 'medium-quality',
    bitrate: 192000,
    sampleRate: 48000,
    channels: 2,
  },
  {
    name: 'high-quality',
    bitrate: 320000,
    sampleRate: 48000,
    channels: 2,
  },
];

interface MediaConvertJobTemplate {
  Role: string;
  Settings: {
    OutputGroups: Array<Record<string, unknown>>;
    AdAvailOffset: number;
    Inputs: Array<Record<string, unknown>>;
  };
}

export function createJobTemplate(
  roleArn: string,
  outputBucket: string
): MediaConvertJobTemplate {
  return {
    Role: roleArn,
    Settings: {
      OutputGroups: audioPresets.map(preset => ({
        Name: `${preset.name}-output`,
        OutputGroupSettings: {
          Type: 'FILE_GROUP_SETTINGS',
          FileGroupSettings: {
            Destination: `s3://${outputBucket}/transcoded/`,
          },
        },
        Outputs: [
          {
            ContainerSettings: {
              Container: 'MP4',
              Mp4Settings: {
                AudioDuration: 'DEFAULT_CODEC_DURATION',
              },
            },
            AudioDescriptions: [
              {
                AudioTypeControl: 'FOLLOW_INPUT',
                AudioSourceName: 'Audio Selector 1',
                CodecSettings: {
                  Codec: 'AAC',
                  AacSettings: {
                    AudioDescriptionBroadcasterMix: 'NORMAL',
                    Bitrate: preset.bitrate,
                    RateControlMode: 'CBR',
                    CodecProfile: 'LC',
                    CodingMode: 'CODING_MODE_2_0',
                    RawFormat: 'NONE',
                    SampleRate: preset.sampleRate,
                    Specification: 'MPEG4',
                  },
                },
              },
            ],
            NameModifier: `_${preset.name}`,
          },
        ],
      })),
      AdAvailOffset: 0,
      Inputs: [
        {
          AudioSelectors: {
            'Audio Selector 1': {
              Tracks: [1],
              DefaultSelection: 'DEFAULT',
            },
          },
          VideoSelector: {
            ColorSpace: 'FOLLOW',
          },
          FilterEnable: 'AUTO',
          PsiControl: 'USE_PSI',
          FilterStrength: 0,
          DeblockFilter: 'DISABLED',
          DenoiseFilter: 'DISABLED',
          TimecodeSource: 'ZEROBASED',
        },
      ],
    },
  };
}
