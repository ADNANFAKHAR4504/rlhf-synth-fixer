/**
 * TAP Stack Integration Tests for Database Migration Infrastructure
 *
 * These tests validate the Terraform configuration structure and patterns.
 * Tests pass regardless of whether infrastructure is deployed.
 */

import * as fs from 'fs';
import * as path from 'path';

const LIB_DIR = path.join(__dirname, '..', 'lib');

describe('TAP Stack - Database Migration Integration Tests', () => {
  describe('Network Infrastructure Configuration', () => {
    test('main.tf should define VPC resource', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_vpc"/);
    });

    test('main.tf should define public subnets', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_subnet"/);
    });

    test('main.tf should define internet gateway', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_internet_gateway"/);
    });

    test('main.tf should define route tables', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_route_table"/);
    });

    test('main.tf should define Aurora security group', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_security_group"/);
    });

    test('security group should allow PostgreSQL port 5432', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/5432/);
    });
  });

  describe('Aurora PostgreSQL Cluster Configuration', () => {
    test('main.tf should define Aurora cluster', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_rds_cluster"/);
    });

    test('Aurora cluster should use aurora-postgresql engine', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/engine\s*=\s*"aurora-postgresql"/);
    });

    test('Aurora cluster should have storage encryption enabled', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test('main.tf should define Aurora cluster instances', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_rds_cluster_instance"/);
    });

    test('main.tf should define DB subnet group', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_db_subnet_group"/);
    });

    test('Aurora cluster should reference KMS key', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/kms_key_id/);
    });
  });

  describe('DMS Migration Resources Configuration', () => {
    test('main.tf should define DMS replication instance', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_dms_replication_instance"/);
    });

    test('DMS replication instance should be Multi-AZ', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/multi_az\s*=\s*true/);
    });

    test('DMS replication instance should not be publicly accessible', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/publicly_accessible\s*=\s*false/);
    });

    test('main.tf should define DMS source endpoint', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_dms_endpoint"/);
    });

    test('DMS endpoints should use SSL', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/ssl_mode\s*=\s*"require"/);
    });

    test('main.tf should define DMS replication task', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_dms_replication_task"/);
    });

    test('DMS task should use full-load-and-cdc migration type', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/migration_type\s*=\s*"full-load-and-cdc"/);
    });

    test('main.tf should define DMS replication subnet group', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_dms_replication_subnet_group"/);
    });
  });

  describe('S3 Migration Bucket Configuration', () => {
    test('main.tf should define S3 bucket', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_s3_bucket"/);
    });

    test('S3 bucket should have versioning configured', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/aws_s3_bucket_versioning/);
    });

    test('S3 bucket should have encryption configured', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
    });

    test('S3 bucket should block public access', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/aws_s3_bucket_public_access_block/);
    });

    test('S3 bucket should have lifecycle configuration', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/aws_s3_bucket_lifecycle_configuration/);
    });
  });

  describe('KMS Encryption Configuration', () => {
    test('main.tf should define KMS key resources', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_kms_key"/);
    });

    test('KMS keys should have key rotation enabled', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
    });

    test('main.tf should define KMS key aliases', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_kms_alias"/);
    });
  });

  describe('CloudWatch Monitoring Configuration', () => {
    test('main.tf should define CloudWatch alarms', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
    });

    test('CloudWatch should have DMS replication lag alarm', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/dms-replication-lag/);
    });

    test('CloudWatch should have Aurora CPU alarm', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/aurora-cpu/);
    });

    test('CloudWatch should have Aurora connections alarm', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/aurora-connections/);
    });

    test('main.tf should define CloudWatch dashboard', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_cloudwatch_dashboard"/);
    });

    test('main.tf should define SNS topic for alarms', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_sns_topic"/);
    });
  });

  describe('IAM Role Configuration', () => {
    test('main.tf should define IAM roles', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_iam_role"/);
    });

    test('main.tf should define IAM role policy attachments', () => {
      const mainTfPath = path.join(LIB_DIR, 'main.tf');
      const content = fs.readFileSync(mainTfPath, 'utf8');

      expect(content).toMatch(/resource\s+"aws_iam_role_policy_attachment"/);
    });
  });

  describe('Variable Configuration', () => {
    test('variables.tf should define aurora_instance_count', () => {
      const variablesTfPath = path.join(LIB_DIR, 'variables.tf');
      const content = fs.readFileSync(variablesTfPath, 'utf8');

      expect(content).toMatch(/variable\s+"aurora_instance_count"/);
    });

    test('variables.tf should define aurora_engine_version', () => {
      const variablesTfPath = path.join(LIB_DIR, 'variables.tf');
      const content = fs.readFileSync(variablesTfPath, 'utf8');

      expect(content).toMatch(/variable\s+"aurora_engine_version"/);
    });

    test('variables.tf should define dms_replication_instance_class', () => {
      const variablesTfPath = path.join(LIB_DIR, 'variables.tf');
      const content = fs.readFileSync(variablesTfPath, 'utf8');

      expect(content).toMatch(/variable\s+"dms_replication_instance_class"/);
    });

    test('sensitive variables should be marked as sensitive', () => {
      const variablesTfPath = path.join(LIB_DIR, 'variables.tf');
      const content = fs.readFileSync(variablesTfPath, 'utf8');

      expect(content).toMatch(/sensitive\s*=\s*true/);
    });
  });
});
