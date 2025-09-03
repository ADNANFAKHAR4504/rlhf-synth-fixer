import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface DefenseInDepthStackProps extends cdk.StackProps {
  environmentSuffix: string;
  personalIpAddress?: string;
}

export class DefenseInDepthStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DefenseInDepthStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;
    const personalIpAddress =
      props.personalIpAddress ||
      this.node.tryGetContext('personalIpAddress') ||
      '0.0.0.0';

    // 1. KMS Key for EBS encryption
    const ebsKmsKey = new kms.Key(this, `EbsKmsKey-${environmentSuffix}`, {
      description: `EBS encryption key for ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    ebsKmsKey.addAlias(`alias/ebs-key-${environmentSuffix}`);

    // Add KMS key policy for Auto Scaling service role
    ebsKmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Allow service-linked role use of the KMS',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ArnPrincipal(
            `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling`
          ),
        ],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
        ],
        resources: ['*'],
      })
    );

    ebsKmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Allow attachment of persistent resources',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ArnPrincipal(
            `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling`
          ),
        ],
        actions: ['kms:CreateGrant'],
        resources: ['*'],
        conditions: {
          Bool: {
            'kms:GrantIsForAWSResource': true,
          },
        },
      })
    );

    // 2. IAM Role for EC2 with SSM permissions
    const ec2Role = new iam.Role(this, `Ec2Role-${environmentSuffix}`, {
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
        EbsEncryptionPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:GenerateDataKey*',
              ],
              resources: [ebsKmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    new iam.InstanceProfile(this, `InstanceProfile-${environmentSuffix}`, {
      role: ec2Role,
    });

    // 3. VPC with public/private subnets across 2 AZs
    const vpc = new ec2.Vpc(this, `Vpc-${environmentSuffix}`, {
      availabilityZones: ['us-east-1a', 'us-east-1b'],
      natGateways: 1, // Reduce to 1 NAT gateway to be more cost-effective
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
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // 4. Security Group allowing SSH from personalIpAddress
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `Ec2SecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
      }
    );

    // Ensure IP address has proper CIDR format
    const cidrIp = personalIpAddress.includes('/')
      ? personalIpAddress
      : `${personalIpAddress}/32`;

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(cidrIp),
      ec2.Port.tcp(22),
      'SSH access from personal IP'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP access from ALB'
    );

    // ALB Security Group
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `AlbSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: true,
      }
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP access from internet'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS access from internet'
    );

    // 5. Launch Template with T2/T3 instances, encrypted EBS, SSM role
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `LaunchTemplate-${environmentSuffix}`,
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        role: ec2Role,
        securityGroup: ec2SecurityGroup,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              encrypted: true,
              kmsKey: ebsKmsKey,
              volumeType: ec2.EbsDeviceVolumeType.GP3,
              deleteOnTermination: true,
            }),
          },
        ],
        userData: ec2.UserData.forLinux({
          shebang: '#!/bin/bash',
        }),
      }
    );

    // Add user data commands to install and configure httpd
    if (launchTemplate.userData) {
      launchTemplate.userData.addCommands(
        'yum update -y',
        'yum install -y httpd',
        'systemctl start httpd',
        'systemctl enable httpd',
        'echo "<html><body><h1>Hello World!</h1><p>Welcome to the Defense in Depth Stack</p><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p><p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p></body></html>" > /var/www/html/index.html',
        'chown apache:apache /var/www/html/index.html'
      );
    }

    // 6. ALB + Auto Scaling Group with 2 EC2 instances
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `Alb-${environmentSuffix}`,
      {
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `TargetGroup-${environmentSuffix}`,
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          path: '/',
          protocol: elbv2.Protocol.HTTP,
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
      }
    );

    alb.addListener(`Listener-${environmentSuffix}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      `Asg-${environmentSuffix}`,
      {
        vpc,
        launchTemplate,
        minCapacity: 2,
        maxCapacity: 4,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.seconds(300),
        }),
      }
    );

    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // 9. S3 bucket with encryption
    const s3KmsKey = new kms.Key(this, `S3KmsKey-${environmentSuffix}`, {
      description: `S3 encryption key for ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const s3Bucket = new s3.Bucket(this, `S3Bucket-${environmentSuffix}`, {
      bucketName: `defense-in-depth-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3KmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED, // Enable ACL access for CloudFront
    });

    // Add bucket policy to allow CloudFront to write logs
    s3Bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${s3Bucket.bucketArn}/cloudfront-logs/*`],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${cdk.Aws.ACCOUNT_ID}:distribution/*`,
          },
        },
      })
    );

    // 11. SQS queue for async logging
    const sqsKmsKey = new kms.Key(this, `SqsKmsKey-${environmentSuffix}`, {
      description: `SQS encryption key for ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const logQueue = new sqs.Queue(this, `LogQueue-${environmentSuffix}`, {
      queueName: `log-queue-${environmentSuffix}`,
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: sqsKmsKey,
      visibilityTimeout: cdk.Duration.seconds(300),
      retentionPeriod: cdk.Duration.days(14),
    });

    // 10. Lambda function triggered by S3 events
    const lambdaRole = new iam.Role(this, `LambdaRole-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        SqsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['sqs:SendMessage'],
              resources: [logQueue.queueArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
              resources: [sqsKmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    const s3ProcessorFunction = new lambda.Function(
      this,
      `S3ProcessorFunction-${environmentSuffix}`,
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        role: lambdaRole,
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const sqs = new AWS.SQS();
        
        exports.handler = async (event) => {
          try {
            console.log('S3 Event:', JSON.stringify(event, null, 2));
            
            for (const record of event.Records) {
              const message = {
                eventName: record.eventName,
                bucketName: record.s3.bucket.name,
                objectKey: record.s3.object.key,
                timestamp: new Date().toISOString()
              };
              
              await sqs.sendMessage({
                QueueUrl: '${logQueue.queueUrl}',
                MessageBody: JSON.stringify(message)
              }).promise();
            }
            
            return { statusCode: 200 };
          } catch (err) {
            // Fix: Proper type-safe error handling
            let errorMessage: string;
            if (err instanceof Error) {
              errorMessage = err.message;
            } else if (typeof err === 'string') {
              errorMessage = err;
            } else {
              errorMessage = 'Unknown error occurred';
            }
            
            console.error('Error processing S3 event:', errorMessage);
            return {
              statusCode: 500,
              body: JSON.stringify({ error: errorMessage })
            };
          }
        };
      `),
        environment: {
          QUEUE_URL: logQueue.queueUrl,
        },
      }
    );

    s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(s3ProcessorFunction)
    );

    // 8. WAFv2 Web ACL with AWSManagedRulesCommonRuleSet
    const webAcl = new wafv2.CfnWebACL(this, `WebAcl-${environmentSuffix}`, {
      scope: 'CLOUDFRONT',
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
            metricName: 'KnownBadInputsRuleSetMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `WebAclMetric-${environmentSuffix}`,
      },
    });

    // 7. CloudFront distribution with ALB origin
    const distribution = new cloudfront.Distribution(
      this,
      `Distribution-${environmentSuffix}`,
      {
        defaultBehavior: {
          origin: new origins.LoadBalancerV2Origin(alb, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          compress: true,
        },
        webAclId: webAcl.attrArn,
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        enableLogging: true,
        logBucket: s3Bucket,
        logFilePrefix: 'cloudfront-logs/',
      }
    );

    // 12. CloudWatch alarms for CPU/memory - FULLY CORRECTED VERSION
    // Create CloudWatch metrics manually since AutoScalingGroup doesn't have direct metric methods
    const cpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    new cloudwatch.Alarm(this, `CpuAlarm-${environmentSuffix}`, {
      metric: cpuMetric,
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'High CPU utilization alarm',
    });

    // Note: Memory metrics are not available by default in CloudWatch
    // You would need to install CloudWatch agent on EC2 instances
    // For now, we'll use a different metric or remove this alarm
    const networkInMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'NetworkIn',
      dimensionsMap: {
        AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    new cloudwatch.Alarm(this, `NetworkInAlarm-${environmentSuffix}`, {
      metric: networkInMetric,
      threshold: 1000000, // 1MB threshold for network in
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'High network in traffic alarm',
    });

    // Alternative: Using target tracking scaling policy (simpler and more reliable)
    new autoscaling.TargetTrackingScalingPolicy(
      this,
      `TargetTrackingPolicy-${environmentSuffix}`,
      {
        autoScalingGroup,
        targetValue: 70,
        predefinedMetric:
          autoscaling.PredefinedMetric.ASG_AVERAGE_CPU_UTILIZATION,
      }
    );

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'ALB DNS Name',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'SqsQueueUrl', {
      value: logQueue.queueUrl,
      description: 'SQS Queue URL',
    });
  }
}
