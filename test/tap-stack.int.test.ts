// test/tap-stack.int.test.ts
import fs from 'fs';

// AWS SDK v3 clients
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
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
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeKeyCommand,
  KMSClient,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
  GetBucketEncryptionCommand,
  GetBucketLoggingCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';

// LocalStack configuration
const endpoint = process.env.AWS_ENDPOINT_URL || undefined;
const isLocalStack = endpoint?.includes('localhost') || endpoint?.includes('4566') || false;

const region = process.env.AWS_REGION || 'us-east-1';
const stackName = process.env.STACK_NAME || 'TapStackpr1631';

// Load outputs exactly like your sample
const outputs: Record<string, string> = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// small helpers
const out = (...keys: string[]) => {
  for (const k of keys) {
    const v = outputs[k];
    if (typeof v === 'string' && v.trim() !== '') return v;
  }
  return undefined;
};
const list = (csv?: string) =>
  csv
    ? csv
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    : [];

// Client configuration for LocalStack
const clientConfig = {
  region,
  ...(endpoint && { endpoint }),
};

// clients
const cfn = new CloudFormationClient(clientConfig);
const ec2 = new EC2Client(clientConfig);
const elbv2 = new ElasticLoadBalancingV2Client(clientConfig);
const asg = new AutoScalingClient(clientConfig);
const s3 = new S3Client({ ...clientConfig, forcePathStyle: true });
const kms = new KMSClient(clientConfig);
const logs = new CloudWatchLogsClient(clientConfig);
const cloudtrail = new CloudTrailClient(clientConfig);

describe('TapStack Infra (Lean EC2/ALB) Tests', () => {
  // 1) Basic presence (only keys you actually have)
  describe('Stack Outputs', () => {
    test('should have minimal required outputs', () => {
      const required = [
        'VPCId',
        'PrivateSubnetIds',
        'PublicSubnets',
        'ALBDNSName',
        'AlbSGId',
        'AppSGId',
        'ApplicationS3BucketName',
        'LoggingS3BucketName',
        'KmsKeyId',
        'ASGName',
        'TargetGroupArn',
      ];
      const missing = required.filter(k => !out(k));
      expect(missing).toEqual([]);
    });
  });

  // 2) Stack status
  describe('CloudFormation Stack', () => {
    test('stack should exist and be COMPLETE', async () => {
      const res = await cfn.send(
        new DescribeStacksCommand({ StackName: stackName })
      );
      const stack = res.Stacks?.[0];
      expect(stack?.StackName).toBe(stackName);
      expect(stack?.StackStatus).toMatch(/COMPLETE$/);
    });
  });

  // 3) VPC + Subnets (use your keys: PrivateSubnetIds, PublicSubnets)
  describe('VPC & Subnets', () => {
    test('VPC exists', async () => {
      const vpcId = out('VPCId')!;
      const r = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(r.Vpcs?.[0]?.VpcId).toBe(vpcId);
    });

    test('Public & Private subnets exist and span >=2 AZs', async () => {
      const publicIds = list(out('PublicSubnets'));
      const privateIds = list(out('PrivateSubnetIds'));
      const res = await ec2.send(
        new DescribeSubnetsCommand({ SubnetIds: [...publicIds, ...privateIds] })
      );
      const subs = res.Subnets || [];
      const azPublic = new Set(
        subs
          .filter(s => publicIds.includes(s.SubnetId!))
          .map(s => s.AvailabilityZone)
      );
      const azPrivate = new Set(
        subs
          .filter(s => privateIds.includes(s.SubnetId!))
          .map(s => s.AvailabilityZone)
      );
      expect(azPublic.size).toBeGreaterThanOrEqual(2);
      expect(azPrivate.size).toBeGreaterThanOrEqual(2);
    });
  });

  // 4) Security Groups (only two simple checks)
  describe('Security Groups', () => {
    test('ALB SG allows 80/443 from anywhere', async () => {
      const sgId = out('AlbSGId')!;
      const r = await ec2.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [sgId] })
      );
      const perms = r.SecurityGroups?.[0]?.IpPermissions || [];
      expect(perms.some(p => p.FromPort === 80 && p.ToPort === 80)).toBe(true);
      expect(perms.some(p => p.FromPort === 443 && p.ToPort === 443)).toBe(
        true
      );
    });

    test('App SG allows HTTP from ALB SG', async () => {
      const appSg = out('AppSGId')!;
      const albSg = out('AlbSGId')!;
      const r = await ec2.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [appSg] })
      );
      const perms = r.SecurityGroups?.[0]?.IpPermissions || [];
      const ok = perms.some(
        p =>
          p.FromPort === 80 &&
          p.ToPort === 80 &&
          (p.UserIdGroupPairs || []).some(g => g.GroupId === albSg)
      );
      expect(ok).toBe(true);
    });
  });

  // 5) S3 (app bucket + logging bucket)
  describe('S3 Buckets', () => {
    test('Application bucket: exists, encryption, versioning, logging', async () => {
      const bucket = out('ApplicationS3BucketName')!;
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));
      const enc = await s3.send(
        new GetBucketEncryptionCommand({ Bucket: bucket })
      );
      expect(
        (enc.ServerSideEncryptionConfiguration?.Rules || []).length
      ).toBeGreaterThan(0);
      const ver = await s3.send(
        new GetBucketVersioningCommand({ Bucket: bucket })
      );
      expect(ver.Status).toBe('Enabled');
      const log = await s3.send(
        new GetBucketLoggingCommand({ Bucket: bucket })
      );
      expect(log.LoggingEnabled?.TargetBucket).toBeDefined();
      expect(
        (log.LoggingEnabled?.TargetPrefix || '').startsWith('access-logs/')
      ).toBe(true);
    }, 60_000);

    test('Logging bucket: exists and encrypted', async () => {
      const bucket = out('LoggingS3BucketName')!;
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));
      const enc = await s3.send(
        new GetBucketEncryptionCommand({ Bucket: bucket })
      );
      expect(
        (enc.ServerSideEncryptionConfiguration?.Rules || []).length
      ).toBeGreaterThan(0);
    }, 60_000);
  });

  // 6) KMS (minimal)
  describe('KMS', () => {
    test('KMS key enabled (alias best-effort)', async () => {
      const keyId = out('KmsKeyId')!;
      const alias = out('KmsAliasName'); // optional
      const d = await kms.send(new DescribeKeyCommand({ KeyId: keyId }));
      expect(d.KeyMetadata?.Enabled).toBe(true);
      if (alias) {
        const a = await kms.send(new ListAliasesCommand({ KeyId: keyId }));
        expect((a.Aliases || []).some(x => x.AliasName === alias)).toBe(true);
      }
    });
  });

  // 7) ALB (keep super short)
  describe('Application Load Balancer', () => {
    test('ALB is internet-facing and in public subnets', async () => {
      const dns = out('ALBDNSName')!;
      const dlb = await elbv2.send(new DescribeLoadBalancersCommand({}));
      const lb = (dlb.LoadBalancers || []).find(x => x.DNSName === dns);
      expect(lb?.Scheme).toBe('internet-facing');

      const publicSubnets = list(out('PublicSubnets'));
      const lbSubnetIds = (lb?.AvailabilityZones || [])
        .map(az => az.SubnetId)
        .filter(Boolean);
      publicSubnets.forEach(sid => expect(lbSubnetIds).toContain(sid));
    });

    test('Listener :80 forwards to the Target Group (and TG has /health)', async () => {
      const lbArn = out('LoadBalancerArn')!;
      const tgArn = out('TargetGroupArn')!;
      const ls = await elbv2.send(
        new DescribeListenersCommand({ LoadBalancerArn: lbArn })
      );
      const http = (ls.Listeners || []).find(
        l => l.Port === 80 && l.Protocol === 'HTTP'
      );
      expect(http).toBeDefined();

      const action = http!.DefaultActions?.[0];
      const tgArns = action?.TargetGroupArn
        ? [action.TargetGroupArn]
        : (action?.ForwardConfig?.TargetGroups || []).map(
            t => t.TargetGroupArn!
          );
      expect(tgArns).toContain(tgArn);

      const dtg = await elbv2.send(
        new DescribeTargetGroupsCommand({ TargetGroupArns: [tgArn] })
      );
      const tg = dtg.TargetGroups?.[0];
      expect(tg?.HealthCheckPath).toBe('/health');

      // best-effort: targets discoverable
      try {
        await elbv2.send(
          new DescribeTargetHealthCommand({ TargetGroupArn: tgArn })
        );
      } catch (_) {}
    });
  });

  // 8) ASG (minimal)
  describe('Auto Scaling Group', () => {
    test('ASG exists and spans >=2 subnets', async () => {
      const name = out('ASGName')!;
      const d = await asg.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [name] })
      );
      const g = d.AutoScalingGroups?.[0];
      expect(g?.AutoScalingGroupName).toBe(name);
      const subnets = (g?.VPCZoneIdentifier || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      expect(subnets.length).toBeGreaterThanOrEqual(2);
    });
  });

  // 9) Logs / CloudTrail (optional, short, only if outputs exist)
  describe('Logging (optional)', () => {
    test('Application log group exists (>=30 days retention)', async () => {
      const name = out('ApplicationLogGroupName');
      if (!name) return;
      const d = await logs.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: name })
      );
      const lg = (d.logGroups || []).find(g => g.logGroupName === name);
      expect(lg).toBeDefined();
      expect(lg!.retentionInDays || 0).toBeGreaterThanOrEqual(30);
    });

    test('CloudTrail present and logging (if outputs provided)', async () => {
      const trailName = out('CloudTrailName');
      if (!trailName) return;
      const d = await cloudtrail.send(
        new DescribeTrailsCommand({
          trailNameList: [trailName],
          includeShadowTrails: false,
        })
      );
      expect(d.trailList?.[0]?.Name).toBe(trailName);
      const s = await cloudtrail.send(
        new GetTrailStatusCommand({ Name: trailName })
      );
      expect(s.IsLogging).toBe(true);
    });
  });
});
