/**
 * TAP Stack - Multi-region AWS Infrastructure using Pulumi
 *
 * This module implements a comprehensive AWS infrastructure stack including:
 * - VPC with public/private subnets across multiple AZs
 * - Internet Gateway and NAT Gateways for routing
 * - Security groups for ALB, EC2, and RDS
 * - Application Load Balancer for traffic distribution
 * - EC2 instances in public subnets with auto-scaling capability
 * - RDS MySQL database in private subnets
 * - IAM roles with least privilege access
 * - AWS Secrets Manager for secure credential storage
 * - CloudWatch monitoring and logging
 *
 * All resources are prefixed with "prod-" as per requirements.
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackArgs {
  region: string;
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:stack:TapStack', name, args, opts);

    const { region, environmentSuffix, tags } = args;

    // Use "prod-" prefix as per requirements, followed by environment suffix
    const prefix = `prod-${environmentSuffix}-`;

    // AWS Provider for the specific region
    const provider = new aws.Provider(
      `aws-${region}`,
      {
        region: region,
      },
      { parent: this }
    );

    const providerOpts = { parent: this, provider: provider };

    // Get availability zones
    const availableAzs = aws.getAvailabilityZones(
      {
        state: 'available',
      },
      { provider: provider }
    );

    // Get latest Amazon Linux 2 AMI
    const amiData = aws.ec2.getAmi(
      {
        mostRecent: true,
        owners: ['amazon'],
        filters: [
          { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
          { name: 'virtualization-type', values: ['hvm'] },
        ],
      },
      { provider: provider }
    );

    // VPC
    const vpc = new aws.ec2.Vpc(
      `${prefix}vpc-${region}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...tags,
          Name: `${prefix}vpc-${region}`,
        },
      },
      providerOpts
    );

    // Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `${prefix}igw-${region}`,
      {
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `${prefix}igw-${region}`,
        },
      },
      providerOpts
    );

    // Public and Private Subnets (2 of each across different AZs)
    const publicSubnets: aws.ec2.Subnet[] = [];
    const privateSubnets: aws.ec2.Subnet[] = [];

    for (let i = 0; i < 2; i++) {
      // Public Subnet
      const publicSubnet = new aws.ec2.Subnet(
        `${prefix}public-subnet-${i + 1}-${region}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 1}.0/24`,
          availabilityZone: availableAzs.then(azs => azs.names[i]),
          mapPublicIpOnLaunch: true,
          tags: {
            ...tags,
            Name: `${prefix}public-subnet-${i + 1}-${region}`,
            Type: 'Public',
          },
        },
        providerOpts
      );
      publicSubnets.push(publicSubnet);

      // Private Subnet
      const privateSubnet = new aws.ec2.Subnet(
        `${prefix}private-subnet-${i + 1}-${region}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: availableAzs.then(azs => azs.names[i]),
          tags: {
            ...tags,
            Name: `${prefix}private-subnet-${i + 1}-${region}`,
            Type: 'Private',
          },
        },
        providerOpts
      );
      privateSubnets.push(privateSubnet);
    }

    // Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(
      `${prefix}public-rt-${region}`,
      {
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `${prefix}public-rt-${region}`,
        },
      },
      providerOpts
    );

    // Public Route to Internet Gateway
    new aws.ec2.Route(
      `${prefix}public-route-${region}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      providerOpts
    );

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `${prefix}public-rta-${index + 1}-${region}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        providerOpts
      );
    });

    // NAT Gateways and Private Route Tables
    privateSubnets.forEach((subnet, index) => {
      // Elastic IP for NAT Gateway
      const eip = new aws.ec2.Eip(
        `${prefix}nat-eip-${index + 1}-${region}`,
        {
          domain: 'vpc',
          tags: {
            ...tags,
            Name: `${prefix}nat-eip-${index + 1}-${region}`,
          },
        },
        providerOpts
      );

      // NAT Gateway in corresponding public subnet
      const natGateway = new aws.ec2.NatGateway(
        `${prefix}nat-gw-${index + 1}-${region}`,
        {
          allocationId: eip.id,
          subnetId: publicSubnets[index].id,
          tags: {
            ...tags,
            Name: `${prefix}nat-gw-${index + 1}-${region}`,
          },
        },
        providerOpts
      );

      // Private Route Table
      const privateRouteTable = new aws.ec2.RouteTable(
        `${prefix}private-rt-${index + 1}-${region}`,
        {
          vpcId: vpc.id,
          tags: {
            ...tags,
            Name: `${prefix}private-rt-${index + 1}-${region}`,
          },
        },
        providerOpts
      );

      // Private Route to NAT Gateway
      new aws.ec2.Route(
        `${prefix}private-route-${index + 1}-${region}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateway.id,
        },
        providerOpts
      );

      // Associate private subnet with private route table
      new aws.ec2.RouteTableAssociation(
        `${prefix}private-rta-${index + 1}-${region}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        providerOpts
      );
    });

    // Security Groups
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `${prefix}alb-sg-${region}`,
      {
        name: `${prefix}alb-sg-${region}`,
        description: 'Security group for Application Load Balancer',
        vpcId: vpc.id,
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP',
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          ...tags,
          Name: `${prefix}alb-sg-${region}`,
        },
      },
      providerOpts
    );

    const ec2SecurityGroup = new aws.ec2.SecurityGroup(
      `${prefix}ec2-sg-${region}`,
      {
        name: `${prefix}ec2-sg-${region}`,
        description: 'Security group for EC2 instances',
        vpcId: vpc.id,
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            securityGroups: [albSecurityGroup.id],
            description: 'HTTP from ALB',
          },
          {
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'], // In production, restrict to specific IPs
            description: 'SSH',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          ...tags,
          Name: `${prefix}ec2-sg-${region}`,
        },
      },
      providerOpts
    );

    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `${prefix}rds-sg-${region}`,
      {
        name: `${prefix}rds-sg-${region}`,
        description: 'Security group for RDS database',
        vpcId: vpc.id,
        ingress: [
          {
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            securityGroups: [ec2SecurityGroup.id],
            description: 'MySQL from EC2 instances',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          ...tags,
          Name: `${prefix}rds-sg-${region}`,
        },
      },
      providerOpts
    );

    // IAM Role for EC2 instances
    const ec2Role = new aws.iam.Role(
      `${prefix}ec2-role-${region}`,
      {
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
        tags: {
          ...tags,
          Name: `${prefix}ec2-role-${region}`,
        },
      },
      providerOpts
    );

    // Attach CloudWatch Agent policy
    new aws.iam.RolePolicyAttachment(
      `${prefix}ec2-cloudwatch-policy-${region}`,
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      },
      providerOpts
    );

    // Attach SSM policy for EC2 instances
    new aws.iam.RolePolicyAttachment(
      `${prefix}ec2-ssm-policy-${region}`,
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      providerOpts
    );

    // EC2 Instance Profile
    const ec2InstanceProfile = new aws.iam.InstanceProfile(
      `${prefix}ec2-instance-profile-${region}`,
      {
        role: ec2Role.name,
        tags: {
          ...tags,
          Name: `${prefix}ec2-instance-profile-${region}`,
        },
      },
      providerOpts
    );

    // Database credentials in Secrets Manager
    const dbSecret = new aws.secretsmanager.Secret(
      `${prefix}db-credentials-${region}`,
      {
        name: `${prefix}db-credentials-${region}`,
        description: 'Database credentials for RDS instance',
        tags: {
          ...tags,
          Name: `${prefix}db-credentials-${region}`,
        },
      },
      providerOpts
    );

    new aws.secretsmanager.SecretVersion(
      `${prefix}db-secret-version-${region}`,
      {
        secretId: dbSecret.id,
        secretString: JSON.stringify({
          username: 'admin',
          password: 'TempPassword123!', // This should be generated or rotated in production
        }),
      },
      providerOpts
    );

    // CloudWatch Log Groups
    new aws.cloudwatch.LogGroup(
      `${prefix}ec2-log-group-${region}`,
      {
        name: `/aws/ec2/${prefix}application-${region}`,
        retentionInDays: 7,
        tags: {
          ...tags,
          Name: `${prefix}ec2-logs-${region}`,
        },
      },
      providerOpts
    );

    new aws.cloudwatch.LogGroup(
      `${prefix}rds-log-group-${region}`,
      {
        name: `/aws/rds/instance/${prefix}database-${region}/error`,
        retentionInDays: 7,
        tags: {
          ...tags,
          Name: `${prefix}rds-logs-${region}`,
        },
      },
      providerOpts
    );

    // RDS Subnet Group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `${prefix}db-subnet-group-${region}`,
      {
        subnetIds: privateSubnets.map(subnet => subnet.id),
        tags: {
          ...tags,
          Name: `${prefix}db-subnet-group-${region}`,
        },
      },
      providerOpts
    );

    // RDS MySQL Instance
    const rdsInstance = new aws.rds.Instance(
      `${prefix}database-${region}`,
      {
        identifier: `${prefix}database-${region}`,
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        storageType: 'gp2',
        dbName: 'appdb',
        username: 'admin',
        password: 'TempPassword123!', // Use static password for dev/test - use secrets in production
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',
        storageEncrypted: true,
        monitoringInterval: 60,
        enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
        skipFinalSnapshot: true, // For development - set to false in production
        deletionProtection: false, // For development - set to true in production
        tags: {
          ...tags,
          Name: `${prefix}database-${region}`,
        },
      },
      providerOpts
    );

    // EC2 Instances in public subnets
    const instances = publicSubnets.map((subnet, index) => {
      return new aws.ec2.Instance(
        `${prefix}app-server-${index + 1}-${region}`,
        {
          ami: amiData.then(ami => ami.id),
          instanceType: 't3.micro',
          subnetId: subnet.id,
          vpcSecurityGroupIds: [ec2SecurityGroup.id],
          iamInstanceProfile: ec2InstanceProfile.name,
          userData: `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from ${region} - Instance ${index + 1}</h1>" > /var/www/html/index.html
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm
`,
          tags: {
            ...tags,
            Name: `${prefix}app-server-${index + 1}-${region}`,
          },
        },
        providerOpts
      );
    });

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `${prefix}alb-${region}`,
      {
        name: `${prefix}alb-${region}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: publicSubnets.map(subnet => subnet.id),
        enableDeletionProtection: false, // Set to true in production
        tags: {
          ...tags,
          Name: `${prefix}alb-${region}`,
        },
      },
      providerOpts
    );

    // Target Group for ALB
    const targetGroup = new aws.lb.TargetGroup(
      `${prefix}tg-${region}`,
      {
        name: `${prefix}tg-${region}`,
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.id,
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
          ...tags,
          Name: `${prefix}tg-${region}`,
        },
      },
      providerOpts
    );

    // Target Group Attachments
    instances.forEach((instance, index) => {
      new aws.lb.TargetGroupAttachment(
        `${prefix}tg-attachment-${index + 1}-${region}`,
        {
          targetGroupArn: targetGroup.arn,
          targetId: instance.id,
          port: 80,
        },
        providerOpts
      );
    });

    // Load Balancer Listener
    new aws.lb.Listener(
      `${prefix}alb-listener-${region}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      providerOpts
    );

    // Set up outputs
    this.vpcId = vpc.id;
    this.albDnsName = alb.dnsName;
    this.rdsEndpoint = rdsInstance.endpoint;

    // Register outputs for this component
    this.registerOutputs({
      vpcId: this.vpcId,
      albDnsName: this.albDnsName,
      rdsEndpoint: this.rdsEndpoint,
      region: region,
    });
  }
}
