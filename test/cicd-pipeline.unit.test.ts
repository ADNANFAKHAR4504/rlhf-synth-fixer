import fs from 'fs';
import path from 'path';

describe('CI/CD Pipeline CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/cicd-pipeline.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have appropriate description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('CI/CD pipeline');
      expect(template.Description).toContain('Blue/Green');
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const requiredParams = [
        'EnvironmentSuffix',
        'GitHubToken',
        'GitHubOwner',
        'RepositoryName',
        'BranchName',
        'NotificationEmail',
        'ECSClusterNameStaging',
        'ECSServiceNameStaging',
        'ECSClusterNameProduction',
        'ECSServiceNameProduction',
      ];

      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('GitHubToken parameter should be marked NoEcho', () => {
      const param = template.Parameters.GitHubToken;
      expect(param.NoEcho).toBe(true);
    });

    test('BranchName parameter should have default value', () => {
      const param = template.Parameters.BranchName;
      expect(param.Default).toBe('main');
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS key for artifact encryption', () => {
      expect(template.Resources.ArtifactEncryptionKey).toBeDefined();
      expect(template.Resources.ArtifactEncryptionKey.Type).toBe(
        'AWS::KMS::Key'
      );
    });

    test('KMS key should have correct deletion policy', () => {
      const kmsKey = template.Resources.ArtifactEncryptionKey;
      expect(kmsKey.DeletionPolicy).toBe('Delete');
    });

    test('KMS key should have PendingWindowInDays configured', () => {
      const kmsKey = template.Resources.ArtifactEncryptionKey;
      expect(kmsKey.Properties.PendingWindowInDays).toBe(7);
    });

    test('KMS key should have proper key policy', () => {
      const kmsKey = template.Resources.ArtifactEncryptionKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toBeDefined();
      expect(keyPolicy.Statement.length).toBeGreaterThanOrEqual(2);
    });

    test('should have KMS alias for the key', () => {
      expect(template.Resources.ArtifactEncryptionKeyAlias).toBeDefined();
      expect(template.Resources.ArtifactEncryptionKeyAlias.Type).toBe(
        'AWS::KMS::Alias'
      );
    });

    test('KMS alias should reference the encryption key', () => {
      const alias = template.Resources.ArtifactEncryptionKeyAlias;
      expect(alias.Properties.TargetKeyId).toEqual({
        Ref: 'ArtifactEncryptionKey',
      });
    });

    test('KMS alias should include environment suffix', () => {
      const alias = template.Resources.ArtifactEncryptionKeyAlias;
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/pipeline-${EnvironmentSuffix}',
      });
    });
  });

  describe('S3 Resources', () => {
    test('should have S3 bucket for pipeline artifacts', () => {
      expect(template.Resources.PipelineArtifactBucket).toBeDefined();
      expect(template.Resources.PipelineArtifactBucket.Type).toBe(
        'AWS::S3::Bucket'
      );
    });

    test('S3 bucket should have correct deletion policy', () => {
      const bucket = template.Resources.PipelineArtifactBucket;
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    test('S3 bucket name should include environment suffix and account ID', () => {
      const bucket = template.Resources.PipelineArtifactBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'pipeline-artifacts-${EnvironmentSuffix}-${AWS::AccountId}',
      });
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.PipelineArtifactBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have KMS encryption configured', () => {
      const bucket = template.Resources.PipelineArtifactBucket;
      const encryption =
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'aws:kms'
      );
      expect(
        encryption.ServerSideEncryptionByDefault.KMSMasterKeyID
      ).toEqual({ 'Fn::GetAtt': ['ArtifactEncryptionKey', 'Arn'] });
    });

    test('S3 bucket should block all public access', () => {
      const bucket = template.Resources.PipelineArtifactBucket;
      const publicAccessConfig =
        bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('SNS Resources', () => {
    test('should have SNS topic for notifications', () => {
      expect(template.Resources.PipelineNotificationTopic).toBeDefined();
      expect(template.Resources.PipelineNotificationTopic.Type).toBe(
        'AWS::SNS::Topic'
      );
    });

    test('SNS topic name should include environment suffix', () => {
      const topic = template.Resources.PipelineNotificationTopic;
      expect(topic.Properties.TopicName).toEqual({
        'Fn::Sub': 'pipeline-notifications-${EnvironmentSuffix}',
      });
    });

    test('SNS topic should have email subscription', () => {
      const topic = template.Resources.PipelineNotificationTopic;
      expect(topic.Properties.Subscription).toBeDefined();
      expect(topic.Properties.Subscription.length).toBe(1);
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
    });

    test('SNS topic should have policy allowing CloudWatch Events', () => {
      expect(template.Resources.PipelineNotificationTopicPolicy).toBeDefined();
      const policy = template.Resources.PipelineNotificationTopicPolicy;
      expect(policy.Type).toBe('AWS::SNS::TopicPolicy');
    });
  });

  describe('CloudWatch Logs Resources', () => {
    test('should have log groups for build and test projects', () => {
      expect(template.Resources.BuildProjectLogGroup).toBeDefined();
      expect(template.Resources.TestProjectLogGroup).toBeDefined();
    });

    test('log groups should have correct type', () => {
      expect(template.Resources.BuildProjectLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
      expect(template.Resources.TestProjectLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
    });

    test('log groups should have 30-day retention', () => {
      const buildLog = template.Resources.BuildProjectLogGroup;
      const testLog = template.Resources.TestProjectLogGroup;
      expect(buildLog.Properties.RetentionInDays).toBe(30);
      expect(testLog.Properties.RetentionInDays).toBe(30);
    });

    test('log groups should have correct deletion policy', () => {
      expect(template.Resources.BuildProjectLogGroup.DeletionPolicy).toBe(
        'Delete'
      );
      expect(template.Resources.TestProjectLogGroup.DeletionPolicy).toBe(
        'Delete'
      );
    });

    test('log group names should include environment suffix', () => {
      const buildLog = template.Resources.BuildProjectLogGroup;
      const testLog = template.Resources.TestProjectLogGroup;
      expect(buildLog.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/codebuild/build-project-${EnvironmentSuffix}',
      });
      expect(testLog.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/codebuild/test-project-${EnvironmentSuffix}',
      });
    });
  });

  describe('IAM Roles', () => {
    test('should have IAM roles for CodeBuild, CodeDeploy, and CodePipeline', () => {
      expect(template.Resources.CodeBuildServiceRole).toBeDefined();
      expect(template.Resources.CodeDeployServiceRole).toBeDefined();
      expect(template.Resources.CodePipelineServiceRole).toBeDefined();
    });

    test('IAM role names should include environment suffix', () => {
      const codeBuildRole = template.Resources.CodeBuildServiceRole;
      const codeDeployRole = template.Resources.CodeDeployServiceRole;
      const codePipelineRole = template.Resources.CodePipelineServiceRole;

      expect(codeBuildRole.Properties.RoleName).toEqual({
        'Fn::Sub': 'codebuild-service-role-${EnvironmentSuffix}',
      });
      expect(codeDeployRole.Properties.RoleName).toEqual({
        'Fn::Sub': 'codedeploy-service-role-${EnvironmentSuffix}',
      });
      expect(codePipelineRole.Properties.RoleName).toEqual({
        'Fn::Sub': 'codepipeline-service-role-${EnvironmentSuffix}',
      });
    });

    test('CodeBuild role should have least-privilege policies', () => {
      const role = template.Resources.CodeBuildServiceRole;
      const policies = role.Properties.Policies[0].PolicyDocument.Statement;

      policies.forEach((statement: any) => {
        if (Array.isArray(statement.Action)) {
          statement.Action.forEach((action: string) => {
            // Ensure no wildcard actions except for ECR (which requires *)
            if (!action.startsWith('ecr:') && !action.startsWith('ecs:')) {
              expect(action).not.toBe('*');
            }
          });
        }
      });
    });

    test('CodeDeploy role should use managed policy', () => {
      const role = template.Resources.CodeDeployServiceRole;
      expect(role.Properties.ManagedPolicyArns).toBeDefined();
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS'
      );
    });

    test('CodePipeline role should have specific permissions', () => {
      const role = template.Resources.CodePipelineServiceRole;
      const statements =
        role.Properties.Policies[0].PolicyDocument.Statement;

      // Check for specific action categories
      const hasS3Permissions = statements.some((s: any) =>
        s.Action.some((a: string) => a.startsWith('s3:'))
      );
      const hasKMSPermissions = statements.some((s: any) =>
        s.Action.some((a: string) => a.startsWith('kms:'))
      );
      const hasCodeBuildPermissions = statements.some((s: any) =>
        s.Action.some((a: string) => a.startsWith('codebuild:'))
      );
      const hasCodeDeployPermissions = statements.some((s: any) =>
        s.Action.some((a: string) => a.startsWith('codedeploy:'))
      );

      expect(hasS3Permissions).toBe(true);
      expect(hasKMSPermissions).toBe(true);
      expect(hasCodeBuildPermissions).toBe(true);
      expect(hasCodeDeployPermissions).toBe(true);
    });
  });

  describe('CodeBuild Projects', () => {
    test('should have build and test projects', () => {
      expect(template.Resources.BuildProject).toBeDefined();
      expect(template.Resources.TestProject).toBeDefined();
    });

    test('projects should have correct type', () => {
      expect(template.Resources.BuildProject.Type).toBe(
        'AWS::CodeBuild::Project'
      );
      expect(template.Resources.TestProject.Type).toBe(
        'AWS::CodeBuild::Project'
      );
    });

    test('project names should include environment suffix', () => {
      const buildProject = template.Resources.BuildProject;
      const testProject = template.Resources.TestProject;

      expect(buildProject.Properties.Name).toEqual({
        'Fn::Sub': 'build-project-${EnvironmentSuffix}',
      });
      expect(testProject.Properties.Name).toEqual({
        'Fn::Sub': 'test-project-${EnvironmentSuffix}',
      });
    });

    test('projects should use BUILD_GENERAL1_SMALL compute type', () => {
      const buildProject = template.Resources.BuildProject;
      const testProject = template.Resources.TestProject;

      expect(buildProject.Properties.Environment.ComputeType).toBe(
        'BUILD_GENERAL1_SMALL'
      );
      expect(testProject.Properties.Environment.ComputeType).toBe(
        'BUILD_GENERAL1_SMALL'
      );
    });

    test('projects should use Amazon Linux 2 image', () => {
      const buildProject = template.Resources.BuildProject;
      const testProject = template.Resources.TestProject;

      expect(buildProject.Properties.Environment.Image).toBe(
        'aws/codebuild/amazonlinux2-x86_64-standard:4.0'
      );
      expect(testProject.Properties.Environment.Image).toBe(
        'aws/codebuild/amazonlinux2-x86_64-standard:4.0'
      );
    });

    test('build project should have privileged mode enabled', () => {
      const buildProject = template.Resources.BuildProject;
      expect(buildProject.Properties.Environment.PrivilegedMode).toBe(true);
    });

    test('projects should have inline buildspec', () => {
      const buildProject = template.Resources.BuildProject;
      const testProject = template.Resources.TestProject;

      expect(buildProject.Properties.Source.BuildSpec).toBeDefined();
      expect(testProject.Properties.Source.BuildSpec).toBeDefined();
      expect(typeof buildProject.Properties.Source.BuildSpec).toBe('string');
      expect(typeof testProject.Properties.Source.BuildSpec).toBe('string');
    });

    test('projects should use CODEPIPELINE artifact type', () => {
      const buildProject = template.Resources.BuildProject;
      const testProject = template.Resources.TestProject;

      expect(buildProject.Properties.Artifacts.Type).toBe('CODEPIPELINE');
      expect(testProject.Properties.Artifacts.Type).toBe('CODEPIPELINE');
      expect(buildProject.Properties.Source.Type).toBe('CODEPIPELINE');
      expect(testProject.Properties.Source.Type).toBe('CODEPIPELINE');
    });

    test('projects should have CloudWatch Logs enabled', () => {
      const buildProject = template.Resources.BuildProject;
      const testProject = template.Resources.TestProject;

      expect(buildProject.Properties.LogsConfig.CloudWatchLogs.Status).toBe(
        'ENABLED'
      );
      expect(testProject.Properties.LogsConfig.CloudWatchLogs.Status).toBe(
        'ENABLED'
      );
    });

    test('projects should reference encryption key', () => {
      const buildProject = template.Resources.BuildProject;
      const testProject = template.Resources.TestProject;

      expect(buildProject.Properties.EncryptionKey).toEqual({
        'Fn::GetAtt': ['ArtifactEncryptionKey', 'Arn'],
      });
      expect(testProject.Properties.EncryptionKey).toEqual({
        'Fn::GetAtt': ['ArtifactEncryptionKey', 'Arn'],
      });
    });
  });

  describe('CodeDeploy Resources', () => {
    test('should have CodeDeploy application', () => {
      expect(template.Resources.CodeDeployApplication).toBeDefined();
      expect(template.Resources.CodeDeployApplication.Type).toBe(
        'AWS::CodeDeploy::Application'
      );
    });

    test('CodeDeploy application should be for ECS platform', () => {
      const app = template.Resources.CodeDeployApplication;
      expect(app.Properties.ComputePlatform).toBe('ECS');
    });

    test('CodeDeploy application name should include environment suffix', () => {
      const app = template.Resources.CodeDeployApplication;
      expect(app.Properties.ApplicationName).toEqual({
        'Fn::Sub': 'ecs-app-${EnvironmentSuffix}',
      });
    });

    test('should have deployment groups for staging and production', () => {
      expect(template.Resources.DeploymentGroupStaging).toBeDefined();
      expect(template.Resources.DeploymentGroupProduction).toBeDefined();
    });

    test('deployment group names should include environment suffix', () => {
      const stagingGroup = template.Resources.DeploymentGroupStaging;
      const productionGroup = template.Resources.DeploymentGroupProduction;

      expect(stagingGroup.Properties.DeploymentGroupName).toEqual({
        'Fn::Sub': 'staging-deployment-${EnvironmentSuffix}',
      });
      expect(productionGroup.Properties.DeploymentGroupName).toEqual({
        'Fn::Sub': 'production-deployment-${EnvironmentSuffix}',
      });
    });

    test('deployment groups should use Blue/Green deployment', () => {
      const stagingGroup = template.Resources.DeploymentGroupStaging;
      const productionGroup = template.Resources.DeploymentGroupProduction;

      expect(stagingGroup.Properties.DeploymentStyle.DeploymentType).toBe(
        'BLUE_GREEN'
      );
      expect(productionGroup.Properties.DeploymentStyle.DeploymentType).toBe(
        'BLUE_GREEN'
      );
    });

    test('deployment groups should have traffic control enabled', () => {
      const stagingGroup = template.Resources.DeploymentGroupStaging;
      const productionGroup = template.Resources.DeploymentGroupProduction;

      expect(stagingGroup.Properties.DeploymentStyle.DeploymentOption).toBe(
        'WITH_TRAFFIC_CONTROL'
      );
      expect(productionGroup.Properties.DeploymentStyle.DeploymentOption).toBe(
        'WITH_TRAFFIC_CONTROL'
      );
    });

    test('deployment groups should terminate blue instances', () => {
      const stagingGroup = template.Resources.DeploymentGroupStaging;
      const productionGroup = template.Resources.DeploymentGroupProduction;

      expect(
        stagingGroup.Properties.BlueGreenDeploymentConfiguration
          .TerminateBlueInstancesOnDeploymentSuccess.Action
      ).toBe('TERMINATE');
      expect(
        productionGroup.Properties.BlueGreenDeploymentConfiguration
          .TerminateBlueInstancesOnDeploymentSuccess.Action
      ).toBe('TERMINATE');
    });

    test('deployment groups should reference ECS cluster and service parameters', () => {
      const stagingGroup = template.Resources.DeploymentGroupStaging;
      const productionGroup = template.Resources.DeploymentGroupProduction;

      expect(stagingGroup.Properties.ECSServices[0].ClusterName).toEqual({
        Ref: 'ECSClusterNameStaging',
      });
      expect(stagingGroup.Properties.ECSServices[0].ServiceName).toEqual({
        Ref: 'ECSServiceNameStaging',
      });
      expect(productionGroup.Properties.ECSServices[0].ClusterName).toEqual({
        Ref: 'ECSClusterNameProduction',
      });
      expect(productionGroup.Properties.ECSServices[0].ServiceName).toEqual({
        Ref: 'ECSServiceNameProduction',
      });
    });
  });

  describe('CodePipeline', () => {
    test('should have CodePipeline resource', () => {
      expect(template.Resources.CICDPipeline).toBeDefined();
      expect(template.Resources.CICDPipeline.Type).toBe(
        'AWS::CodePipeline::Pipeline'
      );
    });

    test('pipeline name should include environment suffix', () => {
      const pipeline = template.Resources.CICDPipeline;
      expect(pipeline.Properties.Name).toEqual({
        'Fn::Sub': 'cicd-pipeline-${EnvironmentSuffix}',
      });
    });

    test('pipeline should have exactly 5 stages', () => {
      const pipeline = template.Resources.CICDPipeline;
      expect(pipeline.Properties.Stages.length).toBe(5);
    });

    test('pipeline stages should be in correct order', () => {
      const pipeline = template.Resources.CICDPipeline;
      const stageNames = pipeline.Properties.Stages.map(
        (stage: any) => stage.Name
      );

      expect(stageNames).toEqual([
        'Source',
        'Build',
        'Test',
        'Deploy-Staging',
        'Deploy-Production',
      ]);
    });

    test('Source stage should use GitHub provider', () => {
      const pipeline = template.Resources.CICDPipeline;
      const sourceStage = pipeline.Properties.Stages[0];

      expect(sourceStage.Actions[0].ActionTypeId.Provider).toBe('GitHub');
      expect(sourceStage.Actions[0].ActionTypeId.Owner).toBe('ThirdParty');
    });

    test('Build stage should use CodeBuild', () => {
      const pipeline = template.Resources.CICDPipeline;
      const buildStage = pipeline.Properties.Stages[1];

      expect(buildStage.Actions[0].ActionTypeId.Category).toBe('Build');
      expect(buildStage.Actions[0].ActionTypeId.Provider).toBe('CodeBuild');
    });

    test('Test stage should use CodeBuild', () => {
      const pipeline = template.Resources.CICDPipeline;
      const testStage = pipeline.Properties.Stages[2];

      expect(testStage.Actions[0].ActionTypeId.Category).toBe('Test');
      expect(testStage.Actions[0].ActionTypeId.Provider).toBe('CodeBuild');
    });

    test('Deploy-Staging stage should use CodeDeployToECS', () => {
      const pipeline = template.Resources.CICDPipeline;
      const deployStage = pipeline.Properties.Stages[3];

      expect(deployStage.Actions[0].ActionTypeId.Provider).toBe(
        'CodeDeployToECS'
      );
    });

    test('Deploy-Production stage should have manual approval', () => {
      const pipeline = template.Resources.CICDPipeline;
      const prodStage = pipeline.Properties.Stages[4];

      const approvalAction = prodStage.Actions.find(
        (action: any) => action.ActionTypeId.Category === 'Approval'
      );
      expect(approvalAction).toBeDefined();
      expect(approvalAction.ActionTypeId.Provider).toBe('Manual');
    });

    test('Deploy-Production approval should have SNS notification', () => {
      const pipeline = template.Resources.CICDPipeline;
      const prodStage = pipeline.Properties.Stages[4];

      const approvalAction = prodStage.Actions.find(
        (action: any) => action.ActionTypeId.Category === 'Approval'
      );
      expect(approvalAction.Configuration.NotificationArn).toEqual({
        Ref: 'PipelineNotificationTopic',
      });
    });

    test('Deploy-Production deployment should have RunOrder 2', () => {
      const pipeline = template.Resources.CICDPipeline;
      const prodStage = pipeline.Properties.Stages[4];

      const deployAction = prodStage.Actions.find(
        (action: any) => action.ActionTypeId.Category === 'Deploy'
      );
      expect(deployAction.RunOrder).toBe(2);
    });

    test('pipeline should use S3 artifact store with KMS encryption', () => {
      const pipeline = template.Resources.CICDPipeline;
      const artifactStore = pipeline.Properties.ArtifactStore;

      expect(artifactStore.Type).toBe('S3');
      expect(artifactStore.Location).toEqual({
        Ref: 'PipelineArtifactBucket',
      });
      expect(artifactStore.EncryptionKey.Type).toBe('KMS');
      expect(artifactStore.EncryptionKey.Id).toEqual({
        'Fn::GetAtt': ['ArtifactEncryptionKey', 'Arn'],
      });
    });
  });

  describe('CloudWatch Events', () => {
    test('should have CloudWatch Events rule for pipeline state changes', () => {
      expect(template.Resources.PipelineStateChangeRule).toBeDefined();
      expect(template.Resources.PipelineStateChangeRule.Type).toBe(
        'AWS::Events::Rule'
      );
    });

    test('event rule name should include environment suffix', () => {
      const rule = template.Resources.PipelineStateChangeRule;
      expect(rule.Properties.Name).toEqual({
        'Fn::Sub': 'pipeline-state-change-${EnvironmentSuffix}',
      });
    });

    test('event rule should capture pipeline state changes', () => {
      const rule = template.Resources.PipelineStateChangeRule;
      const eventPattern = rule.Properties.EventPattern;

      expect(eventPattern.source).toContain('aws.codepipeline');
      expect(eventPattern['detail-type']).toContain(
        'CodePipeline Pipeline Execution State Change'
      );
    });

    test('event rule should monitor STARTED, SUCCEEDED, and FAILED states', () => {
      const rule = template.Resources.PipelineStateChangeRule;
      const states = rule.Properties.EventPattern.detail.state;

      expect(states).toContain('STARTED');
      expect(states).toContain('SUCCEEDED');
      expect(states).toContain('FAILED');
    });

    test('event rule should target SNS topic', () => {
      const rule = template.Resources.PipelineStateChangeRule;
      const target = rule.Properties.Targets[0];

      expect(target.Arn).toEqual({ Ref: 'PipelineNotificationTopic' });
    });

    test('event rule should have input transformer', () => {
      const rule = template.Resources.PipelineStateChangeRule;
      const target = rule.Properties.Targets[0];

      expect(target.InputTransformer).toBeDefined();
      expect(target.InputTransformer.InputPathsMap).toBeDefined();
      expect(target.InputTransformer.InputTemplate).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'PipelineArn',
        'ArtifactBucketName',
        'NotificationTopicArn',
        'BuildProjectName',
        'TestProjectName',
        'CodeDeployApplicationName',
      ];

      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });

    test('all outputs should have export names', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('export names should include stack name', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        const exportName = output.Export.Name;
        expect(exportName['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all applicable resources should include environment suffix', () => {
      const resourcesWithNames = [
        'ArtifactEncryptionKeyAlias',
        'PipelineArtifactBucket',
        'PipelineNotificationTopic',
        'BuildProjectLogGroup',
        'TestProjectLogGroup',
        'CodeBuildServiceRole',
        'CodeDeployServiceRole',
        'CodePipelineServiceRole',
        'BuildProject',
        'TestProject',
        'CodeDeployApplication',
        'DeploymentGroupStaging',
        'DeploymentGroupProduction',
        'CICDPipeline',
        'PipelineStateChangeRule',
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const properties = resource.Properties;

        // Find the naming property (Name, RoleName, BucketName, etc.)
        const nameProps = [
          'Name',
          'RoleName',
          'BucketName',
          'TopicName',
          'LogGroupName',
          'AliasName',
          'ApplicationName',
          'DeploymentGroupName',
        ];

        const nameProperty = nameProps.find(prop => properties[prop]);

        if (nameProperty) {
          const nameValue = properties[nameProperty];
          if (typeof nameValue === 'object' && nameValue['Fn::Sub']) {
            expect(nameValue['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });
  });

  describe('Deletion Policies', () => {
    test('all resources with deletion policies should be set to Delete', () => {
      const resourcesWithDeletionPolicies = [
        'ArtifactEncryptionKey',
        'PipelineArtifactBucket',
        'BuildProjectLogGroup',
        'TestProjectLogGroup',
      ];

      resourcesWithDeletionPolicies.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Security Best Practices', () => {
    test('sensitive parameters should be marked NoEcho', () => {
      const sensitiveParams = ['GitHubToken'];

      sensitiveParams.forEach(paramName => {
        const param = template.Parameters[paramName];
        expect(param.NoEcho).toBe(true);
      });
    });

    test('S3 bucket should have encryption at rest', () => {
      const bucket = template.Resources.PipelineArtifactBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('S3 bucket should block all public access', () => {
      const bucket = template.Resources.PipelineArtifactBucket;
      const publicAccessConfig =
        bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('IAM roles should use resource-specific ARNs where possible', () => {
      const codeBuildRole = template.Resources.CodeBuildServiceRole;
      const statements =
        codeBuildRole.Properties.Policies[0].PolicyDocument.Statement;

      const s3Statement = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('s3:'))
      );
      if (s3Statement && s3Statement.Resource) {
        // S3 resources should reference specific bucket ARNs
        expect(s3Statement.Resource).toBeDefined();
        expect(Array.isArray(s3Statement.Resource)).toBe(true);
      }
    });
  });

  describe('Template Size and Resource Count', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(15);
      expect(resourceCount).toBeLessThanOrEqual(25);
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(10);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(6);
    });
  });
});
