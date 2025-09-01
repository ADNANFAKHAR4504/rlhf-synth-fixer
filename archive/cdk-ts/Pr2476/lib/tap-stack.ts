import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  readonly domainName?: string;
  readonly notificationEmail?: string;
  readonly environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  private readonly commonTags: { [key: string]: string } = {
    Environment: 'production',
    Project: 'web-app',
  };

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Set notification email - hardcoded for this implementation
    const notificationEmail = 'admin@example.com';

    // Create VPC with proper CIDR and subnets
    const vpc = this.createVpcInfrastructure();

    // Create Security Groups
    const securityGroups = this.createSecurityGroups(vpc);

    // Create S3 bucket for logs first (needed for IAM policies)
    const logsBucket = this.createS3Infrastructure();

    // Create IAM roles
    const roles = this.createIamRoles(logsBucket);

    // Create CloudFront distribution
    const distribution = this.createCloudFrontDistribution(logsBucket);

    // Create RDS instance
    const database = this.createRdsInstance(vpc, securityGroups.databaseSg);

    // Create EC2 instances
    const instances = this.createEc2Instances(
      vpc,
      securityGroups,
      roles.ec2Role
    );

    // Create Application Load Balancer
    const alb = this.createApplicationLoadBalancer(
      vpc,
      securityGroups.albSg,
      instances
    );

    // Create monitoring and cost alarms
    this.createMonitoringAndAlarms(instances, notificationEmail);

    // Output important information
    this.createOutputs(vpc, alb, database, distribution, logsBucket);
  }

  private createVpcInfrastructure(): ec2.Vpc {
    const vpc = new ec2.Vpc(this, 'WebAppVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
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
      natGateways: 1, // Single NAT Gateway for cost optimization while maintaining functionality
    });

    cdk.Tags.of(vpc).add('Name', 'WebApp-VPC');
    Object.entries(this.commonTags).forEach(([key, value]) => {
      cdk.Tags.of(vpc).add(key, value);
    });

    return vpc;
  }

  private createSecurityGroups(vpc: ec2.Vpc) {
    // Bastion Host Security Group
    const bastionSg = new ec2.SecurityGroup(this, 'BastionSecurityGroup', {
      vpc,
      description: 'Security group for bastion host',
      allowAllOutbound: true,
    });

    bastionSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access from anywhere'
    );

    cdk.Tags.of(bastionSg).add('Name', 'WebApp-Bastion-SG');

    // Application Security Group
    const appSg = new ec2.SecurityGroup(this, 'ApplicationSecurityGroup', {
      vpc,
      description: 'Security group for application servers',
      allowAllOutbound: true,
    });

    appSg.addIngressRule(
      bastionSg,
      ec2.Port.tcp(22),
      'Allow SSH from bastion host'
    );

    cdk.Tags.of(appSg).add('Name', 'WebApp-Application-SG');

    // ALB Security Group
    const albSg = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    cdk.Tags.of(albSg).add('Name', 'WebApp-ALB-SG');

    // Allow ALB to communicate with application instances
    appSg.addIngressRule(albSg, ec2.Port.tcp(80), 'Allow HTTP from ALB');

    // Database Security Group
    const databaseSg = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    databaseSg.addIngressRule(
      appSg,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from application servers'
    );

    cdk.Tags.of(databaseSg).add('Name', 'WebApp-Database-SG');

    // Apply common tags to all security groups
    [bastionSg, appSg, albSg, databaseSg].forEach(sg => {
      Object.entries(this.commonTags).forEach(([key, value]) => {
        cdk.Tags.of(sg).add(key, value);
      });
    });

    return { bastionSg, appSg, albSg, databaseSg };
  }

  private createIamRoles(logsBucket: s3.Bucket) {
    // EC2 Role for application instances
    const ec2Role = new iam.Role(this, 'EC2ApplicationRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 application instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Create custom policy for S3 logs access
    const s3LogsPolicy = new iam.Policy(this, 'S3LogsPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['s3:PutObject', 's3:PutObjectAcl'],
          resources: [logsBucket.bucketArn + '/*'],
        }),
      ],
    });

    ec2Role.attachInlinePolicy(s3LogsPolicy);

    cdk.Tags.of(ec2Role).add('Name', 'WebApp-EC2-Role');
    Object.entries(this.commonTags).forEach(([key, value]) => {
      cdk.Tags.of(ec2Role).add(key, value);
    });

    return { ec2Role, s3LogsPolicy };
  }

  private createS3Infrastructure(): s3.Bucket {
    const logsBucket = new s3.Bucket(this, 'ApplicationLogsBucket', {
      bucketName: `webapp-logs-${this.account}-${this.region}-${Date.now()}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
      lifecycleRules: [
        {
          id: 'delete-old-logs',
          enabled: true,
          expiration: cdk.Duration.days(90),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    cdk.Tags.of(logsBucket).add('Name', 'WebApp-Logs-Bucket');
    Object.entries(this.commonTags).forEach(([key, value]) => {
      cdk.Tags.of(logsBucket).add(key, value);
    });

    return logsBucket;
  }

  private createCloudFrontDistribution(
    logsBucket: s3.Bucket
  ): cloudfront.Distribution {
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'OAI',
      {
        comment: 'OAI for WebApp CloudFront distribution',
      }
    );

    logsBucket.grantRead(originAccessIdentity);

    const distribution = new cloudfront.Distribution(
      this,
      'WebAppDistribution',
      {
        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessIdentity(logsBucket, {
            originAccessIdentity,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        enableLogging: true,
        logBucket: logsBucket,
        logFilePrefix: 'cloudfront-logs/',
        comment: 'CloudFront distribution for WebApp',
      }
    );

    cdk.Tags.of(distribution).add('Name', 'WebApp-CloudFront');
    Object.entries(this.commonTags).forEach(([key, value]) => {
      cdk.Tags.of(distribution).add(key, value);
    });

    return distribution;
  }

  private createRdsInstance(
    vpc: ec2.Vpc,
    securityGroup: ec2.SecurityGroup
  ): rds.DatabaseInstance {
    const database = new rds.DatabaseInstance(this, 'WebAppDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [securityGroup],
      allocatedStorage: 20,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      multiAz: true,
      autoMinorVersionUpgrade: true,
      deleteAutomatedBackups: false,
      backupRetention: cdk.Duration.days(7),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      databaseName: 'webappdb',
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
      monitoringInterval: cdk.Duration.seconds(60),
      monitoringRole: new iam.Role(this, 'DatabaseMonitoringRole', {
        assumedBy: new iam.ServicePrincipal('monitoring.rds.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonRDSEnhancedMonitoringRole'
          ),
        ],
      }),
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });

    cdk.Tags.of(database).add('Name', 'WebApp-Database');
    Object.entries(this.commonTags).forEach(([key, value]) => {
      cdk.Tags.of(database).add(key, value);
    });

    return database;
  }

  private createEc2Instances(
    vpc: ec2.Vpc,
    securityGroups: ReturnType<typeof this.createSecurityGroups>,
    role: iam.Role
  ): ec2.Instance[] {
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>WebApp Server $(hostname -f)</h1>" > /var/www/html/index.html',
      'yum install -y amazon-cloudwatch-agent',
      'amazon-cloudwatch-agent-ctl -a start'
    );

    // Get the latest Amazon Linux 2 AMI
    const ami = ec2.MachineImage.latestAmazonLinux2({
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    // Create Bastion Host
    const bastionHost = new ec2.Instance(this, 'BastionHost', {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ami,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: securityGroups.bastionSg,
      keyName: process.env.KEY_PAIR_NAME,
    });

    cdk.Tags.of(bastionHost).add('Name', 'WebApp-Bastion');
    Object.entries(this.commonTags).forEach(([key, value]) => {
      cdk.Tags.of(bastionHost).add(key, value);
    });

    // Create Application Instances
    const instances: ec2.Instance[] = [];
    for (let i = 0; i < 2; i++) {
      const instance = new ec2.Instance(this, `ApplicationInstance${i + 1}`, {
        vpc,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ami,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroup: securityGroups.appSg,
        role,
        userData,
        keyName: process.env.KEY_PAIR_NAME,
        detailedMonitoring: true,
      });

      cdk.Tags.of(instance).add('Name', `WebApp-Instance-${i + 1}`);
      Object.entries(this.commonTags).forEach(([key, value]) => {
        cdk.Tags.of(instance).add(key, value);
      });

      instances.push(instance);
    }

    return instances;
  }

  private createApplicationLoadBalancer(
    vpc: ec2.Vpc,
    securityGroup: ec2.SecurityGroup,
    instances: ec2.Instance[]
  ): elbv2.ApplicationLoadBalancer {
    const alb = new elbv2.ApplicationLoadBalancer(this, 'WebAppALB', {
      vpc,
      internetFacing: true,
      securityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Create target group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'WebAppTargetGroup',
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        healthCheck: {
          enabled: true,
          path: '/',
          healthyHttpCodes: '200',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
        targets: instances.map(
          instance => new targets.InstanceTarget(instance, 80)
        ),
      }
    );

    // Add HTTP listener
    alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    cdk.Tags.of(alb).add('Name', 'WebApp-ALB');
    Object.entries(this.commonTags).forEach(([key, value]) => {
      cdk.Tags.of(alb).add(key, value);
    });

    return alb;
  }

  private createMonitoringAndAlarms(
    instances: ec2.Instance[],
    notificationEmail: string
  ): void {
    // Create SNS topic for notifications
    const alarmTopic = new sns.Topic(this, 'WebAppAlarmTopic', {
      displayName: 'WebApp Cost and Monitoring Alarms',
    });

    alarmTopic.addSubscription(
      new subscriptions.EmailSubscription(notificationEmail)
    );

    // Create cost alarm
    const costAlarm = new cloudwatch.Alarm(this, 'MonthlyCostAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Billing',
        metricName: 'EstimatedCharges',
        dimensionsMap: {
          Currency: 'USD',
        },
        statistic: 'Maximum',
        period: cdk.Duration.hours(6),
      }),
      threshold: 500,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'Alarm when estimated monthly charges exceed $500',
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    });

    costAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Create CPU alarms for instances
    instances.forEach((instance, index) => {
      const cpuAlarm = new cloudwatch.Alarm(
        this,
        `InstanceCpuAlarm${index + 1}`,
        {
          metric: new cloudwatch.Metric({
            namespace: 'AWS/EC2',
            metricName: 'CPUUtilization',
            dimensionsMap: {
              InstanceId: instance.instanceId,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
          threshold: 80,
          evaluationPeriods: 2,
          comparisonOperator:
            cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
          alarmDescription: `Alarm when CPU exceeds 80% for instance ${index + 1}`,
        }
      );

      cpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));
    });

    cdk.Tags.of(alarmTopic).add('Name', 'WebApp-Alarms');
    Object.entries(this.commonTags).forEach(([key, value]) => {
      cdk.Tags.of(alarmTopic).add(key, value);
    });
  }

  private createOutputs(
    vpc: ec2.Vpc,
    alb: elbv2.ApplicationLoadBalancer,
    database: rds.DatabaseInstance,
    distribution: cloudfront.Distribution,
    logsBucket: s3.Bucket
  ): void {
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'ALBDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.dbInstanceEndpointAddress,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: logsBucket.bucketName,
      description: 'S3 Logs Bucket Name',
    });
  }
}
