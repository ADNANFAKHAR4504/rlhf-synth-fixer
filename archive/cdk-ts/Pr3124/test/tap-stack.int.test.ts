import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { CICDPipelineStack } from '../lib/tap-stack';

describe('CICDPipelineStack Integration Tests', () => {
  let app: cdk.App;
  let stack: CICDPipelineStack;
  let template: Template;

  const defaultProps = {
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
  };

  beforeEach(() => {
    app = new cdk.App();
    stack = new CICDPipelineStack(app, 'TestStack', defaultProps);
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

// Add more comprehensive integration tests to cover different scenarios
describe('CICDPipelineStack Multi-Region Integration Tests', () => {
  let app: cdk.App;
  let stack: CICDPipelineStack;
  let template: Template;

  test('Multi-region deployment creates correct number of deployment actions', () => {
    app = new cdk.App();
    stack = new CICDPipelineStack(app, 'MultiRegionStack', {
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      githubBranch: 'main',
      notificationEmail: 'test@example.com',
      deploymentRegions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
      environmentName: 'prod',
      projectName: 'multi-region-project',
      costCenter: 'platform',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);

    const pipelines = template.findResources('AWS::CodePipeline::Pipeline');
    const pipeline = Object.values(pipelines)[0] as any;

    // Find production deployment stage
    const productionStage = pipeline.Properties.Stages.find(
      (stage: any) => stage.Name === 'Deploy_Production'
    );

    expect(productionStage).toBeDefined();

    // Should have 1 manual approval + 4 deployment actions (one per region)
    expect(productionStage.Actions.length).toBe(5);

    // Check that each region has a deployment action
    const deploymentActions = productionStage.Actions.filter(
      (action: any) => action.ActionTypeId.Category === 'Deploy'
    );
    expect(deploymentActions.length).toBe(4);

    const regions = deploymentActions.map((action: any) => action.Region);
    expect(regions).toContain('us-east-1');
    expect(regions).toContain('us-west-2');
    expect(regions).toContain('eu-west-1');
    expect(regions).toContain('ap-southeast-1');
  });

  test('Single region deployment creates minimal actions', () => {
    app = new cdk.App();
    stack = new CICDPipelineStack(app, 'SingleRegionStack', {
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      githubBranch: 'main',
      notificationEmail: 'test@example.com',
      deploymentRegions: ['us-east-1'],
      environmentName: 'dev',
      projectName: 'single-region-project',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);

    const pipelines = template.findResources('AWS::CodePipeline::Pipeline');
    const pipeline = Object.values(pipelines)[0] as any;

    const productionStage = pipeline.Properties.Stages.find(
      (stage: any) => stage.Name === 'Deploy_Production'
    );

    // Should have 1 manual approval + 1 deployment action
    expect(productionStage.Actions.length).toBe(2);
  });

  test('Empty deployment regions array creates minimal pipeline', () => {
    app = new cdk.App();
    stack = new CICDPipelineStack(app, 'EmptyRegionsStack', {
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      githubBranch: 'main',
      notificationEmail: 'test@example.com',
      deploymentRegions: [],
      environmentName: 'test',
      projectName: 'empty-regions-project',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);

    const pipelines = template.findResources('AWS::CodePipeline::Pipeline');
    const pipeline = Object.values(pipelines)[0] as any;

    const productionStage = pipeline.Properties.Stages.find(
      (stage: any) => stage.Name === 'Deploy_Production'
    );

    // Should only have manual approval action
    expect(productionStage.Actions.length).toBe(1);
    expect(productionStage.Actions[0].ActionTypeId.Category).toBe('Approval');
  });
});

describe('CICDPipelineStack CodeStar Connection Integration Tests', () => {
  let app: cdk.App;
  let stack: CICDPipelineStack;
  let template: Template;

  test('Uses CodeStar connection when provided', () => {
    app = new cdk.App();
    stack = new CICDPipelineStack(app, 'CodeStarStack', {
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      githubBranch: 'main',
      notificationEmail: 'test@example.com',
      deploymentRegions: ['us-east-1'],
      codeStarConnectionArn: 'arn:aws:codestar-connections:us-east-1:123456789012:connection/12345678-1234-1234-1234-123456789012',
      environmentName: 'prod',
      projectName: 'codestar-project',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);

    const pipelines = template.findResources('AWS::CodePipeline::Pipeline');
    const pipeline = Object.values(pipelines)[0] as any;

    const sourceStage = pipeline.Properties.Stages.find(
      (stage: any) => stage.Name === 'Source'
    );

    const sourceAction = sourceStage.Actions[0];
    expect(sourceAction.ActionTypeId.Provider).toBe('CodeStarSourceConnection');
    expect(sourceAction.Configuration.ConnectionArn).toBe(
      'arn:aws:codestar-connections:us-east-1:123456789012:connection/12345678-1234-1234-1234-123456789012'
    );
  });

  test('Uses GitHub token when CodeStar connection not provided', () => {
    app = new cdk.App();
    stack = new CICDPipelineStack(app, 'GitHubTokenStack', {
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      githubBranch: 'main',
      notificationEmail: 'test@example.com',
      deploymentRegions: ['us-east-1'],
      environmentName: 'dev',
      projectName: 'github-token-project',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);

    const pipelines = template.findResources('AWS::CodePipeline::Pipeline');
    const pipeline = Object.values(pipelines)[0] as any;

    const sourceStage = pipeline.Properties.Stages.find(
      (stage: any) => stage.Name === 'Source'
    );

    const sourceAction = sourceStage.Actions[0];
    expect(sourceAction.ActionTypeId.Provider).toBe('GitHub');
    expect(sourceAction.Configuration.OAuthToken).toBeDefined();
  });
});

describe('CICDPipelineStack Context Integration Tests', () => {
  let app: cdk.App;

  test('Uses context values when props not provided', () => {
    app = new cdk.App();
    app.node.setContext('environment', 'staging');
    app.node.setContext('projectName', 'context-project');
    app.node.setContext('costCenter', 'context-cost-center');

    const stack = new CICDPipelineStack(app, 'ContextStack', {
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      githubBranch: 'main',
      notificationEmail: 'test@example.com',
      deploymentRegions: ['us-east-1'],
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const template = Template.fromStack(stack);

    // Check that resources use context values
    const buckets = template.findResources('AWS::S3::Bucket');
    const bucketNames = Object.values(buckets).map((r: any) => r.Properties?.BucketName).filter(Boolean);
    expect(bucketNames.some(name => name.includes('context-project'))).toBeTruthy();

    const tables = template.findResources('AWS::DynamoDB::Table');
    const tableNames = Object.values(tables).map((r: any) => r.Properties?.TableName).filter(Boolean);
    expect(tableNames.some(name => name.includes('context-project'))).toBeTruthy();
  });

  test('Props override context values', () => {
    app = new cdk.App();
    app.node.setContext('environment', 'staging');
    app.node.setContext('projectName', 'context-project');
    app.node.setContext('costCenter', 'context-cost-center');

    const stack = new CICDPipelineStack(app, 'PropsOverrideStack', {
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      githubBranch: 'main',
      notificationEmail: 'test@example.com',
      deploymentRegions: ['us-east-1'],
      environmentName: 'prod',
      projectName: 'props-project',
      costCenter: 'props-cost-center',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const template = Template.fromStack(stack);

    // Check that resources use prop values instead of context
    const buckets = template.findResources('AWS::S3::Bucket');
    const bucketNames = Object.values(buckets).map((r: any) => r.Properties?.BucketName).filter(Boolean);
    expect(bucketNames.some(name => name.includes('props-project'))).toBeTruthy();
    expect(bucketNames.some(name => name.includes('context-project'))).toBeFalsy();
  });
});

describe('CICDPipelineStack Security Integration Tests', () => {
  let app: cdk.App;

  test('All secrets are encrypted with KMS', () => {
    app = new cdk.App();
    const stack = new CICDPipelineStack(app, 'SecurityStack', {
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      githubBranch: 'main',
      notificationEmail: 'test@example.com',
      deploymentRegions: ['us-east-1'],
      environmentName: 'prod',
      projectName: 'security-project',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const template = Template.fromStack(stack);

    // Check that all secrets have KMS encryption
    const secrets = template.findResources('AWS::SecretsManager::Secret');
    Object.values(secrets).forEach((secret: any) => {
      expect(secret.Properties.KmsKeyId).toBeDefined();
    });

    // Check that SNS topic is encrypted
    const snsTopics = template.findResources('AWS::SNS::Topic');
    Object.values(snsTopics).forEach((topic: any) => {
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
      expect(topic.Properties.KmsMasterKeyId['Fn::GetAtt']).toBeDefined();
      expect(topic.Properties.KmsMasterKeyId['Fn::GetAtt'][0]).toMatch(/PipelineEncryptionKey/);
      expect(topic.Properties.KmsMasterKeyId['Fn::GetAtt'][1]).toBe('Arn');
    });
  });

  test('S3 bucket has proper security configuration', () => {
    app = new cdk.App();
    const stack = new CICDPipelineStack(app, 'S3SecurityStack', {
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      githubBranch: 'main',
      notificationEmail: 'test@example.com',
      deploymentRegions: ['us-east-1'],
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    });
  });
});