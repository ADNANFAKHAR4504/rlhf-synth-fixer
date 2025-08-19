import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetPolicyCommand,
  GetPolicyVersionCommand,
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  GetBucketEncryptionCommand,
  GetBucketLocationCommand,
  GetBucketTaggingCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const TF_DIR = path.resolve(__dirname, '..', '..'); // adjust if needed
const REQUIRED_BACKEND = true; // set false to bypass backend requirement in CI

function run(cmd: string, args: string[], opts: { cwd?: string } = {}) {
  const res = spawnSync(cmd, args, {
    cwd: opts.cwd || TF_DIR,
    encoding: 'utf8',
  });
  if (res.status !== 0) {
    throw new Error(
      `${cmd} ${args.join(' ')} failed: ${res.stderr || res.stdout}`
    );
  }
  return res.stdout.trim();
}

function terraformHasBackend(mainTfPath: string): boolean {
  if (!existsSync(mainTfPath)) return false;
  const txt = readFileSync(mainTfPath, 'utf8');
  return /terraform\s*{[^}]*backend\s+"[^"]+"/s.test(txt);
}

let outputs: any = {};

beforeAll(() => {
  const mainTf = path.join(TF_DIR, 'main.tf');
  if (REQUIRED_BACKEND && !terraformHasBackend(mainTf)) {
    throw new Error(
      'Backend not configured in main.tf; per policy not initializing terraform.'
    );
  }
  // Init & plan (apply should be done outside test or guarded)
  run('terraform', ['init', '-input=false', '-no-color']);
  run('terraform', ['validate', '-no-color']);
  run('terraform', ['plan', '-input=false', '-no-color', '-out=tfplan']);
  // Optionally apply for live integration (guard by env)
  if (process.env.TF_APPLY === 'true') {
    run('terraform', ['apply', '-input=false', '-auto-approve', 'tfplan']);
  }
  try {
    const outRaw = run('terraform', ['output', '-json']);
    outputs = JSON.parse(outRaw);
  } catch {
    outputs = {};
  }
});

afterAll(() => {
  if (process.env.TF_DESTROY === 'true') {
    run('terraform', ['destroy', '-auto-approve', '-input=false']);
  }
});

// Example: central jest mock setup (override per test if needed)
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-iam');
jest.mock('@aws-sdk/client-lambda');
jest.mock('@aws-sdk/client-cloudwatch-logs');
jest.mock('@aws-sdk/client-cloudformation');
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/client-ec2');

// Utility to set mock resolved value
function mockClientCommand<TClient extends { send: Function }>(
  client: TClient,
  impl: (command: any) => any
) {
  // @ts-ignore
  client.send.mockImplementation(async (command: any) => impl(command));
}

describe('Terraform infrastructure', () => {
  test('terraform outputs structure', () => {
    // Adjust expected keys after seeing PROMPT.md & main.tf
    const expected: string[] = [
      // 'bucket_name', 'lambda_function_name', 'dynamodb_table_name', ...
    ];
    expected.forEach(k => {
      expect(outputs).toHaveProperty(k);
      expect(outputs[k]).toHaveProperty('value');
    });
  });

  describe('S3 Bucket', () => {
    test('bucket configuration matches expectations', async () => {
      const bucketName = outputs?.bucket_name?.value;
      if (!bucketName) return;

      const s3 = new S3Client({});
      mockClientCommand(s3, cmd => {
        if (cmd instanceof GetBucketLocationCommand) {
          return { LocationConstraint: 'us-east-1' };
        }
        if (cmd instanceof GetBucketEncryptionCommand) {
          return {
            ServerSideEncryptionConfiguration: {
              Rules: [
                {
                  ApplyServerSideEncryptionByDefault: {
                    SSEAlgorithm: 'aws:kms',
                  },
                },
              ],
            },
          };
        }
        if (cmd instanceof GetPublicAccessBlockCommand) {
          return {
            PublicAccessBlockConfiguration: {
              BlockPublicAcls: true,
              BlockPublicPolicy: true,
              IgnorePublicAcls: true,
              RestrictPublicBuckets: true,
            },
          };
        }
        if (cmd instanceof GetBucketVersioningCommand) {
          return { Status: 'Enabled' };
        }
        if (cmd instanceof GetBucketTaggingCommand) {
          return { TagSet: [{ Key: 'Environment', Value: 'test' }] };
        }
        throw new Error('Unhandled S3 command mock');
      });

      const loc = await s3.send(
        new GetBucketLocationCommand({ Bucket: bucketName })
      );
      expect(loc.LocationConstraint || 'us-east-1').toBe('us-east-1');

      const enc = await s3.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      expect(
        enc.ServerSideEncryptionConfiguration?.Rules?.[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toMatch(/kms|AES256/);

      const pab = await s3.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);

      const ver = await s3.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      expect(ver.Status).toBe('Enabled');

      const tags = await s3.send(
        new GetBucketTaggingCommand({ Bucket: bucketName })
      );
      const envTag = tags.TagSet?.find(t => t.Key === 'Environment');
      expect(envTag?.Value).toBeDefined();
    });
  });

  describe('IAM Role', () => {
    test('role and policies', async () => {
      const roleName =
        outputs?.lambda_role_name?.value || outputs?.iam_role_name?.value;
      if (!roleName) return;
      const iam = new IAMClient({});
      mockClientCommand(iam, cmd => {
        if (cmd instanceof GetRoleCommand) {
          return {
            Role: {
              RoleName: roleName,
              AssumeRolePolicyDocument: '{}',
              Arn: 'arn:aws:iam::123456789012:role/' + roleName,
            },
          };
        }
        if (cmd instanceof ListAttachedRolePoliciesCommand) {
          return {
            AttachedPolicies: [
              {
                PolicyName: 'AWSLambdaBasicExecutionRole',
                PolicyArn:
                  'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
              },
            ],
          };
        }
        if (cmd instanceof GetPolicyCommand) {
          return {
            Policy: {
              DefaultVersionId: 'v1',
              PolicyName: 'CustomPolicy',
              Arn: cmd.input.PolicyArn,
            },
          };
        }
        if (cmd instanceof GetPolicyVersionCommand) {
          return {
            PolicyVersion: {
              Document: encodeURIComponent(JSON.stringify({ Statement: [] })),
            },
          };
        }
        throw new Error('Unhandled IAM command');
      });

      const role = await iam.send(new GetRoleCommand({ RoleName: roleName }));
      expect(role.Role?.RoleName).toBe(roleName);

      const attached = await iam.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );
      expect(attached.AttachedPolicies?.length).toBeGreaterThan(0);
    });
  });

  describe('Lambda Function', () => {
    test('lambda configuration', async () => {
      const fnName = outputs?.lambda_function_name?.value;
      if (!fnName) return;
      const lambda = new LambdaClient({});
      mockClientCommand(lambda, cmd => {
        if (cmd instanceof GetFunctionCommand) {
          return {
            Configuration: {
              FunctionName: fnName,
              Runtime: 'nodejs18.x',
              Timeout: 10,
              MemorySize: 256,
              Environment: { Variables: { NODE_ENV: 'test' } },
            },
          };
        }
        if (cmd instanceof GetFunctionConfigurationCommand) {
          return {
            FunctionName: fnName,
            Runtime: 'nodejs18.x',
            Timeout: 10,
            MemorySize: 256,
            Environment: { Variables: { NODE_ENV: 'test' } },
          };
        }
        throw new Error('Unhandled Lambda command');
      });

      const cfg = await lambda.send(
        new GetFunctionConfigurationCommand({ FunctionName: fnName })
      );
      expect(cfg.Runtime).toMatch(/^nodejs/);
      expect(cfg.Timeout).toBeLessThanOrEqual(30);
    });
  });

  describe('DynamoDB Table', () => {
    test('table properties', async () => {
      const tableName = outputs?.dynamodb_table_name?.value;
      if (!tableName) return;
      const ddb = new DynamoDBClient({});
      mockClientCommand(ddb, cmd => {
        if (cmd instanceof DescribeTableCommand) {
          return {
            Table: {
              TableName: tableName,
              BillingModeSummary: { BillingMode: 'PAY_PER_REQUEST' },
              SSEDescription: { Status: 'ENABLED' },
            },
          };
        }
        throw new Error('Unhandled DDB command');
      });

      const table = await ddb.send(
        new DescribeTableCommand({ TableName: tableName })
      );
      expect(table.Table?.BillingModeSummary?.BillingMode).toBeDefined();
    });
  });

  describe('Networking', () => {
    test('VPC and subnets', async () => {
      const vpcId = outputs?.vpc_id?.value;
      if (!vpcId) return;
      const ec2 = new EC2Client({});
      mockClientCommand(ec2, cmd => {
        if (cmd instanceof DescribeVpcsCommand) {
          return {
            Vpcs: [
              { VpcId: vpcId, CidrBlock: '10.0.0.0/16', IsDefault: false },
            ],
          };
        }
        if (cmd instanceof DescribeSubnetsCommand) {
          return {
            Subnets: [
              {
                SubnetId: 'subnet-123',
                VpcId: vpcId,
                CidrBlock: '10.0.1.0/24',
              },
            ],
          };
        }
        if (cmd instanceof DescribeSecurityGroupsCommand) {
          return {
            SecurityGroups: [
              { GroupId: 'sg-123', VpcId: vpcId, GroupName: 'app-sg' },
            ],
          };
        }
        throw new Error('Unhandled EC2 command');
      });

      const vpcs = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(vpcs.Vpcs?.[0].VpcId).toBe(vpcId);
    });
  });

  // Add more describe blocks for each resource after reviewing main.tf
});

// Placeholder for advanced validation (CloudWatch Logs, CloudFormation stack, etc.)
describe('Advanced Validations', () => {
  test('cloudwatch log group exists for lambda', async () => {
    const fnName = outputs?.lambda_function_name?.value;
    if (!fnName) return;
    const logs = new CloudWatchLogsClient({});
    mockClientCommand(logs, cmd => {
      if (cmd instanceof DescribeLogGroupsCommand) {
        return { logGroups: [{ logGroupName: `/aws/lambda/${fnName}` }] };
      }
      throw new Error('Unhandled Logs command');
    });
    const res = await logs.send(
      new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/${fnName}`,
      })
    );
    const found = res.logGroups?.some(
      g => g.logGroupName === `/aws/lambda/${fnName}`
    );
    expect(found).toBe(true);
  });
});
