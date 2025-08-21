import * as cdk from 'aws-cdk-lib';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as s3 from 'aws-cdk-lib/aws-s3';
// import * as iam from 'aws-cdk-lib/aws-iam'; // Uncomment when IAM resources are needed
import { Construct } from 'constructs';

export interface MultiRegionSecurityStackProps extends cdk.StackProps {
  environmentSuffix: string;
  primaryRegion: string;
  replicationRegion: string;
  primaryFlowLogsBucket: s3.IBucket;
}

export class MultiRegionSecurityStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: MultiRegionSecurityStackProps
  ) {
    super(scope, id, props);

    // Cross-region replication bucket for flow logs
    const replicationBucket = new s3.Bucket(this, 'FlowLogsReplicationBucket', {
      bucketName: `tap-${props.environmentSuffix}-flow-logs-replica-${this.account}-${props.replicationRegion}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'ReplicaRetention',
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
          expiration: cdk.Duration.days(2555),
        },
      ],
    });

    // GuardDuty in secondary region
    const secondaryGuardDuty = new guardduty.CfnDetector(
      this,
      'SecondaryGuardDutyDetector',
      {
        enable: true,
        findingPublishingFrequency: 'FIFTEEN_MINUTES',
        // Using Features API instead of DataSources (deprecated)
        features: [
          {
            name: 'S3_DATA_EVENTS',
            status: 'ENABLED',
          },
          {
            name: 'EKS_AUDIT_LOGS',
            status: 'ENABLED',
          },
          {
            name: 'EBS_MALWARE_PROTECTION',
            status: 'ENABLED',
          },
          {
            name: 'RDS_LOGIN_EVENTS',
            status: 'ENABLED',
          },
          {
            name: 'EKS_RUNTIME_MONITORING',
            status: 'ENABLED',
          },
          {
            name: 'LAMBDA_NETWORK_LOGS',
            status: 'ENABLED',
          },
        ],
      }
    );

    new cdk.CfnOutput(this, 'ReplicationBucketName', {
      value: replicationBucket.bucketName,
      description: 'Flow Logs Replication Bucket Name',
    });

    new cdk.CfnOutput(this, 'SecondaryGuardDutyDetectorId', {
      value: secondaryGuardDuty.ref,
      description: 'Secondary Region GuardDuty Detector ID',
    });
  }
}
