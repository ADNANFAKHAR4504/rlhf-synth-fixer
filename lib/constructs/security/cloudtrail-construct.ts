import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import { SecurityConfig } from '../../config/security-config';

/**
 * CloudTrail Construct for comprehensive API call logging
 * Records all API calls made to AWS accounts for security auditing
 */
export class CloudTrailConstruct extends Construct {
  public readonly trail: cloudtrail.Trail;
  public readonly logBucket: s3.Bucket;
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, encryptionKey: kms.Key) {
    super(scope, id);

    // S3 bucket for CloudTrail logs
    this.logBucket = new s3.Bucket(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-CloudTrail-Bucket`,
      {
        bucketName: `${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-cloudtrail-logs-${this.node.addr.slice(-8)}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: encryptionKey,
        versioned: true,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        lifecycleRules: [
          {
            id: 'DeleteOldCloudTrailLogs',
            expiration: cdk.Duration.days(SecurityConfig.LOG_RETENTION_DAYS),
          },
        ],
      }
    );

    // CloudWatch Log Group for CloudTrail
    this.logGroup = new logs.LogGroup(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-CloudTrail-Logs`,
      {
        logGroupName: `/aws/cloudtrail/${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}`,
        retention: logs.RetentionDays.ONE_YEAR,
        encryptionKey: encryptionKey,
      }
    );

    // CloudTrail with comprehensive logging
    this.trail = new cloudtrail.Trail(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-CloudTrail`,
      {
        trailName: `${SecurityConfig.RESOURCE_PREFIX}-CloudTrail`,
        bucket: this.logBucket,
        cloudWatchLogGroup: this.logGroup,
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
        enableFileValidation: true,
        encryptionKey: encryptionKey,
        s3KeyPrefix: 'cloudtrail-logs/',
      }
    );

    // Add advanced event selectors for comprehensive logging
    const cfnTrail = this.trail.node.defaultChild as cloudtrail.CfnTrail;
    cfnTrail.addPropertyOverride('AdvancedEventSelectors', [
      {
        Name: 'All Management Events',
        FieldSelectors: [
          {
            Field: 'eventCategory',
            Equals: ['Management'],
          },
        ],
      },
      {
        Name: 'S3 Data Events',
        FieldSelectors: [
          {
            Field: 'eventCategory',
            Equals: ['Data'],
          },
          {
            Field: 'resources.type',
            Equals: ['AWS::S3::Object'],
          },
        ],
      },
      {
        Name: 'Lambda Data Events',
        FieldSelectors: [
          {
            Field: 'eventCategory',
            Equals: ['Data'],
          },
          {
            Field: 'resources.type',
            Equals: ['AWS::Lambda::Function'],
          },
        ],
      },
    ]);
  }
}
