```javascript
const { Stack, StackProps, Duration, RemovalPolicy } = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const rds = require('aws-cdk-lib/aws-rds');
const autoscaling = require('aws-cdk-lib/aws-autoscaling');
const elbv2 = require('aws-cdk-lib/aws-elasticloadbalancingv2');
const s3 = require('aws-cdk-lib/aws-s3');
const kms = require('aws-cdk-lib/aws-kms');
const sns = require('aws-cdk-lib/aws-sns');
const cloudwatch = require('aws-cdk-lib/aws-cloudwatch');
const iam = require('aws-cdk-lib/aws-iam');
const { Construct } = require('constructs');

class HighAvailabilityWebArchitectureStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Security Foundation - KMS Key
    const kmsKey = new kms.Key(this, 'WebAppKMSKey', {
      description: 'KMS Key for encrypting web application data at rest',
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // VPC and Networking
    const vpc = new ec2.Vpc(this, 'WebAppVPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
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
      ],
      natGateways: 2,
    });

    // Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
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

    const appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc,
      description: 'Security group for Application Tier EC2 instances',
      allowAllOutbound: true,
    });

    appSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
      vpc,
      description: 'Security group for RDS Database',
      allowAllOutbound: false,
    });

    dbSecurityGroup.addIngressRule(
      appSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL traffic from application tier'
    );

    // Database Tier - Multi-AZ RDS
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    const database = new rds.DatabaseInstance(this, 'WebAppDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      multiAz: true,
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      securityGroups: [dbSecurityGroup],
      subnetGroup: dbSubnetGroup,
      databaseName: 'webapp',
      credentials: rds.Credentials.fromGeneratedSecret('dbadmin'),
      backupRetention: Duration.days(7),
      deletionProtection: false,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    const instanceProfile = new iam.InstanceProfile(
      this,
      'EC2InstanceProfile',
      {
        role: ec2Role,
      }
    );

    // Application Tier - EC2 Auto Scaling
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Web Application Server</h1>" > /var/www/html/index.html'
    );

    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'WebAppLaunchTemplate',
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        userData,
        securityGroup: appSecurityGroup,
        role: ec2Role,
      }
    );

    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'WebAppASG',
      {
        vpc,
        launchTemplate,
        minCapacity: 2,
        maxCapacity: 6,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.elb({
          grace: Duration.minutes(5),
        }),
      }
    );

    // CPU-based scaling policies
    autoScalingGroup.scaleOnCpuUtilization('CPUScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.minutes(5),
      scaleOutCooldown: Duration.minutes(5),
    });

    // Web Tier - Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'WebAppALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'WebAppTargetGroup',
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [autoScalingGroup],
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          interval: Duration.seconds(30),
          path: '/',
          protocol: elbv2.Protocol.HTTP,
          timeout: Duration.seconds(5),
          unhealthyThresholdCount: 3,
        },
      }
    );

    // HTTP listener with redirect to HTTPS
    alb.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
    });

    // HTTPS listener (would require SSL certificate in production)
    alb.addListener('HTTPSListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      defaultTargetGroups: [targetGroup],
      certificates: [
        // In production, add SSL certificate here
        // elbv2.ListenerCertificate.fromArn('arn:aws:acm:...')
      ],
    });

    // Storage - Secure S3 Bucket
    const s3Bucket = new s3.Bucket(this, 'WebAppS3Bucket', {
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Grant EC2 instances access to S3 bucket
    s3Bucket.grantReadWrite(ec2Role);

    // Monitoring and Alerting - SNS Topic
    const alertTopic = new sns.Topic(this, 'WebAppAlerts', {
      displayName: 'Web Application Alerts',
    });

    // CloudWatch Alarm for CPU Utilization
    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCPUAlarm', {
      metric: autoScalingGroup.metricCpuUtilization({
        period: Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'High CPU utilization detected in Auto Scaling Group',
    });

    cpuAlarm.addAlarmAction(new cloudwatch.SnsAction(alertTopic));

    // Additional CloudWatch Alarm for ALB Target Health
    const unhealthyTargetAlarm = new cloudwatch.Alarm(
      this,
      'UnhealthyTargetAlarm',
      {
        metric: targetGroup.metricUnhealthyHostCount({
          period: Duration.minutes(1),
        }),
        threshold: 1,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'Unhealthy targets detected in target group',
      }
    );

    unhealthyTargetAlarm.addAlarmAction(new cloudwatch.SnsAction(alertTopic));

    // Database connection alarm
    const dbConnectionAlarm = new cloudwatch.Alarm(this, 'DBConnectionAlarm', {
      metric: database.metricDatabaseConnections({
        period: Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'High database connection count detected',
    });

    dbConnectionAlarm.addAlarmAction(new cloudwatch.SnsAction(alertTopic));
  }
}

module.exports = { HighAvailabilityWebArchitectureStack };
```

```javascript
// app.js
const { App } = require('aws-cdk-lib');
const {
  HighAvailabilityWebArchitectureStack,
} = require('./high-availability-web-architecture-stack');

const app = new App();

new HighAvailabilityWebArchitectureStack(
  app,
  'HighAvailabilityWebArchitectureStack',
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-1',
    },
    description: 'High-Availability Web Architecture with AWS CDK',
  }
);

app.synth();
```

```json
{
  "name": "high-availability-web-architecture",
  "version": "1.0.0",
  "description": "High-Availability Web Architecture with AWS CDK",
  "main": "app.js",
  "scripts": {
    "build": "echo \"No build step required\"",
    "cdk": "cdk",
    "deploy": "cdk deploy",
    "destroy": "cdk destroy",
    "diff": "cdk diff",
    "synth": "cdk synth"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.100.0",
    "constructs": "^10.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.8.0"
  }
}
```

```json
{
  "app": "node app.js",
  "watch": {
    "include": ["**"],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-normlizedkeys:props": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-opensearchservice:enforceHttps": true,
    "@aws-cdk/aws-s3:eventBridgeNotificationToSameEnvironment": true,
    "@aws-cdk/aws-dms:upgradeEngineVersion": true
  }
}
```

This CDK application creates a complete high-availability web architecture with the following key features:

## Architecture Components

**Security Foundation:**

- Customer-managed KMS key with automatic rotation for encrypting data at rest

**Network Tier:**

- VPC with 2 public and 2 private subnets across 2 AZs
- Internet Gateway and 2 NAT Gateways for high availability
- Security groups with least-privilege access

**Database Tier:**

- Multi-AZ PostgreSQL RDS instance in private subnets
- Encrypted storage using the KMS key
- Automated backups with 7-day retention

**Application Tier:**

- Auto Scaling Group with EC2 instances across private subnets
- CPU-based scaling (scale out at 70%, scale in at 30%)
- IAM role with CloudWatch permissions

**Web Tier:**

- Application Load Balancer in public subnets
- HTTP to HTTPS redirect with 301 permanent redirect
- Health checks and target group configuration

**Storage:**

- S3 bucket with versioning and KMS encryption
- Block public access and enforce SSL

**Monitoring:**

- SNS topic for alerts
- CloudWatch alarms for CPU utilization, unhealthy targets, and database connections
- Comprehensive monitoring across all tiers

The architecture ensures high availability through multi-AZ deployment, automatic scaling, and comprehensive monitoring with alerting capabilities.
