import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
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
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSS3ReplicationServiceRolePolicy'
        ),
      ],
    });

    // Apply Environment:Production tag to IAM role
    cdk.Tags.of(replicationRole).add('Environment', 'Production');
    cdk.Tags.of(replicationRole).add('Project', 'trainr302');

    // Add inline policy for specific replication permissions
    replicationRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObjectVersionForReplication',
          's3:GetObjectVersionAcl',
          's3:GetObjectVersionTagging',
        ],
        resources: [`${this.bucket.bucketArn}/*`],
      })
    );

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

      // Add bucket-level permissions
      const bucketArns = props.replicationBuckets.map(b => b.bucketArn);
      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['s3:GetBucketVersioning'],
          resources: [this.bucket.bucketArn, ...bucketArns],
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
