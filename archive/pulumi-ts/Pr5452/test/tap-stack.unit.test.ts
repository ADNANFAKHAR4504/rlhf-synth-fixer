import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const cloudWatchCalls: Array<{ name: string; args: any; opts: any }> = [];
const dynamoCalls: Array<{ name: string; args: any; opts: any }> = [];
const s3Calls: Array<{ name: string; args: any; opts: any }> = [];
const lambdaCalls: Array<{ name: string; args: any; opts: any }> = [];
const apiGatewayCalls: Array<{ name: string; args: any; opts: any }> = [];

const cloudWatchInstances: any[] = [];
const dynamoInstances: any[] = [];
const s3Instances: any[] = [];
const lambdaInstances: any[] = [];
const apiGatewayInstances: any[] = [];

jest.mock('../lib/cloudwatch-stack', () => ({
  CloudWatchStack: class {
    public readonly webhookLogGroupName: pulumi.Output<string>;
    public readonly reportLogGroupName: pulumi.Output<string>;

    constructor(name: string, args: any, opts?: any) {
      cloudWatchCalls.push({ name, args, opts });
      this.webhookLogGroupName = pulumi.output(`webhook-log-${args.environmentSuffix}`);
      this.reportLogGroupName = pulumi.output(`report-log-${args.environmentSuffix}`);
      cloudWatchInstances.push(this);
    }
  },
}));

jest.mock('../lib/dynamodb-stack', () => ({
  DynamoDBStack: class {
    public readonly tableName: pulumi.Output<string>;

    constructor(name: string, args: any, opts?: any) {
      dynamoCalls.push({ name, args, opts });
      this.tableName = pulumi.output(`transactions-table-${args.environmentSuffix}`);
      dynamoInstances.push(this);
    }
  },
}));

jest.mock('../lib/s3-stack', () => ({
  S3Stack: class {
    public readonly bucketName: pulumi.Output<string>;

    constructor(name: string, args: any, opts?: any) {
      s3Calls.push({ name, args, opts });
      this.bucketName = pulumi.output(`payment-reports-${args.environmentSuffix}`);
      s3Instances.push(this);
    }
  },
}));

jest.mock('../lib/lambda-stack', () => ({
  LambdaStack: class {
    public readonly webhookLambdaArn: pulumi.Output<string>;
    public readonly webhookLambdaName: pulumi.Output<string>;

    constructor(name: string, args: any, opts?: any) {
      lambdaCalls.push({ name, args, opts });
      this.webhookLambdaArn = pulumi.output(`arn:aws:lambda:mock:${args.environmentSuffix}:function:webhook`);
      this.webhookLambdaName = pulumi.output(`webhook-lambda-${args.environmentSuffix}`);
      lambdaInstances.push(this);
    }
  },
}));

jest.mock('../lib/apigateway-stack', () => ({
  ApiGatewayStack: class {
    public readonly apiEndpoint: pulumi.Output<string>;

    constructor(name: string, args: any, opts?: any) {
      apiGatewayCalls.push({ name, args, opts });
      this.apiEndpoint = pulumi.output(`https://mock.execute-api/${args.environmentSuffix}`);
      apiGatewayInstances.push(this);
    }
  },
}));

pulumi.runtime.setMocks({
  newResource: ({ name, inputs }) => ({
    id: `${name}-id`,
    state: inputs,
  }),
  call: () => ({}),
});

const resetMockState = () => {
  cloudWatchCalls.length = 0;
  dynamoCalls.length = 0;
  s3Calls.length = 0;
  lambdaCalls.length = 0;
  apiGatewayCalls.length = 0;
  cloudWatchInstances.length = 0;
  dynamoInstances.length = 0;
  s3Instances.length = 0;
  lambdaInstances.length = 0;
  apiGatewayInstances.length = 0;
};

describe('TapStack Structure', () => {
  beforeEach(() => {
    resetMockState();
    jest.clearAllMocks();
  });

  it('instantiates with provided props and forwards them to child stacks', async () => {
    await pulumi.runtime.runInPulumiStack(async () => {
      const stack = new TapStack('TestTapStackWithProps', {
        environmentSuffix: 'prod',
        tags: { Owner: 'TeamA' },
      });

      expect(stack).toBeInstanceOf(TapStack);
      expect(cloudWatchCalls).toHaveLength(1);
      expect(dynamoCalls).toHaveLength(1);
      expect(s3Calls).toHaveLength(1);
      expect(lambdaCalls).toHaveLength(1);
      expect(apiGatewayCalls).toHaveLength(1);

      const { args: cloudArgs } = cloudWatchCalls[0];
      const resolvedTags = await pulumi.output(cloudArgs.tags).promise();

      expect(cloudArgs.environmentSuffix).toBe('prod');
      expect(resolvedTags).toMatchObject({
        Environment: 'prod',
        Project: 'payment-processor',
        Owner: 'TeamA',
      });

      const lambdaArgs = lambdaCalls[0].args;
      expect(lambdaArgs.tableName).toBe(dynamoInstances[0].tableName);
      expect(lambdaArgs.bucketName).toBe(s3Instances[0].bucketName);
      expect(lambdaArgs.webhookLogGroupName).toBe(cloudWatchInstances[0].webhookLogGroupName);
      expect(lambdaArgs.reportLogGroupName).toBe(cloudWatchInstances[0].reportLogGroupName);
    });
  });

  it('falls back to default props when none are provided', async () => {
    await pulumi.runtime.runInPulumiStack(async () => {
      const stack = new TapStack('TestTapStackDefault', {} as any);

      expect(stack).toBeInstanceOf(TapStack);
      expect(cloudWatchCalls[0].args.environmentSuffix).toBe('dev');

      const tags = await pulumi.output(cloudWatchCalls[0].args.tags).promise();
      expect(tags).toMatchObject({
        Environment: 'dev',
        Project: 'payment-processor',
      });

      await expect(stack.tableName.promise()).resolves.toBe('transactions-table-dev');
      await expect(stack.bucketName.promise()).resolves.toBe('payment-reports-dev');
      await expect(stack.apiEndpoint.promise()).resolves.toBe('https://mock.execute-api/dev');
    });
  });
});
