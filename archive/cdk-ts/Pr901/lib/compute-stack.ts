import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  ec2Role: iam.Role;
}

export class ComputeStack extends cdk.NestedStack {
  public readonly ec2Instance: ec2.Instance;
  public readonly vpc: ec2.IVpc;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const { environmentSuffix, ec2Role } = props;

    // Use the default VPC to avoid VPC limit issues
    this.vpc = ec2.Vpc.fromLookup(this, 'DefaultVPC', {
      isDefault: true,
    });

    // Security group with minimal required access
    const securityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `ec2-sg-${environmentSuffix}`,
      description: 'Security group for EC2 instance',
      allowAllOutbound: true,
    });

    // CloudWatch Log Group for EC2 logs
    new logs.LogGroup(this, 'EC2LogGroup', {
      logGroupName: `/aws/ec2/logs-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // User data script for CloudWatch agent installation
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'systemctl enable amazon-cloudwatch-agent',
      'systemctl start amazon-cloudwatch-agent'
    );

    // EC2 instance with IAM role
    this.ec2Instance = new ec2.Instance(this, 'SecureEC2Instance', {
      instanceName: `secure-ec2-${environmentSuffix}`,
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
      }),
      role: ec2Role,
      securityGroup,
      userData,
      detailedMonitoring: true,
    });

    // Apply tags
    cdk.Tags.of(this).add('Project', 'IaCChallenge');
  }
}
