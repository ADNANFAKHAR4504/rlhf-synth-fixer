import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props and add randomness for uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const environmentSuffix = `${props.environmentSuffix}-${randomSuffix}`;

    // Create VPC with specified CIDR block
    const vpc = new ec2.Vpc(this, `vpc-main-${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2, // High availability across two AZs
      natGateways: 2, // One NAT gateway per AZ for redundancy
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
    });

    // Create S3 buckets with encryption and versioning
    const logsBucket = new s3.Bucket(this, `s3-logs-${environmentSuffix}`, {
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    const dataBucket = new s3.Bucket(this, `s3-data-${environmentSuffix}`, {
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'transition-to-ia',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // Create IAM role for EC2 instances with minimal S3 permissions
    const ec2Role = new iam.Role(this, `iam-role-ec2-s3-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with minimal S3 access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Add minimal S3 permissions to the role
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: [
          dataBucket.bucketArn,
          `${dataBucket.bucketArn}/*`,
          logsBucket.bucketArn,
          `${logsBucket.bucketArn}/*`,
        ],
      })
    );

    // Security group for SSH access from limited IP range
    const sshSecurityGroup = new ec2.SecurityGroup(
      this,
      `sg-ssh-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for SSH access from limited IP range',
        allowAllOutbound: false,
      }
    );

    // Replace with your actual IP range
    sshSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'), // Example IP range - replace with your actual range
      ec2.Port.tcp(22),
      'SSH access from limited IP range'
    );

    // Allow outbound HTTPS for package updates
    sshSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS outbound for updates'
    );

    // Allow outbound HTTP for package updates
    sshSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP outbound for updates'
    );

    // Security group for web traffic
    const webSecurityGroup = new ec2.SecurityGroup(
      this,
      `sg-web-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for web traffic',
        allowAllOutbound: true,
      }
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP traffic'
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS traffic'
    );

    // Launch EC2 instances in private subnets across two AZs
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent httpd',
      'systemctl enable httpd',
      'systemctl start httpd',
      'echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html',
      'systemctl enable amazon-cloudwatch-agent',
      'systemctl start amazon-cloudwatch-agent'
    );

    // EC2 instance in first AZ
    const ec2Instance1 = new ec2.Instance(
      this,
      `ec2-web-${environmentSuffix}-az1`,
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          availabilityZones: [vpc.availabilityZones[0]],
        },
        securityGroup: webSecurityGroup,
        role: ec2Role,
        userData,
        detailedMonitoring: true, // Enable CloudWatch detailed monitoring
      }
    );

    // Allow SSH access to EC2 instances
    ec2Instance1.addSecurityGroup(sshSecurityGroup);

    // EC2 instance in second AZ
    const ec2Instance2 = new ec2.Instance(
      this,
      `ec2-web-${environmentSuffix}-az2`,
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          availabilityZones: [vpc.availabilityZones[1]],
        },
        securityGroup: webSecurityGroup,
        role: ec2Role,
        userData,
        detailedMonitoring: true, // Enable CloudWatch detailed monitoring
      }
    );

    // Allow SSH access to EC2 instances
    ec2Instance2.addSecurityGroup(sshSecurityGroup);

    // RDS subnet group for isolated subnets
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `rds-subnet-group-${environmentSuffix}`,
      {
        vpc,
        description: 'Subnet group for RDS database',
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      }
    );

    // Security group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `sg-rds-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for RDS database',
        allowAllOutbound: false,
      }
    );

    dbSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(3306),
      'MySQL access from web servers'
    );

    // RDS MySQL instance with multi-AZ and automatic backups
    const database = new rds.DatabaseInstance(
      this,
      `rds-mysql-${environmentSuffix}`,
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0_42,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [dbSecurityGroup],
        multiAz: true, // Multi-AZ deployment for high availability
        backupRetention: cdk.Duration.days(7), // 7-day backup retention
        deleteAutomatedBackups: true,
        deletionProtection: false,
        storageEncrypted: true,
        monitoringInterval: cdk.Duration.seconds(60),
        enablePerformanceInsights: false,
        credentials: rds.Credentials.fromGeneratedSecret('admin', {
          secretName: `rds-credentials-${environmentSuffix}`,
        }),
      }
    );

    // DynamoDB table with point-in-time recovery
    const dynamoTable = new dynamodb.Table(
      this,
      `dynamodb-data-${environmentSuffix}`,
      {
        tableName: `dynamodb-data-${environmentSuffix}`,
        partitionKey: {
          name: 'id',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: true,
        }, // Enable point-in-time recovery
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // CloudWatch log group for Lambda functions
    const lambdaLogGroup = new logs.LogGroup(
      this,
      `logs-lambda-${environmentSuffix}`,
      {
        logGroupName: `/aws/lambda/lambda-function-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // IAM role for Lambda function
    const lambdaRole = new iam.Role(
      this,
      `iam-role-lambda-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
      }
    );

    // Lambda function with CloudWatch logging
    const lambdaFunction = new lambda.Function(
      this,
      `lambda-function-${environmentSuffix}`,
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Event:', JSON.stringify(event, null, 2));
          return {
            statusCode: 200,
            body: JSON.stringify('Hello from Lambda!'),
          };
        };
      `),
        role: lambdaRole,
        logGroup: lambdaLogGroup,
        environment: {
          ENVIRONMENT: environmentSuffix,
        },
      }
    );

    // Application Load Balancer in public subnets
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `alb-web-${environmentSuffix}`,
      {
        vpc,
        internetFacing: true,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
        securityGroup: webSecurityGroup,
      }
    );

    // Target group for EC2 instances
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `tg-web-${environmentSuffix}`,
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [
          new targets.InstanceTarget(ec2Instance1),
          new targets.InstanceTarget(ec2Instance2),
        ],
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          interval: cdk.Duration.seconds(30),
          path: '/',
          protocol: elbv2.Protocol.HTTP,
          timeout: cdk.Duration.seconds(5),
          unhealthyThresholdCount: 2,
        },
      }
    );

    // HTTP listener with target group (HTTPS redirect commented out for testing)
    alb.addListener(`listener-http-${environmentSuffix}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // For production, uncomment when you have an SSL certificate
    // const certificate = certificatemanager.Certificate.fromCertificateArn(
    //   this,
    //   'ssl-certificate',
    //   'arn:aws:acm:us-west-2:123456789012:certificate/12345678-1234-1234-1234-123456789012'
    // );

    // alb.addListener('listener-https-prod', {
    //   port: 443,
    //   protocol: elbv2.ApplicationProtocol.HTTPS,
    //   certificates: [certificate],
    //   defaultTargetGroups: [targetGroup],
    // });

    // Output important resource information
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
    });

    new cdk.CfnOutput(this, 'S3LogsBucket', {
      value: logsBucket.bucketName,
      description: 'S3 logs bucket name',
    });

    new cdk.CfnOutput(this, 'S3DataBucket', {
      value: dataBucket.bucketName,
      description: 'S3 data bucket name',
    });

    new cdk.CfnOutput(this, 'DynamoDBTable', {
      value: dynamoTable.tableName,
      description: 'DynamoDB table name',
    });

    new cdk.CfnOutput(this, 'LambdaFunction', {
      value: lambdaFunction.functionName,
      description: 'Lambda function name',
    });
  }
}
