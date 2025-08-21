import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetBucketEncryptionCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);
const region = process.env.AWS_REGION || 'us-west-2';

describe('TapStack Integration Tests - Deployed AWS Resources', () => {
  test('VPC exists and is available', async () => {
    const vpcId = outputs.VPCId;
    expect(vpcId).toMatch(/^vpc-/);
    const ec2 = new EC2Client({ region });
    const vpcResp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(vpcResp.Vpcs?.[0]?.State).toBe('available');
  });

  test('Subnets exist and are in different AZs', async () => {
    const ec2 = new EC2Client({ region });
    const subnetIds = [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id].filter(Boolean);
    expect(subnetIds.length).toBe(2);
    const subnetsResp = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
    const azs = subnetsResp.Subnets?.map(subnet => subnet.AvailabilityZone);
    expect(new Set(azs).size).toBe(2);
  });

  test('S3 bucket exists and is accessible', async () => {
    const bucketName = outputs.ApplicationDataBucketName;
    expect(bucketName).toBeDefined();
    const s3 = new S3Client({ region });
    await expect(s3.send(new HeadBucketCommand({ Bucket: bucketName }))).resolves.not.toThrow();
  });

  test('S3 bucket has encryption enabled', async () => {
    const bucketName = outputs.ApplicationDataBucketName;
    const s3 = new S3Client({ region });
    const encResp = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
    const rules = encResp.ServerSideEncryptionConfiguration?.Rules || [];
    const hasAES256 = rules.some(
      rule => rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === 'AES256'
    );
    expect(hasAES256).toBe(true);
  });

  test('RDS instance endpoint exists', async () => {
    const dbEndpoint = outputs.DatabaseEndpoint;
    expect(dbEndpoint).toBeDefined();
    const rds = new RDSClient({ region });
    const dbs = await rds.send(new DescribeDBInstancesCommand({}));
    const found = dbs.DBInstances?.some(
      db => db.Endpoint?.Address === dbEndpoint
    );
    expect(found).toBe(true);
  });

  test('DynamoDB table exists and is active', async () => {
    const tableName = outputs.TurnAroundPromptTableName;
    expect(tableName).toBeDefined();
    const dynamodb = new DynamoDBClient({ region });
    const tableResp = await dynamodb.send(new DescribeTableCommand({ TableName: tableName }));
    expect(tableResp.Table?.TableStatus).toBe('ACTIVE');
    expect(tableResp.Table?.TableArn).toBe(outputs.TurnAroundPromptTableArn);
  });
});