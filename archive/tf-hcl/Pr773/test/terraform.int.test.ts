import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { S3Client, GetBucketEncryptionCommand } from '@aws-sdk/client-s3';

/* ----------------------------- Utilities ----------------------------- */

// Defines the structure of the JSON output from `terraform output -json`
type TfOutputValue<T> = { sensitive: boolean; type: any; value: T };
type PrimaryRegionDetails = {
  primary_data_bucket: string;
  rds_instance_identifier: string;
  ec2_instance_id: string;
  ec2_security_group_id: string;
  rds_security_group_id: string;
};
type StructuredOutputs = {
  primary_region_details?: TfOutputValue<PrimaryRegionDetails>;
};

// Reads, parses, and validates the outputs from the JSON file
function readStructuredOutputs() {
  const p = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');
  if (!fs.existsSync(p)) throw new Error(`Outputs file not found at ${p}`);
  const out = JSON.parse(fs.readFileSync(p, 'utf8')) as StructuredOutputs;

  // FIX: Read from the nested primary_region_details object
  const details = out.primary_region_details?.value;
  if (!details) throw new Error('primary_region_details missing in outputs');

  const s3BucketName = details.primary_data_bucket;
  const rdsInstanceId = details.rds_instance_identifier;
  const ec2InstanceId = details.ec2_instance_id;
  const ec2SgId = details.ec2_security_group_id;
  const rdsSgId = details.rds_security_group_id;

  if (!s3BucketName)
    throw new Error(
      'primary_data_bucket missing in primary_region_details output'
    );
  if (!rdsInstanceId)
    throw new Error(
      'rds_instance_identifier missing in primary_region_details output'
    );
  if (!ec2InstanceId)
    throw new Error('ec2_instance_id missing in primary_region_details output');
  if (!ec2SgId)
    throw new Error(
      'ec2_security_group_id missing in primary_region_details output'
    );
  if (!rdsSgId)
    throw new Error(
      'rds_security_group_id missing in primary_region_details output'
    );

  return { s3BucketName, rdsInstanceId, ec2InstanceId, ec2SgId, rdsSgId };
}

function assertDefined<T>(v: T | undefined | null, msg: string): T {
  if (v === undefined || v === null) throw new Error(msg);
  return v;
}

/* ----------------------------- Tests ----------------------------- */

describe('LIVE: Terraform Infrastructure Integration Tests', () => {
  const TEST_TIMEOUT = 120_000; // 2 minutes per test
  const outputs = readStructuredOutputs();

  // Define clients for the primary region
  const ec2Client = new EC2Client({ region: 'us-east-1' });
  const rdsClient = new RDSClient({ region: 'us-east-1' });
  const s3Client = new S3Client({ region: 'us-east-1' });

  afterAll(async () => {
    try {
      ec2Client.destroy();
    } catch {}
    try {
      rdsClient.destroy();
    } catch {}
    try {
      s3Client.destroy();
    } catch {}
  });

  test(
    'EC2 instance should be running, private, t3.micro, and enforce IMDSv2',
    async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.ec2InstanceId],
      });
      const res = await ec2Client.send(command);

      const instance = assertDefined(
        res.Reservations?.[0]?.Instances?.[0],
        `EC2 instance ${outputs.ec2InstanceId} not found.`
      );

      expect(instance.State?.Name).toBe('running');
      expect(instance.InstanceType).toBe('t3.micro');
      expect(instance.PublicIpAddress).toBeUndefined(); // Verify it's in a private subnet

      // Verify IMDSv2 is enforced
      const metadataOptions = assertDefined(
        instance.MetadataOptions,
        'MetadataOptions not found.'
      );
      expect(metadataOptions.HttpTokens).toBe('required');
    },
    TEST_TIMEOUT
  );

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
      expect(ingressRules.length).toBe(1);

      const rule = ingressRules[0];
      expect(rule.FromPort).toBe(5432);
      expect(rule.IpProtocol).toBe('tcp');

      const sourceGroups = rule.UserIdGroupPairs || [];
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
    },
    TEST_TIMEOUT
  );
});
