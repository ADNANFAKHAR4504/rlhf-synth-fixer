import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface BackupStackProps {
  environmentSuffix: string;
}

export class BackupStack extends Construct {
  public readonly backupBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: BackupStackProps) {
    super(scope, id);

    // Create S3 bucket for database backups
    this.backupBucket = new s3.Bucket(this, 'DatabaseBackupBucket', {
      bucketName: `retail-db-backups-${cdk.Stack.of(this).account}-${props.environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldBackups',
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
          expiration: cdk.Duration.days(365),
        },
        {
          id: 'CleanupIncompleteMultipartUploads',
          enabled: true,
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Must be destroyable for testing
      autoDeleteObjects: true, // Automatically delete objects on bucket deletion
    });

    // Output bucket name
    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: this.backupBucket.bucketName,
      description: 'S3 bucket for database backups',
    });

    // Tag resources
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Application', 'RetailDatabase');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
