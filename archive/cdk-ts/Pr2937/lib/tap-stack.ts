import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
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
      'devsecure';

    // Common tags for all resources
    const commonTags = {
      env: environmentSuffix,
      project: `${environmentSuffix}-infrastructure`,
      managedBy: 'cdk',
    };

    // ========================================
    // 1. NETWORKING INFRASTRUCTURE
    // ========================================

    // VPC with specified CIDR
    const vpc = new ec2.Vpc(this, `ProductionVPC-${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      restrictDefaultSecurityGroup: false,
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: `public-subnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: `private-subnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      natGateways: 1, // Cost-optimized: one NAT Gateway
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Apply tags to VPC
    cdk.Tags.of(vpc).add('Name', `${environmentSuffix}-vpc`);
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(vpc).add(key, value);
    });

    // VPC Flow Logs for monitoring
    const vpcFlowLogRole = new iam.Role(
      this,
      `VPCFlowLogRole-${environmentSuffix}`,
      {
        roleName: `VPCFlowLogRole-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
        inlinePolicies: {
          FlowLogsDeliveryRolePolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                  'logs:DescribeLogGroups',
                  'logs:DescribeLogStreams',
                ],
                resources: ['*'],
              }),
            ],
          }),
        },
      }
    );

    const vpcFlowLogGroup = new logs.LogGroup(
      this,
      `VPCFlowLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_MONTH,
      }
    );

    new ec2.FlowLog(this, `VPCFlowLog-${environmentSuffix}`, {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        vpcFlowLogGroup,
        vpcFlowLogRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // ========================================
    // 2. SECURITY GROUPS
    // ========================================

    // Security Group for EC2 instance
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `EC2SecurityGroup-${environmentSuffix}`,
      {
        securityGroupName: `EC2SecurityGroup-${environmentSuffix}`,
        vpc,
        description: `Security group for ${environmentSuffix} EC2 instance`,
        allowAllOutbound: true,
      }
    );

    // Restrict SSH access to specific IP range (replace with your IP range)
    const allowedSshCidr = '203.0.113.0/24'; // Replace with your actual IP range
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(allowedSshCidr),
      ec2.Port.tcp(22),
      'SSH access from allowed IP range'
    );

    // Allow HTTP/HTTPS for web traffic
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP access'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS access'
    );

    // Security Group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `RDSSecurityGroup-${environmentSuffix}`,
      {
        securityGroupName: `RDSSecurityGroup-${environmentSuffix}`,
        vpc,
        description: `Security group for ${environmentSuffix} RDS instance`,
        allowAllOutbound: false,
      }
    );

    // Allow PostgreSQL access only from EC2 security group
    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'PostgreSQL access from EC2'
    );

    // Apply tags to security groups
    cdk.Tags.of(ec2SecurityGroup).add('Name', `${environmentSuffix}-ec2-sg`);
    cdk.Tags.of(rdsSecurityGroup).add('Name', `${environmentSuffix}-rds-sg`);

    // ========================================
    // 3. IAM ROLES AND POLICIES
    // ========================================

    // IAM role for EC2 instance with minimal permissions
    const ec2Role = new iam.Role(this, `EC2Role-${environmentSuffix}`, {
      roleName: `EC2Role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: `IAM role for ${environmentSuffix} EC2 instance`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ), // For Systems Manager
      ],
    });

    // Custom policy for accessing secrets
    const secretsPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'secretsmanager:GetSecretValue',
        'secretsmanager:DescribeSecret',
      ],
      resources: [
        `arn:aws:secretsmanager:${this.region}:${this.account}:secret:rds-postgres-${environmentSuffix}-*`,
      ],
    });

    ec2Role.addToPolicy(secretsPolicy);

    // Instance profile for EC2
    new iam.InstanceProfile(this, `EC2InstanceProfile-${environmentSuffix}`, {
      instanceProfileName: `EC2InstanceProfile-${environmentSuffix}`,
      role: ec2Role,
    });

    // ========================================
    // 4. DATABASE CREDENTIALS AND SECRETS
    // ========================================

    // Generate secure credentials for RDS
    const databaseCredentials = new secretsmanager.Secret(
      this,
      `RDSCredentials-${environmentSuffix}`,
      {
        secretName: `rds-postgres-${environmentSuffix}`,
        description: `Credentials for ${environmentSuffix} PostgreSQL database`,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'postgres' }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\\'',
          includeSpace: false,
          passwordLength: 32,
        },
      }
    );

    cdk.Tags.of(databaseCredentials).add(
      'Name',
      `${environmentSuffix}-rds-credentials`
    );

    // ========================================
    // 5. RDS DATABASE
    // ========================================

    // Subnet group for RDS in private subnets
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `DatabaseSubnetGroup-${environmentSuffix}`,
      {
        subnetGroupName: `database-subnet-group-${environmentSuffix}`,
        vpc,
        description: `Subnet group for ${environmentSuffix} PostgreSQL database`,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      }
    );

    // Parameter group for PostgreSQL optimization
    const parameterGroup = new rds.ParameterGroup(
      this,
      `PostgreSQLParameterGroup-${environmentSuffix}`,
      {
        name: `postgresql-param-group-${environmentSuffix}`,
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15,
        }),
        description: `Parameter group for ${environmentSuffix} PostgreSQL`,
        parameters: {
          log_statement: 'all',
          log_min_duration_statement: '1000', // Log queries taking more than 1 second
          log_connections: '1',
          log_disconnections: '1',
          log_duration: '1',
        },
      }
    );

    // RDS instance with proper engine reference
    const database = new rds.DatabaseInstance(
      this,
      `PostgreSQLDatabase-${environmentSuffix}`,
      {
        instanceIdentifier: `postgresql-database-${environmentSuffix}`,
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.M5,
          ec2.InstanceSize.LARGE
        ),
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        subnetGroup: dbSubnetGroup,
        securityGroups: [rdsSecurityGroup],
        credentials: rds.Credentials.fromSecret(databaseCredentials),
        multiAz: true, // High availability
        storageEncrypted: true,
        monitoringInterval: cdk.Duration.seconds(60),
        enablePerformanceInsights: true,
        performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
        parameterGroup,
        backupRetention: cdk.Duration.days(7),
        deletionProtection: true,
        databaseName: `${environmentSuffix}db`,
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        allowMajorVersionUpgrade: false,
        autoMinorVersionUpgrade: true,
        cloudwatchLogsExports: ['postgresql'], // Enable CloudWatch logging
      }
    );

    // Apply tags to database
    cdk.Tags.of(database).add('Name', `${environmentSuffix}-postgresql`);

    // ========================================
    // 6. EC2 INSTANCE
    // ========================================

    // Latest Amazon Linux 2023 AMI
    const ami = ec2.MachineImage.latestAmazonLinux2023();

    // User data script for EC2 initialization
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent postgresql15',

      // Configure CloudWatch agent
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify(
        {
          agent: {
            metrics_collection_interval: 60,
            run_as_user: 'cwagent',
          },
          logs: {
            logs_collected: {
              files: {
                collect_list: [
                  {
                    file_path: '/var/log/messages',
                    log_group_name: `/aws/ec2/${environmentSuffix}/messages`,
                    log_stream_name: '{instance_id}',
                    timezone: 'UTC',
                  },
                  {
                    file_path: '/var/log/secure',
                    log_group_name: `/aws/ec2/${environmentSuffix}/secure`,
                    log_stream_name: '{instance_id}',
                    timezone: 'UTC',
                  },
                ],
              },
            },
          },
          metrics: {
            namespace: 'CWAgent',
            metrics_collected: {
              cpu: {
                measurement: [
                  'cpu_usage_idle',
                  'cpu_usage_iowait',
                  'cpu_usage_user',
                  'cpu_usage_system',
                ],
                metrics_collection_interval: 60,
              },
              disk: {
                measurement: ['used_percent'],
                metrics_collection_interval: 60,
                resources: ['*'],
              },
              mem: {
                measurement: ['mem_used_percent'],
                metrics_collection_interval: 60,
              },
            },
          },
        },
        null,
        2
      ),
      'EOF',

      // Start CloudWatch agent
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json',

      // Configure SSH key usage logging
      'echo "LogLevel INFO" >> /etc/ssh/sshd_config',
      'systemctl restart sshd'
    );

    // EC2 instance
    const ec2Instance = new ec2.Instance(
      this,
      `ProductionEC2-${environmentSuffix}`,
      {
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ami,
        securityGroup: ec2SecurityGroup,
        role: ec2Role,
        userData,
        detailedMonitoring: true, // Enable detailed monitoring
        userDataCausesReplacement: true,
      }
    );

    // Apply tags to EC2 instance
    cdk.Tags.of(ec2Instance).add('Name', `${environmentSuffix}-web-server`);

    // ========================================
    // 7. CLOUDWATCH MONITORING AND ALARMS
    // ========================================

    // Log groups for centralized logging
    new logs.LogGroup(this, `EC2LogGroupMessages-${environmentSuffix}`, {
      logGroupName: `/aws/ec2/${environmentSuffix}/messages`,
      retention: logs.RetentionDays.ONE_MONTH,
    });

    new logs.LogGroup(this, `EC2LogGroupSecure-${environmentSuffix}`, {
      logGroupName: `/aws/ec2/${environmentSuffix}/secure`,
      retention: logs.RetentionDays.THREE_MONTHS, // Keep security logs longer
    });

    // CloudWatch Alarms for EC2 - Manual metric creation
    const ec2CpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        InstanceId: ec2Instance.instanceId,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    new cloudwatch.Alarm(this, `EC2HighCPUAlarm-${environmentSuffix}`, {
      metric: ec2CpuMetric,
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `${environmentSuffix} EC2 instance high CPU utilization`,
      alarmName: `${environmentSuffix}-ec2-high-cpu`,
    });

    // EC2 Status Check Alarm
    const ec2StatusCheckMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'StatusCheckFailed',
      dimensionsMap: {
        InstanceId: ec2Instance.instanceId,
      },
      statistic: 'Maximum',
      period: cdk.Duration.minutes(1),
    });

    new cloudwatch.Alarm(this, `EC2StatusCheckAlarm-${environmentSuffix}`, {
      metric: ec2StatusCheckMetric,
      threshold: 1,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `${environmentSuffix} EC2 instance status check failed`,
      alarmName: `${environmentSuffix}-ec2-status-check`,
    });

    // Custom memory metric from CloudWatch Agent
    const ec2MemoryMetric = new cloudwatch.Metric({
      namespace: 'CWAgent',
      metricName: 'mem_used_percent',
      dimensionsMap: {
        InstanceId: ec2Instance.instanceId,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    new cloudwatch.Alarm(this, `EC2HighMemoryAlarm-${environmentSuffix}`, {
      metric: ec2MemoryMetric,
      threshold: 85,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `${environmentSuffix} EC2 instance high memory utilization`,
      alarmName: `${environmentSuffix}-ec2-high-memory`,
    });

    // CloudWatch Alarms for RDS - Using built-in metrics
    new cloudwatch.Alarm(this, `RDSHighCPUAlarm-${environmentSuffix}`, {
      metric: database.metricCPUUtilization(),
      threshold: 75,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `${environmentSuffix} RDS instance high CPU utilization`,
      alarmName: `${environmentSuffix}-rds-high-cpu`,
    });

    new cloudwatch.Alarm(this, `RDSHighConnectionsAlarm-${environmentSuffix}`, {
      metric: database.metricDatabaseConnections(),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `${environmentSuffix} RDS instance high connection count`,
      alarmName: `${environmentSuffix}-rds-high-connections`,
    });

    new cloudwatch.Alarm(this, `RDSLowFreeStorageAlarm-${environmentSuffix}`, {
      metric: database.metricFreeStorageSpace(),
      threshold: 2000000000, // 2GB in bytes
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `${environmentSuffix} RDS instance low free storage`,
      alarmName: `${environmentSuffix}-rds-low-storage`,
    });

    // RDS Read Latency Alarm
    const rdsReadLatencyMetric = new cloudwatch.Metric({
      namespace: 'AWS/RDS',
      metricName: 'ReadLatency',
      dimensionsMap: {
        DBInstanceIdentifier: database.instanceIdentifier,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    new cloudwatch.Alarm(this, `RDSHighReadLatencyAlarm-${environmentSuffix}`, {
      metric: rdsReadLatencyMetric,
      threshold: 0.2, // 200ms
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `${environmentSuffix} RDS instance high read latency`,
      alarmName: `${environmentSuffix}-rds-high-read-latency`,
    });

    // RDS Write Latency Alarm - using manual metric creation
    const rdsWriteLatencyMetric = new cloudwatch.Metric({
      namespace: 'AWS/RDS',
      metricName: 'WriteLatency',
      dimensionsMap: {
        DBInstanceIdentifier: database.instanceIdentifier,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    new cloudwatch.Alarm(
      this,
      `RDSHighWriteLatencyAlarm-${environmentSuffix}`,
      {
        metric: rdsWriteLatencyMetric,
        threshold: 0.2, // 200ms
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `${environmentSuffix} RDS instance high write latency`,
        alarmName: `${environmentSuffix}-rds-high-write-latency`,
      }
    );

    // ========================================
    // 8. APPLY COMMON TAGS TO ALL RESOURCES
    // ========================================

    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // ========================================
    // 9. OUTPUTS
    // ========================================

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: `${environmentSuffix} VPC ID`,
      exportName: `${environmentSuffix}VPCId`,
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: `${environmentSuffix} EC2 Instance ID`,
      exportName: `${environmentSuffix}EC2InstanceId`,
    });

    new cdk.CfnOutput(this, 'EC2PublicIP', {
      value: ec2Instance.instancePublicIp,
      description: `${environmentSuffix} EC2 Public IP`,
      exportName: `${environmentSuffix}EC2PublicIP`,
    });

    new cdk.CfnOutput(this, 'RDSEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: `${environmentSuffix} RDS Endpoint`,
      exportName: `${environmentSuffix}RDSEndpoint`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretsArn', {
      value: databaseCredentials.secretArn,
      description: `ARN of the ${environmentSuffix} database credentials secret`,
      exportName: `${environmentSuffix}DatabaseSecretsArn`,
    });

    new cdk.CfnOutput(this, 'SSHCommand', {
      value: `ssh -i ${environmentSuffix}-keypair.pem ec2-user@${ec2Instance.instancePublicIp}`,
      description: `SSH command to connect to ${environmentSuffix} EC2 instance`,
    });
  }
}
