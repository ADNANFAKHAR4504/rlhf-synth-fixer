import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface MigrationStorageStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class MigrationStorageStack extends cdk.Stack {
  public readonly backupBucket: s3.Bucket;

  constructor(
    scope: Construct,
    id: string,
    props?: MigrationStorageStackProps
  ) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Generate unique suffix for bucket name
    const uniqueSuffix = Math.random().toString(36).substring(2, 15);

    // Create S3 bucket for migration backups
    this.backupBucket = new s3.Bucket(this, 'MigrationBackupBucket', {
      bucketName: `migration-backup-${environmentSuffix}-${uniqueSuffix}`,
      versioned: true, // Enable versioning for backup data
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow destruction for testing
      autoDeleteObjects: true, // Automatically delete objects when bucket is destroyed
    });

    // Apply tags
    cdk.Tags.of(this).add('Project', 'Migration');
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Component', 'Storage');

    // Output bucket name
    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: this.backupBucket.bucketName,
      description: 'S3 bucket name for migration backups',
      exportName: `migration-backup-bucket-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BackupBucketArn', {
      value: this.backupBucket.bucketArn,
      description: 'S3 bucket ARN for migration backups',
      exportName: `migration-backup-bucket-arn-${environmentSuffix}`,
    });
  }
}
