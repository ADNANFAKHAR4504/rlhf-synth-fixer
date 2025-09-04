# AWS CDK TypeScript Solution for Highly Available Auto-Scaling Environment

Here's a production-ready CDK TypeScript solution that implements all requirements with proper error handling, resource naming, and deployment considerations:

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create VPC with high availability across multiple AZs
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      vpcName: `TapVpc-${environmentSuffix}`,
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      natGateways: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      'AlbSecurityGroup',
      {
        vpc,
        securityGroupName: `TapAlbSecurityGroup-${environmentSuffix}`,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: true,
      }
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    // Security Group for EC2 instances
    const instanceSecurityGroup = new ec2.SecurityGroup(
      this,
      'InstanceSecurityGroup',
      {
        vpc,
        securityGroupName: `TapInstanceSecurityGroup-${environmentSuffix}`,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
      }
    );

    instanceSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from ALB on port 8080'
    );

    // Security Group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      'RdsSecurityGroup',
      {
        vpc,
        securityGroupName: `TapRdsSecurityGroup-${environmentSuffix}`,
        description: 'Security group for RDS MySQL database',
        allowAllOutbound: false,
      }
    );

    rdsSecurityGroup.addIngressRule(
      instanceSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL traffic from EC2 instances'
    );

    // User Data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Hello from Auto Scaling Group!</h1>" > /var/www/html/index.html',
      'sed -i "s/Listen 80/Listen 8080/g" /etc/httpd/conf/httpd.conf',
      'systemctl restart httpd'
    );

    // Launch Template for Auto Scaling Group
    const launchTemplate = new ec2.LaunchTemplate(this, 'TapLaunchTemplate', {
      launchTemplateName: `TapLaunchTemplate-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: instanceSecurityGroup,
      userData,
    });

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'TapAutoScalingGroup',
      {
        autoScalingGroupName: `TapAutoScalingGroup-${environmentSuffix}`,
        vpc,
        launchTemplate,
        minCapacity: 2,
        maxCapacity: 6,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.seconds(300),
        }),
      }
    );

    // CPU-based scaling policy
    autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.seconds(300),
    });

    // Application Load Balancer
    const loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      'TapLoadBalancer',
      {
        loadBalancerName: `TapLB-${environmentSuffix}`,
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'TapTargetGroup',
      {
        targetGroupName: `TapTG-${environmentSuffix}`,
        vpc,
        port: 8080,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
      }
    );

    // Attach Auto Scaling Group to Target Group
    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // Listener for Load Balancer
    loadBalancer.addListener('TapListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'TapDbSubnetGroup', {
      subnetGroupName: `tapdbsubnetgroup-${environmentSuffix}`,
      vpc,
      description: 'Subnet group for RDS MySQL database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // RDS MySQL Database Instance
    const database = new rds.DatabaseInstance(this, 'TapDatabase', {
      instanceIdentifier: `tapdb-${environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_5_7,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      multiAz: true,
      databaseName: 'tapdb',
      credentials: rds.Credentials.fromGeneratedSecret('admin'),
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false,
      storageEncrypted: true,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Apply Production tags to all resources
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(vpc).add('Name', `TapVpc-${environmentSuffix}`);
    cdk.Tags.of(loadBalancer).add(
      'Name',
      `TapLoadBalancer-${environmentSuffix}`
    );
    cdk.Tags.of(autoScalingGroup).add(
      'Name',
      `TapAutoScalingGroup-${environmentSuffix}`
    );
    cdk.Tags.of(database).add('Name', `TapDatabase-${environmentSuffix}`);

    // Output important information
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: loadBalancer.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
      exportName: `${environmentSuffix}-LoadBalancerDNS`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS MySQL database endpoint',
      exportName: `${environmentSuffix}-DatabaseEndpoint`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${environmentSuffix}-VpcId`,
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group Name',
      exportName: `${environmentSuffix}-AutoScalingGroupName`,
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
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 
  process.env.ENVIRONMENT_SUFFIX || 'dev';
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
    region: process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-west-2',
  },
});
```

## Key Improvements in the Ideal Solution:

1. **Resource Naming**: All resources include environment suffix to prevent conflicts
2. **Proper API Usage**: Uses non-deprecated CDK APIs (ipAddresses instead of cidr)
3. **High Availability**: Multi-AZ deployment with 2 NAT gateways and RDS Multi-AZ
4. **Security**: Properly configured security groups with minimal permissions
5. **Scalability**: Auto Scaling Group with CPU-based scaling policy
6. **Monitoring**: Health checks on ALB target group and ASG
7. **Tagging**: Comprehensive tagging for resource management
8. **Outputs**: Exports key values for integration with other stacks
9. **Cleanup**: RemovalPolicy.DESTROY for test environments
10. **Best Practices**: Follows AWS CDK patterns and conventions

This solution provides a production-ready, highly available cloud environment that meets all specified requirements while following AWS best practices.