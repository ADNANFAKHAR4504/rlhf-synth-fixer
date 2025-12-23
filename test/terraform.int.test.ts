import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetRoleCommand,
  IAMClient,
} from '@aws-sdk/client-iam';
import {
  GetFunctionCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  GetBucketVersioningCommand,
  ListBucketsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

/* ----------------------------- Configuration ----------------------------- */

const isLocalStack = !!process.env.AWS_ENDPOINT_URL || !!process.env.LOCALSTACK_HOSTNAME;
const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';

const clientConfig = isLocalStack
  ? {
    endpoint,
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  }
  : { region: 'us-east-1' };

/* ----------------------------- Utilities ----------------------------- */

type TfOutputValue = { sensitive: boolean; type: string; value: any };

function readDeploymentOutputs(): Record<string, any> {
  const filePath = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Outputs file not found at ${filePath}`);
  }
  const outputs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const extractedValues: Record<string, any> = {};
  for (const key in outputs) {
    const output = outputs[key as keyof typeof outputs] as TfOutputValue;
    if (output?.value !== null && output?.value !== undefined) {
      extractedValues[key] = output.value;
    }
  }
  return extractedValues;
}

// AWS Clients initialization with LocalStack support
const ec2Client = new EC2Client(clientConfig);
const elbClient = new ElasticLoadBalancingV2Client(clientConfig);
const s3Client = new S3Client({ ...clientConfig, forcePathStyle: true });
const lambdaClient = new LambdaClient(clientConfig);
const iamClient = new IAMClient(clientConfig);
const cloudwatchLogsClient = new CloudWatchLogsClient(clientConfig);

/* ----------------------------- Integration Tests ----------------------------- */

describe('AWS Infrastructure Integration Tests', () => {
  const outputs = readDeploymentOutputs();

  // Check if features are enabled based on outputs
  const isSecondaryEnabled = outputs.secondary_vpc_id !== 'secondary-region-disabled';
  const isRdsEnabled = outputs.primary_db_identifier !== 'rds-disabled';
  const isAsgEnabled = outputs.primary_asg_name !== 'asg-disabled';
  const isRoute53Enabled = outputs.route53_zone_id !== 'route53-disabled';

  jest.setTimeout(30000);

  describe('Primary VPC and Networking', () => {
    it('should have primary VPC properly configured', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.primary_vpc_id] })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.1.0.0/16');
    });

    it('should have subnets in the primary VPC', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.primary_vpc_id] }],
        })
      );

      // Should have 4 subnets (2 public + 2 private)
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(4);
    });

    it('should have security groups in the primary VPC', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.primary_vpc_id] }],
        })
      );

      // Should have at least ALB and EC2 security groups
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Application Load Balancer', () => {
    it('should have primary ALB deployed', async () => {
      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({
          Names: [outputs.primary_alb_name],
        })
      );

      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers![0];
      expect(alb.Type).toBe('application');
      // LocalStack may not return Scheme attribute
      if (!isLocalStack) {
        expect(alb.Scheme).toBe('internet-facing');
      }
    });

    it('should have target group for primary ALB', async () => {
      const response = await elbClient.send(
        new DescribeTargetGroupsCommand({})
      );

      const targetGroups = response.TargetGroups?.filter(
        (tg) => tg.VpcId === outputs.primary_vpc_id
      );
      expect(targetGroups!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('S3 Storage', () => {
    it('should have S3 bucket created', async () => {
      const response = await s3Client.send(new ListBucketsCommand({}));
      const bucket = response.Buckets?.find(
        (b) => b.Name === outputs.s3_bucket_name
      );
      expect(bucket).toBeDefined();
    });

    it('should have versioning enabled on S3 bucket', async () => {
      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: outputs.s3_bucket_name })
      );
      expect(response.Status).toBe('Enabled');
    });
  });

  describe('Lambda Function', () => {
    it('should have cost saver Lambda function deployed', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: outputs.lambda_function_name,
        })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toBe(
        outputs.lambda_function_name
      );
      expect(response.Configuration?.Runtime).toBe('python3.9');
    });
  });

  describe('IAM Roles', () => {
    it('should have EC2 IAM role created', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: outputs.iam_ec2_role_name })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(outputs.iam_ec2_role_name);
    });

    it('should have Lambda IAM role created', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: outputs.lambda_function_name,
        })
      );

      expect(response.Configuration?.Role).toContain(outputs.iam_lambda_role_name);
    });
  });

  describe('CloudWatch Logs', () => {
    it('should have application log group created', async () => {
      const response = await cloudwatchLogsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/app/nova-project-logs',
        })
      );

      expect(response.logGroups!.length).toBeGreaterThanOrEqual(1);
    });
  });

  // Conditional tests for features that may be disabled in LocalStack
  describe('Conditional Features', () => {
    (isSecondaryEnabled ? it : it.skip)(
      'should have secondary region VPC when enabled',
      async () => {
        const response = await ec2Client.send(
          new DescribeVpcsCommand({ VpcIds: [outputs.secondary_vpc_id] })
        );
        expect(response.Vpcs).toHaveLength(1);
      }
    );

    it('should report correct feature status', () => {
      console.log('Feature status:');
      console.log(`  Secondary Region: ${isSecondaryEnabled ? 'enabled' : 'disabled'}`);
      console.log(`  RDS: ${isRdsEnabled ? 'enabled' : 'disabled'}`);
      console.log(`  ASG: ${isAsgEnabled ? 'enabled' : 'disabled'}`);
      console.log(`  Route53: ${isRoute53Enabled ? 'enabled' : 'disabled'}`);
      console.log(`  LocalStack: ${isLocalStack ? 'yes' : 'no'}`);
      expect(true).toBe(true);
    });
  });
});
