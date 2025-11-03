import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ComputeStackArgs {
  environmentSuffix: string;
  region: string;
  availabilityZones: string[];
  privateSubnetIds: pulumi.Input<string>[];
  instanceSecurityGroupId: pulumi.Input<string>;
  targetGroupArn: pulumi.Input<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class ComputeStack extends pulumi.ComponentResource {
  public readonly launchTemplate: aws.ec2.LaunchTemplate;
  public readonly autoScalingGroup: aws.autoscaling.Group;
  public readonly instanceRole: aws.iam.Role;

  constructor(
    name: string,
    args: ComputeStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:compute:ComputeStack', name, args, opts);

    // Get the latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'state',
          values: ['available'],
        },
      ],
    });

    // Create IAM role for EC2 instances
    this.instanceRole = new aws.iam.Role(
      `instance-role-${args.environmentSuffix}`,
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
          ...pulumi.output(args.tags).apply(t => t),
          Name: `instance-role-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach SSM policy for instance management
    new aws.iam.RolePolicyAttachment(
      `ssm-policy-${args.environmentSuffix}`,
      {
        role: this.instanceRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { parent: this }
    );

    // Create instance profile
    const instanceProfile = new aws.iam.InstanceProfile(
      `instance-profile-${args.environmentSuffix}`,
      {
        role: this.instanceRole.name,
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `instance-profile-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // User data script to configure the instance
    const userData = `#!/bin/bash
set -e

# Update system
yum update -y

# Install necessary packages
yum install -y httpd mod_ssl

# Create a simple health check endpoint
cat > /var/www/html/health << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Health Check</title></head>
<body>
<h1>OK</h1>
<p>Service is healthy</p>
</body>
</html>
EOF

# Create a simple index page
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Payment Processing Service</title></head>
<body>
<h1>Payment Processing Application</h1>
<p>Multi-AZ deployment with automatic failover</p>
<p>Instance ID: $(ec2-metadata --instance-id | cut -d " " -f 2)</p>
<p>Availability Zone: $(ec2-metadata --availability-zone | cut -d " " -f 2)</p>
</body>
</html>
EOF

# Configure Apache
systemctl enable httpd
systemctl start httpd

# Setup CloudWatch agent for monitoring
yum install -y amazon-cloudwatch-agent
`;

    // Create Launch Template
    this.launchTemplate = new aws.ec2.LaunchTemplate(
      `launch-template-${args.environmentSuffix}`,
      {
        imageId: ami.then(a => a.id),
        instanceType: 't3.small',
        iamInstanceProfile: {
          arn: instanceProfile.arn,
        },
        metadataOptions: {
          httpEndpoint: 'enabled',
          httpTokens: 'required', // IMDSv2 enforcement
          httpPutResponseHopLimit: 1,
        },
        networkInterfaces: [
          {
            associatePublicIpAddress: 'false',
            deleteOnTermination: 'true',
            securityGroups: [args.instanceSecurityGroupId],
          },
        ],
        userData: Buffer.from(userData).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...pulumi.output(args.tags).apply(t => t),
              Name: `payment-processor-${args.environmentSuffix}`,
            },
          },
          {
            resourceType: 'volume',
            tags: {
              ...pulumi.output(args.tags).apply(t => t),
              Name: `payment-processor-volume-${args.environmentSuffix}`,
            },
          },
        ],
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `launch-template-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Auto Scaling Group with exactly 2 instances per AZ
    this.autoScalingGroup = new aws.autoscaling.Group(
      `asg-${args.environmentSuffix}`,
      {
        desiredCapacity: args.availabilityZones.length * 2, // 2 instances per AZ
        maxSize: args.availabilityZones.length * 3, // Allow scaling up to 3 per AZ
        minSize: args.availabilityZones.length * 2, // Minimum 2 per AZ
        vpcZoneIdentifiers: args.privateSubnetIds,
        healthCheckGracePeriod: 300, // 300 seconds for new instances
        healthCheckType: 'ELB',
        targetGroupArns: [args.targetGroupArn],
        launchTemplate: {
          id: this.launchTemplate.id,
          version: '$Latest',
        },
        enabledMetrics: [
          'GroupDesiredCapacity',
          'GroupInServiceInstances',
          'GroupMaxSize',
          'GroupMinSize',
          'GroupPendingInstances',
          'GroupStandbyInstances',
          'GroupTerminatingInstances',
          'GroupTotalInstances',
        ],
        tags: pulumi.output(args.tags).apply(t => {
          const baseTags = [
            {
              key: 'Name',
              value: `asg-${args.environmentSuffix}`,
              propagateAtLaunch: true,
            },
          ];
          const tagEntries = Object.entries(t).map(([key, value]) => ({
            key,
            value: String(value),
            propagateAtLaunch: true,
          }));
          return [...baseTags, ...tagEntries];
        }),
      },
      { parent: this, dependsOn: [this.launchTemplate] }
    );

    this.registerOutputs({
      autoScalingGroupName: this.autoScalingGroup.name,
      launchTemplateId: this.launchTemplate.id,
    });
  }
}
