import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
// import * as guardduty from 'aws-cdk-lib/aws-guardduty'; // Uncomment if GuardDuty detector needs to be created
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // VPC with enhanced security configuration
    const vpc = new ec2.Vpc(this, 'SecureVpc', {
      ipProtocol: ec2.IpProtocol.DUAL_STACK,
      maxAzs: 3,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'IsolatedSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
      restrictDefaultSecurityGroup: true,
    });

    // Enable VPC Block Public Access
    new ec2.CfnVPCBlockPublicAccessExclusion(this, 'VpcBlockPublicAccess', {
      vpcId: vpc.vpcId,
      internetGatewayExclusionMode: 'allow-egress',
    });

    // S3 bucket for VPC Flow Logs with enhanced security
    const flowLogsBucket = new s3.Bucket(this, 'VpcFlowLogsBucket', {
      bucketName: `tap-${props.environmentSuffix}-vpc-flow-logs-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'FlowLogsRetention',
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
          expiration: cdk.Duration.days(2555), // 7 years
        },
      ],
    });

    // CloudWatch Log Group for VPC Flow Logs
    const flowLogsLogGroup = new logs.LogGroup(this, 'VpcFlowLogsGroup', {
      logGroupName: `/aws/vpc/flowlogs/${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_YEAR,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // encryptionKey not specified - uses default AWS managed key
    });

    // IAM role for VPC Flow Logs
    const flowLogsRole = new iam.Role(this, 'VpcFlowLogsRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      inlinePolicies: {
        FlowLogsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:PutObject',
                's3:GetBucketLocation',
                's3:ListBucket',
              ],
              resources: [
                flowLogsBucket.bucketArn,
                `${flowLogsBucket.bucketArn}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              resources: [flowLogsLogGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    // VPC Flow Logs to S3
    new ec2.FlowLog(this, 'VpcFlowLogsS3', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toS3(
        flowLogsBucket,
        'vpc-flow-logs/'
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
      maxAggregationInterval: ec2.FlowLogMaxAggregationInterval.TEN_MINUTES,
    });

    // VPC Flow Logs to CloudWatch
    new ec2.FlowLog(this, 'VpcFlowLogsCloudWatch', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        flowLogsLogGroup,
        flowLogsRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
      maxAggregationInterval: ec2.FlowLogMaxAggregationInterval.TEN_MINUTES,
    });

    // Shared Security Groups
    const webTierSg = new ec2.SecurityGroup(this, 'WebTierSecurityGroup', {
      vpc,
      description: 'Security group for web tier',
      allowAllOutbound: false,
    });

    webTierSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet'
    );

    webTierSg.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound'
    );

    const appTierSg = new ec2.SecurityGroup(this, 'AppTierSecurityGroup', {
      vpc,
      description: 'Security group for application tier',
      allowAllOutbound: false,
    });

    appTierSg.addIngressRule(
      webTierSg,
      ec2.Port.tcp(8080),
      'Allow traffic from web tier'
    );

    const dbTierSg = new ec2.SecurityGroup(this, 'DbTierSecurityGroup', {
      vpc,
      description: 'Security group for database tier',
      allowAllOutbound: false,
    });

    dbTierSg.addIngressRule(
      appTierSg,
      ec2.Port.tcp(3306),
      'Allow MySQL from app tier'
    );

    // GuardDuty Detector
    // Note: GuardDuty detector already exists in the account, so we'll use the existing one
    // If you need to create a new detector, uncomment the following code:
    /*
    const guardDutyDetector = new guardduty.CfnDetector(
      this,
      'GuardDutyDetector',
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
    */

    // Using existing detector ID from the account
    const guardDutyDetectorId = '4dc074dbceb04fc1a1da094d3f38f35c';

    // Output important resource ARNs and IDs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'FlowLogsBucketName', {
      value: flowLogsBucket.bucketName,
      description: 'VPC Flow Logs S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'GuardDutyDetectorId', {
      value: guardDutyDetectorId,
      description: 'GuardDuty Detector ID (existing)',
    });

    // Tags for compliance
    cdk.Tags.of(this).add('SecurityLevel', 'High');
    cdk.Tags.of(this).add('Compliance', 'Enterprise');
    cdk.Tags.of(this).add('DataClassification', 'Confidential');
  }
}
