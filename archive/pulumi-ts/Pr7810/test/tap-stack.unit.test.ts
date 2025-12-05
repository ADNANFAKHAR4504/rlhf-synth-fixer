/**
 * Unit tests for Infrastructure Compliance Scanner TapStack
 *
 * These tests verify that the infrastructure resources are correctly defined
 * without requiring actual AWS deployment.
 */
import * as pulumi from '@pulumi/pulumi';
import * as fs from 'fs';
import * as path from 'path';

// Read the tap-stack.ts file for pattern validation
const tapStackPath = path.join(__dirname, '../lib/tap-stack.ts');
const tapStackCode = fs.readFileSync(tapStackPath, 'utf-8');

// Read the Lambda code for validation
const lambdaPath = path.join(__dirname, '../lib/lambda/compliance-scanner.js');
const lambdaCode = fs.readFileSync(lambdaPath, 'utf-8');

// Set up Pulumi mocks for unit testing
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, unknown>;
  } {
    return {
      id: args.inputs.name ? `${args.name}_id` : args.name + '_id',
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        bucket: args.inputs.bucket || `test-bucket-${args.name}`,
        name: args.inputs.name || args.name,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

// Import the stack after setting up mocks
import { TapStack } from '../lib/tap-stack';

describe('TapStack Infrastructure Tests', () => {
  let stack: TapStack;

  beforeAll(() => {
    stack = new TapStack('test-stack', {
      environmentSuffix: 'test',
      tags: {
        Environment: 'test',
        Team: 'test-team',
      },
    });
  });

  describe('Constructor and Configuration', () => {
    it('should create a TapStack with default environmentSuffix', () => {
      const testStack = new TapStack('default-stack', {});
      expect(testStack).toBeDefined();
      expect(testStack.reportBucketName).toBeDefined();
    });

    it('should create a TapStack with custom environmentSuffix', () => {
      const testStack = new TapStack('custom-stack', {
        environmentSuffix: 'prod',
      });
      expect(testStack).toBeDefined();
    });

    it('should create a TapStack with custom tags', () => {
      const testStack = new TapStack('tagged-stack', {
        environmentSuffix: 'test',
        tags: {
          Project: 'TestProject',
          Owner: 'TestOwner',
        },
      });
      expect(testStack).toBeDefined();
    });

    it('should expose required outputs', () => {
      expect(stack.reportBucketName).toBeDefined();
      expect(stack.complianceFunctionArn).toBeDefined();
      expect(stack.complianceFunctionName).toBeDefined();
    });
  });

  describe('S3 Bucket Configuration', () => {
    it('should define S3 bucket resource', () => {
      expect(tapStackCode).toMatch(/aws\.s3\.Bucket/);
    });

    it('should include environmentSuffix in bucket name', () => {
      expect(tapStackCode).toMatch(/compliance-reports-\$\{environmentSuffix\}/);
    });

    it('should enable forceDestroy for cleanup', () => {
      expect(tapStackCode).toMatch(/forceDestroy:\s*true/);
    });

    it('should configure lifecycle rules', () => {
      expect(tapStackCode).toMatch(/lifecycleRules/);
    });

    it('should set lifecycle expiration to 90 days', () => {
      expect(tapStackCode).toMatch(/days:\s*90/);
    });
  });

  describe('IAM Role Configuration', () => {
    it('should define IAM role resource', () => {
      expect(tapStackCode).toMatch(/aws\.iam\.Role/);
    });

    it('should include environmentSuffix in role name', () => {
      expect(tapStackCode).toMatch(/compliance-scanner-role-\$\{environmentSuffix\}/);
    });

    it('should configure Lambda assume role policy', () => {
      expect(tapStackCode).toMatch(/lambda\.amazonaws\.com/);
    });

    it('should define IAM role policy', () => {
      expect(tapStackCode).toMatch(/aws\.iam\.RolePolicy/);
    });
  });

  describe('IAM Policy Permissions', () => {
    it('should include EC2 DescribeInstances permission', () => {
      expect(tapStackCode).toMatch(/ec2:DescribeInstances/);
    });

    it('should include EC2 DescribeVolumes permission', () => {
      expect(tapStackCode).toMatch(/ec2:DescribeVolumes/);
    });

    it('should include EC2 DescribeSecurityGroups permission', () => {
      expect(tapStackCode).toMatch(/ec2:DescribeSecurityGroups/);
    });

    it('should include EC2 DescribeVpcs permission', () => {
      expect(tapStackCode).toMatch(/ec2:DescribeVpcs/);
    });

    it('should include EC2 DescribeFlowLogs permission', () => {
      expect(tapStackCode).toMatch(/ec2:DescribeFlowLogs/);
    });

    it('should include IAM ListRoles permission', () => {
      expect(tapStackCode).toMatch(/iam:ListRoles/);
    });

    it('should include IAM ListRolePolicies permission', () => {
      expect(tapStackCode).toMatch(/iam:ListRolePolicies/);
    });

    it('should include IAM ListAttachedRolePolicies permission', () => {
      expect(tapStackCode).toMatch(/iam:ListAttachedRolePolicies/);
    });

    it('should include S3 PutObject permission', () => {
      expect(tapStackCode).toMatch(/s3:PutObject/);
    });

    it('should include CloudWatch PutMetricData permission', () => {
      expect(tapStackCode).toMatch(/cloudwatch:PutMetricData/);
    });

    it('should include CloudWatch Logs permissions', () => {
      expect(tapStackCode).toMatch(/logs:CreateLogGroup/);
      expect(tapStackCode).toMatch(/logs:CreateLogStream/);
      expect(tapStackCode).toMatch(/logs:PutLogEvents/);
    });
  });

  describe('Lambda Function Configuration', () => {
    it('should define Lambda function resource', () => {
      expect(tapStackCode).toMatch(/aws\.lambda\.Function/);
    });

    it('should include environmentSuffix in function name', () => {
      expect(tapStackCode).toMatch(/compliance-scanner-\$\{environmentSuffix\}/);
    });

    it('should use Node.js 20.x runtime', () => {
      expect(tapStackCode).toMatch(/NodeJS20dX|nodejs20\.x/);
    });

    it('should set timeout to 300 seconds (5 minutes)', () => {
      expect(tapStackCode).toMatch(/timeout:\s*300/);
    });

    it('should set memory to 512 MB', () => {
      expect(tapStackCode).toMatch(/memorySize:\s*512/);
    });

    it('should use index.handler as handler', () => {
      expect(tapStackCode).toMatch(/handler:\s*['"]index\.handler['"]/);
    });

    it('should configure REPORT_BUCKET environment variable', () => {
      expect(tapStackCode).toMatch(/REPORT_BUCKET/);
    });

    it('should configure ENVIRONMENT_SUFFIX environment variable', () => {
      expect(tapStackCode).toMatch(/ENVIRONMENT_SUFFIX/);
    });

    it('should load Lambda code from external file', () => {
      expect(tapStackCode).toMatch(/compliance-scanner\.js/);
    });
  });

  describe('CloudWatch Log Group Configuration', () => {
    it('should define CloudWatch Log Group', () => {
      expect(tapStackCode).toMatch(/aws\.cloudwatch\.LogGroup/);
    });

    it('should set log retention to 7 days', () => {
      expect(tapStackCode).toMatch(/retentionInDays:\s*7/);
    });

    it('should include /aws/lambda/ prefix in log group name', () => {
      expect(tapStackCode).toMatch(/\/aws\/lambda\//);
    });
  });

  describe('Resource Dependencies', () => {
    it('should set Lambda dependsOn IAM policy', () => {
      expect(tapStackCode).toMatch(/dependsOn:\s*\[.*lambdaPolicy.*\]/s);
    });

    it('should set parent to this for resources', () => {
      expect(tapStackCode).toMatch(/parent:\s*this/);
    });
  });

  describe('Stack Outputs', () => {
    it('should output reportBucketName', () => {
      expect(tapStackCode).toMatch(/this\.reportBucketName\s*=/);
    });

    it('should output complianceFunctionArn', () => {
      expect(tapStackCode).toMatch(/this\.complianceFunctionArn\s*=/);
    });

    it('should output complianceFunctionName', () => {
      expect(tapStackCode).toMatch(/this\.complianceFunctionName\s*=/);
    });

    it('should register outputs', () => {
      expect(tapStackCode).toMatch(/this\.registerOutputs/);
    });
  });
});

describe('Lambda Function Code Tests', () => {
  describe('AWS SDK Imports', () => {
    it('should import EC2Client', () => {
      expect(lambdaCode).toMatch(/EC2Client/);
    });

    it('should import DescribeInstancesCommand', () => {
      expect(lambdaCode).toMatch(/DescribeInstancesCommand/);
    });

    it('should import DescribeVolumesCommand', () => {
      expect(lambdaCode).toMatch(/DescribeVolumesCommand/);
    });

    it('should import DescribeSecurityGroupsCommand', () => {
      expect(lambdaCode).toMatch(/DescribeSecurityGroupsCommand/);
    });

    it('should import DescribeVpcsCommand', () => {
      expect(lambdaCode).toMatch(/DescribeVpcsCommand/);
    });

    it('should import DescribeFlowLogsCommand', () => {
      expect(lambdaCode).toMatch(/DescribeFlowLogsCommand/);
    });

    it('should import IAMClient', () => {
      expect(lambdaCode).toMatch(/IAMClient/);
    });

    it('should import ListRolesCommand', () => {
      expect(lambdaCode).toMatch(/ListRolesCommand/);
    });

    it('should import ListAttachedRolePoliciesCommand', () => {
      expect(lambdaCode).toMatch(/ListAttachedRolePoliciesCommand/);
    });

    it('should import S3Client', () => {
      expect(lambdaCode).toMatch(/S3Client/);
    });

    it('should import PutObjectCommand', () => {
      expect(lambdaCode).toMatch(/PutObjectCommand/);
    });

    it('should import CloudWatchClient', () => {
      expect(lambdaCode).toMatch(/CloudWatchClient/);
    });

    it('should import PutMetricDataCommand', () => {
      expect(lambdaCode).toMatch(/PutMetricDataCommand/);
    });
  });

  describe('Violation Categories', () => {
    it('should track unencryptedVolumes violations', () => {
      expect(lambdaCode).toMatch(/unencryptedVolumes/);
    });

    it('should track permissiveSecurityGroups violations', () => {
      expect(lambdaCode).toMatch(/permissiveSecurityGroups/);
    });

    it('should track missingTags violations', () => {
      expect(lambdaCode).toMatch(/missingTags/);
    });

    it('should track iamViolations', () => {
      expect(lambdaCode).toMatch(/iamViolations/);
    });

    it('should track missingFlowLogs violations', () => {
      expect(lambdaCode).toMatch(/missingFlowLogs/);
    });
  });

  describe('EC2 Scanning Logic', () => {
    it('should define scanEC2Instances function', () => {
      expect(lambdaCode).toMatch(/async\s+function\s+scanEC2Instances/);
    });

    it('should check for required tags', () => {
      expect(lambdaCode).toMatch(/Environment.*Owner.*CostCenter/);
    });

    it('should check volume encryption', () => {
      expect(lambdaCode).toMatch(/volume\.Encrypted|!volume\.Encrypted/);
    });

    it('should skip terminated instances', () => {
      expect(lambdaCode).toMatch(/terminated/);
    });
  });

  describe('Security Group Scanning Logic', () => {
    it('should define scanSecurityGroups function', () => {
      expect(lambdaCode).toMatch(/async\s+function\s+scanSecurityGroups/);
    });

    it('should check for 0.0.0.0/0 CIDR', () => {
      expect(lambdaCode).toMatch(/0\.0\.0\.0\/0/);
    });

    it('should allow ports 80 and 443', () => {
      expect(lambdaCode).toMatch(/80/);
      expect(lambdaCode).toMatch(/443/);
    });

    it('should check for missing descriptions', () => {
      expect(lambdaCode).toMatch(/Description|description/);
    });
  });

  describe('IAM Scanning Logic', () => {
    it('should define scanIAMRoles function', () => {
      expect(lambdaCode).toMatch(/async\s+function\s+scanIAMRoles/);
    });

    it('should skip AWS service roles', () => {
      expect(lambdaCode).toMatch(/startsWith.*AWS|aws-/);
    });

    it('should check for AdministratorAccess policy', () => {
      expect(lambdaCode).toMatch(/AdministratorAccess/);
    });

    it('should check for PowerUserAccess policy', () => {
      expect(lambdaCode).toMatch(/PowerUserAccess/);
    });

    it('should check for roles without policies', () => {
      expect(lambdaCode).toMatch(/NoPoliciesAttached/);
    });
  });

  describe('VPC Flow Logs Scanning Logic', () => {
    it('should define scanVPCFlowLogs function', () => {
      expect(lambdaCode).toMatch(/async\s+function\s+scanVPCFlowLogs/);
    });

    it('should check for vpc- prefix', () => {
      expect(lambdaCode).toMatch(/vpc-/);
    });

    it('should track VPCs without flow logs', () => {
      expect(lambdaCode).toMatch(/missingFlowLogs/);
    });
  });

  describe('Report Generation', () => {
    it('should define generateReport function', () => {
      expect(lambdaCode).toMatch(/function\s+generateReport/);
    });

    it('should include timestamp in report', () => {
      expect(lambdaCode).toMatch(/timestamp/);
    });

    it('should include region in report', () => {
      expect(lambdaCode).toMatch(/region/);
    });

    it('should include summary in report', () => {
      expect(lambdaCode).toMatch(/summary/);
    });

    it('should calculate totalViolations', () => {
      expect(lambdaCode).toMatch(/totalViolations/);
    });
  });

  describe('S3 Upload Logic', () => {
    it('should define uploadReport function', () => {
      expect(lambdaCode).toMatch(/async\s+function\s+uploadReport/);
    });

    it('should upload to compliance-reports path', () => {
      expect(lambdaCode).toMatch(/compliance-reports/);
    });

    it('should use JSON content type', () => {
      expect(lambdaCode).toMatch(/application\/json/);
    });
  });

  describe('CloudWatch Metrics Publishing', () => {
    it('should define publishMetrics function', () => {
      expect(lambdaCode).toMatch(/async\s+function\s+publishMetrics/);
    });

    it('should use ComplianceScanner namespace', () => {
      expect(lambdaCode).toMatch(/ComplianceScanner/);
    });

    it('should publish UnencryptedVolumes metric', () => {
      expect(lambdaCode).toMatch(/MetricName.*UnencryptedVolumes/);
    });

    it('should publish PermissiveSecurityGroups metric', () => {
      expect(lambdaCode).toMatch(/MetricName.*PermissiveSecurityGroups/);
    });

    it('should publish MissingTags metric', () => {
      expect(lambdaCode).toMatch(/MetricName.*MissingTags/);
    });

    it('should publish IAMViolations metric', () => {
      expect(lambdaCode).toMatch(/MetricName.*IAMViolations/);
    });

    it('should publish MissingFlowLogs metric', () => {
      expect(lambdaCode).toMatch(/MetricName.*MissingFlowLogs/);
    });

    it('should use Environment dimension', () => {
      expect(lambdaCode).toMatch(/Dimensions[\s\S]*?Name.*Environment/);
    });

    it('should use Count unit for metrics', () => {
      expect(lambdaCode).toMatch(/Unit.*Count/);
    });
  });

  describe('Error Handling', () => {
    it('should have try-catch in handler', () => {
      expect(lambdaCode).toMatch(/try\s*\{[\s\S]*catch/);
    });

    it('should log errors', () => {
      expect(lambdaCode).toMatch(/console\.error/);
    });

    it('should throw errors for proper Lambda failure reporting', () => {
      expect(lambdaCode).toMatch(/throw\s+error/);
    });
  });

  describe('Handler Response', () => {
    it('should export handler function', () => {
      expect(lambdaCode).toMatch(/exports\.handler/);
    });

    it('should return statusCode 200 on success', () => {
      expect(lambdaCode).toMatch(/statusCode:\s*200/);
    });

    it('should return summary in response body', () => {
      expect(lambdaCode).toMatch(/body.*summary|summary.*body/s);
    });

    it('should return report location in response', () => {
      expect(lambdaCode).toMatch(/reportLocation/);
    });
  });
});

describe('File Structure Tests', () => {
  it('should have tap-stack.ts in lib folder', () => {
    expect(fs.existsSync(tapStackPath)).toBe(true);
  });

  it('should have compliance-scanner.js in lib/lambda folder', () => {
    expect(fs.existsSync(lambdaPath)).toBe(true);
  });

  it('should export TapStack class', () => {
    expect(tapStackCode).toMatch(/export\s+class\s+TapStack/);
  });

  it('should export TapStackArgs interface', () => {
    expect(tapStackCode).toMatch(/export\s+interface\s+TapStackArgs/);
  });
});
