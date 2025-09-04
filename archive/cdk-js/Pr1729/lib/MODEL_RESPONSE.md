# AWS CDK JavaScript Security Infrastructure Response

## File: lib/security-stack.mjs

```javascript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as securityhub from 'aws-cdk-lib/aws-securityhub';
import * as shield from 'aws-cdk-lib/aws-shield';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export class SecurityStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // 1. KMS Keys for encryption
    const s3KmsKey = new kms.Key(this, 'S3EncryptionKey', {
      description: 'KMS Key for S3 bucket encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const rdsKmsKey = new kms.Key(this, 'RDSEncryptionKey', {
      description: 'KMS Key for RDS encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const cloudWatchKmsKey = new kms.Key(this, 'CloudWatchLogsKey', {
      description: 'KMS Key for CloudWatch Logs encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 2. VPC with private subnets and security groups
    const vpc = new ec2.Vpc(this, 'SecurityVPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 2,
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
        }
      ],
      flowLogs: {
        's3': {
          destination: ec2.FlowLogDestination.toS3(),
          trafficType: ec2.FlowLogTrafficType.ALL,
        }
      }
    });

    // 3. VPC Flow Logs to CloudWatch
    const flowLogGroup = new logs.LogGroup(this, 'VPCFlowLogGroup', {
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: cloudWatchKmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const flowLogRole = new iam.Role(this, 'FlowLogRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      inlinePolicies: {
        FlowLogDeliveryRolePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams'
              ],
              resources: ['*']
            })
          ]
        })
      }
    });

    new ec2.FlowLog(this, 'VPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup, flowLogRole),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // 4. Security Group for EC2 instances (no public access)
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc: vpc,
      description: 'Security group for EC2 instances - no public access',
      allowAllOutbound: false,
    });

    // Allow only HTTPS outbound
    ec2SecurityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS outbound');
    ec2SecurityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(53), 'DNS TCP');
    ec2SecurityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.udp(53), 'DNS UDP');

    // 5. S3 Bucket with encryption and security policies
    const secureS3Bucket = new s3.Bucket(this, 'SecureS3Bucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3KmsKey,
      bucketKeyEnabled: true,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      serverAccessLogsPrefix: 'access-logs/',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // 6. CloudTrail for API logging
    const cloudTrailLogGroup = new logs.LogGroup(this, 'CloudTrailLogGroup', {
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: cloudWatchKmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const trail = new cloudtrail.Trail(this, 'SecurityAuditTrail', {
      sendToCloudWatchLogs: true,
      cloudWatchLogGroup: cloudTrailLogGroup,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      eventBridge: true,
      s3Bucket: secureS3Bucket,
      s3KeyPrefix: 'cloudtrail-logs/',
    });

    // 7. RDS Subnet Group and Security Group
    const rdsSubnetGroup = new rds.SubnetGroup(this, 'RDSSubnetGroup', {
      vpc: vpc,
      description: 'Subnet group for RDS in private subnets',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc: vpc,
      description: 'Security group for RDS - no public access',
    });

    rdsSecurityGroup.addIngressRule(ec2SecurityGroup, ec2.Port.tcp(3306), 'MySQL access from EC2');

    // 8. RDS Instance with encryption
    const rdsInstance = new rds.DatabaseInstance(this, 'SecureRDSInstance', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: vpc,
      subnetGroup: rdsSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      storageEncrypted: true,
      storageEncryptionKey: rdsKmsKey,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      credentials: rds.Credentials.fromGeneratedSecret('admin'),
    });

    // 9. IAM Role for Lambda with least privilege
    const lambdaRole = new iam.Role(this, 'SecureLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
      inlinePolicies: {
        LambdaMinimalPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents'
              ],
              resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/*`
              ]
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.DENY,
              actions: ['*'],
              resources: ['*'],
              conditions: {
                Bool: {
                  'aws:SecureTransport': 'false'
                }
              }
            })
          ]
        })
      }
    });

    // 10. Lambda function with security best practices
    const secureLambda = new lambda.Function(this, 'SecureLambdaFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Secure lambda executed');
          return { statusCode: 200, body: 'Success' };
        };
      `),
      role: lambdaRole,
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [ec2SecurityGroup],
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
      },
      reservedConcurrentExecutions: 10,
      timeout: cdk.Duration.minutes(1),
    });

    // 11. CloudWatch Alarms for security monitoring
    const suspiciousActivityAlarm = new cloudwatch.Alarm(this, 'SuspiciousActivityAlarm', {
      metric: trail.metricAllEvents(),
      threshold: 100,
      evaluationPeriods: 2,
      datapointsToAlarm: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alarm for suspicious API activity levels',
    });

    const failedLoginAlarm = new cloudwatch.Alarm(this, 'FailedLoginAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/CloudTrailMetrics',
        metricName: 'ConsoleSignInFailures',
        statistic: 'Sum',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: 'Alarm for multiple failed console sign-ins',
    });

    // 12. Security Hub
    const securityHub = new securityhub.CfnHub(this, 'SecurityHub', {
      tags: [
        {
          key: 'Environment',
          value: 'Production',
        },
      ],
    });

    // Enable compliance standards
    new securityhub.CfnStandard(this, 'AWSFoundationalStandard', {
      standardsArn: `arn:aws:securityhub:${this.region}::standard/aws-foundational-security`,
    });

    new securityhub.CfnStandard(this, 'CISStandard', {
      standardsArn: `arn:aws:securityhub:${this.region}::standard/cis-aws-foundations-benchmark`,
    });

    // 13. Systems Manager VPC Endpoints for Session Manager
    vpc.addInterfaceEndpoint('SSMEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    vpc.addInterfaceEndpoint('SSMMessagesEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    vpc.addInterfaceEndpoint('EC2MessagesEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // 14. IAM Role for EC2 instances with Session Manager
    const ec2Role = new iam.Role(this, 'EC2SessionManagerRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
      inlinePolicies: {
        DenyPublicActions: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.DENY,
              actions: [
                'ec2:AssociateAddress',
                'ec2:AttachInternetGateway',
                'ec2:CreateInternetGateway',
                'ec2:ModifyInstanceAttribute'
              ],
              resources: ['*']
            })
          ]
        })
      }
    });

    const ec2InstanceProfile = new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      role: ec2Role,
    });

    // 15. WAF v2 for web application protection
    const webAcl = new wafv2.CfnWebACL(this, 'SecurityWebACL', {
      scope: 'CLOUDFRONT',
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
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'SecurityWebACLMetric',
      },
    });

    // Output important resource information
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID for the security infrastructure',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: secureS3Bucket.bucketName,
      description: 'Secure S3 bucket name',
    });

    new cdk.CfnOutput(this, 'RDSEndpoint', {
      value: rdsInstance.instanceEndpoint.hostname,
      description: 'RDS instance endpoint',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: secureLambda.functionName,
      description: 'Secure Lambda function name',
    });
  }
}
```

## File: lib/tap-stack.mjs

```javascript
import * as cdk from 'aws-cdk-lib';
import { SecurityStack } from './security-stack.mjs';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create the comprehensive security stack
    new SecurityStack(this, `SecurityStack${environmentSuffix}`, {
      stackName: `SecurityStack${environmentSuffix}`,
      env: props?.env,
    });
  }
}

export { TapStack };
```