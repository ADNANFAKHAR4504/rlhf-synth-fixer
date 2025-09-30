import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CICDPipelineStack } from '../lib/tap-stack';

describe('CICDPipelineStack Integration Tests', () => {
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
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  test('Creates essential AWS resources', () => {
    // Check that key resources are created
    template.resourceCountIs('AWS::KMS::Key', 1);
    template.resourceCountIs('AWS::KMS::Alias', 1);
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.resourceCountIs('AWS::DynamoDB::Table', 1);
    template.resourceCountIs('AWS::SNS::Topic', 1);
    template.resourceCountIs('AWS::SecretsManager::Secret', 2);
    template.resourceCountIs('AWS::CodeBuild::Project', 3);
    template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
    template.resourceCountIs('AWS::Lambda::Function', 1);
    template.resourceCountIs('AWS::CloudWatch::Alarm', 1);
  });

  test('KMS key has rotation enabled', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
    });
  });

  test('S3 bucket is properly configured', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('DynamoDB table is properly configured', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        { AttributeName: 'buildId', AttributeType: 'S' },
        { AttributeName: 'timestamp', AttributeType: 'S' }
      ],
      KeySchema: [
        { AttributeName: 'buildId', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' }
      ]
    });
  });

  test('Lambda function is properly configured', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'python3.11',
      Handler: 'cost-monitoring.lambda_handler',
      Timeout: 300,
      MemorySize: 256
    });
  });

  test('Pipeline has correct structure', () => {
    const pipelines = template.findResources('AWS::CodePipeline::Pipeline');
    const pipeline = Object.values(pipelines)[0] as any;

    expect(pipeline.Properties.Stages).toBeDefined();
    expect(pipeline.Properties.Stages.length).toBeGreaterThan(3);
  });

  test('All resources have required tags', () => {
    const taggableResources = [
      'AWS::S3::Bucket',
      'AWS::DynamoDB::Table',
      'AWS::SNS::Topic',
      'AWS::Lambda::Function',
      'AWS::IAM::Role',
      'AWS::CodeBuild::Project',
      'AWS::CodePipeline::Pipeline',
      'AWS::CloudWatch::Alarm'
    ];

    taggableResources.forEach(resourceType => {
      const resources = template.findResources(resourceType);
      Object.values(resources).forEach((resource: any) => {
        if (resource.Properties.Tags) {
          expect(resource.Properties.Tags).toContainEqual({
            Key: 'iac-rlhf-amazon',
            Value: 'true'
          });
        }
      });
    });
  });

  test('Stack has required outputs', () => {
    const outputs = template.findOutputs('*');
    expect(Object.keys(outputs).length).toBeGreaterThan(0);

    expect(outputs.PipelineName).toBeDefined();
    expect(outputs.ArtifactsBucketName).toBeDefined();
    expect(outputs.NotificationTopicArn).toBeDefined();
  });
});