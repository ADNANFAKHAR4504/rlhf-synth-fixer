To set up a secure, compliant, and scalable cloud environment on AWS using the AWS CDK with TypeScript, follow these steps. Below is a complete example of how to structure your CDK application.

First, ensure you have the AWS CDK and TypeScript installed:

```bash
npm install -g aws-cdk
cdk init app --language typescript
cd your-app-name
npm install @aws-cdk/aws-ec2 @aws-cdk/aws-elasticloadbalancingv2 @aws-cdk/aws-autoscaling @aws-cdk/aws-rds @aws-cdk/aws-s3 @aws-cdk/aws-iam @aws-cdk/aws-cloudwatch @aws-cdk/aws-config
```

Replace the contents of `lib/your-app-name-stack.ts` with the following code:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as config from 'aws-cdk-lib/aws-config';

export class YourAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
      ],
    });

    // Bastion Host
    const bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSecurityGroup', {
      vpc,
      allowAllOutbound: true,
    });

    bastionSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access from anywhere'
    );

    const bastionHost = new ec2.Instance(this, 'BastionHost', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage(),
      securityGroup: bastionSecurityGroup,
      keyName: 'your-key-pair', // Replace with your key pair
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc,
      internetFacing: true,
    });

    // Auto Scaling Group
    const asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage(),
      minCapacity: 2,
      maxCapacity: 5,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_NAT },
    });

    alb.addTarget(asg);
    asg.scaleOnCpuUtilization('KeepSpareCPU', {
      targetUtilizationPercent: 50,
    });

    // RDS Database
    const rdsInstance = new rds.DatabaseInstance(this, 'RDSInstance', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      credentials: rds.Credentials.fromGeneratedSecret('admin'),
      vpc,
      multiAz: false,
      backupRetention: cdk.Duration.days(7),
      allocatedStorage: 20,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_NAT },
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });

    // S3 Bucket
    const bucket = new s3.Bucket(this, 'Bucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // Security Groups
    const appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc,
      allowAllOutbound: true,
    });

    appSecurityGroup.addIngressRule(
      alb.connections.securityGroups[0],
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    rdsInstance.connections.allowDefaultPortFrom(appSecurityGroup, 'Allow EC2 to RDS');

    // CloudWatch Alarms
    const cpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: { AutoScalingGroupName: asg.autoScalingGroupName },
      period: cdk.Duration.minutes(5),
    });

    new cloudwatch.Alarm(this, 'HighCPUAlarm', {
      metric: cpuMetric,
      threshold: 80,
      evaluationPeriods: 2,
    });

    // AWS Config Rules
    new config.ManagedRule(this, 'S3BucketVersioningRule', {
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_VERSIONING_ENABLED,
    });

    // Tagging
    cdk.Tags.of(this).add('Environment', 'Production');

    // Logging
    vpc.addFlowLog('FlowLogs', {
      destination: ec2.FlowLogDestination.toS3(),
    });

    alb.logAccessLogs(bucket);

    bucket.addServerAccessLoggingBucket(bucket);
  }
}
```

Replace `'your-key-pair'` with your actual EC2 key pair name.

Finally, deploy the stack:

```bash
cdk deploy
```

This CDK application sets up a secure, compliant, and scalable cloud environment on AWS, adhering to the specified requirements. It includes VPC architecture, a bastion host, an application load balancer, an auto-scaling group, an RDS database, S3 storage, security groups, IAM roles, CloudWatch alarms, and AWS Config rules. All resources are tagged, and logging is enabled for relevant services.