import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

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
    
    const appName = `tap-app-${environmentSuffix}`;

    // 1. Networking Layer
    // VPC with 2 AZs, public and private subnets, NAT Gateways
    const vpc = new ec2.Vpc(this, 'AppVPC', {
      vpcName: `${appName}-vpc`,
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private-app',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'private-db',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Security Groups
    const albSg = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security group for ALB',
      allowAllOutbound: true,
    });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP');
    
    const frontendSg = new ec2.SecurityGroup(this, 'FrontendSecurityGroup', {
      vpc,
      description: 'Security group for frontend',
      allowAllOutbound: true,
    });
    frontendSg.addIngressRule(
      albSg,
      ec2.Port.tcp(3000),
      'Allow traffic from ALB'
    );

    const backendSg = new ec2.SecurityGroup(this, 'BackendSecurityGroup', {
      vpc,
      description: 'Security group for backend',
      allowAllOutbound: true,
    });
    backendSg.addIngressRule(
      albSg,
      ec2.Port.tcp(8080),
      'Allow traffic from ALB'
    );

    const dbSg = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for Database',
      allowAllOutbound: false,
    });
    dbSg.addIngressRule(
      backendSg,
      ec2.Port.tcp(5432),
      'Allow traffic from backend'
    );

    // 2. Database Layer
    // Secrets Manager for DB Credentials
    const dbCredentials = new secretsmanager.Secret(this, 'DBCredentials', {
      secretName: `${appName}-db-credentials`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Aurora PostgreSQL Cluster
    const dbCluster = new rds.DatabaseCluster(this, 'Database', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_13_12,
      }),
      credentials: rds.Credentials.fromSecret(dbCredentials),
      writer: rds.ClusterInstance.provisioned('Writer', {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE3,
          ec2.InstanceSize.MEDIUM
        ),
      }),
      readers: [
        rds.ClusterInstance.provisioned('Reader', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.BURSTABLE3,
            ec2.InstanceSize.MEDIUM
          ),
        }),
      ],
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSg],
      storageEncrypted: true,
      backup: {
        retention: cdk.Duration.days(7),
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
    });

    // DB Rotation
    new secretsmanager.SecretRotation(this, 'SecretRotation', {
      application:
        secretsmanager.SecretRotationApplication.POSTGRES_ROTATION_SINGLE_USER,
      secret: dbCredentials,
      target: dbCluster,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      automaticallyAfter: cdk.Duration.days(30),
    });

    // 3. Load Balancing & Routing
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSg,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    // Create Hosted Zone inside the stack to avoid lookup failure
    // This allows the stack to synthesize even if the domain doesn't exist.
    // Since ACM validation is impossible in this test environment, we are skipping HTTPS/ACM setup
    // and defaulting to HTTP to ensure the stack deploys successfully.
    const hostedZone = new route53.HostedZone(this, 'HostedZone', {
      zoneName: 'example.com', // Placeholder domain
    });

    // HTTP Listener (No HTTPS/ACM due to test environment constraints)
    const httpListener = alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Not Found',
      }),
    });

    // 4. Compute Layer
    const cluster = new ecs.Cluster(this, 'EcsCluster', {
      vpc,
      containerInsights: true,
      clusterName: `${appName}-cluster`,
    });

    // Frontend
    const frontendTaskDef = new ecs.FargateTaskDefinition(
      this,
      'FrontendTaskDef',
      {
        memoryLimitMiB: 1024,
        cpu: 512,
      }
    );
    frontendTaskDef.addContainer('FrontendContainer', {
      image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'frontend' }),
      portMappings: [{ containerPort: 3000 }],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3000/ || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
      },
    });

    const frontendService = new ecs.FargateService(this, 'FrontendService', {
      cluster,
      taskDefinition: frontendTaskDef,
      desiredCount: 2,
      securityGroups: [frontendSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      deploymentController: {
        type: ecs.DeploymentControllerType.CODE_DEPLOY,
      },
      minHealthyPercent: 50, // Explicitly set to avoid warning
      maxHealthyPercent: 200,
    });

    // Backend
    const backendTaskDef = new ecs.FargateTaskDefinition(
      this,
      'BackendTaskDef',
      {
        memoryLimitMiB: 1024,
        cpu: 512,
      }
    );
    backendTaskDef.addContainer('BackendContainer', {
      image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'backend' }),
      portMappings: [{ containerPort: 8080 }],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:8080/ || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
      },
      environment: {
        DB_HOST: dbCluster.clusterEndpoint.hostname,
        DB_SECRET_ARN: dbCredentials.secretArn,
      },
    });
    dbCredentials.grantRead(backendTaskDef.taskRole);

    const backendService = new ecs.FargateService(this, 'BackendService', {
      cluster,
      taskDefinition: backendTaskDef,
      desiredCount: 2,
      securityGroups: [backendSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      deploymentController: {
        type: ecs.DeploymentControllerType.CODE_DEPLOY,
      },
      minHealthyPercent: 50, // Explicitly set to avoid warning
      maxHealthyPercent: 200,
    });

    // Target Groups & Routing
    const frontendTg = new elbv2.ApplicationTargetGroup(this, 'FrontendTG', {
      vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      targets: [frontendService],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    const backendTg = new elbv2.ApplicationTargetGroup(this, 'BackendTG', {
      vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      targets: [backendService],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // Routing Rules
    httpListener.addAction('BackendRule', {
      priority: 10,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/api/*'])],
      action: elbv2.ListenerAction.forward([backendTg]),
    });

    httpListener.addAction('FrontendRule', {
      priority: 20,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/*'])],
      action: elbv2.ListenerAction.forward([frontendTg]),
    });

    // CodeDeploy Blue/Green
    const frontendGreenTg = new elbv2.ApplicationTargetGroup(
      this,
      'FrontendGreenTG',
      {
        vpc,
        port: 3000,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: { path: '/' },
      }
    );

    const backendGreenTg = new elbv2.ApplicationTargetGroup(
      this,
      'BackendGreenTG',
      {
        vpc,
        port: 8080,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: { path: '/' },
      }
    );

    new codedeploy.EcsDeploymentGroup(this, 'FrontendDeploymentGroup', {
      service: frontendService,
      blueGreenDeploymentConfig: {
        blueTargetGroup: frontendTg,
        greenTargetGroup: frontendGreenTg,
        listener: httpListener,
        deploymentApprovalWaitTime: cdk.Duration.minutes(0),
        terminationWaitTime: cdk.Duration.minutes(0),
      },
      deploymentConfig: codedeploy.EcsDeploymentConfig.ALL_AT_ONCE,
    });

    new codedeploy.EcsDeploymentGroup(this, 'BackendDeploymentGroup', {
      service: backendService,
      blueGreenDeploymentConfig: {
        blueTargetGroup: backendTg,
        greenTargetGroup: backendGreenTg,
        listener: httpListener,
        deploymentApprovalWaitTime: cdk.Duration.minutes(0),
        terminationWaitTime: cdk.Duration.minutes(0),
      },
      deploymentConfig: codedeploy.EcsDeploymentConfig.ALL_AT_ONCE,
    });

    // 5. CDN & Static Assets
    const assetsBucket = new s3.Bucket(this, 'StaticAssetsBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI');
    assetsBucket.grantRead(oai);

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: new origins.S3Origin(assetsBucket, {
          originAccessIdentity: oai,
        }),
        compress: true,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.ALLOW_ALL, // Allow HTTP for test
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.LoadBalancerV2Origin(alb, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          }), // Use HTTP
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.ALLOW_ALL,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        },
      },
      // No custom domain/certificate for test env without ACM
    });

    // 6. Security - WAF
    const webAcl = new wafv2.CfnWebACL(this, 'WebACL', {
      defaultAction: { allow: {} },
      scope: 'REGIONAL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${appName}-waf`,
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: 'RateLimit',
          priority: 1,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimit',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'SQLInjection',
          priority: 2,
          action: { block: {} },
          statement: {
            sqliMatchStatement: {
              fieldToMatch: { allQueryArguments: {} },
              textTransformations: [{ priority: 0, type: 'URL_DECODE' }],
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLInjection',
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    new wafv2.CfnWebACLAssociation(this, 'WafAssociation', {
      resourceArn: alb.loadBalancerArn,
      webAclArn: webAcl.attrArn,
    });

    // 7. DNS Records
    // Create records in the internal hosted zone
    /*
    new route53.ARecord(this, 'CloudFrontAlias', {
      zone: hostedZone,
      recordName: 'cdn', // subdomain only as zone is created here
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
    });
    */

    new route53.ARecord(this, 'AlbAlias', {
      zone: hostedZone,
      recordName: 'api',
      target: route53.RecordTarget.fromAlias(
        new targets.LoadBalancerTarget(alb)
      ),
    });

    // 8. Monitoring - CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `${appName}-dashboard`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Requests',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            metricName: 'RequestCount',
            dimensionsMap: { LoadBalancer: alb.loadBalancerFullName },
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Errors',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            metricName: 'HTTPCode_Target_5XX_Count',
            dimensionsMap: { LoadBalancer: alb.loadBalancerFullName },
          }),
        ],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
    });
    new cdk.CfnOutput(this, 'ALBDNS', { value: alb.loadBalancerDnsName });
    new cdk.CfnOutput(this, 'AuroraEndpoint', {
      value: dbCluster.clusterEndpoint.hostname,
    });
  }
}
