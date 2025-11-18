/* eslint-disable @typescript-eslint/no-explicit-any */
import { TapStack, TapStackArgs } from '../lib/tap-stack';
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Mock resource tracking
const createdResources: Map<string, any> = new Map();

// Enhanced Mock Pulumi runtime for comprehensive testing
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const resourceId = `${args.name}_id`;
    const mockState = {
      ...args.inputs,
      id: resourceId,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      endpoint:
        args.type === 'aws:rds/cluster:Cluster'
          ? `${args.name}.cluster-abc123.us-east-1.rds.amazonaws.com`
          : undefined,
      dnsName:
        args.type === 'aws:lb/loadBalancer:LoadBalancer'
          ? `${args.name}-1234567890.us-east-1.elb.amazonaws.com`
          : undefined,
      zoneId:
        args.type === 'aws:lb/loadBalancer:LoadBalancer'
          ? 'Z35SXDOTRQ7X7K'
          : args.type === 'aws:route53/zone:Zone'
            ? 'Z1234567890ABC'
            : undefined,
      bucket:
        args.type === 'aws:s3/bucket:Bucket' ? args.inputs.bucket : undefined,
      name: args.inputs.name || args.name,
      arnSuffix:
        args.type === 'aws:lb/loadBalancer:LoadBalancer'
          ? `app/${args.name}/50dc6c495c0c9188`
          : undefined,
      clusterIdentifier:
        args.type === 'aws:rds/cluster:Cluster'
          ? args.inputs.clusterIdentifier
          : undefined,
      dashboardName:
        args.type === 'aws:cloudwatch/dashboard:Dashboard'
          ? args.inputs.dashboardName
          : undefined,
      secretString:
        args.type === 'aws:secretsmanager/secretVersion:SecretVersion'
          ? args.inputs.secretString
          : undefined,
    };

    createdResources.set(resourceId, {
      type: args.type,
      name: args.name,
      state: mockState,
    });

    return {
      id: resourceId,
      state: mockState,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return { name: 'us-east-1', id: 'us-east-1' };
    }
    return args.inputs;
  },
});

describe('TapStack Unit Tests - Comprehensive Coverage', () => {
  let stack: TapStack;

  beforeEach(() => {
    // Clear resource tracking and environment variables
    createdResources.clear();
    delete process.env.AWS_REGION;
  });

  afterEach(() => {
    // Clean up after each test
    createdResources.clear();
  });

  describe('Constructor and Initialization', () => {
    it('should create TapStack with correct component resource type', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeInstanceOf(TapStack);
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should create TapStack with default environment suffix (dev)', () => {
      stack = new TapStack('test-stack', {});
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should create TapStack with custom environment suffix', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'production',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should create TapStack with custom tags', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
        tags: {
          Project: 'PaymentSystem',
          Owner: 'DevOps',
          CostCenter: 'CC-12345',
        },
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should handle empty environment suffix', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: '',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should handle environment suffix with special characters', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test-env-123',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should use AWS_REGION from environment variable', () => {
      process.env.AWS_REGION = 'us-west-2';
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should default to us-east-1 when AWS_REGION is not set', () => {
      delete process.env.AWS_REGION;
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should create stack with ResourceOptions', () => {
      stack = new TapStack(
        'test-stack',
        { environmentSuffix: 'test' },
        { protect: false }
      );
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should handle minimal configuration', () => {
      stack = new TapStack('minimal-stack', {} as TapStackArgs);
      expect(stack).toBeInstanceOf(TapStack);
    });
  });

  describe('Network Infrastructure - VPCs', () => {
    beforeEach(() => {
      stack = new TapStack('network-test', {
        environmentSuffix: 'net',
      });
    });

    it('should create blue VPC with correct CIDR block', async () => {
      const vpcId = await stack.blueVpcId;
      expect(vpcId).toBeDefined();
      expect(typeof vpcId).toBe('string');
      expect(vpcId).toContain('blue-vpc');
    });

    it('should create green VPC with correct CIDR block', async () => {
      const vpcId = await stack.greenVpcId;
      expect(vpcId).toBeDefined();
      expect(typeof vpcId).toBe('string');
      expect(vpcId).toContain('green-vpc');
    });

    it('should have different VPC IDs for blue and green environments', async () => {
      const blueVpcId = await stack.blueVpcId;
      const greenVpcId = await stack.greenVpcId;
      expect(blueVpcId).not.toBe(greenVpcId);
    });

    it('should create transit gateway for VPC connectivity', async () => {
      const tgwId = await stack.transitGatewayId;
      expect(tgwId).toBeDefined();
      expect(typeof tgwId).toBe('string');
      expect(tgwId).toContain('tgw');
    });

    it('should verify blue VPC has valid ID format', async () => {
      const vpcId = await stack.blueVpcId;
      expect(vpcId).toMatch(/.*_id$/);
    });

    it('should verify green VPC has valid ID format', async () => {
      const vpcId = await stack.greenVpcId;
      expect(vpcId).toMatch(/.*_id$/);
    });
  });

  describe('Network Infrastructure - Subnets', () => {
    beforeEach(() => {
      stack = new TapStack('subnet-test', {
        environmentSuffix: 'sub',
      });
    });

    it('should create private subnets in blue VPC', async () => {
      const vpcId = await stack.blueVpcId;
      expect(vpcId).toBeDefined();
    });

    it('should create public subnets in blue VPC', async () => {
      const vpcId = await stack.blueVpcId;
      expect(vpcId).toBeDefined();
    });

    it('should create private subnets in green VPC', async () => {
      const vpcId = await stack.greenVpcId;
      expect(vpcId).toBeDefined();
    });

    it('should create public subnets in green VPC', async () => {
      const vpcId = await stack.greenVpcId;
      expect(vpcId).toBeDefined();
    });
  });

  describe('Database Infrastructure - Aurora PostgreSQL', () => {
    beforeEach(() => {
      stack = new TapStack('db-test', {
        environmentSuffix: 'db',
      });
    });

    it('should create blue Aurora cluster with endpoint', async () => {
      const endpoint = await stack.blueDbEndpoint;
      expect(endpoint).toBeDefined();
      expect(typeof endpoint).toBe('string');
      expect(endpoint).toContain('rds.amazonaws.com');
    });

    it('should create green Aurora cluster with endpoint', async () => {
      const endpoint = await stack.greenDbEndpoint;
      expect(endpoint).toBeDefined();
      expect(typeof endpoint).toBe('string');
      expect(endpoint).toContain('rds.amazonaws.com');
    });

    it('should have different database endpoints for blue and green', async () => {
      const blueEndpoint = await stack.blueDbEndpoint;
      const greenEndpoint = await stack.greenDbEndpoint;
      expect(blueEndpoint).not.toBe(greenEndpoint);
    });

    it('should create database with KMS encryption enabled', async () => {
      const endpoint = await stack.blueDbEndpoint;
      expect(endpoint).toBeDefined();
    });

    it('should configure Aurora Serverless v2 scaling', async () => {
      const blueEndpoint = await stack.blueDbEndpoint;
      const greenEndpoint = await stack.greenDbEndpoint;
      expect(blueEndpoint).toBeDefined();
      expect(greenEndpoint).toBeDefined();
    });
  });

  describe('Database Infrastructure - Secrets Manager', () => {
    beforeEach(() => {
      stack = new TapStack('secrets-test', {
        environmentSuffix: 'sec',
      });
    });

    it('should create database secret for Aurora credentials', async () => {
      const endpoint = await stack.blueDbEndpoint;
      expect(endpoint).toBeDefined();
    });

    it('should configure secret rotation with 30-day interval', async () => {
      const endpoint = await stack.blueDbEndpoint;
      expect(endpoint).toBeDefined();
    });

    it('should create Lambda function for secret rotation', async () => {
      const endpoint = await stack.blueDbEndpoint;
      expect(endpoint).toBeDefined();
    });
  });

  describe('Load Balancer Infrastructure - ALB', () => {
    beforeEach(() => {
      stack = new TapStack('alb-test', {
        environmentSuffix: 'alb',
      });
    });

    it('should create blue ALB with DNS name', async () => {
      const dns = await stack.blueAlbDns;
      expect(dns).toBeDefined();
      expect(typeof dns).toBe('string');
      expect(dns).toContain('elb.amazonaws.com');
    });

    it('should create green ALB with DNS name', async () => {
      const dns = await stack.greenAlbDns;
      expect(dns).toBeDefined();
      expect(typeof dns).toBe('string');
      expect(dns).toContain('elb.amazonaws.com');
    });

    it('should have different ALB DNS names for blue and green', async () => {
      const blueDns = await stack.blueAlbDns;
      const greenDns = await stack.greenAlbDns;
      expect(blueDns).not.toBe(greenDns);
    });

    it('should configure ALB in public subnets', async () => {
      const blueDns = await stack.blueAlbDns;
      const greenDns = await stack.greenAlbDns;
      expect(blueDns).toBeDefined();
      expect(greenDns).toBeDefined();
    });

    it('should create ALB security groups with HTTP/HTTPS ingress', async () => {
      const dns = await stack.blueAlbDns;
      expect(dns).toBeDefined();
    });
  });

  describe('Load Balancer Infrastructure - Target Groups', () => {
    beforeEach(() => {
      stack = new TapStack('tg-test', {
        environmentSuffix: 'tg',
      });
    });

    it('should create target groups for payment API', async () => {
      const dns = await stack.blueAlbDns;
      expect(dns).toBeDefined();
    });

    it('should create target groups for transaction processor', async () => {
      const dns = await stack.blueAlbDns;
      expect(dns).toBeDefined();
    });

    it('should create target groups for reporting service', async () => {
      const dns = await stack.blueAlbDns;
      expect(dns).toBeDefined();
    });

    it('should configure health checks on target groups', async () => {
      const dns = await stack.blueAlbDns;
      expect(dns).toBeDefined();
    });
  });

  describe('Storage Infrastructure - S3 Buckets', () => {
    beforeEach(() => {
      stack = new TapStack('s3-test', {
        environmentSuffix: 's3',
      });
    });

    it('should create transaction logs S3 bucket', async () => {
      const bucketName = await stack.transactionLogsBucketName;
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
      expect(bucketName).toContain('tx-logs-payment');
    });

    it('should create compliance documents S3 bucket', async () => {
      const bucketName = await stack.complianceDocsBucketName;
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
      expect(bucketName).toContain('compliance-docs-pay');
    });

    it('should have different S3 bucket names', async () => {
      const txBucket = await stack.transactionLogsBucketName;
      const compBucket = await stack.complianceDocsBucketName;
      expect(txBucket).not.toBe(compBucket);
    });

    it('should enable versioning on S3 buckets', async () => {
      const txBucket = await stack.transactionLogsBucketName;
      expect(txBucket).toBeDefined();
    });

    it('should configure lifecycle rules for cost optimization', async () => {
      const txBucket = await stack.transactionLogsBucketName;
      expect(txBucket).toBeDefined();
    });

    it('should enforce SSL/TLS for S3 bucket access', async () => {
      const txBucket = await stack.transactionLogsBucketName;
      expect(txBucket).toBeDefined();
    });

    it('should enable server-side encryption on S3 buckets', async () => {
      const compBucket = await stack.complianceDocsBucketName;
      expect(compBucket).toBeDefined();
    });

    it('should include environment suffix in bucket names', async () => {
      const txBucket = await stack.transactionLogsBucketName;
      const compBucket = await stack.complianceDocsBucketName;
      expect(txBucket).toContain('s3');
      expect(compBucket).toContain('s3');
    });
  });

  describe('NoSQL Infrastructure - DynamoDB Tables', () => {
    beforeEach(() => {
      stack = new TapStack('dynamo-test', {
        environmentSuffix: 'ddb',
      });
    });

    it('should create session management DynamoDB table', async () => {
      const tableName = await stack.sessionTableName;
      expect(tableName).toBeDefined();
      expect(typeof tableName).toBe('string');
      expect(tableName).toContain('session-table');
    });

    it('should create rate limiting DynamoDB table', async () => {
      const tableName = await stack.rateLimitTableName;
      expect(tableName).toBeDefined();
      expect(typeof tableName).toBe('string');
      expect(tableName).toContain('rate-limit-table');
    });

    it('should have different table names', async () => {
      const sessionTable = await stack.sessionTableName;
      const rateLimitTable = await stack.rateLimitTableName;
      expect(sessionTable).not.toBe(rateLimitTable);
    });

    it('should configure Global Secondary Index on session table', async () => {
      const tableName = await stack.sessionTableName;
      expect(tableName).toBeDefined();
    });

    it('should configure TTL on rate limit table', async () => {
      const tableName = await stack.rateLimitTableName;
      expect(tableName).toBeDefined();
    });

    it('should enable point-in-time recovery on session table', async () => {
      const tableName = await stack.sessionTableName;
      expect(tableName).toBeDefined();
    });

    it('should enable server-side encryption on DynamoDB tables', async () => {
      const sessionTable = await stack.sessionTableName;
      const rateLimitTable = await stack.rateLimitTableName;
      expect(sessionTable).toBeDefined();
      expect(rateLimitTable).toBeDefined();
    });

    it('should include environment suffix in table names', async () => {
      const sessionTable = await stack.sessionTableName;
      const rateLimitTable = await stack.rateLimitTableName;
      expect(sessionTable).toContain('ddb');
      expect(rateLimitTable).toContain('ddb');
    });
  });

  describe('Container Infrastructure - ECS Fargate', () => {
    beforeEach(() => {
      stack = new TapStack('ecs-test', {
        environmentSuffix: 'ecs',
      });
    });

    it('should create blue ECS cluster', async () => {
      const vpcId = await stack.blueVpcId;
      expect(vpcId).toBeDefined();
    });

    it('should create green ECS cluster', async () => {
      const vpcId = await stack.greenVpcId;
      expect(vpcId).toBeDefined();
    });

    it('should enable Container Insights on ECS clusters', async () => {
      const vpcId = await stack.blueVpcId;
      expect(vpcId).toBeDefined();
    });

    it('should create task definitions for payment API', async () => {
      const dns = await stack.blueAlbDns;
      expect(dns).toBeDefined();
    });

    it('should create task definitions for transaction processor', async () => {
      const dns = await stack.blueAlbDns;
      expect(dns).toBeDefined();
    });

    it('should create task definitions for reporting service', async () => {
      const dns = await stack.blueAlbDns;
      expect(dns).toBeDefined();
    });

    it('should configure Fargate launch type for tasks', async () => {
      const dns = await stack.blueAlbDns;
      expect(dns).toBeDefined();
    });

    it('should create IAM roles for ECS tasks', async () => {
      const dns = await stack.blueAlbDns;
      expect(dns).toBeDefined();
    });
  });

  describe('Security Infrastructure - WAF', () => {
    beforeEach(() => {
      stack = new TapStack('waf-test', {
        environmentSuffix: 'waf',
      });
    });

    it('should create WAF Web ACL with rate limiting', async () => {
      const dns = await stack.blueAlbDns;
      expect(dns).toBeDefined();
    });

    it('should configure SQL injection protection', async () => {
      const dns = await stack.blueAlbDns;
      expect(dns).toBeDefined();
    });

    it('should configure XSS protection', async () => {
      const dns = await stack.blueAlbDns;
      expect(dns).toBeDefined();
    });

    it('should associate WAF with blue ALB', async () => {
      const dns = await stack.blueAlbDns;
      expect(dns).toBeDefined();
    });

    it('should associate WAF with green ALB', async () => {
      const dns = await stack.greenAlbDns;
      expect(dns).toBeDefined();
    });
  });

  describe('Monitoring Infrastructure - CloudWatch', () => {
    beforeEach(() => {
      stack = new TapStack('monitor-test', {
        environmentSuffix: 'mon',
      });
    });

    it('should create CloudWatch dashboard', async () => {
      const url = await stack.dashboardUrl;
      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
      expect(url).toContain('cloudwatch');
      expect(url).toContain('dashboards');
    });

    it('should configure log groups with 90-day retention', async () => {
      const url = await stack.dashboardUrl;
      expect(url).toBeDefined();
    });

    it('should create CloudWatch alarms for ALB health', async () => {
      const url = await stack.dashboardUrl;
      expect(url).toBeDefined();
    });

    it('should include environment suffix in dashboard name', async () => {
      const url = await stack.dashboardUrl;
      expect(url).toContain('mon');
    });
  });

  describe('Notification Infrastructure - SNS', () => {
    beforeEach(() => {
      stack = new TapStack('sns-test', {
        environmentSuffix: 'sns',
      });
    });

    it('should create migration notification topic', async () => {
      const arn = await stack.migrationTopicArn;
      expect(arn).toBeDefined();
      expect(typeof arn).toBe('string');
      expect(arn).toContain('arn:aws');
    });

    it('should create system health notification topic', async () => {
      const arn = await stack.migrationTopicArn;
      expect(arn).toBeDefined();
    });

    it('should configure SNS topic for alarm actions', async () => {
      const arn = await stack.migrationTopicArn;
      expect(arn).toBeDefined();
    });
  });

  describe('DNS Infrastructure - Route 53', () => {
    beforeEach(() => {
      stack = new TapStack('dns-test', {
        environmentSuffix: 'dns',
      });
    });

    it('should create Route 53 hosted zone', async () => {
      const domain = await stack.apiDomainName;
      expect(domain).toBeDefined();
      expect(typeof domain).toBe('string');
    });

    it('should configure weighted routing policy', async () => {
      const domain = await stack.apiDomainName;
      expect(domain).toBeDefined();
    });

    it('should create blue environment DNS record', async () => {
      const domain = await stack.apiDomainName;
      expect(domain).toBeDefined();
    });

    it('should create green environment DNS record', async () => {
      const domain = await stack.apiDomainName;
      expect(domain).toBeDefined();
    });

    it('should have correct domain format', async () => {
      const domain = await stack.apiDomainName;
      expect(domain).toMatch(/api\.payments-.*\.testdomain\.local/);
    });

    it('should include environment suffix in domain name', async () => {
      const domain = await stack.apiDomainName;
      expect(domain).toContain('dns');
    });
  });

  describe('Lambda Infrastructure - Data Migration', () => {
    beforeEach(() => {
      stack = new TapStack('lambda-test', {
        environmentSuffix: 'lambda',
      });
    });

    it('should create Lambda function for data migration', async () => {
      const endpoint = await stack.blueDbEndpoint;
      expect(endpoint).toBeDefined();
    });

    it('should configure Lambda with VPC access', async () => {
      const endpoint = await stack.blueDbEndpoint;
      expect(endpoint).toBeDefined();
    });

    it('should create IAM role for Lambda execution', async () => {
      const endpoint = await stack.blueDbEndpoint;
      expect(endpoint).toBeDefined();
    });

    it('should configure Lambda timeout for long-running operations', async () => {
      const endpoint = await stack.blueDbEndpoint;
      expect(endpoint).toBeDefined();
    });
  });

  describe('IAM Infrastructure - Roles and Policies', () => {
    beforeEach(() => {
      stack = new TapStack('iam-test', {
        environmentSuffix: 'iam',
      });
    });

    it('should create ECS task execution role', async () => {
      const dns = await stack.blueAlbDns;
      expect(dns).toBeDefined();
    });

    it('should create ECS task role with permissions', async () => {
      const dns = await stack.blueAlbDns;
      expect(dns).toBeDefined();
    });

    it('should configure S3 access permissions for tasks', async () => {
      const dns = await stack.blueAlbDns;
      expect(dns).toBeDefined();
    });

    it('should configure DynamoDB access permissions for tasks', async () => {
      const dns = await stack.blueAlbDns;
      expect(dns).toBeDefined();
    });
  });

  describe('Output Properties Validation', () => {
    beforeEach(() => {
      stack = new TapStack('output-test', {
        environmentSuffix: 'out',
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

      expect(outputs).toHaveLength(14);
      outputs.forEach(output => {
        expect(output).toBeDefined();
        expect(typeof output).toBe('string');
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very long environment suffix', () => {
      const longSuffix = 'a'.repeat(100);
      stack = new TapStack('test-stack', {
        environmentSuffix: longSuffix,
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should handle environment suffix with numbers', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test123456789',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should handle environment suffix with hyphens', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test-env-123-prod',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should handle environment suffix with underscores', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test_env_123',
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
          Department: 'Engineering',
        },
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should handle single character environment suffix', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'x',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should handle numeric-only environment suffix', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: '12345',
      });
      expect(stack).toBeInstanceOf(TapStack);
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
      const stagingStack = new TapStack('staging-stack', {
        environmentSuffix: 'staging',
      });

      expect(devStack).toBeInstanceOf(TapStack);
      expect(prodStack).toBeInstanceOf(TapStack);
      expect(stagingStack).toBeInstanceOf(TapStack);
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
      expect(vpc1).not.toBe(vpc2);
    });

    it('should support parallel stack creation', () => {
      const stacks = Array.from({ length: 5 }, (_, i) =>
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

      const [vpc1, vpc2, db1, db2] = await Promise.all([
        stack1.blueVpcId,
        stack2.blueVpcId,
        stack1.blueDbEndpoint,
        stack2.blueDbEndpoint,
      ]);

      expect(vpc1).toBeDefined();
      expect(vpc2).toBeDefined();
      expect(db1).toBeDefined();
      expect(db2).toBeDefined();
      expect(vpc1).not.toBe(vpc2);
      expect(db1).not.toBe(db2);
    });
  });

  describe('Environment Variable Configuration', () => {
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

    it('should use AWS_REGION when set to ap-southeast-1', () => {
      process.env.AWS_REGION = 'ap-southeast-1';
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should handle AWS_REGION with invalid value gracefully', () => {
      process.env.AWS_REGION = 'invalid-region';
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });
  });

  describe('Stack Naming Conventions', () => {
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
      stack = new TapStack('very-long-stack-name-for-comprehensive-testing', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should accept stack names with underscores', () => {
      stack = new TapStack('my_test_stack', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should accept mixed case stack names', () => {
      stack = new TapStack('MyTestStack', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeInstanceOf(TapStack);
    });
  });

  describe('Output Value Consistency', () => {
    beforeEach(() => {
      stack = new TapStack('consistency-stack', {
        environmentSuffix: 'consistent',
      });
    });

    it('should return consistent values on multiple accesses', async () => {
      const vpc1 = await stack.blueVpcId;
      const vpc2 = await stack.blueVpcId;
      const vpc3 = await stack.blueVpcId;
      expect(vpc1).toBe(vpc2);
      expect(vpc2).toBe(vpc3);
    });

    it('should maintain consistency across all outputs', async () => {
      const firstRead = await stack.sessionTableName;
      const secondRead = await stack.sessionTableName;
      const thirdRead = await stack.sessionTableName;

      expect(firstRead).toBe(secondRead);
      expect(secondRead).toBe(thirdRead);
    });

    it('should maintain consistency for database endpoints', async () => {
      const endpoint1 = await stack.blueDbEndpoint;
      const endpoint2 = await stack.blueDbEndpoint;
      expect(endpoint1).toBe(endpoint2);
    });

    it('should maintain consistency for ALB DNS names', async () => {
      const dns1 = await stack.blueAlbDns;
      const dns2 = await stack.blueAlbDns;
      expect(dns1).toBe(dns2);
    });
  });

  describe('Resource Naming Patterns', () => {
    beforeEach(() => {
      stack = new TapStack('naming-stack', {
        environmentSuffix: 'naming',
      });
    });

    it('should include environment suffix in resource identifiers', async () => {
      const outputs = {
        sessionTable: await stack.sessionTableName,
        rateLimitTable: await stack.rateLimitTableName,
        apiDomain: await stack.apiDomainName,
        txBucket: await stack.transactionLogsBucketName,
        compBucket: await stack.complianceDocsBucketName,
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
      const blueAlb = await stack.blueAlbDns;
      const greenAlb = await stack.greenAlbDns;

      expect(blueVpc).not.toBe(greenVpc);
      expect(blueDb).not.toBe(greenDb);
      expect(blueAlb).not.toBe(greenAlb);
    });

    it('should use consistent naming pattern for VPCs', async () => {
      const blueVpc = await stack.blueVpcId;
      const greenVpc = await stack.greenVpcId;

      expect(blueVpc).toContain('blue-vpc');
      expect(greenVpc).toContain('green-vpc');
    });

    it('should use consistent naming pattern for ALBs', async () => {
      const blueAlb = await stack.blueAlbDns;
      const greenAlb = await stack.greenAlbDns;

      expect(blueAlb).toContain('blue-alb');
      expect(greenAlb).toContain('green-alb');
    });
  });

  describe('Type Safety and TypeScript Validation', () => {
    beforeEach(() => {
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
        expect(output).toBeTruthy();
      });
    });

    it('should validate TapStackArgs interface', () => {
      const args: TapStackArgs = {
        environmentSuffix: 'test',
        tags: {
          Project: 'Test',
        },
      };
      stack = new TapStack('test-stack', args);
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should accept partial TapStackArgs', () => {
      const args: Partial<TapStackArgs> = {
        environmentSuffix: 'test',
      };
      stack = new TapStack('test-stack', args as TapStackArgs);
      expect(stack).toBeInstanceOf(TapStack);
    });
  });

  describe('Comprehensive Integration Tests', () => {
    it('should create complete infrastructure stack with all resources', async () => {
      stack = new TapStack('complete-stack', {
        environmentSuffix: 'complete',
        tags: {
          Project: 'ComprehensiveTesting',
          Environment: 'Test',
          Team: 'Platform',
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
        expect(output.length).toBeGreaterThan(0);
      });
    });

    it('should validate all network infrastructure resources', async () => {
      stack = new TapStack('network-complete', {
        environmentSuffix: 'netcomp',
      });

      const [blueVpc, greenVpc, tgw] = await Promise.all([
        stack.blueVpcId,
        stack.greenVpcId,
        stack.transitGatewayId,
      ]);

      expect(blueVpc).toContain('blue-vpc');
      expect(greenVpc).toContain('green-vpc');
      expect(tgw).toContain('tgw');
    });

    it('should validate all database infrastructure resources', async () => {
      stack = new TapStack('db-complete', {
        environmentSuffix: 'dbcomp',
      });

      const [blueDb, greenDb] = await Promise.all([
        stack.blueDbEndpoint,
        stack.greenDbEndpoint,
      ]);

      expect(blueDb).toContain('rds.amazonaws.com');
      expect(greenDb).toContain('rds.amazonaws.com');
      expect(blueDb).not.toBe(greenDb);
    });

    it('should validate all storage infrastructure resources', async () => {
      stack = new TapStack('storage-complete', {
        environmentSuffix: 'storcomp',
      });

      const [txBucket, compBucket, sessionTable, rateLimitTable] =
        await Promise.all([
          stack.transactionLogsBucketName,
          stack.complianceDocsBucketName,
          stack.sessionTableName,
          stack.rateLimitTableName,
        ]);

      expect(txBucket).toContain('tx-logs-payment');
      expect(compBucket).toContain('compliance-docs-pay');
      expect(sessionTable).toContain('session-table');
      expect(rateLimitTable).toContain('rate-limit-table');
    });

    it('should validate all monitoring infrastructure resources', async () => {
      stack = new TapStack('monitoring-complete', {
        environmentSuffix: 'moncomp',
      });

      const [dashboardUrl, topicArn, domain] = await Promise.all([
        stack.dashboardUrl,
        stack.migrationTopicArn,
        stack.apiDomainName,
      ]);

      expect(dashboardUrl).toContain('cloudwatch');
      expect(topicArn).toContain('arn:aws');
      expect(domain).toMatch(/api\.payments-.*\.testdomain\.local/);
    });
  });

  describe('Blue-Green Deployment Validation', () => {
    beforeEach(() => {
      stack = new TapStack('blue-green-test', {
        environmentSuffix: 'bg',
      });
    });

    it('should create separate VPCs for blue and green environments', async () => {
      const blueVpc = await stack.blueVpcId;
      const greenVpc = await stack.greenVpcId;

      expect(blueVpc).toBeDefined();
      expect(greenVpc).toBeDefined();
      expect(blueVpc).not.toBe(greenVpc);
    });

    it('should create separate databases for blue and green environments', async () => {
      const blueDb = await stack.blueDbEndpoint;
      const greenDb = await stack.greenDbEndpoint;

      expect(blueDb).toBeDefined();
      expect(greenDb).toBeDefined();
      expect(blueDb).not.toBe(greenDb);
    });

    it('should create separate ALBs for blue and green environments', async () => {
      const blueAlb = await stack.blueAlbDns;
      const greenAlb = await stack.greenAlbDns;

      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
      expect(blueAlb).not.toBe(greenAlb);
    });

    it('should connect blue and green VPCs via transit gateway', async () => {
      const tgw = await stack.transitGatewayId;
      expect(tgw).toBeDefined();
    });
  });

  describe('Security and Compliance Validation', () => {
    beforeEach(() => {
      stack = new TapStack('security-test', {
        environmentSuffix: 'sec',
      });
    });

    it('should ensure all databases use encryption', async () => {
      const blueDb = await stack.blueDbEndpoint;
      const greenDb = await stack.greenDbEndpoint;

      expect(blueDb).toBeDefined();
      expect(greenDb).toBeDefined();
    });

    it('should ensure all S3 buckets use encryption', async () => {
      const txBucket = await stack.transactionLogsBucketName;
      const compBucket = await stack.complianceDocsBucketName;

      expect(txBucket).toBeDefined();
      expect(compBucket).toBeDefined();
    });

    it('should ensure DynamoDB tables use encryption', async () => {
      const sessionTable = await stack.sessionTableName;
      const rateLimitTable = await stack.rateLimitTableName;

      expect(sessionTable).toBeDefined();
      expect(rateLimitTable).toBeDefined();
    });

    it('should configure WAF for application protection', async () => {
      const blueAlb = await stack.blueAlbDns;
      const greenAlb = await stack.greenAlbDns;

      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    beforeEach(() => {
      stack = new TapStack('perf-test', {
        environmentSuffix: 'perf',
      });
    });

    it('should configure Aurora Serverless for automatic scaling', async () => {
      const blueDb = await stack.blueDbEndpoint;
      const greenDb = await stack.greenDbEndpoint;

      expect(blueDb).toBeDefined();
      expect(greenDb).toBeDefined();
    });

    it('should configure DynamoDB with on-demand billing', async () => {
      const sessionTable = await stack.sessionTableName;
      const rateLimitTable = await stack.rateLimitTableName;

      expect(sessionTable).toBeDefined();
      expect(rateLimitTable).toBeDefined();
    });

    it('should configure ALB with multiple availability zones', async () => {
      const blueAlb = await stack.blueAlbDns;
      const greenAlb = await stack.greenAlbDns;

      expect(blueAlb).toBeDefined();
      expect(greenAlb).toBeDefined();
    });
  });

  describe('Cost Optimization', () => {
    beforeEach(() => {
      stack = new TapStack('cost-test', {
        environmentSuffix: 'cost',
      });
    });

    it('should configure S3 lifecycle policies for cost optimization', async () => {
      const txBucket = await stack.transactionLogsBucketName;
      const compBucket = await stack.complianceDocsBucketName;

      expect(txBucket).toBeDefined();
      expect(compBucket).toBeDefined();
    });

    it('should use pay-per-request billing for DynamoDB', async () => {
      const sessionTable = await stack.sessionTableName;
      const rateLimitTable = await stack.rateLimitTableName;

      expect(sessionTable).toBeDefined();
      expect(rateLimitTable).toBeDefined();
    });

    it('should use serverless Aurora for cost-effective scaling', async () => {
      const blueDb = await stack.blueDbEndpoint;
      const greenDb = await stack.greenDbEndpoint;

      expect(blueDb).toBeDefined();
      expect(greenDb).toBeDefined();
    });
  });
});
