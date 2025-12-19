import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface SecureEnvironmentStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class SecureEnvironmentStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly securityBucket: s3.Bucket;
  public readonly logsBucket: s3.Bucket;
  public readonly ec2SecurityGroup: ec2.SecurityGroup;
  public readonly ec2Role: iam.Role;

  constructor(
    scope: Construct,
    id: string,
    props?: SecureEnvironmentStackProps
  ) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC with secure network configuration
    // Using ISOLATED subnets for LocalStack compatibility (no NAT Gateway needed)
    this.vpc = new ec2.Vpc(this, 'SecureVpc', {
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      natGateways: 0, // No NAT Gateway for LocalStack
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: 'PublicSubnet',
          cidrMask: 24,
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          name: 'PrivateSubnet',
          cidrMask: 24,
        },
      ],
    });

    // Enable VPC Flow Logs for network monitoring
    const vpcFlowLogRole = new iam.Role(this, 'VpcFlowLogRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      inlinePolicies: {
        FlowLogDeliveryRolePolicy: new iam.PolicyDocument({
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

    const vpcFlowLogGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
      logGroupName: `/aws/vpc/flowlogs/${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        vpcFlowLogGroup,
        vpcFlowLogRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Create S3 bucket for CloudTrail and access logs
    this.logsBucket = new s3.Bucket(this, 'LogsBucket', {
      bucketName: `secure-logs-bucket-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'LogsLifecycleRule',
          enabled: true,
          expiration: cdk.Duration.days(365),
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
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create secure S3 bucket with AES-256 encryption
    this.securityBucket = new s3.Bucket(this, 'SecureBucket', {
      bucketName: `secure-data-bucket-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      serverAccessLogsBucket: this.logsBucket,
      serverAccessLogsPrefix: 'access-logs/',
      lifecycleRules: [
        {
          id: 'DataLifecycleRule',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add bucket policy for secure access
    this.securityBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [
          this.securityBucket.bucketArn,
          this.securityBucket.arnForObjects('*'),
        ],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    // Create IAM role for EC2 instances with least privilege
    this.ec2Role = new iam.Role(this, 'Ec2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description:
        'IAM role for EC2 instances with minimal required permissions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
      inlinePolicies: {
        S3BucketAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [this.securityBucket.arnForObjects('*')],
              conditions: {
                Bool: {
                  'aws:SecureTransport': 'true',
                },
              },
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:ListBucket'],
              resources: [this.securityBucket.bucketArn],
              conditions: {
                Bool: {
                  'aws:SecureTransport': 'true',
                },
              },
            }),
          ],
        }),
        CloudWatchLogs: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              resources: [
                `arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/ec2/*`,
              ],
            }),
          ],
        }),
      },
    });

    // Create instance profile for EC2 instances
    new iam.InstanceProfile(this, 'Ec2InstanceProfile', {
      role: this.ec2Role,
      instanceProfileName: `ec2-instance-profile-${environmentSuffix}`,
    });

    // Create security group for EC2 instances in private subnets
    this.ec2SecurityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc: this.vpc,
      description:
        'Security group for EC2 instances with minimal required access',
      allowAllOutbound: false,
    });

    // Allow outbound HTTPS traffic for software updates and AWS API calls
    this.ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow outbound HTTPS traffic'
    );

    // Allow outbound HTTP traffic for package manager updates
    this.ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow outbound HTTP traffic for updates'
    );

    // Allow outbound DNS traffic
    this.ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(53),
      'Allow outbound DNS TCP traffic'
    );

    this.ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udp(53),
      'Allow outbound DNS UDP traffic'
    );

    // Create EC2 instances in private subnets only
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      // Configure CloudWatch agent
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify(
        {
          agent: {
            metrics_collection_interval: 300,
            run_as_user: 'cwagent',
          },
          logs: {
            logs_collected: {
              files: {
                collect_list: [
                  {
                    file_path: '/var/log/messages',
                    log_group_name: `/aws/ec2/system-logs/${environmentSuffix}`,
                    log_stream_name: '{instance_id}/messages',
                  },
                  {
                    file_path: '/var/log/secure',
                    log_group_name: `/aws/ec2/security-logs/${environmentSuffix}`,
                    log_stream_name: '{instance_id}/secure',
                  },
                ],
              },
            },
          },
          metrics: {
            namespace: 'AWS/EC2/Custom',
            metrics_collected: {
              cpu: {
                measurement: [
                  'cpu_usage_idle',
                  'cpu_usage_iowait',
                  'cpu_usage_user',
                  'cpu_usage_system',
                ],
                metrics_collection_interval: 300,
              },
              disk: {
                measurement: ['used_percent'],
                metrics_collection_interval: 300,
                resources: ['*'],
              },
              mem: {
                measurement: ['mem_used_percent'],
                metrics_collection_interval: 300,
              },
            },
          },
        },
        null,
        2
      ),
      'EOF',
      // Start CloudWatch agent
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    // Create EC2 instance in private subnet
    // Note: For LocalStack compatibility, we use a simpler configuration without Launch Template
    // (block devices and requireImdsv2 cause LocalStack to create a Launch Template which has issues)
    const isLocalStack =
      process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      process.env.AWS_ENDPOINT_URL?.includes('4566');

    const privateInstance = new ec2.Instance(this, 'PrivateInstance', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroup: this.ec2SecurityGroup,
      role: this.ec2Role,
      userData: userData,
      // Explicitly disable public IP for private subnet instances
      associatePublicIpAddress: false,
      // Only add blockDevices and requireImdsv2 for non-LocalStack environments
      // LocalStack has issues with Launch Templates created by these properties
      ...(isLocalStack
        ? {}
        : {
            blockDevices: [
              {
                deviceName: '/dev/xvda',
                volume: ec2.BlockDeviceVolume.ebs(20, {
                  encrypted: true,
                  volumeType: ec2.EbsDeviceVolumeType.GP3,
                }),
              },
            ],
            requireImdsv2: true, // Enforce IMDSv2 for enhanced security
          }),
    });

    // Apply tags explicitly to EC2 instance for LocalStack compatibility
    cdk.Tags.of(privateInstance).add('Environment', environmentSuffix);
    cdk.Tags.of(privateInstance).add('Project', 'SecureEnvironment');
    cdk.Tags.of(privateInstance).add('Owner', 'InfrastructureTeam');
    cdk.Tags.of(privateInstance).add('CostCenter', 'IT-Security');
    cdk.Tags.of(privateInstance).add('Compliance', 'Required');

    // Apply tags explicitly to VPC for LocalStack compatibility
    cdk.Tags.of(this.vpc).add('Environment', environmentSuffix);
    cdk.Tags.of(this.vpc).add('Project', 'SecureEnvironment');
    cdk.Tags.of(this.vpc).add('Owner', 'InfrastructureTeam');
    cdk.Tags.of(this.vpc).add('CostCenter', 'IT-Security');
    cdk.Tags.of(this.vpc).add('Compliance', 'Required');

    // Create CloudTrail for comprehensive API logging
    const trail = new cloudtrail.Trail(this, 'SecurityAuditTrail', {
      trailName: `security-audit-trail-${environmentSuffix}`,
      bucket: this.logsBucket,
      s3KeyPrefix: 'cloudtrail-logs/',
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
    });

    // Add CloudTrail bucket policy (CDK should handle this automatically, but let's be explicit)
    this.logsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSCloudTrailAclCheck',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:GetBucketAcl'],
        resources: [this.logsBucket.bucketArn],
      })
    );

    this.logsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSCloudTrailWrite',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [this.logsBucket.arnForObjects('cloudtrail-logs/*')],
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
          },
        },
      })
    );

    // Add data events for S3 bucket monitoring
    trail.addS3EventSelector(
      [
        {
          bucket: this.securityBucket,
          objectPrefix: '',
        },
      ],
      {
        readWriteType: cloudtrail.ReadWriteType.ALL,
        includeManagementEvents: true,
      }
    );

    // Create CloudWatch Log Groups for application logs
    new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/application/${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create additional log groups for system monitoring
    new logs.LogGroup(this, 'SystemLogGroup', {
      logGroupName: `/aws/ec2/system-logs/${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new logs.LogGroup(this, 'SecurityLogGroup', {
      logGroupName: `/aws/ec2/security-logs/${environmentSuffix}`,
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Tag all resources for proper governance
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'SecureEnvironment');
    cdk.Tags.of(this).add('Owner', 'InfrastructureTeam');
    cdk.Tags.of(this).add('CostCenter', 'IT-Security');
    cdk.Tags.of(this).add('Compliance', 'Required');

    // Outputs for reference
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for the secure environment',
      exportName: `SecureVpc-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecureBucketName', {
      value: this.securityBucket.bucketName,
      description: 'Name of the secure S3 bucket',
      exportName: `SecureBucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrivateInstanceId', {
      value: privateInstance.instanceId,
      description: 'Instance ID of the EC2 instance in private subnet',
      exportName: `PrivateInstance-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudTrailArn', {
      value: trail.trailArn,
      description: 'ARN of the CloudTrail for audit logging',
      exportName: `CloudTrail-${environmentSuffix}`,
    });
  }
}
