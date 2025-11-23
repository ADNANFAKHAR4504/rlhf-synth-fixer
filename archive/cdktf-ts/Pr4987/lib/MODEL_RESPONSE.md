```typescript
// main.ts
import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput, Fn } from 'cdktf';
import {
  AwsProvider,
  vpc,
  ec2,
  rds,
  elbv2,
  route53,
  iam,
  autoscaling,
  cloudwatch,
  lambda,
  kms,
  sns,
  ssm,
  s3,
} from '@cdktf/provider-aws';

interface RegionConfig {
  provider: AwsProvider;
  region: string;
  isPrimary: boolean;
  cidrBlock: string;
}

class NetworkingConstruct extends Construct {
  public vpc: vpc.Vpc;
  public privateSubnets: vpc.Subnet[];
  public publicSubnets: vpc.Subnet[];
  public dbSubnetGroup: rds.DbSubnetGroup;

  constructor(scope: Construct, id: string, config: RegionConfig) {
    super(scope, id);

    // Create VPC
    this.vpc = new vpc.Vpc(this, `vpc-${config.region}`, {
      provider: config.provider,
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `trading-system-vpc-${config.region}`,
        Environment: config.isPrimary ? 'primary' : 'dr',
      },
    });

    // Create Internet Gateway
    const igw = new vpc.InternetGateway(this, `igw-${config.region}`, {
      provider: config.provider,
      vpcId: this.vpc.id,
      tags: {
        Name: `trading-system-igw-${config.region}`,
      },
    });

    // Create subnets across 3 AZs for high availability
    const azs = ['a', 'b', 'c'];
    this.privateSubnets = [];
    this.publicSubnets = [];

    azs.forEach((az, index) => {
      // Private subnets for application and database
      const privateSubnet = new vpc.Subnet(this, `private-subnet-${az}`, {
        provider: config.provider,
        vpcId: this.vpc.id,
        cidrBlock: `${config.cidrBlock.split('.')[0]}.${config.cidrBlock.split('.')[1]}.${10 + index}.0/24`,
        availabilityZone: `${config.region}${az}`,
        tags: {
          Name: `trading-system-private-${config.region}-${az}`,
          Type: 'Private',
        },
      });
      this.privateSubnets.push(privateSubnet);

      // Public subnets for ALB and NAT
      const publicSubnet = new vpc.Subnet(this, `public-subnet-${az}`, {
        provider: config.provider,
        vpcId: this.vpc.id,
        cidrBlock: `${config.cidrBlock.split('.')[0]}.${config.cidrBlock.split('.')[1]}.${20 + index}.0/24`,
        availabilityZone: `${config.region}${az}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `trading-system-public-${config.region}-${az}`,
          Type: 'Public',
        },
      });
      this.publicSubnets.push(publicSubnet);

      // Create NAT Gateway for each AZ
      const eip = new vpc.Eip(this, `nat-eip-${az}`, {
        provider: config.provider,
        vpc: true,
        tags: {
          Name: `trading-system-nat-eip-${config.region}-${az}`,
        },
      });

      const natGateway = new vpc.NatGateway(this, `nat-${az}`, {
        provider: config.provider,
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: {
          Name: `trading-system-nat-${config.region}-${az}`,
        },
      });

      // Private route table
      const privateRouteTable = new vpc.RouteTable(this, `private-rt-${az}`, {
        provider: config.provider,
        vpcId: this.vpc.id,
        tags: {
          Name: `trading-system-private-rt-${config.region}-${az}`,
        },
      });

      new vpc.Route(this, `private-route-${az}`, {
        provider: config.provider,
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      });

      new vpc.RouteTableAssociation(this, `private-rta-${az}`, {
        provider: config.provider,
        subnetId: privateSubnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // Public route table
    const publicRouteTable = new vpc.RouteTable(this, 'public-rt', {
      provider: config.provider,
      vpcId: this.vpc.id,
      tags: {
        Name: `trading-system-public-rt-${config.region}`,
      },
    });

    new vpc.Route(this, 'public-route', {
      provider: config.provider,
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    this.publicSubnets.forEach((subnet, index) => {
      new vpc.RouteTableAssociation(this, `public-rta-${index}`, {
        provider: config.provider,
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Database subnet group
    this.dbSubnetGroup = new rds.DbSubnetGroup(this, 'db-subnet-group', {
      provider: config.provider,
      name: `trading-system-db-subnet-${config.region}`,
      subnetIds: this.privateSubnets.map(s => s.id),
      tags: {
        Name: `trading-system-db-subnet-${config.region}`,
      },
    });
  }
}

class SecurityConstruct extends Construct {
  public kmsKey: kms.KmsKey;
  public appSecurityGroup: vpc.SecurityGroup;
  public dbSecurityGroup: vpc.SecurityGroup;
  public albSecurityGroup: vpc.SecurityGroup;
  public lambdaRole: iam.IamRole;

  constructor(
    scope: Construct,
    id: string,
    config: RegionConfig,
    vpcId: string
  ) {
    super(scope, id);

    // KMS key for encryption at rest
    this.kmsKey = new kms.KmsKey(this, `kms-key-${config.region}`, {
      provider: config.provider,
      description: `Trading system encryption key for ${config.region}`,
      enableKeyRotation: true,
      tags: {
        Name: `trading-system-kms-${config.region}`,
        Compliance: 'GDPR',
      },
    });

    new kms.KmsAlias(this, `kms-alias-${config.region}`, {
      provider: config.provider,
      name: `alias/trading-system-${config.region}`,
      targetKeyId: this.kmsKey.id,
    });

    // ALB Security Group
    this.albSecurityGroup = new vpc.SecurityGroup(this, 'alb-sg', {
      provider: config.provider,
      vpcId: vpcId,
      name: `trading-system-alb-sg-${config.region}`,
      description: 'Security group for Application Load Balancer',
      ingress: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTPS from internet',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound',
        },
      ],
      tags: {
        Name: `trading-system-alb-sg-${config.region}`,
      },
    });

    // Application Security Group
    this.appSecurityGroup = new vpc.SecurityGroup(this, 'app-sg', {
      provider: config.provider,
      vpcId: vpcId,
      name: `trading-system-app-sg-${config.region}`,
      description: 'Security group for application servers',
      ingress: [
        {
          fromPort: 8443,
          toPort: 8443,
          protocol: 'tcp',
          securityGroups: [this.albSecurityGroup.id],
          description: 'HTTPS from ALB',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound',
        },
      ],
      tags: {
        Name: `trading-system-app-sg-${config.region}`,
      },
    });

    // Database Security Group
    this.dbSecurityGroup = new vpc.SecurityGroup(this, 'db-sg', {
      provider: config.provider,
      vpcId: vpcId,
      name: `trading-system-db-sg-${config.region}`,
      description: 'Security group for Aurora database',
      ingress: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          securityGroups: [this.appSecurityGroup.id],
          description: 'MySQL from application servers',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound',
        },
      ],
      tags: {
        Name: `trading-system-db-sg-${config.region}`,
      },
    });

    // Lambda execution role for failover orchestration
    this.lambdaRole = new iam.IamRole(this, 'lambda-role', {
      provider: config.provider,
      name: `trading-system-failover-lambda-${config.region}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Effect: 'Allow',
          },
        ],
      }),
      tags: {
        Name: `trading-system-lambda-role-${config.region}`,
      },
    });

    // Lambda role policies
    new iam.IamRolePolicyAttachment(this, 'lambda-basic', {
      provider: config.provider,
      role: this.lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    });

    new iam.IamRolePolicy(this, 'lambda-failover-policy', {
      provider: config.provider,
      role: this.lambdaRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'rds:PromoteReadReplica',
              'rds:ModifyDBCluster',
              'rds:DescribeDBClusters',
              'route53:ChangeResourceRecordSets',
              'route53:GetChange',
              'sns:Publish',
              'ssm:SendCommand',
              'cloudwatch:PutMetricData',
            ],
            Resource: '*',
          },
        ],
      }),
    });
  }
}

class DatabaseConstruct extends Construct {
  public cluster: rds.RdsCluster;
  public instances: rds.RdsClusterInstance[];
  public replicaCluster?: rds.RdsCluster;

  constructor(
    scope: Construct,
    id: string,
    config: RegionConfig,
    networking: NetworkingConstruct,
    security: SecurityConstruct,
    sourceCluster?: rds.RdsCluster
  ) {
    super(scope, id);

    if (config.isPrimary) {
      // Primary Aurora cluster
      this.cluster = new rds.RdsCluster(this, 'aurora-cluster', {
        provider: config.provider,
        clusterIdentifier: `trading-system-aurora-${config.region}`,
        engine: 'aurora-mysql',
        engineVersion: '8.0.mysql_aurora.3.02.0',
        masterUsername: 'admin',
        masterPassword: 'ChangeMe123!Secure', // In production, use AWS Secrets Manager
        databaseName: 'trading',
        dbSubnetGroupName: networking.dbSubnetGroup.name,
        vpcSecurityGroupIds: [security.dbSecurityGroup.id],
        storageEncrypted: true,
        kmsKeyId: security.kmsKey.arn,
        backupRetentionPeriod: 7,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
        skipFinalSnapshot: false,
        finalSnapshotIdentifier: `trading-system-final-snapshot-${Date.now()}`,
        tags: {
          Name: `trading-system-aurora-${config.region}`,
          Environment: 'primary',
        },
      });

      // Create 3 Aurora instances for high availability
      this.instances = [];
      for (let i = 0; i < 3; i++) {
        const instance = new rds.RdsClusterInstance(
          this,
          `aurora-instance-${i}`,
          {
            provider: config.provider,
            identifier: `trading-system-aurora-${config.region}-${i}`,
            clusterIdentifier: this.cluster.id,
            instanceClass: 'db.r6g.2xlarge',
            engine: 'aurora-mysql',
            engineVersion: this.cluster.engineVersion,
            performanceInsightsEnabled: true,
            performanceInsightsRetentionPeriod: 7,
            monitoringInterval: 60,
            monitoringRoleArn: new iam.IamRole(this, `monitoring-role-${i}`, {
              provider: config.provider,
              name: `trading-system-rds-monitoring-${config.region}-${i}`,
              assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Action: 'sts:AssumeRole',
                    Principal: {
                      Service: 'monitoring.rds.amazonaws.com',
                    },
                    Effect: 'Allow',
                  },
                ],
              }),
            }).arn,
            tags: {
              Name: `trading-system-aurora-instance-${config.region}-${i}`,
            },
          }
        );
        this.instances.push(instance);

        new iam.IamRolePolicyAttachment(this, `monitoring-policy-${i}`, {
          provider: config.provider,
          role: `trading-system-rds-monitoring-${config.region}-${i}`,
          policyArn:
            'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
        });
      }
    } else if (sourceCluster) {
      // Cross-region read replica cluster
      this.replicaCluster = new rds.RdsCluster(this, 'aurora-replica-cluster', {
        provider: config.provider,
        clusterIdentifier: `trading-system-aurora-replica-${config.region}`,
        engine: 'aurora-mysql',
        engineVersion: '8.0.mysql_aurora.3.02.0',
        replicationSourceIdentifier: sourceCluster.arn,
        dbSubnetGroupName: networking.dbSubnetGroup.name,
        vpcSecurityGroupIds: [security.dbSecurityGroup.id],
        storageEncrypted: true,
        kmsKeyId: security.kmsKey.arn,
        skipFinalSnapshot: false,
        finalSnapshotIdentifier: `trading-system-replica-final-snapshot-${Date.now()}`,
        tags: {
          Name: `trading-system-aurora-replica-${config.region}`,
          Environment: 'dr',
        },
      });

      // Create replica instances
      this.instances = [];
      for (let i = 0; i < 2; i++) {
        const instance = new rds.RdsClusterInstance(
          this,
          `replica-instance-${i}`,
          {
            provider: config.provider,
            identifier: `trading-system-aurora-replica-${config.region}-${i}`,
            clusterIdentifier: this.replicaCluster.id,
            instanceClass: 'db.r6g.2xlarge',
            engine: 'aurora-mysql',
            engineVersion: this.replicaCluster.engineVersion,
            performanceInsightsEnabled: true,
            tags: {
              Name: `trading-system-aurora-replica-instance-${config.region}-${i}`,
            },
          }
        );
        this.instances.push(instance);
      }
    }
  }
}

class ComputeConstruct extends Construct {
  public alb: elbv2.Alb;
  public targetGroup: elbv2.AlbTargetGroup;
  public asg: autoscaling.AutoscalingGroup;

  constructor(
    scope: Construct,
    id: string,
    config: RegionConfig,
    networking: NetworkingConstruct,
    security: SecurityConstruct
  ) {
    super(scope, id);

    // Application Load Balancer
    this.alb = new elbv2.Alb(this, 'alb', {
      provider: config.provider,
      name: `trading-system-alb-${config.region}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [security.albSecurityGroup.id],
      subnets: networking.publicSubnets.map(s => s.id),
      enableDeletionProtection: true,
      enableHttp2: true,
      enableCrossZoneLoadBalancing: true,
      tags: {
        Name: `trading-system-alb-${config.region}`,
        Environment: config.isPrimary ? 'primary' : 'dr',
      },
    });

    // Target Group
    this.targetGroup = new elbv2.AlbTargetGroup(this, 'tg', {
      provider: config.provider,
      name: `trading-tg-${config.region}`,
      port: 8443,
      protocol: 'HTTPS',
      vpcId: networking.vpc.id,
      targetType: 'instance',
      deregistrationDelay: 30,
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: 'HTTPS',
        port: '8443',
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 10,
        matcher: '200',
      },
      stickiness: {
        type: 'lb_cookie',
        enabled: true,
        cookieDuration: 86400,
      },
      tags: {
        Name: `trading-system-tg-${config.region}`,
      },
    });

    // HTTPS Listener
    new elbv2.AlbListener(this, 'https-listener', {
      provider: config.provider,
      loadBalancerArn: this.alb.arn,
      port: 443,
      protocol: 'HTTPS',
      sslPolicy: 'ELBSecurityPolicy-TLS13-1-2-2021-06',
      certificateArn: 'arn:aws:acm:region:account:certificate/xxxxx', // Replace with actual ACM certificate
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
      tags: {
        Name: `trading-system-listener-${config.region}`,
      },
    });

    // Launch Template
    const userData = `#!/bin/bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm

# Configure application
echo "DATABASE_ENDPOINT=${config.isPrimary ? 'primary-db-endpoint' : 'replica-db-endpoint'}" >> /etc/environment
echo "REGION=${config.region}" >> /etc/environment
echo "ENVIRONMENT=${config.isPrimary ? 'primary' : 'dr'}" >> /etc/environment

# Start application
systemctl start trading-app
systemctl enable trading-app
`;

    const launchTemplate = new ec2.LaunchTemplate(this, 'lt', {
      provider: config.provider,
      name: `trading-system-lt-${config.region}`,
      imageId: 'ami-xxxxxxxxx', // Replace with your AMI ID
      instanceType: 'c5.2xlarge',
      keyName: 'trading-system-key',
      vpcSecurityGroupIds: [security.appSecurityGroup.id],
      userData: Buffer.from(userData).toString('base64'),
      blockDeviceMappings: [
        {
          deviceName: '/dev/xvda',
          ebs: {
            volumeSize: 100,
            volumeType: 'gp3',
            iops: 3000,
            encrypted: true,
            kmsKeyId: security.kmsKey.arn,
            deleteOnTermination: true,
          },
        },
      ],
      iamInstanceProfile: {
        name: new iam.IamInstanceProfile(this, 'instance-profile', {
          provider: config.provider,
          name: `trading-system-instance-profile-${config.region}`,
          role: new iam.IamRole(this, 'instance-role', {
            provider: config.provider,
            name: `trading-system-instance-role-${config.region}`,
            assumeRolePolicy: JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Action: 'sts:AssumeRole',
                  Principal: {
                    Service: 'ec2.amazonaws.com',
                  },
                  Effect: 'Allow',
                },
              ],
            }),
          }).name,
        }).name,
      },
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            Name: `trading-system-instance-${config.region}`,
            Environment: config.isPrimary ? 'primary' : 'dr',
          },
        },
      ],
    });

    // Auto Scaling Group
    this.asg = new autoscaling.AutoscalingGroup(this, 'asg', {
      provider: config.provider,
      name: `trading-system-asg-${config.region}`,
      vpcZoneIdentifier: networking.privateSubnets.map(s => s.id),
      targetGroupArns: [this.targetGroup.arn],
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      minSize: config.isPrimary ? 6 : 3,
      maxSize: config.isPrimary ? 20 : 10,
      desiredCapacity: config.isPrimary ? 9 : 3,
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      enabledMetrics: [
        'GroupMinSize',
        'GroupMaxSize',
        'GroupDesiredCapacity',
        'GroupInServiceInstances',
        'GroupPendingInstances',
        'GroupStandbyInstances',
        'GroupTerminatingInstances',
        'GroupTotalInstances',
      ],
      tags: [
        {
          key: 'Name',
          value: `trading-system-asg-${config.region}`,
          propagateAtLaunch: true,
        },
        {
          key: 'Environment',
          value: config.isPrimary ? 'primary' : 'dr',
          propagateAtLaunch: true,
        },
      ],
    });

    // Auto Scaling Policies
    new autoscaling.AutoscalingPolicy(this, 'cpu-scale-up', {
      provider: config.provider,
      name: `trading-system-cpu-scale-up-${config.region}`,
      autoscalingGroupName: this.asg.name,
      adjustmentType: 'ChangeInCapacity',
      scalingAdjustment: 2,
      cooldown: 60,
      policyType: 'SimpleScaling',
    });

    new autoscaling.AutoscalingPolicy(this, 'cpu-scale-down', {
      provider: config.provider,
      name: `trading-system-cpu-scale-down-${config.region}`,
      autoscalingGroupName: this.asg.name,
      adjustmentType: 'ChangeInCapacity',
      scalingAdjustment: -1,
      cooldown: 300,
      policyType: 'SimpleScaling',
    });
  }
}

class MonitoringConstruct extends Construct {
  public primaryHealthAlarm: cloudwatch.CloudwatchMetricAlarm;
  public dbReplicationAlarm: cloudwatch.CloudwatchMetricAlarm;
  public snsTopic: sns.SnsTopic;

  constructor(
    scope: Construct,
    id: string,
    config: RegionConfig,
    alb?: elbv2.Alb,
    dbCluster?: rds.RdsCluster
  ) {
    super(scope, id);

    // SNS Topic for notifications
    this.snsTopic = new sns.SnsTopic(this, 'alerts-topic', {
      provider: config.provider,
      name: `trading-system-alerts-${config.region}`,
      displayName: `Trading System Alerts - ${config.region}`,
      tags: {
        Name: `trading-system-sns-${config.region}`,
      },
    });

    // Primary health check alarm
    if (alb && config.isPrimary) {
      this.primaryHealthAlarm = new cloudwatch.CloudwatchMetricAlarm(
        this,
        'primary-health',
        {
          provider: config.provider,
          alarmName: `trading-system-primary-health-${config.region}`,
          comparisonOperator: 'LessThanThreshold',
          evaluationPeriods: 2,
          threshold: 1,
          alarmDescription: 'Primary region health check',
          treatMissingData: 'breaching',
          metricName: 'HealthyHostCount',
          namespace: 'AWS/ApplicationELB',
          statistic: 'Average',
          period: 60,
          dimensions: {
            LoadBalancer: alb.arnSuffix,
          },
          alarmActions: [this.snsTopic.arn],
          tags: {
            Name: `trading-system-primary-health-alarm-${config.region}`,
          },
        }
      );
    }

    // Database replication lag alarm
    if (dbCluster) {
      this.dbReplicationAlarm = new cloudwatch.CloudwatchMetricAlarm(
        this,
        'replication-lag',
        {
          provider: config.provider,
          alarmName: `trading-system-replication-lag-${config.region}`,
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 1,
          threshold: 1000, // 1 second in milliseconds
          alarmDescription: 'Database replication lag',
          treatMissingData: 'notBreaching',
          metricName: config.isPrimary
            ? 'AuroraBinlogReplicaLag'
            : 'AuroraReplicaLag',
          namespace: 'AWS/RDS',
          statistic: 'Maximum',
          period: 60,
          dimensions: {
            DBClusterIdentifier: dbCluster.clusterIdentifier,
          },
          alarmActions: [this.snsTopic.arn],
          tags: {
            Name: `trading-system-replication-alarm-${config.region}`,
          },
        }
      );
    }

    // Application response time alarm
    if (alb) {
      new cloudwatch.CloudwatchMetricAlarm(this, 'response-time', {
        provider: config.provider,
        alarmName: `trading-system-response-time-${config.region}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        threshold: 500, // milliseconds
        alarmDescription: 'Application response time',
        treatMissingData: 'notBreaching',
        metricName: 'TargetResponseTime',
        namespace: 'AWS/ApplicationELB',
        statistic: 'Average',
        period: 60,
        dimensions: {
          LoadBalancer: alb.arnSuffix,
        },
        alarmActions: [this.snsTopic.arn],
        tags: {
          Name: `trading-system-response-time-alarm-${config.region}`,
        },
      });
    }
  }
}

class DisasterRecoveryOrchestrationConstruct extends Construct {
  public failoverLambda: lambda.LambdaFunction;
  public route53HealthCheck: route53.Route53HealthCheck;
  public failoverRecord: route53.Route53Record;

  constructor(
    scope: Construct,
    id: string,
    primaryAlb: elbv2.Alb,
    drAlb: elbv2.Alb,
    primaryProvider: AwsProvider,
    drProvider: AwsProvider,
    lambdaRole: iam.IamRole,
    snsTopic: sns.SnsTopic,
    hostedZoneId: string
  ) {
    super(scope, id);

    // Failover Lambda function
    const failoverCode = `
import boto3
import json
import os
from datetime import datetime

def handler(event, context):
    """
    Orchestrates failover from primary to DR region
    """
    rds_dr = boto3.client('rds', region_name='us-west-2')
    route53 = boto3.client('route53')
    sns = boto3.client('sns')
    cloudwatch = boto3.client('cloudwatch')
    
    try:
        # Step 1: Promote read replica to primary
        print("Promoting DR database to primary...")
        response = rds_dr.promote_read_replica_db_cluster(
            DBClusterIdentifier='trading-system-aurora-replica-us-west-2'
        )
        
        # Step 2: Update Route 53 DNS
        print("Updating Route 53 DNS...")
        change_batch = {
            'Changes': [{
                'Action': 'UPSERT',
                'ResourceRecordSet': {
                    'Name': 'trading.example.com',
                    'Type': 'CNAME',
                    'SetIdentifier': 'Failover-PRIMARY',
                    'Failover': 'PRIMARY',
                    'TTL': 60,
                    'ResourceRecords': [{'Value': os.environ['DR_ALB_DNS']}]
                }
            }]
        }
        
        route53.change_resource_record_sets(
            HostedZoneId=os.environ['HOSTED_ZONE_ID'],
            ChangeBatch=change_batch
        )
        
        # Step 3: Send notification
        sns.publish(
            TopicArn=os.environ['SNS_TOPIC_ARN'],
            Subject='Trading System Failover Initiated',
            Message=f'Failover to DR region initiated at {datetime.utcnow().isoformat()}'
        )
        
        # Step 4: Log metrics
        cloudwatch.put_metric_data(
            Namespace='TradingSystem/DR',
            MetricData=[
                {
                    'MetricName': 'FailoverInitiated',
                    'Value': 1,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps('Failover initiated successfully')
        }
        
    except Exception as e:
        print(f"Error during failover: {str(e)}")
        sns.publish(
            TopicArn=os.environ['SNS_TOPIC_ARN'],
            Subject='Trading System Failover Failed',
            Message=f'Failover failed: {str(e)}'
        )
        raise
`;

    this.failoverLambda = new lambda.LambdaFunction(this, 'failover-lambda', {
      provider: primaryProvider,
      functionName: 'trading-system-failover',
      role: lambdaRole.arn,
      handler: 'index.handler',
      runtime: 'python3.9',
      timeout: 300,
      memorySize: 512,
      filename: 'failover.zip', // You'll need to create this ZIP file
      sourceCodeHash: Fn.filebase64sha256('failover.zip'),
      environment: {
        variables: {
          DR_ALB_DNS: drAlb.dnsName,
          HOSTED_ZONE_ID: hostedZoneId,
          SNS_TOPIC_ARN: snsTopic.arn,
        },
      },
      tags: {
        Name: 'trading-system-failover-lambda',
      },
    });

    // Route 53 Health Check for primary ALB
    this.route53HealthCheck = new route53.Route53HealthCheck(
      this,
      'primary-health-check',
      {
        provider: primaryProvider,
        fqdn: primaryAlb.dnsName,
        port: 443,
        type: 'HTTPS',
        resourcePath: '/health',
        failureThreshold: 3,
        requestInterval: 10,
        tags: {
          Name: 'trading-system-primary-health-check',
        },
      }
    );

    // Route 53 Failover Records
    const primaryRecord = new route53.Route53Record(this, 'primary-record', {
      provider: primaryProvider,
      zoneId: hostedZoneId,
      name: 'trading.example.com',
      type: 'CNAME',
      ttl: 60,
      records: [primaryAlb.dnsName],
      setIdentifier: 'Primary',
      failoverRoutingPolicy: {
        type: 'PRIMARY',
      },
      healthCheckId: this.route53HealthCheck.id,
    });

    this.failoverRecord = new route53.Route53Record(this, 'dr-record', {
      provider: drProvider,
      zoneId: hostedZoneId,
      name: 'trading.example.com',
      type: 'CNAME',
      ttl: 60,
      records: [drAlb.dnsName],
      setIdentifier: 'DR',
      failoverRoutingPolicy: {
        type: 'SECONDARY',
      },
    });

    // CloudWatch Event Rule to trigger failover
    new cloudwatch.CloudwatchEventRule(this, 'failover-trigger', {
      provider: primaryProvider,
      name: 'trading-system-failover-trigger',
      description: 'Trigger failover on primary failure',
      eventPattern: JSON.stringify({
        source: ['aws.cloudwatch'],
        'detail-type': ['CloudWatch Alarm State Change'],
        detail: {
          alarmName: ['trading-system-primary-health-us-east-1'],
          state: {
            value: ['ALARM'],
          },
        },
      }),
    });

    new cloudwatch.CloudwatchEventTarget(this, 'failover-target', {
      provider: primaryProvider,
      rule: 'trading-system-failover-trigger',
      arn: this.failoverLambda.arn,
    });

    // Lambda permission for CloudWatch Events
    new lambda.LambdaPermission(this, 'failover-permission', {
      provider: primaryProvider,
      statementId: 'AllowExecutionFromCloudWatch',
      action: 'lambda:InvokeFunction',
      functionName: this.failoverLambda.functionName,
      principal: 'events.amazonaws.com',
      sourceArn: `arn:aws:events:us-east-1:*:rule/trading-system-failover-trigger`,
    });
  }
}

class TradingSystemDRStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure providers
    const primaryProvider = new AwsProvider(this, 'aws-primary', {
      region: 'us-east-1',
      alias: 'primary',
    });

    const drProvider = new AwsProvider(this, 'aws-dr', {
      region: 'us-west-2',
      alias: 'dr',
    });

    // Get or create hosted zone for Route 53
    const hostedZone = new route53.DataAwsRoute53Zone(this, 'hosted-zone', {
      provider: primaryProvider,
      name: 'example.com', // Replace with your domain
    });

    // Primary Region Setup
    const primaryConfig: RegionConfig = {
      provider: primaryProvider,
      region: 'us-east-1',
      isPrimary: true,
      cidrBlock: '10.0.0.0/16',
    };

    const primaryNetworking = new NetworkingConstruct(
      this,
      'primary-networking',
      primaryConfig
    );
    const primarySecurity = new SecurityConstruct(
      this,
      'primary-security',
      primaryConfig,
      primaryNetworking.vpc.id
    );
    const primaryDatabase = new DatabaseConstruct(
      this,
      'primary-database',
      primaryConfig,
      primaryNetworking,
      primarySecurity
    );
    const primaryCompute = new ComputeConstruct(
      this,
      'primary-compute',
      primaryConfig,
      primaryNetworking,
      primarySecurity
    );
    const primaryMonitoring = new MonitoringConstruct(
      this,
      'primary-monitoring',
      primaryConfig,
      primaryCompute.alb,
      primaryDatabase.cluster
    );

    // DR Region Setup
    const drConfig: RegionConfig = {
      provider: drProvider,
      region: 'us-west-2',
      isPrimary: false,
      cidrBlock: '10.1.0.0/16',
    };

    const drNetworking = new NetworkingConstruct(
      this,
      'dr-networking',
      drConfig
    );
    const drSecurity = new SecurityConstruct(
      this,
      'dr-security',
      drConfig,
      drNetworking.vpc.id
    );
    const drDatabase = new DatabaseConstruct(
      this,
      'dr-database',
      drConfig,
      drNetworking,
      drSecurity,
      primaryDatabase.cluster
    );
    const drCompute = new ComputeConstruct(
      this,
      'dr-compute',
      drConfig,
      drNetworking,
      drSecurity
    );
    const drMonitoring = new MonitoringConstruct(
      this,
      'dr-monitoring',
      drConfig,
      drCompute.alb,
      drDatabase.replicaCluster
    );

    // Disaster Recovery Orchestration
    const drOrchestration = new DisasterRecoveryOrchestrationConstruct(
      this,
      'dr-orchestration',
      primaryCompute.alb,
      drCompute.alb,
      primaryProvider,
      drProvider,
      primarySecurity.lambdaRole,
      primaryMonitoring.snsTopic,
      hostedZone.zoneId
    );

    // SSM Parameters for configuration management
    new ssm.SsmParameter(this, 'primary-db-endpoint', {
      provider: primaryProvider,
      name: '/trading-system/primary/db-endpoint',
      type: 'String',
      value: primaryDatabase.cluster.endpoint,
      tags: {
        Name: 'trading-system-primary-db-endpoint',
      },
    });

    new ssm.SsmParameter(this, 'dr-db-endpoint', {
      provider: drProvider,
      name: '/trading-system/dr/db-endpoint',
      type: 'String',
      value: drDatabase.replicaCluster!.endpoint,
      tags: {
        Name: 'trading-system-dr-db-endpoint',
      },
    });

    // Outputs
    new TerraformOutput(this, 'PrimaryDBClusterEndpoint', {
      value: primaryDatabase.cluster.endpoint,
      description: 'Primary Aurora cluster endpoint',
    });

    new TerraformOutput(this, 'ReplicaDBClusterEndpoint', {
      value: drDatabase.replicaCluster!.endpoint,
      description: 'DR Aurora replica cluster endpoint',
    });

    new TerraformOutput(this, 'PrimaryALBEndpoint', {
      value: `https://${primaryCompute.alb.dnsName}`,
      description: 'Primary region ALB endpoint',
    });

    new TerraformOutput(this, 'Route53FailoverDNS', {
      value: drOrchestration.failoverRecord.fqdn,
      description: 'Route 53 failover DNS name',
    });
  }
}

const app = new App();
new TradingSystemDRStack(app, 'trading-system-dr');
app.synth();
```
