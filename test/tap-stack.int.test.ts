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
  type Vpc,
} from '@aws-sdk/client-ec2';

import {
  DescribeDBInstancesCommand,
  RDSClient,
  type DBInstance,
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
  ElasticLoadBalancingV2Client,
  type Listener,
  type LoadBalancer,
  type TargetHealthDescription,
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
const parseRegionFromArn = (arn?: string): string | undefined => (arn ? arn.split(':')[3] : undefined);
const parseAccountFromArn = (arn?: string): string | undefined => (arn ? arn.split(':')[4] : undefined);
const parseRegionFromAlbDns = (dns?: string): string | undefined => {
  // e.g. ...eu-central-1.elb.amazonaws.com
  if (!dns) return undefined;
  const m = dns.match(/\.([a-z0-9-]+)\.elb\.amazonaws\.com$/i);
  return m?.[1];
};

const region: string =
  parseRegionFromArn(outputs.LambdaFunctionArn) ||
  parseRegionFromAlbDns(outputs.ALBDNSName) ||
  process.env.AWS_REGION ||
  'eu-central-1';

const accountId: string | undefined = parseAccountFromArn(outputs.LambdaFunctionArn);

// Try to infer env suffix from the Data bucket or RDS endpoint (fallback to ENV var)
const envFromBucket = outputs.DataBucketName?.match(/^tapstack([a-z0-9]+)-data-/i)?.[1];
const envFromRds = outputs.RDSEndpoint?.match(/^tapstack([a-z0-9]+)-/i)?.[1];
const environmentSuffix: string = process.env.ENVIRONMENT_SUFFIX || envFromBucket || envFromRds || 'dev';

// Log bucket name (from template): tapstack${suffix}-logs-${account}-${region}
const logBucketName: string | undefined =
  accountId && region ? `tapstack${environmentSuffix}-logs-${accountId}-${region}` : undefined;

// ---------- AWS clients (match archived naming style) ----------
const s3Client = new S3Client({ region });
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const cfClient = new CloudFrontClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const cwLogsClient = new CloudWatchLogsClient({ region });
const lambdaClient = new LambdaClient({ region });

// ---------- Helpers ----------
const sleep = (ms: number): Promise<void> => new Promise(res => setTimeout(res, ms));

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

// =========================================================
// TAP Stack Integration Tests - Real AWS Resources
// (structure & style aligned with archived code)
// =========================================================
describe('TAP Stack Integration Tests - Real AWS Resources', () => {
  // ---------- CloudFormation Outputs Validation ----------
  describe('CloudFormation Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs.ALBDNSName).toBeDefined();
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.CloudFrontURL).toBeDefined();
      expect(outputs.DataBucketName).toBeDefined();
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.LambdaFunctionArn).toBeDefined();
      expect(outputs.BastionPublicIP).toBeDefined();
    });

    test('outputs should have valid formats', () => {
      // ALB DNS format (tolerate mixed-case from stack-generated prefix)
      expect(outputs.ALBDNSName.toLowerCase())
        .toMatch(/^[a-z0-9-]+\.[a-z0-9-]+\.elb\.amazonaws\.com$/);

      // S3 bucket name (allows dots and hyphens)
      expect(outputs.DataBucketName).toMatch(/^[a-z0-9.-]+$/);

      // RDS endpoint (can have multiple subdomains)
      expect(outputs.RDSEndpoint)
        .toMatch(/^[a-z0-9-]+\.[a-z0-9-]+\.[a-z0-9-]+\.rds\.amazonaws\.com$/);

      // Bastion IP
      expect(outputs.BastionPublicIP).toMatch(/^(\d{1,3}\.){3}\d{1,3}$/);
    });
  });

  // ---------- VPC and Network Configuration ----------
  describe('VPC and Network Configuration', () => {
    test('VPC should exist and have DNS enabled', async () => {
      const vpcs = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] }));
      const vpcsArr: Vpc[] = vpcs.Vpcs ?? [];
      expect(vpcsArr.length).toBe(1);

      const vpc = vpcsArr[0]!;
      expect(vpc.State).toBe('available');

      const dnsHostnames = await ec2Client.send(
        new DescribeVpcAttributeCommand({ VpcId: outputs.VPCId, Attribute: 'enableDnsHostnames' })
      );
      const dnsSupport = await ec2Client.send(
        new DescribeVpcAttributeCommand({ VpcId: outputs.VPCId, Attribute: 'enableDnsSupport' })
      );
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
    });
  });

  // ---------- Load Balancer Configuration ----------
  describe('Load Balancer & Targets', () => {
    let lbArn: string | undefined;
    let tgArn: string | undefined;

    test('ALB is reachable and may serve userData page', async () => {
      const url = `http://${outputs.ALBDNSName}`;
      const res = await fetchWithTimeout(url, 20_000);
      // Allow 200 for served page; 502/503 acceptable during warm-ups
      expect([200, 502, 503]).toContain(res.status);
      if (res.status === 200) {
        const text = await res.text();
        expect(text).toContain(`Hello from TapStack${environmentSuffix}`);
      }
    });

    test('ALB has listener and a target group; at least one healthy target eventually', async () => {
      const lbs = await elbClient.send(new DescribeLoadBalancersCommand({}));
      const allLbs: LoadBalancer[] = lbs.LoadBalancers ?? [];
      const matchLb = allLbs.find(lb => lb.DNSName === outputs.ALBDNSName);
      expect(matchLb).toBeDefined();
      lbArn = matchLb!.LoadBalancerArn;

      const listeners = await elbClient.send(new DescribeListenersCommand({ LoadBalancerArn: lbArn }));
      const listenersList: Listener[] = listeners.Listeners ?? [];
      expect(listenersList.length).toBeGreaterThan(0);

      const l80 = listenersList.find(l => (l.Port ?? 0) === 80) || listenersList[0]!;
      const action = l80.DefaultActions?.[0];
      expect(action?.TargetGroupArn).toBeDefined();
      tgArn = action!.TargetGroupArn!;

      // Check target health with retries
      let healthy = 0;
      let attempts = 0;
      while (attempts < 10) {
        const th = await elbClient.send(new DescribeTargetHealthCommand({ TargetGroupArn: tgArn }));
        const descs: TargetHealthDescription[] = th.TargetHealthDescriptions ?? [];
        healthy = descs.filter(d => d.TargetHealth?.State === 'healthy').length;
        if (healthy > 0) break;
        attempts += 1;
        await sleep(10_000);
      }
      expect(healthy).toBeGreaterThan(0);
    });
  });

  // ---------- S3 Data bucket (Functional) ----------
  describe('S3 Data bucket', () => {
    const key = `tests/integration-${Date.now()}.txt`;

    afterAll(async () => {
      try {
        await s3Client.send(new DeleteObjectCommand({ Bucket: outputs.DataBucketName, Key: key }));
      } catch {
        /* ignore cleanup errors */
      }
    });

    test('can PUT and HEAD an object (encrypted at rest with KMS)', async () => {
      const put = await s3Client.send(
        new PutObjectCommand({
          Bucket: outputs.DataBucketName,
          Key: key,
          Body: 'hello data bucket',
        })
      );
      expect(put.ETag).toBeDefined();

      const head = await s3Client.send(
        new HeadObjectCommand({
          Bucket: outputs.DataBucketName,
          Key: key,
        })
      );

      expect(head.ServerSideEncryption).toBe('aws:kms');
      expect(head.SSEKMSKeyId).toBeDefined();
    });
  });

  // ---------- S3 -> Lambda (Functional) ----------
  describe('Log bucket triggers Lambda on object create', () => {
    const key = `logs/integration-trigger-${Date.now()}.txt`;
    const functionArn = outputs.LambdaFunctionArn;
    const functionName = functionArn?.split(':function:')[1];

    test('uploading to log bucket results in Lambda log line', async () => {
      if (!logBucketName || !functionName) {
        console.warn('Skipping S3->Lambda trigger test (missing account/region/function name)');
        return;
      }

      const logGroupName = `/aws/lambda/${functionName}`;
      const pattern = `Processing log file: ${logBucketName}/${key}`;

      // Warm up the Lambda to ensure the log group exists
      try {
        await lambdaClient.send(
          new InvokeCommand({
            FunctionName: functionArn,
            Payload: new TextEncoder().encode(JSON.stringify({ warmup: true })),
          })
        );
      } catch {
        // ignore warmup errors
      }

      // Put a small object to the log bucket to trigger the Lambda
      await s3Client.send(
        new PutObjectCommand({
          Bucket: logBucketName,
          Key: key,
          Body: 'trigger lambda please',
        })
      );

      // Poll CloudWatch Logs for the expected line; tolerate log group creation lag
      let found = false;
      const start = Date.now();
      while (!found && Date.now() - start < 120_000) {
        try {
          const events = await cwLogsClient.send(
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
        } catch (err: unknown) {
          // If the log group isn't created yet, wait and retry
          const msg = (err as Error)?.name || (err as Error)?.message || '';
          if (!/ResourceNotFoundException/.test(msg)) {
            // other errors should break the loop
            throw err;
          }
        }
        await sleep(5_000);
      }

      expect(found).toBe(true);
    });
  });

  // ---------- Lambda direct invoke ----------
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

      const resp = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: outputs.LambdaFunctionArn,
          Payload: new TextEncoder().encode(JSON.stringify(payload)),
        })
      );

      expect(resp.StatusCode).toBe(200);
      const body = resp.Payload ? new TextDecoder().decode(resp.Payload) : '';
      expect(body).toContain('Log processing complete');
    });
  });

  // ---------- Database (Describe) ----------
  describe('RDS Instance', () => {
    test('RDS is available, encrypted, private, Multi-AZ, with log export', async () => {
      const instanceId = outputs.RDSEndpoint.split('.')[0];

      const d = await rdsClient.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: instanceId }));
      const inst: DBInstance | undefined = (d.DBInstances ?? [])[0];
      expect(inst).toBeDefined();

      const db = inst!;
      expect(db.DBInstanceStatus).toBe('available');
      expect(db.Engine).toBe('postgres');
      expect(db.StorageEncrypted).toBe(true);
      expect(db.PubliclyAccessible).toBe(false);
      expect(db.MultiAZ).toBe(true);

      // Template sets EnableCloudwatchLogsExports: ["postgresql"]
      const exportsSet = (db.EnabledCloudwatchLogsExports || []).includes('postgresql');
      expect(exportsSet).toBe(true);
    });
  });

  // ---------- CloudFront (Describe + HTTPS fetch) ----------
  describe('CloudFront Distribution', () => {
    test('Distribution exists and has expected config', async () => {
      const domain = outputs.CloudFrontURL.replace(/^https:\/\//, '').replace(/\/$/, '');

      const list = await cfClient.send(new ListDistributionsCommand({}));
      const items = list.DistributionList?.Items ?? [];
      const match = items.find(i => i.DomainName === domain);
      expect(match).toBeDefined();

      const dist = await cfClient.send(new GetDistributionCommand({ Id: match!.Id! }));
      const distObj = dist.Distribution;
      expect(distObj).toBeDefined();

      const cfg = distObj!.DistributionConfig;
      expect(cfg).toBeDefined();
      expect(cfg!.Enabled).toBe(true);
      expect(cfg!.DefaultRootObject).toBe('index.html');
      expect(cfg!.DefaultCacheBehavior?.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('HTTPS to CloudFront domain responds (200/403/404)', async () => {
      const res = await fetchWithTimeout(outputs.CloudFrontURL, 20_000);
      // If no content uploaded yet, CloudFront usually returns 403 or 404 from S3 origin
      expect([200, 403, 404]).toContain(res.status);
    });
  });

  // ---------- Consistency checks (region/suffix) ----------
  describe('Naming & Region Consistency', () => {
    test('Outputs align with region', () => {
      // ALB DNS and RDS endpoint should include the detected region
      if (outputs.ALBDNSName) {
        expect(outputs.ALBDNSName.toLowerCase()).toContain(`.${region}.elb.amazonaws.com`);
      }
      if (outputs.RDSEndpoint) {
        expect(outputs.RDSEndpoint.toLowerCase()).toContain(`.${region}.rds.amazonaws.com`);
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
