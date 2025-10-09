import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as mediaconvert from 'aws-cdk-lib/aws-mediaconvert';
import { Construct } from 'constructs';

interface PodcastTranscodingStackProps {
  environmentSuffix: string;
  audioBucket: s3.IBucket;
}

export class PodcastTranscodingStack extends Construct {
  public readonly mediaConvertRole: iam.Role;
  public readonly jobTemplateName: string;

  constructor(
    scope: Construct,
    id: string,
    props: PodcastTranscodingStackProps
  ) {
    super(scope, id);

    // IAM role for MediaConvert
    this.mediaConvertRole = new iam.Role(this, 'MediaConvertRole', {
      assumedBy: new iam.ServicePrincipal('mediaconvert.amazonaws.com'),
      description: 'Role for MediaConvert to access S3 buckets',
    });

    // Grant read/write access to audio bucket
    props.audioBucket.grantReadWrite(this.mediaConvertRole);

    // Create job template for audio transcoding to multiple bitrates
    const jobTemplate = new mediaconvert.CfnJobTemplate(
      this,
      'AudioTranscodingTemplate',
      {
        name: `podcast-audio-transcoding-${props.environmentSuffix}`,
        settingsJson: {
          OutputGroups: [
            {
              Name: 'File Group',
              Outputs: [
                {
                  ContainerSettings: {
                    Container: 'MP4',
                  },
                  AudioDescriptions: [
                    {
                      CodecSettings: {
                        Codec: 'MP3',
                        Mp3Settings: {
                          Bitrate: 64000,
                          Channels: 2,
                          SampleRate: 44100,
                          RateControlMode: 'CBR',
                        },
                      },
                    },
                  ],
                  NameModifier: '_64kbps',
                },
                {
                  ContainerSettings: {
                    Container: 'MP4',
                  },
                  AudioDescriptions: [
                    {
                      CodecSettings: {
                        Codec: 'MP3',
                        Mp3Settings: {
                          Bitrate: 128000,
                          Channels: 2,
                          SampleRate: 44100,
                          RateControlMode: 'CBR',
                        },
                      },
                    },
                  ],
                  NameModifier: '_128kbps',
                },
                {
                  ContainerSettings: {
                    Container: 'MP4',
                  },
                  AudioDescriptions: [
                    {
                      CodecSettings: {
                        Codec: 'MP3',
                        Mp3Settings: {
                          Bitrate: 256000,
                          Channels: 2,
                          SampleRate: 44100,
                          RateControlMode: 'CBR',
                        },
                      },
                    },
                  ],
                  NameModifier: '_256kbps',
                },
              ],
              OutputGroupSettings: {
                Type: 'FILE_GROUP_SETTINGS',
                FileGroupSettings: {
                  Destination: `s3://${props.audioBucket.bucketName}/transcoded/`,
                },
              },
            },
          ],
          Inputs: [
            {
              AudioSelectors: {
                'Audio Selector 1': {
                  DefaultSelection: 'DEFAULT',
                },
              },
            },
          ],
        },
        statusUpdateInterval: 'SECONDS_60',
        priority: 0,
        category: 'podcast',
      }
    );

    this.jobTemplateName = jobTemplate.name || '';

    new cdk.CfnOutput(this, 'MediaConvertRoleArn', {
      value: this.mediaConvertRole.roleArn,
      description: 'IAM role ARN for MediaConvert',
    });

    new cdk.CfnOutput(this, 'JobTemplateName', {
      value: this.jobTemplateName,
      description: 'MediaConvert job template name',
    });
  }
}
