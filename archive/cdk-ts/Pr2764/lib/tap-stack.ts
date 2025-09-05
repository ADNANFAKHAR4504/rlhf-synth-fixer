import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as elbv2_targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import { Construct } from 'constructs';

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

    // Common tags for all resources
    const commonTags = {
      Environment: 'Production',
      Project: 'TapApplication',
      ManagedBy: 'CDK',
      EnvironmentSuffix: environmentSuffix,
    };

    // ========== NETWORKING LAYER ==========

    // Create VPC with custom CIDR block
    const vpc = new ec2.Vpc(this, 'TapVPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
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

    // Apply tags to VPC
    cdk.Tags.of(vpc).add('Name', 'TapVPC');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(vpc).add(key, value);
    });

    // ========== SECURITY GROUPS ==========

    // Security Group for EC2 web instances
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc,
      description: 'Security group for web servers - allows HTTP traffic',
      allowAllOutbound: true,
    });

    // Allow HTTP traffic from anywhere
    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    // Allow SSH traffic (restrict to your IP range in production)
    webSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('0.0.0.0/0'), // Consider restricting this in production
      ec2.Port.tcp(22),
      'Allow SSH traffic for management'
    );

    // Apply tags to web security group
    cdk.Tags.of(webSecurityGroup).add('Name', 'WebSecurityGroup');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(webSecurityGroup).add(key, value);
    });

    // Security Group for RDS database
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc,
      description: 'Security group for RDS MySQL database',
      allowAllOutbound: false,
    });

    // Allow MySQL traffic only from web security group
    dbSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL traffic from web servers only'
    );

    // Apply tags to DB security group
    cdk.Tags.of(dbSecurityGroup).add('Name', 'DbSecurityGroup');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(dbSecurityGroup).add(key, value);
    });

    // Security Group for Application Load Balancer
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    // Allow HTTP traffic from anywhere to ALB
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic to ALB from anywhere'
    );

    // Apply tags to ALB security group
    cdk.Tags.of(albSecurityGroup).add('Name', 'AlbSecurityGroup');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(albSecurityGroup).add(key, value);
    });

    // Allow traffic from ALB to web instances
    webSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    // ========== NETWORK ACL ==========

    // Create Network ACL for additional security layer
    const webNetworkAcl = new ec2.NetworkAcl(this, 'WebNetworkAcl', {
      vpc,
    });

    // Inbound rules
    webNetworkAcl.addEntry('AllowHttpInbound', {
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(80),
      networkAclEntryName: 'AllowHttpInbound',
      ruleAction: ec2.Action.ALLOW,
      cidr: ec2.AclCidr.anyIpv4(),
    });

    webNetworkAcl.addEntry('AllowSshInbound', {
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(22),
      networkAclEntryName: 'AllowSshInbound',
      ruleAction: ec2.Action.ALLOW,
      cidr: ec2.AclCidr.anyIpv4(),
    });

    webNetworkAcl.addEntry('AllowEphemeralInbound', {
      ruleNumber: 120,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      networkAclEntryName: 'AllowEphemeralInbound',
      ruleAction: ec2.Action.ALLOW,
      cidr: ec2.AclCidr.anyIpv4(),
    });

    // Outbound rules
    webNetworkAcl.addEntry('AllowHttpOutbound', {
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(80),
      networkAclEntryName: 'AllowHttpOutbound',
      ruleAction: ec2.Action.ALLOW,
      cidr: ec2.AclCidr.anyIpv4(),
      direction: ec2.TrafficDirection.EGRESS,
    });

    webNetworkAcl.addEntry('AllowHttpsOutbound', {
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(443),
      networkAclEntryName: 'AllowHttpsOutbound',
      ruleAction: ec2.Action.ALLOW,
      cidr: ec2.AclCidr.anyIpv4(),
      direction: ec2.TrafficDirection.EGRESS,
    });

    webNetworkAcl.addEntry('AllowEphemeralOutbound', {
      ruleNumber: 120,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      networkAclEntryName: 'AllowEphemeralOutbound',
      ruleAction: ec2.Action.ALLOW,
      cidr: ec2.AclCidr.anyIpv4(),
      direction: ec2.TrafficDirection.EGRESS,
    });

    // Apply tags to Network ACL
    cdk.Tags.of(webNetworkAcl).add('Name', 'WebNetworkAcl');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(webNetworkAcl).add(key, value);
    });

    // Associate Network ACL with public subnets
    vpc.publicSubnets.forEach((subnet, index) => {
      new ec2.SubnetNetworkAclAssociation(
        this,
        `WebNetworkAclAssociation${index}`,
        {
          networkAcl: webNetworkAcl,
          subnet,
        }
      );
    });

    // ========== COMPUTE RESOURCES ==========

    // Get the latest Amazon Linux 2 AMI
    const amzLinux = ec2.MachineImage.latestAmazonLinux2();

    // Create EC2 instances in different public subnets for high availability
    const instances: ec2.Instance[] = [];

    vpc.publicSubnets.forEach((subnet, index) => {
      const instance = new ec2.Instance(this, `WebInstance${index + 1}`, {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T2,
          ec2.InstanceSize.MICRO
        ),
        machineImage: amzLinux,
        vpc,
        vpcSubnets: {
          subnets: [subnet],
        },
        securityGroup: webSecurityGroup,
        keyName: undefined, // Consider creating a key pair for SSH access
        userData: ec2.UserData.forLinux(),
      });

      // Add user data to install and configure Apache web server
      instance.addUserData(
        '#!/bin/bash',
        'yum update -y',
        'yum install -y httpd',
        'systemctl start httpd',
        'systemctl enable httpd',
        `echo "<h1>Web Server ${index + 1} - AZ: ${subnet.availabilityZone}</h1>" > /var/www/html/index.html`,
        'echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html',
        'chkconfig httpd on'
      );

      // Create and associate Elastic IP
      new ec2.CfnEIP(this, `WebInstanceEIP${index + 1}`, {
        instanceId: instance.instanceId,
        domain: 'vpc',
        tags: [
          { key: 'Name', value: `WebInstanceEIP${index + 1}` },
          ...Object.entries(commonTags).map(([key, value]) => ({ key, value })),
        ],
      });

      // Apply tags to instance
      cdk.Tags.of(instance).add('Name', `WebInstance${index + 1}`);
      Object.entries(commonTags).forEach(([key, value]) => {
        cdk.Tags.of(instance).add(key, value);
      });

      instances.push(instance);
    });

    // ========== DATABASE ==========

    // Create RDS Subnet Group for private subnets
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DbSubnetGroup', {
      description: 'Subnet group for RDS MySQL database',
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Apply tags to DB subnet group
    cdk.Tags.of(dbSubnetGroup).add('Name', 'DbSubnetGroup');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(dbSubnetGroup).add(key, value);
    });

    // Create RDS MySQL instance in private subnet
    const database = new rds.DatabaseInstance(this, 'TapDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_39,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: 'tap-database-credentials',
      }),
      allocatedStorage: 20,
      storageType: rds.StorageType.GP2,
      deleteAutomatedBackups: true,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      publiclyAccessible: false, // Ensure database is not publicly accessible
      multiAz: false, // Set to true for production high availability
    });

    // Apply tags to database
    cdk.Tags.of(database).add('Name', 'TapDatabase');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(database).add(key, value);
    });

    // ========== STORAGE ==========

    // Create S3 bucket for application logs with versioning and encryption
    const logsBucket = new s3.Bucket(this, 'TapLogsBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
        {
          id: 'DeleteIncompleteMultipartUploads',
          enabled: true,
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
      ],
    });

    // Apply tags to S3 bucket
    cdk.Tags.of(logsBucket).add('Name', 'TapLogsBucket');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(logsBucket).add(key, value);
    });

    // ========== LOAD BALANCING ==========

    // Create Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      'TapApplicationLoadBalancer',
      {
        vpc,
        internetFacing: true,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        securityGroup: albSecurityGroup,
        deletionProtection: false, // Set to true for production
      }
    );

    // Apply tags to ALB
    cdk.Tags.of(alb).add('Name', 'TapApplicationLoadBalancer');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(alb).add(key, value);
    });

    // Create target group for EC2 instances
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'TapTargetGroup',
      {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        vpc,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          path: '/',
          protocol: elbv2.Protocol.HTTP,
          port: '80',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 5,
        },
        deregistrationDelay: cdk.Duration.seconds(60),
      }
    );

    // Apply tags to target group
    cdk.Tags.of(targetGroup).add('Name', 'TapTargetGroup');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(targetGroup).add(key, value);
    });

    // Add EC2 instances to target group
    instances.forEach(instance => {
      targetGroup.addTarget(new elbv2_targets.InstanceTarget(instance, 80));
    });

    // Create listener to forward traffic to target group
    const listener = alb.addListener('TapListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Apply tags to listener
    cdk.Tags.of(listener).add('Name', 'TapListener');
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(listener).add(key, value);
    });

    // ========== OUTPUTS ==========

    // Output important information for reference
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
      exportName: 'TapApplicationLoadBalancerDNS',
    });

    new cdk.CfnOutput(this, 'LoadBalancerArn', {
      value: alb.loadBalancerArn,
      description: 'ARN of the Application Load Balancer',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS MySQL database endpoint',
      exportName: 'TapDatabaseEndpoint',
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: database.instanceEndpoint.port.toString(),
      description: 'RDS MySQL database port',
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: logsBucket.bucketName,
      description: 'S3 bucket name for application logs',
      exportName: 'TapLogsBucketName',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: 'TapVpcId',
    });

    // Output instance information
    instances.forEach((instance, index) => {
      new cdk.CfnOutput(this, `WebInstance${index + 1}Id`, {
        value: instance.instanceId,
        description: `Instance ID of Web Instance ${index + 1}`,
      });

      new cdk.CfnOutput(this, `WebInstance${index + 1}AZ`, {
        value: instance.instanceAvailabilityZone,
        description: `Availability Zone of Web Instance ${index + 1}`,
      });
    });
  }
}
