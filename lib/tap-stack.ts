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
  allowedCidrRanges?: string[];
  instanceType?: ec2.InstanceType;
  domainName?: string;
  hostedZoneId?: string;
  certificateArn: string; // Required for HTTPS listener
  desiredCount?: number; // Default desired count for ECS service
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // 🔐 KMS Key for encryption at rest with automatic rotation
    const kmsKey = new kms.Key(this, `SecureAppKMSKey${environmentSuffix}`, {
      alias: `SecureApp-encryption-key-${environmentSuffix}`,
      description: `KMS key for SecureApp encryption at rest - ${environmentSuffix}`,
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Changed from RETAIN for QA compliance
    });

    // 📊 CloudWatch Log Groups with encryption
    const vpcFlowLogGroup = new logs.LogGroup(
      this,
      `SecureAppVPCFlowLogs${environmentSuffix}`,
      {
        logGroupName: `/aws/vpc/SecureApp-flowlogs-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_YEAR,
        encryptionKey: kmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const appLogGroup = new logs.LogGroup(
      this,
      `SecureAppApplicationLogs${environmentSuffix}`,
      {
        logGroupName: `/aws/ecs/SecureApp-application-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_MONTH,
        encryptionKey: kmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // 🌐 VPC with public/private subnets across multiple AZs
    const vpc = new ec2.Vpc(this, `SecureAppVPC${environmentSuffix}`, {
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
        [`SecureApp-VPCFlowLogs-${environmentSuffix}`]: {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(vpcFlowLogGroup),
          trafficType: ec2.FlowLogTrafficType.ALL,
        },
      },
    });

    // 🛡️ Security Groups with least privilege
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `SecureAppALBSecurityGroup${environmentSuffix}`,
      {
        vpc,
        securityGroupName: `SecureApp-ALB-SG-${environmentSuffix}`,
        description: 'Security group for SecureApp ALB',
        allowAllOutbound: false,
      }
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from anywhere'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from anywhere'
    );

    // Allow egress to ephemeral ports as needed
    albSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.allTraffic(),
      'Allow outbound for health checks and target communication'
    );

    const ecsSecurityGroup = new ec2.SecurityGroup(
      this,
      `SecureAppECSSecurityGroup${environmentSuffix}`,
      {
        vpc,
        securityGroupName: `SecureApp-ECS-SG-${environmentSuffix}`,
        description: 'Security group for SecureApp ECS service',
        allowAllOutbound: true,
      }
    );

    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow ALB to reach ECS service'
    );

    // ⚙️ ECS Cluster
    const cluster = new ecs.Cluster(
      this,
      `SecureAppCluster${environmentSuffix}`,
      {
        vpc,
        containerInsights: true,
        clusterName: `SecureApp-Cluster-${environmentSuffix}`,
      }
    );

    // 🧾 Task Execution Role with AWS managed policy
    const executionRole = new iam.Role(
      this,
      `SecureAppExecutionRole${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        description: 'Execution role for SecureApp ECS tasks',
      }
    );

    executionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AmazonECSTaskExecutionRolePolicy'
      )
    );

    // 🔐 Task Role with least privilege
    const taskRole = new iam.Role(
      this,
      `SecureAppTaskRole${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        description: 'Task role for SecureApp ECS tasks',
      }
    );

    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: ['*'], // Scope down to specific log group if needed
      })
    );

    // 📦 Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      `SecureAppTaskDefinition${environmentSuffix}`,
      {
        cpu: 512,
        memoryLimitMiB: 1024,
        executionRole,
        taskRole,
      }
    );

    // 📦 Container Definition
    const container = taskDefinition.addContainer(
      `SecureAppContainer${environmentSuffix}`,
      {
        image: ecs.ContainerImage.fromRegistry(
          'public.ecr.aws/docker/library/nginx:latest'
        ),
        logging: ecs.LogDrivers.awsLogs({
          logGroup: appLogGroup,
          streamPrefix: 'SecureApp',
        }),
        portMappings: [{ containerPort: 8080 }],
      }
    );

    // 🪣 S3 Bucket for ALB access logs with security controls (SSE-S3)
    const albLogsBucket = new s3.Bucket(
      this,
      `SecureAppALBLogsBucket${environmentSuffix}`,
      {
        bucketName: `secureapp-alb-logs-${environmentSuffix}-${this.account}-${this.region}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED, // Critical for ALB access logs
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
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // ELB service principal for ALB access logs (region-specific)
    const elbServiceAccount = this.getELBServiceAccount();

    // Grant ELB delivery account permission to write access logs with the required ACL
    albLogsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSALBLogDeliveryWrite',
        effect: iam.Effect.ALLOW,
        principals: [new iam.AccountPrincipal(elbServiceAccount)],
        actions: ['s3:PutObject'],
        resources: [`${albLogsBucket.bucketArn}/*`],
        conditions: {
          StringEquals: { 's3:x-amz-acl': 'bucket-owner-full-control' },
        },
      })
    );

    // Allow ELB delivery account to read bucket ACL and location
    albLogsBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSALBLogDeliveryBucketInfo',
        effect: iam.Effect.ALLOW,
        principals: [new iam.AccountPrincipal(elbServiceAccount)],
        actions: ['s3:GetBucketAcl', 's3:GetBucketLocation'],
        resources: [albLogsBucket.bucketArn],
      })
    );

    // ⚖️ Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `SecureAppALB${environmentSuffix}`,
      {
        loadBalancerName: `SecureApp-ALB-${environmentSuffix}`,
        vpc,
        internetFacing: true,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        securityGroup: albSecurityGroup,
        deletionProtection: false, // Allow deletion for QA environment cleanup
      }
    );

    // Enable access logging (prefix must NOT contain "AWSLogs")
    alb.setAttribute('access_logs.s3.enabled', 'true');
    alb.setAttribute('access_logs.s3.bucket', albLogsBucket.bucketName);
    alb.setAttribute('access_logs.s3.prefix', 'alb-access-logs');

    // Disable deletion protection for QA compliance
    alb.setAttribute('deletion_protection.enabled', 'false');

    // 🔒 Import existing ACM certificate
    const certificate = certificatemanager.Certificate.fromCertificateArn(
      this,
      `SecureAppCertificate${environmentSuffix}`,
      props.certificateArn
    );

    // HTTPS Listener with TLS 1.2+
    const httpsListener = alb.addListener(
      `SecureAppHTTPSListener${environmentSuffix}`,
      {
        port: 443,
        protocol: elbv2.ApplicationProtocol.HTTPS,
        certificates: [certificate],
        sslPolicy: elbv2.SslPolicy.TLS12_EXT,
      }
    );

    // HTTP Listener for redirect to HTTPS
    alb.addListener(`SecureAppHTTPListener${environmentSuffix}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
    });

    // 🛡️ WAF v2 Web ACL
    const webAcl = new wafv2.CfnWebACL(
      this,
      `SecureAppWebACL${environmentSuffix}`,
      {
        defaultAction: { allow: {} },
        scope: 'REGIONAL',
        name: `SecureApp-WebACL-${environmentSuffix}`,
        description: 'WAF Web ACL for SecureApp',
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
      }
    );

    // Associate WAF with ALB
    new wafv2.CfnWebACLAssociation(
      this,
      `SecureAppWebACLAssociation${environmentSuffix}`,
      {
        resourceArn: alb.loadBalancerArn,
        webAclArn: webAcl.attrArn,
      }
    );

    // 🛠️ Auto Scaling for ECS Service (example target tracking)
    const service = new ecs.FargateService(
      this,
      `SecureAppService${environmentSuffix}`,
      {
        cluster,
        taskDefinition,
        desiredCount: props.desiredCount ?? 1,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [ecsSecurityGroup],
        minHealthyPercent: 50,
        maxHealthyPercent: 200,
        circuitBreaker: { rollback: true },
      }
    );

    // Attach ECS Fargate service to ALB via the HTTPS listener.
    // Target type is IP for Fargate; container listens on 8080.
    service.registerLoadBalancerTargets({
      containerName: container.containerName,
      containerPort: 8080,
      newTargetGroupId: `SecureAppTG${environmentSuffix}`,
      listener: ecs.ListenerConfig.applicationListener(httpsListener, {
        protocol: elbv2.ApplicationProtocol.HTTP, // ALB → task targets use HTTP at the target group
        healthCheck: {
          path: '/',
          healthyHttpCodes: '200-399',
          interval: cdk.Duration.seconds(30),
        },
      }),
    });

    const scaling = service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 4,
    });

    scaling.scaleOnCpuUtilization(`SecureAppCPUScaling${environmentSuffix}`, {
      targetUtilizationPercent: 60,
      scaleInCooldown: cdk.Duration.minutes(3),
      scaleOutCooldown: cdk.Duration.minutes(2),
    });

    // 📤 CloudFormation Outputs
    new cdk.CfnOutput(this, `SecureAppALBDNS${environmentSuffix}`, {
      value: alb.loadBalancerDnsName,
      description: `ALB DNS name for SecureApp - ${environmentSuffix}`,
      exportName: `SecureApp-ALB-DNS-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `SecureAppKMSKeyId${environmentSuffix}`, {
      value: kmsKey.keyId,
      description: `KMS Key ID for SecureApp encryption - ${environmentSuffix}`,
      exportName: `SecureApp-KMS-KeyId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `SecureAppVPCId${environmentSuffix}`, {
      value: vpc.vpcId,
      description: `VPC ID for SecureApp - ${environmentSuffix}`,
      exportName: `SecureApp-VPC-Id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `SecureAppS3BucketName${environmentSuffix}`, {
      value: albLogsBucket.bucketName,
      description: `S3 Bucket name for ALB logs - ${environmentSuffix}`,
      exportName: `SecureApp-S3-Bucket-${environmentSuffix}`,
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
