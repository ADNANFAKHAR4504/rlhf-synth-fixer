# AWS CDK TypeScript VPC Network Environment Implementation

I'll create a comprehensive AWS CDK application in TypeScript that implements a secure networking environment with all the specified requirements.

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

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

    // Create VPC with CIDR 10.0.0.0/16
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2, // Use exactly 2 availability zones
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: 1, // Deploy 1 NAT Gateway for cost optimization
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Create security group for SSH access restricted to 203.0.113.0/24
    const sshSecurityGroup = new ec2.SecurityGroup(this, 'SshSecurityGroup', {
      vpc: vpc,
      description: 'Security group for SSH access from specific IP range',
      allowAllOutbound: true,
    });

    // Add SSH access rule restricted to 203.0.113.0/24
    sshSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'),
      ec2.Port.tcp(22),
      'Allow SSH access from specific IP range 203.0.113.0/24'
    );

    // Create EC2 instance in public subnet
    const publicInstance = new ec2.Instance(this, 'PublicInstance', {
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: sshSecurityGroup,
      keyName: 'tap-key', // Assume key pair exists
    });

    // Create EC2 instance in private subnet
    const privateInstance = new ec2.Instance(this, 'PrivateInstance', {
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: sshSecurityGroup,
      keyName: 'tap-key', // Assume key pair exists
    });

    // Apply Environment=Development tag to all resources in the stack
    cdk.Tags.of(this).add('Environment', 'Development');

    // Output important resource information
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'PublicInstanceId', {
      value: publicInstance.instanceId,
      description: 'Public EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'PrivateInstanceId', {
      value: privateInstance.instanceId,
      description: 'Private EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'PublicInstancePublicIp', {
      value: publicInstance.instancePublicIp,
      description: 'Public EC2 Instance Public IP',
    });
  }
}
```

## Key Features Implemented:

1. **VPC Creation**: Created a VPC with CIDR block 10.0.0.0/16 in us-east-1 region
2. **Subnet Configuration**: Configured 2 public and 2 private subnets across 2 availability zones
3. **NAT Gateway**: Automatically deployed with PRIVATE_WITH_EGRESS subnet type for outbound internet access
4. **Internet Gateway**: Automatically created for public subnets
5. **EC2 Instances**: Deployed t3.micro instances in both public and private subnets
6. **Security Groups**: SSH access restricted to 203.0.113.0/24 IP range only
7. **Tagging**: Applied Environment=Development tag to all resources
8. **CDK Best Practices**: Used proper construct patterns and outputs for resource identification

## Security Implementation:

- SSH access is strictly limited to the specified IP range (203.0.113.0/24)
- Private instances can only access the internet through NAT Gateway
- Security groups follow the principle of least privilege
- DNS resolution is enabled for proper hostname resolution

## Cost Optimization:

- Used single NAT Gateway to reduce costs while maintaining functionality
- Deployed cost-effective t3.micro instances
- Properly sized subnets with /24 CIDR masks

The implementation follows AWS CDK best practices and includes all required infrastructure components for a secure, scalable networking environment.