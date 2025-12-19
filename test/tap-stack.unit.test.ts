import fs from 'fs';
import path from 'path';

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

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

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
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.Environment;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Description).toBeDefined();
      expect(typeof envSuffixParam.Description).toBe('string');
    });

    test('Environment parameter should have validation constraints', () => {
      const envSuffixParam = template.Parameters.Environment;
      expect(envSuffixParam.AllowedPattern).toBeDefined();
      expect(envSuffixParam.ConstraintDescription).toBeDefined();
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });
  });

  describe('S3 Resources', () => {
    test('should have ArtifactBucket resource', () => {
      expect(template.Resources.ArtifactBucket).toBeDefined();
    });

    test('ArtifactBucket should be an S3 bucket', () => {
      const bucket = template.Resources.ArtifactBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('ArtifactBucket should have encryption enabled', () => {
      const bucket = template.Resources.ArtifactBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration
      ).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration
      ).toHaveLength(1);
    });

    test('ArtifactBucket should have SSE-S3 encryption', () => {
      const bucket = template.Resources.ArtifactBucket;
      const encryptionConfig =
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(
        encryptionConfig.ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('ArtifactBucket should block all public access', () => {
      const bucket = template.Resources.ArtifactBucket;
      const publicAccessConfig =
        bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessConfig).toBeDefined();
      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('ArtifactBucket name should include environment suffix', () => {
      const bucket = template.Resources.ArtifactBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'cicd-artifacts-${Environment}',
      });
    });
  });

  describe('CodeCommit Resources', () => {
    test('should have SourceRepository resource', () => {
      expect(template.Resources.SourceRepository).toBeDefined();
    });

    test('SourceRepository should be a CodeCommit repository', () => {
      const repo = template.Resources.SourceRepository;
      expect(repo.Type).toBe('AWS::CodeCommit::Repository');
    });

    test('SourceRepository should have a name with environment suffix', () => {
      const repo = template.Resources.SourceRepository;
      expect(repo.Properties.RepositoryName).toEqual({
        'Fn::Sub': 'education-platform-${Environment}',
      });
    });

    test('SourceRepository should have a description', () => {
      const repo = template.Resources.SourceRepository;
      expect(repo.Properties.RepositoryDescription).toBeDefined();
      expect(typeof repo.Properties.RepositoryDescription).toBe('string');
    });
  });

  describe('CloudWatch Logs Resources', () => {
    test('should have BuildLogGroup resource', () => {
      expect(template.Resources.BuildLogGroup).toBeDefined();
    });

    test('BuildLogGroup should be a CloudWatch log group', () => {
      const logGroup = template.Resources.BuildLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('BuildLogGroup should have retention policy set', () => {
      const logGroup = template.Resources.BuildLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
      expect(typeof logGroup.Properties.RetentionInDays).toBe('number');
      expect(logGroup.Properties.RetentionInDays).toBeGreaterThan(0);
    });

    test('BuildLogGroup name should include environment suffix', () => {
      const logGroup = template.Resources.BuildLogGroup;
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/codebuild/education-build-${Environment}',
      });
    });
  });

  describe('IAM Roles - CodeBuild', () => {
    test('should have CodeBuildServiceRole resource', () => {
      expect(template.Resources.CodeBuildServiceRole).toBeDefined();
    });

    test('CodeBuildServiceRole should be an IAM role', () => {
      const role = template.Resources.CodeBuildServiceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('CodeBuildServiceRole should have correct assume role policy', () => {
      const role = template.Resources.CodeBuildServiceRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement).toHaveLength(1);
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe(
        'codebuild.amazonaws.com'
      );
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('CodeBuildServiceRole should have managed policies attached', () => {
      const role = template.Resources.CodeBuildServiceRole;
      expect(role.Properties.ManagedPolicyArns).toBeDefined();
      expect(Array.isArray(role.Properties.ManagedPolicyArns)).toBe(true);
      expect(role.Properties.ManagedPolicyArns.length).toBeGreaterThan(0);
    });

    test('CodeBuildServiceRole should have inline policies', () => {
      const role = template.Resources.CodeBuildServiceRole;
      expect(role.Properties.Policies).toBeDefined();
      expect(Array.isArray(role.Properties.Policies)).toBe(true);
      expect(role.Properties.Policies.length).toBeGreaterThan(0);
    });

    test('CodeBuildServiceRole should have CloudWatch Logs permissions', () => {
      const role = template.Resources.CodeBuildServiceRole;
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('CodeBuildBasePolicy');
      const statements = policy.PolicyDocument.Statement;
      const logsStatement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('logs:'))
      );
      expect(logsStatement).toBeDefined();
      expect(logsStatement.Action).toContain('logs:CreateLogGroup');
      expect(logsStatement.Action).toContain('logs:CreateLogStream');
      expect(logsStatement.Action).toContain('logs:PutLogEvents');
    });

    test('CodeBuildServiceRole should have S3 permissions', () => {
      const role = template.Resources.CodeBuildServiceRole;
      const policy = role.Properties.Policies[0];
      const statements = policy.PolicyDocument.Statement;
      const s3Statement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('s3:'))
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:PutObject');
    });

    test('CodeBuildServiceRole name should include environment suffix', () => {
      const role = template.Resources.CodeBuildServiceRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'codebuild-service-role-${Environment}',
      });
    });
  });

  describe('IAM Roles - CodePipeline', () => {
    test('should have CodePipelineServiceRole resource', () => {
      expect(template.Resources.CodePipelineServiceRole).toBeDefined();
    });

    test('CodePipelineServiceRole should be an IAM role', () => {
      const role = template.Resources.CodePipelineServiceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('CodePipelineServiceRole should have correct assume role policy', () => {
      const role = template.Resources.CodePipelineServiceRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement).toHaveLength(1);
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe(
        'codepipeline.amazonaws.com'
      );
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('CodePipelineServiceRole should have S3 permissions', () => {
      const role = template.Resources.CodePipelineServiceRole;
      const policy = role.Properties.Policies[0];
      const statements = policy.PolicyDocument.Statement;
      const s3Statement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('s3:'))
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:PutObject');
      expect(s3Statement.Action).toContain('s3:GetObjectVersion');
      expect(s3Statement.Action).toContain('s3:GetBucketLocation');
    });

    test('CodePipelineServiceRole should have CodeCommit permissions', () => {
      const role = template.Resources.CodePipelineServiceRole;
      const policy = role.Properties.Policies[0];
      const statements = policy.PolicyDocument.Statement;
      const codecommitStatement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('codecommit:'))
      );
      expect(codecommitStatement).toBeDefined();
      expect(codecommitStatement.Action).toContain('codecommit:GetBranch');
      expect(codecommitStatement.Action).toContain('codecommit:GetCommit');
      expect(codecommitStatement.Action).toContain(
        'codecommit:UploadArchive'
      );
      expect(codecommitStatement.Action).toContain(
        'codecommit:GetUploadArchiveStatus'
      );
    });

    test('CodePipelineServiceRole should have CodeBuild permissions', () => {
      const role = template.Resources.CodePipelineServiceRole;
      const policy = role.Properties.Policies[0];
      const statements = policy.PolicyDocument.Statement;
      const codebuildStatement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('codebuild:'))
      );
      expect(codebuildStatement).toBeDefined();
      expect(codebuildStatement.Action).toContain('codebuild:BatchGetBuilds');
      expect(codebuildStatement.Action).toContain('codebuild:StartBuild');
    });

    test('CodePipelineServiceRole should have SNS permissions', () => {
      const role = template.Resources.CodePipelineServiceRole;
      const policy = role.Properties.Policies[0];
      const statements = policy.PolicyDocument.Statement;
      const snsStatement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('sns:'))
      );
      expect(snsStatement).toBeDefined();
      expect(snsStatement.Action).toContain('sns:Publish');
    });

    test('CodePipelineServiceRole name should include environment suffix', () => {
      const role = template.Resources.CodePipelineServiceRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'codepipeline-service-role-${Environment}',
      });
    });
  });

  describe('CodeBuild Resources', () => {
    test('should have BuildProject resource', () => {
      expect(template.Resources.BuildProject).toBeDefined();
    });

    test('BuildProject should be a CodeBuild project', () => {
      const project = template.Resources.BuildProject;
      expect(project.Type).toBe('AWS::CodeBuild::Project');
    });

    test('BuildProject should reference CodeBuildServiceRole', () => {
      const project = template.Resources.BuildProject;
      expect(project.Properties.ServiceRole).toEqual({
        'Fn::GetAtt': ['CodeBuildServiceRole', 'Arn'],
      });
    });

    test('BuildProject should use CODEPIPELINE artifact type', () => {
      const project = template.Resources.BuildProject;
      expect(project.Properties.Artifacts.Type).toBe('CODEPIPELINE');
    });

    test('BuildProject should have environment configuration', () => {
      const project = template.Resources.BuildProject;
      const env = project.Properties.Environment;
      expect(env.Type).toBe('LINUX_CONTAINER');
      expect(env.ComputeType).toBeDefined();
      expect(env.Image).toBeDefined();
    });

    test('BuildProject should have environment variables', () => {
      const project = template.Resources.BuildProject;
      const env = project.Properties.Environment;
      expect(env.EnvironmentVariables).toBeDefined();
      expect(Array.isArray(env.EnvironmentVariables)).toBe(true);
    });

    test('BuildProject should reference artifact bucket in environment variables', () => {
      const project = template.Resources.BuildProject;
      const env = project.Properties.Environment;
      const artifactBucketVar = env.EnvironmentVariables.find(
        (v: any) => v.Name === 'ARTIFACT_BUCKET'
      );
      expect(artifactBucketVar).toBeDefined();
      expect(artifactBucketVar.Value).toEqual({ Ref: 'ArtifactBucket' });
    });

    test('BuildProject should have CODEPIPELINE source', () => {
      const project = template.Resources.BuildProject;
      expect(project.Properties.Source.Type).toBe('CODEPIPELINE');
    });

    test('BuildProject should have buildspec defined', () => {
      const project = template.Resources.BuildProject;
      expect(project.Properties.Source.BuildSpec).toBeDefined();
      expect(typeof project.Properties.Source.BuildSpec).toBe('string');
    });

    test('BuildProject should have CloudWatch Logs configured', () => {
      const project = template.Resources.BuildProject;
      expect(project.Properties.LogsConfig).toBeDefined();
      expect(project.Properties.LogsConfig.CloudWatchLogs).toBeDefined();
      expect(project.Properties.LogsConfig.CloudWatchLogs.Status).toBe(
        'ENABLED'
      );
    });

    test('BuildProject should reference BuildLogGroup', () => {
      const project = template.Resources.BuildProject;
      expect(
        project.Properties.LogsConfig.CloudWatchLogs.GroupName
      ).toEqual({ Ref: 'BuildLogGroup' });
    });

    test('BuildProject name should include environment suffix', () => {
      const project = template.Resources.BuildProject;
      expect(project.Properties.Name).toEqual({
        'Fn::Sub': 'education-build-${Environment}',
      });
    });
  });

  describe('SNS Resources', () => {
    test('should have PipelineNotificationTopic resource', () => {
      expect(template.Resources.PipelineNotificationTopic).toBeDefined();
    });

    test('PipelineNotificationTopic should be an SNS topic', () => {
      const topic = template.Resources.PipelineNotificationTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('PipelineNotificationTopic should have a display name', () => {
      const topic = template.Resources.PipelineNotificationTopic;
      expect(topic.Properties.DisplayName).toBeDefined();
      expect(typeof topic.Properties.DisplayName).toBe('string');
    });

    test('PipelineNotificationTopic name should include environment suffix', () => {
      const topic = template.Resources.PipelineNotificationTopic;
      expect(topic.Properties.TopicName).toEqual({
        'Fn::Sub': 'pipeline-notifications-${Environment}',
      });
    });

    test('should have EventRuleTopicPolicy resource', () => {
      expect(template.Resources.EventRuleTopicPolicy).toBeDefined();
    });

    test('EventRuleTopicPolicy should be an SNS topic policy', () => {
      const policy = template.Resources.EventRuleTopicPolicy;
      expect(policy.Type).toBe('AWS::SNS::TopicPolicy');
    });

    test('EventRuleTopicPolicy should reference PipelineNotificationTopic', () => {
      const policy = template.Resources.EventRuleTopicPolicy;
      expect(policy.Properties.Topics).toContainEqual({
        Ref: 'PipelineNotificationTopic',
      });
    });

    test('EventRuleTopicPolicy should allow EventBridge to publish', () => {
      const policy = template.Resources.EventRuleTopicPolicy;
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('events.amazonaws.com');
      expect(statement.Action).toBe('sns:Publish');
    });
  });

  describe('CodePipeline Resources', () => {
    test('should have Pipeline resource', () => {
      expect(template.Resources.Pipeline).toBeDefined();
    });

    test('Pipeline should be a CodePipeline', () => {
      const pipeline = template.Resources.Pipeline;
      expect(pipeline.Type).toBe('AWS::CodePipeline::Pipeline');
    });

    test('Pipeline should reference CodePipelineServiceRole', () => {
      const pipeline = template.Resources.Pipeline;
      expect(pipeline.Properties.RoleArn).toEqual({
        'Fn::GetAtt': ['CodePipelineServiceRole', 'Arn'],
      });
    });

    test('Pipeline should use S3 artifact store', () => {
      const pipeline = template.Resources.Pipeline;
      expect(pipeline.Properties.ArtifactStore.Type).toBe('S3');
      expect(pipeline.Properties.ArtifactStore.Location).toEqual({
        Ref: 'ArtifactBucket',
      });
    });

    test('Pipeline should have at least 2 stages', () => {
      const pipeline = template.Resources.Pipeline;
      expect(pipeline.Properties.Stages).toBeDefined();
      expect(Array.isArray(pipeline.Properties.Stages)).toBe(true);
      expect(pipeline.Properties.Stages.length).toBeGreaterThanOrEqual(2);
    });

    test('Pipeline should have Source stage', () => {
      const pipeline = template.Resources.Pipeline;
      const sourceStage = pipeline.Properties.Stages.find(
        (s: any) => s.Name === 'Source'
      );
      expect(sourceStage).toBeDefined();
    });

    test('Source stage should use CodeCommit', () => {
      const pipeline = template.Resources.Pipeline;
      const sourceStage = pipeline.Properties.Stages.find(
        (s: any) => s.Name === 'Source'
      );
      const action = sourceStage.Actions[0];
      expect(action.ActionTypeId.Category).toBe('Source');
      expect(action.ActionTypeId.Owner).toBe('AWS');
      expect(action.ActionTypeId.Provider).toBe('CodeCommit');
    });

    test('Source stage should reference SourceRepository', () => {
      const pipeline = template.Resources.Pipeline;
      const sourceStage = pipeline.Properties.Stages.find(
        (s: any) => s.Name === 'Source'
      );
      const action = sourceStage.Actions[0];
      expect(action.Configuration.RepositoryName).toEqual({
        'Fn::GetAtt': ['SourceRepository', 'Name'],
      });
    });

    test('Source stage should specify branch', () => {
      const pipeline = template.Resources.Pipeline;
      const sourceStage = pipeline.Properties.Stages.find(
        (s: any) => s.Name === 'Source'
      );
      const action = sourceStage.Actions[0];
      expect(action.Configuration.BranchName).toBeDefined();
      expect(typeof action.Configuration.BranchName).toBe('string');
    });

    test('Source stage should produce output artifact', () => {
      const pipeline = template.Resources.Pipeline;
      const sourceStage = pipeline.Properties.Stages.find(
        (s: any) => s.Name === 'Source'
      );
      const action = sourceStage.Actions[0];
      expect(action.OutputArtifacts).toBeDefined();
      expect(Array.isArray(action.OutputArtifacts)).toBe(true);
      expect(action.OutputArtifacts.length).toBeGreaterThan(0);
    });

    test('Pipeline should have Build stage', () => {
      const pipeline = template.Resources.Pipeline;
      const buildStage = pipeline.Properties.Stages.find(
        (s: any) => s.Name === 'Build'
      );
      expect(buildStage).toBeDefined();
    });

    test('Build stage should use CodeBuild', () => {
      const pipeline = template.Resources.Pipeline;
      const buildStage = pipeline.Properties.Stages.find(
        (s: any) => s.Name === 'Build'
      );
      const action = buildStage.Actions[0];
      expect(action.ActionTypeId.Category).toBe('Build');
      expect(action.ActionTypeId.Owner).toBe('AWS');
      expect(action.ActionTypeId.Provider).toBe('CodeBuild');
    });

    test('Build stage should reference BuildProject', () => {
      const pipeline = template.Resources.Pipeline;
      const buildStage = pipeline.Properties.Stages.find(
        (s: any) => s.Name === 'Build'
      );
      const action = buildStage.Actions[0];
      expect(action.Configuration.ProjectName).toEqual({
        Ref: 'BuildProject',
      });
    });

    test('Build stage should consume source artifact', () => {
      const pipeline = template.Resources.Pipeline;
      const buildStage = pipeline.Properties.Stages.find(
        (s: any) => s.Name === 'Build'
      );
      const action = buildStage.Actions[0];
      expect(action.InputArtifacts).toBeDefined();
      expect(Array.isArray(action.InputArtifacts)).toBe(true);
      expect(action.InputArtifacts.length).toBeGreaterThan(0);
    });

    test('Build stage should produce output artifact', () => {
      const pipeline = template.Resources.Pipeline;
      const buildStage = pipeline.Properties.Stages.find(
        (s: any) => s.Name === 'Build'
      );
      const action = buildStage.Actions[0];
      expect(action.OutputArtifacts).toBeDefined();
      expect(Array.isArray(action.OutputArtifacts)).toBe(true);
      expect(action.OutputArtifacts.length).toBeGreaterThan(0);
    });

    test('Pipeline name should include environment suffix', () => {
      const pipeline = template.Resources.Pipeline;
      expect(pipeline.Properties.Name).toEqual({
        'Fn::Sub': 'education-pipeline-${Environment}',
      });
    });
  });

  describe('EventBridge Resources', () => {
    test('should have PipelineEventRule resource', () => {
      expect(template.Resources.PipelineEventRule).toBeDefined();
    });

    test('PipelineEventRule should be an EventBridge rule', () => {
      const rule = template.Resources.PipelineEventRule;
      expect(rule.Type).toBe('AWS::Events::Rule');
    });

    test('PipelineEventRule should be enabled', () => {
      const rule = template.Resources.PipelineEventRule;
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('PipelineEventRule should have event pattern for CodePipeline', () => {
      const rule = template.Resources.PipelineEventRule;
      const eventPattern = rule.Properties.EventPattern;
      expect(eventPattern.source).toContain('aws.codepipeline');
      expect(eventPattern['detail-type']).toContain(
        'CodePipeline Pipeline Execution State Change'
      );
    });

    test('PipelineEventRule should reference Pipeline', () => {
      const rule = template.Resources.PipelineEventRule;
      const eventPattern = rule.Properties.EventPattern;
      expect(eventPattern.detail.pipeline).toContainEqual({
        Ref: 'Pipeline',
      });
    });

    test('PipelineEventRule should target SNS topic', () => {
      const rule = template.Resources.PipelineEventRule;
      expect(rule.Properties.Targets).toBeDefined();
      expect(Array.isArray(rule.Properties.Targets)).toBe(true);
      expect(rule.Properties.Targets.length).toBeGreaterThan(0);
      const target = rule.Properties.Targets[0];
      expect(target.Arn).toEqual({ Ref: 'PipelineNotificationTopic' });
    });

    test('PipelineEventRule name should include environment suffix', () => {
      const rule = template.Resources.PipelineEventRule;
      expect(rule.Properties.Name).toEqual({
        'Fn::Sub': 'pipeline-event-rule-${Environment}',
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'RepositoryCloneUrlHttp',
        'RepositoryCloneUrlSsh',
        'BuildProjectName',
        'PipelineName',
        'ArtifactBucketName',
        'BuildLogGroupName',
        'NotificationTopicArn',
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

    test('all outputs should have values', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Value).toBeDefined();
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('export names should follow stack name convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name['Fn::Sub']).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });

    test('RepositoryCloneUrlHttp should reference SourceRepository', () => {
      const output = template.Outputs.RepositoryCloneUrlHttp;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['SourceRepository', 'CloneUrlHttp'],
      });
    });

    test('RepositoryCloneUrlSsh should reference SourceRepository', () => {
      const output = template.Outputs.RepositoryCloneUrlSsh;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['SourceRepository', 'CloneUrlSsh'],
      });
    });

    test('BuildProjectName should reference BuildProject', () => {
      const output = template.Outputs.BuildProjectName;
      expect(output.Value).toEqual({ Ref: 'BuildProject' });
    });

    test('PipelineName should reference Pipeline', () => {
      const output = template.Outputs.PipelineName;
      expect(output.Value).toEqual({ Ref: 'Pipeline' });
    });

    test('ArtifactBucketName should reference ArtifactBucket', () => {
      const output = template.Outputs.ArtifactBucketName;
      expect(output.Value).toEqual({ Ref: 'ArtifactBucket' });
    });

    test('BuildLogGroupName should reference BuildLogGroup', () => {
      const output = template.Outputs.BuildLogGroupName;
      expect(output.Value).toEqual({ Ref: 'BuildLogGroup' });
    });

    test('NotificationTopicArn should reference PipelineNotificationTopic', () => {
      const output = template.Outputs.NotificationTopicArn;
      expect(output.Value).toEqual({ Ref: 'PipelineNotificationTopic' });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have exactly 10 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(10);
    });

    test('should have all expected resource types', () => {
      const expectedTypes = [
        'AWS::S3::Bucket',
        'AWS::CodeCommit::Repository',
        'AWS::Logs::LogGroup',
        'AWS::IAM::Role',
        'AWS::CodeBuild::Project',
        'AWS::SNS::Topic',
        'AWS::CodePipeline::Pipeline',
        'AWS::Events::Rule',
        'AWS::SNS::TopicPolicy',
      ];

      const actualTypes = Object.values(template.Resources).map(
        (r: any) => r.Type
      );

      expectedTypes.forEach(expectedType => {
        expect(actualTypes).toContain(expectedType);
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all nameable resources should include environment suffix', () => {
      const resourcesWithNames = [
        'ArtifactBucket',
        'SourceRepository',
        'BuildLogGroup',
        'CodeBuildServiceRole',
        'BuildProject',
        'PipelineNotificationTopic',
        'CodePipelineServiceRole',
        'Pipeline',
        'PipelineEventRule',
      ];

      resourcesWithNames.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        const nameProperties = [
          'BucketName',
          'RepositoryName',
          'LogGroupName',
          'RoleName',
          'Name',
          'TopicName',
        ];

        const nameProperty = nameProperties.find(
          prop => resource.Properties && resource.Properties[prop]
        );

        if (nameProperty) {
          const nameValue = resource.Properties[nameProperty];
          expect(nameValue['Fn::Sub']).toBeDefined();
          expect(nameValue['Fn::Sub']).toContain('${Environment}');
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('S3 bucket should have encryption', () => {
      const bucket = template.Resources.ArtifactBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.ArtifactBucket;
      expect(
        bucket.Properties.PublicAccessBlockConfiguration
      ).toBeDefined();
    });

    test('IAM roles should have specific assume role policies', () => {
      const roles = ['CodeBuildServiceRole', 'CodePipelineServiceRole'];
      roles.forEach(roleKey => {
        const role = template.Resources[roleKey];
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
        expect(
          role.Properties.AssumeRolePolicyDocument.Statement
        ).toBeDefined();
      });
    });

    test('CloudWatch Logs should have retention set', () => {
      const logGroup = template.Resources.BuildLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
    });
  });

  describe('Resource Dependencies', () => {
    test('BuildProject should depend on CodeBuildServiceRole', () => {
      const project = template.Resources.BuildProject;
      expect(project.Properties.ServiceRole).toEqual({
        'Fn::GetAtt': ['CodeBuildServiceRole', 'Arn'],
      });
    });

    test('Pipeline should depend on CodePipelineServiceRole', () => {
      const pipeline = template.Resources.Pipeline;
      expect(pipeline.Properties.RoleArn).toEqual({
        'Fn::GetAtt': ['CodePipelineServiceRole', 'Arn'],
      });
    });

    test('Pipeline should reference ArtifactBucket', () => {
      const pipeline = template.Resources.Pipeline;
      expect(pipeline.Properties.ArtifactStore.Location).toEqual({
        Ref: 'ArtifactBucket',
      });
    });

    test('Pipeline should reference SourceRepository and BuildProject', () => {
      const pipeline = template.Resources.Pipeline;
      const sourceStage = pipeline.Properties.Stages[0];
      const buildStage = pipeline.Properties.Stages[1];

      expect(sourceStage.Actions[0].Configuration.RepositoryName).toEqual({
        'Fn::GetAtt': ['SourceRepository', 'Name'],
      });

      expect(buildStage.Actions[0].Configuration.ProjectName).toEqual({
        Ref: 'BuildProject',
      });
    });

    test('PipelineEventRule should reference Pipeline and PipelineNotificationTopic', () => {
      const rule = template.Resources.PipelineEventRule;
      expect(rule.Properties.EventPattern.detail.pipeline).toContainEqual({
        Ref: 'Pipeline',
      });
      expect(rule.Properties.Targets[0].Arn).toEqual({
        Ref: 'PipelineNotificationTopic',
      });
    });
  });
});
