### Reasoning Trace
---

This is a comprehensive AWS CDK infrastructure request for a multi-environment payment processing system. Let me break down the requirements:

1. **Single parameterized stack** that can deploy to dev/staging/prod
2. **Environment-specific configurations**:
   - EC2 instance types: t3.micro (dev), t3.medium (staging), t3.large (prod)
   - RDS backup retention: 1 day (dev), 7 days (staging), 30 days (prod)
   - S3 lifecycle: 30 days (dev), 90 days (staging), no expiration (prod)
   - CloudWatch CPU thresholds: 80% (dev), 70% (staging), 60% (prod)
   - Log retention: 7 days (dev), 30 days (staging), 365 days (prod)

3. **Networking**:
   - VPC CIDR: 10.1.0.0/16 (dev), 10.2.0.0/16 (staging), 10.3.0.0/16 (prod)
   - VPC peering between environments for cross-env read replicas
   - Public subnets with NAT gateways
   - Private subnets for EC2
   - Isolated subnets for RDS

4. **Cross-environment RDS read replicas**:
   - Staging reads from prod
   - Dev reads from staging

5. **DNS**: Environment-specific subdomains via Route53

6. **Security & Compliance**:
   - IAM with permissions boundaries
   - SSM Parameter Store for configs
   - Secrets Manager for DB credentials
   - SSE-S3 encryption

7. **Naming convention**: `{company}-{service}-{environment}-{resource-type}`

8. **Tagging**: Environment, Team, CostCenter

Let me create the two files:

**main.ts** - Entry point that reads environment from context


I'll implement a sophisticated cross-environment infrastructure strategy. The approach involves intricate VPC peering configurations to enable seamless database replication across different regions. Each environment (dev, staging, prod) will have unique network topologies and security configurations, ensuring isolated yet interconnected infrastructure.

The key challenge lies in establishing secure, performant cross-VPC database replication while maintaining strict network segmentation. I'll leverage AWS networking features to create a robust, scalable architecture that supports read replicas across different regions and environments.
### Answer 
---

```typescript
// main.ts
import * as cdk from 'aws-cdk-lib';
import { PaymentProcessingStack } from './tapstack';

const app = new cdk.App();

// Read environment from context (-c env=dev|staging|prod)
const environment = app.node.tryGetContext('env') || 'dev';

// Environment configuration mapping
const envConfig = {
  dev: {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-2' },
    vpcCidr: '10.1.0.0/16',
    instanceType: 't3.micro',
    dbBackupDays: 1,
    s3ExpirationDays: 30,
    cpuThreshold: 80,
    logRetentionDays: 7,
    dbInstanceClass: 'db.t3.micro',
    readReplicaSourceEnv: 'staging',
    readReplicaSourceRegion: 'us-west-2',
    hostedZoneName: 'dev.payment.company.com',
    environmentCode: 1,
  },
  staging: {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-west-2' },
    vpcCidr: '10.2.0.0/16',
    instanceType: 't3.medium',
    dbBackupDays: 7,
    s3ExpirationDays: 90,
    cpuThreshold: 70,
    logRetentionDays: 30,
    dbInstanceClass: 'db.t3.small',
    readReplicaSourceEnv: 'prod',
    readReplicaSourceRegion: 'us-east-1',
    hostedZoneName: 'staging.payment.company.com',
    environmentCode: 2,
  },
  prod: {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
    vpcCidr: '10.3.0.0/16',
    instanceType: 't3.large',
    dbBackupDays: 30,
    s3ExpirationDays: undefined, // No expiration for prod
    cpuThreshold: 60,
    logRetentionDays: 365,
    dbInstanceClass: 'db.t3.medium',
    readReplicaSourceEnv: undefined, // Prod is source, no replica
    readReplicaSourceRegion: undefined,
    hostedZoneName: 'payment.company.com',
    environmentCode: 3,
  },
};

const config = envConfig[environment as keyof typeof envConfig];

if (!config) {
  throw new Error(`Invalid environment: ${environment}. Use dev, staging, or prod`);
}

// Deploy the stack for the selected environment
new PaymentProcessingStack(app, `PaymentProcessing-${environment}`, {
  env: config.env,
  environment,
  company: 'fintech',
  service: 'payment',
  vpcCidr: config.vpcCidr,
  instanceType: config.instanceType,
  dbBackupRetentionDays: config.dbBackupDays,
  s3ExpirationDays: config.s3ExpirationDays,
  cpuAlarmThreshold: config.cpuThreshold,
  logRetentionDays: config.logRetentionDays,
  dbInstanceClass: config.dbInstanceClass,
  readReplicaSourceEnv: config.readReplicaSourceEnv,
  readReplicaSourceRegion: config.readReplicaSourceRegion,
  hostedZoneName: config.hostedZoneName,
  environmentCode: config.environmentCode,
  tags: {
    Environment: environment,
    Team: 'PaymentProcessing',
    CostCenter: 'Engineering',
  },
});

app.synth();
```

```typescript
// tapstack.ts
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
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export interface PaymentProcessingStackProps extends cdk.StackProps {
  environment: string;
  company: string;
  service: string;
  vpcCidr: string;
  instanceType: string;
  dbBackupRetentionDays: number;
  s3ExpirationDays?: number;
  cpuAlarmThreshold: number;
  logRetentionDays: number;
  dbInstanceClass: string;
  readReplicaSourceEnv?: string;
  readReplicaSourceRegion?: string;
  hostedZoneName: string;
  environmentCode: number;
}

export class PaymentProcessingStack extends cdk.Stack {
  private readonly naming: (resourceType: string) => string;
  private readonly vpc: ec2.Vpc;
  private readonly dbSecret: secretsmanager.Secret;
  private readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: PaymentProcessingStackProps) {
    super(scope, id, props);

    // Helper for consistent naming
    this.naming = (resourceType: string) => 
      `${props.company}-${props.service}-${props.environment}-${resourceType}`;

    // 🔹 VPC & Networking
    this.vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: this.naming('vpc'),
      ipAddresses: ec2.IpAddresses.cidr(props.vpcCidr),
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
    new ec2.FlowLog(this, 'VPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        new logs.LogGroup(this, 'VPCFlowLogGroup', {
          logGroupName: `/aws/vpc/${this.naming('flowlogs')}`,
          retention: logs.RetentionDays[`DAYS_${props.logRetentionDays}` as keyof typeof logs.RetentionDays],
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        })
      ),
    });

    // 🔹 Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: this.naming('alb-sg'),
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS from Internet');
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP from Internet');

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc: this.vpc,
      securityGroupName: this.naming('ec2-sg'),
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });
    ec2SecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.tcp(8080), 'HTTP from ALB');

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: this.naming('rds-sg'),
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });
    dbSecurityGroup.addIngressRule(ec2SecurityGroup, ec2.Port.tcp(5432), 'PostgreSQL from EC2');

    // 🔹 IAM Roles and Permissions Boundaries
    const permissionsBoundary = new iam.ManagedPolicy(this, 'PermissionsBoundary', {
      managedPolicyName: this.naming('permissions-boundary'),
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
            resources: [`arn:aws:s3:::${props.company}-${props.service}-${props.environment}-*`],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'ssm:GetParameter',
              'ssm:GetParameters',
              'ssm:GetParameterHistory',
              'ssm:GetParametersByPath',
            ],
            resources: [`arn:aws:ssm:*:*:parameter/${props.environment}/${props.service}/*`],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            resources: [`arn:aws:secretsmanager:*:*:secret:${this.naming('*')}`],
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
    });

    const ec2Role = new iam.Role(this, 'EC2Role', {
      roleName: this.naming('ec2-role'),
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      permissionsBoundary,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // 🔹 S3 Storage
    const s3Bucket = new s3.Bucket(this, 'PaymentBucket', {
      bucketName: this.naming('storage'),
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: props.s3ExpirationDays
        ? [{
            id: 'ExpireObjects',
            enabled: true,
            expiration: cdk.Duration.days(props.s3ExpirationDays),
          }]
        : [],
    });

    s3Bucket.grantReadWrite(ec2Role);

    // 🔹 RDS Database
    this.dbSecret = new secretsmanager.Secret(this, 'DBSecret', {
      secretName: this.naming('db-secret'),
      description: 'RDS PostgreSQL master credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'paymentadmin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
      },
    });

    const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      subnetGroupName: this.naming('db-subnet-group'),
      description: 'Subnet group for RDS database',
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    this.database = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: this.naming('rds'),
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14_7,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize[props.dbInstanceClass.split('.')[2].toUpperCase() as keyof typeof ec2.InstanceSize]
      ),
      vpc: this.vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(this.dbSecret),
      allocatedStorage: props.environment === 'prod' ? 100 : 20,
      maxAllocatedStorage: props.environment === 'prod' ? 1000 : 100,
      backupRetention: cdk.Duration.days(props.dbBackupRetentionDays),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: props.environment === 'prod',
      removalPolicy: props.environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      monitoringInterval: cdk.Duration.seconds(60),
      monitoringRole: new iam.Role(this, 'DBMonitoringRole', {
        roleName: this.naming('rds-monitoring-role'),
        assumedBy: new iam.ServicePrincipal('monitoring.rds.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonRDSEnhancedMonitoringRole'),
        ],
      }),
    });

    // 🔹 Cross-Environment Read Replicas (if applicable)
    if (props.readReplicaSourceEnv && props.readReplicaSourceRegion) {
      // Allow cross-VPC database traffic for read replicas
      const crossEnvCidr = props.readReplicaSourceEnv === 'prod' ? '10.3.0.0/16' : 
                           props.readReplicaSourceEnv === 'staging' ? '10.2.0.0/16' : '10.1.0.0/16';
      dbSecurityGroup.addIngressRule(ec2.Peer.ipv4(crossEnvCidr), ec2.Port.tcp(5432), 
        `PostgreSQL from ${props.readReplicaSourceEnv} VPC for read replica`);

      // Store read replica source ARN in SSM for cross-stack reference
      new ssm.StringParameter(this, 'ReadReplicaSourceArn', {
        parameterName: `/${props.environment}/${props.service}/read-replica-source-arn`,
        stringValue: `arn:aws:rds:${props.readReplicaSourceRegion}:${this.account}:db:${props.company}-${props.service}-${props.readReplicaSourceEnv}-rds`,
        description: 'Source database ARN for read replica',
      });
    }

    // 🔹 EC2 Compute with Auto Scaling
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent postgresql14',
      'yum install -y aws-cli',
      // Install payment processing application
      'mkdir -p /opt/payment-app',
      'cd /opt/payment-app',
      `aws s3 cp s3://${s3Bucket.bucketName}/app/latest.jar ./app.jar || echo "App not yet uploaded"`,
      // Configure CloudWatch agent
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<EOF',
      JSON.stringify({
        metrics: {
          namespace: `${props.company}/${props.service}/${props.environment}`,
          metrics_collected: {
            cpu: { measurement: [{ name: 'cpu_usage_idle', rename: 'CPU_IDLE', unit: 'Percent' }] },
            disk: { measurement: [{ name: 'used_percent', rename: 'DISK_USED', unit: 'Percent' }] },
            mem: { measurement: [{ name: 'mem_used_percent', rename: 'MEM_USED', unit: 'Percent' }] },
          },
        },
      }),
      'EOF',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json',
    );

    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      launchTemplateName: this.naming('launch-template'),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      instanceType: new ec2.InstanceType(props.instanceType),
      role: ec2Role,
      securityGroup: ec2SecurityGroup,
      userData,
      blockDevices: [{
        deviceName: '/dev/xvda',
        volume: ec2.BlockDeviceVolume.ebs(30, {
          volumeType: ec2.EbsDeviceVolumeType.GP3,
          encrypted: true,
        }),
      }],
    });

    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'ASG', {
      autoScalingGroupName: this.naming('asg'),
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      launchTemplate,
      minCapacity: props.environment === 'prod' ? 2 : 1,
      maxCapacity: props.environment === 'prod' ? 10 : 3,
      desiredCapacity: props.environment === 'prod' ? 3 : 1,
      healthCheck: autoscaling.HealthCheck.elb({ grace: cdk.Duration.minutes(5) }),
    });

    // 🔹 Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      loadBalancerName: this.naming('alb'),
      vpc: this.vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      targetGroupName: this.naming('tg'),
      vpc: this.vpc,
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
      zoneName: props.hostedZoneName,
    });

    new route53.ARecord(this, 'ALBRecord', {
      recordName: 'api',
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new route53Targets.LoadBalancerTarget(alb)),
      ttl: cdk.Duration.minutes(5),
    });

    // 🔹 CloudWatch Monitoring & Alarms
    const snsTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: this.naming('alarms'),
      displayName: `Payment Processing Alarms - ${props.environment}`,
    });

    snsTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(`alerts-${props.environment}@company.com`)
    );

    const cpuAlarm = new cloudwatch.Alarm(this, 'CPUAlarm', {
      alarmName: this.naming('cpu-alarm'),
      alarmDescription: `CPU utilization exceeds ${props.cpuAlarmThreshold}%`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
        },
      }),
      threshold: props.cpuAlarmThreshold,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    });

    cpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(snsTopic));

    // Database CPU alarm
    const dbCpuAlarm = new cloudwatch.Alarm(this, 'DBCPUAlarm', {
      alarmName: this.naming('db-cpu-alarm'),
      alarmDescription: 'RDS CPU utilization high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          DBInstanceIdentifier: this.database.instanceIdentifier,
        },
      }),
      threshold: props.environment === 'prod' ? 75 : 85,
      evaluationPeriods: 2,
    });

    dbCpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(snsTopic));

    // 🔹 SSM Parameter Store Configuration
    const ssmParameters = {
      dbEndpoint: new ssm.StringParameter(this, 'DBEndpoint', {
        parameterName: `/${props.environment}/${props.service}/db-endpoint`,
        stringValue: this.database.dbInstanceEndpointAddress,
        description: 'RDS database endpoint',
      }),
      dbPort: new ssm.StringParameter(this, 'DBPort', {
        parameterName: `/${props.environment}/${props.service}/db-port`,
        stringValue: this.database.dbInstanceEndpointPort,
        description: 'RDS database port',
      }),
      dbSecretArn: new ssm.StringParameter(this, 'DBSecretArn', {
        parameterName: `/${props.environment}/${props.service}/db-secret-arn`,
        stringValue: this.dbSecret.secretArn,
        description: 'Secret Manager ARN for DB credentials',
      }),
      s3Bucket: new ssm.StringParameter(this, 'S3Bucket', {
        parameterName: `/${props.environment}/${props.service}/s3-bucket`,
        stringValue: s3Bucket.bucketName,
        description: 'S3 bucket for payment data',
      }),
      albDns: new ssm.StringParameter(this, 'ALBDns', {
        parameterName: `/${props.environment}/${props.service}/alb-dns`,
        stringValue: alb.loadBalancerDnsName,
        description: 'Application Load Balancer DNS',
      }),
      environment: new ssm.StringParameter(this, 'Environment', {
        parameterName: `/${props.environment}/${props.service}/environment`,
        stringValue: props.environment,
        description: 'Current environment',
      }),
    };

    // Grant EC2 instances access to SSM parameters
    Object.values(ssmParameters).forEach(param => {
      param.grantRead(ec2Role);
    });

    // Grant EC2 access to database secret
    this.dbSecret.grantRead(ec2Role);

    // 🔹 CloudWatch Log Groups
    const appLogGroup = new logs.LogGroup(this, 'AppLogGroup', {
      logGroupName: `/aws/payment/${props.environment}/application`,
      retention: logs.RetentionDays[`DAYS_${props.logRetentionDays}` as keyof typeof logs.RetentionDays],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    appLogGroup.grantWrite(ec2Role);

    // 🔹 VPC Peering for Cross-Environment Connectivity
    if (props.environment !== 'prod' && props.readReplicaSourceEnv) {
      // Create VPC peering connection (requester side)
      const peeringConnection = new ec2.CfnVPCPeeringConnection(this, 'VPCPeering', {
        vpcId: this.vpc.vpcId,
        peerVpcId: cdk.Fn.importValue(`${props.readReplicaSourceEnv}-vpc-id`),
        peerRegion: props.readReplicaSourceRegion,
      });

      // Add routes to peered VPC
      this.vpc.privateSubnets.forEach((subnet, index) => {
        new ec2.CfnRoute(this, `PeerRoute${index}`, {
          routeTableId: subnet.routeTable.routeTableId,
          destinationCidrBlock: props.readReplicaSourceEnv === 'prod' ? '10.3.0.0/16' : '10.2.0.0/16',
          vpcPeeringConnectionId: peeringConnection.ref,
        });
      });
    }

    // 🔹 Stack Outputs for Cross-Stack References
    new cdk.CfnOutput(this, 'VPCId', {
      value: this.vpc.vpcId,
      exportName: `${props.environment}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'DatabaseArn', {
      value: this.database.instanceArn,
      exportName: `${props.environment}-db-arn`,
    });

    new cdk.CfnOutput(this, 'ALBDnsName', {
      value: alb.loadBalancerDnsName,
      exportName: `${props.environment}-alb-dns`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      exportName: `${props.environment}-s3-bucket`,
    });
  }
}
```