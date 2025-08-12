import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Import existing VPC
    const vpc = ec2.Vpc.fromLookup(this, 'ExistingVpc', {
      vpcId: 'vpc-0bb1c79de3EXAMPLE',
    });

    // Security Group - HTTPS only from internet
    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      securityGroupName: 'myapp-webserver-production',
      description: 'Security group for MyApp web server - HTTPS only',
      allowAllOutbound: true, // Unrestricted egress as required
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // IAM Role with minimal S3 permissions 
    const ec2Role = new iam.Role(this, 'Ec2Role', {
      roleName: 'myapp-ec2role-production',
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for MyApp EC2 instances with S3 read-only access',
      inlinePolicies: {
        S3ReadOnlyPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:Get*', 's3:List*'],
              resources: ['*'], // All S3 buckets as specified
            }),
          ],
        }),
      },
    });

    // Instance Profile for EC2
    const instanceProfile = new iam.InstanceProfile(this, 'InstanceProfile', {
      instanceProfileName: 'myapp-instanceprofile-production',
      role: ec2Role,
    });

    // Get Amazon Linux 2023 AMI via SSM Parameter
    const amiId = ec2.MachineImage.fromSsmParameter(
      '/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64'
    );

    // EC2 Instance in public subnet
    const instance = new ec2.Instance(this, 'WebServerInstance', {
      instanceName: 'myapp-webserver-production',
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC, // Public subnet as required
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: amiId,
      securityGroup,
      role: ec2Role,
      keyName: undefined, // No SSH key pair for security
    });

    // Outputs
    new cdk.CfnOutput(this, 'InstanceId', {
      value: instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: securityGroup.securityGroupId,
      description: 'Security Group ID',
    });

    new cdk.CfnOutput(this, 'InstanceProfileArn', {
      value: instanceProfile.instanceProfileArn,
      description: 'Instance Profile ARN',
    });
  }
}
