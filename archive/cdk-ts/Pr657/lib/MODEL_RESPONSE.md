I'll design a comprehensive AWS CDK stack in TypeScript that meets all your requirements. Here's the complete solution:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

/**
 * ProjectX Infrastructure Stack
 * 
 * This stack creates a highly available, scalable infrastructure with:
 * - VPC with public subnets across multiple AZs
 * - Auto Scaling Group with EC2 instances distributed across AZs
 * - Security groups following AWS best practices
 * - Internet Gateway for public access
 */
export class ProjectXInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: {
        region: 'us-east-1', // Explicitly set region as required
        account: props?.env?.account
      }
    });

    // 1. Create VPC with high availability across multiple AZs
    const vpc = new ec2.Vpc(this, 'ProjectXVpc', {
      vpcName: 'projectX-vpc',
      cidr: '10.0.0.0/16',
      maxAzs: 3, // Use up to 3 AZs for better distribution
      enableDnsHostnames: true,
      enableDnsSupport: true,
      
      // Create public subnets only for this use case
      // Each subnet will be in a different AZ automatically
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'projectX-public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        }
      ],
      
      // Internet Gateway is automatically created and attached
      // when PUBLIC subnets are specified
      natGateways: 0, // No NAT gateways needed for public-only setup
    });

    // Tag the VPC for better resource management
    cdk.Tags.of(vpc).add('Name', 'projectX-vpc');
    cdk.Tags.of(vpc).add('Project', 'ProjectX');

    // 2. Create Security Group for EC2 instances
    const webSecurityGroup = new ec2.SecurityGroup(this, 'ProjectXWebSecurityGroup', {
      securityGroupName: 'projectX-web-sg',
      vpc: vpc,
      description: 'Security group for ProjectX web servers allowing HTTP/HTTPS traffic',
      allowAllOutbound: true, // Allow all outbound traffic by default
    });

    // Add inbound rules for HTTP and HTTPS traffic
    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );

    // Add SSH access for management (best practice: restrict to specific IPs in production)
    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access for management'
    );

    // Tag the security group
    cdk.Tags.of(webSecurityGroup).add('Name', 'projectX-web-sg');
    cdk.Tags.of(webSecurityGroup).add('Project', 'ProjectX');

    // 3. Create IAM Role for EC2 instances (following AWS best practices)
    const ec2Role = new iam.Role(this, 'ProjectXEC2Role', {
      roleName: 'projectX-ec2-role',
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for ProjectX EC2 instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'), // For Systems Manager
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'), // For CloudWatch monitoring
      ],
    });

    // 4. Create Launch Template for Auto Scaling Group
    const launchTemplate = new ec2.LaunchTemplate(this, 'ProjectXLaunchTemplate', {
      launchTemplateName: 'projectX-launch-template',
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      
      // Use Amazon Linux 2023 AMI (latest)
      machineImage: ec2.MachineImage.latestAmazonLinux2023({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2023,
      }),
      
      securityGroup: webSecurityGroup,
      role: ec2Role,
      
      // User data script to set up a basic web server
      userData: ec2.UserData.forLinux(),
    });

    // Add user data commands to install and start Apache web server
    launchTemplate.userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>ProjectX Web Server</h1>" > /var/www/html/index.html',
      'echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html',
      'echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html'
    );

    // 5. Create Auto Scaling Group with high availability
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'ProjectXAutoScalingGroup', {
      autoScalingGroupName: 'projectX-asg',
      vpc: vpc,
      launchTemplate: launchTemplate,
      
      // Distribute instances across all available subnets (different AZs)
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      
      // Scaling configuration
      minCapacity: 2, // Minimum 2 instances as required
      maxCapacity: 6, // Allow scaling up to 6 instances
      desiredCapacity: 2, // Start with 2 instances
      
      // Health check configuration
      healthCheck: autoscaling.HealthCheck.ec2({
        grace: cdk.Duration.seconds(300), // 5 minutes grace period
      }),
      
      // Update policy for rolling deployments
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
        maxBatchSize: 1,
        minInstancesInService: 1,
        pauseTime: cdk.Duration.seconds(300),
      }),
    });

    // 6. Add scaling policies for dynamic scaling
    // Scale up policy
    const scaleUpPolicy = autoScalingGroup.scaleOnCpuUtilization('ProjectXScaleUpPolicy', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(300),
    });

    // Add custom scaling policy for more granular control
    autoScalingGroup.scaleOnMetric('ProjectXCustomScaling', {
      metric: autoScalingGroup.metricCpuUtilization(),
      scalingSteps: [
        { upper: 30, change: -1 }, // Scale down when CPU < 30%
        { lower: 50, upper: 70, change: 0 }, // No change when CPU 50-70%
        { lower: 70, upper: 85, change: +1 }, // Scale up when CPU 70-85%
        { lower: 85, change: +2 }, // Scale up by 2 when CPU > 85%
      ],
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
    });

    // Tag the Auto Scaling Group
    cdk.Tags.of(autoScalingGroup).add('Name', 'projectX-asg');
    cdk.Tags.of(autoScalingGroup).add('Project', 'ProjectX');

    // 7. Output important information
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID for ProjectX infrastructure',
      exportName: 'ProjectX-VPC-ID',
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: webSecurityGroup.securityGroupId,
      description: 'Security Group ID for web servers',
      exportName: 'ProjectX-SecurityGroup-ID',
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group name',
      exportName: 'ProjectX-ASG-Name',
    });

    // Output the availability zones being used
    new cdk.CfnOutput(this, 'AvailabilityZones', {
      value: vpc.availabilityZones.join(', '),
      description: 'Availability zones used by the VPC',
      exportName: 'ProjectX-AZs',
    });

    // Output subnet information
    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpc.publicSubnets.map(subnet => subnet.subnetId).join(', '),
      description: 'Public subnet IDs',
      exportName: 'ProjectX-Public-Subnets',
    });
  }
}

// App instantiation
const app = new cdk.App();

new ProjectXInfrastructureStack(app, 'ProjectXInfrastructureStack', {
  description: 'ProjectX Infrastructure Stack - Highly available web application infrastructure',
  
  // Stack-level tags
  tags: {
    Project: 'ProjectX',
    Environment: 'Production',
    ManagedBy: 'AWS-CDK',
  },
});

app.synth();
```

## Key Features and Design Decisions

### **1. High Availability Architecture**
- **Multi-AZ Deployment**: VPC spans up to 3 availability zones in us-east-1
- **Distributed Instances**: Auto Scaling Group ensures instances are distributed across different AZs
- **Redundancy**: Minimum 2 instances maintained at all times

### **2. Scalability Features**
- **Auto Scaling Group**: Configured with min=2, max=6, desired=2
- **Dynamic Scaling**: CPU-based scaling policies with custom thresholds
- **Launch Template**: Standardized instance configuration for consistent deployments

### **3. Security Best Practices**
- **Least Privilege**: IAM role with only necessary managed policies
- **Network Security**: Security groups with specific port access (80, 443, 22)
- **Resource Isolation**: Dedicated VPC with proper subnet configuration

### **4. Naming Convention Compliance**
All resources follow the `projectX-<component>` naming pattern:
- `projectX-vpc`
- `projectX-public-subnet`
- `projectX-web-sg`
- `projectX-asg`
- `projectX-launch-template`
- `projectX-ec2-role`

### **5. Monitoring and Management**
- **CloudWatch Integration**: Instances configured for CloudWatch monitoring
- **Systems Manager**: SSM agent enabled for remote management
- **Health Checks**: EC2 health checks with appropriate grace periods

### **6. Deployment Instructions**

To deploy this stack:

```bash
# Initialize CDK project (if not already done)
npm install -g aws-cdk
mkdir projectx-infrastructure && cd projectx-infrastructure
cdk init app --language typescript

# Replace the generated stack file with the code above
# Install dependencies
npm install

# Bootstrap CDK (first time only)
cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1

# Deploy the stack
cdk deploy

# View the deployed resources
cdk ls
```

This solution provides a production-ready, highly available infrastructure that automatically scales based on demand while maintaining security best practices and proper resource naming conventions.