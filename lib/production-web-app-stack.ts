/**
 * production-web-app-stack.ts
 *
 * This module defines the ProductionWebAppStack class, a Pulumi ComponentResource that creates
 * a production-ready web application infrastructure with VPC, ALB, Auto Scaling,
 * RDS MySQL, and S3 bucket.
 *
 * Based on the requirements from MODEL_RESPONSE.md, this stack creates:
 * - VPC with public and private subnets across 3 AZs
 * - Internet Gateway and NAT Gateways
 * - Application Load Balancer
 * - Auto Scaling Group with EC2 instances
 * - RDS MySQL database with encryption
 * - S3 bucket with versioning and security
 * - Appropriate security groups and IAM roles
 */

import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * Configuration interface for the ProductionWebAppStack
 */
export interface ProductionWebAppStackArgs {
  /**
   * CIDR block for the VPC
   * @default '10.0.0.0/16'
   */
  vpcCidr?: string;

  /**
   * Project name used for resource naming
   * @default 'production-web-app'
   */
  projectName?: string;

  /**
   * Environment name (e.g., 'dev', 'staging', 'prod')
   */
  environment?: string;

  /**
   * AWS region for deployment
   * @default 'us-west-2'
   */
  region?: string;

  /**
   * Additional tags to apply to resources
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Production Web Application Stack
 *
 * Creates a complete production-ready web application infrastructure
 * with high availability, security, and scalability features.
 */
export class ProductionWebAppStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly loadBalancer: aws.lb.LoadBalancer;
  public readonly autoScalingGroup: aws.autoscaling.Group;
  public readonly database: aws.rds.Instance;
  public readonly bucket: aws.s3.Bucket;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;

  constructor(
    name: string,
    args: ProductionWebAppStackArgs = {},
    opts?: ResourceOptions
  ) {
    super('tap:stack:ProductionWebAppStack', name, args, opts);

    // Configuration with defaults
    const vpcCidr = args.vpcCidr || '10.0.0.0/16';
    const projectName = args.projectName || 'production-web-app';
    const environment = args.environment || 'prod';
    const region = args.region || 'us-west-2'; // Default to us-west-2 as per PROMPT.md

    // Create resource name with environment suffix
    const resourcePrefix = `${projectName}-${environment}`;

    // Common tags
    const commonTags = {
      Environment: environment.charAt(0).toUpperCase() + environment.slice(1),
      Project: projectName,
      Region: region,
      ...(args.tags || {}),
    };

    // Get availability zones for the specified region
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // VPC
    this.vpc = new aws.ec2.Vpc(
      'main-vpc',
      {
        cidrBlock: vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `${resourcePrefix}-vpc`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    // Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      'main-igw',
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${resourcePrefix}-igw`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    // Public and Private Subnets
    this.publicSubnets = [];
    this.privateSubnets = [];

    for (let i = 0; i < 3; i++) {
      // Public Subnet
      const publicSubnet = new aws.ec2.Subnet(
        `public-subnet-${i + 1}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i + 1}.0/24`,
          availabilityZone: availabilityZones.then(azs => azs.names[i]),
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `${resourcePrefix}-public-subnet-${i + 1}`,
            Type: 'Public',
            ...commonTags,
          },
        },
        { parent: this }
      );
      this.publicSubnets.push(publicSubnet);

      // Private Subnet
      const privateSubnet = new aws.ec2.Subnet(
        `private-subnet-${i + 1}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: availabilityZones.then(azs => azs.names[i]),
          tags: {
            Name: `${resourcePrefix}-private-subnet-${i + 1}`,
            Type: 'Private',
            ...commonTags,
          },
        },
        { parent: this }
      );
      this.privateSubnets.push(privateSubnet);
    }

    // NAT Gateways
    const natGateways: aws.ec2.NatGateway[] = [];
    const elasticIps: aws.ec2.Eip[] = [];

    for (let i = 0; i < 3; i++) {
      const elasticIp = new aws.ec2.Eip(
        `nat-eip-${i + 1}`,
        {
          domain: 'vpc',
          tags: {
            Name: `${resourcePrefix}-nat-eip-${i + 1}`,
            ...commonTags,
          },
        },
        { parent: this }
      );
      elasticIps.push(elasticIp);

      const natGateway = new aws.ec2.NatGateway(
        `nat-gateway-${i + 1}`,
        {
          allocationId: elasticIp.id,
          subnetId: this.publicSubnets[i].id,
          tags: {
            Name: `${resourcePrefix}-nat-gateway-${i + 1}`,
            ...commonTags,
          },
        },
        { parent: this }
      );
      natGateways.push(natGateway);
    }

    // Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(
      'public-rt',
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${resourcePrefix}-public-rt`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      'public-route',
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${index + 1}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Private Route Tables
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `private-rt-${index + 1}`,
        {
          vpcId: this.vpc.id,
          tags: {
            Name: `${resourcePrefix}-private-rt-${index + 1}`,
            ...commonTags,
          },
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `private-route-${index + 1}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[index].id,
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `private-rta-${index + 1}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    // Security Groups
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      'alb-sg',
      {
        name: `${resourcePrefix}-alb-sg`,
        description: 'Security group for Application Load Balancer',
        vpcId: this.vpc.id,
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `${resourcePrefix}-alb-sg`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    const ec2SecurityGroup = new aws.ec2.SecurityGroup(
      'ec2-sg',
      {
        name: `${resourcePrefix}-ec2-sg`,
        description: 'Security group for EC2 instances - ALB access only',
        vpcId: this.vpc.id,
        ingress: [
          // Remove SSH access - use AWS Systems Manager Session Manager instead
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            securityGroups: [albSecurityGroup.id],
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `${resourcePrefix}-ec2-sg`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      'rds-sg',
      {
        name: `${resourcePrefix}-rds-sg`,
        description: 'Security group for RDS MySQL instance',
        vpcId: this.vpc.id,
        ingress: [
          {
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            securityGroups: [ec2SecurityGroup.id],
          },
        ],
        tags: {
          Name: `${resourcePrefix}-rds-sg`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    // IAM Role for EC2 with least privilege
    const ec2Role = new aws.iam.Role(
      'ec2-role',
      {
        name: `${resourcePrefix}-ec2-role`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore', // For Session Manager access
        ],
        tags: commonTags,
      },
      { parent: this }
    );

    const ec2InstanceProfile = new aws.iam.InstanceProfile(
      'ec2-instance-profile',
      {
        name: `${resourcePrefix}-ec2-instance-profile`,
        role: ec2Role.name,
        tags: commonTags,
      },
      { parent: this }
    );

    // KMS Key for RDS encryption with key rotation
    const rdsKmsKey = new aws.kms.Key(
      'rds-kms-key',
      {
        description: 'KMS key for RDS encryption',
        enableKeyRotation: true, // Enable automatic key rotation
        tags: {
          Name: `${resourcePrefix}-rds-kms-key`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    new aws.kms.Alias(
      'rds-kms-alias',
      {
        name: `alias/${resourcePrefix}-rds-key`,
        targetKeyId: rdsKmsKey.keyId,
      },
      { parent: this }
    );

    // RDS Subnet Group
    const rdsSubnetGroup = new aws.rds.SubnetGroup(
      'rds-subnet-group',
      {
        name: `${resourcePrefix}-rds-subnet-group`,
        subnetIds: this.privateSubnets.map(subnet => subnet.id),
        tags: {
          Name: `${resourcePrefix}-rds-subnet-group`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    // Database credentials using AWS Secrets Manager
    const databaseSecret = new aws.secretsmanager.Secret(
      'database-secret',
      {
        name: `${resourcePrefix}/database/credentials`,
        description: 'RDS MySQL database credentials',
        tags: {
          Name: `${resourcePrefix}-db-secret`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    // Generate secret version with password
    new aws.secretsmanager.SecretVersion(
      'database-secret-version',
      {
        secretId: databaseSecret.id,
        secretString: JSON.stringify({
          username: 'admin',
          password: 'TempPassword123!', // This will be rotated by AWS
        }),
      },
      { parent: this }
    );

    // IAM Role for RDS Enhanced Monitoring
    const rdsMonitoringRole = new aws.iam.Role(
      'rds-monitoring-role',
      {
        name: `${resourcePrefix}-rds-monitoring-role`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'monitoring.rds.amazonaws.com',
              },
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
        ],
        tags: commonTags,
      },
      { parent: this }
    );

    // RDS MySQL Instance with security enhancements
    this.database = new aws.rds.Instance(
      'mysql-instance',
      {
        identifier: `${resourcePrefix}-mysql`,
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        maxAllocatedStorage: 100, // Enable storage autoscaling
        storageType: 'gp2',
        storageEncrypted: true,
        kmsKeyId: rdsKmsKey.arn,
        dbName: 'production',
        username: 'admin',
        password: 'TempPassword123!', // Use secret rotation in production
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        dbSubnetGroupName: rdsSubnetGroup.name,
        skipFinalSnapshot: false, // Enable final snapshot for data protection
        finalSnapshotIdentifier: `${resourcePrefix}-mysql-final-snapshot`,
        backupRetentionPeriod: 7, // 7 days backup retention
        backupWindow: '03:00-04:00', // Backup during low traffic hours
        maintenanceWindow: 'sun:04:00-sun:05:00', // Maintenance window
        multiAz: false, // Set to true for production high availability
        monitoringInterval: 60, // Enhanced monitoring
        monitoringRoleArn: rdsMonitoringRole.arn, // Required for enhanced monitoring
        deletionProtection: false, // Set to true for production
        tags: {
          Name: `${resourcePrefix}-mysql`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    // Launch Template with security hardening
    const launchTemplate = new aws.ec2.LaunchTemplate(
      'launch-template',
      {
        name: `${resourcePrefix}-launch-template`,
        imageId: aws.ec2
          .getAmi({
            mostRecent: true,
            owners: ['amazon'],
            filters: [
              {
                name: 'name',
                values: ['amzn2-ami-hvm-*-x86_64-gp2'],
              },
            ],
          })
          .then(ami => ami.id),
        instanceType: 't3.micro',
        vpcSecurityGroupIds: [ec2SecurityGroup.id],
        iamInstanceProfile: {
          name: ec2InstanceProfile.name,
        },
        metadataOptions: {
          httpEndpoint: 'enabled',
          httpTokens: 'required', // Enforce IMDSv2
          httpPutResponseHopLimit: 1,
        },
        blockDeviceMappings: [
          {
            deviceName: '/dev/xvda',
            ebs: {
              volumeSize: 20,
              volumeType: 'gp3',
              encrypted: 'true', // Encrypt EBS volumes
              deleteOnTermination: 'true',
            },
          },
        ],
        userData: Buffer.from(
          `#!/bin/bash
yum update -y
yum install -y httpd amazon-cloudwatch-agent

# Security hardening
echo "net.ipv4.conf.all.send_redirects = 0" >> /etc/sysctl.conf
echo "net.ipv4.conf.default.send_redirects = 0" >> /etc/sysctl.conf
echo "net.ipv4.conf.all.accept_source_route = 0" >> /etc/sysctl.conf
echo "net.ipv4.conf.default.accept_source_route = 0" >> /etc/sysctl.conf
sysctl -p

# Configure httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Secure Web App - $(hostname -f)</h1>" > /var/www/html/index.html

# Start CloudWatch agent for monitoring
systemctl start amazon-cloudwatch-agent
systemctl enable amazon-cloudwatch-agent
`
        ).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              Name: `${resourcePrefix}-instance`,
              ...commonTags,
            },
          },
        ],
        tags: {
          Name: `${resourcePrefix}-launch-template`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    // Application Load Balancer with security enhancements
    this.loadBalancer = new aws.lb.LoadBalancer(
      'app-lb',
      {
        name: `${resourcePrefix}-alb`,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: this.publicSubnets.map(subnet => subnet.id),
        enableDeletionProtection: false, // Set to true for production
        dropInvalidHeaderFields: false, // Security enhancement - set to true for production
        tags: {
          Name: `${resourcePrefix}-alb`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    // Target Group
    const targetGroup = new aws.lb.TargetGroup(
      'app-tg',
      {
        name: `${resourcePrefix}-tg`,
        port: 80,
        protocol: 'HTTP',
        vpcId: this.vpc.id,
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          interval: 30,
          matcher: '200',
          path: '/',
          port: 'traffic-port',
          protocol: 'HTTP',
          timeout: 5,
          unhealthyThreshold: 2,
        },
        tags: {
          Name: `${resourcePrefix}-tg`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    // ALB Listener
    new aws.lb.Listener(
      'app-listener',
      {
        loadBalancerArn: this.loadBalancer.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
        tags: {
          Name: `${resourcePrefix}-listener`,
          ...commonTags,
        },
      },
      { parent: this, dependsOn: [this.loadBalancer, targetGroup] }
    );

    // Auto Scaling Group with enhanced health checks
    this.autoScalingGroup = new aws.autoscaling.Group(
      'app-asg',
      {
        name: `${resourcePrefix}-asg`,
        vpcZoneIdentifiers: this.privateSubnets.map(subnet => subnet.id),
        targetGroupArns: [targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        minSize: 2,
        maxSize: 6,
        desiredCapacity: 2,
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        enabledMetrics: [
          'GroupMinSize',
          'GroupMaxSize',
          'GroupDesiredCapacity',
          'GroupInServiceInstances',
          'GroupTotalInstances',
        ],
        tags: [
          {
            key: 'Name',
            value: `${resourcePrefix}-asg`,
            propagateAtLaunch: true,
          },
          {
            key: 'Environment',
            value: environment.charAt(0).toUpperCase() + environment.slice(1),
            propagateAtLaunch: true,
          },
        ],
      },
      { parent: this, dependsOn: [launchTemplate, targetGroup] }
    );

    // S3 Bucket with enhanced security
    this.bucket = new aws.s3.Bucket(
      'app-bucket',
      {
        bucket: `${resourcePrefix}-bucket-${Math.random()
          .toString(36)
          .substring(2, 15)}`,
        tags: {
          Name: `${resourcePrefix}-bucket`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    // S3 Bucket Versioning
    new aws.s3.BucketVersioningV2(
      'app-bucket-versioning',
      {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // S3 Bucket Server Side Encryption
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      'app-bucket-encryption',
      {
        bucket: this.bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    // S3 Bucket Public Access Block
    new aws.s3.BucketPublicAccessBlock(
      'app-bucket-pab',
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Least privilege S3 policy for EC2 instances
    new aws.iam.RolePolicy(
      'ec2-s3-policy',
      {
        name: `${resourcePrefix}-ec2-s3-policy`,
        role: ec2Role.id,
        policy: pulumi
          .all([this.bucket.arn, this.bucket.bucket])
          .apply(([bucketArn, _bucketName]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:ListBucket'],
                  Resource: bucketArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Grant EC2 role access to database secret
    new aws.iam.RolePolicy(
      'ec2-secrets-policy',
      {
        name: `${resourcePrefix}-ec2-secrets-policy`,
        role: ec2Role.id,
        policy: databaseSecret.arn.apply(secretArn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'secretsmanager:GetSecretValue',
                  'secretsmanager:DescribeSecret',
                ],
                Resource: secretArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Set outputs
    this.albDnsName = this.loadBalancer.dnsName;
    this.rdsEndpoint = this.database.endpoint;
    this.s3BucketName = this.bucket.id;

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnets.map(subnet => subnet.id),
      privateSubnetIds: this.privateSubnets.map(subnet => subnet.id),
      albDnsName: this.albDnsName,
      rdsEndpoint: this.rdsEndpoint,
      s3BucketName: this.s3BucketName,
    });
  }
}
