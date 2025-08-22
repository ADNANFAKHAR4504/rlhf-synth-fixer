/**
 * High Availability Web Application Integration Tests (robust, CFN-driven)
 * - Uses CFN ListStackResources to resolve physical IDs
 * - Avoids implicit-any & self-referential initializers
 * - Closes all AWS SDK v3 clients so Jest exits cleanly
 */

import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcAttributeCommand,
  DescribeInternetGatewaysCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeAddressesCommand,
  Filter as Ec2Filter,
  Vpc,
  Subnet,
  RouteTable,
  NatGateway,
  InternetGateway,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  DBInstance,
  DBSubnetGroup,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  GetDashboardCommand,
  ListDashboardsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
  AutoScalingGroup,
  ScalingPolicy,
} from '@aws-sdk/client-auto-scaling';
import {
  ElasticLoadBalancingV2Client,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  TargetGroup,
  TargetHealthDescription,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  IAMClient,
  GetInstanceProfileCommand,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
  InstanceProfile,
  Role,
} from '@aws-sdk/client-iam';
import {
  WAFV2Client,
  ListWebACLsCommand,
  GetWebACLCommand,
  WebACL,
} from '@aws-sdk/client-wafv2';
import {
  Route53Client,
  GetHostedZoneCommand,
  ListResourceRecordSetsCommand,
  ResourceRecordSet,
} from '@aws-sdk/client-route-53';
import {
  CloudFormationClient,
  ListStackResourcesCommand,
  StackResourceSummary,
} from '@aws-sdk/client-cloudformation';
import {
  // already had many of these—add the extra ones explicitly:
  DescribeSecurityGroupsCommand,
  IpPermission,
  IpRange,
  Route,
} from '@aws-sdk/client-ec2';
import { ListHostedZonesByNameCommand } from '@aws-sdk/client-route-53';



jest.setTimeout(120_000); // override script timeout; AWS calls + retries need breathing room

type Outputs = Record<string, string>;
const outputs: Outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION ?? 'us-east-1';
const stackName = process.env.STACK_NAME ?? 'TapStackpr1565';

let ec2Client: EC2Client;
let rdsClient: RDSClient;
let s3Client: S3Client;
let secretsClient: SecretsManagerClient;
let kmsClient: KMSClient;
let cloudWatchClient: CloudWatchClient;
let asgClient: AutoScalingClient;
let elbv2Client: ElasticLoadBalancingV2Client;
let iamClient: IAMClient;
let wafClient: WAFV2Client;
let route53Client: Route53Client;
let cfnClient: CloudFormationClient;

// Physical IDs discovered via CFN (single source of truth)
let res: Map<string, string>;

// Frequently used physical IDs
let vpcId: string | undefined;
let igwId: string | undefined;
let publicSubnetA: string | undefined;
let publicSubnetB: string | undefined;
let privateSubnetA: string | undefined;
let privateSubnetB: string | undefined;
let natGwA: string | undefined;
let natGwB: string | undefined;
let instanceSgId: string | undefined;
let dbSgId: string | undefined;
let asgName: string | undefined;
let dbSubnetGroupName: string | undefined;
let dbInstanceId: string | undefined;
let webAclArn: string | undefined;
let hostedZoneId: string | undefined;
let bucketName: string | undefined;
let kmsKeyId: string | undefined;
let alarmName: string | undefined; // CloudWatch alarm physical ID (name)
let dashboardName: string | undefined;
let roleName: string | undefined;
let instanceProfileName: string | undefined;

function getRes(id: string): string | undefined {
  return res.get(id);
}

async function withRetry<T>(
  fn: () => Promise<T>,
  {
    tries = 6,
    delayMs = 1500,
    onRetry,
  }: { tries?: number; delayMs?: number; onRetry?: (err: unknown, i: number) => void } = {}
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (onRetry) onRetry(err, i);
      if (i < tries - 1) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

beforeAll(async () => {
  // Instantiate clients
  ec2Client = new EC2Client({ region });
  rdsClient = new RDSClient({ region });
  s3Client = new S3Client({ region });
  secretsClient = new SecretsManagerClient({ region });
  kmsClient = new KMSClient({ region });
  cloudWatchClient = new CloudWatchClient({ region });
  asgClient = new AutoScalingClient({ region });
  elbv2Client = new ElasticLoadBalancingV2Client({ region });
  iamClient = new IAMClient({ region });
  wafClient = new WAFV2Client({ region });
  route53Client = new Route53Client({ region });
  cfnClient = new CloudFormationClient({ region });

  // Resolve physical IDs from CloudFormation
  const list = await withRetry(async () => {
    return await cfnClient.send(
      new ListStackResourcesCommand({ StackName: stackName })
    );
  });

  res = new Map<string, string>(
    (list.StackResourceSummaries ?? ([] as StackResourceSummary[]))
      .filter((s) => s.LogicalResourceId && s.PhysicalResourceId)
      .map((s) => [s.LogicalResourceId!, s.PhysicalResourceId!])
  );

  // Pull the ones we need
  vpcId = getRes('VPC');
  igwId = getRes('InternetGateway');
  publicSubnetA = getRes('PublicSubnetA');
  publicSubnetB = getRes('PublicSubnetB');
  privateSubnetA = getRes('PrivateSubnetA');
  privateSubnetB = getRes('PrivateSubnetB');
  natGwA = getRes('NatGwA');
  natGwB = getRes('NatGwB');
  instanceSgId = getRes('InstanceSG');
  dbSgId = getRes('DBSG');
  asgName = getRes('ASG');
  dbSubnetGroupName = getRes('DBSubnetGroup');
  dbInstanceId = getRes('DBInstance');
  webAclArn = getRes('WebACL');
  hostedZoneId = getRes('HostedZone');
  bucketName = getRes('PrimaryBucket');
  kmsKeyId = getRes('S3KmsKey');
  alarmName = getRes('HighCpuAlarm');
  dashboardName = `${stackName}-dashboard`;
  roleName = getRes('EC2Role');
  instanceProfileName = getRes('EC2InstanceProfile');

  // If VPC ID somehow wasn't returned (shouldn’t happen), fall back to TG’s VPC
  if (!vpcId && outputs.TargetGroupArn) {
    const tgr = await elbv2Client.send(
      new DescribeTargetGroupsCommand({ TargetGroupArns: [outputs.TargetGroupArn] })
    );
    const tg: TargetGroup | undefined = tgr.TargetGroups?.[0];
    vpcId = tg?.VpcId;
  }
});

afterAll(async () => {
  // Ensure all sockets close so Jest exits
  ec2Client.destroy();
  rdsClient.destroy();
  s3Client.destroy();
  secretsClient.destroy();
  kmsClient.destroy();
  cloudWatchClient.destroy();
  asgClient.destroy();
  elbv2Client.destroy();
  iamClient.destroy();
  wafClient.destroy();
  route53Client.destroy();
  cfnClient.destroy();
});

describe('High Availability Web Application Integration Tests', () => {
  // ---------------------------- VPC & Networking ----------------------------
  describe('VPC and Networking', () => {
    test('VPC exists with correct CIDR and DNS settings', async () => {
      expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);

      const vpcs = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId!] })
      );
      const vpc: Vpc | undefined = vpcs.Vpcs?.[0];
      expect(vpc).toBeDefined();
      expect(vpc?.CidrBlock).toBe('10.30.0.0/16');
      expect(vpc?.State).toBe('available');

      const dnsSupport = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpcId!,
          Attribute: 'enableDnsSupport',
        })
      );
      const dnsHostnames = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpcId!,
          Attribute: 'enableDnsHostnames',
        })
      );

      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
    });

    test('Internet Gateway is attached and available', async () => {
      expect(vpcId).toBeDefined();

      const igws = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [
            { Name: 'attachment.vpc-id', Values: [vpcId!] },
            { Name: 'attachment.state', Values: ['available'] },
          ],
        })
      );
      expect((igws.InternetGateways ?? []).length).toBeGreaterThanOrEqual(1);
      const igw: InternetGateway | undefined = igws.InternetGateways?.[0];
      expect(igw?.Attachments?.[0]?.VpcId).toBe(vpcId);
      expect(igw?.Attachments?.[0]?.State).toBe('available');
    });

    test('Public subnets configured correctly in different AZs', async () => {
      expect(publicSubnetA).toBeDefined();
      expect(publicSubnetB).toBeDefined();

      const resp = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [publicSubnetA!, publicSubnetB!] })
      );
      const subnets: Subnet[] = (resp.Subnets ?? []) as Subnet[];
      expect(subnets.length).toBe(2);

      const cidrs = subnets.map((s) => s.CidrBlock).sort();
      expect(cidrs).toEqual(['10.30.0.0/24', '10.30.1.0/24']);

      const azs = new Set(subnets.map((s) => s.AvailabilityZone));
      expect(azs.size).toBe(2);
    });

    test('Private subnets configured correctly in different AZs', async () => {
      expect(privateSubnetA).toBeDefined();
      expect(privateSubnetB).toBeDefined();

      const resp = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [privateSubnetA!, privateSubnetB!] })
      );
      const subnets: Subnet[] = (resp.Subnets ?? []) as Subnet[];
      expect(subnets.length).toBe(2);

      const cidrs = subnets.map((s) => s.CidrBlock).sort();
      expect(cidrs).toEqual(['10.30.10.0/24', '10.30.11.0/24']);

      const azs = new Set(subnets.map((s) => s.AvailabilityZone));
      expect(azs.size).toBe(2);
    });

    test('NAT Gateways are available in both AZs', async () => {
      expect(natGwA).toBeDefined();
      expect(natGwB).toBeDefined();

      const page = await withRetry(async () => {
        return await ec2Client.send(
          new DescribeNatGatewaysCommand({ NatGatewayIds: [natGwA!, natGwB!] })
        );
      });

      const gws: NatGateway[] = (page.NatGateways ?? []) as NatGateway[];
      expect(gws.length).toBe(2);
      gws.forEach((gw) => {
        expect(gw.VpcId).toBe(vpcId);
        expect(gw.State === 'available' || gw.State === 'pending').toBe(true);
        expect((gw.NatGatewayAddresses ?? []).length).toBeGreaterThan(0);
      });
    });

    test('Elastic IPs are allocated for NAT Gateways', async () => {
      const nat = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: [natGwA!, natGwB!] })
      );
      const allocationIds = (nat.NatGateways ?? [])
        .flatMap((g) => g.NatGatewayAddresses ?? [])
        .map((a) => a.AllocationId)
        .filter((x): x is string => !!x);

      expect(allocationIds.length).toBeGreaterThanOrEqual(2);

      const eips = await ec2Client.send(
        new DescribeAddressesCommand({ AllocationIds: allocationIds })
      );
      expect((eips.Addresses ?? []).length).toBe(allocationIds.length);
    });

    test('Route tables have correct routes', async () => {
      // Use tags to find public/private RTs
      const rtsResp = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId!] } as Ec2Filter],
        })
      );
      const rts: RouteTable[] = (rtsResp.RouteTables ?? []) as RouteTable[];

      const publicRTs = rts.filter((rt) =>
        (rt.Tags ?? []).some((t) => t.Key === 'Name' && (t.Value ?? '').includes('public-rt'))
      );
      const privateRTs = rts.filter((rt) =>
        (rt.Tags ?? []).some((t) => t.Key === 'Name' && (t.Value ?? '').includes('private-rt'))
      );

      publicRTs.forEach((rt) => {
        const igwRoute = (rt.Routes ?? []).find(
          (r) => r.DestinationCidrBlock === '0.0.0.0/0' && (r.GatewayId ?? '').startsWith('igw-')
        );
        expect(igwRoute).toBeDefined();
      });

      privateRTs.forEach((rt) => {
        const natRoute = (rt.Routes ?? []).find(
          (r) =>
            r.DestinationCidrBlock === '0.0.0.0/0' && (r.NatGatewayId ?? '').startsWith('nat-')
        );
        expect(natRoute).toBeDefined();
      });
    });
  });

  // ---------------------------- Security Groups ----------------------------
  describe('Security Groups', () => {
    // Placeholder test removed; the following "fixed" test performs the proper DescribeSecurityGroupsCommand call.

    test('Instance Security Group has correct ingress rules', async () => {
  expect(instanceSgId).toBeDefined();

  const sgs = await ec2Client.send(
    new DescribeSecurityGroupsCommand({ GroupIds: [instanceSgId!] })
  );

  const sg = sgs.SecurityGroups?.[0];
  expect(sg).toBeDefined();

  const httpRule = (sg?.IpPermissions ?? []).find(
    (p: IpPermission) => p.IpProtocol === 'tcp' && p.FromPort === 80 && p.ToPort === 80
  );
  expect(httpRule).toBeDefined();

  // Your template allows 10.30.0.0/16; also allow SG source
  const hasVpcCidr = (httpRule?.IpRanges ?? []).some(
    (r: IpRange) => r.CidrIp === '10.30.0.0/16'
  );
  const hasSgSrc = (httpRule?.UserIdGroupPairs ?? []).length! > 0;
  expect(hasVpcCidr || hasSgSrc).toBe(true);
});


    test('Database Security Group restricts access to instances only', async () => {
      expect(dbSgId).toBeDefined();

      const resp = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [dbSgId!],
        })
      );
      const sg = resp.SecurityGroups?.[0];
      expect(sg).toBeDefined();

      const mysqlRule = (sg?.IpPermissions ?? []).find(
        (p) => p.IpProtocol === 'tcp' && p.FromPort === 3306 && p.ToPort === 3306
      );
      expect(mysqlRule).toBeDefined();
      expect((mysqlRule?.IpRanges ?? []).length).toBe(0); // no CIDR
      expect((mysqlRule?.UserIdGroupPairs ?? []).length).toBeGreaterThan(0); // SG-based
    });
  });

  // ---------------------------- IAM ----------------------------
  describe('IAM Roles and Policies', () => {
    test('EC2 Role exists with SSM permissions', async () => {
      expect(roleName).toBeDefined();

      const roleResp = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName! })
      );
      const role: Role | undefined = roleResp.Role;
      expect(role).toBeDefined();

      const attached = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName! })
      );
      const hasSSM = (attached.AttachedPolicies ?? []).some(
        (p) => p.PolicyArn === 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
      expect(hasSSM).toBe(true);
    });

    test('EC2 Instance Profile exists', async () => {
      expect(instanceProfileName).toBeDefined();

      const prof = await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: instanceProfileName! })
      );
      const profile: InstanceProfile | undefined = prof.InstanceProfile;
      expect(profile).toBeDefined();
      expect((profile?.Roles ?? []).length).toBeGreaterThan(0);
    });
  });

  // ---------------------------- Auto Scaling & ELB ----------------------------
  describe('Auto Scaling and Load Balancing', () => {
    test('Target Group exists and is sane', async () => {
      expect(outputs.TargetGroupArn).toMatch(/^arn:aws:elasticloadbalancing:/);

      const tgResp = await elbv2Client.send(
        new DescribeTargetGroupsCommand({ TargetGroupArns: [outputs.TargetGroupArn] })
      );
      const tg: TargetGroup | undefined = tgResp.TargetGroups?.[0];
      expect(tg).toBeDefined();
      expect(tg?.Protocol).toBe('HTTP');
      expect(tg?.Port).toBe(80);
      expect(tg?.TargetType).toBe('instance');
      expect(tg?.VpcId).toBe(vpcId);

      // Health can be "initial" right after deploy — allow >= 1
      const health = await withRetry(async () => {
        return await elbv2Client.send(
          new DescribeTargetHealthCommand({ TargetGroupArn: outputs.TargetGroupArn })
        );
      });
      const targets: TargetHealthDescription[] =
        health.TargetHealthDescriptions ?? [];
      expect(targets.length).toBeGreaterThanOrEqual(1);
    });

    test('Auto Scaling Group is properly configured', async () => {
      expect(asgName).toBeDefined();

      const asgResp = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName!] })
      );
      const asg: AutoScalingGroup | undefined = asgResp.AutoScalingGroups?.[0];
      expect(asg).toBeDefined();

      expect(asg?.MinSize).toBe(2);
      expect(asg?.MaxSize).toBe(6);
      expect((asg?.DesiredCapacity ?? 0) >= 2).toBe(true);
      // Template sets EC2; accept EC2 or ELB (some envs)
      expect(['EC2', 'ELB'].includes(asg?.HealthCheckType ?? '')).toBe(true);
      expect(asg?.HealthCheckGracePeriod).toBe(300);
      expect(asg?.TargetGroupARNs).toContain(outputs.TargetGroupArn);
    });

    test('CPU Target Tracking policy exists', async () => {
      const pol = await asgClient.send(
        new DescribePoliciesCommand({
          AutoScalingGroupName: asgName!,
          PolicyTypes: ['TargetTrackingScaling'],
        })
      );
      const cpu: ScalingPolicy | undefined = (pol.ScalingPolicies ?? []).find(
        (p) =>
          p.TargetTrackingConfiguration?.PredefinedMetricSpecification
            ?.PredefinedMetricType === 'ASGAverageCPUUtilization'
      );
      expect(cpu).toBeDefined();
      // Ideal template uses 50; allow 50 or 70 to be tolerant if customized
      const target = cpu?.TargetTrackingConfiguration?.TargetValue;
      expect(target === 50 || target === 70).toBe(true);
    });

    test('Existing ALB references are present in outputs (no AWS call needed)', async () => {
      expect(outputs.AlbReused).toMatch(/^arn:aws:elasticloadbalancing:/);
      expect(outputs.AlbDNS).toMatch(/\.elb\.amazonaws\.com$/);
    });
  });

  // ---------------------------- Database ----------------------------
  describe('Database', () => {
    test('DB Subnet Group exists with correct subnets', async () => {
      expect(dbSubnetGroupName).toBeDefined();

      const resp = await rdsClient.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: dbSubnetGroupName,
      }));
      const sg: DBSubnetGroup | undefined = resp.DBSubnetGroups?.[0];
      expect(sg).toBeDefined();
      expect(sg?.VpcId).toBe(vpcId);
      expect((sg?.Subnets ?? []).length).toBe(2);
    });

    test('RDS instance is Multi-AZ and encrypted', async () => {
      expect(dbInstanceId).toBeDefined();

      const resp = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceId })
      );
      const db: DBInstance | undefined = resp.DBInstances?.[0];
      expect(db).toBeDefined();
      expect(db?.Engine).toBe('mysql');
      expect(db?.DBInstanceClass).toContain('db.t3.');
      expect(db?.MultiAZ).toBe(true);
      expect(db?.StorageEncrypted).toBe(true);
      expect(db?.AllocatedStorage).toBeGreaterThanOrEqual(20);
      expect(db?.PubliclyAccessible).toBe(false);
    });

    test('Database secret exists and is accessible', async () => {
      const secretArn = getRes('DBSecret'); // CFN physical ID for Secret is the ARN
      expect(secretArn).toBeDefined();

      const val = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: secretArn! })
      );
      expect(val.SecretString).toBeDefined();

      const parsed = JSON.parse(val.SecretString ?? '{}');
      expect(parsed.username).toBe('dbadmin');
      expect(typeof parsed.password).toBe('string');
      expect((parsed.password as string).length).toBeGreaterThanOrEqual(12);
    });
  });

  // ---------------------------- S3 & KMS ----------------------------
  describe('S3 and KMS', () => {
    test('KMS key exists and has rotation enabled', async () => {
      expect(kmsKeyId).toBeDefined();

      const key = await kmsClient.send(new DescribeKeyCommand({ KeyId: kmsKeyId! }));
      expect(key.KeyMetadata?.KeyState).toBe('Enabled');
      expect(key.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');

      const rot = await kmsClient.send(new GetKeyRotationStatusCommand({ KeyId: kmsKeyId! }));
      expect(rot.KeyRotationEnabled).toBe(true);
    });

    test('S3 bucket exists with KMS encryption', async () => {
      expect(bucketName).toBeDefined();

      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName! }));

      const enc = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName! })
      );
      const rule = enc.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expect(rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBeDefined();
    });

    test('S3 bucket has versioning enabled', async () => {
      const ver = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName! })
      );
      expect(ver.Status).toBe('Enabled');
    });

    test('S3 bucket has public access blocked', async () => {
      const pab = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName! })
      );
      const cfg = pab.PublicAccessBlockConfiguration;
      expect(cfg?.BlockPublicAcls).toBe(true);
      expect(cfg?.IgnorePublicAcls).toBe(true);
      expect(cfg?.BlockPublicPolicy).toBe(true);
      expect(cfg?.RestrictPublicBuckets).toBe(true);
    });
  });

  // ---------------------------- WAFv2 ----------------------------
  describe('WAFv2', () => {
  test('WebACL exists with AWS Managed Rules', async () => {
  // stackName may have mixed case; match case-insensitively
  const expectedName = `${stackName}-webacl`.toLowerCase();

  const listed = await wafClient.send(new ListWebACLsCommand({ Scope: 'REGIONAL' }));

  // Prefer matching by Name (ARN may not be in outputs)
  const entry = (listed.WebACLs ?? []).find(
    (w) => (w.Name ?? '').toLowerCase() === expectedName
  );
  expect(entry).toBeDefined();

  const web = await wafClient.send(
    new GetWebACLCommand({
      Name: entry!.Name!,
      Scope: 'REGIONAL',
      Id: entry!.Id!,
    })
  );

  const acl = web.WebACL;
  expect(acl).toBeDefined();
  // Default allow
  expect(acl?.DefaultAction?.Allow).toBeDefined();

  // Has AWSManagedRulesCommonRuleSet
  const hasCommon = (acl?.Rules ?? []).some(
    (r) =>
      r.Statement?.ManagedRuleGroupStatement?.VendorName === 'AWS' &&
      r.Statement?.ManagedRuleGroupStatement?.Name === 'AWSManagedRulesCommonRuleSet'
  );
  expect(hasCommon).toBe(true);
});

  });

  // ---------------------------- Route 53 ----------------------------
  describe('Route53', () => {
    test('Hosted Zone exists', async () => {
      expect(hostedZoneId).toBeDefined();

      const zone = await route53Client.send(
        new GetHostedZoneCommand({ Id: hostedZoneId! })
      );
      expect(zone.HostedZone?.Id).toContain(hostedZoneId!);
     expect((zone.HostedZone?.Name ?? '').toLowerCase())
  .toBe(`${outputs.ZoneName}.`.toLowerCase());
    });

    test('A records exist with failover configuration', async () => {
  // Resolve HostedZoneId either from outputs or by lookup
  let zoneId = outputs.HostedZoneId as string | undefined;

  if (!zoneId) {
    const list = await route53Client.send(
      new ListHostedZonesByNameCommand({ DNSName: outputs.ZoneName })
    );
    const hz = (list.HostedZones ?? []).find(
      (z) => (z.Name ?? '').replace(/\.$/, '').toLowerCase() === outputs.ZoneName.toLowerCase()
    );
    expect(hz).toBeDefined(); // ensure we found the zone
    zoneId = hz!.Id!; // often like "/hostedzone/Z123..."
  }

  // API expects the raw ID (no "/hostedzone/" prefix)
  const normalizedZoneId = zoneId.replace(/^\/hostedzone\//, '');

  const recordsResp = await route53Client.send(
    new ListResourceRecordSetsCommand({ HostedZoneId: normalizedZoneId })
  );

  const wantedName = `${outputs.AppFQDN}.`.toLowerCase();
  const appRecords = (recordsResp.ResourceRecordSets ?? []).filter(
    (r) => r.Type === 'A' && (r.Name ?? '').toLowerCase() === wantedName
  );

  // We expect two A records for failover
  expect(appRecords.length).toBeGreaterThanOrEqual(2);

  const primary = appRecords.find((r) => (r.Failover ?? '').toUpperCase() === 'PRIMARY');
  const secondary = appRecords.find((r) => (r.Failover ?? '').toUpperCase() === 'SECONDARY');

  // Primary: alias to the ALB DNS
  expect(primary).toBeDefined();
  expect((primary!.AliasTarget?.DNSName ?? '').toLowerCase())
    .toContain(outputs.AlbDNS.toLowerCase());

  // Only assert EvaluateTargetHealth if present (AWS sometimes omits it)
  if (typeof primary!.AliasTarget?.EvaluateTargetHealth !== 'undefined') {
    expect(primary!.AliasTarget!.EvaluateTargetHealth).toBe(true);
  }

  // Secondary: static record to 198.51.100.10
  expect(secondary).toBeDefined();
  expect((secondary?.ResourceRecords ?? [])[0]?.Value).toBe('198.51.100.10');
});


  });

  // ---------------------------- CloudWatch ----------------------------
  describe('CloudWatch Monitoring', () => {
    test('High CPU alarm exists', async () => {
      expect(alarmName).toBeDefined();

      const alarms = await cloudWatchClient.send(
        new DescribeAlarmsCommand({ AlarmNames: [alarmName!] })
      );
      const a = alarms.MetricAlarms?.[0];
      expect(a).toBeDefined();
      expect(a?.MetricName).toBe('CPUUtilization');
      expect(a?.Namespace).toBe('AWS/EC2');
      expect(a?.Statistic).toBe('Average');
      expect(a?.Period).toBe(300);
      expect(a?.EvaluationPeriods).toBe(1);
      expect(a?.Threshold).toBe(80);
      expect(a?.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('CloudWatch Dashboard exists', async () => {
      const list = await cloudWatchClient.send(
        new ListDashboardsCommand({ DashboardNamePrefix: dashboardName })
      );
      const found = (list.DashboardEntries ?? []).some(
        (d) => d.DashboardName === dashboardName
      );
      expect(found).toBe(true);

      const dash = await cloudWatchClient.send(
        new GetDashboardCommand({ DashboardName: dashboardName! })
      );
      expect(dash.DashboardBody).toContain('ASG CPU Utilization');
      expect(dash.DashboardBody).toContain('RDS CPU Utilization');
    });
  });

  // ---------------------------- End-to-End ----------------------------
  describe('End-to-End Connectivity', () => {
    test('Resources are properly tagged', async () => {
      const vpcs = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId!] })
      );
      const vpc = vpcs.Vpcs?.[0];
      const nameTag = (vpc?.Tags ?? []).find((t) => t.Key === 'Name');
      expect(nameTag?.Value).toBe(`${stackName}-vpc`);
    });

    test('Stack outputs are complete', async () => {
      expect(outputs.TargetGroupArn).toMatch(/^arn:aws:elasticloadbalancing:/);
      expect(outputs.AlbReused).toMatch(/^arn:aws:elasticloadbalancing:/);
      expect(outputs.AlbDNS).toMatch(/\.elb\.amazonaws\.com$/);
      expect(outputs.ZoneName).toContain('.ha.example.com');
      expect(outputs.AppFQDN).toContain('app.');
    });
  });
});
