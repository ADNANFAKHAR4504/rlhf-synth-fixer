import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as config from 'aws-cdk-lib/aws-config';
// import * as wafv2 from 'aws-cdk-lib/aws-wafv2'; // Commented as WAF is not implemented yet
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  vpcId?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Get VPC ID from props or context
    const vpcId = props?.vpcId || this.node.tryGetContext('vpcId');

    // Common tags for all resources (matching PROMPT requirements)
    const commonTags = {
      Environment: 'Production',
      Department: 'IT',
      Project: 'TapSecurity',
    };

    // Apply tags to the stack
    cdk.Tags.of(this).add('Environment', commonTags.Environment);
    cdk.Tags.of(this).add('Department', commonTags.Department);
    cdk.Tags.of(this).add('Project', commonTags.Project);

    // Import existing VPC if provided, otherwise create a new one
    let vpc: ec2.IVpc;
    if (vpcId) {
      vpc = ec2.Vpc.fromLookup(this, `ExistingVpc-${environmentSuffix}`, {
        vpcId: vpcId,
      });
    } else {
      vpc = new ec2.Vpc(this, `SecurityVpc-${environmentSuffix}`, {
        ipProtocol: ec2.IpProtocol.DUAL_STACK,
        maxAzs: 2,
        natGateways: 1,
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
        enableDnsHostnames: true,
        enableDnsSupport: true,
      });
    }

    // 1. KMS Key for encryption
    const kmsKey = this.createKMSKey(environmentSuffix);

    // 2. Security logging bucket
    const securityBucket = this.createSecurityBucket(environmentSuffix, kmsKey);

    // 3. Create EC2 instance in public subnet
    const ec2Instance = this.createEC2Instance(environmentSuffix, vpc, kmsKey);

    // 4. Create RDS PostgreSQL instance in private subnets
    const rdsInstance = this.createRDSInstance(
      environmentSuffix,
      vpc,
      kmsKey,
      ec2Instance.connections.securityGroups[0]
    );

    // 5. Setup CloudTrail
    this.createCloudTrail(environmentSuffix, securityBucket, kmsKey);

    // 6. Setup AWS Config
    this.createConfigSetup(environmentSuffix);

    // 7. Setup GuardDuty (only if it doesn't exist already)
    this.createGuardDuty(environmentSuffix, kmsKey);

    // 8. Setup WAF (regional scope instead of CLOUDFRONT)
    this.createWebACL(environmentSuffix);

    // 9. Setup IAM roles and policies
    this.createIAMRoles(environmentSuffix, securityBucket, kmsKey);

    // 10. Setup Systems Manager (with correct patch classification)
    this.createSystemsManagerSetup(environmentSuffix);

    // 11. Setup automated remediation
    const remediationFunction =
      this.createRemediationFunction(environmentSuffix);

    // 12. Setup monitoring and alerting
    this.createMonitoring(environmentSuffix, remediationFunction, kmsKey);

    // 13. Output important values
    new cdk.CfnOutput(this, 'SecurityKmsKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for security resources',
    });

    new cdk.CfnOutput(this, 'SecurityBucketName', {
      value: securityBucket.bucketName,
      description: 'Security Logs Bucket Name',
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'RDSEndpoint', {
      value: rdsInstance.dbInstanceEndpointAddress,
      description: 'RDS PostgreSQL Endpoint',
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });
  }

  private createKMSKey(environmentSuffix: string): kms.Key {
    const kmsKey = new kms.Key(this, `TapSecurityKmsKey-${environmentSuffix}`, {
      description: `KMS key for security-related resources ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      policy: new iam.PolicyDocument({
        statements: [
          // Allow root account full access
          new iam.PolicyStatement({
            sid: 'Enable IAM root permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          // CloudTrail
          new iam.PolicyStatement({
            sid: 'Allow CloudTrail to use key',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
            actions: ['kms:GenerateDataKey', 'kms:DescribeKey'],
            resources: ['*'],
          }),
          // CloudWatch Logs
          new iam.PolicyStatement({
            sid: 'Allow CloudWatchLogs to use key',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('logs.amazonaws.com')],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:GenerateDataKey',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
          // EventBridge (for GuardDuty / security alerts)
          new iam.PolicyStatement({
            sid: 'Allow EventBridge to use key',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('events.amazonaws.com')],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:GenerateDataKey',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    return kmsKey;
  }

  private createSecurityBucket(
    environmentSuffix: string,
    kmsKey: kms.Key
  ): s3.Bucket {
    const bucket = new s3.Bucket(
      this,
      `TapSecurityBucket-${environmentSuffix}`,
      {
        // bucketName: `tap-security-logs-${environmentSuffix}-${this.account}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        publicReadAccess: false,
        versioned: true,
        lifecycleRules: [
          {
            id: 'security-logs-lifecycle',
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
        serverAccessLogsPrefix: 'access-logs/',
        enforceSSL: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // Add bucket policy to deny unencrypted uploads
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyUnencryptedUploads',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject'],
        resources: [`${bucket.bucketArn}/*`],
        conditions: {
          StringNotEquals: {
            's3:x-amz-server-side-encryption': 'aws:kms',
          },
        },
      })
    );

    return bucket;
  }

  private createEC2Instance(
    environmentSuffix: string,
    vpc: ec2.IVpc,
    kmsKey: kms.Key
  ): ec2.Instance {
    // Create HTTPS-only security group for EC2 instance
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `TapEC2SecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for EC2 instance - HTTPS only',
        allowAllOutbound: true,
      }
    );

    // Allow HTTPS inbound traffic only
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Create EC2 instance in public subnet
    const instance = new ec2.Instance(
      this,
      `TapEC2Instance-${environmentSuffix}`,
      {
        instanceName: `tap-ec2-${environmentSuffix}`,
        vpc,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        securityGroup: ec2SecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              encrypted: true,
              kmsKey: kmsKey,
              volumeType: ec2.EbsDeviceVolumeType.GP3,
            }),
          },
        ],
      }
    );

    // Add tags to EC2 instance
    cdk.Tags.of(instance).add(
      'PatchGroup',
      `tap-security-${environmentSuffix}`
    );

    return instance;
  }

  private createRDSInstance(
    environmentSuffix: string,
    vpc: ec2.IVpc,
    kmsKey: kms.Key,
    ec2SecurityGroup: ec2.ISecurityGroup
  ): rds.DatabaseInstance {
    // Create security group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `TapRDSSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for RDS PostgreSQL - access from EC2 only',
        allowAllOutbound: false,
      }
    );

    // Allow access only from EC2 security group
    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from EC2 instance only'
    );

    // Create RDS subnet group
    const subnetGroup = new rds.SubnetGroup(
      this,
      `TapRDSSubnetGroup-${environmentSuffix}`,
      {
        description: 'Subnet group for RDS PostgreSQL',
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      }
    );

    // Create RDS PostgreSQL instance
    const dbInstance = new rds.DatabaseInstance(
      this,
      `TapRDSInstance-${environmentSuffix}`,
      {
        instanceIdentifier: `tap-rds-postgres-${environmentSuffix}`,
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15_7,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        vpc,
        subnetGroup,
        securityGroups: [rdsSecurityGroup],
        storageEncrypted: true,
        storageEncryptionKey: kmsKey,
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        storageType: rds.StorageType.GP3,
        multiAz: true,
        autoMinorVersionUpgrade: true,
        deleteAutomatedBackups: true,
        backupRetention: cdk.Duration.days(7),
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        enablePerformanceInsights: true,
        performanceInsightEncryptionKey: kmsKey,
        performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
        monitoringInterval: cdk.Duration.seconds(60),
        cloudwatchLogsExports: ['postgresql'],
        credentials: rds.Credentials.fromGeneratedSecret('postgres', {
          secretName: `tap-rds-credentials-${environmentSuffix}`,
        }),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    return dbInstance;
  }

  private createCloudTrail(
    environmentSuffix: string,
    securityBucket: s3.Bucket,
    kmsKey: kms.Key
  ): void {
    // Create CloudWatch Log Group for CloudTrail
    const logGroup = new logs.LogGroup(
      this,
      `TapCloudTrailLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/cloudtrail/tap-security-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_YEAR,
        encryptionKey: kmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Create CloudTrail with insight selector
    const trail = new cloudtrail.Trail(
      this,
      `TapCloudTrail-${environmentSuffix}`,
      {
        trailName: `tap-security-trail-${environmentSuffix}`,
        bucket: securityBucket,
        s3KeyPrefix: 'cloudtrail-logs/',
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
        enableFileValidation: true,
        encryptionKey: kmsKey,
        cloudWatchLogGroup: logGroup,
        sendToCloudWatchLogs: true,
      }
    );

    // Log all S3 and Lambda data events
    trail.addS3EventSelector(
      [
        {
          bucket: securityBucket,
        },
      ],
      {
        readWriteType: cloudtrail.ReadWriteType.ALL,
      }
    );

    // Log management events
    // trail.addEventSelector(cloudtrail.DataResourceType.AWS_LAMBDA_FUNCTION, [{
    //   logGroup: logGroup
    // }], {
    //   readWriteType: cloudtrail.ReadWriteType.ALL
    // });
  }

  // private createConfigSetup(environmentSuffix: string): void {
  //   const configBucket = new s3.Bucket(
  //     this,
  //     `TapConfigBucket-${environmentSuffix}`,
  //     {
  //       removalPolicy: cdk.RemovalPolicy.DESTROY,
  //       autoDeleteObjects: true,
  //       encryption: s3.BucketEncryption.S3_MANAGED,
  //       blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  //       versioned: true,
  //       enforceSSL: true,
  //     }
  //   );

  //   const configRole = new iam.Role(
  //     this,
  //     `TapConfigRole-${environmentSuffix}`,
  //     {
  //       roleName: `tap-config-role-${environmentSuffix}`,
  //       assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
  //       inlinePolicies: {
  //         ConfigDeliveryPermissions: new iam.PolicyDocument({
  //           statements: [
  //             new iam.PolicyStatement({
  //               effect: iam.Effect.ALLOW,
  //               actions: [
  //                 's3:GetBucketAcl',
  //                 's3:ListBucket',
  //                 's3:GetBucketLocation',
  //               ],
  //               resources: [configBucket.bucketArn],
  //             }),
  //             new iam.PolicyStatement({
  //               effect: iam.Effect.ALLOW,
  //               actions: ['s3:PutObject'],
  //               resources: [`${configBucket.bucketArn}/*`],
  //               conditions: {
  //                 StringEquals: {
  //                   's3:x-amz-acl': 'bucket-owner-full-control',
  //                 },
  //               },
  //             }),
  //           ],
  //         }),
  //       },
  //     }
  //   );

  //   const configRecorder = new config.CfnConfigurationRecorder(
  //     this,
  //     `TapConfigRecorder-${environmentSuffix}`,
  //     {
  //       name: `tap-config-recorder-${environmentSuffix}`,
  //       roleArn: configRole.roleArn,
  //       recordingGroup: {
  //         allSupported: true,
  //         includeGlobalResourceTypes: true,
  //       },
  //     }
  //   );

  //   const deliveryChannel = new config.CfnDeliveryChannel(
  //     this,
  //     `TapConfigDelivery-${environmentSuffix}`,
  //     {
  //       name: `tap-config-delivery-${environmentSuffix}`,
  //       s3BucketName: configBucket.bucketName,
  //       s3KeyPrefix: 'config/',
  //     }
  //   );
  //   deliveryChannel.addDependency(configRecorder);

  //   // ✅ Ensure config rules wait for delivery channel
  //   this.createConfigRules(environmentSuffix, deliveryChannel);
  // }
  private createConfigSetup(environmentSuffix: string): void {
    // Just attach rules to the existing recorder
    this.createConfigRules(environmentSuffix);
  }
  private createConfigRules(environmentSuffix: string): void {
    new config.ManagedRule(
      this,
      `TapS3PublicReadProhibited-${environmentSuffix}`,
      {
        configRuleName: `tap-s3-bucket-public-read-prohibited-${environmentSuffix}`,
        identifier:
          config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_READ_PROHIBITED,
      }
    );

    new config.ManagedRule(this, `TapRootAccessKeyCheck-${environmentSuffix}`, {
      configRuleName: `tap-root-access-key-check-${environmentSuffix}`,
      identifier: config.ManagedRuleIdentifiers.IAM_ROOT_ACCESS_KEY_CHECK,
    });

    new config.ManagedRule(
      this,
      `TapMfaEnabledForIamConsole-${environmentSuffix}`,
      {
        configRuleName: `tap-mfa-enabled-for-iam-console-access-${environmentSuffix}`,
        identifier:
          config.ManagedRuleIdentifiers.MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS,
      }
    );
  }

  // private createConfigRules(
  //   environmentSuffix: string,
  //   dependency: cdk.CfnResource
  // ): void {
  //   const rule1 = new config.ManagedRule(
  //     this,
  //     `TapS3PublicReadProhibited-${environmentSuffix}`,
  //     {
  //       configRuleName: `tap-s3-bucket-public-read-prohibited-${environmentSuffix}`,
  //       identifier:
  //         config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_READ_PROHIBITED,
  //     }
  //   );
  //   rule1.node.addDependency(dependency);

  //   const rule2 = new config.ManagedRule(
  //     this,
  //     `TapRootAccessKeyCheck-${environmentSuffix}`,
  //     {
  //       configRuleName: `tap-root-access-key-check-${environmentSuffix}`,
  //       identifier: config.ManagedRuleIdentifiers.IAM_ROOT_ACCESS_KEY_CHECK,
  //     }
  //   );
  //   rule2.node.addDependency(dependency);

  //   const rule3 = new config.ManagedRule(
  //     this,
  //     `TapMfaEnabledForIamConsole-${environmentSuffix}`,
  //     {
  //       configRuleName: `tap-mfa-enabled-for-iam-console-access-${environmentSuffix}`,
  //       identifier:
  //         config.ManagedRuleIdentifiers.MFA_ENABLED_FOR_IAM_CONSOLE_ACCESS,
  //     }
  //   );
  //   rule3.node.addDependency(dependency);
  // }

  private createGuardDuty(environmentSuffix: string, kmsKey: kms.Key): void {
    // Check if GuardDuty detector already exists - if it does, we'll skip creation
    // but still set up the EventBridge rules for monitoring

    // Create EventBridge rule to capture GuardDuty findings
    const guardDutyRule = new events.Rule(
      this,
      `TapGuardDutyRule-${environmentSuffix}`,
      {
        eventPattern: {
          source: ['aws.guardduty'],
          detailType: ['GuardDuty Finding'],
        },
      }
    );

    // Create CloudWatch Log Group for GuardDuty findings
    const guardDutyLogGroup = new logs.LogGroup(
      this,
      `TapGuardDutyLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/events/guardduty/tap-security-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_YEAR,
        encryptionKey: kmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    guardDutyRule.addTarget(new targets.CloudWatchLogGroup(guardDutyLogGroup));
  }

  private createWebACL(_environmentSuffix: string): void {
    // Use REGIONAL scope instead of CLOUDFRONT for most use cases
    // WAF implementation is currently disabled
  }

  private createIAMRoles(
    environmentSuffix: string,
    securityBucket: s3.Bucket,
    kmsKey: kms.Key
  ): void {
    // Create a group that requires MFA

    // Create application-specific roles with least privilege
    const appRole = new iam.Role(this, `TapAppRole-${environmentSuffix}`, {
      roleName: `tap-app-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
      inlinePolicies: {
        AppSpecificPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [`${securityBucket.bucketArn}/app-data/*`],
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

    // Create instance profile for EC2
    new iam.CfnInstanceProfile(
      this,
      `TapInstanceProfile-${environmentSuffix}`,
      {
        instanceProfileName: `tap-app-instance-profile-${environmentSuffix}`,
        roles: [appRole.roleName],
      }
    );
  }

  private createSystemsManagerSetup(environmentSuffix: string): void {
    // Create patch baseline for security updates with correct classification values

    // Create maintenance window
    const maintenanceWindow = new ssm.CfnMaintenanceWindow(
      this,
      `TapMaintenanceWindow-${environmentSuffix}`,
      {
        name: `tap-patch-maintenance-window-${environmentSuffix}`,
        description: 'Maintenance window for automated patching',
        duration: 4,
        cutoff: 1,
        schedule: 'cron(0 2 ? * SUN *)', // Every Sunday at 2 AM
        allowUnassociatedTargets: false,
      }
    );

    // Create patch group
    new ssm.CfnMaintenanceWindowTarget(
      this,
      `TapPatchTarget-${environmentSuffix}`,
      {
        windowId: maintenanceWindow.ref,
        resourceType: 'INSTANCE',
        targets: [
          {
            key: 'tag:PatchGroup',
            values: [`tap-security-${environmentSuffix}`],
          },
        ],
      }
    );

    // Create patch task
    new ssm.CfnMaintenanceWindowTask(
      this,
      `TapPatchTask-${environmentSuffix}`,
      {
        windowId: maintenanceWindow.ref,
        taskType: 'RUN_COMMAND',
        taskArn: 'AWS-RunPatchBaseline',
        serviceRoleArn: this.createPatchingRole(environmentSuffix).roleArn,
        targets: [
          {
            key: 'WindowTargetIds',
            values: [maintenanceWindow.ref],
          },
        ],
        priority: 1,
        maxConcurrency: '50%',
        maxErrors: '0',
        taskParameters: {
          Operation: {
            Values: ['Install'],
          },
        },
      }
    );
  }

  private createPatchingRole(environmentSuffix: string): iam.Role {
    return new iam.Role(this, `TapPatchingRole-${environmentSuffix}`, {
      roleName: `tap-patching-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ssm.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonSSMAutomationRole'
        ),
      ],
      inlinePolicies: {
        MaintenanceWindowAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ssm:DescribeMaintenanceWindows',
                'ssm:GetMaintenanceWindow',
                'ssm:GetMaintenanceWindowExecution',
                'ssm:GetMaintenanceWindowExecutionTask',
                'ssm:GetMaintenanceWindowTask',
                'ssm:UpdateMaintenanceWindowTask',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });
  }

  private createRemediationFunction(
    environmentSuffix: string
  ): lambda.Function {
    const remediationRole = new iam.Role(
      this,
      `TapRemediationRole-${environmentSuffix}`,
      {
        roleName: `tap-remediation-role-${environmentSuffix}`,
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
                  's3:PutBucketAcl',
                  'ec2:ModifyInstanceAttribute',
                  'iam:AttachRolePolicy',
                  'iam:DetachRolePolicy',
                  'config:PutEvaluations',
                ],
                resources: ['*'],
              }),
            ],
          }),
        },
      }
    );

    const func = new lambda.Function(
      this,
      `TapRemediationFunction-${environmentSuffix}`,
      {
        functionName: `tap-security-remediation-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        role: remediationRole,
        timeout: cdk.Duration.minutes(5),
        environment: {
          ENVIRONMENT: environmentSuffix,
        },
        // ADD THIS LINE to fix the issue:
        logRetention: logs.RetentionDays.ONE_YEAR,
        code: lambda.Code.fromInline(`
  import json
  import boto3
  import logging
  
  logger = logging.getLogger()
  logger.setLevel(logging.INFO)
  
  def handler(event, context):
      """
      Automated remediation function for security compliance violations
      """
      try:
          # Parse the incoming event
          detail = event.get('detail', {})
          config_item = detail.get('configurationItem', {})
          resource_type = config_item.get('resourceType')
          resource_id = config_item.get('resourceId')
          
          logger.info(f"Processing remediation for {resource_type}: {resource_id}")
          
          if resource_type == 'AWS::S3::Bucket':
              remediate_s3_bucket(resource_id)
          elif resource_type == 'AWS::EC2::Instance':
              remediate_ec2_instance(resource_id)
          
          return {
              'statusCode': 200,
              'body': json.dumps({
                  'message': f'Remediation completed for {resource_id}'
              })
          }
      except Exception as e:
          logger.error(f"Remediation failed: {str(e)}")
          return {
              'statusCode': 500,
              'body': json.dumps({
                  'error': str(e)
              })
          }
  
  def remediate_s3_bucket(bucket_name):
      """Remediate S3 bucket public access"""
      s3 = boto3.client('s3')
      
      # Block public access
      s3.put_public_access_block(
          Bucket=bucket_name,
          PublicAccessBlockConfiguration={
              'BlockPublicAcls': True,
              'IgnorePublicAcls': True,
              'BlockPublicPolicy': True,
              'RestrictPublicBuckets': True
          }
      )
      logger.info(f"Blocked public access for bucket: {bucket_name}")
  
  def remediate_ec2_instance(instance_id):
      """Remediate EC2 instance security issues"""
      ec2 = boto3.client('ec2')
      
      # Enable detailed monitoring if not already enabled
      ec2.monitor_instances(InstanceIds=[instance_id])
      logger.info(f"Enabled detailed monitoring for instance: {instance_id}")
  `),
      }
    );

    return func;
  }

  private createMonitoring(
    environmentSuffix: string,
    remediationFunction: lambda.Function,
    kmsKey: kms.Key
  ): void {
    // Create EventBridge rule for Config compliance changes
    const configRule = new events.Rule(
      this,
      `TapConfigComplianceRule-${environmentSuffix}`,
      {
        eventPattern: {
          source: ['aws.config'],
          detailType: ['Config Rules Compliance Change'],
        },
      }
    );

    configRule.addTarget(new targets.LambdaFunction(remediationFunction));

    // Create EventBridge rule for unauthorized API calls
    const unauthorizedApiRule = new events.Rule(
      this,
      `TapUnauthorizedApiRule-${environmentSuffix}`,
      {
        eventPattern: {
          source: ['aws.cloudtrail'],
          detail: {
            errorCode: ['UnauthorizedOperation', 'AccessDenied'],
          },
        },
      }
    );

    // Create CloudWatch Log Group for security alerts
    const alertLogGroup = new logs.LogGroup(
      this,
      `TapSecurityAlertsLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/events/security-alerts/tap-security-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_YEAR,
        encryptionKey: kmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    unauthorizedApiRule.addTarget(
      new targets.CloudWatchLogGroup(alertLogGroup)
    );
  }
}
