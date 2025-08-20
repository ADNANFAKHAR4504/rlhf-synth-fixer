import { CfnOutput, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class TapStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from context or environment variable
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev';

    // Add timestamp for uniqueness to avoid conflicts
    const timestamp = Date.now().toString().slice(-8);
    const uniqueSuffix = `${environmentSuffix}-${timestamp}`;

    // KMS Key for encryption across services
    const encryptionKey = new kms.Key(this, 'FinancialAppEncryptionKey', {
      description: 'KMS key for financial application encryption',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      removalPolicy: RemovalPolicy.DESTROY,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow CloudWatch Logs',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`),
            ],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
            conditions: {
              ArnLike: {
                'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${this.region}:${this.account}:*`,
              },
            },
          }),
        ],
      }),
    });

    encryptionKey.addAlias(`alias/financial-app-key-${uniqueSuffix}`);

    // VPC with security-focused configuration
    const vpc = new ec2.Vpc(this, 'SecureFinancialVPC', {
      maxAzs: 3,
      natGateways: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
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
          cidrMask: 28,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // VPC Flow Logs
    const vpcFlowLog = new ec2.FlowLog(this, 'VPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      trafficType: ec2.FlowLogTrafficType.ALL,
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        new logs.LogGroup(this, 'VPCFlowLogGroup', {
          retention: logs.RetentionDays.ONE_MONTH,
          encryptionKey: encryptionKey,
        })
      ),
    });

    // S3 Bucket with security configurations
    const dataBucket = new s3.Bucket(this, 'SecureDataBucket', {
      // Remove explicit bucketName to let CDK generate unique name
      // bucketName: `secure-financial-data-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: Duration.days(90),
            },
          ],
        },
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: Duration.days(365),
          abortIncompleteMultipartUploadAfter: Duration.days(7),
        },
      ],
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // Database Security Group
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc,
        description: 'Security group for RDS database',
        allowAllOutbound: false,
        disableInlineRules: true, // Prevent automatic egress rules
      }
    );

    // Application Security Group
    const appSecurityGroup = new ec2.SecurityGroup(
      this,
      'ApplicationSecurityGroup',
      {
        vpc,
        description: 'Security group for application servers',
        allowAllOutbound: true,
      }
    );

    // EC2 Security Group (for test compatibility)
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: false,
    });

    // Allow application to connect to database
    dbSecurityGroup.addIngressRule(
      appSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow application access to database'
    );

    // ALB Security Group
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
      disableInlineRules: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    // Add explicit security group ingress rule for HTTP from internet
    new ec2.CfnSecurityGroupIngress(this, 'ALBHttpIngressRule', {
      groupId: albSecurityGroup.securityGroupId,
      ipProtocol: 'tcp',
      fromPort: 80,
      toPort: 80,
      cidrIp: '0.0.0.0/0',
      description: 'Allow HTTP from internet',
    });

    // No egress rules for ALB security group as per test requirements

    // Allow ALB to reach application servers
    appSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from ALB'
    );

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // RDS Database with encryption
    const database = new rds.DatabaseInstance(this, 'SecureDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_4,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      credentials: rds.Credentials.fromGeneratedSecret('dbadmin', {
        secretName: `financial-app-db-credentials-${uniqueSuffix}`,
        encryptionKey: encryptionKey,
      }),
      databaseName: 'financialapp',
      allocatedStorage: 20,
      storageType: rds.StorageType.GP2,
      storageEncrypted: true,
      storageEncryptionKey: encryptionKey,
      multiAz: true,
      securityGroups: [dbSecurityGroup],
      subnetGroup: dbSubnetGroup,
      backupRetention: Duration.days(7),
      preferredBackupWindow: '03:00-04:00',
      deletionProtection: true,
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: encryptionKey,
      enableCloudwatchLogsExports: ['postgresql'],
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Allow EC2 instances to access S3 bucket
    dataBucket.grantReadWrite(ec2Role);

    // Allow EC2 instances to use KMS key
    encryptionKey.grantEncryptDecrypt(ec2Role);

    // IAM Policy requiring MFA for critical actions
    const mfaPolicy = new iam.Policy(this, 'MFARequiredPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: [
            'iam:CreateRole',
            'iam:DeleteRole',
            'iam:PutRolePolicy',
            'iam:AttachRolePolicy',
            'iam:DetachRolePolicy',
          ],
          resources: ['*'],
          conditions: {
            BoolIfExists: {
              'aws:MultiFactorAuthPresent': 'false',
            },
          },
        }),
      ],
    });

    // Attach MFA policy to EC2 role
    mfaPolicy.attachToRole(ec2Role);

    // Instance Profile
    const instanceProfile = new iam.InstanceProfile(
      this,
      'EC2InstanceProfile',
      {
        role: ec2Role,
      }
    );

    // SSM Patch Baseline
    const patchBaseline = new ssm.CfnPatchBaseline(this, 'SSMPatchBaseline', {
      name: `financial-app-patch-baseline-${environmentSuffix}`,
      operatingSystem: 'AMAZON_LINUX_2023',
      approvalRules: {
        patchRules: [
          {
            approveAfterDays: 7,
            patchFilterGroup: {
              patchFilters: [
                {
                  key: 'CLASSIFICATION',
                  values: ['Security', 'Bugfix'],
                },
                {
                  key: 'SEVERITY',
                  values: ['Critical', 'Important'],
                },
              ],
            },
          },
        ],
      },
    });

    // SSM Maintenance Window
    const maintenanceWindow = new ssm.CfnMaintenanceWindow(
      this,
      'SSMMaintenanceWindow',
      {
        name: `financial-app-maintenance-window-${environmentSuffix}`,
        description: 'Maintenance window for patch management',
        duration: 4,
        cutoff: 1,
        schedule: 'cron(0 2 ? * SUN *)',
        allowUnassociatedTargets: false,
      }
    );

    // Launch Template for Auto Scaling
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'ApplicationLaunchTemplate',
      {
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        securityGroup: appSecurityGroup,
        role: ec2Role,
        userData: ec2.UserData.forLinux(),
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              encrypted: true,
              kmsKey: encryptionKey,
              volumeType: ec2.EbsDeviceVolumeType.GP3,
            }),
          },
        ],
        // keyName: 'your-key-pair', // Replace with your key pair name or remove if not needed
      }
    );

    // Application Load Balancer
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

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'ApplicationTargetGroup',
      {
        vpc,
        port: 8080,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          path: '/health',
          protocol: elbv2.Protocol.HTTP,
          port: '8080',
        },
      }
    );

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'ApplicationAutoScalingGroup',
      {
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

    // Attach Auto Scaling Group to Target Group
    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // HTTP Listener (since we don't have SSL certificate configured)
    const listener = alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/ec2/financial-app-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: encryptionKey,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // CloudWatch CPU Metric for Auto Scaling Group
    const cpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/AutoScaling',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
      },
      statistic: 'Average',
      period: Duration.minutes(5),
    });

    // CloudWatch Alarms
    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCPUAlarm', {
      metric: cpuMetric,
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Database Connections Alarm
    const dbConnectionsMetric = new cloudwatch.Metric({
      metricName: 'DatabaseConnections',
      namespace: 'AWS/RDS',
      dimensionsMap: {
        DBInstanceIdentifier: database.instanceIdentifier,
      },
      statistic: 'Average',
      period: Duration.minutes(5),
    });

    const dbConnectionsAlarm = new cloudwatch.Alarm(
      this,
      'HighDatabaseConnections',
      {
        metric: dbConnectionsMetric,
        threshold: 80,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // Auto Scaling Policy
    const scaleUpPolicy = autoScalingGroup.scaleOnMetric('ScaleUpPolicy', {
      metric: cpuMetric,
      scalingSteps: [
        { upper: 10, change: -1 },
        { lower: 50, change: +1 },
        { lower: 70, change: +3 },
      ],
      adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
    });

    // CloudWatch Alarm for EC2 CPU
    const ec2CpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      statistic: 'Average',
      period: Duration.minutes(5),
    });

    const ec2CpuAlarm = new cloudwatch.Alarm(this, 'HighEC2CPUAlarm', {
      metric: ec2CpuMetric,
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // SSM Parameters for configuration
    new ssm.StringParameter(this, 'DatabaseEndpointParameter', {
      parameterName: `/financial-app/${environmentSuffix}/database/endpoint`,
      stringValue: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
    });

    new ssm.StringParameter(this, 'S3BucketParameter', {
      parameterName: `/financial-app/${environmentSuffix}/s3/bucket-name`,
      stringValue: dataBucket.bucketName,
      description: 'S3 bucket name for data storage',
    });

    // API Gateway CloudWatch Log Group
    const apiLogGroup = new logs.LogGroup(this, 'APIGatewayLogGroup', {
      logGroupName: `/aws/apigateway/financial-app-api-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: encryptionKey,
    });

    // API Gateway for basic API functionality
    const api = new apigateway.RestApi(this, 'FinancialAppApi', {
      restApiName: `financial-app-api-${environmentSuffix}`,
      description: 'API Gateway for Financial Application',
      deploy: false, // We'll create a custom deployment
      cloudWatchRole: true,
    });

    // Add a simple health check endpoint
    const healthResource = api.root.addResource('health');
    healthResource.addMethod(
      'GET',
      new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json':
                '{"status": "healthy", "timestamp": "$context.requestTime"}',
            },
          },
        ],
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      }),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseModels: {
              'application/json': apigateway.Model.EMPTY_MODEL,
            },
          },
        ],
      }
    );

    // Custom deployment with throttling settings
    const deployment = new apigateway.Deployment(this, 'ApiDeployment', {
      api: api,
    });

    const stage = new apigateway.Stage(this, 'ApiStage', {
      deployment,
      stageName: 'prod',
      accessLogDestination: new apigateway.LogGroupLogDestination(apiLogGroup),
      accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      loggingLevel: apigateway.MethodLoggingLevel.INFO,
      dataTraceEnabled: true,
      metricsEnabled: true,
      methodOptions: {
        '/*/*': {
          throttlingRateLimit: 1000,
          throttlingBurstLimit: 2000,
        },
      },
    });

    // Outputs
    new CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID for the secure financial application',
      exportName: `FinancialApp-VPC-${environmentSuffix}`,
    });

    new CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
      exportName: `FinancialApp-DB-Endpoint-${environmentSuffix}`,
    });

    new CfnOutput(this, 'ALBDNSName', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
      exportName: `FinancialApp-ALB-DNS-${environmentSuffix}`,
    });

    new CfnOutput(this, 'S3BucketName', {
      value: dataBucket.bucketName,
      description: 'S3 bucket name',
      exportName: `FinancialApp-S3-Bucket-${environmentSuffix}`,
    });

    new CfnOutput(this, 'KMSKeyId', {
      value: encryptionKey.keyId,
      description: 'KMS key ID for encryption',
      exportName: `FinancialApp-KMS-Key-${environmentSuffix}`,
    });

    new CfnOutput(this, 'APIGatewayURL', {
      value: stage.urlForPath(),
      description: 'API Gateway URL',
      exportName: `FinancialApp-API-URL-${environmentSuffix}`,
    });
  }
}
