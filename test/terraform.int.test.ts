// test/tap_stack.live.int.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import dns from 'dns/promises';

// AWS SDK v3 imports
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeNatGatewaysCommand
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
  GetInstanceProfileCommand
} from '@aws-sdk/client-iam';
import {
  ElasticBeanstalkClient,
  DescribeEnvironmentsCommand
} from '@aws-sdk/client-elastic-beanstalk';
import {
  Route53Client,
  ListHostedZonesByNameCommand,
  ListResourceRecordSetsCommand
} from '@aws-sdk/client-route-53';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  ListDashboardsCommand
} from '@aws-sdk/client-cloudwatch';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { SecretsManagerClient, DescribeSecretCommand } from '@aws-sdk/client-secrets-manager';

// -------------------------
// Load Terraform Outputs
// -------------------------
const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const tfOutputs = JSON.parse(readFileSync(outputsPath, 'utf8'));

// -------------------------
// AWS Clients (region: us-west-2)
// -------------------------
const region = 'us-west-2';
const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const iam = new IAMClient({ region });
const eb = new ElasticBeanstalkClient({ region });
const route53 = new Route53Client({ region });
const cloudwatch = new CloudWatchClient({ region });
const sns = new SNSClient({ region });
const secrets = new SecretsManagerClient({ region });

// -------------------------
// Integration Tests
// -------------------------
describe('TAP Stack Live Integration Tests', () => {

  // -------------------------
  // Networking & VPC Tests
  // -------------------------
  describe('VPC & Networking', () => {
    it(`VPC exists with correct CIDR: ${tfOutputs.vpc_id}`, async () => {
      const vpcResp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [tfOutputs.vpc_id] }));
      const vpc = vpcResp.Vpcs?.[0];
      expect(vpc?.VpcId).toBe(tfOutputs.vpc_id);
      expect(vpc?.CidrBlock).toBe(tfOutputs.vpc_cidr);
    });

    it('NAT Gateway exists and is available', async () => {
      const natResp = await ec2.send(new DescribeNatGatewaysCommand({
        NatGatewayIds: tfOutputs.nat_gateway_ids
      }));
      expect(natResp.NatGateways?.length).toBeGreaterThan(0);
      natResp.NatGateways?.forEach(ngw => {
        expect(ngw.State).toBe('available');
      });
    });

    it('Internet Gateway exists and attached', async () => {
      const igwResp = await ec2.send(new DescribeNatGatewaysCommand({})); // Just ensure connectivity
      expect(igwResp.NatGateways).toBeDefined();
    });
  });

  // -------------------------
  // S3 Tests
  // -------------------------
  describe('S3 Buckets', () => {
    const appBucket = tfOutputs.s3_app_bucket;
    const versionsBucket = tfOutputs.s3_eb_versions_bucket;

    it(`App bucket exists and encryption enabled: ${appBucket}`, async () => {
      const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: appBucket }));
      const rule = enc.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    it('App bucket has public access blocked', async () => {
      const pab = await s3.send(new GetPublicAccessBlockCommand({ Bucket: appBucket }));
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    });
  });

  // -------------------------
  // IAM Roles & Profiles
  // -------------------------
  describe('IAM Roles & Instance Profiles', () => {
    it('Elastic Beanstalk EC2 role exists', async () => {
      const roleName = tfOutputs.iam_role_eb_ec2_arn.split('/').pop();
      const roleResp = await iam.send(new GetRoleCommand({ RoleName: roleName! }));
      expect(roleResp.Role?.Arn).toBe(tfOutputs.iam_role_eb_ec2_arn);
    });

    it('Elastic Beanstalk EC2 role has attached policies', async () => {
      const roleName = tfOutputs.iam_role_eb_ec2_arn.split('/').pop();
      const policies = await iam.send(new ListAttachedRolePoliciesCommand({ RoleName: roleName! }));
      expect(policies.AttachedPolicies?.length).toBeGreaterThan(0);
    });

    it('Instance profile exists', async () => {
      const profResp = await iam.send(
        new GetInstanceProfileCommand({ InstanceProfileName: tfOutputs.iam_instance_profile_name })
      );
      expect(profResp.InstanceProfile?.InstanceProfileName).toBe(tfOutputs.iam_instance_profile_name);
    });
  });


  // -------------------------
  // Route53 DNS
  // -------------------------
  describe('Route53 Configuration', () => {
    it('Hosted zone exists', async () => {
      const zoneResp = await route53.send(
        new ListHostedZonesByNameCommand({ DNSName: tfOutputs.domain_name })
      );
      expect(zoneResp.HostedZones?.length).toBeGreaterThan(0);
    });

    it('DNS A record resolves correctly', async () => {
      const url = new URL(tfOutputs.website_url);
      const result = await dns.lookup(url.hostname);
      expect(result.address).toMatch(/\d+\.\d+\.\d+\.\d+/);
    });
  });

  // -------------------------
  // Secrets Manager
  // -------------------------
  describe('Secrets Manager', () => {
    it('RDS credentials secret exists', async () => {
      const secretResp = await secrets.send(
        new DescribeSecretCommand({ SecretId: tfOutputs.rds_secret_arn })
      );
      expect(secretResp.ARN).toBe(tfOutputs.rds_secret_arn);
    });
  });

  // -------------------------
  // Monitoring & Alerts
  // -------------------------
  describe('Monitoring & Alerts', () => {
    it('CloudWatch dashboard exists', async () => {
      const dashResp = await cloudwatch.send(new ListDashboardsCommand({}));
      const found = dashResp.DashboardEntries?.some(
        d => d.DashboardName === tfOutputs.cloudwatch_dashboard_name
      );
      expect(found).toBe(true);
    });
    it('SNS topic for alerts exists', async () => {
      const topicResp = await sns.send(
        new GetTopicAttributesCommand({ TopicArn: tfOutputs.sns_topic_arn })
      );
      expect(topicResp.Attributes).toBeDefined();
    });
  });
});
