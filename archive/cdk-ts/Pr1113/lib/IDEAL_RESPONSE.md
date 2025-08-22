```typescript
// tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ssm from 'aws-cdk-lib/aws-ssm';
// import * as inspectorv2 from 'aws-cdk-lib/aws-inspectorv2'; // Not used - manual enablement required
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // 1. Create KMS Keys for encryption
    const s3KmsKey = new kms.Key(this, 'S3KmsKey', {
      description: 'KMS key for S3 bucket encryption',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const vpcFlowLogsKmsKey = new kms.Key(this, 'VpcFlowLogsKmsKey', {
      description: 'KMS key for VPC Flow Logs encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add CloudWatch Logs permissions to VPC Flow Logs KMS key
    vpcFlowLogsKmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Enable CloudWatch Logs',
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
            'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/vpc/flowlogs/${environmentSuffix}`,
          },
        },
      })
    );

    const cloudTrailKmsKey = new kms.Key(this, 'CloudTrailKmsKey', {
      description: 'KMS key for CloudTrail log encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 2. Create VPC with proper subnets
    // Create VPC Flow Logs Log Group first
    const vpcFlowLogsGroup = new logs.LogGroup(this, 'VpcFlowLogsGroup', {
      logGroupName: `/aws/vpc/flowlogs/${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: vpcFlowLogsKmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const vpc = new ec2.Vpc(this, 'SecureVpc', {
      maxAzs: 2,
      natGateways: 1,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
      flowLogs: {
        FlowLogsCloudWatch: {
          destination:
            ec2.FlowLogDestination.toCloudWatchLogs(vpcFlowLogsGroup),
          trafficType: ec2.FlowLogTrafficType.ALL,
        },
      },
    });

    // 3. Security Groups with restricted access
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc: vpc,
      description: 'Security group for web servers - only HTTP and HTTPS',
      allowAllOutbound: false,
    });

    // Only allow HTTP (80) and HTTPS (443) from internet
    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet'
    );
    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet'
    );

    // Outbound rules for necessary services
    webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow outbound HTTP'
    );
    webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow outbound HTTPS'
    );

    // Database security group - restrict to specific IP range
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc: vpc,
        description: 'Security group for database - restricted access',
        allowAllOutbound: false,
      }
    );

    // Restrict database access to specific IP range (replace with actual allowed IPs)
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/8'),
      ec2.Port.tcp(3306),
      'Allow MySQL access from internal network only'
    );

    // 4. S3 Bucket with KMS encryption and security policies
    const secureS3Bucket = new s3.Bucket(this, 'SecureS3Bucket', {
      bucketName: `secure-ecommerce-bucket-${environmentSuffix}-${this.account}`,
      encryptionKey: s3KmsKey,
      encryption: s3.BucketEncryption.KMS,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'transition-to-ia',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // 5. IAM Role with least privilege for EC2 instances
    const ec2Role = new iam.Role(this, 'SecureEc2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Least privilege role for EC2 instances',
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
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [`${secureS3Bucket.bucketArn}/*`],
              conditions: {
                Bool: {
                  'aws:SecureTransport': 'true',
                },
              },
            }),
          ],
        }),
      },
    });

    // Instance Profile for EC2
    // Note: Created but not directly used - EC2 Role is attached through LaunchTemplate
    new iam.CfnInstanceProfile(this, 'Ec2InstanceProfile', {
      roles: [ec2Role.roleName],
    });

    // 7. Launch Template with IMDSv2 enforcement
    // Note: Created to enforce IMDSv2 for any EC2 instances that may be launched
    new ec2.LaunchTemplate(this, 'SecureLaunchTemplate', {
      launchTemplateName: `secure-template-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: webSecurityGroup,
      role: ec2Role,
      requireImdsv2: true, // Force IMDSv2
      userData: ec2.UserData.forLinux(),
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(8, {
            encrypted: true,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
    });

    // 8. RDS Database with encryption
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      description: 'Subnet group for database',
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Database credential stored in Secrets Manager
    const dbSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      description: 'Database master user credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\\'',
        includeSpace: false,
        passwordLength: 16,
      },
    });

    const database = new rds.DatabaseInstance(this, 'SecureDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      credentials: rds.Credentials.fromSecret(dbSecret),
      vpc: vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [dbSecurityGroup],
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false, // Set to true for production
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      publiclyAccessible: false,
    });

    // 9. CloudTrail for all regions
    const cloudTrailLogGroup = new logs.LogGroup(this, 'CloudTrailLogGroup', {
      logGroupName: `/aws/cloudtrail/${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_YEAR,
      // Use default CloudWatch Logs encryption to avoid KMS propagation issues
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `cloudtrail-logs-${environmentSuffix}-${this.account}-${this.region}`,
      encryptionKey: cloudTrailKmsKey,
      encryption: s3.BucketEncryption.KMS,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'delete-old-logs',
          expiration: cdk.Duration.days(90),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Add CloudTrail bucket policy
    cloudTrailBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSCloudTrailAclCheck',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:GetBucketAcl'],
        resources: [cloudTrailBucket.bucketArn],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudtrail:${this.region}:${this.account}:trail/security-trail-${environmentSuffix}`,
          },
        },
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
            'AWS:SourceArn': `arn:aws:cloudtrail:${this.region}:${this.account}:trail/security-trail-${environmentSuffix}`,
          },
        },
      })
    );

    // Add CloudTrail permissions to KMS key
    cloudTrailKmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Enable CloudTrail Encrypt',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['kms:GenerateDataKey*', 'kms:DescribeKey'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudtrail:${this.region}:${this.account}:trail/security-trail-${environmentSuffix}`,
          },
        },
      })
    );

    const cloudTrail = new cloudtrail.Trail(this, 'SecurityCloudTrail', {
      trailName: `security-trail-${environmentSuffix}`,
      bucket: cloudTrailBucket,
      cloudWatchLogGroup: cloudTrailLogGroup,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      encryptionKey: cloudTrailKmsKey,
      managementEvents: cloudtrail.ReadWriteType.ALL,
    });

    // Add data events for S3
    cloudTrail.addS3EventSelector(
      [
        {
          bucket: secureS3Bucket,
          objectPrefix: '',
        },
      ],
      {
        readWriteType: cloudtrail.ReadWriteType.ALL,
        includeManagementEvents: false,
      }
    );

    // 9.5. AWS Systems Manager Session Manager Configuration
    const ssmSessionLogGroup = new logs.LogGroup(this, 'SSMSessionLogGroup', {
      logGroupName: `/aws/ssm/sessions/${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_YEAR,
      // Use default CloudWatch Logs encryption to avoid KMS propagation issues
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Session Manager Document for secure logging
    new ssm.CfnDocument(this, 'SSMSessionManagerDocument', {
      documentType: 'Session',
      name: `SSM-SessionManagerRunShell-${environmentSuffix}`,
      content: {
        schemaVersion: '1.0',
        description: 'Document to hold regional settings for Session Manager',
        sessionType: 'Standard_Stream',
        inputs: {
          s3BucketName: '',
          s3KeyPrefix: '',
          s3EncryptionEnabled: true,
          cloudWatchLogGroupName: ssmSessionLogGroup.logGroupName,
          cloudWatchEncryptionEnabled: true,
          cloudWatchStreamingEnabled: true,
          kmsKeyId: cloudTrailKmsKey.keyId,
          runAsEnabled: false,
          runAsDefaultUser: '',
          idleSessionTimeout: '20',
          maxSessionDuration: '60',
          shellProfile: {
            windows: '',
            linux: '',
          },
        },
      },
    });

    // 10. IAM Password Policy Setup via Lambda Function
    // Using a Lambda function to set the IAM password policy directly
    const passwordPolicyFunction = new lambda.Function(
      this,
      'PasswordPolicyFunction',
      {
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'index.lambda_handler',
        code: lambda.Code.fromInline(`
import boto3
import json

def lambda_handler(event, context):
    """Set IAM account password policy"""
    try:
        iam = boto3.client('iam')
        
        # Set account password policy
        response = iam.update_account_password_policy(
            MinimumPasswordLength=12,
            RequireSymbols=True,
            RequireNumbers=True,
            RequireUppercaseCharacters=True,
            RequireLowercaseCharacters=True,
            AllowUsersToChangePassword=True,
            MaxPasswordAge=90,
            PasswordReusePrevention=24
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'IAM password policy updated successfully',
                'response': response
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }
      `),
        timeout: cdk.Duration.minutes(5),
        description: 'Lambda function to set IAM account password policy',
      }
    );

    // Grant IAM permissions to the password policy function
    passwordPolicyFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'iam:UpdateAccountPasswordPolicy',
          'iam:GetAccountPasswordPolicy',
        ],
        resources: ['*'],
      })
    );

    // 11. SNS Topic for security notifications
    const securityTopic = new sns.Topic(this, 'SecurityNotificationsTopic', {
      topicName: `security-alerts-${environmentSuffix}`,
      displayName: 'Security Alerts',
      masterKey: s3KmsKey,
    });

    // Subscribe admin email (replace with actual email)
    securityTopic.addSubscription(
      new subscriptions.EmailSubscription('admin@example.com')
    );

    // 12. EventBridge rule for security group changes
    new events.Rule(this, 'SecurityGroupChangesRule', {
      eventPattern: {
        source: ['aws.ec2'],
        detailType: ['AWS API Call via CloudTrail'],
        detail: {
          eventSource: ['ec2.amazonaws.com'],
          eventName: [
            'CreateSecurityGroup',
            'DeleteSecurityGroup',
            'AuthorizeSecurityGroupIngress',
            'AuthorizeSecurityGroupEgress',
            'RevokeSecurityGroupIngress',
            'RevokeSecurityGroupEgress',
          ],
        },
      },
      targets: [new targets.SnsTopic(securityTopic)],
    });

    // 13. Lambda function for compliance checking
    const complianceCheckFunction = new lambda.Function(
      this,
      'ComplianceCheckFunction',
      {
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'index.lambda_handler',
        code: lambda.Code.fromInline(`
import json
import boto3
import datetime

def lambda_handler(event, context):
    """Daily compliance check function"""
    
    # Initialize AWS clients
    ec2 = boto3.client('ec2')
    s3 = boto3.client('s3')
    iam = boto3.client('iam')
    sns = boto3.client('sns')
    
    compliance_issues = []
    
    try:
        # Check 1: Verify S3 bucket encryption
        buckets = s3.list_buckets()['Buckets']
        for bucket in buckets:
            try:
                encryption = s3.get_bucket_encryption(Bucket=bucket['Name'])
                if not encryption.get('ServerSideEncryptionConfiguration'):
                    compliance_issues.append(f"S3 bucket {bucket['Name']} is not encrypted")
            except:
                compliance_issues.append(f"S3 bucket {bucket['Name']} encryption check failed")
        
        # Check 2: Verify security groups don't allow unrestricted access
        security_groups = ec2.describe_security_groups()['SecurityGroups']
        for sg in security_groups:
            for rule in sg.get('IpPermissions', []):
                for ip_range in rule.get('IpRanges', []):
                    if ip_range.get('CidrIp') == '0.0.0.0/0':
                        port = rule.get('FromPort', 'ALL')
                        if port not in [80, 443]:
                            compliance_issues.append(
                                f"Security group {sg['GroupId']} allows unrestricted access on port {port}"
                            )
        
        # Check 3: Verify VPC Flow Logs are enabled
        vpcs = ec2.describe_vpcs()['Vpcs']
        for vpc in vpcs:
            flow_logs = ec2.describe_flow_logs(
                Filters=[{'Name': 'resource-id', 'Values': [vpc['VpcId']]}]
            )['FlowLogs']
            if not flow_logs:
                compliance_issues.append(f"VPC {vpc['VpcId']} does not have Flow Logs enabled")
        
        # Generate compliance report
        report = {
            'timestamp': datetime.datetime.now().isoformat(),
            'total_issues': len(compliance_issues),
            'issues': compliance_issues,
            'status': 'COMPLIANT' if len(compliance_issues) == 0 else 'NON_COMPLIANT'
        }
        
        # Send notification if issues found
        if compliance_issues:
            topic_arn = "${securityTopic.topicArn}"
            message = f"Daily compliance check found {len(compliance_issues)} issues:\\n"
            message += "\\n".join(compliance_issues[:10])  # Limit to first 10 issues
            
            sns.publish(
                TopicArn=topic_arn,
                Message=message,
                Subject='Security Compliance Issues Detected'
            )
        
        return {
            'statusCode': 200,
            'body': json.dumps(report)
        }
        
    except Exception as e:
        error_message = f"Compliance check failed: {str(e)}"
        sns.publish(
            TopicArn="${securityTopic.topicArn}",
            Message=error_message,
            Subject='Compliance Check Error'
        )
        return {
            'statusCode': 500,
            'body': json.dumps({'error': error_message})
        }
      `),
        timeout: cdk.Duration.minutes(5),
        environment: {
          SNS_TOPIC_ARN: securityTopic.topicArn,
        },
      }
    );

    // Grant permissions to compliance function
    complianceCheckFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ec2:DescribeSecurityGroups',
          'ec2:DescribeVpcs',
          'ec2:DescribeFlowLogs',
          's3:ListAllMyBuckets',
          's3:GetBucketEncryption',
          'iam:ListUsers',
          'sns:Publish',
        ],
        resources: ['*'],
      })
    );

    securityTopic.grantPublish(complianceCheckFunction);

    // Schedule daily compliance checks
    new events.Rule(this, 'DailyComplianceCheck', {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '6',
        day: '*',
        month: '*',
        year: '*',
      }),
      targets: [new targets.LambdaFunction(complianceCheckFunction)],
    });

    // 14. Enable GuardDuty
    // Note: GuardDuty detector enabled for threat detection
    new guardduty.CfnDetector(this, 'GuardDutyDetector', {
      enable: true,
      findingPublishingFrequency: 'FIFTEEN_MINUTES',
      dataSources: {
        s3Logs: {
          enable: true,
        },
        kubernetes: {
          auditLogs: {
            enable: true,
          },
        },
        malwareProtection: {
          scanEc2InstanceWithFindings: {
            ebsVolumes: true,
          },
        },
      },
    });

    // Route GuardDuty findings to SNS
    new events.Rule(this, 'GuardDutyFindingsRule', {
      eventPattern: {
        source: ['aws.guardduty'],
        detailType: ['GuardDuty Finding'],
      },
      targets: [new targets.SnsTopic(securityTopic)],
    });

    // 15. Amazon Inspector v2 for Vulnerability Assessment
    // Note: Enable Inspector v2 manually via CLI: aws inspector2 enable --account-ids <account> --resource-types ECR EC2
    // Inspector v2 CfnEnabler may not be available in this CDK version
    // Alternative: Use CloudFormation custom resource or enable via console

    // Route Inspector findings to SNS (once Inspector is enabled)
    new events.Rule(this, 'InspectorFindingsRule', {
      eventPattern: {
        source: ['aws.inspector2'],
        detailType: ['Inspector2 Finding'],
        detail: {
          severity: ['HIGH', 'CRITICAL'],
        },
      },
      targets: [new targets.SnsTopic(securityTopic)],
    });

    // 16. Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: secureS3Bucket.bucketName,
      description: 'Secure S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'SecurityTopicArn', {
      value: securityTopic.topicArn,
      description: 'Security Notifications Topic ARN',
    });

    // Apply tags
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Application', 'EcommerceSecurityStack');
    cdk.Tags.of(this).add('Owner', 'SecurityTeam');
    cdk.Tags.of(this).add('CostCenter', 'Security');
  }
}

```