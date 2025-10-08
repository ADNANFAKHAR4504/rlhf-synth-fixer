import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure Validation', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have comprehensive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Production CI/CD Pipeline');
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
    });
  });

  describe('Parameters Validation', () => {
    const requiredParameters = [
      'Environment',
      'GitHubOwner',
      'GitHubRepo',
      'GitHubBranch',
      'GitHubToken',
      'NotificationEmail',
      'SolutionStackName',
      'DeploymentTimestamp'
    ];

    requiredParameters.forEach(paramName => {
      test(`should have ${paramName} parameter`, () => {
        expect(template.Parameters[paramName]).toBeDefined();
      });

      test(`${paramName} parameter should have correct type`, () => {
        expect(template.Parameters[paramName].Type).toBe('String');
      });

      test(`${paramName} parameter should have description`, () => {
        expect(template.Parameters[paramName].Description).toBeDefined();
      });
    });

    test('Environment parameter should have correct allowed values', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Default).toBe('development');
      expect(envParam.AllowedValues).toEqual(['development', 'staging', 'production']);
    });

    test('GitHubToken parameter should have security properties', () => {
      const tokenParam = template.Parameters.GitHubToken;
      expect(tokenParam.NoEcho).toBe(true);
      expect(tokenParam.MinLength).toBe(40);
      expect(tokenParam.MaxLength).toBe(255);
    });

    test('NotificationEmail parameter should have email validation', () => {
      const emailParam = template.Parameters.NotificationEmail;
      expect(emailParam.AllowedPattern).toContain('@');
      expect(emailParam.ConstraintDescription).toContain('email');
    });

    test('SolutionStackName parameter should have valid options', () => {
      const stackParam = template.Parameters.SolutionStackName;
      expect(stackParam.Default).toContain('Python 3.11');
    });
  });


  describe('KMS Resources Validation', () => {
    test('should have ArtifactEncryptionKey resource', () => {
      expect(template.Resources.ArtifactEncryptionKey).toBeDefined();
    });

    test('ArtifactEncryptionKey should be KMS Key type', () => {
      const key = template.Resources.ArtifactEncryptionKey;
      expect(key.Type).toBe('AWS::KMS::Key');
    });

    test('ArtifactEncryptionKey should have proper key policy', () => {
      const key = template.Resources.ArtifactEncryptionKey;
      const keyPolicy = key.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toHaveLength(3);
    });

    test('ArtifactEncryptionKey should allow root account permissions', () => {
      const key = template.Resources.ArtifactEncryptionKey;
      const statements = key.Properties.KeyPolicy.Statement;
      const rootStatement = statements.find((s: any) => s.Sid === 'EnableRootAccountPermissions');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');
    });

    test('ArtifactEncryptionKey should allow CodePipeline service', () => {
      const key = template.Resources.ArtifactEncryptionKey;
      const statements = key.Properties.KeyPolicy.Statement;
      const pipelineStatement = statements.find((s: any) => s.Sid === 'AllowCodePipelineService');
      expect(pipelineStatement).toBeDefined();
      expect(pipelineStatement.Principal.Service).toBe('codepipeline.amazonaws.com');
    });

    test('ArtifactEncryptionKey should allow CodeBuild service', () => {
      const key = template.Resources.ArtifactEncryptionKey;
      const statements = key.Properties.KeyPolicy.Statement;
      const buildStatement = statements.find((s: any) => s.Sid === 'AllowCodeBuildService');
      expect(buildStatement).toBeDefined();
      expect(buildStatement.Principal.Service).toBe('codebuild.amazonaws.com');
    });

    test('should have ArtifactEncryptionKeyAlias resource', () => {
      expect(template.Resources.ArtifactEncryptionKeyAlias).toBeDefined();
    });

    test('ArtifactEncryptionKeyAlias should be KMS Alias type', () => {
      const alias = template.Resources.ArtifactEncryptionKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
    });

    test('ArtifactEncryptionKeyAlias should reference the key', () => {
      const alias = template.Resources.ArtifactEncryptionKeyAlias;
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'ArtifactEncryptionKey' });
    });
  });

  describe('S3 Resources Validation', () => {
    test('should have ArtifactStoreBucket resource', () => {
      expect(template.Resources.ArtifactStoreBucket).toBeDefined();
    });

    test('ArtifactStoreBucket should be S3 Bucket type', () => {
      const bucket = template.Resources.ArtifactStoreBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('ArtifactStoreBucket should have encryption enabled', () => {
      const bucket = template.Resources.ArtifactStoreBucket;
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration).toHaveLength(1);
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('ArtifactStoreBucket should use KMS key for encryption', () => {
      const bucket = template.Resources.ArtifactStoreBucket;
      const encryption = bucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'ArtifactEncryptionKey' });
    });

    test('ArtifactStoreBucket should have versioning enabled', () => {
      const bucket = template.Resources.ArtifactStoreBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('ArtifactStoreBucket should have lifecycle configuration', () => {
      const bucket = template.Resources.ArtifactStoreBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration;
      expect(lifecycle.Rules).toHaveLength(1);
      expect(lifecycle.Rules[0].Status).toBe('Enabled');
      expect(lifecycle.Rules[0].ExpirationInDays).toBe(30);
    });

    test('ArtifactStoreBucket should have public access blocked', () => {
      const bucket = template.Resources.ArtifactStoreBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('SNS Resources Validation', () => {
    test('should have PipelineNotificationTopic resource', () => {
      expect(template.Resources.PipelineNotificationTopic).toBeDefined();
    });

    test('PipelineNotificationTopic should be SNS Topic type', () => {
      const topic = template.Resources.PipelineNotificationTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('PipelineNotificationTopic should use KMS encryption', () => {
      const topic = template.Resources.PipelineNotificationTopic;
      expect(topic.Properties.KmsMasterKeyId).toEqual({ Ref: 'ArtifactEncryptionKey' });
    });

    test('should have PipelineNotificationSubscription resource', () => {
      expect(template.Resources.PipelineNotificationSubscription).toBeDefined();
    });

    test('PipelineNotificationSubscription should be SNS Subscription type', () => {
      const subscription = template.Resources.PipelineNotificationSubscription;
      expect(subscription.Type).toBe('AWS::SNS::Subscription');
      expect(subscription.Properties.Protocol).toBe('email');
      expect(subscription.Properties.TopicArn).toEqual({ Ref: 'PipelineNotificationTopic' });
    });
  });

  describe('IAM Roles Validation', () => {
    const iamRoles = [
      'CodePipelineServiceRole',
      'CodeBuildServiceRole',
      'ElasticBeanstalkServiceRole',
      'ElasticBeanstalkInstanceRole'
    ];

    iamRoles.forEach(roleName => {
      test(`should have ${roleName} resource`, () => {
        expect(template.Resources[roleName]).toBeDefined();
      });

      test(`${roleName} should be IAM Role type`, () => {
        const role = template.Resources[roleName];
        expect(role.Type).toBe('AWS::IAM::Role');
      });

      test(`${roleName} should have assume role policy`, () => {
        const role = template.Resources[roleName];
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
        expect(role.Properties.AssumeRolePolicyDocument.Version).toBe('2012-10-17');
      });
    });

    test('CodePipelineServiceRole should assume codepipeline service', () => {
      const role = template.Resources.CodePipelineServiceRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      const statement = assumePolicy.Statement[0];
      expect(statement.Principal.Service).toBe('codepipeline.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('CodeBuildServiceRole should assume codebuild service', () => {
      const role = template.Resources.CodeBuildServiceRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      const statement = assumePolicy.Statement[0];
      expect(statement.Principal.Service).toBe('codebuild.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('ElasticBeanstalkServiceRole should assume elasticbeanstalk service', () => {
      const role = template.Resources.ElasticBeanstalkServiceRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      const statement = assumePolicy.Statement[0];
      expect(statement.Principal.Service).toBe('elasticbeanstalk.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('ElasticBeanstalkInstanceRole should assume ec2 service', () => {
      const role = template.Resources.ElasticBeanstalkInstanceRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      const statement = assumePolicy.Statement[0];
      expect(statement.Principal.Service).toBe('ec2.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('CodePipelineServiceRole should have managed policies', () => {
      const role = template.Resources.CodePipelineServiceRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AWSCodePipeline_FullAccess');
    });

    test('ElasticBeanstalkServiceRole should have managed policies', () => {
      const role = template.Resources.ElasticBeanstalkServiceRole;
      const policies = role.Properties.ManagedPolicyArns;
      expect(policies).toContain('arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth');
      expect(policies).toContain('arn:aws:iam::aws:policy/AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy');
    });

    test('ElasticBeanstalkInstanceRole should have managed policies', () => {
      const role = template.Resources.ElasticBeanstalkInstanceRole;
      const policies = role.Properties.ManagedPolicyArns;
      expect(policies).toContain('arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier');
      expect(policies).toContain('arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier');
    });
  });

  describe('IAM Instance Profile Validation', () => {
    test('should have ElasticBeanstalkInstanceProfile resource', () => {
      expect(template.Resources.ElasticBeanstalkInstanceProfile).toBeDefined();
    });

    test('ElasticBeanstalkInstanceProfile should be IAM InstanceProfile type', () => {
      const profile = template.Resources.ElasticBeanstalkInstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('ElasticBeanstalkInstanceProfile should reference instance role', () => {
      const profile = template.Resources.ElasticBeanstalkInstanceProfile;
      expect(profile.Properties.Roles).toContainEqual({ Ref: 'ElasticBeanstalkInstanceRole' });
    });
  });

  describe('Elastic Beanstalk Resources Validation', () => {
    test('should have ElasticBeanstalkApplication resource', () => {
      expect(template.Resources.ElasticBeanstalkApplication).toBeDefined();
    });

    test('ElasticBeanstalkApplication should be Elastic Beanstalk Application type', () => {
      const app = template.Resources.ElasticBeanstalkApplication;
      expect(app.Type).toBe('AWS::ElasticBeanstalk::Application');
    });

    test('ElasticBeanstalkApplication should have correct application name', () => {
      const app = template.Resources.ElasticBeanstalkApplication;
      expect(app.Properties.ApplicationName).toBe('MyWebApp');
    });

    test('ElasticBeanstalkApplication should have resource lifecycle config', () => {
      const app = template.Resources.ElasticBeanstalkApplication;
      const lifecycle = app.Properties.ResourceLifecycleConfig;
      expect(lifecycle.ServiceRole).toEqual({ 'Fn::GetAtt': ['ElasticBeanstalkServiceRole', 'Arn'] });
      expect(lifecycle.VersionLifecycleConfig.MaxCountRule.Enabled).toBe(true);
      expect(lifecycle.VersionLifecycleConfig.MaxCountRule.MaxCount).toBe(10);
    });

    test('should have ElasticBeanstalkEnvironment resource', () => {
      expect(template.Resources.ElasticBeanstalkEnvironment).toBeDefined();
    });

    test('ElasticBeanstalkEnvironment should be Elastic Beanstalk Environment type', () => {
      const env = template.Resources.ElasticBeanstalkEnvironment;
      expect(env.Type).toBe('AWS::ElasticBeanstalk::Environment');
    });

    test('ElasticBeanstalkEnvironment should reference application', () => {
      const env = template.Resources.ElasticBeanstalkEnvironment;
      expect(env.Properties.ApplicationName).toEqual({ Ref: 'ElasticBeanstalkApplication' });
    });

    test('ElasticBeanstalkEnvironment should have correct tier', () => {
      const env = template.Resources.ElasticBeanstalkEnvironment;
      expect(env.Properties.Tier.Name).toBe('WebServer');
      expect(env.Properties.Tier.Type).toBe('Standard');
    });

    test('ElasticBeanstalkEnvironment should have option settings', () => {
      const env = template.Resources.ElasticBeanstalkEnvironment;
      const options = env.Properties.OptionSettings;
      expect(options).toBeDefined();
      expect(options.length).toBeGreaterThan(0);
    });

    test('ElasticBeanstalkEnvironment should have instance type setting', () => {
      const env = template.Resources.ElasticBeanstalkEnvironment;
      const options = env.Properties.OptionSettings;
      const instanceType = options.find((opt: any) => opt.OptionName === 'InstanceType');
      expect(instanceType).toBeDefined();
      expect(instanceType.Value).toBe('t3.medium');
    });

    test('ElasticBeanstalkEnvironment should have IAM instance profile setting', () => {
      const env = template.Resources.ElasticBeanstalkEnvironment;
      const options = env.Properties.OptionSettings;
      const iamProfile = options.find((opt: any) => opt.OptionName === 'IamInstanceProfile');
      expect(iamProfile).toBeDefined();
      expect(iamProfile.Value).toEqual({ Ref: 'ElasticBeanstalkInstanceProfile' });
    });

    test('ElasticBeanstalkEnvironment should have service role setting', () => {
      const env = template.Resources.ElasticBeanstalkEnvironment;
      const options = env.Properties.OptionSettings;
      const serviceRole = options.find((opt: any) => opt.OptionName === 'ServiceRole');
      expect(serviceRole).toBeDefined();
      expect(serviceRole.Value).toEqual({ Ref: 'ElasticBeanstalkServiceRole' });
    });
  });

  describe('CodeBuild Resources Validation', () => {
    test('should have CodeBuildProject resource', () => {
      expect(template.Resources.CodeBuildProject).toBeDefined();
    });

    test('CodeBuildProject should be CodeBuild Project type', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Type).toBe('AWS::CodeBuild::Project');
    });

    test('CodeBuildProject should have service role', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Properties.ServiceRole).toEqual({ 'Fn::GetAtt': ['CodeBuildServiceRole', 'Arn'] });
    });

    test('CodeBuildProject should have CODEPIPELINE artifacts', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Properties.Artifacts.Type).toBe('CODEPIPELINE');
    });

    test('CodeBuildProject should have correct environment', () => {
      const project = template.Resources.CodeBuildProject;
      const env = project.Properties.Environment;
      expect(env.Type).toBe('LINUX_CONTAINER');
      expect(env.ComputeType).toBe('BUILD_GENERAL1_MEDIUM');
      expect(env.Image).toBe('aws/codebuild/amazonlinux2-x86_64-standard:4.0');
    });

    test('CodeBuildProject should have environment variables', () => {
      const project = template.Resources.CodeBuildProject;
      const envVars = project.Properties.Environment.EnvironmentVariables;
      expect(envVars).toHaveLength(6);

      const varNames = envVars.map((v: any) => v.Name);
      expect(varNames).toContain('AWS_DEFAULT_REGION');
      expect(varNames).toContain('ENVIRONMENT');
      expect(varNames).toContain('S3_BUCKET');
      expect(varNames).toContain('GITHUB_BRANCH');
      expect(varNames).toContain('APP_NAME');
      expect(varNames).toContain('BUILD_ENV');
    });

    test('CodeBuildProject should have CODEPIPELINE source', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Properties.Source.Type).toBe('CODEPIPELINE');
    });

    test('CodeBuildProject should have buildspec', () => {
      const project = template.Resources.CodeBuildProject;
      const buildspec = project.Properties.Source.BuildSpec;
      expect(buildspec).toContain('version: 0.2');
      expect(buildspec).toContain('phases:');
      expect(buildspec).toContain('install:');
      expect(buildspec).toContain('pre_build:');
      expect(buildspec).toContain('build:');
      expect(buildspec).toContain('post_build:');
    });

    test('CodeBuildProject should have timeout', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Properties.TimeoutInMinutes).toBe(20);
    });

    test('CodeBuildProject should have CloudWatch logs config', () => {
      const project = template.Resources.CodeBuildProject;
      const logs = project.Properties.LogsConfig.CloudWatchLogs;
      expect(logs.Status).toBe('ENABLED');
      expect(logs.GroupName).toEqual({ 'Fn::Sub': '/aws/codebuild/${Environment}-mywebapp-build' });
    });
  });

  describe('CodePipeline Resources Validation', () => {
    test('should have CodePipeline resource', () => {
      expect(template.Resources.CodePipeline).toBeDefined();
    });

    test('CodePipeline should be CodePipeline Pipeline type', () => {
      const pipeline = template.Resources.CodePipeline;
      expect(pipeline.Type).toBe('AWS::CodePipeline::Pipeline');
    });

    test('CodePipeline should have service role', () => {
      const pipeline = template.Resources.CodePipeline;
      expect(pipeline.Properties.RoleArn).toEqual({ 'Fn::GetAtt': ['CodePipelineServiceRole', 'Arn'] });
    });

    test('CodePipeline should have S3 artifact store', () => {
      const pipeline = template.Resources.CodePipeline;
      const store = pipeline.Properties.ArtifactStore;
      expect(store.Type).toBe('S3');
      expect(store.Location).toEqual({ Ref: 'ArtifactStoreBucket' });
      expect(store.EncryptionKey.Id).toEqual({ Ref: 'ArtifactEncryptionKey' });
      expect(store.EncryptionKey.Type).toBe('KMS');
    });

    test('CodePipeline should have stages', () => {
      const pipeline = template.Resources.CodePipeline;
      const stages = pipeline.Properties.Stages;
      expect(stages).toHaveLength(4);

      const stageNames = stages.map((s: any) => s.Name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Manual_Approval');
      expect(stageNames).toContain('Deploy');
    });

    test('CodePipeline Source stage should have GitHub action', () => {
      const pipeline = template.Resources.CodePipeline;
      const sourceStage = pipeline.Properties.Stages.find((s: any) => s.Name === 'Source');
      const action = sourceStage.Actions[0];
      expect(action.Name).toBe('GitHub_Source');
      expect(action.ActionTypeId.Category).toBe('Source');
      expect(action.ActionTypeId.Owner).toBe('ThirdParty');
      expect(action.ActionTypeId.Provider).toBe('GitHub');
    });

    test('CodePipeline Build stage should have CodeBuild action', () => {
      const pipeline = template.Resources.CodePipeline;
      const buildStage = pipeline.Properties.Stages.find((s: any) => s.Name === 'Build');
      const action = buildStage.Actions[0];
      expect(action.Name).toBe('CodeBuild_Action');
      expect(action.ActionTypeId.Category).toBe('Build');
      expect(action.ActionTypeId.Owner).toBe('AWS');
      expect(action.ActionTypeId.Provider).toBe('CodeBuild');
    });

    test('CodePipeline Manual Approval stage should have approval action', () => {
      const pipeline = template.Resources.CodePipeline;
      const approvalStage = pipeline.Properties.Stages.find((s: any) => s.Name === 'Manual_Approval');
      const action = approvalStage.Actions[0];
      expect(action.Name).toBe('Production_Approval');
      expect(action.ActionTypeId.Category).toBe('Approval');
      expect(action.ActionTypeId.Owner).toBe('AWS');
      expect(action.ActionTypeId.Provider).toBe('Manual');
    });

    test('CodePipeline Deploy stage should have Elastic Beanstalk action', () => {
      const pipeline = template.Resources.CodePipeline;
      const deployStage = pipeline.Properties.Stages.find((s: any) => s.Name === 'Deploy');
      const action = deployStage.Actions[0];
      expect(action.Name).toBe('ElasticBeanstalk_Deploy');
      expect(action.ActionTypeId.Category).toBe('Deploy');
      expect(action.ActionTypeId.Owner).toBe('AWS');
      expect(action.ActionTypeId.Provider).toBe('ElasticBeanstalk');
    });
  });

  describe('CloudWatch Event Rules Validation', () => {
    const eventRules = [
      'PipelineFailureEventRule',
      'PipelineSuccessEventRule',
      'CodeBuildFailureEventRule'
    ];

    eventRules.forEach(ruleName => {
      test(`should have ${ruleName} resource`, () => {
        expect(template.Resources[ruleName]).toBeDefined();
      });

      test(`${ruleName} should be Events Rule type`, () => {
        const rule = template.Resources[ruleName];
        expect(rule.Type).toBe('AWS::Events::Rule');
      });

      test(`${ruleName} should have description`, () => {
        const rule = template.Resources[ruleName];
        expect(rule.Properties.Description).toBeDefined();
      });

      test(`${ruleName} should be enabled`, () => {
        const rule = template.Resources[ruleName];
        expect(rule.Properties.State).toBe('ENABLED');
      });
    });

    test('PipelineFailureEventRule should have correct event pattern', () => {
      const rule = template.Resources.PipelineFailureEventRule;
      const pattern = rule.Properties.EventPattern;
      expect(pattern.source).toContain('aws.codepipeline');
      expect(pattern['detail-type']).toContain('CodePipeline Pipeline Execution State Change');
      expect(pattern.detail.state).toContain('FAILED');
      expect(pattern.detail.state).toContain('STOPPED');
    });

    test('PipelineSuccessEventRule should have correct event pattern', () => {
      const rule = template.Resources.PipelineSuccessEventRule;
      const pattern = rule.Properties.EventPattern;
      expect(pattern.source).toContain('aws.codepipeline');
      expect(pattern['detail-type']).toContain('CodePipeline Pipeline Execution State Change');
      expect(pattern.detail.state).toContain('SUCCEEDED');
    });

    test('CodeBuildFailureEventRule should have correct event pattern', () => {
      const rule = template.Resources.CodeBuildFailureEventRule;
      const pattern = rule.Properties.EventPattern;
      expect(pattern.source).toContain('aws.codebuild');
      expect(pattern['detail-type']).toContain('CodeBuild Build State Change');
      expect(pattern.detail['build-status']).toContain('FAILED');
      expect(pattern.detail['build-status']).toContain('FAULT');
      expect(pattern.detail['build-status']).toContain('TIMED_OUT');
    });
  });

  describe('SNS Topic Policy Validation', () => {
    test('should have EventBridgeToSNSPermission resource', () => {
      expect(template.Resources.EventBridgeToSNSPermission).toBeDefined();
    });

    test('EventBridgeToSNSPermission should be SNS TopicPolicy type', () => {
      const policy = template.Resources.EventBridgeToSNSPermission;
      expect(policy.Type).toBe('AWS::SNS::TopicPolicy');
    });

    test('EventBridgeToSNSPermission should allow EventBridge service', () => {
      const policy = template.Resources.EventBridgeToSNSPermission;
      const policyDoc = policy.Properties.PolicyDocument;
      const statement = policyDoc.Statement[0];
      expect(statement.Principal.Service).toBe('events.amazonaws.com');
      expect(statement.Action).toBe('sns:Publish');
    });
  });

  describe('Outputs Validation', () => {
    const expectedOutputs = [
      'PipelineUrl',
      'ElasticBeanstalkApplicationUrl',
      'SNSTopicArn',
      'ArtifactsBucket',
      'CodeBuildProjectName',
      'ElasticBeanstalkEnvironmentName',
      'KMSKeyArn'
    ];

    expectedOutputs.forEach(outputName => {
      test(`should have ${outputName} output`, () => {
        expect(template.Outputs[outputName]).toBeDefined();
      });

      test(`${outputName} output should have description`, () => {
        const output = template.Outputs[outputName];
        expect(output.Description).toBeDefined();
      });

      test(`${outputName} output should have value`, () => {
        const output = template.Outputs[outputName];
        expect(output.Value).toBeDefined();
      });

      test(`${outputName} output should have export`, () => {
        const output = template.Outputs[outputName];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('PipelineUrl output should be correct', () => {
      const output = template.Outputs.PipelineUrl;
      expect(output.Description).toBe('URL of the CodePipeline console');
      expect(output.Value).toEqual({ 'Fn::Sub': 'https://${AWS::Region}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${CodePipeline}/view' });
    });

    test('ElasticBeanstalkApplicationUrl output should be correct', () => {
      const output = template.Outputs.ElasticBeanstalkApplicationUrl;
      expect(output.Description).toBe('URL of the Elastic Beanstalk application');
      expect(output.Value).toEqual({ 'Fn::Sub': 'http://${ElasticBeanstalkEnvironment}.${AWS::Region}.elasticbeanstalk.com' });
    });

    test('SNSTopicArn output should be correct', () => {
      const output = template.Outputs.SNSTopicArn;
      expect(output.Description).toBe('ARN of the SNS topic for notifications');
      expect(output.Value).toEqual({ Ref: 'PipelineNotificationTopic' });
    });

    test('ArtifactsBucket output should be correct', () => {
      const output = template.Outputs.ArtifactsBucket;
      expect(output.Description).toBe('S3 bucket for storing pipeline artifacts');
      expect(output.Value).toEqual({ Ref: 'ArtifactStoreBucket' });
    });

    test('CodeBuildProjectName output should be correct', () => {
      const output = template.Outputs.CodeBuildProjectName;
      expect(output.Description).toBe('Name of the CodeBuild project');
      expect(output.Value).toEqual({ Ref: 'CodeBuildProject' });
    });

    test('ElasticBeanstalkEnvironmentName output should be correct', () => {
      const output = template.Outputs.ElasticBeanstalkEnvironmentName;
      expect(output.Description).toBe('Name of the Elastic Beanstalk environment');
      expect(output.Value).toEqual({ Ref: 'ElasticBeanstalkEnvironment' });
    });

    test('KMSKeyArn output should be correct', () => {
      const output = template.Outputs.KMSKeyArn;
      expect(output.Description).toBe('ARN of the KMS key used for encryption');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ArtifactEncryptionKey', 'Arn'] });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(18);
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(8);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(7);
    });
  });

  describe('Resource Dependencies Validation', () => {
    test('all resource references should be valid', () => {
      const resources = template.Resources;
      const resourceNames = Object.keys(resources);

      resourceNames.forEach(resourceName => {
        const resource = resources[resourceName];
        const resourceStr = JSON.stringify(resource);

        const refMatches = resourceStr.match(/\{"Ref":\s*"([^"]+)"\}/g);
        if (refMatches) {
          refMatches.forEach(match => {
            const refName = JSON.parse(match).Ref;
            const pseudoParams = ['AWS::StackName', 'AWS::AccountId', 'AWS::Region', 'Environment', 'GitHubOwner', 'GitHubRepo', 'GitHubBranch', 'GitHubToken', 'NotificationEmail', 'SolutionStackName', 'DeploymentTimestamp'];
            if (!pseudoParams.includes(refName)) {
              expect(resourceNames).toContain(refName);
            }
          });
        }

        const getAttMatches = resourceStr.match(/\{"Fn::GetAtt":\s*\[\s*"([^"]+)"\s*,\s*"[^"]+"\s*\]\}/g);
        if (getAttMatches) {
          getAttMatches.forEach(match => {
            const getAttName = JSON.parse(match)['Fn::GetAtt'][0];
            expect(resourceNames).toContain(getAttName);
          });
        }
      });
    });
  });

  describe('Security and Compliance Validation', () => {

    test('all resources should have proper update replace policies', () => {
      const resources = template.Resources;
      Object.keys(resources).forEach(resourceName => {
        const resource = resources[resourceName];
        if (resource.UpdateReplacePolicy) {
          expect(['Retain', 'Delete', 'Snapshot']).toContain(resource.UpdateReplacePolicy);
        }
      });
    });

    test('all resources should have proper tags', () => {
      const resources = template.Resources;
      Object.keys(resources).forEach(resourceName => {
        const resource = resources[resourceName];
        if (resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          expect(Array.isArray(tags)).toBe(true);
          tags.forEach((tag: any) => {
            expect(tag.Key).toBeDefined();
            expect(tag.Value).toBeDefined();
          });
        }
      });
    });

    test('KMS key should have proper key policy', () => {
      const key = template.Resources.ArtifactEncryptionKey;
      const keyPolicy = key.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toBeDefined();
      expect(Array.isArray(keyPolicy.Statement)).toBe(true);
    });

    test('S3 bucket should have proper encryption', () => {
      const bucket = template.Resources.ArtifactStoreBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
    });

    test('IAM roles should have proper assume role policies', () => {
      const iamRoles = ['CodePipelineServiceRole', 'CodeBuildServiceRole', 'ElasticBeanstalkServiceRole', 'ElasticBeanstalkInstanceRole'];
      iamRoles.forEach(roleName => {
        const role = template.Resources[roleName];
        const assumePolicy = role.Properties.AssumeRolePolicyDocument;
        expect(assumePolicy.Version).toBe('2012-10-17');
        expect(assumePolicy.Statement).toBeDefined();
        expect(Array.isArray(assumePolicy.Statement)).toBe(true);
      });
    });
  });

  describe('Template Completeness Validation', () => {
    test('template should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Metadata).toBeDefined();
    });

    test('template should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Conditions).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
      expect(template.Metadata).not.toBeNull();
    });

    test('template should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(Array.isArray(template)).toBe(false);
    });

    test('all parameter groups should be properly defined', () => {
      const paramGroups = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      expect(Array.isArray(paramGroups)).toBe(true);
      expect(paramGroups.length).toBeGreaterThan(0);

      paramGroups.forEach((group: any) => {
        expect(group.Label).toBeDefined();
        expect(group.Parameters).toBeDefined();
        expect(Array.isArray(group.Parameters)).toBe(true);
      });
    });
  });
});