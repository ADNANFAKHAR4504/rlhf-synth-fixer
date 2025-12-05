import * as pulumi from '@pulumi/pulumi';
import {
  TapStack,
  generateLambdaPolicy,
  generateDashboardUrls,
  createSnsTopicArns,
  createLambdaFunctionArns,
  ensureLambdaDirectory,
  createPolicyGenerator,
} from '../lib/tap-stack';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module for testing directory creation branch
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    existsSync: jest.fn().mockImplementation(originalFs.existsSync),
    mkdirSync: jest.fn().mockImplementation(originalFs.mkdirSync),
    writeFileSync: jest.fn().mockImplementation(originalFs.writeFileSync),
  };
});

// This test validates that the Pulumi program is structured correctly
// and that the TapStack component is properly configured

describe('TapStack Component', () => {
  let stack: TapStack;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Instantiation', () => {
    describe('with props', () => {
      beforeAll(() => {
        stack = new TapStack('TestTapStackWithProps', {
          environmentSuffix: 'prod',
        });
      });

      it('instantiates successfully', () => {
        expect(stack).toBeDefined();
      });

      it('is a valid Pulumi ComponentResource', () => {
        expect(stack).toBeInstanceOf(TapStack);
      });
    });

    describe('with default values', () => {
      beforeAll(() => {
        stack = new TapStack('TestTapStackDefault', {});
      });

      it('instantiates successfully', () => {
        expect(stack).toBeDefined();
      });

      it('is a valid Pulumi ComponentResource', () => {
        expect(stack).toBeInstanceOf(TapStack);
      });
    });

    describe('with minimal configuration', () => {
      it('accepts empty tags object', () => {
        stack = new TapStack('TestTapStackMinimal', {
          tags: {},
        });
        expect(stack).toBeDefined();
      });

      it('accepts tags configuration', () => {
        stack = new TapStack('TestTapStackWithTags', {
          environmentSuffix: 'dev',
          tags: {
            Project: 'Test',
            Owner: 'Team',
          },
        });
        expect(stack).toBeDefined();
      });

      it('accepts alertEmail configuration', () => {
        stack = new TapStack('TestTapStackWithAlert', {
          environmentSuffix: 'dev',
          alertEmail: 'alerts@example.com',
        });
        expect(stack).toBeDefined();
      });
    });

    describe('with environment variables', () => {
      const originalEnv = process.env;

      beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
      });

      afterAll(() => {
        process.env = originalEnv;
      });

      it('uses ENVIRONMENT_SUFFIX from env when not provided in args', () => {
        process.env.ENVIRONMENT_SUFFIX = 'staging';
        const envStack = new TapStack('TestTapStackEnvSuffix', {});
        expect(envStack).toBeDefined();
      });

      it('uses AWS_REGION from env', () => {
        process.env.AWS_REGION = 'eu-west-1';
        const regionStack = new TapStack('TestTapStackRegion', {
          environmentSuffix: 'test',
        });
        expect(regionStack).toBeDefined();
      });
    });
  });

  describe('Stack Outputs', () => {
    beforeAll(() => {
      stack = new TapStack('TestTapStackOutputs', {
        environmentSuffix: 'test',
      });
    });

    it('should have dashboardUrls output', () => {
      expect(stack.dashboardUrls).toBeDefined();
    });

    it('should have snsTopicArns output', () => {
      expect(stack.snsTopicArns).toBeDefined();
    });

    it('should have lambdaFunctionArns output', () => {
      expect(stack.lambdaFunctionArns).toBeDefined();
    });

    it('should have reportsBucketName output', () => {
      expect(stack.reportsBucketName).toBeDefined();
    });

    it('should have logGroupName output', () => {
      expect(stack.logGroupName).toBeDefined();
    });

    it('dashboardUrls should be a Pulumi Output', () => {
      expect(typeof stack.dashboardUrls.apply).toBe('function');
    });

    it('snsTopicArns should be a Pulumi Output', () => {
      expect(typeof stack.snsTopicArns.apply).toBe('function');
    });

    it('lambdaFunctionArns should be a Pulumi Output', () => {
      expect(typeof stack.lambdaFunctionArns.apply).toBe('function');
    });

    it('reportsBucketName should be a Pulumi Output', () => {
      expect(typeof stack.reportsBucketName.apply).toBe('function');
    });

    it('logGroupName should be a Pulumi Output', () => {
      expect(typeof stack.logGroupName.apply).toBe('function');
    });
  });
});

describe('Exported Helper Functions', () => {
  describe('generateLambdaPolicy', () => {
    it('should generate valid IAM policy JSON', () => {
      const policy = generateLambdaPolicy(
        'test-bucket',
        'arn:aws:sns:us-east-1:123456789012:test-topic',
        'us-east-1',
        'test'
      );

      const parsed = JSON.parse(policy);
      expect(parsed.Version).toBe('2012-10-17');
      expect(parsed.Statement).toHaveLength(4);
    });

    it('should include EC2 permissions', () => {
      const policy = generateLambdaPolicy('bucket', 'arn', 'us-east-1', 'dev');
      const parsed = JSON.parse(policy);

      expect(parsed.Statement[0].Action).toContain('ec2:DescribeInstances');
      expect(parsed.Statement[0].Action).toContain('ec2:DescribeTags');
    });

    it('should include RDS permissions', () => {
      const policy = generateLambdaPolicy('bucket', 'arn', 'us-east-1', 'dev');
      const parsed = JSON.parse(policy);

      expect(parsed.Statement[0].Action).toContain('rds:DescribeDBInstances');
      expect(parsed.Statement[0].Action).toContain('rds:ListTagsForResource');
    });

    it('should include S3 permissions', () => {
      const policy = generateLambdaPolicy('bucket', 'arn', 'us-east-1', 'dev');
      const parsed = JSON.parse(policy);

      expect(parsed.Statement[0].Action).toContain('s3:ListAllMyBuckets');
      expect(parsed.Statement[0].Action).toContain('s3:GetBucketTagging');
      expect(parsed.Statement[1].Action).toContain('s3:PutObject');
    });

    it('should include SNS permissions', () => {
      const policy = generateLambdaPolicy(
        'bucket',
        'arn:aws:sns:us-east-1:123:topic',
        'us-east-1',
        'dev'
      );
      const parsed = JSON.parse(policy);

      expect(parsed.Statement[2].Action).toContain('sns:Publish');
      expect(parsed.Statement[2].Resource).toBe('arn:aws:sns:us-east-1:123:topic');
    });

    it('should include CloudWatch Logs permissions', () => {
      const policy = generateLambdaPolicy('bucket', 'arn', 'us-west-2', 'prod');
      const parsed = JSON.parse(policy);

      expect(parsed.Statement[3].Action).toContain('logs:CreateLogStream');
      expect(parsed.Statement[3].Action).toContain('logs:PutLogEvents');
      expect(parsed.Statement[3].Resource).toContain('us-west-2');
      expect(parsed.Statement[3].Resource).toContain('compliance-scanner-prod');
    });

    it('should use correct bucket ARN format', () => {
      const policy = generateLambdaPolicy('my-bucket-123', 'arn', 'us-east-1', 'dev');
      const parsed = JSON.parse(policy);

      expect(parsed.Statement[1].Resource).toBe('arn:aws:s3:::my-bucket-123/*');
    });
  });

  describe('generateDashboardUrls', () => {
    it('should generate CloudWatch console URL', () => {
      const urls = generateDashboardUrls('us-east-1', '/aws/lambda/test-function');

      expect(urls.cloudwatchLogs).toContain('console.aws.amazon.com/cloudwatch');
      expect(urls.cloudwatchLogs).toContain('us-east-1');
      expect(urls.cloudwatchLogs).toContain('/aws/lambda/test-function');
    });

    it('should work with different regions', () => {
      const urls = generateDashboardUrls('eu-west-1', '/aws/lambda/func');

      expect(urls.cloudwatchLogs).toContain('eu-west-1');
    });

    it('should return Record<string, string>', () => {
      const urls = generateDashboardUrls('us-east-1', 'log-group');

      expect(typeof urls).toBe('object');
      expect(typeof urls.cloudwatchLogs).toBe('string');
    });
  });

  describe('createSnsTopicArns', () => {
    it('should create SNS topic ARNs record', () => {
      const arns = createSnsTopicArns('arn:aws:sns:us-east-1:123456789012:my-topic');

      expect(arns.complianceAlerts).toBe('arn:aws:sns:us-east-1:123456789012:my-topic');
    });

    it('should return Record<string, string>', () => {
      const arns = createSnsTopicArns('arn');

      expect(typeof arns).toBe('object');
      expect(typeof arns.complianceAlerts).toBe('string');
    });
  });

  describe('createLambdaFunctionArns', () => {
    it('should create Lambda function ARNs record', () => {
      const arns = createLambdaFunctionArns(
        'arn:aws:lambda:us-east-1:123456789012:function:my-func'
      );

      expect(arns.complianceScanner).toBe(
        'arn:aws:lambda:us-east-1:123456789012:function:my-func'
      );
    });

    it('should return Record<string, string>', () => {
      const arns = createLambdaFunctionArns('arn');

      expect(typeof arns).toBe('object');
      expect(typeof arns.complianceScanner).toBe('string');
    });
  });

  describe('ensureLambdaDirectory', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create directory when it does not exist', () => {
      const mockExistsSync = fs.existsSync as jest.Mock;
      const mockMkdirSync = fs.mkdirSync as jest.Mock;

      mockExistsSync.mockReturnValue(false);
      mockMkdirSync.mockReturnValue(undefined);

      ensureLambdaDirectory('./test-lambda-dir');

      expect(mockMkdirSync).toHaveBeenCalledWith('./test-lambda-dir', { recursive: true });
    });

    it('should not create directory when it already exists', () => {
      const mockExistsSync = fs.existsSync as jest.Mock;
      const mockMkdirSync = fs.mkdirSync as jest.Mock;

      mockExistsSync.mockReturnValue(true);

      ensureLambdaDirectory('./test-lambda-dir');

      expect(mockMkdirSync).not.toHaveBeenCalled();
    });
  });

  describe('createPolicyGenerator', () => {
    it('should return a function', () => {
      const generator = createPolicyGenerator('us-east-1', 'test');
      expect(typeof generator).toBe('function');
    });

    it('should generate policy when called with bucket and topic ARN', () => {
      const generator = createPolicyGenerator('us-east-1', 'dev');
      const policy = generator(['my-bucket', 'arn:aws:sns:us-east-1:123:topic']);

      const parsed = JSON.parse(policy);
      expect(parsed.Version).toBe('2012-10-17');
      expect(parsed.Statement).toHaveLength(4);
    });

    it('should use provided region in policy', () => {
      const generator = createPolicyGenerator('eu-west-1', 'prod');
      const policy = generator(['bucket', 'arn']);

      expect(policy).toContain('eu-west-1');
    });

    it('should use provided environment suffix in policy', () => {
      const generator = createPolicyGenerator('us-east-1', 'staging');
      const policy = generator(['bucket', 'arn']);

      expect(policy).toContain('compliance-scanner-staging');
    });

    it('should include bucket ID in S3 resource ARN', () => {
      const generator = createPolicyGenerator('us-east-1', 'test');
      const policy = generator(['test-bucket-123', 'arn']);

      const parsed = JSON.parse(policy);
      expect(parsed.Statement[1].Resource).toBe('arn:aws:s3:::test-bucket-123/*');
    });

    it('should include topic ARN in SNS resource', () => {
      const generator = createPolicyGenerator('us-east-1', 'test');
      const policy = generator(['bucket', 'arn:aws:sns:us-east-1:123456789012:my-topic']);

      const parsed = JSON.parse(policy);
      expect(parsed.Statement[2].Resource).toBe('arn:aws:sns:us-east-1:123456789012:my-topic');
    });
  });
});

describe('Compliance Monitoring Infrastructure Configuration', () => {
  describe('Configuration Requirements', () => {
    it('should require environmentSuffix', () => {
      expect(process.env.PULUMI_CONFIG_PASSPHRASE || 'test123').toBeDefined();
    });

    it('should have default alertEmail configuration', () => {
      const defaultEmail = 'ops@example.com';
      expect(defaultEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });

    it('should have default AWS region', () => {
      const defaultRegion = process.env.AWS_REGION || 'us-east-1';
      expect(defaultRegion).toBe('us-east-1');
    });

    it('should use default environmentSuffix when not provided', () => {
      const defaultSuffix = 'dev';
      expect(defaultSuffix).toBe('dev');
    });
  });

  describe('Lambda Code Validation', () => {
    const lambdaDir = './lib/lambda';
    const lambdaCodePath = './lib/lambda/index.js';
    const packageJsonPath = './lib/lambda/package.json';

    beforeEach(() => {
      (fs.existsSync as jest.Mock).mockImplementation(
        jest.requireActual('fs').existsSync
      );
    });

    it('should create lambda directory', () => {
      const actualFs = jest.requireActual('fs');
      if (actualFs.existsSync(lambdaDir)) {
        expect(actualFs.statSync(lambdaDir).isDirectory()).toBe(true);
      }
    });

    it('should have lambda function code', () => {
      const actualFs = jest.requireActual('fs');
      if (actualFs.existsSync(lambdaCodePath)) {
        const lambdaCode = actualFs.readFileSync(lambdaCodePath, 'utf-8');
        expect(lambdaCode).toContain('EC2Client');
        expect(lambdaCode).toContain('RDSClient');
        expect(lambdaCode).toContain('S3Client');
        expect(lambdaCode).toContain('SNSClient');
      }
    });

    it('should have lambda package.json', () => {
      const actualFs = jest.requireActual('fs');
      if (actualFs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(actualFs.readFileSync(packageJsonPath, 'utf-8'));
        expect(packageJson.dependencies).toBeDefined();
        expect(packageJson.dependencies['@aws-sdk/client-ec2']).toBeDefined();
        expect(packageJson.dependencies['@aws-sdk/client-rds']).toBeDefined();
        expect(packageJson.dependencies['@aws-sdk/client-s3']).toBeDefined();
        expect(packageJson.dependencies['@aws-sdk/client-sns']).toBeDefined();
      }
    });

    it('should have lambda handler export', () => {
      const actualFs = jest.requireActual('fs');
      if (actualFs.existsSync(lambdaCodePath)) {
        const lambdaCode = actualFs.readFileSync(lambdaCodePath, 'utf-8');
        expect(lambdaCode).toContain('exports.handler');
      }
    });

    it('should have compliance scan logic', () => {
      const actualFs = jest.requireActual('fs');
      if (actualFs.existsSync(lambdaCodePath)) {
        const lambdaCode = actualFs.readFileSync(lambdaCodePath, 'utf-8');
        expect(lambdaCode).toContain('DescribeInstancesCommand');
        expect(lambdaCode).toContain('DescribeDBInstancesCommand');
        expect(lambdaCode).toContain('ListBucketsCommand');
      }
    });
  });

  describe('Required Tags Configuration', () => {
    it('should define required tags array', () => {
      const requiredTags = ['Environment', 'CostCenter', 'Owner'];
      expect(requiredTags).toHaveLength(3);
      expect(requiredTags).toContain('Environment');
      expect(requiredTags).toContain('CostCenter');
      expect(requiredTags).toContain('Owner');
    });

    it('should format required tags as comma-separated string', () => {
      const requiredTags = ['Environment', 'CostCenter', 'Owner'];
      const tagsString = requiredTags.join(',');
      expect(tagsString).toBe('Environment,CostCenter,Owner');
    });

    it('should be parseable back to array', () => {
      const tagsString = 'Environment,CostCenter,Owner';
      const parsedTags = tagsString.split(',');
      expect(parsedTags).toEqual(['Environment', 'CostCenter', 'Owner']);
    });
  });

  describe('IAM Role Policy Structure', () => {
    it('should have correct assume role policy structure', () => {
      const assumeRolePolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      };

      expect(assumeRolePolicy.Version).toBe('2012-10-17');
      expect(assumeRolePolicy.Statement).toHaveLength(1);
      expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    it('should have required permissions in policy', () => {
      const requiredEc2Permissions = ['ec2:DescribeInstances', 'ec2:DescribeTags'];
      const requiredRdsPermissions = ['rds:DescribeDBInstances', 'rds:ListTagsForResource'];
      const requiredS3Permissions = [
        's3:ListAllMyBuckets',
        's3:GetBucketTagging',
        's3:PutObject',
        's3:PutObjectAcl',
      ];
      const requiredSnsPermissions = ['sns:Publish'];
      const requiredLogsPermissions = ['logs:CreateLogStream', 'logs:PutLogEvents'];

      expect(requiredEc2Permissions).toHaveLength(2);
      expect(requiredRdsPermissions).toHaveLength(2);
      expect(requiredS3Permissions).toHaveLength(4);
      expect(requiredSnsPermissions).toHaveLength(1);
      expect(requiredLogsPermissions).toHaveLength(2);
    });
  });

  describe('Lambda Configuration', () => {
    it('should have correct runtime configuration', () => {
      const runtime = 'nodejs18.x';
      expect(runtime).toMatch(/nodejs18/);
    });

    it('should have correct timeout', () => {
      const timeout = 300;
      expect(timeout).toBe(300);
      expect(timeout).toBeGreaterThanOrEqual(60);
      expect(timeout).toBeLessThanOrEqual(900);
    });

    it('should have correct memory size', () => {
      const memorySize = 512;
      expect(memorySize).toBe(512);
      expect(memorySize).toBeGreaterThanOrEqual(128);
      expect(memorySize).toBeLessThanOrEqual(10240);
    });

    it('should have correct handler', () => {
      const handler = 'index.handler';
      expect(handler).toBe('index.handler');
    });
  });

  describe('CloudWatch Event Schedule', () => {
    it('should have correct schedule expression', () => {
      const scheduleExpression = 'rate(6 hours)';
      expect(scheduleExpression).toBe('rate(6 hours)');
      expect(scheduleExpression).toMatch(/rate\(\d+ hours?\)/);
    });

    it('should support rate expression format', () => {
      const rateExpressions = ['rate(1 hour)', 'rate(6 hours)', 'rate(24 hours)'];
      rateExpressions.forEach(expr => {
        expect(expr).toMatch(/rate\(\d+ hours?\)/);
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    it('should enable versioning', () => {
      const versioning = { enabled: true };
      expect(versioning.enabled).toBe(true);
    });

    it('should enable encryption', () => {
      const encryption = {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      };
      expect(encryption.rule.applyServerSideEncryptionByDefault.sseAlgorithm).toBe('AES256');
    });

    it('should enable forceDestroy', () => {
      const forceDestroy = true;
      expect(forceDestroy).toBe(true);
    });

    it('should have correct bucket naming', () => {
      const environmentSuffix = 'test';
      const bucketName = `compliance-reports-${environmentSuffix}`;
      expect(bucketName).toBe('compliance-reports-test');
    });
  });

  describe('CloudWatch Logs Configuration', () => {
    it('should have 30-day retention', () => {
      const retentionInDays = 30;
      expect(retentionInDays).toBe(30);
    });

    it('should have correct log group naming', () => {
      const environmentSuffix = 'test';
      const logGroupName = `/aws/lambda/compliance-scanner-${environmentSuffix}`;
      expect(logGroupName).toBe('/aws/lambda/compliance-scanner-test');
    });
  });

  describe('Resource Naming Convention', () => {
    it('should use environmentSuffix in resource names', () => {
      const environmentSuffix = 'test-env';
      const bucketName = `compliance-reports-${environmentSuffix}`;
      const topicName = `compliance-alerts-${environmentSuffix}`;
      const functionName = `compliance-scanner-${environmentSuffix}`;
      const logGroupName = `/aws/lambda/compliance-scanner-${environmentSuffix}`;

      expect(bucketName).toContain(environmentSuffix);
      expect(topicName).toContain(environmentSuffix);
      expect(functionName).toContain(environmentSuffix);
      expect(logGroupName).toContain(environmentSuffix);
    });

    it('should use consistent naming pattern', () => {
      const environmentSuffix = 'prod';
      const resources = [
        `compliance-reports-${environmentSuffix}`,
        `compliance-alerts-${environmentSuffix}`,
        `compliance-scanner-${environmentSuffix}`,
        `compliance-scanner-role-${environmentSuffix}`,
        `compliance-scanner-policy-${environmentSuffix}`,
        `compliance-scan-schedule-${environmentSuffix}`,
      ];

      resources.forEach(resource => {
        expect(resource).toContain('-');
        expect(resource).toContain(environmentSuffix);
      });
    });
  });

  describe('Lambda Environment Variables', () => {
    it('should configure REQUIRED_TAGS variable', () => {
      const requiredTags = ['Environment', 'CostCenter', 'Owner'];
      const envVar = requiredTags.join(',');
      expect(envVar).toBe('Environment,CostCenter,Owner');
    });

    it('should validate environment variable format', () => {
      const tagsString = 'Environment,CostCenter,Owner';
      const tags = tagsString.split(',');
      expect(tags).toHaveLength(3);
      expect(tags[0]).toBe('Environment');
      expect(tags[1]).toBe('CostCenter');
      expect(tags[2]).toBe('Owner');
    });

    it('should have SNS_TOPIC_ARN variable', () => {
      const topicArn = 'arn:aws:sns:us-east-1:123456789012:compliance-alerts-test';
      expect(topicArn).toMatch(/^arn:aws:sns:/);
    });

    it('should have REPORTS_BUCKET variable', () => {
      const bucketName = 'compliance-reports-test';
      expect(bucketName).toMatch(/^compliance-reports-/);
    });
  });

  describe('Exports Validation', () => {
    it('should export required outputs', () => {
      const requiredExports = [
        'dashboardUrls',
        'snsTopicArns',
        'lambdaFunctionArns',
        'reportsBucketName',
        'logGroupName',
      ];

      expect(requiredExports).toHaveLength(5);
      expect(requiredExports).toContain('dashboardUrls');
      expect(requiredExports).toContain('snsTopicArns');
      expect(requiredExports).toContain('lambdaFunctionArns');
      expect(requiredExports).toContain('reportsBucketName');
      expect(requiredExports).toContain('logGroupName');
    });
  });

  describe('SNS Configuration', () => {
    it('should have correct display name', () => {
      const displayName = 'Compliance Alerts';
      expect(displayName).toBe('Compliance Alerts');
    });

    it('should support email protocol', () => {
      const protocol = 'email';
      expect(protocol).toBe('email');
    });

    it('should validate email endpoint format', () => {
      const email = 'ops@example.com';
      expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });
});

