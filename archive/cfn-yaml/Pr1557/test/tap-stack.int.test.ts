import { DescribeSecurityGroupsCommand, DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetBucketEncryptionCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { DescribeSecretCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION || 'us-west-2';

describe('TapStack Integration Tests - Deployed AWS Resources', () => {
  test('VPC exists and is available', async () => {
    const vpcId = outputs.VpcId;
    expect(vpcId).toMatch(/^vpc-/);
    const ec2 = new EC2Client({ region });
    const vpcResp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(vpcResp.Vpcs?.[0]?.State).toBe('available');
  });

  test('S3 bucket exists and is accessible', async () => {
    const bucketName = outputs.S3BucketName;
    expect(bucketName).toBeDefined();
    const s3 = new S3Client({ region });
    await expect(s3.send(new HeadBucketCommand({ Bucket: bucketName }))).resolves.not.toThrow();
  });

  test('S3 bucket has KMS encryption enabled', async () => {
    const bucketName = outputs.S3BucketName;
    const s3 = new S3Client({ region });
    const encResp = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
    const rules = encResp.ServerSideEncryptionConfiguration?.Rules || [];
    const kmsRule = rules.find(
      (rule: any) => rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === 'aws:kms'
    );
    expect(kmsRule).toBeDefined();
  });

  test('RDS instance endpoint exists', async () => {
    const dbEndpoint = outputs.DatabaseEndpoint;
    expect(dbEndpoint).toBeDefined();
    const rds = new RDSClient({ region });
    const dbs = await rds.send(new DescribeDBInstancesCommand({}));
    const found = dbs.DBInstances?.some(
      (db: any) => db.Endpoint?.Address === dbEndpoint
    );
    expect(found).toBe(true);
  });

  test('Private subnets are in different AZs', async () => {
    const ec2 = new EC2Client({ region });
    const subnetIds = [outputs.PrivateSubnet1, outputs.PrivateSubnet2].filter(Boolean);
    expect(subnetIds.length).toBe(2);
    const subnetsResp = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
    const azs = subnetsResp.Subnets?.map((subnet: any) => subnet.AvailabilityZone);
    expect(new Set(azs).size).toBe(2);
  });

  test('Web and DB security groups exist', async () => {
    const ec2 = new EC2Client({ region });
    const sgIds = [outputs.WebServerSecurityGroup, outputs.DatabaseSecurityGroup].filter(Boolean);
    expect(sgIds.length).toBe(2);
    const sgResp = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: sgIds }));
    expect(sgResp.SecurityGroups?.length).toBe(2);
  });

  test('Secrets Manager secret for DB credentials exists', async () => {
    const secretName = outputs.DBSecret;
    expect(secretName).toBeDefined();
    const secrets = new SecretsManagerClient({ region });
    const secretResp = await secrets.send(new DescribeSecretCommand({ SecretId: secretName }));
    // Compare the secret name with either the logical name or the ARN
    expect(
      secretResp.Name === secretName ||
      secretResp.ARN === secretName ||
      secretResp.ARN?.endsWith(secretName)
    ).toBe(true);
  });
});
