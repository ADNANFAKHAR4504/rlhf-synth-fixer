import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as config from 'aws-cdk-lib/aws-config';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  private readonly environmentSuffix: string;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    this.environmentSuffix = props.environmentSuffix;

    // Apply tags from MODEL_RESPONSE but keep them dynamic for CI/CD
    const tags = {
      Environment: this.environmentSuffix,
      Project: 'tap-secure-baseline',
      Owner: 'platform-team',
    };

    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    const kmsKey = new kms.Key(this, `TapKmsKey-${this.environmentSuffix}`, {
      description: 'TAP encryption key',
      enableKeyRotation: true,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow CloudWatch Logs',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`),
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
            sid: 'Allow CloudTrail',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
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

    const vpc = new ec2.Vpc(this, `TapVpc-${this.environmentSuffix}`, {
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    const flowLogGroup = new logs.LogGroup(
      this,
      `VpcFlowLogGroup-${this.environmentSuffix}`,
      {
        retention: logs.RetentionDays.ONE_YEAR,
        encryptionKey: kmsKey,
      }
    );

    const flowLogRole = new iam.Role(
      this,
      `FlowLogRole-${this.environmentSuffix}`,
      {
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
                resources: [flowLogGroup.logGroupArn],
              }),
            ],
        }),
      },
    });

    new ec2.FlowLog(this, `VpcFlowLog-${this.environmentSuffix}`, {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        flowLogGroup,
        flowLogRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    const ec2SecurityGroup = new ec2.SecurityGroup(this, `Ec2SecurityGroup-${this.environmentSuffix}`, {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: false,
    });

    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS outbound'
    );

    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP outbound'
    );

    const rdsSecurityGroup = new ec2.SecurityGroup(this, `RdsSecurityGroup-${this.environmentSuffix}`, {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'MySQL from EC2'
    );

    const cloudTrailBucket = new s3.Bucket(
      this,
      `CloudTrailBucket-${this.environmentSuffix}`,
      {
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kmsKey,
        versioned: true,
        lifecycleRules: [
          {
            id: 'DeleteOldVersions',
            noncurrentVersionExpiration: cdk.Duration.days(90),
          },
        ],
        enforceSSL: true,
      }
    );

    const trail = new cloudtrail.Trail(this, `CloudTrail-${this.environmentSuffix}`, {
      bucket: cloudTrailBucket,
      encryptionKey: kmsKey,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
    });

    const configBucket = new s3.Bucket(this, `ConfigBucket-${this.environmentSuffix}`, {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      enforceSSL: true,
    });

    const configRole = new iam.Role(this, `ConfigRole-${this.environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/ConfigRole'),
      ],
      inlinePolicies: {
        ConfigBucketPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetBucketAcl', 's3:ListBucket'],
              resources: [configBucket.bucketArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [`${configBucket.bucketArn}/*`],
              conditions: {
                StringEquals: {
                  's3:x-amz-server-side-encryption': 'aws:kms',
                },
              },
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

    const configRecorder = new config.CfnConfigurationRecorder(
      this,
      `ConfigRecorder-${this.environmentSuffix}`,
      {
        name: `tap-config-recorder-${this.environmentSuffix}`,
        roleArn: configRole.roleArn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
      }
    );

    const configDeliveryChannel = new config.CfnDeliveryChannel(
      this,
      `ConfigDeliveryChannel-${this.environmentSuffix}`,
      {
        name: `tap-config-delivery-channel-${this.environmentSuffix}`,
        s3BucketName: configBucket.bucketName,
        s3KeyPrefix: 'config',
      }
    );

    configDeliveryChannel.addDependency(configRecorder);

    new config.ManagedRule(
      this,
      `RootMfaEnabledRule-${this.environmentSuffix}`,
      {
        identifier:
          config.ManagedRuleIdentifiers.MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS,
      }
    );

    new config.ManagedRule(this, `S3BucketPublicAccessProhibitedRule-${this.environmentSuffix}`, {
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED,
    });

    new config.ManagedRule(this, `S3BucketSslRequestsOnlyRule-${this.environmentSuffix}`, {
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_SSL_REQUESTS_ONLY,
    });

    new config.ManagedRule(this, `EbsEncryptedVolumesRule-${this.environmentSuffix}`, {
      identifier: config.ManagedRuleIdentifiers.EBS_ENCRYPTED_VOLUMES,
    });

    new config.ManagedRule(this, `RdsEncryptedRule-${this.environmentSuffix}`, {
      identifier: config.ManagedRuleIdentifiers.RDS_STORAGE_ENCRYPTED,
    });

    const adminGroup = new iam.Group(this, `AdminGroup-${this.environmentSuffix}`, {
      groupName: `TapAdministrators-${this.environmentSuffix}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),
      ],
    });

    const developerGroup = new iam.Group(this, `DeveloperGroup-${this.environmentSuffix}`, {
      groupName: `TapDevelopers-${this.environmentSuffix}`,
    });

    const developerPolicy = new iam.Policy(this, `DeveloperPolicy-${this.environmentSuffix}`, {
      policyName: `TapDeveloperPolicy-${this.environmentSuffix}`,
      document: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'ec2:Describe*',
              's3:GetObject',
              's3:PutObject',
              's3:ListBucket',
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLog*',
              'cloudwatch:GetMetricStatistics',
              'cloudwatch:ListMetrics',
              'cloudwatch:PutMetricData',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    developerPolicy.attachToGroup(developerGroup);

    const ec2Role = new iam.Role(this, `Ec2Role-${this.environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
      inlinePolicies: {
        Ec2Policy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              resources: [`arn:aws:logs:${this.region}:${this.account}:*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudwatch:PutMetricData',
                'ec2:DescribeVolumes',
                'ec2:DescribeTags',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify({
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
              totalcpu: false,
            },
            disk: {
              measurement: ['used_percent'],
              metrics_collection_interval: 60,
              resources: ['*'],
            },
            diskio: {
              measurement: ['io_time'],
              metrics_collection_interval: 60,
              resources: ['*'],
            },
            mem: {
              measurement: ['mem_used_percent'],
              metrics_collection_interval: 60,
            },
            netstat: {
              measurement: ['tcp_established', 'tcp_time_wait'],
              metrics_collection_interval: 60,
            },
            swap: {
              measurement: ['swap_used_percent'],
              metrics_collection_interval: 60,
            },
          },
        },
      }),
      'EOF',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    const ec2Instance = new ec2.Instance(
      this,
      `Ec2Instance-${this.environmentSuffix}`,
      {
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        securityGroup: ec2SecurityGroup,
        role: ec2Role,
        userData,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              encrypted: true,
              volumeType: ec2.EbsDeviceVolumeType.GP3,
            }),
          },
        ],
      }
    );

    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `DbSubnetGroup-${this.environmentSuffix}`,
      {
        vpc,
        description: 'Subnet group for RDS database',
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      }
    );

    const database = new rds.DatabaseInstance(
      this,
      `Database-${this.environmentSuffix}`,
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        credentials: rds.Credentials.fromGeneratedSecret('admin'),
        vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [rdsSecurityGroup],
        multiAz: false,
        allocatedStorage: 20,
        storageEncrypted: true,
        storageEncryptionKey: kmsKey,
        backupRetention: cdk.Duration.days(7),
        deletionProtection: false,
        deleteAutomatedBackups: true,
      }
    );

    new iam.InstanceProfile(
      this,
      `Ec2InstanceProfile-${this.environmentSuffix}`,
      {
        role: ec2Role,
      }
    );

    const appBucket = new s3.Bucket(
      this,
      `AppBucket-${this.environmentSuffix}`,
      {
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        versioned: true,
        enforceSSL: true,
      }
    );

    new cloudwatch.Alarm(this, `Ec2CpuAlarm-${this.environmentSuffix}`, {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          InstanceId: ec2Instance.instanceId,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, `Ec2MemoryAlarm-${this.environmentSuffix}`, {
      metric: new cloudwatch.Metric({
        namespace: 'CWAgent',
        metricName: 'mem_used_percent',
        dimensionsMap: {
          InstanceId: ec2Instance.instanceId,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new ssm.CfnAssociation(
      this,
      `CloudWatchAgentAssociation-${this.environmentSuffix}`,
      {
        name: 'AmazonCloudWatch-ManageAgent',
        targets: [
          {
            key: 'InstanceIds',
            values: [ec2Instance.instanceId],
          },
        ],
        parameters: {
          action: ['configure'],
          mode: ['ec2'],
          optionalConfigurationSource: ['ssm'],
          optionalConfigurationLocation: ['AmazonCloudWatch-linux'],
          optionalRestart: ['yes'],
        },
      }
    );

    new cdk.CfnOutput(this, `VpcId-${this.environmentSuffix}`, {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, `DatabaseEndpoint-${this.environmentSuffix}`, {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, `S3BucketName-${this.environmentSuffix}`, {
      value: appBucket.bucketName,
      description: 'S3 Bucket Name',
    });
  }
}
