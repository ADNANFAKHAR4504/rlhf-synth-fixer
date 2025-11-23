# Pulumi TypeScript Implementation - Three-Tier AWS Environment

This implementation provides a production-ready three-tier AWS environment for a fintech payment processing application with proper network segmentation, security controls, and compliance features.

## File: lib/tap-stack.ts

```typescript
/**
 * TapStack - Three-tier AWS environment for payment processing application
 *
 * This stack creates a production-ready infrastructure with:
 * - VPC with public, private, and database subnets across 2 AZs
 * - Internet Gateway and NAT Gateways for connectivity
 * - Security groups for web, app, and database tiers
 * - EC2 instances with IMDSv2 enforcement
 * - RDS subnet group for database tier
 * - S3 bucket with versioning
 * - VPC flow logs with CloudWatch integration
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackProps {
  tags?: { [key: string]: string };
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly databaseSubnetIds: pulumi.Output<string[]>;
  public readonly webSecurityGroupId: pulumi.Output<string>;
  public readonly appSecurityGroupId: pulumi.Output<string>;
  public readonly dbSecurityGroupId: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;

  constructor(name: string, props: TapStackProps = {}, opts?: pulumi.ComponentResourceOptions) {
    super('custom:infrastructure:TapStack', name, {}, opts);

    // Get environment suffix from environment variable or config
    const config = new pulumi.Config();
    const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

    // Get current AWS region
    const currentRegion = aws.getRegionOutput({});

    // Get availability zones for the region
    const availabilityZones = aws.getAvailabilityZonesOutput({
      state: 'available',
    });

    // Merge default tags with provided tags
    const defaultTags = {
      Environment: 'Production',
      Project: 'PaymentApp',
      ManagedBy: 'Pulumi',
      ...props.tags,
    };

    // Create VPC
    const vpc = new aws.ec2.Vpc(`payment-vpc-${environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...defaultTags,
        Name: `payment-vpc-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(`payment-igw-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        ...defaultTags,
        Name: `payment-igw-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create public subnets (2 AZs)
    const publicSubnet1 = new aws.ec2.Subnet(`payment-public-subnet-1-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: availabilityZones.names[0],
      mapPublicIpOnLaunch: true,
      tags: {
        ...defaultTags,
        Name: `payment-public-subnet-1-${environmentSuffix}`,
        Tier: 'Public',
      },
    }, { parent: this });

    const publicSubnet2 = new aws.ec2.Subnet(`payment-public-subnet-2-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: availabilityZones.names[1],
      mapPublicIpOnLaunch: true,
      tags: {
        ...defaultTags,
        Name: `payment-public-subnet-2-${environmentSuffix}`,
        Tier: 'Public',
      },
    }, { parent: this });

    // Create private subnets (2 AZs)
    const privateSubnet1 = new aws.ec2.Subnet(`payment-private-subnet-1-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: availabilityZones.names[0],
      tags: {
        ...defaultTags,
        Name: `payment-private-subnet-1-${environmentSuffix}`,
        Tier: 'Private',
      },
    }, { parent: this });

    const privateSubnet2 = new aws.ec2.Subnet(`payment-private-subnet-2-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.12.0/24',
      availabilityZone: availabilityZones.names[1],
      tags: {
        ...defaultTags,
        Name: `payment-private-subnet-2-${environmentSuffix}`,
        Tier: 'Private',
      },
    }, { parent: this });

    // Create database subnets (2 AZs)
    const databaseSubnet1 = new aws.ec2.Subnet(`payment-db-subnet-1-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.21.0/24',
      availabilityZone: availabilityZones.names[0],
      tags: {
        ...defaultTags,
        Name: `payment-db-subnet-1-${environmentSuffix}`,
        Tier: 'Database',
      },
    }, { parent: this });

    const databaseSubnet2 = new aws.ec2.Subnet(`payment-db-subnet-2-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.22.0/24',
      availabilityZone: availabilityZones.names[1],
      tags: {
        ...defaultTags,
        Name: `payment-db-subnet-2-${environmentSuffix}`,
        Tier: 'Database',
      },
    }, { parent: this });

    // Create Elastic IPs for NAT Gateways
    const eip1 = new aws.ec2.Eip(`payment-nat-eip-1-${environmentSuffix}`, {
      domain: 'vpc',
      tags: {
        ...defaultTags,
        Name: `payment-nat-eip-1-${environmentSuffix}`,
      },
    }, { parent: this, dependsOn: [internetGateway] });

    const eip2 = new aws.ec2.Eip(`payment-nat-eip-2-${environmentSuffix}`, {
      domain: 'vpc',
      tags: {
        ...defaultTags,
        Name: `payment-nat-eip-2-${environmentSuffix}`,
      },
    }, { parent: this, dependsOn: [internetGateway] });

    // Create NAT Gateways in public subnets
    const natGateway1 = new aws.ec2.NatGateway(`payment-nat-gw-1-${environmentSuffix}`, {
      subnetId: publicSubnet1.id,
      allocationId: eip1.id,
      tags: {
        ...defaultTags,
        Name: `payment-nat-gw-1-${environmentSuffix}`,
      },
    }, { parent: this });

    const natGateway2 = new aws.ec2.NatGateway(`payment-nat-gw-2-${environmentSuffix}`, {
      subnetId: publicSubnet2.id,
      allocationId: eip2.id,
      tags: {
        ...defaultTags,
        Name: `payment-nat-gw-2-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create route table for public subnets
    const publicRouteTable = new aws.ec2.RouteTable(`payment-public-rt-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        ...defaultTags,
        Name: `payment-public-rt-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create route to Internet Gateway
    new aws.ec2.Route(`payment-public-route-${environmentSuffix}`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.id,
    }, { parent: this });

    // Associate public subnets with public route table
    new aws.ec2.RouteTableAssociation(`payment-public-rta-1-${environmentSuffix}`, {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    }, { parent: this });

    new aws.ec2.RouteTableAssociation(`payment-public-rta-2-${environmentSuffix}`, {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    }, { parent: this });

    // Create route table for private subnet 1
    const privateRouteTable1 = new aws.ec2.RouteTable(`payment-private-rt-1-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        ...defaultTags,
        Name: `payment-private-rt-1-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create route to NAT Gateway 1
    new aws.ec2.Route(`payment-private-route-1-${environmentSuffix}`, {
      routeTableId: privateRouteTable1.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway1.id,
    }, { parent: this });

    // Associate private subnet 1 with private route table 1
    new aws.ec2.RouteTableAssociation(`payment-private-rta-1-${environmentSuffix}`, {
      subnetId: privateSubnet1.id,
      routeTableId: privateRouteTable1.id,
    }, { parent: this });

    // Create route table for private subnet 2
    const privateRouteTable2 = new aws.ec2.RouteTable(`payment-private-rt-2-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        ...defaultTags,
        Name: `payment-private-rt-2-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create route to NAT Gateway 2
    new aws.ec2.Route(`payment-private-route-2-${environmentSuffix}`, {
      routeTableId: privateRouteTable2.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway2.id,
    }, { parent: this });

    // Associate private subnet 2 with private route table 2
    new aws.ec2.RouteTableAssociation(`payment-private-rta-2-${environmentSuffix}`, {
      subnetId: privateSubnet2.id,
      routeTableId: privateRouteTable2.id,
    }, { parent: this });

    // Create route table for database subnets
    const databaseRouteTable = new aws.ec2.RouteTable(`payment-db-rt-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        ...defaultTags,
        Name: `payment-db-rt-${environmentSuffix}`,
      },
    }, { parent: this });

    // Associate database subnets with database route table
    new aws.ec2.RouteTableAssociation(`payment-db-rta-1-${environmentSuffix}`, {
      subnetId: databaseSubnet1.id,
      routeTableId: databaseRouteTable.id,
    }, { parent: this });

    new aws.ec2.RouteTableAssociation(`payment-db-rta-2-${environmentSuffix}`, {
      subnetId: databaseSubnet2.id,
      routeTableId: databaseRouteTable.id,
    }, { parent: this });

    // Create security group for web tier
    const webSecurityGroup = new aws.ec2.SecurityGroup(`payment-web-sg-${environmentSuffix}`, {
      vpcId: vpc.id,
      description: 'Security group for web tier - allows HTTP/HTTPS from internet',
      ingress: [
        {
          description: 'Allow HTTP traffic from internet',
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
        {
          description: 'Allow HTTPS traffic from internet',
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        {
          description: 'Allow all outbound traffic',
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: {
        ...defaultTags,
        Name: `payment-web-sg-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create security group for application tier
    const appSecurityGroup = new aws.ec2.SecurityGroup(`payment-app-sg-${environmentSuffix}`, {
      vpcId: vpc.id,
      description: 'Security group for application tier - allows traffic from web tier',
      egress: [
        {
          description: 'Allow all outbound traffic',
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: {
        ...defaultTags,
        Name: `payment-app-sg-${environmentSuffix}`,
      },
    }, { parent: this });

    // Add ingress rule for app tier from web tier
    new aws.ec2.SecurityGroupRule(`payment-app-ingress-from-web-${environmentSuffix}`, {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: webSecurityGroup.id,
      securityGroupId: appSecurityGroup.id,
      description: 'Allow traffic from web tier on port 8080',
    }, { parent: this });

    // Create security group for database tier
    const dbSecurityGroup = new aws.ec2.SecurityGroup(`payment-db-sg-${environmentSuffix}`, {
      vpcId: vpc.id,
      description: 'Security group for database tier - allows traffic from application tier',
      egress: [
        {
          description: 'Allow all outbound traffic',
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: {
        ...defaultTags,
        Name: `payment-db-sg-${environmentSuffix}`,
      },
    }, { parent: this });

    // Add ingress rule for database tier from app tier
    new aws.ec2.SecurityGroupRule(`payment-db-ingress-from-app-${environmentSuffix}`, {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: appSecurityGroup.id,
      securityGroupId: dbSecurityGroup.id,
      description: 'Allow PostgreSQL traffic from application tier',
    }, { parent: this });

    // Get latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmiOutput({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'state',
          values: ['available'],
        },
      ],
    });

    // Create EC2 instance in public subnet 1 with IMDSv2
    const webInstance1 = new aws.ec2.Instance(`payment-web-instance-1-${environmentSuffix}`, {
      ami: ami.id,
      instanceType: 't3.micro',
      subnetId: publicSubnet1.id,
      vpcSecurityGroupIds: [webSecurityGroup.id],
      metadataOptions: {
        httpEndpoint: 'enabled',
        httpTokens: 'required', // Enforce IMDSv2
        httpPutResponseHopLimit: 1,
      },
      tags: {
        ...defaultTags,
        Name: `payment-web-instance-1-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create EC2 instance in public subnet 2 with IMDSv2
    const webInstance2 = new aws.ec2.Instance(`payment-web-instance-2-${environmentSuffix}`, {
      ami: ami.id,
      instanceType: 't3.micro',
      subnetId: publicSubnet2.id,
      vpcSecurityGroupIds: [webSecurityGroup.id],
      metadataOptions: {
        httpEndpoint: 'enabled',
        httpTokens: 'required', // Enforce IMDSv2
        httpPutResponseHopLimit: 1,
      },
      tags: {
        ...defaultTags,
        Name: `payment-web-instance-2-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create RDS subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(`payment-db-subnet-group-${environmentSuffix}`, {
      subnetIds: [databaseSubnet1.id, databaseSubnet2.id],
      description: 'Subnet group for RDS database instances',
      tags: {
        ...defaultTags,
        Name: `payment-db-subnet-group-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create S3 bucket with versioning
    const bucket = new aws.s3.Bucket(`payment-data-${environmentSuffix}`, {
      bucketPrefix: `payment-data-${environmentSuffix}-`,
      versioning: {
        enabled: true,
      },
      tags: {
        ...defaultTags,
        Name: `payment-data-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create IAM role for VPC Flow Logs
    const flowLogsRole = new aws.iam.Role(`payment-flow-logs-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        ...defaultTags,
        Name: `payment-flow-logs-role-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create IAM policy for VPC Flow Logs
    const flowLogsPolicy = new aws.iam.RolePolicy(`payment-flow-logs-policy-${environmentSuffix}`, {
      role: flowLogsRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
            ],
            Resource: '*',
          },
        ],
      }),
    }, { parent: this });

    // Create CloudWatch Log Group for VPC Flow Logs
    const flowLogsLogGroup = new aws.cloudwatch.LogGroup(`payment-vpc-flow-logs-${environmentSuffix}`, {
      retentionInDays: 7,
      tags: {
        ...defaultTags,
        Name: `payment-vpc-flow-logs-${environmentSuffix}`,
      },
    }, { parent: this });

    // Create VPC Flow Logs
    const flowLog = new aws.ec2.FlowLog(`payment-vpc-flow-log-${environmentSuffix}`, {
      vpcId: vpc.id,
      trafficType: 'ALL',
      logDestinationType: 'cloud-watch-logs',
      logDestination: flowLogsLogGroup.arn,
      iamRoleArn: flowLogsRole.arn,
      tags: {
        ...defaultTags,
        Name: `payment-vpc-flow-log-${environmentSuffix}`,
      },
    }, { parent: this, dependsOn: [flowLogsPolicy] });

    // Export outputs
    this.vpcId = vpc.id;
    this.publicSubnetIds = pulumi.output([publicSubnet1.id, publicSubnet2.id]);
    this.privateSubnetIds = pulumi.output([privateSubnet1.id, privateSubnet2.id]);
    this.databaseSubnetIds = pulumi.output([databaseSubnet1.id, databaseSubnet2.id]);
    this.webSecurityGroupId = webSecurityGroup.id;
    this.appSecurityGroupId = appSecurityGroup.id;
    this.dbSecurityGroupId = dbSecurityGroup.id;
    this.s3BucketName = bucket.id;

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      databaseSubnetIds: this.databaseSubnetIds,
      webSecurityGroupId: this.webSecurityGroupId,
      appSecurityGroupId: this.appSecurityGroupId,
      dbSecurityGroupId: this.dbSecurityGroupId,
      s3BucketName: this.s3BucketName,
    });
  }
}
```

## File: bin/tap.ts

```typescript
/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
 * configuration based on the deployment environment. It handles environment-specific settings,
 * tagging, and deployment configuration for AWS resources.
 *
 * The stack created by this module uses environment suffixes to distinguish between
 * different deployment environments (development, staging, production, etc.).
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack.
const config = new pulumi.Config();

// Get the environment suffix from the CI, Pulumi config, defaulting to 'dev'.
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Get metadata from environment variables for tagging purposes.
// These are often injected by CI/CD systems.
const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

// Define a set of default tags to apply to all resources.
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Instantiate the main stack component for the infrastructure.
const stack = new TapStack('pulumi-infra', {
  tags: defaultTags,
});

// Export stack outputs
export const vpcId = stack.vpcId;
export const publicSubnetIds = stack.publicSubnetIds;
export const privateSubnetIds = stack.privateSubnetIds;
export const databaseSubnetIds = stack.databaseSubnetIds;
export const webSecurityGroupId = stack.webSecurityGroupId;
export const appSecurityGroupId = stack.appSecurityGroupId;
export const dbSecurityGroupId = stack.dbSecurityGroupId;
export const s3BucketName = stack.s3BucketName;
```

## Implementation Summary

This Pulumi TypeScript implementation provides:

1. **VPC Infrastructure**: Complete three-tier network architecture with public, private, and database subnets across 2 availability zones
2. **Connectivity**: Internet Gateway for public access and NAT Gateways in each AZ for private subnet outbound connectivity
3. **Security**: Three security groups with proper ingress/egress rules and required descriptions for compliance
4. **Compute**: EC2 instances with IMDSv2 enforcement for enhanced security
5. **Database**: RDS subnet group ready for database deployment
6. **Storage**: S3 bucket with versioning enabled
7. **Monitoring**: VPC flow logs configured to send to CloudWatch with proper IAM roles
8. **Tagging**: All resources tagged with Environment=Production and Project=PaymentApp
9. **Resource Naming**: All resources include environmentSuffix for environment isolation
10. **Outputs**: Stack exports all critical resource IDs for reference and integration

The implementation follows AWS best practices for network segmentation, security, and compliance while ensuring all resources are properly named and tagged for management.
