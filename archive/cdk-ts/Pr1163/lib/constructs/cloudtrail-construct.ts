import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface CloudTrailConstructProps {
  environment: string;
  s3BucketsToMonitor?: s3.Bucket[];
}

export class CloudTrailConstruct extends Construct {
  public readonly trail?: cloudtrail.Trail;
  public readonly cloudTrailLogGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: CloudTrailConstructProps) {
    super(scope, id);

    const { environment, s3BucketsToMonitor = [] } = props;

    // Create S3 bucket for CloudTrail logs
    const cloudTrailBucket = new s3.Bucket(
      this,
      `CloudTrailBucket-${environment}`,
      {
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        lifecycleRules: [
          {
            id: 'CloudTrailLogRetention',
            enabled: true,
            transitions: [
              {
                storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                transitionAfter: cdk.Duration.days(30),
              },
              {
                storageClass: s3.StorageClass.GLACIER,
                transitionAfter: cdk.Duration.days(90),
              },
            ],
            expiration: cdk.Duration.days(2555), // 7 years
          },
        ],
      }
    );

    // Create CloudWatch Log Group for CloudTrail
    this.cloudTrailLogGroup = new logs.LogGroup(
      this,
      `CloudTrailLogGroup-${environment}`,
      {
        retention: logs.RetentionDays.ONE_YEAR,
      }
    );

    // Skip CloudTrail creation for PR environments to avoid trail limit
    if (!environment.startsWith('pr')) {
      // Create CloudTrail with comprehensive logging for non-PR environments only
      this.trail = new cloudtrail.Trail(this, `CloudTrail-${environment}`, {
        trailName: `CloudTrail-${environment}`,
        bucket: cloudTrailBucket,
        cloudWatchLogGroup: this.cloudTrailLogGroup,
        cloudWatchLogsRetention: logs.RetentionDays.ONE_YEAR,
        enableFileValidation: true,
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
        sendToCloudWatchLogs: true,
        managementEvents: cloudtrail.ReadWriteType.ALL,
      });

      // Add S3 data event selectors for monitoring specific buckets
      s3BucketsToMonitor.forEach((bucket, _index) => {
        this.trail!.addS3EventSelector(
          [
            {
              bucket: bucket,
              objectPrefix: '',
            },
          ],
          {
            readWriteType: cloudtrail.ReadWriteType.ALL,
            includeManagementEvents: true,
          }
        );
      });

      // Tag CloudTrail resources
      cdk.Tags.of(this.trail).add('Name', `CloudTrail-${environment}`);
      cdk.Tags.of(this.trail).add('Component', 'Security');
      cdk.Tags.of(this.trail).add('Environment', environment);
    }
    cdk.Tags.of(cloudTrailBucket).add(
      'Name',
      `CloudTrailBucket-${environment}`
    );
    cdk.Tags.of(cloudTrailBucket).add('Component', 'Security');
    cdk.Tags.of(cloudTrailBucket).add('Environment', environment);
  }
}
