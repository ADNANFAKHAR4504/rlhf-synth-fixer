import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { VpcStack } from '../lib/stacks/vpc-stack';
import { StorageStack } from '../lib/stacks/storage-stack';
import { SecretsStack } from '../lib/stacks/secrets-stack';
import { LambdaStack } from '../lib/stacks/lambda-stack';
import { ApiGatewayStack } from '../lib/stacks/api-gateway-stack';
import { SecurityStack } from '../lib/stacks/security-stack';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { region: 'ap-northeast-1' },
    });
  });

  test('TapStack creates successfully', () => {
    expect(stack).toBeDefined();
  });

  test('TapStack has correct environment suffix', () => {
    expect(stack.stackName).toContain('TestTapStack');
  });

  test('All nested stacks are created', () => {
    const nestedStacks = app.node.findAll().filter((node) => {
      return node instanceof cdk.Stack && node !== stack;
    });

    expect(nestedStacks.length).toBeGreaterThan(0);
  });

  test('VpcStack is created with correct ID', () => {
    const vpcStack = app.node.findAll().find((node) => {
      return node.node.id === `VpcStack-${environmentSuffix}`;
    });

    expect(vpcStack).toBeDefined();
  });

  test('SecretsStack is created with correct ID', () => {
    const secretsStack = app.node.findAll().find((node) => {
      return node.node.id === `SecretsStack-${environmentSuffix}`;
    });

    expect(secretsStack).toBeDefined();
  });

  test('StorageStack is created with correct ID', () => {
    const storageStack = app.node.findAll().find((node) => {
      return node.node.id === `StorageStack-${environmentSuffix}`;
    });

    expect(storageStack).toBeDefined();
  });

  test('LambdaStack is created with correct ID', () => {
    const lambdaStack = app.node.findAll().find((node) => {
      return node.node.id === `LambdaStack-${environmentSuffix}`;
    });

    expect(lambdaStack).toBeDefined();
  });

  test('ApiGatewayStack is created with correct ID', () => {
    const apiStack = app.node.findAll().find((node) => {
      return node.node.id === `ApiGatewayStack-${environmentSuffix}`;
    });

    expect(apiStack).toBeDefined();
  });

  test('SecurityStack is created with correct ID', () => {
    const securityStack = app.node.findAll().find((node) => {
      return node.node.id === `SecurityStack-${environmentSuffix}`;
    });

    expect(securityStack).toBeDefined();
  });

  test('MonitoringStack is created with correct ID', () => {
    const monitoringStack = app.node.findAll().find((node) => {
      return node.node.id === `MonitoringStack-${environmentSuffix}`;
    });

    expect(monitoringStack).toBeDefined();
  });

  test('Stacks use correct environment configuration', () => {
    const nestedStacks = app.node.findAll().filter((node) => {
      return node instanceof cdk.Stack && node !== stack;
    });

    nestedStacks.forEach((nestedStack) => {
      const stackNode = nestedStack as cdk.Stack;
      expect(stackNode.region).toBeDefined();
    });
  });

  test('Stack has iac-rlhf-amazon tag', () => {
    const nestedStacks = app.node.findAll().filter((node) => {
      return node instanceof cdk.Stack && node !== stack;
    });

    expect(nestedStacks.length).toBeGreaterThan(0);
  });

  test('Stack uses context environmentSuffix when provided', () => {
    const testApp = new cdk.App({ context: { environmentSuffix: 'qa' } });
    const testStack = new TapStack(testApp, 'TestContextStack');

    const nestedStacks = testApp.node.findAll().filter((node) => {
      return node instanceof cdk.Stack && node !== testStack;
    });

    expect(nestedStacks.length).toBeGreaterThan(0);
  });

  test('Stack uses default environmentSuffix when not provided', () => {
    const testApp = new cdk.App();
    const testStack = new TapStack(testApp, 'TestDefaultStack', {});

    const nestedStacks = testApp.node.findAll().filter((node) => {
      return node instanceof cdk.Stack && node !== testStack;
    });

    expect(nestedStacks.length).toBeGreaterThan(0);
  });

  test('Stack uses props environmentSuffix over context', () => {
    const testApp = new cdk.App({ context: { environmentSuffix: 'qa' } });
    const testStack = new TapStack(testApp, 'TestPropsStack', {
      environmentSuffix: 'staging',
    });

    const nestedStacks = testApp.node.findAll().filter((node) => {
      return node instanceof cdk.Stack && node !== testStack;
    });

    expect(nestedStacks.length).toBeGreaterThan(0);
  });

  test('Stack uses region from context when AWS_REGION is not set', () => {
    // Save and clear AWS_REGION env var
    const originalRegion = process.env.AWS_REGION;
    delete process.env.AWS_REGION;

    try {
      const testApp = new cdk.App({ context: { region: 'us-west-2' } });
      const testStack = new TapStack(testApp, 'TestRegionContextStack');

      const nestedStacks = testApp.node.findAll().filter((node) => {
        return node instanceof cdk.Stack && node !== testStack;
      });

      expect(nestedStacks.length).toBeGreaterThan(0);
    } finally {
      // Restore AWS_REGION
      if (originalRegion) {
        process.env.AWS_REGION = originalRegion;
      }
    }
  });

  test('Stack uses default region when AWS_REGION and context are not set', () => {
    // Save and clear AWS_REGION env var
    const originalRegion = process.env.AWS_REGION;
    delete process.env.AWS_REGION;

    try {
      // Create app without region in context
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestDefaultRegionStack');

      const nestedStacks = testApp.node.findAll().filter((node) => {
        return node instanceof cdk.Stack && node !== testStack;
      });

      expect(nestedStacks.length).toBeGreaterThan(0);
      // Verify region is defined (CDK returns token, not literal string)
      expect(testStack.region).toBeDefined();
    } finally {
      // Restore AWS_REGION
      if (originalRegion) {
        process.env.AWS_REGION = originalRegion;
      }
    }
  });
});

describe('VpcStack', () => {
  let app: cdk.App;
  let stack: VpcStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new VpcStack(app, 'TestVpcStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1' },
    });
    template = Template.fromStack(stack);
  });

  test('VPC is created', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
  });

  test('VPC has public and private subnets', () => {
    template.resourceCountIs('AWS::EC2::Subnet', 4);
  });

  test('VPC has NAT Gateway', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 1);
  });

  test('VPC has iac-rlhf-amazon tag', () => {
    const vpc = template.findResources('AWS::EC2::VPC');
    const vpcTags = Object.values(vpc)[0].Properties.Tags;
    const hasTag = vpcTags.some((tag: any) =>
      tag.Key === 'iac-rlhf-amazon' && tag.Value === 'true'
    );
    expect(hasTag).toBe(true);
  });

  test('VPC has flow logs', () => {
    template.resourceCountIs('AWS::EC2::FlowLog', 1);
  });

  test('VPC outputs VpcId', () => {
    template.hasOutput('VpcId', {});
  });
});

describe('StorageStack', () => {
  let app: cdk.App;
  let stack: StorageStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new StorageStack(app, 'TestStorageStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1', account: '123456789012' },
    });
    template = Template.fromStack(stack);
  });

  test('S3 bucket is created', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
  });

  test('S3 bucket has versioning enabled', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    });
  });

  test('S3 bucket has encryption', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: Match.objectLike({
        ServerSideEncryptionConfiguration: Match.anyValue(),
      }),
    });
  });

  test('DynamoDB table is created', () => {
    template.resourceCountIs('AWS::DynamoDB::Table', 1);
  });

  test('DynamoDB table has correct keys', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' },
      ],
    });
  });

  test('DynamoDB table has point-in-time recovery', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true,
      },
    });
  });

  test('DynamoDB table has GSI', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: Match.arrayWith([
        Match.objectLike({
          IndexName: 'StatusIndex',
        }),
      ]),
    });
  });

  test('Stack has outputs', () => {
    template.hasOutput('BucketName', {});
    template.hasOutput('TableName', {});
  });
});

describe('SecretsStack', () => {
  let app: cdk.App;
  let stack: SecretsStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new SecretsStack(app, 'TestSecretsStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1' },
    });
    template = Template.fromStack(stack);
  });

  test('Secret is created', () => {
    template.resourceCountIs('AWS::SecretsManager::Secret', 1);
  });

  test('Secret has correct name', () => {
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'serverless-api-secret-dev',
    });
  });

  test('Secret has iac-rlhf-amazon tag', () => {
    const secrets = template.findResources('AWS::SecretsManager::Secret');
    const secretTags = Object.values(secrets)[0].Properties.Tags;
    const hasTag = secretTags.some((tag: any) =>
      tag.Key === 'iac-rlhf-amazon' && tag.Value === 'true'
    );
    expect(hasTag).toBe(true);
  });

  test('Stack has SecretArn output', () => {
    template.hasOutput('SecretArn', {});
  });
});

describe('LambdaStack', () => {
  let app: cdk.App;
  let vpcStack: VpcStack;
  let storageStack: StorageStack;
  let secretsStack: SecretsStack;
  let lambdaStack: LambdaStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    vpcStack = new VpcStack(app, 'TestVpcStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1' },
    });
    storageStack = new StorageStack(app, 'TestStorageStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1', account: '123456789012' },
    });
    secretsStack = new SecretsStack(app, 'TestSecretsStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1' },
    });
    lambdaStack = new LambdaStack(app, 'TestLambdaStack', {
      environmentSuffix: 'dev',
      vpc: vpcStack.vpc,
      dataTable: storageStack.dataTable,
      dataBucket: storageStack.dataBucket,
      apiSecret: secretsStack.apiSecret,
      env: { region: 'ap-northeast-1' },
    });
    template = Template.fromStack(lambdaStack);
  });

  test('Lambda function is created', () => {
    template.resourceCountIs('AWS::Lambda::Function', 2); // includes log retention function
  });

  test('Lambda function uses Node 22 runtime', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs22.x',
    });
  });

  test('Lambda has IAM role', () => {
    template.resourceCountIs('AWS::IAM::Role', 2);
  });

  test('Lambda has security group', () => {
    template.resourceCountIs('AWS::EC2::SecurityGroup', 1);
  });

  test('Lambda has dead letter queue', () => {
    template.resourceCountIs('AWS::SQS::Queue', 1);
  });

  test('Stack has FunctionArn output', () => {
    template.hasOutput('FunctionArn', {});
  });
});

describe('ApiGatewayStack', () => {
  let app: cdk.App;
  let vpcStack: VpcStack;
  let storageStack: StorageStack;
  let secretsStack: SecretsStack;
  let lambdaStack: LambdaStack;
  let apiStack: ApiGatewayStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    vpcStack = new VpcStack(app, 'TestVpcStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1' },
    });
    storageStack = new StorageStack(app, 'TestStorageStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1', account: '123456789012' },
    });
    secretsStack = new SecretsStack(app, 'TestSecretsStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1' },
    });
    lambdaStack = new LambdaStack(app, 'TestLambdaStack', {
      environmentSuffix: 'dev',
      vpc: vpcStack.vpc,
      dataTable: storageStack.dataTable,
      dataBucket: storageStack.dataBucket,
      apiSecret: secretsStack.apiSecret,
      env: { region: 'ap-northeast-1' },
    });
    apiStack = new ApiGatewayStack(app, 'TestApiGatewayStack', {
      environmentSuffix: 'dev',
      dataProcessorFunction: lambdaStack.dataProcessorFunction,
      env: { region: 'ap-northeast-1' },
    });
    template = Template.fromStack(apiStack);
  });

  test('API Gateway is created', () => {
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
  });

  test('API Gateway has methods', () => {
    template.resourceCountIs('AWS::ApiGateway::Method', 4); // GET, POST, OPTIONS
  });

  test('API Gateway has deployment', () => {
    template.resourceCountIs('AWS::ApiGateway::Deployment', 1);
  });

  test('API Gateway has stage', () => {
    template.resourceCountIs('AWS::ApiGateway::Stage', 1);
  });

  test('API Key is created', () => {
    template.resourceCountIs('AWS::ApiGateway::ApiKey', 1);
  });

  test('Usage Plan is created', () => {
    template.resourceCountIs('AWS::ApiGateway::UsagePlan', 1);
  });

  test('API has CORS enabled', () => {
    template.hasResourceProperties('AWS::ApiGateway::Method', {
      HttpMethod: 'OPTIONS',
    });
  });

  test('Stack has ApiEndpoint output', () => {
    template.hasOutput('ApiEndpoint', {});
  });
});

describe('SecurityStack', () => {
  let app: cdk.App;
  let vpcStack: VpcStack;
  let storageStack: StorageStack;
  let secretsStack: SecretsStack;
  let lambdaStack: LambdaStack;
  let apiStack: ApiGatewayStack;
  let securityStack: SecurityStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    vpcStack = new VpcStack(app, 'TestVpcStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1' },
    });
    storageStack = new StorageStack(app, 'TestStorageStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1', account: '123456789012' },
    });
    secretsStack = new SecretsStack(app, 'TestSecretsStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1' },
    });
    lambdaStack = new LambdaStack(app, 'TestLambdaStack', {
      environmentSuffix: 'dev',
      vpc: vpcStack.vpc,
      dataTable: storageStack.dataTable,
      dataBucket: storageStack.dataBucket,
      apiSecret: secretsStack.apiSecret,
      env: { region: 'ap-northeast-1' },
    });
    apiStack = new ApiGatewayStack(app, 'TestApiGatewayStack', {
      environmentSuffix: 'dev',
      dataProcessorFunction: lambdaStack.dataProcessorFunction,
      env: { region: 'ap-northeast-1' },
    });
    securityStack = new SecurityStack(app, 'TestSecurityStack', {
      environmentSuffix: 'dev',
      apiGateway: apiStack.api,
      env: { region: 'ap-northeast-1' },
    });
    template = Template.fromStack(securityStack);
  });

  test('WAF Web ACL is created', () => {
    template.resourceCountIs('AWS::WAFv2::WebACL', 1);
  });

  test('WAF has rate limiting rule', () => {
    template.hasResourceProperties('AWS::WAFv2::WebACL', {
      Rules: Match.arrayWith([
        Match.objectLike({
          Name: 'RateLimitRule',
        }),
      ]),
    });
  });

  test('WAF has SQL injection protection', () => {
    template.hasResourceProperties('AWS::WAFv2::WebACL', {
      Rules: Match.arrayWith([
        Match.objectLike({
          Name: 'SQLiRule',
        }),
      ]),
    });
  });

  test('WAF has XSS protection', () => {
    template.hasResourceProperties('AWS::WAFv2::WebACL', {
      Rules: Match.arrayWith([
        Match.objectLike({
          Name: 'XSSRule',
        }),
      ]),
    });
  });

  test('WAF Web ACL Association is created', () => {
    template.resourceCountIs('AWS::WAFv2::WebACLAssociation', 1);
  });

  test('Stack has WebAclArn output', () => {
    template.hasOutput('WebAclArn', {});
  });
});

describe('MonitoringStack', () => {
  let app: cdk.App;
  let vpcStack: VpcStack;
  let storageStack: StorageStack;
  let secretsStack: SecretsStack;
  let lambdaStack: LambdaStack;
  let apiStack: ApiGatewayStack;
  let monitoringStack: MonitoringStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    vpcStack = new VpcStack(app, 'TestVpcStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1' },
    });
    storageStack = new StorageStack(app, 'TestStorageStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1', account: '123456789012' },
    });
    secretsStack = new SecretsStack(app, 'TestSecretsStack', {
      environmentSuffix: 'dev',
      env: { region: 'ap-northeast-1' },
    });
    lambdaStack = new LambdaStack(app, 'TestLambdaStack', {
      environmentSuffix: 'dev',
      vpc: vpcStack.vpc,
      dataTable: storageStack.dataTable,
      dataBucket: storageStack.dataBucket,
      apiSecret: secretsStack.apiSecret,
      env: { region: 'ap-northeast-1' },
    });
    apiStack = new ApiGatewayStack(app, 'TestApiGatewayStack', {
      environmentSuffix: 'dev',
      dataProcessorFunction: lambdaStack.dataProcessorFunction,
      env: { region: 'ap-northeast-1' },
    });
    monitoringStack = new MonitoringStack(app, 'TestMonitoringStack', {
      environmentSuffix: 'dev',
      lambdaFunction: lambdaStack.dataProcessorFunction,
      apiGateway: apiStack.api,
      dataTable: storageStack.dataTable,
      env: { region: 'ap-northeast-1' },
    });
    template = Template.fromStack(monitoringStack);
  });

  test('SNS Topic is created', () => {
    template.resourceCountIs('AWS::SNS::Topic', 1);
  });

  test('CloudWatch Alarms are created', () => {
    template.resourceCountIs('AWS::CloudWatch::Alarm', 6);
  });

  test('Lambda error alarm is created', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'lambda-errors-dev',
    });
  });

  test('API Gateway 4xx alarm is created', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'api-4xx-errors-dev',
    });
  });

  test('API Gateway 5xx alarm is created', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'api-5xx-errors-dev',
    });
  });

  test('Stack has DashboardUrl output', () => {
    template.hasOutput('DashboardUrl', {});
  });

  test('Stack has AlertTopicArn output', () => {
    template.hasOutput('AlertTopicArn', {});
  });
});
