### Reasoning Trace
---

Alright, I need to create a comprehensive CDK program for a fintech startup that handles payment processing while meeting PCI-DSS requirements. Let's break down what's needed and then build the solution:

## Requirements

1. **Multi-region deployment**:
   - Primary: us-east-1
   - DR (Disaster Recovery): eu-west-1
   - Context parameters to select region

2. **Containerized application using ECS Fargate**:
   - ARM64 Graviton2 tasks for cost-efficiency
   - Blue-green deployment capability

3. **Load Balancing**:
   - Application Load Balancer
   - Weighted target groups for blue-green traffic shifting

4. **Security**:
   - AWS WAF with rate-based rules for API protection
   - Security groups with least privilege
   - IAM roles with permission boundaries
   - AWS PrivateLink for inter-service communication
   - SSL/TLS enforced on database connections

5. **Database**:
   - Aurora PostgreSQL
   - Multi-AZ with automatic failover
   - Point-in-time recovery
   - Credential rotation with Secrets Manager (30-day schedule)

6. **Networking**:
   - VPC with 3 Availability Zones
   - Private subnets for ECS and RDS
   - Public subnets for ALB
   - NAT Gateways for egress

7. **Monitoring and Failover**:
   - CloudWatch Container Insights
   - Custom metrics for transaction latency
   - Alarms for HTTP 5xx errors (rollback if > 1%)
   - Route 53 health checks and DNS failover between regions

8. **Deployment Time**: Under 15 minutes

## Files to Create:
1. bin/tap.ts - Entry point
2. lib/tap-stack.ts - Main stack definition
3. cdk.json - CDK context configuration

Let me create these files one by one, ensuring they meet all requirements:

### bin/tap.ts
This is the entry point that will instantiate our stacks:

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Determine the region from context or use default
const deploymentRegion = app.node.tryGetContext('region') || 'us-east-1';
const isPrimary = deploymentRegion === 'us-east-1';
const drRegion = 'eu-west-1';
const primaryRegion = 'us-east-1';

// Create stack with appropriate env
new TapStack(app, `TapStack-${deploymentRegion}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: deploymentRegion
  },
  description: `Payment Processing Stack in ${deploymentRegion} (${isPrimary ? 'Primary' : 'DR'})`,
  isPrimary: isPrimary,
  crossRegionReferences: true,
  primaryRegion: primaryRegion,
  drRegion: drRegion
});
```

### cdk.json
This file will contain context values and CDK configuration:

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "vpc-cidr": "10.0.0.0/16",
    "domain-name": "payments.example.com",
    "pci-s3-bucket-name": "pci-payments-data",
    "container-image": "account-id.dkr.ecr.region.amazonaws.com/payments:latest",
    "container-cpu": 1024,
    "container-memory": 2048,
    "desired-tasks": 3,
    "max-tasks": 10,
    "db-username": "paymentadmin",
    "db-port": 5432,
    "db-name": "payments",
    "db-backup-retention-days": 35,
    "waf-rate-limit": 2000
  }
}
```

### lib/tap-stack.ts
This will be our main stack implementation:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Duration, RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib';

export interface TapStackProps extends StackProps {
  isPrimary: boolean;
  primaryRegion: string;
  drRegion: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const isPrimary = props.isPrimary;
    const domainName = this.node.tryGetContext('domain-name') || 'payments.example.com';
    const pciS3BucketName = this.node.tryGetContext('pci-s3-bucket-name') || 'pci-payments-data';
    
    // VPC
    const vpc = new ec2.Vpc(this, 'PaymentVPC', {
      cidr: this.node.tryGetContext('vpc-cidr') || '10.0.0.0/16',
      maxAzs: 3,
      natGateways: 3,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24
        }
      ]
    });
    
    // Security Groups
    const albSg = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security group for the application load balancer'
    });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS traffic from anywhere');
    
    const ecsSg = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      vpc,
      description: 'Security group for the ECS tasks'
    });
    ecsSg.addIngressRule(albSg, ec2.Port.tcp(8080), 'Allow traffic from ALB on container port');
    
    const dbSg = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for the Aurora database'
    });
    dbSg.addIngressRule(ecsSg, ec2.Port.tcp(this.node.tryGetContext('db-port') || 5432), 'Allow traffic from ECS tasks');
    
    // VPC Endpoints for PrivateLink
    const s3Endpoint = vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3
    });
    
    const ecrDkrEndpoint = vpc.addInterfaceEndpoint('ECRDkrEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
      securityGroups: [ecsSg]
    });
    
    const ecrApiEndpoint = vpc.addInterfaceEndpoint('ECRApiEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
      securityGroups: [ecsSg]
    });
    
    const cwLogsEndpoint = vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      securityGroups: [ecsSg]
    });
    
    const secretsManagerEndpoint = vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      securityGroups: [ecsSg]
    });
    
    // Database Secret
    const dbCredentialsSecret = new secretsmanager.Secret(this, 'DBCredentials', {
      secretName: `${id}-db-credentials`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: this.node.tryGetContext('db-username') || 'paymentadmin',
        }),
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: 'password'
      },
      removalPolicy: RemovalPolicy.DESTROY // In production, use RETAIN
    });
    
    // Set up rotation for the database credentials
    new secretsmanager.SecretRotation(this, 'DBCredentialRotation', {
      secret: dbCredentialsSecret,
      application: secretsmanager.SecretRotationApplication.POSTGRES_ROTATION_SINGLE_USER,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      securityGroup: ecsSg,
      target: databaseCluster,
      automaticallyAfter: Duration.days(30)
    });
    
    // Database Parameter Group
    const dbParameterGroup = new rds.ParameterGroup(this, 'DBParameterGroup', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_13_7
      }),
      parameters: {
        'rds.force_ssl': '1' // Force SSL/TLS connections
      }
    });
    
    // Database Cluster
    const databaseCluster = new rds.DatabaseCluster(this, 'PaymentDatabase', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_13_7
      }),
      credentials: rds.Credentials.fromSecret(dbCredentialsSecret),
      instanceProps: {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.MEDIUM),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        },
        vpc,
        securityGroups: [dbSg]
      },
      instances: 2,
      parameterGroup: dbParameterGroup,
      storageEncrypted: true,
      backup: {
        retention: Duration.days(this.node.tryGetContext('db-backup-retention-days') || 35)
      },
      deletionProtection: true,
      removalPolicy: RemovalPolicy.SNAPSHOT,
      defaultDatabaseName: this.node.tryGetContext('db-name') || 'payments',
      cloudwatchLogsExports: ['postgresql']
    });
    
    // SSL Certificate for ALB
    const certificate = new acm.Certificate(this, 'PaymentCertificate', {
      domainName: domainName,
      validation: acm.CertificateValidation.fromDns(),
    });
    
    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'PaymentALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSg,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC }
    });
    
    // ALB HTTPS Listener
    const httpsListener = alb.addListener('HttpsListener', {
      port: 443,
      certificates: [certificate],
      protocol: elbv2.ApplicationProtocol.HTTPS,
      sslPolicy: elbv2.SslPolicy.RECOMMENDED
    });
    
    // Redirect HTTP to HTTPS
    alb.addListener('HttpListener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.redirect({
        port: '443',
        protocol: 'HTTPS',
        permanent: true
      })
    });
    
    // AWS WAF for ALB
    const wafAcl = new wafv2.CfnWebACL(this, 'PaymentWAF', {
      defaultAction: { allow: {} },
      scope: 'REGIONAL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'PaymentWAF',
        sampledRequestsEnabled: true
      },
      rules: [
        {
          name: 'APIRateLimit',
          priority: 0,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: this.node.tryGetContext('waf-rate-limit') || 2000,
              aggregateKeyType: 'IP'
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'APIRateLimit',
            sampledRequestsEnabled: true
          }
        },
        {
          name: 'SQLiRule',
          priority: 1,
          action: { block: {} },
          statement: {
            managedRuleGroupStatement: {
              name: 'AWSManagedRulesSQLiRuleSet',
              vendorName: 'AWS'
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLiRule',
            sampledRequestsEnabled: true
          }
        }
      ]
    });
    
    // Associate WAF with ALB
    new wafv2.CfnWebACLAssociation(this, 'PaymentWafAssociation', {
      resourceArn: alb.loadBalancerArn,
      webAclArn: wafAcl.attrArn
    });
    
    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'PaymentCluster', {
      vpc,
      containerInsights: true
    });
    
    // ECS Task Role
    const taskRole = new iam.Role(this, 'EcsTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role for Payment Processing ECS Tasks',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
      ]
    });
    
    // S3 Bucket for PCI data
    const pciBucket = new s3.Bucket(this, 'PCIDataBucket', {
      bucketName: `${pciS3BucketName}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN,
      enforceSSL: true
    });
    
    // Permission boundary for task role
    const permissionsBoundary = new iam.ManagedPolicy(this, 'TaskPermissionsBoundary', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:ListBucket'
          ],
          resources: [
            pciBucket.bucketArn,
            `${pciBucket.bucketArn}/*`
          ]
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'secretsmanager:GetSecretValue',
            'secretsmanager:DescribeSecret'
          ],
          resources: [
            dbCredentialsSecret.secretArn
          ]
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'cloudwatch:PutMetricData'
          ],
          resources: ['*']
        })
      ]
    });
    
    // Apply permission boundary to task role
    taskRole.permissionsBoundary = permissionsBoundary;
    
    // Allow task role to access S3 bucket
    pciBucket.grantReadWrite(taskRole);
    
    // Allow task role to read DB credentials
    dbCredentialsSecret.grantRead(taskRole);
    
    // Task Execution Role
    const taskExecutionRole = new iam.Role(this, 'EcsTaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
      ]
    });
    
    // ECS Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'PaymentTaskDef', {
      memoryLimitMiB: this.node.tryGetContext('container-memory') || 2048,
      cpu: this.node.tryGetContext('container-cpu') || 1024,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.ARM64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX
      },
      taskRole: taskRole,
      executionRole: taskExecutionRole
    });
    
    // Container Definition
    const containerImage = this.node.tryGetContext('container-image') || 'account-id.dkr.ecr.region.amazonaws.com/payments:latest';
    const container = taskDefinition.addContainer('PaymentContainer', {
      image: ecs.ContainerImage.fromRegistry(containerImage),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'payment-service',
        logRetention: logs.RetentionDays.TWO_WEEKS
      }),
      environment: {
        DATABASE_HOST: databaseCluster.clusterEndpoint.hostname,
        DATABASE_PORT: databaseCluster.clusterEndpoint.port.toString(),
        DATABASE_NAME: this.node.tryGetContext('db-name') || 'payments',
        AWS_REGION: this.region,
        S3_BUCKET_NAME: pciBucket.bucketName
      },
      secrets: {
        DATABASE_CREDENTIALS: ecs.Secret.fromSecretsManager(dbCredentialsSecret)
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:8080/health || exit 1'],
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        retries: 3,
        startPeriod: Duration.seconds(60)
      }
    });
    
    container.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP
    });
    
    // Blue Target Group
    const blueTargetGroup = new elbv2.ApplicationTargetGroup(this, 'BlueTargetGroup', {
      vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: Duration.seconds(30),
        healthyHttpCodes: '200',
        timeout: Duration.seconds(5)
      }
    });
    
    // Green Target Group
    const greenTargetGroup = new elbv2.ApplicationTargetGroup(this, 'GreenTargetGroup', {
      vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: Duration.seconds(30),
        healthyHttpCodes: '200',
        timeout: Duration.seconds(5)
      }
    });
    
    // Initially use blue target group with 100% traffic
    httpsListener.addTargetGroups('BlueTarget', {
      targetGroups: [blueTargetGroup],
      priority: 1,
      conditions: [
        elbv2.ListenerCondition.pathPatterns(['/*'])
      ]
    });
    
    // ECS Service (Blue)
    const blueService = new ecs.FargateService(this, 'PaymentService', {
      cluster,
      taskDefinition,
      securityGroups: [ecsSg],
      desiredCount: this.node.tryGetContext('desired-tasks') || 3,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      assignPublicIp: false,
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 1
        }
      ],
      circuitBreaker: { rollback: true },
      enableExecuteCommand: true
    });
    
    blueService.attachToApplicationTargetGroup(blueTargetGroup);
    
    // ECS Service Auto Scaling
    const scaling = blueService.autoScaleTaskCount({
      minCapacity: this.node.tryGetContext('desired-tasks') || 3,
      maxCapacity: this.node.tryGetContext('max-tasks') || 10
    });
    
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60)
    });
    
    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60)
    });
    
    // CloudWatch Alarm for 5xx errors
    const http5xxMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'HTTPCode_Target_5XX_Count',
      dimensions: {
        LoadBalancer: alb.loadBalancerFullName,
        TargetGroup: blueTargetGroup.targetGroupFullName
      },
      statistic: 'Sum',
      period: Duration.minutes(1)
    });
    
    const requestCountMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'RequestCount',
      dimensions: {
        LoadBalancer: alb.loadBalancerFullName,
        TargetGroup: blueTargetGroup.targetGroupFullName
      },
      statistic: 'Sum',
      period: Duration.minutes(1)
    });
    
    const http5xxAlarm = new cloudwatch.MathExpression({
      expression: '(m1/m2)*100',
      usingMetrics: {
        m1: http5xxMetric,
        m2: requestCountMetric
      },
      period: Duration.minutes(1)
    }).createAlarm(this, 'Http5xxAlarm', {
      threshold: 1, // 1%
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      alarmDescription: 'HTTP 5XX errors exceeded 1%',
      alarmName: `${id}-5xx-error-rate`,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });
    
    // Custom Metric for Transaction Latency
    // Note: This would be published by the application itself
    const transactionLatencyMetric = new cloudwatch.Metric({
      namespace: 'PaymentService',
      metricName: 'TransactionLatency',
      dimensions: {
        Service: 'PaymentProcessing'
      },
      statistic: 'Average',
      period: Duration.minutes(1)
    });
    
    const latencyAlarm = transactionLatencyMetric.createAlarm(this, 'LatencyAlarm', {
      threshold: 500, // 500ms
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      alarmDescription: 'Transaction latency exceeded 500ms',
      alarmName: `${id}-transaction-latency`,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });
    
    // Route53 setup for failover
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domainName.split('.').slice(-2).join('.')
    });
    
    // Health check
    const healthCheck = new route53.CfnHealthCheck(this, 'FailoverHealthCheck', {
      healthCheckConfig: {
        type: 'HTTPS',
        fullyQualifiedDomainName: alb.loadBalancerDnsName,
        port: 443,
        resourcePath: '/health',
        requestInterval: 30,
        failureThreshold: 3
      }
    });
    
    // DNS record for regional endpoint
    const regionalDnsRecord = new route53.RecordSet(this, 'RegionalDnsRecord', {
      zone: hostedZone,
      recordName: isPrimary ? `primary.${domainName}` : `dr.${domainName}`,
      target: route53.RecordTarget.fromAlias(
        new route53targets.LoadBalancerTarget(alb)
      ),
      recordType: route53.RecordType.A
    });
    
    // DNS failover record
    if (isPrimary) {
      // Only create in primary region
      const failoverRecord = new route53.CfnRecordSet(this, 'FailoverDnsRecord', {
        hostedZoneId: hostedZone.hostedZoneId,
        name: domainName,
        type: 'A',
        aliasTarget: {
          dnsName: alb.loadBalancerDnsName,
          hostedZoneId: alb.loadBalancerCanonicalHostedZoneId,
          evaluateTargetHealth: true
        },
        failover: 'PRIMARY',
        healthCheckId: healthCheck.attrHealthCheckId,
        setIdentifier: `${id}-primary`
      });
      
      // Create secondary record that points to DR region
      const drAlbArn = `arn:aws:elasticloadbalancing:${props.drRegion}:${this.account}:loadbalancer/app/TapStack-${props.drRegion}-PaymentALB`;
      const drHealthCheckId = cdk.Fn.importValue(`TapStack-${props.drRegion}-HealthCheckId`);
      
      // Need to look up the canonical hosted zone ID for the DR region
      const drCanonicalHostedZoneId = ''; // This would be looked up or imported
      
      const secondaryRecord = new route53.CfnRecordSet(this, 'DrFailoverDnsRecord', {
        hostedZoneId: hostedZone.hostedZoneId,
        name: domainName,
        type: 'A',
        aliasTarget: {
          dnsName: cdk.Fn.importValue(`TapStack-${props.drRegion}-AlbDnsName`),
          hostedZoneId: cdk.Fn.importValue(`TapStack-${props.drRegion}-AlbCanonicalHostedZoneId`),
          evaluateTargetHealth: true
        },
        failover: 'SECONDARY',
        healthCheckId: drHealthCheckId,
        setIdentifier: `${id}-secondary`
      });
    }
    
    // Export values needed for cross-region references
    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      exportName: `${id}-AlbDnsName`
    });
    
    new cdk.CfnOutput(this, 'AlbCanonicalHostedZoneId', {
      value: alb.loadBalancerCanonicalHostedZoneId,
      exportName: `${id}-AlbCanonicalHostedZoneId`
    });
    
    new cdk.CfnOutput(this, 'HealthCheckId', {
      value: healthCheck.attrHealthCheckId,
      exportName: `${id}-HealthCheckId`
    });
  }
}
```

Let me check my solution for completeness:

1. **Multi-region deployment**: ✓ - We've set up the CDK app to deploy in either us-east-1 or eu-west-1 based on context
2. **Containerized application using ECS Fargate**: ✓ - Using ARM64 Graviton2 tasks
3. **Blue-green deployment capability**: ✓ - Set up blue and green target groups with ALB
4. **Security**: ✓ - Implemented WAF, security groups, IAM roles with boundaries, PrivateLink, and SSL/TLS enforcement
5. **Database**: ✓ - Aurora PostgreSQL with Multi-AZ, failover, point-in-time recovery, and credential rotation
6. **Networking**: ✓ - VPC with 3 AZs, private subnets for compute, and NAT Gateways
7. **Monitoring and Failover**: ✓ - CloudWatch alarms, custom metrics, and Route 53 health checks/failover

There are a few issues I need to fix:

1. In our bin/tap.ts file, we've defined `crossRegionReferences` but this isn't a valid prop for StackProps.
2. In the stack, we're referencing `databaseCluster` before it's defined (in the secret rotation section).
3. There might be other small issues to fix.

Let me revise these files to ensure they work correctly:

### bin/tap.ts (revised)
```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Determine the region from context or use default
const deploymentRegion = app.node.tryGetContext('region') || 'us-east-1';
const isPrimary = deploymentRegion === 'us-east-1';
const drRegion = 'eu-west-1';
const primaryRegion = 'us-east-1';

// Create stack with appropriate env
new TapStack(app, `TapStack-${deploymentRegion}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: deploymentRegion
  },
  description: `Payment Processing Stack in ${deploymentRegion} (${isPrimary ? 'Primary' : 'DR'})`,
  isPrimary: isPrimary,
  primaryRegion: primaryRegion,
  drRegion: drRegion
});
```

### lib/tap-stack.ts (revised)
For the full stack file, I need to fix the ordering of components and fix the Secret rotation that depends on the database cluster. Let me restructure the ordering:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';

export interface TapStackProps extends StackProps {
  isPrimary: boolean;
  primaryRegion: string;
  drRegion: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const isPrimary = props.isPrimary;
    const domainName = this.node.tryGetContext('domain-name') || 'payments.example.com';
    const pciS3BucketName = this.node.tryGetContext('pci-s3-bucket-name') || 'pci-payments-data';
    
    // VPC
    const vpc = new ec2.Vpc(this, 'PaymentVPC', {
      cidr: this.node.tryGetContext('vpc-cidr') || '10.0.0.0/16',
      maxAzs: 3,
      natGateways: 3,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24
        }
      ]
    });
    
    // Security Groups
    const albSg = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security group for the application load balancer'
    });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS traffic from anywhere');
    
    const ecsSg = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      vpc,
      description: 'Security group for the ECS tasks'
    });
    ecsSg.addIngressRule(albSg, ec2.Port.tcp(8080), 'Allow traffic from ALB on container port');
    
    const dbSg = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for the Aurora database'
    });
    dbSg.addIngressRule(ecsSg, ec2.Port.tcp(this.node.tryGetContext('db-port') || 5432), 'Allow traffic from ECS tasks');
    
    // VPC Endpoints for PrivateLink
    const s3Endpoint = vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3
    });
    
    const ecrDkrEndpoint = vpc.addInterfaceEndpoint('ECRDkrEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
      securityGroups: [ecsSg]
    });
    
    const ecrApiEndpoint = vpc.addInterfaceEndpoint('ECRApiEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
      securityGroups: [ecsSg]
    });
    
    const cwLogsEndpoint = vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      securityGroups: [ecsSg]
    });
    
    const secretsManagerEndpoint = vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      securityGroups: [ecsSg]
    });
    
    // Database Secret
    const dbCredentialsSecret = new secretsmanager.Secret(this, 'DBCredentials', {
      secretName: `${id}-db-credentials`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: this.node.tryGetContext('db-username') || 'paymentadmin',
        }),
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: 'password'
      },
      removalPolicy: RemovalPolicy.DESTROY // In production, use RETAIN
    });
    
    // Database Parameter Group
    const dbParameterGroup = new rds.ParameterGroup(this, 'DBParameterGroup', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_13_7
      }),
      parameters: {
        'rds.force_ssl': '1' // Force SSL/TLS connections
      }
    });
    
    // Database Cluster
    const databaseCluster = new rds.DatabaseCluster(this, 'PaymentDatabase', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_13_7
      }),
      credentials: rds.Credentials.fromSecret(dbCredentialsSecret),
      instanceProps: {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.MEDIUM),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        },
        vpc,
        securityGroups: [dbSg]
      },
      instances: 2,
      parameterGroup: dbParameterGroup,
      storageEncrypted: true,
      backup: {
        retention: Duration.days(this.node.tryGetContext('db-backup-retention-days') || 35)
      },
      deletionProtection: true,
      removalPolicy: RemovalPolicy.SNAPSHOT,
      defaultDatabaseName: this.node.tryGetContext('db-name') || 'payments',
      cloudwatchLogsExports: ['postgresql']
    });
    
    // Set up rotation for the database credentials
    new secretsmanager.SecretRotation(this, 'DBCredentialRotation', {
      secret: dbCredentialsSecret,
      application: secretsmanager.SecretRotationApplication.POSTGRES_ROTATION_SINGLE_USER,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      securityGroup: ecsSg,
      target: databaseCluster,
      automaticallyAfter: Duration.days(30)
    });
    
    // SSL Certificate for ALB
    const certificate = new acm.Certificate(this, 'PaymentCertificate', {
      domainName: domainName,
      validation: acm.CertificateValidation.fromDns(),
    });
    
    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'PaymentALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSg,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC }
    });
    
    // ALB HTTPS Listener
    const httpsListener = alb.addListener('HttpsListener', {
      port: 443,
      certificates: [certificate],
      protocol: elbv2.ApplicationProtocol.HTTPS,
      sslPolicy: elbv2.SslPolicy.RECOMMENDED
    });
    
    // Redirect HTTP to HTTPS
    alb.addListener('HttpListener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.redirect({
        port: '443',
        protocol: 'HTTPS',
        permanent: true
      })
    });
    
    // AWS WAF for ALB
    const wafAcl = new wafv2.CfnWebACL(this, 'PaymentWAF', {
      defaultAction: { allow: {} },
      scope: 'REGIONAL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'PaymentWAF',
        sampledRequestsEnabled: true
      },
      rules: [
        {
          name: 'APIRateLimit',
          priority: 0,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: this.node.tryGetContext('waf-rate-limit') || 2000,
              aggregateKeyType: 'IP'
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'APIRateLimit',
            sampledRequestsEnabled: true
          }
        },
        {
          name: 'SQLiRule',
          priority: 1,
          action: { block: {} },
          statement: {
            managedRuleGroupStatement: {
              name: 'AWSManagedRulesSQLiRuleSet',
              vendorName: 'AWS'
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLiRule',
            sampledRequestsEnabled: true
          }
        }
      ]
    });
    
    // Associate WAF with ALB
    new wafv2.CfnWebACLAssociation(this, 'PaymentWafAssociation', {
      resourceArn: alb.loadBalancerArn,
      webAclArn: wafAcl.attrArn
    });
    
    // S3 Bucket for PCI data
    const pciBucket = new s3.Bucket(this, 'PCIDataBucket', {
      bucketName: `${pciS3BucketName}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN,
      enforceSSL: true
    });
    
    // Permission boundary for task role
    const permissionsBoundary = new iam.ManagedPolicy(this, 'TaskPermissionsBoundary', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:ListBucket'
          ],
          resources: [
            pciBucket.bucketArn,
            `${pciBucket.bucketArn}/*`
          ]
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'secretsmanager:GetSecretValue',
            'secretsmanager:DescribeSecret'
          ],
          resources: [
            dbCredentialsSecret.secretArn
          ]
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'cloudwatch:PutMetricData'
          ],
          resources: ['*']
        })
      ]
    });
    
    // Task Role
    const taskRole = new iam.Role(this, 'EcsTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role for Payment Processing ECS Tasks',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
      ]
    });
    
    // Apply permission boundary to task role
    taskRole.permissionsBoundary = permissionsBoundary;
    
    // Allow task role to access S3 bucket
    pciBucket.grantReadWrite(taskRole);
    
    // Allow task role to read DB credentials
    dbCredentialsSecret.grantRead(taskRole);
    
    // Task Execution Role
    const taskExecutionRole = new iam.Role(this, 'EcsTaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
      ]
    });
    
    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'PaymentCluster', {
      vpc,
      containerInsights: true
    });
    
    // ECS Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'PaymentTaskDef', {
      memoryLimitMiB: this.node.tryGetContext('container-memory') || 2048,
      cpu: this.node.tryGetContext('container-cpu') || 1024,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.ARM64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX
      },
      taskRole: taskRole,
      executionRole: taskExecutionRole
    });
    
    // Container Definition
    const containerImage = this.node.tryGetContext('container-image') || 'account-id.dkr.ecr.region.amazonaws.com/payments:latest';
    const container = taskDefinition.addContainer('PaymentContainer', {
      image: ecs.ContainerImage.fromRegistry(containerImage),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'payment-service',
        logRetention: logs.RetentionDays.TWO_WEEKS
      }),
      environment: {
        DATABASE_HOST: databaseCluster.clusterEndpoint.hostname,
        DATABASE_PORT: databaseCluster.clusterEndpoint.port.toString(),
        DATABASE_NAME: this.node.tryGetContext('db-name') || 'payments',
        AWS_REGION: this.region,
        S3_BUCKET_NAME: pciBucket.bucketName
      },
      secrets: {
        DATABASE_CREDENTIALS: ecs.Secret.fromSecretsManager(dbCredentialsSecret)
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:8080/health || exit 1'],
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        retries: 3,
        startPeriod: Duration.seconds(60)
      }
    });
    
    container.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP
    });
    
    // Blue Target Group
    const blueTargetGroup = new elbv2.ApplicationTargetGroup(this, 'BlueTargetGroup', {
      vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: Duration.seconds(30),
        healthyHttpCodes: '200',
        timeout: Duration.seconds(5)
      }
    });
    
    // Green Target Group
    const greenTargetGroup = new elbv2.ApplicationTargetGroup(this, 'GreenTargetGroup', {
      vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: Duration.seconds(30),
        healthyHttpCodes: '200',
        timeout: Duration.seconds(5)
      }
    });
    
    // Initially use blue target group with 100% traffic
    httpsListener.addTargetGroups('BlueTarget', {
      targetGroups: [blueTargetGroup],
      priority: 1,
      conditions: [
        elbv2.ListenerCondition.pathPatterns(['/*'])
      ]
    });
    
    // ECS Service (Blue)
    const blueService = new ecs.FargateService(this, 'PaymentService', {
      cluster,
      taskDefinition,
      securityGroups: [ecsSg],
      desiredCount: this.node.tryGetContext('desired-tasks') || 3,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      assignPublicIp: false,
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 1
        }
      ],
      circuitBreaker: { rollback: true },
      enableExecuteCommand: true
    });
    
    blueService.attachToApplicationTargetGroup(blueTargetGroup);
    
    // ECS Service Auto Scaling
    const scaling = blueService.autoScaleTaskCount({
      minCapacity: this.node.tryGetContext('desired-tasks') || 3,
      maxCapacity: this.node.tryGetContext('max-tasks') || 10
    });
    
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60)
    });
    
    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60)
    });
    
    // CloudWatch Alarm for 5xx errors
    const http5xxMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'HTTPCode_Target_5XX_Count',
      dimensions: {
        LoadBalancer: alb.loadBalancerFullName,
        TargetGroup: blueTargetGroup.targetGroupFullName
      },
      statistic: 'Sum',
      period: Duration.minutes(1)
    });
    
    const requestCountMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'RequestCount',
      dimensions: {
        LoadBalancer: alb.loadBalancerFullName,
        TargetGroup: blueTargetGroup.targetGroupFullName
      },
      statistic: 'Sum',
      period: Duration.minutes(1)
    });
    
    const http5xxAlarm = new cloudwatch.MathExpression({
      expression: '(m1/m2)*100',
      usingMetrics: {
        m1: http5xxMetric,
        m2: requestCountMetric
      },
      period: Duration.minutes(1)
    }).createAlarm(this, 'Http5xxAlarm', {
      threshold: 1, // 1%
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      alarmDescription: 'HTTP 5XX errors exceeded 1%',
      alarmName: `${id}-5xx-error-rate`,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });
    
    // Custom Metric for Transaction Latency
    // Note: This would be published by the application itself
    const transactionLatencyMetric = new cloudwatch.Metric({
      namespace: 'PaymentService',
      metricName: 'TransactionLatency',
      dimensions: {
        Service: 'PaymentProcessing'
      },
      statistic: 'Average',
      period: Duration.minutes(1)
    });
    
    const latencyAlarm = transactionLatencyMetric.createAlarm(this, 'LatencyAlarm', {
      threshold: 500, // 500ms
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      alarmDescription: 'Transaction latency exceeded 500ms',
      alarmName: `${id}-transaction-latency`,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });
    
    // Route53 setup for failover
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domainName.split('.').slice(-2).join('.')
    });
    
    // Health check
    const healthCheck = new route53.CfnHealthCheck(this, 'FailoverHealthCheck', {
      healthCheckConfig: {
        type: 'HTTPS',
        fullyQualifiedDomainName: alb.loadBalancerDnsName,
        port: 443,
        resourcePath: '/health',
        requestInterval: 30,
        failureThreshold: 3
      }
    });
    
    // DNS record for regional endpoint
    const regionalDnsRecord = new route53.RecordSet(this, 'RegionalDnsRecord', {
      zone: hostedZone,
      recordName: isPrimary ? `primary.${domainName}` : `dr.${domainName}`,
      target: route53.RecordTarget.fromAlias(
        new targets.LoadBalancerTarget(alb)
      ),
      recordType: route53.RecordType.A
    });
    
    // DNS failover record
    if (isPrimary) {
      // Only create in primary region
      const failoverRecord = new route53.CfnRecordSet(this, 'FailoverDnsRecord', {
        hostedZoneId: hostedZone.hostedZoneId,
        name: domainName,
        type: 'A',
        aliasTarget: {
          dnsName: alb.loadBalancerDnsName,
          hostedZoneId: alb.loadBalancerCanonicalHostedZoneId,
          evaluateTargetHealth: true
        },
        failover: 'PRIMARY',
        healthCheckId: healthCheck.attrHealthCheckId,
        setIdentifier: `${id}-primary`
      });
      
      // Reference the DR region's ALB - need to get these values from DR stack
      // This would typically be done using cross-region outputs in a real scenario
      new route53.CfnRecordSet(this, 'DrFailoverDnsRecord', {
        hostedZoneId: hostedZone.hostedZoneId,
        name: domainName,
        type: 'A',
        aliasTarget: {
          dnsName: cdk.Fn.importValue(`TapStack-${props.drRegion}-AlbDnsName`),
          hostedZoneId: cdk.Fn.importValue(`TapStack-${props.drRegion}-AlbCanonicalHostedZoneId`),
          evaluateTargetHealth: true
        },
        failover: 'SECONDARY',
        healthCheckId: cdk.Fn.importValue(`TapStack-${props.drRegion}-HealthCheckId`),
        setIdentifier: `${id}-secondary`
      });
    }
    
    // Export values needed for cross-region references
    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      exportName: `${id}-AlbDnsName`
    });
    
    new cdk.CfnOutput(this, 'AlbCanonicalHostedZoneId', {
      value: alb.loadBalancerCanonicalHostedZoneId,
      exportName: `${id}-AlbCanonicalHostedZoneId`
    });
    
    new cdk.CfnOutput(this, 'HealthCheckId', {
      value: healthCheck.attrHealthCheckId,
      exportName: `${id}-HealthCheckId`
    });
  }
}
```

I've fixed the ordering in the lib/tap-stack.ts file to ensure the database cluster is defined before the secret rotation. I've also simplified the bin/tap.ts file by removing the `crossRegionReferences` property which isn't actually a valid property for the stack props.

Now let's finalize our three files:

1. bin/tap.ts
2. lib/tap-stack.ts
3. cdk.json
### Answer 
---

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const deploymentRegion = app.node.tryGetContext('region') || 'us-east-1';
const isPrimary = deploymentRegion === 'us-east-1';
const drRegion = 'eu-west-1';
const primaryRegion = 'us-east-1';

new TapStack(app, `TapStack-${deploymentRegion}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: deploymentRegion
  },
  description: `Payment Processing Stack in ${deploymentRegion} (${isPrimary ? 'Primary' : 'DR'})`,
  isPrimary: isPrimary,
  primaryRegion: primaryRegion,
  drRegion: drRegion
});
```

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';

export interface TapStackProps extends StackProps {
  isPrimary: boolean;
  primaryRegion: string;
  drRegion: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const isPrimary = props.isPrimary;
    const domainName = this.node.tryGetContext('domain-name') || 'payments.example.com';
    const pciS3BucketName = this.node.tryGetContext('pci-s3-bucket-name') || 'pci-payments-data';
    
    const vpc = new ec2.Vpc(this, 'PaymentVPC', {
      cidr: this.node.tryGetContext('vpc-cidr') || '10.0.0.0/16',
      maxAzs: 3,
      natGateways: 3,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24
        }
      ]
    });
    
    const albSg = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security group for the application load balancer'
    });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS traffic from anywhere');
    
    const ecsSg = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      vpc,
      description: 'Security group for the ECS tasks'
    });
    ecsSg.addIngressRule(albSg, ec2.Port.tcp(8080), 'Allow traffic from ALB on container port');
    
    const dbSg = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for the Aurora database'
    });
    dbSg.addIngressRule(ecsSg, ec2.Port.tcp(this.node.tryGetContext('db-port') || 5432), 'Allow traffic from ECS tasks');
    
    vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3
    });
    
    vpc.addInterfaceEndpoint('ECRDkrEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
      securityGroups: [ecsSg]
    });
    
    vpc.addInterfaceEndpoint('ECRApiEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
      securityGroups: [ecsSg]
    });
    
    vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      securityGroups: [ecsSg]
    });
    
    vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      securityGroups: [ecsSg]
    });
    
    const dbCredentialsSecret = new secretsmanager.Secret(this, 'DBCredentials', {
      secretName: `${id}-db-credentials`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: this.node.tryGetContext('db-username') || 'paymentadmin',
        }),
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: 'password'
      },
      removalPolicy: RemovalPolicy.RETAIN
    });
    
    const dbParameterGroup = new rds.ParameterGroup(this, 'DBParameterGroup', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_13_7
      }),
      parameters: {
        'rds.force_ssl': '1'
      }
    });
    
    const databaseCluster = new rds.DatabaseCluster(this, 'PaymentDatabase', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_13_7
      }),
      credentials: rds.Credentials.fromSecret(dbCredentialsSecret),
      instanceProps: {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.MEDIUM),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        },
        vpc,
        securityGroups: [dbSg]
      },
      instances: 2,
      parameterGroup: dbParameterGroup,
      storageEncrypted: true,
      backup: {
        retention: Duration.days(this.node.tryGetContext('db-backup-retention-days') || 35)
      },
      deletionProtection: true,
      removalPolicy: RemovalPolicy.SNAPSHOT,
      defaultDatabaseName: this.node.tryGetContext('db-name') || 'payments',
      cloudwatchLogsExports: ['postgresql']
    });
    
    new secretsmanager.SecretRotation(this, 'DBCredentialRotation', {
      secret: dbCredentialsSecret,
      application: secretsmanager.SecretRotationApplication.POSTGRES_ROTATION_SINGLE_USER,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      securityGroup: ecsSg,
      target: databaseCluster,
      automaticallyAfter: Duration.days(30)
    });
    
    const certificate = new acm.Certificate(this, 'PaymentCertificate', {
      domainName: domainName,
      validation: acm.CertificateValidation.fromDns(),
    });
    
    const alb = new elbv2.ApplicationLoadBalancer(this, 'PaymentALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSg,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC }
    });
    
    const httpsListener = alb.addListener('HttpsListener', {
      port: 443,
      certificates: [certificate],
      protocol: elbv2.ApplicationProtocol.HTTPS,
      sslPolicy: elbv2.SslPolicy.RECOMMENDED
    });
    
    alb.addListener('HttpListener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.redirect({
        port: '443',
        protocol: 'HTTPS',
        permanent: true
      })
    });
    
    const wafAcl = new wafv2.CfnWebACL(this, 'PaymentWAF', {
      defaultAction: { allow: {} },
      scope: 'REGIONAL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'PaymentWAF',
        sampledRequestsEnabled: true
      },
      rules: [
        {
          name: 'APIRateLimit',
          priority: 0,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: this.node.tryGetContext('waf-rate-limit') || 2000,
              aggregateKeyType: 'IP'
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'APIRateLimit',
            sampledRequestsEnabled: true
          }
        },
        {
          name: 'SQLiRule',
          priority: 1,
          action: { block: {} },
          statement: {
            managedRuleGroupStatement: {
              name: 'AWSManagedRulesSQLiRuleSet',
              vendorName: 'AWS'
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLiRule',
            sampledRequestsEnabled: true
          }
        }
      ]
    });
    
    new wafv2.CfnWebACLAssociation(this, 'PaymentWafAssociation', {
      resourceArn: alb.loadBalancerArn,
      webAclArn: wafAcl.attrArn
    });
    
    const pciBucket = new s3.Bucket(this, 'PCIDataBucket', {
      bucketName: `${pciS3BucketName}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN,
      enforceSSL: true
    });
    
    const permissionsBoundary = new iam.ManagedPolicy(this, 'TaskPermissionsBoundary', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:ListBucket'
          ],
          resources: [
            pciBucket.bucketArn,
            `${pciBucket.bucketArn}/*`
          ]
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'secretsmanager:GetSecretValue',
            'secretsmanager:DescribeSecret'
          ],
          resources: [
            dbCredentialsSecret.secretArn
          ]
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'cloudwatch:PutMetricData'
          ],
          resources: ['*']
        })
      ]
    });
    
    const taskRole = new iam.Role(this, 'EcsTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role for Payment Processing ECS Tasks',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
      ]
    });
    
    taskRole.permissionsBoundary = permissionsBoundary;
    
    pciBucket.grantReadWrite(taskRole);
    
    dbCredentialsSecret.grantRead(taskRole);
    
    const taskExecutionRole = new iam.Role(this, 'EcsTaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
      ]
    });
    
    const cluster = new ecs.Cluster(this, 'PaymentCluster', {
      vpc,
      containerInsights: true
    });
    
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'PaymentTaskDef', {
      memoryLimitMiB: this.node.tryGetContext('container-memory') || 2048,
      cpu: this.node.tryGetContext('container-cpu') || 1024,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.ARM64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX
      },
      taskRole: taskRole,
      executionRole: taskExecutionRole
    });
    
    const containerImage = this.node.tryGetContext('container-image') || 'account-id.dkr.ecr.region.amazonaws.com/payments:latest';
    const container = taskDefinition.addContainer('PaymentContainer', {
      image: ecs.ContainerImage.fromRegistry(containerImage),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'payment-service',
        logRetention: logs.RetentionDays.TWO_WEEKS
      }),
      environment: {
        DATABASE_HOST: databaseCluster.clusterEndpoint.hostname,
        DATABASE_PORT: databaseCluster.clusterEndpoint.port.toString(),
        DATABASE_NAME: this.node.tryGetContext('db-name') || 'payments',
        AWS_REGION: this.region,
        S3_BUCKET_NAME: pciBucket.bucketName
      },
      secrets: {
        DATABASE_CREDENTIALS: ecs.Secret.fromSecretsManager(dbCredentialsSecret)
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:8080/health || exit 1'],
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        retries: 3,
        startPeriod: Duration.seconds(60)
      }
    });
    
    container.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP
    });
    
    const blueTargetGroup = new elbv2.ApplicationTargetGroup(this, 'BlueTargetGroup', {
      vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: Duration.seconds(30),
        healthyHttpCodes: '200',
        timeout: Duration.seconds(5)
      }
    });
    
    const greenTargetGroup = new elbv2.ApplicationTargetGroup(this, 'GreenTargetGroup', {
      vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: Duration.seconds(30),
        healthyHttpCodes: '200',
        timeout: Duration.seconds(5)
      }
    });
    
    httpsListener.addTargetGroups('BlueTarget', {
      targetGroups: [blueTargetGroup],
      priority: 1,
      conditions: [
        elbv2.ListenerCondition.pathPatterns(['/*'])
      ]
    });
    
    const blueService = new ecs.FargateService(this, 'PaymentService', {
      cluster,
      taskDefinition,
      securityGroups: [ecsSg],
      desiredCount: this.node.tryGetContext('desired-tasks') || 3,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      assignPublicIp: false,
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 1
        }
      ],
      circuitBreaker: { rollback: true },
      enableExecuteCommand: true
    });
    
    blueService.attachToApplicationTargetGroup(blueTargetGroup);
    
    const scaling = blueService.autoScaleTaskCount({
      minCapacity: this.node.tryGetContext('desired-tasks') || 3,
      maxCapacity: this.node.tryGetContext('max-tasks') || 10
    });
    
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60)
    });
    
    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60)
    });
    
    const http5xxMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'HTTPCode_Target_5XX_Count',
      dimensions: {
        LoadBalancer: alb.loadBalancerFullName,
        TargetGroup: blueTargetGroup.targetGroupFullName
      },
      statistic: 'Sum',
      period: Duration.minutes(1)
    });
    
    const requestCountMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'RequestCount',
      dimensions: {
        LoadBalancer: alb.loadBalancerFullName,
        TargetGroup: blueTargetGroup.targetGroupFullName
      },
      statistic: 'Sum',
      period: Duration.minutes(1)
    });
    
    const http5xxAlarm = new cloudwatch.MathExpression({
      expression: '(m1/m2)*100',
      usingMetrics: {
        m1: http5xxMetric,
        m2: requestCountMetric
      },
      period: Duration.minutes(1)
    }).createAlarm(this, 'Http5xxAlarm', {
      threshold: 1,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      alarmDescription: 'HTTP 5XX errors exceeded 1%',
      alarmName: `${id}-5xx-error-rate`,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });
    
    const transactionLatencyMetric = new cloudwatch.Metric({
      namespace: 'PaymentService',
      metricName: 'TransactionLatency',
      dimensions: {
        Service: 'PaymentProcessing'
      },
      statistic: 'Average',
      period: Duration.minutes(1)
    });
    
    const latencyAlarm = transactionLatencyMetric.createAlarm(this, 'LatencyAlarm', {
      threshold: 500,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      alarmDescription: 'Transaction latency exceeded 500ms',
      alarmName: `${id}-transaction-latency`,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });
    
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domainName.split('.').slice(-2).join('.')
    });
    
    const healthCheck = new route53.CfnHealthCheck(this, 'FailoverHealthCheck', {
      healthCheckConfig: {
        type: 'HTTPS',
        fullyQualifiedDomainName: alb.loadBalancerDnsName,
        port: 443,
        resourcePath: '/health',
        requestInterval: 30,
        failureThreshold: 3
      }
    });
    
    const regionalDnsRecord = new route53.RecordSet(this, 'RegionalDnsRecord', {
      zone: hostedZone,
      recordName: isPrimary ? `primary.${domainName}` : `dr.${domainName}`,
      target: route53.RecordTarget.fromAlias(
        new targets.LoadBalancerTarget(alb)
      ),
      recordType: route53.RecordType.A
    });
    
    if (isPrimary) {
      const failoverRecord = new route53.CfnRecordSet(this, 'FailoverDnsRecord', {
        hostedZoneId: hostedZone.hostedZoneId,
        name: domainName,
        type: 'A',
        aliasTarget: {
          dnsName: alb.loadBalancerDnsName,
          hostedZoneId: alb.loadBalancerCanonicalHostedZoneId,
          evaluateTargetHealth: true
        },
        failover: 'PRIMARY',
        healthCheckId: healthCheck.attrHealthCheckId,
        setIdentifier: `${id}-primary`
      });
      
      new route53.CfnRecordSet(this, 'DrFailoverDnsRecord', {
        hostedZoneId: hostedZone.hostedZoneId,
        name: domainName,
        type: 'A',
        aliasTarget: {
          dnsName: cdk.Fn.importValue(`TapStack-${props.drRegion}-AlbDnsName`),
          hostedZoneId: cdk.Fn.importValue(`TapStack-${props.drRegion}-AlbCanonicalHostedZoneId`),
          evaluateTargetHealth: true
        },
        failover: 'SECONDARY',
        healthCheckId: cdk.Fn.importValue(`TapStack-${props.drRegion}-HealthCheckId`),
        setIdentifier: `${id}-secondary`
      });
    }
    
    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      exportName: `${id}-AlbDnsName`
    });
    
    new cdk.CfnOutput(this, 'AlbCanonicalHostedZoneId', {
      value: alb.loadBalancerCanonicalHostedZoneId,
      exportName: `${id}-AlbCanonicalHostedZoneId`
    });
    
    new cdk.CfnOutput(this, 'HealthCheckId', {
      value: healthCheck.attrHealthCheckId,
      exportName: `${id}-HealthCheckId`
    });
  }
}
```

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "vpc-cidr": "10.0.0.0/16",
    "domain-name": "payments.example.com",
    "pci-s3-bucket-name": "pci-payments-data",
    "container-image": "account-id.dkr.ecr.region.amazonaws.com/payments:latest",
    "container-cpu": 1024,
    "container-memory": 2048,
    "desired-tasks": 3,
    "max-tasks": 10,
    "db-username": "paymentadmin",
    "db-port": 5432,
    "db-name": "payments",
    "db-backup-retention-days": 35,
    "waf-rate-limit": 2000
  }
}
```