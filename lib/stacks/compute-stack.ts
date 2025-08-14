import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  dataKey: kms.IKey;
  appBucket: s3.IBucket;
  appSecurityGroup?: ec2.ISecurityGroup;
  appInstanceRole?: iam.IRole;
}

export class ComputeStack extends cdk.Stack {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly asg: autoscaling.AutoScalingGroup;
  public readonly instanceRole: iam.Role;
  public readonly appSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Security Groups
    const albSg = new ec2.SecurityGroup(this, 'AlbSg', {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: 'Web ingress 80/443.',
    });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP');
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS');

    this.appSecurityGroup = new ec2.SecurityGroup(this, 'AppSg', {
      vpc: props.vpc,
      allowAllOutbound: true,
      description: 'App instances behind ALB.',
    });
    this.appSecurityGroup.addIngressRule(
      albSg,
      ec2.Port.tcp(80),
      'ALB to App HTTP'
    );

    // ALB across all public subnets/AZs
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: albSg,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    const httpListener = this.alb.addListener('HttpListener', {
      port: 80,
      open: false,
    });
    // No HTTPS listener (no ACM certificate per constraint)

    // IAM Role for EC2 instances (least-privilege)
    this.instanceRole = new iam.Role(this, 'AppInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description:
        'Allows EC2 to access S3 app bucket and SSM; DB access granted in DB stack.',
    });
    this.instanceRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );
    props.appBucket.grantReadWrite(this.instanceRole);

    // User data for simple health endpoint
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'dnf update -y || yum update -y',
      'dnf install -y httpd || yum install -y httpd',
      'echo "OK" > /var/www/html/health',
      'systemctl enable httpd && systemctl start httpd'
    );

    // ASG on private subnets
    this.asg = new autoscaling.AutoScalingGroup(this, 'Asg', {
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      minCapacity: 2,
      desiredCapacity: 2,
      maxCapacity: 6,
      instanceType: new ec2.InstanceType('t3.micro'),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      role: this.instanceRole,
      securityGroup: this.appSecurityGroup,
      associatePublicIpAddress: false,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: autoscaling.BlockDeviceVolume.ebs(20, {
            encrypted: true,
          }),
        },
      ],
      healthChecks: {
        types: ['ELB'],
      },
      userData,
    });

    httpListener.addTargets('AsgTargets', {
      port: 80,
      targets: [this.asg],
      healthCheck: { healthyHttpCodes: '200', path: '/health' },
    });

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: this.alb.loadBalancerDnsName,
    });
  }
}
