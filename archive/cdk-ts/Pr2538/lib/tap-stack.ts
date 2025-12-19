import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3notifications from 'aws-cdk-lib/aws-s3-notifications';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as logs from 'aws-cdk-lib/aws-logs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  allowedSshCidrs?: string[];
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Default allowed SSH CIDRs (restrict to your organization's IP ranges)
    const allowedSshCidrs = props?.allowedSshCidrs || ['10.0.0.0/8'];

    // Common tags for all resources
    const commonTags = {
      Environment: 'Production',
      Project: `tap-${environmentSuffix}`,
      ManagedBy: 'CDK',
    };

    // 1. KMS Key for encryption at rest
    // Generate unique identifier to avoid conflicts with existing keys
    const kmsKeySuffix = `${environmentSuffix}-${Date.now().toString().slice(-8)}`;
    const kmsKey = new kms.Key(this, `TapKmsKey${kmsKeySuffix}`, {
      alias: `alias/tap-${kmsKeySuffix}`,
      description: 'KMS key for TAP infrastructure encryption',
      enableKeyRotation: true,
      enabled: true,
      pendingWindow: cdk.Duration.days(7),
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow cleanup of old keys
    });

    // Grant CloudWatch Logs permission to use the KMS key
    kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`),
        ],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:CreateGrant',
          'kms:DescribeKey',
        ],
        resources: ['*'],
        conditions: {
          ArnLike: {
            'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/cloudtrail/tap-${environmentSuffix}-*`,
          },
        },
      })
    );

    // Grant EC2 and Auto Scaling services permission to use the KMS key for EBS volume encryption
    kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Enable use of the key via EC2',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal('ec2.amazonaws.com'),
          new iam.ServicePrincipal('autoscaling.amazonaws.com'),
        ],
        actions: [
          'kms:CreateGrant',
          'kms:Decrypt',
          'kms:DescribeKey',
          'kms:Encrypt',
          'kms:GenerateDataKey*',
          'kms:GenerateDataKeyWithoutPlainText',
          'kms:ReEncrypt*',
        ],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'kms:ViaService': `ec2.${this.region}.amazonaws.com`,
          },
        },
      })
    );

    // Additional permissions for EC2 instances to use the key directly
    kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Enable direct use by EC2 instances',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('ec2.amazonaws.com')],
        actions: ['kms:Decrypt', 'kms:GenerateDataKey*', 'kms:CreateGrant'],
        resources: ['*'],
      })
    );

    // Additional grant permissions for Auto Scaling to create grants without ViaService condition
    kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('autoscaling.amazonaws.com')],
        actions: ['kms:CreateGrant', 'kms:ListGrants', 'kms:RevokeGrant'],
        resources: ['*'],
        conditions: {
          Bool: {
            'kms:GrantIsForAWSResource': 'true',
          },
        },
      })
    );

    // Grant permissions to the Auto Scaling service-linked role
    kmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Allow Auto Scaling service-linked role',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ArnPrincipal(
            `arn:aws:iam::${this.account}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling`
          ),
        ],
        actions: [
          'kms:CreateGrant',
          'kms:Decrypt',
          'kms:DescribeKey',
          'kms:Encrypt',
          'kms:GenerateDataKey*',
          'kms:GenerateDataKeyWithoutPlainText',
          'kms:ReEncrypt*',
        ],
        resources: ['*'],
      })
    );

    // Tag KMS key
    cdk.Tags.of(kmsKey).add('Environment', 'Production');

    // 2. VPC Configuration with public and private subnets across multiple AZs
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      vpcName: `tap-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
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
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Tag VPC
    cdk.Tags.of(vpc).add('Environment', 'Production');

    // 3. Security Groups
    // ALB Security Group
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );

    // EC2 Security Group
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    // Allow traffic from ALB
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    // Restricted SSH access
    allowedSshCidrs.forEach(cidr => {
      ec2SecurityGroup.addIngressRule(
        ec2.Peer.ipv4(cidr),
        ec2.Port.tcp(22),
        `Allow SSH from ${cidr}`
      );
    });

    // Add outbound rule from ALB to EC2 instances
    albSecurityGroup.addEgressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(80),
      'Allow outbound to EC2 instances'
    );

    // Tag security groups
    cdk.Tags.of(albSecurityGroup).add('Environment', 'Production');
    cdk.Tags.of(ec2SecurityGroup).add('Environment', 'Production');

    // 4. IAM Role for EC2 instances with least privilege
    const ec2Role = new iam.Role(this, 'Ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description:
        'IAM role for EC2 instances with minimal required permissions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Add comprehensive KMS policy for encrypted EBS volumes
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'kms:CreateGrant',
          'kms:Decrypt',
          'kms:DescribeKey',
          'kms:GenerateDataKeyWithoutPlainText',
          'kms:GenerateDataKey*',
          'kms:ReEncrypt*',
          'kms:Encrypt',
        ],
        resources: [kmsKey.keyArn],
      })
    );

    // 5. Launch Template for EC2 instances
    const launchTemplate = new ec2.LaunchTemplate(this, 'TapLaunchTemplate', {
      launchTemplateName: `tap-launch-template-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            encrypted: true,
            // Temporarily use AWS managed keys for EBS to avoid KMS key state issues
            // kmsKey: kmsKey,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
      userData: ec2.UserData.forLinux(),
      requireImdsv2: true, // Enforce IMDSv2 for enhanced security
    });

    // Configure user data for web server setup
    if (launchTemplate.userData) {
      launchTemplate.userData.addCommands(
        'yum update -y',
        'yum install -y httpd',
        'systemctl start httpd',
        'systemctl enable httpd',
        'echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html',
        'yum install -y amazon-cloudwatch-agent',
        'systemctl enable amazon-cloudwatch-agent'
      );
    }

    // Tag launch template
    cdk.Tags.of(launchTemplate).add('Environment', 'Production');

    // 6. Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'TapAlb', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      loadBalancerName: `tap-alb-${environmentSuffix}`,
    });

    // Tag ALB
    cdk.Tags.of(alb).add('Environment', 'Production');

    // 7. Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'TapAsg', {
      vpc,
      launchTemplate,
      minCapacity: 2,
      maxCapacity: 4,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      autoScalingGroupName: `tap-asg-${environmentSuffix}`,
    });

    // Grant the Auto Scaling Group permission to use the KMS key
    kmsKey.grantEncryptDecrypt(autoScalingGroup.role);

    // Tag Auto Scaling Group
    cdk.Tags.of(autoScalingGroup).add('Environment', 'Production');

    // 8. Target Group and Listener
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'TapTargetGroup',
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [autoScalingGroup],
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: elbv2.Protocol.HTTP,
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 5,
          timeout: cdk.Duration.seconds(10),
          interval: cdk.Duration.seconds(30),
        },
        targetGroupName: `tap-tg-${environmentSuffix}`,
      }
    );

    // HTTP Listener (in production, you should redirect to HTTPS)
    alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // 9. S3 Bucket with security best practices
    const s3Timestamp = Date.now().toString().slice(-6);
    const s3Bucket = new s3.Bucket(this, 'TapS3Bucket', {
      bucketName: `tap-secure-bucket-${environmentSuffix}-${this.account}-${s3Timestamp}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
      ],
    });

    // Tag S3 bucket
    cdk.Tags.of(s3Bucket).add('Environment', 'Production');

    // 10. Lambda function for S3 event processing
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add S3 read permissions to Lambda role
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:GetObjectVersion'],
        resources: [`${s3Bucket.bucketArn}/*`],
      })
    );

    // Add KMS permissions for Lambda
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:DescribeKey'],
        resources: [kmsKey.keyArn],
      })
    );

    // Generate unique suffix for Lambda function to avoid naming conflicts
    const lambdaTimestamp = Date.now().toString().slice(-6);
    const lambdaFunction = new lambda.Function(this, 'TapLambdaFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      functionName: `tap-s3-processor-${environmentSuffix}-${lambdaTimestamp}`,
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('S3 Event received:', JSON.stringify(event, null, 2));
          
          for (const record of event.Records) {
            const bucketName = record.s3.bucket.name;
            const objectKey = record.s3.object.key;
            const eventName = record.eventName;
            
            console.log(\`Processing \${eventName} for object \${objectKey} in bucket \${bucketName}\`);
            
            // Add your custom processing logic here
          }
          
          return {
            statusCode: 200,
            body: JSON.stringify('Successfully processed S3 event')
          };
        };
      `),
      environment: {
        BUCKET_NAME: s3Bucket.bucketName,
        KMS_KEY_ID: kmsKey.keyId,
      },
    });

    // Tag Lambda function
    cdk.Tags.of(lambdaFunction).add('Environment', 'Production');

    // 11. S3 Event Notification to Lambda
    s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3notifications.LambdaDestination(lambdaFunction)
    );

    // 12. CloudTrail for audit logging
    const cloudTrailLogGroup = new logs.LogGroup(this, 'CloudTrailLogGroup', {
      logGroupName: `/aws/cloudtrail/tap-${environmentSuffix}-${Date.now()}`,
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: kmsKey,
    });

    const timestamp = Date.now().toString().slice(-6);
    const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `tap-cloudtrail-${environmentSuffix}-${this.account}-${timestamp}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const trail = new cloudtrail.Trail(this, 'TapCloudTrail', {
      trailName: `tap-cloudtrail-${environmentSuffix}-${timestamp}`,
      bucket: cloudTrailBucket,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      cloudWatchLogGroup: cloudTrailLogGroup,
      sendToCloudWatchLogs: true,
    });

    // Tag CloudTrail resources
    cdk.Tags.of(cloudTrailBucket).add('Environment', 'Production');
    cdk.Tags.of(trail).add('Environment', 'Production');

    // Apply common tags to all resources in the stack
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // 13. Outputs for important resources
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `tap-vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDns', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
      exportName: `tap-alb-dns-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket name',
      exportName: `tap-s3-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID',
      exportName: `tap-kms-key-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'Lambda function name',
      exportName: `tap-lambda-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group name',
      exportName: `tap-asg-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'Ec2RoleName', {
      value: ec2Role.roleName,
      description: 'EC2 IAM Role name',
      exportName: `tap-ec2-role-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaRoleName', {
      value: lambdaRole.roleName,
      description: 'Lambda IAM Role name',
      exportName: `tap-lambda-role-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudTrailName', {
      value: `tap-cloudtrail-${environmentSuffix}-${timestamp}`,
      description: 'CloudTrail name',
      exportName: `tap-cloudtrail-name-${environmentSuffix}`,
    });
  }
}
