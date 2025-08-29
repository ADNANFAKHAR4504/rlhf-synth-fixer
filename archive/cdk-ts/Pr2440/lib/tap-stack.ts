import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as elbv2_targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
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

    // CloudFormation Parameters
    const instanceType = new cdk.CfnParameter(this, 'InstanceType', {
      type: 'String',
      default: 't3.medium',
      description: 'EC2 instance type for application servers',
      allowedValues: [
        't3.micro',
        't3.small',
        't3.medium',
        't3.large',
        't3.xlarge',
      ],
    });

    // Common tags for all resources
    const commonTags = {
      Environment: 'Production',
      Project: `tap-${environmentSuffix}`,
      ManagedBy: 'CDK',
    };

    // 1. NETWORKING INFRASTRUCTURE
    // console.log('Creating VPC and networking components...');

    // Create VPC
    const vpc = new ec2.Vpc(this, `TapVPC-${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 1, // Single NAT Gateway for cost optimization
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
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Tag VPC and subnets
    cdk.Tags.of(vpc).add('Name', `tap-vpc-${environmentSuffix}`);
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(vpc).add(key, value);
    });

    // 2. SECURITY CONFIGURATION

    // Security Group for Load Balancer (Web Tier)
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `ALBSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: true,
      }
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Security Group for Application Tier (EC2 instances)
    const appSecurityGroup = new ec2.SecurityGroup(
      this,
      `AppSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for application servers',
        allowAllOutbound: true,
      }
    );

    appSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from Load Balancer'
    );

    appSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow application port from Load Balancer'
    );

    // Allow SSH access (for maintenance)
    appSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(22),
      'Allow SSH from VPC'
    );

    // Security Group for Database Tier
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `DBSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for RDS database',
        allowAllOutbound: false,
      }
    );

    dbSecurityGroup.addIngressRule(
      appSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from application servers'
    );

    // IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, `EC2Role-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with S3 access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // 6. STORAGE (S3 Buckets) - Created early as EC2 role needs reference
    const appDataBucket = new s3.Bucket(
      this,
      `AppDataBucket-${environmentSuffix}`,
      {
        bucketName: `tap-app-data-${environmentSuffix}-${this.account}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        versioned: true,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        lifecycleRules: [
          {
            id: 'DeleteOldVersions',
            enabled: true,
            noncurrentVersionExpiration: cdk.Duration.days(30),
          },
          {
            id: 'TransitionToIA',
            enabled: true,
            transitions: [
              {
                storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                transitionAfter: cdk.Duration.days(30),
              },
            ],
          },
        ],
      }
    );

    const logsBucket = new s3.Bucket(this, `LogsBucket-${environmentSuffix}`, {
      bucketName: `tap-logs-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          enabled: true,
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    // Grant EC2 role access to S3 buckets
    appDataBucket.grantReadWrite(ec2Role);
    logsBucket.grantWrite(ec2Role);

    // 3. COMPUTE RESOURCES

    // Latest Amazon Linux 2 AMI
    const amzn2Ami = ec2.MachineImage.latestAmazonLinux2();

    // User data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>TAP Application Server - ' +
        environmentSuffix +
        '</h1>" > /var/www/html/index.html',
      'echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html',
      // Configure CloudWatch agent
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c default'
    );

    // Create EC2 instances in private subnets
    const ec2Instances: ec2.Instance[] = [];
    const privateSubnets = vpc.privateSubnets;

    for (let i = 0; i < privateSubnets.length; i++) {
      const instance = new ec2.Instance(
        this,
        `AppServer${i + 1}-${environmentSuffix}`,
        {
          instanceType: new ec2.InstanceType(instanceType.valueAsString),
          machineImage: amzn2Ami,
          vpc: vpc,
          vpcSubnets: { subnets: [privateSubnets[i]] },
          securityGroup: appSecurityGroup,
          role: ec2Role,
          userData: userData,
          detailedMonitoring: true,
        }
      );

      // Tag instances
      Object.entries(commonTags).forEach(([key, value]) => {
        cdk.Tags.of(instance).add(key, value);
      });
      cdk.Tags.of(instance).add(
        'Name',
        `tap-app-server-${i + 1}-${environmentSuffix}`
      );

      ec2Instances.push(instance);
    }

    // 4. LOAD BALANCING

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `ALB-${environmentSuffix}`,
      {
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      }
    );

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `TargetGroup-${environmentSuffix}`,
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          interval: cdk.Duration.seconds(30),
          path: '/',
          protocol: elbv2.Protocol.HTTP,
          timeout: cdk.Duration.seconds(5),
          unhealthyThresholdCount: 3,
          healthyThresholdCount: 2,
        },
      }
    );

    // Add EC2 instances to target group
    ec2Instances.forEach(instance => {
      targetGroup.addTarget(new elbv2_targets.InstanceTarget(instance));
    });

    // HTTP Listener (redirect to HTTPS)
    alb.addListener(`HTTPListener-${environmentSuffix}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
    });

    // HTTPS Listener (for production, you'd want to add SSL certificate)
    // For now, adding HTTP listener that forwards to target group
    alb.addListener(`HTTPSListener-${environmentSuffix}`, {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTP, // Change to HTTPS when certificate is available
      defaultAction: elbv2.ListenerAction.forward([targetGroup]),
    });

    // 5. DATABASE

    // Create DB subnet group
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `DBSubnetGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Subnet group for RDS database',
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      }
    );

    // Database credentials in Secrets Manager
    const dbCredentials = new secretsmanager.Secret(
      this,
      `DBCredentials-${environmentSuffix}`,
      {
        description: 'RDS MySQL credentials',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'admin' }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\\'',
          includeSpace: false,
          passwordLength: 16,
        },
      }
    );

    // RDS MySQL Instance
    const database = new rds.DatabaseInstance(
      this,
      `Database-${environmentSuffix}`,
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE3,
          ec2.InstanceSize.MICRO
        ),
        vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [dbSecurityGroup],
        credentials: rds.Credentials.fromSecret(dbCredentials),
        multiAz: true,
        storageEncrypted: true,
        backupRetention: cdk.Duration.days(7),
        deletionProtection: true,
        databaseName: 'tapdb',
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        deleteAutomatedBackups: false,
        monitoringInterval: cdk.Duration.seconds(60),
      }
    );

    // 8. MONITORING AND ALARMS

    // CloudWatch Alarms for EC2 instances
    ec2Instances.forEach((instance, index) => {
      new cloudwatch.Alarm(
        this,
        `HighCPUAlarm-${index + 1}-${environmentSuffix}`,
        {
          metric: new cloudwatch.Metric({
            namespace: 'AWS/EC2',
            metricName: 'CPUUtilization',
            dimensionsMap: {
              InstanceId: instance.instanceId,
            },
          }),
          threshold: 80,
          evaluationPeriods: 2,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
          alarmDescription: `High CPU utilization alarm for instance ${index + 1}`,
        }
      );
    });

    // Database connection count alarm
    new cloudwatch.Alarm(this, `DBConnectionCountAlarm-${environmentSuffix}`, {
      metric: database.metricDatabaseConnections(),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'High database connection count',
    });

    // Load balancer unhealthy targets alarm
    new cloudwatch.Alarm(this, `UnhealthyTargetsAlarm-${environmentSuffix}`, {
      metric: targetGroup.metrics.unhealthyHostCount(),
      threshold: 1,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Unhealthy targets in load balancer',
    });

    // Apply common tags to all resources
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // CLOUDFORMATION OUTPUTS

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `tap-vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
      exportName: `tap-alb-dns-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerURL', {
      value: `http://${alb.loadBalancerDnsName}`,
      description: 'Application Load Balancer URL',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
      exportName: `tap-db-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: database.instanceEndpoint.port.toString(),
      description: 'RDS database port',
    });

    new cdk.CfnOutput(this, 'AppDataBucketName', {
      value: appDataBucket.bucketName,
      description: 'Application data S3 bucket name',
      exportName: `tap-app-data-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: logsBucket.bucketName,
      description: 'Logs S3 bucket name',
      exportName: `tap-logs-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseCredentialsSecret', {
      value: dbCredentials.secretArn,
      description: 'ARN of the secret containing database credentials',
      exportName: `tap-db-credentials-secret-${environmentSuffix}`,
    });

    // Output EC2 instance IDs
    ec2Instances.forEach((instance, index) => {
      new cdk.CfnOutput(this, `EC2Instance${index + 1}Id`, {
        value: instance.instanceId,
        description: `EC2 Instance ${index + 1} ID`,
      });
    });
  }
}
