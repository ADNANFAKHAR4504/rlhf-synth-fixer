import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as config from 'aws-cdk-lib/aws-config';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export class SecureInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get environment suffix for unique resource naming
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev';

    // =============================================================================
    // 1. KMS KEYS FOR ENCRYPTION
    // =============================================================================

    const kmsKey = new kms.Key(this, 'SecureInfraKMSKey', {
      description: 'KMS key for secure infrastructure encryption',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
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
            sid: 'Allow CloudTrail to encrypt logs',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
            actions: [
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:ReEncrypt*',
              'kms:Decrypt',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow CloudWatch Logs',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('logs.amazonaws.com')],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow EC2 Service for EBS encryption',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('ec2.amazonaws.com')],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
              'kms:CreateGrant',
              'kms:ListGrants',
              'kms:RevokeGrant',
            ],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:ViaService': `ec2.${this.region}.amazonaws.com`,
              },
            },
          }),
          new iam.PolicyStatement({
            sid: 'Allow Auto Scaling Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('autoscaling.amazonaws.com')],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
              'kms:CreateGrant',
              'kms:ListGrants',
              'kms:RevokeGrant',
            ],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:ViaService': `ec2.${this.region}.amazonaws.com`,
              },
            },
          }),
          new iam.PolicyStatement({
            sid: 'Allow EBS Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('ebs.amazonaws.com')],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
              'kms:CreateGrant',
              'kms:ListGrants',
              'kms:RevokeGrant',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow EC2 Auto Scaling to use the key',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal('autoscaling.amazonaws.com'),
              new iam.ArnPrincipal(`arn:aws:iam::${this.account}:root`),
            ],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
              'kms:CreateGrant',
              'kms:ListGrants',
              'kms:RevokeGrant',
            ],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:ViaService': `ec2.${this.region}.amazonaws.com`,
              },
            },
          }),
        ],
      }),
    });

    new kms.Alias(this, 'SecureInfraKMSKeyAlias', {
      aliasName: `alias/secure-infrastructure-key-${environmentSuffix}`,
      targetKey: kmsKey,
    });

    // Note: Removed KMS waiter as KMS keys are typically available immediately
    // CloudFormation dependencies should be sufficient for proper ordering

    // =============================================================================
    // 2. VPC AND NETWORKING
    // =============================================================================

    const vpc = new ec2.Vpc(this, 'SecureVPC', {
      vpcName: `SecureVPC-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
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
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      natGateways: 1, // Single NAT Gateway for cost optimization, increase for HA
      flowLogs: {
        VPCFlowLogs: {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(),
          trafficType: ec2.FlowLogTrafficType.ALL,
        },
      },
    });

    // VPC Flow Logs with KMS encryption
    const vpcFlowLogsGroup = new logs.LogGroup(this, 'VPCFlowLogsGroup', {
      logGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Override removal policy for VPC flow logs
    (vpcFlowLogsGroup.node.defaultChild as logs.CfnLogGroup).applyRemovalPolicy(
      cdk.RemovalPolicy.DESTROY
    );

    // =============================================================================
    // 3. SECURITY GROUPS
    // =============================================================================

    // ALB Security Group - HTTPS only from trusted IPs
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });

    // Add trusted IP ranges - Replace with your actual trusted IPs
    const trustedIpRanges = [
      '203.0.113.0/24', // Example trusted IP range
      '198.51.100.0/24', // Example trusted IP range
    ];

    trustedIpRanges.forEach((ipRange, index) => {
      albSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(ipRange),
        ec2.Port.tcp(443),
        `Allow HTTPS from trusted IP range ${index + 1}`
      );
    });

    // Allow HTTP for redirect to HTTPS
    trustedIpRanges.forEach((ipRange, index) => {
      albSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(ipRange),
        ec2.Port.tcp(80),
        `Allow HTTP redirect from trusted IP range ${index + 1}`
      );
    });

    // EC2 Security Group - Only from ALB
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: false,
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );

    // Allow HTTPS outbound for package updates, API calls
    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound'
    );

    // Allow DNS
    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(53),
      'Allow DNS TCP'
    );

    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udp(53),
      'Allow DNS UDP'
    );

    // Lambda Security Group
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc,
        description: 'Security group for Lambda functions',
        allowAllOutbound: false,
      }
    );

    lambdaSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for AWS API calls'
    );

    // =============================================================================
    // 4. S3 BUCKETS WITH ENCRYPTION AND VERSIONING
    // =============================================================================

    // CloudTrail Logs Bucket
    const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailLogsBucket', {
      bucketName: `secure-cloudtrail-logs-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'CloudTrailLogsLifecycle',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          expiration: cdk.Duration.days(2555), // 7 years retention
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Application Assets Bucket
    const appAssetsBucket = new s3.Bucket(this, 'AppAssetsBucket', {
      bucketName: `secure-app-assets-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['https://*.yourdomain.com'], // Replace with your domain
          exposedHeaders: ['ETag'],
          maxAge: 3000,
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Access Logs Bucket for ALB
    const accessLogsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      bucketName: `secure-access-logs-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'AccessLogsLifecycle',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
          expiration: cdk.Duration.days(365),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // =============================================================================
    // 5. IAM ROLES AND POLICIES (LEAST PRIVILEGE)
    // =============================================================================

    // EC2 Instance Role
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with least privilege access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
      inlinePolicies: {
        EC2MinimalPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/ec2/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject'],
              resources: [`${appAssetsBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['secretsmanager:GetSecretValue'],
              resources: [
                `arn:aws:secretsmanager:${this.region}:${this.account}:secret:prod/app/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
                'kms:CreateGrant',
                'kms:ListGrants',
                'kms:RevokeGrant',
              ],
              resources: [kmsKey.keyArn],
              conditions: {
                StringEquals: {
                  'kms:ViaService': `ec2.${this.region}.amazonaws.com`,
                },
              },
            }),
          ],
        }),
      },
    });

    new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      role: ec2Role,
    });

    // Lambda Execution Role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'IAM role for Lambda functions with least privilege access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
      inlinePolicies: {
        LambdaMinimalPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['cloudwatch:PutMetricData'],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sns:Publish'],
              resources: [
                `arn:aws:sns:${this.region}:${this.account}:security-alerts`,
              ],
            }),
          ],
        }),
      },
    });

    // =============================================================================
    // 6. SECRETS MANAGER AND PARAMETER STORE
    // =============================================================================

    // Database credentials in Secrets Manager
    new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `prod/app/database-${environmentSuffix}`,
      description: 'Database credentials for the application',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
      encryptionKey: kmsKey,
    });

    // API Keys in Parameter Store
    // Note: Using StringParameter instead of CfnParameter for better CDK integration
    new ssm.StringParameter(this, 'APIKeyParameter', {
      parameterName: `/prod/app/api-key-${environmentSuffix}`,
      stringValue: 'placeholder-api-key', // Replace with actual API key
      description: 'API key for external service integration',
      tier: ssm.ParameterTier.STANDARD,
      // StringParameter creates a String type parameter by default
      // For SecureString, use AWS CLI: aws ssm put-parameter --name "param-name" --value "value" --type SecureString
    });

    // =============================================================================
    // 7. CLOUDTRAIL FOR AUDITING
    // =============================================================================

    const trail = new cloudtrail.Trail(this, 'SecurityAuditTrail', {
      trailName: `secure-infrastructure-audit-trail-${environmentSuffix}`,
      bucket: cloudTrailBucket,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      encryptionKey: kmsKey,
      sendToCloudWatchLogs: true,
      cloudWatchLogsRetention: logs.RetentionDays.ONE_YEAR,
      managementEvents: cloudtrail.ReadWriteType.ALL,
    });

    // Override removal policies for CloudTrail log group
    if (trail.logGroup) {
      (trail.logGroup.node.defaultChild as logs.CfnLogGroup).applyRemovalPolicy(
        cdk.RemovalPolicy.DESTROY
      );
    }

    // =============================================================================
    // 8. AWS CONFIG FOR COMPLIANCE MONITORING
    // =============================================================================

    // Check if Config should be created or use existing
    const createConfig = this.node.tryGetContext('createConfig') ?? false;

    let configBucket: s3.Bucket;
    let configRole: iam.Role;

    if (createConfig) {
      // Config Bucket
      configBucket = new s3.Bucket(this, 'ConfigBucket', {
        bucketName: `secure-config-${environmentSuffix}-${this.account}-${this.region}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        versioned: true,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      // Config Service Role
      configRole = new iam.Role(this, 'ConfigRole', {
        assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWS_ConfigRole'
          ),
        ],
        inlinePolicies: {
          ConfigBucketPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  's3:GetBucketAcl',
                  's3:GetBucketLocation',
                  's3:ListBucket',
                ],
                resources: [configBucket.bucketArn],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['s3:PutObject'],
                resources: [`${configBucket.bucketArn}/*`],
                conditions: {
                  StringEquals: {
                    's3:x-amz-acl': 'bucket-owner-full-control',
                  },
                },
              }),
            ],
          }),
        },
      });

      // Config Configuration Recorder
      const configRecorder = new config.CfnConfigurationRecorder(
        this,
        'ConfigRecorder',
        {
          name: `secure-infrastructure-recorder-${environmentSuffix}`,
          roleArn: configRole.roleArn,
          recordingGroup: {
            allSupported: true,
            includeGlobalResourceTypes: true,
            resourceTypes: [],
          },
        }
      );

      // Config Delivery Channel
      const configDeliveryChannel = new config.CfnDeliveryChannel(
        this,
        'ConfigDeliveryChannel',
        {
          name: `secure-infrastructure-delivery-channel-${environmentSuffix}`,
          s3BucketName: configBucket.bucketName,
          configSnapshotDeliveryProperties: {
            deliveryFrequency: 'TwentyFour_Hours',
          },
        }
      );

      configDeliveryChannel.addDependency(configRecorder);

      // Config Rules for Security Compliance
      const configRules = [
        {
          ruleName: 'encrypted-volumes',
          source: 'AWS',
          sourceIdentifier: 'ENCRYPTED_VOLUMES',
        },
        {
          ruleName: 's3-bucket-level-public-access-prohibited',
          source: 'AWS',
          sourceIdentifier: 'S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED',
        },
        {
          ruleName: 's3-bucket-ssl-requests-only',
          source: 'AWS',
          sourceIdentifier: 'S3_BUCKET_SSL_REQUESTS_ONLY',
        },
        {
          ruleName: 'cloudtrail-enabled',
          source: 'AWS',
          sourceIdentifier: 'CLOUD_TRAIL_ENABLED',
        },
        {
          ruleName: 'iam-password-policy',
          source: 'AWS',
          sourceIdentifier: 'IAM_PASSWORD_POLICY',
        },
      ];

      configRules.forEach((rule, index) => {
        new config.CfnConfigRule(this, `ConfigRule${index}`, {
          configRuleName: rule.ruleName,
          source: {
            owner: rule.source,
            sourceIdentifier: rule.sourceIdentifier,
          },
        }).addDependency(configRecorder);
      });
    } else {
      // Reference existing Config resources
      // In production, you would typically reference existing Config bucket and role
      // For now, we'll create minimal resources that don't conflict

      // Create a bucket for this stack's specific needs (not for Config service)
      configBucket = new s3.Bucket(this, 'StackConfigBucket', {
        bucketName: `stack-specific-config-${environmentSuffix}-${this.account}-${this.region}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        versioned: true,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      // Create a role for stack-specific operations (not for Config service)
      configRole = new iam.Role(this, 'StackConfigRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        description: 'Role for stack-specific configuration operations',
        inlinePolicies: {
          StackConfigPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['s3:GetObject', 's3:PutObject'],
                resources: [`${configBucket.bucketArn}/*`],
              }),
            ],
          }),
        },
      });

      // Add Config Rules that can work with existing Config service
      // These rules don't require a specific recorder and can use the existing one
      const configRules = [
        {
          ruleName: `stack-encrypted-volumes-${environmentSuffix}`,
          source: 'AWS',
          sourceIdentifier: 'ENCRYPTED_VOLUMES',
        },
        {
          ruleName: `stack-s3-bucket-level-public-access-prohibited-${environmentSuffix}`,
          source: 'AWS',
          sourceIdentifier: 'S3_BUCKET_LEVEL_PUBLIC_ACCESS_PROHIBITED',
        },
        {
          ruleName: `stack-s3-bucket-ssl-requests-only-${environmentSuffix}`,
          source: 'AWS',
          sourceIdentifier: 'S3_BUCKET_SSL_REQUESTS_ONLY',
        },
      ];

      configRules.forEach((rule, index) => {
        new config.CfnConfigRule(this, `StackConfigRule${index}`, {
          configRuleName: rule.ruleName,
          source: {
            owner: rule.source,
            sourceIdentifier: rule.sourceIdentifier,
          },
          // Don't add dependency on configRecorder since we're using existing Config service
        });
      });
    }

    // =============================================================================
    // 9. WAF FOR THREAT PROTECTION
    // =============================================================================

    const webAcl = new wafv2.CfnWebACL(this, 'SecureWebACL', {
      name: `secure-infrastructure-waf-${environmentSuffix}`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      description: 'WAF for secure infrastructure protection',
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
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 3,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLiRuleSetMetric',
          },
        },
        {
          name: 'RateLimitRule',
          priority: 4,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'SecureWebACLMetric',
      },
    });

    // =============================================================================
    // 10. APPLICATION LOAD BALANCER WITH HTTPS
    // =============================================================================

    // SSL Certificate - OPTIONAL: Enable this when you have a real domain
    // For testing/development, you can deploy without SSL and use HTTP only
    // To enable SSL:
    // 1. Replace 'yourdomain.com' with your actual domain
    // 2. Ensure you have a Route53 hosted zone for DNS validation
    // 3. Uncomment the certificate code and HTTPS listener below

    // Uncomment the following lines when you're ready to use SSL:
    /*
    const certificate = new certificatemanager.Certificate(
      this,
      'SSLCertificate',
      {
        domainName: '*.yourdomain.com', // Replace with your actual domain
        validation: certificatemanager.CertificateValidation.fromDns(),
      }
    );
    */

    const alb = new elbv2.ApplicationLoadBalancer(this, 'SecureALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      loadBalancerName: `secure-alb-${environmentSuffix}`,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      dropInvalidHeaderFields: true,
      idleTimeout: cdk.Duration.seconds(60),
    });

    // Enable access logs for ALB
    alb.logAccessLogs(accessLogsBucket, 'alb-logs');

    // Associate WAF with ALB
    new wafv2.CfnWebACLAssociation(this, 'ALBWafAssociation', {
      resourceArn: alb.loadBalancerArn,
      webAclArn: webAcl.attrArn,
    });

    // Create target group for EC2 instances
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'SecureTargetGroup',
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200-399',
          interval: cdk.Duration.seconds(30),
          path: '/health',
          protocol: elbv2.Protocol.HTTP,
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
        deregistrationDelay: cdk.Duration.seconds(30),
        stickinessCookieDuration: cdk.Duration.hours(1),
      }
    );

    // HTTPS Listener with SSL Certificate - UNCOMMENT when you enable the certificate above
    /*
    alb.addListener('HTTPSListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [certificate], // Requires certificate to be uncommented above
      sslPolicy: elbv2.SslPolicy.TLS13_RES,
      defaultTargetGroups: [targetGroup],
    });
    */

    // HTTP Listener - For now, serves traffic directly (change to redirect when HTTPS is enabled)
    alb.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup], // Serves traffic directly without SSL
      // When you enable HTTPS, change the above to a redirect:
      // defaultAction: elbv2.ListenerAction.redirect({
      //   protocol: 'HTTPS',
      //   port: '443',
      //   permanent: true,
      // }),
    });

    // Allow ALB to communicate with EC2 instances
    albSecurityGroup.addEgressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(80),
      'Allow ALB to reach EC2 instances'
    );

    // =============================================================================
    // 11. API GATEWAY WITH HTTPS AND WAF
    // =============================================================================

    const api = new apigateway.RestApi(this, 'SecureAPI', {
      restApiName: `secure-infrastructure-api-${environmentSuffix}`,
      description: 'Secure API with comprehensive security controls',
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true,
        metricsEnabled: true,
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 10000,
      },
      cloudWatchRole: true,
      defaultCorsPreflightOptions: {
        allowOrigins: ['https://*.yourdomain.com'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        maxAge: cdk.Duration.hours(1),
      },
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['execute-api:/*/*/*'],
          }),
        ],
      }),
    });

    // Associate WAF with API Gateway - wait for deployment to complete
    const apiWafAssociation = new wafv2.CfnWebACLAssociation(
      this,
      'APIGatewayWafAssociation',
      {
        resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${api.restApiId}/stages/prod`,
        webAclArn: webAcl.attrArn,
      }
    );

    // Ensure WAF association waits for API deployment
    apiWafAssociation.node.addDependency(api.deploymentStage);

    // API Gateway Access Logs
    new logs.LogGroup(this, 'APIGatewayLogGroup', {
      logGroupName: `/aws/apigateway/${api.restApiId}`,
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // =============================================================================
    // 12. LAMBDA FUNCTIONS FOR LOG PROCESSING AND ANOMALY DETECTION
    // =============================================================================

    // SNS Topic for Security Alerts
    const securityAlertsTopic = new sns.Topic(this, 'SecurityAlertsTopic', {
      topicName: `security-alerts-${environmentSuffix}`,
      displayName: 'Security Alerts',
      masterKey: kmsKey,
    });

    // Lambda function for log processing
    const logProcessorFunction = new lambda.Function(
      this,
      'LogProcessorFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const sns = new AWS.SNS();
        const cloudwatch = new AWS.CloudWatch();
        
        exports.handler = async (event) => {
          console.log('Processing logs:', JSON.stringify(event));
          
          // Parse CloudWatch Logs
          const logEvents = JSON.parse(Buffer.from(event.awslogs.data, 'base64').toString());
          
          // Check for suspicious patterns
          const suspiciousPatterns = [
            /unauthorized/i,
            /denied/i,
            /failed authentication/i,
            /sql injection/i,
            /xss attack/i,
            /brute force/i
          ];
          
          for (const logEvent of logEvents.logEvents) {
            const message = logEvent.message;
            
            for (const pattern of suspiciousPatterns) {
              if (pattern.test(message)) {
                // Send alert
                await sns.publish({
                  TopicArn: process.env.SNS_TOPIC_ARN,
                  Subject: 'Security Alert Detected',
                  Message: JSON.stringify({
                    timestamp: new Date(logEvent.timestamp).toISOString(),
                    logGroup: logEvents.logGroup,
                    logStream: logEvents.logStream,
                    message: message,
                    pattern: pattern.toString()
                  }, null, 2)
                }).promise();
                
                // Publish custom metric
                await cloudwatch.putMetricData({
                  Namespace: 'Security/Monitoring',
                  MetricData: [{
                    MetricName: 'SuspiciousActivity',
                    Value: 1,
                    Unit: 'Count',
                    Timestamp: new Date(),
                    Dimensions: [
                      { Name: 'Pattern', Value: pattern.toString() },
                      { Name: 'LogGroup', Value: logEvents.logGroup }
                    ]
                  }]
                }).promise();
              }
            }
          }
          
          return { statusCode: 200, body: 'Logs processed successfully' };
        };
      `),
        functionName: `secure-log-processor-${environmentSuffix}`,
        description: 'Process logs and detect security anomalies',
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        role: lambdaRole,
        environment: {
          SNS_TOPIC_ARN: securityAlertsTopic.topicArn,
        },
        vpc: vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [lambdaSecurityGroup],
        logRetention: logs.RetentionDays.ONE_YEAR,
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    // Grant permissions to Lambda
    securityAlertsTopic.grantPublish(logProcessorFunction);
    logProcessorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
      })
    );

    // =============================================================================
    // 13. CLOUDWATCH ALARMS AND MONITORING
    // =============================================================================

    // Alarm for high number of security incidents
    const securityIncidentAlarm = new cloudwatch.Alarm(
      this,
      'SecurityIncidentAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'Security/Monitoring',
          metricName: 'SuspiciousActivity',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 10,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'Alert when suspicious activity exceeds threshold',
        alarmName: `HighSecurityIncidents-${environmentSuffix}`,
      }
    );

    securityIncidentAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityAlertsTopic)
    );

    // Alarm for WAF blocked requests
    const wafBlockedRequestsAlarm = new cloudwatch.Alarm(
      this,
      'WAFBlockedRequestsAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/WAFV2',
          metricName: 'BlockedRequests',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
          dimensionsMap: {
            WebACL: webAcl.name!,
            Region: this.region,
            Rule: 'ALL',
          },
        }),
        threshold: 100,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'Alert when WAF blocks high number of requests',
        alarmName: `HighWAFBlockedRequests-${environmentSuffix}`,
      }
    );

    wafBlockedRequestsAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityAlertsTopic)
    );

    // =============================================================================
    // 14. EC2 INSTANCES WITH ENCRYPTED EBS VOLUMES
    // =============================================================================

    // EC2 Launch Template with encrypted EBS
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Secure Web Application</h1>" > /var/www/html/index.html',
      'echo "OK" > /var/www/html/health'
    );

    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'SecureLaunchTemplate',
      {
        launchTemplateName: `secure-instance-template-${environmentSuffix}`,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        userData: userData,
        role: ec2Role,
        securityGroup: ec2SecurityGroup,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              encrypted: true,
              kmsKey: kmsKey,
              volumeType: ec2.EbsDeviceVolumeType.GP3,
              deleteOnTermination: true,
            }),
          },
        ],
        requireImdsv2: true,
        httpTokens: ec2.LaunchTemplateHttpTokens.REQUIRED,
        httpPutResponseHopLimit: 1,
      }
    );

    // Ensure the launch template depends on the KMS key being ready
    launchTemplate.node.addDependency(kmsKey);

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'SecureASG',
      {
        vpc,
        launchTemplate: launchTemplate,
        minCapacity: 0,
        maxCapacity: 3,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(5),
        }),
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 1,
          minInstancesInService: 0,
        }),
      }
    );

    // Ensure ASG depends on KMS key and launch template being ready
    autoScalingGroup.node.addDependency(kmsKey);
    autoScalingGroup.node.addDependency(launchTemplate);

    // Register ASG with target group
    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // Auto scaling based on CPU utilization
    autoScalingGroup.scaleOnCpuUtilization('CPUScaling', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });

    // =============================================================================
    // 15. OUTPUTS
    // =============================================================================

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VPCId`,
    });

    new cdk.CfnOutput(this, 'ALBDNSName', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
      exportName: `${this.stackName}-ALBDNSName`,
    });

    new cdk.CfnOutput(this, 'APIGatewayURL', {
      value: api.url,
      description: 'API Gateway URL',
      exportName: `${this.stackName}-APIGatewayURL`,
    });

    new cdk.CfnOutput(this, 'CloudTrailBucketName', {
      value: cloudTrailBucket.bucketName,
      description: 'CloudTrail S3 Bucket Name',
      exportName: `${this.stackName}-CloudTrailBucket`,
    });

    new cdk.CfnOutput(this, 'SecurityAlertsTopicArn', {
      value: securityAlertsTopic.topicArn,
      description: 'SNS Topic ARN for Security Alerts',
      exportName: `${this.stackName}-SecurityAlertsTopic`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: `${this.stackName}-KMSKeyId`,
    });

    new cdk.CfnOutput(this, 'WebACLArn', {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
      exportName: `${this.stackName}-WebACLArn`,
    });
  }
}

export { SecureInfrastructureStack as TapStack };
