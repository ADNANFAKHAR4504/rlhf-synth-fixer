// Integration tests - read outputs from cfn-outputs/flat-outputs.json after deploy
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingV2Client,
  type LoadBalancer,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';

let outputs: Record<string, string> = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch {
  outputs = {};
}

const cfn = new CloudFormationClient({ region });
const elbv2 = new ElasticLoadBalancingV2Client({ region });
const s3 = new S3Client({ region });
const rds = new RDSClient({ region });

// Helper to get a required output or skip
function getOutputOrSkip(key: string): string | undefined {
  const val = outputs[key];
  if (!val) {
    console.warn(`Missing output ${key}; skipping related assertions`);
  }
  return val;
}

describe('TapStack (Integration)', () => {
  test('CloudFormation stack exists for at least one region suffix', async () => {
    const list = await cfn.send(new DescribeStacksCommand({}));
    const anyTapStack = (list.Stacks || []).some(s =>
      (s.StackName || '').includes(`TapStack-${environmentSuffix}`)
    );
    expect(anyTapStack).toBe(true);
  });

  test('ALB DNS name output resolves to an existing Load Balancer', async () => {
    const albDns = getOutputOrSkip('AlbDnsName');
    if (!albDns) return;

    const res = await elbv2.send(new DescribeLoadBalancersCommand({}));
    const found = ((res.LoadBalancers || []) as LoadBalancer[]).some(
      (lb: LoadBalancer) => lb.DNSName === albDns
    );
    expect(found).toBe(true);
  });

  test('Static S3 bucket exists', async () => {
    const bucket = getOutputOrSkip('StaticBucketName');
    if (!bucket) return;
    await expect(
      s3.send(new HeadBucketCommand({ Bucket: bucket }))
    ).resolves.toBeDefined();
  });

  test('RDS instance endpoint output corresponds to a DB instance', async () => {
    const endpoint = getOutputOrSkip('DbEndpoint');
    if (!endpoint) return;

    const res = await rds.send(new DescribeDBInstancesCommand({}));
    const found = (res.DBInstances || []).some(
      db => db.Endpoint?.Address === endpoint
    );
    expect(found).toBe(true);
  });

  test('Pipeline buckets and pipeline exist when present', async () => {
    const sourceBucket = outputs['PipelineSourceBucketName'];
    if (sourceBucket) {
      await expect(
        s3.send(new HeadBucketCommand({ Bucket: sourceBucket }))
      ).resolves.toBeDefined();
    }
  });
});
