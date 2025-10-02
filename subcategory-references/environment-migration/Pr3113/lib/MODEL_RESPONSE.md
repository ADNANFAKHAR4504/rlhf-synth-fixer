Alright, I'll create a complete AWS CDK stack using TypeScript to deploy a secure and highly available three-tier web application architecture. Let's break down the requirements and implement them one by one.

First, let's set up the basic structure of the CDK stack. We'll need to import the necessary AWS CDK libraries and define the stack class.

1. **VPC and Subnet Configuration**:
   - Create a new VPC with CIDR block `192.168.0.0/16`
   - Span two Availability Zones
   - Configure three subnet tiers:
     - Public Subnets
     - Private Application Subnets
     - Private Database Subnets

2. **Load Balancing and Compute**:
   - Deploy an ALB in the public subnets
   - Launch EC2 instances in each private application subnet
   - Install and run a simple web server on the EC2 instances

3. **Network Security and Routing**:
   - Deploy a NAT Gateway in each public subnet
   - No public IPs for EC2 instances in private subnets
   - Configure Security Groups with strict rules

4. **Bastion Host for Management and Testing**:
   - Place a bastion host in a public subnet
   - Create a dedicated security group for the bastion host
   - Allow inbound SSH traffic from a configurable IP

Let's start by writing the CDK stack TypeScript file:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import { Construct } from 'constructs';

export interface MigrationStackProps extends cdk.StackProps {
  // Allow for customization of bastion host source IP
  bastionSourceIp?: string;
}

export class MigrationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: MigrationStackProps) {
    super(scope, id, props);

    // Default bastion source IP if not provided
    const bastionSourceIp = props?.bastionSourceIp || '0.0.0.0/0';

    // 1. VPC and Subnet Configuration
    const vpc = new ec2.Vpc(this, 'MigrationVPC', {
      cidr: '192.168.0.0/16',
      maxAzs: 2, // Span 2 AZs
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateApplication',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'PrivateDatabase',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      natGateways: 2, // One NAT Gateway per AZ
    });

    // 2. Security Groups
    
    // ALB Security Group: Allow inbound HTTP from anywhere
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for the Application Load Balancer',
      allowAllOutbound: true,
    });
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from the internet'
    );

    // Web Tier Security Group: Only allow inbound from ALB
    const webTierSecurityGroup = new ec2.SecurityGroup(this, 'WebTierSecurityGroup', {
      vpc,
      description: 'Security group for the Web Tier EC2 instances',
      allowAllOutbound: true,
    });
    webTierSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(albSecurityGroup.securityGroupId),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB only'
    );

    // Bastion Host Security Group: Allow SSH from specified IP
    const bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSecurityGroup', {
      vpc,
      description: 'Security group for the Bastion Host',
      allowAllOutbound: true,
    });
    bastionSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(bastionSourceIp),
      ec2.Port.tcp(22),
      'Allow SSH traffic from specified IP'
    );

    // 3. EC2 Instances
    
    // AMI for EC2 Instances
    const ami = ec2.MachineImage.latestAmazonLinux2({
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    // User data script to install and start nginx
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y nginx',
      'echo "<html><head><title>Migration Web App</title></head><body><h1>Welcome to the Migration Web App!</h1><p>This is a simple web server deployed as part of a three-tier architecture.</p></body></html>" > /usr/share/nginx/html/index.html',
      'systemctl start nginx',
      'systemctl enable nginx'
    );

    // Create web server instances in each private application subnet
    const webTierAsg = new autoscaling.AutoScalingGroup(this, 'WebTierASG', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ami,
      securityGroup: webTierSecurityGroup,
      userData,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      minCapacity: 2, // One instance per AZ for high availability
      maxCapacity: 4,
      desiredCapacity: 2,
    });

    // 4. Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'WebTierALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    // Add listener to ALB
    const listener = alb.addListener('HTTPListener', {
      port: 80,
      open: true,
    });

    // Register instances with target group
    listener.addTargets('WebTierTargetGroup', {
      port: 80,
      targets: [webTierAsg],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
      },
    });

    // 5. Bastion Host
    const bastionHost = new ec2.Instance(this, 'BastionHost', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
      machineImage: ami,
      securityGroup: bastionSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      keyName: 'migration-bastion-key', // Note: You must create this key pair in AWS Console
    });

    // 6. Output the ALB DNS name and Bastion Host public IP
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'The DNS name of the load balancer',
    });
    
    new cdk.CfnOutput(this, 'BastionHostIP', {
      value: bastionHost.instancePublicIp,
      description: 'The public IP address of the bastion host',
    });
  }
}
```

Let me review this code and ensure it meets all the requirements:

1. **VPC and Subnet Configuration**:
   - Created a VPC with CIDR block `192.168.0.0/16`
   - Configured to span 2 AZs
   - Created three tiers of subnets:
     - Public subnets (for ALB and bastion host)
     - Private application subnets with NAT gateways (for web servers)
     - Private isolated subnets (for databases, although we haven't deployed any databases yet)

2. **Load Balancing and Compute**:
   - Deployed an ALB in the public subnets
   - Created EC2 instances in the private application subnets using an Auto Scaling Group
   - Installed and configured Nginx on the EC2 instances

3. **Network Security and Routing**:
   - Deployed NAT gateways (one per AZ)
   - EC2 instances in private subnets don't have public IPs
   - Configured security groups with strict rules:
     - ALB security group allows HTTP (port 80) from anywhere
     - Web tier security group only allows traffic from ALB
     - Bastion host security group only allows SSH from specified IP

4. **Bastion Host**:
   - Placed in a public subnet
   - Has a dedicated security group
   - Allows SSH (port 22) only from a configurable IP address

This implementation seems to meet all the requirements specified, but let's further improve and refine it with more detailed comments, better error handling, and some additional best practices. Let me add some more comments and refine the implementation:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import { Construct } from 'constructs';

/**
 * Properties for the MigrationStack
 */
export interface MigrationStackProps extends cdk.StackProps {
  /**
   * The IP address or CIDR range that is allowed to SSH to the bastion host.
   * @default '0.0.0.0/0' (Not recommended for production)
   */
  bastionSourceIp?: string;
}

/**
 * A CDK Stack that deploys a secure, highly available three-tier web application architecture.
 * 
 * Architecture Overview:
 * - VPC spanning 2 AZs with public, private application, and private database subnets
 * - NAT Gateways for outbound internet access from private subnets
 * - Application Load Balancer in public subnets
 * - EC2 instances running web servers in private application subnets
 * - Bastion host in a public subnet for secure administrative access
 * - Security groups with least privilege permissions
 */
export class MigrationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: MigrationStackProps) {
    super(scope, id, props);

    // Default bastion source IP if not provided (should be locked down in production)
    const bastionSourceIp = props?.bastionSourceIp || '0.0.0.0/0';

    // -------------------------------------------------------------------------
    // VPC and Network Configuration
    // -------------------------------------------------------------------------
    
    /**
     * Create a new VPC with the following:
     * - CIDR block: 192.168.0.0/16
     * - 2 Availability Zones
     * - 3 subnet tiers (public, private with NAT, and isolated)
     * - 1 NAT Gateway per AZ for high availability
     */
    const vpc = new ec2.Vpc(this, 'MigrationVPC', {
      cidr: '192.168.0.0/16',
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateApplication',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'PrivateDatabase',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      natGateways: 2,
    });

    // -------------------------------------------------------------------------
    // Security Groups
    // -------------------------------------------------------------------------
    
    /**
     * ALB Security Group:
     * - Allows inbound HTTP traffic (port 80) from anywhere on the internet
     * - Allows all outbound traffic
     */
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for the Application Load Balancer',
      allowAllOutbound: true,
    });
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from the internet'
    );

    /**
     * Web Tier Security Group:
     * - Only allows inbound HTTP traffic (port 80) from the ALB security group
     * - Allows all outbound traffic
     */
    const webTierSecurityGroup = new ec2.SecurityGroup(this, 'WebTierSecurityGroup', {
      vpc,
      description: 'Security group for the Web Tier EC2 instances',
      allowAllOutbound: true,
    });
    webTierSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(albSecurityGroup.securityGroupId),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB only'
    );

    /**
     * Bastion Host Security Group:
     * - Only allows inbound SSH traffic (port 22) from the specified IP address/range
     * - Allows all outbound traffic
     */
    const bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSecurityGroup', {
      vpc,
      description: 'Security group for the Bastion Host',
      allowAllOutbound: true,
    });
    bastionSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(bastionSourceIp),
      ec2.Port.tcp(22),
      'Allow SSH traffic from specified IP'
    );

    // -------------------------------------------------------------------------
    // Web Tier Compute Resources
    // -------------------------------------------------------------------------
    
    // Latest Amazon Linux 2 AMI
    const ami = ec2.MachineImage.latestAmazonLinux2({
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    // User data script to install and start nginx with a simple welcome page
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y nginx',
      'echo "<html><head><title>Migration Web App</title></head><body><h1>Welcome to the Migration Web App!</h1><p>This is a simple web server deployed as part of a three-tier architecture.</p></body></html>" > /usr/share/nginx/html/index.html',
      'systemctl start nginx',
      'systemctl enable nginx'
    );

    /**
     * Auto Scaling Group for Web Tier:
     * - Deploys EC2 instances in private application subnets
     * - Ensures high availability by spanning multiple AZs
     * - Uses t3.micro instances for cost efficiency
     * - Applies the web tier security group
     * - Initializes instances with the nginx user data script
     */
    const webTierAsg = new autoscaling.AutoScalingGroup(this, 'WebTierASG', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ami,
      securityGroup: webTierSecurityGroup,
      userData,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      minCapacity: 2,
      maxCapacity: 4,
      desiredCapacity: 2,
    });

    // -------------------------------------------------------------------------
    // Load Balancer Configuration
    // -------------------------------------------------------------------------
    
    /**
     * Application Load Balancer:
     * - Deployed in public subnets
     * - Internet-facing to accept traffic from the internet
     * - Uses the ALB security group
     */
    const alb = new elbv2.ApplicationLoadBalancer(this, 'WebTierALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    // Add HTTP listener on port 80
    const listener = alb.addListener('HTTPListener', {
      port: 80,
      open: true,
    });

    // Register web tier instances with the target group
    listener.addTargets('WebTierTargetGroup', {
      port: 80,
      targets: [webTierAsg],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 2,
      },
    });

    // -------------------------------------------------------------------------
    // Bastion Host Configuration
    // -------------------------------------------------------------------------
    
    /**
     * Bastion Host:
     * - Deployed in a public subnet for SSH access
     * - Uses t3.nano instance type to minimize cost
     * - Applies the bastion security group
     * - Requires an existing key pair (must be created separately)
     */
    const bastionHost = new ec2.Instance(this, 'BastionHost', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
      machineImage: ami,
      securityGroup: bastionSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      keyName: 'migration-bastion-key', // Note: You must create this key pair in AWS Console
    });

    // -------------------------------------------------------------------------
    // Stack Outputs
    // -------------------------------------------------------------------------
    
    // Output the ALB DNS name for accessing the web application
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'The DNS name of the load balancer',
      exportName: 'MigrationStackLoadBalancerDNS',
    });
    
    // Output the Bastion Host public IP for SSH access
    new cdk.CfnOutput(this, 'BastionHostIP', {
      value: bastionHost.instancePublicIp,
      description: 'The public IP address of the bastion host',
      exportName: 'MigrationStackBastionHostIP',
    });
  }
}
```

I've made several enhancements to the code:

1. Added comprehensive JSDoc comments to explain the purpose and details of each component
2. Organized the code into logical sections with clear headers
3. Added more detailed health check configuration for the ALB target group
4. Added export names to the stack outputs for easier cross-stack referencing
5. Enhanced the explanation of security group rules and their purposes

The code now meets all the requirements and provides a well-structured, well-commented implementation of a secure and highly available three-tier web application architecture. Let's finalize this and make sure all parts are properly implemented and documented.

One note about the bastion host: we're specifying a key name ('migration-bastion-key') which the user would need to create separately in the AWS console. In a more complete solution, we might want to generate this key pair as part of the CDK deployment, but that would require additional code to handle the private key securely, which is beyond the scope of this exercise.

Also, in a real production environment, the bastion source IP should definitely be restricted to a specific IP range rather than using '0.0.0.0/0', but we're using that as a placeholder as requested.

Let me review the code one final time to ensure it's production-ready:

1. **VPC and subnets**: Correctly configured with CIDR block 192.168.0.0/16, spanning 2 AZs, with the three required subnet tiers.
2. **NAT Gateways**: Deployed in each public subnet for high availability.
3. **Security Groups**: Properly configured with the required strict rules.
4. **EC2 instances**: Deployed in private application subnets with a simple web server.
5. **ALB**: Configured in public subnets to route traffic to the EC2 instances.
6. **Bastion host**: Placed in a public subnet with a dedicated security group.

Everything looks good. The code is complete, well-structured, and well-commented. It should be ready to deploy a secure and highly available three-tier web application architecture in AWS.

The final code for lib/migration-stack.ts:
### Answer 
---

# AWS Three-Tier Web Application Infrastructure

Below is a complete AWS CDK stack using TypeScript that deploys a secure, highly available three-tier web application architecture. This implementation follows best practices for enterprise cloud migrations.

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import { Construct } from 'constructs';

/**
 * Properties for the MigrationStack
 */
export interface MigrationStackProps extends cdk.StackProps {
  /**
   * The IP address or CIDR range that is allowed to SSH to the bastion host.
   * @default '0.0.0.0/0' (Not recommended for production)
   */
  bastionSourceIp?: string;
}

/**
 * A CDK Stack that deploys a secure, highly available three-tier web application architecture.
 * 
 * Architecture Overview:
 * - VPC spanning 2 AZs with public, private application, and private database subnets
 * - NAT Gateways for outbound internet access from private subnets
 * - Application Load Balancer in public subnets
 * - EC2 instances running web servers in private application subnets
 * - Bastion host in a public subnet for secure administrative access
 * - Security groups with least privilege permissions
 */
export class MigrationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: MigrationStackProps) {
    super(scope, id, props);

    // Default bastion source IP if not provided (should be locked down in production)
    const bastionSourceIp = props?.bastionSourceIp || '0.0.0.0/0';

    // -------------------------------------------------------------------------
    // VPC and Network Configuration
    // -------------------------------------------------------------------------
    
    /**
     * Create a new VPC with the following:
     * - CIDR block: 192.168.0.0/16
     * - 2 Availability Zones
     * - 3 subnet tiers (public, private with NAT, and isolated)
     * - 1 NAT Gateway per AZ for high availability
     */
    const vpc = new ec2.Vpc(this, 'MigrationVPC', {
      cidr: '192.168.0.0/16',
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateApplication',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'PrivateDatabase',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      natGateways: 2,
    });

    // -------------------------------------------------------------------------
    // Security Groups
    // -------------------------------------------------------------------------
    
    /**
     * ALB Security Group:
     * - Allows inbound HTTP traffic (port 80) from anywhere on the internet
     * - Allows all outbound traffic
     */
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for the Application Load Balancer',
      allowAllOutbound: true,
    });
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from the internet'
    );

    /**
     * Web Tier Security Group:
     * - Only allows inbound HTTP traffic (port 80) from the ALB security group
     * - Allows all outbound traffic
     */
    const webTierSecurityGroup = new ec2.SecurityGroup(this, 'WebTierSecurityGroup', {
      vpc,
      description: 'Security group for the Web Tier EC2 instances',
      allowAllOutbound: true,
    });
    webTierSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(albSecurityGroup.securityGroupId),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB only'
    );

    /**
     * Bastion Host Security Group:
     * - Only allows inbound SSH traffic (port 22) from the specified IP address/range
     * - Allows all outbound traffic
     */
    const bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSecurityGroup', {
      vpc,
      description: 'Security group for the Bastion Host',
      allowAllOutbound: true,
    });
    bastionSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(bastionSourceIp),
      ec2.Port.tcp(22),
      'Allow SSH traffic from specified IP'
    );

    // -------------------------------------------------------------------------
    // Web Tier Compute Resources
    // -------------------------------------------------------------------------
    
    // Latest Amazon Linux 2 AMI
    const ami = ec2.MachineImage.latestAmazonLinux2({
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    // User data script to install and start nginx with a simple welcome page
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y nginx',
      'echo "<html><head><title>Migration Web App</title></head><body><h1>Welcome to the Migration Web App!</h1><p>This is a simple web server deployed as part of a three-tier architecture.</p></body></html>" > /usr/share/nginx/html/index.html',
      'systemctl start nginx',
      'systemctl enable nginx'
    );

    /**
     * Auto Scaling Group for Web Tier:
     * - Deploys EC2 instances in private application subnets
     * - Ensures high availability by spanning multiple AZs
     * - Uses t3.micro instances for cost efficiency
     * - Applies the web tier security group
     * - Initializes instances with the nginx user data script
     */
    const webTierAsg = new autoscaling.AutoScalingGroup(this, 'WebTierASG', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ami,
      securityGroup: webTierSecurityGroup,
      userData,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      minCapacity: 2,
      maxCapacity: 4,
      desiredCapacity: 2,
    });

    // -------------------------------------------------------------------------
    // Load Balancer Configuration
    // -------------------------------------------------------------------------
    
    /**
     * Application Load Balancer:
     * - Deployed in public subnets
     * - Internet-facing to accept traffic from the internet
     * - Uses the ALB security group
     */
    const alb = new elbv2.ApplicationLoadBalancer(this, 'WebTierALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    // Add HTTP listener on port 80
    const listener = alb.addListener('HTTPListener', {
      port: 80,
      open: true,
    });

    // Register web tier instances with the target group
    listener.addTargets('WebTierTargetGroup', {
      port: 80,
      targets: [webTierAsg],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 2,
      },
    });

    // -------------------------------------------------------------------------
    // Bastion Host Configuration
    // -------------------------------------------------------------------------
    
    /**
     * Bastion Host:
     * - Deployed in a public subnet for SSH access
     * - Uses t3.nano instance type to minimize cost
     * - Applies the bastion security group
     * - Requires an existing key pair (must be created separately)
     */
    const bastionHost = new ec2.Instance(this, 'BastionHost', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
      machineImage: ami,
      securityGroup: bastionSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      keyName: 'migration-bastion-key', // Note: You must create this key pair in AWS Console
    });

    // -------------------------------------------------------------------------
    // Stack Outputs
    // -------------------------------------------------------------------------
    
    // Output the ALB DNS name for accessing the web application
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'The DNS name of the load balancer',
      exportName: 'MigrationStackLoadBalancerDNS',
    });
    
    // Output the Bastion Host public IP for SSH access
    new cdk.CfnOutput(this, 'BastionHostIP', {
      value: bastionHost.instancePublicIp,
      description: 'The public IP address of the bastion host',
      exportName: 'MigrationStackBastionHostIP',
    });
  }
}
```

## Architecture Overview

This CDK stack implements a complete three-tier architecture with:

1. **Networking Layer**:
   - Custom VPC (CIDR: 192.168.0.0/16) spanning 2 Availability Zones
   - Three subnet tiers in each AZ (public, private application, private database)
   - NAT Gateways in each public subnet for high availability

2. **Security Layer**:
   - Dedicated security groups for each component with principle of least privilege
   - ALB security group allows HTTP (port 80) from the internet
   - Web tier security group only allows traffic from the ALB
   - Bastion host security group only allows SSH from a configurable IP address

3. **Compute Layer**:
   - Auto Scaling Group with EC2 instances in private application subnets
   - Simple web server (nginx) installed via user data script
   - Application Load Balancer in public subnets to route traffic to web instances
   - Bastion host in a public subnet for secure administrative access

## Deployment Notes

1. Before deploying this stack, create an EC2 key pair named `migration-bastion-key` in the AWS Console for SSH access to the bastion host.

2. For production use, replace the `bastionSourceIp` parameter with your specific IP address or CIDR range instead of the default '0.0.0.0/0'.

3. The stack outputs the Load Balancer DNS and Bastion Host IP address for easy access to the application and management infrastructure.