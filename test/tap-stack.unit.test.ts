import { TapStack } from '../lib/tap-stack';
import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime for unit tests
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack', () => {
  let stack: TapStack;

  beforeAll(() => {
    stack = new TapStack('test-stack', {
      environmentSuffix: 'test',
    });
  });

  it('should create TapStack with correct type', () => {
    expect(stack).toBeInstanceOf(TapStack);
  });

  it('should have required output properties', async () => {
    const blueVpcId = await stack.blueVpcId;
    const greenVpcId = await stack.greenVpcId;
    const transitGatewayId = await stack.transitGatewayId;

    expect(blueVpcId).toBeDefined();
    expect(greenVpcId).toBeDefined();
    expect(transitGatewayId).toBeDefined();
  });

  it('should have database endpoints', async () => {
    const blueDbEndpoint = await stack.blueDbEndpoint;
    const greenDbEndpoint = await stack.greenDbEndpoint;

    expect(blueDbEndpoint).toBeDefined();
    expect(greenDbEndpoint).toBeDefined();
  });

  it('should have ALB DNS names', async () => {
    const blueAlbDns = await stack.blueAlbDns;
    const greenAlbDns = await stack.greenAlbDns;

    expect(blueAlbDns).toBeDefined();
    expect(greenAlbDns).toBeDefined();
  });

  it('should have S3 bucket names', async () => {
    const transactionBucket = await stack.transactionLogsBucketName;
    const complianceBucket = await stack.complianceDocsBucketName;

    expect(transactionBucket).toBeDefined();
    expect(complianceBucket).toBeDefined();
  });

  it('should have DynamoDB table names', async () => {
    const sessionTable = await stack.sessionTableName;
    const rateLimitTable = await stack.rateLimitTableName;

    expect(sessionTable).toBeDefined();
    expect(rateLimitTable).toBeDefined();
  });

  it('should have monitoring outputs', async () => {
    const dashboardUrl = await stack.dashboardUrl;
    const migrationTopicArn = await stack.migrationTopicArn;

    expect(dashboardUrl).toBeDefined();
    expect(migrationTopicArn).toBeDefined();
  });

  it('should have DNS output', async () => {
    const apiDomainName = await stack.apiDomainName;
    expect(apiDomainName).toBeDefined();
  });
});
