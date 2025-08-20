import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';

export interface TapStackProps extends cdk.StackProps {
  environment: string;
  owner: string;
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environment = props.environment;
    const owner = props.owner;
    const environmentSuffix = props.environmentSuffix;

    // Common tags for all resources - applied via cdk.Tags below

    // Apply tags to the stack
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('Owner', owner);
    cdk.Tags.of(this).add('Project', 'CloudEnvironmentSetup');
    cdk.Tags.of(this).add('EnvironmentSuffix', environmentSuffix);

    // Create VPC
    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
      natGateways: 1,
      vpcName: `tap-${environmentSuffix}-vpc`,
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
          name: 'database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Group for EC2 instances (HTTP/HTTPS only)
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc,
      description: 'Security group for web servers',
      securityGroupName: `tap-${environmentSuffix}-web-sg`,
    });

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Security Group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc,
        description: 'Security group for database',
        securityGroupName: `tap-${environmentSuffix}-db-sg`,
      }
    );

    dbSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL traffic from web servers'
    );

    // IAM Role for EC2 instances with least privilege
    const ec2Role = new iam.Role(this, 'EC2Role', {
      roleName: `tap-${environmentSuffix}-ec2-role`,
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

    // Add policy for Parameter Store access
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ssm:GetParameter',
          'ssm:GetParameters',
          'ssm:GetParametersByPath',
        ],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/tap-${environmentSuffix}/*`,
        ],
      })
    );

    // Instance profile is not needed when role is passed directly to EC2 instance

    // Systems Manager Parameters for environment configuration
    new ssm.StringParameter(this, 'DatabaseEndpointParameter', {
      parameterName: `/tap-${environmentSuffix}/database/endpoint`,
      stringValue: 'placeholder-will-be-updated',
      description: `Database endpoint for ${environment} environment`,
    });

    new ssm.StringParameter(this, 'S3BucketNameParameter', {
      parameterName: `/tap-${environmentSuffix}/s3/bucket-name`,
      stringValue: 'placeholder-will-be-updated',
      description: `S3 bucket name for ${environment} environment`,
    });

    new ssm.StringParameter(this, 'EnvironmentConfigParameter', {
      parameterName: `/tap-${environmentSuffix}/config/app-version`,
      stringValue: '1.0.0',
      description: `Application version for ${environment} environment`,
    });

    // S3 Bucket with versioning
    const s3Bucket = new s3.Bucket(this, 'S3Bucket', {
      bucketName: `tap-${environmentSuffix}-bucket-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Update S3 parameter with actual bucket name
    new ssm.StringParameter(this, 'S3BucketNameParameterActual', {
      parameterName: `/tap-${environmentSuffix}/s3/bucket-name-actual`,
      stringValue: s3Bucket.bucketName,
      description: `Actual S3 bucket name for ${environment} environment`,
    });

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc,
      subnetGroupName: `tap-${environmentSuffix}-db-subnet-group`,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // RDS Instance with encryption
    const database = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: `tap-${environmentSuffix}-mysql-db`,
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [dbSecurityGroup],
      storageEncrypted: true,
      multiAz: false,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      deleteAutomatedBackups: true,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: `tap-${environmentSuffix}-db-credentials`,
      }),
    });

    // Update database endpoint parameter
    new ssm.StringParameter(this, 'DatabaseEndpointParameterActual', {
      parameterName: `/tap-${environmentSuffix}/database/endpoint-actual`,
      stringValue: database.instanceEndpoint.hostname,
      description: `Actual database endpoint for ${environment} environment`,
    });

    // User Data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Hello from ' +
        environment +
        ' environment (' +
        environmentSuffix +
        ')</h1>" > /var/www/html/index.html',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c default -s'
    );

    // EC2 Instances
    const ec2Instance = new ec2.Instance(this, 'WebServer', {
      instanceName: `tap-${environmentSuffix}-web-server`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: webSecurityGroup,
      role: ec2Role,
      userData: userData,
      detailedMonitoring: true, // Enable detailed CloudWatch monitoring
    });

    // CloudWatch Alarm for EC2 CPU utilization
    const cpuAlarm = new cloudwatch.Alarm(this, 'CPUAlarm', {
      alarmName: `tap-${environmentSuffix}-high-cpu`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          InstanceId: ec2Instance.instanceId,
        },
      }),
      threshold: 80,
      evaluationPeriods: 2,
      alarmDescription: 'Alert when CPU utilization exceeds 80%',
    });

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `tap-${environmentSuffix}-alerts`,
    });

    cpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'EcsCluster', {
      clusterName: `tap-${environmentSuffix}-cluster`,
      vpc,
      enableFargateCapacityProviders: true,
    });

    // ECS Fargate Service with Application Load Balancer
    const fargateService =
      new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        'FargateService',
        {
          cluster,
          serviceName: `tap-${environmentSuffix}-fargate-service`,
          memoryLimitMiB: 512,
          cpu: 256,
          desiredCount: 1,
          taskImageOptions: {
            image: ecs.ContainerImage.fromRegistry('nginx:latest'),
            containerPort: 80,
            environment: {
              ENVIRONMENT: environment,
              OWNER: owner,
            },
          },
          publicLoadBalancer: true,
        }
      );

    // Configure auto-scaling for Fargate service
    const scalableTarget = fargateService.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 10,
    });

    scalableTarget.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
    });

    scalableTarget.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `tap-${environmentSuffix}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `tap-${environmentSuffix}-s3-bucket`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
      exportName: `tap-${environmentSuffix}-db-endpoint`,
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'EC2 Instance ID',
      exportName: `tap-${environmentSuffix}-ec2-instance`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerUrl', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer URL',
      exportName: `tap-${environmentSuffix}-alb-url`,
    });

    new cdk.CfnOutput(this, 'EcsClusterName', {
      value: cluster.clusterName,
      description: 'ECS Cluster Name',
      exportName: `tap-${environmentSuffix}-ecs-cluster`,
    });
  }
}
