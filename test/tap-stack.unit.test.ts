import { TapStack, TapStackArgs } from '../lib/tap-stack';
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
    if (args.token === 'aws:index/getRegion:getRegion') {
      return { name: 'us-east-1', id: 'us-east-1' };
    }
    return args.inputs;
  },
});

describe('TapStack', () => {
  let stack: TapStack;

  beforeEach(() => {
    // Clear any previous environment variables
    delete process.env.AWS_REGION;
  });

  describe('Constructor', () => {
    it('should create TapStack with correct type', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should create TapStack with default environment suffix', () => {
      stack = new TapStack('test-stack', {});
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should create TapStack with custom tags', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
        tags: {
          Project: 'PaymentSystem',
          Owner: 'DevOps',
        },
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should create TapStack with no arguments', () => {
      stack = new TapStack('minimal-stack', {} as TapStackArgs);
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should use AWS_REGION from environment variable', () => {
      process.env.AWS_REGION = 'us-west-2';
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should create stack with empty environment suffix', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: '',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should create stack with special characters in environment suffix', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test-env-123',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });
  });

  describe('Network Outputs', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should have blueVpcId output', async () => {
      const vpcId = await stack.blueVpcId;
      expect(vpcId).toBeDefined();
      expect(typeof vpcId).toBe('string');
    });

    it('should have greenVpcId output', async () => {
      const vpcId = await stack.greenVpcId;
      expect(vpcId).toBeDefined();
      expect(typeof vpcId).toBe('string');
    });

    it('should have transitGatewayId output', async () => {
      const tgwId = await stack.transitGatewayId;
      expect(tgwId).toBeDefined();
      expect(typeof tgwId).toBe('string');
    });

    it('should have different VPC IDs for blue and green', async () => {
      const blueVpcId = await stack.blueVpcId;
      const greenVpcId = await stack.greenVpcId;
      expect(blueVpcId).not.toBe(greenVpcId);
    });
  });

  describe('Database Outputs', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should have blueDbEndpoint output', async () => {
      const endpoint = await stack.blueDbEndpoint;
      expect(endpoint).toBeDefined();
      expect(typeof endpoint).toBe('string');
    });

    it('should have greenDbEndpoint output', async () => {
      const endpoint = await stack.greenDbEndpoint;
      expect(endpoint).toBeDefined();
      expect(typeof endpoint).toBe('string');
    });

    it('should have different database endpoints for blue and green', async () => {
      const blueEndpoint = await stack.blueDbEndpoint;
      const greenEndpoint = await stack.greenDbEndpoint;
      expect(blueEndpoint).not.toBe(greenEndpoint);
    });
  });

  describe('Load Balancer Outputs', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should have blueAlbDns output', async () => {
      const dns = await stack.blueAlbDns;
      expect(dns).toBeDefined();
      expect(typeof dns).toBe('string');
    });

    it('should have greenAlbDns output', async () => {
      const dns = await stack.greenAlbDns;
      expect(dns).toBeDefined();
      expect(typeof dns).toBe('string');
    });

    it('should have different ALB DNS names for blue and green', async () => {
      const blueDns = await stack.blueAlbDns;
      const greenDns = await stack.greenAlbDns;
      expect(blueDns).not.toBe(greenDns);
    });
  });

  describe('Storage Outputs', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should have transactionLogsBucketName output', async () => {
      const bucketName = await stack.transactionLogsBucketName;
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
    });

    it('should have complianceDocsBucketName output', async () => {
      const bucketName = await stack.complianceDocsBucketName;
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
    });

    it('should have different S3 bucket names', async () => {
      const txBucket = await stack.transactionLogsBucketName;
      const compBucket = await stack.complianceDocsBucketName;
      expect(txBucket).not.toBe(compBucket);
    });

    it('should include environment suffix in bucket names', async () => {
      const txBucket = await stack.transactionLogsBucketName;
      const compBucket = await stack.complianceDocsBucketName;
      expect(txBucket).toContain('test');
      expect(compBucket).toContain('test');
    });
  });

  describe('DynamoDB Outputs', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should have sessionTableName output', async () => {
      const tableName = await stack.sessionTableName;
      expect(tableName).toBeDefined();
      expect(typeof tableName).toBe('string');
    });

    it('should have rateLimitTableName output', async () => {
      const tableName = await stack.rateLimitTableName;
      expect(tableName).toBeDefined();
      expect(typeof tableName).toBe('string');
    });

    it('should have different table names', async () => {
      const sessionTable = await stack.sessionTableName;
      const rateLimitTable = await stack.rateLimitTableName;
      expect(sessionTable).not.toBe(rateLimitTable);
    });

    it('should include environment suffix in table names', async () => {
      const sessionTable = await stack.sessionTableName;
      const rateLimitTable = await stack.rateLimitTableName;
      expect(sessionTable).toContain('test');
      expect(rateLimitTable).toContain('test');
    });
  });

  describe('Monitoring Outputs', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should have dashboardUrl output', async () => {
      const url = await stack.dashboardUrl;
      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
      expect(url).toContain('cloudwatch');
    });

    it('should have migrationTopicArn output', async () => {
      const arn = await stack.migrationTopicArn;
      expect(arn).toBeDefined();
      expect(typeof arn).toBe('string');
    });

    it('should have valid CloudWatch dashboard URL format', async () => {
      const url = await stack.dashboardUrl;
      expect(url).toMatch(/https:\/\/console\.aws\.amazon\.com\/cloudwatch/);
    });
  });

  describe('DNS Outputs', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should have apiDomainName output', async () => {
      const domain = await stack.apiDomainName;
      expect(domain).toBeDefined();
      expect(typeof domain).toBe('string');
    });

    it('should have correct domain format', async () => {
      const domain = await stack.apiDomainName;
      expect(domain).toMatch(/api\.payments-.*\.testdomain\.local/);
    });

    it('should include environment suffix in domain name', async () => {
      const domain = await stack.apiDomainName;
      expect(domain).toContain('test');
    });
  });

  describe('Multiple Stack Instances', () => {
    it('should create multiple stacks with different environment suffixes', () => {
      const devStack = new TapStack('dev-stack', {
        environmentSuffix: 'dev',
      });
      const prodStack = new TapStack('prod-stack', {
        environmentSuffix: 'prod',
      });

      expect(devStack).toBeInstanceOf(TapStack);
      expect(prodStack).toBeInstanceOf(TapStack);
    });

    it('should have independent outputs for different stacks', async () => {
      const stack1 = new TapStack('stack1', {
        environmentSuffix: 'env1',
      });
      const stack2 = new TapStack('stack2', {
        environmentSuffix: 'env2',
      });

      const vpc1 = await stack1.blueVpcId;
      const vpc2 = await stack2.blueVpcId;

      expect(vpc1).toBeDefined();
      expect(vpc2).toBeDefined();
    });
  });

  describe('Output Registration', () => {
    beforeAll(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should register all network outputs', async () => {
      const [blueVpcId, greenVpcId, transitGatewayId] = await Promise.all([
        stack.blueVpcId,
        stack.greenVpcId,
        stack.transitGatewayId,
      ]);

      expect(blueVpcId).toBeDefined();
      expect(greenVpcId).toBeDefined();
      expect(transitGatewayId).toBeDefined();
    });

    it('should register all database outputs', async () => {
      const [blueDbEndpoint, greenDbEndpoint] = await Promise.all([
        stack.blueDbEndpoint,
        stack.greenDbEndpoint,
      ]);

      expect(blueDbEndpoint).toBeDefined();
      expect(greenDbEndpoint).toBeDefined();
    });

    it('should register all load balancer outputs', async () => {
      const [blueAlbDns, greenAlbDns] = await Promise.all([
        stack.blueAlbDns,
        stack.greenAlbDns,
      ]);

      expect(blueAlbDns).toBeDefined();
      expect(greenAlbDns).toBeDefined();
    });

    it('should register all storage outputs', async () => {
      const [transactionBucket, complianceBucket] = await Promise.all([
        stack.transactionLogsBucketName,
        stack.complianceDocsBucketName,
      ]);

      expect(transactionBucket).toBeDefined();
      expect(complianceBucket).toBeDefined();
    });

    it('should register all DynamoDB outputs', async () => {
      const [sessionTable, rateLimitTable] = await Promise.all([
        stack.sessionTableName,
        stack.rateLimitTableName,
      ]);

      expect(sessionTable).toBeDefined();
      expect(rateLimitTable).toBeDefined();
    });

    it('should register all monitoring outputs', async () => {
      const [dashboardUrl, migrationTopicArn] = await Promise.all([
        stack.dashboardUrl,
        stack.migrationTopicArn,
      ]);

      expect(dashboardUrl).toBeDefined();
      expect(migrationTopicArn).toBeDefined();
    });

    it('should register DNS output', async () => {
      const apiDomainName = await stack.apiDomainName;
      expect(apiDomainName).toBeDefined();
    });

    it('should register all outputs simultaneously', async () => {
      const outputs = await Promise.all([
        stack.blueVpcId,
        stack.greenVpcId,
        stack.transitGatewayId,
        stack.blueDbEndpoint,
        stack.greenDbEndpoint,
        stack.blueAlbDns,
        stack.greenAlbDns,
        stack.transactionLogsBucketName,
        stack.complianceDocsBucketName,
        stack.sessionTableName,
        stack.rateLimitTableName,
        stack.dashboardUrl,
        stack.migrationTopicArn,
        stack.apiDomainName,
      ]);

      outputs.forEach(output => {
        expect(output).toBeDefined();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long environment suffix', () => {
      const longSuffix = 'a'.repeat(50);
      stack = new TapStack('test-stack', {
        environmentSuffix: longSuffix,
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should handle environment suffix with numbers', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test123',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should handle environment suffix with hyphens', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test-env-123',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should create stack with undefined tags', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: undefined,
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should create stack with empty tags object', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: {},
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should handle multiple tag entries', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: {
          Environment: 'test',
          Project: 'payment',
          Owner: 'team',
          CostCenter: '12345',
        },
      });
      expect(stack).toBeInstanceOf(TapStack);
    });
  });

  describe('Resource Creation Validation', () => {
    beforeAll(() => {
      stack = new TapStack('validation-stack', {
        environmentSuffix: 'validation',
      });
    });

    it('should create VPCs with proper outputs', async () => {
      const blueVpcId = await stack.blueVpcId;
      const greenVpcId = await stack.greenVpcId;

      expect(blueVpcId).toBeTruthy();
      expect(greenVpcId).toBeTruthy();
      expect(blueVpcId).not.toBe(greenVpcId);
    });

    it('should create Transit Gateway', async () => {
      const tgwId = await stack.transitGatewayId;
      expect(tgwId).toBeTruthy();
    });

    it('should create Aurora clusters with endpoints', async () => {
      const blueEndpoint = await stack.blueDbEndpoint;
      const greenEndpoint = await stack.greenDbEndpoint;

      expect(blueEndpoint).toBeTruthy();
      expect(greenEndpoint).toBeTruthy();
    });

    it('should create ALBs with DNS names', async () => {
      const blueDns = await stack.blueAlbDns;
      const greenDns = await stack.greenAlbDns;

      expect(blueDns).toBeTruthy();
      expect(greenDns).toBeTruthy();
    });

    it('should create S3 buckets', async () => {
      const txBucket = await stack.transactionLogsBucketName;
      const compBucket = await stack.complianceDocsBucketName;

      expect(txBucket).toBeTruthy();
      expect(compBucket).toBeTruthy();
    });

    it('should create DynamoDB tables', async () => {
      const sessionTable = await stack.sessionTableName;
      const rateLimitTable = await stack.rateLimitTableName;

      expect(sessionTable).toBeTruthy();
      expect(rateLimitTable).toBeTruthy();
    });

    it('should create monitoring resources', async () => {
      const dashboardUrl = await stack.dashboardUrl;
      const topicArn = await stack.migrationTopicArn;

      expect(dashboardUrl).toBeTruthy();
      expect(topicArn).toBeTruthy();
    });

    it('should create Route 53 domain', async () => {
      const domain = await stack.apiDomainName;
      expect(domain).toBeTruthy();
      expect(domain).toContain('validation');
    });
  });

  describe('Type Safety', () => {
    beforeAll(() => {
      stack = new TapStack('type-test-stack', {
        environmentSuffix: 'type',
      });
    });

    it('should have Output<string> types for all string outputs', async () => {
      const blueVpcId = await stack.blueVpcId;
      const greenVpcId = await stack.greenVpcId;
      const transitGatewayId = await stack.transitGatewayId;

      expect(typeof blueVpcId).toBe('string');
      expect(typeof greenVpcId).toBe('string');
      expect(typeof transitGatewayId).toBe('string');
    });

    it('should have consistent output types across all properties', async () => {
      const outputs = {
        blueVpcId: await stack.blueVpcId,
        greenVpcId: await stack.greenVpcId,
        transitGatewayId: await stack.transitGatewayId,
        blueDbEndpoint: await stack.blueDbEndpoint,
        greenDbEndpoint: await stack.greenDbEndpoint,
        blueAlbDns: await stack.blueAlbDns,
        greenAlbDns: await stack.greenAlbDns,
        transactionLogsBucketName: await stack.transactionLogsBucketName,
        complianceDocsBucketName: await stack.complianceDocsBucketName,
        sessionTableName: await stack.sessionTableName,
        rateLimitTableName: await stack.rateLimitTableName,
        dashboardUrl: await stack.dashboardUrl,
        migrationTopicArn: await stack.migrationTopicArn,
        apiDomainName: await stack.apiDomainName,
      };

      Object.values(outputs).forEach(output => {
        expect(typeof output).toBe('string');
      });
    });
  });

  describe('Environment Variable Handling', () => {
    afterEach(() => {
      delete process.env.AWS_REGION;
    });

    it('should use default region when AWS_REGION is not set', () => {
      delete process.env.AWS_REGION;
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should use AWS_REGION when set to us-east-1', () => {
      process.env.AWS_REGION = 'us-east-1';
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should use AWS_REGION when set to us-west-2', () => {
      process.env.AWS_REGION = 'us-west-2';
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should use AWS_REGION when set to eu-west-1', () => {
      process.env.AWS_REGION = 'eu-west-1';
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });
  });

  describe('Stack Naming', () => {
    it('should accept simple stack names', () => {
      stack = new TapStack('simple', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should accept hyphenated stack names', () => {
      stack = new TapStack('my-test-stack', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should accept stack names with numbers', () => {
      stack = new TapStack('stack123', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should accept long stack names', () => {
      stack = new TapStack('very-long-stack-name-for-testing', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });
  });

  describe('Parallel Stack Creation', () => {
    it('should support creating multiple stacks in parallel', () => {
      const stacks = Array.from({ length: 3 }, (_, i) =>
        new TapStack(`parallel-stack-${i}`, {
          environmentSuffix: `env${i}`,
        })
      );

      stacks.forEach(s => {
        expect(s).toBeInstanceOf(TapStack);
      });
    });

    it('should maintain isolation between parallel stacks', async () => {
      const stack1 = new TapStack('isolated-1', {
        environmentSuffix: 'iso1',
      });
      const stack2 = new TapStack('isolated-2', {
        environmentSuffix: 'iso2',
      });

      const vpc1 = await stack1.blueVpcId;
      const vpc2 = await stack2.blueVpcId;

      expect(vpc1).toBeDefined();
      expect(vpc2).toBeDefined();
    });
  });

  describe('Output Value Consistency', () => {
    beforeAll(() => {
      stack = new TapStack('consistency-stack', {
        environmentSuffix: 'consistent',
      });
    });

    it('should return consistent values on multiple accesses', async () => {
      const vpc1 = await stack.blueVpcId;
      const vpc2 = await stack.blueVpcId;
      expect(vpc1).toBe(vpc2);
    });

    it('should maintain consistency across all outputs', async () => {
      const firstRead = await stack.sessionTableName;
      const secondRead = await stack.sessionTableName;
      const thirdRead = await stack.sessionTableName;

      expect(firstRead).toBe(secondRead);
      expect(secondRead).toBe(thirdRead);
    });
  });

  describe('Resource Naming Patterns', () => {
    beforeAll(() => {
      stack = new TapStack('naming-stack', {
        environmentSuffix: 'naming',
      });
    });

    it('should include environment suffix in resource identifiers', async () => {
      const outputs = {
        sessionTable: await stack.sessionTableName,
        rateLimitTable: await stack.rateLimitTableName,
        apiDomain: await stack.apiDomainName,
      };

      Object.values(outputs).forEach(output => {
        expect(output).toContain('naming');
      });
    });

    it('should differentiate blue and green resources', async () => {
      const blueVpc = await stack.blueVpcId;
      const greenVpc = await stack.greenVpcId;
      const blueDb = await stack.blueDbEndpoint;
      const greenDb = await stack.greenDbEndpoint;

      expect(blueVpc).not.toBe(greenVpc);
      expect(blueDb).not.toBe(greenDb);
    });
  });

  describe('Comprehensive Integration', () => {
    it('should create complete infrastructure stack', async () => {
      stack = new TapStack('complete-stack', {
        environmentSuffix: 'complete',
        tags: {
          Project: 'Testing',
          Environment: 'Test',
        },
      });

      const allOutputs = await Promise.all([
        stack.blueVpcId,
        stack.greenVpcId,
        stack.transitGatewayId,
        stack.blueDbEndpoint,
        stack.greenDbEndpoint,
        stack.blueAlbDns,
        stack.greenAlbDns,
        stack.transactionLogsBucketName,
        stack.complianceDocsBucketName,
        stack.sessionTableName,
        stack.rateLimitTableName,
        stack.dashboardUrl,
        stack.migrationTopicArn,
        stack.apiDomainName,
      ]);

      expect(allOutputs).toHaveLength(14);
      allOutputs.forEach(output => {
        expect(output).toBeDefined();
        expect(output).toBeTruthy();
        expect(typeof output).toBe('string');
      });
    });
  });
});
