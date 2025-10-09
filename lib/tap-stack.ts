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
  Route53Module,
  S3Module,
  SecretsModule,
  VpcModule,
} from './modules';
// import { MyStack } from './my-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const availabilityZones = [`${awsRegion}a`, `${awsRegion}b`];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
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
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // ? Add your stack instantiations here
    // Domain configuration
    const domainName = 'tapts.com'; // Replace with your domain
    const adminEmail = 'admin@tapts.com'; // Replace with your email

    // ========== Storage (Create logs bucket first) ==========
    const logsBucket = new S3Module(this, 'logs-bucket', {
      bucketPrefix: 'tap-logs',
      versioning: true,
      encryption: true,
      accessLogging: false, // Avoid circular dependency
      tags: globalTags,
      lifecycleRules: [
        {
          id: 'expire-old-logs',
          status: 'Enabled',
        },
      ],
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

    // ========== DNS and SSL ==========
    const route53Module = new Route53Module(this, 'dns', {
      domainName: domainName,
      tags: globalTags,
    });

    // ========== Load Balancer ==========
    const elbModule = new ElbModule(this, 'elb', {
      vpcId: vpcModule.vpc.id,
      publicSubnetIds: vpcModule.publicSubnets.map(s => s.id),
      certificateArn: route53Module.certificate.arn,
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
      keyName: 'tap-keypair', // Create this keypair in AWS console or via CDKTF
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
      certificateArn: route53Module.certificate.arn,
      domainNames: [domainName, `www.${domainName}`],
      tags: globalTags,
      logBucket: logsBucket.bucketName,
    });

    // ========== Update Route53 Records ==========
    new aws.route53Record.Route53Record(this, 'api-record', {
      zoneId: route53Module.hostedZone.zoneId,
      name: `api.${domainName}`,
      type: 'A',
      alias: {
        name: elbModule.alb.dnsName,
        zoneId: elbModule.alb.zoneId,
        evaluateTargetHealth: true,
      },
    });

    new aws.route53Record.Route53Record(this, 'cdn-record', {
      zoneId: route53Module.hostedZone.zoneId,
      name: domainName,
      type: 'A',
      alias: {
        name: cloudFrontModule.distribution.domainName,
        zoneId: 'Z2FDTNDATAQYW2', // CloudFront's hosted zone ID
        evaluateTargetHealth: false,
      },
    });

    new aws.route53Record.Route53Record(this, 'cdn-www-record', {
      zoneId: route53Module.hostedZone.zoneId,
      name: `www.${domainName}`,
      type: 'A',
      alias: {
        name: cloudFrontModule.distribution.domainName,
        zoneId: 'Z2FDTNDATAQYW2',
        evaluateTargetHealth: false,
      },
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

    // WAF for CloudFront
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

    // AWS Config Rules for Compliance (without Config Recorder)
    new aws.iamRole.IamRole(this, 'config-role', {
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
      managedPolicyArns: ['arn:aws:iam::aws:policy/service-role/ConfigRole'],
      tags: globalTags,
    });

    // S3 Bucket Policy for ALB Access Logs
    const elbAccountId = process.env.CURRENT_ACCOUNT_ID

    new aws.s3BucketPolicy.S3BucketPolicy(this, 'alb-logs-bucket-policy', {
      bucket: logsBucket.bucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'ALBAccessLogsPolicy',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${elbAccountId}:root`,
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
          },
        ],
      }),
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
      value: `https://api.${domainName}`,
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
      value: `https://${domainName}`,
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

    new TerraformOutput(this, 'route53-hosted-zone-id', {
      value: route53Module.hostedZone.zoneId,
      description: 'Route 53 Hosted Zone ID',
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
      value: `https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${monitoringModule.dashboard.dashboardName}`,
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

    new TerraformOutput(this, 'acm-certificate-arn', {
      value: route53Module.certificate.arn,
      description: 'ACM Certificate ARN',
    });

    new TerraformOutput(this, 'ssm-parameter-prefix', {
      value: '/tap/app',
      description: 'SSM Parameter Store Prefix for Application Secrets',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
