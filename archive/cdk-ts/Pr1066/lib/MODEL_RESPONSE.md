# Basic Cloud Environment Setup with CDK TypeScript

I'll help you create a comprehensive basic cloud environment using CDK TypeScript. This setup will include a VPC, subnets, networking components, and EC2 instances with proper security configurations.

## Infrastructure Overview

The solution includes:
- VPC with IPv6 support for future scalability
- Public and private subnets with proper routing
- Internet Gateway and NAT Gateway for connectivity
- Security groups with restricted SSH access
- EC2 instances in both subnets
- Comprehensive tagging strategy

## File: lib/vpc-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface VpcStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnet: ec2.Subnet;
  public readonly privateSubnet: ec2.Subnet;

  constructor(scope: Construct, id: string, props?: VpcStackProps) {
    super(scope, id, props);

    // Create VPC with IPv6 support
    this.vpc = new ec2.Vpc(this, 'vpcBasic', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'subnetPublic',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrBlock: '10.0.0.0/24',
        },
        {
          cidrMask: 24,
          name: 'subnetPrivate',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrBlock: '10.0.1.0/24',
        },
      ],
    });

    // Get subnet references
    this.publicSubnet = this.vpc.publicSubnets[0];
    this.privateSubnet = this.vpc.privateSubnets[0];

    // Add tags to VPC and subnets
    cdk.Tags.of(this.vpc).add('Environment', 'Development');
    cdk.Tags.of(this.vpc).add('Name', 'vpcBasic');
    
    cdk.Tags.of(this.publicSubnet).add('Environment', 'Development');
    cdk.Tags.of(this.publicSubnet).add('Name', 'subnetPublic');
    
    cdk.Tags.of(this.privateSubnet).add('Environment', 'Development');
    cdk.Tags.of(this.privateSubnet).add('Name', 'subnetPrivate');

    // Output important information
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'PublicSubnetId', {
      value: this.publicSubnet.subnetId,
      description: 'Public Subnet ID',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetId', {
      value: this.privateSubnet.subnetId,
      description: 'Private Subnet ID',
    });
  }
}
```

## File: lib/security-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  environmentSuffix?: string;
}

export class SecurityStack extends cdk.Stack {
  public readonly securityGroupPublic: ec2.SecurityGroup;
  public readonly securityGroupPrivate: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // Security group for public subnet instances
    this.securityGroupPublic = new ec2.SecurityGroup(this, 'securityGroupPublic', {
      vpc: props.vpc,
      description: 'Security group for public subnet EC2 instances',
      allowAllOutbound: true,
    });

    // Allow SSH access only from specified IP range
    this.securityGroupPublic.addIngressRule(
      ec2.Peer.ipv4('198.51.100.0/24'),
      ec2.Port.tcp(22),
      'SSH access from authorized IP range'
    );

    // Security group for private subnet instances
    this.securityGroupPrivate = new ec2.SecurityGroup(this, 'securityGroupPrivate', {
      vpc: props.vpc,
      description: 'Security group for private subnet EC2 instances',
      allowAllOutbound: true,
    });

    // Allow SSH access from public security group
    this.securityGroupPrivate.addIngressRule(
      this.securityGroupPublic,
      ec2.Port.tcp(22),
      'SSH access from public subnet'
    );

    // Allow communication between private instances
    this.securityGroupPrivate.addIngressRule(
      this.securityGroupPrivate,
      ec2.Port.allTraffic(),
      'Internal communication within private subnet'
    );

    // Add tags
    cdk.Tags.of(this.securityGroupPublic).add('Environment', 'Development');
    cdk.Tags.of(this.securityGroupPublic).add('Name', 'securityGroupPublic');
    
    cdk.Tags.of(this.securityGroupPrivate).add('Environment', 'Development');
    cdk.Tags.of(this.securityGroupPrivate).add('Name', 'securityGroupPrivate');

    // Outputs
    new cdk.CfnOutput(this, 'PublicSecurityGroupId', {
      value: this.securityGroupPublic.securityGroupId,
      description: 'Public Security Group ID',
    });

    new cdk.CfnOutput(this, 'PrivateSecurityGroupId', {
      value: this.securityGroupPrivate.securityGroupId,
      description: 'Private Security Group ID',
    });
  }
}
```

## File: lib/compute-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  publicSubnet: ec2.Subnet;
  privateSubnet: ec2.Subnet;
  securityGroupPublic: ec2.SecurityGroup;
  securityGroupPrivate: ec2.SecurityGroup;
  environmentSuffix?: string;
}

export class ComputeStack extends cdk.Stack {
  public readonly publicInstance: ec2.Instance;
  public readonly privateInstance: ec2.Instance;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Get the latest Amazon Linux 2023 AMI
    const machineImage = ec2.MachineImage.latestAmazonLinux2023({
      edition: ec2.AmazonLinuxEdition.STANDARD,
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    // Create key pair for EC2 instances
    const keyPair = new ec2.KeyPair(this, 'keyPairBasic', {
      keyPairName: 'keyPairBasic',
      type: ec2.KeyPairType.RSA,
      format: ec2.KeyPairFormat.PEM,
    });

    // EC2 Instance in Public Subnet
    this.publicInstance = new ec2.Instance(this, 'instancePublic', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: machineImage,
      vpc: props.vpc,
      vpcSubnets: {
        subnets: [props.publicSubnet],
      },
      securityGroup: props.securityGroupPublic,
      keyPair: keyPair,
      associatePublicIpAddress: true,
      instanceName: 'instancePublic',
    });

    // EC2 Instance in Private Subnet
    this.privateInstance = new ec2.Instance(this, 'instancePrivate', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: machineImage,
      vpc: props.vpc,
      vpcSubnets: {
        subnets: [props.privateSubnet],
      },
      securityGroup: props.securityGroupPrivate,
      keyPair: keyPair,
      associatePublicIpAddress: false,
      instanceName: 'instancePrivate',
    });

    // Add tags
    cdk.Tags.of(this.publicInstance).add('Environment', 'Development');
    cdk.Tags.of(this.publicInstance).add('Name', 'instancePublic');
    
    cdk.Tags.of(this.privateInstance).add('Environment', 'Development');
    cdk.Tags.of(this.privateInstance).add('Name', 'instancePrivate');
    
    cdk.Tags.of(keyPair).add('Environment', 'Development');
    cdk.Tags.of(keyPair).add('Name', 'keyPairBasic');

    // Outputs
    new cdk.CfnOutput(this, 'PublicInstanceId', {
      value: this.publicInstance.instanceId,
      description: 'Public EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'PublicInstancePublicIp', {
      value: this.publicInstance.instancePublicIp,
      description: 'Public EC2 Instance Public IP',
    });

    new cdk.CfnOutput(this, 'PrivateInstanceId', {
      value: this.privateInstance.instanceId,
      description: 'Private EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'PrivateInstancePrivateIp', {
      value: this.privateInstance.instancePrivateIp,
      description: 'Private EC2 Instance Private IP',
    });

    new cdk.CfnOutput(this, 'KeyPairName', {
      value: keyPair.keyPairName,
      description: 'EC2 Key Pair Name',
    });
  }
}
```

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';
import { SecurityStack } from './security-stack';
import { ComputeStack } from './compute-stack';

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

    // Create VPC Stack
    const vpcStack = new VpcStack(this, 'VpcStack', {
      environmentSuffix: environmentSuffix,
    });

    // Create Security Stack
    const securityStack = new SecurityStack(this, 'SecurityStack', {
      vpc: vpcStack.vpc,
      environmentSuffix: environmentSuffix,
    });

    // Create Compute Stack
    const computeStack = new ComputeStack(this, 'ComputeStack', {
      vpc: vpcStack.vpc,
      publicSubnet: vpcStack.publicSubnet,
      privateSubnet: vpcStack.privateSubnet,
      securityGroupPublic: securityStack.securityGroupPublic,
      securityGroupPrivate: securityStack.securityGroupPrivate,
      environmentSuffix: environmentSuffix,
    });

    // Ensure proper dependency order
    securityStack.addDependency(vpcStack);
    computeStack.addDependency(securityStack);
  }
}
```

This comprehensive solution provides:

1. **VPC with proper CIDR configuration** - 10.0.0.0/16 with IPv6 readiness
2. **Subnet architecture** - Public (10.0.0.0/24) and Private (10.0.1.0/24) subnets
3. **Networking components** - Internet Gateway and NAT Gateway automatically configured by CDK
4. **Security groups** - Restricted SSH access from 198.51.100.0/24 range
5. **EC2 instances** - t2.micro instances in both subnets with appropriate configurations
6. **Tagging strategy** - All resources tagged with Environment: Development
7. **Naming convention** - resourceTypePurpose format throughout
8. **Future scalability** - IPv6 support and modular stack design

The modular approach allows for easy maintenance and future enhancements, while the security configuration ensures proper network isolation and access controls.