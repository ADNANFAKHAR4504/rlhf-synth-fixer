# Network Environment Translation to AWS CDK

I'll help you translate the on-premises network environment to AWS using CDK
TypeScript. Based on the network topology provided, I'll create a 3-tier
architecture that maintains the same security zones and connectivity patterns.

## Solution Overview

The solution creates a secure 3-tier network architecture in AWS that mirrors
the on-premises setup:

- **DMZ Zone**: Public subnets for web servers (equivalent to
  192.168.1.10-20)
- **Internal Zone**: Private subnets for application servers (equivalent to
  192.168.1.100-110)
- **Secure Zone**: Isolated subnets for database servers (equivalent to
  192.168.1.200)

## Implementation

### File Structure Created/Modified

```text
lib/
├── tap-stack.ts          # Main stack orchestrator
├── network-stack.ts      # Network infrastructure implementation
├── artifacts/
│   └── network-topology.md
bin/
└── tap.ts               # CDK application entry point
test/
├── tap-stack.unit.test.ts    # Unit tests for infrastructure
└── tap-stack.int.test.ts     # Integration tests for deployed resources
```

### Core Infrastructure Components

#### lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkStack } from './network-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create the network infrastructure stack
    new NetworkStack(this, 'NetworkStack', {
      environmentSuffix,
      env: props?.env,
    });
  }
}
```

#### lib/network-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly dmzSecurityGroup: ec2.SecurityGroup;
  public readonly internalSecurityGroup: ec2.SecurityGroup;
  public readonly secureSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: NetworkStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC with 3 tiers
    this.vpc = new ec2.Vpc(this, 'TechCorpVpc', {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'DMZ',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Internal',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Secure',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // DMZ Security Group - Web servers
    this.dmzSecurityGroup = new ec2.SecurityGroup(this, 'DmzSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for DMZ zone - Web servers',
      securityGroupName: `DMZ-SG-${environmentSuffix}`,
      allowAllOutbound: false,
    });

    // Allow HTTP and HTTPS from internet
    this.dmzSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet'
    );
    this.dmzSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet'
    );

    // Internal Security Group - Application servers
    this.internalSecurityGroup = new ec2.SecurityGroup(
      this,
      'InternalSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for Internal zone - Application servers',
        securityGroupName: `Internal-SG-${environmentSuffix}`,
        allowAllOutbound: false,
      }
    );

    // Allow connections from DMZ on port 8080
    this.internalSecurityGroup.addIngressRule(
      this.dmzSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow connections from DMZ web servers'
    );

    // Secure Security Group - Database server
    this.secureSecurityGroup = new ec2.SecurityGroup(
      this,
      'SecureSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for Secure zone - Database server',
        securityGroupName: `Secure-SG-${environmentSuffix}`,
      }
    );

    // Allow connections from Internal zone on port 5432 (PostgreSQL)
    this.secureSecurityGroup.addIngressRule(
      this.internalSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow database connections from application servers'
    );

    // Allow SSH access for admin (from management)
    this.secureSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/16'),
      ec2.Port.tcp(22),
      'Allow SSH access for database administration'
    );

    // Allow DMZ to connect to Internal
    this.dmzSecurityGroup.addEgressRule(
      this.internalSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow DMZ to connect to application servers'
    );

    // Allow Internal to connect to Secure
    this.internalSecurityGroup.addEgressRule(
      this.secureSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow application servers to connect to database'
    );

    // Network ACLs for additional security
    const dmzNacl = new ec2.NetworkAcl(this, 'DmzNetworkAcl', {
      vpc: this.vpc,
      networkAclName: `DMZ-NACL-${environmentSuffix}`,
    });

    const internalNacl = new ec2.NetworkAcl(this, 'InternalNetworkAcl', {
      vpc: this.vpc,
      networkAclName: `Internal-NACL-${environmentSuffix}`,
    });

    const secureNacl = new ec2.NetworkAcl(this, 'SecureNetworkAcl', {
      vpc: this.vpc,
      networkAclName: `Secure-NACL-${environmentSuffix}`,
    });

    // DMZ NACL Rules
    dmzNacl.addEntry('AllowHttpInbound', {
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(80),
      direction: ec2.TrafficDirection.INGRESS,
      cidr: ec2.AclCidr.anyIpv4(),
    });

    dmzNacl.addEntry('AllowHttpsInbound', {
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.INGRESS,
      cidr: ec2.AclCidr.anyIpv4(),
    });

    dmzNacl.addEntry('AllowEphemeralOutbound', {
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.EGRESS,
      cidr: ec2.AclCidr.anyIpv4(),
    });

    dmzNacl.addEntry('AllowAppServerConnection', {
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(8080),
      direction: ec2.TrafficDirection.EGRESS,
      cidr: ec2.AclCidr.ipv4('10.0.0.0/16'),
    });

    // Internal NACL Rules
    internalNacl.addEntry('AllowFromDmz', {
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(8080),
      direction: ec2.TrafficDirection.INGRESS,
      cidr: ec2.AclCidr.ipv4('10.0.0.0/16'),
    });

    internalNacl.addEntry('AllowToDatabase', {
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(5432),
      direction: ec2.TrafficDirection.EGRESS,
      cidr: ec2.AclCidr.ipv4('10.0.0.0/16'),
    });

    internalNacl.addEntry('AllowEphemeralOutbound', {
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.EGRESS,
      cidr: ec2.AclCidr.anyIpv4(),
    });

    // Secure NACL Rules
    secureNacl.addEntry('AllowDatabaseConnections', {
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(5432),
      direction: ec2.TrafficDirection.INGRESS,
      cidr: ec2.AclCidr.ipv4('10.0.0.0/16'),
    });

    secureNacl.addEntry('AllowSshAdmin', {
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(22),
      direction: ec2.TrafficDirection.INGRESS,
      cidr: ec2.AclCidr.ipv4('10.0.0.0/16'),
    });

    secureNacl.addEntry('AllowEphemeralOutbound', {
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.EGRESS,
      cidr: ec2.AclCidr.ipv4('10.0.0.0/16'),
    });

    // Associate NACLs with subnets
    const publicSubnets = this.vpc.publicSubnets;
    const privateSubnets = this.vpc.privateSubnets;
    const isolatedSubnets = this.vpc.isolatedSubnets;

    publicSubnets.forEach((subnet, index) => {
      new ec2.SubnetNetworkAclAssociation(this, `DmzNaclAssociation${index}`, {
        subnet,
        networkAcl: dmzNacl,
      });
    });

    privateSubnets.forEach((subnet, index) => {
      new ec2.SubnetNetworkAclAssociation(
        this,
        `InternalNaclAssociation${index}`,
        {
          subnet,
          networkAcl: internalNacl,
        }
      );
    });

    isolatedSubnets.forEach((subnet, index) => {
      new ec2.SubnetNetworkAclAssociation(
        this,
        `SecureNaclAssociation${index}`,
        {
          subnet,
          networkAcl: secureNacl,
        }
      );
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for the TechCorp network',
    });

    new cdk.CfnOutput(this, 'DmzSecurityGroupId', {
      value: this.dmzSecurityGroup.securityGroupId,
      description: 'Security Group ID for DMZ zone',
    });

    new cdk.CfnOutput(this, 'InternalSecurityGroupId', {
      value: this.internalSecurityGroup.securityGroupId,
      description: 'Security Group ID for Internal zone',
    });

    new cdk.CfnOutput(this, 'SecureSecurityGroupId', {
      value: this.secureSecurityGroup.securityGroupId,
      description: 'Security Group ID for Secure zone',
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Comma-separated list of public subnet IDs (DMZ)',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Comma-separated list of private subnet IDs (Internal)',
    });

    new cdk.CfnOutput(this, 'IsolatedSubnetIds', {
      value: this.vpc.isolatedSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Comma-separated list of isolated subnet IDs (Secure)',
    });
  }
}
```

## Key Features

### 1. Network Segmentation

- **VPC**: 10.0.0.0/16 CIDR block providing ample address space
- **Multi-AZ deployment**: Resources spread across 2 availability zones for
  high availability
- **3-tier architecture**: Clear separation between DMZ, Internal, and Secure
  zones

### 2. Security Implementation

- **Security Groups**: Stateful firewalls with precise ingress/egress rules
- **Network ACLs**: Additional stateless security layer
- **Principle of least privilege**: Each tier only allows necessary
  communication

### 3. Connectivity Patterns

- **DMZ → Internal**: Web servers can connect to app servers on port 8080
- **Internal → Secure**: App servers can connect to database on port 5432
- **Internet → DMZ**: Public access via HTTP (80) and HTTPS (443)
- **Admin access**: SSH (22) to secure zone from within VPC

### 4. Infrastructure as Code Benefits

- **Repeatable deployments**: Environment-specific configuration
- **Version control**: All infrastructure changes tracked
- **Testing**: Comprehensive unit and integration tests
- **Documentation**: Self-documenting code with clear resource naming

## Deployment Commands

```bash
# Install dependencies
npm install

# Set environment suffix for unique resource naming
export ENVIRONMENT_SUFFIX=dev

# Deploy the infrastructure
npm run cdk:deploy

# Run tests
npm run test:unit
npm run test:integration

# Clean up resources
npm run cdk:destroy
```

## Testing Strategy

The solution includes comprehensive testing:

### Unit Tests (test/tap-stack.unit.test.ts)

- VPC and subnet configuration validation
- Security group rule verification
- Network ACL entry validation
- CloudFormation output verification

### Integration Tests (test/tap-stack.int.test.ts)

- Live AWS resource validation
- Network connectivity verification
- Security configuration testing
- End-to-end architecture validation

## Migration Benefits

This AWS implementation provides several advantages over the on-premises setup:

1. **Scalability**: Auto-scaling capabilities and elastic resources
2. **High Availability**: Multi-AZ deployment with automatic failover
3. **Security**: AWS-native security controls and monitoring
4. **Cost Efficiency**: Pay-as-you-use model with reserved instance options
5. **Managed Services**: Reduced operational overhead
6. **Compliance**: Built-in compliance frameworks and audit trails

The solution successfully translates the on-premises 3-tier network
architecture to AWS while maintaining security boundaries and connectivity
patterns, providing a solid foundation for migrating applications to the cloud.
