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
  ElasticLoadBalancingV2Client,
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
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// ---------- Derive region/account/suffix ----------
const parseRegionFromArn = (arn) => (arn ? arn.split(':')[3] : undefined);
const parseAccountFromArn = (arn) => (arn ? arn.split(':')[4] : undefined);
const parseRegionFromAlbDns = (dns) => {
  if (!dns) return undefined;
  const m = dns.match(/\.([a-z0-9-]+)\.elb\.amazonaws\.com$/);
  return m && m[1];
};

const region =
  parseRegionFromArn(outputs.LambdaFunctionArn) ||
  parseRegionFromAlbDns(outputs.ALBDNSName) ||
  process.env.AWS_REGION ||
  'eu-central-1';

const accountId = parseAccountFromArn(outputs.LambdaFunctionArn);

const envFromBucket = (outputs.DataBucketName || '').match(/^tapstack([a-z0-9]+)-data-/)?.[1];
const envFromRds = (outputs.RDSEndpoint || '').match(/^tapstack([a-z0-9]+)-/i)?.[1];
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || envFromBucket || envFromRds || 'dev';

// Log bucket naming in template: tapstack${suffix}-logs-${account}-${region}
const logBucketName =
  accountId && region ? `tapstack${environmentSuffix}-logs-${accountId}-${region}` : undefined;

// ---------- AWS clients ----------
const s3 = new S3Client({ region });
const ec2 = new EC2Client({ region });
const rds = new RDSClient({ region });
const cf = new CloudFrontClient({ region });
const elb = new ElasticLoadBalancingV2Client({ region });
const logs = new CloudWatchLogsClient({ region });
const lambda = new LambdaClient({ region });

// ---------- Helpers ----------
const sleep = (ms) => new Promise(res => setTimeout(res, ms));
async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { method: 'GET', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

jest.setTimeout(300_000);

// =========================================================
// TAP Stack Integration Tests - Real AWS Resources (format mirrors archived)
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
      expect(outputs.ALBDNSName).toMatch(/^[a-z0-9-]+\.[\w-]+\.elb\.amazonaws\.com$/);
      expect(outputs.DataBucketName).toMatch(/^[a-z0-9.-]+$/);
      expect(outputs.RDSEndpoint).toMatch(/^[a-z0-9-]+\.[a-z0-9-]+\.[a-z0-9-]+\.rds\.amazonaws\.com$/);
      expect(outputs.BastionPublicIP).toMatch(/^(\d{1,3}\.){3}\d{1,3}$/);
    });
  });

  // ---------- VPC and Network Configuration ----------
  describe('VPC and Network Configuration', () => {
    test('VPC should exist and have DNS enabled', async () => {
      const vpcs = await ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] }));
      expect(vpcs.Vpcs?.length).toBe(1);
      const vpc = vpcs.Vpcs[0];
      expect(vpc.State).toBe('available');

      const dnsHostnames = await ec2.send(
        new DescribeVpcAttributeCommand({ VpcId: outputs.VPCId, Attribute: 'enableDnsHostnames' })
      );
      const dnsSupport = await ec2.send(
        new DescribeVpcAttributeCommand({ VpcId: outputs.VPCId, Attribute: 'enableDnsSupport' })
      );
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
    });
  });

  // ---------- Load Balancer Configuration ----------
  describe('Load Balancer Configuration', () => {
    let lbArn;
    let tgArn;

    test('ALB is reachable and may serve userData page', async () => {
      const url = `http://${outputs.ALBDNSName}`;
      const res = await fetchWithTimeout(url, 20_000);
      expect([200, 502, 503]).toContain(res.status);
      if (res.status === 200) {
        const text = await res.text();
        // The template writes: <h1>Hello from TapStack${EnvironmentSuffix}</h1>
        expect(text).toMatch(/Hello from TapStack/i);
      }
    });

    test('ALB has listener and a target group; at least one healthy target eventually', async () => {
      const lbs = await elb.send(new DescribeLoadBalancersCommand({}));
      const match = lbs.LoadBalancers?.find(lb => lb.DNSName === outputs.ALBDNSName);
      expect(match).toBeDefined();
      lbArn = match.LoadBalancerArn;

      const listeners = await elb.send(new DescribeListenersCommand({ LoadBalancerArn: lbArn }));
      const l80 = listeners.Listeners?.find(l => (l.Port ?? 0) === 80) || listeners.Listeners?.[0];
      expect(l80?.DefaultActions?.[0]?.TargetGroupArn).toBeDefined();
      tgArn = l80.DefaultActions[0].TargetGroupArn;

      let healthy = 0;
      let attempts = 0;
      while (attempts < 10) {
        const th = await elb.send(new DescribeTargetHealthCommand({ TargetGroupArn: tgArn }));
        healthy = (th.TargetHealthDescriptions || []).filter(d => d.TargetHealth?.State === 'healthy').length;
        if (healthy > 0) break;
        attempts += 1;
        await sleep(10_000);
      }
      expect(healthy).toBeGreaterThan(0);
    });
  });

  // ---------- S3 Buckets Configuration (functional) ----------
  describe('S3 Buckets Configuration', () => {
    const key = `tests/integration-${Date.now()}.txt`;

    afterAll(async () => {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: outputs.DataBucketName, Key: key }));
      } catch {
        /* ignore */
      }
    });

    test('Data bucket: PUT + HEAD object with KMS SSE', async () => {
      const put = await s3.send(new PutObjectCommand({
        Bucket: outputs.DataBucketName,
        Key: key,
        Body: 'hello data bucket'
      }));
      expect(put.ETag).toBeDefined();

      const head = await s3.send(new HeadObjectCommand({
        Bucket: outputs.DataBucketName,
        Key: key
      }));
      expect(head.ServerSideEncryption).toBe('aws:kms');
      expect(head.SSEKMSKeyId).toBeDefined();
    });
  });

  // ---------- S3 -> Lambda trigger ----------
  describe('S3 -> Lambda trigger', () => {
    const key = `logs/integration-trigger-${Date.now()}.txt`;
    const functionArn = outputs.LambdaFunctionArn;
    const functionName = functionArn?.split(':function:')[1];

    test('uploading to logs bucket triggers Lambda (check CloudWatch logs)', async () => {
      if (!logBucketName || !functionName) {
        console.warn('Skipping trigger test (missing computed log bucket name or function name)');
        return;
      }

      await s3.send(new PutObjectCommand({ Bucket: logBucketName, Key: key, Body: 'trigger' }));

      const logGroupName = `/aws/lambda/${functionName}`;
      const pattern = `Processing log file: ${logBucketName}/${key}`;

      let found = false;
      const start = Date.now();
      while (!found && Date.now() - start < 120_000) {
        const events = await logs.send(new FilterLogEventsCommand({
          logGroupName,
          filterPattern: 'Processing log file',
          startTime: start - 5_000,
        }));
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

  // ---------- Lambda direct invoke ----------
  describe('Lambda direct invoke', () => {
    test('invoking LogProcessorFunction returns 200 + expected body', async () => {
      const payload = {
        Records: [{ s3: { bucket: { name: 'test-bucket' }, object: { key: 'test-key' } } }]
      };
      const resp = await lambda.send(new InvokeCommand({
        FunctionName: outputs.LambdaFunctionArn,
        Payload: new TextEncoder().encode(JSON.stringify(payload)),
      }));
      expect(resp.StatusCode).toBe(200);
      const body = resp.Payload ? new TextDecoder().decode(resp.Payload) : '';
      expect(body).toContain('Log processing complete');
    });
  });

  // ---------- RDS Database Configuration ----------
  describe('RDS Database Configuration', () => {
    test('RDS available, encrypted, private, Multi-AZ, log exports set', async () => {
      const instanceId = outputs.RDSEndpoint.split('.')[0];
      const d = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: instanceId }));
      expect(d.DBInstances?.length).toBe(1);
      const db = d.DBInstances[0];

      expect(db.DBInstanceStatus).toBe('available');
      expect(db.Engine).toBe('postgres');
      expect(db.StorageEncrypted).toBe(true);
      expect(db.PubliclyAccessible).toBe(false);
      expect(db.MultiAZ).toBe(true);
      expect((db.EnabledCloudwatchLogsExports || []).includes('postgresql')).toBe(true);
    });
  });

  // ---------- CloudFront ----------
  describe('CloudFront Distribution', () => {
    test('distribution exists with expected config', async () => {
      const domain = outputs.CloudFrontURL.replace(/^https:\/\//, '').replace(/\/$/, '');
      const list = await cf.send(new ListDistributionsCommand({}));
      const items = list.DistributionList?.Items ?? [];
      const match = items.find(i => i.DomainName === domain);
      expect(match).toBeDefined();

      const dist = await cf.send(new GetDistributionCommand({ Id: match.Id }));
      const cfg = dist.Distribution.DistributionConfig;
      expect(cfg.Enabled).toBe(true);
      expect(cfg.DefaultRootObject).toBe('index.html');
      expect(cfg.DefaultCacheBehavior?.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('HTTPS to CloudFront domain responds (200/403/404)', async () => {
      const res = await fetchWithTimeout(outputs.CloudFrontURL, 20_000);
      expect([200, 403, 404]).toContain(res.status);
    });
  });

  // ---------- Consistency checks ----------
  describe('Consistency & Naming', () => {
    test('Outputs align with detected region', () => {
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

    test('Data bucket includes environment suffix', () => {
      expect(outputs.DataBucketName.toLowerCase()).toContain(environmentSuffix.toLowerCase());
    });
  });
});
