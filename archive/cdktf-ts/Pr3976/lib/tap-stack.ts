import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import * as aws from '@cdktf/provider-aws';
import {
  CloudFrontModule,
  CloudTrailModule,
  Ec2Module,
  ElbModule,
  MonitoringModule,
  RdsModule,
  S3Module,
  SecretsModule,
  VpcModule,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// ELB service account IDs for different regions
const ELB_SERVICE_ACCOUNT_IDS: { [key: string]: string } = {
  'us-east-1': '127311923021',
  'us-east-2': '033677994240',
  'us-west-1': '027434742980',
  'us-west-2': '797873946194',
  'af-south-1': '098369216593',
  'ap-east-1': '754344448648',
  'ap-south-1': '718504428378',
  'ap-northeast-2': '600734575887',
  'ap-southeast-1': '114774131450',
  'ap-southeast-2': '783225319266',
  'ap-northeast-1': '582318560864',
  'ca-central-1': '985666609251',
  'eu-central-1': '054676820928',
  'eu-west-1': '156460612806',
  'eu-west-2': '652711504416',
  'eu-south-1': '635631232127',
  'eu-west-3': '009996457667',
  'eu-north-1': '897822967062',
  'me-south-1': '076674570225',
  'sa-east-1': '507241528517',
};

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = props?.awsRegion || 'eu-north-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const availabilityZones = [`${awsRegion}a`, `${awsRegion}b`];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Environment: 'Production',
            Owner: 'DevOps',
            Security: 'Enforced',
            ManagedBy: 'CDKTF',
            Project: 'TAP',
          },
        },
      ],
    });

    // Global Tags
    const globalTags = {
      Environment: 'Production',
      Owner: 'DevOps',
      Security: 'Enforced',
      ManagedBy: 'CDKTF',
      Project: 'TAP',
    };

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    const adminEmail = 'admin@tap.com'; // Replace with your email

    // ========== Create or Get Key Pair ==========
    // FIXED: Use a valid SSH public key format
    const keyPairName = `tap-${environmentSuffix}-keypair`;

    // Generate a valid SSH public key or use an existing one
    // This is a dummy key - replace with your actual public key
    const validSshPublicKey =
      process.env.SSH_PUBLIC_KEY ||
      'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCcJ4MAs1bEJ1KM0exmMSmjdpbQqQ4oWTi0qtcefl3jCL3RsGXErxTZZw6MwP0YZj1qQIbZjA7VsjR5CqiQr2qsZOFRlsqNZGEJlH4TAsVJINEYSLDWQa+7iS5gqY7f5Y2mW+R3glqRP87jhZNeFOkRS5vqCss9Bo3pNAFVYWkuM2s3qWZYyDVYTt4B0GPRE+i9l5Acr3JuaN40vXR5A0fs3T8IC/4Ft1SueHs7nu7TeMdXW72DE6Rj7gkb6BEQE6Q3ewc+0tZXS88pq7MzMNbuGkhaLnCslDSMNVBmH9pY2camOavjVZ0Fqc9xsFVIWlrnVNqnGZCVDIxqM6HDFZXX test@example.com';

    // Only create key pair if a valid key is provided
    let keyPair;
    if (
      validSshPublicKey &&
      validSshPublicKey !== 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC7W8...'
    ) {
      keyPair = new aws.keyPair.KeyPair(this, 'key-pair', {
        keyName: keyPairName,
        publicKey: validSshPublicKey,
        tags: globalTags,
      });
    }

    // ========== Storage (Create logs bucket first) ==========
    // FIXED: Create bucket without ACL initially
    const logsBucket = new aws.s3Bucket.S3Bucket(this, 'logs-bucket', {
      bucket: 'tap-logs-655',
      tags: globalTags,
    });

    // FIXED: Set ownership controls first
    const logsBucketOwnership =
      new aws.s3BucketOwnershipControls.S3BucketOwnershipControls(
        this,
        'logs-bucket-ownership',
        {
          bucket: logsBucket.id,
          rule: {
            objectOwnership: 'BucketOwnerPreferred',
          },
        }
      );

    // FIXED: Then set ACL after ownership controls
    new aws.s3BucketAcl.S3BucketAcl(this, 'logs-bucket-acl', {
      bucket: logsBucket.id,
      acl: 'log-delivery-write',
      dependsOn: [logsBucketOwnership],
    });

    // FIXED: Configure bucket versioning
    new aws.s3BucketVersioning.S3BucketVersioningA(this, 'logs-versioning', {
      bucket: logsBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // FIXED: Configure bucket encryption
    new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this,
      'logs-encryption',
      {
        bucket: logsBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    const logsBucketAclForCloudFront = new aws.s3BucketAcl.S3BucketAcl(
      this,
      'logs-bucket-acl-cloudfront',
      {
        bucket: logsBucket.id,
        accessControlPolicy: {
          grant: [
            {
              grantee: {
                // This is the CloudFront log delivery account for all regions
                id: 'c4c1ede66af53448b93c283ce9448c4ba468c9432aa01d700d3878632f77d2d0',
                type: 'CanonicalUser',
              },
              permission: 'FULL_CONTROL',
            },
            {
              grantee: {
                // Bucket owner
                type: 'CanonicalUser',
                id: new aws.dataAwsCanonicalUserId.DataAwsCanonicalUserId(
                  this,
                  'current-user-id',
                  {}
                ).id,
              },
              permission: 'FULL_CONTROL',
            },
          ],
          owner: {
            id: new aws.dataAwsCanonicalUserId.DataAwsCanonicalUserId(
              this,
              'owner-id',
              {}
            ).id,
          },
        },
        dependsOn: [logsBucketOwnership],
      }
    );

    // Assets bucket
    const assetsBucket = new S3Module(this, 'assets-bucket', {
      bucketPrefix: 'tap-assets',
      versioning: true,
      encryption: true,
      accessLogging: false, // Disable to avoid circular dependency
      tags: globalTags,
      lifecycleRules: [
        {
          id: 'manage-old-assets',
          status: 'Enabled',
          transition: [
            {
              days: 30,
              storageClass: 'STANDARD_IA',
            },
            {
              days: 90,
              storageClass: 'GLACIER',
            },
          ],
          expiration: {
            days: 365,
          },
        },
      ],
    });

    // ========== Networking ==========
    const vpcModule = new VpcModule(this, 'vpc', {
      vpcCidr: '10.0.0.0/16',
      availabilityZones: availabilityZones,
      tags: globalTags,
      enableFlowLogs: true,
      flowLogsBucket: logsBucket.bucket,
    });

    // ========== Secrets Management ==========
    new SecretsModule(this, 'secrets', {
      parameterPrefix: '/tap/app',
      tags: globalTags,
    });

    // ========== FIXED: S3 Bucket Policy for ALB, CloudTrail, VPC Flow Logs, and CloudFront ==========
    const elbServiceAccountId =
      ELB_SERVICE_ACCOUNT_IDS[awsRegion] ||
      ELB_SERVICE_ACCOUNT_IDS['us-east-1'];

    const accountId = new aws.dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'current'
    ).accountId;

    new aws.s3BucketPolicy.S3BucketPolicy(this, 'logs-bucket-policy', {
      bucket: logsBucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          // ALB Access Logs
          {
            Sid: 'ALBAccessLogsPolicy',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${elbServiceAccountId}:root`,
            },
            Action: 's3:PutObject',
            Resource: `${logsBucket.arn}/alb-logs/*`,
          },
          // CloudTrail - Get Bucket ACL
          {
            Sid: 'CloudTrailBucketAcl',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: ['s3:GetBucketAcl', 's3:ListBucket'],
            Resource: logsBucket.arn,
            Condition: {
              StringEquals: {
                'aws:SourceAccount': accountId,
              },
            },
          },
          // CloudTrail - Write logs
          {
            Sid: 'CloudTrailWrite',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:PutObject',
            Resource: `${logsBucket.arn}/cloudtrail/AWSLogs/${accountId}/*`,
            Condition: {
              StringEquals: {
                's3:x-amz-acl': 'bucket-owner-full-control',
              },
            },
          },
          // VPC Flow Logs
          {
            Sid: 'VPCFlowLogsPolicy',
            Effect: 'Allow',
            Principal: {
              Service: 'delivery.logs.amazonaws.com',
            },
            Action: 's3:PutObject',
            Resource: `${logsBucket.arn}/vpc-flow-logs/AWSLogs/${accountId}/*`,
            Condition: {
              StringEquals: {
                's3:x-amz-acl': 'bucket-owner-full-control',
                'aws:SourceAccount': accountId,
              },
            },
          },
          {
            Sid: 'VPCFlowLogsAcl',
            Effect: 'Allow',
            Principal: {
              Service: 'delivery.logs.amazonaws.com',
            },
            Action: ['s3:GetBucketAcl', 's3:ListBucket'],
            Resource: logsBucket.arn,
            Condition: {
              StringEquals: {
                'aws:SourceAccount': accountId,
              },
            },
          },
          // CloudFront Access Logs
          {
            Sid: 'CloudFrontLogDelivery',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudfront.amazonaws.com',
            },
            Action: ['s3:PutObject'],
            Resource: `${logsBucket.arn}/cloudfront-logs/*`,
            Condition: {
              StringEquals: {
                's3:x-amz-acl': 'bucket-owner-full-control',
              },
            },
          },
        ],
      }),
      dependsOn: [logsBucketAclForCloudFront], // Update dependency
    });

    // ========== Load Balancer ==========
    const elbModule = new ElbModule(this, 'elb', {
      vpcId: vpcModule.vpc.id,
      publicSubnetIds: vpcModule.publicSubnets.map(s => s.id),
      targetGroupPort: 80,
      healthCheckPath: '/health.html',
      tags: globalTags,
      accessLogsBucket: logsBucket.bucket,
    });

    // ========== Compute ==========
    const ec2Module = new Ec2Module(this, 'ec2', {
      vpcId: vpcModule.vpc.id,
      privateSubnetIds: vpcModule.privateSubnets.map(s => s.id),
      albSecurityGroupId: elbModule.securityGroup.id,
      instanceType: 't3.medium',
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 3,
      tags: globalTags,
      ssmParameterPrefix: '/tap/app',
      keyName: keyPair?.keyName, // Optional key name
    });

    // Attach ASG to Target Group
    new aws.autoscalingAttachment.AutoscalingAttachment(
      this,
      'asg-tg-attachment',
      {
        autoscalingGroupName: ec2Module.autoScalingGroup.name,
        lbTargetGroupArn: elbModule.targetGroup.arn,
      }
    );

    // Auto Scaling Policies
    const scaleUpPolicy = new aws.autoscalingPolicy.AutoscalingPolicy(
      this,
      'scale-up-policy',
      {
        name: 'tap-scale-up',
        scalingAdjustment: 2,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: ec2Module.autoScalingGroup.name,
      }
    );

    const scaleDownPolicy = new aws.autoscalingPolicy.AutoscalingPolicy(
      this,
      'scale-down-policy',
      {
        name: 'tap-scale-down',
        scalingAdjustment: -1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: ec2Module.autoScalingGroup.name,
      }
    );

    // CloudWatch Alarms for Auto Scaling
    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'cpu-high-alarm',
      {
        alarmName: 'tap-cpu-high',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 120,
        statistic: 'Average',
        threshold: 70,
        alarmDescription: 'Scale up when CPU exceeds 70%',
        alarmActions: [scaleUpPolicy.arn],
        dimensions: {
          AutoScalingGroupName: ec2Module.autoScalingGroup.name,
        },
      }
    );

    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, 'cpu-low-alarm', {
      alarmName: 'tap-cpu-low',
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 120,
      statistic: 'Average',
      threshold: 30,
      alarmDescription: 'Scale down when CPU is below 30%',
      alarmActions: [scaleDownPolicy.arn],
      dimensions: {
        AutoScalingGroupName: ec2Module.autoScalingGroup.name,
      },
    });

    // ========== Database ==========
    const rdsModule = new RdsModule(this, 'rds', {
      vpcId: vpcModule.vpc.id,
      privateSubnetIds: vpcModule.privateSubnets.map(s => s.id),
      engine: 'mysql',
      instanceClass: 'db.t3.medium',
      allocatedStorage: 100,
      storageEncrypted: true,
      backupRetentionPeriod: 7,
      multiAz: true,
      tags: globalTags,
      masterUsername: process.env.DB_MASTER_USERNAME || 'adminuser',
      databaseName: 'tapdb',
      allowedSecurityGroupIds: [ec2Module.securityGroup.id],
    });

    // ========== CDN ==========
    const cloudFrontModule = new CloudFrontModule(this, 'cdn', {
      s3BucketDomainName: assetsBucket.bucket.bucketRegionalDomainName,
      s3BucketId: assetsBucket.bucket.id,
      tags: globalTags,
      logBucket: logsBucket.bucket,
    });

    // ========== Audit and Compliance ==========
    const cloudTrailModule = new CloudTrailModule(this, 'audit', {
      s3BucketName: logsBucket.bucket,
      tags: globalTags,
    });

    // ========== Monitoring ==========
    const monitoringModule = new MonitoringModule(this, 'monitoring', {
      albArn: elbModule.alb.arn,
      asgName: ec2Module.autoScalingGroup.name,
      dbInstanceId: rdsModule.dbInstance.id,
      tags: globalTags,
      snsEmailEndpoint: adminEmail,
    });

    // ========== Terraform Outputs ==========
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: elbModule.alb.dnsName,
      description: 'Application Load Balancer DNS Name',
    });

    new TerraformOutput(this, 'alb-url', {
      value: `http://${elbModule.alb.dnsName}`,
      description: 'Application Load Balancer URL',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS Database Endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'rds-database-name', {
      value: rdsModule.dbInstance.dbName,
      description: 'RDS Database Name',
    });

    new TerraformOutput(this, 'cloudfront-distribution-id', {
      value: cloudFrontModule.distribution.id,
      description: 'CloudFront Distribution ID',
    });

    new TerraformOutput(this, 'cloudfront-domain-name', {
      value: cloudFrontModule.distribution.domainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new TerraformOutput(this, 'cdn-url', {
      value: `https://${cloudFrontModule.distribution.domainName}`,
      description: 'CDN URL',
    });

    new TerraformOutput(this, 's3-logs-bucket', {
      value: logsBucket.bucket,
      description: 'S3 Logs Bucket Name',
    });

    new TerraformOutput(this, 's3-assets-bucket', {
      value: assetsBucket.bucketName,
      description: 'S3 Assets Bucket Name',
    });

    new TerraformOutput(this, 'cloudtrail-name', {
      value: cloudTrailModule.trail.name,
      description: 'CloudTrail Name',
    });

    new TerraformOutput(this, 'ec2-instance-role-arn', {
      value: ec2Module.instanceRole.arn,
      description: 'EC2 Instance IAM Role ARN',
    });

    new TerraformOutput(this, 'asg-name', {
      value: ec2Module.autoScalingGroup.name,
      description: 'Auto Scaling Group Name',
    });

    new TerraformOutput(this, 'monitoring-dashboard-url', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${awsRegion}#dashboards:name=${monitoringModule.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    new TerraformOutput(this, 'key-pair-name', {
      value: keyPair?.keyName || 'No key pair configured',
      description: 'EC2 Key Pair Name',
    });
  }
}
