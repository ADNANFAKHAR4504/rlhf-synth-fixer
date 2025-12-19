# CDKTF TypeScript Implementation - Multi-Tier VPC Architecture

This implementation creates a complete multi-tier VPC infrastructure with proper network segmentation, security groups, monitoring, and high availability across two availability zones.

## File: lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { NetworkingConstruct } from './networking-construct';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// Override AWS Region to ca-central-1 for this task
const AWS_REGION_OVERRIDE = 'ca-central-1';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Create networking infrastructure
    const networking = new NetworkingConstruct(this, 'Networking', {
      environmentSuffix,
      region: awsRegion,
    });

    // Export outputs
    new TerraformOutput(this, 'VpcId', {
      value: networking.vpcId,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'PublicSubnetIds', {
      value: networking.publicSubnetIds,
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'PrivateSubnetIds', {
      value: networking.privateSubnetIds,
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'IsolatedSubnetIds', {
      value: networking.isolatedSubnetIds,
      description: 'Isolated subnet IDs',
    });

    new TerraformOutput(this, 'WebSecurityGroupId', {
      value: networking.webSecurityGroupId,
      description: 'Web tier security group ID',
    });

    new TerraformOutput(this, 'AppSecurityGroupId', {
      value: networking.appSecurityGroupId,
      description: 'App tier security group ID',
    });

    new TerraformOutput(this, 'DatabaseSecurityGroupId', {
      value: networking.databaseSecurityGroupId,
      description: 'Database tier security group ID',
    });
  }
}
```

## File: lib/networking-construct.ts

```typescript
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { VpcEndpoint } from '@cdktf/provider-aws/lib/vpc-endpoint';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

export interface NetworkingConstructProps {
  environmentSuffix: string;
  region: string;
}

export class NetworkingConstruct extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetIds: string[];
  public readonly isolatedSubnetIds: string[];
  public readonly webSecurityGroupId: string;
  public readonly appSecurityGroupId: string;
  public readonly databaseSecurityGroupId: string;

  constructor(scope: Construct, id: string, props: NetworkingConstructProps) {
    super(scope, id);

    const { environmentSuffix, region } = props;

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, 'AZs', {
      state: 'available',
    });

    // Create VPC
    const vpc = new Vpc(this, 'VPC', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `payment-platform-vpc-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-platform',
      },
    });

    this.vpcId = vpc.id;

    // Create public subnets
    const publicSubnet1 = new Subnet(this, 'PublicSubnet1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `${region}a`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `payment-platform-public-subnet-${region}a-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-platform',
        Tier: 'public',
      },
    });

    const publicSubnet2 = new Subnet(this, 'PublicSubnet2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `${region}b`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `payment-platform-public-subnet-${region}b-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-platform',
        Tier: 'public',
      },
    });

    this.publicSubnetIds = [publicSubnet1.id, publicSubnet2.id];

    // Create private subnets
    const privateSubnet1 = new Subnet(this, 'PrivateSubnet1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: `${region}a`,
      tags: {
        Name: `payment-platform-private-subnet-${region}a-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-platform',
        Tier: 'private',
      },
    });

    const privateSubnet2 = new Subnet(this, 'PrivateSubnet2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.12.0/24',
      availabilityZone: `${region}b`,
      tags: {
        Name: `payment-platform-private-subnet-${region}b-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-platform',
        Tier: 'private',
      },
    });

    this.privateSubnetIds = [privateSubnet1.id, privateSubnet2.id];

    // Create isolated subnets
    const isolatedSubnet1 = new Subnet(this, 'IsolatedSubnet1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.21.0/24',
      availabilityZone: `${region}a`,
      tags: {
        Name: `payment-platform-isolated-subnet-${region}a-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-platform',
        Tier: 'isolated',
      },
    });

    const isolatedSubnet2 = new Subnet(this, 'IsolatedSubnet2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.22.0/24',
      availabilityZone: `${region}b`,
      tags: {
        Name: `payment-platform-isolated-subnet-${region}b-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-platform',
        Tier: 'isolated',
      },
    });

    this.isolatedSubnetIds = [isolatedSubnet1.id, isolatedSubnet2.id];

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'IGW', {
      vpcId: vpc.id,
      tags: {
        Name: `payment-platform-igw-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-platform',
      },
    });

    // Create Elastic IPs for NAT Gateways
    const eip1 = new Eip(this, 'EIP1', {
      domain: 'vpc',
      tags: {
        Name: `payment-platform-eip-${region}a-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-platform',
      },
    });

    const eip2 = new Eip(this, 'EIP2', {
      domain: 'vpc',
      tags: {
        Name: `payment-platform-eip-${region}b-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-platform',
      },
    });

    // Create NAT Gateways
    const natGw1 = new NatGateway(this, 'NATGateway1', {
      allocationId: eip1.id,
      subnetId: publicSubnet1.id,
      tags: {
        Name: `payment-platform-nat-${region}a-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-platform',
      },
    });

    const natGw2 = new NatGateway(this, 'NATGateway2', {
      allocationId: eip2.id,
      subnetId: publicSubnet2.id,
      tags: {
        Name: `payment-platform-nat-${region}b-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-platform',
      },
    });

    // Create public route table
    const publicRouteTable = new RouteTable(this, 'PublicRouteTable', {
      vpcId: vpc.id,
      tags: {
        Name: `payment-platform-public-rt-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-platform',
      },
    });

    new Route(this, 'PublicRoute', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    new RouteTableAssociation(this, 'PublicSubnet1Association', {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'PublicSubnet2Association', {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    });

    // Create private route table 1
    const privateRouteTable1 = new RouteTable(this, 'PrivateRouteTable1', {
      vpcId: vpc.id,
      tags: {
        Name: `payment-platform-private-rt-${region}a-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-platform',
      },
    });

    new Route(this, 'PrivateRoute1', {
      routeTableId: privateRouteTable1.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGw1.id,
    });

    new RouteTableAssociation(this, 'PrivateSubnet1Association', {
      subnetId: privateSubnet1.id,
      routeTableId: privateRouteTable1.id,
    });

    // Create private route table 2
    const privateRouteTable2 = new RouteTable(this, 'PrivateRouteTable2', {
      vpcId: vpc.id,
      tags: {
        Name: `payment-platform-private-rt-${region}b-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-platform',
      },
    });

    new Route(this, 'PrivateRoute2', {
      routeTableId: privateRouteTable2.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGw2.id,
    });

    new RouteTableAssociation(this, 'PrivateSubnet2Association', {
      subnetId: privateSubnet2.id,
      routeTableId: privateRouteTable2.id,
    });

    // Create isolated route table
    const isolatedRouteTable = new RouteTable(this, 'IsolatedRouteTable', {
      vpcId: vpc.id,
      tags: {
        Name: `payment-platform-isolated-rt-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-platform',
      },
    });

    new RouteTableAssociation(this, 'IsolatedSubnet1Association', {
      subnetId: isolatedSubnet1.id,
      routeTableId: isolatedRouteTable.id,
    });

    new RouteTableAssociation(this, 'IsolatedSubnet2Association', {
      subnetId: isolatedSubnet2.id,
      routeTableId: isolatedRouteTable.id,
    });

    // Create S3 bucket for VPC Flow Logs
    const flowLogsBucket = new S3Bucket(this, 'FlowLogsBucket', {
      bucket: `payment-platform-flowlogs-${environmentSuffix}`,
      tags: {
        Name: `payment-platform-flowlogs-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-platform',
      },
    });

    // Block public access
    new S3BucketPublicAccessBlock(this, 'FlowLogsBucketPublicAccessBlock', {
      bucket: flowLogsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Configure lifecycle policy for 7-day retention
    new S3BucketLifecycleConfiguration(this, 'FlowLogsBucketLifecycle', {
      bucket: flowLogsBucket.id,
      rule: [
        {
          id: 'delete-after-7-days',
          status: 'Enabled',
          expiration: {
            days: 7,
          },
        },
      ],
    });

    // Create VPC Flow Log
    new FlowLog(this, 'VPCFlowLog', {
      vpcId: vpc.id,
      trafficType: 'ALL',
      logDestinationType: 's3',
      logDestination: `arn:aws:s3:::${flowLogsBucket.bucket}`,
      tags: {
        Name: `payment-platform-flowlog-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-platform',
      },
    });

    // Create security groups
    const webSecurityGroup = new SecurityGroup(this, 'WebSecurityGroup', {
      vpcId: vpc.id,
      name: `payment-platform-web-sg-${environmentSuffix}`,
      description: 'Security group for web tier - allows HTTPS traffic',
      tags: {
        Name: `payment-platform-web-sg-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-platform',
      },
    });

    new SecurityGroupRule(this, 'WebIngressHTTPS', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: webSecurityGroup.id,
      description: 'Allow HTTPS inbound',
    });

    new SecurityGroupRule(this, 'WebEgressAll', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: webSecurityGroup.id,
      description: 'Allow all outbound',
    });

    this.webSecurityGroupId = webSecurityGroup.id;

    const appSecurityGroup = new SecurityGroup(this, 'AppSecurityGroup', {
      vpcId: vpc.id,
      name: `payment-platform-app-sg-${environmentSuffix}`,
      description: 'Security group for app tier - allows traffic on port 8080',
      tags: {
        Name: `payment-platform-app-sg-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-platform',
      },
    });

    new SecurityGroupRule(this, 'AppIngress8080', {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: webSecurityGroup.id,
      securityGroupId: appSecurityGroup.id,
      description: 'Allow traffic from web tier on port 8080',
    });

    new SecurityGroupRule(this, 'AppEgressAll', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: appSecurityGroup.id,
      description: 'Allow all outbound',
    });

    this.appSecurityGroupId = appSecurityGroup.id;

    const dbSecurityGroup = new SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpcId: vpc.id,
      name: `payment-platform-db-sg-${environmentSuffix}`,
      description: 'Security group for database tier - allows PostgreSQL traffic',
      tags: {
        Name: `payment-platform-db-sg-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-platform',
      },
    });

    new SecurityGroupRule(this, 'DatabaseIngress5432', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: appSecurityGroup.id,
      securityGroupId: dbSecurityGroup.id,
      description: 'Allow PostgreSQL traffic from app tier',
    });

    new SecurityGroupRule(this, 'DatabaseEgressAll', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: dbSecurityGroup.id,
      description: 'Allow all outbound',
    });

    this.databaseSecurityGroupId = dbSecurityGroup.id;

    // Create security group for VPC endpoint
    const endpointSecurityGroup = new SecurityGroup(
      this,
      'EndpointSecurityGroup',
      {
        vpcId: vpc.id,
        name: `payment-platform-endpoint-sg-${environmentSuffix}`,
        description: 'Security group for VPC endpoints',
        tags: {
          Name: `payment-platform-endpoint-sg-${environmentSuffix}`,
          Environment: 'production',
          Project: 'payment-platform',
        },
      }
    );

    new SecurityGroupRule(this, 'EndpointIngressHTTPS', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: [vpc.cidrBlock],
      securityGroupId: endpointSecurityGroup.id,
      description: 'Allow HTTPS from VPC',
    });

    // Create Systems Manager VPC endpoint in private subnets
    new VpcEndpoint(this, 'SSMEndpoint', {
      vpcId: vpc.id,
      serviceName: `com.amazonaws.${region}.ssm`,
      vpcEndpointType: 'Interface',
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      securityGroupIds: [endpointSecurityGroup.id],
      privateDnsEnabled: true,
      tags: {
        Name: `payment-platform-ssm-endpoint-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-platform',
      },
    });
  }
}
```

## Implementation Summary

This CDKTF TypeScript implementation provides:

1. **VPC Foundation**: VPC with 10.0.0.0/16 CIDR in ca-central-1
2. **Network Segmentation**: 6 subnets across 2 AZs (public, private, isolated)
3. **High Availability**: NAT Gateways in each AZ for redundancy
4. **Internet Connectivity**: Internet Gateway for public subnets, NAT Gateways for private subnet outbound
5. **Routing**: Separate route tables for each tier with appropriate routes
6. **Security**: Three security groups with least privilege rules following the tier pattern
7. **Monitoring**: VPC Flow Logs capturing all traffic to S3 with 7-day retention
8. **VPC Endpoints**: Systems Manager endpoint in private subnets
9. **Tagging**: All resources tagged with Environment and Project
10. **Outputs**: VPC ID, all subnet IDs, and security group IDs exported

The code is well-structured using a separate NetworkingConstruct to encapsulate all networking resources, making it maintainable and testable.
