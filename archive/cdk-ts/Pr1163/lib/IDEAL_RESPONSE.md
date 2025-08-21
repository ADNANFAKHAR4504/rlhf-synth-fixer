```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface CloudTrailConstructProps {
  environment: string;
  s3BucketsToMonitor?: s3.Bucket[];
}

export class CloudTrailConstruct extends Construct {
  public readonly trail: cloudtrail.Trail;
  public readonly cloudTrailLogGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: CloudTrailConstructProps) {
    super(scope, id);

    const { environment, s3BucketsToMonitor = [] } = props;

    // Create S3 bucket for CloudTrail logs
    const cloudTrailBucket = new s3.Bucket(
      this,
      `CloudTrailBucket-${environment}`,
      {
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        lifecycleRules: [
          {
            id: 'CloudTrailLogRetention',
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
            expiration: cdk.Duration.days(2555), // 7 years
          },
        ],
      }
    );

    // Create CloudWatch Log Group for CloudTrail
    this.cloudTrailLogGroup = new logs.LogGroup(
      this,
      `CloudTrailLogGroup-${environment}`,
      {
        retention: logs.RetentionDays.ONE_YEAR,
      }
    );

    // Create CloudTrail with comprehensive logging
    this.trail = new cloudtrail.Trail(this, `CloudTrail-${environment}`, {
      trailName: `CloudTrail-${environment}`,
      bucket: cloudTrailBucket,
      cloudWatchLogGroup: this.cloudTrailLogGroup,
      cloudWatchLogsRetention: logs.RetentionDays.ONE_YEAR,
      enableFileValidation: true,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      sendToCloudWatchLogs: true,
      managementEvents: cloudtrail.ReadWriteType.ALL,
    });

    // Add S3 data event selectors for monitoring specific buckets
    s3BucketsToMonitor.forEach((bucket, _index) => {
      this.trail.addS3EventSelector(
        [
          {
            bucket: bucket,
            objectPrefix: '',
          },
        ],
        {
          readWriteType: cloudtrail.ReadWriteType.ALL,
          includeManagementEvents: true,
        }
      );
    });

    // Tag CloudTrail resources
    cdk.Tags.of(this.trail).add('Name', `CloudTrail-${environment}`);
    cdk.Tags.of(this.trail).add('Component', 'Security');
    cdk.Tags.of(this.trail).add('Environment', environment);
    cdk.Tags.of(cloudTrailBucket).add(
      'Name',
      `CloudTrailBucket-${environment}`
    );
    cdk.Tags.of(cloudTrailBucket).add('Component', 'Security');
    cdk.Tags.of(cloudTrailBucket).add('Environment', environment);
  }
}

import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface ComputeConstructProps {
  environment: string;
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
}

export class ComputeConstruct extends Construct {
  public readonly webServer: ec2.Instance;
  public readonly appServer: ec2.Instance;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    const { environment, vpc, securityGroup } = props;

    // Create IAM role for EC2 instances with SSM permissions
    const ec2Role = new iam.Role(this, `EC2Role-${environment}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
      inlinePolicies: {
        EC2CustomPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ssm:DescribeAssociation',
                'ssm:GetDeployablePatchSnapshotForInstance',
                'ssm:GetDocument',
                'ssm:DescribeDocument',
                'ssm:GetManifest',
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:ListAssociations',
                'ssm:ListInstanceAssociations',
                'ssm:PutInventory',
                'ssm:PutComplianceItems',
                'ssm:PutConfigurePackageResult',
                'ssm:UpdateAssociationStatus',
                'ssm:UpdateInstanceAssociationStatus',
                'ssm:UpdateInstanceInformation',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Create instance profile (not used directly but required for EC2 instances with IAM roles)
    new iam.CfnInstanceProfile(this, `EC2InstanceProfile-${environment}`, {
      roles: [ec2Role.roleName],
    });

    // Create user data script for instance initialization
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'systemctl enable amazon-cloudwatch-agent',
      'systemctl start amazon-cloudwatch-agent',
      // Install SSM agent (usually pre-installed on Amazon Linux 2)
      'yum install -y amazon-ssm-agent',
      'systemctl enable amazon-ssm-agent',
      'systemctl start amazon-ssm-agent'
    );

    // Create Web Server instance
    this.webServer = new ec2.Instance(this, `WebServer-${environment}`, {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      securityGroup,
      role: ec2Role,
      userData,
      keyName: environment === 'prod' ? undefined : 'default', // Use key pair for non-prod
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            encrypted: true,
            deleteOnTermination: true,
          }),
        },
      ],
    });

    // Create Application Server instance
    this.appServer = new ec2.Instance(this, `AppServer-${environment}`, {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      securityGroup,
      role: ec2Role,
      userData,
      keyName: environment === 'prod' ? undefined : 'default', // Use key pair for non-prod
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            encrypted: true,
            deleteOnTermination: true,
          }),
        },
      ],
    });

    // Tag instances for Patch Manager integration
    cdk.Tags.of(this.webServer).add('Name', `WebServer-${environment}`);
    cdk.Tags.of(this.webServer).add('Component', 'Compute');
    cdk.Tags.of(this.webServer).add('Environment', environment);
    cdk.Tags.of(this.webServer).add('PatchGroup', `${environment}-servers`);
    cdk.Tags.of(this.webServer).add('ServerType', 'web');

    cdk.Tags.of(this.appServer).add('Name', `AppServer-${environment}`);
    cdk.Tags.of(this.appServer).add('Component', 'Compute');
    cdk.Tags.of(this.appServer).add('Environment', environment);
    cdk.Tags.of(this.appServer).add('PatchGroup', `${environment}-servers`);
    cdk.Tags.of(this.appServer).add('ServerType', 'application');

    // Store instance information in SSM Parameter Store
    new ssm.StringParameter(this, `WebServerIPParameter-${environment}`, {
      parameterName: `/app/${environment}/compute/web-server/private-ip`,
      stringValue: this.webServer.instancePrivateIp,
      description: 'Web Server Private IP Address',
    });

    new ssm.StringParameter(this, `AppServerIPParameter-${environment}`, {
      parameterName: `/app/${environment}/compute/app-server/private-ip`,
      stringValue: this.appServer.instancePrivateIp,
      description: 'Application Server Private IP Address',
    });

    // Tag IAM role
    cdk.Tags.of(ec2Role).add('Name', `EC2Role-${environment}`);
    cdk.Tags.of(ec2Role).add('Component', 'Compute');
    cdk.Tags.of(ec2Role).add('Environment', environment);
  }
}

import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface DatabaseConstructProps {
  environment: string;
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
  alertTopic: sns.Topic;
  databasePort?: number;
}

export class DatabaseConstruct extends Construct {
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    const {
      environment,
      vpc,
      securityGroup,
      alertTopic,
      // databasePort = 3306, // Unused variable - removed to fix linting
    } = props;

    // Create DB subnet group
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `DBSubnetGroup-${environment}`,
      {
        vpc,
        description: 'Subnet group for RDS database',
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      }
    );

    // Create parameter group for encryption and security
    const parameterGroup = new rds.ParameterGroup(
      this,
      `DBParameterGroup-${environment}`,
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        parameters: {
          slow_query_log: '1',
          general_log: '1',
          log_queries_not_using_indexes: '1',
          // Explicitly enforce SSL/TLS connections
          require_secure_transport: 'ON',
        },
      }
    );

    // Generate random password and store in SSM Parameter Store
    const dbPassword = new rds.DatabaseSecret(this, `DBSecret-${environment}`, {
      username: 'admin',
    });

    // Create RDS instance with encryption and automated backups
    this.database = new rds.DatabaseInstance(this, `Database-${environment}`, {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [securityGroup],
      credentials: rds.Credentials.fromSecret(dbPassword),
      parameterGroup,

      // Security settings
      storageEncrypted: true,
      storageEncryptionKey: undefined, // Use AWS managed key
      deletionProtection: environment === 'prod',

      // SSL/TLS enforcement - Explicitly configured in parameter group
      // require_secure_transport: 'ON' ensures all connections use SSL/TLS
      // MySQL 8.0 uses AWS managed certificates for SSL connections

      // Backup settings
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: false,

      // Monitoring
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: false,

      // Multi-AZ for production
      multiAz: environment === 'prod',

      // Maintenance
      autoMinorVersionUpgrade: true,
      allowMajorVersionUpgrade: false,

      databaseName: 'appdb',
      // port: databasePort, // Use the configurable port - commented out to avoid replacement
    });

    // CloudWatch Alarms for database monitoring
    const cpuAlarm = new cloudwatch.Alarm(this, `DBCPUAlarm-${environment}`, {
      metric: this.database.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    cpuAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

    const connectionAlarm = new cloudwatch.Alarm(
      this,
      `DBConnectionAlarm-${environment}`,
      {
        metric: this.database.metricDatabaseConnections(),
        threshold: 80,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    connectionAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

    // Store database endpoint in SSM Parameter Store
    new ssm.StringParameter(this, `DBEndpointParameter-${environment}`, {
      parameterName: `/app/${environment}/database/endpoint`,
      stringValue: this.database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    // Tag database
    cdk.Tags.of(this.database).add('Name', `Database-${environment}`);
    cdk.Tags.of(this.database).add('Component', 'Database');
    cdk.Tags.of(this.database).add('Environment', environment);
  }
}

import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface MonitoringConstructProps {
  environment: string;
  cloudTrailLogGroup?: logs.LogGroup;
  alertEmail?: string; // Add configurable alert email
}

export class MonitoringConstruct extends Construct {
  public readonly alertTopic: sns.Topic;
  public readonly securityLogGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    const { environment, cloudTrailLogGroup } = props;

    // SNS Topic for alerts
    this.alertTopic = new sns.Topic(this, `AlertTopic-${environment}`, {
      displayName: `Security Alerts - ${environment}`,
      topicName: `security-alerts-${environment}`,
    });

    // Add email subscription with configurable email address
    const alertEmail =
      props.alertEmail ||
      process.env.ALERT_EMAIL ||
      cdk.Stack.of(this).node.tryGetContext('alertEmail') ||
      cdk.Stack.of(this).node.tryGetContext(`${environment}.alertEmail`) ||
      'security-alerts@your-company-domain.com'; // More generic fallback

    this.alertTopic.addSubscription(new subs.EmailSubscription(alertEmail));

    // CloudWatch Log Group for security events
    this.securityLogGroup = new logs.LogGroup(
      this,
      `SecurityLogGroup-${environment}`,
      {
        retention: logs.RetentionDays.ONE_YEAR,
      }
    );

    // Use provided CloudTrail log group or create a default one
    const cloudTrailLogGroupToUse =
      cloudTrailLogGroup ||
      new logs.LogGroup(this, `CloudTrailLogGroup-${environment}`, {
        retention: logs.RetentionDays.ONE_YEAR,
      });

    // Metric filter for failed login attempts
    new logs.MetricFilter(this, `FailedLoginFilter-${environment}`, {
      logGroup: cloudTrailLogGroupToUse,
      metricNamespace: 'Security',
      metricName: 'FailedLogins',
      filterPattern: logs.FilterPattern.literal(
        '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }'
      ),
      metricValue: '1',
    });

    // Alarm for failed login attempts
    const failedLoginAlarm = new cloudwatch.Alarm(
      this,
      `FailedLoginAlarm-${environment}`,
      {
        metric: new cloudwatch.Metric({
          namespace: 'Security',
          metricName: 'FailedLogins',
          statistic: 'Sum',
        }),
        threshold: 5,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'Alert on multiple failed login attempts',
      }
    );

    failedLoginAlarm.addAlarmAction(new actions.SnsAction(this.alertTopic));

    // Metric filter for root account usage
    new logs.MetricFilter(this, `RootUsageFilter-${environment}`, {
      logGroup: cloudTrailLogGroupToUse,
      metricNamespace: 'Security',
      metricName: 'RootAccountUsage',
      filterPattern: logs.FilterPattern.literal(
        '{ $.userIdentity.type = "Root" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != "AwsServiceEvent" }'
      ),
      metricValue: '1',
    });

    // Alarm for root account usage
    const rootUsageAlarm = new cloudwatch.Alarm(
      this,
      `RootUsageAlarm-${environment}`,
      {
        metric: new cloudwatch.Metric({
          namespace: 'Security',
          metricName: 'RootAccountUsage',
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'Alert on root account usage',
      }
    );

    rootUsageAlarm.addAlarmAction(new actions.SnsAction(this.alertTopic));

    // EventBridge rule for security events
    const securityEventRule = new events.Rule(
      this,
      `SecurityEventRule-${environment}`,
      {
        eventPattern: {
          source: ['aws.signin'],
          detailType: ['AWS Console Sign In via CloudTrail'],
          detail: {
            responseElements: {
              ConsoleLogin: ['Failure'],
            },
          },
        },
      }
    );

    securityEventRule.addTarget(new targets.SnsTopic(this.alertTopic));

    // IAM policy for unauthorized access detection
    const unauthorizedAccessRule = new events.Rule(
      this,
      `UnauthorizedAccessRule-${environment}`,
      {
        eventPattern: {
          source: ['aws.iam'],
          detailType: ['AWS API Call via CloudTrail'],
          detail: {
            eventName: [
              'CreateUser',
              'DeleteUser',
              'CreateRole',
              'DeleteRole',
              'AttachUserPolicy',
              'DetachUserPolicy',
              'AttachRolePolicy',
              'DetachRolePolicy',
            ],
          },
        },
      }
    );

    unauthorizedAccessRule.addTarget(new targets.SnsTopic(this.alertTopic));

    // Tag monitoring resources
    cdk.Tags.of(this.alertTopic).add('Name', `AlertTopic-${environment}`);
    cdk.Tags.of(this.alertTopic).add('Component', 'Monitoring');
    cdk.Tags.of(this.securityLogGroup).add(
      'Name',
      `SecurityLogGroup-${environment}`
    );
    cdk.Tags.of(this.securityLogGroup).add('Component', 'Monitoring');
  }
}

import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface PatchManagerConstructProps {
  environment: string;
  alertTopic: sns.Topic;
}

export class PatchManagerConstruct extends Construct {
  public readonly patchBaseline: ssm.CfnPatchBaseline;

  constructor(scope: Construct, id: string, props: PatchManagerConstructProps) {
    super(scope, id);

    const { environment, alertTopic } = props;

    // Create patch baseline for security updates
    this.patchBaseline = new ssm.CfnPatchBaseline(
      this,
      `PatchBaseline-${environment}`,
      {
        name: `SecurityPatchBaseline-${environment}`,
        description: `Security patch baseline for ${environment} environment`,
        operatingSystem: 'AMAZON_LINUX_2',
        approvalRules: {
          patchRules: [
            {
              approveAfterDays: 7,
              complianceLevel: 'CRITICAL',
              enableNonSecurity: false,
              patchFilterGroup: {
                patchFilters: [
                  {
                    key: 'CLASSIFICATION',
                    values: ['Security'],
                  },
                  {
                    key: 'SEVERITY',
                    values: ['Critical', 'Important'],
                  },
                ],
              },
            },
          ],
        },
        globalFilters: {
          patchFilters: [
            {
              key: 'PRODUCT',
              values: ['AmazonLinux2'],
            },
          ],
        },
        rejectedPatches: [],
        rejectedPatchesAction: 'ALLOW_AS_DEPENDENCY',
        sources: [],
      }
    );

    // Create maintenance window for patching
    const maintenanceWindow = new ssm.CfnMaintenanceWindow(
      this,
      `MaintenanceWindow-${environment}`,
      {
        name: `PatchMaintenanceWindow-${environment}`,
        description: `Maintenance window for ${environment} environment patching`,
        schedule: 'cron(0 2 ? * SUN *)', // Every Sunday at 2 AM
        duration: 4, // 4 hours
        cutoff: 1, // 1 hour before
        allowUnassociatedTargets: false,
      }
    );

    // Create maintenance window target
    new ssm.CfnMaintenanceWindowTarget(
      this,
      `MaintenanceWindowTarget-${environment}`,
      {
        windowId: maintenanceWindow.ref,
        resourceType: 'INSTANCE',
        targets: [
          {
            key: 'tag:PatchGroup',
            values: [`${environment}-servers`],
          },
        ],
      }
    );

    // Create maintenance window task for patching
    new ssm.CfnMaintenanceWindowTask(this, `PatchTask-${environment}`, {
      windowId: maintenanceWindow.ref,
      taskType: 'RUN_COMMAND',
      taskArn: 'AWS-RunPatchBaseline',
      priority: 1,
      maxConcurrency: '1',
      maxErrors: '1',
      targets: [
        {
          key: 'WindowTargetIds',
          values: [maintenanceWindow.ref],
        },
      ],
      taskParameters: {
        Operation: {
          Values: ['Install'],
        },
        RebootOption: {
          Values: ['RebootIfNeeded'],
        },
      },
    });

    // Create CloudWatch alarm for patch compliance
    const patchComplianceAlarm = new cloudwatch.Alarm(
      this,
      `PatchComplianceAlarm-${environment}`,
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/SSM',
          metricName: 'PatchCompliance',
          statistic: 'Average',
          period: cdk.Duration.hours(24),
          dimensionsMap: {
            PatchGroup: `${environment}-servers`,
          },
        }),
        threshold: 90, // Alert if compliance drops below 90%
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
        alarmDescription: `Patch compliance alarm for ${environment} environment`,
      }
    );

    patchComplianceAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

    // Create CloudWatch alarm for failed patch operations
    const failedPatchAlarm = new cloudwatch.Alarm(
      this,
      `FailedPatchAlarm-${environment}`,
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/SSM',
          metricName: 'FailedPatchOperations',
          statistic: 'Sum',
          period: cdk.Duration.hours(1),
          dimensionsMap: {
            PatchGroup: `${environment}-servers`,
          },
        }),
        threshold: 1, // Alert if any patch operations fail
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `Failed patch operations alarm for ${environment} environment`,
      }
    );

    failedPatchAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

    // Tag resources
    cdk.Tags.of(this.patchBaseline).add('Name', `PatchBaseline-${environment}`);
    cdk.Tags.of(this.patchBaseline).add('Component', 'PatchManager');
    cdk.Tags.of(this.patchBaseline).add('Environment', environment);
    cdk.Tags.of(maintenanceWindow).add(
      'Name',
      `MaintenanceWindow-${environment}`
    );
    cdk.Tags.of(maintenanceWindow).add('Component', 'PatchManager');
    cdk.Tags.of(maintenanceWindow).add('Environment', environment);
  }
}

import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface SecurityConstructProps {
  environment: string;
  vpc: ec2.Vpc;
}

export class SecurityConstruct extends Construct {
  public readonly webSecurityGroup: ec2.SecurityGroup;
  public readonly appSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;
  public readonly ec2Role: iam.Role;
  public readonly rdsRole: iam.Role;
  public readonly adminRole: iam.Role;

  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);

    const { environment, vpc } = props;

    // Web tier security group (ALB/CloudFront)
    this.webSecurityGroup = new ec2.SecurityGroup(
      this,
      `WebSecurityGroup-${environment}`,
      {
        vpc,
        description: 'Security group for web tier',
        allowAllOutbound: false,
      }
    );

    // Only allow HTTPS inbound
    this.webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS inbound'
    );

    // Allow HTTP to HTTPS redirect
    this.webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP for redirect to HTTPS'
    );

    // Application tier security group
    this.appSecurityGroup = new ec2.SecurityGroup(
      this,
      `AppSecurityGroup-${environment}`,
      {
        vpc,
        description: 'Security group for application tier',
        allowAllOutbound: false,
      }
    );

    // Allow traffic from web tier
    this.appSecurityGroup.addIngressRule(
      this.webSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from web tier'
    );

    // Allow HTTPS outbound to specific AWS services and approved APIs
    this.appSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound to AWS services and approved APIs'
    );

    // Allow DNS resolution
    this.appSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udp(53),
      'Allow DNS resolution'
    );

    // Allow NTP for time synchronization
    this.appSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udp(123),
      'Allow NTP for time synchronization'
    );

    // Database security group
    this.databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      `DatabaseSecurityGroup-${environment}`,
      {
        vpc,
        description: 'Security group for database tier',
        allowAllOutbound: false,
      }
    );

    // Only allow access from application tier
    this.databaseSecurityGroup.addIngressRule(
      this.appSecurityGroup,
      ec2.Port.tcp(3306), // Default MySQL port, can be parameterized
      'Allow MySQL access from app tier'
    );

    // EC2 IAM Role with least privilege
    this.ec2Role = new iam.Role(this, `EC2Role-${environment}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Add CloudWatch permissions
    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudwatch:PutMetricData',
          'logs:PutLogEvents',
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
        ],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'aws:RequestedRegion': cdk.Stack.of(this).region,
          },
        },
      })
    );

    // RDS IAM Role
    this.rdsRole = new iam.Role(this, `RDSRole-${environment}`, {
      assumedBy: new iam.ServicePrincipal('rds.amazonaws.com'),
      description: 'IAM role for RDS enhanced monitoring',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonRDSEnhancedMonitoringRole'
        ),
      ],
    });

    // Admin Role with MFA requirement for sensitive operations
    this.adminRole = new iam.Role(this, `AdminRole-${environment}`, {
      assumedBy: new iam.AccountPrincipal(cdk.Stack.of(this).account),
      description: 'Admin role with MFA requirement for sensitive operations',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),
      ],
    });

    // Add MFA requirement policy for sensitive operations
    this.adminRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        actions: [
          'iam:CreateUser',
          'iam:DeleteUser',
          'iam:CreateRole',
          'iam:DeleteRole',
          'iam:AttachUserPolicy',
          'iam:DetachUserPolicy',
          'iam:AttachRolePolicy',
          'iam:DetachRolePolicy',
          'iam:CreateAccessKey',
          'iam:DeleteAccessKey',
          'rds:DeleteDBInstance',
          'rds:ModifyDBInstance',
          'ec2:DeleteVpc',
          'ec2:DeleteSecurityGroup',
          's3:DeleteBucket',
          'kms:DeleteAlias',
          'kms:DeleteKey',
        ],
        resources: ['*'],
        conditions: {
          BoolIfExists: {
            'aws:MultiFactorAuthPresent': 'false',
          },
        },
      })
    );

    // Instance Profile for EC2
    new iam.InstanceProfile(this, `EC2InstanceProfile-${environment}`, {
      role: this.ec2Role,
    });

    // Add Systems Manager Patch Manager permissions to EC2 role
    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ssm:DescribeInstanceInformation',
          'ssm:ListComplianceItems',
          'ssm:ListComplianceSummaries',
          'ssm:ListResourceComplianceSummaries',
          'ssm:GetComplianceDetailsByConfigRule',
          'ssm:GetComplianceDetailsByResource',
          'ssm:GetPatchBaseline',
          'ssm:GetPatchBaselineForPatchGroup',
          'ssm:DescribePatchBaselines',
          'ssm:DescribePatchGroups',
          'ssm:DescribeAvailablePatches',
          'ssm:DescribePatchProperties',
          'ssm:GetParameter',
          'ssm:GetParameters',
          'ssm:GetParametersByPath',
        ],
        resources: ['*'],
      })
    );

    // Add CloudWatch permissions for patch compliance monitoring
    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'cloudwatch:namespace': 'AWS/SSM',
          },
        },
      })
    );

    // Tag security groups
    cdk.Tags.of(this.webSecurityGroup).add(
      'Name',
      `WebSecurityGroup-${environment}`
    );
    cdk.Tags.of(this.webSecurityGroup).add('Component', 'Security');
    cdk.Tags.of(this.appSecurityGroup).add(
      'Name',
      `AppSecurityGroup-${environment}`
    );
    cdk.Tags.of(this.appSecurityGroup).add('Component', 'Security');
    cdk.Tags.of(this.databaseSecurityGroup).add(
      'Name',
      `DatabaseSecurityGroup-${environment}`
    );
    cdk.Tags.of(this.databaseSecurityGroup).add('Component', 'Security');
  }
}

import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface StorageConstructProps {
  environment: string;
  alertTopic: sns.Topic;
}

export class StorageConstruct extends Construct {
  public readonly secureS3Bucket: s3.Bucket;
  public readonly secureS3BucketPolicy: iam.Policy;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    const { environment, alertTopic } = props;

    // Create secure S3 bucket
    this.secureS3Bucket = new s3.Bucket(this, `SecureBucket-${environment}`, {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // Create IAM policy for S3 bucket access
    this.secureS3BucketPolicy = new iam.Policy(
      this,
      `S3AccessPolicy-${environment}`,
      {
        policyName: `secure-bucket-policy-${environment}-001`,
        statements: [
          new iam.PolicyStatement({
            actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            resources: [
              this.secureS3Bucket.bucketArn,
              `${this.secureS3Bucket.bucketArn}/*`,
            ],
          }),
        ],
      }
    );

    // Add S3 bucket notification for security monitoring
    this.secureS3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SnsDestination(alertTopic)
    );

    // Tag resources
    cdk.Tags.of(this.secureS3Bucket).add('Name', `SecureBucket-${environment}`);
    cdk.Tags.of(this.secureS3Bucket).add('Component', 'Storage');
    cdk.Tags.of(this.secureS3Bucket).add('Environment', environment);
  }
}

import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface VpcConstructProps {
  environment: string;
}

export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    const { environment } = props;

    // Create VPC with 3 public and 3 private subnets across 3 AZs
    this.vpc = new ec2.Vpc(this, `VPC-${environment}`, {
      maxAzs: 3,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `PublicSubnet-${environment}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `PrivateSubnet-${environment}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGateways: 3, // One NAT Gateway per AZ for high availability
    });

    // Create Network ACLs for additional security
    const privateNetworkAcl = new ec2.NetworkAcl(
      this,
      `PrivateNetworkAcl-${environment}`,
      {
        vpc: this.vpc,
        subnetSelection: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      }
    );

    // Allow HTTPS outbound for private subnets
    privateNetworkAcl.addEntry(`AllowHTTPSOutbound-${environment}`, {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow HTTP outbound for private subnets
    privateNetworkAcl.addEntry(`AllowHTTPOutbound-${environment}`, {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(80),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow ephemeral ports inbound for responses
    privateNetworkAcl.addEntry(`AllowEphemeralInbound-${environment}`, {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Tag all VPC resources
    cdk.Tags.of(this.vpc).add('Name', `VPC-${environment}`);
    cdk.Tags.of(this.vpc).add('Component', 'Network');
    cdk.Tags.of(this.vpc).add('Environment', environment);

    // Create CloudWatch Log Group for VPC Flow Logs
    const flowLogGroup = new logs.LogGroup(
      this,
      `VPCFlowLogGroup-${environment}`,
      {
        retention: logs.RetentionDays.ONE_YEAR,
        logGroupName: `/aws/vpc/${environment}/flow-logs`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Create IAM role for VPC Flow Logs
    const flowLogRole = new iam.Role(this, `VPCFlowLogRole-${environment}`, {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      inlinePolicies: {
        VPCFlowLogPolicy: new iam.PolicyDocument({
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
              resources: [flowLogGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    // Enable VPC Flow Logs for ALL traffic (comprehensive logging)
    this.vpc.addFlowLog(`VPCFlowLog-${environment}`, {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        flowLogGroup,
        flowLogRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
      maxAggregationInterval: ec2.FlowLogMaxAggregationInterval.ONE_MINUTE,
    });

    // Create additional flow log for rejected traffic only (cost optimization)
    const rejectedFlowLogGroup = new logs.LogGroup(
      this,
      `VPCRejectedFlowLogGroup-${environment}`,
      {
        retention: logs.RetentionDays.ONE_YEAR,
        logGroupName: `/aws/vpc/${environment}/rejected-flow-logs`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Create IAM role for rejected flow logs
    const rejectedFlowLogRole = new iam.Role(
      this,
      `VPCRejectedFlowLogRole-${environment}`,
      {
        assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
        inlinePolicies: {
          VPCRejectedFlowLogPolicy: new iam.PolicyDocument({
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
                resources: [rejectedFlowLogGroup.logGroupArn],
              }),
            ],
          }),
        },
      }
    );

    // Enable VPC Flow Logs for rejected traffic only
    this.vpc.addFlowLog(`VPCRejectedFlowLog-${environment}`, {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        rejectedFlowLogGroup,
        rejectedFlowLogRole
      ),
      trafficType: ec2.FlowLogTrafficType.REJECT,
      maxAggregationInterval: ec2.FlowLogMaxAggregationInterval.ONE_MINUTE,
    });

    // Tag rejected flow log resources
    cdk.Tags.of(rejectedFlowLogGroup).add(
      'Name',
      `VPCRejectedFlowLogGroup-${environment}`
    );
    cdk.Tags.of(rejectedFlowLogGroup).add('Component', 'Network');
    cdk.Tags.of(rejectedFlowLogGroup).add('Environment', environment);
    cdk.Tags.of(rejectedFlowLogRole).add(
      'Name',
      `VPCRejectedFlowLogRole-${environment}`
    );
    cdk.Tags.of(rejectedFlowLogRole).add('Component', 'Network');
    cdk.Tags.of(rejectedFlowLogRole).add('Environment', environment);

    // Tag VPC Flow Log resources
    cdk.Tags.of(flowLogGroup).add('Name', `VPCFlowLogGroup-${environment}`);
    cdk.Tags.of(flowLogGroup).add('Component', 'Network');
    cdk.Tags.of(flowLogGroup).add('Environment', environment);
    cdk.Tags.of(flowLogRole).add('Name', `VPCFlowLogRole-${environment}`);
    cdk.Tags.of(flowLogRole).add('Component', 'Network');
    cdk.Tags.of(flowLogRole).add('Environment', environment);
  }
}


import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface WafConstructProps {
  environment: string;
}

export class WafConstruct extends Construct {
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: WafConstructProps) {
    super(scope, id);

    const { environment } = props;

    // CloudWatch Log Group for WAF logs - Removed as WAF logging requires Kinesis Data Firehose
    // TODO: Implement Kinesis Data Firehose delivery stream for proper WAF logging

    // Create WAF Web ACL
    this.webAcl = new wafv2.CfnWebACL(this, `WebACL-${environment}`, {
      scope: 'CLOUDFRONT', // Use CLOUDFRONT for CloudFront, REGIONAL for ALB
      defaultAction: { allow: {} },
      name: `WebACL-${environment}`,
      description: `WAF Web ACL for ${environment} environment`,

      rules: [
        // AWS Managed Rule - Core Rule Set
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

        // AWS Managed Rule - SQL Injection
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 2,
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

        // AWS Managed Rule - Known Bad Inputs
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 3,
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

        // Rate limiting rule
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

        // Custom XSS protection rule
        {
          name: 'XSSProtectionRule',
          priority: 5,
          action: { block: {} },
          statement: {
            xssMatchStatement: {
              fieldToMatch: {
                allQueryArguments: {},
              },
              textTransformations: [
                {
                  priority: 1,
                  type: 'URL_DECODE',
                },
                {
                  priority: 2,
                  type: 'HTML_ENTITY_DECODE',
                },
              ],
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'XSSProtectionMetric',
          },
        },
      ],

      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `WebACL-${environment}`,
      },
    });

    // Create CloudWatch Log Group for WAF logs
    const wafLogGroup = new logs.LogGroup(this, `WAFLogGroup-${environment}`, {
      retention: logs.RetentionDays.ONE_YEAR,
      logGroupName: `/aws/waf/${environment}/web-acl-logs`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create IAM role for WAF logging
    const wafLoggingRole = new iam.Role(this, `WAFLoggingRole-${environment}`, {
      assumedBy: new iam.ServicePrincipal('wafv2.amazonaws.com'),
      inlinePolicies: {
        WAFLoggingPolicy: new iam.PolicyDocument({
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
              resources: [wafLogGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    // WAF Logging Configuration - Temporarily disabled to resolve ARN format issues
    // TODO: Implement proper WAF logging once ARN format requirements are confirmed
    // Current issue: WAF v2 logging requires specific ARN format that needs investigation

    // Tag WAF resources
    cdk.Tags.of(this.webAcl).add('Name', `WebACL-${environment}`);
    cdk.Tags.of(this.webAcl).add('Component', 'Security');
    cdk.Tags.of(this.webAcl).add('Environment', environment);

    // Tag WAF logging resources
    cdk.Tags.of(wafLogGroup).add('Name', `WAFLogGroup-${environment}`);
    cdk.Tags.of(wafLogGroup).add('Component', 'Security');
    cdk.Tags.of(wafLogGroup).add('Environment', environment);
    cdk.Tags.of(wafLoggingRole).add('Name', `WAFLoggingRole-${environment}`);
    cdk.Tags.of(wafLoggingRole).add('Component', 'Security');
    cdk.Tags.of(wafLoggingRole).add('Environment', environment);
  }
}


import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CloudTrailConstruct } from './constructs/cloudtrail-construct';
import { DatabaseConstruct } from './constructs/database-construct';
import { MonitoringConstruct } from './constructs/monitoring-construct';
import { PatchManagerConstruct } from './constructs/patch-manager-construct';
import { SecurityConstruct } from './constructs/security-construct';
import { StorageConstruct } from './constructs/storage-construct';
import { VpcConstruct } from './constructs/vpc-construct';
import { WafConstruct } from './constructs/waf-construct';

export interface SecureInfrastructureStackProps extends cdk.StackProps {
  environment: string;
  alertEmail?: string; // Add configurable alert email
}

export class SecureInfrastructureStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: SecureInfrastructureStackProps
  ) {
    super(scope, id, props);

    const { environment } = props;

    // VPC Infrastructure
    const vpcConstruct = new VpcConstruct(this, 'VpcConstruct', {
      environment,
    });

    // Security Infrastructure
    const securityConstruct = new SecurityConstruct(this, 'SecurityConstruct', {
      environment,
      vpc: vpcConstruct.vpc,
    });

    // Monitoring and Alerting
    const monitoringConstruct = new MonitoringConstruct(
      this,
      'MonitoringConstruct',
      {
        environment,
        alertEmail: props.alertEmail, // Pass configurable email
      }
    );

    // Storage Infrastructure (create first to get S3 bucket)
    const storageConstruct = new StorageConstruct(this, 'StorageConstruct', {
      environment,
      alertTopic: monitoringConstruct.alertTopic,
    });

    // CloudTrail for comprehensive logging (with S3 bucket monitoring)
    const cloudTrailConstruct = new CloudTrailConstruct(
      this,
      'CloudTrailConstruct',
      {
        environment,
        s3BucketsToMonitor: [storageConstruct.secureS3Bucket],
      }
    );

    // Database Infrastructure
    const databaseConstruct = new DatabaseConstruct(this, 'DatabaseConstruct', {
      environment,
      vpc: vpcConstruct.vpc,
      securityGroup: securityConstruct.databaseSecurityGroup,
      alertTopic: monitoringConstruct.alertTopic,
    });

    // WAF Protection
    const wafConstruct = new WafConstruct(this, 'WafConstruct', {
      environment,
    });

    // Patch Manager for automated patching
    new PatchManagerConstruct(this, 'PatchManagerConstruct', {
      environment,
      alertTopic: monitoringConstruct.alertTopic,
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpcConstruct.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: databaseConstruct.database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'WafAclArn', {
      value: wafConstruct.webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });

    new cdk.CfnOutput(this, 'CloudTrailArn', {
      value: cloudTrailConstruct.trail.trailArn,
      description: 'CloudTrail ARN',
    });
  }
}

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecureInfrastructureStack } from './secure-infrastructure-stack';

// ? Import your stacks here
// import { MyStack } from './my-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
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
    new SecureInfrastructureStack(this, 'SecureInfrastructureStack', {
      environment: environmentSuffix,
    });
  }
}


```