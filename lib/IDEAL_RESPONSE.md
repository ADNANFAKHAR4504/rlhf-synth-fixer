### bin/tap.mjs

```javascript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.mjs';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

### lib/tap-stack.mjs

```javascript
import * as cdk from 'aws-cdk-lib';
import { HighAvailableStack } from './high-available.mjs';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create the high-availability web architecture stack
    const highAvailableStack = new HighAvailableStack(
      scope,
      `HighAvailableStack${environmentSuffix}`,
      {
        ...props,
        environmentSuffix,
        description: `High-Availability Web Architecture - ${environmentSuffix}`,
      }
    );

    // Store reference for potential use
    this.highAvailableStack = highAvailableStack;

    // Main orchestrator stack outputs
    new cdk.CfnOutput(this, `OrchestratorStatus${environmentSuffix}`, {
      value: 'ORCHESTRATOR_DEPLOYED',
      description: `High-availability web architecture orchestrator status - ${environmentSuffix}`,
    });
  }
}

export { TapStack };
```

### lib/high-available.mjs

```javascript
import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';

export class HighAvailableStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // 1. Security Foundation - KMS Key
    const kmsKey = new kms.Key(this, `WebAppKMSKey${environmentSuffix}`, {
      description: `KMS Key for encrypting web application data at rest - ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      enabled: true,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
    });

    // Create alias for the KMS key
    new kms.Alias(this, `WebAppKMSKeyAlias${environmentSuffix}`, {
      aliasName: `alias/webapp-encryption-key-${environmentSuffix}`,
      targetKey: kmsKey,
    });

    // Grant root account access to the KMS key
    kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'EnableIAMUserPermissions',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ArnPrincipal(`arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:root`),
        ],
        actions: ['kms:*'],
        resources: ['*'],
      })
    );

    // Grant Auto Scaling service-linked role access to the KMS key for EBS encryption
    kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowServiceLinkedRoleUseOfTheKMS',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ArnPrincipal(
            `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling`
          ),
        ],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
        ],
        resources: ['*'],
      })
    );

    // Grant Auto Scaling service-linked role permission to create grants
    kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowAttachmentOfPersistentResources',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ArnPrincipal(
            `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling`
          ),
        ],
        actions: ['kms:CreateGrant'],
        resources: ['*'],
        conditions: {
          Bool: {
            'kms:GrantIsForAWSResource': 'true',
          },
        },
      })
    );

    // 2. VPC and Networking
    const vpc = new ec2.Vpc(this, `WebAppVPC${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `PublicSubnet${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `PrivateSubnet${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // 3. Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `ALBSecurityGroup${environmentSuffix}`,
      {
        vpc,
        description: `Security group for Application Load Balancer - ${environmentSuffix}`,
        allowAllOutbound: true,
        securityGroupName: `alb-sg-${environmentSuffix}`,
      }
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    const appSecurityGroup = new ec2.SecurityGroup(
      this,
      `AppSecurityGroup${environmentSuffix}`,
      {
        vpc,
        description: `Security group for Application Tier EC2 instances - ${environmentSuffix}`,
        allowAllOutbound: true,
        securityGroupName: `app-sg-${environmentSuffix}`,
      }
    );

    appSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `DBSecurityGroup${environmentSuffix}`,
      {
        vpc,
        description: `Security group for RDS Database - ${environmentSuffix}`,
        allowAllOutbound: false,
        securityGroupName: `db-sg-${environmentSuffix}`,
      }
    );

    dbSecurityGroup.addIngressRule(
      appSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL traffic from application tier'
    );

    // 4. Database Tier - Multi-AZ RDS
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `DBSubnetGroup${environmentSuffix}`,
      {
        vpc,
        description: `Subnet group for RDS database - ${environmentSuffix}`,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        subnetGroupName: `db-subnet-group-${environmentSuffix}`,
      }
    );

    const database = new rds.DatabaseInstance(
      this,
      `WebAppDatabase${environmentSuffix}`,
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15,
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
        credentials: rds.Credentials.fromGeneratedSecret('dbadmin', {
          secretName: `webapp-db-credentials-${environmentSuffix}`,
        }),
        backupRetention: cdk.Duration.days(7),
        deletionProtection: false,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        enablePerformanceInsights: true,
        performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
        cloudwatchLogsExports: ['postgresql'],
        instanceIdentifier: `webapp-db-${environmentSuffix}`,
      }
    );

    // 5. IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, `EC2InstanceRole${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
      roleName: `webapp-ec2-role-${environmentSuffix}`,
    });

    // Add KMS permissions for EC2 instances to work with encrypted EBS volumes
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowKMSAccessForEBS',
        effect: iam.Effect.ALLOW,
        actions: [
          'kms:CreateGrant',
          'kms:Decrypt',
          'kms:DescribeKey',
          'kms:GenerateDataKeyWithoutPlaintext',
          'kms:ReEncrypt*',
        ],
        resources: [kmsKey.keyArn],
      })
    );

    // 6. S3 Bucket with versioning and KMS encryption
    const s3Bucket = new s3.Bucket(this, `WebAppS3Bucket${environmentSuffix}`, {
      bucketName: `webapp-storage-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: `LifecycleRule${environmentSuffix}`,
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
      ],
    });

    // Grant EC2 instances access to S3 bucket
    s3Bucket.grantReadWrite(ec2Role);

    // 7. Application Tier - EC2 Auto Scaling
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      `echo "<h1>Web Application Server - ${environmentSuffix}</h1>" > /var/www/html/index.html`,
      'echo "<p>High Availability Web Architecture</p>" >> /var/www/html/index.html'
    );

    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `WebAppLaunchTemplate${environmentSuffix}`,
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        userData,
        securityGroup: appSecurityGroup,
        role: ec2Role,
        launchTemplateName: `webapp-lt-${environmentSuffix}`,
      }
    );

    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      `WebAppASG${environmentSuffix}`,
      {
        vpc,
        launchTemplate,
        minCapacity: 2,
        maxCapacity: 6,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        autoScalingGroupName: `webapp-asg-${environmentSuffix}`,
      }
    );

    // Ensure Auto Scaling Group waits for KMS key to be ready
    autoScalingGroup.node.addDependency(kmsKey);

    // Target Group for ALB
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `WebAppTargetGroup${environmentSuffix}`,
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [autoScalingGroup],
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          interval: cdk.Duration.seconds(30),
          path: '/',
          protocol: elbv2.Protocol.HTTP,
          timeout: cdk.Duration.seconds(5),
          unhealthyThresholdCount: 3,
        },
        targetGroupName: `webapp-tg-${environmentSuffix}`,
      }
    );

    // CPU-based scaling policies
    autoScalingGroup.scaleOnCpuUtilization(`CPUScaling${environmentSuffix}`, {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(5),
    });

    // 8. Web Tier - Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `WebAppALB${environmentSuffix}`,
      {
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        loadBalancerName: `webapp-alb-${environmentSuffix}`,
        deletionProtection: false,
      }
    );

    // HTTP Listener
    const httpListener = alb.addListener(`HTTPListener${environmentSuffix}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // 9. Monitoring and Alerting - SNS Topic
    const alertTopic = new sns.Topic(this, `WebAppAlerts${environmentSuffix}`, {
      displayName: `Web Application Alerts - ${environmentSuffix}`,
      topicName: `webapp-alerts-${environmentSuffix}`,
    });

    // CloudWatch Alarms
    const cpuAlarm = new cloudwatch.Alarm(
      this,
      `HighCPUAlarm${environmentSuffix}`,
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
          },
          period: cdk.Duration.minutes(5),
          statistic: 'Average',
        }),
        threshold: 80,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `High CPU utilization detected in Auto Scaling Group - ${environmentSuffix}`,
        alarmName: `webapp-high-cpu-${environmentSuffix}`,
      }
    );

    cpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    const unhealthyTargetAlarm = new cloudwatch.Alarm(
      this,
      `UnhealthyTargetAlarm${environmentSuffix}`,
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApplicationELB',
          metricName: 'UnHealthyHostCount',
          dimensionsMap: {
            TargetGroup: targetGroup.targetGroupFullName,
          },
          period: cdk.Duration.minutes(1),
          statistic: 'Average',
        }),
        threshold: 1,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `Unhealthy targets detected in target group - ${environmentSuffix}`,
        alarmName: `webapp-unhealthy-targets-${environmentSuffix}`,
      }
    );

    unhealthyTargetAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    const dbConnectionAlarm = new cloudwatch.Alarm(
      this,
      `DBConnectionAlarm${environmentSuffix}`,
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'DatabaseConnections',
          dimensionsMap: {
            DBInstanceIdentifier: database.instanceIdentifier,
          },
          period: cdk.Duration.minutes(5),
          statistic: 'Average',
        }),
        threshold: 80,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `High database connection count detected - ${environmentSuffix}`,
        alarmName: `webapp-db-connections-${environmentSuffix}`,
      }
    );

    dbConnectionAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // Apply tags to all resources
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Service', 'WebApp');
    cdk.Tags.of(this).add('Architecture', 'HighAvailability');

    // Outputs
    new cdk.CfnOutput(this, `WebAppURL${environmentSuffix}`, {
      value: `http://${alb.loadBalancerDnsName}`,
      description: `Web application URL - ${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `LoadBalancerDNS${environmentSuffix}`, {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, `DatabaseEndpoint${environmentSuffix}`, {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database endpoint hostname',
    });

    new cdk.CfnOutput(this, `S3BucketName${environmentSuffix}`, {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket name for web application storage',
    });

    new cdk.CfnOutput(this, `VpcId${environmentSuffix}`, {
      value: vpc.vpcId,
      description: 'VPC ID for the web application',
    });

    new cdk.CfnOutput(this, `KmsKeyId${environmentSuffix}`, {
      value: kmsKey.keyId,
      description: 'KMS Key ID for web application encryption',
    });

    new cdk.CfnOutput(this, `SNSTopicArn${environmentSuffix}`, {
      value: alertTopic.topicArn,
      description: 'SNS Topic ARN for alerts',
    });

    new cdk.CfnOutput(this, `StackStatus${environmentSuffix}`, {
      value: 'DEPLOYED',
      description: `High-availability web architecture deployment status - ${environmentSuffix}`,
    });
 # }
}
```
