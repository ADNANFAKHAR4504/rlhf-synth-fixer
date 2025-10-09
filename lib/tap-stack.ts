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
      CreatedAt: new Date().toISOString(),
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
    // Check if key pair exists, if not create it
    const keyPairName = `tap-${environmentSuffix}-keypair`;

    const keyPair = new aws.keyPair.KeyPair(this, 'key-pair', {
      keyName: keyPairName,
      publicKey:
        process.env.SSH_PUBLIC_KEY ||
        // Default public key - replace with your actual public key
        'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDxxx... your-public-key',
      tags: globalTags,
    });

    // ========== Storage (Create logs bucket first) ==========
    const logsBucket = new S3Module(this, 'logs-bucket', {
      bucketPrefix: 'tap-logs',
      versioning: true,
      encryption: true,
      accessLogging: false,
      tags: globalTags,
      lifecycleRules: [
        {
          id: 'expire-old-logs',
          status: 'Enabled',
          expiration: {
            days: 30,
          },
          noncurrentVersionExpiration: {
            noncurrent_days: 7,
          },
        },
      ],
    });

    // Enable ACL ownership for the logs bucket
    new aws.s3BucketOwnershipControls.S3BucketOwnershipControls(
      this,
      'logs-bucket-ownership',
      {
        bucket: logsBucket.bucket.id,
        rule: {
          objectOwnership: 'BucketOwnerPreferred',
        },
      }
    );

    // Add ACL configuration for logs bucket (after ownership controls)
    new aws.s3BucketAcl.S3BucketAcl(this, 'logs-bucket-acl', {
      bucket: logsBucket.bucket.id,
      acl: 'log-delivery-write',
      dependsOn: [logsBucket.bucket],
    });

    const assetsBucket = new S3Module(this, 'assets-bucket', {
      bucketPrefix: 'tap-assets',
      versioning: true,
      encryption: true,
      accessLogging: true,
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
      flowLogsBucket: logsBucket.bucketName,
    });

    // ========== Secrets Management ==========
    const secretsModule = new SecretsModule(this, 'secrets', {
      parameterPrefix: '/tap/app',
      tags: globalTags,
    });

    // ========== S3 Bucket Policy for ALB and CloudTrail Access Logs ==========
    const elbServiceAccountId =
      ELB_SERVICE_ACCOUNT_IDS[awsRegion] ||
      ELB_SERVICE_ACCOUNT_IDS['us-east-1'];

    new aws.s3BucketPolicy.S3BucketPolicy(this, 'logs-bucket-policy', {
      bucket: logsBucket.bucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'ALBAccessLogsPolicy',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${elbServiceAccountId}:root`,
            },
            Action: 's3:PutObject',
            Resource: `${logsBucket.bucket.arn}/alb-logs/*`,
          },
          {
            Sid: 'CloudTrailAccessLogsPolicy',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: ['s3:GetBucketAcl', 's3:PutObject'],
            Resource: [logsBucket.bucket.arn, `${logsBucket.bucket.arn}/*`],
            Condition: {
              StringEquals: {
                's3:x-amz-acl': 'bucket-owner-full-control',
              },
            },
          },
          {
            Sid: 'CloudTrailBucketCheck',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:GetBucketAcl',
            Resource: logsBucket.bucket.arn,
          },
        ],
      }),
      dependsOn: [logsBucket.bucket],
    });

    // ========== Load Balancer ==========
    const elbModule = new ElbModule(this, 'elb', {
      vpcId: vpcModule.vpc.id,
      publicSubnetIds: vpcModule.publicSubnets.map(s => s.id),
      targetGroupPort: 80,
      healthCheckPath: '/health.html',
      tags: globalTags,
      accessLogsBucket: logsBucket.bucketName,
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
      keyName: keyPair.keyName,
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
      masterPasswordParameterName:
        secretsModule.getParameterName('db-password'),
      databaseName: 'tapdb',
      allowedSecurityGroupIds: [ec2Module.securityGroup.id],
    });

    // ========== CDN ==========
    const cloudFrontModule = new CloudFrontModule(this, 'cdn', {
      s3BucketDomainName: assetsBucket.bucket.bucketRegionalDomainName,
      s3BucketId: assetsBucket.bucket.id,
      tags: globalTags,
      logBucket: logsBucket.bucketName,
    });

    // ========== Audit and Compliance ==========
    const cloudTrailModule = new CloudTrailModule(this, 'audit', {
      s3BucketName: logsBucket.bucketName,
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

    // ========== Additional Security Configurations ==========

    // WAF for CloudFront (only create in us-east-1)
    if (awsRegion === 'us-east-1') {
      new aws.wafv2WebAcl.Wafv2WebAcl(this, 'waf-web-acl', {
        name: 'tap-waf-acl',
        scope: 'CLOUDFRONT',
        defaultAction: {
          allow: {},
        },
        rule: [
          {
            name: 'RateLimitRule',
            priority: 1,
            action: {
              block: {},
            },
            statement: {
              rateBasedStatement: {
                limit: 2000,
                aggregateKeyType: 'IP',
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'RateLimitRule',
              sampledRequestsEnabled: true,
            },
          },
        ],
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: 'tap-waf-metric',
          sampledRequestsEnabled: true,
        },
        tags: globalTags,
      });
    }

    // AWS Config Role (with correct policy)
    const configRole = new aws.iamRole.IamRole(this, 'config-role', {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'config.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: globalTags,
    });

    // Attach AWS Config policy using the correct policy ARN
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'config-role-policy',
      {
        role: configRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',
      }
    );

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
      value: logsBucket.bucketName,
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

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(s => s.id),
      description: 'Private Subnet IDs',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(s => s.id),
      description: 'Public Subnet IDs',
    });

    new TerraformOutput(this, 'nat-gateway-ips', {
      value: vpcModule.natGateways.map(n => n.publicIp),
      description: 'NAT Gateway Elastic IPs',
    });

    new TerraformOutput(this, 'ssm-parameter-prefix', {
      value: '/tap/app',
      description: 'SSM Parameter Store Prefix for Application Secrets',
    });

    new TerraformOutput(this, 'key-pair-name', {
      value: keyPair.keyName,
      description: 'EC2 Key Pair Name',
    });
  }
}
