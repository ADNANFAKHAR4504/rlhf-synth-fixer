# Web Application Infrastructure - CDK TypeScript Implementation (Ideal Response)

This implementation provides a production-ready, high-availability web application infrastructure on AWS using CDK TypeScript with best practices for security, scalability, and maintainability.

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const stackName = this.stackName;

    // Create VPC with public and private subnets across 2 AZs
    const vpc = new ec2.Vpc(this, 'WebAppVPC', {
      vpcName: `webapp-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      securityGroupName: `alb-sg-${environmentSuffix}`,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Security Group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      securityGroupName: `ec2-sg-${environmentSuffix}`,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );

    // Security Group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      securityGroupName: `rds-sg-${environmentSuffix}`,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL from EC2 instances'
    );

    // IAM Role for EC2 instances with least privilege
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
      ],
    });

    // User data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Web App Server</h1>" > /var/www/html/index.html',
      'echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html'
    );

    // Launch Template for Auto Scaling
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'WebAppLaunchTemplate',
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        securityGroup: ec2SecurityGroup,
        userData,
        role: ec2Role,
      }
    );

    // Auto Scaling Group with proper health checks
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'WebAppASG',
      {
        vpc,
        autoScalingGroupName: `webapp-asg-${environmentSuffix}`,
        launchTemplate,
        minCapacity: 2,
        maxCapacity: 6,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(5),
        }),
      }
    );

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'WebAppALB', {
      vpc,
      loadBalancerName: `webapp-alb-${environmentSuffix}`,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Target Group for ALB with health checks
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'WebAppTargetGroup',
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 5,
        },
      }
    );

    // Attach Auto Scaling Group to Target Group
    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // ALB Listener
    alb.addListener('WebAppListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // RDS Subnet Group
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // RDS Database Instance with Multi-AZ for high availability
    const database = new rds.DatabaseInstance(this, 'WebAppDatabase', {
      databaseName: `webappdb${environmentSuffix}`.replace(/-/g, ''),
      instanceIdentifier: `webapp-db-${environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      credentials: rds.Credentials.fromGeneratedSecret('admin'),
      multiAz: true,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      deleteAutomatedBackups: true,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false, // Must be false for destroyable resources
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Ensure resource can be destroyed
      securityGroups: [rdsSecurityGroup],
      subnetGroup,
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(
        this,
        'DefaultParameterGroup',
        'default.mysql8.0'
      ),
    });

    // Auto Scaling Policies
    autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });

    // Comprehensive Outputs for integration
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
      exportName: `${stackName}-LoadBalancerDNS`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerArn', {
      value: alb.loadBalancerArn,
      description: 'Application Load Balancer ARN',
      exportName: `${stackName}-LoadBalancerArn`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
      exportName: `${stackName}-DatabaseEndpoint`,
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: database.instanceEndpoint.port.toString(),
      description: 'RDS database port',
      exportName: `${stackName}-DatabasePort`,
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${stackName}-VPCId`,
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group name',
      exportName: `${stackName}-AutoScalingGroupName`,
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
      exportName: `${stackName}-EnvironmentSuffix`,
    });
  }
}
```

## bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
```

## Key Improvements in the Ideal Response

### 1. **High Availability Architecture**
- VPC spans 2 availability zones with redundant NAT gateways
- Multi-AZ RDS deployment for database high availability
- Auto Scaling Group distributes EC2 instances across AZs
- Application Load Balancer configured for internet-facing access

### 2. **Security Best Practices**
- Least privilege IAM roles for EC2 instances
- Security groups with minimal required access
- Private subnets for application and database tiers
- RDS in isolated subnets with no internet access
- Removed unnecessary port 8080 access (not required)

### 3. **Resource Management**
- Environment suffix on all resource names to prevent conflicts
- Deletion protection disabled for clean teardown
- RemovalPolicy.DESTROY for development environments
- Proper resource tagging for cost tracking

### 4. **Monitoring and Scaling**
- Auto Scaling based on CPU utilization
- ELB health checks for instance health monitoring
- Target group health checks for application monitoring
- CloudWatch integration through IAM role

### 5. **Deployment Configuration**
- Comprehensive stack outputs for integration testing
- Export names for cross-stack references
- Proper parameter handling for environment configuration
- Support for CI/CD pipeline integration

### 6. **Code Quality**
- TypeScript interfaces for type safety
- Consistent naming conventions
- Proper error handling through CDK validations
- Clean separation of concerns

This implementation meets all requirements from the prompt while following AWS and CDK best practices for a production-ready infrastructure deployment.