import { Template, Match } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import { CICDPipelineStack } from '../lib/cicd-pipeline-stack';

describe('CICDPipelineStack', () => {
  let app: cdk.App;
  let stack: CICDPipelineStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new CICDPipelineStack(app, 'TestStack', {
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      githubBranch: 'main',
      notificationEmail: 'test@example.com',
      deploymentRegions: ['us-east-1', 'us-west-2'],
    });
    template = Template.fromStack(stack);
  });

  test('Creates KMS key with rotation enabled', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
      Description: 'KMS key for CI/CD pipeline encryption',
    });

    template.hasResourceProperties('AWS::KMS::Alias', {
      AliasName: 'alias/cicd-pipeline-key',
    });
  });

  test('Creates S3 bucket with proper encryption and lifecycle', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          Match.objectLike({
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms',
            },
          }),
        ],
      },
      VersioningConfiguration: {
        Status: 'Enabled',
      },
      LifecycleConfiguration: {
        Rules: [
          Match.objectLike({
            ExpirationInDays: 30,
            NoncurrentVersionExpirationInDays: 7,
          }),
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('Creates DynamoDB table for artifacts metadata', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'cicd-artifacts-metadata',
      BillingMode: 'PAY_PER_REQUEST',
      SSESpecification: {
        SSEEnabled: true,
      },
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
      },
      AttributeDefinitions: [
        { AttributeName: 'buildId', AttributeType: 'S' },
        { AttributeName: 'timestamp', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'buildId', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' },
      ],
    });
  });

  test('Creates SNS topic with encryption', () => {
    template.hasResourceProperties('AWS::SNS::Topic', {
      TopicName: 'cicd-pipeline-notifications',
      KmsMasterKeyId: Match.anyValue(),
    });

    template.hasResourceProperties('AWS::SNS::Subscription', {
      Protocol: 'email',
      Endpoint: 'test@example.com',
    });
  });

  test('Creates secrets in Secrets Manager', () => {
    // GitHub token secret
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'github-oauth-token',
      Description: 'GitHub OAuth token for repository access',
    });

    // Database credentials secret
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'app-database-credentials',
      Description: 'Database credentials for the application',
      GenerateSecretString: Match.objectLike({
        SecretStringTemplate: JSON.stringify({ username: 'admin' }),
        GenerateStringKey: 'password',
      }),
    });
  });

  test('Creates CodeBuild projects with proper configuration', () => {
    // Build project
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Name: 'cicd-build-project',
      Environment: {
        ComputeType: 'BUILD_GENERAL1_SMALL',
        Image: Match.stringLikeRegexp('aws/codebuild/standard'),
        Type: 'LINUX_CONTAINER',
        PrivilegedMode: true,
      },
    });

    // Unit test project
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Name: 'cicd-unit-test-project',
    });

    // Integration test project
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Name: 'cicd-integration-test-project',
      Environment: {
        ComputeType: 'BUILD_GENERAL1_MEDIUM',
      },
    });
  });

  test('Creates CodePipeline with correct stages', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Name: 'cicd-multi-stage-pipeline',
      RoleArn: Match.anyValue(),
      Stages: [
        Match.objectLike({ Name: 'Source' }),
        Match.objectLike({ Name: 'Build' }),
        Match.objectLike({ Name: 'Test' }),
        Match.objectLike({ Name: 'Deploy_Development' }),
        Match.objectLike({ Name: 'Deploy_Production' }),
      ],
    });
  });

  test('Creates IAM roles with least privilege', () => {
    // CodeBuild role
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: [
          Match.objectLike({
            Principal: {
              Service: 'codebuild.amazonaws.com',
            },
          }),
        ],
      }),
    });

    // CloudFormation deployment roles
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: [
          Match.objectLike({
            Principal: {
              Service: 'cloudformation.amazonaws.com',
            },
          }),
        ],
      }),
    });
  });

  test('Creates CloudWatch alarms', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'cicd-pipeline-failure',
      MetricName: 'PipelineFailed',
      Statistic: 'Sum',
      Threshold: 1,
      EvaluationPeriods: 1,
    });
  });

  test('Has manual approval action for production', () => {
    const pipelineResource = template.findResources('AWS::CodePipeline::Pipeline');
    const pipeline = Object.values(pipelineResource)[0];
    
    const productionStage = pipeline.Properties.Stages.find(
      (stage: any) => stage.Name === 'Deploy_Production'
    );
    
    expect(productionStage).toBeDefined();
    expect(productionStage.Actions).toContainEqual(
      expect.objectContaining({
        ActionTypeId: expect.objectContaining({
          Category: 'Approval',
          Provider: 'Manual',
        }),
      })
    );
  });

  test('Configures multi-region deployment for production', () => {
    const pipelineResource = template.findResources('AWS::CodePipeline::Pipeline');
    const pipeline = Object.values(pipelineResource)[0];
    
    const productionStage = pipeline.Properties.Stages.find(
      (stage: any) => stage.Name === 'Deploy_Production'
    );
    
    const deploymentActions = productionStage.Actions.filter(
      (action: any) => action.ActionTypeId.Category === 'Deploy'
    );
    
    expect(deploymentActions.length).toBe(2); // Two regions
    expect(deploymentActions[0].Region).toBe('us-east-1');
    expect(deploymentActions[1].Region).toBe('us-west-2');
  });

  test('Stack has required outputs', () => {
    template.hasOutput('PipelineName', {
      Description: 'Name of the CI/CD pipeline',
    });

    template.hasOutput('ArtifactsBucketName', {
      Description: 'Name of the artifacts bucket',
    });

    template.hasOutput('NotificationTopicArn', {
      Description: 'ARN of the notification topic',
    });
  });
});