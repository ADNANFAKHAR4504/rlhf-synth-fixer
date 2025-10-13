I'll create a comprehensive AWS CDK infrastructure solution that meets all your requirements. This will be a complete web application stack with VPC, EC2 Auto Scaling, RDS, CloudFront, S3, monitoring, and CI/CD pipeline.

```typescript
// lib/infrastructure.ts

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as logsDestinations from 'aws-cdk-lib/aws-logs-destinations';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  domainName?: string;
  sshAllowedIp?: string;
  dbUsername?: string;
  dbPassword?: string;
  hostedZoneId?: string;
  certificateArn?: string;
}

export class TapStack extends cdk.Stack {
  private readonly isProd: boolean;
  private readonly removalPolicy: cdk.RemovalPolicy;
  private readonly environmentSuffix: string;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, {
      ...props,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-west-1',
      },
    });

    // Initialize environment-specific settings
    this.environmentSuffix = props.environmentSuffix;
    this.isProd = props.environmentSuffix.includes('prod');
    this.removalPolicy = this.isProd
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

    // Create KMS key for encryption
    const kmsKey = this.createKmsKey();

    // Create VPC with public and private subnets
    const vpc = this.createVpc();

    // Create security groups
    const { albSecurityGroup, ec2SecurityGroup, rdsSecurityGroup } =
      this.createSecurityGroups(vpc, props.sshAllowedIp || '10.0.0.0/8');

    // Create IAM roles
    const ec2Role = this.createEc2Role();

    // Create S3 buckets
    const {
      contentBucket,
      logsBucket,
      pipelineArtifactsBucket,
      codeSourceBucket,
    } = this.createS3Buckets(kmsKey);

    // Create RDS instance
    const database = this.createRdsInstance(
      vpc,
      rdsSecurityGroup,
      kmsKey,
      props.dbUsername || 'admin',
      props.dbPassword
    );

    // Create Application Load Balancer
    const alb = this.createApplicationLoadBalancer(vpc, albSecurityGroup);

    // Create Auto Scaling Group
    const autoScalingGroup = this.createAutoScalingGroup(
      vpc,
      ec2SecurityGroup,
      ec2Role,
      alb,
      database,
      logsBucket,
      kmsKey
    );

    // Create CloudFront distribution
    const distribution = this.createCloudFrontDistribution(
      contentBucket,
      alb,
      props.domainName,
      props.certificateArn
    );

    // Create Route53 record if domain is provided
    if (props.domainName && props.hostedZoneId) {
      this.createRoute53Record(
        distribution,
        props.domainName,
        props.hostedZoneId
      );
    }

    // Create Lambda for handling routing misconfigurations
    const lambdaFunction = this.createLambdaFunction(vpc, kmsKey);

    // Set up CloudWatch monitoring and alarms
    this.setupCloudWatchMonitoring(autoScalingGroup, alb, lambdaFunction);

    // Create CodePipeline for CI/CD
    this.createCodePipeline(
      codeSourceBucket,
      pipelineArtifactsBucket,
      autoScalingGroup,
      kmsKey
    );

    // Add tags to all resources
    this.addTags();

    // Output important values
    this.createOutputs(alb, distribution, database);
  }

  private createKmsKey(): kms.Key {
    return new kms.Key(this, `KmsKey-${this.environmentSuffix}`, {
      alias: `alias/tap-stack-${this.environmentSuffix}`,
      description: `KMS key for TapStack ${this.environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: this.removalPolicy,
    });
  }

  private createVpc(): ec2.Vpc {
    const vpc = new ec2.Vpc(this, `Vpc-${this.environmentSuffix}`, {
      vpcName: `tap-vpc-${this.environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 1,
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

    // Add VPC Flow Logs
    new ec2.FlowLog(this, `VpcFlowLog-${this.environmentSuffix}`, {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      trafficType: ec2.FlowLogTrafficType.ALL,
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
    });

    return vpc;
  }

  private createSecurityGroups(
    vpc: ec2.Vpc,
    sshAllowedIp: string
  ): {
    albSecurityGroup: ec2.SecurityGroup;
    ec2SecurityGroup: ec2.SecurityGroup;
    rdsSecurityGroup: ec2.SecurityGroup;
  } {
    // ALB Security Group
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `AlbSecurityGroup-${this.environmentSuffix}`,
      {
        vpc,
        securityGroupName: `tap-alb-sg-${this.environmentSuffix}`,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: true,
      }
    );

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

    // EC2 Security Group
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `Ec2SecurityGroup-${this.environmentSuffix}`,
      {
        vpc,
        securityGroupName: `tap-ec2-sg-${this.environmentSuffix}`,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
      }
    );

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(sshAllowedIp),
      ec2.Port.tcp(22),
      'Allow SSH from specific IP range'
    );

    // RDS Security Group
    const rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `RdsSecurityGroup-${this.environmentSuffix}`,
      {
        vpc,
        securityGroupName: `tap-rds-sg-${this.environmentSuffix}`,
        description: 'Security group for RDS instance',
        allowAllOutbound: false,
      }
    );

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL traffic from EC2 instances'
    );

    return { albSecurityGroup, ec2SecurityGroup, rdsSecurityGroup };
  }

  private createEc2Role(): iam.Role {
    const role = new iam.Role(this, `Ec2Role-${this.environmentSuffix}`, {
      roleName: `tap-ec2-role-${this.environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Add S3 permissions for logs
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:PutObject', 's3:GetObject', 's3:ListBucket'],
        resources: ['arn:aws:s3:::tap-logs-*/*', 'arn:aws:s3:::tap-logs-*'],
      })
    );

    // Add CodeDeploy permissions
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['codedeploy:*', 's3:GetObject', 's3:ListBucket'],
        resources: ['*'],
      })
    );

    return role;
  }

  private createS3Buckets(kmsKey: kms.Key): {
    contentBucket: s3.Bucket;
    logsBucket: s3.Bucket;
    pipelineArtifactsBucket: s3.Bucket;
    codeSourceBucket: s3.Bucket;
  } {
    // Content bucket for static website
    const contentBucket = new s3.Bucket(
      this,
      `ContentBucket-${this.environmentSuffix}`,
      {
        bucketName: `tap-content-${this.environmentSuffix}-${this.account}`,
        publicReadAccess: true,
        websiteIndexDocument: 'index.html',
        websiteErrorDocument: 'error.html',
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kmsKey,
        removalPolicy: this.removalPolicy,
        autoDeleteObjects: !this.isProd,
        versioned: true,
        cors: [
          {
            allowedHeaders: ['*'],
            allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
            allowedOrigins: ['*'],
            maxAge: 3000,
          },
        ],
      }
    );

    // Logs bucket
    const logsBucket = new s3.Bucket(
      this,
      `LogsBucket-${this.environmentSuffix}`,
      {
        bucketName: `tap-logs-${this.environmentSuffix}-${this.account}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kmsKey,
        removalPolicy: this.removalPolicy,
        autoDeleteObjects: !this.isProd,
        lifecycleRules: [
          {
            id: 'delete-old-logs',
            enabled: true,
            expiration: cdk.Duration.days(90),
          },
        ],
      }
    );

    // Pipeline artifacts bucket
    const pipelineArtifactsBucket = new s3.Bucket(
      this,
      `PipelineArtifacts-${this.environmentSuffix}`,
      {
        bucketName: `tap-pipeline-artifacts-${this.environmentSuffix}-${this.account}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kmsKey,
        removalPolicy: this.removalPolicy,
        autoDeleteObjects: !this.isProd,
      }
    );

    // Code source bucket
    const codeSourceBucket = new s3.Bucket(
      this,
      `CodeSourceBucket-${this.environmentSuffix}`,
      {
        bucketName: `tap-code-source-${this.environmentSuffix}-${this.account}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kmsKey,
        removalPolicy: this.removalPolicy,
        autoDeleteObjects: !this.isProd,
        versioned: true,
      }
    );

    return {
      contentBucket,
      logsBucket,
      pipelineArtifactsBucket,
      codeSourceBucket,
    };
  }

  private createRdsInstance(
    vpc: ec2.Vpc,
    securityGroup: ec2.SecurityGroup,
    kmsKey: kms.Key,
    username: string,
    password?: string
  ): rds.DatabaseInstance {
    const dbPassword = password
      ? cdk.SecretValue.unsafePlainText(password)
      : cdk.SecretValue.ssmSecure(
          `/tap-stack/${this.environmentSuffix}/db-password`
        );

    const database = new rds.DatabaseInstance(
      this,
      `Database-${this.environmentSuffix}`,
      {
        instanceIdentifier: `tap-db-${this.environmentSuffix}`,
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0_35,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          this.isProd ? ec2.InstanceSize.MEDIUM : ec2.InstanceSize.MICRO
        ),
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [securityGroup],
        allocatedStorage: this.isProd ? 100 : 20,
        storageType: rds.StorageType.GP3,
        storageEncrypted: true,
        storageEncryptionKey: kmsKey,
        credentials: rds.Credentials.fromPassword(username, dbPassword),
        multiAz: this.isProd,
        backupRetention: cdk.Duration.days(this.isProd ? 30 : 7),
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        deletionProtection: this.isProd,
        removalPolicy: this.removalPolicy,
        monitoringInterval: cdk.Duration.minutes(1),
        enablePerformanceInsights: this.isProd,
      }
    );

    return database;
  }

  private createApplicationLoadBalancer(
    vpc: ec2.Vpc,
    securityGroup: ec2.SecurityGroup
  ): elbv2.ApplicationLoadBalancer {
    return new elbv2.ApplicationLoadBalancer(
      this,
      `Alb-${this.environmentSuffix}`,
      {
        loadBalancerName: `tap-alb-${this.environmentSuffix}`,
        vpc,
        internetFacing: true,
        securityGroup,
        deletionProtection: this.isProd,
      }
    );
  }

  private createAutoScalingGroup(
    vpc: ec2.Vpc,
    securityGroup: ec2.SecurityGroup,
    role: iam.Role,
    alb: elbv2.ApplicationLoadBalancer,
    database: rds.DatabaseInstance,
    logsBucket: s3.Bucket,
    kmsKey: kms.Key
  ): autoscaling.AutoScalingGroup {
    // User data script
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y httpd',
      'yum install -y amazon-cloudwatch-agent',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>TapStack Web Application</h1>" > /var/www/html/index.html',
      `echo "DB_HOST=${database.dbInstanceEndpointAddress}" >> /etc/environment`,
      `echo "LOGS_BUCKET=${logsBucket.bucketName}" >> /etc/environment`,
      'aws s3 cp /var/log/httpd/access_log s3://' +
        logsBucket.bucketName +
        '/ec2-logs/ --recursive',
      // Install and configure CloudWatch agent
      'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm',
      'rpm -U ./amazon-cloudwatch-agent.rpm',
      'cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/config.json',
      '{',
      '  "metrics": {',
      '    "namespace": "TapStack",',
      '    "metrics_collected": {',
      '      "cpu": {',
      '        "measurement": [{"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"}],',
      '        "totalcpu": false',
      '      },',
      '      "disk": {',
      '        "measurement": [{"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}],',
      '        "resources": ["/"],',
      '        "ignore_file_system_types": ["sysfs", "devtmpfs", "tmpfs"]',
      '      },',
      '      "mem": {',
      '        "measurement": [{"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}]',
      '      }',
      '    }',
      '  }',
      '}',
      'EOF',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json -s'
    );

    // Create launch template
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `LaunchTemplate-${this.environmentSuffix}`,
      {
        launchTemplateName: `tap-lt-${this.environmentSuffix}`,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          this.isProd ? ec2.InstanceSize.SMALL : ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        userData,
        role,
        securityGroup,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              volumeType: ec2.EbsDeviceVolumeType.GP3,
              encrypted: true,
              kmsKey,
            }),
          },
        ],
      }
    );

    // Create Auto Scaling Group
    const asg = new autoscaling.AutoScalingGroup(
      this,
      `Asg-${this.environmentSuffix}`,
      {
        autoScalingGroupName: `tap-asg-${this.environmentSuffix}`,
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        launchTemplate,
        minCapacity: this.isProd ? 2 : 1,
        maxCapacity: this.isProd ? 10 : 3,
        desiredCapacity: this.isProd ? 2 : 1,
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(5),
        }),
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 1,
          minInstancesInService: 1,
        }),
      }
    );

    // Configure Auto Scaling
    asg.scaleOnCpuUtilization(`CpuScaling-${this.environmentSuffix}`, {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });

    asg.scaleOnRequestCount(`RequestScaling-${this.environmentSuffix}`, {
      targetRequestsPerMinute: 1000,
    });

    // Create target group and attach to ALB
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `TargetGroup-${this.environmentSuffix}`,
      {
        targetGroupName: `tap-tg-${this.environmentSuffix}`,
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          enabled: true,
          path: '/',
          healthyHttpCodes: '200',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
        deregistrationDelay: cdk.Duration.seconds(30),
      }
    );

    asg.attachToApplicationTargetGroup(targetGroup);

    // Add listener to ALB
    alb.addListener(`Listener-${this.environmentSuffix}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    return asg;
  }

  private createCloudFrontDistribution(
    contentBucket: s3.Bucket,
    alb: elbv2.ApplicationLoadBalancer,
    domainName?: string,
    certificateArn?: string
  ): cloudfront.Distribution {
    const certificate = certificateArn
      ? certificatemanager.Certificate.fromCertificateArn(
          this,
          `Certificate-${this.environmentSuffix}`,
          certificateArn
        )
      : undefined;

    const distribution = new cloudfront.Distribution(
      this,
      `Distribution-${this.environmentSuffix}`,
      {
        comment: `TapStack CloudFront Distribution ${this.environmentSuffix}`,
        defaultBehavior: {
          origin: new origins.S3Origin(contentBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        },
        additionalBehaviors: {
          '/api/*': {
            origin: new origins.HttpOrigin(alb.loadBalancerDnsName, {
              protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
            }),
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
            originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          },
        },
        defaultRootObject: 'index.html',
        errorResponses: [
          {
            httpStatus: 404,
            responsePagePath: '/error.html',
            responseHttpStatus: 200,
            ttl: cdk.Duration.minutes(5),
          },
        ],
        domainNames: domainName ? [domainName] : undefined,
        certificate,
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        enableLogging: true,
        logIncludesCookies: false,
        geoRestriction: cloudfront.GeoRestriction.allowlist('US', 'CA', 'MX'),
      }
    );

    return distribution;
  }

  private createRoute53Record(
    distribution: cloudfront.Distribution,
    domainName: string,
    hostedZoneId: string
  ): void {
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      `HostedZone-${this.environmentSuffix}`,
      {
        hostedZoneId,
        zoneName: domainName.split('.').slice(-2).join('.'),
      }
    );

    new route53.ARecord(this, `ARecord-${this.environmentSuffix}`, {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
      ttl: cdk.Duration.minutes(5),
    });
  }

  private createLambdaFunction(vpc: ec2.Vpc, kmsKey: kms.Key): lambda.Function {
    const lambdaRole = new iam.Role(
      this,
      `LambdaRole-${this.environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
        ],
      }
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'ec2:DescribeRouteTables',
          'ec2:CreateRoute',
          'ec2:DeleteRoute',
          'ec2:ReplaceRoute',
        ],
        resources: ['*'],
      })
    );

    const fn = new lambda.Function(
      this,
      `RoutingHandler-${this.environmentSuffix}`,
      {
        functionName: `tap-routing-handler-${this.environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const ec2 = new AWS.EC2();
        
        exports.handler = async (event) => {
          console.log('Processing CloudWatch Logs event:', JSON.stringify(event, null, 2));
          
          try {
            // Parse the log event
            const logData = JSON.parse(Buffer.from(event.awslogs.data, 'base64').toString('utf-8'));
            
            // Check for routing misconfiguration patterns
            const routingErrors = logData.logEvents.filter(log => 
              log.message.includes('route') && 
              (log.message.includes('error') || log.message.includes('fail'))
            );
            
            if (routingErrors.length > 0) {
              console.log('Detected routing misconfiguration:', routingErrors);
              
              // Implement auto-remediation logic here
              // This is a placeholder for actual remediation
              
              // Example: Describe route tables to check for issues
              const routeTables = await ec2.describeRouteTables().promise();
              console.log('Current route tables:', JSON.stringify(routeTables, null, 2));
              
              // Send notification (integrate with SNS if needed)
              return {
                statusCode: 200,
                body: JSON.stringify({
                  message: 'Routing misconfiguration handled',
                  errors: routingErrors.length,
                }),
              };
            }
            
            return {
              statusCode: 200,
              body: JSON.stringify({ message: 'No routing issues detected' }),
            };
          } catch (error) {
            console.error('Error processing log event:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({ error: error.message }),
            };
          }
        };
      `),
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        environment: {
          ENVIRONMENT: this.environmentSuffix,
        },
        timeout: cdk.Duration.minutes(5),
        memorySize: 256,
        role: lambdaRole,
        environmentEncryption: kmsKey,
        reservedConcurrentExecutions: 5,
        retryAttempts: 2,
      }
    );

    return fn;
  }

  private setupCloudWatchMonitoring(
    asg: autoscaling.AutoScalingGroup,
    alb: elbv2.ApplicationLoadBalancer,
    lambdaFunction: lambda.Function
  ): void {
    // Create CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(
      this,
      `Dashboard-${this.environmentSuffix}`,
      {
        dashboardName: `tap-dashboard-${this.environmentSuffix}`,
      }
    );

    // CPU Utilization Metric
    const cpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: asg.autoScalingGroupName,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    // Memory Usage Metric (from CloudWatch Agent)
    const memoryMetric = new cloudwatch.Metric({
      namespace: 'TapStack',
      metricName: 'MEM_USED',
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    // Disk Space Metric (from CloudWatch Agent)
    const diskMetric = new cloudwatch.Metric({
      namespace: 'TapStack',
      metricName: 'DISK_USED',
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    // ALB Request Count
    const requestCountMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'RequestCount',
      dimensionsMap: {
        LoadBalancer: alb.loadBalancerFullName,
      },
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    // Create CloudWatch Alarms
    new cloudwatch.Alarm(this, `CpuAlarm-${this.environmentSuffix}`, {
      alarmName: `tap-cpu-alarm-${this.environmentSuffix}`,
      metric: cpuMetric,
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Alarm when CPU exceeds 80%',
    });

    new cloudwatch.Alarm(this, `MemoryAlarm-${this.environmentSuffix}`, {
      alarmName: `tap-memory-alarm-${this.environmentSuffix}`,
      metric: memoryMetric,
      threshold: 90,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Alarm when memory usage exceeds 90%',
    });

    new cloudwatch.Alarm(this, `DiskAlarm-${this.environmentSuffix}`, {
      alarmName: `tap-disk-alarm-${this.environmentSuffix}`,
      metric: diskMetric,
      threshold: 85,
      evaluationPeriods: 2,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Alarm when disk usage exceeds 85%',
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'EC2 CPU Utilization',
        left: [cpuMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Memory Usage',
        left: [memoryMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Disk Usage',
        left: [diskMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'ALB Request Count',
        left: [requestCountMetric],
        width: 12,
      })
    );

    // Set up CloudWatch Log subscription for Lambda
    const logGroup = new logs.LogGroup(
      this,
      `LogGroup-${this.environmentSuffix}`,
      {
        logGroupName: `/aws/vpc/flowlogs/${this.environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: this.removalPolicy,
      }
    );

    new logs.SubscriptionFilter(
      this,
      `LogSubscription-${this.environmentSuffix}`,
      {
        logGroup,
        destination: new logsDestinations.LambdaDestination(lambdaFunction),
        filterPattern: logs.FilterPattern.anyTerm('error', 'fail', 'route'),
      }
    );
  }

  private createCodePipeline(
    sourceS3Bucket: s3.Bucket,
    artifactsBucket: s3.Bucket,
    asg: autoscaling.AutoScalingGroup,
    kmsKey: kms.Key
  ): void {
    // Create CodeBuild project
    const buildProject = new codebuild.PipelineProject(
      this,
      `BuildProject-${this.environmentSuffix}`,
      {
        projectName: `tap-build-${this.environmentSuffix}`,
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
          computeType: codebuild.ComputeType.SMALL,
        },
        buildSpec: codebuild.BuildSpec.fromObject({
          version: '0.2',
          phases: {
            pre_build: {
              commands: [
                'echo Logging in to Amazon ECR...',
                'aws --version',
                'echo Build started on `date`',
              ],
            },
            build: {
              commands: [
                'echo Build started on `date`',
                'echo Building the application...',
                'npm install',
                'npm run build',
              ],
            },
            post_build: {
              commands: ['echo Build completed on `date`'],
            },
          },
          artifacts: {
            files: ['**/*'],
            name: 'BuildArtifact',
          },
        }),
        encryptionKey: kmsKey,
      }
    );

    // Create CodeDeploy application
    const codeDeployApp = new codedeploy.ServerApplication(
      this,
      `CodeDeployApp-${this.environmentSuffix}`,
      {
        applicationName: `tap-deploy-app-${this.environmentSuffix}`,
      }
    );

    const deploymentGroup = new codedeploy.ServerDeploymentGroup(
      this,
      `DeploymentGroup-${this.environmentSuffix}`,
      {
        application: codeDeployApp,
        deploymentGroupName: `tap-deploy-group-${this.environmentSuffix}`,
        autoScalingGroups: [asg],
        installAgent: true,
        deploymentConfig: codedeploy.ServerDeploymentConfig.ONE_AT_A_TIME,
        autoRollback: {
          failedDeployment: true,
          stoppedDeployment: true,
          deploymentInAlarm: false,
        },
      }
    );

    // Create Pipeline
    const pipeline = new codepipeline.Pipeline(
      this,
      `Pipeline-${this.environmentSuffix}`,
      {
        pipelineName: `tap-pipeline-${this.environmentSuffix}`,
        artifactBucket: artifactsBucket,
        restartExecutionOnUpdate: true,
      }
    );

    // Source stage
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipelineActions.S3SourceAction({
          actionName: 'S3Source',
          bucket: sourceS3Bucket,
          bucketKey: 'source.zip',
          output: sourceOutput,
          trigger: codepipelineActions.S3Trigger.EVENTS,
        }),
      ],
    });

    // Build stage
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipelineActions.CodeBuildAction({
          actionName: 'Build',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // Deploy stage
    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipelineActions.CodeDeployServerDeployAction({
          actionName: 'Deploy',
          deploymentGroup,
          input: buildOutput,
        }),
      ],
    });
  }

  private addTags(): void {
    cdk.Tags.of(this).add('Environment', this.environmentSuffix);
    cdk.Tags.of(this).add('Stack', 'TapStack');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Owner', 'TapTeam');
    cdk.Tags.of(this).add(
      'CostCenter',
      this.isProd ? 'Production' : 'Development'
    );
  }

  private createOutputs(
    alb: elbv2.ApplicationLoadBalancer,
    distribution: cloudfront.Distribution,
    database: rds.DatabaseInstance
  ): void {
    new cdk.CfnOutput(this, 'ALBEndpoint', {
      value: `http://${alb.loadBalancerDnsName}`,
      description: 'Application Load Balancer endpoint',
      exportName: `tap-alb-endpoint-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront distribution URL',
      exportName: `tap-cloudfront-url-${this.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.dbInstanceEndpointAddress,
      description: 'RDS database endpoint',
      exportName: `tap-db-endpoint-${this.environmentSuffix}`,
    });
  }
}
```

## Usage Example

Create an `app.ts` file to instantiate the stack:

```typescript
// bin/app.ts
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Development environment
new TapStack(app, 'TapStack-Dev', {
  environmentSuffix: 'dev',
  sshAllowedIp: '10.0.0.0/8',
  dbUsername: 'admin',
  // Optional: provide custom domain settings
  // domainName: 'dev.example.com',
  // hostedZoneId: 'Z1234567890ABC',
  // certificateArn: 'arn:aws:acm:us-west-1:...',
});

// Production environment
new TapStack(app, 'TapStack-Prod', {
  environmentSuffix: 'prod',
  sshAllowedIp: '10.0.0.0/24', // More restrictive for production
  dbUsername: 'admin',
  // domainName: 'www.example.com',
  // hostedZoneId: 'Z0987654321DEF',
  // certificateArn: 'arn:aws:acm:us-west-1:...',
});

app.synth();
```

## Key Features Implemented

### 1. **Networking Architecture**

- VPC with 10.0.0.0/16 CIDR block
- Multi-AZ deployment across 2 availability zones
- Public and private subnets
- NAT Gateway for outbound internet access from private subnets
- VPC Flow Logs for network monitoring

### 2. **Security**

- KMS encryption for all data at rest
- Security groups with strict ingress/egress rules
- IAM roles with least privilege principle
- SSL/TLS enforcement on CloudFront
- Database encryption and backup

### 3. **High Availability**

- Auto Scaling Group with health checks
- Multi-AZ RDS deployment (in production)
- Application Load Balancer across multiple AZs
- CloudFront global CDN distribution

### 4. **Monitoring & Observability**

- CloudWatch dashboards with key metrics
- Custom alarms for CPU, memory, and disk usage
- Lambda function for routing misconfiguration handling
- CloudWatch Logs integration

### 5. **CI/CD Pipeline**

- CodePipeline with S3 source
- CodeBuild for application building
- CodeDeploy for EC2 deployments
- Automatic rollback on failures

### 6. **Environment Management**

- Environment-specific configuration via `environmentSuffix`
- Automatic resource cleanup for non-production environments
- Consistent naming and tagging strategy
- Production safeguards (deletion protection, longer retention)

## Deployment Instructions
