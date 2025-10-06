import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

interface StorageStackProps {
  environmentSuffix: string;
}

export class StorageStack extends cdk.NestedStack {
  public readonly datasetBucket: s3.Bucket;
  public readonly modelBucket: s3.Bucket;
  public readonly ecrRepository: ecr.Repository;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id);

    this.datasetBucket = new s3.Bucket(this, 'DatasetBucket', {
      bucketName: `training-datasets-${props.environmentSuffix}-${cdk.Stack.of(this).account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    this.modelBucket = new s3.Bucket(this, 'ModelBucket', {
      bucketName: `model-artifacts-${props.environmentSuffix}-${cdk.Stack.of(this).account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'archive-old-models',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(180),
            },
          ],
        },
      ],
    });

    this.ecrRepository = new ecr.Repository(this, 'TrainingRepository', {
      repositoryName: `training-containers-${props.environmentSuffix}`,
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          maxImageCount: 50,
        },
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'DatasetBucketName', {
      value: this.datasetBucket.bucketName,
      description: 'Training dataset S3 bucket name',
    });

    new cdk.CfnOutput(this, 'ModelBucketName', {
      value: this.modelBucket.bucketName,
      description: 'Model artifacts S3 bucket name',
    });

    new cdk.CfnOutput(this, 'ECRRepositoryUri', {
      value: this.ecrRepository.repositoryUri,
      description: 'ECR repository URI for training containers',
    });
  }
}
