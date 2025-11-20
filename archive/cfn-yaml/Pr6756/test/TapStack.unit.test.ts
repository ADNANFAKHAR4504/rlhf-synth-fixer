import * as fs from 'fs';
import * as path from 'path';
import * as yamlCfn from 'yaml-cfn';

// Helper functions to load templates
function loadPipelineTemplate(): any {
  const pipelinePath = path.join(__dirname, '../lib/TapStack.yml');
  const pipelineYaml = fs.readFileSync(pipelinePath, 'utf8');
  return yamlCfn.yamlParse(pipelineYaml);
}

function loadCrossAccountTemplate(): any {
  const crossAccountPath = path.join(__dirname, '../lib/cross-account-role.yaml');
  const crossAccountYaml = fs.readFileSync(crossAccountPath, 'utf8');
  return yamlCfn.yamlParse(crossAccountYaml);
}

describe('CI/CD Pipeline CloudFormation Templates', () => {
  let pipelineTemplate: any;
  let crossAccountTemplate: any;

  beforeAll(() => {
    pipelineTemplate = loadPipelineTemplate();
    crossAccountTemplate = loadCrossAccountTemplate();
  });

  describe('Pipeline Template Structure', () => {
    test('should have valid CloudFormation template format', () => {
      expect(pipelineTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(pipelineTemplate.Description).toBeDefined();
      expect(pipelineTemplate.Parameters).toBeDefined();
      expect(pipelineTemplate.Resources).toBeDefined();
      expect(pipelineTemplate.Outputs).toBeDefined();
    });

    test('should have all required parameters', () => {
      const params = pipelineTemplate.Parameters;
      expect(params.EnvironmentSuffix).toBeDefined();
      expect(params.SourceRepositoryName).toBeDefined();
      expect(params.SourceBranchName).toBeDefined();
      expect(params.ArtifactRetentionDays).toBeDefined();
    });

    test('should have EnvironmentSuffix parameter with default value', () => {
      const envSuffix = pipelineTemplate.Parameters.EnvironmentSuffix;
      expect(envSuffix.Type).toBe('String');
      expect(envSuffix.Default).toBe('dev');
      expect(envSuffix.Description).toBeDefined();
    });

    test('should have ArtifactRetentionDays with valid constraints', () => {
      const retention = pipelineTemplate.Parameters.ArtifactRetentionDays;
      expect(retention.Type).toBe('Number');
      expect(retention.Default).toBe(30);
      expect(retention.MinValue).toBe(1);
      expect(retention.MaxValue).toBe(365);
    });
  });

  describe('Pipeline KMS Key Configuration', () => {
    test('should create KMS key with proper encryption settings', () => {
      const kmsKey = pipelineTemplate.Resources.ArtifactEncryptionKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have proper KMS key policy statements', () => {
      const kmsKey = pipelineTemplate.Resources.ArtifactEncryptionKey;
      const policy = kmsKey.Properties.KeyPolicy;
      expect(policy.Statement.length).toBeGreaterThanOrEqual(3);

      const sids = policy.Statement.map((s: any) => s.Sid);
      expect(sids).toContain('Enable IAM User Permissions');
      expect(sids).toContain('Allow CodePipeline to use the key');
      expect(sids).toContain('Allow CodeBuild to use the key');
    });

    test('should create KMS alias with environmentSuffix', () => {
      const alias = pipelineTemplate.Resources.ArtifactEncryptionKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/pipeline-artifacts-${EnvironmentSuffix}'
      });
    });
  });

  describe('Pipeline S3 Artifact Bucket', () => {
    test('should create S3 bucket with environmentSuffix in name', () => {
      const bucket = pipelineTemplate.Resources.ArtifactBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'pipeline-artifacts-${EnvironmentSuffix}-${AWS::AccountId}'
      });
    });

    test('should have versioning enabled', () => {
      const bucket = pipelineTemplate.Resources.ArtifactBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have KMS encryption configured', () => {
      const bucket = pipelineTemplate.Resources.ArtifactBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({
        'Fn::GetAtt': ['ArtifactEncryptionKey', 'Arn']
      });
    });

    test('should have lifecycle policy configured', () => {
      const bucket = pipelineTemplate.Resources.ArtifactBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration.Rules[0];
      expect(lifecycle.Id).toBe('DeleteOldArtifacts');
      expect(lifecycle.Status).toBe('Enabled');
      expect(lifecycle.ExpirationInDays).toEqual({ Ref: 'ArtifactRetentionDays' });
      expect(lifecycle.NoncurrentVersionExpirationInDays).toBe(7);
    });

    test('should have all public access blocked', () => {
      const bucket = pipelineTemplate.Resources.ArtifactBucket;
      const blockConfig = bucket.Properties.PublicAccessBlockConfiguration;
      expect(blockConfig.BlockPublicAcls).toBe(true);
      expect(blockConfig.BlockPublicPolicy).toBe(true);
      expect(blockConfig.IgnorePublicAcls).toBe(true);
      expect(blockConfig.RestrictPublicBuckets).toBe(true);
    });

    test('should have bucket policy denying unencrypted uploads', () => {
      const policy = pipelineTemplate.Resources.ArtifactBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');

      const denyStatement = policy.Properties.PolicyDocument.Statement.find(
        (s: any) => s.Sid === 'DenyUnencryptedObjectUploads'
      );
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Effect).toBe('Deny');
      expect(denyStatement.Action).toBe('s3:PutObject');
    });
  });

  describe('Pipeline IAM Roles', () => {
    test('should create CodePipeline service role with environmentSuffix', () => {
      const role = pipelineTemplate.Resources.CodePipelineServiceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'codepipeline-service-role-${EnvironmentSuffix}'
      });
    });

    test('should have correct trust relationship for CodePipeline', () => {
      const role = pipelineTemplate.Resources.CodePipelineServiceRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('codepipeline.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should create CodeBuild service role with environmentSuffix', () => {
      const role = pipelineTemplate.Resources.CodeBuildServiceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'codebuild-service-role-${EnvironmentSuffix}'
      });
    });

    test('should have correct trust relationship for CodeBuild', () => {
      const role = pipelineTemplate.Resources.CodeBuildServiceRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('codebuild.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should create EventBridge role with environmentSuffix', () => {
      const role = pipelineTemplate.Resources.EventBridgePipelineRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'eventbridge-pipeline-role-${EnvironmentSuffix}'
      });
    });

    test('CodePipeline role should have necessary permissions', () => {
      const role = pipelineTemplate.Resources.CodePipelineServiceRole;
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('CodePipelineAccess');

      const statements = policy.PolicyDocument.Statement;
      expect(statements.length).toBeGreaterThan(0);

      const codecommitStmt = statements.find((s: any) =>
        s.Action.some((a: string) => a.includes('codecommit'))
      );
      expect(codecommitStmt).toBeDefined();
    });

    test('CodeBuild role should have CloudWatch Logs permissions', () => {
      const role = pipelineTemplate.Resources.CodeBuildServiceRole;
      const policy = role.Properties.Policies[0];
      const statements = policy.PolicyDocument.Statement;

      const logsStmt = statements.find((s: any) =>
        s.Action.includes('logs:CreateLogGroup')
      );
      expect(logsStmt).toBeDefined();
      expect(logsStmt.Action).toContain('logs:CreateLogStream');
      expect(logsStmt.Action).toContain('logs:PutLogEvents');
    });
  });

  describe('Pipeline CodeBuild Projects', () => {
    test('should create unit test project with environmentSuffix', () => {
      const project = pipelineTemplate.Resources.UnitTestProject;
      expect(project).toBeDefined();
      expect(project.Type).toBe('AWS::CodeBuild::Project');
      expect(project.Properties.Name).toEqual({
        'Fn::Sub': 'unit-test-project-${EnvironmentSuffix}'
      });
    });

    test('should create security scan project with environmentSuffix', () => {
      const project = pipelineTemplate.Resources.SecurityScanProject;
      expect(project).toBeDefined();
      expect(project.Type).toBe('AWS::CodeBuild::Project');
      expect(project.Properties.Name).toEqual({
        'Fn::Sub': 'security-scan-project-${EnvironmentSuffix}'
      });
    });

    test('unit test project should have correct build specification', () => {
      const project = pipelineTemplate.Resources.UnitTestProject;
      expect(project.Properties.Source.Type).toBe('CODEPIPELINE');
      expect(project.Properties.Source.BuildSpec).toContain('version: 0.2');
      expect(project.Properties.Source.BuildSpec).toContain('npm test');
    });

    test('security scan project should have correct build specification', () => {
      const project = pipelineTemplate.Resources.SecurityScanProject;
      expect(project.Properties.Source.Type).toBe('CODEPIPELINE');
      expect(project.Properties.Source.BuildSpec).toContain('version: 0.2');
      expect(project.Properties.Source.BuildSpec).toContain('npm audit');
    });

    test('CodeBuild projects should use small compute type', () => {
      const unitTest = pipelineTemplate.Resources.UnitTestProject;
      const securityScan = pipelineTemplate.Resources.SecurityScanProject;

      expect(unitTest.Properties.Environment.ComputeType).toBe('BUILD_GENERAL1_SMALL');
      expect(securityScan.Properties.Environment.ComputeType).toBe('BUILD_GENERAL1_SMALL');
    });

    test('CodeBuild projects should have CloudWatch Logs enabled', () => {
      const unitTest = pipelineTemplate.Resources.UnitTestProject;
      const securityScan = pipelineTemplate.Resources.SecurityScanProject;

      expect(unitTest.Properties.LogsConfig.CloudWatchLogs.Status).toBe('ENABLED');
      expect(securityScan.Properties.LogsConfig.CloudWatchLogs.Status).toBe('ENABLED');
    });

    test('CodeBuild projects should use KMS encryption', () => {
      const unitTest = pipelineTemplate.Resources.UnitTestProject;
      const securityScan = pipelineTemplate.Resources.SecurityScanProject;

      expect(unitTest.Properties.EncryptionKey).toEqual({
        'Fn::GetAtt': ['ArtifactEncryptionKey', 'Arn']
      });
      expect(securityScan.Properties.EncryptionKey).toEqual({
        'Fn::GetAtt': ['ArtifactEncryptionKey', 'Arn']
      });
    });
  });

  describe('Pipeline SNS and EventBridge Configuration', () => {
    test('should create SNS topic with environmentSuffix', () => {
      const topic = pipelineTemplate.Resources.PipelineNotificationTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.TopicName).toEqual({
        'Fn::Sub': 'pipeline-notifications-${EnvironmentSuffix}'
      });
    });

    test('SNS topic should be encrypted with KMS', () => {
      const topic = pipelineTemplate.Resources.PipelineNotificationTopic;
      expect(topic.Properties.KmsMasterKeyId).toEqual({ Ref: 'ArtifactEncryptionKey' });
    });

    test('should create EventBridge rule for pipeline state changes', () => {
      const rule = pipelineTemplate.Resources.PipelineStateChangeRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Events::Rule');
      expect(rule.Properties.Name).toEqual({
        'Fn::Sub': 'pipeline-state-change-${EnvironmentSuffix}'
      });
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('should create EventBridge rule for pipeline failures', () => {
      const rule = pipelineTemplate.Resources.PipelineFailureRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Events::Rule');
      expect(rule.Properties.Name).toEqual({
        'Fn::Sub': 'pipeline-failure-${EnvironmentSuffix}'
      });
    });

    test('pipeline state change rule should target SNS topic', () => {
      const rule = pipelineTemplate.Resources.PipelineStateChangeRule;
      expect(rule.Properties.Targets).toHaveLength(1);
      expect(rule.Properties.Targets[0].Arn).toEqual({ Ref: 'PipelineNotificationTopic' });
    });

    test('should have SNS topic policy allowing EventBridge', () => {
      const policy = pipelineTemplate.Resources.PipelineNotificationTopicPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::SNS::TopicPolicy');

      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('events.amazonaws.com');
      expect(statement.Action).toBe('sns:Publish');
    });

    test('should create pipeline trigger rule with environmentSuffix', () => {
      const rule = pipelineTemplate.Resources.PipelineTriggerRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::Events::Rule');
      expect(rule.Properties.Name).toEqual({
        'Fn::Sub': 'pipeline-trigger-${EnvironmentSuffix}'
      });
    });
  });

  describe('Pipeline CodePipeline Configuration', () => {
    test('should create CodePipeline with environmentSuffix', () => {
      const pipeline = pipelineTemplate.Resources.CodePipeline;
      expect(pipeline).toBeDefined();
      expect(pipeline.Type).toBe('AWS::CodePipeline::Pipeline');
      expect(pipeline.Properties.Name).toEqual({
        'Fn::Sub': 'cicd-pipeline-${EnvironmentSuffix}'
      });
    });

    test('should have correct artifact store configuration', () => {
      const pipeline = pipelineTemplate.Resources.CodePipeline;
      const artifactStore = pipeline.Properties.ArtifactStore;
      expect(artifactStore.Type).toBe('S3');
      expect(artifactStore.Location).toEqual({ Ref: 'ArtifactBucket' });
      expect(artifactStore.EncryptionKey.Type).toBe('KMS');
    });

    test('should have all required stages', () => {
      const pipeline = pipelineTemplate.Resources.CodePipeline;
      const stages = pipeline.Properties.Stages;
      expect(stages).toHaveLength(3);

      const stageNames = stages.map((s: any) => s.Name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Test');
    });

    test('Source stage should use CodeCommit', () => {
      const pipeline = pipelineTemplate.Resources.CodePipeline;
      const sourceStage = pipeline.Properties.Stages.find((s: any) => s.Name === 'Source');
      const sourceAction = sourceStage.Actions[0];

      expect(sourceAction.ActionTypeId.Provider).toBe('CodeCommit');
      expect(sourceAction.Configuration.RepositoryName).toEqual({ Ref: 'SourceRepositoryName' });
      expect(sourceAction.Configuration.BranchName).toEqual({ Ref: 'SourceBranchName' });
      expect(sourceAction.Configuration.PollForSourceChanges).toBe(false);
    });

    test('Build stage should use CodeBuild for unit tests', () => {
      const pipeline = pipelineTemplate.Resources.CodePipeline;
      const buildStage = pipeline.Properties.Stages.find((s: any) => s.Name === 'Build');
      const buildAction = buildStage.Actions[0];

      expect(buildAction.ActionTypeId.Provider).toBe('CodeBuild');
      expect(buildAction.Configuration.ProjectName).toEqual({ Ref: 'UnitTestProject' });
    });

    test('Test stage should use CodeBuild for security scanning', () => {
      const pipeline = pipelineTemplate.Resources.CodePipeline;
      const testStage = pipeline.Properties.Stages.find((s: any) => s.Name === 'Test');
      const testAction = testStage.Actions[0];

      expect(testAction.ActionTypeId.Provider).toBe('CodeBuild');
      expect(testAction.Configuration.ProjectName).toEqual({ Ref: 'SecurityScanProject' });
    });
  });

  describe('Pipeline Template Outputs', () => {
    test('should export pipeline name', () => {
      const output = pipelineTemplate.Outputs.PipelineName;
      expect(output).toBeDefined();
      expect(output.Description).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'CodePipeline' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-PipelineName'
      });
    });

    test('should export artifact bucket name', () => {
      const output = pipelineTemplate.Outputs.ArtifactBucketName;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'ArtifactBucket' });
    });

    test('should export KMS key ID', () => {
      const output = pipelineTemplate.Outputs.KMSKeyId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ArtifactEncryptionKey', 'Arn']
      });
    });

    test('should export SNS topic ARN', () => {
      const output = pipelineTemplate.Outputs.NotificationTopicArn;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'PipelineNotificationTopic' });
    });

    test('should provide pipeline console URL', () => {
      const output = pipelineTemplate.Outputs.CodePipelineUrl;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${CodePipeline}/view'
      });
    });
  });

  describe('Cross-Account Role Template Structure', () => {
    test('should have valid CloudFormation template format', () => {
      expect(crossAccountTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(crossAccountTemplate.Description).toBeDefined();
      expect(crossAccountTemplate.Parameters).toBeDefined();
      expect(crossAccountTemplate.Resources).toBeDefined();
      expect(crossAccountTemplate.Outputs).toBeDefined();
    });

    test('should have all required parameters', () => {
      const params = crossAccountTemplate.Parameters;
      expect(params.EnvironmentSuffix).toBeDefined();
      expect(params.PipelineAccountId).toBeDefined();
      expect(params.ArtifactBucketName).toBeDefined();
      expect(params.KMSKeyArn).toBeDefined();
    });

    test('should create cross-account role with environmentSuffix', () => {
      const role = crossAccountTemplate.Resources.CrossAccountDeployRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'cross-account-deploy-role-${EnvironmentSuffix}'
      });
    });

    test('should have correct trust relationships', () => {
      const role = crossAccountTemplate.Resources.CrossAccountDeployRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement).toHaveLength(2);

      const pipelineTrust = trustPolicy.Statement.find((s: any) =>
        s.Principal.AWS !== undefined
      );
      expect(pipelineTrust).toBeDefined();
      expect(pipelineTrust.Principal.AWS).toEqual({
        'Fn::Sub': 'arn:aws:iam::${PipelineAccountId}:root'
      });

      const cfnTrust = trustPolicy.Statement.find((s: any) =>
        s.Principal.Service !== undefined
      );
      expect(cfnTrust).toBeDefined();
      expect(cfnTrust.Principal.Service).toBe('cloudformation.amazonaws.com');
    });

    test('should have PowerUserAccess managed policy', () => {
      const role = crossAccountTemplate.Resources.CrossAccountDeployRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/PowerUserAccess');
    });

    test('should have policy for S3 artifact access', () => {
      const role = crossAccountTemplate.Resources.CrossAccountDeployRole;
      const policy = role.Properties.Policies[0];
      const statements = policy.PolicyDocument.Statement;

      const s3Statement = statements.find((s: any) =>
        s.Action.includes('s3:GetObject')
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Action).toContain('s3:GetObjectVersion');
      expect(s3Statement.Action).toContain('s3:ListBucket');
    });

    test('should have policy for KMS decryption', () => {
      const role = crossAccountTemplate.Resources.CrossAccountDeployRole;
      const policy = role.Properties.Policies[0];
      const statements = policy.PolicyDocument.Statement;

      const kmsStatement = statements.find((s: any) =>
        s.Action.includes('kms:Decrypt')
      );
      expect(kmsStatement).toBeDefined();
      expect(kmsStatement.Action).toContain('kms:DescribeKey');
      expect(kmsStatement.Resource).toEqual({ Ref: 'KMSKeyArn' });
    });

    test('should have policy for CloudFormation operations', () => {
      const role = crossAccountTemplate.Resources.CrossAccountDeployRole;
      const policy = role.Properties.Policies[0];
      const statements = policy.PolicyDocument.Statement;

      const cfnStatement = statements.find((s: any) =>
        s.Action.includes('cloudformation:CreateStack')
      );
      expect(cfnStatement).toBeDefined();
      expect(cfnStatement.Action).toContain('cloudformation:UpdateStack');
      expect(cfnStatement.Action).toContain('cloudformation:DescribeStacks');
    });

    test('should have IAM PassRole permission with condition', () => {
      const role = crossAccountTemplate.Resources.CrossAccountDeployRole;
      const policy = role.Properties.Policies[0];
      const statements = policy.PolicyDocument.Statement;

      const passRoleStatement = statements.find((s: any) =>
        s.Action.includes('iam:PassRole')
      );
      expect(passRoleStatement).toBeDefined();
      expect(passRoleStatement.Condition).toBeDefined();
      expect(passRoleStatement.Condition.StringEquals['iam:PassedToService']).toBe('cloudformation.amazonaws.com');
    });

    test('should export cross-account role ARN', () => {
      const output = crossAccountTemplate.Outputs.CrossAccountRoleArn;
      expect(output).toBeDefined();
      expect(output.Description).toBeDefined();
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['CrossAccountDeployRole', 'Arn']
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-CrossAccountRole'
      });
    });
  });

  describe('Template Security and Best Practices', () => {
    test('no resources should have DeletionPolicy Retain', () => {
      const pipelineResources = Object.keys(pipelineTemplate.Resources);
      pipelineResources.forEach((resourceName) => {
        const resource = pipelineTemplate.Resources[resourceName];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });

      const crossAccountResources = Object.keys(crossAccountTemplate.Resources);
      crossAccountResources.forEach((resourceName) => {
        const resource = crossAccountTemplate.Resources[resourceName];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('all resource names should include environmentSuffix reference', () => {
      const pipelineResources = pipelineTemplate.Resources;
      const namingResources = [
        'ArtifactEncryptionKeyAlias',
        'ArtifactBucket',
        'CodePipelineServiceRole',
        'CodeBuildServiceRole',
        'UnitTestProject',
        'SecurityScanProject',
        'PipelineNotificationTopic',
        'PipelineStateChangeRule',
        'PipelineFailureRule',
        'CodePipeline',
        'PipelineTriggerRule',
        'EventBridgePipelineRole'
      ];

      namingResources.forEach((resourceName) => {
        const resource = pipelineResources[resourceName];
        const nameProperty = resource.Properties.Name ||
                          resource.Properties.RoleName ||
                          resource.Properties.TopicName ||
                          resource.Properties.AliasName ||
                          resource.Properties.BucketName;

        if (typeof nameProperty === 'object' && nameProperty['Fn::Sub']) {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('KMS key should have rotation enabled', () => {
      const kmsKey = pipelineTemplate.Resources.ArtifactEncryptionKey;
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('S3 bucket should enforce encryption', () => {
      const policy = pipelineTemplate.Resources.ArtifactBucketPolicy;
      const denyStatement = policy.Properties.PolicyDocument.Statement.find(
        (s: any) => s.Effect === 'Deny' && s.Action === 's3:PutObject'
      );
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Condition.StringNotEquals['s3:x-amz-server-side-encryption']).toBe('aws:kms');
    });

    test('CodeBuild projects should have proper environment variables', () => {
      const unitTest = pipelineTemplate.Resources.UnitTestProject;
      const securityScan = pipelineTemplate.Resources.SecurityScanProject;

      const unitTestEnvVars = unitTest.Properties.Environment.EnvironmentVariables;
      const securityScanEnvVars = securityScan.Properties.Environment.EnvironmentVariables;

      expect(unitTestEnvVars.find((v: any) => v.Name === 'ENVIRONMENT')).toBeDefined();
      expect(securityScanEnvVars.find((v: any) => v.Name === 'ENVIRONMENT')).toBeDefined();
    });

    test('pipeline should not poll for source changes', () => {
      const pipeline = pipelineTemplate.Resources.CodePipeline;
      const sourceStage = pipeline.Properties.Stages.find((s: any) => s.Name === 'Source');
      const sourceAction = sourceStage.Actions[0];
      expect(sourceAction.Configuration.PollForSourceChanges).toBe(false);
    });

    test('EventBridge trigger rule should be enabled', () => {
      const rule = pipelineTemplate.Resources.PipelineTriggerRule;
      expect(rule.Properties.State).toBe('ENABLED');
    });
  });

  describe('Template Resource Count', () => {
    test('pipeline template should have expected number of resources', () => {
      const resourceCount = Object.keys(pipelineTemplate.Resources).length;
      expect(resourceCount).toBe(15);
    });

    test('cross-account template should have expected number of resources', () => {
      const resourceCount = Object.keys(crossAccountTemplate.Resources).length;
      expect(resourceCount).toBe(1);
    });

    test('pipeline template should have expected number of outputs', () => {
      const outputCount = Object.keys(pipelineTemplate.Outputs).length;
      expect(outputCount).toBe(5);
    });

    test('cross-account template should have expected number of outputs', () => {
      const outputCount = Object.keys(crossAccountTemplate.Outputs).length;
      expect(outputCount).toBe(1);
    });

    test('pipeline template should have expected number of parameters', () => {
      const paramCount = Object.keys(pipelineTemplate.Parameters).length;
      expect(paramCount).toBe(4);
    });

    test('cross-account template should have expected number of parameters', () => {
      const paramCount = Object.keys(crossAccountTemplate.Parameters).length;
      expect(paramCount).toBe(4);
    });
  });
});
