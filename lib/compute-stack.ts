import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ComputeStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  primaryVpcId: pulumi.Output<string>;
  drVpcId: pulumi.Output<string>;
  primaryPublicSubnetIds: pulumi.Output<string[]>;
  drPublicSubnetIds: pulumi.Output<string[]>;
  primaryPrivateSubnetIds: pulumi.Output<string[]>;
  drPrivateSubnetIds: pulumi.Output<string[]>;
  primaryProvider: aws.Provider;
  drProvider: aws.Provider;
}

export class ComputeStack extends pulumi.ComponentResource {
  public readonly primaryAlbDnsName: pulumi.Output<string>;
  public readonly drAlbDnsName: pulumi.Output<string>;
  public readonly primaryAlbZoneId: pulumi.Output<string>;
  public readonly drAlbZoneId: pulumi.Output<string>;
  public readonly primaryAlbArn: pulumi.Output<string>;
  public readonly drAlbArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: ComputeStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:compute:ComputeStack', name, args, opts);

    const {
      environmentSuffix,
      tags,
      primaryVpcId,
      drVpcId,
      primaryPublicSubnetIds,
      drPublicSubnetIds,
      primaryPrivateSubnetIds,
      drPrivateSubnetIds,
      primaryProvider,
      drProvider,
    } = args;

    // Get latest Amazon Linux 2 AMI for primary region
    const primaryAmi = aws.ec2.getAmi(
      {
        mostRecent: true,
        owners: ['amazon'],
        filters: [
          {
            name: 'name',
            values: ['amzn2-ami-hvm-*-x86_64-gp2'],
          },
        ],
      },
      { provider: primaryProvider }
    );

    // Get latest Amazon Linux 2 AMI for DR region
    const drAmi = aws.ec2.getAmi(
      {
        mostRecent: true,
        owners: ['amazon'],
        filters: [
          {
            name: 'name',
            values: ['amzn2-ami-hvm-*-x86_64-gp2'],
          },
        ],
      },
      { provider: drProvider }
    );

    // Security group for ALB in primary region
    const primaryAlbSg = new aws.ec2.SecurityGroup(
      `primary-alb-sg-${environmentSuffix}`,
      {
        vpcId: primaryVpcId,
        description: 'Security group for primary ALB',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `primary-alb-sg-${environmentSuffix}`,
          'DR-Role': 'primary',
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    // Security group for ALB in DR region
    const drAlbSg = new aws.ec2.SecurityGroup(
      `dr-alb-sg-${environmentSuffix}`,
      {
        vpcId: drVpcId,
        description: 'Security group for DR ALB',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `dr-alb-sg-${environmentSuffix}`,
          'DR-Role': 'secondary',
        })),
      },
      { provider: drProvider, parent: this }
    );

    // Security group for EC2 instances in primary region
    const primaryInstanceSg = new aws.ec2.SecurityGroup(
      `primary-instance-sg-${environmentSuffix}`,
      {
        vpcId: primaryVpcId,
        description: 'Security group for primary EC2 instances',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [primaryAlbSg.id],
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `primary-instance-sg-${environmentSuffix}`,
          'DR-Role': 'primary',
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    // Security group for EC2 instances in DR region
    const drInstanceSg = new aws.ec2.SecurityGroup(
      `dr-instance-sg-${environmentSuffix}`,
      {
        vpcId: drVpcId,
        description: 'Security group for DR EC2 instances',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [drAlbSg.id],
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `dr-instance-sg-${environmentSuffix}`,
          'DR-Role': 'secondary',
        })),
      },
      { provider: drProvider, parent: this }
    );

    // User data script with health endpoint
    const userData = `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Main page
REGION=$(ec2-metadata --availability-zone | cut -d' ' -f2)
echo "<h1>Payment Processing System</h1><p>Region: $REGION</p><p>Status: Active</p>" > /var/www/html/index.html

# Health endpoint for Route53 health checks
echo "OK" > /var/www/html/health.html
`;

    // Launch template for primary region
    const primaryLaunchTemplate = new aws.ec2.LaunchTemplate(
      `primary-lt-${environmentSuffix}`,
      {
        namePrefix: `primary-lt-${environmentSuffix}`,
        imageId: pulumi.output(primaryAmi).apply(ami => ami.id),
        instanceType: 't3.medium',
        vpcSecurityGroupIds: [primaryInstanceSg.id],
        userData: Buffer.from(userData).toString('base64'),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `primary-lt-${environmentSuffix}`,
          'DR-Role': 'primary',
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    // Launch template for DR region
    const drLaunchTemplate = new aws.ec2.LaunchTemplate(
      `dr-lt-${environmentSuffix}`,
      {
        namePrefix: `dr-lt-${environmentSuffix}`,
        imageId: pulumi.output(drAmi).apply(ami => ami.id),
        instanceType: 't3.medium',
        vpcSecurityGroupIds: [drInstanceSg.id],
        userData: Buffer.from(userData).toString('base64'),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `dr-lt-${environmentSuffix}`,
          'DR-Role': 'secondary',
        })),
      },
      { provider: drProvider, parent: this }
    );

    // Target group for primary ALB
    const primaryTargetGroup = new aws.lb.TargetGroup(
      `primary-tg-${environmentSuffix}`,
      {
        name: `primary-tg-${environmentSuffix}`,
        port: 80,
        protocol: 'HTTP',
        vpcId: primaryVpcId,
        healthCheck: {
          enabled: true,
          path: '/health.html',
          protocol: 'HTTP',
          matcher: '200',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `primary-tg-${environmentSuffix}`,
          'DR-Role': 'primary',
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    // Target group for DR ALB
    const drTargetGroup = new aws.lb.TargetGroup(
      `dr-tg-${environmentSuffix}`,
      {
        name: `dr-tg-${environmentSuffix}`,
        port: 80,
        protocol: 'HTTP',
        vpcId: drVpcId,
        healthCheck: {
          enabled: true,
          path: '/health.html',
          protocol: 'HTTP',
          matcher: '200',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `dr-tg-${environmentSuffix}`,
          'DR-Role': 'secondary',
        })),
      },
      { provider: drProvider, parent: this }
    );

    // Auto Scaling Group for primary region
    const _primaryAsg = new aws.autoscaling.Group(
      `primary-asg-${environmentSuffix}`,
      {
        name: `primary-asg-${environmentSuffix}`,
        vpcZoneIdentifiers: primaryPrivateSubnetIds,
        targetGroupArns: [primaryTargetGroup.arn],
        minSize: 2,
        maxSize: 6,
        desiredCapacity: 2,
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        launchTemplate: {
          id: primaryLaunchTemplate.id,
          version: '$Latest',
        },
        tags: [
          {
            key: 'Name',
            value: `primary-asg-instance-${environmentSuffix}`,
            propagateAtLaunch: true,
          },
          {
            key: 'DR-Role',
            value: 'primary',
            propagateAtLaunch: true,
          },
          {
            key: 'Environment',
            value: environmentSuffix,
            propagateAtLaunch: true,
          },
        ],
      },
      { provider: primaryProvider, parent: this }
    );
    void _primaryAsg;

    // Auto Scaling Group for DR region
    const _drAsg = new aws.autoscaling.Group(
      `dr-asg-${environmentSuffix}`,
      {
        name: `dr-asg-${environmentSuffix}`,
        vpcZoneIdentifiers: drPrivateSubnetIds,
        targetGroupArns: [drTargetGroup.arn],
        minSize: 2,
        maxSize: 6,
        desiredCapacity: 2,
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        launchTemplate: {
          id: drLaunchTemplate.id,
          version: '$Latest',
        },
        tags: [
          {
            key: 'Name',
            value: `dr-asg-instance-${environmentSuffix}`,
            propagateAtLaunch: true,
          },
          {
            key: 'DR-Role',
            value: 'secondary',
            propagateAtLaunch: true,
          },
          {
            key: 'Environment',
            value: environmentSuffix,
            propagateAtLaunch: true,
          },
        ],
      },
      { provider: drProvider, parent: this }
    );
    void _drAsg;

    // Application Load Balancer for primary region
    const primaryAlb = new aws.lb.LoadBalancer(
      `primary-alb-${environmentSuffix}`,
      {
        name: `primary-alb-${environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [primaryAlbSg.id],
        subnets: primaryPublicSubnetIds,
        enableHttp2: true,
        enableDeletionProtection: false,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `primary-alb-${environmentSuffix}`,
          'DR-Role': 'primary',
        })),
      },
      { provider: primaryProvider, parent: this }
    );

    // Application Load Balancer for DR region
    const drAlb = new aws.lb.LoadBalancer(
      `dr-alb-${environmentSuffix}`,
      {
        name: `dr-alb-${environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [drAlbSg.id],
        subnets: drPublicSubnetIds,
        enableHttp2: true,
        enableDeletionProtection: false,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `dr-alb-${environmentSuffix}`,
          'DR-Role': 'secondary',
        })),
      },
      { provider: drProvider, parent: this }
    );

    // Listener for primary ALB
    new aws.lb.Listener(
      `primary-alb-listener-${environmentSuffix}`,
      {
        loadBalancerArn: primaryAlb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: primaryTargetGroup.arn,
          },
        ],
      },
      { provider: primaryProvider, parent: this }
    );

    // Listener for DR ALB
    new aws.lb.Listener(
      `dr-alb-listener-${environmentSuffix}`,
      {
        loadBalancerArn: drAlb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: drTargetGroup.arn,
          },
        ],
      },
      { provider: drProvider, parent: this }
    );

    this.primaryAlbDnsName = primaryAlb.dnsName;
    this.drAlbDnsName = drAlb.dnsName;
    this.primaryAlbZoneId = primaryAlb.zoneId;
    this.drAlbZoneId = drAlb.zoneId;
    this.primaryAlbArn = primaryAlb.arn;
    this.drAlbArn = drAlb.arn;

    this.registerOutputs({
      primaryAlbDnsName: this.primaryAlbDnsName,
      drAlbDnsName: this.drAlbDnsName,
      primaryAlbZoneId: this.primaryAlbZoneId,
      drAlbZoneId: this.drAlbZoneId,
      primaryAlbArn: this.primaryAlbArn,
      drAlbArn: this.drAlbArn,
    });
  }
}
