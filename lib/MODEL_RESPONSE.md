# AWS CDK TypeScript Infrastructure Solution

I'll create a scalable cloud environment with S3, IAM, RDS, and auto-scaling infrastructure across multiple availability zones in us-east-1.

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix = props?.environmentSuffix || this.node.tryGetContext('environmentSuffix') || 'dev';

    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      CostCenter: 'Infrastructure',
      Owner: 'DevOps-Team',
      Project: 'ScalableCloudEnvironment'
    };

    // Create VPC with public and private subnets across 3 AZs
    const vpc = new ec2.Vpc(this, 'ScalableVPC', {
      ipProtocol: ec2.IpProtocol.IPV4_ONLY,
      maxAzs: 3,
      cidr: '10.0.0.0/16',
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
        }
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Apply tags to VPC
    cdk.Tags.of(vpc).add('Name', `scalable-vpc-${environmentSuffix}`);
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(vpc).add(key, value);
    });

    // Create S3 bucket for application logs with versioning
    const logsBucket = new s3.Bucket(this, 'ApplicationLogsBucket', {
      bucketName: `app-logs-${environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'LogsLifecycle',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30)
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90)
            }
          ],
          expiration: cdk.Duration.days(365)
        }
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // Apply tags to S3 bucket
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(logsBucket).add(key, value);
    });

    // Create IAM role for EC2 instances (least privilege)
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with least privilege access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
      ]
    });

    // Grant specific S3 permissions to EC2 role for logs
    logsBucket.grantWrite(ec2Role);
    logsBucket.grantRead(ec2Role);

    // Add custom policy for CloudWatch metrics
    ec2Role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cloudwatch:PutMetricData',
        'cloudwatch:GetMetricStatistics',
        'cloudwatch:ListMetrics'
      ],
      resources: ['*']
    }));

    // Apply tags to IAM role
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(ec2Role).add(key, value);
    });

    // Create DB subnet group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc: vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      }
    });

    // Security group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false
    });

    // Create RDS instance with automated backups
    const database = new rds.DatabaseInstance(this, 'ApplicationDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_8
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: rds.StorageType.GP3,
      vpc: vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [dbSecurityGroup],
      backupRetention: cdk.Duration.days(7),
      deletionProtection: true,
      deleteAutomatedBackups: false,
      multiAz: false, // Set to true for production
      storageEncrypted: true,
      monitoringInterval: cdk.Duration.minutes(5),
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      databaseName: 'appdb',
      credentials: rds.Credentials.fromGeneratedSecret('dbadmin'),
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // Apply tags to RDS instance
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(database).add(key, value);
    });

    // Security group for Auto Scaling Group instances
    const asgSecurityGroup = new ec2.SecurityGroup(this, 'AutoScalingSecurityGroup', {
      vpc: vpc,
      description: 'Security group for Auto Scaling Group instances',
      allowAllOutbound: true
    });

    // Allow HTTP and HTTPS inbound traffic
    asgSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    asgSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Allow database access from ASG instances
    dbSecurityGroup.addIngressRule(
      asgSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from ASG instances'
    );

    // Create launch template for Auto Scaling Group
    const launchTemplate = new ec2.LaunchTemplate(this, 'ApplicationLaunchTemplate', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      role: ec2Role,
      securityGroup: asgSecurityGroup,
      userData: ec2.UserData.forLinux(),
      requireImdsv2: true
    });

    // Create Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'ApplicationAutoScalingGroup', {
      vpc: vpc,
      launchTemplate: launchTemplate,
      minCapacity: 1,
      maxCapacity: 10,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      healthCheck: autoscaling.HealthCheck.ec2({
        grace: cdk.Duration.minutes(5)
      }),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
        maxBatchSize: 1,
        minInstancesInService: 1
      })
    });

    // Add scaling policies
    const scaleUpPolicy = autoScalingGroup.scaleOnCpuUtilization('ScaleUpPolicy', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(5)
    });

    // Apply tags to Auto Scaling Group
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(autoScalingGroup).add(key, value);
    });

    // Output important information
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID for the scalable environment',
      exportName: `${this.stackName}-VpcId`
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: logsBucket.bucketName,
      description: 'S3 bucket name for application logs',
      exportName: `${this.stackName}-LogsBucket`
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
      exportName: `${this.stackName}-DatabaseEndpoint`
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group name',
      exportName: `${this.stackName}-ASGName`
    });

    new cdk.CfnOutput(this, 'IAMRoleArn', {
      value: ec2Role.roleArn,
      description: 'IAM role ARN for EC2 instances',
      exportName: `${this.stackName}-EC2Role`
    });
  }
}
```

This infrastructure solution provides:

1. **Multi-AZ VPC**: Deployed across 3 availability zones with public, private, and database subnets
2. **S3 Bucket**: Versioned bucket for application logs with lifecycle policies and encryption
3. **IAM Role**: Least privilege role for EC2 instances with specific permissions for logs and monitoring
4. **RDS Database**: PostgreSQL instance with automated backups, encryption, and performance insights
5. **Auto Scaling Group**: Configured with CPU-based scaling policies for future expansion
6. **Security**: Security groups with proper access controls between tiers
7. **Monitoring**: CloudWatch integration and performance insights enabled
8. **Tagging**: Comprehensive resource tagging for environment, cost center, and ownership tracking

The solution follows AWS best practices including encryption at rest, least privilege access, multi-AZ deployment capability, and proper resource lifecycle management.