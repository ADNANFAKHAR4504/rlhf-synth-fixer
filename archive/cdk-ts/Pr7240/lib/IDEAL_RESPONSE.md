# Library Reference

The following sections capture each non-Markdown asset from `lib/`, preserving the full implementation for clarity and future collaboration. All code is presented verbatim within appropriately typed code fences.


## failure-recovery-infrastructure.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import { MultiRegionDns } from './multi-region-dns';

export interface FailureRecoveryInfrastructureProps extends cdk.StackProps {
  environmentSuffix: string;
  vpcCidr?: string;
  domainName?: string;
  alertEmail?: string;
  adminCidr?: string;
  instanceType?: string;
  dbInstanceType?: string;
  logRetentionDays?: number;
  enableRoute53?: boolean;
  createHostedZone?: boolean;
  primaryRegion?: string;
  applicationSubdomain?: string;
}

export class FailureRecoveryInfrastructure extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly asg: autoscaling.AutoScalingGroup;
  public readonly database: rds.DatabaseInstance;
  public readonly logBucket: s3.Bucket;
  public readonly dns?: MultiRegionDns;

  constructor(
    scope: Construct,
    id: string,
    props: FailureRecoveryInfrastructureProps
  ) {
    super(scope, id);

    const region = cdk.Stack.of(this).region;
    const timestamp = Date.now().toString();

    // Configuration with environment-specific defaults
    const config = {
      environmentSuffix: props.environmentSuffix,
      vpcCidr: props.vpcCidr || '10.0.0.0/16',
      vpcName: `prod-app-vpc-${props.environmentSuffix}`,
      domainName: props.domainName || 'example.com',
      alertEmail: props.alertEmail || 'alerts@example.com',
      adminCidr: props.adminCidr || '10.0.0.0/8',
      instanceType: props.instanceType || 't3.medium',
      dbInstanceType: props.dbInstanceType || 'db.t3.small',
      logRetentionDays: props.logRetentionDays || 30,
      enableRoute53: props.enableRoute53 ?? false,
      createHostedZone: props.createHostedZone ?? false,
      primaryRegion: props.primaryRegion || 'us-east-1',
      applicationSubdomain: props.applicationSubdomain || 'app',
      timestamp: timestamp,
    };

    // Add iac-rlhf-amazon tag to all resources
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);

    // ==========================================
    // KMS KEYS FOR ENCRYPTION
    // ==========================================
    const rdsKmsKey = new kms.Key(this, 'RdsKmsKey', {
      alias: `alias/prod-rds-key-${config.environmentSuffix}`,
      description: 'KMS key for RDS encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion for testing
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
            sid: 'Allow RDS Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('rds.amazonaws.com')],
            actions: [
              'kms:Decrypt',
              'kms:GenerateDataKey',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    const s3KmsKey = new kms.Key(this, 'S3KmsKey', {
      alias: `alias/prod-s3-key-${config.environmentSuffix}`,
      description: 'KMS key for S3 bucket encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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
            sid: 'Allow S3 Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
            actions: ['kms:Decrypt', 'kms:GenerateDataKey', 'kms:DescribeKey'],
            resources: ['*'],
          }),
        ],
      }),
    });

    // ==========================================
    // VPC WITH PUBLIC AND PRIVATE SUBNETS
    // ==========================================
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: config.vpcName,
      ipAddresses: ec2.IpAddresses.cidr(config.vpcCidr),
      maxAzs: 2,
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
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // ==========================================
    // SECURITY GROUPS
    // ==========================================
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `prod-sg-alb-${config.environmentSuffix}`,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from anywhere'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from anywhere'
    );

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `prod-sg-ec2-${config.environmentSuffix}`,
      description: 'Security group for EC2 instances',
      allowAllOutbound: false,
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(config.adminCidr),
      ec2.Port.tcp(22),
      'Allow SSH from admin CIDR'
    );

    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound'
    );

    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP outbound'
    );

    albSecurityGroup.addEgressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(80),
      'Allow ALB to EC2'
    );

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `prod-sg-rds-${config.environmentSuffix}`,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL from EC2 instances'
    );

    ec2SecurityGroup.addEgressRule(
      rdsSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow EC2 to RDS'
    );

    // ==========================================
    // S3 BUCKETS FOR LOGS WITH LIFECYCLE
    // ==========================================
    this.logBucket = new s3.Bucket(this, 'LogBucket', {
      bucketName: `prod-logs-bucket-${config.environmentSuffix}-${config.timestamp}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3KmsKey,
      versioned: true,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion for testing
      autoDeleteObjects: true, // Clean up objects when stack is deleted
      lifecycleRules: [
        {
          id: 'TransitionToGlacier',
          enabled: true,
          transitions: [
            {
              transitionAfter: Duration.days(config.logRetentionDays),
              storageClass: s3.StorageClass.GLACIER,
            },
          ],
          expiration: Duration.days(365),
        },
      ],
    });

    // Add bucket policy to enforce HTTPS only
    this.logBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [this.logBucket.bucketArn, `${this.logBucket.bucketArn}/*`],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    // ==========================================
    // LAMBDA FUNCTION FOR LOG PROCESSING
    // ==========================================
    const logProcessorRole = new iam.Role(this, 'LogProcessorRole', {
      roleName: `prod-role-lambda-log-processor-${config.environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    this.logBucket.grantReadWrite(logProcessorRole);
    s3KmsKey.grantEncryptDecrypt(logProcessorRole);

    const logProcessor = new lambda.Function(this, 'LogProcessor', {
      functionName: `prod-lambda-log-processor-${config.environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: logProcessorRole,
      code: lambda.Code.fromInline(`
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
    console.log('Processing log files...');
    
    try {
        // Process S3 events for log files
        for (const record of event.Records) {
            if (record.eventSource === 'aws:s3') {
                const bucket = record.s3.bucket.name;
                const key = record.s3.object.key;
                
                console.log(\`Processing log file: \${bucket}/\${key}\`);
                
                // Get object metadata
                const params = {
                    Bucket: bucket,
                    Key: key
                };
                
                const metadata = await s3.headObject(params).promise();
                console.log(\`File size: \${metadata.ContentLength} bytes\`);
                
                // Add log processing logic here
                // For example: parse access logs, extract metrics, send to CloudWatch
                
                // Tag processed objects
                await s3.putObjectTagging({
                    Bucket: bucket,
                    Key: key,
                    Tagging: {
                        TagSet: [
                            {
                                Key: 'ProcessedBy',
                                Value: 'LogProcessor'
                            },
                            {
                                Key: 'ProcessedAt',
                                Value: new Date().toISOString()
                            }
                        ]
                    }
                }).promise();
                
                console.log(\`Successfully processed: \${key}\`);
            }
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify('Logs processed successfully')
        };
    } catch (error) {
        console.error('Error processing logs:', error);
        throw error;
    }
};
`),
      timeout: Duration.minutes(5),
      environment: {
        LOG_BUCKET: this.logBucket.bucketName,
        ENVIRONMENT: config.environmentSuffix,
      },
    });

    // ==========================================
    // IAM ROLE FOR EC2 INSTANCES
    // ==========================================
    const ec2Role = new iam.Role(this, 'Ec2Role', {
      roleName: `prod-role-ec2-${config.environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with least privilege',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    this.logBucket.grantWrite(ec2Role);
    s3KmsKey.grantEncryptDecrypt(ec2Role);

    // ==========================================
    // SECRETS MANAGER FOR RDS CREDENTIALS
    // ==========================================
    const dbCredentials = new secretsmanager.Secret(this, 'DbCredentials', {
      secretName: `prod-rds-credentials-${config.environmentSuffix}`,
      description: 'RDS MySQL database credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ==========================================
    // RDS MYSQL MULTI-AZ INSTANCE
    // ==========================================
    this.database = new rds.DatabaseInstance(this, 'RdsInstance', {
      instanceIdentifier: `prod-rds-mysql-${config.environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.SMALL
      ),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [rdsSecurityGroup],
      multiAz: true,
      allocatedStorage: 20,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      storageEncryptionKey: rdsKmsKey,
      credentials: rds.Credentials.fromSecret(dbCredentials),
      backupRetention: Duration.days(7),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: false, // Allow deletion for testing
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      enablePerformanceInsights: false, // Disabled for t3.small - not supported
      // performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT, // Commented out since PI is disabled
      monitoringInterval: Duration.minutes(1),
      monitoringRole: new iam.Role(this, 'RdsMonitoringRole', {
        assumedBy: new iam.ServicePrincipal('monitoring.rds.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonRDSEnhancedMonitoringRole'
          ),
        ],
      }),
    });

    dbCredentials.grantRead(ec2Role);

    // ==========================================
    // TLS CERTIFICATE FOR HTTPS (OPTIONAL)
    // ==========================================
    let certificate: certificatemanager.ICertificate | undefined;

    if (config.domainName !== 'example.com') {
      // Create ACM certificate for real domains only
      certificate = new certificatemanager.Certificate(this, 'Certificate', {
        domainName: config.domainName,
        subjectAlternativeNames: [`*.${config.domainName}`],
        validation: certificatemanager.CertificateValidation.fromDns(),
      });
    }
    // For example.com domain, we'll skip HTTPS and only use HTTP

    // ==========================================
    // LAUNCH TEMPLATE FOR EC2 INSTANCES
    // ==========================================
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y httpd mysql',
      'systemctl start httpd',
      'systemctl enable httpd',

      // Install CloudWatch agent
      'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm',
      'rpm -U ./amazon-cloudwatch-agent.rpm',

      // Create a simple web page with instance metadata
      'INSTANCE_ID=$(ec2-metadata --instance-id | cut -d " " -f 2)',
      'AZ=$(ec2-metadata --availability-zone | cut -d " " -f 2)',
      'echo "<h1>Healthy Instance: $INSTANCE_ID</h1>" > /var/www/html/index.html',
      `echo "<h2>Region: ${region}</h2>" >> /var/www/html/index.html`,
      'echo "<h2>Availability Zone: $AZ</h2>" >> /var/www/html/index.html',
      `echo "<h3>Environment: ${config.environmentSuffix}</h3>" >> /var/www/html/index.html`,

      // Create health check endpoint
      'echo "OK" > /var/www/html/health',

      // Test database connectivity using secrets manager
      `SECRET_ARN="${dbCredentials.secretArn}"`,
      `DB_ENDPOINT="${this.database.instanceEndpoint.hostname}"`,
      'SECRET_VALUE=$(aws secretsmanager get-secret-value --secret-id $SECRET_ARN --query SecretString --output text)',
      'DB_PASSWORD=$(echo $SECRET_VALUE | jq -r .password)',
      'DB_USER=$(echo $SECRET_VALUE | jq -r .username)',
      'mysql -h $DB_ENDPOINT -u $DB_USER -p$DB_PASSWORD -e "SELECT 1" > /var/www/html/db-status.txt 2>&1 || echo "DB Connection Failed" > /var/www/html/db-status.txt',

      // Set up log rotation to S3
      `echo "0 * * * * aws s3 cp /var/log/httpd/access_log s3://${this.logBucket.bucketName}/httpd/\${INSTANCE_ID}/access_log-$(date +%Y%m%d-%H) --sse aws:kms --sse-kms-key-id ${s3KmsKey.keyArn}" | crontab -`
    );

    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      launchTemplateName: `prod-lt-web-${config.environmentSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      userData,
      role: ec2Role,
      securityGroup: ec2SecurityGroup,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            encrypted: true,
            // Use default AWS managed key for EBS encryption (no kmsKey specified)
            deleteOnTermination: true,
          }),
        },
      ],
      requireImdsv2: true,
    });

    // ==========================================
    // APPLICATION LOAD BALANCER
    // ==========================================
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      loadBalancerName: `prod-alb-web-${config.environmentSuffix}`,
      vpc: this.vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Enable cross-zone load balancing
    const cfnAlb = this.alb.node.defaultChild as elbv2.CfnLoadBalancer;
    cfnAlb.loadBalancerAttributes = [
      {
        key: 'load_balancing.cross_zone.enabled',
        value: 'true',
      },
    ];

    // Target Group with health checks
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      targetGroupName: `prod-tg-web-${config.environmentSuffix}`,
      vpc: this.vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.INSTANCE,
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: elbv2.Protocol.HTTP,
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        timeout: Duration.seconds(5),
        interval: Duration.seconds(30),
        healthyHttpCodes: '200',
      },
      stickinessCookieDuration: Duration.hours(1),
      stickinessCookieName: 'SESSIONID', // Custom cookie name for session persistence
    });

    // HTTP Listener
    if (certificate) {
      // If we have a certificate, redirect HTTP to HTTPS
      this.alb.addListener('HttpListener', {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        defaultAction: elbv2.ListenerAction.redirect({
          protocol: 'HTTPS',
          port: '443',
          permanent: true,
        }),
      });

      // HTTPS Listener
      this.alb.addListener('HttpsListener', {
        port: 443,
        protocol: elbv2.ApplicationProtocol.HTTPS,
        certificates: [certificate],
        defaultTargetGroups: [targetGroup],
      });
    } else {
      // If no certificate, serve directly on HTTP
      this.alb.addListener('HttpListener', {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        defaultTargetGroups: [targetGroup],
      });
    }

    // ==========================================
    // AUTO SCALING GROUP
    // ==========================================
    this.asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
      autoScalingGroupName: `prod-asg-web-${config.environmentSuffix}`,
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      launchTemplate,
      minCapacity: 2,
      maxCapacity: 10,
      desiredCapacity: 2,
      healthCheck: autoscaling.HealthCheck.elb({
        grace: Duration.minutes(5),
      }),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
        maxBatchSize: 1,
        minInstancesInService: 1,
        pauseTime: Duration.minutes(5),
        waitOnResourceSignals: false,
      }),
      cooldown: Duration.seconds(300),
    });

    this.asg.attachToApplicationTargetGroup(targetGroup);

    // CPU-based scaling policies
    this.asg.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      cooldown: Duration.seconds(300),
    });

    // ==========================================
    // SNS TOPIC FOR ALARMS
    // ==========================================
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `prod-sns-alarms-${config.environmentSuffix}`,
      displayName: 'Production Infrastructure Alarms',
    });

    if (config.alertEmail !== 'alerts@example.com') {
      alarmTopic.addSubscription(
        new snsSubscriptions.EmailSubscription(config.alertEmail)
      );
    }

    // ==========================================
    // CLOUDWATCH ALARMS
    // ==========================================
    const ec2HighCpuAlarm = new cloudwatch.Alarm(this, 'Ec2HighCpuAlarm', {
      alarmName: `prod-alarm-ec2-cpu-high-${config.environmentSuffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: this.asg.autoScalingGroupName,
        },
        statistic: 'Average',
      }),
      threshold: 70,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'EC2 instances high CPU utilization',
    });
    ec2HighCpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    const rdsHighCpuAlarm = new cloudwatch.Alarm(this, 'RdsHighCpuAlarm', {
      alarmName: `prod-alarm-rds-cpu-high-${config.environmentSuffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          DBInstanceIdentifier: this.database.instanceIdentifier,
        },
        statistic: 'Average',
      }),
      threshold: 75,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'RDS instance high CPU utilization',
    });
    rdsHighCpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

    const albUnhealthyAlarm = new cloudwatch.Alarm(this, 'AlbUnhealthyAlarm', {
      alarmName: `prod-alarm-alb-unhealthy-${config.environmentSuffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'UnHealthyHostCount',
        dimensionsMap: {
          TargetGroup: targetGroup.targetGroupFullName,
          LoadBalancer: this.alb.loadBalancerFullName,
        },
        statistic: 'Maximum',
      }),
      threshold: 1,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'ALB has unhealthy target hosts',
    });
    albUnhealthyAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alarmTopic)
    );

    // ==========================================
    // CLOUDWATCH DASHBOARD
    // ==========================================
    const dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `prod-dashboard-${config.environmentSuffix}-${region}`,
      defaultInterval: Duration.hours(1),
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'EC2 CPU Utilization',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/EC2',
            metricName: 'CPUUtilization',
            dimensionsMap: {
              AutoScalingGroupName: this.asg.autoScalingGroupName,
            },
            statistic: 'Average',
          }),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'ALB Request Count',
        left: [this.alb.metricRequestCount()],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'RDS CPU Utilization',
        left: [this.database.metricCPUUtilization()],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'ALB Target Response Time',
        left: [this.alb.metricTargetResponseTime()],
        width: 12,
      })
    );

    // ==========================================
    // ROUTE53 DNS SETUP (OPTIONAL)
    // ==========================================
    if (config.enableRoute53 && config.domainName !== 'example.com') {
      this.dns = new MultiRegionDns(this, 'MultiRegionDns', {
        environmentSuffix: config.environmentSuffix,
        primaryRegion: config.primaryRegion,
        domainName: config.domainName,
        applicationSubdomain: config.applicationSubdomain,
        primaryAlb: this.alb,
        createHostedZone: config.createHostedZone,
      });
    }

    // ==========================================
    // STACK OUTPUTS
    // ==========================================
    const stack = cdk.Stack.of(this);

    new cdk.CfnOutput(stack, `VpcId${config.environmentSuffix}`, {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `TapStack${config.environmentSuffix}-vpc-id`,
    });

    new cdk.CfnOutput(stack, `PublicSubnetIds${config.environmentSuffix}`, {
      value: this.vpc.publicSubnets.map(s => s.subnetId).join(','),
      description: 'Public subnet IDs',
      exportName: `TapStack${config.environmentSuffix}-public-subnet-ids`,
    });

    new cdk.CfnOutput(stack, `PrivateSubnetIds${config.environmentSuffix}`, {
      value: this.vpc.privateSubnets.map(s => s.subnetId).join(','),
      description: 'Private subnet IDs',
      exportName: `TapStack${config.environmentSuffix}-private-subnet-ids`,
    });

    new cdk.CfnOutput(stack, `AlbDnsName${config.environmentSuffix}`, {
      value: this.alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
      exportName: `TapStack${config.environmentSuffix}-alb-dns`,
    });

    new cdk.CfnOutput(stack, `AsgName${config.environmentSuffix}`, {
      value: this.asg.autoScalingGroupName,
      description: 'Auto Scaling Group name',
      exportName: `TapStack${config.environmentSuffix}-asg-name`,
    });

    new cdk.CfnOutput(stack, `RdsEndpoint${config.environmentSuffix}`, {
      value: this.database.dbInstanceEndpointAddress,
      description: 'RDS instance endpoint',
      exportName: `TapStack${config.environmentSuffix}-rds-endpoint`,
    });

    new cdk.CfnOutput(stack, `RdsPort${config.environmentSuffix}`, {
      value: this.database.dbInstanceEndpointPort,
      description: 'RDS instance port',
      exportName: `TapStack${config.environmentSuffix}-rds-port`,
    });

    new cdk.CfnOutput(stack, `LogBucketName${config.environmentSuffix}`, {
      value: this.logBucket.bucketName,
      description: 'S3 log bucket name',
      exportName: `TapStack${config.environmentSuffix}-log-bucket`,
    });

    new cdk.CfnOutput(stack, `RdsKmsKeyArn${config.environmentSuffix}`, {
      value: rdsKmsKey.keyArn,
      description: 'RDS KMS key ARN',
      exportName: `TapStack${config.environmentSuffix}-rds-kms-key`,
    });

    new cdk.CfnOutput(stack, `S3KmsKeyArn${config.environmentSuffix}`, {
      value: s3KmsKey.keyArn,
      description: 'S3 KMS key ARN',
      exportName: `TapStack${config.environmentSuffix}-s3-kms-key`,
    });

    new cdk.CfnOutput(stack, `SnsTopicArn${config.environmentSuffix}`, {
      value: alarmTopic.topicArn,
      description: 'SNS topic ARN for alarms',
      exportName: `TapStack${config.environmentSuffix}-sns-topic`,
    });

    new cdk.CfnOutput(
      stack,
      `DbCredentialsSecretArn${config.environmentSuffix}`,
      {
        value: dbCredentials.secretArn,
        description: 'Secrets Manager secret ARN for DB credentials',
        exportName: `TapStack${config.environmentSuffix}-db-secret`,
      }
    );

    new cdk.CfnOutput(
      stack,
      `LogProcessorLambdaArn${config.environmentSuffix}`,
      {
        value: logProcessor.functionArn,
        description: 'Log processor Lambda function ARN',
        exportName: `TapStack${config.environmentSuffix}-lambda-log-processor`,
      }
    );

    if (certificate) {
      new cdk.CfnOutput(stack, `CertificateArn${config.environmentSuffix}`, {
        value: certificate.certificateArn,
        description: 'TLS certificate ARN',
        exportName: `TapStack${config.environmentSuffix}-certificate-arn`,
      });
    }
  }
}
```

## multi-region-dns.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export interface MultiRegionDnsProps {
  environmentSuffix: string;
  primaryRegion: string;
  secondaryRegion?: string;
  domainName: string;
  applicationSubdomain?: string;
  primaryAlb: elbv2.ApplicationLoadBalancer;
  secondaryAlb?: elbv2.ApplicationLoadBalancer;
  createHostedZone?: boolean;
}

export class MultiRegionDns extends Construct {
  public readonly hostedZone?: route53.IHostedZone;
  public readonly healthCheck?: route53.CfnHealthCheck;

  constructor(scope: Construct, id: string, props: MultiRegionDnsProps) {
    super(scope, id);

    const region = cdk.Stack.of(this).region;
    const isPrimaryRegion = region === props.primaryRegion;
    const applicationDomain = props.applicationSubdomain
      ? `${props.applicationSubdomain}.${props.domainName}`
      : props.domainName;

    // Add iac-rlhf-amazon tag
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // Only create hosted zone if requested and in primary region
    if (props.createHostedZone && isPrimaryRegion) {
      this.hostedZone = new route53.HostedZone(this, 'HostedZone', {
        zoneName: props.domainName,
        comment: `Hosted zone for ${props.domainName} - Environment: ${props.environmentSuffix}`,
      });
    } else if (!props.createHostedZone) {
      // Try to lookup existing hosted zone
      try {
        this.hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
          domainName: props.domainName,
        });
      } catch (error) {
        // If lookup fails, create a placeholder output with instructions
        new cdk.CfnOutput(
          this,
          `Route53SetupInstructions${props.environmentSuffix}`,
          {
            value: `Please create a hosted zone for ${props.domainName} manually or set createHostedZone=true`,
            description: 'Route53 setup instructions',
          }
        );
        return;
      }
    }

    if (!this.hostedZone) {
      return;
    }

    // Create health check for the ALB
    this.healthCheck = new route53.CfnHealthCheck(this, 'HealthCheck', {
      healthCheckConfig: {
        type: 'HTTPS',
        fullyQualifiedDomainName: props.primaryAlb.loadBalancerDnsName,
        port: 443,
        resourcePath: '/health',
        requestInterval: 30,
        failureThreshold: 3,
      },
    });

    // Add tags separately as they might not be supported in the constructor
    cdk.Tags.of(this.healthCheck).add(
      'Name',
      `prod-healthcheck-${region}-${props.environmentSuffix}`
    );
    cdk.Tags.of(this.healthCheck).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.healthCheck).add('Environment', props.environmentSuffix);

    // Create DNS record with failover routing
    const dnsRecord = new route53.ARecord(this, 'DnsRecord', {
      zone: this.hostedZone,
      recordName: applicationDomain,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.LoadBalancerTarget(props.primaryAlb)
      ),
      ttl: cdk.Duration.seconds(60), // Low TTL for faster failover
      comment: `Failover record for ${applicationDomain} in ${region}`,
    });

    // Configure failover routing policy
    const cfnRecordSet = dnsRecord.node.defaultChild as route53.CfnRecordSet;
    cfnRecordSet.setIdentifier = `failover-${region}-${props.environmentSuffix}`;
    cfnRecordSet.failover = isPrimaryRegion ? 'PRIMARY' : 'SECONDARY';
    cfnRecordSet.healthCheckId = this.healthCheck.attrHealthCheckId;

    // Outputs
    const stack = cdk.Stack.of(this);

    new cdk.CfnOutput(stack, `HostedZoneId${props.environmentSuffix}`, {
      value: this.hostedZone.hostedZoneId,
      description: 'Route53 Hosted Zone ID',
      exportName: `TapStack${props.environmentSuffix}-hosted-zone-id`,
    });

    new cdk.CfnOutput(stack, `HealthCheckId${props.environmentSuffix}`, {
      value: this.healthCheck.attrHealthCheckId,
      description: 'Route53 Health Check ID',
      exportName: `TapStack${props.environmentSuffix}-health-check-id`,
    });

    new cdk.CfnOutput(stack, `ApplicationDomain${props.environmentSuffix}`, {
      value: applicationDomain,
      description: 'Application domain name',
      exportName: `TapStack${props.environmentSuffix}-application-domain`,
    });

    new cdk.CfnOutput(stack, `DnsRecordFqdn${props.environmentSuffix}`, {
      value: dnsRecord.domainName,
      description: 'DNS record FQDN',
      exportName: `TapStack${props.environmentSuffix}-dns-record-fqdn`,
    });
  }
}
```

## tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { FailureRecoveryInfrastructure } from './failure-recovery-infrastructure';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Add iac-rlhf-amazon tag to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this).add('Environment', environmentSuffix);

    // Instantiate the failure recovery infrastructure construct
    new FailureRecoveryInfrastructure(this, 'FailureRecoveryInfrastructure', {
      environmentSuffix: environmentSuffix,
      vpcCidr: this.node.tryGetContext('vpcCidr') || '10.0.0.0/16',
      domainName: this.node.tryGetContext('domainName') || 'example.com',
      alertEmail: this.node.tryGetContext('alertEmail') || 'alerts@example.com',
      adminCidr: this.node.tryGetContext('adminCidr') || '10.0.0.0/8',
      instanceType: this.node.tryGetContext('instanceType') || 't3.medium',
      dbInstanceType:
        this.node.tryGetContext('dbInstanceType') || 'db.t3.small',
      logRetentionDays: this.node.tryGetContext('logRetentionDays') || 30,
      enableRoute53: this.node.tryGetContext('enableRoute53') || false,
      createHostedZone: this.node.tryGetContext('createHostedZone') || false,
      primaryRegion: this.node.tryGetContext('primaryRegion') || 'us-east-1',
      applicationSubdomain:
        this.node.tryGetContext('applicationSubdomain') || 'app',
    });
  }
}
```

