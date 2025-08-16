import * as fs from 'fs';
import * as path from 'path';
import { EC2Client, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { S3Client, GetBucketEncryptionCommand } from '@aws-sdk/client-s3';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import { CloudTrailClient, GetTrailCommand } from '@aws-sdk/client-cloudtrail';

/* ----------------------------- Utilities ----------------------------- */

// Defines the structure of the JSON output from `terraform output -json`
type TfOutputValue<T> = { sensitive: boolean; type: any; value: T };
type StructuredOutputs = {
  primary_region_vpc_id?: TfOutputValue<string>;
  primary_data_bucket_name?: TfOutputValue<string>;
  primary_rds_instance_identifier?: TfOutputValue<string>;
  primary_ec2_security_group_id?: TfOutputValue<string>;
  primary_rds_security_group_id?: TfOutputValue<string>;
  rds_password_secret_arn?: TfOutputValue<string>;
};

// Reads, parses, and validates the outputs from the JSON file
function readStructuredOutputs() {
  const p = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');
  if (!fs.existsSync(p)) throw new Error(`Outputs file not found at ${p}`);
  const out = JSON.parse(fs.readFileSync(p, 'utf8')) as StructuredOutputs;

  const vpcId = out.primary_region_vpc_id?.value;
  const s3BucketName = out.primary_data_bucket_name?.value;
  const rdsInstanceId = out.primary_rds_instance_identifier?.value;
  const ec2SgId = out.primary_ec2_security_group_id?.value;
  const rdsSgId = out.primary_rds_security_group_id?.value;
  const secretArn = out.rds_password_secret_arn?.value;

  if (!vpcId) throw new Error('primary_region_vpc_id missing in outputs');
  if (!s3BucketName)
    throw new Error('primary_data_bucket_name missing in outputs');
  if (!rdsInstanceId)
    throw new Error('primary_rds_instance_identifier missing in outputs');
  if (!ec2SgId)
    throw new Error('primary_ec2_security_group_id missing in outputs');
  if (!rdsSgId)
    throw new Error('primary_rds_security_group_id missing in outputs');
  if (!secretArn) throw new Error('rds_password_secret_arn missing in outputs');

  return { vpcId, s3BucketName, rdsInstanceId, ec2SgId, rdsSgId, secretArn };
}

function assertDefined<T>(v: T | undefined | null, msg: string): T {
  if (v === undefined || v === null) throw new Error(msg);
  return v;
}

/* ----------------------------- Tests ----------------------------- */

describe('LIVE: Terraform Infrastructure Integration Tests', () => {
  const TEST_TIMEOUT = 120_000; // 2 minutes per test
  const outputs = readStructuredOutputs();

  // Define clients for the primary region where most resources are
  const ec2Client = new EC2Client({ region: 'us-east-1' });
  const rdsClient = new RDSClient({ region: 'us-east-1' });
  const s3Client = new S3Client({ region: 'us-east-1' });
  const secretsClient = new SecretsManagerClient({ region: 'us-east-1' });
  const cloudTrailClient = new CloudTrailClient({ region: 'us-east-1' });

  afterAll(async () => {
    // Clean up SDK client connections
    try {
      ec2Client.destroy();
    } catch {}
    try {
      rdsClient.destroy();
    } catch {}
    try {
      s3Client.destroy();
    } catch {}
    try {
      secretsClient.destroy();
    } catch {}
    try {
      cloudTrailClient.destroy();
    } catch {}
  });

  test(
    'RDS instance should be Multi-AZ, encrypted, and in a private subnet',
    async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.rdsInstanceId,
      });
      const res = await rdsClient.send(command);
      const db = assertDefined(
        res.DBInstances?.[0],
        `RDS instance ${outputs.rdsInstanceId} not found.`
      );

      expect(db.MultiAZ).toBe(true);
      expect(db.StorageEncrypted).toBe(true);
      expect(db.PubliclyAccessible).toBe(false);
      expect(db.DBSubnetGroup).toBeDefined();
    },
    TEST_TIMEOUT
  );

  test(
    'RDS security group must only allow ingress from the EC2 security group on port 5432',
    async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.rdsSgId],
      });
      const res = await ec2Client.send(command);
      const sg = assertDefined(
        res.SecurityGroups?.[0],
        `RDS security group ${outputs.rdsSgId} not found.`
      );

      const ingressRules = sg.IpPermissions || [];
      expect(ingressRules.length).toBe(1); // Should have exactly one ingress rule

      const rule = ingressRules[0];
      expect(rule.FromPort).toBe(5432);
      expect(rule.ToPort).toBe(5432);
      expect(rule.IpProtocol).toBe('tcp');

      // Verify the rule's source is the EC2 security group, not an open CIDR block
      const sourceGroups = rule.UserIdGroupPairs || [];
      expect(sourceGroups.length).toBe(1);
      expect(sourceGroups[0].GroupId).toBe(outputs.ec2SgId);
      expect(rule.IpRanges?.length).toBe(0);
    },
    TEST_TIMEOUT
  );

  test(
    'Primary S3 data bucket must enforce KMS encryption',
    async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.s3BucketName,
      });
      const res = await s3Client.send(command);
      const encryptionRule = assertDefined(
        res.ServerSideEncryptionConfiguration?.Rules?.[0],
        'No server-side encryption rules found.'
      );

      expect(
        encryptionRule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');
      expect(
        encryptionRule.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID
      ).toBeDefined();
    },
    TEST_TIMEOUT
  );

  test(
    'Secrets Manager secret for RDS password must be replicated to the DR region',
    async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.secretArn,
      });
      const res = await secretsClient.send(command);
      const replicaRegions = (res.ReplicationStatus || []).map(r => r.Region);

      expect(res.PrimaryRegion).toBe('us-east-1');
      expect(replicaRegions).toContain('us-west-2');
    },
    TEST_TIMEOUT
  );

  test(
    'A multi-region CloudTrail trail must exist',
    async () => {
      // Because CloudTrail names are unique, we find it by looking for any multi-region trail.
      // A more specific test could use list-trails and filter by tags if needed.
      const command = new GetTrailCommand({ Name: 'nova-prod-audit-trail' });
      try {
        const res = await cloudTrailClient.send(command);
        const trail = assertDefined(res.Trail, 'CloudTrail not found.');
        expect(trail.IsMultiRegionTrail).toBe(true);
      } catch (error: any) {
        if (error.name === 'TrailNotFoundException') {
          fail(
            "The expected CloudTrail 'nova-prod-audit-trail' was not found."
          );
        }
        throw error;
      }
    },
    TEST_TIMEOUT
  );
});
