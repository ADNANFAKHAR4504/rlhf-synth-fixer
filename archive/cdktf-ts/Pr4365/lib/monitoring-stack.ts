import { Cloudtrail } from '@cdktf/provider-aws/lib/cloudtrail';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { Construct } from 'constructs';

interface MonitoringStackProps {
  environmentSuffix: string;
  primaryProvider: AwsProvider;
}

export class MonitoringStack extends Construct {
  public readonly snsTopicArn: string;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    const { environmentSuffix, primaryProvider } = props;

    // SNS Topic for alerts
    const snsTopic = new SnsTopic(this, 'alert-topic', {
      provider: primaryProvider,
      name: `healthcare-alerts-${environmentSuffix}`,
      displayName: 'Healthcare DR Alerts',
      tags: {
        Name: `healthcare-alerts-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Email subscription (in production, replace with actual email)
    new SnsTopicSubscription(this, 'alert-subscription', {
      provider: primaryProvider,
      topicArn: snsTopic.arn,
      protocol: 'email',
      endpoint: 'ops-team@example.com',
    });

    // CloudWatch Log Groups
    new CloudwatchLogGroup(this, 'application-logs', {
      provider: primaryProvider,
      name: `/aws/healthcare/application-${environmentSuffix}`,
      retentionInDays: 30,
      tags: {
        Name: `application-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new CloudwatchLogGroup(this, 'dr-logs', {
      provider: primaryProvider,
      name: `/aws/healthcare/disaster-recovery-${environmentSuffix}`,
      retentionInDays: 30,
      tags: {
        Name: `dr-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // CloudTrail for audit logging
    const cloudtrailBucket = new S3Bucket(this, 'cloudtrail-bucket', {
      provider: primaryProvider,
      bucket: `healthcare-cloudtrail-${environmentSuffix}`,
      forceDestroy: true,
      tags: {
        Name: `healthcare-cloudtrail-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new S3BucketPublicAccessBlock(this, 'cloudtrail-bucket-block', {
      provider: primaryProvider,
      bucket: cloudtrailBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    const cloudtrailBucketPolicy = new S3BucketPolicy(
      this,
      'cloudtrail-bucket-policy',
      {
        provider: primaryProvider,
        bucket: cloudtrailBucket.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AWSCloudTrailAclCheck',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
              Action: 's3:GetBucketAcl',
              Resource: cloudtrailBucket.arn,
            },
            {
              Sid: 'AWSCloudTrailWrite',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
              Action: 's3:PutObject',
              Resource: `${cloudtrailBucket.arn}/*`,
              Condition: {
                StringEquals: {
                  's3:x-amz-acl': 'bucket-owner-full-control',
                },
              },
            },
          ],
        }),
      }
    );

    new Cloudtrail(this, 'audit-trail', {
      provider: primaryProvider,
      dependsOn: [cloudtrailBucket, cloudtrailBucketPolicy],
      name: `healthcare-audit-trail-${environmentSuffix}`,
      s3BucketName: cloudtrailBucket.id,
      enableLogging: true,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogFileValidation: true,
      eventSelector: [
        {
          readWriteType: 'All',
          includeManagementEvents: true,
        },
      ],
      tags: {
        Name: `healthcare-audit-trail-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    this.snsTopicArn = snsTopic.arn;
  }
}
