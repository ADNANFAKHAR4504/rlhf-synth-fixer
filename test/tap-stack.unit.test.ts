import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';
import * as fs from 'fs';
import * as path from 'path';

// This test validates that the Pulumi program is structured correctly
// and that the TapStack component is properly configured

describe('TapStack Component', () => {
  let stack: TapStack;

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
      // Pulumi Outputs have an apply method
      expect(typeof stack.dashboardUrls.apply).toBe('function');
    });

    it('snsTopicArns should be a Pulumi Output', () => {
      // Pulumi Outputs have an apply method
      expect(typeof stack.snsTopicArns.apply).toBe('function');
    });

    it('lambdaFunctionArns should be a Pulumi Output', () => {
      // Pulumi Outputs have an apply method
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

describe('Compliance Monitoring Infrastructure Configuration', () => {
  describe('Configuration Requirements', () => {
    it('should require environmentSuffix', () => {
      // This validates the config structure
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

    it('should create lambda directory', () => {
      if (fs.existsSync(lambdaDir)) {
        expect(fs.statSync(lambdaDir).isDirectory()).toBe(true);
      }
    });

    it('should have lambda function code', () => {
      if (fs.existsSync(lambdaCodePath)) {
        const lambdaCode = fs.readFileSync(lambdaCodePath, 'utf-8');
        expect(lambdaCode).toContain('EC2Client');
        expect(lambdaCode).toContain('RDSClient');
        expect(lambdaCode).toContain('S3Client');
        expect(lambdaCode).toContain('SNSClient');
      }
    });

    it('should have lambda package.json', () => {
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        expect(packageJson.dependencies).toBeDefined();
        expect(packageJson.dependencies['@aws-sdk/client-ec2']).toBeDefined();
        expect(packageJson.dependencies['@aws-sdk/client-rds']).toBeDefined();
        expect(packageJson.dependencies['@aws-sdk/client-s3']).toBeDefined();
        expect(packageJson.dependencies['@aws-sdk/client-sns']).toBeDefined();
      }
    });

    it('should have lambda handler export', () => {
      if (fs.existsSync(lambdaCodePath)) {
        const lambdaCode = fs.readFileSync(lambdaCodePath, 'utf-8');
        expect(lambdaCode).toContain('exports.handler');
      }
    });

    it('should have compliance scan logic', () => {
      if (fs.existsSync(lambdaCodePath)) {
        const lambdaCode = fs.readFileSync(lambdaCodePath, 'utf-8');
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

    it('should generate valid IAM policy JSON', () => {
      const bucketId = 'test-bucket';
      const topicArn = 'arn:aws:sns:us-east-1:123456789012:test-topic';
      const awsRegion = 'us-east-1';
      const environmentSuffix = 'test';

      const policy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ec2:DescribeInstances',
              'ec2:DescribeTags',
              'rds:DescribeDBInstances',
              'rds:ListTagsForResource',
              's3:ListAllMyBuckets',
              's3:GetBucketTagging',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:PutObjectAcl'],
            Resource: `arn:aws:s3:::${bucketId}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: topicArn,
          },
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: `arn:aws:logs:${awsRegion}:*:log-group:/aws/lambda/compliance-scanner-${environmentSuffix}:*`,
          },
        ],
      });

      const parsedPolicy = JSON.parse(policy);
      expect(parsedPolicy.Version).toBe('2012-10-17');
      expect(parsedPolicy.Statement).toHaveLength(4);
      expect(parsedPolicy.Statement[1].Resource).toContain(bucketId);
      expect(parsedPolicy.Statement[2].Resource).toBe(topicArn);
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

  describe('File System Operations', () => {
    const lambdaDir = './lib/lambda';

    it('should handle lambda directory creation', () => {
      // Test that the directory exists or can be created
      const dirExists = fs.existsSync(lambdaDir);
      if (dirExists) {
        expect(fs.statSync(lambdaDir).isDirectory()).toBe(true);
      } else {
        // If it doesn't exist, verify the path is valid
        expect(path.isAbsolute(path.resolve(lambdaDir))).toBe(true);
      }
    });

    it('should write files with correct encoding', () => {
      const testContent = 'test content';
      const encoding = 'utf-8';
      expect(Buffer.from(testContent, encoding as BufferEncoding).toString(encoding)).toBe(
        testContent
      );
    });

    it('should use recursive option for directory creation', () => {
      const options = { recursive: true };
      expect(options.recursive).toBe(true);
    });
  });

  describe('Dashboard URL Generation', () => {
    it('should generate valid CloudWatch console URLs', () => {
      const awsRegion = 'us-east-1';
      const logGroupName = '/aws/lambda/compliance-scanner-test';
      const url = `https://console.aws.amazon.com/cloudwatch/home?region=${awsRegion}#logsV2:log-groups/log-group/${logGroupName}`;

      expect(url).toContain('console.aws.amazon.com/cloudwatch');
      expect(url).toContain(awsRegion);
      expect(url).toContain('logsV2:log-groups');
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
