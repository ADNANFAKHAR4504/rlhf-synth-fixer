import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // 1. KMS KEY - Customer managed key for encryption with proper Auto Scaling service-linked role permissions
    const kmsKey = new kms.Key(this, `TAPKey-${environmentSuffix}`, {
      alias: `tap-key-${environmentSuffix}`,
      description: `Customer-managed KMS key for TAP ${environmentSuffix} environment`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development environments
      policy: new iam.PolicyDocument({
        statements: [
          // Enable IAM User Permissions
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          // Allow Auto Scaling service-linked role to use the key
          new iam.PolicyStatement({
            sid: 'Allow service-linked role use of the customer managed key',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ArnPrincipal(
                `arn:aws:iam::${this.account}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling`
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
          }),
          // Allow attachment of persistent resources (required for Auto Scaling)
          new iam.PolicyStatement({
            sid: 'Allow attachment of persistent resources',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ArnPrincipal(
                `arn:aws:iam::${this.account}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling`
              ),
            ],
            actions: ['kms:CreateGrant'],
            resources: ['*'],
            conditions: {
              Bool: {
                'kms:GrantIsForAWSResource': 'true',
              },
            },
          }),
        ],
      }),
    });

    // 2. NETWORKING - VPC with public and private subnets
    const vpc = new ec2.Vpc(this, `ScalableVPC-${environmentSuffix}`, {
      vpcName: `ScalableVPC-${environmentSuffix}`,
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `PublicSubnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `PrivateSubnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: 2, // One NAT Gateway per AZ for high availability
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // 2. SECURITY GROUPS

    // ALB Security Group
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `ALBSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: true,
        securityGroupName: `ALBSecurityGroup-${environmentSuffix}`,
      }
    );

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
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `EC2SecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
        securityGroupName: `EC2SecurityGroup-${environmentSuffix}`,
      }
    );

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(22),
      'Allow SSH from VPC'
    );

    // RDS Security Group
    const rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `RDSSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for RDS PostgreSQL',
        allowAllOutbound: false,
        securityGroupName: `RDSSecurityGroup-${environmentSuffix}`,
      }
    );

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from EC2 instances'
    );

    // 3. IAM ROLES AND POLICIES

    // EC2 Instance Role
    const ec2Role = new iam.Role(this, `EC2InstanceRole-${environmentSuffix}`, {
      roleName: `EC2InstanceRole-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with least privilege access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Custom policy for S3 access (least privilege)
    const s3Policy = new iam.Policy(this, `EC2S3Policy-${environmentSuffix}`, {
      policyName: `EC2S3Policy-${environmentSuffix}`,
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
          resources: [
            `arn:aws:s3:::scalable-app-bucket-${environmentSuffix}-*/*`,
          ],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['s3:ListBucket'],
          resources: [
            `arn:aws:s3:::scalable-app-bucket-${environmentSuffix}-*`,
          ],
        }),
      ],
    });

    ec2Role.attachInlinePolicy(s3Policy);

    // Add KMS permissions for EC2 instances
    const kmsPolicy = new iam.Policy(
      this,
      `EC2KMSPolicy-${environmentSuffix}`,
      {
        policyName: `EC2KMSPolicy-${environmentSuffix}`,
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'kms:Decrypt',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:GenerateDataKey*',
              'kms:ReEncrypt*',
            ],
            resources: [kmsKey.keyArn],
          }),
        ],
      }
    );

    ec2Role.attachInlinePolicy(kmsPolicy);

    // 4. USER DATA SCRIPT
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      `echo "<h1>Scalable Web Server - ${environmentSuffix}</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" > /var/www/html/index.html`,
      'yum install -y amazon-cloudwatch-agent',
      'systemctl start amazon-cloudwatch-agent',
      'systemctl enable amazon-cloudwatch-agent'
    );

    // 5. LAUNCH TEMPLATE
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `WebServerLaunchTemplate-${environmentSuffix}`,
      {
        launchTemplateName: `WebServerLaunchTemplate-${environmentSuffix}`,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        userData,
        securityGroup: ec2SecurityGroup,
        role: ec2Role,
        // Explicitly configure EBS encryption with our KMS key
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(8, {
              volumeType: ec2.EbsDeviceVolumeType.GP3,
              encrypted: true,
              kmsKey: kmsKey,
              deleteOnTermination: true,
            }),
          },
        ],
      }
    );

    // 6. AUTO SCALING GROUP
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      `WebServerASG-${environmentSuffix}`,
      {
        autoScalingGroupName: `WebServerASG-${environmentSuffix}`,
        vpc,
        launchTemplate,
        minCapacity: 2,
        maxCapacity: 6,
        // Note: desiredCapacity will reset on every deployment - consider removing for production
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheckType: 'ELB',
        healthCheckGracePeriod: cdk.Duration.minutes(5),
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 1,
          minInstancesInService: 1,
          pauseTime: cdk.Duration.minutes(5),
        }),
      }
    );

    // Add explicit dependency on KMS key to ensure proper creation order
    autoScalingGroup.node.addDependency(kmsKey);

    // 7. APPLICATION LOAD BALANCER
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `WebServerALB-${environmentSuffix}`,
      {
        loadBalancerName: `tap-${environmentSuffix}-alb`,
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `WebServerTargetGroup-${environmentSuffix}`,
      {
        targetGroupName: `WebTarget-${environmentSuffix}`,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        vpc,
        targets: [autoScalingGroup],
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
      }
    );

    // Listener
    alb.addListener(`WebServerListener-${environmentSuffix}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // 8. RDS POSTGRESQL DATABASE

    // Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `DatabaseSubnetGroup-${environmentSuffix}`,
      {
        subnetGroupName: `db-subnet-${environmentSuffix}`,
        vpc,
        description: 'Subnet group for RDS PostgreSQL',
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Parameter Group
    const parameterGroup = new rds.ParameterGroup(
      this,
      `PostgreSQLParameterGroup-${environmentSuffix}`,
      {
        parameterGroupName: `postgres-params-${environmentSuffix}`,
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_16_4,
        }),
        description: 'Parameter group for PostgreSQL 16.4',
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // RDS Instance
    const database = new rds.DatabaseInstance(
      this,
      `PostgreSQLDatabase-${environmentSuffix}`,
      {
        instanceIdentifier: `postgres-db-${environmentSuffix}`,
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_16_4,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        credentials: rds.Credentials.fromGeneratedSecret('dbadmin', {
          secretName: `scalable-app/db-credentials-${environmentSuffix}`,
        }),
        vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [rdsSecurityGroup],
        parameterGroup,
        allocatedStorage: 20,
        storageType: rds.StorageType.GP2,
        storageEncrypted: true,
        kmsKey: kmsKey,
        multiAz: false,
        backupRetention: cdk.Duration.days(7),
        deleteAutomatedBackups: true,
        deletionProtection: false, // Ensure destroyable
        databaseName: 'scalableapp',
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Ensure destroyable
      }
    );

    // 9. S3 BUCKET
    const s3Bucket = new s3.Bucket(
      this,
      `ScalableAppBucket-${environmentSuffix}`,
      {
        bucketName: `tap-${environmentSuffix}-logs-${this.account}-${this.region}`,
        versioned: true,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Ensure destroyable
        autoDeleteObjects: true, // Ensure bucket can be deleted even with objects
        lifecycleRules: [
          {
            id: 'DeleteOldVersions',
            enabled: true,
            noncurrentVersionExpiration: cdk.Duration.days(30),
          },
        ],
      }
    );

    // 10. CLOUDWATCH ALARMS

    // CPU Utilization Alarm
    const cpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
      },
      period: cdk.Duration.minutes(5),
    });

    const cpuAlarm = new cloudwatch.Alarm(
      this,
      `HighCPUAlarm-${environmentSuffix}`,
      {
        alarmName: `HighCPU-${environmentSuffix}`,
        metric: cpuMetric,
        threshold: 80,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'Alarm when CPU exceeds 80%',
      }
    );

    // Auto Scaling Policies - Using target tracking instead of step scaling to avoid deprecated warnings
    autoScalingGroup.scaleOnCpuUtilization(
      `CPUTargetTracking-${environmentSuffix}`,
      {
        targetUtilizationPercent: 70,
        scaleInCooldown: cdk.Duration.minutes(5),
        scaleOutCooldown: cdk.Duration.minutes(3),
      }
    );

    // 11. OUTPUTS
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VPC-ID`,
    });

    new cdk.CfnOutput(this, 'ALBSecurityGroupId', {
      value: albSecurityGroup.securityGroupId,
      description: 'ALB Security Group ID',
      exportName: `${this.stackName}-ALB-SG-ID`,
    });

    new cdk.CfnOutput(this, 'EC2SecurityGroupId', {
      value: ec2SecurityGroup.securityGroupId,
      description: 'EC2 Security Group ID',
      exportName: `${this.stackName}-EC2-SG-ID`,
    });

    new cdk.CfnOutput(this, 'RDSSecurityGroupId', {
      value: rdsSecurityGroup.securityGroupId,
      description: 'RDS Security Group ID',
      exportName: `${this.stackName}-RDS-SG-ID`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
      exportName: `${this.stackName}-ALB-DNS`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS PostgreSQL Endpoint',
      exportName: `${this.stackName}-DB-Endpoint`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `${this.stackName}-S3-Bucket`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: database.secret?.secretArn || 'N/A',
      description: 'Database Secret ARN',
      exportName: `${this.stackName}-DB-Secret-ARN`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID',
      exportName: `${this.stackName}-KMS-Key-ID`,
    });

    new cdk.CfnOutput(this, 'KMSKeyArn', {
      value: kmsKey.keyArn,
      description: 'KMS Key ARN',
      exportName: `${this.stackName}-KMS-Key-ARN`,
    });
  }
}
