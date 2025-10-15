import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as inspector from 'aws-cdk-lib/aws-inspectorv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  cloudTrailBucket: s3.Bucket;
  kmsKey: kms.Key;
  vpc: ec2.Vpc;
  ec2InstanceRole: iam.Role;
  tags?: { [key: string]: string };
}

export class MonitoringStack extends cdk.NestedStack {
  public readonly trail: cloudtrail.Trail;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // Create CloudTrail
    this.trail = new cloudtrail.Trail(this, 'CloudTrail', {
      trailName: `${props.environmentSuffix}-trail-v4`,
      bucket: props.cloudTrailBucket,
      encryptionKey: props.kmsKey,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: false,
      enableFileValidation: true,
      sendToCloudWatchLogs: true,
      cloudWatchLogsRetention: cdk.aws_logs.RetentionDays.ONE_YEAR,
    });

    // Create Config Service
    const configRole = new iam.Role(this, 'ConfigRole', {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWS_ConfigRole'
        ),
      ],
    });

    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      bucketName: `${cdk.Stack.of(this).account}-${props.environmentSuffix}-config-v4`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.kmsKey,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-config',
          enabled: true,
          expiration: cdk.Duration.days(365),
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    configBucket.grantWrite(configRole);

    // NOTE: AWS Config Rules require a Configuration Recorder in the region.
    // Since AWS Config allows only ONE Configuration Recorder per region and
    // the region may not have one configured, we don't create Config Rules here.
    //
    // To enable Config Rules:
    // 1. Manually set up a Configuration Recorder in the region (one-time setup)
    // 2. Uncomment the Config Rules below
    //
    // Recommended Config Rules:
    // - REQUIRED_TAGS: Verify all resources have 'iac-rlhf-amazon' tag
    // - EC2_EBS_ENCRYPTION_BY_DEFAULT: Ensure EBS volumes are encrypted
    // - S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED: Ensure S3 buckets are encrypted

    // Inspector V2 - Enable scanning
    new inspector.CfnFilter(this, 'InspectorFilter', {
      name: `${props.environmentSuffix}-ec2-filter-v4`,
      filterAction: 'NONE',
      filterCriteria: {
        resourceType: [
          {
            comparison: 'EQUALS',
            value: 'AWS_EC2_INSTANCE',
          },
        ],
      },
    });

    // CloudWatch Dashboard
    new cloudwatch.Dashboard(this, 'SecurityDashboard', {
      dashboardName: `${props.environmentSuffix}-security-dashboard-v4`,
      widgets: [
        [
          new cloudwatch.TextWidget({
            markdown: `# ${props.environmentSuffix} Security Dashboard`,
            width: 24,
            height: 2,
          }),
        ],
        [
          new cloudwatch.LogQueryWidget({
            title: 'Failed Login Attempts',
            logGroupNames: ['/aws/cloudtrail'],
            queryLines: [
              'fields @timestamp, userIdentity.userName, errorCode, errorMessage',
              '| filter errorCode = "UnauthorizedOperation" or errorCode = "AccessDenied"',
              '| stats count() by userIdentity.userName',
            ],
            width: 12,
            height: 6,
          }),
          new cloudwatch.LogQueryWidget({
            title: 'Root Account Usage',
            logGroupNames: ['/aws/cloudtrail'],
            queryLines: [
              'fields @timestamp, eventName, userAgent',
              '| filter userIdentity.type = "Root"',
              '| sort @timestamp desc',
            ],
            width: 12,
            height: 6,
          }),
        ],
      ],
    });
  }
}
