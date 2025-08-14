import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  environmentSuffix?: string;
}

export class ComputeStack extends cdk.Stack {
  public readonly ec2Instance: ec2.Instance;
  public readonly ec2SecurityGroup: ec2.SecurityGroup;
  public readonly ec2Role: iam.Role;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Security Group for EC2 instance
    this.ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `Ec2SecurityGroup-${environmentSuffix}`,
      {
        vpc: props.vpc,
        description: 'Security group for EC2 instance',
        allowAllOutbound: true,
      }
    );

    // Allow SSH access from anywhere (adjust as needed for production)
    this.ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'SSH access'
    );

    // Allow HTTP access
    this.ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP access'
    );

    // Allow HTTPS access
    this.ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS access'
    );

    // Create IAM role for EC2 instance
    this.ec2Role = new iam.Role(this, `Ec2Role-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Add policy to access database credentials
    // Uses a pattern to avoid circular dependencies with database stack
    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
        ],
        resources: [
          `arn:aws:secretsmanager:${this.region}:${this.account}:secret:*DbCredentials-${environmentSuffix}*`,
        ],
      })
    );

    // Create EC2 instance in public subnet
    this.ec2Instance = new ec2.Instance(
      this,
      `WebServer-${environmentSuffix}`,
      {
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        securityGroup: this.ec2SecurityGroup,
        role: this.ec2Role,
        userData: ec2.UserData.forLinux(),
      }
    );

    // User data script to install basic packages
    this.ec2Instance.addUserData(
      'yum update -y',
      'yum install -y postgresql15',
      'echo "EC2 instance setup complete" > /var/log/setup.log'
    );

    // Outputs
    new cdk.CfnOutput(this, 'Ec2InstanceId', {
      value: this.ec2Instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'Ec2PublicIp', {
      value: this.ec2Instance.instancePublicIp,
      description: 'EC2 Instance Public IP',
    });

    new cdk.CfnOutput(this, 'Ec2SecurityGroupId', {
      value: this.ec2SecurityGroup.securityGroupId,
      description: 'EC2 Security Group ID',
    });
  }
}
