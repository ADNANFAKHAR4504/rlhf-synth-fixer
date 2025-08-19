import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface ComputeStackArgs {
  environmentSuffix: string;
  region: string;
  vpcId: pulumi.Input<string>;
  publicSubnetIds: pulumi.Input<string[]>;
  privateSubnetIds: pulumi.Input<string[]>;
  instanceRole: pulumi.Input<string>;
  s3BucketArn: pulumi.Input<string>;
  allowedCidr: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  albSecurityGroupId?: pulumi.Input<string>;
  ec2SecurityGroupId?: pulumi.Input<string>;
}

export class ComputeStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly albArn: pulumi.Output<string>;
  public readonly asgArn: pulumi.Output<string>;

  constructor(name: string, args: ComputeStackArgs, opts?: ResourceOptions) {
    super('tap:stack:ComputeStack', name, args, opts);

    const {
      environmentSuffix,
      region,
      vpcId,
      publicSubnetIds,
      privateSubnetIds,
      allowedCidr,
      tags,
      albSecurityGroupId,
      ec2SecurityGroupId,
    } = args;

    // Use provided security group or create a new one
    let albSecurityGroupIdToUse: pulumi.Output<string>;
    if (albSecurityGroupId) {
      albSecurityGroupIdToUse = pulumi.output(albSecurityGroupId);
    } else {
      const albSecurityGroup = new aws.ec2.SecurityGroup(
        `tap-alb-sg-compute-${region}-${environmentSuffix}`,
        {
          name: `tap-alb-sg-compute-${region}-${environmentSuffix}`,
          description: 'ALB Security Group - HTTP only',
          vpcId: vpcId,
          ingress: [
            {
              protocol: 'tcp',
              fromPort: 80,
              toPort: 80,
              cidrBlocks: ['0.0.0.0/0'],
              description: 'HTTP from anywhere',
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
          tags: {
            ...tags,
            Name: `tap-alb-sg-compute-${region}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );
      albSecurityGroupIdToUse = albSecurityGroup.id;
    }

    let ec2SecurityGroupIdToUse: pulumi.Output<string>;
    if (ec2SecurityGroupId) {
      ec2SecurityGroupIdToUse = pulumi.output(ec2SecurityGroupId);
    } else {
      const ec2SecurityGroup = new aws.ec2.SecurityGroup(
        `tap-ec2-sg-compute-${region}-${environmentSuffix}`,
        {
          name: `tap-ec2-sg-compute-${region}-${environmentSuffix}`,
          description: 'EC2 Security Group',
          vpcId: vpcId,
          ingress: [
            {
              protocol: 'tcp',
              fromPort: 80,
              toPort: 80,
              securityGroups: [albSecurityGroupIdToUse],
              description: 'HTTP from ALB',
            },
            {
              protocol: 'tcp',
              fromPort: 22,
              toPort: 22,
              cidrBlocks: [allowedCidr],
              description: 'SSH from allowed CIDR only',
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
          tags: {
            ...tags,
            Name: `tap-ec2-sg-compute-${region}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );
      ec2SecurityGroupIdToUse = ec2SecurityGroup.id;
    }

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `tap-alb-${region}-${environmentSuffix}-primary`,
      {
        name: `tap-alb-${region}-${environmentSuffix}-primary`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroupIdToUse],
        subnets: publicSubnetIds,
        enableDeletionProtection: false,
        dropInvalidHeaderFields: true,
        tags: {
          ...tags,
          Name: `tap-alb-${region}-${environmentSuffix}-primary`,
        },
      },
      { parent: this }
    );

    // Target Group
    const targetGroup = new aws.lb.TargetGroup(
      `tap-tg-${region}-${environmentSuffix}-primary`,
      {
        name: `tap-tg-${region}-${environmentSuffix}-primary`,
        port: 80,
        protocol: 'HTTP',
        vpcId: vpcId,
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
          timeout: 5,
          interval: 30,
          path: '/',
          matcher: '200',
        },
        tags: {
          ...tags,
          Name: `tap-tg-${region}-${environmentSuffix}-primary`,
        },
      },
      { parent: this }
    );

    // ALB Listener - HTTP
    new aws.lb.Listener(
      `tap-alb-listener-http-${region}-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    // Key Pair for EC2 instances
    new aws.ec2.KeyPair(
      `tap-key-${region}-${environmentSuffix}`,
      {
        keyName: `tap-key-${region}-${environmentSuffix}`,
        publicKey:
          'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7l8ZKGm4E3XVmZfNKm9YqHl8OKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQ== tap-demo-key',
        tags: {
          ...tags,
          Name: `tap-key-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Launch Template
    const userData = pulumi.interpolate`#!/bin/bash
yum update -y
yum install -y httpd amazon-cloudwatch-agent
systemctl start httpd
systemctl enable httpd

echo "<h1>Secure Web Server - Region: ${region}</h1>" > /var/www/html/index.html
echo "<p>Environment: ${environmentSuffix}</p>" >> /var/www/html/index.html
`;

    const launchTemplate = new aws.ec2.LaunchTemplate(
      `tap-lt-${region}-${environmentSuffix}-primary-2`,
      {
        name: `tap-lt-${region}-${environmentSuffix}-primary-2`,
        imageId: aws.ec2
          .getAmi({
            mostRecent: true,
            owners: ['amazon'],
            filters: [
              { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
              { name: 'virtualization-type', values: ['hvm'] },
            ],
          })
          .then(ami => ami.id),
        instanceType: 't2.micro',
        keyName: `tap-key-${region}-${environmentSuffix}`,
        vpcSecurityGroupIds: [ec2SecurityGroupIdToUse],
        iamInstanceProfile: {
          name: pulumi.interpolate`tap-instance-profile-${environmentSuffix}`,
        },
        blockDeviceMappings: [
          {
            deviceName: '/dev/xvda',
            ebs: {
              volumeType: 'gp3',
              volumeSize: 8,
              encrypted: 'true',
              deleteOnTermination: 'true',
            },
          },
        ],
        userData: pulumi
          .output(userData)
          .apply(ud => Buffer.from(ud).toString('base64')),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...tags,
              Name: `tap-instance-${region}-${environmentSuffix}`,
            },
          },
        ],
      },
      { parent: this }
    );

    // Auto Scaling Group
    const asg = new aws.autoscaling.Group(
      `tap-asg-${region}-${environmentSuffix}`,
      {
        name: `tap-asg-${region}-${environmentSuffix}`,
        vpcZoneIdentifiers: privateSubnetIds,
        targetGroupArns: [targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        minSize: 1,
        maxSize: 4,
        desiredCapacity: 2,
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        tags: [
          {
            key: 'Name',
            value: `tap-asg-${region}-${environmentSuffix}`,
            propagateAtLaunch: true,
          },
        ],
      },
      { parent: this }
    );

    this.albDnsName = alb.dnsName;
    this.albArn = alb.arn;
    this.asgArn = asg.arn;

    this.registerOutputs({
      albDnsName: this.albDnsName,
      albArn: this.albArn,
      asgArn: this.asgArn,
    });
  }
}
