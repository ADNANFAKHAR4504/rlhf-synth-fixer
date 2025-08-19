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
      // instanceRole,  // Will be used when IAM instance profile is created
      // s3BucketArn,    // Will be used for S3 permissions
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
        `tap-alb-sg-compute-${region}-${environmentSuffix}`, // Changed name to avoid conflict
        {
          name: `tap-alb-sg-compute-${region}-${environmentSuffix}`,
          description: 'ALB Security Group - HTTP only', // Fixed description
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
        `tap-ec2-sg-compute-${region}-${environmentSuffix}`, // Changed name to avoid conflict
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
      `tap-alb-${region}-${environmentSuffix}`,
      {
        name: `tap-alb-${region}-${environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroupIdToUse],
        subnets: publicSubnetIds,
        enableDeletionProtection: false,
        dropInvalidHeaderFields: true,
        tags: {
          ...tags,
          Name: `tap-alb-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Target Group
    const targetGroup = new aws.lb.TargetGroup(
      `tap-tg-${region}-${environmentSuffix}`,
      {
        name: `tap-tg-${region}-${environmentSuffix}`,
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
          Name: `tap-tg-${region}-${environmentSuffix}`,
        },
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

    // ALB Listener - redirect HTTP to HTTPS - Commented out since HTTPS is disabled
    /*
    new aws.lb.Listener(
      `tap-alb-listener-redirect-${region}-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
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
      { parent: this }
    );
    */

    // Self-signed certificate for demo purposes - Commented out for now
    // ACM certificates require domain validation which takes time
    /*
    const cert = new aws.acm.Certificate(
      `tap-cert-${region}-${environmentSuffix}`,
      {
        domainName: `*.${region}.example.com`,
        validationMethod: 'DNS',
        tags,
      },
      { parent: this }
    );
    */

    // ALB Listener - HTTPS - Commented out since certificate is disabled
    /*
    new aws.lb.Listener(
      `tap-alb-listener-https-${region}-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 443,
        protocol: 'HTTPS',
        sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
        certificateArn: cert.arn,
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      { parent: this }
    );
    */

    // For now, just use HTTP listener
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

    // Launch Template with security hardening
    const userData = pulumi.interpolate`#!/bin/bash
yum update -y
yum install -y httpd amazon-cloudwatch-agent
systemctl start httpd
systemctl enable httpd

# Configure CloudWatch agent
cat << EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/httpd/access_log",
            "log_group_name": "/tap/ec2/httpd/access",
            "log_stream_name": "{instance_id}"
          },
          {
            "file_path": "/var/log/httpd/error_log",
            "log_group_name": "/tap/ec2/httpd/error",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

echo "<h1>Secure Web Server - Region: ${region}</h1>" > /var/www/html/index.html
echo "<p>Environment: ${environmentSuffix}</p>" >> /var/www/html/index.html
`;

    const launchTemplate = new aws.ec2.LaunchTemplate(
      `tap-lt-${region}-${environmentSuffix}`,
      {
        name: `tap-lt-${region}-${environmentSuffix}`,
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
        instanceType: 't3.micro',
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

    // CloudWatch Log Groups
    new aws.cloudwatch.LogGroup(
      `tap-httpd-access-logs-${region}-${environmentSuffix}`,
      {
        name: '/tap/ec2/httpd/access-primary',
        retentionInDays: 14,
        tags,
      },
      { parent: this }
    );

    new aws.cloudwatch.LogGroup(
      `tap-httpd-error-logs-${region}-${environmentSuffix}`,
      {
        name: '/tap/ec2/httpd/error-primary',
        retentionInDays: 14,
        tags,
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
