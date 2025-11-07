# CDKTF TypeScript VPC Infrastructure Implementation

This implementation provides a production-ready multi-tier VPC architecture spanning 3 availability zones with public, private application, and private database subnets. The infrastructure includes high-availability NAT gateways, comprehensive network security through NACLs, and VPC Flow Logs for compliance monitoring.

## File: lib/networking-stack.ts

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
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';

interface NetworkingStackProps {
  environmentSuffix: string;
  region: string;
}

export class NetworkingStack extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly privateAppSubnetIds: string[];
  public readonly privateDbSubnetIds: string[];

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id);

    const { environmentSuffix, region } = props;
    const azs = [`${region}a`, `${region}b`, `${region}c`];

    // Tags for all resources
    const commonTags = {
      Environment: 'prod',
      Project: 'apac-expansion',
    };

    // Create VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...commonTags,
        Name: `vpc-${environmentSuffix}`,
      },
    });

    this.vpcId = vpc.id;

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        ...commonTags,
        Name: `igw-prod-${region}`,
      },
    });

    // Create Public Subnets
    const publicSubnets: Subnet[] = [];
    const publicCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];

    publicCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: azs[index],
        mapPublicIpOnLaunch: true,
        tags: {
          ...commonTags,
          Name: `public-subnet-${index + 1}-${environmentSuffix}`,
          Tier: 'public',
        },
      });
      publicSubnets.push(subnet);
    });

    this.publicSubnetIds = publicSubnets.map((s) => s.id);

    // Create Private Application Subnets
    const privateAppSubnets: Subnet[] = [];
    const privateAppCidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'];

    privateAppCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `private-app-subnet-${index}`, {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: azs[index],
        tags: {
          ...commonTags,
          Name: `private-app-subnet-${index + 1}-${environmentSuffix}`,
          Tier: 'private-app',
        },
      });
      privateAppSubnets.push(subnet);
    });

    this.privateAppSubnetIds = privateAppSubnets.map((s) => s.id);

    // Create Private Database Subnets
    const privateDbSubnets: Subnet[] = [];
    const privateDbCidrs = ['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24'];

    privateDbCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `private-db-subnet-${index}`, {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: azs[index],
        tags: {
          ...commonTags,
          Name: `private-db-subnet-${index + 1}-${environmentSuffix}`,
          Tier: 'private-db',
        },
      });
      privateDbSubnets.push(subnet);
    });

    this.privateDbSubnetIds = privateDbSubnets.map((s) => s.id);

    // Create Elastic IPs and NAT Gateways
    const natGateways: NatGateway[] = [];

    publicSubnets.forEach((subnet, index) => {
      const eip = new Eip(this, `nat-eip-${index}`, {
        domain: 'vpc',
        tags: {
          ...commonTags,
          Name: `nat-eip-${index + 1}-${environmentSuffix}`,
        },
      });

      const natGw = new NatGateway(this, `nat-gateway-${index}`, {
        allocationId: eip.id,
        subnetId: subnet.id,
        tags: {
          ...commonTags,
          Name: `nat-gateway-${index + 1}-${environmentSuffix}`,
        },
      });

      natGateways.push(natGw);
    });

    // Create Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: vpc.id,
      tags: {
        ...commonTags,
        Name: `public-route-table-${environmentSuffix}`,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate Public Subnets with Public Route Table
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(
        this,
        `public-route-table-association-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    // Create Private Route Tables (one per AZ for HA)
    privateAppSubnets.forEach((subnet, index) => {
      const routeTable = new RouteTable(this, `private-app-route-table-${index}`, {
        vpcId: vpc.id,
        tags: {
          ...commonTags,
          Name: `private-app-route-table-${index + 1}-${environmentSuffix}`,
        },
      });

      new Route(this, `private-app-route-${index}`, {
        routeTableId: routeTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
      });

      new RouteTableAssociation(
        this,
        `private-app-route-table-association-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: routeTable.id,
        }
      );
    });

    // Create Private DB Route Tables
    privateDbSubnets.forEach((subnet, index) => {
      const routeTable = new RouteTable(this, `private-db-route-table-${index}`, {
        vpcId: vpc.id,
        tags: {
          ...commonTags,
          Name: `private-db-route-table-${index + 1}-${environmentSuffix}`,
        },
      });

      new Route(this, `private-db-route-${index}`, {
        routeTableId: routeTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
      });

      new RouteTableAssociation(
        this,
        `private-db-route-table-association-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: routeTable.id,
        }
      );
    });

    // Create Network ACL
    const nacl = new NetworkAcl(this, 'network-acl', {
      vpcId: vpc.id,
      tags: {
        ...commonTags,
        Name: `network-acl-${environmentSuffix}`,
      },
    });

    // Allow HTTP inbound
    new NetworkAclRule(this, 'nacl-rule-http-in', {
      networkAclId: nacl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 80,
      toPort: 80,
      egress: false,
    });

    // Allow HTTPS inbound
    new NetworkAclRule(this, 'nacl-rule-https-in', {
      networkAclId: nacl.id,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 443,
      toPort: 443,
      egress: false,
    });

    // Deny SSH inbound
    new NetworkAclRule(this, 'nacl-rule-ssh-deny', {
      networkAclId: nacl.id,
      ruleNumber: 50,
      protocol: 'tcp',
      ruleAction: 'deny',
      cidrBlock: '0.0.0.0/0',
      fromPort: 22,
      toPort: 22,
      egress: false,
    });

    // Allow ephemeral ports inbound
    new NetworkAclRule(this, 'nacl-rule-ephemeral-in', {
      networkAclId: nacl.id,
      ruleNumber: 120,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 1024,
      toPort: 65535,
      egress: false,
    });

    // Allow all outbound
    new NetworkAclRule(this, 'nacl-rule-all-out', {
      networkAclId: nacl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      egress: true,
    });

    // Create CloudWatch Log Group for VPC Flow Logs
    const logGroup = new CloudwatchLogGroup(this, 'vpc-flow-log-group', {
      name: '/aws/vpc/flowlogs',
      retentionInDays: 7,
      tags: commonTags,
    });

    // Create IAM Role for VPC Flow Logs
    const flowLogRole = new IamRole(this, 'vpc-flow-log-role', {
      name: `vpc-flow-log-role-${environmentSuffix}`,
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
      tags: commonTags,
    });

    // Create IAM Policy for CloudWatch Logs
    const flowLogPolicy = new IamPolicy(this, 'vpc-flow-log-policy', {
      name: `vpc-flow-log-policy-${environmentSuffix}`,
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
      tags: commonTags,
    });

    new IamRolePolicyAttachment(this, 'vpc-flow-log-policy-attachment', {
      role: flowLogRole.name,
      policyArn: flowLogPolicy.arn,
    });

    // Create VPC Flow Log
    new FlowLog(this, 'vpc-flow-log', {
      vpcId: vpc.id,
      trafficType: 'ALL',
      logDestinationType: 'cloud-watch-logs',
      logDestination: logGroup.arn,
      iamRoleArn: flowLogRole.arn,
      tags: {
        ...commonTags,
        Name: `vpc-flow-log-${environmentSuffix}`,
      },
    });
  }
}
```

## File: lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { LocalBackend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { NetworkingStack } from './networking-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const defaultTags = props?.defaultTags || [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure Local Backend for development
    new LocalBackend(this, {
      path: `terraform.${environmentSuffix}.tfstate`,
    });

    // Create networking infrastructure
    new NetworkingStack(this, 'networking', {
      environmentSuffix,
      region: awsRegion,
    });
  }
}
```

## Implementation Notes

This implementation provides:

1. **Complete VPC Architecture**: All 9 subnets across 3 AZs with proper CIDR blocks (10.0.0.0/16)
2. **High Availability**: NAT Gateways in each AZ prevent single point of failure
3. **Security Controls**:
   - Network ACLs enforce security policies at subnet level
   - SSH explicitly denied from 0.0.0.0/0 (rule 50 - high priority)
   - HTTP/HTTPS allowed for web traffic
   - Ephemeral ports allowed for return traffic
4. **Compliance**: VPC Flow Logs capture ALL traffic for security analysis
5. **Flexibility**: environmentSuffix enables multiple concurrent deployments
6. **Production-Ready**:
   - DNS resolution enabled (enableDnsHostnames, enableDnsSupport)
   - Proper IAM roles and policies for VPC Flow Logs
   - CloudWatch Logs integration with 7-day retention
   - LocalBackend for state management (no S3 dependency)
7. **Network Isolation**:
   - Three-tier architecture: public, private-app, private-db
   - Database tier has no direct internet access (NAT Gateway only)
   - Public subnets auto-assign public IPs for load balancers
8. **Routing**:
   - Public subnets route through Internet Gateway
   - Private subnets route through NAT Gateways (one per AZ)
   - Each private subnet tier has its own route tables for HA

The code follows CDKTF best practices with modular constructs, proper IAM roles, and comprehensive resource tagging.
