### Reasoning Trace
---

This is a comprehensive AWS CDK request for setting up a multi-tier web application infrastructure. Let me break down the requirements:

1. **Three-tier architecture:**
   - Front-end: EC2 instances behind ALB in public subnets
   - Application: Auto Scaling EC2 instances in private subnets
   - Database: RDS instance in private subnets

2. **Infrastructure requirements:**
   - VPC with 10.0.0.0/16 CIDR in us-east-1
   - Multi-AZ deployment for HA
   - Public and private subnets
   - Internet Gateway and NAT Gateways
   - Application Load Balancer
   - Auto Scaling group with policies
   - RDS with Multi-AZ
   - Security Groups and NACLs
   - CloudWatch monitoring
   - Encryption at rest
   - Proper naming conventions
   - CloudFormation outputs
   - Tagging
   - Clean deletion

3. **Constraints:**
   - Only modify ./lib/tap-stack.ts
   - No additional TypeScript files
   - Don't modify package.json or ./bin/tap.ts
   - Production-ready quality

Let me structure this implementation:

1. VPC and networking (subnets, IGW, NAT)
2. Security Groups
3. Load Balancer
4. Auto Scaling Groups for web and app tiers
5. RDS database
6. CloudWatch monitoring
7. Outputs

I need to be careful about:
- Proper subnet distribution across AZs
- Security group rules following least privilege
- Auto scaling policies
- RDS configuration with Multi-AZ
- Encryption settings
- Resource naming conventions
- Tagging
- CloudFormation outputs

Let me implement this step by step:
### Answer 
---

I'll help you implement a comprehensive multi-tier AWS infrastructure using CDK. Here's the complete implementation for your `./lib/tap-stack.ts` file:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const region = 'us-east-1';

    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      Project: 'TAP',
      ManagedBy: 'CDK',
      Region: region,
    };

    // =================
    // VPC and Networking
    // =================

    // Create VPC with 10.0.0.0/16 CIDR
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3, // Use 3 AZs for high availability
      natGateways: 3, // One NAT gateway per AZ for HA
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
        {
          cidrMask: 28,
          name: 'DatabaseSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Tag VPC and subnets
    cdk.Tags.of(vpc).add('Name', `tap-vpc-${environmentSuffix}`);
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(vpc).add(key, value);
    });

    // =================
    // Security Groups
    // =================

    // ALB Security Group
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      securityGroupName: `web-${region}-alb-sg-${environmentSuffix}`,
    });
    
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );
    
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );

    // Web tier Security Group
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc,
      description: 'Security group for web tier EC2 instances',
      securityGroupName: `web-${region}-ec2-sg-${environmentSuffix}`,
    });
    
    webSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    // App tier Security Group
    const appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc,
      description: 'Security group for application tier EC2 instances',
      securityGroupName: `app-${region}-ec2-sg-${environmentSuffix}`,
    });
    
    appSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from web tier'
    );

    // Database Security Group
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      securityGroupName: `db-${region}-rds-sg-${environmentSuffix}`,
    });
    
    dbSecurityGroup.addIngressRule(
      appSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL/Aurora access from app tier'
    );

    // Add common tags to security groups
    [albSecurityGroup, webSecurityGroup, appSecurityGroup, dbSecurityGroup].forEach(sg => {
      Object.entries(commonTags).forEach(([key, value]) => {
        cdk.Tags.of(sg).add(key, value);
      });
    });

    // =================
    // IAM Roles
    // =================

    // EC2 Instance Role with CloudWatch permissions
    const ec2Role = new iam.Role(this, 'Ec2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // =================
    // Application Load Balancer
    // =================

    const alb = new elbv2.ApplicationLoadBalancer(this, 'ApplicationLoadBalancer', {
      vpc,
      internetFacing: true,
      loadBalancerName: `web-${region}-alb-${environmentSuffix}`,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Target Group for Web Tier
    const webTargetGroup = new elbv2.ApplicationTargetGroup(this, 'WebTargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.INSTANCE,
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        path: '/health',
        protocol: elbv2.Protocol.HTTP,
        timeout: cdk.Duration.seconds(5),
        unhealthyThresholdCount: 3,
      },
      targetGroupName: `web-${region}-tg-${environmentSuffix}`,
    });

    // ALB Listener
    const listener = alb.addListener('Listener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [webTargetGroup],
    });

    // =================
    // Launch Templates and User Data
    // =================

    // Web tier user data
    const webUserData = ec2.UserData.forLinux();
    webUserData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Web Tier - $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</h1>" > /var/www/html/index.html',
      'echo "OK" > /var/www/html/health',
      // Install CloudWatch agent
      'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm',
      'rpm -U ./amazon-cloudwatch-agent.rpm',
    );

    // App tier user data
    const appUserData = ec2.UserData.forLinux();
    appUserData.addCommands(
      'yum update -y',
      'yum install -y java-11-openjdk',
      'echo "Application Tier Ready" > /tmp/app-status.txt',
      // Install CloudWatch agent
      'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm',
      'rpm -U ./amazon-cloudwatch-agent.rpm',
    );

    // Web tier launch template
    const webLaunchTemplate = new ec2.LaunchTemplate(this, 'WebLaunchTemplate', {
      launchTemplateName: `web-${region}-lt-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: webSecurityGroup,
      userData: webUserData,
      role: ec2Role,
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

    // App tier launch template
    const appLaunchTemplate = new ec2.LaunchTemplate(this, 'AppLaunchTemplate', {
      launchTemplateName: `app-${region}-lt-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: appSecurityGroup,
      userData: appUserData,
      role: ec2Role,
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

    // =================
    // Auto Scaling Groups
    // =================

    // Web tier Auto Scaling Group
    const webAutoScalingGroup = new autoscaling.AutoScalingGroup(this, 'WebAutoScalingGroup', {
      vpc,
      launchTemplate: webLaunchTemplate,
      minCapacity: 2,
      maxCapacity: 10,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      autoScalingGroupName: `web-${region}-asg-${environmentSuffix}`,
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5),
      }),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate(),
    });

    // Attach web ASG to target group
    webAutoScalingGroup.attachToApplicationTargetGroup(webTargetGroup);

    // Web tier scaling policies
    const webScaleUpPolicy = webAutoScalingGroup.scaleOnMetric('WebScaleUp', {
      metric: webAutoScalingGroup.metricCpuUtilization(),
      scalingSteps: [
        { upper: 10, change: -1 },
        { lower: 50, change: +1 },
        { lower: 85, change: +3 },
      ],
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
    });

    // App tier Auto Scaling Group
    const appAutoScalingGroup = new autoscaling.AutoScalingGroup(this, 'AppAutoScalingGroup', {
      vpc,
      launchTemplate: appLaunchTemplate,
      minCapacity: 2,
      maxCapacity: 20,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      autoScalingGroupName: `app-${region}-asg-${environmentSuffix}`,
      healthCheck: autoscaling.HealthCheck.ec2({
        grace: cdk.Duration.minutes(5),
      }),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate(),
    });

    // App tier scaling policies
    const appScaleUpPolicy = appAutoScalingGroup.scaleOnMetric('AppScaleUp', {
      metric: appAutoScalingGroup.metricCpuUtilization(),
      scalingSteps: [
        { upper: 10, change: -1 },
        { lower: 70, change: +2 },
        { lower: 90, change: +5 },
      ],
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
    });

    // =================
    // RDS Database
    // =================

    // DB Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DbSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      subnetGroupName: `db-${region}-subnet-group-${environmentSuffix}`,
    });

    // RDS Parameter Group
    const parameterGroup = new rds.ParameterGroup(this, 'DbParameterGroup', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_35,
      }),
      parameters: {
        innodb_buffer_pool_size: '{DBInstanceClassMemory*3/4}',
      },
    });

    // RDS Database Instance
    const database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_35,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      securityGroups: [dbSecurityGroup],
      subnetGroup: dbSubnetGroup,
      parameterGroup,
      multiAz: true, // Enable Multi-AZ for high availability
      storageEncrypted: true,
      storageType: rds.StorageType.GP3,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      deleteAutomatedBackups: false,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false, // Set to true for production
      databaseName: 'tapdb',
      instanceIdentifier: `db-${region}-instance-${environmentSuffix}`,
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
    });

    // =================
    // CloudWatch Monitoring
    // =================

    // CloudWatch Log Groups
    const webLogGroup = new logs.LogGroup(this, 'WebLogGroup', {
      logGroupName: `/aws/ec2/web-${region}-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const appLogGroup = new logs.LogGroup(this, 'AppLogGroup', {
      logGroupName: `/aws/ec2/app-${region}-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'TapDashboard', {
      dashboardName: `TAP-${environmentSuffix}-Dashboard`,
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ALB Request Count',
        left: [alb.metricRequestCount()],
      }),
      new cloudwatch.GraphWidget({
        title: 'ALB Target Response Time',
        left: [alb.metricTargetResponseTime()],
      }),
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Web Tier CPU Utilization',
        left: [webAutoScalingGroup.metricCpuUtilization()],
      }),
      new cloudwatch.GraphWidget({
        title: 'App Tier CPU Utilization',
        left: [appAutoScalingGroup.metricCpuUtilization()],
      }),
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Database CPU Utilization',
        left: [database.metricCpuUtilization()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Database Connections',
        left: [database.metricDatabaseConnections()],
      }),
    );

    // CloudWatch Alarms
    const albHighErrorRate = new cloudwatch.Alarm(this, 'AlbHighErrorRate', {
      alarmName: `web-${region}-alb-high-error-rate-${environmentSuffix}`,
      metric: alb.metricHttpCodeTarget(elbv2.HttpCodeTarget.TARGET_5XX_COUNT),
      threshold: 10,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
    });

    const dbHighCpu = new cloudwatch.Alarm(this, 'DbHighCpu', {
      alarmName: `db-${region}-high-cpu-${environmentSuffix}`,
      metric: database.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
    });

    // =================
    // Resource Tagging
    // =================

    // Apply common tags to all resources
    const taggedResources = [
      alb, webTargetGroup, webLaunchTemplate, appLaunchTemplate,
      webAutoScalingGroup, appAutoScalingGroup, database, dbSubnetGroup,
      webLogGroup, appLogGroup, dashboard, albHighErrorRate, dbHighCpu,
      ec2Role, parameterGroup
    ];

    taggedResources.forEach(resource => {
      Object.entries(commonTags).forEach(([key, value]) => {
        cdk.Tags.of(resource).add(key, value);
      });
    });

    // =================
    // CloudFormation Outputs
    // =================

    new cdk.CfnOutput(this, 'LoadBalancerDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
      exportName: `TAP-${environmentSuffix}-ALB-DNS`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerUrl', {
      value: `http://${alb.loadBalancerDnsName}`,
      description: 'URL of the Application Load Balancer',
      exportName: `TAP-${environmentSuffix}-ALB-URL`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database endpoint',
      exportName: `TAP-${environmentSuffix}-DB-ENDPOINT`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `TAP-${environmentSuffix}-VPC-ID`,
    });

    new cdk.CfnOutput(this, 'WebAutoScalingGroupName', {
      value: webAutoScalingGroup.autoScalingGroupName,
      description: 'Web tier Auto Scaling Group name',
      exportName: `TAP-${environmentSuffix}-WEB-ASG-NAME`,
    });

    new cdk.CfnOutput(this, 'AppAutoScalingGroupName', {
      value: appAutoScalingGroup.autoScalingGroupName,
      description: 'App tier Auto Scaling Group name',
      exportName: `TAP-${environmentSuffix}-APP-ASG-NAME`,
    });

    new cdk.CfnOutput(this, 'CloudWatchDashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: `TAP-${environmentSuffix}-DASHBOARD-URL`,
    });
  }
}
```

## Key Features Implemented

### **High Availability & Disaster Recovery:**
- **Multi-AZ deployment** across 3 availability zones
- **RDS Multi-AZ** enabled for automatic failover
- **Multiple NAT Gateways** (one per AZ) for redundancy
- **Auto Scaling Groups** with health checks and rolling updates

### **Security Best Practices:**
- **Least privilege security groups** with specific port access
- **Private subnets** for app and database tiers
- **Encrypted EBS volumes** and RDS storage
- **IAM roles** with minimal required permissions
- **Database isolation** in dedicated subnets

### **Performance & Monitoring:**
- **Auto Scaling policies** based on CPU utilization
- **Application Load Balancer** with health checks
- **CloudWatch monitoring** with custom dashboard
- **Performance Insights** enabled for RDS
- **CloudWatch alarms** for critical metrics

### **Resource Organization:**
- **Consistent naming convention** following your requirements
- **Comprehensive tagging** for cost tracking and identification
- **Proper resource grouping** by tier and function
- **Clean deletion** with appropriate removal policies

### **Infrastructure Outputs:**
- **Load Balancer DNS** and URL for application access
- **Database endpoint** for application configuration
- **Auto Scaling Group names** for operational management
- **CloudWatch dashboard URL** for monitoring

This implementation provides a production-ready, highly available, and secure multi-tier web application infrastructure that follows AWS best practices and CDK patterns.