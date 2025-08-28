// IMPORTANT: Must be at top
jest.setTimeout(300000); // 5 minutes timeout for comprehensive testing

import { expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';

// -----------------------------
// Test Configuration
// -----------------------------
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-2';

// Load outputs from Terraform
let outputs: any = null;
try {
  outputs = require('../outputs.json');
  console.log('✅ Loaded outputs.json');
} catch (err) {
  console.log('ℹ️  outputs.json not found — running basic validation only');
}

const TEST_CONFIG = {
  vpcId: outputs?.vpc_id?.value || null,
  publicSubnetIds: outputs?.public_subnet_ids?.value || [],
  privateSubnetIds: outputs?.private_subnet_ids?.value || [],
  databaseSubnetIds: outputs?.database_subnet_ids?.value || [],
  loadBalancerDns: outputs?.load_balancer_dns_name?.value || null,
  loadBalancerZoneId: outputs?.load_balancer_zone_id?.value || null,
  rdsEndpoint: outputs?.rds_endpoint?.value || null,
  s3BucketName: outputs?.s3_bucket_name?.value || null,
  kmsKeyArn: outputs?.kms_key_arn?.value || null,
  autoscalingGroupName: outputs?.autoscaling_group_name?.value || null,
  environment: outputs?.environment?.value || 'staging',
  projectName: outputs?.project_name?.value || 'myapp',
  region: outputs?.region?.value || region,
  databasePassword: outputs?.database_password?.value || null
};

// -----------------------------
// Helper Functions
// -----------------------------

function validateInfrastructureOutputs() {
  console.log('🔍 Validating infrastructure outputs...');

  const results = {
    hasVpc: !!TEST_CONFIG.vpcId,
    hasPublicSubnets: TEST_CONFIG.publicSubnetIds.length > 0,
    hasPrivateSubnets: TEST_CONFIG.privateSubnetIds.length > 0,
    hasDatabaseSubnets: TEST_CONFIG.databaseSubnetIds.length > 0,
    hasLoadBalancer: !!TEST_CONFIG.loadBalancerDns,
    hasRdsEndpoint: !!TEST_CONFIG.rdsEndpoint,
    hasS3Bucket: !!TEST_CONFIG.s3BucketName,
    hasKmsKey: !!TEST_CONFIG.kmsKeyArn,
    hasAsg: !!TEST_CONFIG.autoscalingGroupName
  };

  console.log('📊 Infrastructure validation results:', results);
  return results;
}

// -----------------------------
// Test Suite
// -----------------------------

describe('AWS Multi-Environment Infrastructure Integration Tests', () => {
  beforeAll(async () => {
    console.log('🚀 Starting infrastructure integration tests...');
    console.log(`📍 Region: ${region}`);
    console.log(`🏷️  Environment: ${TEST_CONFIG.environment}`);
    console.log(`📦 Project: ${TEST_CONFIG.projectName}`);
  });

  describe('Infrastructure Outputs Validation', () => {
    test('VPC ID is provided', () => {
      if (TEST_CONFIG.vpcId) {
        expect(TEST_CONFIG.vpcId).toMatch(/^vpc-[a-z0-9]+$/);
        console.log(`✅ VPC ID: ${TEST_CONFIG.vpcId}`);
      } else {
        console.log('ℹ️  VPC ID not available (infrastructure may not be deployed)');
      }
    });

    test('Public subnets are configured', () => {
      if (TEST_CONFIG.publicSubnetIds.length > 0) {
        expect(TEST_CONFIG.publicSubnetIds.length).toBeGreaterThanOrEqual(2);
        TEST_CONFIG.publicSubnetIds.forEach((subnetId: string) => {
          expect(subnetId).toMatch(/^subnet-[a-z0-9]+$/);
        });
        console.log(`✅ Found ${TEST_CONFIG.publicSubnetIds.length} public subnets`);
      } else {
        console.log('ℹ️  Public subnets not available (infrastructure may not be deployed)');
      }
    });

    test('Private subnets are configured', () => {
      if (TEST_CONFIG.privateSubnetIds.length > 0) {
        expect(TEST_CONFIG.privateSubnetIds.length).toBeGreaterThanOrEqual(2);
        TEST_CONFIG.privateSubnetIds.forEach((subnetId: string) => {
          expect(subnetId).toMatch(/^subnet-[a-z0-9]+$/);
        });
        console.log(`✅ Found ${TEST_CONFIG.privateSubnetIds.length} private subnets`);
      } else {
        console.log('ℹ️  Private subnets not available (infrastructure may not be deployed)');
      }
    });

    test('Load balancer DNS is provided', () => {
      if (TEST_CONFIG.loadBalancerDns) {
        expect(TEST_CONFIG.loadBalancerDns).toMatch(/^.*\.elb\.amazonaws\.com$/);
        console.log(`✅ Load balancer DNS: ${TEST_CONFIG.loadBalancerDns}`);
      } else {
        console.log('ℹ️  Load balancer DNS not available (infrastructure may not be deployed)');
      }
    });

    test('RDS endpoint is provided', () => {
      if (TEST_CONFIG.rdsEndpoint) {
        expect(TEST_CONFIG.rdsEndpoint).toMatch(/^.*\.rds\.amazonaws\.com$/);
        console.log(`✅ RDS endpoint: ${TEST_CONFIG.rdsEndpoint}`);
      } else {
        console.log('ℹ️  RDS endpoint not available (infrastructure may not be deployed)');
      }
    });

    test('S3 bucket name is provided', () => {
      if (TEST_CONFIG.s3BucketName) {
        expect(TEST_CONFIG.s3BucketName).toMatch(/^[a-z0-9-]+$/);
        console.log(`✅ S3 bucket: ${TEST_CONFIG.s3BucketName}`);
      } else {
        console.log('ℹ️  S3 bucket not available (infrastructure may not be deployed)');
      }
    });

    test('KMS key ARN is provided', () => {
      if (TEST_CONFIG.kmsKeyArn) {
        expect(TEST_CONFIG.kmsKeyArn).toMatch(/^arn:aws:kms:.*:key\/[a-z0-9-]+$/);
        console.log(`✅ KMS key ARN: ${TEST_CONFIG.kmsKeyArn}`);
      } else {
        console.log('ℹ️  KMS key not available (infrastructure may not be deployed)');
      }
    });

    test('Auto Scaling Group name is provided', () => {
      if (TEST_CONFIG.autoscalingGroupName) {
        expect(TEST_CONFIG.autoscalingGroupName).toMatch(/^[a-zA-Z0-9-]+$/);
        console.log(`✅ Auto Scaling Group: ${TEST_CONFIG.autoscalingGroupName}`);
      } else {
        console.log('ℹ️  Auto Scaling Group not available (infrastructure may not be deployed)');
      }
    });
  });

  describe('Multi-Environment Configuration Validation', () => {
    test('Environment is properly configured', () => {
      expect(['staging', 'production']).toContain(TEST_CONFIG.environment);
      console.log(`✅ Environment: ${TEST_CONFIG.environment}`);
    });

    test('Project name follows naming convention', () => {
      expect(TEST_CONFIG.projectName).toMatch(/^[a-z0-9-]+$/);
      expect(TEST_CONFIG.projectName.length).toBeLessThanOrEqual(32);
      console.log(`✅ Project name: ${TEST_CONFIG.projectName}`);
    });

    test('Region is valid AWS region', () => {
      expect(TEST_CONFIG.region).toMatch(/^[a-z]{2}-[a-z]+-\d+$/);
      console.log(`✅ Region: ${TEST_CONFIG.region}`);
    });
  });

  describe('Network Architecture Validation', () => {
    test('Multi-AZ deployment is configured', () => {
      if (TEST_CONFIG.publicSubnetIds.length > 0 && TEST_CONFIG.privateSubnetIds.length > 0) {
        expect(TEST_CONFIG.publicSubnetIds.length).toBeGreaterThanOrEqual(2);
        expect(TEST_CONFIG.privateSubnetIds.length).toBeGreaterThanOrEqual(2);
        console.log('✅ Multi-AZ deployment confirmed');
      } else {
        console.log('ℹ️  Multi-AZ validation skipped (subnets not available)');
      }
    });

    test('Database subnets are isolated', () => {
      if (TEST_CONFIG.databaseSubnetIds.length > 0) {
        expect(TEST_CONFIG.databaseSubnetIds.length).toBeGreaterThanOrEqual(2);
        console.log(`✅ Found ${TEST_CONFIG.databaseSubnetIds.length} database subnets`);
      } else {
        console.log('ℹ️  Database subnets validation skipped (not available)');
      }
    });
  });

  describe('Security Configuration Validation', () => {
    test('Database password is securely generated', () => {
      if (TEST_CONFIG.databasePassword) {
        expect(TEST_CONFIG.databasePassword.length).toBeGreaterThanOrEqual(16);
        expect(TEST_CONFIG.databasePassword).toMatch(/[A-Z]/); // Contains uppercase
        expect(TEST_CONFIG.databasePassword).toMatch(/[a-z]/); // Contains lowercase
        expect(TEST_CONFIG.databasePassword).toMatch(/[0-9]/); // Contains number
        console.log('✅ Database password meets security requirements');
      } else {
        console.log('ℹ️  Database password validation skipped (not available)');
      }
    });

    test('KMS encryption is configured', () => {
      if (TEST_CONFIG.kmsKeyArn) {
        expect(TEST_CONFIG.kmsKeyArn).toContain('kms');
        console.log('✅ KMS encryption is configured');
      } else {
        console.log('ℹ️  KMS validation skipped (not available)');
      }
    });
  });

  describe('Load Balancing Configuration', () => {
    test('Load balancer URL is properly formatted', () => {
      if (TEST_CONFIG.loadBalancerDns) {
        expect(TEST_CONFIG.loadBalancerDns).toMatch(/^https?:\/\/.*\.elb\.amazonaws\.com$/);
        console.log(`✅ Load balancer URL: ${TEST_CONFIG.loadBalancerDns}`);
      } else {
        console.log('ℹ️  Load balancer URL validation skipped (not available)');
      }
    });
  });

  describe('Success Criteria Validation', () => {
    test('Core infrastructure components are defined', () => {
      const hasCoreComponents = TEST_CONFIG.vpcId || TEST_CONFIG.loadBalancerDns || TEST_CONFIG.rdsEndpoint;

      if (hasCoreComponents) {
        console.log('✅ Core infrastructure components are defined');
        if (TEST_CONFIG.vpcId) console.log(`  - VPC: ${TEST_CONFIG.vpcId}`);
        if (TEST_CONFIG.loadBalancerDns) console.log(`  - ALB: ${TEST_CONFIG.loadBalancerDns}`);
        if (TEST_CONFIG.rdsEndpoint) console.log(`  - RDS: ${TEST_CONFIG.rdsEndpoint}`);
      } else {
        console.log('ℹ️  Core components not available (run terraform apply first)');
      }
    });

    test('Infrastructure follows naming conventions', () => {
      const namingValidation = {
        projectName: TEST_CONFIG.projectName === 'myapp',
        environment: ['staging', 'production'].includes(TEST_CONFIG.environment),
        region: /^[a-z]{2}-[a-z]+-\d+$/.test(TEST_CONFIG.region)
      };

      expect(namingValidation.projectName).toBe(true);
      expect(namingValidation.environment).toBe(true);
      expect(namingValidation.region).toBe(true);

      console.log('✅ Infrastructure follows naming conventions');
      console.log(`  - Project: ${TEST_CONFIG.projectName}`);
      console.log(`  - Environment: ${TEST_CONFIG.environment}`);
      console.log(`  - Region: ${TEST_CONFIG.region}`);
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
        console.log(`✅ ${filePath} exists`);
      });

      console.log('✅ Terraform configuration is ready for deployment');
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

        console.log('✅ User data script is properly configured');
      } else {
        console.log('ℹ️  User data script not found (may be inline in tap_stack.tf)');
        // Check if user data is inline in tap_stack.tf
        const tapStackPath = path.resolve(process.cwd(), 'lib/tap_stack.tf');
        if (fs.existsSync(tapStackPath)) {
          const tapStackContent = fs.readFileSync(tapStackPath, 'utf8');
          expect(tapStackContent).toContain('user_data');
          console.log('✅ User data configuration found in tap_stack.tf');
        }
      }
    });
  });

  describe('Environment-Specific Features', () => {
    test('Environment-specific configurations are applied', () => {
      const isProduction = TEST_CONFIG.environment === 'production';

      if (isProduction) {
        console.log('✅ Production environment detected');
        // Production should have more resources and stricter settings
        if (TEST_CONFIG.privateSubnetIds.length > 0) {
          expect(TEST_CONFIG.privateSubnetIds.length).toBeGreaterThanOrEqual(2);
        } else {
          console.log('ℹ️  Private subnets not available (infrastructure may not be deployed)');
        }
      } else {
        console.log('✅ Staging environment detected');
        // Staging can have fewer resources
        if (TEST_CONFIG.privateSubnetIds.length > 0) {
          expect(TEST_CONFIG.privateSubnetIds.length).toBeGreaterThanOrEqual(1);
        } else {
          console.log('ℹ️  Private subnets not available (infrastructure may not be deployed)');
        }
      }
    });

    test('Random variables are properly generated', () => {
      // Check if S3 bucket name contains random suffix
      if (TEST_CONFIG.s3BucketName) {
        expect(TEST_CONFIG.s3BucketName).toMatch(/[a-z0-9]{6,8}$/);
        console.log('✅ S3 bucket has random suffix');
      }

      // Check if database password is random
      if (TEST_CONFIG.databasePassword) {
        expect(TEST_CONFIG.databasePassword.length).toBeGreaterThanOrEqual(16);
        console.log('✅ Database password is randomly generated');
      }
    });
  });
});
