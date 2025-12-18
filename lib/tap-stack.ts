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

    const stackName = `TapStack${environmentSuffix}`;

    // SSM parameter for AMI ID (required for CfnInstance)
    const amiIdParameter = new cdk.CfnParameter(
      this,
      'SsmParameterValueawsserviceamiamazonlinuxlatestal2023amikernel61x8664C96584B6F00A464EAD1953AFF4B05118Parameter',
      {
        type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>',
        default:
          '/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64',
      }
    );

    // Create VPC with CIDR 10.0.0.0/16
    // LocalStack Community has limited NAT Gateway support, so use PRIVATE_ISOLATED for testing
    const isLocalStack =
      process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      process.env.AWS_ENDPOINT_URL?.includes('4566');

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
          // Use PRIVATE_ISOLATED for LocalStack (no NAT Gateway)
          subnetType: isLocalStack
            ? ec2.SubnetType.PRIVATE_ISOLATED
            : ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      // Disable NAT Gateway for LocalStack
      natGateways: isLocalStack ? 0 : 1,
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

    // Create key pair for SSH access
    const keyPair = new ec2.CfnKeyPair(this, 'TapKeyPair', {
      keyName: `tap-key-${environmentSuffix}`,
      keyType: 'rsa',
    });

    // Create EC2 instance in public subnet - use CfnInstance for LocalStack
    const publicInstance = new ec2.CfnInstance(this, 'PublicInstance', {
      instanceType: 't3.micro',
      imageId: amiIdParameter.valueAsString,
      subnetId: vpc.publicSubnets[0].subnetId,
      securityGroupIds: [sshSecurityGroup.securityGroupId],
      keyName: keyPair.keyName,
      tags: [
        { key: 'Name', value: `tap-public-instance-${environmentSuffix}` },
        { key: 'Environment', value: 'Development' },
      ],
    });

    // Create EC2 instance in private subnet - use CfnInstance for LocalStack
    // For LocalStack PRIVATE_ISOLATED, use isolatedSubnets instead of privateSubnets
    const privateSubnetId = isLocalStack
      ? vpc.isolatedSubnets[0].subnetId
      : vpc.privateSubnets[0].subnetId;

    const privateInstance = new ec2.CfnInstance(this, 'PrivateInstance', {
      instanceType: 't3.micro',
      imageId: amiIdParameter.valueAsString,
      subnetId: privateSubnetId,
      securityGroupIds: [sshSecurityGroup.securityGroupId],
      keyName: keyPair.keyName,
      tags: [
        { key: 'Name', value: `tap-private-instance-${environmentSuffix}` },
        { key: 'Environment', value: 'Development' },
      ],
    });

    // Apply Environment=Development tag to all resources in the stack
    cdk.Tags.of(this).add('Environment', 'Development');

    // Output important resource information
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${stackName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: vpc.vpcCidrBlock,
      description: 'VPC CIDR Block',
      exportName: `${stackName}-VpcCidr`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: `${stackName}-PublicSubnetIds`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: isLocalStack
        ? vpc.isolatedSubnets.map(subnet => subnet.subnetId).join(',')
        : vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: `${stackName}-PrivateSubnetIds`,
    });

    // Output NAT Gateway IDs (only if NAT Gateway exists)
    // For LocalStack, NAT Gateway is disabled (natGateways: 0)
    // For non-LocalStack, CDK creates NAT Gateway automatically
    const natGatewayId = isLocalStack ? 'N/A-LocalStack' : 'AutoGenerated';
    new cdk.CfnOutput(this, 'NatGatewayIds', {
      value: natGatewayId,
      description: 'NAT Gateway ID (N/A in LocalStack)',
      exportName: `${stackName}-NatGatewayId`,
    });

    new cdk.CfnOutput(this, 'InternetGatewayId', {
      value: vpc.internetGatewayId || 'N/A',
      description: 'Internet Gateway ID',
      exportName: `${stackName}-InternetGatewayId`,
    });

    new cdk.CfnOutput(this, 'PublicInstanceId', {
      value: publicInstance.ref,
      description: 'Public EC2 Instance ID',
      exportName: `${stackName}-PublicInstanceId`,
    });

    new cdk.CfnOutput(this, 'PrivateInstanceId', {
      value: privateInstance.ref,
      description: 'Private EC2 Instance ID',
      exportName: `${stackName}-PrivateInstanceId`,
    });

    new cdk.CfnOutput(this, 'PublicInstancePublicIp', {
      value: publicInstance.attrPublicIp,
      description: 'Public EC2 Instance Public IP',
      exportName: `${stackName}-PublicInstancePublicIp`,
    });

    new cdk.CfnOutput(this, 'PublicInstancePrivateIp', {
      value: publicInstance.attrPrivateIp,
      description: 'Public EC2 Instance Private IP',
      exportName: `${stackName}-PublicInstancePrivateIp`,
    });

    new cdk.CfnOutput(this, 'PrivateInstancePrivateIp', {
      value: privateInstance.attrPrivateIp,
      description: 'Private EC2 Instance Private IP',
      exportName: `${stackName}-PrivateInstancePrivateIp`,
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: sshSecurityGroup.securityGroupId,
      description: 'SSH Security Group ID',
      exportName: `${stackName}-SecurityGroupId`,
    });

    new cdk.CfnOutput(this, 'KeyPairName', {
      value: keyPair.keyName || 'N/A',
      description: 'EC2 Key Pair Name',
      exportName: `${stackName}-KeyPairName`,
    });

    new cdk.CfnOutput(this, 'KeyPairId', {
      value: keyPair.attrKeyPairId,
      description: 'EC2 Key Pair ID',
      exportName: `${stackName}-KeyPairId`,
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment Suffix',
      exportName: `${stackName}-EnvironmentSuffix`,
    });
  }
}
