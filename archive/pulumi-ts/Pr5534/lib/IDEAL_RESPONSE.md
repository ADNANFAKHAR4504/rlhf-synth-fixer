# Highly Available Web Application with Auto-Scaling and Failure Recovery

This implementation creates a self-healing, highly available infrastructure using Pulumi with TypeScript. The solution automatically recovers from failures, scales based on demand, and maintains service availability across multiple availability zones.

## Architecture Overview

The infrastructure includes:

- VPC with public and private subnets across 2 availability zones (ca-central-1a and ca-central-1b)
- Application Load Balancer for traffic distribution
- Auto Scaling Group with 2-6 EC2 instances (t3.micro)
- CloudWatch alarms for monitoring and alerting
- Automatic scaling policies based on CPU utilization
- Health checks for automatic instance replacement

## File: lib/tap-stack.ts

```ts
/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for the highly available web application
 * with auto-scaling and failure recovery capabilities.
 *
 * This stack creates:
 * - VPC with public and private subnets across 2 AZs
 * - Application Load Balancer with health checks
 * - Auto Scaling Group with scaling policies
 * - CloudWatch alarms for monitoring
 * - IAM roles and security groups
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack component.
 */
export interface TapStackArgs {
  /**
   * Environment suffix for resource naming (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to all resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * TapStack represents the main Pulumi component for the highly available
 * web application infrastructure.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly asgName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Merge default tags with Environment and ManagedBy
    const defaultTags = {
      ...tags,
      Environment: 'production',
      ManagedBy: 'pulumi',
    };

    // Get the current region
    const region = aws.config.requireRegion();

    // Define availability zones for ca-central-1
    const availabilityZones = ['ca-central-1a', 'ca-central-1b'];

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
            name: 'state',
            values: ['available'],
          },
        ],
      })
      .then(ami => ami.id);

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `tap-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...defaultTags,
          Name: `tap-vpc-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `tap-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...defaultTags,
          Name: `tap-igw-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create public subnets in each AZ
    const publicSubnets: aws.ec2.Subnet[] = [];
    availabilityZones.forEach((az, index) => {
      const subnet = new aws.ec2.Subnet(
        `tap-public-subnet-${index}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${index * 2}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            ...defaultTags,
            Name: `tap-public-subnet-${az}-${environmentSuffix}`,
            Type: 'public',
          },
        },
        { parent: this }
      );
      publicSubnets.push(subnet);
    });

    // Create private subnets in each AZ
    const privateSubnets: aws.ec2.Subnet[] = [];
    availabilityZones.forEach((az, index) => {
      const subnet = new aws.ec2.Subnet(
        `tap-private-subnet-${index}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${index * 2 + 1}.0/24`,
          availabilityZone: az,
          tags: {
            ...defaultTags,
            Name: `tap-private-subnet-${az}-${environmentSuffix}`,
            Type: 'private',
          },
        },
        { parent: this }
      );
      privateSubnets.push(subnet);
    });

    // Create route table for public subnets
    const publicRouteTable = new aws.ec2.RouteTable(
      `tap-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...defaultTags,
          Name: `tap-public-rt-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create route to Internet Gateway
    new aws.ec2.Route(
      `tap-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    // Associate public subnets with route table
    publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `tap-public-rta-${index}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create security group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `tap-alb-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP traffic from anywhere',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...defaultTags,
          Name: `tap-alb-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create security group for EC2 instances
    const instanceSecurityGroup = new aws.ec2.SecurityGroup(
      `tap-instance-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for EC2 instances',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecurityGroup.id],
            description: 'Allow HTTP traffic from ALB',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...defaultTags,
          Name: `tap-instance-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create IAM role for EC2 instances
    const instanceRole = new aws.iam.Role(
      `tap-instance-role-${environmentSuffix}`,
      {
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
          ...defaultTags,
          Name: `tap-instance-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach managed policy for CloudWatch and SSM
    new aws.iam.RolePolicyAttachment(
      `tap-instance-policy-ssm-${environmentSuffix}`,
      {
        role: instanceRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `tap-instance-policy-cw-${environmentSuffix}`,
      {
        role: instanceRole.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      },
      { parent: this }
    );

    // Create instance profile
    const instanceProfile = new aws.iam.InstanceProfile(
      `tap-instance-profile-${environmentSuffix}`,
      {
        role: instanceRole.name,
        tags: {
          ...defaultTags,
          Name: `tap-instance-profile-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // User data script for health check endpoint
    const userData = `#!/bin/bash
set -e

# Update system packages
yum update -y

# Install Apache web server
yum install -y httpd

# Create health check endpoint
cat > /var/www/html/health <<'EOF'
OK
EOF

# Create index page
cat > /var/www/html/index.html <<'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Payment Processing API</title>
</head>
<body>
    <h1>Payment Processing API</h1>
    <p>Service is running and healthy</p>
    <p>Instance ID: $(ec2-metadata --instance-id | cut -d " " -f 2)</p>
</body>
</html>
EOF

# Start and enable Apache
systemctl start httpd
systemctl enable httpd

# Configure CloudWatch agent for monitoring
yum install -y amazon-cloudwatch-agent
`;

    // Create Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `tap-alb-${environmentSuffix}`,
      {
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: publicSubnets.map(subnet => subnet.id),
        enableDeletionProtection: false,
        tags: {
          ...defaultTags,
          Name: `tap-alb-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create target group
    const targetGroup = new aws.lb.TargetGroup(
      `tap-tg-${environmentSuffix}`,
      {
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.id,
        targetType: 'instance',
        deregistrationDelay: 30,
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          port: '80',
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          timeout: 5,
          interval: 30,
          matcher: '200',
        },
        tags: {
          ...defaultTags,
          Name: `tap-tg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create ALB listener
    new aws.lb.Listener(
      `tap-alb-listener-${environmentSuffix}`,
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
        tags: {
          ...defaultTags,
          Name: `tap-alb-listener-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create launch template
    const launchTemplate = new aws.ec2.LaunchTemplate(
      `tap-lt-${environmentSuffix}`,
      {
        imageId: amiId,
        instanceType: 't3.micro',
        iamInstanceProfile: {
          arn: instanceProfile.arn,
        },
        vpcSecurityGroupIds: [instanceSecurityGroup.id],
        userData: Buffer.from(userData).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...defaultTags,
              Name: `tap-instance-${environmentSuffix}`,
            },
          },
          {
            resourceType: 'volume',
            tags: {
              ...defaultTags,
              Name: `tap-volume-${environmentSuffix}`,
            },
          },
        ],
        tags: {
          ...defaultTags,
          Name: `tap-lt-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Auto Scaling Group
    // Note: Using public subnets for instances to allow internet access without NAT Gateway (cost optimization)
    const asg = new aws.autoscaling.Group(
      `tap-asg-${environmentSuffix}`,
      {
        minSize: 2,
        maxSize: 6,
        desiredCapacity: 2,
        healthCheckGracePeriod: 300,
        healthCheckType: 'ELB',
        vpcZoneIdentifiers: publicSubnets.map(subnet => subnet.id),
        targetGroupArns: [targetGroup.arn],
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        defaultCooldown: 300,
        tags: [
          {
            key: 'Name',
            value: `tap-asg-instance-${environmentSuffix}`,
            propagateAtLaunch: true,
          },
          {
            key: 'Environment',
            value: 'production',
            propagateAtLaunch: true,
          },
          {
            key: 'ManagedBy',
            value: 'pulumi',
            propagateAtLaunch: true,
          },
        ],
      },
      { parent: this }
    );

    // Create scale up policy
    const scaleUpPolicy = new aws.autoscaling.Policy(
      `tap-scale-up-policy-${environmentSuffix}`,
      {
        scalingAdjustment: 1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: asg.name,
      },
      { parent: this }
    );

    // Create scale down policy
    const scaleDownPolicy = new aws.autoscaling.Policy(
      `tap-scale-down-policy-${environmentSuffix}`,
      {
        scalingAdjustment: -1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: asg.name,
      },
      { parent: this }
    );

    // Create CloudWatch alarm for high CPU (scale up)
    new aws.cloudwatch.MetricAlarm(
      `tap-cpu-high-alarm-${environmentSuffix}`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 60,
        statistic: 'Average',
        threshold: 70,
        alarmDescription: 'Trigger scale up when CPU exceeds 70% for 2 minutes',
        alarmActions: [scaleUpPolicy.arn],
        dimensions: {
          AutoScalingGroupName: asg.name,
        },
        tags: {
          ...defaultTags,
          Name: `tap-cpu-high-alarm-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create CloudWatch alarm for low CPU (scale down)
    new aws.cloudwatch.MetricAlarm(
      `tap-cpu-low-alarm-${environmentSuffix}`,
      {
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 5,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 60,
        statistic: 'Average',
        threshold: 30,
        alarmDescription:
          'Trigger scale down when CPU drops below 30% for 5 minutes',
        alarmActions: [scaleDownPolicy.arn],
        dimensions: {
          AutoScalingGroupName: asg.name,
        },
        tags: {
          ...defaultTags,
          Name: `tap-cpu-low-alarm-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create CloudWatch alarm for unhealthy target count
    new aws.cloudwatch.MetricAlarm(
      `tap-unhealthy-target-alarm-${environmentSuffix}`,
      {
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'UnHealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 0,
        alarmDescription: 'Alert when unhealthy targets are detected',
        dimensions: {
          TargetGroup: targetGroup.arnSuffix,
          LoadBalancer: alb.arnSuffix,
        },
        tags: {
          ...defaultTags,
          Name: `tap-unhealthy-target-alarm-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Export important values
    this.vpcId = vpc.id;
    this.albDnsName = alb.dnsName;
    this.asgName = asg.name;

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      albDnsName: this.albDnsName,
      asgName: this.asgName,
      region: region,
      availabilityZones: availabilityZones,
    });
  }
}
```

## File: bin/tap.ts

```ts
/**
 * Pulumi application entry point for the highly available web application
 * with auto-scaling and failure recovery.
 *
 * This module instantiates the TapStack with environment-specific configuration
 * and handles tagging for the ca-central-1 region deployment.
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack
const config = new pulumi.Config();

// Get the environment suffix from environment variable or Pulumi config, defaulting to 'dev'
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Get metadata from environment variables for tagging purposes
const repository = config.get('repository') || 'iac-test-automations';
const commitAuthor = config.get('commitAuthor') || 'synth-team';

// Define default tags to apply to all resources
const defaultTags = {
  Environment: 'production',
  ManagedBy: 'pulumi',
  Repository: repository,
  Author: commitAuthor,
};

// Instantiate the main TapStack component
const stack = new TapStack('tap-ha-stack', {
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
});

// Export stack outputs for easy access
export const vpcId = stack.vpcId;
export const albDnsName = stack.albDnsName;
export const asgName = stack.asgName;
export const applicationUrl = pulumi.interpolate`http://${stack.albDnsName}`;
```

## Deployment Instructions

### Prerequisites

1. Install Pulumi CLI:

   ```bash
   curl -fsSL https://get.pulumi.com | sh
   ```

2. Install Node.js dependencies:

   ```bash
   npm install
   ```

3. Install required Pulumi packages:

   ```bash
   npm install @pulumi/pulumi @pulumi/aws
   ```

4. Configure AWS credentials:

   ```bash
   aws configure
   ```

5. Set the AWS region:
   ```bash
   pulumi config set aws:region ca-central-1
   ```

### Deployment Steps

1. Initialize Pulumi stack:

   ```bash
   pulumi stack init dev
   ```

2. Preview the infrastructure:

   ```bash
   pulumi preview
   ```

3. Deploy the infrastructure:

   ```bash
   pulumi up
   ```

4. View the outputs:

   ```bash
   pulumi stack output
   ```

5. Access the application using the ALB DNS name:
   ```bash
   curl $(pulumi stack output albDnsName)
   ```

### Testing Auto-Scaling

1. Generate load to trigger scale-up:

   ```bash
   # Install Apache Bench
   sudo yum install httpd-tools -y

   # Generate load
   ab -n 10000 -c 100 http://$(pulumi stack output albDnsName)/
   ```

2. Monitor Auto Scaling Group:

   ```bash
   aws autoscaling describe-auto-scaling-groups \
     --auto-scaling-group-names $(pulumi stack output asgName) \
     --region ca-central-1
   ```

3. Check CloudWatch alarms:
   ```bash
   aws cloudwatch describe-alarms --region ca-central-1
   ```

### Testing Failure Recovery

1. Terminate an instance manually:

   ```bash
   # Get instance ID from Auto Scaling Group
   aws autoscaling describe-auto-scaling-instances \
     --region ca-central-1 --query 'AutoScalingInstances[0].InstanceId'

   # Terminate the instance
   aws ec2 terminate-instances --instance-ids <instance-id> --region ca-central-1
   ```

2. Verify Auto Scaling Group launches a replacement instance:

   ```bash
   aws autoscaling describe-auto-scaling-groups \
     --auto-scaling-group-names $(pulumi stack output asgName) \
     --region ca-central-1
   ```

3. Check target group health:
   ```bash
   aws elbv2 describe-target-health \
     --target-group-arn <target-group-arn> \
     --region ca-central-1
   ```

### Cleanup

To destroy all resources:

```bash
pulumi destroy
pulumi stack rm dev
```

## Architecture Details

### High Availability

- Instances deployed across 2 availability zones (ca-central-1a and ca-central-1b)
- Minimum of 2 instances always running
- Application Load Balancer distributes traffic across healthy instances

### Auto-Scaling

- Scale up when CPU > 70% for 2 minutes
- Scale down when CPU < 30% for 5 minutes
- Cooldown period of 300 seconds between scaling actions
- Maximum of 6 instances to handle peak load

### Failure Recovery

- ELB health checks every 30 seconds
- Unhealthy instances marked after 3 failed health checks (90 seconds)
- Auto Scaling Group automatically replaces unhealthy instances
- Health check grace period of 300 seconds for new instances

### Monitoring

- CloudWatch alarm for high CPU utilization
- CloudWatch alarm for low CPU utilization
- CloudWatch alarm for unhealthy target count
- All metrics evaluated every 60 seconds

### Security

- ALB and instances in public subnets (cost optimization - no NAT Gateway required)
- Security groups with least privilege access (instances only accept traffic from ALB)
- IAM roles with minimal required permissions SSM and CloudWatch only
- Instances automatically assigned public IPs for internet access

## Cost Optimization

This implementation uses several cost-optimization strategies:

- t3.micro instances (AWS Free Tier eligible)
- No NAT Gateways (instances in public subnets have direct internet access)
- Application Load Balancer shared across all instances
- Auto-scaling reduces costs during low-traffic periods
- CloudWatch alarms use standard metrics (no custom metrics)

Estimated monthly cost (assuming 2 instances running 24/7):

- EC2 instances (2x t3.micro): ~$15/month
- Application Load Balancer: ~$22/month
- Data transfer and CloudWatch: ~$5/month
- **Total: ~$42/month**
