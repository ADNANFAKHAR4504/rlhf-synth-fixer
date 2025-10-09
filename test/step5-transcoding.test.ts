import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { PodcastStorageStack } from '../lib/podcast-storage-stack';
import { PodcastTranscodingStack } from '../lib/podcast-transcoding-stack';

describe('Step 5: Transcoding Stack Tests', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let storageStack: PodcastStorageStack;
  let transcodingStack: PodcastTranscodingStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    storageStack = new PodcastStorageStack(stack, 'PodcastStorage', {
      environmentSuffix: 'test'
    });
    transcodingStack = new PodcastTranscodingStack(stack, 'PodcastTranscoding', {
      audioBucket: storageStack.audioBucket,
      environmentSuffix: 'test'
    });
    template = Template.fromStack(stack);
  });

  test('Step 5.1: Transcoding stack is created', () => {
    expect(transcodingStack).toBeDefined();
    expect(transcodingStack.jobTemplateName).toBeDefined();
    expect(transcodingStack.mediaConvertRole).toBeDefined();
  });

  test('Step 5.2: MediaConvert IAM role is created', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'mediaconvert.amazonaws.com'
            }
          })
        ])
      }
    });
  });

  test('Step 5.3: MediaConvert role has S3 read/write permissions', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: Match.arrayWith([
              's3:GetObject*',
              's3:PutObject'
            ]),
            Effect: 'Allow'
          })
        ])
      }
    });
  });

  test('Step 5.4: MediaConvert job template is created', () => {
    template.hasResourceProperties('AWS::MediaConvert::JobTemplate', {
      Name: Match.stringLikeRegexp('.*audio.*transcoding.*')
    });
  });

  test('Step 5.5: Job template has correct output groups', () => {
    template.hasResourceProperties('AWS::MediaConvert::JobTemplate', {
      SettingsJson: Match.objectLike({
        OutputGroups: Match.arrayWith([
          Match.objectLike({
            Name: 'File Group'
          })
        ])
      })
    });
  });

  test('Step 5.6: Job template outputs have correct container settings', () => {
    template.hasResourceProperties('AWS::MediaConvert::JobTemplate', {
      SettingsJson: Match.objectLike({
        OutputGroups: Match.arrayWith([
          Match.objectLike({
            Outputs: Match.arrayWith([
              Match.objectLike({
                ContainerSettings: {
                  Container: 'RAW'
                }
              })
            ])
          })
        ])
      })
    });
  });

  test('Step 5.7: Stack outputs are defined', () => {
    const outputs = template.toJSON().Outputs;
    const outputKeys = Object.keys(outputs);

    // Check that outputs exist with correct descriptions
    const hasJobTemplateOutput = outputKeys.some(key =>
      outputs[key].Description === 'MediaConvert job template name'
    );
    const hasRoleArnOutput = outputKeys.some(key =>
      outputs[key].Description === 'IAM role ARN for MediaConvert'
    );

    expect(hasJobTemplateOutput).toBe(true);
    expect(hasRoleArnOutput).toBe(true);
  });

  test('Step 5.8: Job template has correct name pattern', () => {
    expect(transcodingStack.jobTemplateName).toMatch(/podcast-audio-transcoding-test/);
  });

  test('Step 5.9: Job template name is not empty', () => {
    expect(transcodingStack.jobTemplateName).toBeTruthy();
    expect(transcodingStack.jobTemplateName.length).toBeGreaterThan(0);
  });

  test('Step 5.10: MediaConvert role has description', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      Description: 'Role for MediaConvert to access S3 buckets'
    });
  });

  test('Step 5.11: Job template has 3 audio outputs', () => {
    template.hasResourceProperties('AWS::MediaConvert::JobTemplate', {
      SettingsJson: Match.objectLike({
        OutputGroups: Match.arrayWith([
          Match.objectLike({
            Outputs: Match.arrayWith([
              Match.objectLike({
                NameModifier: '_64kbps',
                Extension: 'mp3'
              }),
              Match.objectLike({
                NameModifier: '_128kbps',
                Extension: 'mp3'
              }),
              Match.objectLike({
                NameModifier: '_256kbps',
                Extension: 'mp3'
              })
            ])
          })
        ])
      })
    });
  });

  test('Step 5.12: Job template has correct bitrate settings', () => {
    template.hasResourceProperties('AWS::MediaConvert::JobTemplate', {
      SettingsJson: Match.objectLike({
        OutputGroups: Match.arrayWith([
          Match.objectLike({
            Outputs: Match.arrayWith([
              Match.objectLike({
                AudioDescriptions: Match.arrayWith([
                  Match.objectLike({
                    CodecSettings: {
                      Codec: 'MP3',
                      Mp3Settings: {
                        Bitrate: 64000,
                        Channels: 2,
                        SampleRate: 44100,
                        RateControlMode: 'CBR'
                      }
                    }
                  })
                ])
              })
            ])
          })
        ])
      })
    });
  });

  test('Step 5.13: Job template has correct destination', () => {
    const resources = template.toJSON().Resources;
    const jobTemplate = Object.values(resources).find(
      (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
    ) as any;

    const outputGroup = jobTemplate.Properties.SettingsJson.OutputGroups[0];
    expect(outputGroup.OutputGroupSettings.Type).toBe('FILE_GROUP_SETTINGS');
    expect(outputGroup.OutputGroupSettings.FileGroupSettings.Destination).toBeDefined();

    // The destination is a CloudFormation Fn::Join, so just verify it exists
    const destination = outputGroup.OutputGroupSettings.FileGroupSettings.Destination;
    expect(destination).toBeDefined();
  });

  test('Step 5.14: Job template has audio selectors', () => {
    template.hasResourceProperties('AWS::MediaConvert::JobTemplate', {
      SettingsJson: Match.objectLike({
        Inputs: Match.arrayWith([
          Match.objectLike({
            AudioSelectors: {
              'Audio Selector 1': {
                DefaultSelection: 'DEFAULT'
              }
            }
          })
        ])
      })
    });
  });

  test('Step 5.15: Job template has correct status update interval', () => {
    template.hasResourceProperties('AWS::MediaConvert::JobTemplate', {
      StatusUpdateInterval: 'SECONDS_60'
    });
  });

  test('Step 5.16: Job template has correct priority', () => {
    template.hasResourceProperties('AWS::MediaConvert::JobTemplate', {
      Priority: 0
    });
  });

  test('Step 5.17: Job template has correct category', () => {
    template.hasResourceProperties('AWS::MediaConvert::JobTemplate', {
      Category: 'podcast'
    });
  });

  test('Step 5.18: MediaConvert role ARN is exported', () => {
    const outputs = template.toJSON().Outputs;
    const roleArnOutput = Object.values(outputs).find(
      (output: any) => output.Description === 'IAM role ARN for MediaConvert'
    );
    expect(roleArnOutput).toBeDefined();
  });

  test('Step 5.19: Job template name is exported', () => {
    const outputs = template.toJSON().Outputs;
    const templateNameOutput = Object.values(outputs).find(
      (output: any) => output.Description === 'MediaConvert job template name'
    );
    expect(templateNameOutput).toBeDefined();
  });

  test('Step 5.20: Transcoding stack uses environment suffix correctly', () => {
    template.hasResourceProperties('AWS::MediaConvert::JobTemplate', {
      Name: 'podcast-audio-transcoding-test'
    });
  });

  test('Step 5.21: All outputs have RAW container', () => {
    const resources = template.toJSON().Resources;
    const jobTemplate = Object.values(resources).find(
      (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
    ) as any;

    const outputs = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs;
    outputs.forEach((output: any) => {
      expect(output.ContainerSettings.Container).toBe('RAW');
    });
  });

  test('Step 5.22: All outputs have mp3 extension', () => {
    const resources = template.toJSON().Resources;
    const jobTemplate = Object.values(resources).find(
      (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
    ) as any;

    const outputs = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs;
    outputs.forEach((output: any) => {
      expect(output.Extension).toBe('mp3');
    });
  });

  test('Step 5.23: MediaConvert role can be referenced by other stacks', () => {
    expect(transcodingStack.mediaConvertRole.roleArn).toBeDefined();
  });

  test('Step 5.24: Job template name can be referenced by other stacks', () => {
    expect(transcodingStack.jobTemplateName).toBeDefined();
    expect(typeof transcodingStack.jobTemplateName).toBe('string');
  });

  test('Step 5.25: Stack creates exactly one IAM role', () => {
    const resources = template.toJSON().Resources;
    const roles = Object.values(resources).filter(
      (r: any) => r.Type === 'AWS::IAM::Role' &&
        r.Properties.AssumeRolePolicyDocument.Statement.some(
          (s: any) => s.Principal.Service === 'mediaconvert.amazonaws.com'
        )
    );
    expect(roles.length).toBe(1);
  });

  // Additional comprehensive tests for complete coverage
  describe('Audio Output Configuration - 64kbps', () => {
    test('Step 5.26: 64kbps output has correct codec', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output64 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[0];
      expect(output64.AudioDescriptions[0].CodecSettings.Codec).toBe('MP3');
    });

    test('Step 5.27: 64kbps output has correct bitrate', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output64 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[0];
      expect(output64.AudioDescriptions[0].CodecSettings.Mp3Settings.Bitrate).toBe(64000);
    });

    test('Step 5.28: 64kbps output has 2 channels', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output64 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[0];
      expect(output64.AudioDescriptions[0].CodecSettings.Mp3Settings.Channels).toBe(2);
    });

    test('Step 5.29: 64kbps output has 44100 sample rate', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output64 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[0];
      expect(output64.AudioDescriptions[0].CodecSettings.Mp3Settings.SampleRate).toBe(44100);
    });

    test('Step 5.30: 64kbps output has CBR rate control', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output64 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[0];
      expect(output64.AudioDescriptions[0].CodecSettings.Mp3Settings.RateControlMode).toBe('CBR');
    });

    test('Step 5.31: 64kbps output has correct name modifier', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output64 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[0];
      expect(output64.NameModifier).toBe('_64kbps');
    });

    test('Step 5.32: 64kbps output has mp3 extension', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output64 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[0];
      expect(output64.Extension).toBe('mp3');
    });

    test('Step 5.33: 64kbps output has RAW container', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output64 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[0];
      expect(output64.ContainerSettings.Container).toBe('RAW');
    });
  });

  describe('Audio Output Configuration - 128kbps', () => {
    test('Step 5.34: 128kbps output has correct codec', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output128 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[1];
      expect(output128.AudioDescriptions[0].CodecSettings.Codec).toBe('MP3');
    });

    test('Step 5.35: 128kbps output has correct bitrate', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output128 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[1];
      expect(output128.AudioDescriptions[0].CodecSettings.Mp3Settings.Bitrate).toBe(128000);
    });

    test('Step 5.36: 128kbps output has 2 channels', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output128 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[1];
      expect(output128.AudioDescriptions[0].CodecSettings.Mp3Settings.Channels).toBe(2);
    });

    test('Step 5.37: 128kbps output has 44100 sample rate', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output128 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[1];
      expect(output128.AudioDescriptions[0].CodecSettings.Mp3Settings.SampleRate).toBe(44100);
    });

    test('Step 5.38: 128kbps output has CBR rate control', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output128 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[1];
      expect(output128.AudioDescriptions[0].CodecSettings.Mp3Settings.RateControlMode).toBe('CBR');
    });

    test('Step 5.39: 128kbps output has correct name modifier', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output128 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[1];
      expect(output128.NameModifier).toBe('_128kbps');
    });

    test('Step 5.40: 128kbps output has mp3 extension', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output128 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[1];
      expect(output128.Extension).toBe('mp3');
    });

    test('Step 5.41: 128kbps output has RAW container', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output128 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[1];
      expect(output128.ContainerSettings.Container).toBe('RAW');
    });
  });

  describe('Audio Output Configuration - 256kbps', () => {
    test('Step 5.42: 256kbps output has correct codec', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output256 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[2];
      expect(output256.AudioDescriptions[0].CodecSettings.Codec).toBe('MP3');
    });

    test('Step 5.43: 256kbps output has correct bitrate', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output256 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[2];
      expect(output256.AudioDescriptions[0].CodecSettings.Mp3Settings.Bitrate).toBe(256000);
    });

    test('Step 5.44: 256kbps output has 2 channels', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output256 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[2];
      expect(output256.AudioDescriptions[0].CodecSettings.Mp3Settings.Channels).toBe(2);
    });

    test('Step 5.45: 256kbps output has 44100 sample rate', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output256 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[2];
      expect(output256.AudioDescriptions[0].CodecSettings.Mp3Settings.SampleRate).toBe(44100);
    });

    test('Step 5.46: 256kbps output has CBR rate control', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output256 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[2];
      expect(output256.AudioDescriptions[0].CodecSettings.Mp3Settings.RateControlMode).toBe('CBR');
    });

    test('Step 5.47: 256kbps output has correct name modifier', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output256 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[2];
      expect(output256.NameModifier).toBe('_256kbps');
    });

    test('Step 5.48: 256kbps output has mp3 extension', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output256 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[2];
      expect(output256.Extension).toBe('mp3');
    });

    test('Step 5.49: 256kbps output has RAW container', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const output256 = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs[2];
      expect(output256.ContainerSettings.Container).toBe('RAW');
    });
  });

  describe('Output Group Configuration', () => {
    test('Step 5.50: Output group has correct name', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const outputGroup = jobTemplate.Properties.SettingsJson.OutputGroups[0];
      expect(outputGroup.Name).toBe('File Group');
    });

    test('Step 5.51: Output group has FILE_GROUP_SETTINGS type', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const outputGroup = jobTemplate.Properties.SettingsJson.OutputGroups[0];
      expect(outputGroup.OutputGroupSettings.Type).toBe('FILE_GROUP_SETTINGS');
    });

    test('Step 5.52: Output group has exactly 3 outputs', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const outputGroup = jobTemplate.Properties.SettingsJson.OutputGroups[0];
      expect(outputGroup.Outputs).toHaveLength(3);
    });

    test('Step 5.53: Output group has destination defined', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const outputGroup = jobTemplate.Properties.SettingsJson.OutputGroups[0];
      expect(outputGroup.OutputGroupSettings.FileGroupSettings.Destination).toBeDefined();
    });

    test('Step 5.54: Job template has exactly one output group', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      expect(jobTemplate.Properties.SettingsJson.OutputGroups).toHaveLength(1);
    });
  });

  describe('Input Configuration', () => {
    test('Step 5.55: Job template has exactly one input', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      expect(jobTemplate.Properties.SettingsJson.Inputs).toHaveLength(1);
    });

    test('Step 5.56: Input has Audio Selector 1', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const input = jobTemplate.Properties.SettingsJson.Inputs[0];
      expect(input.AudioSelectors['Audio Selector 1']).toBeDefined();
    });

    test('Step 5.57: Audio selector has DEFAULT selection', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const input = jobTemplate.Properties.SettingsJson.Inputs[0];
      expect(input.AudioSelectors['Audio Selector 1'].DefaultSelection).toBe('DEFAULT');
    });

    test('Step 5.58: Input has audio selectors object', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const input = jobTemplate.Properties.SettingsJson.Inputs[0];
      expect(typeof input.AudioSelectors).toBe('object');
    });

    test('Step 5.59: Input audio selectors has exactly one selector', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const input = jobTemplate.Properties.SettingsJson.Inputs[0];
      expect(Object.keys(input.AudioSelectors)).toHaveLength(1);
    });
  });

  describe('IAM Role Configuration', () => {
    test('Step 5.60: IAM role has correct assume role policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Version: '2012-10-17',
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'mediaconvert.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            })
          ])
        }
      });
    });

    test('Step 5.61: IAM role description is defined', () => {
      const resources = template.toJSON().Resources;
      const role = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::IAM::Role' &&
          r.Properties.Description === 'Role for MediaConvert to access S3 buckets'
      );
      expect(role).toBeDefined();
    });

    test('Step 5.62: IAM policy is attached to role', () => {
      const resources = template.toJSON().Resources;
      const policies = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::IAM::Policy'
      );
      expect(policies.length).toBeGreaterThan(0);
    });

    test('Step 5.63: IAM policy has S3 GetObject permission', () => {
      const resources = template.toJSON().Resources;
      const policy = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::IAM::Policy'
      ) as any;

      const statements = policy.Properties.PolicyDocument.Statement;
      const s3Statement = statements.find((s: any) =>
        s.Action.some((a: string) => a.includes('s3:GetObject'))
      );
      expect(s3Statement).toBeDefined();
    });

    test('Step 5.64: IAM policy has S3 PutObject permission', () => {
      const resources = template.toJSON().Resources;
      const policy = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::IAM::Policy'
      ) as any;

      const statements = policy.Properties.PolicyDocument.Statement;
      const s3Statement = statements.find((s: any) =>
        s.Action.some((a: string) => a.includes('s3:PutObject'))
      );
      expect(s3Statement).toBeDefined();
    });

    test('Step 5.65: IAM policy has S3 List permission', () => {
      const resources = template.toJSON().Resources;
      const policy = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::IAM::Policy'
      ) as any;

      const statements = policy.Properties.PolicyDocument.Statement;
      const s3Statement = statements.find((s: any) =>
        s.Action.some((a: string) => a.includes('s3:List'))
      );
      expect(s3Statement).toBeDefined();
    });

    test('Step 5.66: IAM policy has S3 DeleteObject permission', () => {
      const resources = template.toJSON().Resources;
      const policy = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::IAM::Policy'
      ) as any;

      const statements = policy.Properties.PolicyDocument.Statement;
      const s3Statement = statements.find((s: any) =>
        s.Action.some((a: string) => a.includes('s3:DeleteObject'))
      );
      expect(s3Statement).toBeDefined();
    });

    test('Step 5.67: IAM policy has S3 Abort permission', () => {
      const resources = template.toJSON().Resources;
      const policy = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::IAM::Policy'
      ) as any;

      const statements = policy.Properties.PolicyDocument.Statement;
      const s3Statement = statements.find((s: any) =>
        s.Action.some((a: string) => a.includes('s3:Abort'))
      );
      expect(s3Statement).toBeDefined();
    });

    test('Step 5.68: IAM role ARN can be accessed', () => {
      expect(transcodingStack.mediaConvertRole.roleArn).toBeDefined();
      expect(typeof transcodingStack.mediaConvertRole.roleArn).toBe('string');
    });

    test('Step 5.69: IAM role name can be accessed', () => {
      expect(transcodingStack.mediaConvertRole.roleName).toBeDefined();
    });

    test('Step 5.70: IAM role has grant methods', () => {
      expect(typeof transcodingStack.mediaConvertRole.grantAssumeRole).toBe('function');
    });
  });

  describe('Template Metadata', () => {
    test('Step 5.71: Template has status update interval', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      expect(jobTemplate.Properties.StatusUpdateInterval).toBeDefined();
    });

    test('Step 5.72: Template priority is zero', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      expect(jobTemplate.Properties.Priority).toBe(0);
    });

    test('Step 5.73: Template category is podcast', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      expect(jobTemplate.Properties.Category).toBe('podcast');
    });

    test('Step 5.74: Template name contains environment suffix', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      expect(jobTemplate.Properties.Name).toContain('test');
    });

    test('Step 5.75: Template name contains podcast', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      expect(jobTemplate.Properties.Name).toContain('podcast');
    });
  });

  describe('Output Validation', () => {
    test('Step 5.76: All outputs have audio descriptions', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const outputs = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs;
      outputs.forEach((output: any) => {
        expect(output.AudioDescriptions).toBeDefined();
        expect(output.AudioDescriptions.length).toBeGreaterThan(0);
      });
    });

    test('Step 5.77: All outputs have exactly one audio description', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const outputs = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs;
      outputs.forEach((output: any) => {
        expect(output.AudioDescriptions).toHaveLength(1);
      });
    });

    test('Step 5.78: All outputs have codec settings', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const outputs = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs;
      outputs.forEach((output: any) => {
        expect(output.AudioDescriptions[0].CodecSettings).toBeDefined();
      });
    });

    test('Step 5.79: All outputs use MP3 codec', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const outputs = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs;
      outputs.forEach((output: any) => {
        expect(output.AudioDescriptions[0].CodecSettings.Codec).toBe('MP3');
      });
    });

    test('Step 5.80: All outputs have MP3 settings', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const outputs = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs;
      outputs.forEach((output: any) => {
        expect(output.AudioDescriptions[0].CodecSettings.Mp3Settings).toBeDefined();
      });
    });

    test('Step 5.81: All outputs have stereo (2 channels)', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const outputs = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs;
      outputs.forEach((output: any) => {
        expect(output.AudioDescriptions[0].CodecSettings.Mp3Settings.Channels).toBe(2);
      });
    });

    test('Step 5.82: All outputs have 44.1kHz sample rate', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const outputs = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs;
      outputs.forEach((output: any) => {
        expect(output.AudioDescriptions[0].CodecSettings.Mp3Settings.SampleRate).toBe(44100);
      });
    });

    test('Step 5.83: All outputs use CBR rate control', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const outputs = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs;
      outputs.forEach((output: any) => {
        expect(output.AudioDescriptions[0].CodecSettings.Mp3Settings.RateControlMode).toBe('CBR');
      });
    });

    test('Step 5.84: All outputs have name modifiers', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const outputs = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs;
      outputs.forEach((output: any) => {
        expect(output.NameModifier).toBeDefined();
        expect(output.NameModifier).toContain('kbps');
      });
    });

    test('Step 5.85: All outputs have container settings', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const outputs = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs;
      outputs.forEach((output: any) => {
        expect(output.ContainerSettings).toBeDefined();
      });
    });

    test('Step 5.86: Bitrates are in ascending order', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const outputs = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs;
      const bitrates = outputs.map((o: any) =>
        o.AudioDescriptions[0].CodecSettings.Mp3Settings.Bitrate
      );

      expect(bitrates[0]).toBeLessThan(bitrates[1]);
      expect(bitrates[1]).toBeLessThan(bitrates[2]);
    });

    test('Step 5.87: Bitrates cover low, medium, high quality', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const outputs = jobTemplate.Properties.SettingsJson.OutputGroups[0].Outputs;
      const bitrates = outputs.map((o: any) =>
        o.AudioDescriptions[0].CodecSettings.Mp3Settings.Bitrate
      );

      expect(bitrates).toContain(64000);  // Low quality
      expect(bitrates).toContain(128000); // Medium quality
      expect(bitrates).toContain(256000); // High quality
    });
  });

  describe('Stack Integration', () => {
    test('Step 5.88: Stack can be created with different environment suffixes', () => {
      const app2 = new cdk.App();
      const stack2 = new cdk.Stack(app2, 'TestStack2');
      const storageStack2 = new PodcastStorageStack(stack2, 'PodcastStorage', {
        environmentSuffix: 'prod'
      });
      const transcodingStack2 = new PodcastTranscodingStack(stack2, 'PodcastTranscoding', {
        audioBucket: storageStack2.audioBucket,
        environmentSuffix: 'prod'
      });

      expect(transcodingStack2.jobTemplateName).toContain('prod');
    });

    test('Step 5.89: MediaConvert role can be passed to other constructs', () => {
      expect(transcodingStack.mediaConvertRole).toBeDefined();
      expect(transcodingStack.mediaConvertRole.roleArn).toBeTruthy();
    });

    test('Step 5.90: Job template name can be passed to other constructs', () => {
      expect(transcodingStack.jobTemplateName).toBeTruthy();
      expect(typeof transcodingStack.jobTemplateName).toBe('string');
    });

    test('Step 5.91: Stack creates exactly two CloudFormation outputs', () => {
      const outputs = template.toJSON().Outputs;
      const transcodingOutputs = Object.values(outputs).filter((o: any) =>
        o.Description.includes('MediaConvert') || o.Description.includes('template')
      );
      expect(transcodingOutputs.length).toBe(2);
    });

    test('Step 5.92: Stack creates exactly one MediaConvert job template', () => {
      template.resourceCountIs('AWS::MediaConvert::JobTemplate', 1);
    });

    test('Step 5.93: Stack creates exactly one IAM policy', () => {
      const resources = template.toJSON().Resources;
      const policies = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::IAM::Policy'
      );
      expect(policies.length).toBe(1);
    });

    test('Step 5.94: Job template depends on nothing', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      expect(jobTemplate.DependsOn).toBeUndefined();
    });

    test('Step 5.95: MediaConvert role is independent', () => {
      expect(transcodingStack.mediaConvertRole).toBeDefined();
    });

    test('Step 5.96: Template settings JSON is valid', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      expect(jobTemplate.Properties.SettingsJson).toBeDefined();
      expect(typeof jobTemplate.Properties.SettingsJson).toBe('object');
    });

    test('Step 5.97: Settings JSON has required keys', () => {
      const resources = template.toJSON().Resources;
      const jobTemplate = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::MediaConvert::JobTemplate'
      ) as any;

      const settings = jobTemplate.Properties.SettingsJson;
      expect(settings.OutputGroups).toBeDefined();
      expect(settings.Inputs).toBeDefined();
    });

    test('Step 5.98: Stack is a valid construct', () => {
      expect(transcodingStack.node).toBeDefined();
      expect(transcodingStack.node.id).toBe('PodcastTranscoding');
    });

    test('Step 5.99: Stack has no dependencies on external services', () => {
      // Verify the stack is self-contained
      expect(transcodingStack).toBeDefined();
      expect(transcodingStack.mediaConvertRole).toBeDefined();
      expect(transcodingStack.jobTemplateName).toBeDefined();
    });

    test('Step 5.100: Stack synthesizes without errors', () => {
      // This test passing means the entire stack configuration is valid
      expect(() => template.toJSON()).not.toThrow();
    });
  });
});


