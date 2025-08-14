import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
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

    // Create destroyable VPC instead of importing existing one
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      vpcName: `tap-vpc-${environmentSuffix}`,
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      natGateways: 0, // No NAT gateways for cost efficiency
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `tap-public-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Security Group - HTTPS only from internet
    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      securityGroupName: `myapp-webserver-${environmentSuffix}`,
      description: `Security group for MyApp web server - HTTPS only (${environmentSuffix})`,
      allowAllOutbound: true, // Unrestricted egress as required
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // IAM Role with minimal S3 permissions
    const ec2Role = new iam.Role(this, 'Ec2Role', {
      roleName: `myapp-ec2role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: `IAM role for MyApp EC2 instances with S3 read-only access (${environmentSuffix})`,
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
      instanceProfileName: `myapp-instanceprofile-${environmentSuffix}`,
      role: ec2Role,
    });

    // Get Amazon Linux 2023 AMI via SSM Parameter
    const amiId = ec2.MachineImage.fromSsmParameter(
      '/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64'
    );

    // EC2 Instance in public subnet
    const instance = new ec2.Instance(this, 'WebServerInstance', {
      instanceName: `myapp-webserver-${environmentSuffix}`,
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
      // No SSH key pair for security (keyName property removed due to deprecation)
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
