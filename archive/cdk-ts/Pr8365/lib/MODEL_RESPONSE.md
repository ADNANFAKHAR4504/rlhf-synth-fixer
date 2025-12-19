To translate the provided on-premises network environment into AWS using the AWS CDK with TypeScript, we'll create a VPC with subnets representing the different security zones and configure security groups to enforce the specified connectivity patterns.

Here's the complete CDK TypeScript code:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Vpc, SubnetType, SecurityGroup, Peer, Port } from 'aws-cdk-lib/aws-ec2';

export class TechCorpNetworkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC
    const vpc = new Vpc(this, 'TechCorpVPC', {
      cidr: '192.168.1.0/24',
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'DMZSubnet',
          subnetType: SubnetType.PUBLIC,
          cidrMask: 28, // 16 IPs (192.168.1.0/28)
        },
        {
          name: 'InternalSubnet',
          subnetType: SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 28, // 16 IPs (192.168.1.16/28)
        },
        {
          name: 'SecureSubnet',
          subnetType: SubnetType.PRIVATE_ISOLATED,
          cidrMask: 29, // 8 IPs (192.168.1.32/29)
        },
      ],
    });

    // Security Groups
    const dmzSecurityGroup = new SecurityGroup(this, 'DMZSecurityGroup', {
      vpc,
      allowAllOutbound: false,
      description: 'Security group for DMZ zone',
    });

    dmzSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(80),
      'Allow HTTP from internet'
    );
    dmzSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(443),
      'Allow HTTPS from internet'
    );

    const internalSecurityGroup = new SecurityGroup(this, 'InternalSecurityGroup', {
      vpc,
      allowAllOutbound: false,
      description: 'Security group for internal zone',
    });

    internalSecurityGroup.addIngressRule(
      dmzSecurityGroup,
      Port.tcp(8080),
      'Allow traffic from DMZ on 8080'
    );

    const secureSecurityGroup = new SecurityGroup(this, 'SecureSecurityGroup', {
      vpc,
      allowAllOutbound: false,
      description: 'Security group for secure zone',
    });

    secureSecurityGroup.addIngressRule(
      internalSecurityGroup,
      Port.tcp(5432),
      'Allow PostgreSQL from internal zone'
    );

    secureSecurityGroup.addIngressRule(
      Peer.ipv4('192.168.1.0/24'), // Assuming management station is in the same network
      Port.tcp(22),
      'Allow SSH from management station'
    );

    // Output VPC ID and Subnet IDs
    new cdk.CfnOutput(this, 'VpcId', { value: vpc.vpcId });
    new cdk.CfnOutput(this, 'DMZSubnetIds', { value: vpc.publicSubnets.map(subnet => subnet.subnetId).join(',') });
    new cdk.CfnOutput(this, 'InternalSubnetIds', { value: vpc.privateSubnets.map(subnet => subnet.subnetId).join(',') });
    new cdk.CfnOutput(this, 'SecureSubnetIds', { value: vpc.isolatedSubnets.map(subnet => subnet.subnetId).join(',') });
  }
}

// Instantiate the stack
const app = new cdk.App();
new TechCorpNetworkStack(app, 'TechCorpNetworkStack', {
  env: {
    region: 'us-east-1',
  },
});
```

### Explanation:

1. **VPC and Subnets**:
   - We create a VPC with CIDR `192.168.1.0/24`.
   - Three subnets are created: `DMZSubnet` (public), `InternalSubnet` (private with NAT), and `SecureSubnet` (private isolated).

2. **Security Groups**:
   - **DMZ Security Group**: Allows inbound HTTP (80) and HTTPS (443) from the internet.
   - **Internal Security Group**: Allows inbound traffic on port 8080 from the DMZ security group.
   - **Secure Security Group**: Allows inbound PostgreSQL (5432) from the internal security group and SSH (22) from the management station (assumed to be in the same network).

3. **Outputs**:
   - The stack outputs the VPC ID and subnet IDs for reference.

This setup ensures the same security zones and connectivity patterns as the on-premises network, with appropriate AWS constructs.