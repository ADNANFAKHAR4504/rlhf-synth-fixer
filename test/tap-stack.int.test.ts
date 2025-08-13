import AWS from 'aws-sdk';
import { execSync } from 'child_process';

describe('TapStack Integration Tests', () => {
  let outputs: Record<string, any>;
  const region = process.env.AWS_REGION || 'us-east-1';

  beforeAll(() => {
    // Run terraform output -json and parse
    const outputJson = execSync('terraform output -json', { encoding: 'utf-8' });
    outputs = JSON.parse(outputJson);
  });

  test('VPC exists', async () => {
    const ec2 = new AWS.EC2({ region });
    const vpcId = outputs.vpc_id.value;
    const result = await ec2.describeVpcs({ VpcIds: [vpcId] }).promise();
    expect(result.Vpcs?.length).toBeGreaterThan(0);
  });

  test('Public subnets exist', async () => {
    const ec2 = new AWS.EC2({ region });
    const subnets = outputs.public_subnet_ids.value;
    const result = await ec2.describeSubnets({ SubnetIds: subnets }).promise();
    expect(result.Subnets?.length).toBe(subnets.length);
  });

  test('Private subnets exist', async () => {
    const ec2 = new AWS.EC2({ region });
    const subnets = outputs.private_subnet_ids.value;
    const result = await ec2.describeSubnets({ SubnetIds: subnets }).promise();
    expect(result.Subnets?.length).toBe(subnets.length);
  });

  test('State bucket exists', async () => {
    const s3 = new AWS.S3({ region });
    const bucketName = outputs.state_bucket_name.value;
    const result = await s3.headBucket({ Bucket: bucketName }).promise();
    expect(result).toBeDefined();
  });

  test('State bucket ARN format is valid', () => {
    const bucketArn = outputs.state_bucket_arn.value;
    expect(bucketArn).toMatch(/^arn:aws:s3:::[a-z0-9.\-_]{3,63}$/);
  });

  test('EC2 IAM role exists', async () => {
    const iam = new AWS.IAM();
    const roleName = outputs.ec2_role_name.value;
    const result = await iam.getRole({ RoleName: roleName }).promise();
    expect(result.Role?.RoleName).toBe(roleName);
  });
});
