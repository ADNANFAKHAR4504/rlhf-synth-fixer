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
   * CIDR block allowed for SSH access
   * @default '0.0.0.0/0'
   */
  sshAllowedCidr?: string;

  /**
   * Project name used for resource naming
   * @default 'production-web-app'
   */
  projectName?: string;

  /**
   * Environment suffix for resource naming
   */
  environmentSuffix?: string;

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
    const sshAllowedCidr = args.sshAllowedCidr || '0.0.0.0/0';
    const projectName = args.projectName || 'production-web-app';

    // Common tags
    const commonTags = {
      Environment: 'Production',
      Project: projectName,
      ...(args.tags || {}),
    };

    // Get availability zones
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
          Name: `${projectName}-vpc`,
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
          Name: `${projectName}-igw`,
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
            Name: `${projectName}-public-subnet-${i + 1}`,
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
            Name: `${projectName}-private-subnet-${i + 1}`,
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
            Name: `${projectName}-nat-eip-${i + 1}`,
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
            Name: `${projectName}-nat-gateway-${i + 1}`,
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
          Name: `${projectName}-public-rt`,
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
            Name: `${projectName}-private-rt-${index + 1}`,
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
        name: `${projectName}-alb-sg`,
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
          Name: `${projectName}-alb-sg`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    const ec2SecurityGroup = new aws.ec2.SecurityGroup(
      'ec2-sg',
      {
        name: `${projectName}-ec2-sg`,
        description: 'Security group for EC2 instances',
        vpcId: this.vpc.id,
        ingress: [
          {
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: [sshAllowedCidr],
          },
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
          Name: `${projectName}-ec2-sg`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      'rds-sg',
      {
        name: `${projectName}-rds-sg`,
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
          Name: `${projectName}-rds-sg`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    // IAM Role for EC2
    const ec2Role = new aws.iam.Role(
      'ec2-role',
      {
        name: `${projectName}-ec2-role`,
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
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      'ec2-policy',
      {
        name: `${projectName}-ec2-policy`,
        role: ec2Role.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    const ec2InstanceProfile = new aws.iam.InstanceProfile(
      'ec2-instance-profile',
      {
        name: `${projectName}-ec2-instance-profile`,
        role: ec2Role.name,
        tags: commonTags,
      },
      { parent: this }
    );

    // KMS Key for RDS encryption
    const rdsKmsKey = new aws.kms.Key(
      'rds-kms-key',
      {
        description: 'KMS key for RDS encryption',
        tags: {
          Name: `${projectName}-rds-kms-key`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    new aws.kms.Alias(
      'rds-kms-alias',
      {
        name: `alias/${projectName}-rds-key`,
        targetKeyId: rdsKmsKey.keyId,
      },
      { parent: this }
    );

    // RDS Subnet Group
    const rdsSubnetGroup = new aws.rds.SubnetGroup(
      'rds-subnet-group',
      {
        name: `${projectName}-rds-subnet-group`,
        subnetIds: this.privateSubnets.map(subnet => subnet.id),
        tags: {
          Name: `${projectName}-rds-subnet-group`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    // RDS MySQL Instance
    this.database = new aws.rds.Instance(
      'mysql-instance',
      {
        identifier: `${projectName}-mysql`,
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        storageType: 'gp2',
        storageEncrypted: true,
        kmsKeyId: rdsKmsKey.arn,
        dbName: 'production',
        username: 'admin',
        password: 'changeme123!',
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        dbSubnetGroupName: rdsSubnetGroup.name,
        skipFinalSnapshot: true,
        tags: {
          Name: `${projectName}-mysql`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    // Launch Template
    const launchTemplate = new aws.ec2.LaunchTemplate(
      'launch-template',
      {
        name: `${projectName}-launch-template`,
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
        userData: Buffer.from(
          `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
`
        ).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              Name: `${projectName}-instance`,
              ...commonTags,
            },
          },
        ],
        tags: {
          Name: `${projectName}-launch-template`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    // Application Load Balancer
    this.loadBalancer = new aws.lb.LoadBalancer(
      'app-lb',
      {
        name: `${projectName}-alb`,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: this.publicSubnets.map(subnet => subnet.id),
        tags: {
          Name: `${projectName}-alb`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    // Target Group
    const targetGroup = new aws.lb.TargetGroup(
      'app-tg',
      {
        name: `${projectName}-tg`,
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
          Name: `${projectName}-tg`,
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
          Name: `${projectName}-listener`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    // Auto Scaling Group
    this.autoScalingGroup = new aws.autoscaling.Group(
      'app-asg',
      {
        name: `${projectName}-asg`,
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
        tags: [
          {
            key: 'Name',
            value: `${projectName}-asg`,
            propagateAtLaunch: true,
          },
          {
            key: 'Environment',
            value: 'Production',
            propagateAtLaunch: true,
          },
        ],
      },
      { parent: this }
    );

    // S3 Bucket
    this.bucket = new aws.s3.Bucket(
      'app-bucket',
      {
        bucket: `${projectName}-bucket-${Math.random()
          .toString(36)
          .substring(2, 15)}`,
        tags: {
          Name: `${projectName}-bucket`,
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
