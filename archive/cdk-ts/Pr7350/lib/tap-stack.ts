import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
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
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';

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

    // 🔹 Configuration from context with defaults
    const domainName =
      this.node.tryGetContext('domainName') || 'payments.example.com';
    const certificateArn = this.node.tryGetContext('certificateArn');
    const opsEmailAddress =
      this.node.tryGetContext('opsEmail') || 'ops@example.com';
    const containerImageUri =
      this.node.tryGetContext('containerImageUri') || 'nginx:alpine'; // Use nginx as placeholder - it runs a web server and responds on port 80

    // 🔹 KMS Keys for Encryption
    const vpcFlowLogKey = new kms.Key(this, 'VpcFlowLogKey', {
      enableKeyRotation: true,
      description: 'KMS key for VPC flow logs encryption',
      alias: `payment-dashboard-${environmentSuffix}/vpc-flow-logs`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Grant CloudWatch Logs permission to use the key for VPC Flow Logs
    vpcFlowLogKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Allow CloudWatch Logs to use the key',
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
      })
    );

    const dbEncryptionKey = new kms.Key(this, 'DbEncryptionKey', {
      enableKeyRotation: true,
      description: 'KMS key for Aurora database encryption',
      alias: `payment-dashboard-${environmentSuffix}/aurora`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const s3EncryptionKey = new kms.Key(this, 'S3EncryptionKey', {
      enableKeyRotation: true,
      description: 'KMS key for S3 bucket encryption',
      alias: `payment-dashboard-${environmentSuffix}/s3`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 🔹 VPC & Flow Logs
    // Allow configuring NAT gateways (default: 1 to save EIPs, can be increased for HA)
    const natGateways = this.node.tryGetContext('natGateways') ?? 1;
    const vpc = new ec2.Vpc(this, 'PaymentVpc', {
      maxAzs: 3,
      natGateways: natGateways,
      cidr: '10.0.0.0/16',
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
      flowLogs: {
        VpcFlowLogs: {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(
            new logs.LogGroup(this, 'VpcFlowLogGroup', {
              encryptionKey: vpcFlowLogKey,
              retention: logs.RetentionDays.ONE_MONTH,
              removalPolicy: cdk.RemovalPolicy.DESTROY,
            })
          ),
          trafficType: ec2.FlowLogTrafficType.ALL,
        },
      },
    });

    // 🔹 VPC Endpoints (optional - disabled by default to avoid limit issues, enable via context if needed)
    const enableVpcEndpoints =
      this.node.tryGetContext('enableVpcEndpoints') === true;
    if (enableVpcEndpoints) {
      vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
        service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      });

      vpc.addInterfaceEndpoint('SsmEndpoint', {
        service: ec2.InterfaceVpcEndpointAwsService.SSM,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      });

      vpc.addInterfaceEndpoint('SsmMessagesEndpoint', {
        service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      });

      vpc.addInterfaceEndpoint('Ec2MessagesEndpoint', {
        service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      });

      vpc.addGatewayEndpoint('S3Endpoint', {
        service: ec2.GatewayVpcEndpointAwsService.S3,
        subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
      });
    }

    // 🔹 Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet'
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet (redirect to HTTPS)'
    );

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      vpc,
      description: 'Security group for ECS Fargate tasks',
      allowAllOutbound: false,
    });
    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80), // nginx listens on port 80
      'Allow traffic from ALB'
    );

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc,
      description: 'Security group for Aurora database',
      allowAllOutbound: false,
    });
    dbSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL from ECS tasks'
    );

    // Allow outbound for ECS tasks
    ecsSecurityGroup.addEgressRule(
      dbSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow connection to Aurora'
    );
    ecsSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS for AWS APIs'
    );
    albSecurityGroup.addEgressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(80), // nginx listens on port 80
      'Allow traffic to ECS tasks'
    );

    // 🔹 Aurora Cluster
    const dbCredentials = new secretsmanager.Secret(this, 'DbCredentials', {
      description: 'Aurora MySQL admin credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
    });

    new secretsmanager.RotationSchedule(this, 'DbCredentialsRotation', {
      secret: dbCredentials,
      hostedRotation: secretsmanager.HostedRotation.mysqlSingleUser(),
      automaticallyAfter: cdk.Duration.days(30),
    });

    const dbCluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_04_0,
      }),
      credentials: rds.Credentials.fromSecret(dbCredentials),
      instanceProps: {
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MEDIUM // Minimum supported for Aurora MySQL
        ),
        securityGroups: [dbSecurityGroup],
      },
      instances: 1, // Minimal: single instance for dev/test
      storageEncrypted: true,
      storageEncryptionKey: dbEncryptionKey,
      backup: {
        retention: cdk.Duration.days(7), // Minimal: 7 days for dev/test
        preferredWindow: '03:00-04:00',
      },
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: false, // Set to false to allow stack deletion
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      cloudwatchLogsExports: ['error', 'general', 'slowquery', 'audit'],
      cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
    });

    // 🔹 SSM Parameters
    const apiEndpointParam = new ssm.StringParameter(this, 'ApiEndpointParam', {
      parameterName: `/payment-dashboard-${environmentSuffix}/api-endpoint`,
      stringValue: 'https://api.internal.example.com',
      description: 'Internal API endpoint',
    });

    const featureFlagsParam = new ssm.StringParameter(
      this,
      'FeatureFlagsParam',
      {
        parameterName: `/payment-dashboard-${environmentSuffix}/feature-flags`,
        stringValue: JSON.stringify({
          newPaymentFlow: true,
          advancedAnalytics: false,
        }),
        description: 'Feature flags configuration',
      }
    );

    // 🔹 ECS Cluster
    // Using auto-generated name to avoid early validation issues
    const ecsCluster = new ecs.Cluster(this, 'PaymentCluster', {
      vpc,
      containerInsights: true,
    });

    // 🔹 Task Definition
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role for payment dashboard ECS tasks',
    });

    taskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );

    taskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ssm:GetParameter',
          'ssm:GetParameters',
          'ssm:GetParametersByPath',
        ],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/payment-dashboard-${environmentSuffix}/*`,
        ],
      })
    );

    taskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [dbCredentials.secretArn],
      })
    );

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'TaskDefinition',
      {
        memoryLimitMiB: 2048, // Minimal: 2GB
        cpu: 1024, // Minimal: 1 vCPU
        taskRole,
        family: `payment-dashboard-${environmentSuffix}`,
      }
    );

    const logGroup = new logs.LogGroup(this, 'TaskLogGroup', {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const container = taskDefinition.addContainer('PaymentDashboardContainer', {
      image: ecs.ContainerImage.fromRegistry(containerImageUri),
      memoryLimitMiB: 1792, // 2048 - 256 (for X-Ray sidecar)
      cpu: 992, // 1024 - 32 (for X-Ray sidecar)
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'payment-dashboard',
        logGroup,
      }),
      environment: {
        AWS_XRAY_TRACING_NAME: 'payment-dashboard',
        _AWS_XRAY_DAEMON_ADDRESS: '127.0.0.1:2000',
        AWS_XRAY_DAEMON_ADDRESS: '127.0.0.1:2000',
        AWS_XRAY_CONTEXT_MISSING: 'LOG_ERROR',
        API_ENDPOINT_PARAM: apiEndpointParam.parameterName,
        FEATURE_FLAGS_PARAM: featureFlagsParam.parameterName,
      },
      secrets: {
        DB_CONNECTION_STRING: ecs.Secret.fromSecretsManager(
          dbCredentials,
          'password'
        ),
      },
      // Health check removed for minimal config - placeholder image doesn't have /health endpoint
    });

    container.addPortMappings({
      containerPort: 80, // nginx listens on port 80 by default
      protocol: ecs.Protocol.TCP,
    });

    // Add X-Ray sidecar
    taskDefinition.addContainer('XRaySidecar', {
      image: ecs.ContainerImage.fromRegistry(
        'public.ecr.aws/xray/aws-xray-daemon:latest'
      ),
      memoryReservationMiB: 256,
      cpu: 32,
      portMappings: [
        {
          containerPort: 2000,
          protocol: ecs.Protocol.UDP,
        },
      ],
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'xray',
        logGroup,
      }),
    });

    // 🔹 Application Load Balancer
    // Using auto-generated name to avoid early validation issues
    const alb = new elbv2.ApplicationLoadBalancer(this, 'PaymentAlb', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      internetFacing: true,
      securityGroup: albSecurityGroup,
    });

    alb.setAttribute('routing.http2.enabled', 'true');
    alb.setAttribute('idle_timeout.timeout_seconds', '60');

    // 🔹 ALB Access Logs S3 Bucket
    // Using auto-generated name to avoid conflicts
    const albLogsBucket = new s3.Bucket(this, 'AlbLogsBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'delete-old-logs',
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    // Grant ALB permission to write logs
    // AWS Log Delivery service needs PutObject and GetBucketAcl permissions
    albLogsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSLogDeliveryWrite',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('delivery.logs.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${albLogsBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
          },
        },
      })
    );

    // Grant AWS Log Delivery service permission to check bucket ACL
    albLogsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSLogDeliveryAclCheck',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('delivery.logs.amazonaws.com')],
        actions: ['s3:GetBucketAcl'],
        resources: [albLogsBucket.bucketArn],
      })
    );

    // Grant ELB service account permission (region-specific AWS managed account)
    // ELB service account IDs by region
    const elbServiceAccountIds: { [key: string]: string } = {
      'us-east-1': '127311923021',
      'us-east-2': '033677994240',
      'us-west-1': '027434742980',
      'us-west-2': '797873946194',
      'eu-west-1': '156460612806',
      'eu-west-2': '652711504416',
      'eu-west-3': '009996457667',
      'eu-central-1': '054676820928',
      'ap-northeast-1': '582318560864',
      'ap-northeast-2': '600734575887',
      'ap-southeast-1': '114774131450',
      'ap-southeast-2': '783225319266',
      'ap-south-1': '718504428378',
      'sa-east-1': '507241528517',
      'ca-central-1': '985666609251',
    };

    const elbServiceAccountId = elbServiceAccountIds[this.region];
    if (elbServiceAccountId) {
      albLogsBucket.addToResourcePolicy(
        new iam.PolicyStatement({
          sid: 'ELBAccessLogWrite',
          effect: iam.Effect.ALLOW,
          principals: [new iam.AccountPrincipal(elbServiceAccountId)],
          actions: ['s3:PutObject'],
          resources: [`${albLogsBucket.bucketArn}/*`],
          conditions: {
            StringEquals: {
              's3:x-amz-acl': 'bucket-owner-full-control',
            },
          },
        })
      );

      albLogsBucket.addToResourcePolicy(
        new iam.PolicyStatement({
          sid: 'ELBAccessLogAclCheck',
          effect: iam.Effect.ALLOW,
          principals: [new iam.AccountPrincipal(elbServiceAccountId)],
          actions: ['s3:GetBucketAcl'],
          resources: [albLogsBucket.bucketArn],
        })
      );
    }

    // Enable ALB access logs
    alb.setAttribute('access_logs.s3.enabled', 'true');
    alb.setAttribute('access_logs.s3.bucket', albLogsBucket.bucketName);
    alb.setAttribute('access_logs.s3.prefix', 'alb-access-logs');

    // Only create certificate reference if a valid ARN is provided
    const certificate =
      certificateArn && certificateArn.trim() !== ''
        ? acm.Certificate.fromCertificateArn(
            this,
            'AlbCertificate',
            certificateArn.trim()
          )
        : undefined;

    // 🔹 ECS Service
    const ecsService = new ecs.FargateService(this, 'PaymentService', {
      cluster: ecsCluster,
      taskDefinition,
      desiredCount: 1, // Minimal: single task for dev/test
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [ecsSecurityGroup],
      assignPublicIp: false,
      healthCheckGracePeriod: cdk.Duration.minutes(30), // Extended for minimal config - placeholder image may not have health endpoint
      enableECSManagedTags: true,
      propagateTags: ecs.PropagatedTagSource.TASK_DEFINITION,
      // Using default ECS deployment (removed CodeDeploy for simplicity)
    });

    // Simple target group (removed blue/green for simplicity)
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      port: 80, // nginx listens on port 80
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/', // nginx responds on root path
        protocol: elbv2.Protocol.HTTP,
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        healthyHttpCodes: '200', // nginx returns 200 on root path
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    ecsService.attachToApplicationTargetGroup(targetGroup);

    // HTTPS Listener
    if (certificate) {
      alb.addListener('HttpsListener', {
        port: 443,
        certificates: [certificate],
        defaultTargetGroups: [targetGroup],
        sslPolicy: elbv2.SslPolicy.TLS13_RES,
      });
    } else {
      alb.addListener('HttpsListener', {
        port: 443,
        defaultTargetGroups: [targetGroup],
        protocol: elbv2.ApplicationProtocol.HTTP,
      });
    }

    // HTTP Listener (redirect to HTTPS only if certificate is available)
    if (certificate) {
      alb.addListener('HttpListener', {
        port: 80,
        defaultAction: elbv2.ListenerAction.redirect({
          protocol: 'HTTPS',
          port: '443',
          permanent: true,
        }),
      });
    } else {
      // If no certificate, HTTP listener serves traffic directly
      alb.addListener('HttpListener', {
        port: 80,
        defaultTargetGroups: [targetGroup],
      });
    }

    // 🔹 AWS WAF
    const wafWebAcl = new wafv2.CfnWebACL(this, 'PaymentWafAcl', {
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `payment-waf-metric-${environmentSuffix}`,
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              aggregateKeyType: 'IP',
              limit: 2000,
            },
          },
          action: { block: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'rate-limit-rule',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'sql-injection-rule',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 3,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'known-bad-inputs-rule',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'XSSProtectionRule',
          priority: 4,
          statement: {
            xssMatchStatement: {
              fieldToMatch: {
                body: {
                  oversizeHandling: 'CONTINUE',
                },
              },
              textTransformations: [
                {
                  priority: 0,
                  type: 'URL_DECODE',
                },
                {
                  priority: 1,
                  type: 'HTML_ENTITY_DECODE',
                },
              ],
            },
          },
          action: { block: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'xss-protection-rule',
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    new wafv2.CfnWebACLAssociation(this, 'WafAlbAssociation', {
      resourceArn: alb.loadBalancerArn,
      webAclArn: wafWebAcl.attrArn,
    });

    // 🔹 Auto Scaling (minimal for dev/test)
    const scalableTarget = ecsService.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 2,
    });

    scalableTarget.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scalableTarget.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // 🔹 CloudFront + S3
    // Using auto-generated name to avoid conflicts
    const staticAssetsBucket = new s3.Bucket(this, 'StaticAssetsBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3EncryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
      ],
      serverAccessLogsPrefix: 'access-logs/',
    });

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'OAI',
      {
        comment: 'Payment Dashboard OAI',
      }
    );

    staticAssetsBucket.grantRead(originAccessIdentity);

    const distribution = new cloudfront.Distribution(
      this,
      'PaymentDistribution',
      {
        defaultBehavior: {
          origin: new origins.S3Origin(staticAssetsBucket, {
            originAccessIdentity,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },
        additionalBehaviors: {
          '/api/*': {
            origin: new origins.HttpOrigin(alb.loadBalancerDnsName, {
              protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
              originSslProtocols: [cloudfront.OriginSslPolicy.TLS_V1_2],
            }),
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
            originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
          },
        },
        domainNames: certificate ? [domainName] : undefined,
        certificate: certificate,
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        enableIpv6: true,
        // Logging disabled to avoid ACL requirements
        enableLogging: false,
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        geoRestriction: cloudfront.GeoRestriction.allowlist(
          'US',
          'CA',
          'GB',
          'DE',
          'JP'
        ),
      }
    );

    // 🔹 SNS Topics
    // Using auto-generated name to avoid early validation issues
    const criticalAlertsTopic = new sns.Topic(this, 'CriticalAlertsTopic', {
      displayName: 'Payment Dashboard Critical Alerts',
    });

    criticalAlertsTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(opsEmailAddress)
    );

    // 🔹 CloudWatch Alarms
    const unhealthyHostAlarm = new cloudwatch.Alarm(
      this,
      'UnhealthyHostAlarm',
      {
        metric: targetGroup.metricUnhealthyHostCount(),
        threshold: 1,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      }
    );

    const high5xxAlarm = new cloudwatch.Alarm(this, 'High5xxAlarm', {
      metric: targetGroup.metricHttpCodeTarget(
        elbv2.HttpCodeTarget.TARGET_5XX_COUNT,
        { period: cdk.Duration.minutes(1) }
      ),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const highLatencyAlarm = new cloudwatch.Alarm(this, 'HighLatencyAlarm', {
      metric: targetGroup.metricTargetResponseTime({
        period: cdk.Duration.minutes(1),
        statistic: 'p99',
      }),
      threshold: 2,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      metric: ecsService.metricCpuUtilization(),
      threshold: 85,
      evaluationPeriods: 2,
    });

    const memoryAlarm = new cloudwatch.Alarm(this, 'HighMemoryAlarm', {
      metric: ecsService.metricMemoryUtilization(),
      threshold: 90,
      evaluationPeriods: 2,
    });

    [
      unhealthyHostAlarm,
      high5xxAlarm,
      highLatencyAlarm,
      cpuAlarm,
      memoryAlarm,
    ].forEach(alarm => {
      alarm.addAlarmAction(
        new cloudwatchActions.SnsAction(criticalAlertsTopic)
      );
    });

    // 🔹 CloudWatch Dashboard
    // Using auto-generated name to avoid early validation issues
    const dashboard = new cloudwatch.Dashboard(this, 'PaymentDashboard');

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Transaction Processing Latency',
        left: [
          targetGroup.metricTargetResponseTime({
            statistic: 'p50',
            label: 'p50',
          }),
          targetGroup.metricTargetResponseTime({
            statistic: 'p90',
            label: 'p90',
          }),
          targetGroup.metricTargetResponseTime({
            statistic: 'p99',
            label: 'p99',
          }),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Error Rates',
        left: [
          targetGroup.metricHttpCodeTarget(
            elbv2.HttpCodeTarget.TARGET_4XX_COUNT
          ),
          targetGroup.metricHttpCodeTarget(
            elbv2.HttpCodeTarget.TARGET_5XX_COUNT
          ),
        ],
        width: 12,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ECS Service Metrics',
        left: [ecsService.metricCpuUtilization()],
        right: [ecsService.metricMemoryUtilization()],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Task Count',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ECS',
            metricName: 'DesiredTaskCount',
            dimensionsMap: {
              ClusterName: ecsCluster.clusterName,
              ServiceName: ecsService.serviceName,
            },
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/ECS',
            metricName: 'RunningTaskCount',
            dimensionsMap: {
              ClusterName: ecsCluster.clusterName,
              ServiceName: ecsService.serviceName,
            },
          }),
        ],
        width: 12,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Database Connections',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'DatabaseConnections',
            dimensionsMap: {
              DBClusterIdentifier: dbCluster.clusterIdentifier,
            },
          }),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Database CPU',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'CPUUtilization',
            dimensionsMap: {
              DBClusterIdentifier: dbCluster.clusterIdentifier,
            },
          }),
        ],
        width: 12,
      })
    );

    // Security Hub removed - account is already subscribed

    // 🔹 Outputs
    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront distribution URL',
    });

    new cdk.CfnOutput(this, 'AuroraClusterEndpoint', {
      value: dbCluster.clusterEndpoint.hostname,
      description: 'Aurora cluster endpoint',
    });

    new cdk.CfnOutput(this, 'WafWebAclArn', {
      value: wafWebAcl.attrArn,
      description: 'WAF WebACL ARN',
    });

    new cdk.CfnOutput(this, 'EcsClusterName', {
      value: ecsCluster.clusterName,
      description: 'ECS cluster name',
    });

    new cdk.CfnOutput(this, 'CriticalAlertsTopicArn', {
      value: criticalAlertsTopic.topicArn,
      description: 'SNS topic for critical alerts',
    });
  }
}
