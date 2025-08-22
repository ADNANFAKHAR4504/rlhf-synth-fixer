import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcsCommandOutput,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeLoadBalancersCommandOutput,
  LoadBalancer,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBInstancesCommandOutput,
  DBInstance,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketEncryptionCommandOutput,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionCommandOutput,
} from '@aws-sdk/client-lambda';


const outputs: Record<string, string> = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Region from env (defaults to us-west-2)
const region: string = process.env.AWS_REGION || 'us-west-2';

const ec2 = new EC2Client({ region });
const elbv2 = new ElasticLoadBalancingV2Client({ region });
const rds = new RDSClient({ region });
const s3 = new S3Client({ region });
const lambda = new LambdaClient({ region });

function parseBuckets(outputValue: string): Record<string, string> {
  // format: "main=<bucket1>, logs=<bucket2>"
  const parts = (outputValue || '').split(',').map((s) => s.trim());
  const map: Record<string, string> = {};
  for (const p of parts) {
    const [k, v] = p.split('=');
    if (k && v) map[k] = v;
  }
  return map;
}

describe('TAP Stack Integration (using cfn-outputs/flat-outputs.json)', () => {
  test('required outputs are present and non-empty', () => {
    const required = [
      'VpcId',
      'ALBDNSName',
      'RDSEndpoint',
      'LambdaArn',
      'S3Buckets',
      'KmsKeyArn',
    ];
    required.forEach((k: string) => {
      expect(outputs[k]).toBeDefined();
      expect(String(outputs[k]).length).toBeGreaterThan(0);
    });
  });

  describe('VPC', () => {
    test('VPC exists and has expected CIDR', async () => {
      const vpcId: string = outputs.VpcId as string;
      expect(vpcId).toMatch(/^vpc-/);

      const resp: DescribeVpcsCommandOutput = await ec2.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      const vpc = resp.Vpcs?.[0];
      expect(vpc?.State).toBe('available');
      expect(vpc?.CidrBlock).toBe('10.20.0.0/16');
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB with the output DNS name exists and is active', async () => {
      const dns: string = outputs.ALBDNSName as string;
      expect(dns).toMatch(/\.elb\.amazonaws\.com$/);

      let nextMarker: string | undefined = undefined;
      let found: LoadBalancer | undefined = undefined;

      do {
        const resp: DescribeLoadBalancersCommandOutput = await elbv2.send(
          new DescribeLoadBalancersCommand(nextMarker ? { Marker: nextMarker } : {})
        );
        const hit: LoadBalancer | undefined = (resp.LoadBalancers || []).find(
          (lb: LoadBalancer) => lb.DNSName === dns
        );
        if (hit) {
          found = hit;
          break;
        }
        nextMarker = resp.NextMarker;
      } while (nextMarker);

      expect(found).toBeDefined();
      expect(found?.Scheme).toBe('internet-facing');
      expect(found?.Type).toBe('application');
      expect(found?.State?.Code).toBe('active');
    });
  });

  describe('S3 Buckets (main & logs)', () => {
    test('Both buckets exist and are SSE-KMS encrypted', async () => {
      const parsed = parseBuckets(outputs.S3Buckets as string);
      const main: string | undefined = parsed.main;
      const logs: string | undefined = parsed.logs;

      expect(main).toBeDefined();
      expect(logs).toBeDefined();

      // Existence
      await expect(s3.send(new HeadBucketCommand({ Bucket: main! }))).resolves.not.toThrow();
      await expect(s3.send(new HeadBucketCommand({ Bucket: logs! }))).resolves.not.toThrow();

      // Encryption: aws:kms
      const encMain: GetBucketEncryptionCommandOutput = await s3.send(
        new GetBucketEncryptionCommand({ Bucket: main! })
      );
      const encLogs: GetBucketEncryptionCommandOutput = await s3.send(
        new GetBucketEncryptionCommand({ Bucket: logs! })
      );

      const algMain: string | undefined =
        encMain.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault
          ?.SSEAlgorithm;
      const algLogs: string | undefined =
        encLogs.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault
          ?.SSEAlgorithm;

      expect(algMain).toBe('aws:kms');
      expect(algLogs).toBe('aws:kms');
    });
  });

  describe('RDS MySQL', () => {
    test('DB instance for output endpoint exists, is private & encrypted', async () => {
      const endpoint: string = outputs.RDSEndpoint as string;
      expect(endpoint).toMatch(/\.rds\.amazonaws\.com$/);

      const resp: DescribeDBInstancesCommandOutput = await rds.send(
        new DescribeDBInstancesCommand({})
      );
      const match: DBInstance | undefined = (resp.DBInstances || []).find(
        (db: DBInstance) => db.Endpoint?.Address === endpoint
      );

      expect(match).toBeDefined();
      expect(match?.Engine).toBe('mysql');
      expect(match?.StorageEncrypted).toBe(true);
      expect(match?.PubliclyAccessible).toBe(false);
    });
  });

  describe('Lambda', () => {
    test('Lambda function exists and is VPC-attached', async () => {
      const fnArn: string = outputs.LambdaArn as string;
      expect(fnArn).toMatch(/^arn:aws:lambda:/);

      const resp: GetFunctionCommandOutput = await lambda.send(
        new GetFunctionCommand({ FunctionName: fnArn })
      );
      expect(resp.Configuration?.FunctionArn).toBe(fnArn);
      const subnets: string[] = resp.Configuration?.VpcConfig?.SubnetIds || [];
      expect(subnets.length).toBeGreaterThan(0);
    });
  });
});
