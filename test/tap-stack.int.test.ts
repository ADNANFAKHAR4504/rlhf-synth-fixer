import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  GetBucketLocationCommand,
} from '@aws-sdk/client-s3';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import { config as awsConfig } from 'aws-sdk';

describe('TapStack Infrastructure Integration Tests', () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let bucketName: string;
  let dbInstanceIdentifier: string;

  beforeAll(() => {
    // Set AWS region
    awsConfig.update({ region: 'us-east-1' });

    const stackOutputs: { [key: string]: string } = {
      vpcId: process.env.VPC_ID || '',
      publicSubnetIds: process.env.PUBLIC_SUBNET_IDS || '',
      privateSubnetIds: process.env.PRIVATE_SUBNET_IDS || '',
      bucketName: process.env.BUCKET_NAME || '',
      dbInstanceIdentifier: process.env.DB_INSTANCE_IDENTIFIER || '',
    };

    vpcId = stackOutputs['vpcId'];
    publicSubnetIds = stackOutputs['publicSubnetIds']
      ?.split(',')
      .map((s: string) => s.trim()) || [];
    privateSubnetIds = stackOutputs['privateSubnetIds']
      ?.split(',')
      .map((s: string) => s.trim()) || [];
    bucketName = stackOutputs['bucketName'];
    dbInstanceIdentifier = stackOutputs['dbInstanceIdentifier'];
  });

  test('VPC exists', async () => {
    const ec2 = new EC2Client({ region: 'us-east-1' });
    const vpcResponse = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(vpcResponse.Vpcs?.length).toBe(1);
  });

  test('Public subnets exist', async () => {
    const ec2 = new EC2Client({ region: 'us-east-1' });
    const subnetResponse = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds }));
    expect(subnetResponse.Subnets?.length).toBe(publicSubnetIds.length);
  });

  test('Private subnets exist', async () => {
    const ec2 = new EC2Client({ region: 'us-east-1' });
    const subnetResponse = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds }));
    expect(subnetResponse.Subnets?.length).toBe(privateSubnetIds.length);
  });

  test('S3 bucket exists', async () => {
    const s3 = new S3Client({ region: 'us-east-1' });
    const bucketResponse = await s3.send(new GetBucketLocationCommand({ Bucket: bucketName }));
    expect(bucketResponse).toBeDefined();
  });

  test('RDS instance exists', async () => {
    const rds = new RDSClient({ region: 'us-east-1' });
    const dbResponse = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceIdentifier }));
    expect(dbResponse.DBInstances?.length).toBe(1);
  });
});
