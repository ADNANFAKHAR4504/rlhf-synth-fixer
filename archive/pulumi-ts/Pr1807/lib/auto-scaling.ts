import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { getCommonTags, primaryRegion, instanceType } from './config';
import { VpcStack } from './vpc';
import { SecurityGroupsStack } from './security-groups';
import { LoadBalancerStack } from './load-balancer';

export class AutoScalingStack extends pulumi.ComponentResource {
  public readonly ec2Role: aws.iam.Role;
  public readonly instanceProfile: aws.iam.InstanceProfile;
  public readonly launchTemplate: aws.ec2.LaunchTemplate;
  public readonly autoScalingGroup: aws.autoscaling.Group;
  public readonly scaleUpPolicy: aws.autoscaling.Policy;
  public readonly scaleDownPolicy: aws.autoscaling.Policy;

  constructor(
    name: string,
    args: {
      environment: string;
      tags: Record<string, string>;
      vpcStack: VpcStack;
      securityGroupsStack: SecurityGroupsStack;
      loadBalancerStack: LoadBalancerStack;
    },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:asg:AutoScalingStack', name, {}, opts);

    const commonTags = { ...getCommonTags(args.environment), ...args.tags };

    const primaryProvider = new aws.Provider(
      `${args.environment}-primary-provider`,
      { region: primaryRegion },
      { parent: this }
    );

    // Get the latest Amazon Linux 2 AMI
    const amiId = aws.ec2.getAmi(
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
    this.ec2Role = new aws.iam.Role(
      `${args.environment}-ec2-role`,
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
        tags: {
          ...commonTags,
          Name: `${args.environment}-EC2-Role`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Attach minimal required policies
    new aws.iam.RolePolicyAttachment(
      `${args.environment}-ec2-ssm-policy`,
      {
        role: this.ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { provider: primaryProvider, parent: this }
    );

    // Custom policy for minimal CloudWatch permissions
    const cloudWatchPolicy = new aws.iam.Policy(
      `${args.environment}-ec2-cloudwatch-policy`,
      {
        description: 'Minimal CloudWatch permissions for EC2 instances',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'cloudwatch:PutMetricData',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { provider: primaryProvider, parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `${args.environment}-ec2-cloudwatch-attachment`,
      {
        role: this.ec2Role.name,
        policyArn: cloudWatchPolicy.arn,
      },
      { provider: primaryProvider, parent: this }
    );

    this.instanceProfile = new aws.iam.InstanceProfile(
      `${args.environment}-instance-profile`,
      {
        role: this.ec2Role.name,
      },
      { provider: primaryProvider, parent: this }
    );

    // Launch Template
    this.launchTemplate = new aws.ec2.LaunchTemplate(
      `${args.environment}-app-launch-template`,
      {
        name: `${args.environment}-app-launch-template`,
        imageId: amiId.then(ami => ami.id),
        instanceType: instanceType,
        vpcSecurityGroupIds: [
          args.securityGroupsStack.primaryAppSecurityGroup.id,
        ],
        iamInstanceProfile: {
          name: this.instanceProfile.name,
        },
        userData: Buffer.from(userData).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...commonTags,
              Name: `${args.environment}-App-Server-Instance`,
            },
          },
        ],
        tags: {
          ...commonTags,
          Name: `${args.environment}-App-Launch-Template`,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Auto Scaling Group
    this.autoScalingGroup = new aws.autoscaling.Group(
      `${args.environment}-app-asg`,
      {
        name: `${args.environment}-app-auto-scaling-group`,
        vpcZoneIdentifiers: [
          args.vpcStack.primaryPrivateSubnet1.id,
          args.vpcStack.primaryPrivateSubnet2.id,
        ],
        targetGroupArns: [args.loadBalancerStack.targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        minSize: 2,
        maxSize: 6,
        desiredCapacity: 2,
        launchTemplate: {
          id: this.launchTemplate.id,
          version: '$Latest',
        },
        tags: [
          {
            key: 'Name',
            value: `${args.environment}-App-Auto-Scaling-Group`,
            propagateAtLaunch: false,
          },
          {
            key: 'Environment',
            value: args.environment,
            propagateAtLaunch: true,
          },
        ],
      },
      { provider: primaryProvider, parent: this }
    );

    // Target Tracking Scaling Policy for better performance
    this.scaleUpPolicy = new aws.autoscaling.Policy(
      `${args.environment}-target-tracking-policy`,
      {
        name: `${args.environment}-target-tracking-policy`,
        policyType: 'TargetTrackingScaling',
        autoscalingGroupName: this.autoScalingGroup.name,
        targetTrackingConfiguration: {
          targetValue: 70.0,
          predefinedMetricSpecification: {
            predefinedMetricType: 'ASGAverageCPUUtilization',
          },
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Keep a simple scale down policy as backup
    this.scaleDownPolicy = new aws.autoscaling.Policy(
      `${args.environment}-scale-down-policy`,
      {
        name: `${args.environment}-scale-down-policy`,
        scalingAdjustment: -1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: this.autoScalingGroup.name,
      },
      { provider: primaryProvider, parent: this }
    );

    this.registerOutputs({
      autoScalingGroupName: this.autoScalingGroup.name,
      autoScalingGroupArn: this.autoScalingGroup.arn,
    });
  }
}
