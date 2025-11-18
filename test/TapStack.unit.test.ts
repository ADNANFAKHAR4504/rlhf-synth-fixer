import * as templateUtils from '../lib/templates';

describe('CI/CD Pipeline CloudFormation Templates', () => {
  let pipelineTemplate: any;
  let crossAccountTemplate: any;

  beforeAll(() => {
    // Load templates using the utility functions for proper code coverage
    pipelineTemplate = templateUtils.loadPipelineTemplate();
    crossAccountTemplate = templateUtils.loadCrossAccountTemplate();
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
      expect(params.StagingAccountId).toBeDefined();
      expect(params.ProductionAccountId).toBeDefined();
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
      expect(policy.Statement).toHaveLength(5);

      const sids = policy.Statement.map((s: any) => s.Sid);
      expect(sids).toContain('Enable IAM User Permissions');
      expect(sids).toContain('Allow CodePipeline to use the key');
      expect(sids).toContain('Allow CodeBuild to use the key');
      expect(sids).toContain('Allow cross-account access for staging');
      expect(sids).toContain('Allow cross-account access for production');
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

    test('should allow cross-account access', () => {
      const policy = pipelineTemplate.Resources.ArtifactBucketPolicy;
      const allowStatement = policy.Properties.PolicyDocument.Statement.find(
        (s: any) => s.Sid === 'AllowCrossAccountAccess'
      );
      expect(allowStatement).toBeDefined();
      expect(allowStatement.Effect).toBe('Allow');
      expect(allowStatement.Action).toContain('s3:GetObject');
      expect(allowStatement.Action).toContain('s3:GetObjectVersion');
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

      // Check for CodeCommit permissions
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
      expect(stages).toHaveLength(6);

      const stageNames = stages.map((s: any) => s.Name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Test');
      expect(stageNames).toContain('DeployToStaging');
      expect(stageNames).toContain('ApprovalForProduction');
      expect(stageNames).toContain('DeployToProduction');
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

    test('Deploy to Staging should use CloudFormation', () => {
      const pipeline = pipelineTemplate.Resources.CodePipeline;
      const stagingStage = pipeline.Properties.Stages.find((s: any) => s.Name === 'DeployToStaging');
      const deployAction = stagingStage.Actions[0];

      expect(deployAction.ActionTypeId.Provider).toBe('CloudFormation');
      expect(deployAction.Configuration.ActionMode).toBe('CREATE_UPDATE');
      expect(deployAction.Configuration.StackName).toEqual({
        'Fn::Sub': 'application-stack-staging-${EnvironmentSuffix}'
      });
    });

    test('Manual approval stage should be configured correctly', () => {
      const pipeline = pipelineTemplate.Resources.CodePipeline;
      const approvalStage = pipeline.Properties.Stages.find((s: any) => s.Name === 'ApprovalForProduction');
      const approvalAction = approvalStage.Actions[0];

      expect(approvalAction.ActionTypeId.Provider).toBe('Manual');
      expect(approvalAction.Configuration.NotificationArn).toEqual({ Ref: 'PipelineNotificationTopic' });
      expect(approvalAction.Configuration.CustomData).toBeDefined();
    });

    test('Deploy to Production should use CloudFormation', () => {
      const pipeline = pipelineTemplate.Resources.CodePipeline;
      const prodStage = pipeline.Properties.Stages.find((s: any) => s.Name === 'DeployToProduction');
      const deployAction = prodStage.Actions[0];

      expect(deployAction.ActionTypeId.Provider).toBe('CloudFormation');
      expect(deployAction.Configuration.ActionMode).toBe('CREATE_UPDATE');
      expect(deployAction.Configuration.StackName).toEqual({
        'Fn::Sub': 'application-stack-production-${EnvironmentSuffix}'
      });
    });

    test('Cross-account deployments should reference correct roles', () => {
      const pipeline = pipelineTemplate.Resources.CodePipeline;
      const stagingStage = pipeline.Properties.Stages.find((s: any) => s.Name === 'DeployToStaging');
      const prodStage = pipeline.Properties.Stages.find((s: any) => s.Name === 'DeployToProduction');

      expect(stagingStage.Actions[0].RoleArn).toEqual({
        'Fn::Sub': 'arn:aws:iam::${StagingAccountId}:role/cross-account-deploy-role-${EnvironmentSuffix}'
      });
      expect(prodStage.Actions[0].RoleArn).toEqual({
        'Fn::Sub': 'arn:aws:iam::${ProductionAccountId}:role/cross-account-deploy-role-${EnvironmentSuffix}'
      });
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

    test('should export cross-account role ARNs', () => {
      const stagingRole = pipelineTemplate.Outputs.CrossAccountDeployRoleStaging;
      const prodRole = pipelineTemplate.Outputs.CrossAccountDeployRoleProduction;

      expect(stagingRole).toBeDefined();
      expect(prodRole).toBeDefined();
      expect(stagingRole.Value).toEqual({
        'Fn::Sub': 'arn:aws:iam::${StagingAccountId}:role/cross-account-deploy-role-${EnvironmentSuffix}'
      });
      expect(prodRole.Value).toEqual({
        'Fn::Sub': 'arn:aws:iam::${ProductionAccountId}:role/cross-account-deploy-role-${EnvironmentSuffix}'
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

    test('cross-account deployments should have proper capabilities', () => {
      const pipeline = pipelineTemplate.Resources.CodePipeline;
      const stagingStage = pipeline.Properties.Stages.find((s: any) => s.Name === 'DeployToStaging');
      const prodStage = pipeline.Properties.Stages.find((s: any) => s.Name === 'DeployToProduction');

      expect(stagingStage.Actions[0].Configuration.Capabilities).toBe('CAPABILITY_IAM,CAPABILITY_NAMED_IAM');
      expect(prodStage.Actions[0].Configuration.Capabilities).toBe('CAPABILITY_IAM,CAPABILITY_NAMED_IAM');
    });
  });

  describe('Template Resource Count', () => {
    test('pipeline template should have expected number of resources', () => {
      const resourceCount = Object.keys(pipelineTemplate.Resources).length;
      expect(resourceCount).toBe(15); // Verify all resources are present
    });

    test('cross-account template should have expected number of resources', () => {
      const resourceCount = Object.keys(crossAccountTemplate.Resources).length;
      expect(resourceCount).toBe(1); // Only the cross-account role
    });

    test('pipeline template should have expected number of outputs', () => {
      const outputCount = Object.keys(pipelineTemplate.Outputs).length;
      expect(outputCount).toBe(7);
    });

    test('cross-account template should have expected number of outputs', () => {
      const outputCount = Object.keys(crossAccountTemplate.Outputs).length;
      expect(outputCount).toBe(1);
    });
  });

  describe('Template Utility Functions', () => {
    test('validatePipelineTemplate should return true for valid template', () => {
      const isValid = templateUtils.validatePipelineTemplate(pipelineTemplate);
      expect(isValid).toBe(true);
    });

    test('validateCrossAccountTemplate should return true for valid template', () => {
      const isValid = templateUtils.validateCrossAccountTemplate(crossAccountTemplate);
      expect(isValid).toBe(true);
    });

    test('checkEnvironmentSuffixUsage should find resources with suffix', () => {
      const result = templateUtils.checkEnvironmentSuffixUsage(pipelineTemplate);
      expect(result.passed).toBe(true);
      expect(result.resources.length).toBeGreaterThan(0);
    });

    test('checkNoDeletionPolicyRetain should pass for clean templates', () => {
      const pipelineResult = templateUtils.checkNoDeletionPolicyRetain(pipelineTemplate);
      expect(pipelineResult.passed).toBe(true);
      expect(pipelineResult.violators).toHaveLength(0);

      const crossAccountResult = templateUtils.checkNoDeletionPolicyRetain(crossAccountTemplate);
      expect(crossAccountResult.passed).toBe(true);
      expect(crossAccountResult.violators).toHaveLength(0);
    });

    test('getResourceCount should return correct count', () => {
      const pipelineCount = templateUtils.getResourceCount(pipelineTemplate);
      const crossAccountCount = templateUtils.getResourceCount(crossAccountTemplate);
      expect(pipelineCount).toBe(15);
      expect(crossAccountCount).toBe(1);
    });

    test('getOutputCount should return correct count', () => {
      const pipelineCount = templateUtils.getOutputCount(pipelineTemplate);
      const crossAccountCount = templateUtils.getOutputCount(crossAccountTemplate);
      expect(pipelineCount).toBe(7);
      expect(crossAccountCount).toBe(1);
    });

    test('getParameterCount should return correct count', () => {
      const pipelineCount = templateUtils.getParameterCount(pipelineTemplate);
      const crossAccountCount = templateUtils.getParameterCount(crossAccountTemplate);
      expect(pipelineCount).toBe(6);
      expect(crossAccountCount).toBe(4);
    });

    test('hasKMSEncryption should detect KMS with rotation enabled', () => {
      const hasKMS = templateUtils.hasKMSEncryption(pipelineTemplate);
      expect(hasKMS).toBe(true);
    });

    test('hasS3Versioning should detect versioned S3 bucket', () => {
      const hasVersioning = templateUtils.hasS3Versioning(pipelineTemplate);
      expect(hasVersioning).toBe(true);
    });

    test('hasPublicAccessBlock should detect S3 public access block', () => {
      const hasBlock = templateUtils.hasPublicAccessBlock(pipelineTemplate);
      expect(hasBlock).toBe(true);
    });

    test('getPipelineStageCount should return correct number of stages', () => {
      const stageCount = templateUtils.getPipelineStageCount(pipelineTemplate);
      expect(stageCount).toBe(6);
    });

    test('hasManualApprovalStage should detect manual approval', () => {
      const hasApproval = templateUtils.hasManualApprovalStage(pipelineTemplate);
      expect(hasApproval).toBe(true);
    });

    test('validatePipelineTemplate should return false for invalid template', () => {
      const invalidTemplate = { AWSTemplateFormatVersion: '2010-09-09' };
      const isValid = templateUtils.validatePipelineTemplate(invalidTemplate);
      expect(isValid).toBe(false);
    });

    test('validateCrossAccountTemplate should return false for invalid template', () => {
      const invalidTemplate = { AWSTemplateFormatVersion: '2010-09-09' };
      const isValid = templateUtils.validateCrossAccountTemplate(invalidTemplate);
      expect(isValid).toBe(false);
    });

    test('checkEnvironmentSuffixUsage should handle empty template', () => {
      const result = templateUtils.checkEnvironmentSuffixUsage({});
      expect(result.passed).toBe(false);
      expect(result.resources).toHaveLength(0);
    });

    test('checkNoDeletionPolicyRetain should detect Retain policies', () => {
      const templateWithRetain = {
        Resources: {
          TestResource: {
            Type: 'AWS::S3::Bucket',
            DeletionPolicy: 'Retain'
          }
        }
      };
      const result = templateUtils.checkNoDeletionPolicyRetain(templateWithRetain);
      expect(result.passed).toBe(false);
      expect(result.violators).toContain('TestResource');
    });

    test('getResourceCount should handle empty template', () => {
      const count = templateUtils.getResourceCount({});
      expect(count).toBe(0);
    });

    test('getOutputCount should handle empty template', () => {
      const count = templateUtils.getOutputCount({});
      expect(count).toBe(0);
    });

    test('getParameterCount should handle empty template', () => {
      const count = templateUtils.getParameterCount({});
      expect(count).toBe(0);
    });

    test('hasKMSEncryption should return false for template without KMS', () => {
      const hasKMS = templateUtils.hasKMSEncryption({});
      expect(hasKMS).toBe(false);
    });

    test('hasS3Versioning should return false for template without S3', () => {
      const hasVersioning = templateUtils.hasS3Versioning({});
      expect(hasVersioning).toBe(false);
    });

    test('hasPublicAccessBlock should return false for template without S3', () => {
      const hasBlock = templateUtils.hasPublicAccessBlock({});
      expect(hasBlock).toBe(false);
    });

    test('getPipelineStageCount should return 0 for template without pipeline', () => {
      const count = templateUtils.getPipelineStageCount({});
      expect(count).toBe(0);
    });

    test('hasManualApprovalStage should return false for template without pipeline', () => {
      const hasApproval = templateUtils.hasManualApprovalStage({});
      expect(hasApproval).toBe(false);
    });

    test('validatePipelineTemplate should check all required parameters', () => {
      const templateMissingParam = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {},
        Parameters: {
          EnvironmentSuffix: {},
          StagingAccountId: {}
          // Missing other params
        },
        Outputs: {}
      };
      const isValid = templateUtils.validatePipelineTemplate(templateMissingParam);
      expect(isValid).toBe(false);
    });

    test('validatePipelineTemplate should check all required resources', () => {
      const templateMissingResource = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          ArtifactEncryptionKey: {}
          // Missing other resources
        },
        Parameters: {
          EnvironmentSuffix: {},
          StagingAccountId: {},
          ProductionAccountId: {},
          SourceRepositoryName: {},
          SourceBranchName: {},
          ArtifactRetentionDays: {}
        },
        Outputs: {}
      };
      const isValid = templateUtils.validatePipelineTemplate(templateMissingResource);
      expect(isValid).toBe(false);
    });

    test('validatePipelineTemplate should check all required outputs', () => {
      const templateMissingOutput = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          ArtifactEncryptionKey: {},
          ArtifactBucket: {},
          CodePipeline: {},
          CodePipelineServiceRole: {},
          CodeBuildServiceRole: {},
          UnitTestProject: {},
          SecurityScanProject: {},
          PipelineNotificationTopic: {},
          PipelineStateChangeRule: {}
        },
        Parameters: {
          EnvironmentSuffix: {},
          StagingAccountId: {},
          ProductionAccountId: {},
          SourceRepositoryName: {},
          SourceBranchName: {},
          ArtifactRetentionDays: {}
        },
        Outputs: {
          PipelineName: {}
          // Missing other outputs
        }
      };
      const isValid = templateUtils.validatePipelineTemplate(templateMissingOutput);
      expect(isValid).toBe(false);
    });

    test('validateCrossAccountTemplate should check all required parameters', () => {
      const templateMissingParam = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {},
        Parameters: {
          EnvironmentSuffix: {}
          // Missing other params
        },
        Outputs: {}
      };
      const isValid = templateUtils.validateCrossAccountTemplate(templateMissingParam);
      expect(isValid).toBe(false);
    });

    test('checkNoDeletionPolicyRetain should detect UpdateReplacePolicy Retain', () => {
      const templateWithRetain = {
        Resources: {
          TestResource: {
            Type: 'AWS::S3::Bucket',
            UpdateReplacePolicy: 'Retain'
          }
        }
      };
      const result = templateUtils.checkNoDeletionPolicyRetain(templateWithRetain);
      expect(result.passed).toBe(false);
      expect(result.violators).toContain('TestResource');
    });

    test('hasKMSEncryption should return false for KMS without rotation', () => {
      const templateWithoutRotation = {
        Resources: {
          TestKMS: {
            Type: 'AWS::KMS::Key',
            Properties: {
              EnableKeyRotation: false
            }
          }
        }
      };
      const hasKMS = templateUtils.hasKMSEncryption(templateWithoutRotation);
      expect(hasKMS).toBe(false);
    });

    test('hasS3Versioning should return false for S3 without versioning', () => {
      const templateWithoutVersioning = {
        Resources: {
          TestBucket: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              VersioningConfiguration: {
                Status: 'Suspended'
              }
            }
          }
        }
      };
      const hasVersioning = templateUtils.hasS3Versioning(templateWithoutVersioning);
      expect(hasVersioning).toBe(false);
    });

    test('hasPublicAccessBlock should return false for incomplete block config', () => {
      const templateWithPartialBlock = {
        Resources: {
          TestBucket: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
                BlockPublicPolicy: false
              }
            }
          }
        }
      };
      const hasBlock = templateUtils.hasPublicAccessBlock(templateWithPartialBlock);
      expect(hasBlock).toBe(false);
    });

    test('hasManualApprovalStage should return false for pipeline without approval', () => {
      const templateWithoutApproval = {
        Resources: {
          TestPipeline: {
            Type: 'AWS::CodePipeline::Pipeline',
            Properties: {
              Stages: [
                {
                  Name: 'Source',
                  Actions: [
                    {
                      ActionTypeId: {
                        Provider: 'CodeCommit'
                      }
                    }
                  ]
                }
              ]
            }
          }
        }
      };
      const hasApproval = templateUtils.hasManualApprovalStage(templateWithoutApproval);
      expect(hasApproval).toBe(false);
    });

    test('validatePipelineTemplate should return false when missing AWSTemplateFormatVersion', () => {
      const template = {
        Resources: {},
        Parameters: {},
        Outputs: {}
      };
      const isValid = templateUtils.validatePipelineTemplate(template);
      expect(isValid).toBe(false);
    });

    test('validatePipelineTemplate should return false when missing Resources', () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        Parameters: {},
        Outputs: {}
      };
      const isValid = templateUtils.validatePipelineTemplate(template);
      expect(isValid).toBe(false);
    });

    test('validatePipelineTemplate should return false when missing Parameters', () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {},
        Outputs: {}
      };
      const isValid = templateUtils.validatePipelineTemplate(template);
      expect(isValid).toBe(false);
    });

    test('validatePipelineTemplate should return false when missing Outputs', () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {},
        Parameters: {}
      };
      const isValid = templateUtils.validatePipelineTemplate(template);
      expect(isValid).toBe(false);
    });

    test('validateCrossAccountTemplate should return false when missing AWSTemplateFormatVersion', () => {
      const template = {
        Resources: {},
        Parameters: {},
        Outputs: {}
      };
      const isValid = templateUtils.validateCrossAccountTemplate(template);
      expect(isValid).toBe(false);
    });

    test('validateCrossAccountTemplate should return false when missing Resources', () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        Parameters: {},
        Outputs: {}
      };
      const isValid = templateUtils.validateCrossAccountTemplate(template);
      expect(isValid).toBe(false);
    });

    test('validateCrossAccountTemplate should return false when missing Parameters', () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {},
        Outputs: {}
      };
      const isValid = templateUtils.validateCrossAccountTemplate(template);
      expect(isValid).toBe(false);
    });

    test('validateCrossAccountTemplate should return false when missing Outputs', () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {},
        Parameters: {}
      };
      const isValid = templateUtils.validateCrossAccountTemplate(template);
      expect(isValid).toBe(false);
    });

    test('validateCrossAccountTemplate should return false when missing CrossAccountDeployRole', () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {},
        Parameters: {
          EnvironmentSuffix: {},
          PipelineAccountId: {},
          ArtifactBucketName: {},
          KMSKeyArn: {}
        },
        Outputs: {}
      };
      const isValid = templateUtils.validateCrossAccountTemplate(template);
      expect(isValid).toBe(false);
    });

    test('validateCrossAccountTemplate should return false when missing CrossAccountRoleArn output', () => {
      const template = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          CrossAccountDeployRole: {}
        },
        Parameters: {
          EnvironmentSuffix: {},
          PipelineAccountId: {},
          ArtifactBucketName: {},
          KMSKeyArn: {}
        },
        Outputs: {}
      };
      const isValid = templateUtils.validateCrossAccountTemplate(template);
      expect(isValid).toBe(false);
    });

    test('checkEnvironmentSuffixUsage should check all name properties', () => {
      const template = {
        Resources: {
          Resource1: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              BucketName: { 'Fn::Sub': 'bucket-${EnvironmentSuffix}' }
            }
          },
          Resource2: {
            Type: 'AWS::IAM::Role',
            Properties: {
              RoleName: { 'Fn::Sub': 'role-${EnvironmentSuffix}' }
            }
          },
          Resource3: {
            Type: 'AWS::SNS::Topic',
            Properties: {
              TopicName: { 'Fn::Sub': 'topic-${EnvironmentSuffix}' }
            }
          },
          Resource4: {
            Type: 'AWS::KMS::Alias',
            Properties: {
              AliasName: { 'Fn::Sub': 'alias/key-${EnvironmentSuffix}' }
            }
          }
        }
      };
      const result = templateUtils.checkEnvironmentSuffixUsage(template);
      expect(result.passed).toBe(true);
      expect(result.resources).toHaveLength(4);
    });

    test('checkEnvironmentSuffixUsage should handle resources without naming properties', () => {
      const template = {
        Resources: {
          Resource1: {
            Type: 'AWS::Lambda::Function',
            Properties: {
              Handler: 'index.handler'
            }
          }
        }
      };
      const result = templateUtils.checkEnvironmentSuffixUsage(template);
      expect(result.passed).toBe(false);
      expect(result.resources).toHaveLength(0);
    });

    test('hasKMSEncryption should check multiple resources', () => {
      const template = {
        Resources: {
          OtherResource: {
            Type: 'AWS::S3::Bucket'
          },
          KMSKey: {
            Type: 'AWS::KMS::Key',
            Properties: {
              EnableKeyRotation: true
            }
          }
        }
      };
      const hasKMS = templateUtils.hasKMSEncryption(template);
      expect(hasKMS).toBe(true);
    });

    test('hasS3Versioning should check multiple resources', () => {
      const template = {
        Resources: {
          OtherResource: {
            Type: 'AWS::IAM::Role'
          },
          Bucket: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              VersioningConfiguration: {
                Status: 'Enabled'
              }
            }
          }
        }
      };
      const hasVersioning = templateUtils.hasS3Versioning(template);
      expect(hasVersioning).toBe(true);
    });

    test('hasPublicAccessBlock should check multiple resources', () => {
      const template = {
        Resources: {
          OtherResource: {
            Type: 'AWS::IAM::Role'
          },
          Bucket: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
                BlockPublicPolicy: true,
                IgnorePublicAcls: true,
                RestrictPublicBuckets: true
              }
            }
          }
        }
      };
      const hasBlock = templateUtils.hasPublicAccessBlock(template);
      expect(hasBlock).toBe(true);
    });

    test('getPipelineStageCount should check multiple resources', () => {
      const template = {
        Resources: {
          OtherResource: {
            Type: 'AWS::S3::Bucket'
          },
          Pipeline: {
            Type: 'AWS::CodePipeline::Pipeline',
            Properties: {
              Stages: [
                { Name: 'Source' },
                { Name: 'Build' }
              ]
            }
          }
        }
      };
      const count = templateUtils.getPipelineStageCount(template);
      expect(count).toBe(2);
    });

    test('hasManualApprovalStage should check multiple resources and stages', () => {
      const template = {
        Resources: {
          OtherResource: {
            Type: 'AWS::S3::Bucket'
          },
          Pipeline: {
            Type: 'AWS::CodePipeline::Pipeline',
            Properties: {
              Stages: [
                {
                  Name: 'Source',
                  Actions: [{ ActionTypeId: { Provider: 'CodeCommit' } }]
                },
                {
                  Name: 'Approval',
                  Actions: [{ ActionTypeId: { Provider: 'Manual' } }]
                }
              ]
            }
          }
        }
      };
      const hasApproval = templateUtils.hasManualApprovalStage(template);
      expect(hasApproval).toBe(true);
    });
  });
});
