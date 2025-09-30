import * as cdk from 'aws-cdk-lib';
import { Capture, Match, Template } from 'aws-cdk-lib/assertions';
import { CICDPipelineStack } from '../lib/tap-stack';

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
      environmentName: 'test',
      projectName: 'test-project',
      costCenter: 'engineering',
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
      TableName: 'test-project-test-artifacts-metadata',
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
      TopicName: 'test-project-test-pipeline-notifications',
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

  test('All resources have required iac-rlhf-amazon tag', () => {
    const resources = template.findResources('AWS::*');
    const taggableResourceTypes = [
      'AWS::S3::Bucket',
      'AWS::DynamoDB::Table',
      'AWS::KMS::Key',
      'AWS::SNS::Topic',
      'AWS::SecretsManager::Secret',
      'AWS::IAM::Role',
      'AWS::CodeBuild::Project',
      'AWS::CodePipeline::Pipeline',
      'AWS::Lambda::Function',
      'AWS::CloudWatch::Alarm',
      'AWS::Events::Rule',
      'AWS::Logs::LogGroup',
      'AWS::Logs::SubscriptionFilter'
    ];

    Object.entries(resources).forEach(([logicalId, resource]) => {
      if (taggableResourceTypes.includes(resource.Type)) {
        expect(resource.Properties?.Tags || []).toContainEqual(
          expect.objectContaining({
            Key: 'iac-rlhf-amazon',
            Value: 'true'
          })
        );
      }
    });
  });

  test('Lambda function has proper cross-service integration', () => {
    // Check Lambda function exists
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'test-project-test-cost-monitoring',
      Runtime: 'python3.11',
      Handler: 'cost-monitoring.lambda_handler',
      Environment: {
        Variables: {
          SNS_TOPIC_ARN: Match.anyValue(),
          PROJECT_NAME: 'test-project',
          ENVIRONMENT: 'test',
          TABLE_NAME: 'test-project-test-artifacts-metadata',
        },
      },
    });

    // Check CloudWatch log subscription filter
    template.hasResourceProperties('AWS::Logs::SubscriptionFilter', {
      DestinationArn: Match.anyValue(),
      FilterPattern: Match.stringLikeRegexp('SUCCEEDED|FAILED|Duration|Memory|CPU'),
    });

    // Check EventBridge rule for pipeline events
    template.hasResourceProperties('AWS::Events::Rule', {
      Name: 'test-project-test-pipeline-events',
      EventPattern: {
        source: ['aws.codepipeline'],
        'detail-type': ['CodePipeline Pipeline Execution State Change'],
        detail: {
          state: ['FAILED', 'SUCCEEDED'],
        },
      },
    });
  });

  test('IAM permissions follow least privilege principle', () => {
    // Capture Lambda execution role
    const lambdaRoleCapture = new Capture();
    template.hasResourceProperties('AWS::Lambda::Function', {
      Role: lambdaRoleCapture,
    });

    // Check Lambda has minimal required permissions
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          // SNS publish permission
          Match.objectLike({
            Effect: 'Allow',
            Action: 'sns:Publish',
            Resource: Match.anyValue(),
          }),
          // DynamoDB read/write permission
          Match.objectLike({
            Effect: 'Allow',
            Action: Match.arrayWith(['dynamodb:GetItem', 'dynamodb:PutItem']),
            Resource: Match.anyValue(),
          }),
        ]),
      },
    });

    // Check CodeBuild role has required permissions
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          // CloudWatch Logs permissions
          Match.objectLike({
            Effect: 'Allow',
            Action: Match.arrayWith([
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ]),
          }),
          // S3 permissions for artifacts
          Match.objectLike({
            Effect: 'Allow',
            Action: Match.arrayWith(['s3:GetObject', 's3:PutObject']),
          }),
          // KMS permissions
          Match.objectLike({
            Effect: 'Allow',
            Action: Match.arrayWith(['kms:Decrypt', 'kms:GenerateDataKey']),
          }),
        ]),
      },
    });
  });

  test('Pipeline stages have correct dependencies and flow', () => {
    const pipelineResource = template.findResources('AWS::CodePipeline::Pipeline');
    const pipeline = Object.values(pipelineResource)[0];
    const stages = pipeline.Properties.Stages;

    // Verify stage order
    expect(stages[0].Name).toBe('Source');
    expect(stages[1].Name).toBe('Build');
    expect(stages[2].Name).toBe('Test');
    expect(stages[3].Name).toBe('Deploy_Development');
    expect(stages[4].Name).toBe('Deploy_Production');

    // Verify test stage has parallel actions
    const testStage = stages[2];
    expect(testStage.Actions).toHaveLength(2); // Unit and Integration tests
    expect(testStage.Actions[0].RunOrder).toBe(1);
    expect(testStage.Actions[1].RunOrder).toBe(2);

    // Verify production stage has manual approval
    const prodStage = stages[4];
    const approvalAction = prodStage.Actions.find(
      (action: any) => action.ActionTypeId.Category === 'Approval'
    );
    expect(approvalAction).toBeDefined();
    expect(approvalAction.RunOrder).toBe(1);

    // Verify multi-region deployments run in parallel after approval
    const deployActions = prodStage.Actions.filter(
      (action: any) => action.ActionTypeId.Category === 'Deploy'
    );
    expect(deployActions.length).toBeGreaterThan(1);
    deployActions.forEach((action: any) => {
      expect(action.RunOrder).toBeGreaterThan(1);
    });
  });

  test('Security and encryption configuration is comprehensive', () => {
    // S3 bucket encryption
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms',
            },
          },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });

    // Secrets Manager encryption
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      KmsKeyId: Match.anyValue(),
    });

    // SNS topic encryption
    template.hasResourceProperties('AWS::SNS::Topic', {
      KmsMasterKeyId: Match.anyValue(),
    });

    // DynamoDB encryption
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      SSESpecification: {
        SSEEnabled: true,
      },
    });
  });

  test('CloudWatch monitoring and alerting configuration', () => {
    // Pipeline failure alarm
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'test-project-test-pipeline-failure',
      MetricName: 'PipelineExecutionFailure',
      Namespace: 'AWS/CodePipeline',
      Statistic: 'Sum',
      Threshold: 1,
      EvaluationPeriods: 1,
      AlarmActions: [Match.anyValue()], // SNS topic
    });

    // Log group with proper retention
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/aws/codepipeline/test-project-test-pipeline',
      RetentionInDays: 30,
    });
  });

  test('Cost optimization and lifecycle management', () => {
    // S3 bucket lifecycle rules
    template.hasResourceProperties('AWS::S3::Bucket', {
      LifecycleConfiguration: {
        Rules: [
          {
            Id: 'delete-old-artifacts',
            Status: 'Enabled',
            ExpirationInDays: 30,
            NoncurrentVersionExpirationInDays: 7,
          },
        ],
      },
    });

    // DynamoDB pay-per-request billing
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST',
    });

    // Lambda timeout and memory optimization
    template.hasResourceProperties('AWS::Lambda::Function', {
      Timeout: 300, // 5 minutes
      MemorySize: 256,
    });
  });

  test('Cross-account compatibility and parameterization', () => {
    // Check no hardcoded account IDs or ARNs
    const template_json = template.toJSON();
    const template_str = JSON.stringify(template_json);

    // Should not contain specific account IDs
    expect(template_str).not.toMatch(/\d{12}/); // 12-digit account ID pattern

    // Resource names should be parameterized
    expect(template_str).toContain('test-project-test'); // Uses project name and environment

    // Stack should work in any region
    const resources = template.findResources('AWS::*');
    Object.values(resources).forEach((resource: any) => {
      if (resource.Properties?.Region) {
        expect(resource.Properties.Region).toMatch(/^\\$\\{.*\\}$/); // Should be a reference
      }
    });
  });

  test('Build specification includes real-world validation', () => {
    const codeBuildProjects = template.findResources('AWS::CodeBuild::Project');

    Object.values(codeBuildProjects).forEach((project: any) => {
      if (project.Properties.Name.includes('build-project')) {
        // Build project should have comprehensive build spec
        const buildSpec = project.Properties.Source.BuildSpec;
        expect(buildSpec).toContain('npm ci');
        expect(buildSpec).toContain('npm run lint');
        expect(buildSpec).toContain('npm run build');
        expect(buildSpec).toContain('aws dynamodb put-item'); // Real DynamoDB integration
      }

      if (project.Properties.Name.includes('unit-test-project')) {
        const buildSpec = project.Properties.Source.BuildSpec;
        expect(buildSpec).toContain('npm run test:unit -- --coverage');
        expect(buildSpec).toContain('coverage/lcov.info'); // Real test reporting
      }

      if (project.Properties.Name.includes('integration-test-project')) {
        const buildSpec = project.Properties.Source.BuildSpec;
        expect(buildSpec).toContain('docker-compose');
        expect(buildSpec).toContain('npm run test:integration');
        // Real integration test environment setup
      }
    });
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