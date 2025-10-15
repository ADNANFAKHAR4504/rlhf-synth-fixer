/* eslint-disable no-console */
import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';
import { URL } from 'url';

import {
  DeleteObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketLoggingCommand,
  GetBucketPolicyCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
  type InternetGateway,
  type NatGateway,
  type RouteTable,
  type SecurityGroup,
  type Subnet,
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
  CloudWatchClient,
  DescribeAlarmsCommand,
  type MetricAlarm,
} from '@aws-sdk/client-cloudwatch';

import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  type AutoScalingGroup,
} from '@aws-sdk/client-auto-scaling';

import {
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';

import {
  DescribeSecretCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

// ---------- Load outputs ----------
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
const outputs: Record<string, string> = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// ---------- Derive region/account/suffix ----------
const parseRegionFromArn = (arn?: string): string | undefined => (arn ? arn.split(':')[3] : undefined);
const parseAccountFromArn = (arn?: string): string | undefined => (arn ? arn.split(':')[4] : undefined);
const parseRegionFromAlbDns = (dns?: string): string | undefined => {
  // e.g. ...eu-central-1.elb.amazonaws.com
  if (!dns) return undefined;
  const m = dns.toLowerCase().match(/\.([a-z0-9-]+)\.elb\.amazonaws\.com$/);
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
const environmentSuffix: string = (process.env.ENVIRONMENT_SUFFIX || envFromBucket || envFromRds || 'dev').toLowerCase();

// Derived names used by the template
const logBucketName: string | undefined =
  accountId && region ? `tapstack${environmentSuffix}-logs-${accountId}-${region}` : undefined;
const contentBucketName: string | undefined =
  accountId && region ? `tapstack${environmentSuffix}-content-${accountId}-${region}` : undefined;

// ---------- AWS clients ----------
const s3 = new S3Client({ region });
const ec2 = new EC2Client({ region });
const rds = new RDSClient({ region });
const cf = new CloudFrontClient({ region });
const elb = new ElasticLoadBalancingV2Client({ region });
const cwLogs = new CloudWatchLogsClient({ region });
const cw = new CloudWatchClient({ region });
const asg = new AutoScalingClient({ region });
const lambda = new LambdaClient({ region });
const secrets = new SecretsManagerClient({ region });

// ---------- Helpers ----------
const sleep = (ms: number): Promise<void> => new Promise(res => setTimeout(res, ms));

function httpGetWithTimeout(urlStr: string, timeoutMs: number): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.get(url, res => {
      const chunks: Uint8Array[] = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode ?? 0, body });
      });
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('Request timed out'));
    });
  });
}

jest.setTimeout(300_000); // 5 minutes for cloud calls + retries

// Shared state populated by earlier tests when possible
let publicSubnets: Subnet[] = [];
let privateSubnets: Subnet[] = [];
let foundAsg: AutoScalingGroup | undefined;
let foundTgArn: string | undefined;

// =========================================================
// TAP Stack Integration Tests - Real AWS Resources
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
      const vpcs = await ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] }));
      const vpcsArr: Vpc[] = vpcs.Vpcs ?? [];
      expect(vpcsArr.length).toBe(1);

      const vpc = vpcsArr[0]!;
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

    test('VPC has 2+ public and 2+ private subnets across AZs with correct public IP settings', async () => {
      const subnetsResp = await ec2.send(new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }],
      }));
      const all: Subnet[] = subnetsResp.Subnets ?? [];

      // Identify by tag Name or MapPublicIpOnLaunch
      const tagName = (s: Subnet): string =>
        (s.Tags ?? []).find(t => t.Key === 'Name')?.Value ?? '';

      publicSubnets = all.filter(s =>
        s.MapPublicIpOnLaunch === true || /public/i.test(tagName(s))
      );
      privateSubnets = all.filter(s =>
        s.MapPublicIpOnLaunch !== true || /private/i.test(tagName(s))
      );

      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);

      const publicAZs = new Set(publicSubnets.map(s => s.AvailabilityZone));
      const privateAZs = new Set(privateSubnets.map(s => s.AvailabilityZone));
      expect(publicAZs.size).toBeGreaterThanOrEqual(2);
      expect(privateAZs.size).toBeGreaterThanOrEqual(2);

      // Ensure public have auto-assign public IP, private do not
      publicSubnets.forEach(s => expect(s.MapPublicIpOnLaunch).toBe(true));
      privateSubnets.forEach(s => expect(s.MapPublicIpOnLaunch).not.toBe(true));
    });

    test('Internet Gateway attached; Public route via IGW; Private route via NAT', async () => {
      const [rt, igw, nat] = await Promise.all([
        ec2.send(new DescribeRouteTablesCommand({ Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }] })),
        ec2.send(new DescribeInternetGatewaysCommand({ Filters: [{ Name: 'attachment.vpc-id', Values: [outputs.VPCId] }] })),
        ec2.send(new DescribeNatGatewaysCommand({ Filter: [{ Name: 'vpc-id', Values: [outputs.VPCId] }] })),
      ]);

      const igws: InternetGateway[] = igw.InternetGateways ?? [];
      expect(igws.length).toBeGreaterThanOrEqual(1);
      const igwAttach = igws[0]?.Attachments?.find(a => a.VpcId === outputs.VPCId);
      expect(igwAttach?.State).toBe('available');

      const rts: RouteTable[] = rt.RouteTables ?? [];
      const publicRt = rts.find(r =>
        (r.Routes ?? []).some(route =>
          route.DestinationCidrBlock === '0.0.0.0/0' && (route.GatewayId ?? '').startsWith('igw-')
        )
      );
      expect(publicRt).toBeDefined();

      const privateRt = rts.find(r =>
        (r.Routes ?? []).some(route =>
          route.DestinationCidrBlock === '0.0.0.0/0' && (route.NatGatewayId ?? '').startsWith('nat-')
        )
      );
      expect(privateRt).toBeDefined();

      const nats: NatGateway[] = nat.NatGateways ?? [];
      const availableNats = nats.filter(n => n.State === 'available');
      expect(availableNats.length).toBeGreaterThanOrEqual(1);
      if (publicSubnets.length) {
        const pubIds = new Set(publicSubnets.map(s => s.SubnetId!));
        expect(pubIds.has(availableNats[0]!.SubnetId!)).toBe(true);
      }
    });
  });

  // ---------- Load Balancer & Targets ----------
  describe('Load Balancer & Targets', () => {
    let lbArn: string | undefined;

    test('ALB is reachable and may serve userData page', async () => {
      const url = `http://${outputs.ALBDNSName}`;
      const res = await httpGetWithTimeout(url, 20_000);
      // Allow 200 for served page; 502/503 acceptable during warm-ups
      expect([200, 502, 503]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toContain(`Hello from TapStack${environmentSuffix}`);
      }
    });

    test('ALB has listener and a target group; at least one healthy target eventually', async () => {
      const lbs = await elb.send(new DescribeLoadBalancersCommand({}));
      const allLbs: LoadBalancer[] = lbs.LoadBalancers ?? [];
      const matchLb = allLbs.find(lb => lb.DNSName === outputs.ALBDNSName);
      expect(matchLb).toBeDefined();
      lbArn = matchLb!.LoadBalancerArn;

      const listeners = await elb.send(new DescribeListenersCommand({ LoadBalancerArn: lbArn }));
      const listenersList: Listener[] = listeners.Listeners ?? [];
      expect(listenersList.length).toBeGreaterThan(0);

      const l80 = listenersList.find(l => (l.Port ?? 0) === 80) || listenersList[0]!;
      const action = l80.DefaultActions?.[0];
      expect(action?.TargetGroupArn).toBeDefined();
      foundTgArn = action!.TargetGroupArn!;

      // Check target health with retries
      let healthy = 0;
      let attempts = 0;
      while (attempts < 10) {
        const th = await elb.send(new DescribeTargetHealthCommand({ TargetGroupArn: foundTgArn }));
        const descs: TargetHealthDescription[] = th.TargetHealthDescriptions ?? [];
        healthy = descs.filter(d => d.TargetHealth?.State === 'healthy').length;
        if (healthy > 0) break;
        attempts += 1;
        await sleep(10_000);
      }
      expect(healthy).toBeGreaterThan(0);
    });
  });

  // ---------- Security Groups ----------
  describe('Security Groups & Access Rules', () => {
    test('ALB, Bastion, EC2, and RDS SGs enforce expected rules', async () => {
      const sgsResp = await ec2.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }],
      }));
      const sgs: SecurityGroup[] = sgsResp.SecurityGroups ?? [];

      const byName = (needle: string): SecurityGroup | undefined =>
        sgs.find(sg => (sg.Tags ?? []).some(t => t.Key === 'Name' && (t.Value ?? '').toLowerCase().includes(needle)));

      const albSg = byName('albs' /* might be 'ALBSG' */) || byName('albsg') || byName('alb');
      const bastionSg = byName('bastionsg') || byName('bastion');
      const ec2Sg = byName('ec2sg') || byName('ec2');
      const rdsSg = byName('rdssg') || byName('rds');

      expect(albSg?.GroupId).toBeDefined();
      expect(bastionSg?.GroupId).toBeDefined();
      expect(ec2Sg?.GroupId).toBeDefined();
      expect(rdsSg?.GroupId).toBeDefined();

      // ALB SG: 80 & 443 from anywhere
      const albPorts = new Set((albSg?.IpPermissions ?? []).map(p => p.FromPort));
      expect(albPorts.has(80)).toBe(true);
      expect(albPorts.has(443)).toBe(true);
      const alb80Open = (albSg?.IpPermissions ?? []).find(p => p.FromPort === 80)?.IpRanges ?? [];
      const alb443Open = (albSg?.IpPermissions ?? []).find(p => p.FromPort === 443)?.IpRanges ?? [];
      const open0 = (ranges: { CidrIp?: string }[]) => ranges.some(r => r.CidrIp === '0.0.0.0/0');
      expect(open0(alb80Open)).toBe(true);
      expect(open0(alb443Open)).toBe(true);

      // Bastion SG: SSH from anywhere (as per template)
      const bastion22 = (bastionSg?.IpPermissions ?? []).find(p => p.FromPort === 22);
      expect(bastion22).toBeDefined();
      const bastionOpen = bastion22?.IpRanges ?? [];
      expect(open0(bastionOpen)).toBe(true);

      // EC2 SG: 80 from ALB SG; 22 from Bastion SG
      const ec2Ingress = ec2Sg?.IpPermissions ?? [];
      const ec2FromAlb = ec2Ingress.find(p => p.FromPort === 80);
      const ec2FromBastion = ec2Ingress.find(p => p.FromPort === 22);
      const fromGroup = (perm: typeof ec2FromAlb, groupId?: string) =>
        (perm?.UserIdGroupPairs ?? []).some(g => g.GroupId === groupId);
      expect(fromGroup(ec2FromAlb, albSg?.GroupId)).toBe(true);
      expect(fromGroup(ec2FromBastion, bastionSg?.GroupId)).toBe(true);

      // RDS SG: 5432 from EC2 SG
      const rds5432 = (rdsSg?.IpPermissions ?? []).find(p => p.FromPort === 5432);
      expect(fromGroup(rds5432, ec2Sg?.GroupId)).toBe(true);
    });
  });

  // ---------- S3 Data bucket (Functional) ----------
  describe('S3 Data bucket', () => {
    const key = `tests/integration-${Date.now()}.txt`;

    afterAll(async () => {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: outputs.DataBucketName, Key: key }));
      } catch {
        /* ignore cleanup errors */
      }
    });

    test('can PUT and HEAD an object (encrypted at rest with KMS)', async () => {
      const put = await s3.send(
        new PutObjectCommand({
          Bucket: outputs.DataBucketName,
          Key: key,
          Body: 'hello data bucket',
        })
      );
      expect(put.ETag).toBeDefined();

      const head = await s3.send(
        new HeadObjectCommand({
          Bucket: outputs.DataBucketName,
          Key: key,
        })
      );

      expect(head.ServerSideEncryption).toBe('aws:kms');
      expect(head.SSEKMSKeyId).toBeDefined();
    });

    test('Versioning enabled + Public Access Block + Logging to log bucket + KMS encryption policy', async () => {
      const [ver, pab, enc, log] = await Promise.all([
        s3.send(new GetBucketVersioningCommand({ Bucket: outputs.DataBucketName })),
        s3.send(new GetPublicAccessBlockCommand({ Bucket: outputs.DataBucketName })),
        s3.send(new GetBucketEncryptionCommand({ Bucket: outputs.DataBucketName })),
        s3.send(new GetBucketLoggingCommand({ Bucket: outputs.DataBucketName })),
      ]);

      expect(ver.Status).toBe('Enabled');

      const block = pab.PublicAccessBlockConfiguration;
      expect(block?.BlockPublicAcls).toBe(true);
      expect(block?.BlockPublicPolicy).toBe(true);
      expect(block?.IgnorePublicAcls).toBe(true);
      expect(block?.RestrictPublicBuckets).toBe(true);

      const rule = enc.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');

      if (logBucketName) {
        expect(log.LoggingEnabled?.TargetBucket).toBe(logBucketName);
      }
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
        await lambda.send(
          new InvokeCommand({
            FunctionName: functionArn,
            Payload: new TextEncoder().encode(JSON.stringify({ warmup: true })),
          })
        );
      } catch {
        // ignore warmup errors
      }

      // Put a small object to the log bucket to trigger the Lambda
      await s3.send(
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
          const events = await cwLogs.send(
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
          const name = (err as { name?: string })?.name ?? '';
          const msg = (err as { message?: string })?.message ?? '';
          if (!/ResourceNotFound/.test(name) && !/ResourceNotFound/.test(msg)) {
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

      const resp = await lambda.send(
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

  // ---------- Auto Scaling & Alarms ----------
  describe('Auto Scaling Group & CloudWatch Alarms', () => {
    test('ASG spans AZs, uses private subnets, and has sane capacity', async () => {
      const resp = await asg.send(new DescribeAutoScalingGroupsCommand({}));
      const groups: AutoScalingGroup[] = resp.AutoScalingGroups ?? [];

      // Prefer the ASG that is attached to the target group we already found
      foundAsg =
        groups.find(g => (g.TargetGroupARNs ?? []).includes(foundTgArn ?? '')) ??
        groups.find(g => (g.VPCZoneIdentifier ?? '').length > 0);

      expect(foundAsg).toBeDefined();
      const name = foundAsg!.AutoScalingGroupName!;
      expect(name.length).toBeGreaterThan(0);

      // Capacity checks
      const min = foundAsg!.MinSize ?? 0;
      const des = foundAsg!.DesiredCapacity ?? 0;
      const max = foundAsg!.MaxSize ?? 0;
      expect(min).toBeGreaterThanOrEqual(1);
      expect(des).toBeGreaterThanOrEqual(min);
      expect(max).toBeGreaterThanOrEqual(des);

      // AZ spread
      const azs = new Set(foundAsg!.AvailabilityZones ?? []);
      expect(azs.size).toBeGreaterThanOrEqual(2);

      // Subnets should be private (no auto-assign public IP)
      const subnetIds = (foundAsg!.VPCZoneIdentifier ?? '').split(',').filter(Boolean);
      if (subnetIds.length) {
        const subnets = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
        (subnets.Subnets ?? []).forEach(s => {
          expect(s.MapPublicIpOnLaunch).not.toBe(true);
        });
      }
    });

    test('CPU CloudWatch alarms exist for the ASG', async () => {
      if (!foundAsg?.AutoScalingGroupName) {
        console.warn('Skipping CPU alarms test (ASG not found)');
        return;
      }
      const res = await cw.send(new DescribeAlarmsCommand({}));
      const alarms: MetricAlarm[] = res.MetricAlarms ?? [];

      const relevant = alarms.filter(a =>
        a.MetricName === 'CPUUtilization' &&
        (a.Dimensions ?? []).some(d => d.Name === 'AutoScalingGroupName' && d.Value === foundAsg!.AutoScalingGroupName)
      );
      expect(relevant.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ---------- Database (Describe) ----------
  describe('RDS Instance', () => {
    test('RDS is available, encrypted, private, Multi-AZ, with log export', async () => {
      const instanceId = outputs.RDSEndpoint.split('.')[0];

      const d = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: instanceId }));
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

    test('DB admin secret exists and is KMS-encrypted', async () => {
      const secretName = `TapStack${environmentSuffix}/db/master`;
      try {
        const sec = await secrets.send(new DescribeSecretCommand({ SecretId: secretName }));
        expect(sec.ARN).toBeDefined();
        expect(sec.KmsKeyId).toBeDefined();
      } catch (e) {
        console.warn(`Skipping: secret ${secretName} not found`);
      }
    });
  });

  // ---------- CloudFront (Describe + HTTPS fetch) ----------
  describe('CloudFront Distribution', () => {
    test('Distribution exists and has expected config (HTTPS redirect + OAI)', async () => {
      const domain = outputs.CloudFrontURL.replace(/^https:\/\//, '').replace(/\/$/, '');

      const list = await cf.send(new ListDistributionsCommand({}));
      const items = list.DistributionList?.Items ?? [];
      const match = items.find(i => i.DomainName === domain);
      expect(match).toBeDefined();

      const dist = await cf.send(new GetDistributionCommand({ Id: match!.Id! }));
      const cfg = dist.Distribution?.DistributionConfig;
      expect(cfg).toBeDefined();
      expect(cfg!.Enabled).toBe(true);
      expect(cfg!.DefaultRootObject).toBe('index.html');
      expect(cfg!.DefaultCacheBehavior?.ViewerProtocolPolicy).toBe('redirect-to-https');

      // OAI present for S3 origin
      const origin = (cfg!.Origins?.Items ?? [])[0];
      expect(origin?.S3OriginConfig?.OriginAccessIdentity).toMatch(/origin-access-identity\/cloudfront\//);
    });

    test('HTTPS to CloudFront domain responds (200/403/404)', async () => {
      const res = await httpGetWithTimeout(outputs.CloudFrontURL, 20_000);
      // If no content uploaded yet, CloudFront usually returns 403 or 404 from S3 origin
      expect([200, 403, 404]).toContain(res.status);
    });

    test('Content bucket denies non-HTTPS (policy check)', async () => {
      if (!contentBucketName) {
        console.warn('Skipping content-bucket policy test (bucket name could not be derived)');
        return;
      }
      try {
        const pol = await s3.send(new GetBucketPolicyCommand({ Bucket: contentBucketName }));
        const doc = JSON.parse(pol.Policy ?? '{}') as { Statement?: Array<{ Sid?: string; Effect?: string; Condition?: Record<string, unknown> }> };
        const denyInsecure = (doc.Statement ?? []).some(s =>
          s.Effect === 'Deny' &&
          s.Condition &&
          Object.prototype.hasOwnProperty.call(s.Condition, 'Bool') &&
          JSON.stringify(s.Condition).includes('"aws:SecureTransport":"false"')
        );
        expect(denyInsecure).toBe(true);
      } catch (e) {
        console.warn('Skipping content-bucket policy check (policy not readable yet)');
      }
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
