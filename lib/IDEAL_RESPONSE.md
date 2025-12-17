```typescript
import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Common tags for all resources
    const commonTags = {
      Owner: 'DevOps Team',
      Purpose: '3-Tier Web Application',
    };

    // Create VPC with public and private subnets across 2 AZs
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      vpcName: `tap-vpc-${environmentSuffix}`,
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
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
        {
          cidrMask: 24,
          name: 'DatabaseSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      natGateways: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Apply tags to VPC
    cdk.Tags.of(vpc).add('Owner', commonTags.Owner);
    cdk.Tags.of(vpc).add('Purpose', commonTags.Purpose);

    // Security Group for ALB - Allow HTTP/HTTPS from internet
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      securityGroupName: `tap-alb-sg-${environmentSuffix}`,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    cdk.Tags.of(albSecurityGroup).add('Owner', commonTags.Owner);
    cdk.Tags.of(albSecurityGroup).add('Purpose', commonTags.Purpose);

    // Security Group for EC2 - Allow traffic only from ALB
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc,
      securityGroupName: `tap-ec2-sg-${environmentSuffix}`,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    cdk.Tags.of(ec2SecurityGroup).add('Owner', commonTags.Owner);
    cdk.Tags.of(ec2SecurityGroup).add('Purpose', commonTags.Purpose);

    // Security Group for RDS - Allow traffic only from EC2
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      securityGroupName: `tap-rds-sg-${environmentSuffix}`,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL traffic from EC2'
    );

    cdk.Tags.of(rdsSecurityGroup).add('Owner', commonTags.Owner);
    cdk.Tags.of(rdsSecurityGroup).add('Purpose', commonTags.Purpose);

    // KMS Key for RDS encryption
    const rdsKmsKey = new kms.Key(this, 'RdsKmsKey', {
      description: `KMS key for RDS encryption - ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    cdk.Tags.of(rdsKmsKey).add('Owner', commonTags.Owner);
    cdk.Tags.of(rdsKmsKey).add('Purpose', commonTags.Purpose);

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DbSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    cdk.Tags.of(dbSubnetGroup).add('Owner', commonTags.Owner);
    cdk.Tags.of(dbSubnetGroup).add('Purpose', commonTags.Purpose);

    // RDS Instance
    const database = new rds.DatabaseInstance(this, 'TapDatabase', {
      instanceIdentifier: `tap-database-${environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_35,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      multiAz: true,
      storageEncrypted: true,
      storageEncryptionKey: rdsKmsKey,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false,
      databaseName: 'tapdb',
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: `tap-db-credentials-${environmentSuffix}`,
      }),
      publiclyAccessible: false,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    cdk.Tags.of(database).add('Owner', commonTags.Owner);
    cdk.Tags.of(database).add('Purpose', commonTags.Purpose);

    // IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, 'Ec2Role', {
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

    cdk.Tags.of(ec2Role).add('Owner', commonTags.Owner);
    cdk.Tags.of(ec2Role).add('Purpose', commonTags.Purpose);

    // User Data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Hello from TAP Application Server</h1>" > /var/www/html/index.html',
      'yum install -y amazon-cloudwatch-agent'
    );

    // Launch Template for Auto Scaling Group
    const launchTemplate = new ec2.LaunchTemplate(this, 'TapLaunchTemplate', {
      launchTemplateName: `tap-lt-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      userData,
    });

    cdk.Tags.of(launchTemplate).add('Owner', commonTags.Owner);
    cdk.Tags.of(launchTemplate).add('Purpose', commonTags.Purpose);

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'TapAutoScalingGroup',
      {
        autoScalingGroupName: `tap-asg-${environmentSuffix}`,
        vpc,
        launchTemplate,
        minCapacity: 2,
        maxCapacity: 6,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.seconds(300),
        }),
      }
    );

    cdk.Tags.of(autoScalingGroup).add('Owner', commonTags.Owner);
    cdk.Tags.of(autoScalingGroup).add('Purpose', commonTags.Purpose);

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'TapAlb', {
      vpc,
      loadBalancerName: `tap-alb-${environmentSuffix}`,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    cdk.Tags.of(alb).add('Owner', commonTags.Owner);
    cdk.Tags.of(alb).add('Purpose', commonTags.Purpose);

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'TapTargetGroup',
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 5,
        },
      }
    );

    cdk.Tags.of(targetGroup).add('Owner', commonTags.Owner);
    cdk.Tags.of(targetGroup).add('Purpose', commonTags.Purpose);

    // Add Auto Scaling Group to Target Group
    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // ALB Listener
    alb.addListener('TapListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // CloudWatch Alarms for Auto Scaling
    const cpuUtilization = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
      },
    });

    const cpuHighAlarm = new cloudwatch.Alarm(this, 'CpuHighAlarm', {
      metric: cpuUtilization,
      threshold: 70,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    const cpuLowAlarm = new cloudwatch.Alarm(this, 'CpuLowAlarm', {
      metric: cpuUtilization,
      threshold: 30,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    });

    cdk.Tags.of(cpuHighAlarm).add('Owner', commonTags.Owner);
    cdk.Tags.of(cpuHighAlarm).add('Purpose', commonTags.Purpose);
    cdk.Tags.of(cpuLowAlarm).add('Owner', commonTags.Owner);
    cdk.Tags.of(cpuLowAlarm).add('Purpose', commonTags.Purpose);

    // Auto Scaling Policies with Target Tracking
    autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 50,
      cooldown: cdk.Duration.seconds(60),
      scaleInCooldown: cdk.Duration.seconds(180),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // S3 Bucket for static content
    const staticContentBucket = new s3.Bucket(this, 'TapStaticContentBucket', {
      bucketName: `tap-static-content-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    cdk.Tags.of(staticContentBucket).add('Owner', commonTags.Owner);
    cdk.Tags.of(staticContentBucket).add('Purpose', commonTags.Purpose);

    // Origin Access Control for CloudFront
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'TapOai',
      {
        comment: 'OAI for TAP static content',
      }
    );

    // Grant CloudFront access to S3 bucket
    staticContentBucket.grantRead(originAccessIdentity);

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'TapDistribution', {
      defaultBehavior: {
        origin: new origins.S3BucketOrigin(staticContentBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enabled: true,
      comment: 'TAP Application CloudFront Distribution',
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
    });

    cdk.Tags.of(distribution).add('Owner', commonTags.Owner);
    cdk.Tags.of(distribution).add('Purpose', commonTags.Purpose);

    // Route 53 Hosted Zone
    const hostedZone = new route53.HostedZone(this, 'TapHostedZone', {
      zoneName: `tap-app-${environmentSuffix}.example.com`,
      comment: 'Hosted zone for TAP application',
    });

    cdk.Tags.of(hostedZone).add('Owner', commonTags.Owner);
    cdk.Tags.of(hostedZone).add('Purpose', commonTags.Purpose);

    // Route 53 A Record pointing to ALB
    new route53.ARecord(this, 'TapARecord', {
      zone: hostedZone,
      recordName: 'api',
      target: route53.RecordTarget.fromAlias(
        new targets.LoadBalancerTarget(alb)
      ),
    });

    // Route 53 AAAA Record pointing to ALB (IPv6)
    new route53.AaaaRecord(this, 'TapAaaaRecord', {
      zone: hostedZone,
      recordName: 'api',
      target: route53.RecordTarget.fromAlias(
        new targets.LoadBalancerTarget(alb)
      ),
    });

    // Route 53 A Record pointing to CloudFront
    new route53.ARecord(this, 'TapCloudfrontARecord', {
      zone: hostedZone,
      recordName: 'www',
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
      exportName: `${this.stackName}-LoadBalancerDnsName`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
      exportName: `${this.stackName}-CloudFrontDomainName`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
      exportName: `${this.stackName}-DatabaseEndpoint`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: staticContentBucket.bucketName,
      description: 'S3 Bucket Name for Static Content',
      exportName: `${this.stackName}-S3BucketName`,
    });

    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: hostedZone.hostedZoneId,
      description: 'Route 53 Hosted Zone ID',
      exportName: `${this.stackName}-HostedZoneId`,
    });
  }
}

// CDK App
const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

new TapStack(app, `TapStack${environmentSuffix}`, {
  stackName: `TapStack${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

app.synth();
```