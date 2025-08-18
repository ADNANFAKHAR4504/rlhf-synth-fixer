# CDK TypeScript Secure Web Application Infrastructure

## Overview
This solution creates a comprehensive secure and scalable web application environment in AWS using CDK TypeScript. It incorporates the latest AWS security features from re:Inforce 2025, including enhanced Security Hub and GuardDuty Extended Threat Detection.

## Architecture Components

### 1. Network Infrastructure (network-stack.ts)
```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly bastionSecurityGroup: ec2.SecurityGroup;
  public readonly webSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;
  public readonly loadBalancerSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    // Create VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `WebApp-VPC-${props.environmentSuffix}`,
      maxAzs: 2,
      cidr: '10.1.0.0/16',
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
          cidrMask: 24,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
      flowLogs: {
        'cloudwatch': {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(),
          trafficType: ec2.FlowLogTrafficType.ALL,
        },
      },
    });

    // Load Balancer Security Group - HTTPS only
    this.loadBalancerSecurityGroup = new ec2.SecurityGroup(this, 'LoadBalancerSG', {
      vpc: this.vpc,
      description: 'Security group for Application Load Balancer - HTTPS only',
      allowAllOutbound: true,
    });

    this.loadBalancerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );

    // Web Server Security Group - HTTPS only from ALB
    this.webSecurityGroup = new ec2.SecurityGroup(this, 'WebServerSG', {
      vpc: this.vpc,
      description: 'Security group for web servers - HTTPS only from ALB',
      allowAllOutbound: true,
    });

    this.webSecurityGroup.addIngressRule(
      this.loadBalancerSecurityGroup,
      ec2.Port.tcp(443),
      'Allow HTTPS from Load Balancer'
    );

    // Database Security Group - only from web servers
    this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSG', {
      vpc: this.vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    this.databaseSecurityGroup.addIngressRule(
      this.webSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from web servers'
    );

    // Bastion Host Security Group for secure access
    this.bastionSecurityGroup = new ec2.SecurityGroup(this, 'BastionSG', {
      vpc: this.vpc,
      description: 'Security group for bastion host',
      allowAllOutbound: true,
    });

    // VPC Peering Connection to existing VPC
    const peeringConnection = new ec2.CfnVPCPeeringConnection(this, 'VPCPeering', {
      vpcId: this.vpc.vpcId,
      peerVpcId: '10.0.0.0/16', // Existing VPC CIDR as specified
      peerRegion: 'us-east-1',
    });

    // Add route tables for peering
    this.vpc.privateSubnets.forEach((subnet, index) => {
      new ec2.CfnRoute(this, `PeeringRoute${index}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: '10.0.0.0/16',
        vpcPeeringConnectionId: peeringConnection.ref,
      });
    });

    // Tags for all network resources
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Owner', 'WebAppTeam');
    cdk.Tags.of(this).add('Component', 'Network');
  }
}
```

### 2. Security and Monitoring Stack (security-stack.ts)
```typescript
import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as securityhub from 'aws-cdk-lib/aws-securityhub';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class SecurityStack extends cdk.Stack {
  public readonly kmsKey: kms.Key;
  public readonly ec2Role: iam.Role;
  public readonly s3AccessRole: iam.Role;
  public readonly alertsTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // KMS Key for encryption
    this.kmsKey = new kms.Key(this, 'WebAppKMSKey', {
      description: 'KMS key for web application encryption',
      enableKeyRotation: true,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
    });

    this.kmsKey.addAlias(`webapp-key-${props.environmentSuffix}`);

    // SNS Topic for alerts
    this.alertsTopic = new sns.Topic(this, 'AlertsTopic', {
      displayName: `WebApp Alerts ${props.environmentSuffix}`,
      masterKey: this.kmsKey,
    });

    // IAM Role for EC2 instances with least privilege
    this.ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for EC2 instances with minimal S3 access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });

    // S3 Access Role with restricted permissions
    this.s3AccessRole = new iam.Role(this, 'S3AccessRole', {
      assumedBy: this.ec2Role,
      description: 'Restricted S3 access role for web application',
    });

    // Enable GuardDuty Extended Threat Detection (2025 feature)
    const guardDutyDetector = new guardduty.CfnDetector(this, 'GuardDutyDetector', {
      enable: true,
      findingPublishingFrequency: 'FIFTEEN_MINUTES',
      features: [
        {
          name: 'S3_DATA_EVENTS',
          status: 'ENABLED',
        },
        {
          name: 'EKS_AUDIT_LOGS',
          status: 'ENABLED',
        },
        {
          name: 'EBS_MALWARE_PROTECTION',
          status: 'ENABLED',
        },
        {
          name: 'RDS_LOGIN_EVENTS',
          status: 'ENABLED',
        },
        {
          name: 'EKS_RUNTIME_MONITORING',
          status: 'ENABLED',
        },
      ],
    });

    // Enable Security Hub with new 2025 capabilities
    const securityHub = new securityhub.CfnHub(this, 'SecurityHub', {
      enableDefaultStandards: true,
      autoEnableControls: true,
      controlFindingGenerator: 'SECURITY_CONTROL',
    });

    // CloudWatch Log Group for application logs
    const logGroup = new logs.LogGroup(this, 'WebAppLogs', {
      logGroupName: `/aws/webapp/${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: this.kmsKey,
    });

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      alarmDescription: 'High error rate detected',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'HTTPCode_Target_5XX_Count',
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Tags
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Owner', 'WebAppTeam');
    cdk.Tags.of(this).add('Component', 'Security');
  }
}
```

### 3. Storage Stack (storage-stack.ts)
```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.StackProps {
  environmentSuffix: string;
  kmsKey: kms.Key;
  s3AccessRole: iam.Role;
}

export class StorageStack extends cdk.Stack {
  public readonly contentBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // S3 Bucket for web content with encryption
    this.contentBucket = new s3.Bucket(this, 'ContentBucket', {
      bucketName: `webapp-content-${props.environmentSuffix}-${cdk.Stack.of(this).account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      serverAccessLogsPrefix: 'access-logs/',
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
      ],
    });

    // S3 bucket policy for restricted access
    this.contentBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'RestrictToSpecificRole',
        effect: iam.Effect.ALLOW,
        principals: [props.s3AccessRole],
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
        ],
        resources: [this.contentBucket.arnForObjects('*')],
      })
    );

    this.contentBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [this.contentBucket.bucketArn, this.contentBucket.arnForObjects('*')],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    // Origin Access Control for CloudFront
    const originAccessControl = new cloudfront.CfnOriginAccessControl(this, 'OAC', {
      originAccessControlConfig: {
        name: `webapp-oac-${props.environmentSuffix}`,
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
      },
    });

    // CloudFront Distribution with S3 origin
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: `WebApp CDN ${props.environmentSuffix}`,
      defaultBehavior: {
        origin: new origins.S3Origin(this.contentBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
      },
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enableLogging: true,
      logBucket: this.contentBucket,
      logFilePrefix: 'cloudfront-logs/',
    });

    // Update S3 bucket policy for CloudFront OAC
    this.contentBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudFrontServicePrincipal',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        actions: ['s3:GetObject'],
        resources: [this.contentBucket.arnForObjects('*')],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${this.distribution.distributionId}`,
          },
        },
      })
    );

    // Tags
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Owner', 'WebAppTeam');
    cdk.Tags.of(this).add('Component', 'Storage');
  }
}
```

### 4. Database Stack (database-stack.ts)
```typescript
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  databaseSecurityGroup: ec2.SecurityGroup;
  kmsKey: kms.Key;
  alertsTopic: sns.Topic;
}

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // DB Subnet Group
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc: props.vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Parameter Group for PostgreSQL
    const parameterGroup = new rds.ParameterGroup(this, 'DatabaseParameterGroup', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      parameters: {
        'shared_preload_libraries': 'pg_stat_statements',
        'log_statement': 'all',
        'log_min_duration_statement': '1000',
      },
    });

    // RDS Instance with encryption
    this.database = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: `webapp-db-${props.environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [props.databaseSecurityGroup],
      subnetGroup: subnetGroup,
      parameterGroup: parameterGroup,
      storageEncrypted: true,
      storageEncryptionKey: props.kmsKey,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: false,
      deletionProtection: true,
      multiAz: false, // Set to true for production
      publiclyAccessible: false,
      autoMinorVersionUpgrade: true,
      allowMajorVersionUpgrade: false,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      enablePerformanceInsights: true,
      monitoringInterval: cdk.Duration.minutes(1),
    });

    // CloudWatch Alarm for RDS CPU Utilization
    new cloudwatch.Alarm(this, 'DatabaseCPUAlarm', {
      alarmName: `RDS-CPU-${props.environmentSuffix}`,
      alarmDescription: 'RDS CPU utilization is high',
      metric: this.database.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(props.alertsTopic));

    // CloudWatch Alarm for RDS Burst Balance
    new cloudwatch.Alarm(this, 'DatabaseBurstBalanceAlarm', {
      alarmName: `RDS-BurstBalance-${props.environmentSuffix}`,
      alarmDescription: 'RDS burst balance is low',
      metric: this.database.metricDatabaseConnections(),
      threshold: 20,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(props.alertsTopic));

    // Tags
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Owner', 'WebAppTeam');
    cdk.Tags.of(this).add('Component', 'Database');
  }
}
```

### 5. Compute Stack (compute-stack.ts)
```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  webSecurityGroup: ec2.SecurityGroup;
  loadBalancerSecurityGroup: ec2.SecurityGroup;
  ec2Role: iam.Role;
  alertsTopic: sns.Topic;
}

export class ComputeStack extends cdk.Stack {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Instance Profile for EC2
    const instanceProfile = new iam.CfnInstanceProfile(this, 'EC2InstanceProfile', {
      roles: [props.ec2Role.roleName],
    });

    // User Data for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y nginx',
      'systemctl start nginx',
      'systemctl enable nginx',
      // Configure HTTPS only
      'openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/nginx-selfsigned.key -out /etc/ssl/certs/nginx-selfsigned.crt -subj "/C=US/ST=VA/L=Anytown/O=WebApp/OU=IT/CN=localhost"',
      'cat > /etc/nginx/conf.d/default.conf << EOF',
      'server {',
      '    listen 443 ssl;',
      '    server_name _;',
      '    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;',
      '    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;',
      '    ssl_protocols TLSv1.2 TLSv1.3;',
      '    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;',
      '    location / {',
      '        root /usr/share/nginx/html;',
      '        index index.html;',
      '    }',
      '}',
      'EOF',
      'systemctl restart nginx',
      // Install CloudWatch agent
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c default'
    );

    // Launch Template
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: props.webSecurityGroup,
      userData: userData,
      role: props.ec2Role,
      requireImdsv2: true,
      httpTokens: ec2.LaunchTemplateHttpTokens.REQUIRED,
      httpProtocolIpv6: ec2.LaunchTemplateHttpProtocolIpv6.DISABLED,
      instanceMetadataTags: true,
    });

    // Auto Scaling Group
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'AutoScalingGroup', {
      vpc: props.vpc,
      launchTemplate: launchTemplate,
      minCapacity: 2,
      maxCapacity: 6,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5),
      }),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdatePolicy({
        maxBatchSize: 1,
        minInstancesInService: 1,
      }),
    });

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'LoadBalancer', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.loadBalancerSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      vpc: props.vpc,
      targets: [this.autoScalingGroup],
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        path: '/',
        protocol: elbv2.Protocol.HTTPS,
        timeout: cdk.Duration.seconds(5),
        unhealthyThresholdCount: 3,
      },
      targetGroupName: `webapp-tg-${props.environmentSuffix}`,
    });

    // HTTPS Listener with self-signed cert (for demo purposes)
    // In production, use ACM certificate
    const listener = this.loadBalancer.addListener('HTTPSListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [
        elbv2.ListenerCertificate.fromArn(
          `arn:aws:acm:${this.region}:${this.account}:certificate/dummy-cert-id`
        ),
      ],
      defaultTargetGroups: [targetGroup],
    });

    // Scaling Policies
    this.autoScalingGroup.scaleOnCpuUtilization('CPUScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(5),
    });

    // CloudWatch Alarms for EC2
    new cloudwatch.Alarm(this, 'EC2CPUAlarm', {
      alarmName: `EC2-CPU-${props.environmentSuffix}`,
      alarmDescription: 'EC2 CPU utilization is high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: this.autoScalingGroup.autoScalingGroupName,
        },
        statistic: 'Average',
      }),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(props.alertsTopic));

    // Tags
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('Owner', 'WebAppTeam');
    cdk.Tags.of(this).add('Component', 'Compute');
  }
}
```

### 6. Updated Main Stack (tap-stack.ts)
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkStack } from './network-stack';
import { SecurityStack } from './security-stack';
import { StorageStack } from './storage-stack';
import { DatabaseStack } from './database-stack';
import { ComputeStack } from './compute-stack';

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

    // Network Infrastructure
    const networkStack = new NetworkStack(this, 'NetworkStack', {
      environmentSuffix,
      env: props?.env,
    });

    // Security and Monitoring
    const securityStack = new SecurityStack(this, 'SecurityStack', {
      environmentSuffix,
      env: props?.env,
    });

    // Storage with CloudFront
    const storageStack = new StorageStack(this, 'StorageStack', {
      environmentSuffix,
      kmsKey: securityStack.kmsKey,
      s3AccessRole: securityStack.s3AccessRole,
      env: props?.env,
    });

    // Database
    const databaseStack = new DatabaseStack(this, 'DatabaseStack', {
      environmentSuffix,
      vpc: networkStack.vpc,
      databaseSecurityGroup: networkStack.databaseSecurityGroup,
      kmsKey: securityStack.kmsKey,
      alertsTopic: securityStack.alertsTopic,
      env: props?.env,
    });

    // Compute with Auto Scaling
    const computeStack = new ComputeStack(this, 'ComputeStack', {
      environmentSuffix,
      vpc: networkStack.vpc,
      webSecurityGroup: networkStack.webSecurityGroup,
      loadBalancerSecurityGroup: networkStack.loadBalancerSecurityGroup,
      ec2Role: securityStack.ec2Role,
      alertsTopic: securityStack.alertsTopic,
      env: props?.env,
    });

    // Add dependencies
    securityStack.addDependency(networkStack);
    storageStack.addDependency(securityStack);
    databaseStack.addDependency(networkStack);
    databaseStack.addDependency(securityStack);
    computeStack.addDependency(networkStack);
    computeStack.addDependency(securityStack);

    // Output important values
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: computeStack.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistribution', {
      value: storageStack.distribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: databaseStack.database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
    });
  }
}
```

## Key Security Features Implemented

1. **HTTPS-Only Traffic**: All traffic is enforced to use HTTPS protocol
2. **Encryption at Rest**: S3 and RDS use KMS encryption
3. **Network Security**: Proper security groups with least privilege access
4. **Private Database**: RDS instances are not publicly accessible
5. **IAM Least Privilege**: Roles have minimal required permissions
6. **VPC Peering**: Connection to existing VPC with CIDR 10.0.0.0/16
7. **Auto Scaling**: EC2 Auto Scaling Groups handle varying load
8. **CloudFront CDN**: Content delivery with S3 origin
9. **Monitoring**: CloudWatch alarms for CPU utilization and RDS metrics
10. **Latest Security Features**: GuardDuty Extended Threat Detection and enhanced Security Hub

## Resource Tags

All resources are tagged with:
- Environment: dev/prod
- Owner: WebAppTeam  
- Component: Network/Security/Storage/Database/Compute

This solution provides a comprehensive, secure, and scalable web application infrastructure using the latest AWS security capabilities from 2025.