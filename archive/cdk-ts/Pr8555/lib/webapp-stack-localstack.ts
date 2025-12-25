import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface WebAppStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  regionName: string;
}

export class WebAppStack extends cdk.Stack {
  public readonly instanceDnsName: string;

  constructor(scope: Construct, id: string, props: WebAppStackProps) {
    super(scope, id, props);

    // LocalStack: Simplified stack without AutoScaling and Load Balancer
    // AutoScaling and ELBv2 are not available in LocalStack Community Edition

    // Create security group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `EC2SG-${props.regionName}`,
      {
        vpc: props.vpc,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
      }
    );

    // Allow HTTP traffic directly (no ALB in LocalStack Community)
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Create IAM role for EC2 instances
    const ec2Role = new iam.Role(this, `EC2Role-${props.regionName}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // User data script for web server setup
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      `echo "<html><body><h1>Web Application - Region: ${props.regionName}</h1><p>Environment: ${props.environmentSuffix}</p></body></html>" > /var/www/html/index.html`
    );

    // LocalStack: Create simple EC2 instances instead of AutoScaling Group
    // Create 2 instances for basic redundancy
    const instances: ec2.Instance[] = [];
    for (let i = 1; i <= 2; i++) {
      const instance = new ec2.Instance(
        this,
        `WebServer${i}-${props.regionName}`,
        {
          vpc: props.vpc,
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MICRO
          ),
          machineImage: ec2.MachineImage.latestAmazonLinux2(),
          securityGroup: ec2SecurityGroup,
          role: ec2Role,
          userData: userData,
          vpcSubnets: {
            subnetType: ec2.SubnetType.PUBLIC, // LocalStack: Using public subnets
          },
          instanceName: `web-${props.regionName.substring(0, 3)}-${i}-${props.environmentSuffix}`,
        }
      );

      // LocalStack: Add RemovalPolicy.DESTROY for easier cleanup
      instance.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
      instances.push(instance);

      // Export instance details
      new cdk.CfnOutput(this, `Instance${i}Id-${props.regionName}`, {
        value: instance.instanceId,
        description: `Web server ${i} instance ID in ${props.regionName}`,
      });

      new cdk.CfnOutput(this, `Instance${i}PublicDns-${props.regionName}`, {
        value: instance.instancePublicDnsName,
        description: `Web server ${i} public DNS in ${props.regionName}`,
        exportName: `Instance${i}-DNS-${props.regionName}-${props.environmentSuffix}`,
      });
    }

    // LocalStack: Export first instance DNS for Route 53 (simplified)
    // In real AWS, this would be the ALB DNS
    this.instanceDnsName = instances[0].instancePublicDnsName;

    new cdk.CfnOutput(this, `PrimaryInstanceDns-${props.regionName}`, {
      value: this.instanceDnsName,
      description: `Primary web server DNS in ${props.regionName}`,
      exportName: `Primary-DNS-${props.regionName}-${props.environmentSuffix}`,
    });

    // LocalStack: Note about limitations
    new cdk.CfnOutput(this, `LocalStackNote-${props.regionName}`, {
      value:
        'AutoScaling and Load Balancer not available in LocalStack Community - using simple EC2 instances',
      description: 'LocalStack limitations note',
    });
  }
}
