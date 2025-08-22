import * as AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';

let outputs: any = {};

beforeAll(() => {
  try {
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    } else {
      console.warn('cfn-outputs/flat-outputs.json not found. Some tests may fail.');
    }
  } catch (error) {
    console.warn('Could not read cfn-outputs/flat-outputs.json:', error);
  }
});

describe('AWS Secure Multi-Account Environment Integration Tests', () => {
  describe('VPC Infrastructure', () => {
    test('VPC should exist and have correct configuration', () => {
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.vpc_id).toMatch(/^vpc-[a-z0-9]+$/);
    });

    test('VPC Flow Logs should be enabled', () => {
      expect(outputs.vpc_flow_log_status).toBeDefined();
      const flowLogStatus = typeof outputs.vpc_flow_log_status === 'string' 
        ? JSON.parse(outputs.vpc_flow_log_status) 
        : outputs.vpc_flow_log_status;
      expect(flowLogStatus.status).toBe('enabled');
      expect(flowLogStatus.flow_log_id).toBeDefined();
      expect(flowLogStatus.log_group).toBeDefined();
    });
  });

  describe('S3 Buckets and Encryption', () => {
    let s3: AWS.S3;

    beforeAll(() => {
      s3 = new AWS.S3();
    });

    test('Main S3 bucket should exist with proper encryption', async () => {
      expect(outputs.s3_bucket_main).toBeDefined();
      const bucketInfo = typeof outputs.s3_bucket_main === 'string' 
        ? JSON.parse(outputs.s3_bucket_main) 
        : outputs.s3_bucket_main;
      
      expect(bucketInfo.bucket_name).toBeDefined();
      expect(bucketInfo.encryption_status).toBe('enabled');
      expect(bucketInfo.encryption_type).toBe('aws:kms');
      expect(bucketInfo.kms_key_id).toBeDefined();

      const bucketEncryption = await s3.getBucketEncryption({
        Bucket: bucketInfo.bucket_name
      }).promise();

      expect(bucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = bucketEncryption.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    }, 15000);

    test('CloudTrail S3 bucket should exist with proper encryption', async () => {
      expect(outputs.s3_bucket_cloudtrail).toBeDefined();
      const bucketInfo = typeof outputs.s3_bucket_cloudtrail === 'string' 
        ? JSON.parse(outputs.s3_bucket_cloudtrail) 
        : outputs.s3_bucket_cloudtrail;

      expect(bucketInfo.bucket_name).toBeDefined();
      expect(bucketInfo.encryption_status).toBe('enabled');
      expect(bucketInfo.encryption_type).toBe('aws:kms');
      expect(bucketInfo.kms_key_id).toBeDefined();

      const bucketEncryption = await s3.getBucketEncryption({
        Bucket: bucketInfo.bucket_name
      }).promise();

      expect(bucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = bucketEncryption.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    }, 15000);

    test('S3 buckets should have public access blocked', async () => {
      const mainBucketInfo = typeof outputs.s3_bucket_main === 'string' 
        ? JSON.parse(outputs.s3_bucket_main) 
        : outputs.s3_bucket_main;
      
      const publicAccessBlock = await s3.getPublicAccessBlock({
        Bucket: mainBucketInfo.bucket_name
      }).promise();

      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 15000);
  });

  describe('RDS Database', () => {
    let rds: AWS.RDS;

    beforeAll(() => {
      rds = new AWS.RDS();
    });

    test('RDS instance should exist with proper security configuration', () => {
      expect(outputs.rds_endpoint).toBeDefined();
      expect(outputs.rds_security_status).toBeDefined();
      
      const securityStatus = typeof outputs.rds_security_status === 'string' 
        ? JSON.parse(outputs.rds_security_status) 
        : outputs.rds_security_status;

      expect(securityStatus.publicly_accessible).toBe(false);
      expect(securityStatus.encrypted).toBe(true);
      expect(securityStatus.kms_key_id).toBeDefined();
      expect(securityStatus.vpc_security_groups).toBeDefined();
      expect(Array.isArray(securityStatus.vpc_security_groups)).toBe(true);
    });
  });

  describe('CloudTrail', () => {
    let cloudtrail: AWS.CloudTrail;

    beforeAll(() => {
      cloudtrail = new AWS.CloudTrail();
    });

    test('CloudTrail should be enabled and properly configured', async () => {
      expect(outputs.cloudtrail_details).toBeDefined();
      const cloudtrailDetails = typeof outputs.cloudtrail_details === 'string' 
        ? JSON.parse(outputs.cloudtrail_details) 
        : outputs.cloudtrail_details;

      expect(cloudtrailDetails.trail_name).toBeDefined();
      expect(cloudtrailDetails.trail_arn).toBeDefined();
      expect(cloudtrailDetails.s3_bucket_arn).toBeDefined();
      expect(cloudtrailDetails.status).toBe('enabled');

      const trailStatus = await cloudtrail.getTrailStatus({
        Name: cloudtrailDetails.trail_arn
      }).promise();

      expect(trailStatus.IsLogging).toBe(true);
    }, 15000);
  });

  describe('KMS Key Management', () => {
    let kms: AWS.KMS;

    beforeAll(() => {
      kms = new AWS.KMS();
    });

    test('KMS key should exist with proper configuration', async () => {
      expect(outputs.kms_key).toBeDefined();
      const kmsKeyInfo = typeof outputs.kms_key === 'string' 
        ? JSON.parse(outputs.kms_key) 
        : outputs.kms_key;

      expect(kmsKeyInfo.key_id).toBeDefined();
      expect(kmsKeyInfo.key_arn).toBeDefined();
      expect(kmsKeyInfo.alias).toBeDefined();
      expect(kmsKeyInfo.rotation).toBe('enabled');

      const keyDescription = await kms.describeKey({
        KeyId: kmsKeyInfo.key_id
      }).promise();

      expect(keyDescription.KeyMetadata?.Enabled).toBe(true);
      const rotationStatus = await kms.getKeyRotationStatus({ KeyId: kmsKeyInfo.key_id }).promise();
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    }, 15000);
  });

  describe('IAM Configuration', () => {
    test('IAM users should have MFA configured', () => {
      expect(outputs.iam_user_mfa_status).toBeDefined();
      const mfaStatus = typeof outputs.iam_user_mfa_status === 'string' 
        ? JSON.parse(outputs.iam_user_mfa_status) 
        : outputs.iam_user_mfa_status;

      expect(mfaStatus.user_name).toBeDefined();
      expect(mfaStatus.user_arn).toBeDefined();
      expect(mfaStatus.mfa_required).toBe(true);
      expect(mfaStatus.mfa_status).toBe('enabled');
    });

    test('IAM roles should exist with proper configuration', () => {
      expect(outputs.iam_roles).toBeDefined();
      const roles = typeof outputs.iam_roles === 'string' 
        ? JSON.parse(outputs.iam_roles) 
        : outputs.iam_roles;

      expect(roles.ec2_role).toBeDefined();
      expect(roles.ec2_role.name).toBeDefined();
      expect(roles.ec2_role.arn).toBeDefined();

      expect(roles.vpc_flow_logs_role).toBeDefined();
      expect(roles.vpc_flow_logs_role.name).toBeDefined();
      expect(roles.vpc_flow_logs_role.arn).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('Security groups should be properly configured', () => {
      expect(outputs.security_groups).toBeDefined();
      const securityGroups = typeof outputs.security_groups === 'string' 
        ? JSON.parse(outputs.security_groups) 
        : outputs.security_groups;

      expect(securityGroups.web_sg).toBeDefined();
      expect(securityGroups.web_sg.id).toBeDefined();
      expect(securityGroups.web_sg.name).toBeDefined();
      expect(securityGroups.web_sg.rules).toBe('HTTP(80), HTTPS(443) inbound; All outbound');

      expect(securityGroups.database_sg).toBeDefined();
      expect(securityGroups.database_sg.id).toBeDefined();
      expect(securityGroups.database_sg.name).toBeDefined();
      expect(securityGroups.database_sg.rules).toBe('MySQL(3306) from web SG; All outbound');
    });
  });

  describe('Environment Summary and Security Posture', () => {
    test('Environment should have comprehensive security configuration', () => {
      expect(outputs.environment_summary).toBeDefined();
      const envSummary = typeof outputs.environment_summary === 'string' 
        ? JSON.parse(outputs.environment_summary) 
        : outputs.environment_summary;

      expect(envSummary.environment).toBeDefined();
      expect(envSummary.region).toBeDefined();
      expect(envSummary.project_name).toBeDefined();
      expect(envSummary.vpc_id).toBeDefined();

      expect(envSummary.subnets).toBeDefined();
      expect(envSummary.subnets.public_subnets).toBeDefined();
      expect(envSummary.subnets.private_subnets).toBeDefined();
      expect(Array.isArray(envSummary.subnets.public_subnets)).toBe(true);
      expect(Array.isArray(envSummary.subnets.private_subnets)).toBe(true);
      expect(envSummary.subnets.public_subnets.length).toBe(3);
      expect(envSummary.subnets.private_subnets.length).toBe(3);

      const securityStatus = envSummary.security_status;
      expect(securityStatus.encryption_enabled).toBe(true);
      expect(securityStatus.vpc_flow_logs).toBe(true);
      expect(securityStatus.cloudtrail_enabled).toBe(true);
      expect(securityStatus.mfa_configured).toBe(true);
      expect(securityStatus.least_privilege_iam).toBe(true);
      expect(securityStatus.private_rds).toBe(true);
    });

    test('Multi-AZ deployment should be properly configured', () => {
      const envSummary = typeof outputs.environment_summary === 'string' 
        ? JSON.parse(outputs.environment_summary) 
        : outputs.environment_summary;

      expect(envSummary.subnets.public_subnets.length).toBe(3);
      expect(envSummary.subnets.private_subnets.length).toBe(3);
      
      envSummary.subnets.public_subnets.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-z0-9]+$/);
      });

      envSummary.subnets.private_subnets.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-z0-9]+$/);
      });
    });
  });

  describe('Resource Connectivity', () => {
    test('Database should be accessible only from application security group', () => {
      const securityGroups = typeof outputs.security_groups === 'string' 
        ? JSON.parse(outputs.security_groups) 
        : outputs.security_groups;

      const dbSgRules = securityGroups.database_sg.rules;
      expect(dbSgRules).toContain('MySQL(3306) from web SG');
      
      const rdsSecurityStatus = typeof outputs.rds_security_status === 'string' 
        ? JSON.parse(outputs.rds_security_status) 
        : outputs.rds_security_status;
      
      expect(rdsSecurityStatus.publicly_accessible).toBe(false);
      expect(Array.isArray(rdsSecurityStatus.vpc_security_groups)).toBe(true);
      expect(rdsSecurityStatus.vpc_security_groups.length).toBeGreaterThan(0);
    });

    test('S3 buckets should be properly linked to CloudTrail', () => {
      const cloudtrailDetails = typeof outputs.cloudtrail_details === 'string' 
        ? JSON.parse(outputs.cloudtrail_details) 
        : outputs.cloudtrail_details;

      const s3CloudtrailBucket = typeof outputs.s3_bucket_cloudtrail === 'string' 
        ? JSON.parse(outputs.s3_bucket_cloudtrail) 
        : outputs.s3_bucket_cloudtrail;

      expect(cloudtrailDetails.s3_bucket_arn).toBe(s3CloudtrailBucket.bucket_arn);
    });

    test('All resources should use the same KMS key for encryption', () => {
      const kmsKeyInfo = typeof outputs.kms_key === 'string' 
        ? JSON.parse(outputs.kms_key) 
        : outputs.kms_key;

      const mainBucket = typeof outputs.s3_bucket_main === 'string' 
        ? JSON.parse(outputs.s3_bucket_main) 
        : outputs.s3_bucket_main;

      const cloudtrailBucket = typeof outputs.s3_bucket_cloudtrail === 'string' 
        ? JSON.parse(outputs.s3_bucket_cloudtrail) 
        : outputs.s3_bucket_cloudtrail;

      const rdsSecurityStatus = typeof outputs.rds_security_status === 'string' 
        ? JSON.parse(outputs.rds_security_status) 
        : outputs.rds_security_status;

      expect(mainBucket.kms_key_id).toBe(kmsKeyInfo.key_arn);
      expect(cloudtrailBucket.kms_key_id).toBe(kmsKeyInfo.key_arn);
      expect(rdsSecurityStatus.kms_key_id).toBe(kmsKeyInfo.key_arn);
    });
  });
});
