import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const commonTags = {
      project: 'cloudformation-setup',
      owner: 'current_user',
    };

    const vpc = new ec2.Vpc(this, 'TapVpc', {
      maxAzs: 2,
      cidr: '10.0.0.0/16',
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
      ],
    });
    cdk.Tags.of(vpc).add('project', commonTags.project);
    cdk.Tags.of(vpc).add('owner', commonTags.owner);

    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security group for ALB',
      allowAllOutbound: false,
    });
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443));
    cdk.Tags.of(albSecurityGroup).add('project', commonTags.project);
    cdk.Tags.of(albSecurityGroup).add('owner', commonTags.owner);

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });
    ec2SecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22));
    ec2SecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.tcp(80));
    ec2SecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.tcp(443));
    cdk.Tags.of(ec2SecurityGroup).add('project', commonTags.project);
    cdk.Tags.of(ec2SecurityGroup).add('owner', commonTags.owner);

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      description: 'Security group for RDS',
      allowAllOutbound: true,
    });
    cdk.Tags.of(rdsSecurityGroup).add('project', commonTags.project);
    cdk.Tags.of(rdsSecurityGroup).add('owner', commonTags.owner);

    // Add ingress rule after both security groups are created
    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'MySQL access from EC2 instances'
    );

    const ec2Role = new iam.Role(this, 'Ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });
    cdk.Tags.of(ec2Role).add('project', commonTags.project);
    cdk.Tags.of(ec2Role).add('owner', commonTags.owner);

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });
    cdk.Tags.of(lambdaRole).add('project', commonTags.project);
    cdk.Tags.of(lambdaRole).add('owner', commonTags.owner);

    const kmsKey = new kms.Key(this, 'TapKmsKey', {
      description: 'KMS key for encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    cdk.Tags.of(kmsKey).add('project', commonTags.project);
    cdk.Tags.of(kmsKey).add('owner', commonTags.owner);

    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
    });
    cdk.Tags.of(launchTemplate).add('project', commonTags.project);
    cdk.Tags.of(launchTemplate).add('owner', commonTags.owner);

    const asg = new autoscaling.AutoScalingGroup(this, 'AutoScalingGroup', {
      vpc,
      launchTemplate,
      minCapacity: 2,
      maxCapacity: 6,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });
    cdk.Tags.of(asg).add('project', commonTags.project);
    cdk.Tags.of(asg).add('owner', commonTags.owner);

    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      'ApplicationLoadBalancer',
      {
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );
    cdk.Tags.of(alb).add('project', commonTags.project);
    cdk.Tags.of(alb).add('owner', commonTags.owner);

    const listener = alb.addListener('Listener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'OK',
      }),
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [asg],
      healthCheck: {
        path: '/',
        protocol: elbv2.Protocol.HTTP,
      },
    });
    cdk.Tags.of(targetGroup).add('project', commonTags.project);
    cdk.Tags.of(targetGroup).add('owner', commonTags.owner);

    listener.addTargetGroups('TargetGroups', {
      targetGroups: [targetGroup],
    });

    const dbSubnetGroup = new rds.SubnetGroup(this, 'DbSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });
    cdk.Tags.of(dbSubnetGroup).add('project', commonTags.project);
    cdk.Tags.of(dbSubnetGroup).add('owner', commonTags.owner);

    const rdsInstance = new rds.DatabaseInstance(this, 'RdsInstance', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_39,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    cdk.Tags.of(rdsInstance).add('project', commonTags.project);
    cdk.Tags.of(rdsInstance).add('owner', commonTags.owner);

    const s3Bucket = new s3.Bucket(this, 'S3Bucket', {
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    cdk.Tags.of(s3Bucket).add('project', commonTags.project);
    cdk.Tags.of(s3Bucket).add('owner', commonTags.owner);

    const logGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: '/aws/lambda/tap-function',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    cdk.Tags.of(logGroup).add('project', commonTags.project);
    cdk.Tags.of(logGroup).add('owner', commonTags.owner);

    const lambdaFunction = new lambda.Function(this, 'LambdaFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(
        'exports.handler = async () => ({ statusCode: 200, body: "Hello" });'
      ),
      role: lambdaRole,
      logGroup: logGroup,
    });
    cdk.Tags.of(lambdaFunction).add('project', commonTags.project);
    cdk.Tags.of(lambdaFunction).add('owner', commonTags.owner);

    const cpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: asg.autoScalingGroupName,
      },
      statistic: 'Average',
    });

    const cpuAlarm = new cloudwatch.Alarm(this, 'CpuAlarm', {
      metric: cpuMetric,
      threshold: 70,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    cdk.Tags.of(cpuAlarm).add('project', commonTags.project);
    cdk.Tags.of(cpuAlarm).add('owner', commonTags.owner);

    new autoscaling.StepScalingPolicy(this, 'ScaleUpPolicy', {
      autoScalingGroup: asg,
      metric: cpuMetric,
      scalingSteps: [
        { upper: 70, change: +1 },
        { lower: 85, change: +2 },
      ],
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
    });

    new autoscaling.StepScalingPolicy(this, 'ScaleDownPolicy', {
      autoScalingGroup: asg,
      metric: cpuMetric,
      scalingSteps: [
        { upper: 30, change: -1 },
        { upper: 10, change: -2 },
      ],
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
    });

    // Create additional scaling policies for high and low CPU alarms
    new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      metric: cpuMetric,
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    new cloudwatch.Alarm(this, 'LowCpuAlarm', {
      metric: cpuMetric,
      threshold: 20,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    });

    new autoscaling.StepScalingPolicy(this, 'HighCpuScaleUpPolicy', {
      autoScalingGroup: asg,
      metric: cpuMetric,
      scalingSteps: [
        { upper: 80, change: +2 },
        { lower: 90, change: +3 },
      ],
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
    });

    new autoscaling.StepScalingPolicy(this, 'LowCpuScaleDownPolicy', {
      autoScalingGroup: asg,
      metric: cpuMetric,
      scalingSteps: [
        { upper: 20, change: -1 },
        { upper: 10, change: -2 },
      ],
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'ALB DNS Name',
    });
  }
}
