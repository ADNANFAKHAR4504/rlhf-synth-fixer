import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as xray from 'aws-cdk-lib/aws-xray';
import { Construct } from 'constructs';

export interface MultiRegionWebAppStackProps extends cdk.StackProps {
  region: string;
  isPrimaryRegion: boolean;
  crossRegionBucketArn?: string;
  environmentSuffix?: string;
  enableGlobalServices?: boolean;
}

export class MultiRegionWebAppStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly vpc: ec2.Vpc;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;
  public readonly cloudFrontDistribution?: cloudfront.Distribution;
  public readonly webAcl?: wafv2.CfnWebACL;

  constructor(
    scope: Construct,
    id: string,
    props: MultiRegionWebAppStackProps
  ) {
    super(scope, id, props);

    const {
      region,
      isPrimaryRegion,
      crossRegionBucketArn,
      environmentSuffix = 'dev',
      enableGlobalServices = false,
    } = props;

    // Create VPC with multiple AZs for high availability
    this.vpc = new ec2.Vpc(this, `WebAppVpc${environmentSuffix}`, {
      vpcName: `webapp-vpc-${environmentSuffix}-${region}`,
      maxAzs: 2, // Reduce to 2 AZs to save on EIP quota
      natGateways: 1, // Single NAT Gateway to reduce EIP usage
      ipAddresses: ec2.IpAddresses.cidr(
        region === 'us-east-1' ? '10.0.0.0/16' : '10.1.0.0/16'
      ),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Create S3 bucket with cross-region replication
    this.bucket = this.createS3BucketWithReplication(
      isPrimaryRegion,
      crossRegionBucketArn,
      region,
      environmentSuffix
    );

    // Create security groups
    const albSecurityGroup = this.createALBSecurityGroup();
    const ec2SecurityGroup = this.createEC2SecurityGroup(albSecurityGroup);

    // Create IAM role for EC2 instances
    const ec2Role = this.createEC2Role();

    // Create Lambda function for lifecycle hooks
    const lifecycleHookLambda = this.createLifecycleHookLambda();

    // Create Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      `WebAppALB${environmentSuffix}`,
      {
        loadBalancerName: `webapp-alb-${environmentSuffix}`,
        vpc: this.vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      }
    );

    // Create Auto Scaling Group with enhanced features
    this.autoScalingGroup = this.createAutoScalingGroup(
      ec2Role,
      ec2SecurityGroup,
      lifecycleHookLambda
    );

    // Create target group and listener
    this.setupLoadBalancerTargeting();

    // Add CloudWatch monitoring and alarms
    this.setupMonitoring();

    // Setup X-Ray tracing
    this.setupXRayTracing();

    // Setup global services (CloudFront + WAF) only in primary region
    if (enableGlobalServices && isPrimaryRegion) {
      this.webAcl = this.createWebAcl();
      this.cloudFrontDistribution = this.createCloudFrontDistribution();
    }

    // Apply tags
    this.applyTags(environmentSuffix, region);
  }

  private createS3BucketWithReplication(
    isPrimaryRegion: boolean,
    crossRegionBucketArn: string | undefined,
    region: string,
    environmentSuffix: string
  ): s3.Bucket {
    const bucket = new s3.Bucket(this, `WebAppBucket${environmentSuffix}`, {
      bucketName: `webapp-${environmentSuffix}-${region.replace(/-/g, '')}-${this.account}`,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development/testing
      autoDeleteObjects: true, // Automatically delete objects when stack is destroyed
    });

    // Configure cross-region replication for primary region
    if (isPrimaryRegion && crossRegionBucketArn) {
      const replicationRole = new iam.Role(
        this,
        `ReplicationRole${environmentSuffix}`,
        {
          assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
          inlinePolicies: {
            ReplicationPolicy: new iam.PolicyDocument({
              statements: [
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: [
                    's3:GetObjectVersionForReplication',
                    's3:GetObjectVersionAcl',
                    's3:GetObjectVersionTagging',
                  ],
                  resources: [`${bucket.bucketArn}/*`],
                }),
                new iam.PolicyStatement({
                  effect: iam.Effect.ALLOW,
                  actions: [
                    's3:ReplicateObject',
                    's3:ReplicateDelete',
                    's3:ReplicateTags',
                  ],
                  resources: [`${crossRegionBucketArn}/*`],
                }),
              ],
            }),
          },
        }
      );

      // Add replication configuration using L1 construct
      const cfnBucket = bucket.node.defaultChild as s3.CfnBucket;
      cfnBucket.replicationConfiguration = {
        role: replicationRole.roleArn,
        rules: [
          {
            id: 'ReplicateToSecondaryRegion',
            status: 'Enabled',
            prefix: '',
            destination: {
              bucket: crossRegionBucketArn,
              storageClass: 'STANDARD_IA',
            },
          },
        ],
      };
    }

    return bucket;
  }

  private createALBSecurityGroup(): ec2.SecurityGroup {
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';
    const albSg = new ec2.SecurityGroup(
      this,
      `ALBSecurityGroup${environmentSuffix}`,
      {
        securityGroupName: `alb-sg-${environmentSuffix}`,
        vpc: this.vpc,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: false,
      }
    );

    albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );
    albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );
    albSg.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow outbound HTTP to instances'
    );

    return albSg;
  }

  private createEC2SecurityGroup(
    albSecurityGroup: ec2.SecurityGroup
  ): ec2.SecurityGroup {
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';
    const ec2Sg = new ec2.SecurityGroup(
      this,
      `EC2SecurityGroup${environmentSuffix}`,
      {
        securityGroupName: `ec2-sg-${environmentSuffix}`,
        vpc: this.vpc,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
      }
    );

    ec2Sg.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );
    ec2Sg.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(443),
      'Allow HTTPS from ALB'
    );

    return ec2Sg;
  }

  private createEC2Role(): iam.Role {
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';
    const role = new iam.Role(this, `EC2Role${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Add S3 access permissions
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: [`${this.bucket.bucketArn}/*`],
      })
    );

    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:ListBucket'],
        resources: [this.bucket.bucketArn],
      })
    );

    // Add X-Ray permissions for distributed tracing
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'xray:PutTraceSegments',
          'xray:PutTelemetryRecords',
          'xray:GetSamplingRules',
          'xray:GetSamplingTargets',
        ],
        resources: ['*'],
      })
    );

    return role;
  }

  private createLifecycleHookLambda(): lambda.Function {
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';
    return new lambda.Function(
      this,
      `LifecycleHookFunction${environmentSuffix}`,
      {
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    Handle Auto Scaling lifecycle hooks for custom scaling events
    """
    try:
        logger.info(f'Received event: {json.dumps(event)}')
        
        # Parse the Auto Scaling lifecycle event
        detail = event.get('detail', {})
        lifecycle_transition = detail.get('LifecycleTransition')
        instance_id = detail.get('EC2InstanceId')
        auto_scaling_group_name = detail.get('AutoScalingGroupName')
        lifecycle_action_token = detail.get('LifecycleActionToken')
        
        autoscaling_client = boto3.client('autoscaling')
        
        if lifecycle_transition == 'autoscaling:EC2_INSTANCE_LAUNCHING':
            logger.info(f'Instance {instance_id} is launching in ASG {auto_scaling_group_name}')
            # Perform custom initialization tasks here
            result = 'CONTINUE'
            
        elif lifecycle_transition == 'autoscaling:EC2_INSTANCE_TERMINATING':
            logger.info(f'Instance {instance_id} is terminating in ASG {auto_scaling_group_name}')
            # Perform custom cleanup tasks here
            result = 'CONTINUE'
        else:
            logger.warning(f'Unknown lifecycle transition: {lifecycle_transition}')
            result = 'ABANDON'
        
        # Complete the lifecycle action
        autoscaling_client.complete_lifecycle_action(
            LifecycleHookName=detail.get('LifecycleHookName'),
            AutoScalingGroupName=auto_scaling_group_name,
            InstanceId=instance_id,
            LifecycleActionToken=lifecycle_action_token,
            LifecycleActionResult=result
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps('Lifecycle hook processed successfully')
        }
        
    except Exception as e:
        logger.error(f'Error processing lifecycle hook: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
      `),
        timeout: cdk.Duration.minutes(5),
        description: 'Lambda function to handle Auto Scaling lifecycle hooks',
      }
    );
  }

  private createAutoScalingGroup(
    ec2Role: iam.Role,
    ec2SecurityGroup: ec2.SecurityGroup,
    lifecycleHookLambda: lambda.Function
  ): autoscaling.AutoScalingGroup {
    // Create launch template with latest Amazon Linux 2023
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `WebAppLaunchTemplate${environmentSuffix}`,
      {
        launchTemplateName: `webapp-lt-${environmentSuffix}`,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        securityGroup: ec2SecurityGroup,
        role: ec2Role,
        userData: ec2.UserData.forLinux(),
      }
    );

    // Add user data for web server setup with X-Ray daemon
    if (launchTemplate.userData) {
      launchTemplate.userData.addCommands(
        'yum update -y',
        'yum install -y httpd',
        // Install and configure X-Ray daemon
        'curl https://s3.us-east-2.amazonaws.com/aws-xray-assets.us-east-2/xray-daemon/aws-xray-daemon-3.x.rpm -o /tmp/xray.rpm',
        'yum install -y /tmp/xray.rpm',
        'systemctl enable xray',
        'systemctl start xray',
        // Configure web server with X-Ray tracing headers
        'systemctl start httpd',
        'systemctl enable httpd',
        'cat > /var/www/html/index.html << EOF',
        '<html>',
        '<head><title>Multi-Region Web App</title></head>',
        '<body>',
        '<h1>Web App - $(curl -s http://169.254.169.254/latest/meta-data/availability-zone)</h1>',
        '<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>',
        '<p>Region: $(curl -s http://169.254.169.254/latest/meta-data/placement/region)</p>',
        '<p>X-Ray Tracing: Enabled</p>',
        '</body>',
        '</html>',
        'EOF',
        'systemctl restart httpd'
      );
    }

    const asg = new autoscaling.AutoScalingGroup(
      this,
      `WebAppASG${environmentSuffix}`,
      {
        autoScalingGroupName: `webapp-asg-${environmentSuffix}`,
        vpc: this.vpc,
        launchTemplate: launchTemplate,
        minCapacity: 3,
        maxCapacity: 9,
        desiredCapacity: 3,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        defaultInstanceWarmup: cdk.Duration.seconds(120),
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.seconds(60), // 1 minute for auto recovery
        }),
      }
    );

    // Add lifecycle hook with Lambda integration
    // Grant Lambda permission to manage lifecycle hooks
    lifecycleHookLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['autoscaling:CompleteLifecycleAction'],
        resources: ['*'],
      })
    );

    asg.addLifecycleHook('InstanceLaunchingHook', {
      lifecycleTransition: autoscaling.LifecycleTransition.INSTANCE_LAUNCHING,
      heartbeatTimeout: cdk.Duration.minutes(10),
    });

    asg.addLifecycleHook('InstanceTerminatingHook', {
      lifecycleTransition: autoscaling.LifecycleTransition.INSTANCE_TERMINATING,
      heartbeatTimeout: cdk.Duration.minutes(5),
    });

    // Configure scaling policies for responsive scaling
    asg.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.seconds(60),
    });

    return asg;
  }

  private setupLoadBalancerTargeting(): void {
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `WebAppTargetGroup${environmentSuffix}`,
      {
        targetGroupName: `webapp-tg-${environmentSuffix}`,
        vpc: this.vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [this.autoScalingGroup],
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 5,
        },
      }
    );

    this.loadBalancer.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });
  }

  private setupMonitoring(): void {
    // Create CloudWatch alarms for monitoring
    new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: this.autoScalingGroup.autoScalingGroupName,
        },
      }),
      threshold: 80,
      evaluationPeriods: 2,
      alarmDescription: 'High CPU utilization alarm',
    });

    new cloudwatch.Alarm(this, 'LowHealthyHostsAlarm', {
      metric: this.loadBalancer.metrics.targetResponseTime(),
      threshold: 1000,
      evaluationPeriods: 3,
      alarmDescription: 'High response time alarm',
    });
  }

  private setupXRayTracing(): void {
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';

    // Create X-Ray sampling rule for application tracing
    new xray.CfnSamplingRule(this, `XRaySamplingRule${environmentSuffix}`, {
      samplingRule: {
        ruleName: `WebApp-${environmentSuffix}`,
        priority: 9000,
        fixedRate: 0.1,
        reservoirSize: 1,
        serviceName: `WebApp-${environmentSuffix}`,
        serviceType: 'AWS::EC2::Instance',
        host: '*',
        httpMethod: '*',
        urlPath: '*',
        version: 1,
        resourceArn: '*',
      },
    });
  }

  private createWebAcl(): wafv2.CfnWebACL {
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';

    return new wafv2.CfnWebACL(this, `WebAppWAF${environmentSuffix}`, {
      scope: 'CLOUDFRONT',
      defaultAction: { allow: {} },
      name: `WebApp-WAF-${environmentSuffix}`,
      description: 'WAF for WebApp CloudFront distribution',
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
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
            metricName: 'KnownBadInputsRuleSetMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `WebAppWAF-${environmentSuffix}`,
      },
    });
  }

  private createCloudFrontDistribution(): cloudfront.Distribution {
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';

    if (!this.webAcl) {
      throw new Error('WAF must be created before CloudFront distribution');
    }

    const distribution = new cloudfront.Distribution(
      this,
      `WebAppCloudFront${environmentSuffix}`,
      {
        comment: `CloudFront distribution for WebApp ${environmentSuffix}`,
        defaultBehavior: {
          origin: new origins.LoadBalancerV2Origin(this.loadBalancer, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
            originPath: '',
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },
        additionalBehaviors: {
          '/health': {
            origin: new origins.LoadBalancerV2Origin(this.loadBalancer, {
              protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
            }),
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.ALLOW_ALL,
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          },
        },
        webAclId: this.webAcl.attrArn,
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        enabled: true,
        httpVersion: cloudfront.HttpVersion.HTTP2,
        enableIpv6: true,
      }
    );

    // Add CloudWatch alarms for CloudFront
    new cloudwatch.Alarm(this, `CloudFrontErrorRateAlarm${environmentSuffix}`, {
      metric: distribution.metric4xxErrorRate(),
      threshold: 5,
      evaluationPeriods: 2,
      alarmDescription: 'CloudFront high 4xx error rate alarm',
    });

    return distribution;
  }

  private applyTags(environmentSuffix: string, region: string): void {
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Region', region);
    cdk.Tags.of(this).add('Application', 'WebApp');
    cdk.Tags.of(this).add('XRayTracing', 'Enabled');
  }
}
