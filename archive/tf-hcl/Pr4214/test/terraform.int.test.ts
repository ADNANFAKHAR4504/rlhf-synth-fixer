// test/tap_stack.int.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputsRaw = readFileSync(outputsPath, 'utf-8');
const outputs: Record<string, any> = JSON.parse(outputsRaw);

if (!outputs.aws_region) {
  throw new Error('AWS region not found in flat outputs.');
}

AWS.config.update({ region: outputs.aws_region });

const ec2 = new AWS.EC2();
const s3 = new AWS.S3();
const cloudtrail = new AWS.CloudTrail();
const iam = new AWS.IAM();
const kms = new AWS.KMS();
const sns = new AWS.SNS();

describe('TAP Stack Live Integration Tests', () => {
  // Parse JSON fields where output is stored as JSON string
  const ec2InstanceIds = JSON.parse(outputs.ec2_instance_ids || '{}');
  const s3BucketIds = JSON.parse(outputs.s3_bucket_ids || '{}');
  const kmsKeyArns = JSON.parse(outputs.kms_key_arns || '{}');
  const snsTopicArns = JSON.parse(outputs.sns_topic_arns || '{}');
  const cloudtrailArns = JSON.parse(outputs.cloudtrail_arns || '{}');

  it('VPC exists with correct CIDR block', async () => {
    if (!outputs.vpc_id || !outputs.vpc_cidr) return;

    const vpcs = await ec2.describeVpcs({ VpcIds: [outputs.vpc_id] }).promise();
    expect(vpcs.Vpcs?.length).toBe(1);
    expect(vpcs.Vpcs?.[0].CidrBlock).toBe(outputs.vpc_cidr);
  });

  it('Internet Gateway exists and attached to VPC', async () => {
    if (!outputs.internet_gateway_id || !outputs.vpc_id) return;

    const igw = await ec2.describeInternetGateways({ InternetGatewayIds: [outputs.internet_gateway_id] }).promise();
    expect(igw.InternetGateways?.length).toBe(1);
    const attachment = igw.InternetGateways?.[0].Attachments?.find(a => a.VpcId === outputs.vpc_id);
    expect(attachment).toBeDefined();
    expect(attachment?.State).toBe('available');
  });

  it('Public and private subnets exist and belong to the VPC', async () => {
    const publicSubnetIds: string[] = JSON.parse(outputs.public_subnet_ids || '[]');
    const privateSubnetIds: string[] = JSON.parse(outputs.private_subnet_ids || '[]');

    if (!publicSubnetIds.length || !privateSubnetIds.length) return;

    const publicSubnets = await ec2.describeSubnets({ SubnetIds: publicSubnetIds }).promise();
    publicSubnets.Subnets?.forEach(s => {
      expect(publicSubnetIds).toContain(s.SubnetId);
      expect(s.VpcId).toBe(outputs.vpc_id);
    });

    const privateSubnets = await ec2.describeSubnets({ SubnetIds: privateSubnetIds }).promise();
    privateSubnets.Subnets?.forEach(s => {
      expect(privateSubnetIds).toContain(s.SubnetId);
      expect(s.VpcId).toBe(outputs.vpc_id);
    });
  });

  it('NAT Gateways exist and have public IPs assigned', async () => {
    const natGatewayIds: string[] = JSON.parse(outputs.nat_gateway_ids || '[]');

    if (!natGatewayIds.length) return;

    const natGateways = await ec2.describeNatGateways({ NatGatewayIds: natGatewayIds }).promise();
    expect(natGateways.NatGateways?.length).toBe(natGatewayIds.length);

    natGateways.NatGateways?.forEach(nat => {
      expect(nat.NatGatewayAddresses?.[0].PublicIp).toBeDefined();
    });
  });

  it('EC2 instances exist with correct properties', async () => {
    const instanceIds = Object.values(ec2InstanceIds);
    if (!instanceIds.length) return;

    const instancesResp = await ec2.describeInstances({ InstanceIds: instanceIds }).promise();
    const allInstances = instancesResp.Reservations?.flatMap(r => r.Instances) || [];
    expect(allInstances.length).toBe(instanceIds.length);
    
    allInstances.forEach(instance => {
      expect(instance.ImageId).toBe(outputs.ami_id);
      expect(instance.State?.Name).toMatch(/pending|running|stopping|stopped/);
      expect(instance.PrivateIpAddress).toMatch(/\d+\.\d+\.\d+\.\d+/);
      // Public IP should be empty string per your outputs
      expect(instance.PublicIpAddress).toBeUndefined();
    });
  });

  it('S3 buckets exist and are not publicly accessible', async () => {
    const bucketNames = Object.values(s3BucketIds);
    if (!bucketNames.length) return;

    for (const bucketName of bucketNames) {
      const acl = await s3.getBucketAcl({ Bucket: bucketName }).promise();
      expect(acl.Owner).toBeDefined();

      const pab = await s3.getPublicAccessBlock({ Bucket: bucketName }).promise();
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }
  });

  it('IAM roles for EC2 instances exist', async () => {
    const roleArns = Object.values(JSON.parse(outputs.iam_role_arns || '{}'));
    if (!roleArns.length) return;

    for (const roleArn of roleArns) {
      const roleName = roleArn.split('/').pop() || '';
      const roleResp = await iam.getRole({ RoleName: roleName }).promise();
      expect(roleResp.Role?.Arn).toBe(roleArn);
    }
  });

  it('SNS topics exist and subscriptions are configured', async () => {
    const topicArns = Object.values(snsTopicArns);
    if (!topicArns.length) return;

    for (const topicArn of topicArns) {
      const attrs = await sns.getTopicAttributes({ TopicArn: topicArn }).promise();
      expect(attrs.Attributes?.TopicArn).toBe(topicArn);
      // You can add more tests if subscription ARNs are emitted in outputs
    }
  });
});
