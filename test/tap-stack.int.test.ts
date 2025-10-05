import { DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingV2Client,
  LoadBalancer,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketLoggingCommand,
  GetBucketReplicationCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

const allOutputsPath = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');

function loadOutputs(): Record<string, string> {
  if (!fs.existsSync(allOutputsPath)) {
    throw new Error(`Expected outputs file not found: ${allOutputsPath}`);
  }
  const raw = fs.readFileSync(allOutputsPath, 'utf8').trim();
  if (!raw) throw new Error('Outputs file is empty');
  const parsed = JSON.parse(raw);
  if (parsed && typeof parsed === 'object') {
    const firstValue = Object.values(parsed)[0];
    if (Array.isArray(firstValue)) {
      const arr = firstValue as any[];
      const map: Record<string, string> = {};
      arr.forEach(({ OutputKey, OutputValue }: any) => {
        if (OutputKey) map[OutputKey] = OutputValue;
      });
      return map;
    }
    return parsed as Record<string, string>;
  }
  throw new Error('Unexpected outputs file format');
}

function findOutputValue(
  outputs: Record<string, string>,
  prefixes: string[]
): string | undefined {
  for (const [key, value] of Object.entries(outputs)) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      return value;
    }
  }
  return undefined;
}

function inferRegionFromAlbDns(dns?: string): string | undefined {
  if (!dns) return undefined;
  const match = dns.match(/\.([a-z0-9-]+)\.elb\.amazonaws\.com$/i);
  return match?.[1];
}

async function findLoadBalancerByDns(
  client: ElasticLoadBalancingV2Client,
  dnsName: string
): Promise<LoadBalancer> {
  let marker: string | undefined;
  do {
    const res = await client.send(
      new DescribeLoadBalancersCommand(
        marker
          ? { Marker: marker }
          : {}
      )
    );
    const lb = (res.LoadBalancers ?? []).find(
      (candidate) => candidate.DNSName === dnsName
    );
    if (lb) {
      return lb;
    }
    marker = res.NextMarker;
  } while (marker);
  throw new Error(`Load balancer with DNS '${dnsName}' not found in account`);
}

describe('TapStack integration (live AWS verification)', () => {
  let outputs: Record<string, string>;
  let region: string;
  let vpcId: string | undefined;
  let rdsIdentifier: string | undefined;
  let bucketName: string | undefined;
  let loadBalancerDns: string | undefined;

  let ec2: EC2Client;
  let rds: RDSClient;
  let s3: S3Client;
  let elbv2: ElasticLoadBalancingV2Client;

  beforeAll(() => {
    jest.setTimeout(180_000);
    outputs = loadOutputs();
    vpcId = findOutputValue(outputs, ['VPCID']);
    rdsIdentifier = findOutputValue(outputs, ['RDSIdentifier']);
    bucketName = findOutputValue(outputs, [
      'MainBucketName',
      'AppBucketName',
      'BucketName',
    ]);
    loadBalancerDns = findOutputValue(outputs, ['LoadBalancerDNS']);

    const envRegion =
      process.env.AWS_REGION ||
      process.env.AWS_DEFAULT_REGION ||
      process.env.CDK_DEFAULT_REGION ||
      '';
    region = envRegion || inferRegionFromAlbDns(loadBalancerDns) || '';
    if (!region) {
      throw new Error(
        'AWS region not supplied. Provide AWS_REGION (or similar) or ensure LoadBalancerDNS output contains region hint.'
      );
    }

    ec2 = new EC2Client({ region });
    rds = new RDSClient({ region });
    s3 = new S3Client({ region });
    elbv2 = new ElasticLoadBalancingV2Client({ region });
  });

  test('deployment outputs expose core resource identifiers', () => {
    expect(vpcId).toBeTruthy();
    expect(rdsIdentifier).toBeTruthy();
    expect(bucketName).toBeTruthy();
    expect(loadBalancerDns).toBeTruthy();
  });

  test('VPC is provisioned in AWS and not default', async () => {
    expect(vpcId).toBeTruthy();
    const res = await ec2.send(
      new DescribeVpcsCommand({ VpcIds: [vpcId as string] })
    );
    const vpc = res.Vpcs?.[0];
    expect(vpc).toBeDefined();
    expect(vpc?.IsDefault).toBe(false);
    expect(vpc?.VpcId).toBe(vpcId);
  });

  test('database instance is private and within the VPC', async () => {
    expect(rdsIdentifier).toBeTruthy();
    const res = await rds.send(
      new DescribeDBInstancesCommand({
        DBInstanceIdentifier: rdsIdentifier as string,
      })
    );
    const instance = res.DBInstances?.[0];
    expect(instance).toBeDefined();
    expect(instance?.DBSubnetGroup?.VpcId).toBe(vpcId);
    expect(instance?.PubliclyAccessible).toBe(false);
    expect(instance?.MultiAZ).toBe(true);
  });

  test('application load balancer is online and attached to the VPC', async () => {
    expect(loadBalancerDns).toBeTruthy();
    const lb = await findLoadBalancerByDns(
      elbv2,
      loadBalancerDns as string
    );
    expect(lb?.Type).toBe('application');
    expect(lb?.Scheme).toBe('internet-facing');
    expect(lb?.VpcId).toBe(vpcId);
  });

  test('main bucket is versioned, logged, and replicating', async () => {
    expect(bucketName).toBeTruthy();
    const bucket = bucketName as string;

    await s3.send(new HeadBucketCommand({ Bucket: bucket }));

    const versioning = await s3.send(
      new GetBucketVersioningCommand({ Bucket: bucket })
    );
    expect(versioning.Status).toBe('Enabled');

    const replication = await s3.send(
      new GetBucketReplicationCommand({ Bucket: bucket })
    );
    const enabledRule = replication.ReplicationConfiguration?.Rules?.find(
      (rule) => rule.Status === 'Enabled'
    );
    expect(enabledRule).toBeDefined();
    expect(enabledRule?.Destination?.Bucket).toBeTruthy();

    const logging = await s3.send(
      new GetBucketLoggingCommand({ Bucket: bucket })
    );
    expect(logging.LoggingEnabled?.TargetBucket).toBeTruthy();
    expect(logging.LoggingEnabled?.TargetPrefix).toBeTruthy();
  });
});
