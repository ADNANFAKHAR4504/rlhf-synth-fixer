/**
 * EC2 Stack - Creates EC2 instances with IAM roles for secure access
 * to S3 and RDS resources with least-privilege principles.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class EC2Stack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:stack:EC2Stack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Get the latest Amazon Linux 2 AMI
    const amiId = aws.ec2
      .getAmi({
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
      })
      .then(ami => ami.id);

    // Create IAM role for EC2 instances
    const ec2Role = new aws.iam.Role(
      `SecureApp-ec2-role-${environmentSuffix}`,
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
          ...tags,
          Name: `SecureApp-ec2-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create IAM policy for S3 access
    const s3Policy = new aws.iam.Policy(
      `SecureApp-s3-policy-${environmentSuffix}`,
      {
        description: 'Policy for S3 access from EC2 instances',
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "s3:GetObject",
              "s3:PutObject",
              "s3:DeleteObject",
              "s3:ListBucket"
            ],
            "Resource": [
              "${args.s3BucketArn}",
              "${args.s3BucketArn}/*"
            ]
          }
        ]
      }`,
      },
      { parent: this }
    );

    // Create IAM policy for RDS access
    const rdsPolicy = new aws.iam.Policy(
      `SecureApp-rds-policy-${environmentSuffix}`,
      {
        description: 'Policy for RDS access from EC2 instances',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'rds:DescribeDBInstances',
                'rds:DescribeDBClusters',
                'rds-db:connect',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Create IAM policy for CloudWatch metrics
    const cloudwatchPolicy = new aws.iam.Policy(
      `SecureApp-cloudwatch-policy-${environmentSuffix}`,
      {
        description: 'Policy for CloudWatch metrics from EC2 instances',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'cloudwatch:PutMetricData',
                'cloudwatch:GetMetricStatistics',
                'cloudwatch:ListMetrics',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Attach policies to the EC2 role
    new aws.iam.RolePolicyAttachment(
      `SecureApp-s3-policy-attachment-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: s3Policy.arn,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `SecureApp-rds-policy-attachment-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: rdsPolicy.arn,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `SecureApp-cloudwatch-policy-attachment-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: cloudwatchPolicy.arn,
      },
      { parent: this }
    );

    // Create instance profile
    const instanceProfile = new aws.iam.InstanceProfile(
      `SecureApp-instance-profile-${environmentSuffix}`,
      {
        role: ec2Role.name,
      },
      { parent: this }
    );

    // User data script for basic configuration
    const userData = pulumi.interpolate`#!/bin/bash
yum update -y
yum install -y aws-cli mysql
yum install -y amazon-cloudwatch-agent

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "metrics": {
    "namespace": "SecureApp/EC2",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
        "metrics_collection_interval": 60,
        "totalcpu": false
      },
      "disk": {
        "measurement": ["used_percent"],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a start -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Test S3 access (you would replace with your actual bucket)
aws s3 ls s3://secureapp-data-bucket-${environmentSuffix}

# Install and configure application dependencies
echo "SecureApp EC2 instance initialized successfully" > /var/log/secureapp-init.log
`;

    // Create security group for EC2 instances
    const ec2SecurityGroup = new aws.ec2.SecurityGroup(
      `SecureApp-ec2-sg-${environmentSuffix}`,
      {
        vpcId: args.vpcId,
        description: 'Security group for SecureApp EC2 instances',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 22,
            toPort: 22,
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
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
          Name: `SecureApp-ec2-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create EC2 instances
    this.instances = [];
    for (let i = 0; i < 2; i++) {
      const instance = new aws.ec2.Instance(
        `SecureApp-ec2-${i + 1}-${environmentSuffix}`,
        {
          ami: amiId,
          instanceType: 't3.micro',
          keyName: undefined, // You would set this to your key pair name
          vpcSecurityGroupIds: [ec2SecurityGroup.id],
          subnetId: args.publicSubnetIds[i % args.publicSubnetIds.length],
          iamInstanceProfile: instanceProfile.name,
          userData: userData,

          rootBlockDevice: {
            volumeType: 'gp3',
            volumeSize: 20,
            encrypted: true,
          },

          tags: {
            ...tags,
            Name: `SecureApp-ec2-${i + 1}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );

      this.instances.push(instance);
    }

    // Export values
    this.instanceIds = this.instances.map(instance => instance.id);
    this.roleArn = ec2Role.arn;

    this.registerOutputs({
      instanceIds: this.instanceIds,
      roleArn: this.roleArn,
    });
  }
}
