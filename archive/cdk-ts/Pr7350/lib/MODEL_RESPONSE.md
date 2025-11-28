### Reasoning Trace
---

This is a comprehensive request for a PCI-DSS grade payment processing infrastructure using AWS CDK v2 in TypeScript. Let me break down the requirements:

1. **VPC Architecture**:
   - 3-tier architecture (public, private, isolated) across 3 AZs
   - Flow logs enabled to CloudWatch
   - VPC endpoints for S3, Secrets Manager, and Systems Manager

2. **ECS Fargate Service**:
   - Payment dashboard container with 4 vCPU, 8GB memory
   - Deployed in private subnets
   - Auto-scaling (min 3, max 12) based on CPU (70%) and memory (80%)

3. **Application Load Balancer**:
   - HTTPS listeners with ACM certificates
   - AWS WAF integration with SQL injection and XSS protection
   - Public subnets

4. **Aurora MySQL**:
   - Multi-AZ deployment
   - Encryption enabled
   - 35-day backup retention
   - Isolated subnets
   - Secrets Manager rotation (30 days)

5. **Static Content**:
   - CloudFront distribution
   - S3 bucket with Origin Access Identity
   - HTTPS only

6. **Monitoring & Observability**:
   - X-Ray tracing across the stack
   - CloudWatch dashboards with custom metrics
   - SNS alerts for critical events
   - CloudWatch alarms

7. **Deployment**:
   - CodeDeploy blue-green deployments
   - Automatic rollback on alarms

8. **Security**:
   - GuardDuty enabled
   - Security Hub enabled
   - Least privilege IAM
   - No wildcard permissions

9. **Configuration**:
   - SSM Parameter Store for config
   - Secrets Manager for sensitive data

10. **Tagging**:
    - Comprehensive tagging strategy for compliance and cost tracking

Now, I'll create the two files: `main.ts` and `tapstack.ts`.


I'll set up the core application entry point and infrastructure stack to ensure a robust, secure payment processing environment. The implementation will focus on modular design, leveraging AWS best practices for cloud infrastructure.

The `main.ts` will serve as the central configuration hub, initializing environment-specific settings and establishing a consistent tagging approach. I'll implement a flexible framework that supports multiple deployment scenarios while maintaining strict security controls.

The `tapstack.ts` will orchestrate the complex infrastructure components, carefully integrating networking, compute, database, and security services to create a comprehensive PCI-DSS compliant solution.
### Answer 
---

```typescript
// main.ts
import { App, Environment, Tags } from 'aws-cdk-lib';
import { PaymentDashboardStack } from './tapstack';

const app = new App();

// 🔹 Environment Configuration
const env: Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
  region: 'us-east-1'
};

// 🔹 Stack Configuration
const stackConfig = {
  domainName: app.node.tryGetContext('domainName') || 'payments.example.com',
  certificateArn: app.node.tryGetContext('certificateArn') || '',
  opsEmailAddress: app.node.tryGetContext('opsEmail') || 'ops@example.com',
  containerImageUri: app.node.tryGetContext('containerImageUri') || 'public.ecr.aws/amazonlinux/amazonlinux:latest'
};

// 🔹 Create Main Stack
const paymentStack = new PaymentDashboardStack(app, 'PaymentDashboardStack', {
  env,
  description: 'PCI-DSS compliant payment processing dashboard infrastructure',
  terminationProtection: true,
  ...stackConfig
});

// 🔹 Apply Global Tags
Tags.of(app).add('Environment', 'Production');
Tags.of(app).add('Project', 'PaymentDashboard');
Tags.of(app).add('CostCenter', 'FinTech-001');
Tags.of(app).add('Compliance', 'PCI-DSS');
Tags.of(app).add('ManagedBy', 'CDK');
Tags.of(app).add('Owner', 'Platform-Team');
Tags.of(app).add('DataClassification', 'Sensitive');
```

```typescript
// tapstack.ts
import { Stack, StackProps, CfnOutput, Duration, RemovalPolicy, Aws } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as autoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as securityhub from 'aws-cdk-lib/aws-securityhub';
import { Construct } from 'constructs';

export interface PaymentDashboardStackProps extends StackProps {
  domainName: string;
  certificateArn: string;
  opsEmailAddress: string;
  containerImageUri: string;
}

export class PaymentDashboardStack extends Stack {
  constructor(scope: Construct, id: string, props: PaymentDashboardStackProps) {
    super(scope, id, props);

    // 🔹 KMS Keys for Encryption
    const vpcFlowLogKey = new kms.Key(this, 'VpcFlowLogKey', {
      enableKeyRotation: true,
      description: 'KMS key for VPC flow logs encryption',
      alias: 'payment-dashboard/vpc-flow-logs',
      removalPolicy: RemovalPolicy.RETAIN
    });

    const dbEncryptionKey = new kms.Key(this, 'DbEncryptionKey', {
      enableKeyRotation: true,
      description: 'KMS key for Aurora database encryption',
      alias: 'payment-dashboard/aurora',
      removalPolicy: RemovalPolicy.RETAIN
    });

    const s3EncryptionKey = new kms.Key(this, 'S3EncryptionKey', {
      enableKeyRotation: true,
      description: 'KMS key for S3 bucket encryption',
      alias: 'payment-dashboard/s3',
      removalPolicy: RemovalPolicy.RETAIN
    });

    // 🔹 VPC & Flow Logs
    const vpc = new ec2.Vpc(this, 'PaymentVpc', {
      maxAzs: 3,
      natGateways: 3,
      cidr: '10.0.0.0/16',
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
      ],
      flowLogs: {
        'VpcFlowLogs': {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(
            new logs.LogGroup(this, 'VpcFlowLogGroup', {
              encryptionKey: vpcFlowLogKey,
              retention: logs.RetentionDays.THIRTY_DAYS,
              removalPolicy: RemovalPolicy.RETAIN
            })
          ),
          trafficType: ec2.FlowLogTrafficType.ALL
        }
      }
    });

    // 🔹 VPC Endpoints
    vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }
    });

    vpc.addInterfaceEndpoint('SsmEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }
    });

    vpc.addInterfaceEndpoint('SsmMessagesEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }
    });

    vpc.addInterfaceEndpoint('Ec2MessagesEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }
    });

    vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }]
    });

    // 🔹 Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false
    });
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS from internet');
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP from internet (redirect to HTTPS)');

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      vpc,
      description: 'Security group for ECS Fargate tasks',
      allowAllOutbound: false
    });
    ecsSecurityGroup.addIngressRule(albSecurityGroup, ec2.Port.tcp(8080), 'Allow traffic from ALB');

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc,
      description: 'Security group for Aurora database',
      allowAllOutbound: false
    });
    dbSecurityGroup.addIngressRule(ecsSecurityGroup, ec2.Port.tcp(3306), 'Allow MySQL from ECS tasks');

    // Allow outbound for ECS tasks
    ecsSecurityGroup.addEgressRule(dbSecurityGroup, ec2.Port.tcp(3306), 'Allow connection to Aurora');
    ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS for AWS APIs');
    albSecurityGroup.addEgressRule(ecsSecurityGroup, ec2.Port.tcp(8080), 'Allow traffic to ECS tasks');

    // 🔹 Aurora Cluster
    const dbCredentials = new secretsmanager.Secret(this, 'DbCredentials', {
      description: 'Aurora MySQL admin credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32
      }
    });

    new secretsmanager.RotationSchedule(this, 'DbCredentialsRotation', {
      secret: dbCredentials,
      rotationLambda: secretsmanager.RotationSchedule.hostedRotation(
        secretsmanager.HostedRotation.mysqlSingleUser()
      ),
      automaticallyAfter: Duration.days(30)
    });

    const dbCluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_03_1
      }),
      credentials: rds.Credentials.fromSecret(dbCredentials),
      instanceProps: {
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.LARGE),
        securityGroups: [dbSecurityGroup]
      },
      instances: 2,
      storageEncrypted: true,
      storageEncryptionKey: dbEncryptionKey,
      backup: {
        retention: Duration.days(35),
        preferredWindow: '03:00-04:00'
      },
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: true,
      removalPolicy: RemovalPolicy.RETAIN,
      cloudwatchLogsExports: ['error', 'general', 'slowquery', 'audit'],
      cloudwatchLogsRetention: logs.RetentionDays.THIRTY_DAYS
    });

    // 🔹 SSM Parameters
    const apiEndpointParam = new ssm.StringParameter(this, 'ApiEndpointParam', {
      parameterName: '/payment-dashboard/api-endpoint',
      stringValue: 'https://api.internal.example.com',
      description: 'Internal API endpoint'
    });

    const featureFlagsParam = new ssm.StringParameter(this, 'FeatureFlagsParam', {
      parameterName: '/payment-dashboard/feature-flags',
      stringValue: JSON.stringify({
        newPaymentFlow: true,
        advancedAnalytics: false
      }),
      description: 'Feature flags configuration'
    });

    // 🔹 ECS Cluster
    const ecsCluster = new ecs.Cluster(this, 'PaymentCluster', {
      vpc,
      clusterName: 'payment-dashboard-cluster',
      containerInsights: true
    });

    // 🔹 Task Definition
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role for payment dashboard ECS tasks'
    });

    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'xray:PutTraceSegments',
        'xray:PutTelemetryRecords'
      ],
      resources: ['*']
    }));

    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ssm:GetParameter',
        'ssm:GetParameters',
        'ssm:GetParametersByPath'
      ],
      resources: [
        `arn:aws:ssm:${Aws.REGION}:${Aws.ACCOUNT_ID}:parameter/payment-dashboard/*`
      ]
    }));

    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'secretsmanager:GetSecretValue'
      ],
      resources: [dbCredentials.secretArn]
    }));

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
      memoryLimitMiB: 8192,
      cpu: 4096,
      taskRole,
      family: 'payment-dashboard'
    });

    const logGroup = new logs.LogGroup(this, 'TaskLogGroup', {
      retention: logs.RetentionDays.THIRTY_DAYS,
      removalPolicy: RemovalPolicy.RETAIN
    });

    const container = taskDefinition.addContainer('PaymentDashboardContainer', {
      image: ecs.ContainerImage.fromRegistry(props.containerImageUri),
      memoryLimitMiB: 8192,
      cpu: 4096,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'payment-dashboard',
        logGroup
      }),
      environment: {
        AWS_XRAY_TRACING_NAME: 'payment-dashboard',
        _AWS_XRAY_DAEMON_ADDRESS: '127.0.0.1:2000',
        AWS_XRAY_DAEMON_ADDRESS: '127.0.0.1:2000',
        AWS_XRAY_CONTEXT_MISSING: 'LOG_ERROR',
        API_ENDPOINT_PARAM: apiEndpointParam.parameterName,
        FEATURE_FLAGS_PARAM: featureFlagsParam.parameterName
      },
      secrets: {
        DB_CONNECTION_STRING: ecs.Secret.fromSecretsManager(dbCredentials, 'password')
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:8080/health || exit 1'],
        interval: Duration.seconds(30),
        timeout: Duration.seconds(10),
        retries: 3,
        startPeriod: Duration.seconds(60)
      }
    });

    container.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP
    });

    // Add X-Ray sidecar
    taskDefinition.addContainer('XRaySidecar', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/xray/aws-xray-daemon:latest'),
      memoryReservation: 256,
      cpu: 32,
      portMappings: [{
        containerPort: 2000,
        protocol: ecs.Protocol.UDP
      }],
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'xray',
        logGroup
      })
    });

    // 🔹 Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'PaymentAlb', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      internetFacing: true,
      securityGroup: albSecurityGroup,
      loadBalancerName: 'payment-dashboard-alb'
    });

    alb.setAttribute('routing.http2.enabled', 'true');
    alb.setAttribute('access_logs.s3.enabled', 'true');
    alb.setAttribute('idle_timeout.timeout_seconds', '60');

    const certificate = acm.Certificate.fromCertificateArn(
      this, 
      'AlbCertificate', 
      props.certificateArn || `arn:aws:acm:${Aws.REGION}:${Aws.ACCOUNT_ID}:certificate/placeholder`
    );

    // 🔹 ECS Service
    const ecsService = new ecs.FargateService(this, 'PaymentService', {
      cluster: ecsCluster,
      taskDefinition,
      desiredCount: 3,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [ecsSecurityGroup],
      assignPublicIp: false,
      healthCheckGracePeriod: Duration.seconds(120),
      enableECSManagedTags: true,
      propagateTags: ecs.PropagatedTagSource.TASK_DEFINITION,
      deploymentController: {
        type: ecs.DeploymentControllerType.CODE_DEPLOY
      }
    });

    // Blue target group
    const blueTargetGroup = new elbv2.ApplicationTargetGroup(this, 'BlueTargetGroup', {
      vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: Duration.seconds(30),
        timeout: Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        healthyHttpCodes: '200'
      },
      deregistrationDelay: Duration.seconds(30),
      targetGroupName: 'payment-blue'
    });

    // Green target group
    const greenTargetGroup = new elbv2.ApplicationTargetGroup(this, 'GreenTargetGroup', {
      vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: Duration.seconds(30),
        timeout: Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        healthyHttpCodes: '200'
      },
      deregistrationDelay: Duration.seconds(30),
      targetGroupName: 'payment-green'
    });

    ecsService.attachToApplicationTargetGroup(blueTargetGroup);

    // HTTPS Listener
    const httpsListener = alb.addListener('HttpsListener', {
      port: 443,
      certificates: [certificate],
      defaultTargetGroups: [blueTargetGroup],
      sslPolicy: elbv2.SslPolicy.TLS13_RES
    });

    // HTTP Listener (redirect to HTTPS)
    alb.addListener('HttpListener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true
      })
    });

    // 🔹 AWS WAF
    const wafWebAcl = new wafv2.CfnWebACL(this, 'PaymentWafAcl', {
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'payment-waf-metric',
        sampledRequestsEnabled: true
      },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              aggregateKeyType: 'IP',
              limit: 2000
            }
          },
          action: { block: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'rate-limit-rule',
            sampledRequestsEnabled: true
          }
        },
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet'
            }
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'sql-injection-rule',
            sampledRequestsEnabled: true
          }
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 3,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet'
            }
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'known-bad-inputs-rule',
            sampledRequestsEnabled: true
          }
        },
        {
          name: 'XSSProtectionRule',
          priority: 4,
          statement: {
            xssMatchStatement: {
              fieldToMatch: {
                body: {
                  oversizeHandling: 'CONTINUE'
                }
              },
              textTransformations: [{
                priority: 0,
                type: 'URL_DECODE'
              }, {
                priority: 1,
                type: 'HTML_ENTITY_DECODE'
              }]
            }
          },
          action: { block: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'xss-protection-rule',
            sampledRequestsEnabled: true
          }
        }
      ]
    });

    new wafv2.CfnWebACLAssociation(this, 'WafAlbAssociation', {
      resourceArn: alb.loadBalancerArn,
      webAclArn: wafWebAcl.attrArn
    });

    // 🔹 Auto Scaling
    const scalableTarget = ecsService.autoScaleTaskCount({
      minCapacity: 3,
      maxCapacity: 12
    });

    scalableTarget.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(300),
      scaleOutCooldown: Duration.seconds(60)
    });

    scalableTarget.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: Duration.seconds(300),
      scaleOutCooldown: Duration.seconds(60)
    });

    // 🔹 CodeDeploy Blue/Green
    const codeDeployApp = new codedeploy.EcsApplication(this, 'PaymentCodeDeployApp', {
      applicationName: 'payment-dashboard-app'
    });

    const codeDeployRole = new iam.Role(this, 'CodeDeployRole', {
      assumedBy: new iam.ServicePrincipal('codedeploy.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodeDeployRoleForECS')
      ]
    });

    const deploymentGroup = new codedeploy.EcsDeploymentGroup(this, 'PaymentDeploymentGroup', {
      application: codeDeployApp,
      deploymentGroupName: 'payment-dashboard-dg',
      service: ecsService,
      blueGreenDeploymentConfig: {
        blueTargetGroup,
        greenTargetGroup,
        listener: httpsListener,
        deploymentApprovalWaitTime: Duration.minutes(0),
        terminationWaitTime: Duration.minutes(5)
      },
      deploymentConfig: codedeploy.EcsDeploymentConfig.CANARY_10PERCENT_5MINUTES,
      role: codeDeployRole,
      autoRollback: {
        deploymentInAlarm: true,
        failedDeployment: true,
        stoppedDeployment: true
      }
    });

    // 🔹 CloudFront + S3
    const staticAssetsBucket = new s3.Bucket(this, 'StaticAssetsBucket', {
      bucketName: `payment-dashboard-static-${Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3EncryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: RemovalPolicy.RETAIN,
      lifecycleRules: [{
        id: 'delete-old-versions',
        noncurrentVersionExpiration: Duration.days(90)
      }],
      serverAccessLogsPrefix: 'access-logs/'
    });

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: 'Payment Dashboard OAI'
    });

    staticAssetsBucket.grantRead(originAccessIdentity);

    const distribution = new cloudfront.Distribution(this, 'PaymentDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(staticAssetsBucket, {
          originAccessIdentity
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(alb.loadBalancerDnsName, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            originSslProtocols: [cloudfront.OriginSslPolicy.TLS_V1_2]
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER
        }
      },
      domainNames: [props.domainName],
      certificate: certificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      enableIpv6: true,
      enableLogging: true,
      logBucket: staticAssetsBucket,
      logFilePrefix: 'cf-logs/',
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      geoRestriction: cloudfront.GeoRestriction.allowlist('US', 'CA', 'GB', 'DE', 'JP')
    });

    // 🔹 SNS Topics
    const criticalAlertsTopic = new sns.Topic(this, 'CriticalAlertsTopic', {
      displayName: 'Payment Dashboard Critical Alerts',
      topicName: 'payment-dashboard-critical'
    });

    criticalAlertsTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(props.opsEmailAddress)
    );

    // 🔹 CloudWatch Alarms
    const unhealthyHostAlarm = new cloudwatch.Alarm(this, 'UnhealthyHostAlarm', {
      metric: blueTargetGroup.metricUnhealthyHostCount(),
      threshold: 1,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING
    });

    const high5xxAlarm = new cloudwatch.Alarm(this, 'High5xxAlarm', {
      metric: blueTargetGroup.metricHttpCodeTarget(
        elbv2.HttpCodeTarget.TARGET_5XX_COUNT,
        { period: Duration.minutes(1) }
      ),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const highLatencyAlarm = new cloudwatch.Alarm(this, 'HighLatencyAlarm', {
      metric: blueTargetGroup.metricTargetResponseTime({
        period: Duration.minutes(1),
        statistic: 'p99'
      }),
      threshold: 2,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      metric: ecsService.metricCpuUtilization(),
      threshold: 85,
      evaluationPeriods: 2
    });

    const memoryAlarm = new cloudwatch.Alarm(this, 'HighMemoryAlarm', {
      metric: ecsService.metricMemoryUtilization(),
      threshold: 90,
      evaluationPeriods: 2
    });

    [unhealthyHostAlarm, high5xxAlarm, highLatencyAlarm, cpuAlarm, memoryAlarm].forEach(alarm => {
      alarm.addAlarmAction(new cloudwatchActions.SnsAction(criticalAlertsTopic));
    });

    // 🔹 CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'PaymentDashboard', {
      dashboardName: 'payment-dashboard-monitoring'
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Transaction Processing Latency',
        left: [blueTargetGroup.metricTargetResponseTime({
          statistic: 'p50',
          label: 'p50'
        }), blueTargetGroup.metricTargetResponseTime({
          statistic: 'p90',
          label: 'p90'
        }), blueTargetGroup.metricTargetResponseTime({
          statistic: 'p99',
          label: 'p99'
        })],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'Error Rates',
        left: [blueTargetGroup.metricHttpCodeTarget(elbv2.HttpCodeTarget.TARGET_4XX_COUNT), 
               blueTargetGroup.metricHttpCodeTarget(elbv2.HttpCodeTarget.TARGET_5XX_COUNT)],
        width: 12
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ECS Service Metrics',
        left: [ecsService.metricCpuUtilization()],
        right: [ecsService.metricMemoryUtilization()],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'Task Count',
        left: [ecsService.metricDesiredTaskCount(), ecsService.metricRunningTaskCount()],
        width: 12
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Database Connections',
        left: [new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'DatabaseConnections',
          dimensionsMap: {
            DBClusterIdentifier: dbCluster.clusterIdentifier
          }
        })],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'Database CPU',
        left: [new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            DBClusterIdentifier: dbCluster.clusterIdentifier
          }
        })],
        width: 12
      })
    );

    // 🔹 GuardDuty & Security Hub
    const guardDutyDetector = new guardduty.CfnDetector(this, 'GuardDutyDetector', {
      enable: true,
      findingPublishingFrequency: 'FIFTEEN_MINUTES'
    });

    const securityHub = new securityhub.CfnHub(this, 'SecurityHub', {
      tags: {
        Environment: 'Production',
        Compliance: 'PCI-DSS'
      }
    });

    new securityhub.CfnStandard(this, 'PCIDSSStandard', {
      standardsArn: `arn:aws:securityhub:${Aws.REGION}::standards/pci-dss/v/3.2.1`
    });

    new securityhub.CfnStandard(this, 'AWSFoundationalStandard', {
      standardsArn: `arn:aws:securityhub:${Aws.REGION}::standards/aws-foundational-security-best-practices/v/1.0.0`
    });

    // 🔹 Outputs
    new CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name'
    });

    new CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront distribution URL'
    });

    new CfnOutput(this, 'AuroraClusterEndpoint', {
      value: dbCluster.clusterEndpoint.hostname,
      description: 'Aurora cluster endpoint'
    });

    new CfnOutput(this, 'WafWebAclArn', {
      value: wafWebAcl.attrArn,
      description: 'WAF WebACL ARN'
    });

    new CfnOutput(this, 'EcsClusterName', {
      value: ecsCluster.clusterName,
      description: 'ECS cluster name'
    });

    new CfnOutput(this, 'CodeDeployAppName', {
      value: codeDeployApp.applicationName,
      description: 'CodeDeploy application name'
    });

    new CfnOutput(this, 'CriticalAlertsTopicArn', {
      value: criticalAlertsTopic.topicArn,
      description: 'SNS topic for critical alerts'
    });
  }
}
```