import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  publicSubnet: ec2.ISubnet;
  privateSubnet: ec2.ISubnet;
  securityGroupPublic: ec2.SecurityGroup;
  securityGroupPrivate: ec2.SecurityGroup;
  environmentSuffix?: string;
}

export class ComputeStack extends cdk.Stack {
  public readonly publicInstance: ec2.Instance;
  public readonly privateInstance: ec2.Instance;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Get the latest Amazon Linux 2023 AMI
    const machineImage = ec2.MachineImage.latestAmazonLinux2023({
      edition: ec2.AmazonLinuxEdition.STANDARD,
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    // Create key pair for EC2 instances
    const keyPair = new ec2.KeyPair(this, 'keyPairBasic', {
      keyPairName: `keyPairBasic${environmentSuffix}`,
      type: ec2.KeyPairType.RSA,
      format: ec2.KeyPairFormat.PEM,
    });

    // EC2 Instance in Public Subnet
    this.publicInstance = new ec2.Instance(this, 'instancePublic', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: machineImage,
      vpc: props.vpc,
      vpcSubnets: {
        subnets: [props.publicSubnet],
      },
      securityGroup: props.securityGroupPublic,
      keyPair: keyPair,
      associatePublicIpAddress: true,
      instanceName: `instancePublic${environmentSuffix}`,
    });

    // EC2 Instance in Private Subnet
    this.privateInstance = new ec2.Instance(this, 'instancePrivate', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: machineImage,
      vpc: props.vpc,
      vpcSubnets: {
        subnets: [props.privateSubnet],
      },
      securityGroup: props.securityGroupPrivate,
      keyPair: keyPair,
      associatePublicIpAddress: false,
      instanceName: `instancePrivate${environmentSuffix}`,
    });

    // Add tags
    cdk.Tags.of(this.publicInstance).add('Environment', 'Development');
    cdk.Tags.of(this.publicInstance).add(
      'Name',
      `instancePublic${environmentSuffix}`
    );

    cdk.Tags.of(this.privateInstance).add('Environment', 'Development');
    cdk.Tags.of(this.privateInstance).add(
      'Name',
      `instancePrivate${environmentSuffix}`
    );

    cdk.Tags.of(keyPair).add('Environment', 'Development');
    cdk.Tags.of(keyPair).add('Name', `keyPairBasic${environmentSuffix}`);

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
