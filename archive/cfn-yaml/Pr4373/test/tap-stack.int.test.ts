// Configuration - These are coming from cfn-outputs after deployment
import { BackupClient, ListBackupPlansCommand } from '@aws-sdk/client-backup';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
} from '@aws-sdk/client-config-service';
import {
  DescribeInternetGatewaysCommand,
  DescribeLaunchTemplatesCommand,
  DescribeLaunchTemplateVersionsCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import { GetFunctionCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetTopicAttributesCommand,
  ListTopicsCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import { GetWebACLCommand, WAFV2Client } from '@aws-sdk/client-wafv2';
import fs from 'fs';

let outputs: any;
try {
  outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
} catch {
  throw new Error('cfn-outputs/flat-outputs.json not found or invalid JSON');
}

function deriveRegionFromOutputs(out: any): string | undefined {
  const arn = out.CloudTrailArn || out.WAFWebACLArn || out.KMSKeyArn;
  if (typeof arn === 'string' && arn.startsWith('arn:')) {
    const parts = arn.split(':');
    if (parts[3]) return parts[3];
  }
  const lb = out.LoadBalancerDNS as string | undefined;
  if (lb) {
    const m = lb.match(/([a-z]{2}-[a-z]+-\d)\.elb\.amazonaws\.com$/);
    if (m) return m[1];
  }
  const rds = out.RDSEndpoint as string | undefined;
  if (rds) {
    const m = rds.match(/\.([a-z]{2}-[a-z]+-\d)\.rds\.amazonaws\.com$/);
    if (m) return m[1];
  }
  return undefined;
}

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region =
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  deriveRegionFromOutputs(outputs) ||
  'eu-central-1';

console.log(`🧪 Using AWS region: ${region}`);

// AWS clients
const ec2Client = new EC2Client({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const kmsClient = new KMSClient({ region });
const wafClient = new WAFV2Client({ region });
const backupClient = new BackupClient({ region });
const iamClient = new IAMClient({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const configClient = new ConfigServiceClient({ region });
const lambdaClient = new LambdaClient({ region });
const snsClient = new SNSClient({ region });

// ---------- helpers (fail-fast) ----------
async function getVpcId(): Promise<string> {
  if (outputs.VPCId) return String(outputs.VPCId);
  const res = await ec2Client.send(
    new DescribeVpcsCommand({
      Filters: [
        { Name: 'tag:Name', Values: ['ProductionVPC'] },
        { Name: 'cidr-block', Values: ['10.0.0.0/16'] },
      ],
    })
  );
  const vpcId = res.Vpcs?.[0]?.VpcId;
  if (!vpcId) throw new Error('VPC not found by outputs or tag/CIDR discovery');
  return vpcId;
}

async function getAlbByDnsOrThrow() {
  if (!outputs.LoadBalancerDNS) throw new Error('LoadBalancerDNS output missing');
  const all = await elbClient.send(new DescribeLoadBalancersCommand({}));
  const alb = all.LoadBalancers?.find(
    (lb) =>
      lb.DNSName === outputs.LoadBalancerDNS ||
      String(outputs.LoadBalancerDNS).startsWith(`${lb.LoadBalancerName}-`)
  );
  if (!alb) throw new Error('ALB not found by DNS');
  return alb;
}

async function findSnsTopicArnByDisplayName(targetDisplayName: string): Promise<string> {
  let next: string | undefined;
  do {
    const page = await snsClient.send(new ListTopicsCommand({ NextToken: next }));
    for (const t of page.Topics ?? []) {
      const arn = t.TopicArn!;
      const attrs = await snsClient.send(new GetTopicAttributesCommand({ TopicArn: arn }));
      if (attrs.Attributes?.DisplayName === targetDisplayName) return arn;
    }
    next = page.NextToken;
  } while (next);
  throw new Error(`SNS topic with DisplayName="${targetDisplayName}" not found`);
}

describe('TapStack Production Security Infrastructure Integration Tests (fail-fast)', () => {
  const testTimeout = 30000;

  // ---------- VPC & NETWORKING ----------
  describe('VPC and Networking Integration Tests', () => {
    test(
      'VPC exists with DNS features',
      async () => {
        const vpcId = await getVpcId();

        const vpcResp = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
        expect(vpcResp.Vpcs?.length).toBe(1);
        const vpc = vpcResp.Vpcs![0];

        expect(vpc.State).toBe('available');
        expect(vpc.CidrBlock).toBe('10.0.0.0/16');

        const [dnsHostnames, dnsSupport] = await Promise.all([
          ec2Client.send(
            new DescribeVpcAttributeCommand({
              VpcId: vpcId,
              Attribute: 'enableDnsHostnames',
            })
          ),
          ec2Client.send(
            new DescribeVpcAttributeCommand({
              VpcId: vpcId,
              Attribute: 'enableDnsSupport',
            })
          ),
        ]);
        expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
        expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
      },
      testTimeout
    );

    test(
      'Public route table has 0.0.0.0/0 route to IGW',
      async () => {
        const vpcId = await getVpcId();

        const igws = await ec2Client.send(
          new DescribeInternetGatewaysCommand({
            Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
          })
        );
        const igwId = igws.InternetGateways?.[0]?.InternetGatewayId;
        if (!igwId) throw new Error('Internet Gateway not attached to VPC');

        const rts = await ec2Client.send(
          new DescribeRouteTablesCommand({
            Filters: [
              { Name: 'vpc-id', Values: [vpcId] },
              { Name: 'tag:Name', Values: ['PublicRouteTable'] },
            ],
          })
        );
        const publicRt = rts.RouteTables?.[0];
        if (!publicRt) throw new Error('PublicRouteTable not found by tag');

        const hasDefaultToIgw = publicRt.Routes?.some(
          (r) => r.DestinationCidrBlock === '0.0.0.0/0' && r.GatewayId === igwId
        );
        expect(hasDefaultToIgw).toBe(true);
      },
      testTimeout
    );

    test(
      'Private route tables default to NAT gateways',
      async () => {
        const vpcId = await getVpcId();

        const ngwResp = await ec2Client.send(
          new DescribeNatGatewaysCommand({
            Filter: [
              { Name: 'vpc-id', Values: [vpcId] },
              { Name: 'state', Values: ['available'] },
            ],
          })
        );
        const natIds = new Set(
          (ngwResp.NatGateways ?? []).map((n) => n.NatGatewayId!).filter(Boolean)
        );
        if (natIds.size === 0) throw new Error('No NAT gateways (state=available) found');

        const rtResp = await ec2Client.send(
          new DescribeRouteTablesCommand({
            Filters: [
              { Name: 'vpc-id', Values: [vpcId] },
              { Name: 'tag:Name', Values: ['PrivateRouteTable1', 'PrivateRouteTable2'] },
            ],
          })
        );
        const privateRTs = rtResp.RouteTables ?? [];
        if (privateRTs.length === 0) throw new Error('Private route tables not found by tag');

        for (const rt of privateRTs) {
          const hasNatDefault = (rt.Routes ?? []).some(
            (r) =>
              r.DestinationCidrBlock === '0.0.0.0/0' &&
              r.NatGatewayId &&
              natIds.has(r.NatGatewayId)
          );
          expect(hasNatDefault).toBe(true);
        }
      },
      testTimeout
    );

    test(
      'Subnets are spread across at least 2 AZs',
      async () => {
        const vpcId = await getVpcId();

        let subnetIds: string[] = [];
        if (outputs.PublicSubnetIds) subnetIds.push(...String(outputs.PublicSubnetIds).split(','));
        if (outputs.PrivateSubnetIds) subnetIds.push(...String(outputs.PrivateSubnetIds).split(','));

        if (subnetIds.length === 0) {
          const subs = await ec2Client.send(
            new DescribeSubnetsCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] })
          );
          subnetIds = (subs.Subnets ?? []).map((s) => s.SubnetId!).filter(Boolean);
        }
        if (subnetIds.length === 0) throw new Error('No subnets found in VPC');

        const resp = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
        const azs = new Set(resp.Subnets?.map((s) => s.AvailabilityZone));
        expect(azs.size).toBeGreaterThanOrEqual(2);
      },
      testTimeout
    );
  });

  // ---------- LOAD BALANCER ----------
  describe('Load Balancer Integration Tests', () => {
    test(
      'ALB should be accessible and properly configured',
      async () => {
        const alb = await getAlbByDnsOrThrow();

        expect(alb.State?.Code).toBe('active');
        expect(alb.Type).toBe('application');
        expect(alb.Scheme).toBe('internet-facing');
        expect(alb.IpAddressType).toBe('ipv4');
      },
      testTimeout
    );

    test(
      'Target groups attached to ALB have healthy HTTP checks',
      async () => {
        const alb = await getAlbByDnsOrThrow();

        const tgs = await elbClient.send(
          new DescribeTargetGroupsCommand({ LoadBalancerArn: alb.LoadBalancerArn })
        );
        const groups = tgs.TargetGroups ?? [];
        if (groups.length === 0) throw new Error('No target groups attached to ALB');

        for (const tg of groups) {
          expect(tg.HealthCheckProtocol).toBe('HTTP');
          expect(tg.HealthCheckPath).toBe('/health');
        }
      },
      testTimeout
    );
  });

  // ---------- RDS ----------
  describe('RDS Database Integration Tests', () => {
    test(
      'RDS instance should be encrypted and multi-AZ',
      async () => {
        if (!outputs.RDSEndpoint) throw new Error('RDSEndpoint output missing');
        const dbInstanceId = String(outputs.RDSEndpoint).split('.')[0];

        const response = await rdsClient.send(
          new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceId })
        );
        expect(response.DBInstances?.length).toBe(1);

        const db = response.DBInstances![0];
        expect(db.DBInstanceStatus).toBe('available');
        expect(db.StorageEncrypted).toBe(true);
        expect(db.MultiAZ).toBe(true);
        expect(db.PubliclyAccessible).toBe(false);
        expect(db.BackupRetentionPeriod).toBeGreaterThan(0);
      },
      testTimeout
    );

    test(
      'RDS should have proper engine and version',
      async () => {
        if (!outputs.RDSEndpoint) throw new Error('RDSEndpoint output missing');
        const dbInstanceId = String(outputs.RDSEndpoint).split('.')[0];

        const response = await rdsClient.send(
          new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceId })
        );
        const db = response.DBInstances![0];

        expect(db.Engine).toBe('mysql');
        expect(db.EngineVersion).toMatch(/^8\.0\./);
      },
      testTimeout
    );
  });

  // ---------- S3 ----------
  describe('S3 Bucket Security Tests', () => {
    test(
      'Logging bucket has KMS encryption and public access block',
      async () => {
        if (!outputs.CloudTrailArn) throw new Error('CloudTrailArn output missing');
        const trailName = String(outputs.CloudTrailArn).split('/').pop()!;
        const trails = await cloudTrailClient.send(
          new DescribeTrailsCommand({ trailNameList: [trailName] })
        );
        const trail = trails.trailList?.[0];
        if (!trail?.S3BucketName) throw new Error('CloudTrail S3 bucket not found via DescribeTrails');

        const bucket = trail.S3BucketName;

        const enc = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
        const rule = enc.ServerSideEncryptionConfiguration?.Rules?.[0];
        expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');

        const pab = await s3Client.send(new GetPublicAccessBlockCommand({ Bucket: bucket }));
        expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
        expect(pab.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
        expect(pab.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
        expect(pab.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
      },
      testTimeout
    );
  });

  // ---------- KMS ----------
  describe('KMS Encryption Tests', () => {
    test(
      'KMS key has rotation enabled and is active',
      async () => {
        if (!outputs.KMSKeyArn) throw new Error('KMSKeyArn output missing');

        const rotation = await kmsClient.send(
          new GetKeyRotationStatusCommand({ KeyId: outputs.KMSKeyArn })
        );
        expect(rotation.KeyRotationEnabled).toBe(true);

        const described = await kmsClient.send(
          new DescribeKeyCommand({ KeyId: outputs.KMSKeyArn })
        );
        expect(described.KeyMetadata?.KeyState).toBe('Enabled');
        expect(described.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      },
      testTimeout
    );
  });

  // ---------- WAF ----------
  describe('WAF Protection Tests', () => {
    test(
      'WAF Web ACL has required rules',
      async () => {
        if (!outputs.WAFWebACLArn) throw new Error('WAFWebACLArn output missing');

        const webACLId = String(outputs.WAFWebACLArn).split('/').pop()!;
        const response = await wafClient.send(
          new GetWebACLCommand({
            Scope: 'REGIONAL',
            Id: webACLId,
            Name: 'ProductionWebACL',
          })
        );

        const rules = response.WebACL?.Rules ?? [];
        expect(rules.length).toBeGreaterThan(0);

        const rateLimitRule = rules.find((r) => r.Name === 'RateLimitRule');
        expect(rateLimitRule).toBeDefined();
      },
      testTimeout
    );
  });

  // ---------- BACKUP ----------
  describe('Backup and Disaster Recovery Tests', () => {
    test(
      'AWS Backup plan exists and is named Production*',
      async () => {
        if (!outputs.BackupPlanId) throw new Error('BackupPlanId output missing');

        const response = await backupClient.send(new ListBackupPlansCommand({}));
        const ourPlan = response.BackupPlansList?.find(
          (p) => p.BackupPlanId === outputs.BackupPlanId
        );

        if (!ourPlan) throw new Error('Backup plan not found by ID');
        expect(ourPlan.BackupPlanName).toContain('Production');
      },
      testTimeout
    );
  });

  // ---------- IAM ----------
  describe('IAM and Security Compliance Tests', () => {
    test(
      'EC2 instance role exists and has CloudWatchAgent policy',
      async () => {
        // 1) Find the launch template defined in your stack
        const lt = await ec2Client.send(
          new DescribeLaunchTemplatesCommand({
            LaunchTemplateNames: ['ProductionAppLaunchTemplate'],
          })
        );
        const ltId = lt.LaunchTemplates?.[0]?.LaunchTemplateId;
        if (!ltId) throw new Error('Launch template "ProductionAppLaunchTemplate" not found');

        // 2) Read the latest version to get the Instance Profile ARN
        const ltv = await ec2Client.send(
          new DescribeLaunchTemplateVersionsCommand({
            LaunchTemplateId: ltId,
            Versions: ['$Latest'],
          })
        );
        const ipArn = ltv.LaunchTemplateVersions?.[0]?.LaunchTemplateData?.IamInstanceProfile?.Arn;
        if (!ipArn) throw new Error('IamInstanceProfile ARN not set on the launch template');

        // 3) Resolve the instance profile name from its ARN
        const instanceProfileName = ipArn.split('/').pop();
        if (!instanceProfileName) throw new Error('Could not parse Instance Profile name from ARN');

        // 4) Get the instance profile to discover the actual role name
        const ip = await iamClient.send(
          new GetInstanceProfileCommand({ InstanceProfileName: instanceProfileName })
        );
        const roleName = ip.InstanceProfile?.Roles?.[0]?.RoleName;
        if (!roleName) throw new Error('No role attached to the Instance Profile');

        // 5) Assert the CloudWatchAgent policy is attached to that role
        const policies = await iamClient.send(
          new ListAttachedRolePoliciesCommand({ RoleName: roleName })
        );
        const arns = policies.AttachedPolicies?.map((p) => p.PolicyArn) || [];
        const hasCwAgent =
          arns.some((arn) => arn?.includes('CloudWatchAgentServerPolicy')) ||
          arns.some((arn) => arn?.includes('CloudWatchAgent'));
        expect(hasCwAgent).toBe(true);

        // Sanity: trust policy exists
        const role = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
        expect(role.Role?.AssumeRolePolicyDocument).toBeDefined();
      },
      testTimeout
    );
  });

  // ---------- MONITORING ----------
  describe('Monitoring and Logging Tests', () => {
    test(
      'CloudTrail is active, multi-region, and logging',
      async () => {
        if (!outputs.CloudTrailArn) throw new Error('CloudTrailArn output missing');
        const trailName = String(outputs.CloudTrailArn).split('/').pop()!;

        const describe = await cloudTrailClient.send(
          new DescribeTrailsCommand({ trailNameList: [trailName] })
        );
        expect(describe.trailList?.length).toBe(1);
        const trail = describe.trailList![0];
        expect(trail.IsMultiRegionTrail).toBe(true);
        expect(trail.LogFileValidationEnabled).toBe(true);

        const status = await cloudTrailClient.send(
          new GetTrailStatusCommand({ Name: outputs.CloudTrailArn })
        );
        expect(status.IsLogging).toBe(true);
      },
      testTimeout
    );

    test(
      'Config recorder exists and records all/global resources',
      async () => {
        const response = await configClient.send(
          new DescribeConfigurationRecordersCommand({})
        );
        const productionRecorder =
          response.ConfigurationRecorders?.find((r) => r.name?.includes('Production')) ??
          response.ConfigurationRecorders?.[0];

        if (!productionRecorder) throw new Error('No AWS Config recorder found');
        expect(productionRecorder.recordingGroup?.allSupported).toBe(true);
        expect(productionRecorder.recordingGroup?.includeGlobalResourceTypes).toBe(true);
      },
      testTimeout
    );
  });

  // ---------- LAMBDA ----------
  describe('Lambda Function Tests', () => {
    test(
      'Key rotation Lambda is deployed and configured',
      async () => {
        const functionNames = [
          'AccessKeyRotationChecker',
          `AccessKeyRotationChecker-${environmentSuffix}`,
        ];

        let found = false;
        for (const name of functionNames) {
          try {
            const fn = await lambdaClient.send(
              new GetFunctionCommand({ FunctionName: name })
            );
            expect(fn.Configuration?.Runtime).toBe('python3.11');
            expect(fn.Configuration?.Timeout).toBe(60);
            expect(fn.Configuration?.Environment?.Variables?.SNS_TOPIC_ARN).toBeDefined();
            expect(
              fn.Configuration?.Environment?.Variables?.ENFORCE_ROTATION
            ).toBeDefined();
            found = true;
            break;
          } catch {
            // try next
          }
        }
        if (!found) throw new Error('Key rotation Lambda not found by expected names');
      },
      testTimeout
    );
  });

  // ---------- SNS ----------
  describe('SNS Topic Tests', () => {
    test(
      'SNS topic "ProductionSecurityAlerts" exists and is KMS-encrypted',
      async () => {
        const topicArn =
          (Object.values(outputs).find(
            (v: any) => typeof v === 'string' && v.includes('arn:aws:sns') && v.includes('Production')
          ) as string | undefined) ?? (await findSnsTopicArnByDisplayName('ProductionSecurityAlerts'));

        const response = await snsClient.send(
          new GetTopicAttributesCommand({ TopicArn: topicArn })
        );
        expect(response.Attributes?.DisplayName).toBe('ProductionSecurityAlerts');
        expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
      },
      testTimeout
    );
  });

  // ---------- END-TO-END ----------
  describe('End-to-End Security Workflow Tests', () => {
    test(
      'Critical outputs are present (sanity)',
      async () => {
        for (const key of ['VPCId', 'LoadBalancerDNS', 'RDSEndpoint', 'KMSKeyArn', 'WAFWebACLArn', 'CloudTrailArn', 'BackupPlanId']) {
          if (!outputs[key]) throw new Error(`Missing critical output: ${key}`);
        }
      },
      testTimeout
    );
  });
});
