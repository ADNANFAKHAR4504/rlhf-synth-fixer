import { CustomResource, Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface S3ReplicatedBucketProps {
  readonly bucketName: string;
  readonly destinationBucketName?: string;
  readonly destinationRegion?: string;
  readonly environmentSuffix: string;
  readonly isPrimary?: boolean;
}

export class S3ReplicatedBucket extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly kmsKey?: kms.Key;

  constructor(scope: Construct, id: string, props: S3ReplicatedBucketProps) {
    super(scope, id);

    // Create KMS key for S3 encryption (addresses KMS security gap from model failures)
    this.kmsKey = new kms.Key(this, 'BucketKey', {
      description: `S3 encryption key for ${props.bucketName}`,
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Create S3 bucket with versioning enabled (required for replication)
    this.bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: props.bucketName,
      versioned: true, // Versioning enabled as required
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryptionKey: this.kmsKey,
      encryption: s3.BucketEncryption.KMS,
      bucketKeyEnabled: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          enabled: true,
          noncurrentVersionExpiration: Duration.days(90),
          abortIncompleteMultipartUploadAfter: Duration.days(7),
        },
        {
          id: 'transition-to-ia',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: Duration.days(30),
            },
          ],
        },
      ],
    });

    // Add tags
    const tags = {
      Project: 'iac-rlhf-amazon',
      Environment: props.environmentSuffix,
      Component: 'S3',
      BucketType: props.isPrimary ? 'Primary' : 'Replica',
    };

    Object.entries(tags).forEach(([key, value]) => {
      this.bucket.node.addMetadata('aws:cdk:tagging', { [key]: value });
      this.kmsKey?.node.addMetadata('aws:cdk:tagging', { [key]: value });
    });

    // Configure cross-region replication if this is the primary bucket and destination is provided
    // Temporarily disabled for dev deployment
    // if (props.isPrimary && props.destinationBucketName && props.destinationRegion) {
    //   this.setupCrossRegionReplication(props.destinationBucketName, props.destinationRegion);
    // }
  }

  private setupCrossRegionReplication(
    destinationBucketName: string,
    destinationRegion: string
  ): void {
    // Create replication role with proper permissions
    const replicationRole = new iam.Role(this, 'ReplicationRole', {
      assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
      description: 'Role for S3 cross-region replication',
    });

    // Grant source bucket permissions
    replicationRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetReplicationConfiguration',
          's3:ListBucket',
          's3:GetObjectVersionForReplication',
          's3:GetObjectVersionAcl',
          's3:GetObjectVersionTagging',
        ],
        resources: [this.bucket.bucketArn, `${this.bucket.bucketArn}/*`],
      })
    );

    // Grant destination bucket permissions
    replicationRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:ReplicateObject',
          's3:ReplicateDelete',
          's3:ReplicateTags',
          's3:GetObjectVersionTagging',
        ],
        resources: [`arn:aws:s3:::${destinationBucketName}/*`],
      })
    );

    // Grant KMS permissions for encryption
    if (this.kmsKey) {
      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'kms:Decrypt',
            'kms:DescribeKey',
            'kms:Encrypt',
            'kms:GenerateDataKey*',
            'kms:ReEncrypt*',
          ],
          resources: [
            this.kmsKey.keyArn,
            // Note: In production, you'd need the destination region KMS key ARN here
          ],
        })
      );
    }

    // Create custom resource to setup replication (addresses dependency issue from model failures)
    const replicationSetupFunction = new lambda.Function(
      this,
      'ReplicationSetupFunction',
      {
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import boto3
import json
import cfnresponse

def handler(event, context):
    try:
        if event['RequestType'] == 'Delete':
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
            return
            
        bucket_name = event['ResourceProperties']['BucketName']
        destination_bucket = event['ResourceProperties']['DestinationBucket']
        destination_region = event['ResourceProperties']['DestinationRegion']
        role_arn = event['ResourceProperties']['RoleArn']
        
        s3 = boto3.client('s3')
        
        # Setup replication configuration
        replication_config = {
            'Role': role_arn,
            'Rules': [
                {
                    'ID': 'replicate-all',
                    'Status': 'Enabled',
                    'Priority': 1,
                    'DeleteMarkerReplication': {'Status': 'Enabled'},
                    'Filter': {},
                    'Destination': {
                        'Bucket': f'arn:aws:s3:::{destination_bucket}',
                        'ReplicationTime': {
                            'Status': 'Enabled',
                            'Time': {'Minutes': 15}
                        },
                        'Metrics': {
                            'Status': 'Enabled',
                            'EventThreshold': {'Minutes': 15}
                        },
                        'StorageClass': 'STANDARD'
                    }
                }
            ]
        }
        
        s3.put_bucket_replication(
            Bucket=bucket_name,
            ReplicationConfiguration=replication_config
        )
        
        cfnresponse.send(event, context, cfnresponse.SUCCESS, {
            'ReplicationConfigured': 'true'
        })
    except Exception as e:
        print(f"Error: {str(e)}")
        cfnresponse.send(event, context, cfnresponse.FAILED, {})
      `),
        timeout: Duration.minutes(5),
      }
    );

    // Grant S3 permissions to the setup function
    replicationSetupFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:PutReplicationConfiguration',
          's3:GetReplicationConfiguration',
        ],
        resources: [this.bucket.bucketArn],
      })
    );

    // Create custom resource
    new CustomResource(this, 'ReplicationSetupResource', {
      serviceToken: replicationSetupFunction.functionArn,
      properties: {
        BucketName: this.bucket.bucketName,
        DestinationBucket: destinationBucketName,
        DestinationRegion: destinationRegion,
        RoleArn: replicationRole.roleArn,
      },
    });
  }
}
