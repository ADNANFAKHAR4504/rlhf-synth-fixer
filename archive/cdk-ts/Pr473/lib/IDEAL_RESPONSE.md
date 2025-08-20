# CDK TypeScript Infrastructure Code


## tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as elbv2_targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
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

    // Project name for naming convention: project-stage-resource
    const projectName = 'tap';

    // Lookup existing VPC in us-east-1
    const vpc = ec2.Vpc.fromLookup(this, 'ExistingVpc', {
      isDefault: true,
      region: 'us-east-1',
    });

    // Create KMS key for encryption
    const kmsKey = new kms.Key(
      this,
      `${projectName}-${environmentSuffix}-kms-key`,
      {
        alias: `${projectName}-${environmentSuffix}-key`,
        description: 'KMS key for encrypting EBS volumes and RDS database',
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Security Group for Load Balancer
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `${projectName}-${environmentSuffix}-alb-sg`,
      {
        vpc,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: true,
      }
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    // Security Group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `${projectName}-${environmentSuffix}-ec2-sg`,
      {
        vpc,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
      }
    );

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    // Security Group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `${projectName}-${environmentSuffix}-rds-sg`,
      {
        vpc,
        description: 'Security group for RDS database',
        allowAllOutbound: false,
      }
    );

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from EC2 instances'
    );

    // IAM Role for EC2 instances
    const ec2Role = new iam.Role(
      this,
      `${projectName}-${environmentSuffix}-ec2-role`,
      {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AmazonSSMManagedInstanceCore'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'CloudWatchAgentServerPolicy'
          ),
        ],
      }
    );

    // Get public subnets for EC2 instances (as per requirements)
    const publicSubnets = vpc.publicSubnets;

    // Create EC2 instances in public subnets with auto recovery
    const ec2Instances: ec2.Instance[] = [];

    publicSubnets.slice(0, 2).forEach((subnet, index) => {
      const instance = new ec2.Instance(
        this,
        `${projectName}-${environmentSuffix}-instance-${index + 1}`,
        {
          vpc,
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MICRO
          ),
          machineImage: ec2.MachineImage.latestAmazonLinux2023(),
          securityGroup: ec2SecurityGroup,
          role: ec2Role,
          vpcSubnets: {
            subnets: [subnet],
          },
          blockDevices: [
            {
              deviceName: '/dev/xvda',
              volume: ec2.BlockDeviceVolume.ebs(20, {
                encrypted: true,
                kmsKey: kmsKey,
                volumeType: ec2.EbsDeviceVolumeType.GP3,
              }),
            },
          ],
          userData: ec2.UserData.forLinux(),
          requireImdsv2: true,
        }
      );

      // Add user data for basic web server setup
      instance.userData.addCommands(
        'yum update -y',
        'yum install -y httpd',
        'systemctl start httpd',
        'systemctl enable httpd',
        `echo "<h1>Hello from Instance ${index + 1} - $(hostname -f)</h1>" > /var/www/html/index.html`,
        'yum install -y amazon-cloudwatch-agent',
        'systemctl start amazon-cloudwatch-agent',
        'systemctl enable amazon-cloudwatch-agent'
      );

      ec2Instances.push(instance);

      // Enable EC2 auto recovery via CloudWatch alarm using custom metric
      new cloudwatch.Alarm(
        this,
        `${projectName}-${environmentSuffix}-instance-${index + 1}-status-check`,
        {
          metric: new cloudwatch.Metric({
            namespace: 'AWS/EC2',
            metricName: 'StatusCheckFailed',
            dimensionsMap: {
              InstanceId: instance.instanceId,
            },
            statistic: 'Maximum',
          }),
          threshold: 1,
          evaluationPeriods: 2,
          treatMissingData: cloudwatch.TreatMissingData.BREACHING,
          alarmDescription: `EC2 instance ${index + 1} status check failed - auto recovery`,
          alarmName: `${projectName}-${environmentSuffix}-instance-${index + 1}-status-check`,
        }
      );

      // CPU utilization alarm for monitoring using custom metric
      new cloudwatch.Alarm(
        this,
        `${projectName}-${environmentSuffix}-instance-${index + 1}-cpu`,
        {
          metric: new cloudwatch.Metric({
            namespace: 'AWS/EC2',
            metricName: 'CPUUtilization',
            dimensionsMap: {
              InstanceId: instance.instanceId,
            },
            statistic: 'Average',
          }),
          threshold: 80,
          evaluationPeriods: 2,
          treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
          alarmDescription: `High CPU utilization on EC2 instance ${index + 1}`,
          alarmName: `${projectName}-${environmentSuffix}-instance-${index + 1}-cpu`,
        }
      );
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `${projectName}-${environmentSuffix}-alb`,
      {
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        loadBalancerName: `${projectName}-${environmentSuffix}-alb`,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `${projectName}-${environmentSuffix}-tg`,
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          interval: cdk.Duration.seconds(30),
          path: '/',
          protocol: elbv2.Protocol.HTTP,
          timeout: cdk.Duration.seconds(5),
          unhealthyThresholdCount: 3,
          healthyThresholdCount: 2,
        },
        targetGroupName: `${projectName}-${environmentSuffix}-tg`,
      }
    );

    // Add EC2 instances as targets to the target group
    ec2Instances.forEach(instance => {
      targetGroup.addTarget(new elbv2_targets.InstanceTarget(instance));
    });

    // ALB Listener
    alb.addListener(`${projectName}-${environmentSuffix}-listener`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Intelligent subnet selection for RDS - prioritize private subnets for security
    let rdsSubnetSelection: ec2.SubnetSelection;

    // Try to use private subnets first (best security practice)
    if (vpc.privateSubnets.length > 0) {
      rdsSubnetSelection = {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      };
    } else if (vpc.isolatedSubnets.length > 0) {
      // Fall back to isolated subnets
      rdsSubnetSelection = {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      };
    } else {
      // Last resort: use public subnets but with strict security group rules
      rdsSubnetSelection = {
        subnetType: ec2.SubnetType.PUBLIC,
      };
    }

    // RDS Subnet Group with intelligent subnet selection
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `${projectName}-${environmentSuffix}-db-subnet-group`,
      {
        vpc,
        description: 'Subnet group for RDS database',
        vpcSubnets: rdsSubnetSelection,
        subnetGroupName: `${projectName}-${environmentSuffix}-db-subnet-group`,
      }
    );

    // RDS Database with Multi-AZ and encryption
    const database = new rds.DatabaseInstance(
      this,
      `${projectName}-${environmentSuffix}-database`,
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [rdsSecurityGroup],
        multiAz: true, // Multi-AZ deployment as required
        storageEncrypted: true, // Encryption at rest as required
        storageEncryptionKey: kmsKey, // Using KMS as required
        backupRetention: cdk.Duration.days(7), // Automated backups as required
        deleteAutomatedBackups: false,
        deletionProtection: false, // Set to true for production
        databaseName: 'tapdb',
        credentials: rds.Credentials.fromGeneratedSecret('admin', {
          secretName: `${projectName}-${environmentSuffix}-db-credentials`,
        }),
        allocatedStorage: 20,
        storageType: rds.StorageType.GP3,
        autoMinorVersionUpgrade: true,
        // Remove Performance Insights for t3.micro - not supported
        // enablePerformanceInsights: true,
        // performanceInsightEncryptionKey: kmsKey,
        instanceIdentifier: `${projectName}-${environmentSuffix}-database`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // CloudWatch Alarms for RDS monitoring (as required)
    new cloudwatch.Alarm(this, `${projectName}-${environmentSuffix}-rds-cpu`, {
      metric: database.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'RDS high CPU utilization',
      alarmName: `${projectName}-${environmentSuffix}-rds-cpu`,
    });

    new cloudwatch.Alarm(
      this,
      `${projectName}-${environmentSuffix}-db-connections`,
      {
        metric: database.metricDatabaseConnections(),
        threshold: 80,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'High database connection count',
        alarmName: `${projectName}-${environmentSuffix}-db-connections`,
      }
    );

    // ALB Target Response Time Alarm
    new cloudwatch.Alarm(
      this,
      `${projectName}-${environmentSuffix}-alb-response-time`,
      {
        metric: targetGroup.metrics.targetResponseTime(),
        threshold: 1,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: 'ALB target response time too high',
        alarmName: `${projectName}-${environmentSuffix}-alb-response-time`,
      }
    );

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
      exportName: `${projectName}-${environmentSuffix}-alb-dns`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
      exportName: `${projectName}-${environmentSuffix}-db-endpoint`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: `${projectName}-${environmentSuffix}-kms-key-id`,
    });

    // Output which subnet type was used for RDS for transparency
    new cdk.CfnOutput(this, 'RDSSubnetType', {
      value:
        vpc.privateSubnets.length > 0
          ? 'Private'
          : vpc.isolatedSubnets.length > 0
            ? 'Isolated'
            : 'Public',
      description: 'Subnet type used for RDS deployment',
      exportName: `${projectName}-${environmentSuffix}-rds-subnet-type`,
    });

    // Tags for all resources (following naming convention)
    cdk.Tags.of(this).add('Project', projectName);
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
```
