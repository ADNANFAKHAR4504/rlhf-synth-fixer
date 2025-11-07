import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';

interface FlowLogsConstructProps {
  environmentSuffix: string;
  vpcId: string;
}

export class FlowLogsConstruct extends Construct {
  public readonly flowLogsBucketName: string;
  public readonly flowLogId: string;

  constructor(scope: Construct, id: string, props: FlowLogsConstructProps) {
    super(scope, id);

    const { environmentSuffix, vpcId } = props;

    // Create S3 bucket for VPC Flow Logs
    const flowLogsBucket = new S3Bucket(this, 'FlowLogsBucket', {
      bucket: `payment-flow-logs-${environmentSuffix}`,
      forceDestroy: true,
      tags: {
        Name: `payment-flow-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      },
    });

    this.flowLogsBucketName = flowLogsBucket.bucket;

    // Block public access to flow logs bucket
    new S3BucketPublicAccessBlock(this, 'FlowLogsBucketPublicAccessBlock', {
      bucket: flowLogsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Enable server-side encryption
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'FlowLogsBucketEncryption',
      {
        bucket: flowLogsBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Configure lifecycle policy for 90-day retention
    new S3BucketLifecycleConfiguration(this, 'FlowLogsBucketLifecycle', {
      bucket: flowLogsBucket.id,
      rule: [
        {
          id: 'delete-old-logs',
          status: 'Enabled',
          expiration: [
            {
              days: 90,
            },
          ],
        },
      ],
    });

    // Create IAM role for VPC Flow Logs
    const flowLogsRole = new IamRole(this, 'FlowLogsRole', {
      name: `payment-flow-logs-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `payment-flow-logs-role-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      },
    });

    // Create IAM policy for flow logs to write to S3
    new IamRolePolicy(this, 'FlowLogsPolicy', {
      name: `payment-flow-logs-policy-${environmentSuffix}`,
      role: flowLogsRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:GetBucketLocation', 's3:ListBucket'],
            Resource: [flowLogsBucket.arn, `${flowLogsBucket.arn}/*`],
          },
        ],
      }),
    });

    // Create VPC Flow Log
    const flowLog = new FlowLog(this, 'VPCFlowLog', {
      vpcId: vpcId,
      trafficType: 'ALL',
      logDestinationType: 's3',
      logDestination: flowLogsBucket.arn,
      tags: {
        Name: `payment-flow-log-${environmentSuffix}`,
        Environment: environmentSuffix,
        Project: 'PaymentProcessing',
        CostCenter: 'FinTech',
      },
    });

    this.flowLogId = flowLog.id;
  }
}
