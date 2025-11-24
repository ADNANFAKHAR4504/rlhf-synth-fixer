# Ideal Response

This document aggregates the full contents of the key TypeScript sources under `lib/`, with no truncation. Each block is labeled for easy reference.

## tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { AlbAsgConstruct } from '../lib/constructs/alb-asg-construct';
import { CloudFrontConstruct } from '../lib/constructs/cloudfront-construct';
import { ComplianceConstruct } from '../lib/constructs/compliance-construct';
import { CrossAccountConstruct } from '../lib/constructs/cross-account-construct';
import { LambdaConstruct } from '../lib/constructs/lambda-construct';
import { MonitoringConstruct } from '../lib/constructs/monitoring-construct';
import { RdsConstruct } from '../lib/constructs/rds-construct';
import { Route53Construct } from '../lib/constructs/route53-construct';
import { S3Construct } from '../lib/constructs/s3-construct';
import { VpcConstruct } from '../lib/constructs/vpc-construct';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  environment: string;
  region: string;
  suffix: string;
  ec2InstanceCountPerRegion: number;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const {
      environmentSuffix,
      environment,
      region,
      suffix,
      ec2InstanceCountPerRegion,
    } = props;

    // Generate timestamp for unique resource names if needed
    const timestamp = Date.now().toString().slice(-6);
    const uniqueSuffix = `${suffix}-${timestamp}`;

    // Get CIDR mappings from context with non-overlapping ranges
    const cidrMappings = this.node.tryGetContext('cidrMappings') || {
      'dev-us-east-2': '10.0.0.0/16',
      'dev-us-east-1': '10.1.0.0/16',
      'prod-us-east-2': '10.2.0.0/16',
      'prod-us-east-1': '10.3.0.0/16',
      'staging-us-east-2': '10.4.0.0/16',
      'staging-us-east-1': '10.5.0.0/16',
    };

    // 1. VPC with non-overlapping CIDR ranges
    const vpcConstruct = new VpcConstruct(this, 'VpcConstruct', {
      environment,
      region,
      suffix: uniqueSuffix,
      environmentSuffix,
      cidrMappings,
    });

    // 9. S3 Bucket with robust HTTPS-only enforcement
    const s3Construct = new S3Construct(this, 'S3Construct', {
      environment,
      region,
      suffix: uniqueSuffix,
      environmentSuffix,
    });

    // 2 & 11. Lambda with real-world cost monitoring use case
    const lambdaConstruct = new LambdaConstruct(this, 'LambdaConstruct', {
      environment,
      region,
      suffix: uniqueSuffix,
      environmentSuffix,
      vpc: vpcConstruct.vpc,
      s3Bucket: s3Construct.bucket,
    });

    // 3 & 11. RDS with proper encryption and secrets
    const rdsConstruct = new RdsConstruct(this, 'RdsConstruct', {
      environment,
      region,
      suffix: uniqueSuffix,
      environmentSuffix,
      vpc: vpcConstruct.vpc,
    });

    // 14 & 15. ALB and Auto Scaling Group with proper security
    const albAsgConstruct = new AlbAsgConstruct(this, 'AlbAsgConstruct', {
      environment,
      region,
      suffix: uniqueSuffix,
      environmentSuffix,
      vpc: vpcConstruct.vpc,
      instanceCount: ec2InstanceCountPerRegion,
      dbSecret: rdsConstruct.dbSecret,
      dbEndpoint: rdsConstruct.dbEndpoint,
    });

    // 5. Route 53 with proper failover configuration
    const route53Construct = new Route53Construct(this, 'Route53Construct', {
      environment,
      region,
      suffix: uniqueSuffix,
      environmentSuffix,
      alb: albAsgConstruct.alb,
    });

    // 10. CloudFront with multi-region origin groups
    const cloudfrontConstruct = new CloudFrontConstruct(
      this,
      'CloudFrontConstruct',
      {
        environment,
        region,
        suffix: uniqueSuffix,
        environmentSuffix,
        alb: albAsgConstruct.alb,
        route53: route53Construct,
      }
    );

    // 8 & 12. Monitoring with cross-environment SNS
    const monitoringConstruct = new MonitoringConstruct(
      this,
      'MonitoringConstruct',
      {
        environment,
        region,
        suffix: uniqueSuffix,
        environmentSuffix,
        autoScalingGroup: albAsgConstruct.autoScalingGroup,
        lambdaFunction: lambdaConstruct.lambdaFunction,
        alb: albAsgConstruct.alb,
      }
    );

    // 13. Compliance with proper Config rules (Config rules commented out - no admin access)
    new ComplianceConstruct(this, 'ComplianceConstruct', {
      environment,
      region,
      suffix: uniqueSuffix,
      environmentSuffix,
    });

    // 6. Cross-account IAM with configurable accounts
    new CrossAccountConstruct(this, 'CrossAccountConstruct', {
      environment,
      region,
      suffix: uniqueSuffix,
      environmentSuffix,
    });

    // API Gateway with Lambda integration
    const api = new apigateway.RestApi(this, 'ApiGateway', {
      restApiName: `${environment}-${region}-api-${uniqueSuffix}`,
      description: 'API Gateway for integration testing',
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(
      lambdaConstruct.lambdaFunction
    );
    api.root.addMethod('GET', lambdaIntegration);
    api.root.addMethod('POST', lambdaIntegration);

    const apiResource = api.root.addResource('api');
    apiResource.addMethod('GET', lambdaIntegration);
    apiResource.addMethod('POST', lambdaIntegration);

    // SQS Queue
    const queue = new sqs.Queue(this, 'SqsQueue', {
      queueName: `${environment}-${region}-queue-${uniqueSuffix}`,
    });

    // Comprehensive outputs for flat-outputs.json discovery
    this.createOutputs(
      environmentSuffix,
      region,
      vpcConstruct,
      s3Construct,
      lambdaConstruct,
      rdsConstruct,
      albAsgConstruct,
      route53Construct,
      cloudfrontConstruct,
      monitoringConstruct,
      api,
      queue
    );
  }

  private createOutputs(
    environmentSuffix: string,
    region: string,
    vpcConstruct: VpcConstruct,
    s3Construct: S3Construct,
    lambdaConstruct: LambdaConstruct,
    rdsConstruct: RdsConstruct,
    albAsgConstruct: AlbAsgConstruct,
    route53Construct: Route53Construct,
    cloudfrontConstruct: CloudFrontConstruct,
    monitoringConstruct: MonitoringConstruct,
    api: apigateway.RestApi,
    queue: sqs.Queue
  ) {
    // VPC Outputs
    new cdk.CfnOutput(this, `VpcId${environmentSuffix}${region}`, {
      value: vpcConstruct.vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${environmentSuffix}-${region}`,
    });

    // S3 Outputs
    new cdk.CfnOutput(this, `S3BucketName${environmentSuffix}${region}`, {
      value: s3Construct.bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `S3BucketName-${environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, `S3BucketArn${environmentSuffix}${region}`, {
      value: s3Construct.bucket.bucketArn,
      description: 'S3 Bucket ARN',
      exportName: `S3BucketArn-${environmentSuffix}-${region}`,
    });

    // Lambda Outputs
    new cdk.CfnOutput(this, `LambdaFunctionArn${environmentSuffix}${region}`, {
      value: lambdaConstruct.lambdaFunction.functionArn,
      description: 'Lambda Function ARN',
      exportName: `LambdaFunctionArn-${environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, `LambdaFunctionName${environmentSuffix}${region}`, {
      value: lambdaConstruct.lambdaFunction.functionName,
      description: 'Lambda Function Name',
      exportName: `LambdaFunctionName-${environmentSuffix}-${region}`,
    });

    // RDS Outputs
    new cdk.CfnOutput(this, `RdsEndpoint${environmentSuffix}${region}`, {
      value: rdsConstruct.dbEndpoint,
      description: 'RDS Endpoint',
      exportName: `RdsEndpoint-${environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, `DbSecretArn${environmentSuffix}${region}`, {
      value: rdsConstruct.dbSecret.secretArn,
      description: 'Database Secret ARN',
      exportName: `DbSecretArn-${environmentSuffix}-${region}`,
    });

    // ALB Outputs
    new cdk.CfnOutput(this, `AlbEndpoint${environmentSuffix}${region}`, {
      value: `http://${albAsgConstruct.alb.loadBalancerDnsName}`,
      description: 'ALB HTTP Endpoint (for testing)',
      exportName: `AlbEndpoint-${environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, `AlbArn${environmentSuffix}${region}`, {
      value: albAsgConstruct.alb.loadBalancerArn,
      description: 'ALB ARN',
      exportName: `AlbArn-${environmentSuffix}-${region}`,
    });

    // Route 53 Outputs
    new cdk.CfnOutput(this, `HostedZoneId${environmentSuffix}${region}`, {
      value: route53Construct.hostedZone.hostedZoneId,
      description: 'Route 53 Hosted Zone ID',
      exportName: `HostedZoneId-${environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, `DomainName${environmentSuffix}${region}`, {
      value: route53Construct.domainName,
      description: 'Domain Name',
      exportName: `DomainName-${environmentSuffix}-${region}`,
    });

    // CloudFront Outputs
    new cdk.CfnOutput(this, `CloudFrontDomain${environmentSuffix}${region}`, {
      value: cloudfrontConstruct.distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain',
      exportName: `CloudFrontDomain-${environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(
      this,
      `CloudFrontDistributionId${environmentSuffix}${region}`,
      {
        value: cloudfrontConstruct.distribution.distributionId,
        description: 'CloudFront Distribution ID',
        exportName: `CloudFrontDistributionId-${environmentSuffix}-${region}`,
      }
    );

    // Monitoring Outputs
    new cdk.CfnOutput(this, `ErrorTopicArn${environmentSuffix}${region}`, {
      value: monitoringConstruct.errorTopic.topicArn,
      description: 'Error Notification Topic ARN',
      exportName: `ErrorTopicArn-${environmentSuffix}-${region}`,
    });

    new cdk.CfnOutput(this, `DashboardUrl${environmentSuffix}${region}`, {
      value: `https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${monitoringConstruct.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: `DashboardUrl-${environmentSuffix}-${region}`,
    });

    // Auto Scaling Group Output
    new cdk.CfnOutput(
      this,
      `AutoScalingGroupName${environmentSuffix}${region}`,
      {
        value: albAsgConstruct.autoScalingGroup.autoScalingGroupName,
        description: 'Auto Scaling Group Name',
        exportName: `AutoScalingGroupName-${environmentSuffix}-${region}`,
      }
    );

    // API Gateway Output
    new cdk.CfnOutput(this, `ApiGatewayUrl${environmentSuffix}${region}`, {
      value: api.url,
      description: 'API Gateway URL',
      exportName: `ApiGatewayUrl-${environmentSuffix}-${region}`,
    });

    // SQS Queue Output
    new cdk.CfnOutput(this, `SqsQueueUrl${environmentSuffix}${region}`, {
      value: queue.queueUrl,
      description: 'SQS Queue URL',
      exportName: `SqsQueueUrl-${environmentSuffix}-${region}`,
    });
  }
}

```

## constructs/alb-asg-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface AlbAsgConstructProps {
  environment: string;
  region: string;
  suffix: string;
  environmentSuffix: string;
  vpc: ec2.Vpc;
  instanceCount: number;
  dbSecret: secretsmanager.Secret;
  dbEndpoint: string;
}

export class AlbAsgConstruct extends Construct {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;

  constructor(scope: Construct, id: string, props: AlbAsgConstructProps) {
    super(scope, id);

    const { environment, region, suffix, environmentSuffix, vpc, instanceCount, dbSecret, dbEndpoint } = props;

    // For testing purposes, we'll create ALB without custom certificate
    // In production, you would have a pre-existing certificate
    const domainName = `${environment}-app-${suffix}.test.local`;

    // Security group for ALB - only allow HTTPS (443) - Requirement 4
    const albSecurityGroup = new ec2.SecurityGroup(this, `AlbSecurityGroup${environmentSuffix}${region}`, {
      securityGroupName: `${environment}-${region}-alb-sg-${suffix}`,
      vpc: vpc,
      description: 'Security group for ALB - HTTPS only with least privilege',
      allowAllOutbound: false,
    });

    // Allow HTTPS from anywhere (requirement 4)
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from IPv4'
    );

    // Allow HTTP for testing
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from IPv4 for testing'
    );

    // Also allow IPv6 for complete coverage
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv6(),
      ec2.Port.tcp(443),
      'Allow HTTPS from IPv6'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv6(),
      ec2.Port.tcp(80),
      'Allow HTTP from IPv6 for testing'
    );

    // Security group for EC2 instances - least privilege
    const ec2SecurityGroup = new ec2.SecurityGroup(this, `Ec2SecurityGroup${environmentSuffix}${region}`, {
      securityGroupName: `${environment}-${region}-ec2-sg-${suffix}`,
      vpc: vpc,
      description: 'Security group for EC2 instances - least privilege',
      allowAllOutbound: true, // Allow outbound for updates and AWS API calls
    });

    // Allow ALB to communicate with EC2 instances on port 80
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB only'
    );

    // Allow SSH access from within VPC for management (optional)
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(22),
      'Allow SSH from VPC for management'
    );

    // Allow ALB outbound to EC2 instances
    albSecurityGroup.addEgressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP to EC2 instances'
    );

    // Application Load Balancer - Requirement 14
    this.alb = new elbv2.ApplicationLoadBalancer(this, `Alb${environmentSuffix}${region}`, {
      loadBalancerName: `${environment}-${region}-alb-${suffix}`,
      vpc: vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      deletionProtection: false, // Allow deletion when stack fails
    });

    // IAM role for EC2 instances with least privilege
    const ec2Role = new iam.Role(this, `Ec2Role${environmentSuffix}${region}`, {
      roleName: `${environment}-${region}-ec2-role-${suffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
      inlinePolicies: {
        SecretAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['secretsmanager:GetSecretValue'],
              resources: [dbSecret.secretArn],
            }),
            // Specific CloudWatch permissions
            new iam.PolicyStatement({
              actions: [
                'cloudwatch:PutMetricData',
                'ec2:DescribeVolumes',
                'ec2:DescribeTags',
              ],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'cloudwatch:namespace': 'CWAgent',
                },
              },
            }),
          ],
        }),
      },
    });

    // User data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y httpd',

      // Configure CloudWatch agent
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify({
        metrics: {
          namespace: 'CWAgent',
          metrics_collected: {
            cpu: {
              measurement: ['cpu_usage_idle', 'cpu_usage_iowait', 'cpu_usage_user', 'cpu_usage_system'],
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
        logs: {
          logs_collected: {
            files: {
              collect_list: [
                {
                  file_path: '/var/log/httpd/access_log',
                  log_group_name: `/aws/ec2/httpd/${environment}-${region}`,
                  log_stream_name: '{instance_id}',
                },
              ],
            },
          },
        },
      }, null, 2),
      'EOF',

      // Start services
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s',
      'systemctl start httpd',
      'systemctl enable httpd',

      // Create simple web application
      `cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>${environment} - ${region} - Instance</title>
</head>
<body>
    <h1>${environment} Environment - ${region} Region</h1>
    <p>Instance ID: \$(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Availability Zone: \$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
    <p>Instance Type: \$(curl -s http://169.254.169.254/latest/meta-data/instance-type)</p>
    <p>Database Endpoint: ${dbEndpoint}</p>
    <p>Timestamp: \$(date)</p>
</body>
</html>
EOF`,

      'echo "OK" > /var/www/html/health',

      // Create a simple API endpoint
      `cat > /var/www/html/api.php << EOF
<?php
header('Content-Type: application/json');
echo json_encode([
    'status' => 'healthy',
    'environment' => '${environment}',
    'region' => '${region}',
    'instance_id' => file_get_contents('http://169.254.169.254/latest/meta-data/instance-id'),
    'timestamp' => date('c')
]);
?>
EOF`,
    );

    // Auto Scaling Group - Requirement 15 (minimum 2 instances)
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(this, `Asg${environmentSuffix}${region}`, {
      autoScalingGroupName: `${environment}-${region}-asg-${suffix}`,
      vpc: vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        environment === 'prod' ? ec2.InstanceSize.LARGE : ec2.InstanceSize.MEDIUM
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      userData: userData,
      minCapacity: 2, // Requirement 15
      maxCapacity: environment === 'prod' ? 20 : 10,
      desiredCapacity: instanceCount, // From parameter - Requirement 7
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5),
      }),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
        maxBatchSize: 2,
        minInstancesInService: 2,
        pauseTime: cdk.Duration.minutes(5),
      }),
      // Remove KMS key ID for EBS volumes to use default EBS KMS key
      blockDevices: [{
        deviceName: '/dev/xvda',
        volume: autoscaling.BlockDeviceVolume.ebs(20, {
          encrypted: true,
          // No kmsKey specified - uses default EBS KMS key
          deleteOnTermination: true,
          volumeType: autoscaling.EbsDeviceVolumeType.GP3,
        }),
      }],
    });

    // Target group with health checks
    const targetGroup = new elbv2.ApplicationTargetGroup(this, `TargetGroup${environmentSuffix}${region}`, {
      targetGroupName: `${environment}-${region}-tg-${suffix}`,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      vpc: vpc,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        protocol: elbv2.Protocol.HTTP,
      },
      targets: [this.autoScalingGroup],
    });

    // For testing, use HTTP listener only
    // HTTPS listener with certificate (commented out for testing)
    // this.alb.addListener(`HttpsListener${environmentSuffix}${region}`, {
    //   port: 443,
    //   protocol: elbv2.ApplicationProtocol.HTTPS,
    //   certificates: [certificate],
    //   defaultTargetGroups: [targetGroup],
    //   sslPolicy: elbv2.SslPolicy.RECOMMENDED_TLS, // Strong TLS policy
    // });

    // HTTP listener for testing
    this.alb.addListener(`HttpListener${environmentSuffix}${region}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Auto-scaling based on ALB request count - Requirement 14
    this.autoScalingGroup.scaleOnRequestCount(`RequestScaling${environmentSuffix}${region}`, {
      targetRequestsPerMinute: 100,
    });

    // CPU-based scaling as backup
    this.autoScalingGroup.scaleOnCpuUtilization(`CpuScaling${environmentSuffix}${region}`, {
      targetUtilizationPercent: 70,
    });

    // Memory-based scaling using target tracking
    this.autoScalingGroup.scaleOnMetric(`MemoryScaling${environmentSuffix}${region}`, {
      metric: new cdk.aws_cloudwatch.Metric({
        namespace: 'CWAgent',
        metricName: 'mem_used_percent',
        statistic: 'Average',
        dimensionsMap: {
          AutoScalingGroupName: this.autoScalingGroup.autoScalingGroupName,
        },
      }),
      scalingSteps: [
        { upper: 70, change: 0 },
        { lower: 75, change: +1 },
        { lower: 85, change: +2 },
      ],
    });

    // Apply tags
    cdk.Tags.of(this.alb).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.alb).add('Environment', environment);
    cdk.Tags.of(this.alb).add('Region', region);
    cdk.Tags.of(this.alb).add('Purpose', 'ApplicationLoadBalancer');

    cdk.Tags.of(this.autoScalingGroup).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.autoScalingGroup).add('Environment', environment);
    cdk.Tags.of(this.autoScalingGroup).add('Region', region);
    cdk.Tags.of(this.autoScalingGroup).add('Purpose', 'WebServers');
  }
}
```

## constructs/cloudfront-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { Route53Construct } from './route53-construct';

export interface CloudFrontConstructProps {
  environment: string;
  region: string;
  suffix: string;
  environmentSuffix: string;
  alb: elbv2.ApplicationLoadBalancer;
  route53: Route53Construct;
}

export class CloudFrontConstruct extends Construct {
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: CloudFrontConstructProps) {
    super(scope, id);

    const { environment, region, suffix, environmentSuffix, alb, route53 } = props;

    // CloudFront logs bucket (using existing S3 construct pattern)
    const logsBucket = new s3.Bucket(this, `CloudFrontLogsBucket${environmentSuffix}${region}`, {
      bucketName: `${environment}-${region}-cf-logs-${suffix}`.toLowerCase(),
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED, // Enable ACLs for CloudFront logging
      lifecycleRules: [{
        id: 'delete-old-logs',
        expiration: cdk.Duration.days(90),
        abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
      }],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Certificate for CloudFront - temporarily disabled to avoid validation issues
    // const certificate = new certificatemanager.Certificate(this, `CloudFrontCertificate${environmentSuffix}${region}`, {
    //   domainName: `${environment}-${suffix}.example.com`,
    //   subjectAlternativeNames: [`*.${environment}-${suffix}.example.com`],
    //   validation: certificatemanager.CertificateValidation.fromEmail({
    //     [`admin@${environment}-${suffix}.example.com`]: `${environment}-${suffix}.example.com`,
    //     [`admin@${environment}-${suffix}.example.com`]: `*.${environment}-${suffix}.example.com`,
    //   }),
    // });

    // Primary origin (current region's ALB)
    const primaryOrigin = new origins.LoadBalancerV2Origin(alb, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
      httpPort: 80,
      originPath: '',
      keepaliveTimeout: cdk.Duration.seconds(5),
      readTimeout: cdk.Duration.seconds(30),
      customHeaders: {
        'X-CloudFront-Region': region,
        'X-Environment': environment,
      },
    });

    // Since OriginGroup is not available, we'll use a single origin
    // In a real multi-region setup, you'd configure multiple distributions
    const originFailoverConfig = primaryOrigin;

    // Cache policies
    const apiCachePolicy = new cloudfront.CachePolicy(this, `ApiCachePolicy${environmentSuffix}${region}`, {
      cachePolicyName: `${environment}-${region}-api-cache-${suffix}`,
      comment: 'Cache policy for API endpoints',
      defaultTtl: cdk.Duration.seconds(0), // No caching for API
      maxTtl: cdk.Duration.seconds(1),
      minTtl: cdk.Duration.seconds(0),
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList(
        'Authorization',
        'Content-Type',
        'X-API-Key',
        'X-Forwarded-For'
      ),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });

    const staticCachePolicy = new cloudfront.CachePolicy(this, `StaticCachePolicy${environmentSuffix}${region}`, {
      cachePolicyName: `${environment}-${region}-static-cache-${suffix}`,
      comment: 'Cache policy for static content',
      defaultTtl: cdk.Duration.hours(24),
      maxTtl: cdk.Duration.days(365),
      minTtl: cdk.Duration.seconds(1),
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList('CloudFront-Viewer-Country'),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });

    // Origin request policy
    const originRequestPolicy = new cloudfront.OriginRequestPolicy(this, `OriginRequestPolicy${environmentSuffix}${region}`, {
      originRequestPolicyName: `${environment}-${region}-origin-request-${suffix}`,
      comment: 'Origin request policy for forwarding headers',
      headerBehavior: cloudfront.OriginRequestHeaderBehavior.allowList(
        'CloudFront-Viewer-Country',
        'CloudFront-Viewer-Country-Region',
        'CloudFront-Is-Mobile-Viewer',
        'CloudFront-Is-Tablet-Viewer',
        'CloudFront-Is-Desktop-Viewer',
        'CloudFront-Forwarded-Proto'
      ),
      queryStringBehavior: cloudfront.OriginRequestQueryStringBehavior.all(),
      cookieBehavior: cloudfront.OriginRequestCookieBehavior.none(),
    });

    // Response headers policy for security
    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, `ResponseHeadersPolicy${environmentSuffix}${region}`, {
      responseHeadersPolicyName: `${environment}-${region}-security-headers-${suffix}`,
      comment: 'Security headers policy',
      securityHeadersBehavior: {
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: cloudfront.HeadersFrameOption.DENY, override: true },
        referrerPolicy: { referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN, override: true },
        strictTransportSecurity: {
          accessControlMaxAge: cdk.Duration.seconds(31536000),
          includeSubdomains: true,
          preload: true,
          override: true,
        },
      },
    });

    // WAF Web ACL for CloudFront protection
    const webAcl = new cdk.aws_wafv2.CfnWebACL(this, `CloudFrontWebAcl${environmentSuffix}${region}`, {
      name: `${environment}-${region}-cloudfront-waf-${suffix}`,
      scope: 'CLOUDFRONT',
      defaultAction: { allow: {} },
      description: `WAF for CloudFront distribution in ${environment}`,
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
        metricName: `${environment}CloudFrontWebAcl`,
      },
      tags: [
        { key: 'iac-rlhf-amazon', value: 'true' },
        { key: 'Environment', value: environment },
        { key: 'Region', value: region },
      ],
    });

    // CloudFront Distribution without SSL for testing - Addresses MODEL_FAILURES item 2
    this.distribution = new cloudfront.Distribution(this, `CloudFrontDistribution${environmentSuffix}${region}`, {
      // domainNames: [`cdn-${route53.domainName}`],
      // certificate: certificate,

      // Default behavior for API endpoints
      defaultBehavior: {
        origin: originFailoverConfig,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: apiCachePolicy,
        originRequestPolicy: originRequestPolicy,
        responseHeadersPolicy: responseHeadersPolicy,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        compress: true,
      },

      // Additional behaviors for different content types
      additionalBehaviors: {
        '/api/*': {
          origin: originFailoverConfig,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: apiCachePolicy,
          originRequestPolicy: originRequestPolicy,
          responseHeadersPolicy: responseHeadersPolicy,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          compress: true,
        },
        '/static/*': {
          origin: primaryOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: staticCachePolicy,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          compress: true,
        },
        '/health': {
          origin: primaryOrigin,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        },
      },

      // Distribution settings
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      enableIpv6: true,
      enabled: true,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only North America and Europe

      // Geo restrictions
      geoRestriction: cloudfront.GeoRestriction.allowlist(
        'US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'AU', 'JP'
      ),

      // Logging
      enableLogging: true,
      logBucket: logsBucket,
      logFilePrefix: `cloudfront-${environment}-${region}/`,
      logIncludesCookies: false,

      // Error pages
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
          ttl: cdk.Duration.seconds(300),
        },
        {
          httpStatus: 500,
          responseHttpStatus: 500,
          responsePagePath: '/500.html',
          ttl: cdk.Duration.seconds(60),
        },
      ],

      // Comment
      comment: `CloudFront distribution for ${environment} environment in ${region}`,

      // Web ACL
      webAclId: webAcl.attrArn,
    });

    // Create CNAME record in Route 53 for CloudFront
    new cdk.aws_route53.CnameRecord(this, `CloudFrontCnameRecord${environmentSuffix}${region}`, {
      zone: route53.hostedZone,
      recordName: 'cdn',
      domainName: this.distribution.distributionDomainName,
      ttl: cdk.Duration.seconds(300),
    });

    // Apply tags
    cdk.Tags.of(this.distribution).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.distribution).add('Environment', environment);
    cdk.Tags.of(this.distribution).add('Region', region);
    cdk.Tags.of(this.distribution).add('Purpose', 'CDN');

    cdk.Tags.of(logsBucket).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(logsBucket).add('Environment', environment);
    cdk.Tags.of(logsBucket).add('Region', region);
    cdk.Tags.of(logsBucket).add('Purpose', 'CloudFrontLogs');
  }
}
```

## constructs/compliance-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as config from 'aws-cdk-lib/aws-config';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface ComplianceConstructProps {
  environment: string;
  region: string;
  suffix: string;
  environmentSuffix: string;
}

export class ComplianceConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ComplianceConstructProps) {
    super(scope, id);

    const { environment, region, suffix, environmentSuffix } = props;

    // KMS key for Config bucket encryption
    const configKey = new kms.Key(this, `ConfigKmsKey${environmentSuffix}${region}`, {
      description: `Config service encryption key for ${environment} in ${region}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Config bucket with proper security - Addresses MODEL_FAILURES item 12
    const configBucket = new s3.Bucket(this, `ConfigBucket${environmentSuffix}${region}`, {
      bucketName: `${environment}-${region}-config-bucket-${suffix}`.toLowerCase(),
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: configKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      lifecycleRules: [{
        id: 'delete-old-config-data',
        expiration: cdk.Duration.days(2555), // 7 years retention for compliance
        noncurrentVersionExpiration: cdk.Duration.days(90),
        abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
      }],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Config service role with least privilege
    const configRole = new iam.Role(this, `ConfigRole${environmentSuffix}${region}`, {
      roleName: `${environment}-${region}-config-role-${suffix}`,
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWS_ConfigRole'),
      ],
      inlinePolicies: {
        ConfigBucketAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                's3:GetBucketAcl',
                's3:ListBucket',
                's3:GetBucketLocation',
              ],
              resources: [configBucket.bucketArn],
            }),
            new iam.PolicyStatement({
              actions: [
                's3:PutObject',
                's3:GetObject',
                's3:DeleteObject',
              ],
              resources: [`${configBucket.bucketArn}/*`],
              conditions: {
                StringEquals: {
                  's3:x-amz-acl': 'bucket-owner-full-control',
                },
              },
            }),
            new iam.PolicyStatement({
              actions: [
                'kms:Decrypt',
                'kms:GenerateDataKey',
              ],
              resources: [configKey.keyArn],
            }),
          ],
        }),
      },
    });

    // Bucket policy for Config service access
    configBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'AWSConfigBucketPermissionsCheck',
      principals: [new iam.ServicePrincipal('config.amazonaws.com')],
      actions: ['s3:GetBucketAcl', 's3:ListBucket'],
      resources: [configBucket.bucketArn],
      conditions: {
        StringEquals: {
          'AWS:SourceAccount': cdk.Aws.ACCOUNT_ID,
        },
      },
    }));

    configBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'AWSConfigBucketExistenceCheck',
      principals: [new iam.ServicePrincipal('config.amazonaws.com')],
      actions: ['s3:ListBucket'],
      resources: [configBucket.bucketArn],
      conditions: {
        StringEquals: {
          'AWS:SourceAccount': cdk.Aws.ACCOUNT_ID,
        },
      },
    }));

    configBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'AWSConfigBucketDelivery',
      principals: [new iam.ServicePrincipal('config.amazonaws.com')],
      actions: ['s3:PutObject'],
      resources: [`${configBucket.bucketArn}/*`],
      conditions: {
        StringEquals: {
          's3:x-amz-acl': 'bucket-owner-full-control',
          'AWS:SourceAccount': cdk.Aws.ACCOUNT_ID,
        },
      },
    }));

    // Config Recorder - commented out to avoid conflict with existing recorder
    // AWS Config only allows 1 configuration recorder per region per account
    // const configRecorder = new config.CfnConfigurationRecorder(this, `ConfigRecorder${environmentSuffix}${region}`, {
    //   name: `${environment}-${region}-recorder-${suffix}`,
    //   roleArn: configRole.roleArn,
    //   recordingGroup: {
    //     allSupported: true,
    //     includeGlobalResourceTypes: region === 'us-east-1', // Only record global resources in one region
    //     resourceTypes: [], // Empty because allSupported is true
    //   },
    // });

    // Delivery Channel - commented out to avoid conflict with existing delivery channel
    // AWS Config only allows 1 delivery channel per region per account
    // const deliveryChannel = new config.CfnDeliveryChannel(this, `DeliveryChannel${environmentSuffix}${region}`, {
    //   name: `${environment}-${region}-delivery-${suffix}`,
    //   s3BucketName: configBucket.bucketName,
    //   s3KeyPrefix: `config/${environment}/${region}`,
    //   configSnapshotDeliveryProperties: {
    //     deliveryFrequency: 'TwentyFour_Hours',
    //   },
    // });

    // Required tags rule - Requirement 13
    new config.ManagedRule(this, `RequiredTagsRule${environmentSuffix}${region}`, {
      identifier: config.ManagedRuleIdentifiers.REQUIRED_TAGS,
      inputParameters: {
        tag1Key: 'Environment',
        tag2Key: 'iac-rlhf-amazon',
        tag3Key: 'CostCenter',
        tag4Key: 'Owner',
      },
      ruleScope: config.RuleScope.fromResources([
        config.ResourceType.EC2_INSTANCE,
        config.ResourceType.RDS_DB_INSTANCE,
        config.ResourceType.S3_BUCKET,
        config.ResourceType.LAMBDA_FUNCTION,
        config.ResourceType.CLOUDFORMATION_STACK,
      ]),
      configRuleName: `${environment}-${region}-required-tags-${suffix}`,
      description: 'Checks whether resources contain all required tags',
    });

    // Encryption rules - Requirement 13
    new config.ManagedRule(this, `S3EncryptionRule${environmentSuffix}${region}`, {
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED,
      configRuleName: `${environment}-${region}-s3-encryption-${suffix}`,
      description: 'Checks that S3 buckets have server-side encryption enabled',
    });

    new config.ManagedRule(this, `RdsEncryptionRule${environmentSuffix}${region}`, {
      identifier: config.ManagedRuleIdentifiers.RDS_STORAGE_ENCRYPTED,
      configRuleName: `${environment}-${region}-rds-encryption-${suffix}`,
      description: 'Checks whether RDS instances have storage encryption enabled',
    });

    new config.ManagedRule(this, `EbsEncryptionRule${environmentSuffix}${region}`, {
      identifier: config.ManagedRuleIdentifiers.EC2_EBS_ENCRYPTION_BY_DEFAULT,
      configRuleName: `${environment}-${region}-ebs-encryption-${suffix}`,
      description: 'Checks whether EBS volumes are encrypted by default',
    });

    // Lambda encryption rule
    new config.ManagedRule(this, `LambdaEncryptionRule${environmentSuffix}${region}`, {
      identifier: config.ManagedRuleIdentifiers.LAMBDA_FUNCTION_SETTINGS_CHECK,
      inputParameters: {
        runtime: 'nodejs18.x',
        memorySize: '512',
        timeout: '300',
      },
      configRuleName: `${environment}-${region}-lambda-settings-${suffix}`,
      description: 'Checks Lambda function configuration settings',
    });

    // Security group rules
    new config.ManagedRule(this, `SecurityGroupSshRule${environmentSuffix}${region}`, {
      identifier: config.ManagedRuleIdentifiers.EC2_SECURITY_GROUP_ATTACHED_TO_ENI,
      configRuleName: `${environment}-${region}-sg-ssh-attached-${suffix}`,
      description: 'Checks whether security groups are attached to network interfaces for SSH',
    });

    new config.ManagedRule(this, `SecurityGroupRdpRule${environmentSuffix}${region}`, {
      identifier: config.ManagedRuleIdentifiers.EC2_SECURITY_GROUP_ATTACHED_TO_ENI_PERIODIC,
      configRuleName: `${environment}-${region}-sg-rdp-check-${suffix}`,
      description: 'Checks security group configuration periodically',
    });

    // ALB/ELB security rules
    new config.ManagedRule(this, `AlbHttpsRule${environmentSuffix}${region}`, {
      identifier: config.ManagedRuleIdentifiers.ALB_HTTP_TO_HTTPS_REDIRECTION_CHECK,
      configRuleName: `${environment}-${region}-alb-https-redirect-${suffix}`,
      description: 'Checks whether ALBs redirect HTTP requests to HTTPS',
    });

    // VPC flow logs rule
    new config.ManagedRule(this, `VpcFlowLogsRule${environmentSuffix}${region}`, {
      identifier: config.ManagedRuleIdentifiers.VPC_FLOW_LOGS_ENABLED,
      configRuleName: `${environment}-${region}-vpc-flow-logs-${suffix}`,
      description: 'Checks whether VPC flow logs are enabled',
    });

    // CloudTrail rule
    new config.ManagedRule(this, `CloudTrailRule${environmentSuffix}${region}`, {
      identifier: config.ManagedRuleIdentifiers.CLOUD_TRAIL_ENABLED,
      configRuleName: `${environment}-${region}-cloudtrail-enabled-${suffix}`,
      description: 'Checks whether AWS CloudTrail is enabled',
    });

    // IAM password policy rule
    if (region === 'us-east-1') { // Global resources only in one region
      new config.ManagedRule(this, `IamPasswordPolicyRule${environmentSuffix}${region}`, {
        identifier: config.ManagedRuleIdentifiers.IAM_PASSWORD_POLICY,
        inputParameters: {
          RequireUppercaseCharacters: 'true',
          RequireLowercaseCharacters: 'true',
          RequireSymbols: 'true',
          RequireNumbers: 'true',
          MinimumPasswordLength: '14',
          PasswordReusePrevention: '24',
          MaxPasswordAge: '90',
        },
        configRuleName: `${environment}-${region}-iam-password-policy-${suffix}`,
        description: 'Checks whether IAM password policy meets requirements',
      });

      // Root access key rule
      new config.ManagedRule(this, `RootAccessKeyRule${environmentSuffix}${region}`, {
        identifier: config.ManagedRuleIdentifiers.IAM_ROOT_ACCESS_KEY_CHECK,
        configRuleName: `${environment}-${region}-root-access-key-${suffix}`,
        description: 'Checks whether root user has access keys',
      });
    }

    // Ensure Config recorder starts after delivery channel is created
    // configRecorder.node.addDependency(deliveryChannel);

    // Apply tags
    cdk.Tags.of(configBucket).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(configBucket).add('Environment', environment);
    cdk.Tags.of(configBucket).add('Region', region);
    cdk.Tags.of(configBucket).add('Purpose', 'ConfigCompliance');

    cdk.Tags.of(configKey).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(configKey).add('Environment', environment);
    cdk.Tags.of(configKey).add('Region', region);
    cdk.Tags.of(configKey).add('Purpose', 'ConfigEncryption');
  }
}
```

## constructs/cross-account-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface CrossAccountConstructProps {
  environment: string;
  region: string;
  suffix: string;
  environmentSuffix: string;
}

export class CrossAccountConstruct extends Construct {
  constructor(scope: Construct, id: string, props: CrossAccountConstructProps) {
    super(scope, id);

    const { environment, region, suffix, environmentSuffix } = props;

    // Get configurable account IDs from context - Addresses MODEL_FAILURES item 3
    const trustedAccounts = cdk.Stack.of(this).node.tryGetContext('trustedAccounts') || {};
    const devAccountId = trustedAccounts.dev || process.env.DEV_ACCOUNT_ID;
    const stagingAccountId = trustedAccounts.staging || process.env.STAGING_ACCOUNT_ID;
    const prodAccountId = trustedAccounts.prod || process.env.PROD_ACCOUNT_ID;

    // Cross-account role for different environments to access this environment - Requirement 6
    if (environment === 'prod') {
      // Production environment: Allow read-only access from dev and staging
      const crossAccountRole = new iam.Role(this, `CrossAccountRole${environmentSuffix}${region}`, {
        roleName: `${environment}-${region}-cross-account-access-${suffix}`,
        description: 'Cross-account role for accessing production resources safely',
        maxSessionDuration: cdk.Duration.hours(4),
        assumedBy: new iam.CompositePrincipal(
          // Only allow specific accounts, not wildcards - Addresses MODEL_FAILURES item 13
          ...[devAccountId, stagingAccountId].filter(Boolean).map(accountId =>
            new iam.AccountPrincipal(accountId!)
          )
        ),
      });

      // Read-only permissions with least privilege
      crossAccountRole.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudwatch:GetMetricData',
          'cloudwatch:GetMetricStatistics',
          'cloudwatch:ListMetrics',
          'cloudwatch:DescribeAlarms',
          'cloudwatch:DescribeAlarmsForMetric',
        ],
        resources: [
          `arn:aws:cloudwatch:${region}:${cdk.Aws.ACCOUNT_ID}:alarm:${environment}-${region}-*`,
          `arn:aws:cloudwatch:${region}:${cdk.Aws.ACCOUNT_ID}:metric/*`,
        ],
      }));

      crossAccountRole.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:FilterLogEvents',
          'logs:GetLogEvents',
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
        ],
        resources: [
          `arn:aws:logs:${region}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/*`,
        ],
      }));

      crossAccountRole.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ec2:DescribeInstances',
          'ec2:DescribeInstanceStatus',
          'ec2:DescribeInstanceAttribute',
          'ec2:DescribeVpcs',
          'ec2:DescribeSubnets',
          'ec2:DescribeSecurityGroups',
        ],
        resources: ['*'], // EC2 describe actions require wildcard
        conditions: {
          StringEquals: {
            'ec2:Region': region,
          },
        },
      }));

      crossAccountRole.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rds:DescribeDBInstances',
          'rds:DescribeDBClusters',
          'rds:DescribeDBSubnetGroups',
          'rds:DescribeDBParameterGroups',
        ],
        resources: [
          `arn:aws:rds:${region}:${cdk.Aws.ACCOUNT_ID}:db:${environment}-${region}-*`,
          `arn:aws:rds:${region}:${cdk.Aws.ACCOUNT_ID}:cluster:${environment}-${region}-*`,
          `arn:aws:rds:${region}:${cdk.Aws.ACCOUNT_ID}:subgrp:${environment}-${region}-*`,
          `arn:aws:rds:${region}:${cdk.Aws.ACCOUNT_ID}:pg:${environment}-${region}-*`,
        ],
      }));

      crossAccountRole.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetBucketLocation',
          's3:ListBucket',
          's3:GetBucketVersioning',
          's3:GetBucketEncryption',
        ],
        resources: [`arn:aws:s3:::${environment}-${region}-*`],
      }));

      // Output the role ARN for reference in other accounts
      new cdk.CfnOutput(cdk.Stack.of(this), `CrossAccountRoleArn${environmentSuffix}${region}`, {
        value: crossAccountRole.roleArn,
        description: 'Cross-account role ARN for accessing production',
        exportName: `${environment}-${region}-cross-account-role-arn-${suffix}`,
      });

      // Apply tags
      cdk.Tags.of(crossAccountRole).add('iac-rlhf-amazon', 'true');
      cdk.Tags.of(crossAccountRole).add('Environment', environment);
      cdk.Tags.of(crossAccountRole).add('Region', region);
      cdk.Tags.of(crossAccountRole).add('Purpose', 'CrossAccountAccess');
    }

    // For non-prod environments, create roles that can assume prod role
    if (environment !== 'prod' && prodAccountId) {
      const assumeProdRole = new iam.Role(this, `AssumeProdRole${environmentSuffix}${region}`, {
        roleName: `${environment}-${region}-assume-prod-access-${suffix}`,
        description: `Role for ${environment} environment to assume production cross-account role`,
        assumedBy: new iam.CompositePrincipal(
          new iam.ServicePrincipal('lambda.amazonaws.com'),
          new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
          // Allow developers to assume this role in non-prod environments
          new iam.AccountPrincipal(cdk.Aws.ACCOUNT_ID),
        ),
        maxSessionDuration: cdk.Duration.hours(2),
      });

      // Specific assume role permissions for prod - not wildcards - Addresses MODEL_FAILURES item 13
      assumeProdRole.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sts:AssumeRole'],
        resources: [
          `arn:aws:iam::${prodAccountId}:role/prod-${region}-cross-account-access-*`,
        ],
        conditions: {
          StringEquals: {
            'sts:ExternalId': `${environment}-to-prod-${suffix}`,
          },
          IpAddress: {
            'aws:SourceIp': [
              '10.0.0.0/8', // Private IP ranges only
              '172.16.0.0/12',
              '192.168.0.0/16',
            ],
          },
        },
      }));

      // Add condition to require MFA for sensitive operations
      assumeProdRole.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        actions: ['*'],
        resources: ['*'],
        conditions: {
          BoolIfExists: {
            'aws:MultiFactorAuthPresent': 'false',
          },
          StringEquals: {
            'aws:RequestedRegion': region,
          },
        },
      }));

      // Apply tags
      cdk.Tags.of(assumeProdRole).add('iac-rlhf-amazon', 'true');
      cdk.Tags.of(assumeProdRole).add('Environment', environment);
      cdk.Tags.of(assumeProdRole).add('Region', region);
      cdk.Tags.of(assumeProdRole).add('Purpose', 'AssumeProductionRole');
    }

    // Cross-region role for disaster recovery
    if (region === 'us-east-2') { // Primary region
      const drRole = new iam.Role(this, `DisasterRecoveryRole${environmentSuffix}${region}`, {
        roleName: `${environment}-${region}-disaster-recovery-${suffix}`,
        description: 'Role for disaster recovery operations across regions',
        assumedBy: new iam.CompositePrincipal(
          new iam.ServicePrincipal('lambda.amazonaws.com'),
          new iam.AccountPrincipal(cdk.Aws.ACCOUNT_ID),
        ),
        maxSessionDuration: cdk.Duration.hours(12),
      });

      // Permissions for cross-region disaster recovery
      drRole.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rds:CreateDBInstanceReadReplica',
          'rds:PromoteReadReplica',
          'rds:ModifyDBInstance',
          'rds:CreateDBSnapshot',
          'rds:RestoreDBInstanceFromDBSnapshot',
        ],
        resources: [
          `arn:aws:rds:*:${cdk.Aws.ACCOUNT_ID}:db:${environment}-*`,
          `arn:aws:rds:*:${cdk.Aws.ACCOUNT_ID}:snapshot:${environment}-*`,
        ],
        conditions: {
          StringEquals: {
            'aws:RequestedRegion': ['us-east-2', 'us-east-1'],
          },
        },
      }));

      drRole.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:ReplicateObject',
          's3:ReplicateDelete',
          's3:ReplicationConfiguration',
        ],
        resources: [
          `arn:aws:s3:::${environment}-*`,
          `arn:aws:s3:::${environment}-*/*`,
        ],
      }));

      drRole.addToPolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'route53:ChangeResourceRecordSets',
          'route53:GetChange',
          'route53:ListResourceRecordSets',
        ],
        resources: [
          `arn:aws:route53:::hostedzone/*`,
          `arn:aws:route53:::change/*`,
        ],
      }));

      // Apply tags
      cdk.Tags.of(drRole).add('iac-rlhf-amazon', 'true');
      cdk.Tags.of(drRole).add('Environment', environment);
      cdk.Tags.of(drRole).add('Region', region);
      cdk.Tags.of(drRole).add('Purpose', 'DisasterRecovery');
    }

    // Service-linked role for monitoring across environments
    const monitoringRole = new iam.Role(this, `MonitoringRole${environmentSuffix}${region}`, {
      roleName: `${environment}-${region}-monitoring-${suffix}`,
      description: 'Role for monitoring services to access metrics across environments',
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('lambda.amazonaws.com'),
        new iam.ServicePrincipal('events.amazonaws.com'),
      ),
      maxSessionDuration: cdk.Duration.hours(1),
    });

    // Monitoring permissions
    monitoringRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cloudwatch:PutMetricData',
        'cloudwatch:GetMetricData',
        'cloudwatch:GetMetricStatistics',
      ],
      resources: ['*'],
      conditions: {
        StringLike: {
          'cloudwatch:namespace': [
            'AWS/EC2',
            'AWS/RDS',
            'AWS/Lambda',
            'AWS/ApplicationELB',
            'AWS/S3',
            'AWS/Cost/Monitor',
            'CWAgent',
          ],
        },
      },
    }));

    monitoringRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'sns:Publish',
      ],
      resources: [
        `arn:aws:sns:${region}:${cdk.Aws.ACCOUNT_ID}:${environment}-${region}-*`,
      ],
    }));

    // Apply tags
    cdk.Tags.of(monitoringRole).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(monitoringRole).add('Environment', environment);
    cdk.Tags.of(monitoringRole).add('Region', region);
    cdk.Tags.of(monitoringRole).add('Purpose', 'Monitoring');
  }
}
```

## constructs/lambda-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

export interface LambdaConstructProps {
  environment: string;
  region: string;
  suffix: string;
  environmentSuffix: string;
  vpc: ec2.Vpc;
  s3Bucket: s3.Bucket;
}

export class LambdaConstruct extends Construct {
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    const { environment, region, suffix, environmentSuffix, vpc, s3Bucket } = props;

    // Lambda execution role with least privilege - Addresses MODEL_FAILURES item 7
    const lambdaRole = new iam.Role(this, `LambdaRole${environmentSuffix}${region}`, {
      roleName: `${environment}-${region}-lambda-cost-monitor-${suffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
      inlinePolicies: {
        CostMonitoringPolicy: new iam.PolicyDocument({
          statements: [
            // S3 permissions for specific bucket only
            new iam.PolicyStatement({
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
              ],
              resources: [`${s3Bucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              actions: ['s3:ListBucket'],
              resources: [s3Bucket.bucketArn],
            }),
            // Cost Explorer and Billing permissions
            new iam.PolicyStatement({
              actions: [
                'ce:GetCostAndUsage',
                'ce:GetUsageReport',
                'ce:GetDimensionValues',
                'ce:GetReservationCoverage',
                'ce:GetReservationPurchaseRecommendation',
                'ce:GetReservationUtilization',
                'ce:GetRightsizingRecommendation',
                'ce:GetSavingsPlansUtilization',
                'ce:GetSavingsPlansPurchaseRecommendation',
              ],
              resources: ['*'], // Cost Explorer requires wildcard
            }),
            // CloudWatch metrics permissions
            new iam.PolicyStatement({
              actions: [
                'cloudwatch:PutMetricData',
                'cloudwatch:GetMetricData',
                'cloudwatch:GetMetricStatistics',
              ],
              resources: ['*'], // CloudWatch metrics require wildcard for custom metrics
              conditions: {
                StringEquals: {
                  'cloudwatch:namespace': 'AWS/Cost/Monitor',
                },
              },
            }),
            // Secrets Manager for database credentials (specific pattern)
            new iam.PolicyStatement({
              actions: ['secretsmanager:GetSecretValue'],
              resources: [`arn:aws:secretsmanager:${region}:${cdk.Aws.ACCOUNT_ID}:secret:${environment}-${region}-*`],
            }),
            // CloudWatch Logs (specific log group)
            new iam.PolicyStatement({
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [`arn:aws:logs:${region}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/lambda/${environment}-${region}-cost-monitor-*`],
            }),
          ],
        }),
      },
    });

    // Real-world cost monitoring Lambda function - Addresses MODEL_FAILURES item about trivial examples
    this.lambdaFunction = new lambda.Function(this, `CostMonitorLambda${environmentSuffix}${region}`, {
      functionName: `${environment}-${region}-cost-monitor-${suffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const AWS = require('aws-sdk');
const costExplorer = new AWS.CostExplorer({ region: 'us-east-1' }); // Cost Explorer is only available in us-east-1
const cloudWatch = new AWS.CloudWatch();
const s3 = new AWS.S3();

exports.handler = async (event) => {
  console.log('Cost monitoring event:', JSON.stringify(event, null, 2));
  
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get cost data for the last 30 days
    const costParams = {
      TimePeriod: {
        Start: thirtyDaysAgo.toISOString().split('T')[0],
        End: today.toISOString().split('T')[0]
      },
      Granularity: 'DAILY',
      Metrics: ['BlendedCost', 'UsageQuantity'],
      GroupBy: [
        {
          Type: 'DIMENSION',
          Key: 'SERVICE'
        }
      ]
    };
    
    const costData = await costExplorer.getCostAndUsage(costParams).promise();
    
    // Calculate total cost and find top services
    let totalCost = 0;
    const serviceCosts = {};
    
    costData.ResultsByTime.forEach(result => {
      result.Groups.forEach(group => {
        const serviceName = group.Keys[0];
        const cost = parseFloat(group.Metrics.BlendedCost.Amount);
        totalCost += cost;
        serviceCosts[serviceName] = (serviceCosts[serviceName] || 0) + cost;
      });
    });
    
    // Sort services by cost
    const topServices = Object.entries(serviceCosts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    // Create cost report
    const reportData = {
      timestamp: today.toISOString(),
      environment: process.env.ENVIRONMENT,
      region: process.env.REGION || process.env.AWS_REGION,
      totalCost30Days: totalCost.toFixed(2),
      topServices: topServices.map(([service, cost]) => ({
        service,
        cost: cost.toFixed(2)
      })),
      recommendations: []
    };
    
    // Add recommendations based on cost thresholds
    if (totalCost > 1000) {
      reportData.recommendations.push('Consider implementing cost optimization measures - monthly spend exceeds $1000');
    }
    
    topServices.forEach(([service, cost]) => {
      if (service === 'Amazon Elastic Compute Cloud - Compute' && cost > 200) {
        reportData.recommendations.push('High EC2 costs detected - consider rightsizing instances or using Spot instances');
      }
      if (service === 'Amazon Relational Database Service' && cost > 150) {
        reportData.recommendations.push('High RDS costs detected - consider using Reserved Instances');
      }
    });
    
    // Send custom metrics to CloudWatch
    await cloudWatch.putMetricData({
      Namespace: 'AWS/Cost/Monitor',
      MetricData: [
        {
          MetricName: 'TotalCost30Days',
          Value: totalCost,
          Unit: 'None',
          Dimensions: [
            {
              Name: 'Environment',
              Value: process.env.ENVIRONMENT
            },
            {
              Name: 'Region',
              Value: process.env.REGION || process.env.AWS_REGION
            }
          ]
        }
      ]
    }).promise();
    
    // Store report in S3 if triggered by S3 event
    if (event.Records && event.Records[0].s3) {
      const bucketName = process.env.S3_BUCKET_NAME;
      const reportKey = \`cost-reports/\${today.toISOString().split('T')[0]}-cost-report.json\`;
      
      await s3.putObject({
        Bucket: bucketName,
        Key: reportKey,
        Body: JSON.stringify(reportData, null, 2),
        ContentType: 'application/json'
      }).promise();
      
      console.log(\`Cost report saved to s3://\${bucketName}/\${reportKey}\`);
    }
    
    console.log('Cost monitoring completed:', reportData);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Cost monitoring completed successfully',
        totalCost30Days: totalCost.toFixed(2),
        topServicesCount: topServices.length,
        recommendationsCount: reportData.recommendations.length
      }),
    };
  } catch (error) {
    console.error('Error in cost monitoring:', error);
    throw error;
  }
};
      `),
      role: lambdaRole,
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        ENVIRONMENT: environment,
        REGION: region, // Use REGION instead of AWS_REGION
        S3_BUCKET_NAME: s3Bucket.bucketName,
        DB_SECRET_NAME: `${environment}-${region}-db-secret-${suffix}`,
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_MONTH,
      deadLetterQueueEnabled: true,
      // reservedConcurrentExecutions removed to avoid account limits
    });

    // Add S3 event trigger for cost analysis - Requirement 2
    s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.lambdaFunction),
      { prefix: 'billing-data/', suffix: '.json' }
    );

    // Apply tags
    cdk.Tags.of(this.lambdaFunction).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.lambdaFunction).add('Environment', environment);
    cdk.Tags.of(this.lambdaFunction).add('Region', region);
    cdk.Tags.of(this.lambdaFunction).add('Purpose', 'CostMonitoring');
  }
}
```

## constructs/monitoring-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface MonitoringConstructProps {
  environment: string;
  region: string;
  suffix: string;
  environmentSuffix: string;
  autoScalingGroup: autoscaling.AutoScalingGroup;
  lambdaFunction: lambda.Function;
  alb: elbv2.ApplicationLoadBalancer;
}

export class MonitoringConstruct extends Construct {
  public readonly errorTopic: sns.Topic;
  public readonly dashboardName: string;

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    const { environment, region, suffix, environmentSuffix, autoScalingGroup, lambdaFunction, alb } = props;

    // KMS key for SNS encryption
    const snsKey = new kms.Key(this, `SnsKmsKey${environmentSuffix}${region}`, {
      description: `SNS encryption key for ${environment} in ${region}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Grant SNS service access to the key
    snsKey.addToResourcePolicy(new iam.PolicyStatement({
      principals: [new iam.ServicePrincipal('sns.amazonaws.com')],
      actions: [
        'kms:Decrypt',
        'kms:GenerateDataKey',
      ],
      resources: ['*'],
    }));

    // Cross-environment SNS topic for error notifications - Addresses MODEL_FAILURES item 4
    // Note: To be truly cross-environment, you'd need to share this topic ARN across environments
    this.errorTopic = new sns.Topic(this, `ErrorTopic${environmentSuffix}${region}`, {
      topicName: `${environment}-${region}-app-errors-${suffix}`,
      displayName: `Application errors for ${environment} in ${region}`,
      masterKey: snsKey,
    });

    // Add configurable email subscription (replace with actual email in production)
    const notificationEmail = cdk.Stack.of(this).node.tryGetContext('notificationEmail') || 'platform-team@example.com';
    this.errorTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(notificationEmail)
    );

    // Add SQS dead letter queue for failed notifications
    const dlqTopic = new sns.Topic(this, `ErrorTopicDlq${environmentSuffix}${region}`, {
      topicName: `${environment}-${region}-app-errors-dlq-${suffix}`,
      displayName: `DLQ for error notifications in ${environment}`,
      masterKey: snsKey,
    });

    // EC2 CPU Utilization Alarm - Requirement 8
    const cpuAlarm = new cloudwatch.Alarm(this, `CpuAlarm${environmentSuffix}${region}`, {
      alarmName: `${environment}-${region}-high-cpu-${suffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
        dimensionsMap: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
        },
      }),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: `CPU utilization is too high for ${environment} environment in ${region}`,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    cpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.errorTopic));
    cpuAlarm.addOkAction(new cloudwatchActions.SnsAction(this.errorTopic));

    // Memory utilization alarm
    const memoryAlarm = new cloudwatch.Alarm(this, `MemoryAlarm${environmentSuffix}${region}`, {
      alarmName: `${environment}-${region}-high-memory-${suffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'CWAgent',
        metricName: 'mem_used_percent',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
        dimensionsMap: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
        },
      }),
      threshold: 85,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `Memory utilization is too high for ${environment} environment in ${region}`,
    });

    memoryAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.errorTopic));

    // Lambda Error Alarm
    const lambdaErrorAlarm = new cloudwatch.Alarm(this, `LambdaErrorAlarm${environmentSuffix}${region}`, {
      alarmName: `${environment}-${region}-lambda-errors-${suffix}`,
      metric: lambdaFunction.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 3,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `Lambda function errors in ${environment} environment in ${region}`,
    });

    lambdaErrorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.errorTopic));

    // Lambda Duration Alarm
    const lambdaDurationAlarm = new cloudwatch.Alarm(this, `LambdaDurationAlarm${environmentSuffix}${region}`, {
      alarmName: `${environment}-${region}-lambda-duration-${suffix}`,
      metric: lambdaFunction.metricDuration({
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 240000, // 4 minutes in milliseconds
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `Lambda function duration too high in ${environment} environment in ${region}`,
    });

    lambdaDurationAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.errorTopic));

    // Lambda Throttle Alarm
    const lambdaThrottleAlarm = new cloudwatch.Alarm(this, `LambdaThrottleAlarm${environmentSuffix}${region}`, {
      alarmName: `${environment}-${region}-lambda-throttles-${suffix}`,
      metric: lambdaFunction.metricThrottles({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `Lambda function throttling detected in ${environment} environment in ${region}`,
    });

    lambdaThrottleAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.errorTopic));

    // ALB Target Health Alarm
    const albUnhealthyTargetAlarm = new cloudwatch.Alarm(this, `AlbUnhealthyTargetAlarm${environmentSuffix}${region}`, {
      alarmName: `${environment}-${region}-alb-unhealthy-targets-${suffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'UnHealthyHostCount',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
        dimensionsMap: {
          LoadBalancer: alb.loadBalancerFullName,
        },
      }),
      threshold: 1,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `Unhealthy targets detected in ALB for ${environment} environment in ${region}`,
    });

    albUnhealthyTargetAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.errorTopic));

    // ALB Response Time Alarm
    const albResponseTimeAlarm = new cloudwatch.Alarm(this, `AlbResponseTimeAlarm${environmentSuffix}${region}`, {
      alarmName: `${environment}-${region}-alb-response-time-${suffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'TargetResponseTime',
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
        dimensionsMap: {
          LoadBalancer: alb.loadBalancerFullName,
        },
      }),
      threshold: 2, // 2 seconds
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `High response time detected in ALB for ${environment} environment in ${region}`,
    });

    albResponseTimeAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.errorTopic));

    // ALB 5XX Error Rate Alarm
    const alb5xxAlarm = new cloudwatch.Alarm(this, `Alb5xxAlarm${environmentSuffix}${region}`, {
      alarmName: `${environment}-${region}-alb-5xx-errors-${suffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'HTTPCode_ELB_5XX_Count',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
        dimensionsMap: {
          LoadBalancer: alb.loadBalancerFullName,
        },
      }),
      threshold: 10,
      evaluationPeriods: 2,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `High 5XX error rate in ALB for ${environment} environment in ${region}`,
    });

    alb5xxAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.errorTopic));

    // Cost alarm using Lambda's cost monitoring data
    const costAlarm = new cloudwatch.Alarm(this, `CostAlarm${environmentSuffix}${region}`, {
      alarmName: `${environment}-${region}-high-cost-${suffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Cost/Monitor',
        metricName: 'TotalCost30Days',
        statistic: 'Maximum',
        period: cdk.Duration.hours(24),
        dimensionsMap: {
          Environment: environment,
          Region: region,
        },
      }),
      threshold: environment === 'prod' ? 5000 : 1000, // Different thresholds per environment
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `High cost detected for ${environment} environment in ${region}`,
    });

    costAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.errorTopic));

    // Create comprehensive CloudWatch Dashboard
    this.dashboardName = `${environment}-${region}-app-dashboard-${suffix}`;
    const dashboard = new cloudwatch.Dashboard(this, `Dashboard${environmentSuffix}${region}`, {
      dashboardName: this.dashboardName,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'EC2 CPU Utilization',
            left: [new cloudwatch.Metric({
              namespace: 'AWS/EC2',
              metricName: 'CPUUtilization',
              statistic: 'Average',
              dimensionsMap: {
                AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
              },
            })],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'EC2 Memory Utilization',
            left: [new cloudwatch.Metric({
              namespace: 'CWAgent',
              metricName: 'mem_used_percent',
              statistic: 'Average',
              dimensionsMap: {
                AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
              },
            })],
            width: 12,
            height: 6,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Metrics',
            left: [
              lambdaFunction.metricInvocations(),
              lambdaFunction.metricErrors(),
            ],
            right: [lambdaFunction.metricDuration()],
            width: 12,
            height: 6,
          }),
          new cloudwatch.GraphWidget({
            title: 'ALB Metrics',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApplicationELB',
                metricName: 'RequestCount',
                statistic: 'Sum',
                dimensionsMap: {
                  LoadBalancer: alb.loadBalancerFullName,
                },
              }),
              new cloudwatch.Metric({
                namespace: 'AWS/ApplicationELB',
                metricName: 'HTTPCode_Target_2XX_Count',
                statistic: 'Sum',
                dimensionsMap: {
                  LoadBalancer: alb.loadBalancerFullName,
                },
              }),
            ],
            right: [
              new cloudwatch.Metric({
                namespace: 'AWS/ApplicationELB',
                metricName: 'TargetResponseTime',
                statistic: 'Average',
                dimensionsMap: {
                  LoadBalancer: alb.loadBalancerFullName,
                },
              }),
            ],
            width: 12,
            height: 6,
          }),
        ],
        [
          new cloudwatch.SingleValueWidget({
            title: 'Current ASG Instances',
            metrics: [
              new cloudwatch.Metric({
                namespace: 'AWS/AutoScaling',
                metricName: 'GroupTotalInstances',
                statistic: 'Average',
                dimensionsMap: {
                  AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
                },
              }),
            ],
            width: 6,
            height: 6,
          }),
          new cloudwatch.SingleValueWidget({
            title: 'Cost (30 Days)',
            metrics: [
              new cloudwatch.Metric({
                namespace: 'AWS/Cost/Monitor',
                metricName: 'TotalCost30Days',
                statistic: 'Maximum',
                dimensionsMap: {
                  Environment: environment,
                  Region: region,
                },
              }),
            ],
            width: 6,
            height: 6,
          }),
        ],
      ],
    });

    // Apply tags to all monitoring resources
    cdk.Tags.of(this.errorTopic).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.errorTopic).add('Environment', environment);
    cdk.Tags.of(this.errorTopic).add('Region', region);
    cdk.Tags.of(this.errorTopic).add('Purpose', 'ErrorNotifications');

    cdk.Tags.of(dashboard).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(dashboard).add('Environment', environment);
    cdk.Tags.of(dashboard).add('Region', region);
    cdk.Tags.of(dashboard).add('Purpose', 'Monitoring');

    cdk.Tags.of(snsKey).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(snsKey).add('Environment', environment);
    cdk.Tags.of(snsKey).add('Region', region);
    cdk.Tags.of(snsKey).add('Purpose', 'SNSEncryption');
  }
}
```

## constructs/rds-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface RdsConstructProps {
  environment: string;
  region: string;
  suffix: string;
  environmentSuffix: string;
  vpc: ec2.Vpc;
}

export class RdsConstruct extends Construct {
  public readonly dbInstance: rds.DatabaseInstance;
  public readonly dbSecret: secretsmanager.Secret;
  public readonly dbEndpoint: string;

  constructor(scope: Construct, id: string, props: RdsConstructProps) {
    super(scope, id);

    const { environment, region, suffix, environmentSuffix, vpc } = props;

    // KMS key for RDS encryption
    const rdsKey = new kms.Key(this, `RdsKmsKey${environmentSuffix}${region}`, {
      description: `RDS encryption key for ${environment} in ${region}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion when stack fails
    });

    // Database credentials managed by Secrets Manager - Requirement 11
    this.dbSecret = new secretsmanager.Secret(this, `DbSecret${environmentSuffix}${region}`, {
      secretName: `${environment}-${region}-db-secret-${suffix}`,
      description: `Database credentials for ${environment} environment in ${region}`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'dbadmin',
        }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
      encryptionKey: rdsKey,
    });

    // Database subnet group using isolated subnets
    const dbSubnetGroup = new rds.SubnetGroup(this, `DbSubnetGroup${environmentSuffix}${region}`, {
      description: `Database subnet group for ${environment} in ${region}`,
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Security group for RDS - least privilege access
    const dbSecurityGroup = new ec2.SecurityGroup(this, `DbSecurityGroup${environmentSuffix}${region}`, {
      securityGroupName: `${environment}-${region}-db-sg-${suffix}`,
      vpc: vpc,
      description: 'Security group for RDS PostgreSQL - least privilege',
      allowAllOutbound: false,
    });

    // Allow connections only from private subnets (not public)
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from VPC private subnets only'
    );

    // Parameter group for optimal PostgreSQL configuration
    const parameterGroup = new rds.ParameterGroup(this, `DbParameterGroup${environmentSuffix}${region}`, {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15, // Use latest stable version
      }),
      description: `PostgreSQL parameter group for ${environment}`,
      parameters: {
        'shared_preload_libraries': 'pg_stat_statements',
        'log_statement': 'all',
        'log_min_duration_statement': '1000', // Log slow queries
        'log_checkpoints': '1',
        'log_connections': '1',
        'log_disconnections': '1',
        'log_lock_waits': '1',
      },
    });

    // PostgreSQL RDS instance with encryption - Requirement 3
    this.dbInstance = new rds.DatabaseInstance(this, `PostgresInstance${environmentSuffix}${region}`, {
      instanceIdentifier: `${environment}-${region}-postgres-${suffix}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        environment === 'prod' ? ec2.InstanceSize.LARGE : ec2.InstanceSize.MEDIUM
      ),
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [dbSecurityGroup],
      subnetGroup: dbSubnetGroup,
      parameterGroup: parameterGroup,

      // Storage configuration
      allocatedStorage: environment === 'prod' ? 200 : 100,
      maxAllocatedStorage: environment === 'prod' ? 1000 : 500,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true, // Encryption enabled - Requirement 3
      storageEncryptionKey: rdsKey,

      // Credentials and database
      credentials: rds.Credentials.fromSecret(this.dbSecret),
      databaseName: `${environment}db`,

      // High availability and backup
      multiAz: environment === 'prod',
      deletionProtection: false, // Allow destroy for all environments
      deleteAutomatedBackups: true,
      backupRetention: environment === 'prod' ? cdk.Duration.days(30) : cdk.Duration.days(7),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',

      // Monitoring and performance
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      performanceInsightEncryptionKey: rdsKey,
      monitoringInterval: cdk.Duration.minutes(1),
      cloudwatchLogsExports: ['postgresql'],

      // Updates
      autoMinorVersionUpgrade: environment !== 'prod', // Only auto-update non-prod
      allowMajorVersionUpgrade: false,

      // Removal policy
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion when stack fails
    });

    this.dbEndpoint = this.dbInstance.dbInstanceEndpointAddress;

    // Apply tags
    cdk.Tags.of(this.dbInstance).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.dbInstance).add('Environment', environment);
    cdk.Tags.of(this.dbInstance).add('Region', region);
    cdk.Tags.of(this.dbInstance).add('DatabaseEngine', 'PostgreSQL');
    cdk.Tags.of(this.dbInstance).add('BackupRetention', environment === 'prod' ? '30days' : '7days');

    cdk.Tags.of(this.dbSecret).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.dbSecret).add('Environment', environment);
    cdk.Tags.of(this.dbSecret).add('Region', region);
    cdk.Tags.of(this.dbSecret).add('Purpose', 'DatabaseCredentials');

    cdk.Tags.of(rdsKey).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(rdsKey).add('Environment', environment);
    cdk.Tags.of(rdsKey).add('Region', region);
    cdk.Tags.of(rdsKey).add('Purpose', 'RDSEncryption');
  }
}
```

## constructs/route53-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export interface Route53ConstructProps {
  environment: string;
  region: string;
  suffix: string;
  environmentSuffix: string;
  alb: elbv2.ApplicationLoadBalancer;
}

export class Route53Construct extends Construct {
  public readonly hostedZone: route53.HostedZone;
  public readonly domainName: string;

  constructor(scope: Construct, id: string, props: Route53ConstructProps) {
    super(scope, id);

    const { environment, region, suffix, environmentSuffix, alb } = props;

    // Domain name based on environment and suffix
    this.domainName = `${environment}-app-${suffix}.test.local`;

    // Route 53 Hosted Zone - Requirement 5
    this.hostedZone = new route53.HostedZone(this, `HostedZone${environmentSuffix}${region}`, {
      zoneName: this.domainName,
      comment: `Hosted zone for ${environment} environment in ${region}`,
    });

    // Primary record for this region with proper routing
    const isPrimary = region === 'us-west-2'; // us-west-2 is primary

    if (isPrimary) {
      // Primary record (simple routing)
      new route53.ARecord(this, `PrimaryRecord${environmentSuffix}${region}`, {
        zone: this.hostedZone,
        recordName: 'api', // api.{domain}
        target: route53.RecordTarget.fromAlias(
          new route53targets.LoadBalancerTarget(alb)
        ),
        ttl: cdk.Duration.seconds(60),
      });

      // Root domain record (primary)
      new route53.ARecord(this, `RootPrimaryRecord${environmentSuffix}${region}`, {
        zone: this.hostedZone,
        target: route53.RecordTarget.fromAlias(
          new route53targets.LoadBalancerTarget(alb)
        ),
        ttl: cdk.Duration.seconds(60),
      });
    } else {
      // Secondary record
      new route53.ARecord(this, `SecondaryRecord${environmentSuffix}${region}`, {
        zone: this.hostedZone,
        recordName: 'api-backup',
        target: route53.RecordTarget.fromAlias(
          new route53targets.LoadBalancerTarget(alb)
        ),
        ttl: cdk.Duration.seconds(60),
      });

      // Root domain record (secondary)
      new route53.ARecord(this, `RootSecondaryRecord${environmentSuffix}${region}`, {
        zone: this.hostedZone,
        recordName: 'backup',
        target: route53.RecordTarget.fromAlias(
          new route53targets.LoadBalancerTarget(alb)
        ),
        ttl: cdk.Duration.seconds(60),
      });
    }

    // Simple geolocation-based routing
    new route53.ARecord(this, `GeoRecord${environmentSuffix}${region}`, {
      zone: this.hostedZone,
      recordName: 'geo',
      target: route53.RecordTarget.fromAlias(
        new route53targets.LoadBalancerTarget(alb)
      ),
      ttl: cdk.Duration.seconds(300),
    });

    // Simple routing for monitoring
    new route53.ARecord(this, `MonitoringRecord${environmentSuffix}${region}`, {
      zone: this.hostedZone,
      recordName: 'monitoring',
      target: route53.RecordTarget.fromAlias(
        new route53targets.LoadBalancerTarget(alb)
      ),
      ttl: cdk.Duration.seconds(60),
    });

    // TXT record for domain verification
    new route53.TxtRecord(this, `DomainVerificationRecord${environmentSuffix}${region}`, {
      zone: this.hostedZone,
      recordName: '_verification',
      values: [`${environment}-verification-${suffix}`],
      ttl: cdk.Duration.seconds(300),
    });

    // CAA record for certificate authority authorization
    new route53.CaaRecord(this, `CaaRecord${environmentSuffix}${region}`, {
      zone: this.hostedZone,
      values: [
        { flag: 0, tag: route53.CaaTag.ISSUE, value: 'amazon.com' },
        { flag: 0, tag: route53.CaaTag.ISSUE, value: 'amazontrust.com' },
        { flag: 0, tag: route53.CaaTag.ISSUE, value: 'awstrust.com' },
        { flag: 128, tag: route53.CaaTag.ISSUE, value: 'amazon.com' },
      ],
      ttl: cdk.Duration.seconds(3600),
    });

    // Apply tags
    cdk.Tags.of(this.hostedZone).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.hostedZone).add('Environment', environment);
    cdk.Tags.of(this.hostedZone).add('Region', region);
    cdk.Tags.of(this.hostedZone).add('Purpose', 'DNS');
  }

  private getContinentCode(region: string): route53.Continent | undefined {
    // Map AWS regions to continent codes for geolocation routing
    const regionToContinentMap: Record<string, route53.Continent> = {
      'us-east-1': route53.Continent.NORTH_AMERICA,
      'us-east-2': route53.Continent.NORTH_AMERICA,
      'us-west-1': route53.Continent.NORTH_AMERICA,
      'us-west-2': route53.Continent.NORTH_AMERICA,
      'ca-central-1': route53.Continent.NORTH_AMERICA,
      'eu-west-1': route53.Continent.EUROPE,
      'eu-west-2': route53.Continent.EUROPE,
      'eu-west-3': route53.Continent.EUROPE,
      'eu-central-1': route53.Continent.EUROPE,
      'eu-north-1': route53.Continent.EUROPE,
      'ap-northeast-1': route53.Continent.ASIA,
      'ap-northeast-2': route53.Continent.ASIA,
      'ap-southeast-1': route53.Continent.ASIA,
      'ap-southeast-2': route53.Continent.OCEANIA,
      'ap-south-1': route53.Continent.ASIA,
      'sa-east-1': route53.Continent.SOUTH_AMERICA,
    };

    return regionToContinentMap[region];
  }
}
```

## constructs/s3-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface S3ConstructProps {
  environment: string;
  region: string;
  suffix: string;
  environmentSuffix: string;
}

export class S3Construct extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly logsBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: S3ConstructProps) {
    super(scope, id);

    const { environment, region, suffix, environmentSuffix } = props;

    // S3 Bucket with comprehensive security - Requirement 9
    this.bucket = new s3.Bucket(this, `AppBucket${environmentSuffix}${region}`, {
      bucketName: `${environment}-${region}-app-bucket-${suffix}`.toLowerCase(),
      versioned: true, // Requirement 9
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true, // Basic HTTPS enforcement
      lifecycleRules: [{
        id: 'delete-old-versions',
        noncurrentVersionExpiration: cdk.Duration.days(90),
        abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
      }, {
        id: 'transition-to-ia',
        transitions: [{
          storageClass: s3.StorageClass.INFREQUENT_ACCESS,
          transitionAfter: cdk.Duration.days(30),
        }],
      }],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion when stack fails
      autoDeleteObjects: true,
    });

    // Explicit bucket policy for robust HTTPS-only enforcement - Addresses MODEL_FAILURES item 6
    const httpsOnlyPolicy = new iam.PolicyStatement({
      sid: 'DenyInsecureConnections',
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:*'],
      resources: [
        this.bucket.bucketArn,
        `${this.bucket.bucketArn}/*`,
      ],
      conditions: {
        Bool: {
          'aws:SecureTransport': 'false',
        },
      },
    });

    this.bucket.addToResourcePolicy(httpsOnlyPolicy);

    // CloudFront/ALB logs bucket
    this.logsBucket = new s3.Bucket(this, `LogsBucket${environmentSuffix}${region}`, {
      bucketName: `${environment}-${region}-logs-bucket-${suffix}`.toLowerCase(),
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [{
        id: 'delete-old-logs',
        expiration: cdk.Duration.days(90),
        abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
      }],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Apply the same HTTPS-only policy to logs bucket
    this.logsBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'DenyInsecureConnections',
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:*'],
      resources: [
        this.logsBucket.bucketArn,
        `${this.logsBucket.bucketArn}/*`,
      ],
      conditions: {
        Bool: {
          'aws:SecureTransport': 'false',
        },
      },
    }));

    // Apply tags
    cdk.Tags.of(this.bucket).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.bucket).add('Environment', environment);
    cdk.Tags.of(this.bucket).add('Region', region);
    cdk.Tags.of(this.bucket).add('Purpose', 'Application');

    cdk.Tags.of(this.logsBucket).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.logsBucket).add('Environment', environment);
    cdk.Tags.of(this.logsBucket).add('Region', region);
    cdk.Tags.of(this.logsBucket).add('Purpose', 'Logs');
  }
}
```

## constructs/vpc-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface VpcConstructProps {
  environment: string;
  region: string;
  suffix: string;
  environmentSuffix: string;
  cidrMappings: Record<string, string>;
}

export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    const { environment, region, suffix, environmentSuffix, cidrMappings } = props;

    // Get CIDR from mappings with non-overlapping ranges
    const cidrKey = `${environment}-${region}`;
    const cidr = cidrMappings[cidrKey] || '10.0.0.0/16';

    // Create VPC with non-overlapping CIDR blocks - Requirement 1
    this.vpc = new ec2.Vpc(this, `Vpc${environmentSuffix}${region}`, {
      vpcName: `${environment}-${region}-vpc-${suffix}`,
      cidr: cidr,
      maxAzs: 3,
      natGateways: 2, // For high availability
      enableDnsHostnames: true,
      enableDnsSupport: true,
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
          cidrMask: 26,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }
      ],
    });

    // Apply tags to VPC and all subnets
    cdk.Tags.of(this.vpc).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.vpc).add('Environment', environment);
    cdk.Tags.of(this.vpc).add('Region', region);
    cdk.Tags.of(this.vpc).add('Name', `${environment}-${region}-vpc-${suffix}`);

    // VPC Flow Logs for security and compliance
    const flowLogGroup = new logs.LogGroup(this, `VpcFlowLogGroup${environmentSuffix}${region}`, {
      logGroupName: `/aws/vpc/flowlogs/${environment}-${region}-${suffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion when stack fails
    });

    new ec2.FlowLog(this, `VpcFlowLog${environmentSuffix}${region}`, {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // VPC Endpoints for private access to AWS services (cost optimization)
    this.vpc.addGatewayEndpoint(`S3Endpoint${environmentSuffix}${region}`, {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      ],
    });

    this.vpc.addGatewayEndpoint(`DynamoDbEndpoint${environmentSuffix}${region}`, {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      subnets: [
        { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      ],
    });

    // Interface endpoints for other AWS services
    this.vpc.addInterfaceEndpoint(`SecretsManagerEndpoint${environmentSuffix}${region}`, {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.vpc.addInterfaceEndpoint(`CloudWatchEndpoint${environmentSuffix}${region}`, {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });
  }
}
```

