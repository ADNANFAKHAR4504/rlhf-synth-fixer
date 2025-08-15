/**
 * ec2-stack.ts
 *
 * This module defines the EC2 stack for the hardened web server.
 * Creates a secure EC2 instance with encrypted storage and proper security configurations.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface Ec2StackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  vpcId: pulumi.Input<string>;
  subnetId: pulumi.Input<string>;
  securityGroupId: pulumi.Input<string>;
  instanceType?: string;
}

export interface Ec2StackOutputs {
  instanceId: pulumi.Output<string>;
  instanceArn: pulumi.Output<string>;
  publicIp: pulumi.Output<string>;
  privateIp: pulumi.Output<string>;
}

export class Ec2Stack extends pulumi.ComponentResource {
  public readonly instanceId: pulumi.Output<string>;
  public readonly instanceArn: pulumi.Output<string>;
  public readonly publicIp: pulumi.Output<string>;
  public readonly privateIp: pulumi.Output<string>;

  constructor(name: string, args: Ec2StackArgs, opts?: ResourceOptions) {
    super('tap:ec2:Ec2Stack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const instanceType = args.instanceType || 't3.micro';
    const tags = args.tags || {};

    // Get the latest Amazon Linux 2023 AMI
    const amiData = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        {
          name: 'name',
          values: ['al2023-ami-*-x86_64'],
        },
        {
          name: 'architecture',
          values: ['x86_64'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
        {
          name: 'state',
          values: ['available'],
        },
      ],
    });

    // Create IAM role for EC2 instance (following principle of least privilege)
    const ec2Role = new aws.iam.Role(
      `tap-ec2-role-${environmentSuffix}`,
      {
        name: `tap-ec2-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `tap-ec2-role-${environmentSuffix}`,
          Purpose: 'EC2InstanceExecution',
          ...tags,
        },
      },
      { parent: this }
    );

    // Attach minimal required policies (CloudWatch for monitoring)
    new aws.iam.RolePolicyAttachment(
      `tap-ec2-cloudwatch-policy-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      },
      { parent: this }
    );

    // Create instance profile
    const instanceProfile = new aws.iam.InstanceProfile(
      `tap-ec2-profile-${environmentSuffix}`,
      {
        name: `tap-ec2-profile-${environmentSuffix}`,
        role: ec2Role.name,
        tags: {
          Name: `tap-ec2-profile-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // User data script for basic security hardening
    const userData = `#!/bin/bash
# Update system
yum update -y

# Install and configure CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Install security updates automatically
yum install -y yum-cron
systemctl enable yum-cron
systemctl start yum-cron

# Configure basic firewall (iptables backup)
yum install -y iptables-services
systemctl enable iptables

# Disable unnecessary services
systemctl disable postfix
systemctl stop postfix

# Set up basic security configurations
echo "net.ipv4.conf.all.send_redirects = 0" >> /etc/sysctl.conf
echo "net.ipv4.conf.default.send_redirects = 0" >> /etc/sysctl.conf
echo "net.ipv4.conf.all.accept_source_route = 0" >> /etc/sysctl.conf
echo "net.ipv4.conf.default.accept_source_route = 0" >> /etc/sysctl.conf
echo "net.ipv4.conf.all.accept_redirects = 0" >> /etc/sysctl.conf
echo "net.ipv4.conf.default.accept_redirects = 0" >> /etc/sysctl.conf
sysctl -p

# Install and start httpd for web server functionality
yum install -y httpd
systemctl enable httpd
systemctl start httpd

# Create a simple index page
echo "<html><body><h1>TAP Secure Web Server - ${environmentSuffix}</h1><p>Server is running securely.</p></body></html>" > /var/www/html/index.html

# Set proper permissions
chmod 644 /var/www/html/index.html
chown apache:apache /var/www/html/index.html
`;

    // Create the EC2 instance with security best practices
    const webServerInstance = new aws.ec2.Instance(
      `tap-web-server-${environmentSuffix}`,
      {
        ami: amiData.then(ami => ami.id),
        instanceType: instanceType,
        subnetId: args.subnetId,
        vpcSecurityGroupIds: [args.securityGroupId],
        iamInstanceProfile: instanceProfile.name,
        userData: Buffer.from(userData).toString('base64'),

        // Enable detailed monitoring
        monitoring: true,

        // Disable instance metadata service v1 (security best practice)
        metadataOptions: {
          httpEndpoint: 'enabled',
          httpTokens: 'required', // Require IMDSv2
          httpPutResponseHopLimit: 1,
        },

        // Root block device with encryption
        rootBlockDevice: {
          volumeType: 'gp3',
          volumeSize: 20,
          encrypted: true,
          deleteOnTermination: true,
          tags: {
            Name: `tap-web-server-root-${environmentSuffix}`,
            VolumeType: 'root',
            ...tags,
          },
        },

        // Additional EBS block device (example of encrypted additional storage)
        ebsBlockDevices: [
          {
            deviceName: '/dev/sdf',
            volumeType: 'gp3',
            volumeSize: 10,
            encrypted: true,
            deleteOnTermination: true,
            tags: {
              Name: `tap-web-server-data-${environmentSuffix}`,
              VolumeType: 'data',
              ...tags,
            },
          },
        ],

        tags: {
          Name: `tap-web-server-${environmentSuffix}`,
          Purpose: 'SecureWebServer',
          Environment: environmentSuffix,
          AutoStartStop: 'true', // For cost optimization
          BackupRequired: 'true',
          ...tags,
        },

        // Enable termination protection for production
        disableApiTermination: environmentSuffix === 'prod',
      },
      { parent: this }
    );

    this.instanceId = webServerInstance.id;
    this.instanceArn = webServerInstance.arn;
    this.publicIp = webServerInstance.publicIp;
    this.privateIp = webServerInstance.privateIp;

    this.registerOutputs({
      instanceId: this.instanceId,
      instanceArn: this.instanceArn,
      publicIp: this.publicIp,
      privateIp: this.privateIp,
    });
  }
}
