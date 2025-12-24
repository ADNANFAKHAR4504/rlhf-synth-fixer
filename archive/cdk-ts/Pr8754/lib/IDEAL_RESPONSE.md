I'll help you create a scalable AWS infrastructure using CDK TypeScript with VPC, Auto Scaling, and ElastiCache Serverless. Here's the implementation:

## lib/tap-stack.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Create VPC with public and private subnets across multiple AZs
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      vpcName: `tap-vpc-${props.environmentSuffix}`,
      maxAzs: 3,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // IAM role for EC2 instances to access AWS services
    const ec2Role = new iam.Role(this, 'Ec2InstanceRole', {
      roleName: `tap-ec2-role-${props.environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Security Group for EC2 instances
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc,
      securityGroupName: `tap-web-sg-${props.environmentSuffix}`,
      description: 'Security group for web servers',
      allowAllOutbound: true,
    });

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Launch Template for Auto Scaling Group
    const launchTemplate = new ec2.LaunchTemplate(this, 'WebLaunchTemplate', {
      launchTemplateName: `tap-lt-${props.environmentSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      role: ec2Role,
      securityGroup: webSecurityGroup,
      userData: ec2.UserData.forLinux(),
    });

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'WebAutoScalingGroup',
      {
        autoScalingGroupName: `tap-asg-${props.environmentSuffix}`,
        vpc,
        launchTemplate,
        minCapacity: 2,
        maxCapacity: 10,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      }
    );

    // Auto Scaling policies for dynamic scaling
    autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
    });

    // ElastiCache Serverless for caching (latest feature)
    const cacheSubnetGroup = new elasticache.CfnSubnetGroup(
      this,
      'CacheSubnetGroup',
      {
        cacheSubnetGroupName: `tap-cache-subnet-${props.environmentSuffix}`,
        description: 'Subnet group for ElastiCache',
        subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
      }
    );

    const cacheSecurityGroup = new ec2.SecurityGroup(
      this,
      'CacheSecurityGroup',
      {
        vpc,
        securityGroupName: `tap-cache-sg-${props.environmentSuffix}`,
        description: 'Security group for ElastiCache',
        allowAllOutbound: false,
      }
    );

    cacheSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(webSecurityGroup.securityGroupId),
      ec2.Port.tcp(6379),
      'Allow Redis access from web servers'
    );

    // ElastiCache Serverless Redis
    const elastiCacheServerless = new elasticache.CfnServerlessCache(
      this,
      'ServerlessCache',
      {
        engine: 'redis',
        serverlessCacheName: `tap-cache-${props.environmentSuffix}`,
        description: 'Serverless Redis cache for web application',
        subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
        securityGroupIds: [cacheSecurityGroup.securityGroupId],
      }
    );

    // Ensure cache subnet group is created before the cache
    elastiCacheServerless.addDependency(cacheSubnetGroup);

    // Store some SSM parameters for integration testing
    new ssm.StringParameter(this, 'VpcIdParam', {
      parameterName: `/tap/${props.environmentSuffix}/vpc-id`,
      stringValue: vpc.vpcId,
      description: 'VPC ID for integration testing',
    });

    new ssm.StringParameter(this, 'AsgNameParam', {
      parameterName: `/tap/${props.environmentSuffix}/asg-name`,
      stringValue: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group name for integration testing',
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `tap-vpc-id-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ElastiCacheEndpoint', {
      value: elastiCacheServerless.attrEndpointAddress,
      description: 'ElastiCache Serverless Endpoint',
      exportName: `tap-cache-endpoint-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group Name',
      exportName: `tap-asg-name-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: `tap-public-subnets-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: `tap-private-subnets-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'WebSecurityGroupId', {
      value: webSecurityGroup.securityGroupId,
      description: 'Web Security Group ID',
      exportName: `tap-web-sg-id-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CacheSecurityGroupId', {
      value: cacheSecurityGroup.securityGroupId,
      description: 'Cache Security Group ID',
      exportName: `tap-cache-sg-id-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LaunchTemplateId', {
      value: launchTemplate.launchTemplateId!,
      description: 'Launch Template ID',
      exportName: `tap-lt-id-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EC2RoleArn', {
      value: ec2Role.roleArn,
      description: 'EC2 Instance Role ARN',
      exportName: `tap-ec2-role-arn-${props.environmentSuffix}`,
    });
  }
}
```

This infrastructure includes:

1. **VPC with Network Segmentation**: Creates a VPC with public and private subnets across 3 availability zones for high availability
2. **Auto Scaling Group**: Manages EC2 instances dynamically with a minimum of 2 instances for redundancy  
3. **Internet Gateway & Route Tables**: Automatically configured by CDK for public subnets to reach the internet while private subnets remain isolated
4. **IAM Roles**: EC2 instances have proper permissions to interact with AWS services securely
5. **ElastiCache Serverless**: Latest Redis caching service that scales automatically for improved performance
6. **Security Groups**: Properly configured for web traffic and Redis access
7. **SSM Parameters**: Stores infrastructure IDs for easy reference and integration testing

The deployment is optimized for speed with efficient resource configuration. All resources include proper naming with environment suffixes to support multiple deployments.