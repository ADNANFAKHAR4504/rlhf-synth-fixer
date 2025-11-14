import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as random from '@pulumi/random';

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
  public readonly primaryInstanceSecurityGroupId: pulumi.Output<string>;
  public readonly drInstanceSecurityGroupId: pulumi.Output<string>;

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

    // Skip HTTPS for test/PR environments to avoid ACM certificate validation timeouts
    const enableHttps = !environmentSuffix.toLowerCase().startsWith('pr');

    // Generate random suffix to avoid resource name conflicts
    const randomSuffix = new random.RandomString(
      `compute-random-suffix-${environmentSuffix}`,
      {
        length: 8,
        special: false,
        upper: false,
        lower: true,
        numeric: true,
      },
      { parent: this }
    );

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
    const primaryAlbIngressRules = [
      {
        protocol: 'tcp',
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow HTTP traffic from internet',
      },
    ];

    if (enableHttps) {
      primaryAlbIngressRules.push({
        protocol: 'tcp',
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow HTTPS traffic from internet',
      });
    }

    const primaryAlbSg = new aws.ec2.SecurityGroup(
      `primary-alb-sg-${environmentSuffix}`,
      {
        vpcId: primaryVpcId,
        description: 'Security group for primary ALB',
        ingress: primaryAlbIngressRules,
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
    const drAlbIngressRules = [
      {
        protocol: 'tcp',
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow HTTP traffic from internet',
      },
    ];

    if (enableHttps) {
      drAlbIngressRules.push({
        protocol: 'tcp',
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow HTTPS traffic from internet',
      });
    }

    const drAlbSg = new aws.ec2.SecurityGroup(
      `dr-alb-sg-${environmentSuffix}`,
      {
        vpcId: drVpcId,
        description: 'Security group for DR ALB',
        ingress: drAlbIngressRules,
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
        namePrefix: pulumi.interpolate`primary-lt-${environmentSuffix}-${randomSuffix.result}-`,
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
        namePrefix: pulumi.interpolate`dr-lt-${environmentSuffix}-${randomSuffix.result}-`,
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
        name: pulumi.interpolate`primary-tg-${environmentSuffix}-${randomSuffix.result}`,
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
        name: pulumi.interpolate`dr-tg-${environmentSuffix}-${randomSuffix.result}`,
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
        name: pulumi.interpolate`primary-asg-${environmentSuffix}-${randomSuffix.result}`,
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
        name: pulumi.interpolate`dr-asg-${environmentSuffix}-${randomSuffix.result}`,
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
        name: pulumi.interpolate`primary-alb-${environmentSuffix}-${randomSuffix.result}`,
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
        name: pulumi.interpolate`dr-alb-${environmentSuffix}-${randomSuffix.result}`,
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

    // HTTPS setup (only for production environments)
    if (enableHttps) {
      // ACM Certificate for primary region
      // NOTE: In production, replace with a validated certificate for your domain
      const primaryCert = new aws.acm.Certificate(
        `primary-cert-${environmentSuffix}`,
        {
          domainName: `payments-${environmentSuffix}.example.com`,
          validationMethod: 'DNS',
          subjectAlternativeNames: [
            `*.payments-${environmentSuffix}.example.com`,
          ],
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `primary-cert-${environmentSuffix}`,
            'DR-Role': 'primary',
          })),
        },
        { provider: primaryProvider, parent: this }
      );

      // ACM Certificate for DR region
      // NOTE: In production, replace with a validated certificate for your domain
      const drCert = new aws.acm.Certificate(
        `dr-cert-${environmentSuffix}`,
        {
          domainName: `payments-${environmentSuffix}.example.com`,
          validationMethod: 'DNS',
          subjectAlternativeNames: [
            `*.payments-${environmentSuffix}.example.com`,
          ],
          tags: pulumi.all([tags]).apply(([t]) => ({
            ...t,
            Name: `dr-cert-${environmentSuffix}`,
            'DR-Role': 'secondary',
          })),
        },
        { provider: drProvider, parent: this }
      );

      // HTTPS Listener for primary ALB
      new aws.lb.Listener(
        `primary-alb-https-listener-${environmentSuffix}`,
        {
          loadBalancerArn: primaryAlb.arn,
          port: 443,
          protocol: 'HTTPS',
          sslPolicy: 'ELBSecurityPolicy-TLS13-1-2-2021-06',
          certificateArn: primaryCert.arn,
          defaultActions: [
            {
              type: 'forward',
              targetGroupArn: primaryTargetGroup.arn,
            },
          ],
        },
        { provider: primaryProvider, parent: this }
      );

      // HTTPS Listener for DR ALB
      new aws.lb.Listener(
        `dr-alb-https-listener-${environmentSuffix}`,
        {
          loadBalancerArn: drAlb.arn,
          port: 443,
          protocol: 'HTTPS',
          sslPolicy: 'ELBSecurityPolicy-TLS13-1-2-2021-06',
          certificateArn: drCert.arn,
          defaultActions: [
            {
              type: 'forward',
              targetGroupArn: drTargetGroup.arn,
            },
          ],
        },
        { provider: drProvider, parent: this }
      );

      // HTTP Listener for primary ALB with redirect to HTTPS
      new aws.lb.Listener(
        `primary-alb-http-listener-${environmentSuffix}`,
        {
          loadBalancerArn: primaryAlb.arn,
          port: 80,
          protocol: 'HTTP',
          defaultActions: [
            {
              type: 'redirect',
              redirect: {
                port: '443',
                protocol: 'HTTPS',
                statusCode: 'HTTP_301',
              },
            },
          ],
        },
        { provider: primaryProvider, parent: this }
      );

      // HTTP Listener for DR ALB with redirect to HTTPS
      new aws.lb.Listener(
        `dr-alb-http-listener-${environmentSuffix}`,
        {
          loadBalancerArn: drAlb.arn,
          port: 80,
          protocol: 'HTTP',
          defaultActions: [
            {
              type: 'redirect',
              redirect: {
                port: '443',
                protocol: 'HTTPS',
                statusCode: 'HTTP_301',
              },
            },
          ],
        },
        { provider: drProvider, parent: this }
      );
    } else {
      // HTTP-only listeners for test/PR environments
      new aws.lb.Listener(
        `primary-alb-http-listener-${environmentSuffix}`,
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

      new aws.lb.Listener(
        `dr-alb-http-listener-${environmentSuffix}`,
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
    }

    this.primaryAlbDnsName = primaryAlb.dnsName;
    this.drAlbDnsName = drAlb.dnsName;
    this.primaryAlbZoneId = primaryAlb.zoneId;
    this.drAlbZoneId = drAlb.zoneId;
    this.primaryAlbArn = primaryAlb.arn;
    this.drAlbArn = drAlb.arn;
    this.primaryInstanceSecurityGroupId = primaryInstanceSg.id;
    this.drInstanceSecurityGroupId = drInstanceSg.id;

    this.registerOutputs({
      primaryAlbDnsName: this.primaryAlbDnsName,
      drAlbDnsName: this.drAlbDnsName,
      primaryAlbZoneId: this.primaryAlbZoneId,
      drAlbZoneId: this.drAlbZoneId,
      primaryAlbArn: this.primaryAlbArn,
      drAlbArn: this.drAlbArn,
      primaryInstanceSecurityGroupId: this.primaryInstanceSecurityGroupId,
      drInstanceSecurityGroupId: this.drInstanceSecurityGroupId,
    });
  }
}
