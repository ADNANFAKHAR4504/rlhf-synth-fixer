import * as cdk from 'aws-cdk-lib';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

// ? Import your stacks here
// import { MyStack } from './my-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  certificateArn: string;
  containerImage: string;
  desiredCount: number;
  minCapacity?: number;
  maxCapacity?: number;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // 🔐 KMS Key for encryption at rest with automatic rotation
    const kmsKey = new kms.Key(this, 'SecureAppKMSKey', {
      alias: 'SecureApp-encryption-key',
      description: 'KMS key for SecureApp encryption at rest',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Safer for production
    });

    // 📊 CloudWatch Log Groups with encryption
    const vpcFlowLogGroup = new logs.LogGroup(this, 'SecureAppVPCFlowLogs', {
      logGroupName: '/aws/vpc/SecureApp-flowlogs',
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const albAccessLogGroup = new logs.LogGroup(this, 'SecureAppALBAccessLogs', {
      logGroupName: '/aws/alb/SecureApp-access-logs',
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const appLogGroup = new logs.LogGroup(this, 'SecureAppApplicationLogs', {
      logGroupName: '/aws/ecs/SecureApp-application',
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 🌐 VPC with public/private subnets across multiple AZs
    const vpc = new ec2.Vpc(this, 'SecureAppVPC', {
      vpcName: 'SecureApp-VPC',
      maxAzs: 3, // Multi-AZ for HA
      natGateways: 2, // Redundant NAT gateways for HA
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'SecureApp-Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'SecureApp-Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      flowLogs: {
        'SecureApp-VPCFlowLogs': {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(vpcFlowLogGroup),
          trafficType: ec2.FlowLogTrafficType.ALL,
        },
      },
    });

    // 🪣 S3 Bucket for ALB access logs with security controls
    const albLogsBucket = new s3.Bucket(this, 'SecureAppALBLogsBucket', {
      bucketName: `secureapp-alb-logs-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [{
        id: 'SecureApp-LogRetention',
        enabled: true,
        expiration: cdk.Duration.days(365),
        transitions: [{
          storageClass: s3.StorageClass.INFREQUENT_ACCESS,
          transitionAfter: cdk.Duration.days(30),
        }],
      }],
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Grant ALB service access to write logs
    albLogsBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'AWSLogDeliveryWrite',
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('delivery.logs.amazonaws.com')],
      actions: ['s3:PutObject'],
      resources: [`${albLogsBucket.bucketArn}/*`],
      conditions: {
        StringEquals: {
          's3:x-amz-server-side-encryption': 'aws:kms',
          's3:x-amz-server-side-encryption-aws-kms-key-id': kmsKey.keyArn,
        },
      },
    }));

    // ELB service principal for ALB access logs (region-specific)
    const elbServiceAccount = this.getELBServiceAccount();
    albLogsBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'AWSLogDeliveryAclCheck',
      effect: iam.Effect.ALLOW,
      principals: [new iam.AccountPrincipal(elbServiceAccount)],
      actions: ['s3:GetBucketAcl'],
      resources: [albLogsBucket.bucketArn],
    }));

    albLogsBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'AWSLogDeliveryWrite',
      effect: iam.Effect.ALLOW,
      principals: [new iam.AccountPrincipal(elbServiceAccount)],
      actions: ['s3:PutObject'],
      resources: [`${albLogsBucket.bucketArn}/*`],
    }));

    // 🛡️ Security Groups with least privilege
    const albSecurityGroup = new ec2.SecurityGroup(this, 'SecureAppALBSecurityGroup', {
      vpc,
      securityGroupName: 'SecureApp-ALB-SG',
      description: 'Security group for SecureApp ALB',
      allowAllOutbound: false,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS traffic from internet'
    );

    // Redirect HTTP to HTTPS
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP traffic for redirect to HTTPS'
    );

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'SecureAppECSSecurityGroup', {
      vpc,
      securityGroupName: 'SecureApp-ECS-SG',
      description: 'Security group for SecureApp ECS tasks',
      allowAllOutbound: false,
    });

    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(8080), // Assuming app runs on port 8080
      'Traffic from ALB'
    );

    // Allow outbound HTTPS for pulling images and API calls
    ecsSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS outbound'
    );

    // 🏗️ ECS Cluster with container insights
    const cluster = new ecs.Cluster(this, 'SecureAppCluster', {
      clusterName: 'SecureApp-Cluster',
      vpc,
      containerInsights: true,
    });

    // 📋 ECS Task Definition with least privilege IAM
    const taskRole = new iam.Role(this, 'SecureAppTaskRole', {
      roleName: 'SecureApp-TaskRole',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'IAM role for SecureApp ECS tasks',
    });

    // Grant minimal permissions for application logging
    taskRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [appLogGroup.logGroupArn],
    }));

    const executionRole = new iam.Role(this, 'SecureAppExecutionRole', {
      roleName: 'SecureApp-ExecutionRole',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // Grant execution role access to KMS for log encryption
    kmsKey.grantDecrypt(executionRole);

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'SecureAppTaskDefinition', {
      family: 'SecureApp-TaskDef',
      cpu: 512,
      memoryLimitMiB: 1024,
      taskRole,
      executionRole,
    });

    const container = taskDefinition.addContainer('SecureAppContainer', {
      containerName: 'SecureApp-Container',
      image: ecs.ContainerImage.fromRegistry(props.containerImage),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'SecureApp',
        logGroup: appLogGroup,
      }),
      portMappings: [{
        containerPort: 8080,
        protocol: ecs.Protocol.TCP,
      }],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:8080/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    // 🚀 ECS Service with auto-scaling
    const service = new ecs.FargateService(this, 'SecureAppService', {
      serviceName: 'SecureApp-Service',
      cluster,
      taskDefinition,
      desiredCount: props.desiredCount,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [ecsSecurityGroup],
      enableLogging: true,
      platformVersion: ecs.FargatePlatformVersion.LATEST,
    });

    // Auto-scaling configuration
    const scaling = service.autoScaleTaskCount({
      minCapacity: props.minCapacity || 2,
      maxCapacity: props.maxCapacity || 10,
    });

    scaling.scaleOnCpuUtilization('SecureAppCPUScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(2),
    });

    // 🔒 Import existing ACM certificate
    const certificate = certificatemanager.Certificate.fromCertificateArn(
      this,
      'SecureAppCertificate',
      props.certificateArn
    );

    // ⚖️ Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'SecureAppALB', {
      loadBalancerName: 'SecureApp-ALB',
      vpc,
      internetFacing: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: albSecurityGroup,
      deletionProtection: true, // Prevent accidental deletion
    });

    // Enable access logging
    alb.setAttribute('access_logs.s3.enabled', 'true');
    alb.setAttribute('access_logs.s3.bucket', albLogsBucket.bucketName);
    alb.setAttribute('access_logs.s3.prefix', 'alb-access-logs');

    // HTTPS Listener with TLS 1.2+
    const httpsListener = alb.addListener('SecureAppHTTPSListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [certificate],
      sslPolicy: elbv2.SslPolicy.TLS12_EXT, // TLS 1.2+
    });

    httpsListener.addTargets('SecureAppTargets', {
      targetGroupName: 'SecureApp-TG',
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: elbv2.Protocol.HTTP,
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        timeout: cdk.Duration.seconds(5),
        interval: cdk.Duration.seconds(30),
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // HTTP Listener for redirect to HTTPS
    alb.addListener('SecureAppHTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
    });

    // 🛡️ WAF v2 Web ACL
    const webAcl = new wafv2.CfnWebACL(this, 'SecureAppWebACL', {
      name: 'SecureApp-WebACL',
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      description: 'WAF for SecureApp ALB',
      rules: [
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric',
          },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'KnownBadInputsMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'SecureAppWebACL',
      },
    });

    // Associate WAF with ALB
    new wafv2.CfnWebACLAssociation(this, 'SecureAppWebACLAssociation', {
      resourceArn: alb.loadBalancerArn,
      webAclArn: webAcl.attrArn,
    });

    // 📤 Outputs
    new cdk.CfnOutput(this, 'SecureAppALBDNS', {
      value: alb.loadBalancerDnsName,
      description: 'ALB DNS name for SecureApp',
    });

    new cdk.CfnOutput(this, 'SecureAppKMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for SecureApp encryption',
    });
  }

  private getELBServiceAccount(): string {
    // ELB service account IDs by region
    const elbServiceAccounts: { [region: string]: string } = {
      'us-east-1': '127311923021',
      'us-east-2': '033677994240',
      'us-west-1': '027434742980',
      'us-west-2': '797873946194',
      'eu-west-1': '156460612806',
      'eu-central-1': '054676820928',
      'ap-southeast-1': '114774131450',
      'ap-northeast-1': '582318560864',
      // Add more regions as needed
    };

    return elbServiceAccounts[this.region] || '127311923021'; // Default to us-east-1
  }
}