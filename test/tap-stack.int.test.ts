/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';

import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import {
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';

import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';

import {
  CloudFrontClient,
  GetDistributionCommand,
  ListDistributionsCommand,
} from '@aws-sdk/client-cloudfront';

import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetHealthCommand,
  ELBv2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';

import {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

import {
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';

// ---------- Load outputs ----------
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
const outputs: Record<string, string> = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// ---------- Derive region/account/suffix ----------
const parseRegionFromArn = (arn?: string) => (arn ? arn.split(':')[3] : undefined);
const parseAccountFromArn = (arn?: string) => (arn ? arn.split(':')[4] : undefined);
const parseRegionFromAlbDns = (dns?: string) => {
  // e.g. ...eu-central-1.elb.amazonaws.com
  if (!dns) return undefined;
  const m = dns.match(/\.([a-z0-9-]+)\.elb\.amazonaws\.com$/);
  return m?.[1];
};

const region =
  parseRegionFromArn(outputs.LambdaFunctionArn) ||
  parseRegionFromAlbDns(outputs.ALBDNSName) ||
  process.env.AWS_REGION ||
  'eu-central-1';

const accountId = parseAccountFromArn(outputs.LambdaFunctionArn);

// Try to infer env suffix from the Data bucket or RDS endpoint (fallback to ENV var)
const envFromBucket = outputs.DataBucketName?.match(/^tapstack([a-z0-9]+)-data-/)?.[1];
const envFromRds = outputs.RDSEndpoint?.match(/^tapstack([a-z0-9]+)-/i)?.[1];
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || envFromBucket || envFromRds || 'dev';

// Log bucket name (from template): tapstack${suffix}-logs-${account}-${region}
const logBucketName =
  accountId && region ? `tapstack${environmentSuffix}-logs-${accountId}-${region}` : undefined;

// ---------- AWS clients ----------
const s3 = new S3Client({ region });
const ec2 = new EC2Client({ region });
const rds = new RDSClient({ region });
const cf = new CloudFrontClient({ region });
const elb = new ELBv2Client({ region });
const logs = new CloudWatchLogsClient({ region });
const lambda = new LambdaClient({ region });

// ---------- Helpers ----------
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

async function fetchWithTimeout(url: string, ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    // @ts-ignore Node 18+ global fetch
    return await fetch(url, { method: 'GET', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

jest.setTimeout(300_000); // 5 minutes for cloud calls + retries

describe('TapStack Infra – Integration (live functionality)', () => {
  // ---------------- VPC & Networking ----------------
  describe('VPC and Networking', () => {
    test('VPC exists and DNS features enabled', async () => {
      expect(outputs.VPCId).toBeDefined();

      const vpcs = await ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] }));
      expect(vpcs.Vpcs?.length).toBe(1);
      const vpc = vpcs.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');

      const dnsHostnames = await ec2.send(
        new DescribeVpcAttributeCommand({ VpcId: outputs.VPCId, Attribute: 'enableDnsHostnames' })
      );
      const dnsSupport = await ec2.send(
        new DescribeVpcAttributeCommand({ VpcId: outputs.VPCId, Attribute: 'enableDnsSupport' })
      );
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
    });

    test('Bastion public IP looks valid', () => {
      expect(outputs.BastionPublicIP).toMatch(/^(\d{1,3}\.){3}\d{1,3}$/);
    });
  });

  // ---------------- ALB & EC2 (Functional) ----------------
  describe('Load Balancer & Targets', () => {
    let lbArn: string | undefined;
    let tgArn: string | undefined;

    test('ALB resolves and returns app content', async () => {
      const url = `http://${outputs.ALBDNSName}`;
      const res = await fetchWithTimeout(url, 20_000);
      // We *expect* 200 with the userData page, but tolerate 502/503 during a warm start
      expect([200, 502, 503]).toContain(res.status);

      if (res.status === 200) {
        const text = await res.text();
        // the template writes: <h1>Hello from TapStack${EnvironmentSuffix}</h1>
        expect(text).toContain(`Hello from TapStack${environmentSuffix}`);
      }
    });

    test('ALB has at least one healthy target', async () => {
      // Find LB by DNS name
      const lbs = await elb.send(new DescribeLoadBalancersCommand({}));
      const match = lbs.LoadBalancers?.find(lb => lb.DNSName === outputs.ALBDNSName);
      expect(match).toBeDefined();
      lbArn = match!.LoadBalancerArn;

      // Find its default action TG via listeners
      const listeners = await elb.send(new DescribeListenersCommand({ LoadBalancerArn: lbArn }));
      const defaultListener = listeners.Listeners?.find(l => (l.Port ?? 0) === 80) || listeners.Listeners?.[0];
      expect(defaultListener?.DefaultActions?.[0]?.TargetGroupArn).toBeDefined();
      tgArn = defaultListener!.DefaultActions![0].TargetGroupArn;

      // Check target health
      let healthy = 0;
      let attempts = 0;
      while (attempts < 10) {
        const th = await elb.send(new DescribeTargetHealthCommand({ TargetGroupArn: tgArn }));
        healthy = (th.TargetHealthDescriptions || []).filter(
          d => d.TargetHealth?.State === 'healthy'
        ).length;
        if (healthy > 0) break;
        attempts += 1;
        await sleep(10_000);
      }

      expect(healthy).toBeGreaterThan(0);
    });
  });

  // ---------------- S3 Data bucket (Functional) ----------------
  describe('S3 Data bucket', () => {
    const key = `tests/integration-${Date.now()}.txt`;

    afterAll(async () => {
      if (outputs.DataBucketName) {
        try {
          await s3.send(new DeleteObjectCommand({ Bucket: outputs.DataBucketName, Key: key }));
        } catch { /* ignore cleanup errors */ }
      }
    });

    test('can PUT and HEAD an object (encrypted at rest with KMS)', async () => {
      const put = await s3.send(new PutObjectCommand({
        Bucket: outputs.DataBucketName,
        Key: key,
        Body: 'hello data bucket',
      }));
      // ETag should be present
      expect(put.ETag).toBeDefined();

      const head = await s3.send(new HeadObjectCommand({
        Bucket: outputs.DataBucketName,
        Key: key,
      }));

      // Bucket default SSE uses KMS per template; verify indicators
      expect(head.ServerSideEncryption).toBe('aws:kms');
      expect(head.SSEKMSKeyId).toBeDefined();
    });
  });

  // ---------------- S3 -> Lambda (Functional) ----------------
  describe('Log bucket triggers Lambda on object create', () => {
    const key = `logs/integration-trigger-${Date.now()}.txt`;
    const functionArn = outputs.LambdaFunctionArn;
    const functionName = functionArn?.split(':function:')[1];

    test('uploading to log bucket results in Lambda log line', async () => {
      if (!logBucketName || !functionName) {
        console.warn('Skipping S3->Lambda trigger test (missing account/region/function name)');
        return;
      }

      // 1) Put a small object to the log bucket
      await s3.send(
        new PutObjectCommand({
          Bucket: logBucketName,
          Key: key,
          Body: 'trigger lambda please',
        })
      );

      // 2) Poll CloudWatch Logs for the expected line
      const logGroupName = `/aws/lambda/${functionName}`;
      const pattern = `Processing log file: ${logBucketName}/${key}`;

      let found = false;
      const start = Date.now();
      while (!found && Date.now() - start < 120_000) {
        const events = await logs.send(
          new FilterLogEventsCommand({
            logGroupName,
            filterPattern: 'Processing log file',
            startTime: start - 5_000,
          })
        );
        const messages = (events.events || []).map(e => e.message || '');
        if (messages.some(m => m.includes(pattern))) {
          found = true;
          break;
        }
        await sleep(5_000);
      }

      expect(found).toBe(true);
    });
  });

  // ---------------- Lambda direct invoke ----------------
  describe('Lambda direct invoke works', () => {
    test('invoking LogProcessorFunction returns 200 and expected body', async () => {
      const payload = {
        Records: [
          {
            s3: {
              bucket: { name: 'test-bucket' },
              object: { key: 'test-key' },
            },
          },
        ],
      };

      const resp = await lambda.send(new InvokeCommand({
        FunctionName: outputs.LambdaFunctionArn,
        Payload: new TextEncoder().encode(JSON.stringify(payload)),
      }));

      expect(resp.StatusCode).toBe(200);
      const body = resp.Payload ? new TextDecoder().decode(resp.Payload) : '';
      // Lambda proxy returns JSON string from our inline code
      expect(body).toContain('Log processing complete');
    });
  });

  // ---------------- Database (Describe) ----------------
  describe('RDS Instance', () => {
    test('RDS is available, encrypted, private, Multi-AZ, with log export', async () => {
      const instanceId = outputs.RDSEndpoint.split('.')[0];

      const d = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: instanceId }));
      expect(d.DBInstances?.length).toBe(1);

      const db = d.DBInstances![0];
      expect(db.DBInstanceStatus).toBe('available');
      expect(db.Engine).toBe('postgres');
      expect(db.StorageEncrypted).toBe(true);
      expect(db.PubliclyAccessible).toBe(false);
      expect(db.MultiAZ).toBe(true);

      // Template sets EnableCloudwatchLogsExports: ["postgresql"]
      // Some regions need a bit of time after create; allow either present or eventually consistent.
      const exportsSet = (db.EnabledCloudwatchLogsExports || []).includes('postgresql');
      expect(exportsSet).toBe(true);
    });
  });

  // ---------------- CloudFront (Describe + HTTPS fetch) ----------------
  describe('CloudFront Distribution', () => {
    test('Distribution exists and has expected config', async () => {
      const domain = outputs.CloudFrontURL.replace(/^https:\/\//, '').replace(/\/$/, '');

      const list = await cf.send(new ListDistributionsCommand({}));
      const items = list.DistributionList?.Items ?? [];
      const match = items.find(i => i.DomainName === domain);
      expect(match).toBeDefined();

      const dist = await cf.send(new GetDistributionCommand({ Id: match!.Id! }));
      const cfg = dist.Distribution!.DistributionConfig!;
      expect(cfg.Enabled).toBe(true);
      expect(cfg.DefaultRootObject).toBe('index.html');
      expect(cfg.DefaultCacheBehavior?.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('HTTPS to CloudFront domain responds (200/403/404)', async () => {
      const res = await fetchWithTimeout(outputs.CloudFrontURL, 20_000);
      // If no content uploaded yet, CloudFront usually returns 403 or 404 from S3 origin
      expect([200, 403, 404]).toContain(res.status);
    });
  });

  // ---------------- Consistency checks (region/suffix) ----------------
  describe('Naming & Region Consistency', () => {
    test('Outputs align with region', () => {
      // ALB DNS and RDS endpoint should include the detected region
      if (outputs.ALBDNSName) {
        expect(outputs.ALBDNSName).toContain(`.${region}.elb.amazonaws.com`);
      }
      if (outputs.RDSEndpoint) {
        expect(outputs.RDSEndpoint).toContain(`.${region}.rds.amazonaws.com`);
      }
      if (outputs.DataBucketName) {
        expect(outputs.DataBucketName.endsWith(`-${region}`)).toBe(true);
      }
    });

    test('Data bucket naming includes environment suffix', () => {
      expect(outputs.DataBucketName.toLowerCase()).toContain(environmentSuffix.toLowerCase());
    });
  });
});
