import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ssm from 'aws-cdk-lib/aws-ssm';
// Events imports removed - not used in current implementation
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
// import * as vpclattice from 'aws-cdk-lib/aws-vpclattice'; // Commented out - VPC Lattice not compatible with internet-facing ALB
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

    const environment =
      environmentSuffix === 'prod' ? 'production' : 'development';
    const applicationName = 'multi-app';
    const envShort = environmentSuffix.toLowerCase(); // Convert to lowercase for S3 bucket names
    const region = this.region;

    // Create VPC with public subnets only - simplified for account limits
    const vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `${applicationName}-${envShort}-vpc-${region}`,
      ipAddresses: ec2.IpAddresses.cidr(
        environment === 'production' ? '10.0.0.0/16' : '10.1.0.0/16'
      ),
      maxAzs: 2, // ALB requires at least 2 AZs
      natGateways: 0, // No NAT gateways to avoid EIP limits
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // Create IAM role for EC2 instances
    const ec2Role = new iam.Role(this, 'EC2Role', {
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

    // Create security group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc: vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    // Create security group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });

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

    // Allow ALB to communicate with EC2 instances
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    // User data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      `echo "<h1>Hello from ${environment} in ${region}</h1>" > /var/www/html/index.html`,
      'yum install -y amazon-cloudwatch-agent',
      'systemctl start amazon-cloudwatch-agent'
    );

    // Create Application Load Balancer
    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: vpc,
      internetFacing: true,
      loadBalancerName: `${applicationName}-${envShort}-alb`,
      securityGroup: albSecurityGroup,
    });

    // Create Auto Scaling Group
    // Note: Using inline properties instead of LaunchTemplate for LocalStack compatibility
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'ASG', {
      vpc: vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      userData: userData,
      role: ec2Role,
      securityGroup: ec2SecurityGroup,
      minCapacity: environment === 'production' ? 2 : 1,
      maxCapacity: environment === 'production' ? 6 : 3,
      desiredCapacity: environment === 'production' ? 2 : 1,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Create Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc: vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [autoScalingGroup],
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        path: '/',
        protocol: elbv2.Protocol.HTTP,
        timeout: cdk.Duration.seconds(5),
        unhealthyThresholdCount: 2,
        healthyThresholdCount: 2,
      },
    });

    // Create Listener
    loadBalancer.addListener('Listener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Create CloudWatch Alarms
    new cloudwatch.Alarm(this, 'CPUAlarm', {
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
      alarmDescription: `High CPU utilization for ${environment} in ${region}`,
    });

    // Create scaling policies
    autoScalingGroup.scaleOnCpuUtilization('ScaleUp', {
      targetUtilizationPercent: 70,
    });

    autoScalingGroup.scaleOnCpuUtilization('ScaleDown', {
      targetUtilizationPercent: 30,
    });

    // Create S3 bucket for static content
    const contentBucket = new s3.Bucket(this, 'ContentBucket', {
      bucketName: `${applicationName}-${envShort}-content-${region}-${this.account}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    // === NEW: Amazon EventBridge Scheduler Integration ===

    // Create IAM role for EventBridge Scheduler
    const schedulerRole = new iam.Role(this, 'SchedulerRole', {
      assumedBy: new iam.ServicePrincipal('scheduler.amazonaws.com'),
      inlinePolicies: {
        SchedulerExecutionPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'autoscaling:SetDesiredCapacity',
                's3:GetObject',
                's3:PutObject',
                'lambda:InvokeFunction',
                'ssm:SendCommand',
                'ec2:CreateSnapshot',
                'ec2:DescribeInstances',
                'cloudwatch:PutMetricData',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Lambda function for scheduled maintenance tasks
    const maintenanceFunction = new lambda.Function(
      this,
      'MaintenanceFunction',
      {
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import json
import boto3
import os

def handler(event, context):
    print(f"Maintenance task executed at {context.aws_request_id}")
    
    # Perform maintenance tasks like cleanup, health checks, etc.
    task_type = event.get('task_type', 'general')
    
    if task_type == 'backup':
        # Simulate backup operation
        print("Performing scheduled backup operations")
    elif task_type == 'scaling':
        # Simulate scaling operation
        print("Performing scheduled scaling operations")
    elif task_type == 'cleanup':
        # Simulate cleanup operation
        print("Performing scheduled cleanup operations")
    
    return {
        'statusCode': 200,
        'body': json.dumps(f'Maintenance task {task_type} completed successfully')
    }
      `),
        environment: {
          ENVIRONMENT: environment,
          APPLICATION_NAME: applicationName,
        },
      }
    );

    // Grant permissions to the maintenance function
    contentBucket.grantReadWrite(maintenanceFunction);

    // Create EventBridge Scheduler for automated backup operations
    new scheduler.CfnSchedule(this, 'BackupSchedule', {
      name: `${applicationName}-${envShort}-backup-schedule`,
      description: 'Automated backup schedule for infrastructure maintenance',
      scheduleExpression:
        environment === 'production' ? 'rate(6 hours)' : 'rate(12 hours)',
      scheduleExpressionTimezone: 'UTC',
      flexibleTimeWindow: {
        mode: 'FLEXIBLE',
        maximumWindowInMinutes: 15,
      },
      target: {
        arn: maintenanceFunction.functionArn,
        roleArn: schedulerRole.roleArn,
        retryPolicy: {
          maximumEventAgeInSeconds: 3600,
          maximumRetryAttempts: 3,
        },
        input: JSON.stringify({
          task_type: 'backup',
          environment: environment,
          region: region,
        }),
      },
      state: 'ENABLED',
    });

    // Create EventBridge Scheduler for scaling events
    new scheduler.CfnSchedule(this, 'ScalingSchedule', {
      name: `${applicationName}-${envShort}-scaling-schedule`,
      description: 'Automated scaling schedule for peak hours',
      scheduleExpression: 'cron(0 8 ? * MON-FRI *)',
      scheduleExpressionTimezone: 'America/New_York',
      flexibleTimeWindow: {
        mode: 'FLEXIBLE',
        maximumWindowInMinutes: 30,
      },
      target: {
        arn: maintenanceFunction.functionArn,
        roleArn: schedulerRole.roleArn,
        retryPolicy: {
          maximumEventAgeInSeconds: 1800,
          maximumRetryAttempts: 2,
        },
        input: JSON.stringify({
          task_type: 'scaling',
          desired_capacity: environment === 'production' ? 4 : 2,
          environment: environment,
        }),
      },
      state: environment === 'production' ? 'ENABLED' : 'DISABLED',
    });

    // Grant EventBridge Scheduler permission to invoke Lambda
    maintenanceFunction.addPermission('SchedulerInvoke', {
      principal: new iam.ServicePrincipal('scheduler.amazonaws.com'),
      action: 'lambda:InvokeFunction',
    });

    // === NEW: Amazon VPC Lattice Integration ===
    // NOTE: VPC Lattice components are commented out as they don't support internet-facing ALBs
    // To enable VPC Lattice, the ALB would need to be internal or use instance targets directly

    /*
    // Create VPC Lattice Service Network
    const serviceNetwork = new vpclattice.CfnServiceNetwork(
      this,
      'ServiceNetwork',
      {
        name: `${applicationName}-${envShort}-service-network`,
        authType: 'AWS_IAM',
      }
    );

    // Associate VPC with Service Network
    new vpclattice.CfnServiceNetworkVpcAssociation(this, 'VPCAssociation', {
      serviceNetworkIdentifier: serviceNetwork.ref,
      vpcIdentifier: vpc.vpcId,
    });

    // Create VPC Lattice Service for the web application
    const webService = new vpclattice.CfnService(this, 'WebService', {
      name: `${applicationName}-${envShort}-web-service`,
      authType: 'AWS_IAM',
    });

    // Associate Service with Service Network
    new vpclattice.CfnServiceNetworkServiceAssociation(
      this,
      'ServiceAssociation',
      {
        serviceNetworkIdentifier: serviceNetwork.ref,
        serviceIdentifier: webService.ref,
      }
    );

    // Create Target Group for VPC Lattice - would need INSTANCE type targets
    const latticeTargetGroup = new vpclattice.CfnTargetGroup(
      this,
      'LatticeTargetGroup',
      {
        name: `${applicationName}-${envShort}-tg`,
        type: 'INSTANCE',
        targets: [], // Would need to add instances from ASG
        config: {
          vpcIdentifier: vpc.vpcId,
          port: 80,
          protocol: 'HTTP',
          healthCheck: {
            enabled: true,
            path: '/',
            protocol: 'HTTP',
            healthCheckIntervalSeconds: 30,
            healthCheckTimeoutSeconds: 5,
            healthyThresholdCount: 2,
            unhealthyThresholdCount: 2,
          },
        },
      }
    );

    // Create Listener for VPC Lattice Service
    new vpclattice.CfnListener(this, 'LatticeListener', {
      serviceIdentifier: webService.ref,
      protocol: 'HTTP',
      port: 80,
      defaultAction: {
        forward: {
          targetGroups: [
            {
              targetGroupIdentifier: latticeTargetGroup.ref,
              weight: 100,
            },
          ],
        },
      },
    });

    // Create IAM policy for VPC Lattice access
    const latticeAccessPolicy = new iam.Policy(this, 'LatticeAccessPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['vpc-lattice:*'],
          resources: ['*'],
        }),
      ],
    });

    // Attach VPC Lattice policy to EC2 role
    ec2Role.attachInlinePolicy(latticeAccessPolicy);
    */

    // Store configuration in Systems Manager Parameter Store
    new ssm.StringParameter(this, 'VPCIdParameter', {
      parameterName: `/${applicationName}/${environment}/${region}/vpc-id`,
      stringValue: vpc.vpcId,
      description: `VPC ID for ${applicationName} ${environment} in ${region}`,
    });

    new ssm.StringParameter(this, 'ALBDNSParameter', {
      parameterName: `/${applicationName}/${environment}/${region}/alb-dns`,
      stringValue: loadBalancer.loadBalancerDnsName,
      description: `ALB DNS name for ${applicationName} ${environment} in ${region}`,
    });

    new ssm.StringParameter(this, 'BucketNameParameter', {
      parameterName: `/${applicationName}/${environment}/${region}/s3-bucket-name`,
      stringValue: contentBucket.bucketName,
      description: `S3 bucket name for ${applicationName} ${environment} in ${region}`,
    });

    // Store VPC Lattice Service Network ID (commented out as VPC Lattice is disabled)
    /*
    new ssm.StringParameter(this, 'ServiceNetworkParameter', {
      parameterName: `/${applicationName}/${environment}/${region}/service-network-id`,
      stringValue: serviceNetwork.ref,
      description: `VPC Lattice Service Network ID for ${applicationName} ${environment} in ${region}`,
    });
    */

    // Store EventBridge Scheduler ARN
    new ssm.StringParameter(this, 'SchedulerRoleParameter', {
      parameterName: `/${applicationName}/${environment}/${region}/scheduler-role-arn`,
      stringValue: schedulerRole.roleArn,
      description: `EventBridge Scheduler role ARN for ${applicationName} ${environment} in ${region}`,
    });

    // EKS Ultra Scale preparation for future container workloads (only in production)
    // Note: EKS cluster commented out to avoid kubectlLayer dependency issues
    // Uncomment and configure kubectlLayer when needed for production deployment
    if (environment === 'production') {
      // Store placeholder EKS cluster info in Parameter Store
      new ssm.StringParameter(this, 'EKSClusterParameter', {
        parameterName: `/${applicationName}/${environment}/${region}/eks-cluster-name`,
        stringValue: 'eks-cluster-placeholder',
        description: `EKS Cluster name placeholder for ${applicationName} ${environment} in ${region}`,
      });
    }

    // Amazon Bedrock AgentCore IAM role preparation
    const bedrockAgentRole = new iam.Role(this, 'BedrockAgentRole', {
      assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
      inlinePolicies: {
        BedrockAgentCorePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
                'bedrock-agentcore:*',
                's3:GetObject',
                's3:PutObject',
                'ssm:GetParameter',
                'ssm:GetParameters',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Store Bedrock Agent role in Parameter Store
    new ssm.StringParameter(this, 'BedrockAgentRoleParameter', {
      parameterName: `/${applicationName}/${environment}/${region}/bedrock-agent-role-arn`,
      stringValue: bedrockAgentRole.roleArn,
      description: `Bedrock Agent role ARN for ${applicationName} ${environment} in ${region}`,
    });

    // Tags
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('Application', applicationName);
    cdk.Tags.of(this).add('Region', region || 'unknown');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Scheduler', 'EventBridge');
    cdk.Tags.of(this).add('EnhancedFeatures', 'EventBridgeScheduler');

    // Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${id}-VPCId`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: loadBalancer.loadBalancerDnsName,
      description: 'Load Balancer DNS Name',
      exportName: `${id}-LoadBalancerDNS`,
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: contentBucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `${id}-BucketName`,
    });

    // VPC Lattice outputs (commented out as VPC Lattice is disabled)
    /*
    new cdk.CfnOutput(this, 'ServiceNetworkId', {
      value: serviceNetwork.ref,
      description: 'VPC Lattice Service Network ID',
      exportName: `${id}-ServiceNetworkId`,
    });

    new cdk.CfnOutput(this, 'ServiceId', {
      value: webService.ref,
      description: 'VPC Lattice Service ID',
      exportName: `${id}-ServiceId`,
    });
    */

    new cdk.CfnOutput(this, 'MaintenanceFunctionName', {
      value: maintenanceFunction.functionName,
      description: 'EventBridge Scheduler Maintenance Function',
      exportName: `${id}-MaintenanceFunctionName`,
    });

    new cdk.CfnOutput(this, 'ApplicationName', {
      value: applicationName,
      description: 'Application Name',
    });

    new cdk.CfnOutput(this, 'Environment', {
      value: environment,
      description: 'Environment',
    });
  }
}
