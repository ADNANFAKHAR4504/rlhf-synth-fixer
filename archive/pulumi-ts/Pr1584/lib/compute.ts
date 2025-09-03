/**
 * compute.ts
 *
 * This module defines compute-related resources including EC2 instances
 * for the secure AWS infrastructure.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export function createEc2Instance(
  environment: string,
  subnetId: pulumi.Output<string>,
  securityGroupId: pulumi.Output<string>,
  instanceType: string,
  provider: aws.Provider
): aws.ec2.Instance {
  // Get the latest Amazon Linux 2023 AMI (more secure and up-to-date)
  const amiId = aws.ec2
    .getAmi(
      {
        mostRecent: true,
        owners: ['amazon'],
        filters: [
          {
            name: 'name',
            values: ['al2023-ami-*-x86_64'],
          },
          {
            name: 'virtualization-type',
            values: ['hvm'],
          },
        ],
      },
      { provider }
    )
    .then(ami => ami.id);

  // Create IAM role for SSM access with least privilege
  const ssmRole = new aws.iam.Role(
    `ssm-role-${environment}`,
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
            Condition: {
              StringEquals: {
                'aws:RequestedRegion': pulumi.output(provider.region),
              },
            },
          },
        ],
      }),
      tags: {
        Name: `ssm-role-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Attach SSM managed policy to the role
  new aws.iam.RolePolicyAttachment(
    `ssm-policy-attachment-${environment}`,
    {
      role: ssmRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    },
    { provider }
  );

  // Add CloudWatch agent policy for monitoring
  new aws.iam.RolePolicyAttachment(
    `cloudwatch-agent-policy-${environment}`,
    {
      role: ssmRole.name,
      policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
    },
    { provider }
  );

  // Create instance profile
  const instanceProfile = new aws.iam.InstanceProfile(
    `instance-profile-${environment}`,
    {
      role: ssmRole.name,
      tags: {
        Name: `instance-profile-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // User data script for basic hardening and setup with SSM agent
  const userData = `#!/bin/bash
set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Log all output
exec > >(tee /var/log/user-data.log)
exec 2>&1

# Update system packages
dnf update -y

# Install AWS CLI v2 (Amazon Linux 2023 uses dnf)
dnf install -y awscli2

# Install and start SSM agent (usually pre-installed on Amazon Linux 2023)
dnf install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Install CloudWatch agent
dnf install -y amazon-cloudwatch-agent

# Basic security hardening
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/#MaxAuthTries 6/MaxAuthTries 3/' /etc/ssh/sshd_config
sed -i 's/#ClientAliveInterval 0/ClientAliveInterval 300/' /etc/ssh/sshd_config
sed -i 's/#ClientAliveCountMax 3/ClientAliveCountMax 2/' /etc/ssh/sshd_config

# Disable unused services
systemctl disable postfix || true
systemctl stop postfix || true

# Configure automatic security updates
dnf install -y dnf-automatic
sed -i 's/apply_updates = no/apply_updates = yes/' /etc/dnf/automatic.conf
sed -i 's/upgrade_type = default/upgrade_type = security/' /etc/dnf/automatic.conf
systemctl enable dnf-automatic.timer
systemctl start dnf-automatic.timer

# Set up fail2ban for SSH protection
dnf install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Restart SSH with new configuration
systemctl restart sshd

# Create a non-root user with limited privileges
useradd -m -s /bin/bash -G wheel trainer
# Set up SSH directory for the user
mkdir -p /home/trainer/.ssh
chmod 700 /home/trainer/.ssh
chown trainer:trainer /home/trainer/.ssh

# Set proper file permissions
chmod 700 /home/trainer
chown trainer:trainer /home/trainer

# Configure sudo to require password
echo '%wheel ALL=(ALL) ALL' > /etc/sudoers.d/wheel

echo "Setup completed with SSM agent and security hardening" >> /var/log/user-data.log
`;

  // Create EC2 instance
  const instance = new aws.ec2.Instance(
    `ec2-${environment}`,
    {
      ami: amiId,
      instanceType: instanceType,
      iamInstanceProfile: instanceProfile.name,
      subnetId: subnetId,
      vpcSecurityGroupIds: [securityGroupId],

      userData: userData,

      // Enable detailed monitoring
      monitoring: true,

      // EBS optimization for better performance
      ebsOptimized: true,

      // Enforce IMDSv2 for better security
      metadataOptions: {
        httpEndpoint: 'enabled',
        httpTokens: 'required', // Enforce IMDSv2
        httpPutResponseHopLimit: 1,
        instanceMetadataTags: 'enabled',
      },

      // Root block device configuration
      rootBlockDevice: {
        volumeType: 'gp3',
        volumeSize: 30,
        encrypted: true,
        deleteOnTermination: true,
        tags: {
          Name: `ebs-root-${environment}`,
          Environment: environment,
          ManagedBy: 'Pulumi',
        },
      },

      tags: {
        Name: `ec2-${environment}`,
        Environment: environment,
        Purpose: 'WebServer',
        ManagedBy: 'Pulumi',
        Backup: 'Required',
      },

      // Enable termination protection for production
      disableApiTermination: environment === 'prod',
    },
    {
      provider,
      // Ensure instance is created after instance profile
      dependsOn: [instanceProfile],
    }
  );

  return instance;
}
