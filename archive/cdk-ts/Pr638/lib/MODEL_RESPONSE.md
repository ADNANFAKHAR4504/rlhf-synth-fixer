# AWS CDK Infrastructure Implementation

I'll help you create a robust cloud environment in AWS using CDK v2 with TypeScript. Here's the complete implementation that meets all your requirements:

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
    region: 'us-west-1', // Specified region requirement
  },
});
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const project = 'tap';

    // Create VPC with public and private subnets across multiple AZs
    const vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `${project}-${environmentSuffix}-vpc`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `${project}-${environmentSuffix}-public-subnet`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `${project}-${environmentSuffix}-private-subnet`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Create S3 bucket for application logs with versioning
    const logsBucket = new s3.Bucket(this, 'LogsBucket', {
      bucketName: `${project}-${environmentSuffix}-logs-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create IAM role for EC2 instance
    const ec2Role = new iam.Role(this, 'EC2Role', {
      roleName: `${project}-${environmentSuffix}-ec2-role`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Create IAM role for logging service
    const loggingRole = new iam.Role(this, 'LoggingRole', {
      roleName: `${project}-${environmentSuffix}-logging-role`,
      assumedBy: new iam.ServicePrincipal('logs.amazonaws.com'),
    });

    // Custom IAM policy for S3 bucket access (restricted to specific roles)
    const s3AccessPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:ListBucket',
        's3:GetBucketVersioning',
        's3:GetObjectVersion',
      ],
      resources: [
        logsBucket.bucketArn,
        `${logsBucket.bucketArn}/*`,
      ],
      conditions: {
        StringEquals: {
          'aws:PrincipalArn': [
            ec2Role.roleArn,
            loggingRole.roleArn,
          ],
        },
      },
    });

    // Add the policy to the bucket
    logsBucket.addToResourcePolicy(s3AccessPolicy);

    // Add S3 access to EC2 role
    ec2Role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:ListBucket',
      ],
      resources: [
        logsBucket.bucketArn,
        `${logsBucket.bucketArn}/*`,
      ],
    }));

    // Security group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      securityGroupName: `${project}-${environmentSuffix}-ec2-sg`,
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Security group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      securityGroupName: `${project}-${environmentSuffix}-alb-sg`,
      vpc,
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

    // User data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html',
      'amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c default -s'
    );

    // Launch Template for EC2 instances
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      launchTemplateName: `${project}-${environmentSuffix}-lt`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023({
        cpuType: ec2.AmazonLinuxCpuType.X86_64,
      }),
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      userData: userData,
      requireImdsv2: true, // Enhanced security feature
    });

    // Create EC2 instances in different AZs
    const ec2Instance1 = new ec2.Instance(this, 'EC2Instance1', {
      instanceName: `${project}-${environmentSuffix}-instance-1`,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
        availabilityZones: [vpc.availabilityZones[0]],
      },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023({
        cpuType: ec2.AmazonLinuxCpuType.X86_64,
      }),
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      userData: userData,
      requireImdsv2: true,
    });

    const ec2Instance2 = new ec2.Instance(this, 'EC2Instance2', {
      instanceName: `${project}-${environmentSuffix}-instance-2`,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
        availabilityZones: [vpc.availabilityZones[1]],
      },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023({
        cpuType: ec2.AmazonLinuxCpuType.X86_64,
      }),
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      userData: userData,
      requireImdsv2: true,
    });

    // Create Elastic IP and associate with primary instance
    const elasticIp = new ec2.CfnEIP(this, 'ElasticIP', {
      domain: 'vpc',
      tags: [
        {
          key: 'Name',
          value: `${project}-${environmentSuffix}-eip`,
        },
      ],
    });

    new ec2.CfnEIPAssociation(this, 'EIPAssociation', {
      eip: elasticIp.ref,
      instanceId: ec2Instance1.instanceId,
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ApplicationLoadBalancer', {
      loadBalancerName: `${project}-${environmentSuffix}-alb`,
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      targetGroupName: `${project}-${environmentSuffix}-tg`,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      vpc,
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        path: '/',
        protocol: elbv2.Protocol.HTTP,
      },
      targets: [
        new targets.InstanceTarget(ec2Instance1, 80),
        new targets.InstanceTarget(ec2Instance2, 80),
      ],
    });

    // ALB Listener
    alb.addListener('Listener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // CDK Aspects for compliance validation
    cdk.Aspects.of(this).add(new SecurityComplianceAspect());

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${project}-${environmentSuffix}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: logsBucket.bucketName,
      description: 'S3 Bucket for Application Logs',
      exportName: `${project}-${environmentSuffix}-logs-bucket`,
    });

    new cdk.CfnOutput(this, 'ElasticIP', {
      value: elasticIp.ref,
      description: 'Elastic IP Address',
      exportName: `${project}-${environmentSuffix}-elastic-ip`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
      exportName: `${project}-${environmentSuffix}-alb-dns`,
    });
  }
}

// CDK Aspect for Security Compliance
class SecurityComplianceAspect implements cdk.IAspect {
  visit(node: cdk.IConstruct): void {
    // Ensure S3 buckets have encryption
    if (node instanceof s3.Bucket) {
      if (!node.encryptionKey && node.encryption === s3.BucketEncryption.UNENCRYPTED) {
        cdk.Annotations.of(node).addError('S3 bucket must be encrypted');
      }
    }

    // Ensure EC2 instances require IMDSv2
    if (node instanceof ec2.Instance || node instanceof ec2.LaunchTemplate) {
      const cfnNode = node.node.defaultChild as ec2.CfnInstance | ec2.CfnLaunchTemplate;
      if (cfnNode && cfnNode instanceof ec2.CfnInstance) {
        if (!cfnNode.metadataOptions || cfnNode.metadataOptions.httpTokens !== 'required') {
          cdk.Annotations.of(node).addError('EC2 instance must require IMDSv2');
        }
      }
    }
  }
}
```

This implementation provides:

1. **S3 Bucket**: Versioned bucket with SSE-S3 encryption and block public access enabled
2. **Custom IAM Policy**: Restricts S3 access to specified roles only
3. **Multi-AZ EC2 Deployment**: Two instances across different availability zones
4. **Elastic IP**: Associated with the primary EC2 instance  
5. **Application Load Balancer**: Distributes traffic across both instances
6. **Security Compliance**: CDK Aspects validate security policies
7. **Naming Convention**: Follows project-environment-resource format
8. **us-west-1 Region**: All resources deployed in specified region

The code leverages the latest AWS features including enhanced EC2 security with IMDSv2, S3 default encryption, and modern CDK v2 constructs.