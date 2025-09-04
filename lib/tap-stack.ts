import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

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

    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      Department: 'Engineering',
      Project: 'TapApplication',
    };

    // Apply tags to the stack
    cdk.Tags.of(this).add('Environment', commonTags.Environment);
    cdk.Tags.of(this).add('Department', commonTags.Department);
    cdk.Tags.of(this).add('Project', commonTags.Project);

    // 1. VPC Setup with public and private subnets across 2 AZs
    const vpc = new ec2.Vpc(this, `TapVpc-${environmentSuffix}`, {
      ipProtocol: ec2.IpProtocol.DUAL_STACK,
      maxAzs: 2,
      natGateways: 2, // One NAT Gateway per AZ for high availability
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
          cidrMask: 28,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Enable VPC Flow Logs for security monitoring
    const flowLogRole = new iam.Role(
      this,
      `VpcFlowLogRole-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
        inlinePolicies: {
          FlowLogsPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                  'logs:DescribeLogGroups',
                  'logs:DescribeLogStreams',
                ],
                resources: ['*'],
              }),
            ],
          }),
        },
      }
    );

    const flowLogGroup = new logs.LogGroup(
      this,
      `VpcFlowLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/vpc/flowlogs/${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    new ec2.FlowLog(this, `VpcFlowLog-${environmentSuffix}`, {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        flowLogGroup,
        flowLogRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // 2. KMS Key for encryption
    const kmsKey = new kms.Key(this, `TapKmsKey-${environmentSuffix}`, {
      description: `KMS key for TAP application ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 3. S3 Bucket with versioning and encryption
    const s3Bucket = new s3.Bucket(this, `TapS3Bucket-${environmentSuffix}`, {
      bucketName: `tap-application-bucket-${environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // 4. DynamoDB Table with on-demand capacity and encryption
    const dynamoTable = new dynamodb.Table(
      this,
      `TapDynamoTable-${environmentSuffix}`,
      {
        tableName: `tap-application-table-${environmentSuffix}`,
        partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
        encryptionKey: kmsKey,
        pointInTimeRecovery: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // 5. RDS Aurora Cluster with Multi-AZ setup
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `TapDbSubnetGroup-${environmentSuffix}`,
      {
        description: 'Subnet group for TAP RDS Aurora cluster',
        vpc: vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      }
    );

    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `TapDbSecurityGroup-${environmentSuffix}`,
      {
        vpc: vpc,
        description: 'Security group for RDS Aurora cluster',
        allowAllOutbound: false,
      }
    );

    const auroraCluster = new rds.DatabaseCluster(
      this,
      `TapAuroraCluster-${environmentSuffix}`,
      {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_4,
        }),
        writer: rds.ClusterInstance.provisioned('writer', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MEDIUM
          ),
          publiclyAccessible: false,
        }),
        readers: [
          rds.ClusterInstance.provisioned('reader', {
            instanceType: ec2.InstanceType.of(
              ec2.InstanceClass.T3,
              ec2.InstanceSize.MEDIUM
            ),
            publiclyAccessible: false,
          }),
        ],
        vpc: vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [dbSecurityGroup],
        storageEncrypted: true,
        storageEncryptionKey: kmsKey,
        backup: {
          retention: cdk.Duration.days(7),
        },
        deletionProtection: false, // Set to true for production
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // 6. Security Groups for EC2 instances
    const webServerSecurityGroup = new ec2.SecurityGroup(
      this,
      `TapWebServerSg-${environmentSuffix}`,
      {
        vpc: vpc,
        description: 'Security group for web servers',
        allowAllOutbound: true,
      }
    );

    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `TapAlbSg-${environmentSuffix}`,
      {
        vpc: vpc,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: true,
      }
    );

    // Allow HTTP and HTTPS traffic to ALB
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP'
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS'
    );

    // Allow traffic from ALB to web servers
    webServerSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );
    webServerSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(443),
      'Allow HTTPS from ALB'
    );

    // Allow database access from web servers
    dbSecurityGroup.addIngressRule(
      webServerSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from web servers'
    );

    // 7. IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, `TapEc2Role-${environmentSuffix}`, {
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

    // Grant limited S3 access
    s3Bucket.grantReadWrite(ec2Role);

    // Grant DynamoDB access
    dynamoTable.grantReadWriteData(ec2Role);

    // Grant KMS access
    kmsKey.grantEncryptDecrypt(ec2Role);

    new iam.InstanceProfile(this, `TapInstanceProfile-${environmentSuffix}`, {
      role: ec2Role,
    });

    // 8. Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `TapAlb-${environmentSuffix}`,
      {
        vpc: vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `TapTargetGroup-${environmentSuffix}`,
      {
        vpc: vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          interval: cdk.Duration.seconds(30),
          path: '/health',
          protocol: elbv2.Protocol.HTTP,
          timeout: cdk.Duration.seconds(5),
          unhealthyThresholdCount: 2,
        },
      }
    );

    alb.addListener(`TapListener-${environmentSuffix}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // 9. Auto Scaling Group
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'amazon-linux-extras install -y docker',
      'service docker start',
      'usermod -a -G docker ec2-user',
      // Add health check endpoint
      'mkdir -p /var/www/html',
      'echo "OK" > /var/www/html/health',
      'python3 -m http.server 80 --directory /var/www/html &'
    );

    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `TapLaunchTemplate-${environmentSuffix}`,
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        securityGroup: webServerSecurityGroup,
        role: ec2Role,
        userData: userData,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              encrypted: true,
            }),
          },
        ],
      }
    );

    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      `TapAsg-${environmentSuffix}`,
      {
        vpc: vpc,
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
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 1,
          minInstancesInService: 1,
        }),
      }
    );

    // Attach ASG to target group
    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // Add scaling policies
    autoScalingGroup.scaleOnCpuUtilization(
      `TapCpuScaling-${environmentSuffix}`,
      {
        targetUtilizationPercent: 70,
        cooldown: cdk.Duration.minutes(5),
      }
    );

    // 10. CloudFront Distribution
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      `TapOai-${environmentSuffix}`,
      {
        comment: `OAI for TAP application ${environmentSuffix}`,
      }
    );

    s3Bucket.grantRead(originAccessIdentity);

    const distribution = new cloudfront.Distribution(
      this,
      `TapCloudFront-${environmentSuffix}`,
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
        additionalBehaviors: {
          '/static/*': {
            origin: new origins.S3Origin(s3Bucket, {
              originAccessIdentity: originAccessIdentity,
            }),
            viewerProtocolPolicy:
              cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            compress: true,
            cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          },
        },
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        enabled: true,
        comment: `CloudFront distribution for TAP application ${environmentSuffix}`,
      }
    );

    // 11. CloudWatch Log Groups for application logs
    new logs.LogGroup(this, `TapAppLogGroup-${environmentSuffix}`, {
      logGroupName: `/aws/ec2/tap-application/${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 12. Output important values
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'DynamoTableName', {
      value: dynamoTable.tableName,
      description: 'DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'RdsClusterEndpoint', {
      value: auroraCluster.clusterEndpoint.hostname,
      description: 'RDS Aurora Cluster Endpoint',
    });
  }
}
