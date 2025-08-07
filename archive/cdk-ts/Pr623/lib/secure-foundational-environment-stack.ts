// File: lib/secure-foundational-environment-stack.ts

import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

interface SecureFoundationalEnvironmentStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class SecureFoundationalEnvironmentStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly kmsKey: kms.Key;
  public readonly secureS3Bucket: s3.Bucket;
  public readonly ec2SecurityGroup: ec2.SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    props: SecureFoundationalEnvironmentStackProps
  ) {
    super(scope, id, {
      ...props,
      env: {
        region: 'us-east-1',
        ...props.env,
      },
    });

    const { environmentSuffix } = props;

    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      Project: 'IaC-AWS-Nova-Model-Breaking',
      ManagedBy: 'AWS-CDK',
      CostCenter: 'Security-Infrastructure',
      Owner: 'Solutions-Architecture-Team',
      Compliance: 'Required',
    };

    // 1. Customer-Managed KMS Key for encryption
    this.kmsKey = new kms.Key(this, 'SecureFoundationKMSKey', {
      alias: `alias/secure-foundation-${environmentSuffix}-${this.account}`,
      description: `Customer-managed KMS key for secure foundational environment - ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'EnableRootPermissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'AllowCloudWatchLogs',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal('logs.us-east-1.amazonaws.com'),
            ],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'AllowS3Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    // 2. VPC with Multi-AZ Configuration (No NAT Gateway - Cost Optimized)
    this.vpc = new ec2.Vpc(this, 'SecureFoundationVPC', {
      vpcName: `secure-foundation-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2, // Use 2 AZs for high availability without NAT Gateway limits
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGateways: 0, // No NAT Gateways to avoid limit issues
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `public-subnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 28,
          name: `isolated-subnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      gatewayEndpoints: {
        S3: {
          service: ec2.GatewayVpcEndpointAwsService.S3,
        },
        DynamoDB: {
          service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        },
      },
    });

    // 3. VPC Flow Logs for network monitoring
    // Fixed code with inline policy:
    const vpcFlowLogsRole = new iam.Role(this, 'VPCFlowLogsRole', {
      roleName: `vpc-flow-logs-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      inlinePolicies: {
        VPCFlowLogsDeliveryRolePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    const vpcFlowLogsGroup = new logs.LogGroup(this, 'VPCFlowLogsGroup', {
      logGroupName: `/aws/vpc/flowlogs/${environmentSuffix}-${this.account}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: this.kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new ec2.FlowLog(this, 'VPCFlowLogs', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        vpcFlowLogsGroup,
        vpcFlowLogsRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // 4. Strict Security Groups
    this.ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      'SecureEC2SecurityGroup',
      {
        vpc: this.vpc,
        securityGroupName: `secure-ec2-sg-${environmentSuffix}`,
        description:
          'Secure security group for EC2 instances with strict access controls',
        allowAllOutbound: false, // Explicitly deny all outbound by default
      }
    );

    // Allow outbound to VPC endpoints for AWS services
    this.ec2SecurityGroup.addEgressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'HTTPS to VPC endpoints for AWS services'
    );

    // Internal VPC communication only
    this.ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(22),
      'SSH access from within VPC only'
    );

    // 5. IAM Role for EC2 Instances (Least Privilege)
    const ec2Role = new iam.Role(this, 'SecureEC2Role', {
      roleName: `secure-ec2-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
      inlinePolicies: {
        CloudWatchAgentPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudwatch:PutMetricData',
                'ec2:DescribeTags',
                'logs:PutLogEvents',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:DescribeLogStreams',
              ],
              resources: ['*'],
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
              resources: [this.kmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    new iam.InstanceProfile(this, 'SecureEC2InstanceProfile', {
      instanceProfileName: `secure-ec2-instance-profile-${environmentSuffix}`,
      role: ec2Role,
    });

    // 6. S3 Bucket with SSE-KMS encryption
    this.secureS3Bucket = new s3.Bucket(this, 'SecureFoundationS3Bucket', {
      bucketName: `secure-foundation-${environmentSuffix}-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteUploads',
          enabled: true,
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      notificationsHandlerRole: new iam.Role(this, 'S3NotificationsRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
      }),
    });

    // 7. EC2 Instance with Amazon Linux 2023
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      // Configure CloudWatch agent
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify(
        {
          metrics: {
            namespace: 'CWAgent',
            metrics_collected: {
              cpu: {
                measurement: [
                  'cpu_usage_idle',
                  'cpu_usage_iowait',
                  'cpu_usage_user',
                  'cpu_usage_system',
                ],
                metrics_collection_interval: 60,
              },
              disk: {
                measurement: ['used_percent'],
                metrics_collection_interval: 60,
                resources: ['*'],
              },
              mem: {
                measurement: ['mem_used_percent'],
                metrics_collection_interval: 60,
              },
            },
          },
          logs: {
            logs_collected: {
              files: {
                collect_list: [
                  {
                    file_path: '/var/log/messages',
                    log_group_name: `/aws/ec2/system-logs/${environmentSuffix}-${this.account}`,
                    log_stream_name: '{instance_id}',
                  },
                ],
              },
            },
          },
        },
        null,
        2
      ),
      'EOF',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    const secureEC2Instance = new ec2.Instance(this, 'SecureEC2Instance', {
      instanceName: `secure-instance-${environmentSuffix}`,
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: this.ec2SecurityGroup,
      role: ec2Role,
      userData: userData,
      detailedMonitoring: true,
      requireImdsv2: true, // Enforce IMDSv2 for better security
    });

    // 8. CloudWatch Log Groups with KMS encryption
    new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/application/${environmentSuffix}-${this.account}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: this.kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new logs.LogGroup(this, 'SystemLogGroup', {
      logGroupName: `/aws/ec2/system-logs/${environmentSuffix}-${this.account}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: this.kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 9. CloudTrail for API logging (Optional - only create if not at limit)
    // Note: AWS has a limit of 5 trails per region per account
    // Uncomment the following block if you have trail capacity available
    /*
    new cloudtrail.Trail(this, 'SecurityAuditTrail', {
      trailName: `security-audit-trail-${environmentSuffix}-${this.account}`,
      bucket: this.secureS3Bucket,
      s3KeyPrefix: 'cloudtrail-logs/',
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      encryptionKey: this.kmsKey,
      sendToCloudWatchLogs: true,
    });
    */

    // 10. CloudWatch Dashboard for monitoring
    const dashboard = new cloudwatch.Dashboard(this, 'SecurityDashboard', {
      dashboardName: `secure-foundation-dashboard-${environmentSuffix}`,
      widgets: [
        [
          new cloudwatch.TextWidget({
            markdown: `# Secure Foundational Environment - ${environmentSuffix.toUpperCase()}
            
This dashboard provides monitoring for the secure foundational AWS environment including:
- VPC Flow Logs and Network Security
- EC2 Instance Performance Metrics  
- S3 Bucket Access Patterns
- CloudTrail Security Events
- KMS Key Usage Statistics`,
            width: 24,
            height: 6,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'EC2 CPU Utilization',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/EC2',
                metricName: 'CPUUtilization',
                dimensionsMap: {
                  InstanceId: secureEC2Instance.instanceId,
                },
                statistic: 'Average',
              }),
            ],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'VPC Flow Logs',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/Logs',
                metricName: 'IncomingLogEvents',
                dimensionsMap: {
                  LogGroupName: vpcFlowLogsGroup.logGroupName,
                },
                statistic: 'Sum',
              }),
            ],
            width: 12,
            height: 6,
          }),
        ],
      ],
    });

    // Apply tags to all resources
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Stack Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for the secure foundational environment',
      exportName: `SecureFoundationVPC-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: this.kmsKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: `SecureFoundationKMSKey-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.secureS3Bucket.bucketName,
      description: 'Secure S3 Bucket Name',
      exportName: `SecureFoundationS3Bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: secureEC2Instance.instanceId,
      description: 'Secure EC2 Instance ID',
      exportName: `SecureFoundationEC2Instance-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}
