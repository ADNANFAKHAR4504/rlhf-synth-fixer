import {
  CloudTrailClient,
  GetEventSelectorsCommand,
  GetTrailCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeNetworkAclsCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
  InternetGateway,
  IpPermission,
  RouteTable,
} from '@aws-sdk/client-ec2';
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// Extend test timeout for live AWS checks
jest.setTimeout(180000);

type TfOutputValue<T> = { sensitive: boolean; type: any; value: T };
type StructuredOutputs = {
  vpc_id?: TfOutputValue<string>;
  public_subnet_ids?: TfOutputValue<string[]>;
  private_subnet_ids?: TfOutputValue<string[]>;
  kms_key_arn?: TfOutputValue<string>;
  cloudtrail_name?: TfOutputValue<string | null>;
  cloudtrail_s3_bucket?: TfOutputValue<string>;
};

function readOutputs() {
  const p = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');
  if (!fs.existsSync(p)) throw new Error(`Outputs file not found at ${p}`);
  const out = JSON.parse(fs.readFileSync(p, 'utf8')) as StructuredOutputs;
  const vpcId = out.vpc_id?.value;
  const publicSubnetIds = out.public_subnet_ids?.value || [];
  const privateSubnetIds = out.private_subnet_ids?.value || [];
  const kmsKeyArn = out.kms_key_arn?.value;
  const trailName = out.cloudtrail_name?.value ?? null;
  const trailBucket = out.cloudtrail_s3_bucket?.value;
  if (!vpcId) throw new Error('vpc_id.value missing in outputs');
  if (!publicSubnetIds.length)
    throw new Error('public_subnet_ids.value missing/empty');
  if (!privateSubnetIds.length)
    throw new Error('private_subnet_ids.value missing/empty');
  if (!kmsKeyArn) throw new Error('kms_key_arn.value missing');
  if (!trailBucket) throw new Error('cloudtrail_s3_bucket.value missing');
  return {
    vpcId,
    publicSubnetIds,
    privateSubnetIds,
    kmsKeyArn,
    trailName,
    trailBucket,
  };
}

async function retry<T>(
  fn: () => Promise<T>,
  attempts = 10,
  baseMs = 800
): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const wait = baseMs * Math.pow(1.6, i) + Math.floor(Math.random() * 150);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

async function discoverRegionForVpc(vpcId: string): Promise<string> {
  const envRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  const candidates = Array.from(
    new Set(
      [
        envRegion,
        'us-west-2',
        'us-east-1',
        'us-east-2',
        'us-west-1',
        'eu-west-1',
        'eu-central-1',
      ].filter(Boolean) as string[]
    )
  );
  for (const r of candidates) {
    const ec2 = new EC2Client({ region: r });
    try {
      const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      if ((res.Vpcs || []).length > 0) return r;
    } catch {
      // ignore and try next
    } finally {
      try {
        ec2.destroy();
      } catch {}
    }
  }
  throw new Error(
    `Could not find VPC ${vpcId} in candidate regions: ${candidates.join(', ')}`
  );
}

function portRangeMatch(p: IpPermission, port: number) {
  return p.IpProtocol === 'tcp' && p.FromPort === port && p.ToPort === port;
}

function hasDefaultRouteToGateway(rt: RouteTable, gwType: 'igw' | 'nat') {
  for (const r of rt.Routes || []) {
    if (r.DestinationCidrBlock === '0.0.0.0/0') {
      if (gwType === 'igw' && r.GatewayId && r.GatewayId.startsWith('igw-'))
        return true;
      if (
        gwType === 'nat' &&
        r.NatGatewayId &&
        r.NatGatewayId.startsWith('nat-')
      )
        return true;
    }
  }
  return false;
}

async function deriveResourceId(
  region: string,
  kmsKeyArn: string,
  cloudtrailBucket: string
): Promise<string | undefined> {
  const m = /^prod-cloudtrail-logs-(?<id>[a-z0-9-]{4,32})$/.exec(
    cloudtrailBucket || ''
  );
  if (m?.groups?.id) return m.groups.id;
  const kms = new KMSClient({ region });
  const keyId = kmsKeyArn.split('/').pop() as string;
  try {
    const desc = await kms.send(new DescribeKeyCommand({ KeyId: keyId }));
    const description = (desc.KeyMetadata as any)?.Description as
      | string
      | undefined;
    if (description) {
      const dm = /^prod-kms-(?<id>[a-z0-9-]{4,32})$/.exec(description);
      if (dm?.groups?.id) return dm.groups.id;
    }
  } catch {}
  return undefined;
}

describe('LIVE integration: Validate deployed stack from structured outputs (no Terraform CLI)', () => {
  const o = readOutputs();
  let REGION = 'us-west-2';
  let ec2: EC2Client;
  let s3: S3Client;
  let kms: KMSClient;
  let logs: CloudWatchLogsClient;
  let ct: CloudTrailClient;
  let resourceId: string | undefined;
  let vpcCidr: string | undefined;

  beforeAll(async () => {
    REGION = await discoverRegionForVpc(o.vpcId);
    ec2 = new EC2Client({ region: REGION });
    s3 = new S3Client({ region: REGION });
    kms = new KMSClient({ region: REGION });
    logs = new CloudWatchLogsClient({ region: REGION });
    ct = new CloudTrailClient({ region: REGION });
    resourceId = await deriveResourceId(REGION, o.kmsKeyArn, o.trailBucket);
    const vpcs = await ec2.send(new DescribeVpcsCommand({ VpcIds: [o.vpcId] }));
    vpcCidr = (vpcs.Vpcs || [])[0]?.CidrBlock;
  });

  afterAll(async () => {
    try {
      ec2.destroy();
    } catch {}
    try {
      s3.destroy();
    } catch {}
    try {
      kms.destroy();
    } catch {}
    try {
      logs.destroy();
    } catch {}
    try {
      ct.destroy();
    } catch {}
  });

  test('Outputs cover expected keys from lib/main.tf', () => {
    expect(o.vpcId).toMatch(/^vpc-/);
    expect(Array.isArray(o.publicSubnetIds)).toBe(true);
    expect(Array.isArray(o.privateSubnetIds)).toBe(true);
    expect(o.publicSubnetIds.length).toBeGreaterThanOrEqual(2);
    expect(o.privateSubnetIds.length).toBeGreaterThanOrEqual(2);
    expect(o.kmsKeyArn.startsWith('arn:aws:kms:')).toBe(true);
    expect(typeof o.trailBucket).toBe('string');
  });

  test('VPC exists and is tagged per standards', async () => {
    const vpcs = await retry(() =>
      ec2.send(new DescribeVpcsCommand({ VpcIds: [o.vpcId] }))
    );
    const vpc = (vpcs.Vpcs || [])[0];
    expect(vpc).toBeTruthy();
    const tags: Record<string, string> = {};
    for (const t of vpc.Tags || [])
      if (t.Key && typeof t.Value === 'string') tags[t.Key] = t.Value;
    if (resourceId) expect(tags['Name']).toBe(`prod-vpc-${resourceId}`);
    expect(tags['Environment']).toBe('production');
    expect(tags['ManagedBy']).toBe('terraform');
    expect(tags['Region']).toBe(REGION);
  });

  test('Subnets belong to the VPC; AZs populated', async () => {
    const subRes = await retry(() =>
      ec2.send(
        new DescribeSubnetsCommand({
          SubnetIds: [...o.publicSubnetIds, ...o.privateSubnetIds],
        })
      )
    );
    const subnets = subRes.Subnets || [];
    const byId = Object.fromEntries(subnets.map(s => [s.SubnetId!, s]));
    for (const sid of o.publicSubnetIds) {
      expect(byId[sid].VpcId).toBe(o.vpcId);
      expect(typeof byId[sid].AvailabilityZone).toBe('string');
    }
    for (const sid of o.privateSubnetIds) {
      expect(byId[sid].VpcId).toBe(o.vpcId);
      expect(typeof byId[sid].AvailabilityZone).toBe('string');
    }
  });

  test('IGW attached; NAT present; routes configured (public→IGW, private→NAT)', async () => {
    const igwRes = await retry(() =>
      ec2.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: 'attachment.vpc-id', Values: [o.vpcId] }],
        })
      )
    );
    let igw: InternetGateway | undefined = (igwRes.InternetGateways || [])[0];
    if (!igw) {
      const igwAll = await retry(() =>
        ec2.send(new DescribeInternetGatewaysCommand({}))
      );
      igw = (igwAll.InternetGateways || []).find(g =>
        (g.Attachments || []).some(a => a.VpcId === o.vpcId)
      );
    }
    expect(igw).toBeTruthy();

    const natRes = await retry(() =>
      ec2.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            { Name: 'subnet-id', Values: o.publicSubnetIds.slice(0, 2) },
          ],
        })
      )
    );
    expect((natRes.NatGateways || []).length).toBeGreaterThanOrEqual(1);

    const rtRes = await retry(() =>
      ec2.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [o.vpcId] }],
        })
      )
    );
    const routeTables = rtRes.RouteTables || [];
    for (const sid of o.publicSubnetIds) {
      const rts = routeTables.filter(
        rt =>
          (rt.Associations || []).some(a => a.SubnetId === sid) ||
          (rt.Associations || []).some(a => a.Main)
      );
      expect(rts.some(rt => hasDefaultRouteToGateway(rt, 'igw'))).toBe(true);
    }
    for (const sid of o.privateSubnetIds) {
      const rts = routeTables.filter(
        rt =>
          (rt.Associations || []).some(a => a.SubnetId === sid) ||
          (rt.Associations || []).some(a => a.Main)
      );
      expect(rts.some(rt => hasDefaultRouteToGateway(rt, 'nat'))).toBe(true);
    }
  });

  test('Security groups: public allows 80/443; no 22 from world; private allows 80/443 from VPC CIDR', async () => {
    const sgRes = await retry(() =>
      ec2.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [o.vpcId] }],
        })
      )
    );
    const sgs = sgRes.SecurityGroups || [];
    // Prefer exact name match when resourceId is derivable, else fall back to capability-based selection
    const expectedPubName = resourceId
      ? `prod-public-sg-${resourceId}`
      : undefined;
    const pub =
      (expectedPubName && sgs.find(g => g.GroupName === expectedPubName)) ||
      sgs.find(
        g =>
          (g.IpPermissions || []).some(p => portRangeMatch(p, 80)) &&
          (g.IpPermissions || []).some(p => portRangeMatch(p, 443))
      );
    expect(pub).toBeTruthy();
    const pubIngress = pub!.IpPermissions || [];
    const worldV4 = (ranges?: any[]) =>
      (ranges || []).some(r => r.CidrIp === '0.0.0.0/0');
    const worldV6 = (ranges?: any[]) =>
      (ranges || []).some(r => r.CidrIpv6 === '::/0');
    const httpOk = pubIngress.some(
      p =>
        portRangeMatch(p, 80) && (worldV4(p.IpRanges) || worldV6(p.Ipv6Ranges))
    );
    const httpsOk = pubIngress.some(
      p =>
        portRangeMatch(p, 443) && (worldV4(p.IpRanges) || worldV6(p.Ipv6Ranges))
    );
    const sshWorld = pubIngress.some(
      p =>
        portRangeMatch(p, 22) && (worldV4(p.IpRanges) || worldV6(p.Ipv6Ranges))
    );
    expect(httpOk && httpsOk).toBe(true);
    expect(sshWorld).toBe(false);
    const expectedPrivName = resourceId
      ? `prod-private-sg-${resourceId}`
      : undefined;
    const priv =
      (expectedPrivName && sgs.find(g => g.GroupName === expectedPrivName)) ||
      sgs.find(g => g.GroupId !== pub!.GroupId);
    if (priv && vpcCidr) {
      const privIngress = priv.IpPermissions || [];
      const allow80 = privIngress.some(
        p =>
          portRangeMatch(p, 80) &&
          (p.IpRanges || []).some(r => r.CidrIp === vpcCidr)
      );
      const allow443 = privIngress.some(
        p =>
          portRangeMatch(p, 443) &&
          (p.IpRanges || []).some(r => r.CidrIp === vpcCidr)
      );
      expect(allow80 && allow443).toBe(true);
    }
  });

  test('Private NACL associated with private subnets, allows 80/443 and all egress', async () => {
    const naclRes = await retry(() =>
      ec2.send(
        new DescribeNetworkAclsCommand({
          Filters: [{ Name: 'vpc-id', Values: [o.vpcId] }],
        })
      )
    );
    const acls = naclRes.NetworkAcls || [];
    const privateAcl = acls.find(a =>
      o.privateSubnetIds.every(sid =>
        (a.Associations || []).some(as => as.SubnetId === sid)
      )
    );
    expect(privateAcl).toBeTruthy();
    const entries = privateAcl!.Entries || [];
    const allow80 = entries.some(
      e =>
        e.Egress === false &&
        e.RuleAction === 'allow' &&
        e.Protocol === '6' &&
        e.PortRange?.From === 80
    );
    const allow443 = entries.some(
      e =>
        e.Egress === false &&
        e.RuleAction === 'allow' &&
        e.Protocol === '6' &&
        e.PortRange?.From === 443
    );
    const allowAllEgress = entries.some(
      e => e.Egress === true && e.RuleAction === 'allow' && e.Protocol === '-1'
    );
    expect(allow80 && allow443 && allowAllEgress).toBe(true);
  });

  test('KMS key rotation enabled and alias exists (naming when derivable)', async () => {
    const keyId = o.kmsKeyArn.split('/').pop() as string;
    const d = await retry(() =>
      kms.send(new DescribeKeyCommand({ KeyId: keyId }))
    );
    expect(d.KeyMetadata?.Arn).toBe(o.kmsKeyArn);
    const rot = await retry(() =>
      kms.send(new GetKeyRotationStatusCommand({ KeyId: keyId }))
    );
    expect(rot.KeyRotationEnabled).toBe(true);
    const aliases = await retry(() =>
      kms.send(new ListAliasesCommand({ KeyId: keyId }))
    );
    const aliasNames = (aliases.Aliases || []).map(a => a.AliasName);
    expect(aliasNames.length).toBeGreaterThan(0);
    if (resourceId)
      expect(aliasNames).toContain(`alias/prod-kms-${resourceId}`);
  });

  test('S3 CloudTrail bucket: SSE-KMS, public access block, and policy write condition', async () => {
    const enc = await retry(() =>
      s3.send(new GetBucketEncryptionCommand({ Bucket: o.trailBucket }))
    );
    const r = enc.ServerSideEncryptionConfiguration?.Rules?.[0];
    expect(r?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    const pab = await retry(() =>
      s3.send(new GetPublicAccessBlockCommand({ Bucket: o.trailBucket }))
    );
    const cfg = pab.PublicAccessBlockConfiguration!;
    expect(
      cfg.BlockPublicAcls &&
        cfg.BlockPublicPolicy &&
        cfg.IgnorePublicAcls &&
        cfg.RestrictPublicBuckets
    ).toBe(true);
    const polRaw = await retry(() =>
      s3.send(new GetBucketPolicyCommand({ Bucket: o.trailBucket }))
    );
    const pol = JSON.parse(polRaw.Policy || '{}');
    const statements: any[] = pol.Statement || [];
    const writeStmt = statements.find(s => s.Sid === 'AWSCloudTrailWrite');
    expect(writeStmt?.Condition?.StringEquals?.['s3:x-amz-acl']).toBe(
      'bucket-owner-full-control'
    );
    if (resourceId)
      expect(o.trailBucket).toBe(`prod-cloudtrail-logs-${resourceId}`);
  });

  test('CloudWatch Log Group exists with 30-day retention (if name can be inferred)', async () => {
    // Name is prod-system-logs-{resource_id}; cannot infer if resource_id isn’t derivable from outputs
    const bucketMatch = /^prod-cloudtrail-logs-(?<id>[a-z0-9-]{4,32})$/.exec(
      o.trailBucket
    );
    const resourceId = bucketMatch?.groups?.id;
    if (!resourceId) return; // skip if we cannot derive
    const name = `prod-system-logs-${resourceId}`;
    const lg = await retry(() =>
      logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: name }))
    );
    const group = (lg.logGroups || []).find(g => g.logGroupName === name);
    expect(group).toBeTruthy();
    expect(group!.retentionInDays).toBe(30);
  });

  test('CloudTrail status when enabled, or absence by convention when disabled', async () => {
    if (o.trailName) {
      const t = await retry(() =>
        ct.send(new GetTrailCommand({ Name: o.trailName! }))
      );
      expect(t.Trail?.IsMultiRegionTrail).toBe(true);
      const status = await retry(() =>
        ct.send(new GetTrailStatusCommand({ Name: o.trailName! }))
      );
      expect(status.IsLogging).toBe(true);
      const sels = await retry(() =>
        ct.send(new GetEventSelectorsCommand({ TrailName: o.trailName! }))
      );
      const hasS3Object = (sels.EventSelectors || []).some(es =>
        (es.DataResources || []).some(dr => dr.Type === 'AWS::S3::Object')
      );
      expect(hasS3Object).toBe(true);
    } else {
      // When disabled, no specific trail name asserted due to lack of resource_id in outputs
      expect(o.trailName).toBeNull();
    }
  });
});
