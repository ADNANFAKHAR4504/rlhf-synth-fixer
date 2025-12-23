import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const envSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Common tags for all resources
    const commonTags = {
      Environment: envSuffix,
      Project: 'WebApplication',
      Owner: 'Infrastructure-Team',
      CostCenter: 'Engineering',
    };

    // VPC with public subnets (NAT Gateway not supported in LocalStack Community)
    this.vpc = new ec2.Vpc(this, 'WebAppVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
      natGateways: 0, // NAT Gateway not supported in LocalStack Community
    });

    // Apply tags to VPC
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this.vpc).add(key, value);
    });

    // VPC Flow Logs
    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: this.vpc,
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

    const webServerSecurityGroup = new ec2.SecurityGroup(
      this,
      'WebServerSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for web servers',
        allowAllOutbound: true,
      }
    );

    webServerSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    const databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for RDS database',
      }
    );

    databaseSecurityGroup.addIngressRule(
      webServerSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL traffic from web servers'
    );

    // Apply tags to security groups
    [albSecurityGroup, webServerSecurityGroup, databaseSecurityGroup].forEach(
      sg => {
        Object.entries(commonTags).forEach(([key, value]) => {
          cdk.Tags.of(sg).add(key, value);
        });
      }
    );

    // User Data for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Web Application Server</h1>" > /var/www/html/index.html',
      'yum install -y amazon-cloudwatch-agent',
      'systemctl start amazon-cloudwatch-agent',
      'systemctl enable amazon-cloudwatch-agent'
    );

    // IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, 'EC2Role', {
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

    // Auto Scaling Group using LaunchConfiguration for LocalStack compatibility
    const imageId =
      ec2.MachineImage.latestAmazonLinux2023().getImage(this).imageId;

    const launchConfig = new autoscaling.CfnLaunchConfiguration(
      this,
      'WebServerLaunchConfig',
      {
        imageId,
        instanceType: 't3.medium',
        securityGroups: [webServerSecurityGroup.securityGroupId],
        userData: cdk.Fn.base64(userData.render()),
        iamInstanceProfile: new iam.CfnInstanceProfile(
          this,
          'WebServerInstanceProfile',
          {
            roles: [ec2Role.roleName],
          }
        ).ref,
      }
    );

    // Create ASG using LaunchConfiguration (not LaunchTemplate)
    const cfnAsg = new autoscaling.CfnAutoScalingGroup(
      this,
      'WebServerCfnASG',
      {
        minSize: '2',
        maxSize: '6',
        desiredCapacity: '2',
        launchConfigurationName: launchConfig.ref,
        vpcZoneIdentifier: this.vpc.selectSubnets({
          subnetType: ec2.SubnetType.PUBLIC,
        }).subnetIds,
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 60,
        tags: [
          {
            key: 'Name',
            value: 'WebServerASG',
            propagateAtLaunch: true,
          },
        ],
      }
    );

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'WebAppALB', {
      vpc: this.vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Target Group (without targets initially)
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'WebAppTargetGroup',
      {
        vpc: this.vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          path: '/',
          protocol: elbv2.Protocol.HTTP,
        },
      }
    );

    // Connect ASG to target group
    cfnAsg.targetGroupArns = [targetGroup.targetGroupArn];

    // Create a wrapper for compatibility with the rest of the code
    this.autoScalingGroup =
      autoscaling.AutoScalingGroup.fromAutoScalingGroupName(
        this,
        'WebServerASG',
        cfnAsg.ref
      ) as autoscaling.AutoScalingGroup;

    // ALB Listener
    this.loadBalancer.addListener('WebAppListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Database credentials in Secrets Manager
    const dbCredentials = new secretsmanager.Secret(
      this,
      'DatabaseCredentials',
      {
        description: 'RDS MySQL database credentials',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'admin' }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\',
        },
      }
    );

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc: this.vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // RDS MySQL Database using CfnDBInstance for LocalStack compatibility
    const cfnDatabase = new rds.CfnDBInstance(this, 'WebAppDatabase', {
      dbInstanceClass: 'db.t3.micro',
      allocatedStorage: '20',
      engine: 'mysql',
      engineVersion: '8.0',
      masterUsername: dbCredentials
        .secretValueFromJson('username')
        .unsafeUnwrap(),
      masterUserPassword: dbCredentials
        .secretValueFromJson('password')
        .unsafeUnwrap(),
      dbSubnetGroupName: dbSubnetGroup.subnetGroupName,
      vpcSecurityGroups: [databaseSecurityGroup.securityGroupId],
      multiAz: false,
      storageEncrypted: false,
      backupRetentionPeriod: 0,
      deletionProtection: false,
      publiclyAccessible: false,
    });

    cfnDatabase.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Create DatabaseInstance wrapper for compatibility
    this.database = rds.DatabaseInstance.fromDatabaseInstanceAttributes(
      this,
      'WebAppDatabaseRef',
      {
        instanceIdentifier: cfnDatabase.ref,
        instanceEndpointAddress: cfnDatabase.attrEndpointAddress,
        port: 3306,
        securityGroups: [databaseSecurityGroup],
      }
    ) as rds.DatabaseInstance;

    // S3 Bucket for application assets and metadata
    const appBucket = new s3.Bucket(this, 'WebAppBucket', {
      bucketName: `webapp-assets-${envSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For LocalStack cleanup
      autoDeleteObjects: true, // For LocalStack cleanup
    });

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'HighCPUAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/AutoScaling',
        metricName: 'GroupTotalInstances',
        dimensionsMap: {
          AutoScalingGroupName: this.autoScalingGroup.autoScalingGroupName,
        },
        statistic: 'Average',
      }),
      threshold: 4,
      evaluationPeriods: 2,
      alarmDescription: 'High instance count in Auto Scaling Group',
    });

    new cloudwatch.Alarm(this, 'DatabaseConnectionsAlarm', {
      metric: this.database.metricDatabaseConnections(),
      threshold: 80,
      evaluationPeriods: 2,
      alarmDescription: 'High database connections',
    });

    // Apply tags to all resources in the stack
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: this.vpc.vpcId,
      description: 'ID of the VPC',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: appBucket.bucketName,
      description: 'Name of the S3 bucket for application assets',
    });
  }
}
