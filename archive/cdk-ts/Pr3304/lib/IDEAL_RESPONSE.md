# CDK TypeScript Infrastructure for Job Board Web Application

Here's the complete, production-ready CDK TypeScript code for your job board web application infrastructure:

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { WebApplicationStack } from './web-application-stack';

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

    new WebApplicationStack(this, 'WebApplicationStack', {
      environmentSuffix: environmentSuffix,
    });
  }
}
```

## File: lib/web-application-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import { Construct } from 'constructs';

interface WebApplicationStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class WebApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WebApplicationStackProps) {
    super(scope, id, props);

    // Create VPC with specified CIDR
    const vpc = new ec2.Vpc(this, `JobBoardVpc${props.environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.20.0.0/16'),
      maxAzs: 2,
      natGateways: 1,
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
      ],
    });

    // Create EC2 Instance Connect Endpoint for secure SSH access
    new ec2.CfnInstanceConnectEndpoint(this, `InstanceConnectEndpoint${props.environmentSuffix}`, {
      subnetId: vpc.privateSubnets[0].subnetId,
      securityGroupIds: [],
    });

    // Create S3 bucket for static files
    const staticFilesBucket = new s3.Bucket(this, 'StaticFilesBucket', {
      bucketName: `job-board-static-files-${props.environmentSuffix}-${cdk.Stack.of(this).account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          maxAge: 3000,
        },
      ],
    });

    // Create bucket policy for web hosting
    staticFilesBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [`${staticFilesBucket.bucketArn}/*`],
        principals: [new iam.AnyPrincipal()],
      })
    );

    // Security Group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, `AlbSecurityGroup${props.environmentSuffix}`, {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    // Also allow HTTPS for future use
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );

    // Security Group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, `Ec2SecurityGroup${props.environmentSuffix}`, {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/16'),
      ec2.Port.tcp(22),
      'Allow SSH from internal network'
    );

    // IAM role for EC2 instances
    const ec2Role = new iam.Role(this, 'Ec2Role', {
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

    // Add S3 access to EC2 role
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
        resources: [
          staticFilesBucket.bucketArn,
          `${staticFilesBucket.bucketArn}/*`,
        ],
      })
    );

    // User data script for Apache installation
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Job Board Application - Instance $(hostname)</h1>" > /var/www/html/index.html',
      'echo "<p>Serving 3000+ daily users</p>" >> /var/www/html/index.html',
      'yum install -y amazon-cloudwatch-agent',
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      '{',
      '  "metrics": {',
      '    "namespace": "JobBoard/EC2",',
      '    "metrics_collected": {',
      '      "cpu": {',
      '        "measurement": [',
      '          {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},',
      '          {"name": "cpu_usage_iowait", "rename": "CPU_IOWAIT", "unit": "Percent"},',
      '          "cpu_time_system",',
      '          "cpu_time_user"',
      '        ],',
      '        "metrics_collection_interval": 60,',
      '        "totalcpu": false',
      '      },',
      '      "disk": {',
      '        "measurement": [',
      '          {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}',
      '        ],',
      '        "metrics_collection_interval": 60,',
      '        "resources": ["/"]',
      '      },',
      '      "mem": {',
      '        "measurement": [',
      '          {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}',
      '        ],',
      '        "metrics_collection_interval": 60',
      '      }',
      '    }',
      '  }',
      '}',
      'EOF',
      'systemctl restart amazon-cloudwatch-agent'
    );

    // Launch template for EC2 instances
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'WebServerLaunchTemplate',
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        userData: userData,
        role: ec2Role,
        securityGroup: ec2SecurityGroup,
      }
    );

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'WebServerAutoScalingGroup',
      {
        vpc,
        launchTemplate: launchTemplate,
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

    // Create Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, `JobBoardAlb${props.environmentSuffix}`, {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      loadBalancerName: `job-board-alb-${props.environmentSuffix}`,
    });

    // Create target group with Automatic Target Weights enabled
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'WebServerTargetGroup',
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [autoScalingGroup],
        healthCheck: {
          path: '/',
          healthyHttpCodes: '200',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
        targetGroupName: `job-board-tg-${props.environmentSuffix}`,
      }
    );

    // Add weighted random algorithm attribute for Automatic Target Weights
    const cfnTargetGroup = targetGroup.node
      .defaultChild as elbv2.CfnTargetGroup;
    cfnTargetGroup.targetGroupAttributes = [
      {
        key: 'load_balancing.algorithm.type',
        value: 'weighted_random',
      },
      {
        key: 'load_balancing.algorithm.anomaly_mitigation',
        value: 'on',
      },
    ];

    // Create HTTP listener for now (certificate would be required for HTTPS)
    // Note: In production, you would use HTTPS with a valid certificate from ACM
    alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Create SNS topic for alarms
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `job-board-alarms-${props.environmentSuffix}`,
    });

    // CloudWatch Alarms for EC2 health monitoring
    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
        },
      }),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Alarm when CPU exceeds 80%',
    });

    cpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    // Target health alarm
    const unhealthyTargetsAlarm = new cloudwatch.Alarm(
      this,
      'UnhealthyTargetsAlarm',
      {
        metric: targetGroup.metricUnhealthyHostCount(),
        threshold: 1,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
        alarmDescription: 'Alarm when unhealthy targets detected',
      }
    );

    unhealthyTargetsAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alarmTopic)
    );

    // Auto scaling based on CPU
    const cpuUtilizationTarget = new autoscaling.TargetTrackingScalingPolicy(
      this,
      'CpuScaling',
      {
        autoScalingGroup: autoScalingGroup,
        targetValue: 70,
        predefinedMetric:
          autoscaling.PredefinedMetric.ASG_AVERAGE_CPU_UTILIZATION,
        cooldown: cdk.Duration.minutes(5),
      }
    );

    // Auto scaling based on ALB request count per target
    const requestCountTargetTracking =
      new autoscaling.TargetTrackingScalingPolicy(
        this,
        'RequestCountScaling',
        {
          autoScalingGroup: autoScalingGroup,
          targetValue: 100,
          predefinedMetric:
            autoscaling.PredefinedMetric
              .ALB_REQUEST_COUNT_PER_TARGET,
          resourceLabel: `${alb.loadBalancerFullName}/${targetGroup.targetGroupFullName}`,
        }
      );

    // Output values
    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
    });

    new cdk.CfnOutput(this, 'StaticFilesBucketName', {
      value: staticFilesBucket.bucketName,
      description: 'Name of the S3 bucket for static files',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'ID of the VPC',
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'ARN of the SNS topic for alarms',
    });
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'job-board';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('Application', 'JobBoard');

new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-1',
  },
});
```

## Key Features Implemented:

### 1. **High Availability Architecture**
- VPC with CIDR 10.20.0.0/16 across 2 availability zones
- Public and private subnets for secure architecture
- NAT Gateway for outbound internet access from private subnets

### 2. **EC2 Auto Scaling**
- t3.micro instances with Apache web server
- Auto Scaling Group with 2-6 instances
- User data script for automatic Apache installation
- CloudWatch agent for detailed monitoring

### 3. **Application Load Balancer**
- Internet-facing ALB with HTTP listener
- Automatic Target Weights enabled with weighted_random algorithm
- Anomaly mitigation enabled for improved traffic distribution
- Health checks configured with appropriate thresholds

### 4. **Security Configuration**
- ALB security group allowing HTTP (80) and HTTPS (443) from anywhere
- EC2 security group allowing HTTP from ALB only
- SSH access restricted to internal network (10.0.0.0/16)
- EC2 Instance Connect Endpoint for secure SSH without public IPs

### 5. **S3 Storage**
- S3 bucket for static files with versioning enabled
- Server-side encryption (AES256)
- CORS configuration for web hosting
- Auto-delete objects on stack deletion

### 6. **Monitoring & Alerting**
- CloudWatch alarms for CPU utilization (>80%)
- Unhealthy target detection alarm
- SNS topic for alarm notifications
- CloudWatch agent collecting detailed metrics

### 7. **Auto Scaling Policies**
- CPU-based scaling (target: 70% utilization)
- Request count-based scaling (target: 100 requests/minute)
- Cooldown periods to prevent rapid scaling

### 8. **Production Best Practices**
- Environment suffix for multi-environment deployments
- Resource naming with environment suffix to avoid conflicts
- RemovalPolicy.DESTROY for clean stack deletion
- Tags for resource organization and cost tracking

## Deployment Instructions:

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Synthesize CloudFormation template:**
   ```bash
   export ENVIRONMENT_SUFFIX=prod
   npm run cdk:synth
   ```

3. **Deploy to AWS:**
   ```bash
   export AWS_REGION=us-west-1
   export ENVIRONMENT_SUFFIX=prod
   npm run cdk:deploy
   ```

4. **Access the application:**
   - The ALB DNS name will be output after deployment
   - Access via: `http://<alb-dns-name>`

## Notes:

- **HTTPS Configuration**: The current implementation uses HTTP for simplicity. In production, you should:
  1. Create or import an SSL certificate in AWS Certificate Manager
  2. Replace the HTTP listener with an HTTPS listener using the certificate
  3. Add HTTP to HTTPS redirect if needed

- **Scaling**: The infrastructure is designed to handle 3,000+ daily users with auto-scaling capabilities

- **Cost Optimization**: Uses t3.micro instances and minimal NAT Gateway configuration to reduce costs

This solution provides a complete, production-ready infrastructure that meets all requirements while following AWS best practices for security, scalability, and reliability.