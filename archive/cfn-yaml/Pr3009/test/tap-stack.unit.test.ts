// tests/unit/unit-tests-cfn.ts

import fs from 'fs';
import path from 'path';

const TEMPLATE_PATH = path.resolve(__dirname, '../lib/TapStack.yml');

describe('CloudFormation Template Static Checks (TapStack.yml)', () => {
  test('Template file exists', () => {
    const exists = fs.existsSync(TEMPLATE_PATH);
    expect(exists).toBe(true);
  });

  const content = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  // --- Core Networking ---
  test('declares a VPC and subnets', () => {
    expect(content).toMatch(/Type: AWS::EC2::VPC/);
    expect(content).toMatch(/Type: AWS::EC2::Subnet/);
  });

  test('declares Internet Gateway and route table', () => {
    expect(content).toMatch(/Type: AWS::EC2::InternetGateway/);
    expect(content).toMatch(/Type: AWS::EC2::RouteTable/);
    expect(content).toMatch(/Type: AWS::EC2::Route/);
  });

  // --- Security Groups ---
  test('declares security groups for web and database', () => {
    expect(content).toMatch(/Type: AWS::EC2::SecurityGroup/);
    expect(content).toMatch(/GroupName: !Sub '\$\{Environment\}-web-security-group'/);
    expect(content).toMatch(/GroupName: !Sub '\$\{Environment\}-database-security-group-\$\{EnvironmentSuffix\}'/);
  });

  // --- IAM Roles and Policies ---
  test('declares IAM roles and instance profiles', () => {
    expect(content).toMatch(/Type: AWS::IAM::Role/);
    expect(content).toMatch(/Type: AWS::IAM::InstanceProfile/);
  });

  test('includes IAM policy allowing S3 access', () => {
    expect(content).toMatch(/PolicyName: S3AccessPolicy/);
    expect(content).toMatch(/s3:GetObject/);
    expect(content).toMatch(/s3:PutObject/);
    expect(content).toMatch(/s3:DeleteObject/);
  });

  test('includes IAM policy allowing KMS access', () => {
    expect(content).toMatch(/PolicyName: KMSAccessPolicy/);
    expect(content).toMatch(/kms:Decrypt/);
  });

  // --- KMS Keys ---
  test('declares S3 and RDS KMS keys and aliases', () => {
    expect(content).toMatch(/Type: AWS::KMS::Key/);
    expect(content).toMatch(/Type: AWS::KMS::Alias/);
    expect(content).toMatch(/Description: 'KMS Key for S3 bucket encryption'/);
    expect(content).toMatch(/Description: 'KMS Key for RDS encryption'/);
  });

  // --- S3 Buckets ---
  test('declares application and logging S3 buckets', () => {
    expect(content).toMatch(/Type: AWS::S3::Bucket/);
    expect(content).toMatch(/BucketName: 'prod-secure-app-bucket-iac'/);
    expect(content).toMatch(/BucketName: 'prod-security-logs-bucket-iac'/);
  });

  test('blocks public access to S3 buckets', () => {
    expect(content).toMatch(/BlockPublicAcls: true/);
    expect(content).toMatch(/RestrictPublicBuckets: true/);
  });

  test('enables S3 bucket encryption using KMS', () => {
    expect(content).toMatch(/SSEAlgorithm: aws:kms/);
  });

  // --- CloudTrail ---
  test('declares a CloudTrail trail with data event selectors', () => {
    expect(content).toMatch(/Type: AWS::CloudTrail::Trail/);
    expect(content).toMatch(/EventSelectors:/);
    expect(content).toMatch(/DataResources:/);
    expect(content).toMatch(/arn:aws:s3:::\$\{ApplicationBucket\}\/\*/);
  });

  // --- RDS Database ---
  test('declares an encrypted RDS instance with subnet group', () => {
    expect(content).toMatch(/Type: AWS::RDS::DBInstance/);
    expect(content).toMatch(/StorageEncrypted: true/);
    expect(content).toMatch(/Type: AWS::RDS::DBSubnetGroup/);
  });

  test('declares RDS monitoring role', () => {
    expect(content).toMatch(/Type: AWS::IAM::Role/);
    expect(content).toMatch(/monitoring.rds.amazonaws.com/);
  });

  // --- SecretsManager ---
  test('declares SecretsManager secret for DB credentials', () => {
    expect(content).toMatch(/Type: AWS::SecretsManager::Secret/);
    expect(content).toMatch(/GenerateSecretString:/);
  });

  // --- EC2 ---
  test('declares EC2 instance for web server', () => {
    expect(content).toMatch(/Type: AWS::EC2::Instance/);
    expect(content).toMatch(/ImageId: ami-/);
    expect(content).toMatch(/UserData:/);
  });

  // --- CloudWatch Logs and Alarms ---
  test('declares log groups and CloudWatch alarms', () => {
    expect(content).toMatch(/Type: AWS::Logs::LogGroup/);
    expect(content).toMatch(/Type: AWS::CloudWatch::Alarm/);
    expect(content).toMatch(/AlarmName: !Sub '\$\{Environment\}-unauthorized-access-alarm-\$\{EnvironmentSuffix\}'/);
  });

  // --- SNS ---
  test('declares an SNS topic for security alerts', () => {
    expect(content).toMatch(/Type: AWS::SNS::Topic/);
    expect(content).toMatch(/TopicName: !Sub '\$\{Environment\}-security-alerts-\$\{EnvironmentSuffix\}'/);
  });

  // --- Outputs ---
  test('outputs key infrastructure ARNs and values', () => {
    expect(content).toMatch(/Outputs:/);
    expect(content).toMatch(/VPCId:/);
    expect(content).toMatch(/S3BucketName:/);
    expect(content).toMatch(/DatabaseEndpoint:/);
    expect(content).toMatch(/CloudTrailArn:/);
    expect(content).toMatch(/WebACLArn:/);
  });

  // --- Tags ---
  test('adds Environment tags to key resources', () => {
    const hasTagBlock = /Tags:\s*\n(\s+-\s+Key:\s+Environment)/.test(content);
    expect(hasTagBlock).toBe(true);
  });
});
