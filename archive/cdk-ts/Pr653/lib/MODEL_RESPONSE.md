# Secure AWS Infrastructure with CDK TypeScript

Based on your requirements for a HIPAA-compliant, secure AWS infrastructure in us-west-2, here's a comprehensive CDK TypeScript solution:

## File: lib/security-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class SecurityStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly kmsKey: kms.Key;
  public readonly dbSecret: secretsmanager.Secret;
  public readonly logBucket: s3.Bucket;
  public readonly appSecurityGroup: ec2.SecurityGroup;
  public readonly dbSecurityGroup: ec2.SecurityGroup;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly ec2Role: iam.Role;
  public readonly rdsRole: iam.Role;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // KMS Key for encryption at rest
    this.kmsKey = new kms.Key(this, 'EncryptionKey', {
      description: 'KMS key for encrypting all data at rest',
      enableKeyRotation: true,
    });

    // VPC with multi-AZ setup
    this.vpc = new ec2.Vpc(this, 'SecureVpc', {
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

    // S3 Bucket for logging with encryption
    this.logBucket = new s3.Bucket(this, 'LogBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
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

    // CloudWatch Log Group
    new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: '/aws/application/secure-web-app',
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: this.kmsKey,
    });

    // Database secret in Secrets Manager
    this.dbSecret = new secretsmanager.Secret(this, 'DbSecret', {
      description: 'RDS Database Credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
        passwordLength: 32,
      },
      encryptionKey: this.kmsKey,
    });

    // Security Groups with restricted access
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });

    // Restrict HTTPS access to specific IPs (replace with actual allowed IPs)
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'), // Replace with your allowed IP range
      ec2.Port.tcp(443),
      'HTTPS access from trusted IPs'
    );

    this.appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for application instances',
      allowAllOutbound: true,
    });

    this.appSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(8080),
      'HTTP from ALB'
    );

    this.dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    this.dbSecurityGroup.addIngressRule(
      this.appSecurityGroup,
      ec2.Port.tcp(3306),
      'MySQL from application'
    );

    // IAM Role for EC2 instances with minimal permissions
    this.ec2Role = new iam.Role(this, 'Ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with minimal permissions',
    });

    this.ec2Role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'secretsmanager:GetSecretValue',
      ],
      resources: [this.dbSecret.secretArn],
    }));

    this.ec2Role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/application/secure-web-app:*`],
    }));

    this.ec2Role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:PutObject',
        's3:PutObjectAcl',
      ],
      resources: [`${this.logBucket.bucketArn}/*`],
    }));

    // IAM Role for RDS with minimal permissions
    this.rdsRole = new iam.Role(this, 'RdsRole', {
      assumedBy: new iam.ServicePrincipal('rds.amazonaws.com'),
      description: 'IAM role for RDS with minimal permissions',
    });

    this.rdsRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:PutObject',
        's3:PutObjectAcl',
      ],
      resources: [`${this.logBucket.bucketArn}/rds-logs/*`],
    }));
  }
}
```

## File: lib/compute-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';
import { SecurityStack } from './security-stack';

interface ComputeStackProps extends cdk.StackProps {
  securityStack: SecurityStack;
}

export class ComputeStack extends cdk.Stack {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const { securityStack } = props;

    // Launch Template for EC2 instances
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      securityGroup: securityStack.appSecurityGroup,
      role: securityStack.ec2Role,
      userData: ec2.UserData.forLinux(),
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            encrypted: true,
            kmsKey: securityStack.kmsKey,
          }),
        },
      ],
      requireImdsv2: true,
    });

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
            "log_group_name": "/aws/application/secure-web-app",
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

    // Auto Scaling Group across multiple AZs
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'AutoScalingGroup', {
      vpc: securityStack.vpc,
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
    });

    // Application Load Balancer
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'ApplicationLoadBalancer', {
      vpc: securityStack.vpc,
      internetFacing: true,
      securityGroup: securityStack.albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // SSL Certificate (you would need to replace with your domain)
    const certificate = new certificatemanager.Certificate(this, 'Certificate', {
      domainName: 'example.com', // Replace with your domain
      validation: certificatemanager.CertificateValidation.fromDns(),
    });

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      vpc: securityStack.vpc,
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
    this.autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // HTTPS Listener
    this.alb.addListener('HttpsListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [certificate],
      defaultTargetGroups: [targetGroup],
    });

    // Redirect HTTP to HTTPS
    this.alb.addRedirect({
      sourceProtocol: elbv2.ApplicationProtocol.HTTP,
      sourcePort: 80,
      targetProtocol: elbv2.ApplicationProtocol.HTTPS,
      targetPort: 443,
    });

    // Enable access logs
    this.alb.logAccessLogs(securityStack.logBucket, 'alb-logs');
  }
}
```

## File: lib/database-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { SecurityStack } from './security-stack';

interface DatabaseStackProps extends cdk.StackProps {
  securityStack: SecurityStack;
}

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { securityStack } = props;

    // RDS Subnet Group
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      description: 'Subnet group for RDS database',
      vpc: securityStack.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // RDS Parameter Group for enhanced security
    const parameterGroup = new rds.ParameterGroup(this, 'DatabaseParameterGroup', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      parameters: {
        'innodb_file_per_table': '1',
        'innodb_flush_log_at_trx_commit': '1',
        'log_bin_trust_function_creators': '1',
      },
    });

    // RDS Database with encryption and automatic backups
    this.database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      vpc: securityStack.vpc,
      credentials: rds.Credentials.fromSecret(securityStack.dbSecret),
      multiAz: true,
      subnetGroup: subnetGroup,
      securityGroups: [securityStack.dbSecurityGroup],
      parameterGroup: parameterGroup,
      storageEncrypted: true,
      storageEncryptionKey: securityStack.kmsKey,
      backupRetention: cdk.Duration.days(30),
      deleteAutomatedBackups: false,
      deletionProtection: true,
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: securityStack.kmsKey,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      cloudwatchLogsExports: ['error', 'general', 'slow-query'],
      associatedRoles: [
        {
          role: securityStack.rdsRole,
          feature: rds.DatabaseInstanceEngine.mysql({
            version: rds.MysqlEngineVersion.VER_8_0,
          }).bindToInstance(this, {}).features?.s3Import || '',
        },
      ],
    });

    // Output the database endpoint
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });
  }
}
```

## File: lib/waf-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

interface WafStackProps extends cdk.StackProps {
  applicationLoadBalancer: elbv2.ApplicationLoadBalancer;
}

export class WafStack extends cdk.Stack {
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: WafStackProps) {
    super(scope, id, props);

    const { applicationLoadBalancer } = props;

    // WAF v2 Web ACL with automatic DDoS protection
    this.webAcl = new wafv2.CfnWebACL(this, 'WebAcl', {
      name: 'SecureWebAppAcl',
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
          name: 'AutomaticDDoSProtectionRule',
          priority: 5,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesDDoSProtectionRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'DDoSProtectionMetric',
          },
          overrideAction: { none: {} },
        },
        {
          name: 'RateLimitRule',
          priority: 6,
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
      resourceArn: applicationLoadBalancer.loadBalancerArn,
      webAclArn: this.webAcl.attrArn,
    });

    // Output the WAF ACL ARN
    new cdk.CfnOutput(this, 'WebAclArn', {
      value: this.webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });
  }
}
```

This infrastructure provides:

1. **AWS Secrets Manager** for secure database credential storage
2. **Multi-AZ deployment** in us-west-2 with high availability
3. **IAM roles** with minimal required permissions
4. **Security groups** with strict IP-based access control
5. **KMS encryption** for all data at rest
6. **S3 and CloudWatch logging** for comprehensive monitoring
7. **RDS MySQL** with automatic backups and encryption
8. **WAF v2** with automatic DDoS protection and managed rule sets
9. **Application Load Balancer** with HTTPS encryption and SSL termination
10. **HIPAA compliance** through encryption, access controls, and audit logging

The code follows AWS security best practices and can be deployed using `cdk deploy` commands.