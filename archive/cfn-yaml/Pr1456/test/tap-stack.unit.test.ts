import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
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
      expect(template.Description).toBe(
        'Comprehensive CI/CD Pipeline with CodePipeline, CodeBuild, and secure artifact deployment'
      );
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'ProjectName',
        'Environment',
        'CodeStarConnectionArn', // This is now a parameter, not created in template
        'GitHubRepositoryOwner',
        'GitHubRepositoryName',
        'GitHubBranchName',
        'ApprovalNotificationEmail',
        'SecretValue',
      ];

      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('my-cicd-project');
      expect(param.Description).toBe(
        'Name of the project for resource naming and tagging'
      );
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(param.Description).toBe(
        'Environment name for resource naming and tagging'
      );
    });

    test('CodeStarConnectionArn parameter should be defined', () => {
      const param = template.Parameters.CodeStarConnectionArn;
      expect(param.Type).toBe('String');
      expect(param.Description).toBe(
        'ARN of the CodeStar Connection for GitHub integration (replace with your actual connection ARN)'
      );
    });

    test('SecretValue parameter should have NoEcho enabled', () => {
      const param = template.Parameters.SecretValue;
      expect(param.Type).toBe('String');
      expect(param.NoEcho).toBe(true);
    });
  });

  describe('Resources', () => {
    test('should have all core CI/CD resources', () => {
      const expectedResources = [
        // GitHubConnection is NOT created as a resource anymore
        'PipelineKMSKey',
        'PipelineKMSKeyAlias',
        'PipelineArtifactsBucket',
        'DeploymentArtifactsBucket',
        'BuildSecret',
        'ApprovalNotificationTopic',
        'ApprovalNotificationSubscription',
        'CodeBuildLogGroup',
        'CodePipelineServiceRole',
        'CodeBuildServiceRole',
        'CodeBuildProject',
        'CodePipeline',
      ];

      expectedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('PipelineKMSKey should be a KMS Key', () => {
      const resource = template.Resources.PipelineKMSKey;
      expect(resource.Type).toBe('AWS::KMS::Key');
      expect(resource.Properties.Description['Fn::Sub']).toBe(
        '${ProjectName}-${Environment} Pipeline KMS Key'
      );
    });

    test('PipelineArtifactsBucket should be an S3 bucket with encryption', () => {
      const bucket = template.Resources.PipelineArtifactsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('aws:kms');
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
    });

    test('CodeBuildProject should have correct environment', () => {
      const project = template.Resources.CodeBuildProject;
      expect(project.Type).toBe('AWS::CodeBuild::Project');
      expect(project.Properties.Environment.Type).toBe('LINUX_CONTAINER');
      expect(project.Properties.Environment.ComputeType).toBe(
        'BUILD_GENERAL1_MEDIUM'
      );
      expect(project.Properties.Environment.Image).toBe(
        'aws/codebuild/standard:7.0'
      );
    });

    test('CodePipeline should have four stages', () => {
      const pipeline = template.Resources.CodePipeline;
      expect(pipeline.Type).toBe('AWS::CodePipeline::Pipeline');
      expect(pipeline.Properties.Stages).toHaveLength(4);

      const stageNames = pipeline.Properties.Stages.map(
        (stage: any) => stage.Name
      );
      expect(stageNames).toEqual(['Source', 'Build', 'Approval', 'Deploy']);
    });

    test('BuildSecret should be a Secrets Manager secret', () => {
      const secret = template.Resources.BuildSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.Name['Fn::Sub']).toBe(
        '${ProjectName}-${Environment}-build-secret'
      );
      expect(secret.Properties.KmsKeyId.Ref).toBe('PipelineKMSKey');
    });

    test('ApprovalNotificationTopic should be an SNS topic', () => {
      const topic = template.Resources.ApprovalNotificationTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.TopicName['Fn::Sub']).toBe(
        '${ProjectName}-${Environment}-approval-notifications'
      );
      expect(topic.Properties.KmsMasterKeyId.Ref).toBe('PipelineKMSKey');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'CodeStarConnectionArn', // Now outputs the parameter value
        // 'GitHubConnectionStatus' is removed since we can't get status from a parameter
        'PipelineName',
        'PipelineArtifactsBucket',
        'PipelineArtifactsBucketArn',
        'DeploymentArtifactsBucket',
        'DeploymentArtifactsBucketArn',
        'CodeBuildProjectName',
        'SecretsManagerSecretArn',
        'SNSTopicArn',
        'KMSKeyArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('CodeStarConnectionArn output should be correct', () => {
      const output = template.Outputs.CodeStarConnectionArn;
      expect(output.Description).toBe(
        'ARN of the CodeStar Connection to GitHub'
      );
      expect(output.Value.Ref).toBe('CodeStarConnectionArn'); // References the parameter
      expect(output.Export.Name['Fn::Sub']).toBe(
        '${AWS::StackName}-GitHubConnection'
      );
    });

    test('PipelineName output should be correct', () => {
      const output = template.Outputs.PipelineName;
      expect(output.Description).toBe('Name of the created CodePipeline');
      expect(output.Value.Ref).toBe('CodePipeline');
      expect(output.Export.Name['Fn::Sub']).toBe(
        '${AWS::StackName}-PipelineName'
      );
    });

    test('CodeBuildProjectName output should be correct', () => {
      const output = template.Outputs.CodeBuildProjectName;
      expect(output.Description).toBe('Name of the CodeBuild project');
      expect(output.Value.Ref).toBe('CodeBuildProject');
      expect(output.Export.Name['Fn::Sub']).toBe(
        '${AWS::StackName}-CodeBuildProject'
      );
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

    test('should have correct number of resources for CI/CD pipeline', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(12); // 13 minus GitHubConnection resource
    });

    test('should have eight parameters', () => {
      // Now includes CodeStarConnectionArn parameter
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(8);
    });

    test('should have ten outputs', () => {
      // 11 minus GitHubConnectionStatus
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10);
    });
  });

  describe('Security Configuration', () => {
    test('S3 buckets should have public access blocked', () => {
      const pipelineBucket = template.Resources.PipelineArtifactsBucket;
      const deploymentBucket = template.Resources.DeploymentArtifactsBucket;

      [pipelineBucket, deploymentBucket].forEach(bucket => {
        const config = bucket.Properties.PublicAccessBlockConfiguration;
        expect(config.BlockPublicAcls).toBe(true);
        expect(config.BlockPublicPolicy).toBe(true);
        expect(config.IgnorePublicAcls).toBe(true);
        expect(config.RestrictPublicBuckets).toBe(true);
      });
    });

    test('S3 buckets should have lifecycle configuration', () => {
      const pipelineBucket = template.Resources.PipelineArtifactsBucket;
      const deploymentBucket = template.Resources.DeploymentArtifactsBucket;

      [pipelineBucket, deploymentBucket].forEach(bucket => {
        expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
        expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(1);
        const rule = bucket.Properties.LifecycleConfiguration.Rules[0];
        expect(rule.Status).toBe('Enabled');
        expect(rule.NoncurrentVersionExpirationInDays).toBe(365);
      });
    });

    test('KMS key should have proper key policy', () => {
      const kmsKey = template.Resources.PipelineKMSKey;
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Statement).toHaveLength(4);

      const statements = kmsKey.Properties.KeyPolicy.Statement;
      const rootStatement = statements.find(
        (s: any) => s.Sid === 'Enable IAM User Permissions'
      );
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');

      // Check for Secrets Manager statement
      const secretsStatement = statements.find(
        (s: any) => s.Sid === 'Allow use of the key for Secrets Manager'
      );
      expect(secretsStatement).toBeDefined();
      expect(secretsStatement.Effect).toBe('Allow');
      expect(secretsStatement.Principal.Service).toBe(
        'secretsmanager.amazonaws.com'
      );
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention with project and environment', () => {
      const buildProject = template.Resources.CodeBuildProject;
      expect(buildProject.Properties.Name['Fn::Sub']).toBe(
        '${ProjectName}-${Environment}-build'
      );

      const pipeline = template.Resources.CodePipeline;
      expect(pipeline.Properties.Name['Fn::Sub']).toBe(
        '${ProjectName}-${Environment}-pipeline'
      );
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toMatch(/^\${AWS::StackName}-.+/);
      });
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('CodePipelineServiceRole should have correct assume role policy', () => {
      const role = template.Resources.CodePipelineServiceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
      ).toBe('codepipeline.amazonaws.com');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Action).toBe(
        'sts:AssumeRole'
      );
    });

    test('CodeBuildServiceRole should have correct assume role policy', () => {
      const role = template.Resources.CodeBuildServiceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
      ).toBe('codebuild.amazonaws.com');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Action).toBe(
        'sts:AssumeRole'
      );
    });

    test('IAM roles should have S3 permissions with proper ARN format', () => {
      const pipelineRole = template.Resources.CodePipelineServiceRole;
      const buildRole = template.Resources.CodeBuildServiceRole;

      [pipelineRole, buildRole].forEach(role => {
        const policies = role.Properties.Policies;
        expect(policies).toHaveLength(1);

        const statements = policies[0].PolicyDocument.Statement;
        const s3ObjectStatement = statements.find((s: any) =>
          s.Action.some(
            (action: string) =>
              action.includes('s3:GetObject') || action.includes('s3:PutObject')
          )
        );

        expect(s3ObjectStatement).toBeDefined();
        expect(s3ObjectStatement.Resource).toBeDefined();

        // Check that S3 object resources use proper ARN format
        s3ObjectStatement.Resource.forEach((resource: any) => {
          if (resource['Fn::Sub']) {
            expect(resource['Fn::Sub']).toMatch(
              /^arn:aws:s3:::\$\{[^}]+\}\/\*$/
            );
          }
        });
      });
    });

    test('CodeBuild role should have Secrets Manager permissions', () => {
      const buildRole = template.Resources.CodeBuildServiceRole;
      const policies = buildRole.Properties.Policies;
      const statements = policies[0].PolicyDocument.Statement;

      const secretsStatement = statements.find((s: any) =>
        s.Action.some((action: string) => action.includes('secretsmanager:'))
      );

      expect(secretsStatement).toBeDefined();
      expect(secretsStatement.Action).toContain(
        'secretsmanager:GetSecretValue'
      );
      expect(secretsStatement.Action).toContain(
        'secretsmanager:DescribeSecret'
      );
    });

    test('CodePipeline role should have CodeStar Connections permissions', () => {
      const pipelineRole = template.Resources.CodePipelineServiceRole;
      const policies = pipelineRole.Properties.Policies;
      const statements = policies[0].PolicyDocument.Statement;

      const connectionsStatement = statements.find((s: any) =>
        s.Action.some((action: string) =>
          action.includes('codestar-connections:')
        )
      );

      expect(connectionsStatement).toBeDefined();
      expect(connectionsStatement.Action).toContain(
        'codestar-connections:UseConnection'
      );
      expect(connectionsStatement.Resource.Ref).toBe('CodeStarConnectionArn');
    });
  });

  describe('Pipeline Configuration', () => {
    test('Pipeline should use CodeStar connection parameter for source', () => {
      const pipeline = template.Resources.CodePipeline;
      const sourceStage = pipeline.Properties.Stages.find(
        (stage: any) => stage.Name === 'Source'
      );
      expect(sourceStage).toBeDefined();

      const sourceAction = sourceStage.Actions[0];
      expect(sourceAction.ActionTypeId.Provider).toBe(
        'CodeStarSourceConnection'
      );
      // Now references the parameter, not a resource
      expect(sourceAction.Configuration.ConnectionArn.Ref).toBe(
        'CodeStarConnectionArn'
      );
    });

    test('Pipeline should have KMS encryption for artifact store', () => {
      const pipeline = template.Resources.CodePipeline;
      expect(pipeline.Properties.ArtifactStore.EncryptionKey).toBeDefined();
      expect(pipeline.Properties.ArtifactStore.EncryptionKey.Type).toBe('KMS');
      expect(
        pipeline.Properties.ArtifactStore.EncryptionKey.Id['Fn::GetAtt']
      ).toEqual(['PipelineKMSKey', 'Arn']);
    });

    test('Build project should have secrets integration in environment variables', () => {
      const buildProject = template.Resources.CodeBuildProject;
      const envVars = buildProject.Properties.Environment.EnvironmentVariables;

      const secretArnVar = envVars.find(
        (envVar: any) => envVar.Name === 'SECRET_ARN'
      );
      expect(secretArnVar).toBeDefined();
      expect(secretArnVar.Value.Ref).toBe('BuildSecret');
    });
  });
});
