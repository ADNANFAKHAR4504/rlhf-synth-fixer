# Secure AWS Cloud Infrastructure Implementation

I'll provide a comprehensive CloudFormation CDK implementation that meets all your requirements. This solution creates a secure, monitored infrastructure with proper IAM policies, networking, and monitoring.

## Complete Implementation

```typescript
// tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  projectName: string;
  environmentSuffix: string;
  officeCidr: string;
  devOpsEmail: string;
  dbUsername: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, {
      ...props,
      env: {
        region: 'us-west-2',
        account: props.env?.account,
      },
    });

    const { projectName, environmentSuffix, officeCidr, devOpsEmail, dbUsername } = props;

    // Common tags for all resources
    const commonTags = {
      Project: projectName,
      Environment: environmentSuffix,
      ManagedBy: 'CDK',
      CostCenter: `${projectName}-${environmentSuffix}`,
    };

    // Apply tags to the stack
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // ========================================
    // S3 BUCKET FOR CLOUDTRAIL LOGS
    // ========================================
    const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `${projectName}-${environmentSuffix}-cloudtrail-logs`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'CloudTrailLogRetention',
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
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ========================================
    // VPC AND NETWORKING
    // ========================================
    const vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `${projectName}-${environmentSuffix}-vpc`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 2, // One NAT gateway per public subnet
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `${projectName}-${environmentSuffix}-public`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `${projectName}-${environmentSuffix}-private`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: `${projectName}-${environmentSuffix}-database`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // ========================================
    // SECURITY GROUPS
    // ========================================
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      securityGroupName: `${projectName}-${environmentSuffix}-web-sg`,
      vpc,
      description: 'Security group for web servers',
      allowAllOutbound: true,
    });

    // Allow HTTP and HTTPS from office CIDR
    webSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(officeCidr),
      ec2.Port.tcp(80),
      'Allow HTTP from office'
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(officeCidr),
      ec2.Port.tcp(443),
      'Allow HTTPS from office'
    );

    const databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      securityGroupName: `${projectName}-${environmentSuffix}-db-sg`,
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    // Allow MySQL/Aurora access from web security group
    databaseSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from web servers'
    );

    // ========================================
    // IAM ROLES AND POLICIES
    // ========================================
    const ec2Role = new iam.Role(this, 'EC2Role', {
      roleName: `${projectName}-${environmentSuffix}-ec2-role`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
              ],
              resources: [`arn:aws:s3:::${projectName}-${environmentSuffix}-app-data/*`],
            }),
          ],
        }),
      },
    });

    const instanceProfile = new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      instanceProfileName: `${projectName}-${environmentSuffix}-ec2-profile`,
      role: ec2Role,
    });

    // ========================================
    // SNS TOPIC FOR ALERTS
    // ========================================
    const alertsTopic = new sns.Topic(this, 'AlertsTopic', {
      topicName: `${projectName}-${environmentSuffix}-alerts`,
      displayName: 'DevOps Alerts',
    });

    alertsTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(devOpsEmail)
    );

    // ========================================
    // EC2 INSTANCES
    // ========================================
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Web Server Running</h1>" > /var/www/html/index.html',
      
      // CloudWatch Agent configuration
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify({
        metrics: {
          namespace: `${projectName}/${environmentSuffix}`,
          metrics_collected: {
            cpu: {
              measurement: ['cpu_usage_idle', 'cpu_usage_iowait', 'cpu_usage_user', 'cpu_usage_system'],
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
      }, null, 2),
      'EOF',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    const launchTemplate = new ec2.LaunchTemplate(this, 'WebServerLaunchTemplate', {
      launchTemplateName: `${projectName}-${environmentSuffix}-web-template`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: webSecurityGroup,
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
    });

    // Launch instances in private subnets
    const webInstances: ec2.Instance[] = [];
    vpc.privateSubnets.forEach((subnet, index) => {
      const instance = new ec2.Instance(this, `WebServer${index + 1}`, {
        instanceName: `${projectName}-${environmentSuffix}-web-${index + 1}`,
        vpc,
        vpcSubnets: { subnets: [subnet] },
        launchTemplate,
      });
      webInstances.push(instance);
    });

    // ========================================
    // CLOUDWATCH ALARMS
    // ========================================
    webInstances.forEach((instance, index) => {
      const cpuAlarm = new cloudwatch.Alarm(this, `CPUAlarm${index + 1}`, {
        alarmName: `${projectName}-${environmentSuffix}-cpu-alarm-${index + 1}`,
        metric: instance.metricCpuUtilization({
          period: cdk.Duration.minutes(5),
          statistic: 'Average',
        }),
        threshold: 80,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        alarmDescription: `CPU utilization exceeded 80% for instance ${instance.instanceId}`,
      });

      cpuAlarm.addAlarmAction(
        new cdk.aws_cloudwatch_actions.SnsAction(alertsTopic)
      );
    });

    // ========================================
    // RDS DATABASE
    // ========================================
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      subnetGroupName: `${projectName}-${environmentSuffix}-db-subnet-group`,
      description: 'Subnet group for RDS database',
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const database = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: `${projectName}-${environmentSuffix}-database`,
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [databaseSecurityGroup],
      multiAz: true,
      storageEncrypted: true,
      storageType: rds.StorageType.GP2,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      credentials: rds.Credentials.fromGeneratedSecret(dbUsername, {
        secretName: `${projectName}-${environmentSuffix}-db-credentials`,
      }),
      backupRetention: cdk.Duration.days(7),
      deletionProtection: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      monitoringInterval: cdk.Duration.minutes(1),
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
    });

    // ========================================
    // CLOUDTRAIL
    // ========================================
    const cloudTrail = new cloudtrail.Trail(this, 'CloudTrail', {
      trailName: `${projectName}-${environmentSuffix}-cloudtrail`,
      bucket: cloudTrailBucket,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      sendToCloudWatchLogs: true,
      cloudWatchLogGroup: new logs.LogGroup(this, 'CloudTrailLogGroup', {
        logGroupName: `/aws/cloudtrail/${projectName}-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_YEAR,
      }),
    });

    // ========================================
    // APPLICATION DATA S3 BUCKET
    // ========================================
    const appDataBucket = new s3.Bucket(this, 'AppDataBucket', {
      bucketName: `${projectName}-${environmentSuffix}-app-data`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'AppDataRetention',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ========================================
    // OUTPUTS
    // ========================================
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'CloudTrailBucketName', {
      value: cloudTrailBucket.bucketName,
      description: 'CloudTrail S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'AlertsTopicArn', {
      value: alertsTopic.topicArn,
      description: 'SNS Topic ARN for Alerts',
    });

    new cdk.CfnOutput(this, 'WebInstanceIds', {
      value: webInstances.map(instance => instance.instanceId).join(', '),
      description: 'Web Server Instance IDs',
    });
  }
}
```

## Usage Example

```typescript
// app.ts
import * as cdk from 'aws-cdk-lib';
import { TapStack } from './tap-stack';

const app = new cdk.App();

new TapStack(app, 'TapStack', {
  projectName: 'webapp',
  environmentSuffix: 'prod',
  officeCidr: '203.0.113.0/24', // Replace with your office IP range
  devOpsEmail: 'devops@yourcompany.com',
  dbUsername: 'admin',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
});
```

## Key Features Implemented

### 🔐 Security
- **IAM Principle of Least Privilege**: EC2 roles have minimal required permissions
- **Private Subnets**: All EC2 instances deployed in private subnets
- **Security Groups**: Restrictive rules allowing only HTTP/HTTPS from specified CIDR
- **Encryption**: All storage (S3, EBS, RDS) encrypted at rest

### 🌐 Networking
- **VPC**: Custom VPC with public/private/database subnets across 2 AZs
- **NAT Gateways**: One per public subnet for private subnet internet access
- **Subnet Isolation**: Database in isolated subnets, web servers in private subnets

### 📊 Monitoring & Alerting
- **CloudWatch Alarms**: CPU utilization monitoring with 80% threshold
- **SNS Integration**: Email notifications to DevOps team
- **CloudTrail**: Comprehensive audit logging with encrypted storage
- **Performance Insights**: RDS monitoring enabled

### 🗄️ Database
- **Multi-AZ RDS**: High availability MySQL database
- **Encrypted Storage**: Storage encryption enabled
- **Automated Backups**: 7-day retention period
- **Secrets Management**: Database credentials stored in AWS Secrets Manager

### 🏷️ Resource Management
- **Consistent Tagging**: All resources tagged for cost tracking
- **Naming Convention**: `projectname-environmentSuffix-resource` format
- **Resource Outputs**: Important resource IDs exported for reference

## Deployment Commands

```bash
# Install dependencies
npm install

# Bootstrap CDK (first time only)
cdk bootstrap --region us-west-2

# Deploy the stack
cdk deploy TapStack

# View differences before deployment
cdk diff TapStack

# Destroy the stack (when needed)
cdk destroy TapStack
```

This implementation provides a production-ready, secure AWS infrastructure that meets all your specified requirements while following AWS best practices for security, monitoring, and resource management.