import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface MultiRegionStackProps extends cdk.StackProps {
  environmentSuffix: string;
  primaryRegion: string;
}

export class MultiRegionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MultiRegionStackProps) {
    super(scope, id, props);

    const { environmentSuffix, primaryRegion } = props;

    // Cross-region replication role
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
                `arn:aws:s3:::ha-app-data-${environmentSuffix}-${primaryRegion}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:ReplicateObject',
                's3:ReplicateDelete',
                's3:ReplicateTags',
              ],
              resources: [
                `arn:aws:s3:::ha-app-dr-${environmentSuffix}-${this.region}/*`,
              ],
            }),
          ],
        }),
      },
    });

    // Disaster recovery bucket in secondary region
    const drBucket = new s3.Bucket(this, 'DisasterRecoveryBucket', {
      bucketName: `ha-app-dr-${environmentSuffix}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Output for primary stack to reference
    new cdk.CfnOutput(this, 'DRBucketName', {
      value: drBucket.bucketName,
      description: 'Disaster Recovery Bucket Name',
      exportName: `dr-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ReplicationRoleArn', {
      value: replicationRole.roleArn,
      description: 'S3 Cross-Region Replication Role ARN',
      exportName: `replication-role-${environmentSuffix}`,
    });
  }
}
