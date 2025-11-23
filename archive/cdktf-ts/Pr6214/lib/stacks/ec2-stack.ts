import { Construct } from 'constructs';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

interface Ec2StackProps {
  environmentSuffix: string;
  environment: string;
  vpcId: string;
  publicSubnetIds: string[];
  instanceType: string;
}

export class Ec2Stack extends Construct {
  public readonly instanceId: string;
  public readonly securityGroupId: string;

  constructor(scope: Construct, id: string, props: Ec2StackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      environment,
      vpcId,
      publicSubnetIds,
      instanceType,
    } = props;

    // Get latest Amazon Linux 2023 AMI
    const ami = new DataAwsAmi(this, 'amazon-linux-2023', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['al2023-ami-*-x86_64'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // Create security group for EC2
    const ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
      name: `payment-ec2-sg-${environment}-${environmentSuffix}`,
      description: 'Security group for payment processing EC2 instances',
      vpcId: vpcId,
      tags: {
        Name: `payment-ec2-sg-${environment}-${environmentSuffix}`,
        Environment: environment,
      },
    });

    // Allow HTTPS inbound
    new SecurityGroupRule(this, 'ec2-https-ingress', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: ec2SecurityGroup.id,
      description: 'Allow HTTPS inbound',
    });

    // Allow HTTP inbound (for ALB health checks)
    new SecurityGroupRule(this, 'ec2-http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/8'],
      securityGroupId: ec2SecurityGroup.id,
      description: 'Allow HTTP from VPC',
    });

    // Allow all outbound
    new SecurityGroupRule(this, 'ec2-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: ec2SecurityGroup.id,
      description: 'Allow all outbound',
    });

    // Create IAM role for EC2
    const ec2Role = new IamRole(this, 'ec2-role', {
      name: `payment-ec2-role-${environment}-${environmentSuffix}`,
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
        Name: `payment-ec2-role-${environment}-${environmentSuffix}`,
        Environment: environment,
      },
    });

    // Attach SSM managed policy for Session Manager
    new IamRolePolicyAttachment(this, 'ec2-ssm-policy', {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    // Attach CloudWatch agent policy
    new IamRolePolicyAttachment(this, 'ec2-cloudwatch-policy', {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
    });

    // Create instance profile
    const instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `payment-ec2-profile-${environment}-${environmentSuffix}`,
        role: ec2Role.name,
      }
    );

    // Create EC2 instance
    const instance = new Instance(this, 'payment-instance', {
      ami: ami.id,
      instanceType: instanceType,
      subnetId: publicSubnetIds[0],
      vpcSecurityGroupIds: [ec2SecurityGroup.id],
      iamInstanceProfile: instanceProfile.name,
      userData: this.getUserData(environment),
      monitoring: true,
      rootBlockDevice: {
        volumeSize: 30,
        volumeType: 'gp3',
        encrypted: true,
        deleteOnTermination: true,
      },
      tags: {
        Name: `payment-api-${environment}-${environmentSuffix}`,
        Environment: environment,
      },
    });

    this.instanceId = instance.id;
    this.securityGroupId = ec2SecurityGroup.id;
  }

  private getUserData(environment: string): string {
    return `#!/bin/bash
set -e

# Update system
yum update -y

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Install Node.js 18
curl -sL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Create application directory
mkdir -p /opt/payment-app
cd /opt/payment-app

# Create simple health check endpoint
cat > /opt/payment-app/server.js << 'EOF'
const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({status: 'healthy', environment: '${environment}'}));
  } else {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Payment Processing API - ${environment}');
  }
});
server.listen(80, () => {
  console.log('Server running on port 80');
});
EOF

# Create systemd service
cat > /etc/systemd/system/payment-app.service << 'EOF'
[Unit]
Description=Payment Processing Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/payment-app
ExecStart=/usr/bin/node /opt/payment-app/server.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start service
systemctl daemon-reload
systemctl enable payment-app
systemctl start payment-app

echo "Payment processing application setup complete"
`;
  }
}
