import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface ComputeStackProps {
  vpc: ec2.Vpc;
  publicSubnet: ec2.ISubnet;
  privateSubnet: ec2.ISubnet;
  securityGroupPublic: ec2.SecurityGroup;
  securityGroupPrivate: ec2.SecurityGroup;
  environmentSuffix?: string;
}

export class ComputeStack extends Construct {
  public readonly publicInstance: ec2.Instance;
  public readonly privateInstance: ec2.Instance;
  public readonly keyPair: ec2.KeyPair;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Get the latest Amazon Linux 2023 AMI
    const machineImage = ec2.MachineImage.latestAmazonLinux2023({
      edition: ec2.AmazonLinuxEdition.STANDARD,
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    // Create key pair for EC2 instances
    this.keyPair = new ec2.KeyPair(this, 'keyPairBasic', {
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
      keyPair: this.keyPair,
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
      keyPair: this.keyPair,
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

    cdk.Tags.of(this.keyPair).add('Environment', 'Development');
    cdk.Tags.of(this.keyPair).add('Name', `keyPairBasic${environmentSuffix}`);
  }
}
