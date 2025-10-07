import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

// ? Import your stacks here
// import { MyStack } from './my-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Region guard - enforce eu-central-1 deployment
    if (this.region && this.region !== 'eu-central-1') {
      throw new Error(
        `Stack must be deployed in eu-central-1. Current region: ${this.region}`
      );
    }

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // VPC with public and private subnets across 2 AZs
    const vpc = new ec2.Vpc(this, `ProductionVpc${environmentSuffix}`, {
      maxAzs: 2,
      natGateways: 2, // One per AZ for high availability
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
    cdk.Tags.of(vpc).add('Environment', 'Production');

    // S3 bucket for ALB access logs with proper encryption
    const albLogsBucket = new s3.Bucket(
      this,
      `AlbAccessLogsBucket${environmentSuffix}`,
      {
        bucketName: `tap-${environmentSuffix.toLowerCase()}-alb-logs-${this.account}-${this.region}`,
        encryption: s3.BucketEncryption.S3_MANAGED, // AES-256 SSE-S3
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        lifecycleRules: [
          {
            id: 'DeleteOldLogs',
            expiration: cdk.Duration.days(90),
          },
        ],
      }
    );
    cdk.Tags.of(albLogsBucket).add('Environment', 'Production');

    // S3 bucket for application data with SSE-S3 encryption
    const appDataBucket = new s3.Bucket(
      this,
      `AppDataBucket${environmentSuffix}`,
      {
        bucketName: `tap-${environmentSuffix.toLowerCase()}-app-data-${this.account}-${this.region}`,
        encryption: s3.BucketEncryption.S3_MANAGED, // AES-256 SSE-S3
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );
    cdk.Tags.of(appDataBucket).add('Environment', 'Production');

    // Security Group for ALB (internet-facing)
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `AlbSecurityGroup${environmentSuffix}`,
      {
        securityGroupName: `tap-${environmentSuffix.toLowerCase()}-alb-sg`,
        vpc,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: false,
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
    cdk.Tags.of(albSecurityGroup).add('Environment', 'Production');

    // Security Group for EC2 instances (private)
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `Ec2SecurityGroup${environmentSuffix}`,
      {
        securityGroupName: `tap-${environmentSuffix.toLowerCase()}-ec2-sg`,
        vpc,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true, // Allow outbound for package updates, etc.
      }
    );
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(22),
      'Allow SSH from VPC'
    );
    cdk.Tags.of(ec2SecurityGroup).add('Environment', 'Production');

    // Security Group for RDS (public as required)
    const rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `RdsSecurityGroup${environmentSuffix}`,
      {
        securityGroupName: `tap-${environmentSuffix.toLowerCase()}-rds-sg`,
        vpc,
        description: 'Security group for RDS instance',
        allowAllOutbound: false,
      }
    );
    // WARNING: This allows public access to RDS as required, but is a security risk
    rdsSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(3306),
      'Allow MySQL access from anywhere (as required - security risk)'
    );
    cdk.Tags.of(rdsSecurityGroup).add('Environment', 'Production');

    // IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, `Ec2Role${environmentSuffix}`, {
      roleName: `tap-${environmentSuffix.toLowerCase()}-ec2-role`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Grant S3 access to EC2 role
    appDataBucket.grantReadWrite(ec2Role);
    cdk.Tags.of(ec2Role).add('Environment', 'Production');

    // IAM Role for Lambda functions
    const lambdaRole = new iam.Role(this, `LambdaRole${environmentSuffix}`, {
      roleName: `tap-${environmentSuffix.toLowerCase()}-lambda-role`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Grant S3 access to Lambda role
    appDataBucket.grantReadWrite(lambdaRole);
    cdk.Tags.of(lambdaRole).add('Environment', 'Production');

    // Instance Profile for EC2 (unused but could be needed for additional configurations)
    // const instanceProfile = new iam.InstanceProfile(
    //   this,
    //   `Ec2InstanceProfile${environmentSuffix}`,
    //   {
    //     instanceProfileName: `tap-${environmentSuffix.toLowerCase()}-ec2-profile`,
    //     role: ec2Role,
    //   }
    // );

    // Latest Amazon Linux 2 AMI
    const amzn2Ami = ec2.MachineImage.latestAmazonLinux2();

    // User data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Production Server $(hostname)</h1>" > /var/www/html/index.html'
    );

    // EC2 Instance 1 in first AZ
    const ec2Instance1 = new ec2.Instance(
      this,
      `Ec2Instance1${environmentSuffix}`,
      {
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          availabilityZones: [vpc.availabilityZones[0]],
        },
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: amzn2Ami,
        securityGroup: ec2SecurityGroup,
        role: ec2Role,
        userData,
        detailedMonitoring: true, // Enable detailed CloudWatch monitoring
      }
    );
    cdk.Tags.of(ec2Instance1).add('Environment', 'Production');
    cdk.Tags.of(ec2Instance1).add(
      'Name',
      `tap-${environmentSuffix.toLowerCase()}-instance-1`
    );

    // EC2 Instance 2 in second AZ
    const ec2Instance2 = new ec2.Instance(
      this,
      `Ec2Instance2${environmentSuffix}`,
      {
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          availabilityZones: [vpc.availabilityZones[1]],
        },
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: amzn2Ami,
        securityGroup: ec2SecurityGroup,
        role: ec2Role,
        userData,
        detailedMonitoring: true, // Enable detailed CloudWatch monitoring
      }
    );
    cdk.Tags.of(ec2Instance2).add('Environment', 'Production');
    cdk.Tags.of(ec2Instance2).add(
      'Name',
      `tap-${environmentSuffix.toLowerCase()}-instance-2`
    );

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `ApplicationLoadBalancer${environmentSuffix}`,
      {
        loadBalancerName: `tap-${environmentSuffix.toLowerCase()}-alb`,
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );
    cdk.Tags.of(alb).add('Environment', 'Production');

    // Enable ALB access logging
    alb.logAccessLogs(albLogsBucket, 'alb-access-logs');

    // Target Group for EC2 instances
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `Ec2TargetGroup${environmentSuffix}`,
      {
        targetGroupName: `tap-${environmentSuffix.toLowerCase()}-tg`,
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
          unhealthyThresholdCount: 2,
          healthyThresholdCount: 5,
        },
      }
    );

    // Add EC2 instances to target group
    targetGroup.addTarget(new targets.InstanceTarget(ec2Instance1, 80));
    targetGroup.addTarget(new targets.InstanceTarget(ec2Instance2, 80));
    cdk.Tags.of(targetGroup).add('Environment', 'Production');

    // ALB Listener
    alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // RDS Subnet Group (using public subnets for public accessibility)
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `DbSubnetGroup${environmentSuffix}`,
      {
        subnetGroupName: `tap-${environmentSuffix.toLowerCase()}-db-subnet-group`,
        vpc,
        description: 'Subnet group for RDS instance',
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC, // Required for publicly accessible RDS
        },
      }
    );
    cdk.Tags.of(dbSubnetGroup).add('Environment', 'Production');

    // RDS Instance (publicly accessible as required)
    const rdsInstance = new rds.DatabaseInstance(
      this,
      `RdsInstance${environmentSuffix}`,
      {
        instanceIdentifier: `tap-${environmentSuffix.toLowerCase()}-db`,
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE3,
          ec2.InstanceSize.MICRO
        ),
        vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [rdsSecurityGroup],
        publiclyAccessible: true, // As required - security risk
        multiAz: false, // Single AZ for cost optimization with t3.micro
        allocatedStorage: 20,
        storageEncrypted: true,
        deletionProtection: false,
        backupRetention: cdk.Duration.days(7),
        deleteAutomatedBackups: false,
        databaseName: 'productiondb',
        credentials: rds.Credentials.fromGeneratedSecret('admin', {
          secretName: `tap-${environmentSuffix.toLowerCase()}-db-credentials`,
        }),
      }
    );
    cdk.Tags.of(rdsInstance).add('Environment', 'Production');

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'RdsEndpoint', {
      value: rdsInstance.instanceEndpoint.hostname,
      description: 'RDS Instance Endpoint',
    });

    new cdk.CfnOutput(this, 'AppDataBucketName', {
      value: appDataBucket.bucketName,
      description: 'S3 Bucket for Application Data',
    });

    new cdk.CfnOutput(this, 'Ec2Instance1Id', {
      value: ec2Instance1.instanceId,
      description: 'EC2 Instance 1 ID',
    });

    new cdk.CfnOutput(this, 'Ec2Instance2Id', {
      value: ec2Instance2.instanceId,
      description: 'EC2 Instance 2 ID',
    });

    new cdk.CfnOutput(this, 'Ec2RoleArn', {
      value: ec2Role.roleArn,
      description: 'EC2 IAM Role ARN',
    });

    new cdk.CfnOutput(this, 'LambdaRoleArn', {
      value: lambdaRole.roleArn,
      description: 'Lambda IAM Role ARN',
    });
  }
}
