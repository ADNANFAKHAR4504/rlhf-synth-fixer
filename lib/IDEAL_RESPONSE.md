# VPC Infrastructure Implementation - IDEAL RESPONSE

This is the corrected implementation that addresses the CDK platform limitation discovered in MODEL_RESPONSE.md. The key insight is that CDK's high-level `ec2.Vpc` construct does not allow exact CIDR specification - we must use L1 (CloudFormation-level) constructs instead.

## Critical Fix: Using L1 Constructs for Exact CIDR Control

**Problem**: CDK's `ec2.Vpc` with `subnetConfiguration` automatically assigns sequential CIDRs and cannot be configured for exact subnet CIDR blocks.

**Solution**: Use L1 constructs (`CfnVPC`, `CfnSubnet`, etc.) which map directly to CloudFormation resources and allow exact specification.

## File: lib/tap-stack.ts (Corrected Implementation)

```ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Create VPC using L1 construct for exact control
    const vpc = new ec2.CfnVPC(this, `Vpc-${environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: [
        { key: 'Name', value: `production-vpc-${environmentSuffix}` },
        { key: 'Environment', value: 'production' },
        { key: 'Project', value: 'apac-expansion' },
      ],
    });

    // Create Internet Gateway
    const igw = new ec2.CfnInternetGateway(this, `IGW-${environmentSuffix}`, {
      tags: [
        { key: 'Name', value: `production-igw-${environmentSuffix}` },
        { key: 'Environment', value: 'production' },
        { key: 'Project', value: 'apac-expansion' },
      ],
    });

    // Attach Internet Gateway to VPC
    new ec2.CfnVPCGatewayAttachment(this, `IGWAttachment-${environmentSuffix}`, {
      vpcId: vpc.ref,
      internetGatewayId: igw.ref,
    });

    // Define availability zones for ap-southeast-1
    const azs = ['ap-southeast-1a', 'ap-southeast-1b', 'ap-southeast-1c'];

    // Create Public Subnets with exact CIDRs
    const publicSubnetConfigs = [
      { cidr: '10.0.1.0/24', az: azs[0], index: 1 },
      { cidr: '10.0.2.0/24', az: azs[1], index: 2 },
      { cidr: '10.0.3.0/24', az: azs[2], index: 3 },
    ];

    const publicSubnets = publicSubnetConfigs.map((config) => {
      const subnet = new ec2.CfnSubnet(this, `PublicSubnet${config.index}-${environmentSuffix}`, {
        vpcId: vpc.ref,
        cidrBlock: config.cidr,
        availabilityZone: config.az,
        mapPublicIpOnLaunch: true,
        tags: [
          { key: 'Name', value: `production-public-subnet-${config.index}-${environmentSuffix}` },
          { key: 'Environment', value: 'production' },
          { key: 'Project', value: 'apac-expansion' },
        ],
      });
      return subnet;
    });

    // Create Private Subnets with exact CIDRs
    const privateSubnetConfigs = [
      { cidr: '10.0.10.0/23', az: azs[0], index: 1 },
      { cidr: '10.0.12.0/23', az: azs[1], index: 2 },
      { cidr: '10.0.14.0/23', az: azs[2], index: 3 },
    ];

    const privateSubnets = privateSubnetConfigs.map((config) => {
      const subnet = new ec2.CfnSubnet(this, `PrivateSubnet${config.index}-${environmentSuffix}`, {
        vpcId: vpc.ref,
        cidrBlock: config.cidr,
        availabilityZone: config.az,
        mapPublicIpOnLaunch: false,
        tags: [
          { key: 'Name', value: `production-private-subnet-${config.index}-${environmentSuffix}` },
          { key: 'Environment', value: 'production' },
          { key: 'Project', value: 'apac-expansion' },
        ],
      });
      return subnet;
    });

    // Create Elastic IPs for NAT Gateways (first two AZs)
    const eip1 = new ec2.CfnEIP(this, `NatEIP1-${environmentSuffix}`, {
      domain: 'vpc',
      tags: [
        { key: 'Name', value: `production-nat-eip-1-${environmentSuffix}` },
        { key: 'Environment', value: 'production' },
        { key: 'Project', value: 'apac-expansion' },
      ],
    });

    const eip2 = new ec2.CfnEIP(this, `NatEIP2-${environmentSuffix}`, {
      domain: 'vpc',
      tags: [
        { key: 'Name', value: `production-nat-eip-2-${environmentSuffix}` },
        { key: 'Environment', value: 'production' },
        { key: 'Project', value: 'apac-expansion' },
      ],
    });

    // Create NAT Gateways in first two public subnets
    const natGateway1 = new ec2.CfnNatGateway(this, `NatGateway1-${environmentSuffix}`, {
      subnetId: publicSubnets[0].ref,
      allocationId: eip1.attrAllocationId,
      tags: [
        { key: 'Name', value: `production-nat-1-${environmentSuffix}` },
        { key: 'Environment', value: 'production' },
        { key: 'Project', value: 'apac-expansion' },
      ],
    });

    const natGateway2 = new ec2.CfnNatGateway(this, `NatGateway2-${environmentSuffix}`, {
      subnetId: publicSubnets[1].ref,
      allocationId: eip2.attrAllocationId,
      tags: [
        { key: 'Name', value: `production-nat-2-${environmentSuffix}` },
        { key: 'Environment', value: 'production' },
        { key: 'Project', value: 'apac-expansion' },
      ],
    });

    // Create Public Route Table
    const publicRouteTable = new ec2.CfnRouteTable(this, `PublicRouteTable-${environmentSuffix}`, {
      vpcId: vpc.ref,
      tags: [
        { key: 'Name', value: `production-public-rt-${environmentSuffix}` },
        { key: 'Environment', value: 'production' },
        { key: 'Project', value: 'apac-expansion' },
      ],
    });

    // Add route to Internet Gateway
    new ec2.CfnRoute(this, `PublicRoute-${environmentSuffix}`, {
      routeTableId: publicRouteTable.ref,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.ref,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new ec2.CfnSubnetRouteTableAssociation(
        this,
        `PublicSubnetRTAssoc${index + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.ref,
          routeTableId: publicRouteTable.ref,
        }
      );
    });

    // Create Private Route Tables (one per private subnet for NAT Gateway distribution)
    const privateRouteTables = privateSubnets.map((subnet, index) => {
      const routeTable = new ec2.CfnRouteTable(this, `PrivateRouteTable${index + 1}-${environmentSuffix}`, {
        vpcId: vpc.ref,
        tags: [
          { key: 'Name', value: `production-private-rt-${index + 1}-${environmentSuffix}` },
          { key: 'Environment', value: 'production' },
          { key: 'Project', value: 'apac-expansion' },
        ],
      });

      // Route to appropriate NAT Gateway (first two use their own NAT, third uses NAT 2)
      const natGateway = index === 0 ? natGateway1 : natGateway2;
      new ec2.CfnRoute(this, `PrivateRoute${index + 1}-${environmentSuffix}`, {
        routeTableId: routeTable.ref,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.ref,
      });

      // Associate subnet with route table
      new ec2.CfnSubnetRouteTableAssociation(
        this,
        `PrivateSubnetRTAssoc${index + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.ref,
          routeTableId: routeTable.ref,
        }
      );

      return routeTable;
    });

    // Create CloudWatch Log Group for VPC Flow Logs
    const flowLogGroup = new logs.LogGroup(this, `VpcFlowLogGroup-${environmentSuffix}`, {
      logGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK, // 7 days retention
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create IAM role for VPC Flow Logs
    const flowLogRole = new iam.Role(this, `VpcFlowLogRole-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      description: 'Role for VPC Flow Logs to write to CloudWatch',
    });

    flowLogGroup.grantWrite(flowLogRole);

    // Enable VPC Flow Logs
    new ec2.CfnFlowLog(this, `VpcFlowLog-${environmentSuffix}`, {
      resourceId: vpc.ref,
      resourceType: 'VPC',
      trafficType: 'ALL',
      logDestinationType: 'cloud-watch-logs',
      logGroupName: flowLogGroup.logGroupName,
      deliverLogsPermissionArn: flowLogRole.roleArn,
      tags: [
        { key: 'Environment', value: 'production' },
        { key: 'Project', value: 'apac-expansion' },
      ],
    });

    // Create custom Network ACLs for public subnets
    const publicNetworkAcl = new ec2.CfnNetworkAcl(this, `PublicNetworkAcl-${environmentSuffix}`, {
      vpcId: vpc.ref,
      tags: [
        { key: 'Name', value: `production-public-nacl-${environmentSuffix}` },
        { key: 'Environment', value: 'production' },
        { key: 'Project', value: 'apac-expansion' },
      ],
    });

    // Associate public subnets with public NACL
    publicSubnets.forEach((subnet, index) => {
      new ec2.CfnSubnetNetworkAclAssociation(
        this,
        `PublicSubnetNACLAssoc${index + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.ref,
          networkAclId: publicNetworkAcl.ref,
        }
      );
    });

    // Add NACL entries for public subnets
    // Allow HTTP inbound
    new ec2.CfnNetworkAclEntry(this, `PublicNACLHttpIn-${environmentSuffix}`, {
      networkAclId: publicNetworkAcl.ref,
      ruleNumber: 100,
      protocol: 6, // TCP
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      portRange: { from: 80, to: 80 },
      egress: false,
    });

    // Allow HTTPS inbound
    new ec2.CfnNetworkAclEntry(this, `PublicNACLHttpsIn-${environmentSuffix}`, {
      networkAclId: publicNetworkAcl.ref,
      ruleNumber: 110,
      protocol: 6, // TCP
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      portRange: { from: 443, to: 443 },
      egress: false,
    });

    // Allow SSH inbound
    new ec2.CfnNetworkAclEntry(this, `PublicNACLSshIn-${environmentSuffix}`, {
      networkAclId: publicNetworkAcl.ref,
      ruleNumber: 120,
      protocol: 6, // TCP
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      portRange: { from: 22, to: 22 },
      egress: false,
    });

    // Allow ephemeral ports inbound (for return traffic)
    new ec2.CfnNetworkAclEntry(this, `PublicNACLEphemeralIn-${environmentSuffix}`, {
      networkAclId: publicNetworkAcl.ref,
      ruleNumber: 130,
      protocol: 6, // TCP
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      portRange: { from: 1024, to: 65535 },
      egress: false,
    });

    // Allow all outbound traffic
    new ec2.CfnNetworkAclEntry(this, `PublicNACLAllOut-${environmentSuffix}`, {
      networkAclId: publicNetworkAcl.ref,
      ruleNumber: 100,
      protocol: -1, // All protocols
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      egress: true,
    });

    // Create custom Network ACLs for private subnets
    const privateNetworkAcl = new ec2.CfnNetworkAcl(this, `PrivateNetworkAcl-${environmentSuffix}`, {
      vpcId: vpc.ref,
      tags: [
        { key: 'Name', value: `production-private-nacl-${environmentSuffix}` },
        { key: 'Environment', value: 'production' },
        { key: 'Project', value: 'apac-expansion' },
      ],
    });

    // Associate private subnets with private NACL
    privateSubnets.forEach((subnet, index) => {
      new ec2.CfnSubnetNetworkAclAssociation(
        this,
        `PrivateSubnetNACLAssoc${index + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.ref,
          networkAclId: privateNetworkAcl.ref,
        }
      );
    });

    // Add NACL entries for private subnets
    // Allow HTTP inbound from VPC
    new ec2.CfnNetworkAclEntry(this, `PrivateNACLHttpIn-${environmentSuffix}`, {
      networkAclId: privateNetworkAcl.ref,
      ruleNumber: 100,
      protocol: 6, // TCP
      ruleAction: 'allow',
      cidrBlock: '10.0.0.0/16',
      portRange: { from: 80, to: 80 },
      egress: false,
    });

    // Allow HTTPS inbound from VPC
    new ec2.CfnNetworkAclEntry(this, `PrivateNACLHttpsIn-${environmentSuffix}`, {
      networkAclId: privateNetworkAcl.ref,
      ruleNumber: 110,
      protocol: 6, // TCP
      ruleAction: 'allow',
      cidrBlock: '10.0.0.0/16',
      portRange: { from: 443, to: 443 },
      egress: false,
    });

    // Allow SSH inbound from VPC
    new ec2.CfnNetworkAclEntry(this, `PrivateNACLSshIn-${environmentSuffix}`, {
      networkAclId: privateNetworkAcl.ref,
      ruleNumber: 120,
      protocol: 6, // TCP
      ruleAction: 'allow',
      cidrBlock: '10.0.0.0/16',
      portRange: { from: 22, to: 22 },
      egress: false,
    });

    // Allow ephemeral ports inbound
    new ec2.CfnNetworkAclEntry(this, `PrivateNACLEphemeralIn-${environmentSuffix}`, {
      networkAclId: privateNetworkAcl.ref,
      ruleNumber: 130,
      protocol: 6, // TCP
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      portRange: { from: 1024, to: 65535 },
      egress: false,
    });

    // Allow all outbound traffic
    new ec2.CfnNetworkAclEntry(this, `PrivateNACLAllOut-${environmentSuffix}`, {
      networkAclId: privateNetworkAcl.ref,
      ruleNumber: 100,
      protocol: -1, // All protocols
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      egress: true,
    });

    // Export VPC ID
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.ref,
      description: 'VPC ID',
      exportName: `VpcId-${environmentSuffix}`,
    });

    // Export Public Subnet IDs
    publicSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PublicSubnetId${index + 1}`, {
        value: subnet.ref,
        description: `Public Subnet ${index + 1} ID`,
        exportName: `PublicSubnet${index + 1}Id-${environmentSuffix}`,
      });
    });

    // Export Private Subnet IDs
    privateSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PrivateSubnetId${index + 1}`, {
        value: subnet.ref,
        description: `Private Subnet ${index + 1} ID`,
        exportName: `PrivateSubnet${index + 1}Id-${environmentSuffix}`,
      });
    });

    // Export NAT Gateway IDs
    new cdk.CfnOutput(this, 'NatGateway1Id', {
      value: natGateway1.ref,
      description: 'NAT Gateway 1 ID',
      exportName: `NatGateway1Id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'NatGateway2Id', {
      value: natGateway2.ref,
      description: 'NAT Gateway 2 ID',
      exportName: `NatGateway2Id-${environmentSuffix}`,
    });

    // Export Internet Gateway ID
    new cdk.CfnOutput(this, 'InternetGatewayId', {
      value: igw.ref,
      description: 'Internet Gateway ID',
      exportName: `InternetGatewayId-${environmentSuffix}`,
    });

    // Export Flow Log Group Name
    new cdk.CfnOutput(this, 'FlowLogGroupName', {
      value: flowLogGroup.logGroupName,
      description: 'VPC Flow Logs CloudWatch Log Group Name',
      exportName: `FlowLogGroupName-${environmentSuffix}`,
    });
  }
}
```

## Key Differences from MODEL_RESPONSE.md

### 1. VPC Creation
- **MODEL_RESPONSE**: Used `ec2.Vpc` (L2 construct)
- **IDEAL_RESPONSE**: Uses `ec2.CfnVPC` (L1 construct)

### 2. Subnet Creation
- **MODEL_RESPONSE**: Used `subnetConfiguration` array with automatic CIDR assignment
- **IDEAL_RESPONSE**: Creates each subnet individually with `ec2.CfnSubnet` and exact `cidrBlock`

### 3. Exact CIDR Control Achieved
- **Public Subnets**: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24 (as required)
- **Private Subnets**: 10.0.10.0/23, 10.0.12.0/23, 10.0.14.0/23 (as required)

### 4. NAT Gateway Configuration
- **MODEL_RESPONSE**: Configured via `natGateways: 2` property (no ID access)
- **IDEAL_RESPONSE**: Explicit `CfnNatGateway` creation with `CfnEIP` allocation, allowing ID exports

### 5. Route Table Management
- **MODEL_RESPONSE**: Automatic route table creation by `ec2.Vpc`
- **IDEAL_RESPONSE**: Explicit `CfnRouteTable`, `CfnRoute`, and `CfnSubnetRouteTableAssociation` resources

### 6. Network ACL Association
- **MODEL_RESPONSE**: Used `NetworkAcl` L2 construct with `subnetSelection`
- **IDEAL_RESPONSE**: Uses `CfnNetworkAcl` with explicit `CfnSubnetNetworkAclAssociation`

## Platform: cdk
## Language: ts

## Training Value

This corrected implementation teaches several critical lessons:

1. **CDK Abstraction Levels**: Understanding when L2 constructs are sufficient vs. when L1 constructs are necessary
2. **Exact Resource Control**: How to achieve precise resource specifications in CDK
3. **Platform Constraints**: Recognizing that convenience often comes at the cost of flexibility
4. **CloudFormation Mapping**: Understanding how L1 constructs map directly to CloudFormation resources
5. **Trade-offs**: Weighing verbosity (L1) against convenience (L2) based on requirements

This is a valuable example of discovering platform limitations through deployment and understanding how to work around them appropriately.
