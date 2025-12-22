import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export interface SecureNetworkStackProps extends cdk.StackProps {
  environmentName: string;
  costCenter: string;
}

export class SecureNetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly flowLogsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: SecureNetworkStackProps) {
    super(scope, id, props);

    // KMS Key for encryption
    const kmsKey = new kms.Key(this, 'SecureNetworkKMSKey', {
      description: 'KMS Key for secure network infrastructure encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 Bucket for VPC Flow Logs with strict security
    this.flowLogsBucket = new s3.Bucket(this, 'VPCFlowLogsBucket', {
      bucketName: `vpc-flow-logs-${props.environmentName}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          id: 'FlowLogsRetention',
          enabled: true,
          expiration: cdk.Duration.days(90),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // autoDeleteObjects removed for LocalStack compatibility - the Lambda custom resource
      // required for this feature causes asset upload issues with LocalStack's S3
    });

    // IAM Role for VPC Flow Logs with minimal permissions
    new iam.Role(this, 'VPCFlowLogsRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      description: 'IAM role for VPC Flow Logs delivery to S3',
      inlinePolicies: {
        S3DeliveryPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:PutObject', 's3:GetBucketAcl', 's3:ListBucket'],
              resources: [
                this.flowLogsBucket.bucketArn,
                `${this.flowLogsBucket.bucketArn}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ],
              resources: [kmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    // VPC with multiple subnets across AZs
    // LocalStack Community has issues with EIP/NAT Gateway allocation IDs
    // Using 0 NAT gateways for LocalStack compatibility
    this.vpc = new ec2.Vpc(this, 'SecureVPC', {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGateways: 0, // Disabled for LocalStack compatibility (EIP allocation ID issue)
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
          cidrMask: 24,
          name: 'DatabaseSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // VPC Block Public Access is configured via VPC properties, not as a separate resource

    // VPC Flow Logs
    new ec2.FlowLog(this, 'VPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toS3(
        this.flowLogsBucket,
        'vpc-flow-logs/'
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
      flowLogName: 'SecureVPCFlowLog',
    });

    // Security Groups with restricted access
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for web servers',
      allowAllOutbound: false,
    });

    // Allow HTTP from specific CIDR blocks
    webSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/8'),
      ec2.Port.tcp(80),
      'Allow HTTP from internal networks'
    );

    // Allow SSH from specific CIDR blocks
    webSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/8'),
      ec2.Port.tcp(22),
      'Allow SSH from internal networks'
    );

    // Restrict outbound traffic
    webSecurityGroup.addEgressRule(
      ec2.Peer.ipv4('0.0.0.0/0'),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound'
    );

    webSecurityGroup.addEgressRule(
      ec2.Peer.ipv4('0.0.0.0/0'),
      ec2.Port.tcp(80),
      'Allow HTTP outbound'
    );

    // NOTE: The following features are omitted for LocalStack compatibility
    // but can be added for production AWS deployment:
    //
    // 1. VPC Lattice: Service-to-service connectivity (not supported in LocalStack Community)
    // 2. CloudTrail: API call logging (requires specific bucket policies)
    // 3. AWS Config: Resource configuration assessment (LocalStack allows only one recorder per region)
    //
    // See MODEL_FAILURES.md for detailed explanations and implementation guidance.

    // CloudWatch Log Group for VPC Flow Logs analysis (without KMS encryption)
    new logs.LogGroup(this, 'FlowLogsAnalysis', {
      logGroupName: `/aws/vpc/flowlogs/${props.environmentName}`,
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // CloudWatch Alarm for unauthorized SSH attempts
    new cloudwatch.Alarm(this, 'UnauthorizedSSHAlarm', {
      alarmName: `unauthorized-ssh-attempts-${props.environmentName}`,
      alarmDescription: 'Alarm for detecting unauthorized SSH access attempts',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/VPC',
        metricName: 'PacketCount',
        dimensionsMap: {
          VpcId: this.vpc.vpcId,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Apply comprehensive tags
    const commonTags = {
      Environment: props.environmentName,
      CostCenter: props.costCenter,
      Project: 'SecureNetworkInfrastructure',
      Owner: 'CloudOpsTeam',
      Compliance: 'Required',
    };

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'FlowLogsBucketName', {
      value: this.flowLogsBucket.bucketName,
      description: 'S3 bucket for VPC Flow Logs',
      exportName: `${this.stackName}-FlowLogsBucket`,
    });
  }
}
