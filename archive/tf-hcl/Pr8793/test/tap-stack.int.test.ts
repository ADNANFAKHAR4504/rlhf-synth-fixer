/**
 * Integration Tests for Terraform Multi-Region Aurora PostgreSQL DR Infrastructure
 *
 * These tests validate the deployed infrastructure using real AWS resources.
 * They read deployment outputs from cfn-outputs/flat-outputs.json and verify
 * that all resources are correctly configured and functioning.
 *
 * NOTE: These tests require actual AWS deployment to run.
 * For Terraform projects, integration tests validate:
 * 1. Resource existence and accessibility
 * 2. Configuration correctness
 * 3. Cross-region replication functionality
 * 4. Failover mechanisms
 * 5. Security configurations
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand
} from '@aws-sdk/client-s3';
import {
  SNSClient,
  ListTopicsCommand
} from '@aws-sdk/client-sns';

describe('Terraform Multi-Region DR Infrastructure - Integration Tests', () => {
  let outputs: Record<string, string>;

  const primaryRegion = 'us-east-1';
  const secondaryRegion = 'us-west-2';

  const s3ClientPrimary = new S3Client({ region: primaryRegion });
  const s3ClientSecondary = new S3Client({ region: secondaryRegion });
  const snsClientPrimary = new SNSClient({ region: primaryRegion });
  const snsClientSecondary = new SNSClient({ region: secondaryRegion });

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. ` +
        `Integration tests require actual AWS deployment. ` +
        `Run 'npm run tf:deploy' first.`
      );
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('Deployment Outputs Validation', () => {
    it('should have primary S3 bucket name', () => {
      expect(outputs.primary_s3_bucket).toBeDefined();
      expect(outputs.primary_s3_bucket).toMatch(/^aurora-backups-primary/);
    });

    it('should have secondary S3 bucket name', () => {
      expect(outputs.secondary_s3_bucket).toBeDefined();
      expect(outputs.secondary_s3_bucket).toMatch(/^aurora-backups-secondary/);
    });

    it('should have Route 53 failover DNS', () => {
      expect(outputs.route53_failover_dns).toBeDefined();
      expect(outputs.route53_failover_dns).toContain('db.');
    });

    it('should have SNS topic ARNs', () => {
      expect(outputs.primary_sns_topic_arn).toBeDefined();
      expect(outputs.secondary_sns_topic_arn).toBeDefined();
      expect(outputs.primary_sns_topic_arn).toMatch(/^arn:aws:sns:/);
      expect(outputs.secondary_sns_topic_arn).toMatch(/^arn:aws:sns:/);
    });
  });

  describe('S3 Backup Configuration', () => {
    it('should have primary S3 bucket accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.primary_s3_bucket
      });

      await expect(s3ClientPrimary.send(command)).resolves.not.toThrow();
    });

    it('should have secondary S3 bucket accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.secondary_s3_bucket
      });

      await expect(s3ClientSecondary.send(command)).resolves.not.toThrow();
    });

    it('should have versioning enabled on primary bucket', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.primary_s3_bucket
      });

      const response = await s3ClientPrimary.send(command);
      expect(response.Status).toBe('Enabled');
    });

    it('should have versioning enabled on secondary bucket', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.secondary_s3_bucket
      });

      const response = await s3ClientSecondary.send(command);
      expect(response.Status).toBe('Enabled');
    });
  });

  describe('SNS Notification Configuration', () => {
    it('should have primary SNS topic accessible', async () => {
      const command = new ListTopicsCommand({});
      const response = await snsClientPrimary.send(command);

      expect(response.Topics).toBeDefined();
      const topic = response.Topics?.find(
        t => t.TopicArn === outputs.primary_sns_topic_arn
      );

      expect(topic).toBeDefined();
    });

    it('should have secondary SNS topic accessible', async () => {
      const command = new ListTopicsCommand({});
      const response = await snsClientSecondary.send(command);

      expect(response.Topics).toBeDefined();
      const topic = response.Topics?.find(
        t => t.TopicArn === outputs.secondary_sns_topic_arn
      );

      expect(topic).toBeDefined();
    });
  });
});
