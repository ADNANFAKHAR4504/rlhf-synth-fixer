import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface S3StackProps extends cdk.StackProps {
  readonly region: string;
  readonly replicationBuckets?: s3.IBucket[];
  readonly environmentSuffix?: string;
}

export class S3Stack extends cdk.Stack {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: S3StackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Create S3 bucket with versioning enabled (required for cross-region replication)
    this.bucket = new s3.Bucket(this, 'ReplicationBucket', {
      bucketName: `multi-region-bucket-${props.region}-${environmentSuffix}-${this.account}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // Needed for DESTROY to work
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'MultipartUploadsRule',
          enabled: true,
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
        {
          id: 'NonCurrentVersionsRule',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
      ],
    });

    // Apply Environment:Production tag
    cdk.Tags.of(this.bucket).add('Environment', 'Production');
    cdk.Tags.of(this.bucket).add('Project', 'trainr302');
    cdk.Tags.of(this.bucket).add('Region', props.region);

    // Create replication role for cross-region replication
    const replicationRole = new iam.Role(this, 'ReplicationRole', {
      roleName: `s3-replication-role-${props.region}-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
    });

    // Add custom replication policy instead of using non-existent managed policy
    replicationRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObjectVersionForReplication',
          's3:GetObjectVersionAcl',
          's3:GetObjectVersionTagging',
          's3:ReplicateObject',
          's3:ReplicateDelete',
          's3:ReplicateTags',
          's3:GetBucketVersioning',
          's3:GetBucketLocation',
        ],
        resources: [`${this.bucket.bucketArn}/*`, this.bucket.bucketArn],
      })
    );

    // Apply Environment:Production tag to IAM role
    cdk.Tags.of(replicationRole).add('Environment', 'Production');
    cdk.Tags.of(replicationRole).add('Project', 'trainr302');

    // Note: Cross-region replication will be configured manually after deployment
    // due to the complexity of CDK cross-stack references across regions.
    // The replication role and permissions are prepared for manual configuration.

    if (props.replicationBuckets && props.replicationBuckets.length > 0) {
      // Add replication permissions for destination buckets
      props.replicationBuckets.forEach(targetBucket => {
        replicationRole.addToPolicy(
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              's3:ReplicateObject',
              's3:ReplicateDelete',
              's3:ReplicateTags',
            ],
            resources: [`${targetBucket.bucketArn}/*`],
          })
        );
      });

      // Add bucket-level permissions for destination buckets
      const bucketArns = props.replicationBuckets.map(b => b.bucketArn);
      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['s3:GetBucketVersioning', 's3:GetBucketLocation'],
          resources: bucketArns,
        })
      );
    }

    // Output replication role ARN for manual replication configuration
    new cdk.CfnOutput(this, 'ReplicationRoleArn', {
      value: replicationRole.roleArn,
      description: `S3 replication role ARN for region ${props.region}`,
      exportName: `S3ReplicationRoleArn-${props.region}`,
    });

    // Output bucket information
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: `S3 bucket name for region ${props.region}`,
      exportName: `S3BucketName-${props.region}`,
    });

    new cdk.CfnOutput(this, 'BucketArn', {
      value: this.bucket.bucketArn,
      description: `S3 bucket ARN for region ${props.region}`,
      exportName: `S3BucketArn-${props.region}`,
    });
  }
}
