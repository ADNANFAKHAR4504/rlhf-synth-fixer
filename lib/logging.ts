import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { getCommonTags, primaryRegion } from './config';
import { LoadBalancerStack } from './load-balancer';
import { VpcStack } from './vpc';

// Get ELB service account for current region
const elbServiceAccount = aws.elb.getServiceAccount({
  region: primaryRegion,
});

export class LoggingStack extends pulumi.ComponentResource {
  public readonly cloudTrailArn: pulumi.Output<string>;
  public readonly logBucketName: pulumi.Output<string>;

  constructor(
    name: string,
    args: {
      environment: string;
      tags: Record<string, string>;
      vpcStack: VpcStack;
      loadBalancerStack: LoadBalancerStack;
    },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:logging:LoggingStack', name, {}, opts);

    const commonTags = { ...getCommonTags(args.environment), ...args.tags };
    const primaryProvider = new aws.Provider(
      `${args.environment}-primary-provider`,
      { region: primaryRegion },
      { parent: this }
    );

    // S3 Bucket for logs
    const logBucket = new aws.s3.Bucket(
      `${args.environment}-logs-bucket`,
      {
        bucket: `${args.environment}-infrastructure-logs-${Date.now()}`,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        lifecycleRules: [
          {
            enabled: true,
            expiration: {
              days: 90,
            },
            noncurrentVersionExpiration: {
              days: 30,
            },
          },
        ],
        tags: {
          ...commonTags,
          Name: `${args.environment}-Infrastructure-Logs`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    this.logBucketName = logBucket.bucket;

    // Block public access to log bucket
    new aws.s3.BucketPublicAccessBlock(
      `${args.environment}-logs-bucket-pab`,
      {
        bucket: logBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { provider: primaryProvider, parent: this }
    );

    // IAM Role for VPC Flow Logs
    const flowLogsRole = new aws.iam.Role(
      `${args.environment}-vpc-flow-logs-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          ...commonTags,
          Name: `${args.environment}-VPC-Flow-Logs-Role`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Policy for VPC Flow Logs
    new aws.iam.RolePolicyAttachment(
      `${args.environment}-vpc-flow-logs-policy`,
      {
        role: flowLogsRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/VPCFlowLogsDeliveryRolePolicy',
      },
      { provider: primaryProvider, parent: this }
    );

    // CloudWatch Log Group for VPC Flow Logs
    const vpcLogGroup = new aws.cloudwatch.LogGroup(
      `${args.environment}-vpc-flow-logs`,
      {
        name: `/aws/vpc/flowlogs/${args.environment}`,
        retentionInDays: 30,
        tags: {
          ...commonTags,
          Name: `${args.environment}-VPC-Flow-Logs`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // VPC Flow Logs for Primary VPC
    new aws.ec2.FlowLog(
      `${args.environment}-primary-vpc-flow-logs`,
      {
        iamRoleArn: flowLogsRole.arn,
        logDestination: vpcLogGroup.arn,
        logDestinationType: 'cloud-watch-logs',
        vpcId: args.vpcStack.primaryVpc.id,
        trafficType: 'ALL',
        tags: {
          ...commonTags,
          Name: `${args.environment}-Primary-VPC-Flow-Logs`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // ALB Access Logs
    new aws.s3.BucketPolicy(
      `${args.environment}-alb-logs-policy`,
      {
        bucket: logBucket.id,
        policy: pulumi
          .all([logBucket.arn, elbServiceAccount])
          .apply(([bucketArn, elbAccount]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: {
                    AWS: elbAccount.arn,
                  },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/alb-logs/*`,
                },
                {
                  Effect: 'Allow',
                  Principal: {
                    Service: 'delivery.logs.amazonaws.com',
                  },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/alb-logs/*`,
                  Condition: {
                    StringEquals: {
                      's3:x-amz-acl': 'bucket-owner-full-control',
                    },
                  },
                },
              ],
            })
          ),
      },
      { provider: primaryProvider, parent: this }
    );

    // Note: ALB Access Logs need to be configured directly on the LoadBalancer resource
    // This is handled in the load-balancer.ts file

    // CloudTrail
    const cloudTrail = new aws.cloudtrail.Trail(
      `${args.environment}-cloudtrail`,
      {
        name: `${args.environment}-infrastructure-trail`,
        s3BucketName: logBucket.bucket,
        s3KeyPrefix: 'cloudtrail-logs',
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
        enableLogFileValidation: true,
        eventSelectors: [
          {
            readWriteType: 'All',
            includeManagementEvents: true,
            dataResources: [
              {
                type: 'AWS::S3::Object',
                values: ['arn:aws:s3:::*/*'],
              },
            ],
          },
        ],
        tags: {
          ...commonTags,
          Name: `${args.environment}-Infrastructure-CloudTrail`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    this.cloudTrailArn = cloudTrail.arn;

    this.registerOutputs({
      cloudTrailArn: this.cloudTrailArn,
      logBucketName: this.logBucketName,
    });
  }
}
