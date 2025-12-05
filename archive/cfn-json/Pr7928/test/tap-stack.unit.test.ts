import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - CI/CD Pipeline', () => {
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

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Description).toBeDefined();
      expect(envSuffixParam.AllowedPattern).toBeDefined();
      expect(envSuffixParam.ConstraintDescription).toBeDefined();
    });
  });

  describe('S3 Artifact Bucket', () => {
    test('should have ArtifactBucket resource', () => {
      expect(template.Resources.ArtifactBucket).toBeDefined();
      expect(template.Resources.ArtifactBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have encryption enabled', () => {
      const bucket = template.Resources.ArtifactBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should have versioning enabled', () => {
      const bucket = template.Resources.ArtifactBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have lifecycle configuration', () => {
      const bucket = template.Resources.ArtifactBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      expect(Array.isArray(bucket.Properties.LifecycleConfiguration.Rules)).toBe(true);
      expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
    });

    test('should have public access blocked', () => {
      const bucket = template.Resources.ArtifactBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('should have bucket name with environmentSuffix', () => {
      const bucket = template.Resources.ArtifactBucket;
      expect(bucket.Properties.BucketName).toBeDefined();
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('CodeCommit Repository', () => {
    test('should have MediaRepository resource', () => {
      expect(template.Resources.MediaRepository).toBeDefined();
      expect(template.Resources.MediaRepository.Type).toBe('AWS::CodeCommit::Repository');
    });

    test('should have repository name with environmentSuffix', () => {
      const repo = template.Resources.MediaRepository;
      expect(repo.Properties.RepositoryName).toBeDefined();
      expect(repo.Properties.RepositoryName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have repository description', () => {
      const repo = template.Resources.MediaRepository;
      expect(repo.Properties.RepositoryDescription).toBeDefined();
      expect(typeof repo.Properties.RepositoryDescription).toBe('string');
    });

    test('should not have DependsOn property', () => {
      const repo = template.Resources.MediaRepository;
      expect(repo.DependsOn).toBeUndefined();
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have BuildLogGroup resource', () => {
      expect(template.Resources.BuildLogGroup).toBeDefined();
      expect(template.Resources.BuildLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have log group name with environmentSuffix', () => {
      const logGroup = template.Resources.BuildLogGroup;
      expect(logGroup.Properties.LogGroupName).toBeDefined();
      expect(logGroup.Properties.LogGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have retention period configured', () => {
      const logGroup = template.Resources.BuildLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
      expect(typeof logGroup.Properties.RetentionInDays).toBe('number');
      expect(logGroup.Properties.RetentionInDays).toBeGreaterThan(0);
    });
  });

  describe('CodeBuild IAM Role', () => {
    test('should have CodeBuildServiceRole resource', () => {
      expect(template.Resources.CodeBuildServiceRole).toBeDefined();
      expect(template.Resources.CodeBuildServiceRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have role name with environmentSuffix', () => {
      const role = template.Resources.CodeBuildServiceRole;
      expect(role.Properties.RoleName).toBeDefined();
      expect(role.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have correct trust policy for CodeBuild', () => {
      const role = template.Resources.CodeBuildServiceRole;
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('codebuild.amazonaws.com');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should have policies defined', () => {
      const role = template.Resources.CodeBuildServiceRole;
      expect(role.Properties.Policies).toBeDefined();
      expect(Array.isArray(role.Properties.Policies)).toBe(true);
      expect(role.Properties.Policies.length).toBeGreaterThan(0);
    });

    test('should have CloudWatch Logs permissions', () => {
      const role = template.Resources.CodeBuildServiceRole;
      const policy = role.Properties.Policies[0];
      const logsStatement = policy.PolicyDocument.Statement.find((s: any) =>
        s.Action.includes('logs:CreateLogGroup')
      );
      expect(logsStatement).toBeDefined();
      expect(logsStatement.Action).toContain('logs:CreateLogStream');
      expect(logsStatement.Action).toContain('logs:PutLogEvents');
    });

    test('should have S3 permissions', () => {
      const role = template.Resources.CodeBuildServiceRole;
      const policy = role.Properties.Policies[0];
      const s3Statement = policy.PolicyDocument.Statement.find((s: any) =>
        s.Action.includes('s3:GetObject')
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Action).toContain('s3:PutObject');
    });
  });

  describe('CodeBuild Project', () => {
    test('should have MediaBuildProject resource', () => {
      expect(template.Resources.MediaBuildProject).toBeDefined();
      expect(template.Resources.MediaBuildProject.Type).toBe('AWS::CodeBuild::Project');
    });

    test('should have project name with environmentSuffix', () => {
      const project = template.Resources.MediaBuildProject;
      expect(project.Properties.Name).toBeDefined();
      expect(project.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should reference CodeBuildServiceRole', () => {
      const project = template.Resources.MediaBuildProject;
      expect(project.Properties.ServiceRole).toBeDefined();
      expect(project.Properties.ServiceRole['Fn::GetAtt']).toEqual(['CodeBuildServiceRole', 'Arn']);
    });

    test('should have CODEPIPELINE artifacts', () => {
      const project = template.Resources.MediaBuildProject;
      expect(project.Properties.Artifacts).toBeDefined();
      expect(project.Properties.Artifacts.Type).toBe('CODEPIPELINE');
    });

    test('should have environment configuration', () => {
      const project = template.Resources.MediaBuildProject;
      expect(project.Properties.Environment).toBeDefined();
      expect(project.Properties.Environment.Type).toBe('LINUX_CONTAINER');
      expect(project.Properties.Environment.ComputeType).toBeDefined();
      expect(project.Properties.Environment.Image).toBeDefined();
    });

    test('should have environment variables', () => {
      const project = template.Resources.MediaBuildProject;
      expect(project.Properties.Environment.EnvironmentVariables).toBeDefined();
      expect(Array.isArray(project.Properties.Environment.EnvironmentVariables)).toBe(true);
      expect(project.Properties.Environment.EnvironmentVariables.length).toBeGreaterThan(0);
    });

    test('should have buildspec', () => {
      const project = template.Resources.MediaBuildProject;
      expect(project.Properties.Source).toBeDefined();
      expect(project.Properties.Source.Type).toBe('CODEPIPELINE');
      expect(project.Properties.Source.BuildSpec).toBeDefined();
      expect(typeof project.Properties.Source.BuildSpec).toBe('string');
    });

    test('should have CloudWatch Logs configured', () => {
      const project = template.Resources.MediaBuildProject;
      expect(project.Properties.LogsConfig).toBeDefined();
      expect(project.Properties.LogsConfig.CloudWatchLogs).toBeDefined();
      expect(project.Properties.LogsConfig.CloudWatchLogs.Status).toBe('ENABLED');
    });

    test('should have timeout configured', () => {
      const project = template.Resources.MediaBuildProject;
      expect(project.Properties.TimeoutInMinutes).toBeDefined();
      expect(typeof project.Properties.TimeoutInMinutes).toBe('number');
      expect(project.Properties.TimeoutInMinutes).toBeGreaterThan(0);
    });
  });

  describe('SNS Topic', () => {
    test('should have PipelineNotificationTopic resource', () => {
      expect(template.Resources.PipelineNotificationTopic).toBeDefined();
      expect(template.Resources.PipelineNotificationTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have topic name with environmentSuffix', () => {
      const topic = template.Resources.PipelineNotificationTopic;
      expect(topic.Properties.TopicName).toBeDefined();
      expect(topic.Properties.TopicName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have display name', () => {
      const topic = template.Resources.PipelineNotificationTopic;
      expect(topic.Properties.DisplayName).toBeDefined();
      expect(typeof topic.Properties.DisplayName).toBe('string');
    });
  });

  describe('CodePipeline IAM Role', () => {
    test('should have CodePipelineServiceRole resource', () => {
      expect(template.Resources.CodePipelineServiceRole).toBeDefined();
      expect(template.Resources.CodePipelineServiceRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have role name with environmentSuffix', () => {
      const role = template.Resources.CodePipelineServiceRole;
      expect(role.Properties.RoleName).toBeDefined();
      expect(role.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have correct trust policy for CodePipeline', () => {
      const role = template.Resources.CodePipelineServiceRole;
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('codepipeline.amazonaws.com');
    });

    test('should have S3 permissions', () => {
      const role = template.Resources.CodePipelineServiceRole;
      const policy = role.Properties.Policies[0];
      const s3Statement = policy.PolicyDocument.Statement.find((s: any) =>
        s.Action.includes('s3:GetObject')
      );
      expect(s3Statement).toBeDefined();
    });

    test('should have CodeCommit permissions', () => {
      const role = template.Resources.CodePipelineServiceRole;
      const policy = role.Properties.Policies[0];
      const ccStatement = policy.PolicyDocument.Statement.find((s: any) =>
        s.Action.includes('codecommit:GetBranch')
      );
      expect(ccStatement).toBeDefined();
    });

    test('should have CodeBuild permissions', () => {
      const role = template.Resources.CodePipelineServiceRole;
      const policy = role.Properties.Policies[0];
      const cbStatement = policy.PolicyDocument.Statement.find((s: any) =>
        s.Action.includes('codebuild:BatchGetBuilds')
      );
      expect(cbStatement).toBeDefined();
    });

    test('should have SNS permissions', () => {
      const role = template.Resources.CodePipelineServiceRole;
      const policy = role.Properties.Policies[0];
      const snsStatement = policy.PolicyDocument.Statement.find((s: any) =>
        s.Action.includes('sns:Publish')
      );
      expect(snsStatement).toBeDefined();
    });
  });

  describe('CodePipeline', () => {
    test('should have MediaPipeline resource', () => {
      expect(template.Resources.MediaPipeline).toBeDefined();
      expect(template.Resources.MediaPipeline.Type).toBe('AWS::CodePipeline::Pipeline');
    });

    test('should have pipeline name with environmentSuffix', () => {
      const pipeline = template.Resources.MediaPipeline;
      expect(pipeline.Properties.Name).toBeDefined();
      expect(pipeline.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should reference CodePipelineServiceRole', () => {
      const pipeline = template.Resources.MediaPipeline;
      expect(pipeline.Properties.RoleArn).toBeDefined();
      expect(pipeline.Properties.RoleArn['Fn::GetAtt']).toEqual(['CodePipelineServiceRole', 'Arn']);
    });

    test('should have S3 artifact store', () => {
      const pipeline = template.Resources.MediaPipeline;
      expect(pipeline.Properties.ArtifactStore).toBeDefined();
      expect(pipeline.Properties.ArtifactStore.Type).toBe('S3');
      expect(pipeline.Properties.ArtifactStore.Location).toBeDefined();
    });

    test('should have three stages', () => {
      const pipeline = template.Resources.MediaPipeline;
      expect(pipeline.Properties.Stages).toBeDefined();
      expect(Array.isArray(pipeline.Properties.Stages)).toBe(true);
      expect(pipeline.Properties.Stages.length).toBe(3);
    });

    test('should have Source stage with CodeCommit action', () => {
      const pipeline = template.Resources.MediaPipeline;
      const sourceStage = pipeline.Properties.Stages[0];
      expect(sourceStage.Name).toBe('Source');
      expect(sourceStage.Actions).toBeDefined();
      expect(sourceStage.Actions[0].ActionTypeId.Provider).toBe('CodeCommit');
      expect(sourceStage.Actions[0].Configuration.BranchName).toBe('main');
    });

    test('should have Build stage with CodeBuild action', () => {
      const pipeline = template.Resources.MediaPipeline;
      const buildStage = pipeline.Properties.Stages[1];
      expect(buildStage.Name).toBe('Build');
      expect(buildStage.Actions).toBeDefined();
      expect(buildStage.Actions[0].ActionTypeId.Provider).toBe('CodeBuild');
    });

    test('should have Deploy stage with S3 action', () => {
      const pipeline = template.Resources.MediaPipeline;
      const deployStage = pipeline.Properties.Stages[2];
      expect(deployStage.Name).toBe('Deploy');
      expect(deployStage.Actions).toBeDefined();
      expect(deployStage.Actions[0].ActionTypeId.Provider).toBe('S3');
    });
  });

  describe('EventBridge Rules', () => {
    test('should have PipelineEventRole for EventBridge', () => {
      expect(template.Resources.PipelineEventRole).toBeDefined();
      expect(template.Resources.PipelineEventRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have CodeCommitEventRule', () => {
      expect(template.Resources.CodeCommitEventRule).toBeDefined();
      expect(template.Resources.CodeCommitEventRule.Type).toBe('AWS::Events::Rule');
    });

    test('should have CodeCommitEventRule with correct event pattern', () => {
      const rule = template.Resources.CodeCommitEventRule;
      expect(rule.Properties.EventPattern).toBeDefined();
      expect(rule.Properties.EventPattern.source).toContain('aws.codecommit');
      expect(rule.Properties.EventPattern['detail-type']).toContain('CodeCommit Repository State Change');
    });

    test('should have PipelineStateChangeEventRule', () => {
      expect(template.Resources.PipelineStateChangeEventRule).toBeDefined();
      expect(template.Resources.PipelineStateChangeEventRule.Type).toBe('AWS::Events::Rule');
    });

    test('should have PipelineStateChangeEventRule with FAILED and SUCCEEDED states', () => {
      const rule = template.Resources.PipelineStateChangeEventRule;
      expect(rule.Properties.EventPattern).toBeDefined();
      expect(rule.Properties.EventPattern.detail.state).toContain('FAILED');
      expect(rule.Properties.EventPattern.detail.state).toContain('SUCCEEDED');
    });

    test('should have EventRuleTopicPolicy', () => {
      expect(template.Resources.EventRuleTopicPolicy).toBeDefined();
      expect(template.Resources.EventRuleTopicPolicy.Type).toBe('AWS::SNS::TopicPolicy');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'RepositoryCloneUrlHttp',
        'RepositoryCloneUrlSsh',
        'RepositoryArn',
        'BuildProjectName',
        'BuildProjectArn',
        'PipelineName',
        'PipelineVersion',
        'ArtifactBucketName',
        'ArtifactBucketArn',
        'BuildLogGroupName',
        'BuildLogGroupArn',
        'NotificationTopicArn',
        'NotificationTopicName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(typeof output.Description).toBe('string');
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('all outputs should have values', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Value).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources with names should include environmentSuffix', () => {
      const resourcesWithNames = [
        'ArtifactBucket',
        'MediaRepository',
        'BuildLogGroup',
        'CodeBuildServiceRole',
        'MediaBuildProject',
        'PipelineNotificationTopic',
        'CodePipelineServiceRole',
        'MediaPipeline',
        'CodeCommitEventRule',
        'PipelineStateChangeEventRule'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty = resource.Properties.Name ||
                           resource.Properties.BucketName ||
                           resource.Properties.RepositoryName ||
                           resource.Properties.LogGroupName ||
                           resource.Properties.RoleName ||
                           resource.Properties.TopicName;

        if (nameProperty && nameProperty['Fn::Sub']) {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should not have any hardcoded credentials', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key pattern
      expect(templateStr).not.toMatch(/aws_secret_access_key/i);
    });

    test('IAM roles should use specific resource ARNs where possible', () => {
      const codeBuildRole = template.Resources.CodeBuildServiceRole;
      const policy = codeBuildRole.Properties.Policies[0];

      // Check that S3 permissions use specific bucket ARN
      const s3Statement = policy.PolicyDocument.Statement.find((s: any) =>
        s.Action.includes('s3:GetObject')
      );
      expect(s3Statement.Resource[0]).toHaveProperty('Fn::Sub');
    });

    test('should have no DeletionPolicy Retain', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(12);
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(13);
    });
  });
});
