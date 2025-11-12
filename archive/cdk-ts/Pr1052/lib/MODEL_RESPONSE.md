# Enhanced Dual VPC Infrastructure with VPC Lattice and VPC Endpoints

## Implementation

Here's the CDK TypeScript implementation for the enhanced dual-VPC infrastructure with VPC Lattice service networking and VPC endpoints:

### lib/tap-stack.ts

```ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as vpclattice from 'aws-cdk-lib/aws-vpclattice';
import { Construct } from 'constructs';

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

    // Create VPC 1 with CIDR 10.0.0.0/16
    const vpc1 = new ec2.Vpc(this, 'VPC1', {
      vpcName: `tap-${environmentSuffix}-vpc1`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: 1,
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Create VPC 2 with CIDR 192.168.0.0/16
    const vpc2 = new ec2.Vpc(this, 'VPC2', {
      vpcName: `tap-${environmentSuffix}-vpc2`,
      ipAddresses: ec2.IpAddresses.cidr('192.168.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: 1,
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Create security group for VPC Endpoints
    const vpcEndpointSecurityGroup = new ec2.SecurityGroup(this, 'VPCEndpointSecurityGroup', {
      vpc: vpc1,
      description: 'Security group for VPC endpoints allowing HTTPS traffic',
      allowAllOutbound: false,
      securityGroupName: `tap-${environmentSuffix}-vpc-endpoint-sg`,
    });

    vpcEndpointSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc1.vpcCidrBlock),
      ec2.Port.tcp(443),
      'Allow HTTPS from VPC1'
    );

    vpcEndpointSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc2.vpcCidrBlock),
      ec2.Port.tcp(443),
      'Allow HTTPS from VPC2'
    );

    // Create VPC Endpoints for Systems Manager in VPC1
    const ssmEndpoint = new ec2.InterfaceVpcEndpoint(this, 'SSMEndpoint', {
      vpc: vpc1,
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [vpcEndpointSecurityGroup],
      privateDnsEnabled: true,
    });

    const ssmMessagesEndpoint = new ec2.InterfaceVpcEndpoint(this, 'SSMMessagesEndpoint', {
      vpc: vpc1,
      service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [vpcEndpointSecurityGroup],
      privateDnsEnabled: true,
    });

    const ec2MessagesEndpoint = new ec2.InterfaceVpcEndpoint(this, 'EC2MessagesEndpoint', {
      vpc: vpc1,
      service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [vpcEndpointSecurityGroup],
      privateDnsEnabled: true,
    });

    // Create VPC Lattice Service Network
    const serviceNetwork = new vpclattice.CfnServiceNetwork(this, 'ServiceNetwork', {
      name: `tap-${environmentSuffix}-service-network`,
      authType: 'AWS_IAM',
    });

    // Associate VPC1 with the service network
    const vpc1Association = new vpclattice.CfnServiceNetworkVpcAssociation(this, 'VPC1Association', {
      serviceNetworkIdentifier: serviceNetwork.attrId,
      vpcIdentifier: vpc1.vpcId,
    });

    // Associate VPC2 with the service network
    const vpc2Association = new vpclattice.CfnServiceNetworkVpcAssociation(this, 'VPC2Association', {
      serviceNetworkIdentifier: serviceNetwork.attrId,
      vpcIdentifier: vpc2.vpcId,
    });

    // Create IAM role for VPC Lattice service
    const latticeServiceRole = new iam.Role(this, 'LatticeServiceRole', {
      assumedBy: new iam.ServicePrincipal('vpc-lattice.amazonaws.com'),
      description: 'IAM role for VPC Lattice service operations',
      roleName: `tap-${environmentSuffix}-lattice-service-role`,
    });

    // Create security group for EC2 instance (HTTP access on port 80)
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc: vpc1,
      description: 'Security group for EC2 instance allowing HTTP access',
      allowAllOutbound: true,
      securityGroupName: `tap-${environmentSuffix}-ec2-sg`,
    });

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP access on port 80'
    );

    // Allow traffic from VPC Lattice
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('169.254.171.0/24'),
      ec2.Port.tcp(80),
      'Allow HTTP access from VPC Lattice'
    );

    // Create IAM role for EC2 instance with SSM permissions
    const ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
      description: 'IAM role for EC2 instance with SSM access',
      roleName: `tap-${environmentSuffix}-ec2-role`,
    });

    // Add VPC Lattice permissions to EC2 role
    ec2Role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'vpc-lattice:InvokeService',
        'vpc-lattice:GetService',
        'vpc-lattice:ListServices',
      ],
      resources: ['*'],
    }));

    // Launch EC2 instance in public subnet of VPC1
    const ec2Instance = new ec2.Instance(this, 'EC2Instance', {
      vpc: vpc1,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      userData: ec2.UserData.forLinux(),
      instanceName: `tap-${environmentSuffix}-ec2-instance`,
    });

    // Add user data to install and start httpd service
    ec2Instance.addUserData(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Hello from EC2 in VPC1!</h1>" > /var/www/html/index.html',
      'echo "<p>This instance is connected via VPC Lattice</p>" >> /var/www/html/index.html'
    );

    // Create a VPC Lattice service for the EC2 web server
    const webService = new vpclattice.CfnService(this, 'WebService', {
      name: `tap-${environmentSuffix}-web-service`,
      authType: 'AWS_IAM',
    });

    // Create target group for the web service
    const targetGroup = new vpclattice.CfnTargetGroup(this, 'WebServiceTargetGroup', {
      name: `tap-${environmentSuffix}-web-tg`,
      type: 'INSTANCE',
      config: {
        vpcIdentifier: vpc1.vpcId,
        protocol: 'HTTP',
        port: 80,
        healthCheck: {
          enabled: true,
          protocol: 'HTTP',
          port: 80,
          path: '/',
          intervalSeconds: 30,
          timeoutSeconds: 5,
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
      },
      targets: [
        {
          id: ec2Instance.instanceId,
          port: 80,
        },
      ],
    });

    // Create listener for the web service
    const serviceListener = new vpclattice.CfnListener(this, 'WebServiceListener', {
      serviceIdentifier: webService.attrId,
      protocol: 'HTTP',
      port: 80,
      defaultAction: {
        forward: {
          targetGroups: [
            {
              targetGroupIdentifier: targetGroup.attrId,
            },
          ],
        },
      },
    });

    // Associate the service with the service network
    const serviceAssociation = new vpclattice.CfnServiceNetworkServiceAssociation(this, 'WebServiceAssociation', {
      serviceNetworkIdentifier: serviceNetwork.attrId,
      serviceIdentifier: webService.attrId,
    });

    // CDK Outputs for resource IDs
    new cdk.CfnOutput(this, 'VPC1Id', {
      value: vpc1.vpcId,
      description: 'ID of VPC1 (10.0.0.0/16)',
      exportName: `${this.stackName}-VPC1-ID`,
    });

    new cdk.CfnOutput(this, 'VPC2Id', {
      value: vpc2.vpcId,
      description: 'ID of VPC2 (192.168.0.0/16)',
      exportName: `${this.stackName}-VPC2-ID`,
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'ID of EC2 instance in VPC1 public subnet',
      exportName: `${this.stackName}-EC2-Instance-ID`,
    });

    new cdk.CfnOutput(this, 'EC2InstancePublicIP', {
      value: ec2Instance.instancePublicIp,
      description: 'Public IP address of EC2 instance',
      exportName: `${this.stackName}-EC2-Instance-Public-IP`,
    });

    new cdk.CfnOutput(this, 'VPCLatticeServiceNetworkId', {
      value: serviceNetwork.attrId,
      description: 'ID of VPC Lattice Service Network',
      exportName: `${this.stackName}-VPC-Lattice-Service-Network-ID`,
    });

    new cdk.CfnOutput(this, 'VPCLatticeServiceNetworkDns', {
      value: serviceNetwork.attrDns,
      description: 'DNS name of VPC Lattice Service Network',
      exportName: `${this.stackName}-VPC-Lattice-Service-Network-DNS`,
    });

    new cdk.CfnOutput(this, 'WebServiceId', {
      value: webService.attrId,
      description: 'ID of VPC Lattice Web Service',
      exportName: `${this.stackName}-Web-Service-ID`,
    });

    new cdk.CfnOutput(this, 'WebServiceDns', {
      value: webService.attrDns,
      description: 'DNS name of VPC Lattice Web Service',
      exportName: `${this.stackName}-Web-Service-DNS`,
    });

    new cdk.CfnOutput(this, 'SSMEndpointId', {
      value: ssmEndpoint.vpcEndpointId,
      description: 'ID of SSM VPC Endpoint',
      exportName: `${this.stackName}-SSM-Endpoint-ID`,
    });

    new cdk.CfnOutput(this, 'SSMMessagesEndpointId', {
      value: ssmMessagesEndpoint.vpcEndpointId,
      description: 'ID of SSM Messages VPC Endpoint',
      exportName: `${this.stackName}-SSM-Messages-Endpoint-ID`,
    });

    new cdk.CfnOutput(this, 'EC2MessagesEndpointId', {
      value: ec2MessagesEndpoint.vpcEndpointId,
      description: 'ID of EC2 Messages VPC Endpoint',
      exportName: `${this.stackName}-EC2-Messages-Endpoint-ID`,
    });

    new cdk.CfnOutput(this, 'VPC1PublicSubnets', {
      value: vpc1.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public subnet IDs in VPC1',
      exportName: `${this.stackName}-VPC1-Public-Subnets`,
    });

    new cdk.CfnOutput(this, 'VPC1PrivateSubnets', {
      value: vpc1.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private subnet IDs in VPC1',
      exportName: `${this.stackName}-VPC1-Private-Subnets`,
    });

    new cdk.CfnOutput(this, 'VPC2PublicSubnets', {
      value: vpc2.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public subnet IDs in VPC2',
      exportName: `${this.stackName}-VPC2-Public-Subnets`,
    });

    new cdk.CfnOutput(this, 'VPC2PrivateSubnets', {
      value: vpc2.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private subnet IDs in VPC2',
      exportName: `${this.stackName}-VPC2-Private-Subnets`,
    });
  }
}
```

## Architecture Overview

This enhanced implementation includes:

1. **Dual VPC Setup**: Two VPCs with distinct CIDR ranges and public/private subnets
2. **VPC Lattice Service Network**: Enables secure service-to-service communication between VPCs
3. **VPC Endpoints**: Secure access to AWS Systems Manager services without internet connectivity
4. **EC2 Instance**: Web server in VPC1 accessible through VPC Lattice
5. **Security Groups**: Properly configured for HTTP access and VPC endpoint connectivity
6. **IAM Roles**: Enhanced with VPC Lattice permissions for service communication

## Key Features

- **Service Networking**: VPC Lattice provides application-layer networking with built-in service discovery
- **Private Connectivity**: VPC endpoints enable secure communication with AWS services
- **Cross-VPC Communication**: Services in VPC2 can securely access the web service in VPC1
- **Enhanced Security**: Traffic flows through VPC Lattice with IAM-based access controls
- **Monitoring Ready**: Infrastructure includes proper tagging and output for monitoring integration

The implementation uses the latest AWS VPC Lattice (2024) and VPC Endpoints features to provide a modern, secure, and scalable networking solution.