import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface Ec2StackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string[]>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class Ec2Stack extends pulumi.ComponentResource {
  public readonly autoScalingGroupName: pulumi.Output<string>;
  public readonly targetGroupArn: pulumi.Output<string>;

  constructor(name: string, args: Ec2StackArgs, opts?: ResourceOptions) {
    super('tap:ec2:Ec2Stack', name, args, opts);

    // Create IAM role for EC2 instances
    const instanceRole = new aws.iam.Role(
      `${name}-instance-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        }),
        tags: args.tags,
      },
      { parent: this }
    );

    // Attach necessary policies
    new aws.iam.RolePolicyAttachment(
      `${name}-ssm-policy-${args.environmentSuffix}`,
      {
        role: instanceRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `${name}-cloudwatch-policy-${args.environmentSuffix}`,
      {
        role: instanceRole.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      },
      { parent: this }
    );

    const instanceProfile = new aws.iam.InstanceProfile(
      `${name}-instance-profile-${args.environmentSuffix}`,
      {
        role: instanceRole.name,
        tags: args.tags,
      },
      { parent: this }
    );

    // Create Security Group for EC2 instances
    const instanceSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-instance-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        description: 'Security group for EC2 instances',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['10.5.0.0/16'], // Allow from within VPC
          },
          {
            protocol: 'tcp',
            fromPort: 22,
            toPort: 22,
            cidrBlocks: ['10.0.0.0/8'], // Restricted SSH access
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
          Name: `${name}-instance-sg-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // User data script for instance initialization
    const userData = `#!/bin/bash
# Update system
yum update -y

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Install and start nginx
amazon-linux-extras install nginx1 -y
systemctl start nginx
systemctl enable nginx

# Configure simple web page
echo "<h1>Media Company Web Application - Instance $(ec2-metadata --instance-id | cut -d " " -f 2)</h1>" > /usr/share/nginx/html/index.html

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s
`;

    // Get latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    // Create Launch Template
    const launchTemplate = new aws.ec2.LaunchTemplate(
      `${name}-lt-${args.environmentSuffix}`,
      {
        namePrefix: `${name}-lt-${args.environmentSuffix}-`,
        imageId: ami.then(ami => ami.id),
        instanceType: 't3.micro',
        iamInstanceProfile: {
          arn: instanceProfile.arn,
        },
        vpcSecurityGroupIds: [instanceSecurityGroup.id],
        userData: Buffer.from(userData).toString('base64'),
        monitoring: {
          enabled: true,
        },
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              Name: `${name}-instance-${args.environmentSuffix}`,
              ...args.tags,
            },
          },
        ],
        tags: args.tags,
      },
      { parent: this }
    );

    // Create Target Group
    const targetGroup = new aws.lb.TargetGroup(
      `${name}-tg-${args.environmentSuffix}`,
      {
        port: 80,
        protocol: 'HTTP',
        vpcId: args.vpcId,
        targetType: 'instance',
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: 'HTTP',
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          timeout: 5,
          interval: 30,
          matcher: '200',
        },
        deregistrationDelay: 30,
        tags: {
          Name: `${name}-tg-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      { parent: this }
    );

    // Create Auto Scaling Group
    const autoScalingGroup = new aws.autoscaling.Group(
      `${name}-asg-${args.environmentSuffix}`,
      {
        namePrefix: `${name}-asg-${args.environmentSuffix}-`,
        vpcZoneIdentifiers: args.privateSubnetIds,
        targetGroupArns: [targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        minSize: 2,
        maxSize: 6,
        desiredCapacity: 2,
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        tags: [
          {
            key: 'Name',
            value: `${name}-asg-instance-${args.environmentSuffix}`,
            propagateAtLaunch: true,
          },
          {
            key: 'Environment',
            value: args.environmentSuffix,
            propagateAtLaunch: true,
          },
        ],
      },
      { parent: this }
    );

    // Create scaling policies
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _scaleUpPolicy = new aws.autoscaling.Policy(
      `${name}-scale-up-${args.environmentSuffix}`,
      {
        scalingAdjustment: 1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: autoScalingGroup.name,
      },
      { parent: this }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _scaleDownPolicy = new aws.autoscaling.Policy(
      `${name}-scale-down-${args.environmentSuffix}`,
      {
        scalingAdjustment: -1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: autoScalingGroup.name,
      },
      { parent: this }
    );

    this.autoScalingGroupName = autoScalingGroup.name;
    this.targetGroupArn = targetGroup.arn;

    this.registerOutputs({
      autoScalingGroupName: this.autoScalingGroupName,
      targetGroupArn: this.targetGroupArn,
    });
  }
}
