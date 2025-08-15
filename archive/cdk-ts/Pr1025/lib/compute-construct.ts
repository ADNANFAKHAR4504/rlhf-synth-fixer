import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface ComputeConstructProps {
  vpc: ec2.IVpc;
  environmentSuffix: string;
  securityGroup: ec2.ISecurityGroup;
  instanceType?: ec2.InstanceType;
  keyPairName?: string;
}

export class ComputeConstruct extends Construct {
  public readonly instances: ec2.Instance[];
  public readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    // Create IAM role for EC2 instances
    this.role = new iam.Role(this, 'Ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for web application EC2 instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Add custom policy for S3 access (if needed)
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: ['*'], // This should be restricted to specific buckets in production
      })
    );

    // User data script for instance setup
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Web Application Server</h1>" > /var/www/html/index.html',
      // Install CloudWatch agent
      'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm',
      'rpm -U ./amazon-cloudwatch-agent.rpm',
      // Install Inspector agent
      'curl -O https://inspector-agent.amazonaws.com/linux/latest/install',
      'bash install'
    );

    this.instances = [];

    // Create EC2 instances in each private subnet
    props.vpc.privateSubnets.forEach((subnet, index) => {
      const instance = new ec2.Instance(this, `WebAppInstance${index + 1}`, {
        vpc: props.vpc,
        vpcSubnets: { subnets: [subnet] },
        instanceType:
          props.instanceType ||
          ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        securityGroup: props.securityGroup,
        role: this.role,
        userData: userData,
        keyName: props.keyPairName,
      });

      cdk.Tags.of(instance).add(
        'Name',
        `WebApp-Instance-${index + 1}-${props.environmentSuffix}`
      );
      cdk.Tags.of(instance).add('Component', 'Compute');
      cdk.Tags.of(instance).add('Environment', props.environmentSuffix);

      this.instances.push(instance);
    });
  }
}
