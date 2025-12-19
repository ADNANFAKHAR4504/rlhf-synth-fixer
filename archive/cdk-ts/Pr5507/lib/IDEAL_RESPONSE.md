# Ideal Response

This document contains the complete, production-ready infrastructure code for the multi-environment payment processing system.

## bin/tap.ts

```ts
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

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

## lib/tap-stack.ts

```ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
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

    // Helper for consistent naming: {company}-{service}-{environmentSuffix}-{resource-type}
    const company = 'fintech';
    const service = 'payment';
    const naming = (resourceType: string) =>
      `${company}-${service}-${environmentSuffix}-${resourceType}`;

    // 🔹 VPC & Networking
    const vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: naming('vpc'),
      ipAddresses: ec2.IpAddresses.cidr('10.1.0.0/16'),
      maxAzs: 3,
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
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // VPC Flow Logs
    const flowLogGroup = new logs.LogGroup(this, 'VPCFlowLogGroup', {
      logGroupName: `/aws/vpc/${naming('flowlogs')}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new ec2.FlowLog(this, 'VPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup),
    });

    // 🔹 Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      securityGroupName: naming('alb-sg'),
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS from Internet'
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP from Internet'
    );

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      securityGroupName: naming('ec2-sg'),
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(8080),
      'HTTP from ALB'
    );

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
      vpc,
      securityGroupName: naming('rds-sg'),
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });
    dbSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'PostgreSQL from EC2'
    );

    // 🔹 IAM Roles and Permissions Boundaries
    const permissionsBoundary = new iam.ManagedPolicy(
      this,
      'PermissionsBoundary',
      {
        managedPolicyName: naming('permissions-boundary'),
        document: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              resources: [
                `arn:aws:s3:::${company}-${service}-${environmentSuffix}-*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:GetParameterHistory',
                'ssm:GetParametersByPath',
              ],
              resources: [
                `arn:aws:ssm:*:*:parameter/${environmentSuffix}/${service}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ],
              resources: [`arn:aws:secretsmanager:*:*:secret:${naming('*')}`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: ['arn:aws:logs:*:*:*'],
            }),
          ],
        }),
      }
    );

    const ec2Role = new iam.Role(this, 'EC2Role', {
      roleName: naming('ec2-role'),
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      permissionsBoundary,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // 🔹 S3 Storage
    const s3Bucket = new s3.Bucket(this, 'PaymentBucket', {
      bucketName: naming('storage'),
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          id: 'ExpireObjects',
          enabled: true,
          expiration: cdk.Duration.days(30),
        },
      ],
    });

    s3Bucket.grantReadWrite(ec2Role);

    // 🔹 RDS Database
    const dbSecret = new secretsmanager.Secret(this, 'DBSecret', {
      secretName: naming('db-secret'),
      description: 'RDS PostgreSQL master credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'paymentadmin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      subnetGroupName: naming('db-subnet-group'),
      description: 'Subnet group for RDS database',
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    const database = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: naming('rds'),
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_12,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(dbSecret),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      backupRetention: cdk.Duration.days(1),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      monitoringInterval: cdk.Duration.seconds(60),
      monitoringRole: new iam.Role(this, 'DBMonitoringRole', {
        roleName: naming('rds-monitoring-role'),
        assumedBy: new iam.ServicePrincipal('monitoring.rds.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonRDSEnhancedMonitoringRole'
          ),
        ],
      }),
    });

    // 🔹 EC2 Compute with Auto Scaling
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent postgresql15',
      'yum install -y aws-cli',
      'mkdir -p /opt/payment-app',
      'cd /opt/payment-app',
      `aws s3 cp s3://${s3Bucket.bucketName}/app/latest.jar ./app.jar || echo "App not yet uploaded"`,
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<EOF',
      JSON.stringify({
        metrics: {
          namespace: `${company}/${service}/${environmentSuffix}`,
          metrics_collected: {
            cpu: {
              measurement: [
                { name: 'cpu_usage_idle', rename: 'CPU_IDLE', unit: 'Percent' },
              ],
            },
            disk: {
              measurement: [
                { name: 'used_percent', rename: 'DISK_USED', unit: 'Percent' },
              ],
            },
            mem: {
              measurement: [
                {
                  name: 'mem_used_percent',
                  rename: 'MEM_USED',
                  unit: 'Percent',
                },
              ],
            },
          },
        },
      }),
      'EOF',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json'
    );

    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      launchTemplateName: naming('launch-template'),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      instanceType: new ec2.InstanceType('t3.micro'),
      role: ec2Role,
      securityGroup: ec2SecurityGroup,
      userData,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(30, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            // Encryption uses account default EBS encryption setting
            // Explicit encryption flag removed to avoid KMS key state issues
          }),
        },
      ],
    });

    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'ASG', {
      autoScalingGroupName: naming('asg'),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      launchTemplate,
      minCapacity: 1,
      maxCapacity: 3,
      desiredCapacity: 1,
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5),
      }),
    });

    // 🔹 Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      loadBalancerName: naming('alb'),
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      targetGroupName: naming('tg'),
      vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [autoScalingGroup],
      healthCheck: {
        path: '/health',
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        interval: cdk.Duration.seconds(30),
      },
    });

    const httpListener = alb.addListener('HttpListener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'Payment Processing Service',
      }),
    });

    httpListener.addTargetGroups('DefaultTargetGroup', {
      targetGroups: [targetGroup],
    });

    // 🔹 Route53 DNS
    const hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
      zoneName: `payment-${environmentSuffix}.company.com`,
    });

    new route53.ARecord(this, 'ALBRecord', {
      recordName: 'api',
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.LoadBalancerTarget(alb)
      ),
      ttl: cdk.Duration.minutes(5),
    });

    // 🔹 CloudWatch Monitoring & Alarms
    const snsTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: naming('alarms'),
      displayName: `Payment Processing Alarms - ${environmentSuffix}`,
    });

    const cpuAlarm = new cloudwatch.Alarm(this, 'CPUAlarm', {
      alarmName: naming('cpu-alarm'),
      alarmDescription: 'CPU utilization exceeds 80%',
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
    });

    cpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(snsTopic));

    const dbCpuAlarm = new cloudwatch.Alarm(this, 'DBCPUAlarm', {
      alarmName: naming('db-cpu-alarm'),
      alarmDescription: 'RDS CPU utilization high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          DBInstanceIdentifier: database.instanceIdentifier,
        },
      }),
      threshold: 85,
      evaluationPeriods: 2,
    });

    dbCpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(snsTopic));

    // 🔹 SSM Parameter Store Configuration
    const dbEndpointParam = new ssm.StringParameter(this, 'DBEndpoint', {
      parameterName: `/${environmentSuffix}/${service}/db-endpoint`,
      stringValue: database.dbInstanceEndpointAddress,
      description: 'RDS database endpoint',
    });

    const dbPortParam = new ssm.StringParameter(this, 'DBPort', {
      parameterName: `/${environmentSuffix}/${service}/db-port`,
      stringValue: database.dbInstanceEndpointPort,
      description: 'RDS database port',
    });

    const dbSecretArnParam = new ssm.StringParameter(this, 'DBSecretArn', {
      parameterName: `/${environmentSuffix}/${service}/db-secret-arn`,
      stringValue: dbSecret.secretArn,
      description: 'Secret Manager ARN for DB credentials',
    });

    const s3BucketParam = new ssm.StringParameter(this, 'S3Bucket', {
      parameterName: `/${environmentSuffix}/${service}/s3-bucket`,
      stringValue: s3Bucket.bucketName,
      description: 'S3 bucket for payment data',
    });

    const albDnsParam = new ssm.StringParameter(this, 'ALBDns', {
      parameterName: `/${environmentSuffix}/${service}/alb-dns`,
      stringValue: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS',
    });

    const environmentParam = new ssm.StringParameter(this, 'Environment', {
      parameterName: `/${environmentSuffix}/${service}/environment`,
      stringValue: environmentSuffix,
      description: 'Current environment',
    });

    // Grant EC2 instances access to SSM parameters
    [
      dbEndpointParam,
      dbPortParam,
      dbSecretArnParam,
      s3BucketParam,
      albDnsParam,
      environmentParam,
    ].forEach(param => {
      param.grantRead(ec2Role);
    });

    // Grant EC2 access to database secret
    dbSecret.grantRead(ec2Role);

    // 🔹 CloudWatch Log Groups
    const appLogGroup = new logs.LogGroup(this, 'AppLogGroup', {
      logGroupName: `/aws/payment/${environmentSuffix}/application`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    appLogGroup.grantWrite(ec2Role);

    // 🔹 Stack Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      exportName: `${environmentSuffix}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'DatabaseArn', {
      value: database.instanceArn,
      exportName: `${environmentSuffix}-db-arn`,
    });

    new cdk.CfnOutput(this, 'ALBDnsName', {
      value: alb.loadBalancerDnsName,
      exportName: `${environmentSuffix}-alb-dns`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      exportName: `${environmentSuffix}-s3-bucket`,
    });

    // Apply tags to all resources
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Team', 'PaymentProcessing');
    cdk.Tags.of(this).add('CostCenter', 'Engineering');
  }
}
```