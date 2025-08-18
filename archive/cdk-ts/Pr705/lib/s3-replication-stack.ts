import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface S3ReplicationStackProps extends cdk.StackProps {
  environment: 'production' | 'development';
  applicationName: string;
  isPrimaryRegion: boolean;
  replicationRegions: string[];
}

export class S3ReplicationStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: S3ReplicationStackProps) {
    super(scope, id, props);

    const {
      environment,
      applicationName,
      isPrimaryRegion,
      replicationRegions,
    } = props;

    // Create replication role
    const replicationRole = new iam.Role(this, 'ReplicationRole', {
      assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
      inlinePolicies: {
        ReplicationPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObjectVersionForReplication',
                's3:GetObjectVersionAcl',
                's3:GetObjectVersionTagging',
              ],
              resources: [
                `arn:aws:s3:::${applicationName}-${environment}-content-*/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:ReplicateObject',
                's3:ReplicateDelete',
                's3:ReplicateTags',
              ],
              resources: replicationRegions.map(
                region =>
                  `arn:aws:s3:::${applicationName}-${environment}-content-${region}/*`
              ),
            }),
          ],
        }),
      },
    });

    // Create S3 bucket with replication configuration
    this.bucket = new s3.Bucket(this, 'ContentBucket', {
      bucketName: `${applicationName}-${environment}-content-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          id: 'TransitionToIA',
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
        },
      ],
    });

    // Add replication rules if this is the primary region
    if (isPrimaryRegion && replicationRegions.length > 0) {
      const cfnBucket = this.bucket.node.defaultChild as s3.CfnBucket;
      cfnBucket.replicationConfiguration = {
        role: replicationRole.roleArn,
        rules: replicationRegions.map(region => ({
          id: `ReplicateTo${region}`,
          status: 'Enabled',
          prefix: '',
          destination: {
            bucket: `arn:aws:s3:::${applicationName}-${environment}-content-${region}`,
            storageClass: 'STANDARD',
          },
        })),
      };
    }

    // Store bucket name in Parameter Store
    new ssm.StringParameter(this, 'BucketNameParameter', {
      parameterName: `/${applicationName}/${environment}/${this.region}/s3-bucket-name`,
      stringValue: this.bucket.bucketName,
      description: `S3 bucket name for ${applicationName} ${environment} in ${this.region}`,
    });

    // Tags
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('Application', applicationName);
    cdk.Tags.of(this).add('Region', this.region!);

    // Output
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `${id}-BucketName`,
    });
  }
}
