import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as config from 'aws-cdk-lib/aws-config';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as securityhub from 'aws-cdk-lib/aws-securityhub';
import * as networkfirewall from 'aws-cdk-lib/aws-networkfirewall';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly webSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // KMS Key for encryption
    const encryptionKey = new kms.Key(this, 'EncryptionKey', {
      description: 'Key for encrypting resources in secure infrastructure',
      enableKeyRotation: true,
      alias: `secure-infra-key-${environmentSuffix}`,
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
            sid: 'Allow CloudWatch Logs',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal('logs.us-west-2.amazonaws.com'),
            ],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            resources: ['*'],
            conditions: {
              ArnLike: {
                'kms:EncryptionContext:aws:logs:arn':
                  'arn:aws:logs:us-west-2:*:log-group:*',
              },
            },
          }),
        ],
      }),
    });

    // VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, 'SecureVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
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
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGateways: 0,
    });

    // Security Groups with least privilege
    this.webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for web applications',
      allowAllOutbound: false,
    });

    // Allow HTTPS inbound only
    this.webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Allow HTTP for health checks (can be removed if not needed)
    this.webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic for load balancer health checks'
    );

    // Outbound rules for web security group
    this.webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound'
    );

    this.webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP outbound'
    );

    // Database Security Group (private subnet only)
    this.databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for database instances',
        allowAllOutbound: false,
      }
    );

    // Allow database access only from web security group
    this.databaseSecurityGroup.addIngressRule(
      this.webSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from web servers'
    );

    this.databaseSecurityGroup.addIngressRule(
      this.webSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from web servers'
    );

    // SSH Security Group with restricted access
    const sshSecurityGroup = new ec2.SecurityGroup(this, 'SshSecurityGroup', {
      vpc: this.vpc,
      description: 'Restricted SSH access security group',
      allowAllOutbound: false,
    });

    // Restrict SSH to specific IP ranges (replace with your actual IP ranges)
    sshSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/8'),
      ec2.Port.tcp(22),
      'Allow SSH from internal networks only'
    );

    // CloudTrail for API logging - Commented out due to account limits
    // In production, you would check if trail exists before creating
    // const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
    //   encryption: s3.BucketEncryption.KMS,
    //   encryptionKey: encryptionKey,
    //   versioned: true,
    //   publicReadAccess: false,
    //   blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    //   lifecycleRules: [
    //     {
    //       id: 'DeleteOldLogs',
    //       expiration: cdk.Duration.days(90),
    //     },
    //   ],
    // });

    // CloudTrail is created but not directly referenced
    // new cloudtrail.Trail(this, 'SecureCloudTrail', {
    //   bucket: cloudTrailBucket,
    //   includeGlobalServiceEvents: true,
    //   isMultiRegionTrail: true,
    //   enableFileValidation: true,
    //   encryptionKey: encryptionKey,
    // });

    // CloudWatch Log Group for application logs
    // Using unique name to avoid conflicts
    new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/secure-infrastructure/tap-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: encryptionKey,
    });

    // GuardDuty Detector - Commented out as detector already exists in the account
    // In production, you would check if detector exists before creating
    // new guardduty.CfnDetector(this, 'GuardDutyDetector', {
    //   enable: true,
    //   findingPublishingFrequency: 'FIFTEEN_MINUTES',
    //   dataSources: {
    //     s3Logs: {
    //       enable: true,
    //     },
    //     malwareProtection: {
    //       scanEc2InstanceWithFindings: {
    //         ebsVolumes: true,
    //       },
    //     },
    //   },
    // });

    // Security Hub
    // Security Hub for centralized security monitoring
    new securityhub.CfnHub(this, 'SecurityHub', {
      tags: {
        Environment: environmentSuffix,
      },
    });

    // AWS Config Configuration Recorder
    const configDeliveryChannel = new s3.Bucket(this, 'ConfigBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // IAM Role for Config
    const configRole = new iam.Role(this, 'ConfigRole', {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWS_ConfigRole'
        ),
      ],
    });

    configRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:PutObject', 's3:GetBucketAcl', 's3:ListBucket'],
        resources: [
          configDeliveryChannel.bucketArn,
          `${configDeliveryChannel.bucketArn}/*`,
        ],
      })
    );

    // Config Recorder - Commented out as recorder already exists in account
    // In production, you would check if recorder exists before creating
    // const configRecorder = new config.CfnConfigurationRecorder(
    //   this,
    //   'ConfigRecorder',
    //   {
    //     roleArn: configRole.roleArn,
    //     recordingGroup: {
    //       allSupported: true,
    //       includeGlobalResourceTypes: true,
    //       resourceTypes: [],
    //     },
    //   }
    // );

    // Config delivery channel for compliance monitoring
    // new config.CfnDeliveryChannel(this, 'ConfigDeliveryChannel', {
    //   s3BucketName: configDeliveryChannel.bucketName,
    //   configSnapshotDeliveryProperties: {
    //     deliveryFrequency: 'TwentyFour_Hours',
    //   },
    // });

    // Config Rules for compliance
    new config.CfnConfigRule(this, 'RootAccessKeyCheck', {
      configRuleName: `root-account-mfa-enabled-${environmentSuffix}`,
      source: {
        owner: 'AWS',
        sourceIdentifier: 'ROOT_ACCOUNT_MFA_ENABLED',
      },
    });

    new config.CfnConfigRule(this, 'MfaEnabledForIamUsers', {
      configRuleName: `mfa-enabled-for-iam-console-access-${environmentSuffix}`,
      source: {
        owner: 'AWS',
        sourceIdentifier: 'IAM_USER_MFA_ENABLED',
      },
    });

    new config.CfnConfigRule(this, 'EncryptedVolumes', {
      configRuleName: `encrypted-volumes-${environmentSuffix}`,
      source: {
        owner: 'AWS',
        sourceIdentifier: 'ENCRYPTED_VOLUMES',
      },
    });

    new config.CfnConfigRule(this, 'RdsStorageEncrypted', {
      configRuleName: `rds-storage-encrypted-${environmentSuffix}`,
      source: {
        owner: 'AWS',
        sourceIdentifier: 'RDS_STORAGE_ENCRYPTED',
      },
    });

    // WAF Web ACL for DDoS protection
    const webAcl = new wafv2.CfnWebACL(this, 'WebApplicationFirewall', {
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
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
          name: 'RateLimitRule',
          priority: 3,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 10000,
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
        metricName: 'WebACLMetric',
      },
    });

    // Network Firewall
    const networkFirewallRuleGroup = new networkfirewall.CfnRuleGroup(
      this,
      'ThreatIntelRuleGroup',
      {
        ruleGroupName: `threat-intel-rules-${environmentSuffix}`,
        type: 'STATELESS',
        capacity: 100,
        ruleGroup: {
          rulesSource: {
            statelessRulesAndCustomActions: {
              statelessRules: [
                {
                  ruleDefinition: {
                    matchAttributes: {
                      sources: [{ addressDefinition: '0.0.0.0/0' }],
                      destinations: [{ addressDefinition: '0.0.0.0/0' }],
                      protocols: [6], // TCP
                      destinationPorts: [{ fromPort: 80, toPort: 80 }],
                    },
                    actions: ['aws:pass'],
                  },
                  priority: 1,
                },
                {
                  ruleDefinition: {
                    matchAttributes: {
                      sources: [{ addressDefinition: '0.0.0.0/0' }],
                      destinations: [{ addressDefinition: '0.0.0.0/0' }],
                      protocols: [6], // TCP
                      destinationPorts: [{ fromPort: 443, toPort: 443 }],
                    },
                    actions: ['aws:pass'],
                  },
                  priority: 2,
                },
              ],
            },
          },
        },
      }
    );

    const networkFirewallPolicy = new networkfirewall.CfnFirewallPolicy(
      this,
      'NetworkFirewallPolicy',
      {
        firewallPolicyName: `network-firewall-policy-${environmentSuffix}`,
        firewallPolicy: {
          statelessDefaultActions: ['aws:forward_to_sfe'],
          statelessFragmentDefaultActions: ['aws:forward_to_sfe'],
          statelessRuleGroupReferences: [
            {
              resourceArn: networkFirewallRuleGroup.attrRuleGroupArn,
              priority: 1,
            },
          ],
        },
      }
    );

    // Network Firewall for threat protection
    new networkfirewall.CfnFirewall(this, 'NetworkFirewall', {
      firewallName: `network-firewall-${environmentSuffix}`,
      firewallPolicyArn: networkFirewallPolicy.attrFirewallPolicyArn,
      vpcId: this.vpc.vpcId,
      subnetMappings: this.vpc.publicSubnets.map(subnet => ({
        subnetId: subnet.subnetId,
      })),
    });

    // IAM Policy for MFA enforcement
    const mfaPolicy = new iam.Policy(this, 'EnforceMfaPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: ['*'],
          resources: ['*'],
          conditions: {
            BoolIfExists: {
              'aws:MultiFactorAuthPresent': 'false',
            },
            NumericLessThan: {
              'aws:MultiFactorAuthAge': '86400', // 24 hours
            },
          },
        }),
      ],
    });

    // Example IAM role with least privilege and MFA requirement
    const applicationRole = new iam.Role(this, 'ApplicationRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for application instances with least privilege',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    applicationRole.attachInlinePolicy(mfaPolicy);

    // CloudWatch Dashboard for security monitoring
    const securityDashboard = new cloudwatch.Dashboard(
      this,
      'SecurityDashboard',
      {
        dashboardName: `security-monitoring-${environmentSuffix}`,
      }
    );

    securityDashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'WAF Blocked Requests',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/WAFV2',
            metricName: 'BlockedRequests',
            dimensionsMap: {
              WebACL:
                webAcl.attrArn.split('/').pop() || 'WebApplicationFirewall',
            },
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'GuardDuty Findings',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/GuardDuty',
            metricName: 'FindingCount',
          }),
        ],
      })
    );

    // Output important resources
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for secure infrastructure',
    });

    new cdk.CfnOutput(this, 'WebSecurityGroupId', {
      value: this.webSecurityGroup.securityGroupId,
      description: 'Security Group ID for web applications',
    });

    new cdk.CfnOutput(this, 'DatabaseSecurityGroupId', {
      value: this.databaseSecurityGroup.securityGroupId,
      description: 'Security Group ID for databases',
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: encryptionKey.keyId,
      description: 'KMS Key ID for encryption',
    });

    new cdk.CfnOutput(this, 'WebAclArn', {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });
  }
}
