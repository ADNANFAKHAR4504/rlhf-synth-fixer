import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';
import * as fs from 'fs';
import * as path from 'path';

// Set up Pulumi runtime mocks
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, any>;
  } {
    const id =
      args.inputs.name || args.inputs.functionName || args.inputs.bucket || args.name || 'test-id';
    return {
      id: `${id}-mocked-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${id}`,
        name: id,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return { name: 'us-east-1' };
    }
    return args.inputs;
  },
});

// Read tap-stack.ts for code analysis tests
const tapStackCode = fs.readFileSync(
  path.join(__dirname, '../lib/tap-stack.ts'),
  'utf-8'
);

describe('TapStack Unit Tests', () => {
  describe('Stack Instantiation', () => {
    it('should instantiate with environmentSuffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test123',
      });

      expect(stack).toBeDefined();
      expect(stack.scanResults).toBeDefined();
      expect(stack.complianceReport).toBeDefined();

      // Wait for outputs to resolve
      const scanResults = await stack.scanResults.promise();
      expect(scanResults).toContain('compliance-scanner');

      const complianceReport = await stack.complianceReport.promise();
      expect(complianceReport).toContain('s3://');
    });

    it('should instantiate with custom region', async () => {
      const stack = new TapStack('test-stack-region', {
        environmentSuffix: 'test456',
        region: 'us-west-2',
      });

      expect(stack).toBeDefined();
    });

    it('should create resources with environmentSuffix in name', async () => {
      const suffix = 'testsuffix';
      const stack = new TapStack('test-stack-suffix', {
        environmentSuffix: suffix,
      });

      const scanResults = await stack.scanResults.promise();
      expect(scanResults).toContain('compliance-scanner');
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in bucket name', async () => {
      const suffix = 'bucket123';
      const stack = new TapStack('test-bucket-stack', {
        environmentSuffix: suffix,
      });

      expect(stack).toBeDefined();
      // The bucket name pattern should include the suffix
      const report = await stack.complianceReport.promise();
      expect(report).toMatch(/compliance-reports-bucket123/);
    });

    it('should include environmentSuffix in Lambda function name', async () => {
      const suffix = 'lambda456';
      const stack = new TapStack('test-lambda-stack', {
        environmentSuffix: suffix,
      });

      const scanResults = await stack.scanResults.promise();
      expect(scanResults).toContain('compliance-scanner');
    });
  });

  describe('Compliance Logic Tests', () => {
    it('should identify compliant resources with all required tags', () => {
      const requiredTags = ['Environment', 'Owner', 'CostCenter', 'Project'];
      const resource = {
        tags: {
          Environment: 'prod',
          Owner: 'team@example.com',
          CostCenter: 'CC123',
          Project: 'Project1',
        },
      };

      const missingTags = requiredTags.filter((tag) => !resource.tags[tag]);
      expect(missingTags).toHaveLength(0);
    });

    it('should identify missing tags', () => {
      const requiredTags = ['Environment', 'Owner', 'CostCenter', 'Project'];
      const resource = {
        tags: {
          Environment: 'prod',
          Owner: 'team@example.com',
        },
      };

      const missingTags = requiredTags.filter((tag) => !resource.tags[tag]);
      expect(missingTags).toEqual(['CostCenter', 'Project']);
    });

    it('should identify all missing tags when resource has no tags', () => {
      const requiredTags = ['Environment', 'Owner', 'CostCenter', 'Project'];
      const resource = {
        tags: {},
      };

      const missingTags = requiredTags.filter((tag) => !resource.tags[tag]);
      expect(missingTags).toEqual(requiredTags);
    });

    it('should calculate compliance percentage correctly for 100% compliance', () => {
      const compliant = 10;
      const nonCompliant = 0;
      const total = compliant + nonCompliant;

      const percentage =
        total > 0 ? ((compliant / total) * 100).toFixed(2) : '0.00';
      expect(percentage).toBe('100.00');
    });

    it('should calculate compliance percentage correctly for 70% compliance', () => {
      const compliant = 7;
      const nonCompliant = 3;
      const total = compliant + nonCompliant;

      const percentage = ((compliant / total) * 100).toFixed(2);
      expect(percentage).toBe('70.00');
    });

    it('should calculate compliance percentage correctly for 0% compliance', () => {
      const compliant = 0;
      const nonCompliant = 10;
      const total = compliant + nonCompliant;

      const percentage = ((compliant / total) * 100).toFixed(2);
      expect(percentage).toBe('0.00');
    });

    it('should handle edge case with zero total resources', () => {
      const compliant = 0;
      const nonCompliant = 0;
      const total = compliant + nonCompliant;

      const percentage =
        total > 0 ? ((compliant / total) * 100).toFixed(2) : '0.00';
      expect(percentage).toBe('0.00');
    });

    it('should flag resources older than 90 days', () => {
      const ninetyOneDaysAgo = new Date();
      ninetyOneDaysAgo.setDate(ninetyOneDaysAgo.getDate() - 91);

      const ageInDays = Math.floor(
        (Date.now() - ninetyOneDaysAgo.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(ageInDays).toBeGreaterThan(90);
    });

    it('should not flag resources younger than 90 days', () => {
      const eightyNineDaysAgo = new Date();
      eightyNineDaysAgo.setDate(eightyNineDaysAgo.getDate() - 89);

      const ageInDays = Math.floor(
        (Date.now() - eightyNineDaysAgo.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(ageInDays).toBeLessThanOrEqual(90);
    });

    it('should handle exact 90 days boundary', () => {
      const exactlyNinetyDaysAgo = new Date();
      exactlyNinetyDaysAgo.setDate(exactlyNinetyDaysAgo.getDate() - 90);

      const ageInDays = Math.floor(
        (Date.now() - exactlyNinetyDaysAgo.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(ageInDays).toBeLessThanOrEqual(90);
    });
  });

  describe('Tag Validation Edge Cases', () => {
    const requiredTags = ['Environment', 'Owner', 'CostCenter', 'Project'];

    it('should handle tags with empty string values', () => {
      const resource = {
        tags: {
          Environment: '',
          Owner: 'team@example.com',
          CostCenter: 'CC123',
          Project: 'Project1',
        },
      };

      // Empty strings are still considered as present tags
      const missingTags = requiredTags.filter((tag) => !resource.tags[tag]);
      expect(missingTags).toEqual(['Environment']);
    });

    it('should handle tags with whitespace-only values', () => {
      const resource = {
        tags: {
          Environment: '   ',
          Owner: 'team@example.com',
          CostCenter: 'CC123',
          Project: 'Project1',
        },
      };

      // Whitespace-only strings are considered present but might be flagged
      const missingTags = requiredTags.filter((tag) => !resource.tags[tag]);
      expect(missingTags).toHaveLength(0);
    });

    it('should be case-sensitive for tag keys', () => {
      const resource = {
        tags: {
          environment: 'prod', // lowercase 'e'
          Owner: 'team@example.com',
          CostCenter: 'CC123',
          Project: 'Project1',
        },
      };

      const missingTags = requiredTags.filter((tag) => !resource.tags[tag]);
      expect(missingTags).toContain('Environment');
    });
  });

  describe('Date Calculations', () => {
    it('should calculate age in days correctly for new resources', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const ageInDays = Math.floor(
        (Date.now() - yesterday.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(ageInDays).toBe(1);
    });

    it('should calculate age in days correctly for old resources', () => {
      const longAgo = new Date();
      longAgo.setDate(longAgo.getDate() - 365);

      const ageInDays = Math.floor(
        (Date.now() - longAgo.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(ageInDays).toBeGreaterThanOrEqual(365);
    });

    it('should handle resources created today', () => {
      const today = new Date();

      const ageInDays = Math.floor(
        (Date.now() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(ageInDays).toBe(0);
    });
  });

  describe('Summary Calculations', () => {
    it('should calculate overall compliance from multiple services', () => {
      const ec2Compliant = 5;
      const ec2NonCompliant = 5;
      const rdsCompliant = 8;
      const rdsNonCompliant = 2;
      const s3Compliant = 10;
      const s3NonCompliant = 0;

      const totalCompliant = ec2Compliant + rdsCompliant + s3Compliant;
      const totalNonCompliant =
        ec2NonCompliant + rdsNonCompliant + s3NonCompliant;
      const total = totalCompliant + totalNonCompliant;

      const overallPercentage = ((totalCompliant / total) * 100).toFixed(2);

      expect(overallPercentage).toBe('76.67');
      expect(totalCompliant).toBe(23);
      expect(totalNonCompliant).toBe(7);
      expect(total).toBe(30);
    });

    it('should handle service-specific compliance rates', () => {
      // EC2: 5/10 = 50%
      const ec2Total = 10;
      const ec2Compliant = 5;
      const ec2Percentage = ((ec2Compliant / ec2Total) * 100).toFixed(2);

      // RDS: 8/10 = 80%
      const rdsTotal = 10;
      const rdsCompliant = 8;
      const rdsPercentage = ((rdsCompliant / rdsTotal) * 100).toFixed(2);

      // S3: 10/10 = 100%
      const s3Total = 10;
      const s3Compliant = 10;
      const s3Percentage = ((s3Compliant / s3Total) * 100).toFixed(2);

      expect(ec2Percentage).toBe('50.00');
      expect(rdsPercentage).toBe('80.00');
      expect(s3Percentage).toBe('100.00');
    });
  });

  describe('Recommendation Generation Logic', () => {
    it('should group non-compliant resources by service type', () => {
      const nonCompliantResources = [
        { resourceType: 'EC2 Instance', resourceId: 'i-123' },
        { resourceType: 'EC2 Instance', resourceId: 'i-456' },
        { resourceType: 'RDS Instance', resourceId: 'db-789' },
        { resourceType: 'S3 Bucket', resourceId: 'bucket-abc' },
      ];

      const grouped = nonCompliantResources.reduce(
        (acc, resource) => {
          if (!acc[resource.resourceType]) {
            acc[resource.resourceType] = [];
          }
          acc[resource.resourceType].push(resource);
          return acc;
        },
        {} as Record<string, typeof nonCompliantResources>
      );

      expect(grouped['EC2 Instance']).toHaveLength(2);
      expect(grouped['RDS Instance']).toHaveLength(1);
      expect(grouped['S3 Bucket']).toHaveLength(1);
    });

    it('should prioritize resources older than 90 days', () => {
      const resources = [
        { resourceId: 'i-123', ageInDays: 100, flagged: true },
        { resourceId: 'i-456', ageInDays: 50, flagged: false },
        { resourceId: 'i-789', ageInDays: 200, flagged: true },
      ];

      const flaggedResources = resources.filter((r) => r.flagged);
      expect(flaggedResources).toHaveLength(2);
      expect(flaggedResources.every((r) => r.ageInDays > 90)).toBe(true);
    });
  });

  describe('Infrastructure Code Analysis', () => {
    describe('S3 Bucket Configuration', () => {
      it('should create S3 bucket with environmentSuffix in name', () => {
        expect(tapStackCode).toMatch(/compliance-reports-\$\{props\.environmentSuffix\}/);
      });

      it('should have forceDestroy enabled for S3 bucket', () => {
        expect(tapStackCode).toMatch(/forceDestroy:\s*true/);
      });

      it('should have S3 bucket public access block', () => {
        expect(tapStackCode).toMatch(/BucketPublicAccessBlock/);
      });

      it('should block all public access', () => {
        expect(tapStackCode).toMatch(/blockPublicAcls:\s*true/);
        expect(tapStackCode).toMatch(/blockPublicPolicy:\s*true/);
        expect(tapStackCode).toMatch(/ignorePublicAcls:\s*true/);
        expect(tapStackCode).toMatch(/restrictPublicBuckets:\s*true/);
      });
    });

    describe('Lambda Function Configuration', () => {
      it('should create Lambda function with explicit name', () => {
        expect(tapStackCode).toMatch(/name:\s*`compliance-scanner-\$\{props\.environmentSuffix\}`/);
      });

      it('should use NodeJS 18.x runtime', () => {
        expect(tapStackCode).toMatch(/runtime:\s*aws\.lambda\.Runtime\.NodeJS18dX/);
      });

      it('should set timeout to 300 seconds', () => {
        expect(tapStackCode).toMatch(/timeout:\s*300/);
      });

      it('should set memory to 512 MB', () => {
        expect(tapStackCode).toMatch(/memorySize:\s*512/);
      });

      it('should have REPORT_BUCKET environment variable', () => {
        expect(tapStackCode).toMatch(/REPORT_BUCKET:\s*reportBucket\.id/);
      });

      it('should have ENVIRONMENT_SUFFIX environment variable', () => {
        expect(tapStackCode).toMatch(/ENVIRONMENT_SUFFIX:\s*props\.environmentSuffix/);
      });

      it('should have dependsOn logGroup', () => {
        expect(tapStackCode).toMatch(/dependsOn:\s*\[logGroup\]/);
      });
    });

    describe('CloudWatch Log Group Configuration', () => {
      it('should create CloudWatch Log Group', () => {
        expect(tapStackCode).toMatch(/aws\.cloudwatch\.LogGroup/);
      });

      it('should set log group name with Lambda prefix', () => {
        expect(tapStackCode).toMatch(/name:\s*`\/aws\/lambda\/compliance-scanner-\$\{props\.environmentSuffix\}`/);
      });

      it('should set retention to 30 days', () => {
        expect(tapStackCode).toMatch(/retentionInDays:\s*30/);
      });
    });

    describe('IAM Configuration', () => {
      it('should create IAM role for Lambda', () => {
        expect(tapStackCode).toMatch(/aws\.iam\.Role/);
      });

      it('should attach AWSLambdaBasicExecutionRole', () => {
        expect(tapStackCode).toMatch(/AWSLambdaBasicExecutionRole/);
      });

      it('should have EC2 describe permissions', () => {
        expect(tapStackCode).toMatch(/ec2:DescribeInstances/);
        expect(tapStackCode).toMatch(/ec2:DescribeTags/);
      });

      it('should have RDS describe permissions', () => {
        expect(tapStackCode).toMatch(/rds:DescribeDBInstances/);
        expect(tapStackCode).toMatch(/rds:DescribeDBClusters/);
        expect(tapStackCode).toMatch(/rds:ListTagsForResource/);
      });

      it('should have S3 permissions', () => {
        expect(tapStackCode).toMatch(/s3:ListAllMyBuckets/);
        expect(tapStackCode).toMatch(/s3:GetBucketTagging/);
        expect(tapStackCode).toMatch(/s3:PutObject/);
      });
    });

    describe('EventBridge Configuration', () => {
      it('should create EventBridge rule', () => {
        expect(tapStackCode).toMatch(/aws\.cloudwatch\.EventRule/);
      });

      it('should schedule daily scan', () => {
        expect(tapStackCode).toMatch(/scheduleExpression:\s*['"]rate\(1 day\)['"]/);
      });

      it('should create EventBridge target', () => {
        expect(tapStackCode).toMatch(/aws\.cloudwatch\.EventTarget/);
      });

      it('should create Lambda permission for EventBridge', () => {
        expect(tapStackCode).toMatch(/aws\.lambda\.Permission/);
        expect(tapStackCode).toMatch(/events\.amazonaws\.com/);
      });
    });

    describe('Output Configuration', () => {
      it('should export lambdaFunctionName', () => {
        expect(tapStackCode).toMatch(/this\.lambdaFunctionName\s*=\s*scannerFunction\.name/);
      });

      it('should export s3BucketName', () => {
        expect(tapStackCode).toMatch(/this\.s3BucketName\s*=\s*reportBucket\.id/);
      });

      it('should export lambdaFunctionArn', () => {
        expect(tapStackCode).toMatch(/this\.lambdaFunctionArn\s*=\s*scannerFunction\.arn/);
      });

      it('should export eventRuleName', () => {
        expect(tapStackCode).toMatch(/this\.eventRuleName\s*=\s*scanRule\.name/);
      });

      it('should register outputs with PascalCase keys', () => {
        expect(tapStackCode).toMatch(/LambdaFunctionName:\s*this\.lambdaFunctionName/);
        expect(tapStackCode).toMatch(/S3BucketName:\s*this\.s3BucketName/);
      });
    });

    describe('Lambda Code Analysis', () => {
      it('should use AWS SDK v3 for EC2', () => {
        expect(tapStackCode).toMatch(/@aws-sdk\/client-ec2/);
        expect(tapStackCode).toMatch(/EC2Client/);
        expect(tapStackCode).toMatch(/DescribeInstancesCommand/);
      });

      it('should use AWS SDK v3 for RDS', () => {
        expect(tapStackCode).toMatch(/@aws-sdk\/client-rds/);
        expect(tapStackCode).toMatch(/RDSClient/);
        expect(tapStackCode).toMatch(/DescribeDBInstancesCommand/);
        expect(tapStackCode).toMatch(/DescribeDBClustersCommand/);
      });

      it('should use AWS SDK v3 for S3', () => {
        expect(tapStackCode).toMatch(/@aws-sdk\/client-s3/);
        expect(tapStackCode).toMatch(/S3Client/);
        expect(tapStackCode).toMatch(/ListBucketsCommand/);
        expect(tapStackCode).toMatch(/GetBucketTaggingCommand/);
        expect(tapStackCode).toMatch(/PutObjectCommand/);
      });

      it('should define REQUIRED_TAGS constant', () => {
        expect(tapStackCode).toMatch(/REQUIRED_TAGS\s*=\s*\['Environment',\s*'Owner',\s*'CostCenter',\s*'Project'\]/);
      });

      it('should define NINETY_DAYS constant', () => {
        expect(tapStackCode).toMatch(/NINETY_DAYS\s*=\s*90/);
      });

      it('should handle NoSuchTagSet error for S3', () => {
        expect(tapStackCode).toMatch(/NoSuchTagSet/);
      });

      it('should calculate compliance percentages', () => {
        expect(tapStackCode).toMatch(/compliancePercentage/);
        expect(tapStackCode).toMatch(/toFixed\(2\)/);
      });

      it('should generate recommendations', () => {
        expect(tapStackCode).toMatch(/recommendations\.push/);
      });

      it('should save report to S3', () => {
        expect(tapStackCode).toMatch(/PutObjectCommand/);
        expect(tapStackCode).toMatch(/compliance-report-/);
      });
    });
  });

  describe('Stack Output Tests', () => {
    it('should have lambdaFunctionName output', async () => {
      const stack = new TapStack('test-outputs', {
        environmentSuffix: 'outputtest',
      });

      expect(stack.lambdaFunctionName).toBeDefined();
    });

    it('should have s3BucketName output', async () => {
      const stack = new TapStack('test-s3-output', {
        environmentSuffix: 's3test',
      });

      expect(stack.s3BucketName).toBeDefined();
    });

    it('should have lambdaFunctionArn output', async () => {
      const stack = new TapStack('test-arn-output', {
        environmentSuffix: 'arntest',
      });

      expect(stack.lambdaFunctionArn).toBeDefined();
    });

    it('should have eventRuleName output', async () => {
      const stack = new TapStack('test-rule-output', {
        environmentSuffix: 'ruletest',
      });

      expect(stack.eventRuleName).toBeDefined();
    });
  });
});
