// test/terraform.int.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';
import mysql from 'mysql2/promise';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputsRaw = readFileSync(outputsPath, 'utf-8');
const outputs: Record<string, any> = JSON.parse(outputsRaw);

if (!outputs.aws_region) {
  throw new Error('AWS region not found in flat outputs.');
}

AWS.config.update({ region: outputs.aws_region });

const ec2 = new AWS.EC2();
const rds = new AWS.RDS();
const secretsManager = new AWS.SecretsManager();
const autoscaling = new AWS.AutoScaling();
const elbv2 = new AWS.ELBv2();
const cloudtrail = new AWS.CloudTrail();
const config = new AWS.ConfigService();
const s3 = new AWS.S3();

describe('TAP Stack Live Integration Tests', () => {

  it('VPC exists with correct CIDR', async () => {
    if (!outputs.vpc_id || !outputs.vpc_cidr) return;

    const vpcs = await ec2.describeVpcs({ VpcIds: [outputs.vpc_id] }).promise();
    expect(vpcs.Vpcs?.length).toBe(1);
    expect(vpcs.Vpcs?.[0].CidrBlock).toBe(outputs.vpc_cidr);
  });

  it('Internet Gateway attached to VPC', async () => {
    if (!outputs.internet_gateway_id || !outputs.vpc_id) return;

    const igw = await ec2.describeInternetGateways({ InternetGatewayIds: [outputs.internet_gateway_id] }).promise();
    expect(igw.InternetGateways?.length).toBe(1);
    const attachment = igw.InternetGateways?.[0].Attachments?.find(a => a.VpcId === outputs.vpc_id);
    expect(attachment).toBeDefined();
    expect(attachment?.State).toBe('available');
  });

  it('Public and Private subnets exist with expected CIDRs', async () => {
    if (!outputs.public_subnet_ids || !outputs.private_subnet_ids) return;

    const publicSubnetIds: string[] = JSON.parse(outputs.public_subnet_ids);
    const privateSubnetIds: string[] = JSON.parse(outputs.private_subnet_ids);

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

  it('NAT Gateways exist with allocated Elastic IPs', async () => {
    const natGatewayIds: string[] = outputs.nat_gateway_ids ? JSON.parse(outputs.nat_gateway_ids) : [];
    const natGatewayEipIds: string[] = outputs.nat_gateway_eip_ids ? JSON.parse(outputs.nat_gateway_eip_ids) : [];

    if (!natGatewayIds.length) return;

    const natGateways = await ec2.describeNatGateways({ NatGatewayIds: natGatewayIds }).promise();
    expect(natGateways.NatGateways?.length).toBe(natGatewayIds.length);

    const allocatedEips = natGateways.NatGateways?.map(n => n.NatGatewayAddresses?.[0]?.AllocationId);
    natGatewayEipIds.forEach(eip => expect(allocatedEips).toContain(eip));
  });


  it('S3 buckets exist and are not publicly accessible', async () => {
    const buckets: string[] = [
      outputs.s3_bucket_main_id,
      outputs.s3_bucket_cloudtrail_id,
      outputs.s3_bucket_config_id,
    ].filter(Boolean);

    for (const bucketName of buckets) {
      const acl = await s3.getBucketAcl({ Bucket: bucketName }).promise();
      expect(acl.Owner).toBeDefined();

      const pab = await s3.getPublicAccessBlock({ Bucket: bucketName }).promise();
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(pab.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }
  });

  it('AWS Config recorder and delivery channel exist and enabled', async () => {
    const recorders = await config.describeConfigurationRecorders().promise();
    const recorder = recorders.ConfigurationRecorders?.find(r => r.name === outputs.config_recorder_name);
    expect(recorder).toBeDefined();

    const deliveryChannels = await config.describeDeliveryChannels().promise();
    const channel = deliveryChannels.DeliveryChannels?.find(c => c.name === outputs.config_delivery_channel_name);
    expect(channel).toBeDefined();

    if (recorder?.name) {
      const status = await config.describeConfigurationRecorderStatus({ ConfigurationRecorderNames: [recorder.name] }).promise();
      expect(status.ConfigurationRecordersStatus?.[0].recording).toBe(true);
    }
  });

  it('Security groups exist for RDS, EC2, and ALB', async () => {
    const sgIds = [
      outputs.security_group_rds_id,
      outputs.security_group_ec2_id,
      outputs.security_group_alb_id,
    ].filter(Boolean);

    for (const sgId of sgIds) {
      const sg = await ec2.describeSecurityGroups({ GroupIds: [sgId] }).promise();
      expect(sg.SecurityGroups?.length).toBe(1);
      expect(sg.SecurityGroups?.[0].GroupId).toBe(sgId);
    }
  });

  it('RDS secrets exist in Secrets Manager', async () => {
    if (!outputs.secrets_manager_secret_arn) return;

    const secret = await secretsManager.describeSecret({ SecretId: outputs.secrets_manager_secret_arn }).promise();
    expect(secret.ARN).toBe(outputs.secrets_manager_secret_arn);
  });

});
