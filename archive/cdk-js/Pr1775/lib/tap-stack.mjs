import {
  CfnCondition,
  CfnOutput,
  CfnParameter,
  Duration,
  Fn,
  RemovalPolicy,
  Stack,
  Tags
} from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cfnSns from 'aws-cdk-lib/aws-sns';
import * as sns from 'aws-cdk-lib/aws-sns';

// ? Import your stacks here
// const { MyStack } = require('./my-stack');

class TapStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
    //
    // NOTE: Moving all resources directly into TapStack as requested

    // Parameters
    const amiId = new CfnParameter(this, 'AmiId', {
      type: 'AWS::EC2::Image::Id',
      description: 'AMI ID for EC2 instances',
      default: 'ami-0c7217cdde317cfec', // Amazon Linux 2023
    });

    const instanceType = new CfnParameter(this, 'InstanceType', {
      type: 'String',
      description: 'EC2 instance type',
      default: 'c5.large',
      allowedValues: [
        't3.medium',
        'c5.large',
        'c5.xlarge',
        'c5.2xlarge',
        'c5.4xlarge',
      ],
    });

    const dbUsername = new CfnParameter(this, 'DbUsername', {
      type: 'String',
      description: 'Database master username',
      default: 'dbadmin',
      minLength: 1,
      maxLength: 16,
      constraintDescription: 'Must be 1-16 characters',
    });

    const sshCidr = new CfnParameter(this, 'SshCidr', {
      type: 'String',
      description: 'CIDR block for SSH access to bastion host',
      default: '0.0.0.0/0',
      constraintDescription: 'Must be a valid CIDR range',
    });

    const minCapacity = new CfnParameter(this, 'MinCapacity', {
      type: 'Number',
      description: 'Minimum number of instances in Auto Scaling Group',
      default: 2,
      minValue: 1,
    });

    const maxCapacity = new CfnParameter(this, 'MaxCapacity', {
      type: 'Number',
      description: 'Maximum number of instances in Auto Scaling Group',
      default: 20,
      minValue: 1,
    });

    const desiredCapacity = new CfnParameter(this, 'DesiredCapacity', {
      type: 'Number',
      description: 'Desired number of instances in Auto Scaling Group',
      default: 4,
      minValue: 1,
    });

    const peerVpcId = new CfnParameter(this, 'PeerVpcId', {
      type: 'String',
      description: 'VPC ID for peering connection',
      default: '',
      constraintDescription: 'Must be a valid VPC ID or empty',
    });

    // Optional notification email parameter
    const notificationEmail = new CfnParameter(this, 'NotificationEmail', {
      type: 'String',
      description: 'Email address for CloudWatch alarms (optional)',
      default: 'none@example.com',
      constraintDescription: 'Must be a valid email address or use "none@example.com" to skip email notifications',
    });

    // Condition to check if email notifications should be enabled
    const enableEmailNotifications = new CfnCondition(this, 'EnableEmailNotifications', {
      expression: Fn.conditionAnd(
        Fn.conditionNot(Fn.conditionEquals(notificationEmail, '')),
        Fn.conditionNot(Fn.conditionEquals(notificationEmail, 'none@example.com'))
      )
    });

    // Condition to check if VPC peering should be enabled
    const enableVpcPeering = new CfnCondition(this, 'EnableVpcPeering', {
      expression: Fn.conditionNot(Fn.conditionEquals(peerVpcId, ''))
    });

    // KMS Key for encryption
    const kmsKey = new kms.Key(this, `AppKmsKey-${environmentSuffix}`, {
      description: `KMS key for application encryption - ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // Database credentials stored in Secrets Manager
    const databaseSecret = new secretsmanager.Secret(this, `DatabaseSecret-${environmentSuffix}`, {
      description: `Database credentials for ${environmentSuffix} environment`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: dbUsername.valueAsString }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
        includeSpace: false,
        passwordLength: 32,
      },
      encryptionKey: kmsKey,
    });

    // VPC with public and private subnets across multiple AZs
    const vpc = new ec2.Vpc(this, `AppVpc-${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      natGateways: 3, // One per AZ for high availability
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

    // Security Groups with least privilege
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `AlbSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: `Security group for Application Load Balancer - ${environmentSuffix}`,
        allowAllOutbound: false,
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

    const webServerSecurityGroup = new ec2.SecurityGroup(
      this,
      `WebServerSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: `Security group for web servers - ${environmentSuffix}`,
        allowAllOutbound: true,
      }
    );

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

    const bastionSecurityGroup = new ec2.SecurityGroup(
      this,
      `BastionSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: `Security group for bastion host - ${environmentSuffix}`,
        allowAllOutbound: true,
      }
    );

    bastionSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(sshCidr.valueAsString),
      ec2.Port.tcp(22),
      'Allow SSH access'
    );

    webServerSecurityGroup.addIngressRule(
      bastionSecurityGroup,
      ec2.Port.tcp(22),
      'Allow SSH from bastion'
    );

    const databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      `DatabaseSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: `Security group for RDS database - ${environmentSuffix}`,
        allowAllOutbound: false,
      }
    );

    databaseSecurityGroup.addIngressRule(
      webServerSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from web servers'
    );

    // IAM Roles with least privilege
    const ec2Role = new iam.Role(this, `EC2Role-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: ['arn:aws:s3:::*/*'],
      })
    );

    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
        resources: [kmsKey.keyArn],
      })
    );

    // Grant EC2 instances access to read database secret
    databaseSecret.grantRead(ec2Role);

    const instanceProfile = new iam.InstanceProfile(
      this,
      `EC2InstanceProfile-${environmentSuffix}`,
      {
        role: ec2Role,
      }
    );

    // Lambda execution role
    const lambdaRole = new iam.Role(this, `LambdaRole-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: ['arn:aws:s3:::*/*'],
      })
    );

    // S3 bucket with versioning and encryption
    const s3Bucket = new s3.Bucket(this, `AppS3Bucket-${environmentSuffix}`, {
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: Duration.days(30),
          enabled: true,
        },
      ],
    });

    // Lambda function log group (explicit to avoid deprecation warning)
    const s3ProcessorLogGroup = new logs.LogGroup(
      this,
      `S3ProcessorLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/lambda/S3ProcessorFunction-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: RemovalPolicy.DESTROY,
      },
    );

    // Lambda function for S3 event processing
    const s3ProcessorFunction = new lambda.Function(
      this,
      `S3ProcessorFunction-${environmentSuffix}`,
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        role: lambdaRole,
        logGroup: s3ProcessorLogGroup,
        code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('S3 Event received:', JSON.stringify(event, null, 2));
          
          for (const record of event.Records) {
            const bucket = record.s3.bucket.name;
            const key = record.s3.object.key;
            const eventName = record.eventName;
            
            console.log(\`Processing \${eventName} for object \${key} in bucket \${bucket}\`);
            
            // Add your processing logic here
            // For example: image resizing, data transformation, etc.
          }
          
          return { statusCode: 200, body: 'Processing completed' };
        };
      `),
        timeout: Duration.minutes(5),
      }
    );

    // S3 event notification to Lambda
    s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(s3ProcessorFunction)
    );

    // CloudFront distribution
    const cloudFrontDistribution = new cloudfront.Distribution(
      this,
      `AppCloudFrontDistribution-${environmentSuffix}`,
      {
        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessControl(s3Bucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          compress: true,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        enableLogging: true,
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      }
    );

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `AppLoadBalancer-${environmentSuffix}`,
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
      `AppTargetGroup-${environmentSuffix}`,
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          interval: Duration.seconds(30),
          path: '/health',
          protocol: elbv2.Protocol.HTTP,
          timeout: Duration.seconds(5),
          unhealthyThresholdCount: 3,
        },
      }
    );

    const listener = alb.addListener(`AppListener-${environmentSuffix}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // User data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Web Server $(hostname -f)</h1>" > /var/www/html/index.html',
      'echo "OK" > /var/www/html/health',
      // Install CloudWatch agent
      'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm',
      'rpm -U ./amazon-cloudwatch-agent.rpm'
    );

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      `AppAutoScalingGroup-${environmentSuffix}`,
      {
        vpc,
        instanceType: new ec2.InstanceType(instanceType.valueAsString),
        machineImage: ec2.MachineImage.genericLinux({
          'us-east-1': amiId.valueAsString,
        }),
        userData,
        role: ec2Role,
        securityGroup: webServerSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        minCapacity: minCapacity.valueAsNumber,
        maxCapacity: maxCapacity.valueAsNumber,
        desiredCapacity: desiredCapacity.valueAsNumber,
        healthCheck: autoscaling.HealthCheck.elb({
          grace: Duration.minutes(5),
        }),
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 2,
          minInstancesInService: 1,
        }),
      }
    );

    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // Auto Scaling Policies
    const scaleUpPolicy = autoScalingGroup.scaleOnCpuUtilization(
      `ScaleUpPolicy-${environmentSuffix}`,
      {
        targetUtilizationPercent: 70,
        scaleInCooldown: Duration.minutes(5),
        scaleOutCooldown: Duration.minutes(3),
      }
    );

    const scaleDownPolicy = autoScalingGroup.scaleOnRequestCount(
      `ScaleOnRequestCount-${environmentSuffix}`,
      {
        targetRequestsPerMinute: 1000,
      }
    );

    // Bastion Host
    const bastionHost = new ec2.Instance(
      this,
      `BastionHost-${environmentSuffix}`,
      {
        vpc,
        instanceType: new ec2.InstanceType('t3.micro'),
        machineImage: ec2.MachineImage.genericLinux({
          'us-east-1': amiId.valueAsString,
        }),
        securityGroup: bastionSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        role: ec2Role,
        userData: ec2.UserData.forLinux(),
      }
    );

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `DbSubnetGroup-${environmentSuffix}`,
      {
        vpc,
        description: `Subnet group for RDS database - ${environmentSuffix}`,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      }
    );

    // RDS PostgreSQL instance
    const database = new rds.DatabaseInstance(
      this,
      `AppDatabase-${environmentSuffix}`,
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_16_4
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MEDIUM
        ),
        credentials: rds.Credentials.fromSecret(databaseSecret),
        vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [databaseSecurityGroup],
        multiAz: true,
        storageEncrypted: true,
        storageEncryptionKey: kmsKey,
        backupRetention: Duration.days(7),
        deletionProtection: true,
        removalPolicy: RemovalPolicy.RETAIN,
        monitoringInterval: Duration.seconds(60),
        enablePerformanceInsights: true,
        performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      }
    );

    // SNS Topic for notifications
    const alertTopic = new sns.Topic(this, `AlertTopic-${environmentSuffix}`, {
      displayName: `Application Alerts - ${environmentSuffix}`,
    });

    // Create conditional email subscription using CloudFormation
    const emailSubscription = new cfnSns.CfnSubscription(this, `EmailSubscription-${environmentSuffix}`, {
      topicArn: alertTopic.topicArn,
      protocol: 'email',
      endpoint: notificationEmail.valueAsString,
    });
    emailSubscription.cfnOptions.condition = enableEmailNotifications;

    // CloudWatch Alarms
    const cpuAlarm = new cloudwatch.Alarm(
      this,
      `HighCpuAlarm-${environmentSuffix}`,
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
          },
          statistic: 'Average',
        }),
        threshold: 80,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    cpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    const albTargetResponseTime = new cloudwatch.Alarm(
      this,
      `AlbHighResponseTime-${environmentSuffix}`,
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApplicationELB',
          metricName: 'TargetResponseTime',
          dimensionsMap: {
            TargetGroup: targetGroup.targetGroupFullName,
          },
          statistic: 'Average',
        }),
        threshold: 1,
        evaluationPeriods: 2,
      }
    );

    albTargetResponseTime.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    const databaseConnections = new cloudwatch.Alarm(
      this,
      `DatabaseHighConnections-${environmentSuffix}`,
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'DatabaseConnections',
          dimensionsMap: {
            DBInstanceIdentifier: database.instanceIdentifier,
          },
          statistic: 'Average',
        }),
        threshold: 80,
        evaluationPeriods: 2,
      }
    );

    databaseConnections.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // VPC Peering (conditional)
    const vpcPeering = new ec2.CfnVPCPeeringConnection(
      this,
      `VpcPeeringConnection-${environmentSuffix}`,
      {
        vpcId: vpc.vpcId,
        peerVpcId: peerVpcId.valueAsString,
        peerRegion: this.region,
      }
    );
    vpcPeering.cfnOptions.condition = enableVpcPeering;

    // Add routes for peering connection
    vpc.privateSubnets.forEach((subnet, index) => {
      const peeringRoute = new ec2.CfnRoute(this, `PeeringRoute${index}-${environmentSuffix}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: '10.1.0.0/16', // Assuming peer VPC CIDR
        vpcPeeringConnectionId: vpcPeering.ref,
      });
      peeringRoute.cfnOptions.condition = enableVpcPeering;
    });

    // Apply tags to all resources
    const commonTags = {
      Environment: environmentSuffix,
      Owner: 'platform-team',
      Project: 'secure-web-app',
    };

    Object.entries(commonTags).forEach(([key, value]) => {
      Tags.of(this).add(key, value);
    });

    // Outputs
    new CfnOutput(this, `LoadBalancerDns-${environmentSuffix}`, {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new CfnOutput(this, `CloudFrontDomain-${environmentSuffix}`, {
      value: cloudFrontDistribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
    });

    new CfnOutput(this, `DatabaseEndpoint-${environmentSuffix}`, {
      value: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
    });

    new CfnOutput(this, `S3BucketName-${environmentSuffix}`, {
      value: s3Bucket.bucketName,
      description: 'S3 bucket name',
    });

    new CfnOutput(this, `BastionHostIp-${environmentSuffix}`, {
      value: bastionHost.instancePublicIp,
      description: 'Bastion host public IP address',
    });

    new CfnOutput(this, `VpcId-${environmentSuffix}`, {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new CfnOutput(this, `KmsKeyId-${environmentSuffix}`, {
      value: kmsKey.keyId,
      description: 'KMS key ID for encryption',
    });

    new CfnOutput(this, `DatabaseSecretArn-${environmentSuffix}`, {
      value: databaseSecret.secretArn,
      description: 'ARN of the database credentials secret in Secrets Manager',
    });

    // Additional outputs for comprehensive integration testing
    new CfnOutput(this, `AutoScalingGroupName-${environmentSuffix}`, {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group name',
    });

    new CfnOutput(this, `TargetGroupArn-${environmentSuffix}`, {
      value: targetGroup.targetGroupArn,
      description: 'Application Load Balancer target group ARN',
    });

    new CfnOutput(this, `LoadBalancerArn-${environmentSuffix}`, {
      value: alb.loadBalancerArn,
      description: 'Application Load Balancer ARN',
    });

    new CfnOutput(this, `LambdaFunctionArn-${environmentSuffix}`, {
      value: s3ProcessorFunction.functionArn,
      description: 'S3 processor Lambda function ARN',
    });

    new CfnOutput(this, `LambdaFunctionName-${environmentSuffix}`, {
      value: s3ProcessorFunction.functionName,
      description: 'S3 processor Lambda function name',
    });

    new CfnOutput(this, `SnsTopicArn-${environmentSuffix}`, {
      value: alertTopic.topicArn,
      description: 'SNS topic ARN for alerts',
    });

    new CfnOutput(this, `DatabasePort-${environmentSuffix}`, {
      value: database.instanceEndpoint.port.toString(),
      description: 'RDS database port',
    });

    new CfnOutput(this, `BastionHostId-${environmentSuffix}`, {
      value: bastionHost.instanceId,
      description: 'Bastion host instance ID',
    });

    new CfnOutput(this, `WebServerSecurityGroupId-${environmentSuffix}`, {
      value: webServerSecurityGroup.securityGroupId,
      description: 'Web server security group ID',
    });

    new CfnOutput(this, `DatabaseSecurityGroupId-${environmentSuffix}`, {
      value: databaseSecurityGroup.securityGroupId,
      description: 'Database security group ID',
    });

    new CfnOutput(this, `PrivateSubnetIds-${environmentSuffix}`, {
      value: vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private subnet IDs (comma-separated)',
    });

    new CfnOutput(this, `PublicSubnetIds-${environmentSuffix}`, {
      value: vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public subnet IDs (comma-separated)',
    });

    new CfnOutput(this, `DatabaseSubnetIds-${environmentSuffix}`, {
      value: vpc.isolatedSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Database subnet IDs (comma-separated)',
    });

    new CfnOutput(this, `EnvironmentSuffix-${environmentSuffix}`, {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
    });

    // Conditional outputs for VPC peering
    const vpcPeeringOutput = new CfnOutput(this, `VpcPeeringConnectionId-${environmentSuffix}`, {
      value: vpcPeering.ref,
      description: 'VPC peering connection ID',
    });
    vpcPeeringOutput.condition = enableVpcPeering;

    // Apply stack policy to protect critical infrastructure resources
    const stackPolicy = {
      Statement: [
        {
          Effect: 'Deny',
          Principal: '*',
          Action: 'Update:Delete',
          Resource: '*',
          Condition: {
            StringEquals: {
              'ResourceType': [
                'AWS::RDS::DBInstance',
                'AWS::KMS::Key',
                'AWS::S3::Bucket',
                'AWS::EC2::VPC'
              ]
            }
          }
        },
        {
          Effect: 'Allow',
          Principal: '*',
          Action: 'Update:*',
          Resource: '*'
        }
      ]
    };

    this.templateOptions.stackPolicyBody = JSON.stringify(stackPolicy);
  }
}

export { TapStack };
