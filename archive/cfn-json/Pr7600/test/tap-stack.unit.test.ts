import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Media Processing Pipeline', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Scalable Media Processing Pipeline for Live Video Streaming'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });
  });

  describe('S3 Resources', () => {
    test('should have MediaBucket resource', () => {
      expect(template.Resources.MediaBucket).toBeDefined();
      expect(template.Resources.MediaBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('MediaBucket should have Delete policy', () => {
      expect(template.Resources.MediaBucket.DeletionPolicy).toBe('Delete');
    });

    test('MediaBucket should have correct naming', () => {
      const bucket = template.Resources.MediaBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'media-bucket-${EnvironmentSuffix}',
      });
    });

    test('MediaBucket should have encryption', () => {
      const bucket = template.Resources.MediaBucket;
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration
      ).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault
          .SSEAlgorithm
      ).toBe('AES256');
    });

    test('MediaBucket should block public access', () => {
      const bucket = template.Resources.MediaBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have ArtifactsBucket resource', () => {
      expect(template.Resources.ArtifactsBucket).toBeDefined();
      expect(template.Resources.ArtifactsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('ArtifactsBucket should have correct naming', () => {
      const bucket = template.Resources.ArtifactsBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'pipeline-artifacts-${EnvironmentSuffix}',
      });
    });
  });

  describe('MediaLive Resources', () => {
    test('should have MediaLiveInputSecurityGroup resource', () => {
      expect(template.Resources.MediaLiveInputSecurityGroup).toBeDefined();
      expect(template.Resources.MediaLiveInputSecurityGroup.Type).toBe(
        'AWS::MediaLive::InputSecurityGroup'
      );
    });

    test('MediaLiveInputSecurityGroup should have whitelist rules', () => {
      const secGroup = template.Resources.MediaLiveInputSecurityGroup;
      expect(secGroup.Properties.WhitelistRules).toBeDefined();
      expect(secGroup.Properties.WhitelistRules).toHaveLength(1);
      expect(secGroup.Properties.WhitelistRules[0].Cidr).toBe('0.0.0.0/0');
    });

    test('should have MediaLiveInput resource', () => {
      expect(template.Resources.MediaLiveInput).toBeDefined();
      expect(template.Resources.MediaLiveInput.Type).toBe(
        'AWS::MediaLive::Input'
      );
    });

    test('MediaLiveInput should have correct type', () => {
      const input = template.Resources.MediaLiveInput;
      expect(input.Properties.Type).toBe('RTMP_PUSH');
    });

    test('MediaLiveInput should reference security group', () => {
      const input = template.Resources.MediaLiveInput;
      expect(input.Properties.InputSecurityGroups).toBeDefined();
      expect(input.Properties.InputSecurityGroups).toHaveLength(1);
      expect(input.Properties.InputSecurityGroups[0]).toEqual({
        'Fn::GetAtt': ['MediaLiveInputSecurityGroup', 'Id'],
      });
    });

    test('MediaLiveInput should have destinations', () => {
      const input = template.Resources.MediaLiveInput;
      expect(input.Properties.Destinations).toHaveLength(2);
      expect(input.Properties.Destinations[0].StreamName).toBe('live/stream1');
      expect(input.Properties.Destinations[1].StreamName).toBe('live/stream2');
    });

    test('should have MediaLiveChannel resource', () => {
      expect(template.Resources.MediaLiveChannel).toBeDefined();
      expect(template.Resources.MediaLiveChannel.Type).toBe(
        'AWS::MediaLive::Channel'
      );
    });

    test('MediaLiveChannel should have correct class', () => {
      const channel = template.Resources.MediaLiveChannel;
      expect(channel.Properties.ChannelClass).toBe('SINGLE_PIPELINE');
    });

    test('MediaLiveChannel should have encoder settings', () => {
      const channel = template.Resources.MediaLiveChannel;
      expect(channel.Properties.EncoderSettings).toBeDefined();
      expect(channel.Properties.EncoderSettings.VideoDescriptions).toHaveLength(
        3
      );
      expect(channel.Properties.EncoderSettings.AudioDescriptions).toHaveLength(
        1
      );
    });
  });

  describe('MediaPackage Resources', () => {
    test('should have MediaPackageChannel resource', () => {
      expect(template.Resources.MediaPackageChannel).toBeDefined();
      expect(template.Resources.MediaPackageChannel.Type).toBe(
        'AWS::MediaPackage::Channel'
      );
    });

    test('MediaPackageChannel should have correct ID format', () => {
      const channel = template.Resources.MediaPackageChannel;
      expect(channel.Properties.Id).toEqual({
        'Fn::Sub': 'media-channel-${EnvironmentSuffix}',
      });
    });

    test('should have MediaPackageHlsEndpoint resource', () => {
      expect(template.Resources.MediaPackageHlsEndpoint).toBeDefined();
      expect(template.Resources.MediaPackageHlsEndpoint.Type).toBe(
        'AWS::MediaPackage::OriginEndpoint'
      );
    });

    test('MediaPackageHlsEndpoint should have HLS package', () => {
      const endpoint = template.Resources.MediaPackageHlsEndpoint;
      expect(endpoint.Properties.HlsPackage).toBeDefined();
      expect(endpoint.Properties.HlsPackage.SegmentDurationSeconds).toBe(6);
      expect(endpoint.Properties.HlsPackage.PlaylistWindowSeconds).toBe(60);
    });

    test('should have MediaPackageDashEndpoint resource', () => {
      expect(template.Resources.MediaPackageDashEndpoint).toBeDefined();
      expect(template.Resources.MediaPackageDashEndpoint.Type).toBe(
        'AWS::MediaPackage::OriginEndpoint'
      );
    });

    test('MediaPackageDashEndpoint should have DASH package', () => {
      const endpoint = template.Resources.MediaPackageDashEndpoint;
      expect(endpoint.Properties.DashPackage).toBeDefined();
      expect(endpoint.Properties.DashPackage.SegmentDurationSeconds).toBe(6);
    });
  });

  describe('CloudFront Resources', () => {
    test('should have CloudFrontDistribution resource', () => {
      expect(template.Resources.CloudFrontDistribution).toBeDefined();
      expect(template.Resources.CloudFrontDistribution.Type).toBe(
        'AWS::CloudFront::Distribution'
      );
    });

    test('CloudFrontDistribution should have implicit dependency via GetAtt', () => {
      const dist = template.Resources.CloudFrontDistribution;
      // DependsOn removed because GetAtt already enforces dependency
      expect(dist.DependsOn).toBeUndefined();
      // Verify GetAtt creates implicit dependency
      const originDomain = dist.Properties.DistributionConfig.Origins[0].DomainName;
      expect(JSON.stringify(originDomain)).toContain('MediaPackageHlsEndpoint');
    });

    test('CloudFrontDistribution should have correct origin configuration', () => {
      const dist = template.Resources.CloudFrontDistribution;
      expect(dist.Properties.DistributionConfig.Origins).toHaveLength(1);
      expect(
        dist.Properties.DistributionConfig.Origins[0].CustomOriginConfig
          .OriginProtocolPolicy
      ).toBe('https-only');
    });

    test('CloudFrontDistribution should have cache behavior', () => {
      const dist = template.Resources.CloudFrontDistribution;
      expect(
        dist.Properties.DistributionConfig.DefaultCacheBehavior
      ).toBeDefined();
      expect(
        dist.Properties.DistributionConfig.DefaultCacheBehavior
          .ViewerProtocolPolicy
      ).toBe('redirect-to-https');
    });
  });

  describe('IAM Roles', () => {
    test('should have MediaLiveRole resource', () => {
      expect(template.Resources.MediaLiveRole).toBeDefined();
      expect(template.Resources.MediaLiveRole.Type).toBe('AWS::IAM::Role');
    });

    test('MediaLiveRole should have correct naming', () => {
      const role = template.Resources.MediaLiveRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'medialive-role-${EnvironmentSuffix}',
      });
    });

    test('MediaLiveRole should allow MediaLive service', () => {
      const role = template.Resources.MediaLiveRole;
      const statement =
        role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('medialive.amazonaws.com');
    });

    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe(
        'AWS::IAM::Role'
      );
    });

    test('LambdaExecutionRole should have correct naming', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'lambda-execution-role-${EnvironmentSuffix}',
      });
    });

    test('should have StepFunctionsRole resource', () => {
      expect(template.Resources.StepFunctionsRole).toBeDefined();
      expect(template.Resources.StepFunctionsRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have CodeBuildRole resource', () => {
      expect(template.Resources.CodeBuildRole).toBeDefined();
      expect(template.Resources.CodeBuildRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have CodePipelineRole resource', () => {
      expect(template.Resources.CodePipelineRole).toBeDefined();
      expect(template.Resources.CodePipelineRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('Lambda Functions', () => {
    test('should have ChannelMonitorFunction resource', () => {
      expect(template.Resources.ChannelMonitorFunction).toBeDefined();
      expect(template.Resources.ChannelMonitorFunction.Type).toBe(
        'AWS::Lambda::Function'
      );
    });

    test('ChannelMonitorFunction should use nodejs22.x runtime', () => {
      const func = template.Resources.ChannelMonitorFunction;
      expect(func.Properties.Runtime).toBe('nodejs22.x');
    });

    test('ChannelMonitorFunction should have correct naming', () => {
      const func = template.Resources.ChannelMonitorFunction;
      expect(func.Properties.FunctionName).toEqual({
        'Fn::Sub': 'channel-monitor-${EnvironmentSuffix}',
      });
    });

    test('should have StreamProcessorFunction resource', () => {
      expect(template.Resources.StreamProcessorFunction).toBeDefined();
      expect(template.Resources.StreamProcessorFunction.Type).toBe(
        'AWS::Lambda::Function'
      );
    });

    test('StreamProcessorFunction should use nodejs22.x runtime', () => {
      const func = template.Resources.StreamProcessorFunction;
      expect(func.Properties.Runtime).toBe('nodejs22.x');
    });
  });

  describe('Step Functions', () => {
    test('should have MediaWorkflowStateMachine resource', () => {
      expect(template.Resources.MediaWorkflowStateMachine).toBeDefined();
      expect(template.Resources.MediaWorkflowStateMachine.Type).toBe(
        'AWS::StepFunctions::StateMachine'
      );
    });

    test('MediaWorkflowStateMachine should have correct naming', () => {
      const sm = template.Resources.MediaWorkflowStateMachine;
      expect(sm.Properties.StateMachineName).toEqual({
        'Fn::Sub': 'media-workflow-${EnvironmentSuffix}',
      });
    });

    test('MediaWorkflowStateMachine should have definition', () => {
      const sm = template.Resources.MediaWorkflowStateMachine;
      expect(sm.Properties.DefinitionString).toBeDefined();
    });
  });

  describe('CI/CD Pipeline Resources', () => {
    test('should have CodeBuildProject resource', () => {
      expect(template.Resources.CodeBuildProject).toBeDefined();
      expect(template.Resources.CodeBuildProject.Type).toBe(
        'AWS::CodeBuild::Project'
      );
    });

    test('CodeBuildProject should have correct naming', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Properties.Name).toEqual({
        'Fn::Sub': 'media-pipeline-build-${EnvironmentSuffix}',
      });
    });

    test('should have MediaPipeline resource', () => {
      expect(template.Resources.MediaPipeline).toBeDefined();
      expect(template.Resources.MediaPipeline.Type).toBe(
        'AWS::CodePipeline::Pipeline'
      );
    });

    test('MediaPipeline should have correct naming', () => {
      const pipeline = template.Resources.MediaPipeline;
      expect(pipeline.Properties.Name).toEqual({
        'Fn::Sub': 'media-pipeline-${EnvironmentSuffix}',
      });
    });

    test('MediaPipeline should have Source and Build stages', () => {
      const pipeline = template.Resources.MediaPipeline;
      expect(pipeline.Properties.Stages).toHaveLength(2);
      expect(pipeline.Properties.Stages[0].Name).toBe('Source');
      expect(pipeline.Properties.Stages[1].Name).toBe('Build');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have ChannelStateAlarm resource', () => {
      expect(template.Resources.ChannelStateAlarm).toBeDefined();
      expect(template.Resources.ChannelStateAlarm.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
    });

    test('ChannelStateAlarm should have correct naming', () => {
      const alarm = template.Resources.ChannelStateAlarm;
      expect(alarm.Properties.AlarmName).toEqual({
        'Fn::Sub': 'channel-state-alarm-${EnvironmentSuffix}',
      });
    });

    test('should have ErrorRateAlarm resource', () => {
      expect(template.Resources.ErrorRateAlarm).toBeDefined();
      expect(template.Resources.ErrorRateAlarm.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
    });

    test('should have LogGroup resource', () => {
      expect(template.Resources.LogGroup).toBeDefined();
      expect(template.Resources.LogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('LogGroup should have Delete policy', () => {
      expect(template.Resources.LogGroup.DeletionPolicy).toBe('Delete');
    });

    test('LogGroup should have 7-day retention', () => {
      const logGroup = template.Resources.LogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'MediaBucketName',
        'MediaLiveChannelId',
        'MediaPackageChannelId',
        'HlsEndpointUrl',
        'DashEndpointUrl',
        'CloudFrontDomain',
        'PipelineName',
        'StateMachineArn',
        'EnvironmentSuffix',
        'MediaLiveInputSecurityGroupId',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('MediaBucketName output should be correct', () => {
      const output = template.Outputs.MediaBucketName;
      expect(output.Description).toBe('Media storage bucket name');
      expect(output.Value).toEqual({ Ref: 'MediaBucket' });
    });

    test('MediaLiveChannelId output should be correct', () => {
      const output = template.Outputs.MediaLiveChannelId;
      expect(output.Description).toBe('MediaLive channel ID');
      expect(output.Value).toEqual({ Ref: 'MediaLiveChannel' });
    });

    test('HlsEndpointUrl output should be correct', () => {
      const output = template.Outputs.HlsEndpointUrl;
      expect(output.Description).toBe('HLS endpoint URL');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['MediaPackageHlsEndpoint', 'Url'],
      });
    });

    test('CloudFrontDomain output should be correct', () => {
      const output = template.Outputs.CloudFrontDomain;
      expect(output.Description).toBe('CloudFront distribution domain');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['CloudFrontDistribution', 'DomainName'],
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have 22 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(22);
    });

    test('should have 1 parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have 10 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all named resources should use environment suffix', () => {
      const namedResources = [
        'MediaBucket',
        'ArtifactsBucket',
        'MediaLiveRole',
        'MediaPackageChannel',
        'MediaPackageHlsEndpoint',
        'MediaPackageDashEndpoint',
        'MediaLiveInput',
        'MediaLiveChannel',
        'LambdaExecutionRole',
        'ChannelMonitorFunction',
        'StreamProcessorFunction',
        'StepFunctionsRole',
        'MediaWorkflowStateMachine',
        'CodeBuildRole',
        'CodeBuildProject',
        'CodePipelineRole',
        'MediaPipeline',
        'ChannelStateAlarm',
        'ErrorRateAlarm',
        'LogGroup',
      ];

      namedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties) {
          const hasEnvSuffix =
            JSON.stringify(resource.Properties).includes(
              '${EnvironmentSuffix}'
            ) || JSON.stringify(resource.Properties).includes('EnvironmentSuffix');
          expect(hasEnvSuffix).toBe(true);
        }
      });
    });
  });

  describe('Security and Compliance', () => {
    test('no resources should have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('S3 buckets should have encryption enabled', () => {
      ['MediaBucket', 'ArtifactsBucket'].forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });
    });

    test('S3 buckets should block public access', () => {
      ['MediaBucket', 'ArtifactsBucket'].forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(
          bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
        ).toBe(true);
      });
    });

    test('Lambda functions should have timeout set', () => {
      ['ChannelMonitorFunction', 'StreamProcessorFunction'].forEach(
        funcName => {
          const func = template.Resources[funcName];
          expect(func.Properties.Timeout).toBeDefined();
          expect(func.Properties.Timeout).toBeGreaterThan(0);
        }
      );
    });

    test('IAM roles should have assume role policy', () => {
      [
        'MediaLiveRole',
        'LambdaExecutionRole',
        'StepFunctionsRole',
        'CodeBuildRole',
        'CodePipelineRole',
      ].forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      });
    });
  });
});
