/**
 * ec2-stack.ts
 *
 * This module defines the EC2 stack for creating secure EC2 instances
 * with encrypted storage and proper security configurations.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface Ec2StackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  privateSubnetIds: pulumi.Input<string[]>;
  webSecurityGroupId: pulumi.Input<string>;
  ec2InstanceProfileName: pulumi.Input<string>;
  mainKmsKeyArn: pulumi.Input<string>;
  instanceType?: string;
  enableKeyPairs?: boolean;
}

export class Ec2Stack extends pulumi.ComponentResource {
  public readonly instanceId: pulumi.Output<string>;
  public readonly instanceArn: pulumi.Output<string>;
  public readonly privateIp: pulumi.Output<string>;
  public readonly publicIp: pulumi.Output<string>;

  constructor(name: string, args: Ec2StackArgs, opts?: ResourceOptions) {
    super('tap:ec2:Ec2Stack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const instanceType = args.instanceType || 't3.micro';
    const enableKeyPairs = args.enableKeyPairs || false;
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

    // User data script for CloudWatch agent and security hardening
    const userData = `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/ec2/tap/messages",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Install security updates automatically
yum install -y yum-cron
systemctl enable yum-cron
systemctl start yum-cron

# Basic security hardening
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
chmod 644 /var/www/html/index.html
chown apache:apache /var/www/html/index.html
`;

    // Create the EC2 instance
    const webServerInstance = new aws.ec2.Instance(
      `tap-web-server-${environmentSuffix}`,
      {
        ami: amiData.then(ami => ami.id),
        instanceType: instanceType,
        subnetId: pulumi
          .output(args.privateSubnetIds)
          .apply(subnets => subnets[0]), // Use first private subnet
        vpcSecurityGroupIds: [args.webSecurityGroupId],
        iamInstanceProfile: args.ec2InstanceProfileName,
        userDataBase64: Buffer.from(userData).toString('base64'),
        keyName: enableKeyPairs ? 'my-key-pair' : undefined,
        associatePublicIpAddress: false, // No public IP for security

        // Enable detailed monitoring
        monitoring: true,

        // Disable instance metadata service v1 (security best practice)
        metadataOptions: {
          httpEndpoint: 'enabled',
          httpTokens: 'required', // Require IMDSv2
          httpPutResponseHopLimit: 1,
          instanceMetadataTags: 'enabled',
        },

        // Root block device with encryption
        rootBlockDevice: {
          volumeType: 'gp3',
          volumeSize: 30,
          encrypted: true,
          kmsKeyId: args.mainKmsKeyArn,
          deleteOnTermination: true,
        },

        tags: {
          Name: `tap-web-server-${environmentSuffix}`,
          Purpose: 'SecureWebServer',
          Environment: environmentSuffix,
          AutoStartStop: 'true',
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
    this.privateIp = webServerInstance.privateIp;
    this.publicIp = webServerInstance.publicIp;

    this.registerOutputs({
      instanceId: this.instanceId,
      instanceArn: this.instanceArn,
      privateIp: this.privateIp,
      publicIp: this.publicIp,
    });
  }
}
