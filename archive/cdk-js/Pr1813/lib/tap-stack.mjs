import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Get optional SSH key name from props or context (if not provided, SSH access is disabled)
    const sshKeyName = 
      props?.sshKeyName ||
      this.node.tryGetContext('sshKeyName') ||
      null;

    // Create VPC with public and private subnets across 2 AZs
    const vpc = new ec2.Vpc(this, `CloudEnvVpc-${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `PublicSubnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `PrivateSubnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }
      ]
    });

    // Security Group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, `ALBSecurityGroup-${environmentSuffix}`, {
      vpc: vpc,
      description: `ALB Security Group for ${environmentSuffix} environment`,
      allowAllOutbound: true
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Security Group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, `EC2SecurityGroup-${environmentSuffix}`, {
      vpc: vpc,
      description: `EC2 Security Group for ${environmentSuffix} environment`,
      allowAllOutbound: true
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    // Add SSH access only if SSH key is provided
    if (sshKeyName) {
      ec2SecurityGroup.addIngressRule(
        ec2.Peer.ipv4(vpc.vpcCidrBlock),
        ec2.Port.tcp(22),
        'Allow SSH from VPC'
      );
    }

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, `CloudEnvALB-${environmentSuffix}`, {
      vpc: vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      }
    });

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, `EC2TargetGroup-${environmentSuffix}`, {
      vpc: vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.INSTANCE,
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        path: '/health',
        protocol: elbv2.Protocol.HTTP
      }
    });

    // ALB Listener
    const listener = alb.addListener(`ALBListener-${environmentSuffix}`, {
      port: 80,
      defaultTargetGroups: [targetGroup]
    });

    // EC2 instances in private subnets
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Hello from EC2 in ' + environmentSuffix + ' environment</h1>" > /var/www/html/index.html',
      'echo "OK" > /var/www/html/health'
    );

    const privateSubnets = vpc.selectSubnets({
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
    });

    // Create EC2 instances in each private subnet
    const instances = [];
    privateSubnets.subnets.forEach((subnet, index) => {
      const instance = new ec2.Instance(this, `EC2Instance${index + 1}-${environmentSuffix}`, {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
        machineImage: ec2.MachineImage.genericLinux({
          'us-east-1': 'ami-0c02fb55956c7d316',  // Amazon Linux 2023
          'us-west-2': 'ami-0c2d3e23d9d2d1234',  // Amazon Linux 2023
        }),
        vpc: vpc,
        vpcSubnets: { subnets: [subnet] },
        securityGroup: ec2SecurityGroup,
        userData: userData,
        ...(sshKeyName && { keyPair: ec2.KeyPair.fromKeyPairName(this, `KeyPair${index + 1}-${environmentSuffix}`, sshKeyName) })
      });
      
      instances.push(instance);
      targetGroup.addTarget(new targets.InstanceTarget(instance));
    });

    // Outputs
    new cdk.CfnOutput(this, `VpcId-${environmentSuffix}`, {
      value: vpc.vpcId,
      description: `VPC ID for ${environmentSuffix} environment`
    });

    new cdk.CfnOutput(this, `ALBDnsName-${environmentSuffix}`, {
      value: alb.loadBalancerDnsName,
      description: `ALB DNS name for ${environmentSuffix} environment`
    });

    new cdk.CfnOutput(this, `EC2InstanceIds-${environmentSuffix}`, {
      value: instances.map(instance => instance.instanceId).join(','),
      description: `EC2 Instance IDs for ${environmentSuffix} environment`
    });
  }
}

export { TapStack };
