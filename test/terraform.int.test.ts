// LIVE integration tests for resources defined in lib/main.tf and provider.tf.
// Uses AWS SDK v3. No Terraform CLI.
// Requires AWS creds with READ permissions and structured outputs file.
// Run: npx jest --runInBand --detectOpenHandles --testTimeout=180000 --testPathPattern=\.int\.test\.ts$
// Outputs file expected at: cfn-outputs/all-outputs.json

import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
  IpPermission,
  RouteTable,
} from '@aws-sdk/client-ec2';
import { DescribeClustersCommand, DescribeServicesCommand, ECSClient } from '@aws-sdk/client-ecs';
import { DescribeLoadBalancersCommand, ElasticLoadBalancingV2Client } from '@aws-sdk/client-elastic-load-balancing-v2';
import { DescribeKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

/* ----------------------------- Utilities ----------------------------- */

type TfOutputValue<T> = { sensitive: boolean; type: any; value: T };
type StructuredOutputs = {
  vpc_id?: TfOutputValue<string>;
  public_subnet_ids?: TfOutputValue<string[]>;
  private_subnet_ids?: TfOutputValue<string[]>;
  alb_dns_name?: TfOutputValue<string>;
  alb_zone_id?: TfOutputValue<string>;
  ecs_cluster_name?: TfOutputValue<string>;
  ecs_service_name?: TfOutputValue<string>;
  rds_endpoint?: TfOutputValue<string>;
  s3_bucket_name?: TfOutputValue<string>;
  kms_key_id?: TfOutputValue<string>;
  cloudwatch_log_group_name?: TfOutputValue<string>;
};

function readStructuredOutputs() {
  const p = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');
  if (!fs.existsSync(p)) {
    return null; // Return null if file doesn't exist
  }
  
  const out = JSON.parse(fs.readFileSync(p, 'utf8')) as StructuredOutputs;

  const vpcId = out.vpc_id?.value;
  const publicSubnetIds = out.public_subnet_ids?.value || [];
  const privateSubnetIds = out.private_subnet_ids?.value || [];
  const albDnsName = out.alb_dns_name?.value;
  const albZoneId = out.alb_zone_id?.value;
  const ecsClusterName = out.ecs_cluster_name?.value;
  const ecsServiceName = out.ecs_service_name?.value;
  const rdsEndpoint = out.rds_endpoint?.value;
  const s3BucketName = out.s3_bucket_name?.value;
  const kmsKeyId = out.kms_key_id?.value;
  const cwLogGroupName = out.cloudwatch_log_group_name?.value;

  if (!vpcId) throw new Error('vpc_id.value missing in outputs');
  if (!publicSubnetIds.length) throw new Error('public_subnet_ids.value missing/empty');
  if (!privateSubnetIds.length) throw new Error('private_subnet_ids.value missing/empty');
  if (!albDnsName) throw new Error('alb_dns_name.value missing in outputs');
  if (!albZoneId) throw new Error('alb_zone_id.value missing in outputs');
  if (!ecsClusterName) throw new Error('ecs_cluster_name.value missing in outputs');
  if (!ecsServiceName) throw new Error('ecs_service_name.value missing in outputs');
  if (!rdsEndpoint) throw new Error('rds_endpoint.value missing in outputs');
  if (!s3BucketName) throw new Error('s3_bucket_name.value missing in outputs');
  if (!kmsKeyId) throw new Error('kms_key_id.value missing in outputs');
  if (!cwLogGroupName) throw new Error('cloudwatch_log_group_name.value missing in outputs');

  return {
    vpcId,
    publicSubnetIds,
    privateSubnetIds,
    albDnsName,
    albZoneId,
    ecsClusterName,
    ecsServiceName,
    rdsEndpoint,
    s3BucketName,
    kmsKeyId,
    cwLogGroupName,
  };
}

function sanitizeOutputsForLog(rawJson: string): string {
  // Redact long strings (no secrets here, but avoid overwhelming logs)
  return rawJson.replace(/("rds_endpoint"\s*:\s*")[^"]+(")/g, '$1***REDACTED***$2');
}

async function retry<T>(fn: () => Promise<T>, attempts = 10, baseMs = 800): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const wait = baseMs * Math.pow(1.7, i) + Math.floor(Math.random() * 200);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

function assertDefined<T>(v: T | undefined | null, msg: string): T {
  if (v === undefined || v === null) throw new Error(msg);
  return v;
}

/* ----------------------------- Region autodiscovery ----------------------------- */

const o = readStructuredOutputs();
let REGION: string;
let ec2: EC2Client;
let elbv2: ElasticLoadBalancingV2Client;
let ecs: ECSClient;
let rds: RDSClient;
let s3: S3Client;
let kms: KMSClient;
let logs: CloudWatchLogsClient;

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
    const probe = new EC2Client({ region: r });
    try {
      const v = await probe.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      if ((v.Vpcs || []).length > 0) {
        probe.destroy();
        return r;
      }
    } catch {
      // ignore and continue
    } finally {
      try { probe.destroy(); } catch {}
    }
  }

  throw new Error(`Could not locate VPC ${vpcId} in candidate regions: ${candidates.join(', ')}`);
}

/* ----------------------------- Helpers ----------------------------- */

function hasDefaultRouteToGateway(rt: RouteTable, gwType: 'igw' | 'nat') {
  for (const r of rt.Routes || []) {
    if (r.DestinationCidrBlock === '0.0.0.0/0') {
      if (gwType === 'igw' && r.GatewayId && r.GatewayId.startsWith('igw-')) return true;
      if (gwType === 'nat' && r.NatGatewayId && r.NatGatewayId.startsWith('nat-')) return true;
    }
  }
  return false;
}

function portRangeMatch(p: IpPermission, port: number) {
  return p.IpProtocol === 'tcp' && p.FromPort === port && p.ToPort === port;
}

/* ----------------------------- Tests ----------------------------- */

(o ? describe : describe.skip)('LIVE: Terraform-provisioned infra (from structured outputs)', () => {
  const TEST_TIMEOUT = 120_000;

  beforeAll(async () => {
    if (!o) {
      console.info('Skipping integration tests: cfn-outputs/all-outputs.json not found');
      return;
    }

    const raw = fs.readFileSync(path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json'), 'utf8');
    console.info('\n--- Loaded cfn-outputs/all-outputs.json ---\n' + sanitizeOutputsForLog(raw) + '\n-------------------------------------------\n');

    REGION = await discoverRegionForVpc(o.vpcId);
    ec2 = new EC2Client({ region: REGION });
    elbv2 = new ElasticLoadBalancingV2Client({ region: REGION });
    ecs = new ECSClient({ region: REGION });
    rds = new RDSClient({ region: REGION });
    s3 = new S3Client({ region: REGION });
    kms = new KMSClient({ region: REGION });
    logs = new CloudWatchLogsClient({ region: REGION });
    console.info(`Using region: ${REGION}`);
  });

  afterAll(async () => {
    if (!o) return;
    
    try { ec2.destroy(); } catch {}
    try { elbv2.destroy(); } catch {}
    try { ecs.destroy(); } catch {}
    try { rds.destroy(); } catch {}
    try { s3.destroy(); } catch {}
    try { kms.destroy(); } catch {}
    try { logs.destroy(); } catch {}
  });

  test(
    'VPC and subnets exist in discovered region',
    async () => {
      if (!o) throw new Error('Outputs not available');
      
      const v = await retry(() => ec2.send(new DescribeVpcsCommand({ VpcIds: [o.vpcId] })));
      expect((v.Vpcs || []).length).toBe(1);

      const subRes = await retry(() =>
        ec2.send(
          new DescribeSubnetsCommand({ SubnetIds: [...o.publicSubnetIds, ...o.privateSubnetIds] })
        )
      );
      const subnets = subRes.Subnets || [];
      expect(subnets.length).toBe(o.publicSubnetIds.length + o.privateSubnetIds.length);
      for (const s of subnets) expect(s.VpcId).toBe(o.vpcId);
    },
    TEST_TIMEOUT
  );

  test(
    'IGW attached; NAT exists in a public subnet; routes correct (public→IGW, private→NAT)',
    async () => {
      if (!o) throw new Error('Outputs not available');
      
      // IGW attached
      const igwRes = await retry(() =>
        ec2.send(
          new DescribeInternetGatewaysCommand({
            Filters: [{ Name: 'attachment.vpc-id', Values: [o.vpcId] }],
          })
        )
      );
      expect((igwRes.InternetGateways || []).length).toBeGreaterThan(0);

      // NAT exists in at least one public subnet
      const natRes = await retry(() =>
        ec2.send(
          new DescribeNatGatewaysCommand({
            Filter: [{ Name: 'subnet-id', Values: [o.publicSubnetIds[0]] }],
          })
        )
      );
      expect((natRes.NatGateways || []).length).toBeGreaterThan(0);

      // Routes
      const rtRes = await retry(() =>
        ec2.send(new DescribeRouteTablesCommand({ Filters: [{ Name: 'vpc-id', Values: [o.vpcId] }] }))
      );
      const rtBySubnet: Record<string, RouteTable[]> = {};
      let mainRt: RouteTable | undefined;
      for (const rt of rtRes.RouteTables || []) {
        for (const assoc of rt.Associations || []) {
          if (assoc.Main) mainRt = rt;
          if (assoc.SubnetId) (rtBySubnet[assoc.SubnetId] ||= []).push(rt);
        }
      }

      for (const sid of o.publicSubnetIds) {
        const rts = rtBySubnet[sid] && rtBySubnet[sid].length ? rtBySubnet[sid] : mainRt ? [mainRt] : [];
        if (rts.length === 0) throw new Error(`No RT for public subnet ${sid}`);
        const hasIGW = rts.some((rt) => hasDefaultRouteToGateway(rt, 'igw'));
        expect(hasIGW).toBe(true);
      }

      for (const sid of o.privateSubnetIds) {
        const rts = rtBySubnet[sid] && rtBySubnet[sid].length ? rtBySubnet[sid] : mainRt ? [mainRt] : [];
        if (rts.length === 0) throw new Error(`No RT for private subnet ${sid}`);
        const hasNAT = rts.some((rt) => hasDefaultRouteToGateway(rt, 'nat'));
        expect(hasNAT).toBe(true);
      }
    },
    TEST_TIMEOUT
  );

  test(
    'ALB exists by DNS name and its security group allows 80/443 from anywhere, full egress',
    async () => {
      if (!o) throw new Error('Outputs not available');
      
      const lbs = await retry(() => elbv2.send(new DescribeLoadBalancersCommand({})));
      const lb = (lbs.LoadBalancers || []).find((x) => x.DNSName === o.albDnsName);
      const found = assertDefined(lb, `ALB with DNS ${o.albDnsName} not found`);
      const sgIds = assertDefined(found.SecurityGroups, 'ALB has no security groups');
      expect(sgIds.length).toBeGreaterThan(0);

      const sgRes = await retry(() => ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: sgIds })));
      const sg = assertDefined(sgRes.SecurityGroups?.[0], `ALB SG ${sgIds[0]} not found`);

      const ingress = sg.IpPermissions || [];
      const http = ingress.find((p) => portRangeMatch(p as IpPermission, 80));
      const https = ingress.find((p) => portRangeMatch(p as IpPermission, 443));
      expect(http).toBeTruthy();
      expect(https).toBeTruthy();
      const httpV4 = (http!.IpRanges || []).some((r) => r.CidrIp === '0.0.0.0/0');
      const httpsV4 = (https!.IpRanges || []).some((r) => r.CidrIp === '0.0.0.0/0');
      expect(httpV4 && httpsV4).toBe(true);

      const egress = sg.IpPermissionsEgress || [];
      expect(egress.some((p) => p.IpProtocol === '-1')).toBe(true);
    },
    TEST_TIMEOUT
  );

  test(
    'ECS cluster/service exist; service SG allows 80 from ALB SG, full egress',
    async () => {
      if (!o) throw new Error('Outputs not available');
      
      // Cluster exists
      const clusterRes = await retry(() => ecs.send(new DescribeClustersCommand({ clusters: [o.ecsClusterName] })));
      const cluster = (clusterRes.clusters || [])[0];
      expect(cluster?.status).toBeDefined();

      // Service SGs
      const svcRes = await retry(() =>
        ecs.send(
          new DescribeServicesCommand({ cluster: o.ecsClusterName, services: [o.ecsServiceName] })
        )
      );
      const svc = (svcRes.services || [])[0];
      const sgIds = assertDefined(
        svc?.networkConfiguration?.awsvpcConfiguration?.securityGroups,
        'ECS service has no security groups'
      );
      const svcSgId = assertDefined(sgIds[0], 'Missing service SG id');

      // ALB SG id (from previous test we know ALB exists)
      const lbs = await retry(() => elbv2.send(new DescribeLoadBalancersCommand({})));
      const lb = (lbs.LoadBalancers || []).find((x) => x.DNSName === o.albDnsName);
      const albSgId = assertDefined(lb?.SecurityGroups?.[0], 'ALB security group id not found');

      const sgRes = await retry(() =>
        ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [svcSgId, albSgId] }))
      );
      const svcSg = assertDefined(
        (sgRes.SecurityGroups || []).find((g) => g.GroupId === svcSgId),
        `Service SG ${svcSgId} not found`
      );

      const ingress = svcSg.IpPermissions || [];
      const http = ingress.find((p) => portRangeMatch(p as IpPermission, 80));
      expect(http).toBeTruthy();
      const httpFromAlb = (http!.UserIdGroupPairs || []).some((g) => g.GroupId === albSgId);
      expect(httpFromAlb).toBe(true);

      const egress = svcSg.IpPermissionsEgress || [];
      expect(egress.some((p) => p.IpProtocol === '-1')).toBe(true);
    },
    TEST_TIMEOUT
  );

  test(
    'RDS instance exists (by endpoint) and its SG allows 3306 from ECS service SG, full egress',
    async () => {
      if (!o) throw new Error('Outputs not available');
      
      const dbRes = await retry(() => rds.send(new DescribeDBInstancesCommand({})));
      const db = (dbRes.DBInstances || []).find((d) => d.Endpoint?.Address === o.rdsEndpoint);
      const found = assertDefined(db, `RDS instance with endpoint ${o.rdsEndpoint} not found`);
      const rdsSgId = assertDefined(found.VpcSecurityGroups?.[0]?.VpcSecurityGroupId, 'RDS has no SG');

      const svcRes = await retry(() =>
        ecs.send(
          new DescribeServicesCommand({ cluster: o.ecsClusterName, services: [o.ecsServiceName] })
        )
      );
      const svc = (svcRes.services || [])[0];
      const svcSgId = assertDefined(
        svc?.networkConfiguration?.awsvpcConfiguration?.securityGroups?.[0],
        'ECS service SG not found'
      );

      const sgRes = await retry(() =>
        ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [rdsSgId] }))
      );
      const rdsSg = assertDefined(sgRes.SecurityGroups?.[0], `RDS SG ${rdsSgId} not found`);

      const ingress = rdsSg.IpPermissions || [];
      const mysql = ingress.find((p) => portRangeMatch(p as IpPermission, 3306));
      expect(mysql).toBeTruthy();
      const fromSvc = (mysql!.UserIdGroupPairs || []).some((g) => g.GroupId === svcSgId);
      expect(fromSvc).toBe(true);

      const egress = rdsSg.IpPermissionsEgress || [];
      expect(egress.some((p) => p.IpProtocol === '-1')).toBe(true);
    },
    TEST_TIMEOUT
  );

  test(
    'S3 bucket exists, KMS key exists, and CloudWatch log group exists',
    async () => {
      if (!o) throw new Error('Outputs not available');
      
      // S3 bucket
      await retry(() => s3.send(new HeadBucketCommand({ Bucket: o.s3BucketName })));

      // KMS key
      const key = await retry(() => kms.send(new DescribeKeyCommand({ KeyId: o.kmsKeyId })));
      expect(key.KeyMetadata?.KeyId).toBeDefined();

      // CloudWatch log group
      const lgRes = await retry(() =>
        logs.send(
          new DescribeLogGroupsCommand({ logGroupNamePrefix: o.cwLogGroupName })
        )
      );
      const found = (lgRes.logGroups || []).some((g) => g.logGroupName === o.cwLogGroupName);
      expect(found).toBe(true);
    },
    60_000
  );
});