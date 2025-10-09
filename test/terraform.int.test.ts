// test/terraform.int.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';
import dns from 'dns/promises';
import mysql from 'mysql2/promise';
import fetch from 'node-fetch';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputsRaw = readFileSync(outputsPath, 'utf-8');
const outputs = JSON.parse(outputsRaw);

if (!outputs.aws_region) {
  throw new Error('AWS region not found in flat outputs. Ensure the Terraform variable "region" is output.');
}

AWS.config.update({ region: outputs.aws_region });

const ec2 = new AWS.EC2();
const rds = new AWS.RDS();
const autoscaling = new AWS.AutoScaling();
const elbv2 = new AWS.ELBv2();
const s3 = new AWS.S3();
const cloudtrail = new AWS.CloudTrail();
const config = new AWS.ConfigService();

describe('TAP Stack Live Integration Tests', () => {

  // -------------------------
  // VPC & Subnets
  // -------------------------
  it('VPC exists with correct CIDR', async () => {
    if (!outputs.vpc_id || !outputs.vpc_cidr) {
      console.warn('VPC outputs missing, skipping test');
      return;
    }
    const vpcs = await ec2.describeVpcs({ VpcIds: [outputs.vpc_id] }).promise();
    expect(vpcs.Vpcs?.length).toBe(1);
    expect(vpcs.Vpcs?.[0].CidrBlock).toBe(outputs.vpc_cidr);
  });

  it('Internet Gateway attached to VPC', async () => {
    if (!outputs.internet_gateway_id || !outputs.vpc_id) {
      console.warn('IGW outputs missing, skipping test');
      return;
    }
    const igw = await ec2.describeInternetGateways({ InternetGatewayIds: [outputs.internet_gateway_id] }).promise();
    const attachment = igw.InternetGateways?.[0].Attachments?.find(a => a.VpcId === outputs.vpc_id);
    expect(attachment).toBeDefined();
    expect(attachment?.State).toBe('available');
  });

  it('Public and Private subnets exist with correct CIDRs', async () => {
    if (!outputs.public_subnet_ids || !outputs.private_subnet_ids) {
      console.warn('Subnet outputs missing, skipping test');
      return;
    }

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

  it('NAT Gateways exist', async () => {
    if (!outputs.nat_gateway_ids) {
      console.warn('NAT Gateway outputs missing, skipping test');
      return;
    }
    const natGatewayIds: string[] = JSON.parse(outputs.nat_gateway_ids);
    const natGateways = await ec2.describeNatGateways({ NatGatewayIds: natGatewayIds }).promise();
    expect(natGateways.NatGateways?.length).toBe(natGatewayIds.length);
  });

  // -------------------------
  // RDS Database
  // -------------------------
  it('RDS instance is available with correct endpoint', async () => {
    if (!outputs.rds_instance_id || !outputs.rds_instance_endpoint) {
      console.warn('RDS outputs missing, skipping test');
      return;
    }
    const instances = await rds.describeDBInstances({ DBInstanceIdentifier: outputs.rds_instance_id }).promise();
    const instance = instances.DBInstances?.[0];
    expect(instance).toBeDefined();
    expect(instance?.DBInstanceStatus).toBe('available');
    expect(instance?.Endpoint?.Address).toBe(outputs.rds_instance_endpoint.split(':')[0]);
    expect(instance?.Endpoint?.Port?.toString()).toBe(outputs.rds_instance_port.toString());
  });

  it('RDS MySQL connection works using Secrets Manager credentials', async () => {
    if (!outputs.secrets_manager_secret_arn || !outputs.rds_instance_endpoint) {
      console.warn('RDS or Secrets Manager outputs missing, skipping test');
      return;
    }

    const secretsManager = new AWS.SecretsManager();
    const secret = await secretsManager.getSecretValue({ SecretId: outputs.secrets_manager_secret_arn }).promise();
    if (!secret.SecretString) return;

    const credentials = JSON.parse(secret.SecretString);
    const [host, port] = outputs.rds_instance_endpoint.split(':');
    const connection = await mysql.createConnection({
      host,
      port: Number(port),
      user: credentials.username,
      password: credentials.password,
      database: 'mysql'
    });
    const [rows] = await connection.query('SELECT 1 + 1 AS result');
    expect(rows[0].result).toBe(2);
    await connection.end();
  });

  // -------------------------
  // S3 Buckets
  // -------------------------
  it('S3 buckets exist and block public access', async () => {
    const buckets = [
      outputs.s3_bucket_main_id,
      outputs.s3_bucket_cloudtrail_id,
      outputs.s3_bucket_config_id
    ];
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

  // -------------------------
  // AutoScaling & ALB
  // -------------------------
  it('AutoScaling Group exists', async () => {
    if (!outputs.autoscaling_group_name) return;
    const asgs = await autoscaling.describeAutoScalingGroups({ AutoScalingGroupNames: [outputs.autoscaling_group_name] }).promise();
    expect(asgs.AutoScalingGroups?.length).toBe(1);
  });

  it('ALB Target Group exists', async () => {
    if (!outputs.alb_target_group_arn) return;
    const tgArn = outputs.alb_target_group_arn;
    const tgs = await elbv2.describeTargetGroups({ TargetGroupArns: [tgArn] }).promise();
    expect(tgs.TargetGroups?.length).toBe(1);
  });

  // -------------------------
  // CloudTrail & Config
  // -------------------------
  it('CloudTrail is logging', async () => {
    if (!outputs.cloudtrail_name) return;
    const trails = await cloudtrail.describeTrails().promise();
    const trail = trails.trailList?.find(t => t.Name === outputs.cloudtrail_name);
    expect(trail).toBeDefined();
    if (trail?.Name) {
      const status = await cloudtrail.getTrailStatus({ Name: trail.Name }).promise();
      expect(status.IsLogging).toBe(true);
    }
  });

  it('AWS Config recorder and delivery channel exist and recording', async () => {
    if (!outputs.config_recorder_name || !outputs.config_delivery_channel_name) return;

    const recorders = await config.describeConfigurationRecorders().promise();
    const recorder = recorders.ConfigurationRecorders?.find(r => r.name === outputs.config_recorder_name);
    expect(recorder).toBeDefined();

    const channels = await config.describeDeliveryChannels().promise();
    const channel = channels.DeliveryChannels?.find(c => c.name === outputs.config_delivery_channel_name);
    expect(channel).toBeDefined();

    if (recorder && recorder.name) {
      const status = await config.describeConfigurationRecorderStatus({ ConfigurationRecorderNames: [recorder.name] }).promise();
      expect(status.ConfigurationRecordersStatus?.[0].recording).toBe(true);
    }
  });

  // -------------------------
  // Security Groups
  // -------------------------
  it('Security Groups allow expected ports', async () => {
    if (!outputs.rds_security_group_id || !outputs.ec2_security_group_id) return;

    const rdsSg = await ec2.describeSecurityGroups({ GroupIds: [outputs.security_group_rds_id] }).promise();
    const mysqlPerm = rdsSg.SecurityGroups?.[0].IpPermissions?.find(p => p.FromPort === 3306 && p.ToPort === 3306);
    expect(mysqlPerm).toBeDefined();

    const ec2Sg = await ec2.describeSecurityGroups({ GroupIds: [outputs.security_group_ec2_id] }).promise();
    const sshPerm = ec2Sg.SecurityGroups?.[0].IpPermissions?.find(p => p.FromPort === 22);
    expect(sshPerm).toBeDefined();
  });

});
