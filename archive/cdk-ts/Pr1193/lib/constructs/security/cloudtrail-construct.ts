import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { SecurityConfig } from '../../config/security-config';

interface CloudTrailConstructProps {
  encryptionKey: kms.Key;
  enabled?: boolean;
}

/**
 * CloudTrail Construct for comprehensive API call logging
 * Records all API calls made to AWS accounts for security auditing
 */
export class CloudTrailConstruct extends Construct {
  public readonly trail?: cloudtrail.Trail;
  public readonly logBucket?: s3.Bucket;
  public readonly logGroup?: logs.LogGroup;

  constructor(scope: Construct, id: string, props: CloudTrailConstructProps) {
    super(scope, id);

    const { encryptionKey, enabled = true } = props;

    // Only create CloudTrail resources if enabled
    if (!enabled) {
      return;
    }

    // S3 bucket for CloudTrail logs
    this.logBucket = new s3.Bucket(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-CloudTrail-Bucket`,
      {
        bucketName: `${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-ct-${cdk.Stack.of(this).account}-${cdk.Stack.of(this).region}-${new Date()
          .toISOString()
          .replace(/[-:T.]/g, '')
          .slice(0, 8)}`,
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

    // CloudWatch Log Group for CloudTrail - make name unique, temporarily without KMS encryption
    this.logGroup = new logs.LogGroup(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-CloudTrail-Logs`,
      {
        logGroupName: `/aws/cloudtrail/${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}`,
        retention: logs.RetentionDays.ONE_YEAR,
        // Temporarily removed KMS encryption to resolve dependency issue
        // encryptionKey: encryptionKey,
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

    // Ensure Trail depends on the KMS key and LogGroup
    this.trail.node.addDependency(encryptionKey);
    this.trail.node.addDependency(this.logGroup);

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
