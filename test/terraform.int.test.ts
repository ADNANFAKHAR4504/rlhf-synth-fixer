// test/tap_stack.live.int.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
  GetInstanceProfileCommand,
} from '@aws-sdk/client-iam';
import {
  Route53Client,
  ListHostedZonesByNameCommand,
  ListResourceRecordSetsCommand,
} from '@aws-sdk/client-route-53';
import {
  SecretsManagerClient,
  ListSecretsCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudWatchClient,
  ListDashboardsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  ListTopicsCommand,
} from '@aws-sdk/client-sns';
import dns from 'dns/promises';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const tfOutputs = JSON.parse(readFileSync(outputsPath, 'utf8'));

// -----------------------------
// AWS Clients
// -----------------------------
const region = 'us-east-1';
const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const iam = new IAMClient({ region });
const route53 = new Route53Client({ region });
const secrets = new SecretsManagerClient({ region });
const cloudwatch = new CloudWatchClient({ region });
const sns = new SNSClient({ region });

// -----------------------------
// Integration Tests
// -----------------------------
describe('TAP Stack Live Integration Tests (us-east-1)', () => {

  // -----------------------------
  // Networking
  // -----------------------------
  describe('VPC & Networking', () => {
    it('NAT Gateway exists and is available', async () => {
      const natResp = await ec2.send(new DescribeNatGatewaysCommand({}));
      const found = natResp.NatGateways?.some(gw => gw.State === 'available');
      expect(found).toBe(true);
    });

    it('Internet Gateway exists and is attached', async () => {
      const igwResp = await ec2.send(new DescribeInternetGatewaysCommand({}));
      const attached = igwResp.InternetGateways?.some(
        igw => igw.Attachments?.some(a => a.State === 'available')
      );
      expect(attached).toBe(true);
    });
  });

  // -----------------------------
  // IAM Roles
  // -----------------------------
  describe('IAM Roles & Instance Profiles', () => {
    it('Elastic Beanstalk EC2 role exists', async () => {
      const roleName = tfOutputs.iam_role_eb_ec2_arn.split('/').pop();
      const role = await iam.send(new GetRoleCommand({ RoleName: roleName! }));
      expect(role.Role?.Arn).toBe(tfOutputs.iam_role_eb_ec2_arn);
    });

    it('Elastic Beanstalk EC2 role has attached policies', async () => {
      const roleName = tfOutputs.iam_role_eb_ec2_arn.split('/').pop();
      const policies = await iam.send(new ListAttachedRolePoliciesCommand({ RoleName: roleName! }));
      expect((policies.AttachedPolicies?.length ?? 0) > 0).toBe(true);
    });

    it('Instance profile exists', async () => {
      const profile = await iam.send(new GetInstanceProfileCommand({
        InstanceProfileName: tfOutputs.iam_instance_profile_name
      }));
      expect(profile.InstanceProfile?.InstanceProfileName).toBe(tfOutputs.iam_instance_profile_name);
    });
  });

  // -----------------------------
  // Route53
  // -----------------------------
  describe('Route53 Configuration', () => {
 
    it('DNS A record resolves correctly', async () => {
      const url = new URL(tfOutputs.website_url);
      const lookup = await dns.lookup(url.hostname);
      expect(lookup.address).toMatch(/\d+\.\d+\.\d+\.\d+/);
    });
  });

  // -----------------------------
  // Secrets Manager
  // -----------------------------
  describe('Secrets Manager', () => {
    it('At least one RDS credentials secret exists', async () => {
      const secretsList = await secrets.send(new ListSecretsCommand({}));
      const found = secretsList.SecretList?.some(s =>
        s.Name?.toLowerCase().includes('rds') || s.Name?.toLowerCase().includes('db')
      );
      expect(found).toBe(true);
    });
  });

  // -----------------------------
  // Monitoring
  // -----------------------------
  describe('Monitoring & Alerts', () => {
    it('CloudWatch dashboard exists', async () => {
      const dashboards = await cloudwatch.send(new ListDashboardsCommand({}));
      const found = dashboards.DashboardEntries?.some(
        d => d.DashboardName === tfOutputs.cloudwatch_dashboard_name
      );
      expect(found).toBe(true);
    });

    it('SNS topic list contains at least one valid topic', async () => {
      const topics = await sns.send(new ListTopicsCommand({}));
      expect((topics.Topics?.length ?? 0) > 0).toBe(true);
    });
  });
});
