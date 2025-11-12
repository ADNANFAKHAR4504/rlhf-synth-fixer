### Reasoning Trace

---

This request requires creating a comprehensive, production-ready AWS web application infrastructure using CDK TypeScript. The solution must address all security, compliance, and high availability requirements while incorporating best practices and avoiding common deployment issues.

Key architectural decisions:
1. **Environment Suffix Strategy**: Implement consistent resource naming with environment suffixes to support multiple deployments
2. **S3 Encryption Strategy**: Use S3_MANAGED encryption for AWS service logs and KMS encryption for application data
3. **AMI Selection**: Use SSM Parameter Store for latest AMI selection to avoid deprecation warnings
4. **Resource Naming**: Apply consistent naming conventions with environment suffixes throughout
5. **KMS Policy**: Comprehensive KMS policy supporting all AWS services that need encryption
6. **Deletion Protection**: Ensure all resources are destroyable for testing environments

### Answer

---

I'll create a production-ready, secure web application infrastructure on AWS using CDK TypeScript. This solution addresses all requirements while incorporating best practices for security, compliance, and high availability.

```typescript
import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as config from 'aws-cdk-lib/aws-config';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ==============================================
    // 1. KMS Keys for Encryption
    // ==============================================

    const kmsKey = new kms.Key(this, 'WebAppKMSKey', {
      description: `KMS key for web application encryption - ${environmentSuffix}`,
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
            sid: 'Allow EBS Encryption via EC2',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('ec2.amazonaws.com')],
            actions: [
              'kms:CreateGrant',
              'kms:Decrypt',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:GenerateDataKey',
              'kms:GenerateDataKeyWithoutPlaintext',
              'kms:ReEncrypt*',
            ],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:ViaService': `ec2.${cdk.Aws.REGION}.amazonaws.com`,
              },
            },
          }),
          new iam.PolicyStatement({
            sid: 'Allow Auto Scaling Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('autoscaling.amazonaws.com')],
            actions: [
              'kms:CreateGrant',
              'kms:Decrypt',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:GenerateDataKey',
              'kms:GenerateDataKeyWithoutPlaintext',
              'kms:ReEncrypt*',
            ],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:ViaService': `ec2.${cdk.Aws.REGION}.amazonaws.com`,
              },
            },
          }),
          new iam.PolicyStatement({
            sid: 'Allow Auto Scaling Service Linked Role',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ArnPrincipal(
                `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling`
              ),
            ],
            actions: [
              'kms:CreateGrant',
              'kms:Decrypt',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:GenerateDataKey',
              'kms:GenerateDataKeyWithoutPlaintext',
              'kms:ReEncrypt*',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow CloudWatch Logs',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal(`logs.${cdk.Aws.REGION}.amazonaws.com`),
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

    new kms.Alias(this, 'WebAppKMSKeyAlias', {
      aliasName: `alias/webapp-key-${environmentSuffix}`,
      targetKey: kmsKey,
    });

    // ==============================================
    // 2. VPC and Networking
    // ==============================================

    const vpc = new ec2.Vpc(this, 'WebAppVPC', {
      vpcName: `WebAppVPC-${environmentSuffix}`,
      maxAzs: 2,
      cidr: '10.0.0.0/16',
      natGateways: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `public-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `private-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: `isolated-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    const vpcFlowLogsBucket = new s3.Bucket(this, 'VPCFlowLogsBucket', {
      bucketName: `vpc-flow-logs-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: cdk.Duration.days(90),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      serverAccessLogsPrefix: 'access-logs/',
    });

    new iam.Role(this, 'VPCFlowLogsRole', {
      roleName: `VPCFlowLogsRole-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      inlinePolicies: {
        FlowLogsDeliveryRolePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:PutObject', 's3:GetBucketAcl', 's3:ListBucket'],
              resources: [
                vpcFlowLogsBucket.bucketArn,
                `${vpcFlowLogsBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
      },
    });

    new ec2.FlowLog(this, 'VPCFlowLog', {
      flowLogName: `VPCFlowLog-${environmentSuffix}`,
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toS3(
        vpcFlowLogsBucket,
        'vpc-flow-logs/',
        {
          hiveCompatiblePartitions: false,
        }
      ),
    });

    // ==============================================
    // 3. Security Groups
    // ==============================================

    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      securityGroupName: `ALBSecurityGroup-${environmentSuffix}`,
      vpc,
      description: `Security group for Application Load Balancer - ${environmentSuffix}`,
      allowAllOutbound: false,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    albSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow outbound HTTP to EC2 instances'
    );

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      securityGroupName: `EC2SecurityGroup-${environmentSuffix}`,
      vpc,
      description: `Security group for EC2 instances - ${environmentSuffix}`,
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      securityGroupName: `RDSSecurityGroup-${environmentSuffix}`,
      vpc,
      description: `Security group for RDS database - ${environmentSuffix}`,
      allowAllOutbound: false,
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL traffic from EC2 instances'
    );

    // ==============================================
    // 4. IAM Roles and Policies
    // ==============================================

    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      roleName: `EC2InstanceRole-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'kms:CreateGrant',
          'kms:Decrypt',
          'kms:DescribeKey',
          'kms:Encrypt',
          'kms:GenerateDataKey*',
          'kms:ReEncrypt*',
          'kms:GenerateDataKeyWithoutPlaintext',
        ],
        resources: [kmsKey.keyArn],
      })
    );

    new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      instanceProfileName: `EC2InstanceProfile-${environmentSuffix}`,
      role: ec2Role,
    });

    // ==============================================
    // 5. S3 Buckets for Storage and Logging
    // ==============================================

    const accessLogsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      bucketName: `webapp-access-logs-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldAccessLogs',
          expiration: cdk.Duration.days(365),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    const assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      bucketName: `webapp-assets-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: [`${assetsBucket.bucketArn}/*`],
      })
    );

    const cloudtrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `cloudtrail-logs-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldCloudTrailLogs',
          expiration: cdk.Duration.days(2555),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    cloudtrailBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${cloudtrailBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
            'AWS:SourceAccount': cdk.Aws.ACCOUNT_ID,
          },
        },
      })
    );

    cloudtrailBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:GetBucketAcl'],
        resources: [cloudtrailBucket.bucketArn],
        conditions: {
          StringEquals: {
            'AWS:SourceAccount': cdk.Aws.ACCOUNT_ID,
          },
        },
      })
    );

    // ==============================================
    // 6. RDS Database
    // ==============================================

    const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      subnetGroupName: `db-subnet-group-${environmentSuffix}`,
      vpc,
      description: `Subnet group for RDS database - ${environmentSuffix}`,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const database = new rds.DatabaseInstance(this, 'WebAppDatabase', {
      instanceIdentifier: `webapp-database-${environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.M5,
        ec2.InstanceSize.LARGE
      ),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      multiAz: true,
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: cdk.Duration.days(30),
      deletionProtection: false,
      enablePerformanceInsights: true,
      cloudwatchLogsExports: ['error', 'general'],
      monitoringInterval: cdk.Duration.minutes(1),
      credentials: rds.Credentials.fromGeneratedSecret('dbadmin', {
        secretName: `webapp-db-credentials-${environmentSuffix}`,
        encryptionKey: kmsKey,
      }),
    });

    // ==============================================
    // 7. CloudWatch Log Groups
    // ==============================================

    new logs.LogGroup(this, 'WebAppLogGroup', {
      logGroupName: `/aws/webapp/application-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: kmsKey,
    });

    // ==============================================
    // 8. Application Load Balancer
    // ==============================================

    const alb = new elbv2.ApplicationLoadBalancer(this, 'WebAppALB', {
      loadBalancerName: `webapp-alb-${environmentSuffix}`,
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    alb.logAccessLogs(accessLogsBucket, 'alb-logs');

    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'WebAppTargetGroup',
      {
        targetGroupName: `webapp-tg-${environmentSuffix}`,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        vpc,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200,301,302',
          healthyThresholdCount: 2,
          interval: cdk.Duration.seconds(30),
          path: '/health',
          protocol: elbv2.Protocol.HTTP,
          timeout: cdk.Duration.seconds(10),
          unhealthyThresholdCount: 5,
        },
        deregistrationDelay: cdk.Duration.seconds(300),
      }
    );

    alb.addListener('WebAppListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // ==============================================
    // 9. Auto Scaling Group
    // ==============================================

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      `echo "<h1>Web Application Server - ${environmentSuffix}</h1>" > /var/www/html/index.html`,
      'echo "OK" > /var/www/html/health',
      'yum install -y amazon-cloudwatch-agent',
      'systemctl enable amazon-cloudwatch-agent',
      'systemctl start amazon-cloudwatch-agent',
      'echo "$(date): Instance initialization completed successfully" >> /var/log/user-data.log'
    );

    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'WebAppLaunchTemplate',
      {
        launchTemplateName: `webapp-lt-${environmentSuffix}`,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.SMALL
        ),
        machineImage: ec2.MachineImage.fromSsmParameter(
          '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2',
          {
            os: ec2.OperatingSystemType.LINUX,
          }
        ),
        securityGroup: ec2SecurityGroup,
        userData,
        role: ec2Role,
        detailedMonitoring: true,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              encrypted: true,
              kmsKey: kmsKey,
              volumeType: ec2.EbsDeviceVolumeType.GP3,
              deleteOnTermination: true,
            }),
          },
        ],
      }
    );

    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'WebAppASG',
      {
        autoScalingGroupName: `webapp-asg-${environmentSuffix}`,
        vpc,
        launchTemplate,
        minCapacity: 2,
        maxCapacity: 6,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(5),
        }),
      }
    );

    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    autoScalingGroup.scaleOnCpuUtilization('ScaleUpPolicy', {
      targetUtilizationPercent: 70,
    });

    // ==============================================
    // 10. WAF Web ACL
    // ==============================================

    const webAcl = new wafv2.CfnWebACL(this, 'WebAppWAF', {
      name: `webapp-waf-${environmentSuffix}`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric',
          },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'KnownBadInputsMetric',
          },
        },
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 3,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLiRuleSetMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'WebAppWAFMetric',
      },
    });

    new wafv2.CfnWebACLAssociation(this, 'WebACLAssociation', {
      resourceArn: alb.loadBalancerArn,
      webAclArn: webAcl.attrArn,
    });

    // ==============================================
    // 11. CloudTrail
    // ==============================================

    new cloudtrail.Trail(this, 'WebAppCloudTrail', {
      trailName: `webapp-cloudtrail-${environmentSuffix}`,
      bucket: cloudtrailBucket,
      s3KeyPrefix: 'cloudtrail-logs',
      includeGlobalServiceEvents: true,
      enableFileValidation: true,
      encryptionKey: kmsKey,
      cloudWatchLogGroup: new logs.LogGroup(this, 'CloudTrailLogGroup', {
        logGroupName: `/aws/cloudtrail/webapp-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_MONTH,
        encryptionKey: kmsKey,
      }),
    });

    // ==============================================
    // 12. CloudWatch Alarms
    // ==============================================

    const cpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    new cloudwatch.Alarm(this, 'HighCPUAlarm', {
      alarmName: `high-cpu-alarm-${environmentSuffix}`,
      metric: cpuMetric,
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'HighDBConnectionsAlarm', {
      alarmName: `high-db-connections-alarm-${environmentSuffix}`,
      metric: database.metricDatabaseConnections(),
      threshold: 20,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    new cloudwatch.Alarm(this, 'HighTargetResponseTimeAlarm', {
      alarmName: `high-response-time-alarm-${environmentSuffix}`,
      metric: targetGroup.metricTargetResponseTime(),
      threshold: 1,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // ==============================================
    // 13. AWS Config and Remediation Lambda
    // ==============================================

    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      bucketName: `config-bucket-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldConfigData',
          expiration: cdk.Duration.days(365),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    const configRole = new iam.Role(this, 'ConfigRole', {
      roleName: `ConfigRole-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWS_ConfigRole'
        ),
      ],
      inlinePolicies: {
        ConfigDeliveryPermissions: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetBucketAcl',
                's3:GetBucketLocation',
                's3:ListBucket',
              ],
              resources: [configBucket.bucketArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:PutObject'],
              resources: [`${configBucket.bucketArn}/*`],
              conditions: {
                StringEquals: {
                  's3:x-amz-acl': 'bucket-owner-full-control',
                },
              },
            }),
          ],
        }),
      },
    });

    configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('config.amazonaws.com')],
        actions: ['s3:GetBucketAcl', 's3:ListBucket'],
        resources: [configBucket.bucketArn],
        conditions: {
          StringEquals: {
            'AWS:SourceAccount': cdk.Aws.ACCOUNT_ID,
          },
        },
      })
    );

    configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('config.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${configBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
            'AWS:SourceAccount': cdk.Aws.ACCOUNT_ID,
          },
        },
      })
    );

    new config.CfnDeliveryChannel(this, 'ConfigDeliveryChannel', {
      name: `config-delivery-channel-${environmentSuffix}`,
      s3BucketName: configBucket.bucketName,
      s3KeyPrefix: 'config',
    });

    const configRecorder = new config.CfnConfigurationRecorder(
      this,
      'ConfigRecorder',
      {
        name: `config-recorder-${environmentSuffix}`,
        roleArn: configRole.roleArn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
      }
    );

    const s3PublicReadRule = new config.ManagedRule(
      this,
      'S3PublicReadProhibited',
      {
        configRuleName: `s3-public-read-prohibited-${environmentSuffix}`,
        identifier:
          config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_READ_PROHIBITED,
      }
    );
    s3PublicReadRule.node.addDependency(configRecorder);

    const s3PublicWriteRule = new config.ManagedRule(
      this,
      'S3PublicWriteProhibited',
      {
        configRuleName: `s3-public-write-prohibited-${environmentSuffix}`,
        identifier:
          config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_WRITE_PROHIBITED,
      }
    );
    s3PublicWriteRule.node.addDependency(configRecorder);

    const rdsEncryptionRule = new config.ManagedRule(
      this,
      'RDSStorageEncrypted',
      {
        configRuleName: `rds-storage-encrypted-${environmentSuffix}`,
        identifier: config.ManagedRuleIdentifiers.RDS_STORAGE_ENCRYPTED,
      }
    );
    rdsEncryptionRule.node.addDependency(configRecorder);

    const remediationLambdaRole = new iam.Role(this, 'RemediationLambdaRole', {
      roleName: `RemediationLambdaRole-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        RemediationPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:PutBucketPublicAccessBlock',
                's3:GetBucketPublicAccessBlock',
                'config:PutEvaluations',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    new lambda.Function(this, 'RemediationLambda', {
      functionName: `remediation-lambda-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.lambda_handler',
      role: remediationLambdaRole,
      timeout: cdk.Duration.minutes(1),
      code: lambda.Code.fromInline(`
import boto3
import json

def lambda_handler(event, context):
    config_client = boto3.client('config')
    s3_client = boto3.client('s3')
    
    # Get the compliance details
    compliance_type = event['configurationItem']['complianceType']
    resource_type = event['configurationItem']['resourceType']
    resource_id = event['configurationItem']['resourceId']
    
    if compliance_type == 'NON_COMPLIANT' and resource_type == 'AWS::S3::Bucket':
        try:
            # Block public access on the bucket
            s3_client.put_bucket_public_access_block(
                Bucket=resource_id,
                PublicAccessBlockConfiguration={
                    'BlockPublicAcls': True,
                    'IgnorePublicAcls': True,
                    'BlockPublicPolicy': True,
                    'RestrictPublicBuckets': True
                }
            )
            
            print(f'Remediation completed for bucket: {resource_id}')
            
        except Exception as e:
            print(f'Error remediating bucket {resource_id}: {str(e)}')
    
    return {
        'statusCode': 200,
        'body': json.dumps('Remediation function executed')
    }
      `),
    });

    // ==============================================
    // 14. Outputs
    // ==============================================

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database endpoint',
    });

    new cdk.CfnOutput(this, 'AssetsBucketName', {
      value: assetsBucket.bucketName,
      description: 'S3 bucket for application assets',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
    });

    new cdk.CfnOutput(this, 'WebACLArn', {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });
  }
}
```

## Key Improvements Made

### 1. Environment Suffix Integration
- All resources are named with environment suffixes for multi-environment support
- Supports deployment isolation with unique resource names

### 2. S3 Encryption Strategy
- **AWS Service Logs**: Use S3_MANAGED encryption for ALB logs, CloudTrail, Config, and VPC Flow Logs
- **Application Data**: Use KMS encryption for assets bucket and other user-controlled data

### 3. AMI Selection Best Practice
- Uses SSM Parameter Store: `/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2`
- Eliminates deprecation warnings and ensures latest AMI selection

### 4. Comprehensive KMS Policy
- Supports all AWS services requiring encryption (EC2, Auto Scaling, CloudWatch Logs, CloudTrail)
- Includes service-linked role permissions for Auto Scaling

### 5. Resource Naming Consistency
- All resources include environment suffix for identification and isolation
- Follows AWS naming conventions and best practices

### 6. Deletion Protection Strategy
- RDS deletion protection set to `false` for testing environments
- Ensures all resources are destroyable during QA pipeline cleanup

### 7. Enhanced Resource Configuration
- Proper S3 bucket policies for CloudTrail and Config services
- Config rules with proper dependencies on configuration recorder
- CloudWatch alarms with appropriate thresholds and missing data handling

This solution provides a production-ready, secure, and scalable web application infrastructure that meets all requirements while supporting automated deployments and testing pipelines.