import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

interface WebAppStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class WebAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: WebAppStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC with specified CIDR
    const vpc = new ec2.Vpc(this, `WebAppVpc-${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Create Internet Gateway
    const igw = new ec2.CfnInternetGateway(this, 'InternetGateway');
    new ec2.CfnVPCGatewayAttachment(this, 'IGWAttachment', {
      vpcId: vpc.vpcId,
      internetGatewayId: igw.ref,
    });

    // Create Public Subnet 1
    const publicSubnet1 = new ec2.PublicSubnet(this, 'PublicSubnet1', {
      vpcId: vpc.vpcId,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: cdk.Stack.of(this).availabilityZones[0],
      mapPublicIpOnLaunch: true,
    });

    // Create Public Subnet 2
    const publicSubnet2 = new ec2.PublicSubnet(this, 'PublicSubnet2', {
      vpcId: vpc.vpcId,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: cdk.Stack.of(this).availabilityZones[1],
      mapPublicIpOnLaunch: true,
    });

    // Create Private Subnet
    const privateSubnet = new ec2.PrivateSubnet(this, 'PrivateSubnet', {
      vpcId: vpc.vpcId,
      cidrBlock: '10.0.3.0/24',
      availabilityZone: cdk.Stack.of(this).availabilityZones[0],
    });

    // Add routes to public subnets
    publicSubnet1.addRoute('PublicRoute1', {
      routerId: igw.ref,
      routerType: ec2.RouterType.GATEWAY,
      destinationCidrBlock: '0.0.0.0/0',
    });

    publicSubnet2.addRoute('PublicRoute2', {
      routerId: igw.ref,
      routerType: ec2.RouterType.GATEWAY,
      destinationCidrBlock: '0.0.0.0/0',
    });

    // Create EC2 Instance Connect Endpoint for secure access
    const eiceSecurityGroup = new ec2.SecurityGroup(this, 'EICESecurityGroup', {
      vpc,
      description: 'Security group for EC2 Instance Connect Endpoint',
      allowAllOutbound: true,
    });

    const instanceConnectEndpoint = new ec2.CfnInstanceConnectEndpoint(
      this,
      'EC2InstanceConnectEndpoint',
      {
        subnetId: privateSubnet.subnetId,
        securityGroupIds: [eiceSecurityGroup.securityGroupId],
      }
    );

    // Create security group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    // Allow EC2 Instance Connect Endpoint to access EC2 instances
    ec2SecurityGroup.addIngressRule(
      eiceSecurityGroup,
      ec2.Port.tcp(22),
      'Allow SSH from EC2 Instance Connect Endpoint'
    );

    // Create IAM role for EC2 instances with least privilege
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Minimal IAM role for EC2 instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Add minimal inline policy for EC2 instance
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ec2:DescribeInstances', 'ec2:DescribeTags'],
        resources: ['*'],
      })
    );

    // Create UserData for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum install -y amazon-cloudwatch-agent',
      'systemctl start amazon-cloudwatch-agent',
      'systemctl enable amazon-cloudwatch-agent'
    );

    // Create EC2 instance in private subnet
    const instance = new ec2.Instance(this, 'WebAppInstance', {
      vpc,
      vpcSubnets: { subnets: [privateSubnet] },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      role: ec2Role,
      securityGroup: ec2SecurityGroup,
      userData: userData,
      detailedMonitoring: true,
      requireImdsv2: true,
    });

    // Create security group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Security group for RDS instance',
      allowAllOutbound: false,
    });

    // Allow inbound traffic from EC2 security group to RDS
    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow database connections from EC2 instances'
    );

    // Create subnet group for RDS
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      description: 'Subnet group for RDS instance',
      vpc,
      vpcSubnets: {
        subnets: [privateSubnet, publicSubnet2],
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create RDS instance with Multi-AZ and Blue/Green deployment compatibility
    const database = new rds.DatabaseInstance(this, 'WebAppDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      multiAz: true,
      allocatedStorage: 20,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      databaseName: `webappdb${environmentSuffix}`,
      credentials: rds.Credentials.fromGeneratedSecret('admin'),
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      enablePerformanceInsights: false,
      monitoringInterval: cdk.Duration.seconds(60),
      monitoringRole: new iam.Role(this, 'RDSMonitoringRole', {
        assumedBy: new iam.ServicePrincipal('monitoring.rds.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonRDSEnhancedMonitoringRole'
          ),
        ],
      }),
      autoMinorVersionUpgrade: false,
      copyTagsToSnapshot: true,
    });

    // Create CloudWatch Dashboard for monitoring
    const dashboard = new cloudwatch.Dashboard(this, 'WebAppDashboard', {
      dashboardName: `SecureWebAppFoundation-${environmentSuffix}`,
    });

    // Add EC2 CPU utilization widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'EC2 CPU Utilization',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/EC2',
            metricName: 'CPUUtilization',
            dimensionsMap: {
              InstanceId: instance.instanceId,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
      })
    );

    // Add RDS CPU utilization widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'RDS CPU Utilization',
        left: [database.metricCPUUtilization()],
        width: 12,
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `VPCId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: instance.instanceId,
      description: 'EC2 Instance ID',
      exportName: `EC2InstanceId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'InstanceConnectEndpointId', {
      value: instanceConnectEndpoint.ref,
      description: 'EC2 Instance Connect Endpoint ID',
      exportName: `InstanceConnectEndpointId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'RDSEndpoint', {
      value: database.dbInstanceEndpointAddress,
      description: 'RDS Instance Endpoint',
      exportName: `RDSEndpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: database.secret!.secretArn,
      description: 'ARN of the secret containing database credentials',
      exportName: `DatabaseSecretArn-${environmentSuffix}`,
    });
  }
}
