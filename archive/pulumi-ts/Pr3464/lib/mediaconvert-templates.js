"use strict";
// MediaConvert templates for audio transcoding
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioPresets = void 0;
exports.createJobTemplate = createJobTemplate;
exports.audioPresets = [
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
function createJobTemplate(roleArn, outputBucket) {
    return {
        Role: roleArn,
        Settings: {
            OutputGroups: exports.audioPresets.map(preset => ({
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVkaWFjb252ZXJ0LXRlbXBsYXRlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9tZWRpYWNvbnZlcnQtdGVtcGxhdGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSwrQ0FBK0M7OztBQXVDL0MsOENBb0VDO0FBbEdZLFFBQUEsWUFBWSxHQUE2QjtJQUNwRDtRQUNFLElBQUksRUFBRSxhQUFhO1FBQ25CLE9BQU8sRUFBRSxNQUFNO1FBQ2YsVUFBVSxFQUFFLEtBQUs7UUFDakIsUUFBUSxFQUFFLENBQUM7S0FDWjtJQUNEO1FBQ0UsSUFBSSxFQUFFLGdCQUFnQjtRQUN0QixPQUFPLEVBQUUsTUFBTTtRQUNmLFVBQVUsRUFBRSxLQUFLO1FBQ2pCLFFBQVEsRUFBRSxDQUFDO0tBQ1o7SUFDRDtRQUNFLElBQUksRUFBRSxjQUFjO1FBQ3BCLE9BQU8sRUFBRSxNQUFNO1FBQ2YsVUFBVSxFQUFFLEtBQUs7UUFDakIsUUFBUSxFQUFFLENBQUM7S0FDWjtDQUNGLENBQUM7QUFXRixTQUFnQixpQkFBaUIsQ0FDL0IsT0FBZSxFQUNmLFlBQW9CO0lBRXBCLE9BQU87UUFDTCxJQUFJLEVBQUUsT0FBTztRQUNiLFFBQVEsRUFBRTtZQUNSLFlBQVksRUFBRSxvQkFBWSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ3hDLElBQUksRUFBRSxHQUFHLE1BQU0sQ0FBQyxJQUFJLFNBQVM7Z0JBQzdCLG1CQUFtQixFQUFFO29CQUNuQixJQUFJLEVBQUUscUJBQXFCO29CQUMzQixpQkFBaUIsRUFBRTt3QkFDakIsV0FBVyxFQUFFLFFBQVEsWUFBWSxjQUFjO3FCQUNoRDtpQkFDRjtnQkFDRCxPQUFPLEVBQUU7b0JBQ1A7d0JBQ0UsaUJBQWlCLEVBQUU7NEJBQ2pCLFNBQVMsRUFBRSxLQUFLOzRCQUNoQixXQUFXLEVBQUU7Z0NBQ1gsYUFBYSxFQUFFLHdCQUF3Qjs2QkFDeEM7eUJBQ0Y7d0JBQ0QsaUJBQWlCLEVBQUU7NEJBQ2pCO2dDQUNFLGdCQUFnQixFQUFFLGNBQWM7Z0NBQ2hDLGVBQWUsRUFBRSxrQkFBa0I7Z0NBQ25DLGFBQWEsRUFBRTtvQ0FDYixLQUFLLEVBQUUsS0FBSztvQ0FDWixXQUFXLEVBQUU7d0NBQ1gsOEJBQThCLEVBQUUsUUFBUTt3Q0FDeEMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPO3dDQUN2QixlQUFlLEVBQUUsS0FBSzt3Q0FDdEIsWUFBWSxFQUFFLElBQUk7d0NBQ2xCLFVBQVUsRUFBRSxpQkFBaUI7d0NBQzdCLFNBQVMsRUFBRSxNQUFNO3dDQUNqQixVQUFVLEVBQUUsTUFBTSxDQUFDLFVBQVU7d0NBQzdCLGFBQWEsRUFBRSxPQUFPO3FDQUN2QjtpQ0FDRjs2QkFDRjt5QkFDRjt3QkFDRCxZQUFZLEVBQUUsSUFBSSxNQUFNLENBQUMsSUFBSSxFQUFFO3FCQUNoQztpQkFDRjthQUNGLENBQUMsQ0FBQztZQUNILGFBQWEsRUFBRSxDQUFDO1lBQ2hCLE1BQU0sRUFBRTtnQkFDTjtvQkFDRSxjQUFjLEVBQUU7d0JBQ2Qsa0JBQWtCLEVBQUU7NEJBQ2xCLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQzs0QkFDWCxnQkFBZ0IsRUFBRSxTQUFTO3lCQUM1QjtxQkFDRjtvQkFDRCxhQUFhLEVBQUU7d0JBQ2IsVUFBVSxFQUFFLFFBQVE7cUJBQ3JCO29CQUNELFlBQVksRUFBRSxNQUFNO29CQUNwQixVQUFVLEVBQUUsU0FBUztvQkFDckIsY0FBYyxFQUFFLENBQUM7b0JBQ2pCLGFBQWEsRUFBRSxVQUFVO29CQUN6QixhQUFhLEVBQUUsVUFBVTtvQkFDekIsY0FBYyxFQUFFLFdBQVc7aUJBQzVCO2FBQ0Y7U0FDRjtLQUNGLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gTWVkaWFDb252ZXJ0IHRlbXBsYXRlcyBmb3IgYXVkaW8gdHJhbnNjb2RpbmdcblxuZXhwb3J0IGludGVyZmFjZSBBdWRpb1RyYW5zY29kaW5nUHJlc2V0IHtcbiAgbmFtZTogc3RyaW5nO1xuICBiaXRyYXRlOiBudW1iZXI7XG4gIHNhbXBsZVJhdGU6IG51bWJlcjtcbiAgY2hhbm5lbHM6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNvbnN0IGF1ZGlvUHJlc2V0czogQXVkaW9UcmFuc2NvZGluZ1ByZXNldFtdID0gW1xuICB7XG4gICAgbmFtZTogJ2xvdy1xdWFsaXR5JyxcbiAgICBiaXRyYXRlOiAxMjgwMDAsXG4gICAgc2FtcGxlUmF0ZTogNDQxMDAsXG4gICAgY2hhbm5lbHM6IDIsXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnbWVkaXVtLXF1YWxpdHknLFxuICAgIGJpdHJhdGU6IDE5MjAwMCxcbiAgICBzYW1wbGVSYXRlOiA0ODAwMCxcbiAgICBjaGFubmVsczogMixcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdoaWdoLXF1YWxpdHknLFxuICAgIGJpdHJhdGU6IDMyMDAwMCxcbiAgICBzYW1wbGVSYXRlOiA0ODAwMCxcbiAgICBjaGFubmVsczogMixcbiAgfSxcbl07XG5cbmludGVyZmFjZSBNZWRpYUNvbnZlcnRKb2JUZW1wbGF0ZSB7XG4gIFJvbGU6IHN0cmluZztcbiAgU2V0dGluZ3M6IHtcbiAgICBPdXRwdXRHcm91cHM6IEFycmF5PFJlY29yZDxzdHJpbmcsIHVua25vd24+PjtcbiAgICBBZEF2YWlsT2Zmc2V0OiBudW1iZXI7XG4gICAgSW5wdXRzOiBBcnJheTxSZWNvcmQ8c3RyaW5nLCB1bmtub3duPj47XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVKb2JUZW1wbGF0ZShcbiAgcm9sZUFybjogc3RyaW5nLFxuICBvdXRwdXRCdWNrZXQ6IHN0cmluZ1xuKTogTWVkaWFDb252ZXJ0Sm9iVGVtcGxhdGUge1xuICByZXR1cm4ge1xuICAgIFJvbGU6IHJvbGVBcm4sXG4gICAgU2V0dGluZ3M6IHtcbiAgICAgIE91dHB1dEdyb3VwczogYXVkaW9QcmVzZXRzLm1hcChwcmVzZXQgPT4gKHtcbiAgICAgICAgTmFtZTogYCR7cHJlc2V0Lm5hbWV9LW91dHB1dGAsXG4gICAgICAgIE91dHB1dEdyb3VwU2V0dGluZ3M6IHtcbiAgICAgICAgICBUeXBlOiAnRklMRV9HUk9VUF9TRVRUSU5HUycsXG4gICAgICAgICAgRmlsZUdyb3VwU2V0dGluZ3M6IHtcbiAgICAgICAgICAgIERlc3RpbmF0aW9uOiBgczM6Ly8ke291dHB1dEJ1Y2tldH0vdHJhbnNjb2RlZC9gLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIE91dHB1dHM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBDb250YWluZXJTZXR0aW5nczoge1xuICAgICAgICAgICAgICBDb250YWluZXI6ICdNUDQnLFxuICAgICAgICAgICAgICBNcDRTZXR0aW5nczoge1xuICAgICAgICAgICAgICAgIEF1ZGlvRHVyYXRpb246ICdERUZBVUxUX0NPREVDX0RVUkFUSU9OJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBBdWRpb0Rlc2NyaXB0aW9uczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgQXVkaW9UeXBlQ29udHJvbDogJ0ZPTExPV19JTlBVVCcsXG4gICAgICAgICAgICAgICAgQXVkaW9Tb3VyY2VOYW1lOiAnQXVkaW8gU2VsZWN0b3IgMScsXG4gICAgICAgICAgICAgICAgQ29kZWNTZXR0aW5nczoge1xuICAgICAgICAgICAgICAgICAgQ29kZWM6ICdBQUMnLFxuICAgICAgICAgICAgICAgICAgQWFjU2V0dGluZ3M6IHtcbiAgICAgICAgICAgICAgICAgICAgQXVkaW9EZXNjcmlwdGlvbkJyb2FkY2FzdGVyTWl4OiAnTk9STUFMJyxcbiAgICAgICAgICAgICAgICAgICAgQml0cmF0ZTogcHJlc2V0LmJpdHJhdGUsXG4gICAgICAgICAgICAgICAgICAgIFJhdGVDb250cm9sTW9kZTogJ0NCUicsXG4gICAgICAgICAgICAgICAgICAgIENvZGVjUHJvZmlsZTogJ0xDJyxcbiAgICAgICAgICAgICAgICAgICAgQ29kaW5nTW9kZTogJ0NPRElOR19NT0RFXzJfMCcsXG4gICAgICAgICAgICAgICAgICAgIFJhd0Zvcm1hdDogJ05PTkUnLFxuICAgICAgICAgICAgICAgICAgICBTYW1wbGVSYXRlOiBwcmVzZXQuc2FtcGxlUmF0ZSxcbiAgICAgICAgICAgICAgICAgICAgU3BlY2lmaWNhdGlvbjogJ01QRUc0JyxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBOYW1lTW9kaWZpZXI6IGBfJHtwcmVzZXQubmFtZX1gLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9KSksXG4gICAgICBBZEF2YWlsT2Zmc2V0OiAwLFxuICAgICAgSW5wdXRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBBdWRpb1NlbGVjdG9yczoge1xuICAgICAgICAgICAgJ0F1ZGlvIFNlbGVjdG9yIDEnOiB7XG4gICAgICAgICAgICAgIFRyYWNrczogWzFdLFxuICAgICAgICAgICAgICBEZWZhdWx0U2VsZWN0aW9uOiAnREVGQVVMVCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgVmlkZW9TZWxlY3Rvcjoge1xuICAgICAgICAgICAgQ29sb3JTcGFjZTogJ0ZPTExPVycsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBGaWx0ZXJFbmFibGU6ICdBVVRPJyxcbiAgICAgICAgICBQc2lDb250cm9sOiAnVVNFX1BTSScsXG4gICAgICAgICAgRmlsdGVyU3RyZW5ndGg6IDAsXG4gICAgICAgICAgRGVibG9ja0ZpbHRlcjogJ0RJU0FCTEVEJyxcbiAgICAgICAgICBEZW5vaXNlRmlsdGVyOiAnRElTQUJMRUQnLFxuICAgICAgICAgIFRpbWVjb2RlU291cmNlOiAnWkVST0JBU0VEJyxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgfTtcbn1cbiJdfQ==