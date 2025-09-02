I'll create a comprehensive AWS CDK template that meets all your security requirements. Here's the `secure-setup.ts` file:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface SecureSetupProps extends cdk.StackProps {
  /**
   * Corporate IP ranges that should have access to VPC endpoints
   * Example: ['203.0.113.0/24', '198.51.100.0/24']
   */
  corporateIpRanges: string[];

  /**
   * Email address for security alerts
   */
  alertEmail: string;

  /**
   * Environment name (e.g., 'prod', 'staging', 'dev')
   */
  environmentName: string;
}

export class SecureSetupStack extends cdk.Stack {
  public readonly kmsKey: kms.Key;
  public readonly vpc: ec2.Vpc;
  public readonly secureDataBucket: s3.Bucket;
  public readonly cloudTrailBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: SecureSetupProps) {
    super(scope, id, props);

    // 1. Create KMS Key for encryption across all resources
    this.kmsKey = this.createKMSKey();

    // 2. Create VPC with private subnets
    this.vpc = this.createSecureVPC();

    // 3. Create secure S3 buckets
    const buckets = this.createSecureS3Buckets();
    this.secureDataBucket = buckets.dataBucket;
    this.cloudTrailBucket = buckets.cloudTrailBucket;

    // 4. Create IAM roles and policies with least privilege
    const roles = this.createIAMRolesAndPolicies();

    // 5. Set up VPC endpoints with restricted access
    this.createVPCEndpoints(props.corporateIpRanges);

    // 6. Enable CloudTrail with encryption
    const trail = this.createCloudTrail();

    // 7. Set up CloudWatch monitoring and alerts
    this.createCloudWatchAlertsAndMonitoring(props.alertEmail, trail);

    // Output important resources
    this.createOutputs();
  }

  private createKMSKey(): kms.Key {
    const key = new kms.Key(this, 'SecureEnterpriseKMSKey', {
      alias: `secure-enterprise-key-${this.stackName}`,
      description: 'KMS key for encrypting sensitive enterprise data',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
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
              'kms:Decrypt'
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
              'kms:DescribeKey'
            ],
            resources: ['*'],
            conditions: {
              ArnEquals: {
                'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${this.region}:${this.account}:*`
              }
            }
          })
        ]
      })
    });

    cdk.Tags.of(key).add('Purpose', 'Enterprise Data Encryption');
    cdk.Tags.of(key).add('Compliance', 'Required');

    return key;
  }

  private createSecureVPC(): ec2.Vpc {
    const vpc = new ec2.Vpc(this, 'SecureEnterpriseVPC', {
      maxAzs: 3,
      natGateways: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 28,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }
      ]
    });

    // Enable VPC Flow Logs
    const flowLogRole = new iam.Role(this, 'FlowLogRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/VPCFlowLogsDeliveryRolePolicy')
      ]
    });

    const flowLogGroup = new logs.LogGroup(this, 'VPCFlowLogGroup', {
      logGroupName: `/aws/vpc/flowlogs/${this.stackName}`,
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: this.kmsKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    new ec2.FlowLog(this, 'VPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup, flowLogRole),
      trafficType: ec2.FlowLogTrafficType.ALL
    });

    cdk.Tags.of(vpc).add('Name', 'SecureEnterpriseVPC');
    cdk.Tags.of(vpc).add('Environment', 'Secure');

    return vpc;
  }

  private createSecureS3Buckets(): { dataBucket: s3.Bucket; cloudTrailBucket: s3.Bucket } {
    // Secure data bucket
    const dataBucket = new s3.Bucket(this, 'SecureDataBucket', {
      bucketName: `secure-enterprise-data-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
          enabled: true
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30)
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90)
            }
          ],
          enabled: true
        }
      ],
      serverAccessLogsPrefix: 'access-logs/',
      enforceSSL: true,
      minimumTLSVersion: 1.2
    });

    // CloudTrail bucket
    const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `secure-cloudtrail-logs-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'CloudTrailLogRetention',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30)
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90)
            }
          ],
          enabled: true
        }
      ],
      enforceSSL: true,
      minimumTLSVersion: 1.2
    });

    // Grant CloudTrail permissions to write to the bucket
    cloudTrailBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSCloudTrailAclCheck',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:GetBucketAcl'],
        resources: [cloudTrailBucket.bucketArn],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudtrail:${this.region}:${this.account}:trail/*`
          }
        }
      })
    );

    cloudTrailBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSCloudTrailWrite',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${cloudTrailBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
            'AWS:SourceArn': `arn:aws:cloudtrail:${this.region}:${this.account}:trail/*`
          }
        }
      })
    );

    return { dataBucket, cloudTrailBucket };
  }

  private createIAMRolesAndPolicies(): { dataAccessRole: iam.Role; adminRole: iam.Role } {
    // Data Access Role with MFA requirement
    const dataAccessRole = new iam.Role(this, 'SecureDataAccessRole', {
      roleName: `SecureDataAccess-${this.stackName}`,
      assumedBy: new iam.AccountPrincipal(this.account),
      description: 'Role for accessing secure enterprise data with MFA requirement',
      maxSessionDuration: cdk.Duration.hours(2),
      inlinePolicies: {
        SecureDataAccessPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: 'RequireMFAForAssumeRole',
              effect: iam.Effect.DENY,
              actions: ['*'],
              resources: ['*'],
              conditions: {
                BoolIfExists: {
                  'aws:MultiFactorAuthPresent': 'false'
                },
                NumericLessThan: {
                  'aws:MultiFactorAuthAge': '3600' // 1 hour
                }
              }
            }),
            new iam.PolicyStatement({
              sid: 'AllowSecureDataAccess',
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket'
              ],
              resources: [
                this.secureDataBucket.bucketArn,
                `${this.secureDataBucket.bucketArn}/*`
              ],
              conditions: {
                Bool: {
                  'aws:MultiFactorAuthPresent': 'true'
                }
              }
            }),
            new iam.PolicyStatement({
              sid: 'AllowKMSAccess',
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:Encrypt',
                'kms:GenerateDataKey',
                'kms:DescribeKey'
              ],
              resources: [this.kmsKey.keyArn],
              conditions: {
                Bool: {
                  'aws:MultiFactorAuthPresent': 'true'
                }
              }
            })
          ]
        })
      }
    });

    // Admin Role with enhanced MFA requirements
    const adminRole = new iam.Role(this, 'SecureAdminRole', {
      roleName: `SecureAdmin-${this.stackName}`,
      assumedBy: new iam.AccountPrincipal(this.account),
      description: 'Administrative role with strict MFA requirements',
      maxSessionDuration: cdk.Duration.hours(1),
      inlinePolicies: {
        SecureAdminPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: 'RequireMFAForAdmin',
              effect: iam.Effect.DENY,
              actions: ['*'],
              resources: ['*'],
              conditions: {
                BoolIfExists: {
                  'aws:MultiFactorAuthPresent': 'false'
                },
                NumericLessThan: {
                  'aws:MultiFactorAuthAge': '1800' // 30 minutes
                }
              }
            }),
            new iam.PolicyStatement({
              sid: 'AllowAdminAccess',
              effect: iam.Effect.ALLOW,
              actions: [
                'iam:*',
                'kms:*',
                's3:*',
                'cloudtrail:*',
                'cloudwatch:*',
                'logs:*'
              ],
              resources: ['*'],
              conditions: {
                Bool: {
                  'aws:MultiFactorAuthPresent': 'true'
                }
              }
            })
          ]
        })
      }
    });

    // Create a group that requires MFA for console access
    const mfaRequiredGroup = new iam.Group(this, 'MFARequiredGroup', {
      groupName: `MFARequired-${this.stackName}`,
      managedPolicies: [
        new iam.ManagedPolicy(this, 'MFARequiredPolicy', {
          managedPolicyName: `MFARequired-${this.stackName}`,
          description: 'Policy that requires MFA for all actions',
          statements: [
            new iam.PolicyStatement({
              sid: 'AllowViewAccountInfo',
              effect: iam.Effect.ALLOW,
              actions: [
                'iam:GetAccountPasswordPolicy',
                'iam:ListVirtualMFADevices'
              ],
              resources: ['*']
            }),
            new iam.PolicyStatement({
              sid: 'AllowManageOwnPasswords',
              effect: iam.Effect.ALLOW,
              actions: [
                'iam:ChangePassword',
                'iam:GetUser'
              ],
              resources: ['arn:aws:iam::*:user/${aws:username}']
            }),
            new iam.PolicyStatement({
              sid: 'AllowManageOwnMFA',
              effect: iam.Effect.ALLOW,
              actions: [
                'iam:CreateVirtualMFADevice',
                'iam:DeleteVirtualMFADevice',
                'iam:ListMFADevices',
                'iam:EnableMFADevice',
                'iam:ResyncMFADevice'
              ],
              resources: [
                'arn:aws:iam::*:mfa/${aws:username}',
                'arn:aws:iam::*:user/${aws:username}'
              ]
            }),
            new iam.PolicyStatement({
              sid: 'DenyAllExceptUnlessMFAAuthenticated',
              effect: iam.Effect.DENY,
              notActions: [
                'iam:CreateVirtualMFADevice',
                'iam:EnableMFADevice',
                'iam:GetUser',
                'iam:ListMFADevices',
                'iam:ListVirtualMFADevices',
                'iam:ResyncMFADevice',
                'sts:GetSessionToken'
              ],
              resources: ['*'],
              conditions: {
                BoolIfExists: {
                  'aws:MultiFactorAuthPresent': 'false'
                }
              }
            })
          ]
        })
      ]
    });

    return { dataAccessRole, adminRole };
  }

  private createVPCEndpoints(corporateIpRanges: string[]): void {
    // Security group for VPC endpoints - restrict to corporate IPs
    const vpcEndpointSG = new ec2.SecurityGroup(this, 'VPCEndpointSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for VPC endpoints - corporate access only',
      allowAllOutbound: false
    });

    // Add ingress rules for corporate IP ranges
    corporateIpRanges.forEach((ipRange, index) => {
      vpcEndpointSG.addIngressRule(
        ec2.Peer.ipv4(ipRange),
        ec2.Port.tcp(443),
        `Allow HTTPS from corporate IP range ${index + 1}`
      );
    });

    // S3 VPC Endpoint (Gateway)
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }]
    });

    // Interface VPC Endpoints for various services
    const interfaceEndpoints = [
      { service: ec2.InterfaceVpcEndpointAwsService.KMS, name: 'KMSEndpoint' },
      { service: ec2.InterfaceVpcEndpointAwsService.CLOUDTRAIL, name: 'CloudTrailEndpoint' },
      { service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH, name: 'CloudWatchEndpoint' },
      { service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS, name: 'CloudWatchLogsEndpoint' },
      { service: ec2.InterfaceVpcEndpointAwsService.SNS, name: 'SNSEndpoint' },
      { service: ec2.InterfaceVpcEndpointAwsService.STS, name: 'STSEndpoint' }
    ];

    interfaceEndpoints.forEach(endpoint => {
      this.vpc.addInterfaceEndpoint(endpoint.name, {
        service: endpoint.service,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [vpcEndpointSG],
        privateDnsEnabled: true,
        policy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              principals: [new iam.AnyPrincipal()],
              actions: ['*'],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'aws:PrincipalAccount': this.account
                }
              }
            })
          ]
        })
      });
    });
  }

  private createCloudTrail(): cloudtrail.Trail {
    // CloudWatch Log Group for CloudTrail
    const cloudTrailLogGroup = new logs.LogGroup(this, 'CloudTrailLogGroup', {
      logGroupName: `/aws/cloudtrail/${this.stackName}`,
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: this.kmsKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // IAM Role for CloudTrail to write to CloudWatch Logs
    const cloudTrailLogRole = new iam.Role(this, 'CloudTrailLogRole', {
      assumedBy: new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
      inlinePolicies: {
        CloudTrailLogsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:PutLogEvents',
                'logs:CreateLogGroup',
                'logs:CreateLogStream'
              ],
              resources: [cloudTrailLogGroup.logGroupArn]
            })
          ]
        })
      }
    });

    // Create CloudTrail
    const trail = new cloudtrail.Trail(this, 'SecureEnterpriseCloudTrail', {
      trailName: `secure-enterprise-trail-${this.stackName}`,
      bucket: this.cloudTrailBucket,
      s3KeyPrefix: 'cloudtrail-logs/',
      encryptionKey: this.kmsKey,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      sendToCloudWatchLogs: true,
      cloudWatchLogGroup: cloudTrailLogGroup,
      cloudWatchLogsRole: cloudTrailLogRole,
      managementEvents: cloudtrail.ReadWriteType.ALL,
      insightSelectors: [
        {
          insightType: cloudtrail.InsightType.API_CALL_RATE
        }
      ]
    });

    // Add data events for S3 bucket
    trail.addS3EventSelector([{
      bucket: this.secureDataBucket,
      objectPrefix: '',
    }], {
      readWriteType: cloudtrail.ReadWriteType.ALL,
      includeManagementEvents: true
    });

    return trail;
  }

  private createCloudWatchAlertsAndMonitoring(alertEmail: string, trail: cloudtrail.Trail): void {
    // SNS Topic for security alerts
    const securityAlertsTopic = new sns.Topic(this, 'SecurityAlertsTopic', {
      topicName: `security-alerts-${this.stackName}`,
      displayName: 'Security Alerts',
      masterKey: this.kmsKey
    });

    securityAlertsTopic.addSubscription(
      new subscriptions.EmailSubscription(alertEmail)
    );

    // CloudWatch Log Group for monitoring
    const securityLogGroup = new logs.LogGroup(this, 'SecurityMonitoringLogGroup', {
      logGroupName: `/aws/security/monitoring/${this.stackName}`,
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: this.kmsKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // Metric filters and alarms for security events
    const securityMetrics = [
      {
        name: 'UnauthorizedAPICallsMetric',
        filterPattern: '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }',
        description: 'Unauthorized API calls'
      },
      {
        name: 'MFALoginFailuresMetric',
        filterPattern: '{ ($.eventName = ConsoleLogin) && ($.responseElements.ConsoleLogin = "Failure") && ($.additionalEventData.MFAUsed != "Yes") }',
        description: 'Failed MFA logins'
      },
      {
        name: 'RootAccountUsageMetric',
        filterPattern: '{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent" }',
        description: 'Root account usage'
      },
      {
        name: 'IAMPolicyChangesMetric',
        filterPattern: '{ ($.eventName = DeleteGroupPolicy) || ($.eventName = DeleteRolePolicy) || ($.eventName = DeleteUserPolicy) || ($.eventName = PutGroupPolicy) || ($.eventName = PutRolePolicy) || ($.eventName = PutUserPolicy) || ($.eventName = CreatePolicy) || ($.eventName = DeletePolicy) || ($.eventName = CreatePolicyVersion) || ($.eventName = DeletePolicyVersion) || ($.eventName = AttachRolePolicy) || ($.eventName = DetachRolePolicy) || ($.eventName = AttachUserPolicy) || ($.eventName = DetachUserPolicy) || ($.eventName = AttachGroupPolicy) || ($.eventName = DetachGroupPolicy) }',
        description: 'IAM policy changes'
      },
      {
        name: 'SecurityGroupChangesMetric',
        filterPattern: '{ ($.eventName = AuthorizeSecurityGroupIngress) || ($.eventName = AuthorizeSecurityGroupEgress) || ($.eventName = RevokeSecurityGroupIngress) || ($.eventName = RevokeSecurityGroupEgress) || ($.eventName = CreateSecurityGroup) || ($.eventName = DeleteSecurityGroup) }',
        description: 'Security group changes'
      },
      {
        name: 'CloudTrailChangesMetric',
        filterPattern: '{ ($.eventName = CreateTrail) || ($.eventName = UpdateTrail) || ($.eventName = DeleteTrail) || ($.eventName = StartLogging) || ($.eventName = StopLogging) }',
        description: 'CloudTrail configuration changes'
      }
    ];

    securityMetrics.forEach(metric => {
      const metricFilter = new logs.MetricFilter(this, `${metric.name}Filter`, {
        logGroup: securityLogGroup,
        metricNamespace: 'Security/Monitoring',
        metricName: metric.name,
        filterPattern: logs.FilterPattern.literal(metric.filterPattern),
        metricValue: '1'
      });

      const alarm = new cloudwatch.Alarm(this, `${metric.name}Alarm`, {
        alarmName: `${metric.name}-${this.stackName}`,
        alarmDescription: `Alert on ${metric.description}`,
        metric: metricFilter.metric(),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
      });

      alarm.addAlarmAction(
        new cloudwatch.SnsAction(securityAlertsTopic)
      );
    });

    // Custom metric for failed S3 access attempts
    const s3AccessDeniedMetric = new logs.MetricFilter(this, 'S3AccessDeniedFilter', {
      logGroup: securityLogGroup,
      metricNamespace: 'Security/S3',
      metricName: 'AccessDeniedEvents',
      filterPattern: logs.FilterPattern.literal('{ ($.eventSource = s3.amazonaws.com) && ($.errorCode = "AccessDenied") }'),
      metricValue: '1'
    });

    new cloudwatch.Alarm(this, 'S3AccessDeniedAlarm', {
      alarmName: `S3AccessDenied-${this.stackName}`,
      alarmDescription: 'Alert on S3 access denied events',
      metric: s3AccessDeniedMetric.metric(),
      threshold: 5,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    }).addAlarmAction(new cloudwatch.SnsAction(securityAlertsTopic));

    // Dashboard for security monitoring
    const securityDashboard = new cloudwatch.Dashboard(this, 'SecurityDashboard', {
      dashboardName: `security-monitoring-${this.stackName}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Security Events Overview',
            left: securityMetrics.map(metric =>
              new cloudwatch.Metric({
                namespace: 'Security/Monitoring',
                metricName: metric.name,
                statistic: 'Sum'
              })
            ),
            width: 12,
            height: 6
          })
        ],
        [
          new cloudwatch.SingleValueWidget({
            title: 'S3 Access Denied Events',
            metrics: [s3AccessDeniedMetric.metric()],
            width: 6,
            height: 3
          })
        ]
      ]
    });
  }

  private createOutputs(): void {
    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: this.kmsKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: `${this.stackName}-KMSKeyId`
    });

    new cdk.CfnOutput(this, 'KMSKeyArn', {
      value: this.kmsKey.keyArn,
      description: 'KMS Key ARN for encryption',
      exportName: `${this.stackName}-KMSKeyArn`
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: this.vpc.vpcId,
      description: 'Secure VPC ID',
      exportName: `${this.stackName}-VPCId`
    });

    new cdk.CfnOutput(this, 'SecureDataBucketName', {
      value: this.secureDataBucket.bucketName,
      description: 'Secure data S3 bucket name',
      exportName: `${this.stackName}-SecureDataBucket`
    });

    new cdk.CfnOutput(this, 'CloudTrailBucketName', {
      value: this.cloudTrailBucket.bucketName,
      description: 'CloudTrail logs S3 bucket name',
      exportName: `${this.stackName}-CloudTrailBucket`
    });
  }
}

// Example usage and deployment script
export class SecureSetupApp extends cdk.App {
  constructor() {
    super();

    new SecureSetupStack(this, 'SecureEnterpriseStack', {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
      corporateIpRanges: [
        '203.0.113.0/24',  // Replace with your corporate IP ranges
        '198.51.100.0/24'  // Replace with your corporate IP ranges
      ],
      alertEmail: 'security-team@yourcompany.com', // Replace with your security team email
      environmentName: 'production',
      description: ''
    }}}
```
