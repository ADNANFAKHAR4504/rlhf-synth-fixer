import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { IConstruct } from 'constructs';
import { ValidationRegistry } from '../core/validation-registry';

export class S3EncryptionAspect implements cdk.IAspect {
  visit(node: IConstruct): void {
    if (node instanceof s3.CfnBucket) {
      this.validateS3Encryption(node);
    }
  }

  private validateS3Encryption(bucket: s3.CfnBucket): void {
    const startTime = Date.now();

    // Check if encryption is configured
    const hasEncryption = bucket.bucketEncryption !== undefined;
    const encryptionConfig = bucket.bucketEncryption as any;

    if (
      !hasEncryption ||
      !encryptionConfig?.serverSideEncryptionConfiguration
    ) {
      ValidationRegistry.addFinding({
        severity: 'critical',
        category: 'S3',
        resource: bucket.node.path,
        message: 'S3 bucket does not have encryption enabled',
        remediation:
          'Enable encryption on the S3 bucket using S3_MANAGED, KMS_MANAGED, or DSSE encryption',
        executionTime: Date.now() - startTime,
        metadata: {
          bucketName: bucket.bucketName || 'unknown',
          logicalId: bucket.logicalId,
        },
      });
    } else {
      // Validate encryption configuration
      const rules = encryptionConfig.serverSideEncryptionConfiguration;
      if (!Array.isArray(rules) || rules.length === 0) {
        ValidationRegistry.addFinding({
          severity: 'critical',
          category: 'S3',
          resource: bucket.node.path,
          message: 'S3 bucket encryption configuration is invalid',
          remediation: 'Configure valid server-side encryption rules',
          executionTime: Date.now() - startTime,
          metadata: {
            bucketName: bucket.bucketName || 'unknown',
          },
        });
      } else {
        // Encryption is properly configured
        ValidationRegistry.addFinding({
          severity: 'info',
          category: 'S3',
          resource: bucket.node.path,
          message: 'S3 bucket has encryption enabled',
          remediation:
            'Continue to maintain encryption settings and review encryption type periodically',
          executionTime: Date.now() - startTime,
          metadata: {
            bucketName: bucket.bucketName || 'unknown',
            encryptionType:
              rules[0]?.serverSideEncryptionByDefault?.sseAlgorithm ||
              'unknown',
          },
        });
      }
    }
  }
}
