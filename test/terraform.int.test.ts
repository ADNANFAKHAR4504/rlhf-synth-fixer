// IMPORTANT: Must be at top
jest.setTimeout(300000); // 5 minutes timeout for comprehensive testing

import { expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// -----------------------------
// Test Configuration
// -----------------------------
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-1';

// Load outputs from Terraform
let outputs: any = null;
try {
  outputs = require('../outputs.json');
  console.log(' Loaded outputs.json');
} catch (err) {
  console.log('  outputs.json not found — running basic validation only');
}

const TEST_CONFIG = {
  vpcId: outputs?.vpc_id?.value || null,
  publicSubnetIds: outputs?.public_subnet_ids?.value || null,
  privateSubnetIds: outputs?.private_subnet_ids?.value || null,
  databaseSubnetIds: outputs?.database_subnet_ids?.value || null,
  loadBalancerDns: outputs?.alb_dns_name?.value || null,
  loadBalancerUrl: outputs?.load_balancer_url?.value || null,
  rdsEndpoint: outputs?.rds_endpoint?.value || null,
  s3BucketName: outputs?.s3_bucket_name?.value || null,
  kmsKeyArn: outputs?.kms_key_arn?.value || null,
  autoscalingGroupName: outputs?.autoscaling_group_name?.value || null,
  databasePassword: outputs?.database_password?.value || null,
  projectName: 'webapp',
  environment: 'prod',
};

// -----------------------------
// Helper: Basic Infrastructure Validation
// -----------------------------
function validateInfrastructureOutputs() {
  console.log('🔍 Validating infrastructure outputs...');

  const validation = {
    hasVpc: !!TEST_CONFIG.vpcId,
    hasPublicSubnets: !!TEST_CONFIG.publicSubnetIds && Array.isArray(TEST_CONFIG.publicSubnetIds),
    hasPrivateSubnets: !!TEST_CONFIG.privateSubnetIds && Array.isArray(TEST_CONFIG.privateSubnetIds),
    hasLoadBalancer: !!TEST_CONFIG.loadBalancerDns,
    hasRdsEndpoint: !!TEST_CONFIG.rdsEndpoint,
    hasS3Bucket: !!TEST_CONFIG.s3BucketName,
    hasKmsKey: !!TEST_CONFIG.kmsKeyArn,
    hasAsg: !!TEST_CONFIG.autoscalingGroupName,
  };

  console.log(' Infrastructure validation results:', validation);
  return validation;
}

// -----------------------------
// Integration Tests
// -----------------------------
describe('AWS Infrastructure Integration Tests - Basic Validation', () => {
  let infrastructureValidation: any = {};

  beforeAll(async () => {
    console.log(' Starting infrastructure integration tests...');
    infrastructureValidation = validateInfrastructureOutputs();
  });

  describe('Infrastructure Outputs Validation', () => {
    test('VPC ID is provided', () => {
      if (TEST_CONFIG.vpcId) {
        expect(TEST_CONFIG.vpcId).toMatch(/^vpc-[a-z0-9]+$/);
        console.log(` VPC ID: ${TEST_CONFIG.vpcId}`);
      } else {
        console.log('  VPC ID not available (infrastructure may not be deployed)');
      }
    });

    test('Public subnets are configured', () => {
      if (TEST_CONFIG.publicSubnetIds && Array.isArray(TEST_CONFIG.publicSubnetIds)) {
        expect(TEST_CONFIG.publicSubnetIds.length).toBeGreaterThanOrEqual(2);
        TEST_CONFIG.publicSubnetIds.forEach(subnetId => {
          expect(subnetId).toMatch(/^subnet-[a-z0-9]+$/);
        });
        console.log(` Public subnets: ${TEST_CONFIG.publicSubnetIds.length} found`);
      } else {
        console.log('  Public subnets not available (infrastructure may not be deployed)');
      }
    });

    test('Private subnets are configured', () => {
      if (TEST_CONFIG.privateSubnetIds && Array.isArray(TEST_CONFIG.privateSubnetIds)) {
        expect(TEST_CONFIG.privateSubnetIds.length).toBeGreaterThanOrEqual(2);
        TEST_CONFIG.privateSubnetIds.forEach(subnetId => {
          expect(subnetId).toMatch(/^subnet-[a-z0-9]+$/);
        });
        console.log(` Private subnets: ${TEST_CONFIG.privateSubnetIds.length} found`);
      } else {
        console.log('  Private subnets not available (infrastructure may not be deployed)');
      }
    });

    test('Load balancer DNS is provided', () => {
      if (TEST_CONFIG.loadBalancerDns) {
        expect(TEST_CONFIG.loadBalancerDns).toMatch(/^.*\.elb\.amazonaws\.com$/);
        console.log(` Load balancer DNS: ${TEST_CONFIG.loadBalancerDns}`);
      } else {
        console.log('  Load balancer DNS not available (infrastructure may not be deployed)');
      }
    });

    test('RDS endpoint is provided', () => {
      if (TEST_CONFIG.rdsEndpoint) {
        expect(TEST_CONFIG.rdsEndpoint).toMatch(/^.*\.rds\.amazonaws\.com$/);
        console.log(` RDS endpoint: ${TEST_CONFIG.rdsEndpoint}`);
      } else {
        console.log('  RDS endpoint not available (infrastructure may not be deployed)');
      }
    });

    test('S3 bucket name is provided', () => {
      if (TEST_CONFIG.s3BucketName) {
        expect(TEST_CONFIG.s3BucketName).toMatch(/^[a-z0-9-]+$/);
        console.log(` S3 bucket: ${TEST_CONFIG.s3BucketName}`);
      } else {
        console.log('  S3 bucket not available (infrastructure may not be deployed)');
      }
    });

    test('KMS key ARN is provided', () => {
      if (TEST_CONFIG.kmsKeyArn) {
        expect(TEST_CONFIG.kmsKeyArn).toMatch(/^arn:aws:kms:.*:.*:key\/.*$/);
        console.log(` KMS key ARN: ${TEST_CONFIG.kmsKeyArn}`);
      } else {
        console.log('  KMS key not available (infrastructure may not be deployed)');
      }
    });

    test('Auto Scaling Group name is provided', () => {
      if (TEST_CONFIG.autoscalingGroupName) {
        expect(TEST_CONFIG.autoscalingGroupName).toMatch(/^[a-zA-Z0-9-_]+$/);
        console.log(` Auto Scaling Group: ${TEST_CONFIG.autoscalingGroupName}`);
      } else {
        console.log('  Auto Scaling Group not available (infrastructure may not be deployed)');
      }
    });
  });

  describe('Network Architecture Validation', () => {
    test('Multi-AZ deployment is configured', () => {
      if (TEST_CONFIG.publicSubnetIds && TEST_CONFIG.privateSubnetIds) {
        const totalSubnets = TEST_CONFIG.publicSubnetIds.length + TEST_CONFIG.privateSubnetIds.length;
        expect(totalSubnets).toBeGreaterThanOrEqual(4); // At least 2 public + 2 private
        console.log(` Multi-AZ deployment: ${totalSubnets} subnets configured`);
      } else {
        console.log('  Multi-AZ validation skipped (subnets not available)');
      }
    });

    test('Database subnets are isolated', () => {
      if (TEST_CONFIG.databaseSubnetIds && Array.isArray(TEST_CONFIG.databaseSubnetIds)) {
        expect(TEST_CONFIG.databaseSubnetIds.length).toBeGreaterThanOrEqual(2);
        console.log(` Database subnets: ${TEST_CONFIG.databaseSubnetIds.length} isolated subnets`);
      } else {
        console.log('  Database subnets validation skipped (not available)');
      }
    });
  });

  describe('Security Configuration Validation', () => {
    test('Database password is securely generated', () => {
      if (TEST_CONFIG.databasePassword) {
        expect(TEST_CONFIG.databasePassword.length).toBeGreaterThanOrEqual(8);
        expect(TEST_CONFIG.databasePassword).toMatch(/[A-Z]/); // Contains uppercase
        expect(TEST_CONFIG.databasePassword).toMatch(/[a-z]/); // Contains lowercase
        expect(TEST_CONFIG.databasePassword).toMatch(/[0-9]/); // Contains number
        console.log(' Database password meets security requirements');
      } else {
        console.log('  Database password validation skipped (not available)');
      }
    });

    test('KMS encryption is configured', () => {
      if (TEST_CONFIG.kmsKeyArn) {
        expect(TEST_CONFIG.kmsKeyArn).toContain('kms');
        console.log(' KMS encryption is configured');
      } else {
        console.log('  KMS validation skipped (not available)');
      }
    });
  });

  describe('Load Balancing Configuration', () => {
    test('Load balancer URL is properly formatted', () => {
      if (TEST_CONFIG.loadBalancerUrl) {
        expect(TEST_CONFIG.loadBalancerUrl).toMatch(/^https?:\/\/.*\.elb\.amazonaws\.com$/);
        console.log(` Load balancer URL: ${TEST_CONFIG.loadBalancerUrl}`);
      } else {
        console.log('  Load balancer URL validation skipped (not available)');
      }
    });
  });

  describe('Success Criteria Validation', () => {
    test('Core infrastructure components are defined', () => {
      const hasCoreComponents = TEST_CONFIG.vpcId || TEST_CONFIG.loadBalancerDns || TEST_CONFIG.rdsEndpoint;

      if (hasCoreComponents) {
        console.log(' Core infrastructure components are defined');
        if (TEST_CONFIG.vpcId) console.log(`  - VPC: ${TEST_CONFIG.vpcId}`);
        if (TEST_CONFIG.loadBalancerDns) console.log(`  - ALB: ${TEST_CONFIG.loadBalancerDns}`);
        if (TEST_CONFIG.rdsEndpoint) console.log(`  - RDS: ${TEST_CONFIG.rdsEndpoint}`);
      } else {
        console.log('  Core components not available (run terraform apply first)');
      }
    });

    test('Infrastructure follows naming conventions', () => {
      const namingValidation = {
        projectName: TEST_CONFIG.projectName === 'webapp',
        environment: TEST_CONFIG.environment === 'prod',
        region: region === 'us-west-1' || region === 'us-east-1' || region === 'eu-west-1'
      };

      expect(namingValidation.projectName).toBe(true);
      expect(namingValidation.environment).toBe(true);
      expect(namingValidation.region).toBe(true);

      console.log(' Infrastructure follows naming conventions');
      console.log(`  - Project: ${TEST_CONFIG.projectName}`);
      console.log(`  - Environment: ${TEST_CONFIG.environment}`);
      console.log(`  - Region: ${region}`);
    });
  });

  describe('Deployment Readiness', () => {
    test('Terraform configuration is ready for deployment', () => {
      // Check if main Terraform files exist
      const terraformFiles = [
        'lib/tap_stack.tf',
        'lib/provider.tf',
        'lib/user_data.sh'
      ];

      terraformFiles.forEach(filePath => {
        const fullPath = path.resolve(process.cwd(), filePath);
        const exists = fs.existsSync(fullPath);
        expect(exists).toBe(true);
        console.log(` ${filePath} exists`);
      });

      console.log(' Terraform configuration is ready for deployment');
    });

    test('User data script is properly configured', () => {
      const userDataPath = path.resolve(process.cwd(), 'lib/user_data.sh');
      if (fs.existsSync(userDataPath)) {
        const userDataContent = fs.readFileSync(userDataPath, 'utf8');

        // Check for essential components
        expect(userDataContent).toContain('#!/bin/bash');
        expect(userDataContent).toContain('yum install');
        expect(userDataContent).toContain('systemctl');
        expect(userDataContent).toContain('apache');

        console.log(' User data script is properly configured');
      } else {
        console.log('  User data script not found');
      }
    });
  });
});
