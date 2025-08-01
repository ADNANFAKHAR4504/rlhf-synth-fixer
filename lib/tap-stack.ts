import * as cdk from 'aws-cdk-lib';
import { CfnOutput, Tags } from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // The project template suggests creating separate stacks for resources.
    // For a self-contained application of this size, defining the resources
    // directly within this stack is clearer and more maintainable.

    // 1. VPC Configuration (Best Practice: Multi-AZ with Public and Private Subnets)
    const vpc = new ec2.Vpc(this, 'WebAppVpc', {
      maxAzs: 2, // Spans across 2 Availability Zones for high availability
      natGateways: 1, // Creates a NAT Gateway for outbound traffic from private subnets
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // 2. IAM Role for EC2 Instances (Least Privilege)
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      // The prompt requires an IAM role with "only required permissions." Since no
      // specific permissions for accessing other AWS services were mentioned,
      // we create a role with no policies attached. This adheres to the
      // principle of least privilege.
    });

    // 3. Security Groups
    // Security Group for the Load Balancer
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Allow HTTP traffic to ALB',
      allowAllOutbound: true,
    });
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from anywhere'
    );

    // Security Group for the EC2 Instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Allow HTTP from ALB and SSH',
      allowAllOutbound: true,
    });
    // Allow traffic only from the ALB's security group on port 80
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );
    // Per the prompt, allow SSH. For production, this should be restricted to a bastion host or specific IP.
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access from anywhere (Not recommended for production)'
    );

    // 4. Auto Scaling Group Configuration
    const asg = new autoscaling.AutoScalingGroup(this, 'WebAppASG', {
      vpc,
      instanceType: new ec2.InstanceType('t2.micro'),
      // Using latest Amazon Linux 2 AMI is a best practice. It automatically finds the
      // correct AMI for the deployment region, unlike a static placeholder.
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      role: ec2Role,
      securityGroup: ec2SecurityGroup,
      minCapacity: 2,
      maxCapacity: 5,
      // Place instances in private subnets for security
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // 5. Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'WebAppALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      // Place ALB in public subnets to be accessible from the internet
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    const listener = alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
    });

    listener.addTargets('ASGTargets', {
      port: 80,
      targets: [asg],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.minutes(1),
      },
    });

    // 6. Stack Outputs
    new CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Public DNS of the Application Load Balancer',
    });

    // 7. Tagging - Applied to all resources in the stack
    Tags.of(this).add('Application', 'WebApp');
    Tags.of(this).add('Environment', 'Production');
  }
}
