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
  certificateArn?: string; // Made optional for QA environments
  containerImage: string;
  desiredCount: number;
  minCapacity?: number;
  maxCapacity?: number;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // 🔐 'KMS Key' for encryption at rest with automatic rotation
    const kmsKey = new kms.Key(this, 'SecureAppKMSKey', {
      alias: `SecureApp-encryption-key-${environmentSuffix}`,
      description: 'KMS key for SecureApp encryption at rest',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // QA-friendly for automated cleanup
    });

    // Grant CloudWatch Logs service permission to use the KMS key
    kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudWatchLogsEncryption',
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
          ArnEquals: {
            'kms:EncryptionContext:aws:logs:arn': [
              `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/vpc/SecureApp-flowlogs-${environmentSuffix}*`,
              `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/alb/SecureApp-access-logs-${environmentSuffix}*`,
              `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/ecs/SecureApp-application-${environmentSuffix}*`,
            ],
          },
        },
      })
    );

    // 📊 CloudWatch Log Groups with encryption
    const vpcFlowLogGroup = new logs.LogGroup(this, 'SecureAppVPCFlowLogs', {
      logGroupName: `/aws/vpc/SecureApp-flowlogs-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // QA-friendly for automated cleanup
    });

    new logs.LogGroup(this, 'SecureAppALBAccessLogs', {
      logGroupName: `/aws/alb/SecureApp-access-logs-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // QA-friendly for automated cleanup
    });

    const appLogGroup = new logs.LogGroup(this, 'SecureAppApplicationLogs', {
      logGroupName: `/aws/ecs/SecureApp-application-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // QA-friendly for automated cleanup
    });

    // 🌐 VPC with public/private subnets across multiple AZs
    const vpc = new ec2.Vpc(this, 'SecureAppVPC', {
      vpcName: `SecureApp-VPC-${environmentSuffix}`,
      maxAzs: 3, // Multi-AZ for HA
      natGateways: 2, // Redundant NAT gateways for HA
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `SecureApp-Public-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `SecureApp-Private-${environmentSuffix}`,
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
    const timestamp = Date.now().toString();
    const albLogsBucket = new s3.Bucket(this, 'SecureAppALBLogsBucket', {
      bucketName: `secureapp-alb-logs-${environmentSuffix}-${timestamp}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED, // SSE-S3 for ALB access logs compatibility
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'SecureApp-LogRetention',
          enabled: true,
          expiration: cdk.Duration.days(365),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // QA-friendly for automated cleanup
      autoDeleteObjects: true, // Critical for QA: Automatically delete objects on stack deletion
    });

    // Grant ELB service account permission for ALB access logs
    const elbServiceAccount = this.getELBServiceAccount();
    albLogsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowELBServiceAccountPutObject',
        effect: iam.Effect.ALLOW,
        principals: [new iam.AccountPrincipal(elbServiceAccount)],
        actions: ['s3:PutObject'],
        resources: [`${albLogsBucket.bucketArn}/*`],
      })
    );

    // ELB service principal for ALB access logs (region-specific)
    albLogsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowELBServiceAccountAclCheck',
        effect: iam.Effect.ALLOW,
        principals: [new iam.AccountPrincipal(elbServiceAccount)],
        actions: ['s3:GetBucketAcl', 's3:ListBucket'],
        resources: [albLogsBucket.bucketArn],
      })
    );

    // 🛡️ Security Groups with least privilege
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      'SecureAppALBSecurityGroup',
      {
        vpc,
        securityGroupName: `SecureApp-ALB-SG-${environmentSuffix}`,
        description: 'Security group for SecureApp ALB',
        allowAllOutbound: false,
      }
    );

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

    const ecsSecurityGroup = new ec2.SecurityGroup(
      this,
      'SecureAppECSSecurityGroup',
      {
        vpc,
        securityGroupName: `SecureApp-ECS-SG-${environmentSuffix}`,
        description: 'Security group for SecureApp ECS tasks',
        allowAllOutbound: false,
      }
    );

    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80), // nginx runs on port 80
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
      clusterName: `SecureApp-Cluster-${environmentSuffix}`,
      vpc,
      containerInsights: true,
    });

    // 📋 ECS Task Definition with least privilege IAM
    const taskRole = new iam.Role(this, 'SecureAppTaskRole', {
      roleName: `SecureApp-TaskRole-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'IAM role for SecureApp ECS tasks',
    });

    // Grant minimal permissions for application logging
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [appLogGroup.logGroupArn],
      })
    );

    const executionRole = new iam.Role(this, 'SecureAppExecutionRole', {
      roleName: `SecureApp-ExecutionRole-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    });

    // Grant execution role access to KMS for log encryption
    kmsKey.grantDecrypt(executionRole);

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'SecureAppTaskDefinition',
      {
        family: `SecureApp-TaskDef-${environmentSuffix}`,
        cpu: 512,
        memoryLimitMiB: 1024,
        taskRole,
        executionRole,
      }
    );

    taskDefinition.addContainer('SecureAppContainer', {
      containerName: `SecureApp-Container-${environmentSuffix}`,
      image: ecs.ContainerImage.fromRegistry(props.containerImage),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: `SecureApp-${environmentSuffix}`,
        logGroup: appLogGroup,
      }),
      portMappings: [
        {
          containerPort: 80,
          protocol: ecs.Protocol.TCP,
        },
      ],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:80/ || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    // 🚀 ECS Service with auto-scaling
    const service = new ecs.FargateService(this, 'SecureAppService', {
      serviceName: `SecureApp-Service-${environmentSuffix}`,
      cluster,
      taskDefinition,
      desiredCount: props.desiredCount,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [ecsSecurityGroup],
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

    // ⚖️ Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'SecureAppALB', {
      loadBalancerName: `SecureApp-ALB-${environmentSuffix}`,
      vpc,
      internetFacing: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: albSecurityGroup,
      deletionProtection: false, // QA-friendly for automated cleanup
    });

    // Enable access logging
    alb.setAttribute('access_logs.s3.enabled', 'true');
    alb.setAttribute('access_logs.s3.bucket', albLogsBucket.bucketName);
    alb.setAttribute('access_logs.s3.prefix', 'alb-access-logs');
    alb.logAccessLogs(albLogsBucket, 'alb-access-logs');

    // 🔒 Optional HTTPS Listener with TLS 1.2+ (only if certificate is provided)
    if (props.certificateArn) {
      const certificate = certificatemanager.Certificate.fromCertificateArn(
        this,
        'SecureAppCertificate',
        props.certificateArn
      );

      const httpsListener = alb.addListener('SecureAppHTTPSListener', {
        port: 443,
        protocol: elbv2.ApplicationProtocol.HTTPS,
        certificates: [certificate],
        sslPolicy: elbv2.SslPolicy.TLS12_EXT, // TLS 1.2+
      });

      httpsListener.addTargets('SecureAppTargets', {
        targetGroupName: `SecureApp-TG-${environmentSuffix}`,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [service],
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: elbv2.Protocol.HTTP,
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
          timeout: cdk.Duration.seconds(5),
          interval: cdk.Duration.seconds(30),
        },
        deregistrationDelay: cdk.Duration.seconds(30),
      });
    } else {
      // HTTP-only listener for QA environments without certificates
      const httpListener = alb.addListener('SecureAppHTTPListener', {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
      });

      httpListener.addTargets('SecureAppTargets', {
        targetGroupName: `SecureApp-TG-${environmentSuffix}`,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [service],
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: elbv2.Protocol.HTTP,
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
          timeout: cdk.Duration.seconds(5),
          interval: cdk.Duration.seconds(30),
        },
        deregistrationDelay: cdk.Duration.seconds(30),
      });
    }

    // HTTP to HTTPS redirect (only if HTTPS is enabled)
    if (props.certificateArn) {
      alb.addListener('SecureAppHTTPRedirectListener', {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        defaultAction: elbv2.ListenerAction.redirect({
          protocol: 'HTTPS',
          port: '443',
          permanent: true,
        }),
      });
    }

    // 🛡️ WAF v2 Web ACL
    const webAcl = new wafv2.CfnWebACL(this, 'SecureAppWebACL', {
      name: `SecureApp-WebACL-${environmentSuffix}`,
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
        metricName: `SecureAppWebACL-${environmentSuffix}`,
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

    new cdk.CfnOutput(this, 'SecureAppALBArn', {
      value: alb.loadBalancerArn,
      description: 'ALB ARN for SecureApp',
    });

    new cdk.CfnOutput(this, 'SecureAppVPCId', {
      value: vpc.vpcId,
      description: 'VPC ID for SecureApp',
    });

    new cdk.CfnOutput(this, 'SecureAppKMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for SecureApp encryption',
    });

    new cdk.CfnOutput(this, 'SecureAppALBLogsBucketName', {
      value: albLogsBucket.bucketName,
      description: 'S3 bucket name for ALB access logs',
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
