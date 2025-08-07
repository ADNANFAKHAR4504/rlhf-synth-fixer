import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export class MainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';

    // ==================== SECURITY LAYER ====================

    // KMS Key for encryption at rest
    const kmsKey = new kms.Key(this, 'EncryptionKey', {
      description: 'KMS key for encrypting all data at rest',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // VPC with multi-AZ setup
    const vpc = new ec2.Vpc(this, 'SecureVpc', {
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
          cidrMask: 28,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // S3 Bucket for general logging with encryption
    const logBucket = new s3.Bucket(this, 'LogBucket', {
      bucketName: `tap-${environmentSuffix}-logs-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'LogRetention',
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
    });

    // Separate S3 Bucket for ALB logs (ALB doesn't support KMS-encrypted buckets)
    const albLogBucket = new s3.Bucket(this, 'AlbLogBucket', {
      bucketName: `tap-${environmentSuffix}-alb-logs-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'AlbLogRetention',
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
    });

    // Add KMS key policy for CloudWatch Logs
    kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Enable CloudWatch Logs',
        principals: [
          new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`),
        ],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:CreateGrant',
          'kms:DescribeKey',
        ],
        resources: ['*'],
        conditions: {
          ArnEquals: {
            'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/application/secure-web-app-${environmentSuffix}`,
          },
        },
      })
    );

    // CloudWatch Log Group with unique name per environment
    const logGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/application/secure-web-app-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Database secret in Secrets Manager
    const dbSecret = new secretsmanager.Secret(this, 'DbSecret', {
      secretName: `tap-${environmentSuffix}-db-secret`,
      description: 'RDS Database Credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
        passwordLength: 32,
      },
      encryptionKey: kmsKey,
    });

    // Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    // Allow HTTP access for testing (in production, use HTTPS only)
    albSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'),
      ec2.Port.tcp(80),
      'HTTP access from trusted IPs'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'),
      ec2.Port.tcp(443),
      'HTTPS access from trusted IPs'
    );

    const appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc: vpc,
      description: 'Security group for application instances',
      allowAllOutbound: true,
    });

    appSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(8080),
      'HTTP from ALB'
    );

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc: vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    dbSecurityGroup.addIngressRule(
      appSecurityGroup,
      ec2.Port.tcp(3306),
      'MySQL from application'
    );

    // IAM Role for EC2 instances with minimal permissions
    const ec2Role = new iam.Role(this, 'Ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with minimal permissions',
    });

    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [dbSecret.secretArn],
      })
    );

    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [logGroup.logGroupArn + ':*'],
      })
    );

    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:PutObject', 's3:PutObjectAcl'],
        resources: [`${logBucket.bucketArn}/*`],
      })
    );

    // ==================== COMPUTE LAYER ====================

    // Launch Template for EC2 instances
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      securityGroup: appSecurityGroup,
      role: ec2Role,
      userData: ec2.UserData.forLinux(),
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            encrypted: true,
            kmsKey: kmsKey,
          }),
        },
      ],
      requireImdsv2: true,
    });

    // Add user data commands if userData is defined
    if (launchTemplate.userData) {
      launchTemplate.userData.addCommands(
        'yum update -y',
        'yum install -y amazon-cloudwatch-agent',
        'yum install -y docker',
        'service docker start',
        'usermod -a -G docker ec2-user',
        // Configure CloudWatch agent
        `cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "${logGroup.logGroupName}",
            "log_stream_name": "{instance_id}/messages"
          }
        ]
      }
    }
  }
}
EOF`,
        '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
      );
    }

    // Auto Scaling Group across multiple AZs
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'AutoScalingGroup',
      {
        vpc: vpc,
        launchTemplate: launchTemplate,
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

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      'ApplicationLoadBalancer',
      {
        loadBalancerName: `tap-${environmentSuffix}-alb`,
        vpc: vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      targetGroupName: `tap-${environmentSuffix}-tg`,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      vpc: vpc,
      targetType: elbv2.TargetType.INSTANCE,
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: elbv2.Protocol.HTTP,
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
      },
    });

    // Attach Auto Scaling Group to Target Group
    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // HTTP Listener (for testing - in production you would use HTTPS with a valid certificate)
    alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Enable access logs using the ALB-specific log bucket
    alb.logAccessLogs(albLogBucket, 'alb-logs');

    // ==================== DATABASE LAYER ====================

    // RDS Subnet Group
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      description: 'Subnet group for RDS database',
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // RDS Parameter Group for enhanced security
    const parameterGroup = new rds.ParameterGroup(
      this,
      'DatabaseParameterGroup',
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        parameters: {
          innodb_file_per_table: '1',
          innodb_flush_log_at_trx_commit: '1',
          log_bin_trust_function_creators: '1',
        },
      }
    );

    // RDS Database with encryption and automatic backups
    const database = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: `tap-${environmentSuffix}-db`,
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.SMALL
      ),
      vpc: vpc,
      credentials: rds.Credentials.fromSecret(dbSecret),
      multiAz: true,
      subnetGroup: subnetGroup,
      securityGroups: [dbSecurityGroup],
      parameterGroup: parameterGroup,
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: cdk.Duration.days(30),
      deleteAutomatedBackups: false,
      deletionProtection: false, // Set to false for testing environments
      enablePerformanceInsights: false, // Performance Insights not supported for t3.small
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ==================== WAF LAYER ====================

    // WAF v2 Web ACL with automatic DDoS protection
    const webAcl = new wafv2.CfnWebACL(this, 'WebAcl', {
      name: `SecureWebAppAcl-${environmentSuffix}`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      description: 'WAF ACL for secure web application with DDoS protection',
      rules: [
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
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
          overrideAction: { none: {} },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 2,
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
          overrideAction: { none: {} },
        },
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 3,
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
          overrideAction: { none: {} },
        },
        {
          name: 'AWSManagedRulesAmazonIpReputationList',
          priority: 4,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesAmazonIpReputationList',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'IpReputationMetric',
          },
          overrideAction: { none: {} },
        },
        {
          name: 'RateLimitRule',
          priority: 5,
          statement: {
            rateBasedStatement: {
              limit: 10000,
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'SecureWebAppAclMetric',
      },
    });

    // Associate WAF with Application Load Balancer
    new wafv2.CfnWebACLAssociation(this, 'WebAclAssociation', {
      resourceArn: alb.loadBalancerArn,
      webAclArn: webAcl.attrArn,
    });

    // ==================== OUTPUTS ====================

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
      exportName: `tap-${environmentSuffix}-alb-dns`,
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `tap-${environmentSuffix}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: `tap-${environmentSuffix}-kms-key-id`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
      exportName: `tap-${environmentSuffix}-db-endpoint`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: logBucket.bucketName,
      description: 'S3 Bucket for logs',
      exportName: `tap-${environmentSuffix}-log-bucket`,
    });

    new cdk.CfnOutput(this, 'WebAclArn', {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
      exportName: `tap-${environmentSuffix}-waf-arn`,
    });
  }
}
