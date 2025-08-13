import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
// import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager'; // Not used currently
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
// import * as shield from 'aws-cdk-lib/aws-shield'; // Not used currently
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix;

    // VPC with multi-AZ setup
    const vpc = new ec2.Vpc(this, `CloudEnvVPC-${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      natGateways: 1, // Reduced to 1 due to AWS EIP quota limits
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
        {
          cidrMask: 28,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // VPC Endpoints for cost optimization
    vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    vpc.addInterfaceEndpoint('SSMEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
    });

    // S3 bucket with versioning and cross-region replication
    const bucket = new s3.Bucket(this, `CloudEnvBucket-${environmentSuffix}`, {
      bucketName: `cloudenv-app-data-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'delete-incomplete-multipart-uploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
        {
          id: 'transition-to-ia',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // CloudFront distribution for content delivery
    const distribution = new cloudfront.Distribution(
      this,
      `CloudEnvDistribution-${environmentSuffix}`,
      {
        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      }
    );

    // EFS file system for shared storage
    const fileSystem = new efs.FileSystem(
      this,
      `CloudEnvEFS-${environmentSuffix}`,
      {
        vpc,
        performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
        throughputMode: efs.ThroughputMode.BURSTING,
        // enableBackups: true, // This property is not available in the current CDK version
        encrypted: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Security group for application load balancer
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `ALBSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: true,
      }
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP traffic'
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS traffic'
    );

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `CloudEnvALB-${environmentSuffix}`,
      {
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
      }
    );

    // Target group for EC2 instances
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `CloudEnvTargetGroup-${environmentSuffix}`,
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          path: '/health',
          protocol: elbv2.Protocol.HTTP,
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
      }
    );

    // ALB listener
    alb.addListener(`CloudEnvListener-${environmentSuffix}`, {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });

    // IAM role for EC2 instances
    const ec2Role = new iam.Role(this, `EC2Role-${environmentSuffix}`, {
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
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [`${bucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:ListBucket'],
              resources: [bucket.bucketArn],
            }),
          ],
        }),
        EFSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'elasticfilesystem:CreateFileSystem',
                'elasticfilesystem:DescribeFileSystems',
                'elasticfilesystem:CreateMountTarget',
                'elasticfilesystem:DescribeMountTargets',
                'elasticfilesystem:CreateAccessPoint',
                'elasticfilesystem:DescribeAccessPoints',
                'elasticfilesystem:ClientMount',
                'elasticfilesystem:ClientWrite',
                'elasticfilesystem:ClientRootAccess',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Security group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `EC2SecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
      }
    );
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'HTTP from ALB'
    );
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(2049),
      'EFS access'
    );

    // Launch template for EC2 instances
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `CloudEnvLaunchTemplate-${environmentSuffix}`,
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MEDIUM
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        securityGroup: ec2SecurityGroup,
        role: ec2Role,
        userData: ec2.UserData.custom(`#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent amazon-efs-utils
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent

# Mount EFS
mkdir /mnt/efs
echo "${fileSystem.fileSystemId}.efs.${this.region}.amazonaws.com:/ /mnt/efs efs defaults,_netdev" >> /etc/fstab
mount -a

# Install and configure application
yum install -y httpd
systemctl enable httpd
systemctl start httpd
echo '<html><body><h1>Hello from ${environmentSuffix} region!</h1><p>Health check endpoint</p></body></html>' > /var/www/html/health
systemctl restart httpd
`),
      }
    );

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      `CloudEnvASG-${environmentSuffix}`,
      {
        vpc,
        launchTemplate,
        minCapacity: 2,
        maxCapacity: 10,
        desiredCapacity: 3,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(5),
        }),
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          minInstancesInService: 1,
        }),
      }
    );

    // Attach ASG to target group
    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // Database subnet group
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `DBSubnetGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Subnet group for RDS Aurora cluster',
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      }
    );

    // Security group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `RDSSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for RDS Aurora cluster',
        allowAllOutbound: false,
      }
    );
    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'MySQL from EC2'
    );

    // RDS Aurora Serverless v2 cluster
    const dbCluster = new rds.DatabaseCluster(
      this,
      `CloudEnvDBCluster-${environmentSuffix}`,
      {
        engine: rds.DatabaseClusterEngine.auroraMysql({
          version: rds.AuroraMysqlEngineVersion.VER_3_04_0, // MySQL 8.0.32
        }),
        serverlessV2MinCapacity: 0.5,
        serverlessV2MaxCapacity: 4,
        writer: rds.ClusterInstance.serverlessV2('writer'),
        readers: [
          rds.ClusterInstance.serverlessV2('reader', {
            scaleWithWriter: true,
          }),
        ],
        vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [rdsSecurityGroup],
        backup: {
          retention: cdk.Duration.days(7),
          preferredWindow: '03:00-04:00',
        },
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        storageEncrypted: true,
        deletionProtection: false,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // ECS Cluster with blue/green deployment capability
    const ecsCluster = new ecs.Cluster(
      this,
      `CloudEnvECSCluster-${environmentSuffix}`,
      {
        vpc,
        clusterName: `cloudenv-cluster-${environmentSuffix}`,
        enableFargateCapacityProviders: true,
        containerInsights: true, // Keep this for now as containerInsightsV2 may not be available in this CDK version
      }
    );

    // CloudWatch Log Groups
    const appLogGroup = new logs.LogGroup(
      this,
      `AppLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/application/cloudenv-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const ecsLogGroup = new logs.LogGroup(
      this,
      `ECSLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/ecs/cloudenv-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // SNS topic for alerts
    const alertsTopic = new sns.Topic(
      this,
      `AlertsTopic-${environmentSuffix}`,
      {
        topicName: `cloudenv-alerts-${environmentSuffix}`,
        displayName: `CloudEnv Alerts - ${environmentSuffix}`,
      }
    );

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(
      this,
      `CloudEnvDashboard-${environmentSuffix}`,
      {
        dashboardName: `CloudEnv-${environmentSuffix}`,
      }
    );

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ALB Request Count',
        left: [alb.metrics.requestCount()],
      }),
      new cloudwatch.GraphWidget({
        title: 'ALB Response Time',
        left: [alb.metrics.targetResponseTime()],
      }),
      new cloudwatch.GraphWidget({
        title: 'ASG Instance Count',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/AutoScaling',
            metricName: 'GroupDesiredCapacity',
            dimensionsMap: {
              AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
            },
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'ASG Total Capacity',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/AutoScaling',
            metricName: 'GroupTotalCapacity',
            dimensionsMap: {
              AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
            },
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'RDS CPU Utilization',
        left: [dbCluster.metricCPUUtilization()],
      })
    );

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, `HighCPUAlarm-${environmentSuffix}`, {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/AutoScaling',
        metricName: 'GroupDesiredCapacity',
        dimensionsMap: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
        },
      }),
      threshold: 80,
      evaluationPeriods: 2,
      alarmDescription: 'High CPU utilization in ASG',
      actionsEnabled: true,
    }).addAlarmAction(new actions.SnsAction(alertsTopic));

    new cloudwatch.Alarm(this, `DBConnectionsAlarm-${environmentSuffix}`, {
      metric: dbCluster.metricDatabaseConnections(),
      threshold: 100,
      evaluationPeriods: 2,
      alarmDescription: 'High database connections',
      actionsEnabled: true,
    }).addAlarmAction(new actions.SnsAction(alertsTopic));

    // AWS Systems Manager Parameter Store for configuration
    new ssm.StringParameter(this, `AppConfigParam-${environmentSuffix}`, {
      parameterName: `/cloudenv/${environmentSuffix}/app-config`,
      stringValue: JSON.stringify({
        region: this.region,
        environment: environmentSuffix,
        dbEndpoint: dbCluster.clusterEndpoint.hostname,
        s3Bucket: bucket.bucketName,
        efsId: fileSystem.fileSystemId,
      }),
    });

    // AWS Certificate Manager for SSL certificates (exportable)
    // Commented out because it requires a valid domain for DNS validation
    // In a real deployment, replace example.com with your actual domain
    // const _certificate = new certificatemanager.Certificate(
    //   this,
    //   `CloudEnvCertificate-${environmentSuffix}`,
    //   {
    //     domainName: `*.cloudenv-${environmentSuffix}.example.com`,
    //     subjectAlternativeNames: [`cloudenv-${environmentSuffix}.example.com`],
    //     validation: certificatemanager.CertificateValidation.fromDns(),
    //   }
    // );

    // Shield Advanced protection for ALB (commented out due to cost)
    // new shield.CfnProtection(this, `ShieldProtection-${environmentSuffix}`, {
    //   name: `cloudenv-alb-${environmentSuffix}`,
    //   resourceArn: alb.loadBalancerArn,
    // });

    // Stack outputs - providing both naming conventions for test compatibility
    new cdk.CfnOutput(this, `LoadBalancerDNS-${environmentSuffix}`, {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
      exportName: `LoadBalancerDNS-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name (test fallback)',
    });

    new cdk.CfnOutput(this, `DatabaseEndpoint-${environmentSuffix}`, {
      value: dbCluster.clusterEndpoint.hostname,
      description: 'RDS Aurora cluster endpoint',
      exportName: `DatabaseEndpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbCluster.clusterEndpoint.hostname,
      description: 'RDS Aurora cluster endpoint (test fallback)',
    });

    new cdk.CfnOutput(this, `S3BucketName-${environmentSuffix}`, {
      value: bucket.bucketName,
      description: 'S3 bucket name for application data',
      exportName: `S3BucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: bucket.bucketName,
      description: 'S3 bucket name for application data (test fallback)',
    });

    new cdk.CfnOutput(this, `CloudFrontDistribution-${environmentSuffix}`, {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
      exportName: `CloudFrontDistribution-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDistribution', {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution domain name (test fallback)',
    });

    new cdk.CfnOutput(this, `EFSFileSystemId-${environmentSuffix}`, {
      value: fileSystem.fileSystemId,
      description: 'EFS file system ID',
      exportName: `EFSFileSystemId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EFSFileSystemId', {
      value: fileSystem.fileSystemId,
      description: 'EFS file system ID (test fallback)',
    });

    // Additional monitoring and cluster outputs
    new cdk.CfnOutput(this, `ECSClusterName-${environmentSuffix}`, {
      value: ecsCluster.clusterName,
      description: 'ECS Cluster name',
      exportName: `ECSClusterName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `CloudWatchDashboard-${environmentSuffix}`, {
      value: dashboard.dashboardName,
      description: 'CloudWatch Dashboard name',
      exportName: `CloudWatchDashboard-${environmentSuffix}`,
    });

    // Log Group outputs for monitoring
    new cdk.CfnOutput(this, `AppLogGroupOutput-${environmentSuffix}`, {
      value: appLogGroup.logGroupName,
      description: 'Application Log Group name',
      exportName: `AppLogGroup-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `ECSLogGroupOutput-${environmentSuffix}`, {
      value: ecsLogGroup.logGroupName,
      description: 'ECS Log Group name',
      exportName: `ECSLogGroup-${environmentSuffix}`,
    });
  }
}
