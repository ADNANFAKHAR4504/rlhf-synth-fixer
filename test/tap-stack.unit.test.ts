import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import { execSync } from 'child_process';
import { ComprehensiveDeployment, runCliDeployment } from '../lib/comprehensive-deploy';
import { DrTestingWorkflow } from '../lib/constructs/dr-testing-workflow';
import { DynamoDBGlobalTable } from '../lib/constructs/dynamodb-global-table';
import { LambdaWithDlq } from '../lib/constructs/lambda-with-dlq';
import { MonitoringDashboard } from '../lib/constructs/monitoring-dashboard';
import { Route53HealthCheck } from '../lib/constructs/route53-health-check';
import { S3ReplicatedBucket } from '../lib/constructs/s3-replicated-bucket';
import { SingleRegionApp } from '../lib/constructs/single-region-app';
import { SnsCrossRegion } from '../lib/constructs/sns-cross-region';
import { SsmReplicatedParameter } from '../lib/constructs/ssm-replicated-parameter';
import { TapStack, resolvePrimaryRegion } from '../lib/tap-stack';

const describeStacksPromise = jest.fn();
const listFunctionsPromise = jest.fn();
const lambdaInvokePromise = jest.fn();
const dynamoListTablesPromise = jest.fn();
const dynamoDescribeTablePromise = jest.fn();
const s3ListBucketsPromise = jest.fn();
const s3HeadBucketPromise = jest.fn();

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('aws-sdk', () => {
  class CloudFormation {
    describeStacks() {
      return { promise: () => describeStacksPromise() };
    }
  }

  class Lambda {
    listFunctions() {
      return { promise: () => listFunctionsPromise() };
    }

    invoke() {
      return { promise: () => lambdaInvokePromise() };
    }
  }

  class DynamoDB {
    listTables() {
      return { promise: () => dynamoListTablesPromise() };
    }

    describeTable() {
      return { promise: () => dynamoDescribeTablePromise() };
    }
  }

  class S3 {
    listBuckets() {
      return { promise: () => s3ListBucketsPromise() };
    }

    headBucket(params: { Bucket: string }) {
      return { promise: () => s3HeadBucketPromise(params) };
    }
  }

  return { CloudFormation, Lambda, DynamoDB, S3 };
});

jest.mock('aws-cdk-lib/aws-route53-targets', () => {
  class MockAliasTarget {
    bind() {
      return {
        dnsName: 'example.com',
        hostedZoneId: 'Z2ABCDEFG',
      };
    }
  }

  return {
    ApiGateway: MockAliasTarget,
    CloudFrontTarget: MockAliasTarget,
  };
});

const mockedExecSync = execSync as jest.MockedFunction<typeof execSync>;
const defaultEnv = { account: '123456789012', region: 'us-east-1' };
const fixedTimestamp = 1700000000000;
const testEnvironmentSuffix = 'qa';

const expectedOutputs = (suffix: string) => [
  { OutputKey: `OrderTableArn${suffix}`, OutputValue: 'arn:aws:dynamodb:region:acct:table/orders' },
  { OutputKey: `OrderProcessingLambdaArn${suffix}`, OutputValue: 'arn:aws:lambda:region:acct:function:order' },
  { OutputKey: `ApiEndpoint${suffix}`, OutputValue: 'https://api.example.com' },
  { OutputKey: `CloudFrontDomain${suffix}`, OutputValue: 'https://cdn.example.com' },
  { OutputKey: `RdsEndpoint${suffix}`, OutputValue: 'db.example.com' },
];

const createTestStack = (id = 'TestStack'): cdk.Stack => {
  const app = new cdk.App();
  return new cdk.Stack(app, id, { env: defaultEnv });
};

const createTestLambda = (stack: cdk.Stack, id: string, functionName: string) =>
  new lambda.Function(stack, id, {
    functionName,
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: 'index.handler',
    code: lambda.Code.fromInline('exports.handler = async () => ({ statusCode: 200 });'),
  });

let dateSpy: jest.SpyInstance<number, []>;
let originalEnvSuffix: string | undefined;

beforeAll(() => {
  originalEnvSuffix = process.env.ENVIRONMENT_SUFFIX;
  process.env.ENVIRONMENT_SUFFIX = testEnvironmentSuffix;
  dateSpy = jest.spyOn(Date, 'now').mockReturnValue(fixedTimestamp);
});

afterAll(() => {
  if (originalEnvSuffix === undefined) {
    delete process.env.ENVIRONMENT_SUFFIX;
  } else {
    process.env.ENVIRONMENT_SUFFIX = originalEnvSuffix;
  }
  dateSpy.mockRestore();
});

beforeEach(() => {
  jest.clearAllMocks();
  describeStacksPromise.mockResolvedValue({
    Stacks: [
      {
        StackStatus: 'CREATE_COMPLETE',
        Outputs: expectedOutputs(testEnvironmentSuffix),
      },
    ],
  });
  listFunctionsPromise.mockResolvedValue({
    Functions: [
      { FunctionName: `iac-rlhf-${testEnvironmentSuffix}-order-processor` },
      { FunctionName: `iac-rlhf-${testEnvironmentSuffix}-shadow-analysis` },
      { FunctionName: `iac-rlhf-${testEnvironmentSuffix}-log-stream` },
    ],
  });
  lambdaInvokePromise.mockResolvedValue({ StatusCode: 200 });
  dynamoListTablesPromise.mockResolvedValue({
    TableNames: [`iac-rlhf-${testEnvironmentSuffix}-orders-${fixedTimestamp}`],
  });
  dynamoDescribeTablePromise.mockResolvedValue({
    Table: { TableStatus: 'ACTIVE' },
  });
  s3ListBucketsPromise.mockResolvedValue({
    Buckets: [{ Name: `iac-rlhf-${testEnvironmentSuffix}-trading-primary-${fixedTimestamp}` }],
  });
  s3HeadBucketPromise.mockResolvedValue({});
});

describe('TapStack infrastructure', () => {
  it('builds trading platform resources with expected naming', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TapStackUnderTest', {
      env: defaultEnv,
      environmentSuffix: testEnvironmentSuffix,
    });

    const orderTable = stack.node.tryFindChild('OrderTable') as DynamoDBGlobalTable;
    const primaryBucket = stack.node.tryFindChild('PrimaryTradingBucket') as S3ReplicatedBucket;
    const drBucket = stack.node.tryFindChild('DrTradingBucket') as S3ReplicatedBucket;
    const alertsTopic = stack.node.tryFindChild('PrimaryAlertsTopic') as SnsCrossRegion;

    expect(orderTable).toBeDefined();
    expect(primaryBucket).toBeDefined();
    expect(drBucket).toBeDefined();
    expect(alertsTopic).toBeDefined();

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: `iac-rlhf-${testEnvironmentSuffix}-orders-${fixedTimestamp}`,
      PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
    });
    template.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
      BucketName: `iac-rlhf-${testEnvironmentSuffix}-trading-primary-${fixedTimestamp}`,
      VersioningConfiguration: { Status: 'Enabled' },
    }));
    template.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
      BucketName: `iac-rlhf-${testEnvironmentSuffix}-trading-dr-${fixedTimestamp}`,
    }));
    template.hasResourceProperties('AWS::SNS::Topic', Match.objectLike({
      TopicName: `iac-rlhf-${testEnvironmentSuffix}-alerts-primary-${fixedTimestamp}`,
    }));
    template.hasOutput(`OrderTableArn${testEnvironmentSuffix}`, Match.objectLike({
      Export: Match.objectLike({
        Name: `iac-rlhf-${testEnvironmentSuffix}-OrderTableArn`,
      }),
    }));
    template.hasOutput(`ApiEndpoint${testEnvironmentSuffix}`, Match.objectLike({
      Description: 'API Gateway endpoint URL',
    }));
  });

  it('falls back to synthesizing when no environment suffix is provided', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TapStackDefaults', { env: defaultEnv });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::DynamoDB::Table', 1);
  });

  it('uses context-provided environment suffix when props omit it', () => {
    const app = new cdk.App();
    app.node.setContext('environmentSuffix', 'ctx');
    const stack = new TapStack(app, 'TapStackContext', { env: defaultEnv });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::DynamoDB::Table', 1);
  });

  it('resolves primary region helper from stack metadata', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'RegionAware', { env: defaultEnv });
    expect(resolvePrimaryRegion(stack)).toBe(defaultEnv.region);
  });

  it('falls back to us-east-1 when stack region is undefined', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'RegionFallback');
    const descriptor = Object.getOwnPropertyDescriptor(stack, 'region');
    Object.defineProperty(stack, 'region', {
      configurable: true,
      get: () => undefined,
    });
    expect(resolvePrimaryRegion(stack)).toBe('us-east-1');
    if (descriptor) {
      Object.defineProperty(stack, 'region', descriptor);
    }
  });

  it('synthesizes successfully when stack env is not provided', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TapStackRegionless', {
      environmentSuffix: testEnvironmentSuffix,
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::SNS::Topic', 1);
  });
});

describe('Purpose-built constructs', () => {
  it('configures DynamoDBGlobalTable with replication helper', () => {
    const stack = createTestStack('DynamoTable');
    new DynamoDBGlobalTable(stack, 'Orders', {
      tableName: `iac-rlhf-${testEnvironmentSuffix}-orders`,
      drRegion: 'us-west-2',
      environmentSuffix: testEnvironmentSuffix,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST',
      TableName: `iac-rlhf-${testEnvironmentSuffix}-orders`,
    });
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'python3.9',
      Handler: 'index.handler',
    });
    template.resourceCountIs('AWS::CloudFormation::CustomResource', 1);
  });

  it('creates LambdaWithDlq with strict DLQ wiring', () => {
    const stack = createTestStack('LambdaDlq');
    const construct = new LambdaWithDlq(stack, 'Processor', {
      functionName: `iac-rlhf-${testEnvironmentSuffix}-order-processor`,
      handler: 'index.handler',
      code: lambda.Code.fromInline('exports.handler = () => {};'),
      environmentSuffix: testEnvironmentSuffix,
      useCase: 'order-processing',
    });

    expect(construct.function.deadLetterQueue).toBeDefined();
    expect(construct.function.timeout?.toSeconds()).toBe(30);

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::SQS::Queue', {
      QueueName: `iac-rlhf-${testEnvironmentSuffix}-order-processor-dlq`,
    });
    template.hasResourceProperties('AWS::Lambda::Function', Match.objectLike({
      FunctionName: `iac-rlhf-${testEnvironmentSuffix}-order-processor`,
      DeadLetterConfig: Match.objectLike({
        TargetArn: Match.anyValue(),
      }),
    }));
  });

  it('enforces secure S3 bucket defaults and replication helpers', () => {
    const primaryStack = createTestStack('PrimaryBucket');
    const primaryBucket = new S3ReplicatedBucket(primaryStack, 'Primary', {
      bucketName: `iac-rlhf-${testEnvironmentSuffix}-trading-primary`,
      destinationBucketName: `iac-rlhf-${testEnvironmentSuffix}-trading-dr`,
      destinationRegion: 'us-west-2',
      environmentSuffix: testEnvironmentSuffix,
      isPrimary: true,
    });

    (primaryBucket as any).setupCrossRegionReplication(
      `iac-rlhf-${testEnvironmentSuffix}-trading-dr`,
      'us-west-2'
    );

    const primaryTemplate = Template.fromStack(primaryStack);
    primaryTemplate.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: `iac-rlhf-${testEnvironmentSuffix}-trading-primary`,
      VersioningConfiguration: { Status: 'Enabled' },
    });
    primaryTemplate.hasResourceProperties('AWS::IAM::Role', Match.objectLike({
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Principal: Match.objectLike({ Service: 's3.amazonaws.com' }),
          }),
        ]),
      }),
    }));
    primaryTemplate.resourceCountIs('AWS::CloudFormation::CustomResource', 1);

    const replicaStack = createTestStack('ReplicaBucket');
    const replicaBucket = new S3ReplicatedBucket(replicaStack, 'Replica', {
      bucketName: `iac-rlhf-${testEnvironmentSuffix}-trading-dr`,
      environmentSuffix: testEnvironmentSuffix,
      isPrimary: false,
    });
    (replicaBucket as any).setupCrossRegionReplication(
      `iac-rlhf-${testEnvironmentSuffix}-trading-primary`,
      'us-east-1'
    );
    const replicaTemplate = Template.fromStack(replicaStack);
    replicaTemplate.resourceCountIs('AWS::CloudFormation::CustomResource', 1);
  });

  it('creates SNS topics with optional cross-region subscription wiring', () => {
    const stack = createTestStack('Sns');
    new SnsCrossRegion(stack, 'PrimaryTopic', {
      topicName: `iac-rlhf-${testEnvironmentSuffix}-alerts-primary`,
      displayName: 'Primary Alerts',
      drRegion: 'us-west-2',
      environmentSuffix: testEnvironmentSuffix,
      isPrimary: true,
    });
    new SnsCrossRegion(stack, 'DrTopic', {
      topicName: `iac-rlhf-${testEnvironmentSuffix}-alerts-dr`,
      displayName: 'DR Alerts',
      drRegion: 'us-east-1',
      environmentSuffix: testEnvironmentSuffix,
      isPrimary: false,
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::SNS::Topic', 2);
    template.resourceCountIs('AWS::CloudFormation::CustomResource', 1);
  });

  it('secures SSM parameters and replicates without exposing values', () => {
    const stack = createTestStack('Ssm');
    new SsmReplicatedParameter(stack, 'SecureParam', {
      parameterName: `/iac-rlhf/${testEnvironmentSuffix}/config`,
      value: '{"test":true}',
      destinationRegions: ['us-west-2'],
      environmentSuffix: testEnvironmentSuffix,
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: `/iac-rlhf/${testEnvironmentSuffix}/config`,
      Value: '{"test":true}',
    });
    template.hasResourceProperties('AWS::KMS::Key', Match.objectLike({
      EnableKeyRotation: true,
    }));
  });

  it('builds the single-region application with HA data stores and networking', () => {
    const stack = createTestStack('SingleRegionApp');
    const appConstruct = new SingleRegionApp(stack, 'App', {
      environmentSuffix: testEnvironmentSuffix,
      timestamp: fixedTimestamp.toString(),
    });

    expect(appConstruct.vpc.publicSubnets.length).toBe(2);
    expect(appConstruct.vpc.privateSubnets.length).toBe(2);

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      MultiAZ: true,
      StorageEncrypted: true,
    }));
    template.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
      VersioningConfiguration: { Status: 'Enabled' },
    }));
    template.hasResourceProperties('AWS::Lambda::Function', Match.objectLike({
      FunctionName: Match.stringLikeRegexp('cost-monitor'),
    }));
  });

  it('builds comprehensive monitoring dashboards and alarms', () => {
    const stack = createTestStack('Monitoring');
    const lambdaA = createTestLambda(stack, 'LambdaA', `iac-rlhf-${testEnvironmentSuffix}-lambda-a`);
    const lambdaB = createTestLambda(stack, 'LambdaB', `iac-rlhf-${testEnvironmentSuffix}-lambda-b`);
    const table = new dynamodb.Table(stack, 'Table', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    const bucket = new s3.Bucket(stack, 'DataBucket');
    const queue = new sqs.Queue(stack, 'Queue', { queueName: `iac-rlhf-${testEnvironmentSuffix}-queue` });
    const dlq = new sqs.Queue(stack, 'Dlq', { queueName: `iac-rlhf-${testEnvironmentSuffix}-queue-dlq` });
    (queue as any).queueName = `iac-rlhf-${testEnvironmentSuffix}-queue`;
    (dlq as any).queueName = `iac-rlhf-${testEnvironmentSuffix}-queue-dlq`;
    const api = new apigateway.RestApi(stack, 'Api');
    api.root.addMethod(
      'GET',
      new apigateway.MockIntegration({
        integrationResponses: [{ statusCode: '200' }],
        requestTemplates: { 'application/json': '{"statusCode": 200}' },
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      }),
      { methodResponses: [{ statusCode: '200' }] }
    );
    const stateMachine = new stepfunctions.StateMachine(stack, 'StateMachine', {
      definition: stepfunctions.Chain.start(new stepfunctions.Pass(stack, 'Pass')),
    });

    const dashboard = new MonitoringDashboard(stack, 'Dashboard', {
      dashboardName: `iac-rlhf-${testEnvironmentSuffix}-monitoring`,
      environmentSuffix: testEnvironmentSuffix,
      lambdaFunctions: [lambdaA, lambdaB],
      dynamoTables: [table],
      s3Buckets: [bucket],
      snsTopics: [new sns.Topic(stack, 'Topic')],
      sqsQueues: [queue, dlq],
      apiGateways: [api],
      stepFunctions: [stateMachine],
      drRegion: 'us-west-2',
    });

    new MonitoringDashboard(stack, 'EmptyDashboard', {
      dashboardName: `iac-rlhf-${testEnvironmentSuffix}-empty`,
      environmentSuffix: testEnvironmentSuffix,
    });

    expect(dashboard.alarms.length).toBeGreaterThan(0);

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::CloudWatch::Alarm', dashboard.alarms.length);
  });

  it('manages primary and DR Route53 health checks', () => {
    const stack = createTestStack('Route53');
    const primaryApi = new apigateway.RestApi(stack, 'PrimaryApi');
    primaryApi.root.addMethod(
      'GET',
      new apigateway.MockIntegration({
        integrationResponses: [{ statusCode: '200' }],
        requestTemplates: { 'application/json': '{"statusCode": 200}' },
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      }),
      { methodResponses: [{ statusCode: '200' }] }
    );
    const drApi = new apigateway.RestApi(stack, 'DrApi');
    drApi.root.addMethod(
      'GET',
      new apigateway.MockIntegration({
        integrationResponses: [{ statusCode: '200' }],
        requestTemplates: { 'application/json': '{"statusCode": 200}' },
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      }),
      { methodResponses: [{ statusCode: '200' }] }
    );
    const distribution = new cloudfront.Distribution(stack, 'Distribution', {
      defaultBehavior: {
        origin: new origins.HttpOrigin('example.com'),
      },
    });

    const primary = new Route53HealthCheck(stack, 'Primary', {
      zoneName: 'trading-platform',
      environmentSuffix: testEnvironmentSuffix,
      timestamp: fixedTimestamp.toString(),
      primaryApiGateway: primaryApi,
      cloudFrontDistribution: distribution,
    });

    const dr = new Route53HealthCheck(stack, 'Dr', {
      zoneName: 'trading-platform',
      environmentSuffix: testEnvironmentSuffix,
      timestamp: fixedTimestamp.toString(),
      drApiGateway: drApi,
      isPrimary: false,
    });

    expect(primary.healthCheckId).toBeDefined();
    expect(dr.healthCheckId).toBeDefined();

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::Route53::HealthCheck', 2);
    template.resourceCountIs('AWS::Route53::HostedZone', 1);
  });

  it('builds DR testing workflow with parallel checks', () => {
    const stack = createTestStack('Workflow');
    const table = new dynamodb.Table(stack, 'Orders', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });
    const primaryBucket = new s3.Bucket(stack, 'PrimaryBucket');
    const drBucket = new s3.Bucket(stack, 'DrBucket');

    new DrTestingWorkflow(stack, 'Workflow', {
      workflowName: `iac-rlhf-${testEnvironmentSuffix}-dr-tests`,
      environmentSuffix: testEnvironmentSuffix,
      timestamp: fixedTimestamp.toString(),
      dynamoTable: table,
      primaryBucket,
      drBucket,
      drRegion: 'us-west-2',
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
  });

  it('supports DR testing workflow without a DR bucket', () => {
    const stack = createTestStack('WorkflowNoDr');
    const table = new dynamodb.Table(stack, 'OrdersNoDr', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    const primaryBucket = new s3.Bucket(stack, 'PrimaryBucketNoDr');

    new DrTestingWorkflow(stack, 'WorkflowNoDrConstruct', {
      workflowName: `iac-rlhf-${testEnvironmentSuffix}-dr-tests-lite`,
      environmentSuffix: testEnvironmentSuffix,
      timestamp: fixedTimestamp.toString(),
      dynamoTable: table,
      primaryBucket,
      drRegion: 'us-west-2',
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
  });
});

describe('ComprehensiveDeployment automation', () => {
  it('derives default configuration from environment variables', () => {
    const originalSuffix = process.env.ENVIRONMENT_SUFFIX;
    const originalRegion = process.env.CDK_DEFAULT_REGION;
    delete process.env.ENVIRONMENT_SUFFIX;
    process.env.CDK_DEFAULT_REGION = 'eu-central-1';

    const deployment = new ComprehensiveDeployment();
    expect((deployment as any).config.environmentSuffix).toBe('dev');
    expect((deployment as any).config.region).toBe('eu-central-1');

    if (originalSuffix === undefined) {
      delete process.env.ENVIRONMENT_SUFFIX;
    } else {
      process.env.ENVIRONMENT_SUFFIX = originalSuffix;
    }
    if (originalRegion === undefined) {
      delete process.env.CDK_DEFAULT_REGION;
    } else {
      process.env.CDK_DEFAULT_REGION = originalRegion;
    }
  });

  it('runs deployment workflow end-to-end', async () => {
    const deployment = new ComprehensiveDeployment();
    const sleepSpy = jest.spyOn<any, any>(deployment as any, 'sleep').mockResolvedValue(undefined);

    await deployment.deploy();

    expect(mockedExecSync).toHaveBeenCalledWith('npm run build && npx cdk synth', expect.any(Object));
    expect(mockedExecSync).toHaveBeenCalledWith(
      expect.stringContaining('npx cdk deploy TapStack'),
      expect.any(Object),
    );
    expect(describeStacksPromise).toHaveBeenCalled();
    expect(listFunctionsPromise).toHaveBeenCalled();
    expect(dynamoListTablesPromise).toHaveBeenCalled();
    expect(s3ListBucketsPromise).toHaveBeenCalled();
    sleepSpy.mockRestore();
  });

  it('fails deployments gracefully and exits with code 1 for string errors', async () => {
    const deployment = new ComprehensiveDeployment();
    mockedExecSync.mockImplementationOnce(() => {
      throw 'build failed';
    });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit');
    }) as never);

    await expect(deployment.deploy()).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });

  it('logs native errors when deployment fails with Error instances', async () => {
    const deployment = new ComprehensiveDeployment();
    mockedExecSync.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit');
    }) as never);

    await expect(deployment.deploy()).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });

  it('validates stack outputs and surfaces errors when missing', async () => {
    const deployment = new ComprehensiveDeployment();
    describeStacksPromise.mockResolvedValueOnce({
      Stacks: [
        {
          StackStatus: 'ROLLBACK_COMPLETE',
          Outputs: [],
        },
      ],
    });

    await expect((deployment as any).validateDeployment()).rejects.toThrow('Stack TapStackqa is not in a stable state');

    describeStacksPromise.mockResolvedValueOnce({
      Stacks: [
        {
          StackStatus: 'CREATE_COMPLETE',
          Outputs: [],
        },
      ],
    });

    await expect((deployment as any).validateDeployment()).rejects.toThrow('Required output OrderTableArnqa not found');

    describeStacksPromise.mockResolvedValueOnce({
      Stacks: [
        {
          StackStatus: 'CREATE_COMPLETE',
        },
      ],
    });

    await expect((deployment as any).validateDeployment()).rejects.toThrow('Required output OrderTableArnqa not found');
  });

  it('runs health checks and logs warnings on partial failures', async () => {
    const deployment = new ComprehensiveDeployment();
    listFunctionsPromise.mockResolvedValueOnce({
      Functions: [
        { FunctionName: `iac-rlhf-${testEnvironmentSuffix}-order-processor` },
        { FunctionName: `iac-rlhf-${testEnvironmentSuffix}-shadow-analysis` },
        { FunctionName: `iac-rlhf-${testEnvironmentSuffix}-log-stream` },
        { FunctionName: `iac-rlhf-${testEnvironmentSuffix}-aggregator` },
      ],
    });
    lambdaInvokePromise
      .mockResolvedValueOnce({ StatusCode: 500 })
      .mockRejectedValueOnce('invoke failure')
      .mockRejectedValueOnce(new Error('invoke boom'))
      .mockResolvedValueOnce({ StatusCode: 200 });
    dynamoListTablesPromise.mockResolvedValueOnce({
      TableNames: [`iac-rlhf-${testEnvironmentSuffix}-orders-${fixedTimestamp}`],
    });
    dynamoDescribeTablePromise.mockResolvedValueOnce({
      Table: { TableStatus: 'UPDATING' },
    });
    s3ListBucketsPromise.mockResolvedValueOnce({
      Buckets: [
        { Name: `iac-rlhf-${testEnvironmentSuffix}-trading-primary-${fixedTimestamp}` },
        { Name: `iac-rlhf-${testEnvironmentSuffix}-trading-dr-${fixedTimestamp}` },
      ],
    });
    s3HeadBucketPromise
      .mockRejectedValueOnce('access denied')
      .mockRejectedValueOnce(new Error('bucket boom'));

    await (deployment as any).runHealthChecks();

    expect(lambdaInvokePromise).toHaveBeenCalledTimes(4);
    expect(dynamoDescribeTablePromise).toHaveBeenCalledTimes(1);
  });

  it('bubbles unrecoverable health check failures', async () => {
    const deployment = new ComprehensiveDeployment();
    listFunctionsPromise.mockRejectedValueOnce(new Error('list failed'));

    await expect((deployment as any).runHealthChecks()).rejects.toThrow('list failed');
  });

  it('skips DynamoDB describe when no trading table exists and handles missing buckets', async () => {
    const deployment = new ComprehensiveDeployment();
    listFunctionsPromise.mockResolvedValueOnce({});
    dynamoListTablesPromise.mockResolvedValueOnce({ TableNames: [] });
    s3ListBucketsPromise.mockResolvedValueOnce({});

    await (deployment as any).runHealthChecks();

    expect(dynamoDescribeTablePromise).not.toHaveBeenCalled();
    expect(s3HeadBucketPromise).not.toHaveBeenCalled();
  });

  it('optionally runs CLI entrypoint when forced', async () => {
    const deploySpy = jest
      .spyOn(ComprehensiveDeployment.prototype, 'deploy')
      .mockResolvedValue();

    await runCliDeployment(true);
    expect(deploySpy).toHaveBeenCalled();

    deploySpy.mockRestore();
    expect(runCliDeployment(false)).toBeUndefined();
  });

  it('reports CLI failures and exits the process', async () => {
    const deploySpy = jest
      .spyOn(ComprehensiveDeployment.prototype, 'deploy')
      .mockRejectedValue(new Error('deploy failed'));
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit');
    }) as never);

    await expect(runCliDeployment(true)).rejects.toThrow('exit');

    exitSpy.mockRestore();
    deploySpy.mockRestore();
  });

  it('awaits sleep helper promises deterministically', async () => {
    const deployment = new ComprehensiveDeployment();
    await expect((deployment as any).sleep(0)).resolves.toBeUndefined();
  });
});
