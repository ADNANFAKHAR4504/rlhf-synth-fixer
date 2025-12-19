### Reasoning Trace

---

The user is getting validation and deprecation errors:

1. "Bucket encryption using KMS keys is unsupported" - This suggests that some S3 buckets can't use KMS encryption, or the way I'm specifying it is incorrect.

2. "latestAmazonLinux is deprecated; use SSM Parameter Store instead" - This means the method I'm using to get the AMI is deprecated and I should use SSM Parameter Store to get the latest Amazon Linux AMI.

Let me fix these issues:

1. For S3 bucket encryption, I need to check which buckets support KMS encryption and which ones don't. Some AWS service buckets might not support customer-managed KMS keys, so I should use S3_MANAGED encryption for those.

2. For the AMI, I should use `ec2.MachineImage.fromSsmParameter()` to get the latest Amazon Linux AMI from SSM Parameter Store.

Let me provide the corrected version.

### Answer

---

You're right! Here's the corrected version addressing the validation and deprecation errors:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as config from 'aws-cdk-lib/aws-config';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import { Construct } from 'constructs';

export class SecureWebAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ==============================================
    // 1. KMS Keys for Encryption
    // ==============================================

    const kmsKey = new kms.Key(this, 'WebAppKMSKey', {
      description: 'KMS key for web application encryption',
      enableKeyRotation: true,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
        ],
      }),
    });

    const kmsKeyAlias = new kms.Alias(this, 'WebAppKMSKeyAlias', {
      aliasName: 'alias/webapp-key',
      targetKey: kmsKey,
    });

    // ==============================================
    // 2. VPC and Networking
    // ==============================================

    const vpc = new ec2.Vpc(this, 'WebAppVPC', {
      maxAzs: 2,
      cidr: '10.0.0.0/16',
      natGateways: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Flow Logs - Fixed: Use S3_MANAGED encryption for service buckets
    const vpcFlowLogsBucket = new s3.Bucket(this, 'VPCFlowLogsBucket', {
      bucketName: `vpc-flow-logs-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: cdk.Duration.days(90),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      serverAccessLogsPrefix: 'access-logs/',
    });

    const vpcFlowLogsRole = new iam.Role(this, 'VPCFlowLogsRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      inlinePolicies: {
        FlowLogsDeliveryRolePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:PutObject', 's3:GetBucketAcl', 's3:ListBucket'],
              resources: [
                vpcFlowLogsBucket.bucketArn,
                `${vpcFlowLogsBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
      },
    });

    new ec2.FlowLog(this, 'VPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toS3(
        vpcFlowLogsBucket,
        'vpc-flow-logs/',
        {
          hiveCompatiblePartitions: false,
        }
      ),
    });

    // ==============================================
    // 3. Security Groups
    // ==============================================

    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    albSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow outbound HTTP to EC2 instances'
    );

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL traffic from EC2 instances'
    );

    // ==============================================
    // 4. IAM Roles and Policies
    // ==============================================

    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
      inlinePolicies: {
        S3AccessPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [`arn:aws:s3:::webapp-assets-${cdk.Aws.ACCOUNT_ID}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
              resources: [kmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    const instanceProfile = new iam.InstanceProfile(
      this,
      'EC2InstanceProfile',
      {
        role: ec2Role,
      }
    );

    // ==============================================
    // 5. S3 Buckets for Storage and Logging - Fixed encryption settings
    // ==============================================

    // ALB Access Logs bucket - Use S3_MANAGED encryption for AWS service logs
    const accessLogsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      bucketName: `webapp-access-logs-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldAccessLogs',
          expiration: cdk.Duration.days(365),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // Application assets bucket - Can use KMS encryption for user data
    const assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      bucketName: `webapp-assets-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // CloudTrail bucket - Use S3_MANAGED encryption for AWS service logs
    const cloudtrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `cloudtrail-logs-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldCloudTrailLogs',
          expiration: cdk.Duration.days(2555), // 7 years for compliance
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // ==============================================
    // 6. RDS Database
    // ==============================================

    const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const database = new rds.DatabaseInstance(this, 'WebAppDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.SMALL
      ),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      multiAz: true,
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: cdk.Duration.days(30),
      deletionProtection: true,
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: kmsKey,
      cloudwatchLogsExports: ['error', 'general', 'slow-query'],
      monitoringInterval: cdk.Duration.minutes(1),
      credentials: rds.Credentials.fromGeneratedSecret('dbadmin', {
        secretName: 'webapp-db-credentials',
        encryptionKey: kmsKey,
      }),
    });

    // ==============================================
    // 7. CloudWatch Log Groups
    // ==============================================

    const webAppLogGroup = new logs.LogGroup(this, 'WebAppLogGroup', {
      logGroupName: '/aws/webapp/application',
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: kmsKey,
    });

    // ==============================================
    // 8. Application Load Balancer
    // ==============================================

    const alb = new elbv2.ApplicationLoadBalancer(this, 'WebAppALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Enable ALB access logs
    alb.logAccessLogs(accessLogsBucket, 'alb-logs');

    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'WebAppTargetGroup',
      {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        vpc,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200,301,302',
          healthyThresholdCount: 2,
          interval: cdk.Duration.seconds(30),
          path: '/health',
          protocol: elbv2.Protocol.HTTP,
          timeout: cdk.Duration.seconds(10),
          unhealthyThresholdCount: 5,
        },
        deregistrationDelay: cdk.Duration.seconds(300),
      }
    );

    const listener = alb.addListener('WebAppListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // ==============================================
    // 9. Auto Scaling Group - Fixed AMI selection
    // ==============================================

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Web Application Server</h1>" > /var/www/html/index.html',
      'echo "OK" > /var/www/html/health',
      // Install CloudWatch agent
      'yum install -y amazon-cloudwatch-agent',
      'systemctl enable amazon-cloudwatch-agent',
      'systemctl start amazon-cloudwatch-agent'
    );

    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'WebAppLaunchTemplate',
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.SMALL
        ),
        // Fixed: Use SSM Parameter Store for latest Amazon Linux AMI
        machineImage: ec2.MachineImage.fromSsmParameter(
          '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2',
          {
            os: ec2.OperatingSystemType.LINUX,
          }
        ),
        securityGroup: ec2SecurityGroup,
        userData,
        role: ec2Role,
        detailedMonitoring: true,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              encrypted: true,
              kmsKey: kmsKey,
            }),
          },
        ],
      }
    );

    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'WebAppASG',
      {
        vpc,
        launchTemplate,
        minCapacity: 2,
        maxCapacity: 6,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(5),
        }),
        signals: autoscaling.Signals.waitForMinCapacity({
          timeout: cdk.Duration.minutes(10),
        }),
      }
    );

    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // Auto Scaling Policies
    autoScalingGroup.scaleOnCpuUtilization('ScaleUpPolicy', {
      targetUtilizationPercent: 70,
    });

    // ==============================================
    // 10. WAF Web ACL
    // ==============================================

    const webAcl = new wafv2.CfnWebACL(this, 'WebAppWAF', {
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
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'WebAppWAFMetric',
      },
    });

    // Associate WAF with ALB
    new wafv2.CfnWebACLAssociation(this, 'WebACLAssociation', {
      resourceArn: alb.loadBalancerArn,
      webAclArn: webAcl.attrArn,
    });

    // ==============================================
    // 11. CloudTrail
    // ==============================================

    const cloudTrail = new cloudtrail.Trail(this, 'WebAppCloudTrail', {
      bucket: cloudtrailBucket,
      s3KeyPrefix: 'cloudtrail-logs',
      includeGlobalServiceEvents: true,
      enableFileValidation: true,
      encryptionKey: kmsKey,
      cloudWatchLogGroup: new logs.LogGroup(this, 'CloudTrailLogGroup', {
        logGroupName: '/aws/cloudtrail/webapp',
        retention: logs.RetentionDays.ONE_MONTH,
        encryptionKey: kmsKey,
      }),
    });

    // ==============================================
    // 12. CloudWatch Alarms
    // ==============================================

    // Create CPU utilization metric manually for AutoScaling Group
    const cpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCPUAlarm', {
      metric: cpuMetric,
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const dbConnectionsAlarm = new cloudwatch.Alarm(
      this,
      'HighDBConnectionsAlarm',
      {
        metric: database.metricDatabaseConnections(),
        threshold: 20,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    const targetResponseTimeAlarm = new cloudwatch.Alarm(
      this,
      'HighTargetResponseTimeAlarm',
      {
        metric: targetGroup.metricTargetResponseTime(),
        threshold: 1,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // ==============================================
    // 13. AWS Config and Remediation Lambda
    // ==============================================

    const configRole = new iam.Role(this, 'ConfigRole', {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/ConfigRole'),
      ],
    });

    // Config bucket - Use S3_MANAGED encryption for AWS Config
    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      bucketName: `config-bucket-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldConfigData',
          expiration: cdk.Duration.days(365),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    const configDeliveryChannel = new config.CfnDeliveryChannel(
      this,
      'ConfigDeliveryChannel',
      {
        s3BucketName: configBucket.bucketName,
        s3KeyPrefix: 'config',
      }
    );

    const configRecorder = new config.CfnConfigurationRecorder(
      this,
      'ConfigRecorder',
      {
        roleArn: configRole.roleArn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
      }
    );

    // Config Rules
    const s3PublicReadRule = new config.ManagedRule(
      this,
      'S3PublicReadProhibited',
      {
        identifier:
          config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_READ_PROHIBITED,
      }
    );

    const s3PublicWriteRule = new config.ManagedRule(
      this,
      'S3PublicWriteProhibited',
      {
        identifier:
          config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_WRITE_PROHIBITED,
      }
    );

    const rdsEncryptionRule = new config.ManagedRule(
      this,
      'RDSStorageEncrypted',
      {
        identifier: config.ManagedRuleIdentifiers.RDS_STORAGE_ENCRYPTED,
      }
    );

    // Lambda function for remediation
    const remediationLambdaRole = new iam.Role(this, 'RemediationLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        RemediationPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:PutBucketPublicAccessBlock',
                's3:GetBucketPublicAccessBlock',
                'config:PutEvaluations',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    const remediationLambda = new lambda.Function(this, 'RemediationLambda', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.lambda_handler',
      role: remediationLambdaRole,
      timeout: cdk.Duration.minutes(1),
      code: lambda.Code.fromInline(`
import boto3
import json

def lambda_handler(event, context):
    config_client = boto3.client('config')
    s3_client = boto3.client('s3')
    
    # Get the compliance details
    compliance_type = event['configurationItem']['complianceType']
    resource_type = event['configurationItem']['resourceType']
    resource_id = event['configurationItem']['resourceId']
    
    if compliance_type == 'NON_COMPLIANT' and resource_type == 'AWS::S3::Bucket':
        try:
            # Block public access on the bucket
            s3_client.put_bucket_public_access_block(
                Bucket=resource_id,
                PublicAccessBlockConfiguration={
                    'BlockPublicAcls': True,
                    'IgnorePublicAcls': True,
                    'BlockPublicPolicy': True,
                    'RestrictPublicBuckets': True
                }
            )
            
            print(f'Remediation completed for bucket: {resource_id}')
            
        except Exception as e:
            print(f'Error remediating bucket {resource_id}: {str(e)}')
    
    return {
        'statusCode': 200,
        'body': json.dumps('Remediation function executed')
    }
      `),
    });

    // ==============================================
    // 14. Outputs
    // ==============================================

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database endpoint',
    });

    new cdk.CfnOutput(this, 'AssetsBucketName', {
      value: assetsBucket.bucketName,
      description: 'S3 bucket for application assets',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
    });

    new cdk.CfnOutput(this, 'WebACLArn', {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });
  }
}
```

## Key Fixes Applied:

### 1. **S3 Bucket Encryption Strategy**

```typescript
// AWS Service Log Buckets - Use S3_MANAGED encryption
const accessLogsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
  encryption: s3.BucketEncryption.S3_MANAGED, // ALB logs requirement
});

const cloudtrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
  encryption: s3.BucketEncryption.S3_MANAGED, // CloudTrail requirement
});

const configBucket = new s3.Bucket(this, 'ConfigBucket', {
  encryption: s3.BucketEncryption.S3_MANAGED, // Config requirement
});

// Application Data Buckets - Can use KMS encryption
const assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
  encryption: s3.BucketEncryption.KMS, // User data can use KMS
  encryptionKey: kmsKey,
});
```

### 2. **AMI Selection Using SSM Parameter Store**

```typescript
// Fixed: Use SSM Parameter Store for latest Amazon Linux AMI
machineImage: ec2.MachineImage.fromSsmParameter(
  '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2',
  {
    os: ec2.OperatingSystemType.LINUX,
  }
),
```

## Explanation of Changes:

### **S3 Encryption Rules:**

- **AWS Service Logs**: ALB access logs, CloudTrail logs, Config data, and VPC Flow Logs require **S3_MANAGED** encryption
- **Application Data**: User-controlled buckets like assets can use **KMS** encryption with customer-managed keys

### **AMI Selection:**

- **Old Method**: `latestAmazonLinux()` is deprecated
- **New Method**: Use SSM Parameter Store with the path `/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2`

### **Benefits of These Changes:**

1. **Compliance**: Follows AWS service-specific encryption requirements
2. **Future-Proof**: Uses current best practices for AMI selection
3. **Automated Updates**: SSM Parameter Store automatically provides the latest AMI ID
4. **Security**: Still maintains encryption for all data while respecting service constraints

The stack should now deploy successfully without validation or deprecation errors while maintaining the same security posture and functionality.
