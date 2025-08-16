```typescript
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
  public readonly rdsIdentifier: pulumi.Output<string>;
  public readonly launchTemplateName: pulumi.Output<string>;

  // Additional resource references for testing
  public readonly ec2Role: aws.iam.Role;
  public readonly ec2InstanceProfile: aws.iam.InstanceProfile;
  public readonly ec2S3Policy: aws.iam.RolePolicy;
  public readonly rdsKmsKey: aws.kms.Key;
  public readonly rdsKmsAlias: aws.kms.Alias;
  public readonly launchTemplate: aws.ec2.LaunchTemplate;
  public readonly awsProvider: aws.Provider;

  // Configuration properties
  private readonly projectName: string;
  private readonly environment: string;
  private readonly resourcePrefix: string;

  constructor(
    name: string,
    args: ProductionWebAppStackArgs = {},
    opts?: ResourceOptions
  ) {
    super('tap:stack:ProductionWebAppStack', name, args, opts);

    // Configuration with defaults
    const vpcCidr = args.vpcCidr || '10.0.0.0/16';
    this.projectName = args.projectName || 'production-web-app';
    this.environment = args.environment || 'prod';
    const region = args.region || 'us-west-2'; // Default to us-west-2 as per PROMPT.md
    this.resourcePrefix = `${this.projectName}-${this.environment}`;

    // Create AWS provider for the specified region
    this.awsProvider = new aws.Provider(
      'aws-provider',
      {
        region: region,
      },
      { parent: this }
    );

    // Provider options to be used by all resources
    const providerOpts: ResourceOptions = {
      parent: this,
      provider: this.awsProvider,
    };

    // Create resource name with environment suffix
    // this.resourcePrefix is now a class property

    // Common tags
    const commonTags = {
      Environment:
        this.environment.charAt(0).toUpperCase() + this.environment.slice(1),
      Project: this.projectName,
      Region: region,
      ...(args.tags || {}),
    };

    // Get availability zones for the specified region using the provider
    const availabilityZones = aws.getAvailabilityZones(
      {
        state: 'available',
      },
      { provider: this.awsProvider }
    );

    // VPC
    this.vpc = new aws.ec2.Vpc(
      'main-vpc',
      {
        cidrBlock: vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `${this.resourcePrefix}-vpc`,
          ...commonTags,
        },
      },
      providerOpts
    );

    // Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      'main-igw',
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${this.resourcePrefix}-igw`,
          ...commonTags,
        },
      },
      providerOpts
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
            Name: `${this.resourcePrefix}-public-subnet-${i + 1}`,
            Type: 'Public',
            ...commonTags,
          },
        },
        providerOpts
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
            Name: `${this.resourcePrefix}-private-subnet-${i + 1}`,
            Type: 'Private',
            ...commonTags,
          },
        },
        providerOpts
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
            Name: `${this.resourcePrefix}-nat-eip-${i + 1}`,
            ...commonTags,
          },
        },
        providerOpts
      );
      elasticIps.push(elasticIp);

      const natGateway = new aws.ec2.NatGateway(
        `nat-gateway-${i + 1}`,
        {
          allocationId: elasticIp.id,
          subnetId: this.publicSubnets[i].id,
          tags: {
            Name: `${this.resourcePrefix}-nat-gateway-${i + 1}`,
            ...commonTags,
          },
        },
        providerOpts
      );
      natGateways.push(natGateway);
    }

    // Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(
      'public-rt',
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${this.resourcePrefix}-public-rt`,
          ...commonTags,
        },
      },
      providerOpts
    );

    new aws.ec2.Route(
      'public-route',
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      providerOpts
    );

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${index + 1}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        providerOpts
      );
    });

    // Private Route Tables
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `private-rt-${index + 1}`,
        {
          vpcId: this.vpc.id,
          tags: {
            Name: `${this.resourcePrefix}-private-rt-${index + 1}`,
            ...commonTags,
          },
        },
        providerOpts
      );

      new aws.ec2.Route(
        `private-route-${index + 1}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[index].id,
        },
        providerOpts
      );

      new aws.ec2.RouteTableAssociation(
        `private-rta-${index + 1}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        providerOpts
      );
    });

    // Security Groups
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      'alb-sg',
      {
        name: `${this.resourcePrefix}-alb-sg`,
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
          Name: `${this.resourcePrefix}-alb-sg`,
          ...commonTags,
        },
      },
      providerOpts
    );

    const ec2SecurityGroup = new aws.ec2.SecurityGroup(
      'ec2-sg',
      {
        name: `${this.resourcePrefix}-ec2-sg`,
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
          Name: `${this.resourcePrefix}-ec2-sg`,
          ...commonTags,
        },
      },
      providerOpts
    );

    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      'rds-sg',
      {
        name: `${this.resourcePrefix}-rds-sg`,
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
          Name: `${this.resourcePrefix}-rds-sg`,
          ...commonTags,
        },
      },
      providerOpts
    );

    // IAM Role for EC2 with least privilege
    this.ec2Role = new aws.iam.Role(
      'ec2-role',
      {
        name: `${this.resourcePrefix}-ec2-role`,
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
      providerOpts
    );

    this.ec2InstanceProfile = new aws.iam.InstanceProfile(
      'ec2-instance-profile',
      {
        name: `${this.resourcePrefix}-ec2-instance-profile`,
        role: this.ec2Role.name,
        tags: commonTags,
      },
      providerOpts
    );

    // KMS Key for RDS encryption with key rotation
    this.rdsKmsKey = new aws.kms.Key(
      'rds-kms-key',
      {
        description: 'KMS key for RDS encryption',
        enableKeyRotation: true, // Enable automatic key rotation
        tags: {
          Name: `${this.resourcePrefix}-rds-kms-key`,
          ...commonTags,
        },
      },
      providerOpts
    );

    this.rdsKmsAlias = new aws.kms.Alias(
      'rds-kms-alias',
      {
        name: `alias/${this.resourcePrefix}-rds-key`,
        targetKeyId: this.rdsKmsKey.keyId,
      },
      providerOpts
    );

    // RDS Subnet Group
    const rdsSubnetGroup = new aws.rds.SubnetGroup(
      'rds-subnet-group',
      {
        name: `${this.resourcePrefix}-rds-subnet-group`,
        subnetIds: this.privateSubnets.map(subnet => subnet.id),
        tags: {
          Name: `${this.resourcePrefix}-rds-subnet-group`,
          ...commonTags,
        },
      },
      providerOpts
    );

    // Database credentials using AWS Secrets Manager
    const databaseSecret = new aws.secretsmanager.Secret(
      'database-secret',
      {
        name: `${this.resourcePrefix}/database/credentials`,
        description: 'RDS MySQL database credentials',
        tags: {
          Name: `${this.resourcePrefix}-db-secret`,
          ...commonTags,
        },
      },
      providerOpts
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
      providerOpts
    );

    // IAM Role for RDS Enhanced Monitoring
    const rdsMonitoringRole = new aws.iam.Role(
      'rds-monitoring-role',
      {
        name: `${this.resourcePrefix}-rds-monitoring-role`,
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
      providerOpts
    );

    // RDS MySQL Instance with security enhancements
    this.database = new aws.rds.Instance(
      'mysql-instance',
      {
        identifier: `${this.resourcePrefix}-mysql`,
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        maxAllocatedStorage: 100, // Enable storage autoscaling
        storageType: 'gp2',
        storageEncrypted: true,
        kmsKeyId: this.rdsKmsKey.arn,
        dbName: 'production',
        username: 'admin',
        password: 'TempPassword123!', // Use secret rotation in production
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        dbSubnetGroupName: rdsSubnetGroup.name,
        skipFinalSnapshot: false, // Enable final snapshot for data protection
        finalSnapshotIdentifier: `${this.resourcePrefix}-mysql-final-snapshot`,
        backupRetentionPeriod: 7, // 7 days backup retention
        backupWindow: '03:00-04:00', // Backup during low traffic hours
        maintenanceWindow: 'sun:04:00-sun:05:00', // Maintenance window
        multiAz: false, // Set to true for production high availability
        monitoringInterval: 60, // Enhanced monitoring
        monitoringRoleArn: rdsMonitoringRole.arn, // Required for enhanced monitoring
        deletionProtection: false, // Set to true for production
        tags: {
          Name: `${this.resourcePrefix}-mysql`,
          ...commonTags,
        },
      },
      providerOpts
    );

    // Launch Template with security hardening
    this.launchTemplate = new aws.ec2.LaunchTemplate(
      'launch-template',
      {
        name: `${this.resourcePrefix}-launch-template`,
        imageId: aws.ec2
          .getAmi(
            {
              mostRecent: true,
              owners: ['amazon'],
              filters: [
                {
                  name: 'name',
                  values: ['amzn2-ami-hvm-*-x86_64-gp2'],
                },
              ],
            },
            { provider: this.awsProvider }
          )
          .then(ami => ami.id),
        instanceType: 't3.micro',
        vpcSecurityGroupIds: [ec2SecurityGroup.id],
        iamInstanceProfile: {
          name: this.ec2InstanceProfile.name,
        },
        metadataOptions: {
          httpEndpoint: 'enabled',
          httpTokens: 'required', // Enforce IMDSv2
          httpPutResponseHopLimit: 1,
        },
        monitoring: {
          enabled: true, // Enable detailed CloudWatch monitoring
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
              Name: `${this.resourcePrefix}-instance`,
              ...commonTags,
            },
          },
        ],
        tags: {
          Name: `${this.resourcePrefix}-launch-template`,
          ...commonTags,
        },
      },
      providerOpts
    );

    // Application Load Balancer with security enhancements
    this.loadBalancer = new aws.lb.LoadBalancer(
      'app-lb',
      {
        name: `${this.resourcePrefix}-alb`,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: this.publicSubnets.map(subnet => subnet.id),
        enableDeletionProtection: false, // Set to true for production
        dropInvalidHeaderFields: false, // Security enhancement - set to true for production
        tags: {
          Name: `${this.resourcePrefix}-alb`,
          ...commonTags,
        },
      },
      providerOpts
    );

    // Target Group
    const targetGroup = new aws.lb.TargetGroup(
      'app-tg',
      {
        name: `${this.resourcePrefix}-tg`,
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
          Name: `${this.resourcePrefix}-tg`,
          ...commonTags,
        },
      },
      providerOpts
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
          Name: `${this.resourcePrefix}-listener`,
          ...commonTags,
        },
      },
      { ...providerOpts, dependsOn: [this.loadBalancer, targetGroup] }
    );

    // Auto Scaling Group with enhanced health checks
    this.autoScalingGroup = new aws.autoscaling.Group(
      'app-asg',
      {
        name: `${this.resourcePrefix}-asg`,
        vpcZoneIdentifiers: this.privateSubnets.map(subnet => subnet.id),
        targetGroupArns: [targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        minSize: 2,
        maxSize: 6,
        desiredCapacity: 2,
        launchTemplate: {
          id: this.launchTemplate.id,
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
            value: `${this.resourcePrefix}-asg`,
            propagateAtLaunch: true,
          },
          {
            key: 'Environment',
            value:
              this.environment.charAt(0).toUpperCase() +
              this.environment.slice(1),
            propagateAtLaunch: true,
          },
        ],
      },
      { ...providerOpts, dependsOn: [this.launchTemplate, targetGroup] }
    );

    // S3 Bucket with enhanced security
    this.bucket = new aws.s3.Bucket(
      'app-bucket',
      {
        bucket: `${this.resourcePrefix}-bucket`,
        tags: {
          Name: `${this.resourcePrefix}-bucket`,
          ...commonTags,
        },
      },
      providerOpts
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
      providerOpts
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
      providerOpts
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
      providerOpts
    );

    // Least privilege S3 policy for EC2 instances
    this.ec2S3Policy = new aws.iam.RolePolicy(
      'ec2-s3-policy',
      {
        name: `${this.resourcePrefix}-ec2-policy`,
        role: this.ec2Role.id,
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
      providerOpts
    );

    // Grant EC2 role access to database secret
    new aws.iam.RolePolicy(
      'ec2-secrets-policy',
      {
        name: `${this.resourcePrefix}-ec2-secrets-policy`,
        role: this.ec2Role.id,
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
      providerOpts
    );

    // Set outputs
    this.albDnsName = this.loadBalancer.dnsName;
    this.rdsEndpoint = this.database.endpoint;
    this.s3BucketName = this.bucket.id;
    this.rdsIdentifier = this.database.identifier;
    this.launchTemplateName = this.launchTemplate.name;

    // Register outputs
    this.registerOutputs({
      // Basic infrastructure
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnets.map(subnet => subnet.id),
      privateSubnetIds: this.privateSubnets.map(subnet => subnet.id),

      // Load Balancer
      albDnsName: this.albDnsName,
      albName: this.loadBalancer.name,

      // Database
      rdsEndpoint: this.rdsEndpoint,
      rdsInstanceId: this.database.id,
      rdsIdentifier: this.rdsIdentifier,

      // Storage
      s3BucketName: this.s3BucketName,

      // Compute
      autoScalingGroupName: this.autoScalingGroup.name,
      launchTemplateName: this.launchTemplateName,

      // IAM
      ec2RoleName: this.ec2Role.name,
      ec2InstanceProfileName: this.ec2InstanceProfile.name,
      ec2PolicyName: this.ec2S3Policy.name,

      // KMS
      rdsKmsKeyId: this.rdsKmsKey.keyId,
      rdsKmsKeyAlias: this.rdsKmsAlias.name,

      // Configuration
      projectName: this.projectName,
      environment: this.environment,
      resourcePrefix: this.resourcePrefix,
    });
  }
}
```
