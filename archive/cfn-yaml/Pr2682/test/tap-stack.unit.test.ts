// tests/unit/unit-tests-cfn.ts

import fs from 'fs';
import path from 'path';

const TEMPLATE_PATH = path.resolve(__dirname, '../lib/TapStack.yml');

describe('CloudFormation Template Static Checks (infra.yml)', () => {
  test('Template file exists', () => {
    const exists = fs.existsSync(TEMPLATE_PATH);
    expect(exists).toBe(true);
  });

  const content = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  // --- Key Resources ---
  test('declares a VPC and Subnets', () => {
    expect(content).toMatch(/Type: AWS::EC2::VPC/);
    expect(content).toMatch(/Type: AWS::EC2::Subnet/);
  });

  test('declares EC2 instance for Bastion Host', () => {
    expect(content).toMatch(/Type: AWS::EC2::Instance/);
    expect(content).toMatch(/BastionHost:/);
  });

  test('declares a MySQL RDS instance with encryption enabled', () => {
    expect(content).toMatch(/Type: AWS::RDS::DBInstance/);
    expect(content).toMatch(/Engine: mysql/);
    expect(content).toMatch(/StorageEncrypted: true/);
  });

  test('declares a KMS key and alias', () => {
    expect(content).toMatch(/Type: AWS::KMS::Key/);
    expect(content).toMatch(/Type: AWS::KMS::Alias/);
  });

  // test('declares AWS Config ConfigurationRecorder and DeliveryChannel', () => {
  //   expect(content).toMatch(/Type: AWS::Config::ConfigurationRecorder/);
  //   expect(content).toMatch(/Type: AWS::Config::DeliveryChannel/);
  // });

  // test('declares a CloudTrail Trail and LogGroup', () => {
  //   expect(content).toMatch(/Type: AWS::CloudTrail::Trail/);
  //   expect(content).toMatch(/Type: AWS::Logs::LogGroup/);
  // });

  test('declares at least one SNS topic for alerts', () => {
    expect(content).toMatch(/Type: AWS::SNS::Topic/);
  });

  // --- Tags ---
  test('adds Environment tags to resources', () => {
    const hasTagBlock = /Tags:\s*\n(\s+-\s+Key:\s+Environment)/.test(content);
    expect(hasTagBlock).toBe(true);
  });

  // --- Security ---
  // test('public access to S3 buckets is blocked', () => {
  //   expect(content).toMatch(/PublicAccessBlockConfiguration:/);
  //   expect(content).toMatch(/BlockPublicAcls: true/);
  //   expect(content).toMatch(/RestrictPublicBuckets: true/);
  // });

  test('logs are encrypted using KMS', () => {
    expect(content).toMatch(/KmsKeyId: !Ref KMSKey/);
  });

  // // --- Config & Delivery Channel (Delivery channel only allowed once) ---
  // test('declares only one delivery channel', () => {
  //   const deliveryChannelMatches = content.match(/Type: AWS::Config::DeliveryChannel/g) || [];
  //   expect(deliveryChannelMatches.length).toBeLessThanOrEqual(1);
  // });

  // --- Alarms and Monitoring ---
  test('defines CloudWatch Alarms for unauthorized access and root usage', () => {
    expect(content).toMatch(/Type: AWS::CloudWatch::Alarm/);
    expect(content).toMatch(/AlarmName: !Sub '\${Environment}-unauthorized-access-attempt'/);
    expect(content).toMatch(/AlarmName: !Sub '\${Environment}-root-account-usages'/);
  });

  // --- Secret Management ---
  test('creates a SecretsManager secret for the database', () => {
    expect(content).toMatch(/Type: AWS::SecretsManager::Secret/);
    expect(content).toMatch(/GenerateSecretString:/);
  });

  // // --- IAM ---
  // test('has IAM roles for CloudTrail and Config services', () => {
  //   expect(content).toMatch(/Type: AWS::IAM::Role/);
  //   expect(content).toMatch(/cloudtrail.amazonaws.com/);
  //   expect(content).toMatch(/config.amazonaws.com/);
  // });
});
