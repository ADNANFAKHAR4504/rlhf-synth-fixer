import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as config from 'aws-cdk-lib/aws-config';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as elbv2targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as shield from 'aws-cdk-lib/aws-shield';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

// ? Import your stacks here
// import { MyStack } from './my-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  environment: string;
  allowedIpRanges: string[];
  certArn: string;
  kmsAlias: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    // Common tags for all resources - security and compliance requirement
    const commonTags = {
      Environment: 'Production',
      Security: 'High',
    };
    cdk.Tags.of(this).add('Environment', commonTags.Environment);
    cdk.Tags.of(this).add('Security', commonTags.Security);

    // Create KMS key for encryption of all sensitive data
    const kmsKey = new kms.Key(this, 'ProductionKmsKey', {
      description: 'KMS key for production environment encryption',
      enableKeyRotation: true, // Security best practice - automatic key rotation
      alias: props.kmsAlias,
    });

    // VPC with isolated architecture - private/public subnet separation
    const vpc = new ec2.Vpc(this, 'SecureVpc', {
      maxAzs: 2, // Multi-AZ for high availability
      subnetConfiguration: [
        {
          // Public subnet for bastion host and ALB only
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          // Private subnet for application instances - no internet access
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Security group for bastion host - restricted to allowed IP ranges only
    const bastionSecurityGroup = new ec2.SecurityGroup(
      this,
      'BastionSecurityGroup',
      {
        vpc,
        description: 'Security group for bastion host with IP whitelist',
        allowAllOutbound: false, // Explicit outbound rules for security
      }
    );

    // Allow SSH access only from whitelisted IP ranges
    props.allowedIpRanges.forEach((cidr, index) => {
      bastionSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(cidr),
        ec2.Port.tcp(22),
        `SSH access from whitelisted range ${index + 1}`
      );
    });

    // Allow outbound HTTPS for updates and management
    bastionSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS outbound for updates'
    );

    // IAM role for bastion host - minimal permissions
    const bastionRole = new iam.Role(this, 'BastionRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Minimal role for bastion host operations',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ), // Session Manager access
      ],
    });

    // Bastion host in public subnet for secure access to private resources
    new ec2.Instance(this, 'BastionHost', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(), // Latest AMI for security patches
      securityGroup: bastionSecurityGroup,
      role: bastionRole,
      userData: ec2.UserData.forLinux(), // Minimal user data for security
    });

    // Security group for application instances - internal communication only
    const appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc,
      description: 'Security group for application instances',
      allowAllOutbound: false,
    });

    // Allow inbound from ALB security group only
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });

    // ALB accepts HTTPS traffic only from whitelisted IP ranges
    props.allowedIpRanges.forEach((cidr, index) => {
      albSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(cidr),
        ec2.Port.tcp(443),
        `HTTPS access from whitelisted range ${index + 1}`
      );
    });

    // Allow ALB to communicate with app instances
    appSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'HTTP from ALB'
    );

    albSecurityGroup.addEgressRule(
      appSecurityGroup,
      ec2.Port.tcp(80),
      'HTTP to app instances'
    );

    // Application Load Balancer with SSL termination
    const alb = new elbv2.ApplicationLoadBalancer(this, 'SecureAlb', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    // HTTPS listener with provided certificate
    const httpsListener = alb.addListener('HttpsListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [elbv2.ListenerCertificate.fromArn(props.certArn)],
      sslPolicy: elbv2.SslPolicy.RECOMMENDED, // Latest recommended TLS policy for security
    });

    // Target group for application instances
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'AppTargetGroup',
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        healthCheck: {
          path: '/health',
          healthyHttpCodes: '200',
          interval: cdk.Duration.seconds(30),
        },
      }
    );

    httpsListener.addTargetGroups('DefaultTargets', {
      targetGroups: [targetGroup],
    });

    // WAF v2 for application protection against common web exploits
    const webAcl = new wafv2.CfnWebACL(this, 'ProductionWebAcl', {
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      description: 'WAF for production ALB protection',
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
        metricName: 'ProductionWebAclMetric',
      },
    });

    // Associate WAF with ALB for protection
    new wafv2.CfnWebACLAssociation(this, 'WebAclAssociation', {
      resourceArn: alb.loadBalancerArn,
      webAclArn: webAcl.attrArn,
    });

    // S3 bucket for application data with KMS encryption
    const dataBucket = new s3.Bucket(this, 'SecureDataBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey, // Use our KMS key for encryption
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // Block all public access
      versioned: true, // Enable versioning for data protection
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    });

    // S3 bucket for logs with KMS encryption
    new s3.Bucket(this, 'SecureLogsBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'LogRetention',
          expiration: cdk.Duration.days(90), // 90-day retention as required
        },
      ],
    });

    // CloudWatch log group for API Gateway with KMS encryption
    const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: '/aws/apigateway/production',
      retention: logs.RetentionDays.THREE_MONTHS, // 90-day retention
      encryptionKey: kmsKey, // Encrypt logs with KMS
    });

    // IAM role for API Gateway logging
    new iam.Role(this, 'ApiGatewayRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonAPIGatewayPushToCloudWatchLogs'
        ),
      ],
    });

    // API Gateway with logging enabled
    const api = new apigateway.RestApi(this, 'SecureApi', {
      restApiName: 'Production Secure API',
      description: 'Production API with comprehensive logging and security',
      deployOptions: {
        stageName: 'prod',
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiLogGroup
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      cloudWatchRole: true,
      cloudWatchRoleRemovalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add a health check endpoint to the API Gateway
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

    // SNS topic for security alerts with KMS encryption
    const securityAlertsTopic = new sns.Topic(this, 'SecurityAlertsTopic', {
      displayName: 'Production Security Alerts',
      masterKey: kmsKey, // Encrypt SNS messages
    });

    // EventBridge rule for GuardDuty findings
    const guardDutyRule = new events.Rule(this, 'GuardDutyFindingsRule', {
      description: 'Route GuardDuty findings to SNS',
      eventPattern: {
        source: ['aws.guardduty'],
        detailType: ['GuardDuty Finding'],
      },
    });

    guardDutyRule.addTarget(new targets.SnsTopic(securityAlertsTopic));

    // EventBridge rule for Config compliance changes
    const configRule = new events.Rule(this, 'ConfigComplianceRule', {
      description: 'Route Config compliance changes to SNS',
      eventPattern: {
        source: ['aws.config'],
        detailType: ['Config Rules Compliance Change'],
      },
    });

    configRule.addTarget(new targets.SnsTopic(securityAlertsTopic));

    // IAM role for Config service
    const configRole = new iam.Role(this, 'ConfigServiceRole', {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/ConfigRole'),
      ],
    });

    // S3 bucket for Config delivery channel
    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'ConfigDataRetention',
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    // Grant Config service access to the bucket
    configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSConfigBucketPermissionsCheck',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('config.amazonaws.com')],
        actions: ['s3:GetBucketAcl', 's3:ListBucket'],
        resources: [configBucket.bucketArn],
      })
    );

    configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSConfigBucketExistenceCheck',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('config.amazonaws.com')],
        actions: ['s3:GetBucketLocation'],
        resources: [configBucket.bucketArn],
      })
    );

    configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSConfigBucketDelivery',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('config.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${configBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms',
          },
        },
      })
    );

    // AWS Config configuration recorder
    const configRecorder = new config.CfnConfigurationRecorder(
      this,
      'ConfigRecorder',
      {
        name: 'production-config-recorder',
        roleArn: configRole.roleArn,
        recordingGroup: {
          allSupported: true, // Record all supported resource types
          includeGlobalResourceTypes: true,
          resourceTypes: [],
        },
      }
    );

    // AWS Config delivery channel
    const configDeliveryChannel = new config.CfnDeliveryChannel(
      this,
      'ConfigDeliveryChannel',
      {
        name: 'production-delivery-channel',
        s3BucketName: configBucket.bucketName,
        s3KeyPrefix: 'config/',
        configSnapshotDeliveryProperties: {
          deliveryFrequency: 'TwentyFour_Hours',
        },
      }
    );

    // Ensure delivery channel depends on recorder
    configDeliveryChannel.addDependency(configRecorder);

    // AWS Config rules for compliance monitoring
    const s3EncryptionRule = new config.CfnConfigRule(
      this,
      'S3BucketServerSideEncryptionEnabled',
      {
        configRuleName: 's3-bucket-server-side-encryption-enabled',
        description:
          'Checks that S3 buckets have server-side encryption enabled',
        source: {
          owner: 'AWS',
          sourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
        },
      }
    );
    s3EncryptionRule.addDependency(configRecorder);

    const rootMfaRule = new config.CfnConfigRule(this, 'RootUserMfaEnabled', {
      configRuleName: 'root-user-mfa-enabled',
      description: 'Checks whether MFA is enabled for root user',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'ROOT_USER_MFA_ENABLED',
      },
    });
    rootMfaRule.addDependency(configRecorder);

    // Enable GuardDuty for continuous security monitoring
    new guardduty.CfnDetector(this, 'GuardDutyDetector', {
      enable: true,
      findingPublishingFrequency: 'FIFTEEN_MINUTES', // Frequent updates for security
      dataSources: {
        s3Logs: { enable: true },
        kubernetes: { auditLogs: { enable: true } },
        malwareProtection: {
          scanEc2InstanceWithFindings: { ebsVolumes: true },
        },
      },
    });

    // Application instances in private subnets - no public IPs
    const appRole = new iam.Role(this, 'AppInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ), // Session Manager
      ],
    });

    // Grant minimal S3 access to application role
    dataBucket.grantReadWrite(appRole);

    // Launch application instances in private subnets
    const appInstance = new ec2.Instance(this, 'AppInstance', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED }, // No public IP
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.SMALL
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: appSecurityGroup,
      role: appRole,
      userData: ec2.UserData.forLinux(),
    });

    // Add instance to target group
    targetGroup.addTarget(
      new elbv2targets.InstanceIdTarget(appInstance.instanceId)
    );

    // Enable AWS Shield Advanced protection for ALB (DDoS protection)
    new shield.CfnProtection(this, 'AlbShieldProtection', {
      name: 'ALB-Shield-Protection',
      resourceArn: alb.loadBalancerArn,
    });

    // Output important resource ARNs for reference
    new cdk.CfnOutput(this, 'LoadBalancerDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the secure load balancer',
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'SecurityAlertsTopicArn', {
      value: securityAlertsTopic.topicArn,
      description: 'SNS topic for security alerts',
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: kmsKey.keyId,
      description: 'KMS key ID for encryption',
    });
  }
}
