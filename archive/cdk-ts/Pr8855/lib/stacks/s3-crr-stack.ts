// stacks/s3-crr-stack.ts
import {
  CfnOutput,
  Stack,
  StackProps,
  Tags,
  aws_iam as iam,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface S3CRRStackProps extends StackProps {
  sourceBucketName: string;
  destinationBucketName: string;
}

export class S3CRRStack extends Stack {
  public readonly replicationRole: iam.Role;

  constructor(scope: Construct, id: string, props: S3CRRStackProps) {
    super(scope, id, props);

    const { sourceBucketName, destinationBucketName } = props;

    this.replicationRole = new iam.Role(this, 'ReplicationRole', {
      assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
    });

    this.replicationRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
        resources: [`arn:aws:s3:::${sourceBucketName}`],
      })
    );

    this.replicationRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObjectVersion', 's3:GetObjectVersionAcl'],
        resources: [`arn:aws:s3:::${sourceBucketName}/*`],
      })
    );

    this.replicationRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:ReplicateObject', 's3:ReplicateDelete'],
        resources: [`arn:aws:s3:::${destinationBucketName}/*`],
      })
    );

    // Note: Bucket policy and replication configuration are applied directly
    // in the RegionalResourcesStack where the actual bucket resources are created.
    // This stack only creates the IAM replication role.

    // S3 Cross-Region Replication configuration
    // Since sourceBucket is imported via fromBucketName, we can't access its CfnBucket
    // The replication configuration needs to be applied to the actual bucket resource
    // in the RegionalResourcesStack where the bucket is created

    // Output replication role ARN for reference
    new CfnOutput(this, 'ReplicationRoleArn', {
      value: this.replicationRole.roleArn,
      description: 'IAM Role ARN for S3 Cross-Region Replication',
    });

    new CfnOutput(this, 'SourceBucketName', {
      value: sourceBucketName,
      description: 'Source bucket name for replication setup',
    });

    new CfnOutput(this, 'DestinationBucketName', {
      value: destinationBucketName,
      description: 'Destination bucket name for replication setup',
    });

    new CfnOutput(this, 'ReplicationConfigCommand', {
      value: `aws s3api put-bucket-replication --bucket ${sourceBucketName} --replication-configuration file://replication-config.json`,
      description:
        'AWS CLI command to configure replication (create replication-config.json first)',
    });

    // Add tags
    Tags.of(this).add('Stack', 'S3CRR');
  }
}
