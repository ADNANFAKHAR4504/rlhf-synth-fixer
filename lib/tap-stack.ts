import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

// ? Import your stacks here
// import { MyStack } from './my-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Extract environment suffix for resource naming
    const environmentSuffix = props?.environmentSuffix || 'dev';

    // 'CloudFormation' Parameters - Constraint #9
    new cdk.CfnParameter(this, 'Region', {
      type: 'String',
      default: 'us-west-2',
      allowedValues: ['us-west-2'],
      description: 'AWS Region (must be us-west-2)',
    });

    const desiredCapacityParameter = new cdk.CfnParameter(
      this,
      'DesiredCapacity',
      {
        type: 'Number',
        default: 2,
        minValue: 2,
        maxValue: 5,
        description: 'Desired number of EC2 instances (2-5)',
      }
    );

    // Common tags applied via cdk.Tags.of() calls below

    // VPC with Flow Logs - Constraint #11
    const vpc = new ec2.Vpc(this, 'HaWebappVpc', {
      maxAzs: 2,
      natGateways: 2, // High availability across AZs
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
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      flowLogs: {
        VpcFlowLogs: {
          trafficType: ec2.FlowLogTrafficType.ALL,
          destination: ec2.FlowLogDestination.toCloudWatchLogs(),
        },
      },
    });

    // Apply tags to VPC
    cdk.Tags.of(vpc).add('Environment', 'Production');

    // S3 Bucket for logs - Constraint #5 & #15
    const logsBucket = new s3.Bucket(this, 'LogsBucket', {
      bucketName: `tap-${environmentSuffix}-logs-bucket-${this.account}`,
      versioned: true, // Versioned
      encryption: s3.BucketEncryption.S3_MANAGED, // AES-256
      lifecycleRules: [
        {
          id: 'GlacierTransition',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(30), // Glacier after 30 days
            },
          ],
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
    cdk.Tags.of(logsBucket).add('Environment', 'Production');

    // S3 Bucket for static content
    const staticContentBucket = new s3.Bucket(this, 'StaticContentBucket', {
      bucketName: `tap-${environmentSuffix}-static-content-bucket-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
    cdk.Tags.of(staticContentBucket).add('Environment', 'Production');

    // CloudFront Distribution - Constraint #12
    const distribution = new cloudfront.Distribution(
      this,
      'CloudFrontDistribution',
      {
        defaultBehavior: {
          origin: new origins.S3Origin(staticContentBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
      }
    );
    cdk.Tags.of(distribution).add('Environment', 'Production');

    // RDS Secret - Constraint #7
    const dbSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      description: 'RDS MySQL credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });
    cdk.Tags.of(dbSecret).add('Environment', 'Production');

    // Security Group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc,
        description: 'Security group for RDS MySQL database',
        allowAllOutbound: false,
      }
    );
    cdk.Tags.of(dbSecurityGroup).add('Environment', 'Production');

    // RDS MySQL Multi-AZ - Constraint #7
    const database = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: `tap-${environmentSuffix}-database-instance`,
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_39,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      credentials: rds.Credentials.fromSecret(dbSecret),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSecurityGroup],
      multiAz: true, // Multi-AZ for high availability
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false, // Allow deletion for testing
    });
    cdk.Tags.of(database).add('Environment', 'Production');

    // EC2 IAM Role - Constraint #8 (least privilege)
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ), // CloudWatch Agent
      ],
      inlinePolicies: {
        SecretsManagerAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['secretsmanager:GetSecretValue'],
              resources: [dbSecret.secretArn], // Only access to DB secret
            }),
          ],
        }),
      },
    });
    cdk.Tags.of(ec2Role).add('Environment', 'Production');

    new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      role: ec2Role,
    });

    // Security Group for ALB - Constraint #13
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });
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
    cdk.Tags.of(albSecurityGroup).add('Environment', 'Production');

    // Security Group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );
    cdk.Tags.of(ec2SecurityGroup).add('Environment', 'Production');

    // Allow EC2 to connect to RDS
    dbSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL from EC2'
    );

    // UserData for EC2 instances - Constraint #4 & #6
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      // Install and start NGINX
      'yum update -y',
      'yum install -y nginx',
      'systemctl start nginx',
      'systemctl enable nginx',

      // Install CloudWatch Agent
      'yum install -y amazon-cloudwatch-agent',

      // Create CloudWatch Agent config for CPU and memory monitoring
      'cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json',
      '{',
      '  "metrics": {',
      '    "namespace": "CWAgent",',
      '    "metrics_collected": {',
      '      "cpu": {',
      '        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],',
      '        "metrics_collection_interval": 60',
      '      },',
      '      "mem": {',
      '        "measurement": ["mem_used_percent"],',
      '        "metrics_collection_interval": 60',
      '      }',
      '    }',
      '  }',
      '}',
      'EOF',

      // Start CloudWatch Agent
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    // Launch Template for Auto Scaling Group
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ), // t3.micro
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      userData,
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
    });
    cdk.Tags.of(launchTemplate).add('Environment', 'Production');

    // Auto Scaling Group - Constraint #3
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'AutoScalingGroup',
      {
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        launchTemplate,
        minCapacity: 2,
        maxCapacity: 5,
        desiredCapacity: desiredCapacityParameter.valueAsNumber,
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.seconds(300),
        }),
      }
    );
    cdk.Tags.of(autoScalingGroup).add('Environment', 'Production');

    // Application Load Balancer - Constraint #2
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      'ApplicationLoadBalancer',
      {
        loadBalancerName: `tap-${environmentSuffix}-alb`,
        vpc,
        internetFacing: true,
        vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
        securityGroup: albSecurityGroup,
      }
    );
    cdk.Tags.of(alb).add('Environment', 'Production');

    // ALB Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [autoScalingGroup],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });
    cdk.Tags.of(targetGroup).add('Environment', 'Production');

    // ALB Listener
    alb.addListener('Listener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.forward([targetGroup]),
    });

    // Lambda execution role for RDS snapshots
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        RDSSnapshotPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['rds:CreateDBSnapshot', 'rds:DescribeDBInstances'],
              resources: ['*'],
            }),
          ],
        }),
      },
    });
    cdk.Tags.of(lambdaRole).add('Environment', 'Production');

    // Lambda function for RDS snapshots - Constraint #14
    const snapshotLambda = new lambda.Function(this, 'SnapshotLambda', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      role: lambdaRole,
      environment: {
        DB_INSTANCE_ID: database.instanceIdentifier,
      },
      code: lambda.Code.fromInline(`
import boto3
import os
from datetime import datetime

def handler(event, context):
    rds = boto3.client('rds')
    db_instance_id = os.environ['DB_INSTANCE_ID']
    
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    snapshot_id = f"{db_instance_id}-snapshot-{timestamp}"
    
    try:
        response = rds.create_db_snapshot(
            DBSnapshotIdentifier=snapshot_id,
            DBInstanceIdentifier=db_instance_id,
            Tags=[
                {
                    'Key': 'Environment',
                    'Value': 'Production'
                }
            ]
        )
        return {
            'statusCode': 200,
            'body': f'Successfully created snapshot: {snapshot_id}'
        }
    except Exception as e:
        print(f'Error creating snapshot: {str(e)}')
        raise e
      `),
    });
    cdk.Tags.of(snapshotLambda).add('Environment', 'Production');

    // EventBridge rule to trigger Lambda every 12 hours - Constraint #14
    const scheduleRule = new events.Rule(this, 'SnapshotScheduleRule', {
      schedule: events.Schedule.rate(cdk.Duration.hours(12)),
      targets: [new targets.LambdaFunction(snapshotLambda)],
    });
    cdk.Tags.of(scheduleRule).add('Environment', 'Production');

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionDomain', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: logsBucket.bucketName,
      description: 'S3 Logs Bucket Name',
    });

    new cdk.CfnOutput(this, 'StaticContentBucketName', {
      value: staticContentBucket.bucketName,
      description: 'S3 Static Content Bucket Name',
    });

    // VPC and Networking Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'PublicSubnet1Id', {
      value: vpc.publicSubnets[0].subnetId,
      description: 'Public Subnet 1 ID',
    });

    new cdk.CfnOutput(this, 'PublicSubnet2Id', {
      value: vpc.publicSubnets[1].subnetId,
      description: 'Public Subnet 2 ID',
    });

    new cdk.CfnOutput(this, 'PrivateSubnet1Id', {
      value: vpc.privateSubnets[0].subnetId,
      description: 'Private Subnet 1 ID',
    });

    new cdk.CfnOutput(this, 'PrivateSubnet2Id', {
      value: vpc.privateSubnets[1].subnetId,
      description: 'Private Subnet 2 ID',
    });

    new cdk.CfnOutput(this, 'IsolatedSubnet1Id', {
      value: vpc.isolatedSubnets[0].subnetId,
      description: 'Isolated Subnet 1 ID',
    });

    new cdk.CfnOutput(this, 'IsolatedSubnet2Id', {
      value: vpc.isolatedSubnets[1].subnetId,
      description: 'Isolated Subnet 2 ID',
    });

    // Security Group Outputs
    new cdk.CfnOutput(this, 'ALBSecurityGroupId', {
      value: albSecurityGroup.securityGroupId,
      description: 'ALB Security Group ID',
    });

    new cdk.CfnOutput(this, 'EC2SecurityGroupId', {
      value: ec2SecurityGroup.securityGroupId,
      description: 'EC2 Security Group ID',
    });

    new cdk.CfnOutput(this, 'DatabaseSecurityGroupId', {
      value: dbSecurityGroup.securityGroupId,
      description: 'Database Security Group ID',
    });

    // Database Secret Output
    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: dbSecret.secretArn,
      description: 'Database Secret ARN',
    });

    // Launch Template Output
    new cdk.CfnOutput(this, 'LaunchTemplateId', {
      value: launchTemplate.launchTemplateId!,
      description: 'Launch Template ID',
    });

    // Auto Scaling Group Output
    new cdk.CfnOutput(this, 'AutoScalingGroupArn', {
      value: autoScalingGroup.autoScalingGroupArn,
      description: 'Auto Scaling Group ARN',
    });

    // Lambda Function Output
    new cdk.CfnOutput(this, 'SnapshotLambdaFunctionArn', {
      value: snapshotLambda.functionArn,
      description: 'Snapshot Lambda Function ARN',
    });

    // IAM Role Output
    new cdk.CfnOutput(this, 'EC2RoleArn', {
      value: ec2Role.roleArn,
      description: 'EC2 Instance Role ARN',
    });
  }
}
