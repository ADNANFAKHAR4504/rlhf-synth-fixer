import { readFileSync } from 'fs';
import { join } from 'path';
import AWS from 'aws-sdk';
import fetch from 'node-fetch';
import dns from 'dns/promises';
import mysql from 'mysql2/promise';

const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(readFileSync(outputsPath, 'utf-8'));

// Initialize AWS SDK clients
AWS.config.update({ region: outputs.region });
const ec2 = new AWS.EC2();
const rds = new AWS.RDS();
const s3 = new AWS.S3();
const secretsManager = new AWS.SecretsManager();
const dynamodb = new AWS.DynamoDB();
const cloudwatch = new AWS.CloudWatch();
const iam = new AWS.IAM();

describe('TAP Stack Full Live Integration Tests', () => {

  // ==========================================
  // VPC & Networking
  // ==========================================
  it('VPC exists', async () => {
    const vpcs = await ec2.describeVpcs({ VpcIds: [outputs.vpc_id] }).promise();
    expect(vpcs.Vpcs?.length).toBe(1);
    expect(vpcs.Vpcs?.[0].CidrBlock).toBe(outputs.vpc_cidr);
  });

  it('Internet Gateway exists', async () => {
  const igw = await ec2.describeInternetGateways({ InternetGatewayIds: [outputs.internet_gateway_id] }).promise();
  expect(igw.InternetGateways?.length).toBe(1);
  });

  it('NAT Gateways exist', async () => {
    const nat = await ec2.describeNatGateways({ NatGatewayIds: JSON.parse(outputs.nat_gateway_ids) }).promise();
    expect(nat.NatGateways?.length).toBe(3);
  });

  // ==========================================
  // EC2 Instances
  // ==========================================
  it('Public EC2 instances exist and running', async () => {
    const instances = await ec2.describeInstances({ InstanceIds: JSON.parse(outputs.public_ec2_instance_ids) }).promise();
    instances.Reservations?.forEach(r => {
      r.Instances?.forEach(i => expect(i.State?.Name).toBe('running'));
    });
  });

  it('Private EC2 instances exist and running', async () => {
    const instances = await ec2.describeInstances({ InstanceIds: JSON.parse(outputs.private_ec2_instance_ids) }).promise();
    instances.Reservations?.forEach(r => {
      r.Instances?.forEach(i => expect(i.State?.Name).toBe('running'));
    });
  });


  // ==========================================
  // S3
  // ==========================================
  it('S3 bucket exists and encrypted', async () => {
    const bucket = await s3.getBucketEncryption({ Bucket: outputs.s3_bucket_id }).promise();
    expect(bucket.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe(outputs.kms_key_arn);
  });

  it('S3 read/write test', async () => {
    const key = `test-${Date.now()}.txt`;
    await s3.putObject({ Bucket: outputs.s3_bucket_id, Key: key, Body: 'Hello TAP!' }).promise();
    const obj = await s3.getObject({ Bucket: outputs.s3_bucket_id, Key: key }).promise();
    expect(obj.Body?.toString()).toBe('Hello TAP!');
  });

  // ==========================================
  // DynamoDB
  // ==========================================
  it('DynamoDB table exists', async () => {
    const table = await dynamodb.describeTable({ TableName: outputs.dynamodb_table_name }).promise();
    expect(table.Table?.TableStatus).toBe('ACTIVE');
  });

  // ==========================================
  // CloudWatch
  // ==========================================
  it('CloudWatch alarm exists', async () => {
    const alarms = await cloudwatch.describeAlarms({ AlarmNames: [outputs.cloudwatch_alarm_rds_cpu_name] }).promise();
    expect(alarms.MetricAlarms?.length).toBe(1);
    expect(alarms.MetricAlarms?.[0].AlarmArn).toBe(outputs.cloudwatch_alarm_rds_cpu_arn);
  });

  // ==========================================
  // IAM
  // ==========================================
  it('EC2 IAM role exists', async () => {
    const roleName = outputs.ec2_role_arn.split('/').pop()!;
    const role = await iam.getRole({ RoleName: roleName }).promise();
    expect(role.Role?.RoleName).toBe('tap-ec2-cloudwatch-role');
  });

  it('DynamoDB autoscaling IAM role exists', async () => {
    const roleName = outputs.dynamodb_autoscaling_role_arn.split('/').pop()!;
    const role = await iam.getRole({ RoleName: roleName }).promise();
    expect(role.Role?.RoleName).toBe('tap-dynamodb-autoscaling-role');
  });

  // ==========================================
  // AMI
  // ==========================================
  it('AMI exists', async () => {
    const images = await ec2.describeImages({ ImageIds: [outputs.ami_id] }).promise();
    expect(images.Images?.[0].Name).toBe(outputs.ami_name);
  });

});
