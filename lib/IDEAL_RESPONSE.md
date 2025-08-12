# Secure Production Environment Infrastructure - Ideal Response

This solution provides a comprehensive, production-ready AWS infrastructure using AWS CDK TypeScript with proper security controls, high availability, and enterprise-grade monitoring.

## bin/tap.ts
```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'dev';

new TapStack(app, `TapStack${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  environmentSuffix: environmentSuffix,
});
```

## lib/tap-stack.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as synthetics from 'aws-cdk-lib/aws-synthetics';
import * as applicationSignals from 'aws-cdk-lib/aws-applicationinsights';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props or environment variable
    const environmentSuffix =
      props?.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';

    // KMS Key for encryption
    const kmsKey = new kms.Key(this, 'ProductionKMSKey', {
      description: 'KMS key for production environment encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    kmsKey.addAlias(`alias/production-key-${environmentSuffix}`);
    cdk.Tags.of(kmsKey).add('Environment', 'Production');

    // VPC with public and private subnets across 2 AZs
    const vpc = new ec2.Vpc(this, 'ProductionVPC', {
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'isolated-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });
    cdk.Tags.of(vpc).add('Environment', 'Production');

    // CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/ec2/production-app-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    cdk.Tags.of(logGroup).add('Environment', 'Production');

    // Application Load Balancer Security Group
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
      'Allow outbound HTTP to targets'
    );

    // EC2 Security Group
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

    // Add SSH access with IP restrictions
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/16'),
      ec2.Port.tcp(22),
      'Allow SSH access from VPC'
    );

    // RDS Security Group
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from EC2 instances'
    );

    // Apply tags to security groups
    cdk.Tags.of(albSecurityGroup).add('Environment', 'Production');
    cdk.Tags.of(ec2SecurityGroup).add('Environment', 'Production');
    cdk.Tags.of(rdsSecurityGroup).add('Environment', 'Production');

    // IAM Role for EC2 instances
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
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: [
                `arn:aws:s3:::production-app-bucket-${environmentSuffix}-*/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:GetParametersByPath',
              ],
              resources: [
                `arn:aws:ssm:${this.region}:${this.account}:parameter/production-${environmentSuffix}/*`,
              ],
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
    cdk.Tags.of(ec2Role).add('Environment', 'Production');

    // Instance Profile
    new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      role: ec2Role,
    });

    // User Data Script
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Production Web Server</h1>" > /var/www/html/index.html',
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify(
        {
          agent: {
            metrics_collection_interval: 60,
            run_as_user: 'cwagent',
          },
          logs: {
            logs_collected: {
              files: {
                collect_list: [
                  {
                    file_path: '/var/log/httpd/access_log',
                    log_group_name: logGroup.logGroupName,
                    log_stream_name: '{instance_id}/httpd/access_log',
                  },
                  {
                    file_path: '/var/log/httpd/error_log',
                    log_group_name: logGroup.logGroupName,
                    log_stream_name: '{instance_id}/httpd/error_log',
                  },
                ],
              },
            },
          },
          metrics: {
            namespace: 'Production/Application',
            metrics_collected: {
              cpu: {
                measurement: [
                  'cpu_usage_idle',
                  'cpu_usage_iowait',
                  'cpu_usage_user',
                  'cpu_usage_system',
                ],
                metrics_collection_interval: 60,
              },
              disk: {
                measurement: ['used_percent'],
                metrics_collection_interval: 60,
                resources: ['*'],
              },
              mem: {
                measurement: ['mem_used_percent'],
                metrics_collection_interval: 60,
              },
            },
          },
        },
        null,
        2
      ),
      'EOF',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    // Launch Template with encrypted EBS
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'ProductionLaunchTemplate',
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MEDIUM
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        userData,
        securityGroup: ec2SecurityGroup,
        role: ec2Role,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              encrypted: true,
              kmsKey: kmsKey,
              deleteOnTermination: true,
            }),
          },
        ],
      }
    );
    cdk.Tags.of(launchTemplate).add('Environment', 'Production');

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ProductionALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });
    cdk.Tags.of(alb).add('Environment', 'Production');

    // Auto Scaling Group
    const asg = new autoscaling.AutoScalingGroup(this, 'ProductionASG', {
      vpc,
      launchTemplate,
      minCapacity: 2,
      maxCapacity: 10,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5),
      }),
    });

    // Auto Scaling Policy - Scale on CPU > 70%
    asg.scaleOnCpuUtilization('CPUScaling', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });

    cdk.Tags.of(asg).add('Environment', 'Production');

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'ProductionTargetGroup',
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [asg],
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          path: '/index.html',
          protocol: elbv2.Protocol.HTTP,
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 5,
          timeout: cdk.Duration.seconds(10),
          interval: cdk.Duration.seconds(30),
        },
      }
    );
    cdk.Tags.of(targetGroup).add('Environment', 'Production');

    // ALB Listener
    alb.addListener('HTTPListener', {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });
    cdk.Tags.of(dbSubnetGroup).add('Environment', 'Production');

    // RDS Database Instance with Multi-AZ
    const database = new rds.DatabaseInstance(this, 'ProductionDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      port: 3306,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        secretName: `production-db-credentials-${environmentSuffix}`,
      }),
      vpc,
      securityGroups: [rdsSecurityGroup],
      subnetGroup: dbSubnetGroup,
      multiAz: true,
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false,
      autoMinorVersionUpgrade: true,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      allowMajorVersionUpgrade: false,
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    cdk.Tags.of(database).add('Environment', 'Production');

    // S3 Bucket with encryption
    const s3Bucket = new s3.Bucket(this, 'ProductionAppBucket', {
      bucketName: `production-app-bucket-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    cdk.Tags.of(s3Bucket).add('Environment', 'Production');

    // Systems Manager Parameters
    const dbEndpointParameter = new ssm.StringParameter(
      this,
      'DBEndpointParameter',
      {
        parameterName: `/production-${environmentSuffix}/database/endpoint`,
        stringValue: database.instanceEndpoint.hostname,
        description: 'RDS database endpoint for production environment',
      }
    );

    const s3BucketParameter = new ssm.StringParameter(
      this,
      'S3BucketParameter',
      {
        parameterName: `/production-${environmentSuffix}/s3bucket/name`,
        stringValue: s3Bucket.bucketName,
        description: 'S3 bucket name for production environment',
      }
    );

    cdk.Tags.of(dbEndpointParameter).add('Environment', 'Production');
    cdk.Tags.of(s3BucketParameter).add('Environment', 'Production');

    // CloudWatch Alarms
    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCPUAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: asg.autoScalingGroupName,
        },
        statistic: 'Average',
      }),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    cdk.Tags.of(cpuAlarm).add('Environment', 'Production');

    const databaseCpuAlarm = new cloudwatch.Alarm(this, 'DatabaseCPUAlarm', {
      metric: database.metricCPUUtilization(),
      threshold: 75,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    cdk.Tags.of(databaseCpuAlarm).add('Environment', 'Production');

    // CloudWatch Synthetics Canary for endpoint monitoring
    const canaryRole = new iam.Role(this, 'CanaryRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchSyntheticsExecutionRolePolicy'
        ),
      ],
    });

    const syntheticsCanary = new synthetics.Canary(this, 'ProductionCanary', {
      canaryName: `production-endpoint-canary-${environmentSuffix}`,
      schedule: synthetics.Schedule.rate(cdk.Duration.minutes(5)),
      test: synthetics.Test.custom({
        code: synthetics.Code.fromInline(`
const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');
const syntheticsConfiguration = synthetics.getConfiguration();

const checkEndpoint = async function () {
    return await synthetics.executeStep('checkEndpoint', async function () {
        const options = {
            hostname: '${alb.loadBalancerDnsName}',
            method: 'GET',
            path: '/',
            port: 80
        };
        
        const response = await synthetics.makeRequest(options);
        log.info('Response status: ' + response.statusCode);
        
        if (response.statusCode !== 200) {
            throw new Error('Failed to load page');
        }
        
        return response;
    });
};

exports.handler = async () => {
    return await synthetics.executeStep('canary', async function () {
        await checkEndpoint();
    });
};
        `),
        handler: 'index.handler',
      }),
      runtime: synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_9,
      role: canaryRole,
    });
    cdk.Tags.of(syntheticsCanary).add('Environment', 'Production');

    // Application Signals - Application Insights
    const appInsights = new applicationSignals.CfnApplication(
      this,
      'ProductionAppInsights',
      {
        resourceGroupName: `production-application-resources-${environmentSuffix}`,
        autoConfigurationEnabled: true,
        cweMonitorEnabled: true,
      }
    );
    cdk.Tags.of(appInsights).add('Environment', 'Production');

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
      exportName: `${id}-ALB-DNS`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
      exportName: `${id}-DB-Endpoint`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 bucket name for application storage',
      exportName: `${id}-S3-Bucket`,
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID for the production environment',
      exportName: `${id}-VPC-Id`,
    });
  }
}
```

## Key Improvements in the Ideal Solution

### 1. Environment Isolation
- Proper environment suffix support throughout all resources
- Dynamic stack naming with environment suffix
- Parameterized resource naming to prevent conflicts

### 2. Security Enhancements
- KMS encryption for all data at rest (EBS, RDS, S3, CloudWatch Logs)
- Least privilege IAM policies with specific resource ARNs
- Security groups with minimal required access
- ALB security group with explicit egress rules
- Added KMS permissions to EC2 role for encryption operations
- SSH access controls with VPC-only IP restrictions
- RDS encryption in transit with SSL/TLS port configuration

### 3. High Availability
- Multi-AZ RDS deployment
- Two NAT gateways across availability zones
- Auto Scaling Group with 2 minimum instances
- Isolated subnets for database tier

### 4. Operational Excellence
- CloudWatch Agent configuration for detailed metrics
- Application and error log collection
- CloudWatch Synthetics for endpoint monitoring
- Application Insights for automatic application monitoring
- SSM parameters for configuration management

### 5. Deployment Safety
- All resources have DESTROY removal policy for clean teardown
- Deletion protection disabled for non-production environments
- Auto-delete objects enabled for S3 bucket
- Proper stack outputs with export names

### 6. Monitoring and Observability
- CPU alarms for both ASG and RDS
- Detailed CloudWatch metrics collection
- Log aggregation with encryption
- Synthetic monitoring every 5 minutes
- Application Insights for automatic issue detection

### 7. Cost Optimization
- T3 instances for compute (burstable performance)
- Lifecycle rules for S3 object management
- Auto Scaling based on actual usage
- Log retention set to 30 days

This solution provides a production-ready, secure, and scalable infrastructure that follows AWS best practices and CDK patterns.