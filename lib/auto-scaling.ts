import * as aws from '@pulumi/aws';
import { commonTags, instanceType, primaryRegion } from './config';
import { targetGroup } from './load-balancer';
import { primaryAppSecurityGroup } from './security-groups';
import { primaryPrivateSubnet1, primaryPrivateSubnet2 } from './vpc';

const primaryProvider = new aws.Provider('primary-provider', {
  region: primaryRegion,
});

// Get the latest Amazon Linux 2 AMI
export const amiId = aws.ec2.getAmi(
  {
    mostRecent: true,
    owners: ['amazon'],
    filters: [
      {
        name: 'name',
        values: ['amzn2-ami-hvm-*-x86_64-gp2'],
      },
      {
        name: 'virtualization-type',
        values: ['hvm'],
      },
    ],
  },
  { provider: primaryProvider }
);

// User data script for EC2 instances
const userData = `#!/bin/bash
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Create a simple health check endpoint
mkdir -p /opt/app
cat > /opt/app/app.py << 'EOF'
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'healthy'}).encode())
        else:
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'Hello from Auto Scaling Group!')

if __name__ == '__main__':
    server = HTTPServer(('', 8080), HealthHandler)
    server.serve_forever()
EOF

# Install Python and start the application
yum install -y python3
nohup python3 /opt/app/app.py > /var/log/app.log 2>&1 &
`;

// IAM role for EC2 instances
export const ec2Role = new aws.iam.Role(
  'ec2-role',
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
    tags: commonTags,
  },
  { provider: primaryProvider }
);

export const ec2RolePolicyAttachment = new aws.iam.RolePolicyAttachment(
  'ec2-role-policy',
  {
    role: ec2Role.name,
    policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
  },
  { provider: primaryProvider }
);

export const instanceProfile = new aws.iam.InstanceProfile(
  'instance-profile',
  {
    role: ec2Role.name,
  },
  { provider: primaryProvider }
);

// Launch Template
export const launchTemplate = new aws.ec2.LaunchTemplate(
  'app-launch-template',
  {
    name: 'app-launch-template',
    imageId: amiId.then(ami => ami.id),
    instanceType: instanceType,
    vpcSecurityGroupIds: [primaryAppSecurityGroup.id],
    iamInstanceProfile: {
      name: instanceProfile.name,
    },
    userData: Buffer.from(userData).toString('base64'),
    tagSpecifications: [
      {
        resourceType: 'instance',
        tags: {
          ...commonTags,
          Name: 'App Server Instance',
        },
      },
    ],
    tags: {
      ...commonTags,
      Name: 'App Launch Template',
    },
  },
  { provider: primaryProvider }
);

// Auto Scaling Group
export const autoScalingGroup = new aws.autoscaling.Group(
  'app-asg',
  {
    name: 'app-auto-scaling-group',
    vpcZoneIdentifiers: [primaryPrivateSubnet1.id, primaryPrivateSubnet2.id],
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
        value: 'App Auto Scaling Group',
        propagateAtLaunch: false,
      },
      {
        key: 'Environment',
        value: 'Production',
        propagateAtLaunch: true,
      },
    ],
  },
  { provider: primaryProvider }
);

// Auto Scaling Policy
export const scaleUpPolicy = new aws.autoscaling.Policy(
  'scale-up-policy',
  {
    name: 'scale-up-policy',
    scalingAdjustment: 1,
    adjustmentType: 'ChangeInCapacity',
    cooldown: 300,
    autoscalingGroupName: autoScalingGroup.name,
  },
  { provider: primaryProvider }
);

export const scaleDownPolicy = new aws.autoscaling.Policy(
  'scale-down-policy',
  {
    name: 'scale-down-policy',
    scalingAdjustment: -1,
    adjustmentType: 'ChangeInCapacity',
    cooldown: 300,
    autoscalingGroupName: autoScalingGroup.name,
  },
  { provider: primaryProvider }
);
