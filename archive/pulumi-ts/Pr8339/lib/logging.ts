import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { getCommonTags, primaryRegion } from './config';
import { LoadBalancerStack } from './load-balancer';
import { VpcStack } from './vpc';

// Detect if running in LocalStack
const isLocalStack = (): boolean => {
  const endpoint = process.env.AWS_ENDPOINT_URL || '';
  return endpoint.includes('localhost') || endpoint.includes('localstack');
};

// Get ELB service account for current region
const elbServiceAccount = aws.elb.getServiceAccount({
  region: primaryRegion,
});

export class LoggingStack extends pulumi.ComponentResource {
  public readonly cloudTrailArn: pulumi.Output<string>;
  public readonly cloudTrailName: pulumi.Output<string>;
  public readonly logBucketName: pulumi.Output<string>;
  public readonly flowLogsRoleName: pulumi.Output<string>;
  public readonly flowLogsPolicyName: pulumi.Output<string>;
  public readonly vpcLogGroupName: pulumi.Output<string>;

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
        forceDestroy: true,
        bucket: `${args.environment}-infrastructure-logs`,
        tags: {
          ...commonTags,
          Name: `${args.environment}-Infrastructure-Logs`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // S3 Bucket Versioning
    new aws.s3.BucketVersioningV2(
      `${args.environment}-logs-bucket-versioning`,
      {
        bucket: logBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // S3 Bucket Encryption
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `${args.environment}-logs-bucket-encryption`,
      {
        bucket: logBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      { provider: primaryProvider, parent: this }
    );

    // S3 Bucket Lifecycle
    new aws.s3.BucketLifecycleConfigurationV2(
      `${args.environment}-logs-bucket-lifecycle`,
      {
        bucket: logBucket.id,
        rules: [
          {
            id: 'expire-logs',
            status: 'Enabled',
            expiration: {
              days: 90,
            },
            noncurrentVersionExpiration: {
              noncurrentDays: 30,
            },
          },
        ],
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

    // Custom policy for VPC Flow Logs
    const flowLogsPolicy = new aws.iam.Policy(
      `${args.environment}-vpc-flow-logs-policy`,
      {
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { provider: primaryProvider, parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `${args.environment}-vpc-flow-logs-attachment`,
      {
        role: flowLogsRole.name,
        policyArn: flowLogsPolicy.arn,
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

    // VPC Flow Logs for Primary VPC (skip in LocalStack due to unsupported maxAggregationInterval)
    /* istanbul ignore if -- @preserve LocalStack doesn't support VPC Flow Logs with maxAggregationInterval */
    if (!isLocalStack()) {
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
    }

    // S3 Bucket Policy for ALB and CloudTrail logs
    new aws.s3.BucketPolicy(
      `${args.environment}-logs-bucket-policy`,
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
                {
                  Effect: 'Allow',
                  Principal: {
                    Service: 'cloudtrail.amazonaws.com',
                  },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/cloudtrail-logs/*`,
                  Condition: {
                    StringEquals: {
                      's3:x-amz-acl': 'bucket-owner-full-control',
                    },
                  },
                },
                {
                  Effect: 'Allow',
                  Principal: {
                    Service: 'cloudtrail.amazonaws.com',
                  },
                  Action: 's3:GetBucketAcl',
                  Resource: bucketArn,
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
                values: [logBucket.arn.apply(arn => `${arn}/*`)],
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
    this.cloudTrailName = cloudTrail.name;
    this.flowLogsRoleName = flowLogsRole.name;
    this.flowLogsPolicyName = flowLogsPolicy.name;
    this.vpcLogGroupName = vpcLogGroup.name;

    this.registerOutputs({
      cloudTrailArn: this.cloudTrailArn,
      cloudTrailName: this.cloudTrailName,
      logBucketName: this.logBucketName,
      flowLogsRoleName: this.flowLogsRoleName,
      flowLogsPolicyName: this.flowLogsPolicyName,
      vpcLogGroupName: this.vpcLogGroupName,
    });
  }
}
