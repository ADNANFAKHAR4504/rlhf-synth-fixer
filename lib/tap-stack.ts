import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  /**
   * Allowed IP addresses for SSH and HTTP access
   */
  allowedIpAddresses: string[];

  /**
   * Database configuration
   */
  databaseConfig?: {
    instanceType?: ec2.InstanceType;
    multiAz?: boolean;
    backupRetention?: cdk.Duration;
  };
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly kmsKey: kms.Key;
  public readonly securityGroup: ec2.SecurityGroup;
  public readonly database: rds.DatabaseInstance;
  public readonly s3Bucket: s3.Bucket;
  public readonly ec2Instance?: ec2.Instance; // LocalStack: Made optional
  public readonly cloudTrail: cloudtrail.Trail;
  public readonly flowLogsGroup: logs.LogGroup;
  public readonly cloudTrailLogGroup: logs.LogGroup;
  public readonly mfaPolicy: iam.ManagedPolicy;
  public readonly financeGroup: iam.Group;
  public readonly webAcl: wafv2.CfnWebACL;
  public readonly securityAlertsTopic: cdk.aws_sns.Topic;
  private readonly deploymentId: string;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, {
      ...props,
      env: {
        region: 'us-east-1',
        ...props.env,
      },
    });

    // Create a unique deployment identifier using current timestamp
    // This helps avoid conflicts with previous deployments
    this.deploymentId = Date.now().toString().slice(-8);

    // 1. Create KMS Key for encryption across all services
    this.kmsKey = this.createKmsKey();

    // 2. Create VPC with Flow Logs
    const vpcResult = this.createVpcWithFlowLogs();
    this.vpc = vpcResult.vpc;
    this.flowLogsGroup = vpcResult.flowLogsGroup;

    // 3. Create Security Groups with restricted access
    this.securityGroup = this.createSecurityGroups(props.allowedIpAddresses);

    // 4. Create S3 Bucket with KMS encryption
    this.s3Bucket = this.createSecureS3Bucket();

    // 5. Create RDS instance (private)
    this.database = this.createPrivateRdsInstance(props.databaseConfig);

    // 6. Create EC2 instance with security groups
    // LocalStack: EC2 instances have limited support, commenting out for Community Edition
    // this.ec2Instance = this.createSecureEc2Instance();

    // 7. Enable CloudTrail for all regions
    const cloudTrailResult = this.enableCloudTrail();
    this.cloudTrail = cloudTrailResult.trail;
    this.cloudTrailLogGroup = cloudTrailResult.logGroup;

    // 8. Create IAM policies for MFA enforcement
    const iamResult = this.createMfaEnforcementPolicies();
    this.mfaPolicy = iamResult.mfaPolicy;
    this.financeGroup = iamResult.financeGroup;

    // 9. Enable AWS Shield Advanced and WAF
    this.webAcl = this.enableDdosProtection();

    // 10. Add additional security configurations
    this.securityAlertsTopic = this.addSecurityConfigurations();

    // Output important resource information
    this.createOutputs();
  }

  private createKmsKey(): kms.Key {
    const key = new kms.Key(this, 'TapKmsKey', {
      description: 'KMS Key for TAP Financial Services Application - LocalStack Community',
      enableKeyRotation: false, // LocalStack: Key rotation not supported in Community
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // LocalStack: Use DESTROY for cleanup
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
            conditions: {
              StringEquals: {
                'kms:EncryptionContext:aws:cloudtrail:arn': `arn:aws:cloudtrail:${this.region}:${this.account}:trail/tap-financial-services-trail-${this.stackName.toLowerCase()}`,
              },
            },
          }),
          new iam.PolicyStatement({
            sid: 'Allow CloudWatch Logs to encrypt logs',
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
                'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${this.region}:${this.account}:log-group:/tap/${this.stackName.toLowerCase()}-${this.deploymentId}/*`,
              },
            },
          }),
        ],
      }),
    });

    new kms.Alias(this, 'TapKmsKeyAlias', {
      aliasName: 'alias/tap-financial-services',
      targetKey: key,
    });

    return key;
  }

  private createVpcWithFlowLogs(): {
    vpc: ec2.Vpc;
    flowLogsGroup: logs.LogGroup;
  } {
    // Create VPC Flow Logs CloudWatch Log Group
    const flowLogsGroup = new logs.LogGroup(this, 'VpcFlowLogsGroup', {
      logGroupName: `/tap/${this.stackName.toLowerCase()}-${this.deploymentId}/vpc/flowlogs`,
      retention: logs.RetentionDays.ONE_WEEK, // LocalStack: Shorter retention for testing
      encryptionKey: this.kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // LocalStack: Use DESTROY for cleanup
    });

    // Create IAM role for VPC Flow Logs
    const flowLogsRole = new iam.Role(this, 'VpcFlowLogsRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      inlinePolicies: {
        FlowLogsDeliveryRolePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              resources: [flowLogsGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    // Create VPC
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2, // LocalStack: Reduce to 2 AZs for simplicity
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
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      flowLogs: {
        cloudWatchLogs: {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(
            flowLogsGroup,
            flowLogsRole
          ),
          trafficType: ec2.FlowLogTrafficType.ALL,
        },
      },
    });

    // Add VPC Endpoints for security
    vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    vpc.addGatewayEndpoint('DynamoDbEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    return { vpc, flowLogsGroup };
  }

  private createSecurityGroups(
    allowedIpAddresses: string[]
  ): ec2.SecurityGroup {
    const securityGroup = new ec2.SecurityGroup(this, 'TapSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for TAP Financial Services Application',
      allowAllOutbound: false,
    });

    // Allow HTTP traffic only from specified IP addresses
    allowedIpAddresses.forEach(ip => {
      securityGroup.addIngressRule(
        ec2.Peer.ipv4(ip),
        ec2.Port.tcp(80),
        `Allow HTTP from ${ip}`
      );

      securityGroup.addIngressRule(
        ec2.Peer.ipv4(ip),
        ec2.Port.tcp(443),
        `Allow HTTPS from ${ip}`
      );

      securityGroup.addIngressRule(
        ec2.Peer.ipv4(ip),
        ec2.Port.tcp(22),
        `Allow SSH from ${ip}`
      );
    });

    // Allow outbound HTTPS for package updates and API calls
    securityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow outbound HTTPS'
    );

    securityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow outbound HTTP'
    );

    return securityGroup;
  }

  private createSecureS3Bucket(): s3.Bucket {
    const bucket = new s3.Bucket(this, 'TapS3Bucket', {
      bucketName: `financial-services-${this.stackName.toLowerCase()}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // LocalStack: Use DESTROY for cleanup
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          id: 'TransitionToIA',
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
        },
      ],
      serverAccessLogsPrefix: 'access-logs/',
      notificationsHandlerRole: new iam.Role(
        this,
        'BucketNotificationsHandlerRole',
        {
          assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
          managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName(
              'service-role/AWSLambdaBasicExecutionRole'
            ),
          ],
        }
      ),
    });

    // Add bucket policy for additional security
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    // Add bucket policy for CloudTrail access
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSCloudTrailAclCheck',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:GetBucketAcl'],
        resources: [bucket.bucketArn],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudtrail:${this.region}:${this.account}:trail/tap-financial-services-trail-${this.stackName.toLowerCase()}`,
          },
        },
      })
    );

    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSCloudTrailWrite',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${bucket.bucketArn}/cloudtrail-logs/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
            'AWS:SourceArn': `arn:aws:cloudtrail:${this.region}:${this.account}:trail/tap-financial-services-trail-${this.stackName.toLowerCase()}`,
          },
        },
      })
    );

    return bucket;
  }

  private createPrivateRdsInstance(
    config?: TapStackProps['databaseConfig']
  ): rds.DatabaseInstance {
    // Create subnet group for RDS in isolated subnets
    const subnetGroup = new rds.SubnetGroup(this, 'TapDbSubnetGroup', {
      vpc: this.vpc,
      description: 'Subnet group for TAP RDS instance',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Create security group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'TapDbSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for TAP RDS instance',
      allowAllOutbound: false,
    });

    // Allow access from application security group only
    dbSecurityGroup.addIngressRule(
      this.securityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from application'
    );

    const database = new rds.DatabaseInstance(this, 'TapDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_13,
      }),
      instanceType:
        config?.instanceType ||
        ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: this.vpc,
      subnetGroup,
      securityGroups: [dbSecurityGroup],
      multiAz: false, // LocalStack: Multi-AZ is Pro-only, use single-AZ
      storageEncrypted: true,
      storageEncryptionKey: this.kmsKey,
      backupRetention: cdk.Duration.days(1), // LocalStack: Minimal backup retention
      deletionProtection: false, // LocalStack: Disable for easy cleanup
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // LocalStack: Use DESTROY for cleanup
      publiclyAccessible: false,
      monitoringInterval: cdk.Duration.seconds(0), // LocalStack: Disable enhanced monitoring
      enablePerformanceInsights: false, // LocalStack: Performance Insights not supported
      cloudwatchLogsExports: [], // LocalStack: Simplified logging
      credentials: rds.Credentials.fromGeneratedSecret('tapdbadmin', {
        secretName: 'tap/database/credentials',
        encryptionKey: this.kmsKey,
      }),
      parameterGroup: new rds.ParameterGroup(this, 'TapDbParameterGroup', {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15_13,
        }),
        parameters: {
          log_statement: 'all',
          log_min_duration_statement: '1000',
          shared_preload_libraries: 'pg_stat_statements',
        },
      }),
    });

    return database;
  }

  private createSecureEc2Instance(): ec2.Instance {
    // Create IAM role for EC2 instance
    const ec2Role = new iam.Role(this, 'TapEc2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [`${this.s3Bucket.bucketArn}/*`],
            }),
          ],
        }),
      },
    });

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y aws-cli',
      // Install and configure CloudWatch agent
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux'
    );

    const instance = new ec2.Instance(this, 'TapEc2Instance', {
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: this.securityGroup,
      role: ec2Role,
      userData,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            encrypted: true,
            kmsKey: this.kmsKey,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
      requireImdsv2: true,
    });

    return instance;
  }

  private enableCloudTrail(): {
    trail: cloudtrail.Trail;
    logGroup: logs.LogGroup;
  } {
    // Create CloudWatch Log Group for CloudTrail
    const cloudTrailLogGroup = new logs.LogGroup(this, 'CloudTrailLogGroup', {
      logGroupName: `/tap/${this.stackName.toLowerCase()}-${this.deploymentId}/cloudtrail/logs`,
      retention: logs.RetentionDays.ONE_WEEK, // LocalStack: Shorter retention for testing
      encryptionKey: this.kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // LocalStack: Use DESTROY for cleanup
    });

    // Note: CloudTrail doesn't require a separate role when using CloudWatch Logs
    // The service has built-in permissions to write to CloudWatch Logs

    const trail = new cloudtrail.Trail(this, 'TapCloudTrail', {
      trailName: `tap-financial-services-trail-${this.stackName.toLowerCase()}`,
      bucket: this.s3Bucket,
      s3KeyPrefix: 'cloudtrail-logs/',
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: false, // LocalStack: Single region only for Community
      enableFileValidation: false, // LocalStack: Simplified validation
      encryptionKey: this.kmsKey,
      cloudWatchLogGroup: cloudTrailLogGroup,
    });

    return { trail, logGroup: cloudTrailLogGroup };
  }

  private createMfaEnforcementPolicies(): {
    mfaPolicy: iam.ManagedPolicy;
    financeGroup: iam.Group;
  } {
    // Create MFA enforcement policy
    const mfaPolicy = new iam.ManagedPolicy(this, 'TapMfaEnforcementPolicy', {
      managedPolicyName: `TapMfaEnforcementPolicy-${this.stackName}`,
      description: 'Policy to enforce MFA for all IAM users',
      statements: [
        new iam.PolicyStatement({
          sid: 'AllowViewAccountInfo',
          effect: iam.Effect.ALLOW,
          actions: [
            'iam:GetAccountPasswordPolicy',
            'iam:ListVirtualMFADevices',
            'iam:GetAccountSummary',
          ],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          sid: 'AllowManageOwnPasswords',
          effect: iam.Effect.ALLOW,
          actions: ['iam:ChangePassword', 'iam:GetUser'],
          resources: ['arn:aws:iam::*:user/${aws:username}'],
        }),
        new iam.PolicyStatement({
          sid: 'AllowManageOwnMFA',
          effect: iam.Effect.ALLOW,
          actions: [
            'iam:CreateVirtualMFADevice',
            'iam:DeleteVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:ListMFADevices',
            'iam:ResyncMFADevice',
          ],
          resources: [
            'arn:aws:iam::*:mfa/${aws:username}',
            'arn:aws:iam::*:user/${aws:username}',
          ],
        }),
        new iam.PolicyStatement({
          sid: 'DenyAllExceptUnlessSignedInWithMFA',
          effect: iam.Effect.DENY,
          notActions: [
            'iam:CreateVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:GetUser',
            'iam:ListMFADevices',
            'iam:ListVirtualMFADevices',
            'iam:ResyncMFADevice',
            'sts:GetSessionToken',
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

    // Create a group for financial services users
    const financeGroup = new iam.Group(this, 'TapFinanceGroup', {
      groupName: `TapFinanceUsers-${this.stackName}`,
      managedPolicies: [mfaPolicy],
    });

    // Create password policy using AWS CLI Custom Resource
    // Note: AccountPasswordPolicy is not available as a CloudFormation resource
    // This would typically be configured through AWS CLI or Console
    // For infrastructure as code, consider using AWS Config rules to monitor compliance

    // Alternative: Create a custom resource to set password policy
    // Note: This is a placeholder for future password policy implementation
    // TODO: Implement password policy custom resource when needed
    /*
    const passwordPolicyCustomResource = new cdk.CustomResource(
      this,
      'TapPasswordPolicy',
      {
        serviceToken: new cdk.aws_lambda.Function(
          this,
          'PasswordPolicyFunction',
          {
            runtime: cdk.aws_lambda.Runtime.PYTHON_3_9,
            handler: 'index.handler',
            code: cdk.aws_lambda.Code.fromInline(`
import boto3
import json
import cfnresponse

def handler(event, context):
    try:
        iam = boto3.client('iam')
        
        if event['RequestType'] == 'Create' or event['RequestType'] == 'Update':
            iam.update_account_password_policy(
                MinimumPasswordLength=14,
                RequireUppercaseCharacters=True,
                RequireLowercaseCharacters=True,
                RequireNumbers=True,
                RequireSymbols=True,
                MaxPasswordAge=90,
                PasswordReusePrevention=12,
                AllowUsersToChangePassword=True
            )
        
        cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
    except Exception as e:
        print(f"Error: {str(e)}")
        cfnresponse.send(event, context, cfnresponse.FAILED, {})
        `),
            role: new iam.Role(this, 'PasswordPolicyLambdaRole', {
              assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
              managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName(
                  'service-role/AWSLambdaBasicExecutionRole'
                ),
              ],
              inlinePolicies: {
                PasswordPolicyAccess: new iam.PolicyDocument({
                  statements: [
                    new iam.PolicyStatement({
                      effect: iam.Effect.ALLOW,
                      actions: [
                        'iam:UpdateAccountPasswordPolicy',
                        'iam:GetAccountPasswordPolicy',
                      ],
                      resources: ['*'],
                    }),
                  ],
                }),
              },
            }),
          }
        ).functionArn,
      }
    );
    */

    return { mfaPolicy, financeGroup };
  }

  private enableDdosProtection(): wafv2.CfnWebACL {
    // Note: AWS Shield Advanced requires manual activation and has costs
    // This creates the WAF WebACL for additional protection
    // LocalStack: Changed from CLOUDFRONT to REGIONAL scope for Community support

    const webAcl = new wafv2.CfnWebACL(this, 'TapWebAcl', {
      scope: 'REGIONAL', // LocalStack: CLOUDFRONT scope not fully supported, use REGIONAL
      defaultAction: { allow: {} },
      name: `TapFinancialServicesWebACL-${this.stackName}`,
      description: 'WebACL for TAP Financial Services Application',
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
            metricName: 'KnownBadInputsRuleSetMetric',
          },
        },
        {
          name: 'RateLimitRule',
          priority: 3,
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
            metricName: 'RateLimitRuleMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'TapWebAclMetric',
      },
    });

    return webAcl;
  }

  private addSecurityConfigurations(): cdk.aws_sns.Topic {
    // Note: AWS Config can be manually enabled in the AWS Console for compliance monitoring
    // Note: GuardDuty requires manual activation in the AWS Console
    // This section focuses on other security configurations that can be automated

    // Create SNS topic for security alerts
    const securityAlertsTopic = new cdk.aws_sns.Topic(
      this,
      'SecurityAlertsTopic',
      {
        topicName: `tap-security-alerts-${this.stackName.toLowerCase()}`,
        displayName: 'TAP Security Alerts',
        masterKey: this.kmsKey,
      }
    );

    // Create CloudWatch alarms for security monitoring
    const unauthorizedApiCallsAlarm = new cdk.aws_cloudwatch.Alarm(
      this,
      'UnauthorizedApiCallsAlarm',
      {
        alarmName: `tap-unauthorized-api-calls-${this.stackName.toLowerCase()}`,
        alarmDescription: 'Alarm for unauthorized API calls',
        metric: new cdk.aws_cloudwatch.Metric({
          namespace: 'CloudWatchLogs',
          metricName: 'UnauthorizedAPICalls',
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
      }
    );

    unauthorizedApiCallsAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(securityAlertsTopic)
    );

    return securityAlertsTopic;
  }

  private createOutputs(): void {
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for TAP Financial Services',
      exportName: 'TapVpcId',
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: this.kmsKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: 'TapKmsKeyId',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.s3Bucket.bucketName,
      description: 'S3 Bucket name for TAP application',
      exportName: 'TapS3BucketName',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.instanceEndpoint.hostname,
      description: 'RDS Database endpoint',
      exportName: 'TapDatabaseEndpoint',
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: this.securityGroup.securityGroupId,
      description: 'Security Group ID for application instances',
      exportName: 'TapSecurityGroupId',
    });

    // LocalStack: EC2 outputs commented out as EC2 instance is disabled
    // new cdk.CfnOutput(this, 'EC2InstanceId', {
    //   value: this.ec2Instance.instanceId,
    //   description: 'EC2 Instance ID for TAP application',
    //   exportName: 'TapEC2InstanceId',
    // });

    // new cdk.CfnOutput(this, 'EC2PrivateIP', {
    //   value: this.ec2Instance.instancePrivateIp,
    //   description: 'EC2 Instance Private IP',
    //   exportName: 'TapEC2PrivateIP',
    // });

    new cdk.CfnOutput(this, 'CloudTrailArn', {
      value: this.cloudTrail.trailArn,
      description: 'CloudTrail ARN for audit logging',
      exportName: 'TapCloudTrailArn',
    });

    new cdk.CfnOutput(this, 'CloudTrailLogGroupName', {
      value: this.cloudTrailLogGroup.logGroupName,
      description: 'CloudTrail CloudWatch Log Group name',
      exportName: 'TapCloudTrailLogGroupName',
    });

    new cdk.CfnOutput(this, 'VpcFlowLogsGroupName', {
      value: this.flowLogsGroup.logGroupName,
      description: 'VPC Flow Logs CloudWatch Log Group name',
      exportName: 'TapVpcFlowLogsGroupName',
    });

    new cdk.CfnOutput(this, 'MfaPolicyArn', {
      value: this.mfaPolicy.managedPolicyArn,
      description: 'MFA Enforcement Policy ARN',
      exportName: 'TapMfaPolicyArn',
    });

    new cdk.CfnOutput(this, 'FinanceGroupName', {
      value: this.financeGroup.groupName,
      description: 'Finance Users IAM Group name',
      exportName: 'TapFinanceGroupName',
    });

    new cdk.CfnOutput(this, 'WebAclId', {
      value: this.webAcl.attrId,
      description: 'WAF WebACL ID for DDoS protection',
      exportName: 'TapWebAclId',
    });

    new cdk.CfnOutput(this, 'WebAclArn', {
      value: this.webAcl.attrArn,
      description: 'WAF WebACL ARN for DDoS protection',
      exportName: 'TapWebAclArn',
    });

    new cdk.CfnOutput(this, 'WebAclName', {
      value: this.webAcl.name!,
      description: 'WAF WebACL Name for DDoS protection',
      exportName: 'TapWebAclName',
    });

    new cdk.CfnOutput(this, 'SecurityAlertsTopicArn', {
      value: this.securityAlertsTopic.topicArn,
      description: 'SNS Topic ARN for security alerts',
      exportName: 'TapSecurityAlertsTopicArn',
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: this.kmsKey.keyArn,
      description: 'KMS Key ARN for encryption',
      exportName: 'TapKmsKeyArn',
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: this.database.instanceEndpoint.port.toString(),
      description: 'RDS Database Port',
      exportName: 'TapDatabasePort',
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: this.vpc.vpcCidrBlock,
      description: 'VPC CIDR block',
      exportName: 'TapVpcCidr',
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public subnet IDs (comma-separated)',
      exportName: 'TapPublicSubnetIds',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private subnet IDs (comma-separated)',
      exportName: 'TapPrivateSubnetIds',
    });

    new cdk.CfnOutput(this, 'IsolatedSubnetIds', {
      value: this.vpc.isolatedSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Isolated subnet IDs (comma-separated)',
      exportName: 'TapIsolatedSubnetIds',
    });
  }
}
