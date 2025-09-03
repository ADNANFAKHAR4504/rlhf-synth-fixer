```typescript
// tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { WebServerStack } from './web-server';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  vpcId: string;
  region?: string;
  enableMonitoring?: boolean;
  enableBackups?: boolean;
  backupRetentionDays?: number;
  enableAlarms?: boolean;
  alarmEmail?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Use parameterized region or default to us-east-1
    const region =
      props?.region ||
      this.node.tryGetContext('region') ||
      process.env.CDK_DEFAULT_REGION ||
      'us-east-1';

    new WebServerStack(this, 'WebServerStack', {
      environmentSuffix,
      vpcId: props.vpcId,
      region,
      enableMonitoring: props?.enableMonitoring ?? true,
      enableBackups: props?.enableBackups ?? true,
      backupRetentionDays: props?.backupRetentionDays || 7,
      enableAlarms: props?.enableAlarms ?? true,
      alarmEmail: props?.alarmEmail,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: region,
      },
    });
  }
}

```

```typescript
// vpc-utils.ts
// lib/vpc-utils.ts
import {
  DescribeRouteTablesCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';

export async function findVpcByCidr(cidr: string): Promise<string | undefined> {
  const client = new EC2Client({ region: 'us-east-1' });
  const result = await client.send(new DescribeVpcsCommand({}));
  const vpc = result.Vpcs?.find(v => v.CidrBlock === cidr);
  console.log(`VPC found by CIDR ${cidr}: ${vpc?.VpcId}`);
  if (!vpc?.VpcId) {
    return undefined;
  }

  // Validate that this VPC has the required subnet configuration
  const hasValidSubnets = await validateVpcSubnetConfiguration(vpc.VpcId);
  return hasValidSubnets ? vpc.VpcId : undefined;
}

export async function findVpcById(vpcId: string): Promise<string | undefined> {
  const client = new EC2Client({ region: 'us-east-1' });
  const result = await client.send(
    new DescribeVpcsCommand({
      VpcIds: [vpcId],
    })
  );
  const vpc = result.Vpcs?.find(v => v.VpcId === vpcId);

  if (!vpc?.VpcId) {
    return undefined;
  }

  // Validate that this VPC has the required subnet configuration
  const hasValidSubnets = await validateVpcSubnetConfiguration(vpc.VpcId);
  return hasValidSubnets ? vpc.VpcId : undefined;
}

// Specific function for the target VPC ID
export async function findTargetVpc(): Promise<string | undefined> {
  return findVpcById('vpc-0ea3cebfe865ee72f');
}

// Function to validate VPC has exactly 2 private and 1 public subnet
export async function validateVpcSubnetConfiguration(
  vpcId: string
): Promise<boolean> {
  const subnetConfig = await getSubnetConfiguration(vpcId);

  const hasValidConfiguration =
    subnetConfig.privateSubnets.length >= 2 &&
    subnetConfig.publicSubnets.length >= 1;

  if (!hasValidConfiguration) {
    console.log(
      `VPC ${vpcId} does not have the required subnet configuration:`
    );
    console.log(
      `  - Private subnets: ${subnetConfig.privateSubnets.length} (required: 2)`
    );
    console.log(
      `  - Public subnets: ${subnetConfig.publicSubnets.length} (required: 1)`
    );
  }

  return hasValidConfiguration;
}

// Interface for subnet information
export interface SubnetInfo {
  subnetId: string;
  cidrBlock: string;
  availabilityZone: string;
  isPublic: boolean;
}

// Function to get all subnets for a VPC
export async function getVpcSubnets(vpcId: string): Promise<SubnetInfo[]> {
  if (!vpcId || !vpcId.startsWith('vpc-')) {
    throw new Error(`Invalid VPC ID: ${vpcId}`);
  }

  const client = new EC2Client({ region: 'us-east-1' });

  const result = await client.send(
    new DescribeSubnetsCommand({
      Filters: [
        {
          Name: 'vpc-id',
          Values: [vpcId],
        },
      ],
    })
  );

  if (!result.Subnets) {
    return [];
  }

  return result.Subnets.map(subnet => ({
    subnetId: subnet.SubnetId!,
    cidrBlock: subnet.CidrBlock!,
    availabilityZone: subnet.AvailabilityZone!,
    isPublic: subnet.MapPublicIpOnLaunch || false,
  }));
}

// Function to check if a subnet has a route to Internet Gateway
async function hasInternetGatewayRoute(
  subnetId: string,
  vpcId: string
): Promise<boolean> {
  if (!vpcId || !vpcId.startsWith('vpc-')) {
    throw new Error(`Invalid VPC ID: ${vpcId}`);
  }
  if (!subnetId || !subnetId.startsWith('subnet-')) {
    throw new Error(`Invalid Subnet ID: ${subnetId}`);
  }

  const client = new EC2Client({ region: 'us-east-1' });

  try {
    const result = await client.send(
      new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: [subnetId],
          },
        ],
      })
    );

    // If no explicit route table association, check the main route table
    if (!result.RouteTables || result.RouteTables.length === 0) {
      const mainRouteTableResult = await client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
            {
              Name: 'association.main',
              Values: ['true'],
            },
          ],
        })
      );

      if (
        mainRouteTableResult.RouteTables &&
        mainRouteTableResult.RouteTables.length > 0
      ) {
        const routes = mainRouteTableResult.RouteTables[0].Routes || [];
        return routes.some(
          route => route.GatewayId && route.GatewayId.startsWith('igw-')
        );
      }
    }

    // Check explicit route table associations
    for (const routeTable of result.RouteTables || []) {
      const routes = routeTable.Routes || [];
      if (
        routes.some(
          route => route.GatewayId && route.GatewayId.startsWith('igw-')
        )
      ) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(`Error checking IGW route for subnet ${subnetId}:`, error);
    return false;
  }
}

// Function to get private subnets (subnets without IGW route)
export async function getPrivateSubnets(vpcId: string): Promise<SubnetInfo[]> {
  const allSubnets = await getVpcSubnets(vpcId);
  const privateSubnets: SubnetInfo[] = [];

  for (const subnet of allSubnets) {
    const hasIGW = await hasInternetGatewayRoute(subnet.subnetId, vpcId);
    if (!hasIGW) {
      privateSubnets.push({
        ...subnet,
        isPublic: false,
      });
    }
  }

  console.log(`Private subnets found: ${privateSubnets.length}`);
  return privateSubnets;
}

// Function to get public subnets (subnets with IGW route)
export async function getPublicSubnets(vpcId: string): Promise<SubnetInfo[]> {
  const allSubnets = await getVpcSubnets(vpcId);
  const publicSubnets: SubnetInfo[] = [];

  for (const subnet of allSubnets) {
    const hasIGW = await hasInternetGatewayRoute(subnet.subnetId, vpcId);
    if (hasIGW) {
      publicSubnets.push({
        ...subnet,
        isPublic: true,
      });
    }
  }

  console.log(`Public subnets found: ${publicSubnets.length}`);
  return publicSubnets;
}

// Function to get subnet configuration (2 private + 1 public)
export async function getSubnetConfiguration(vpcId: string): Promise<{
  privateSubnets: SubnetInfo[];
  publicSubnets: SubnetInfo[];
}> {
  const privateSubnets = await getPrivateSubnets(vpcId);
  const publicSubnets = await getPublicSubnets(vpcId);

  return {
    privateSubnets: privateSubnets.slice(0, 2), // Take first 2 private subnets
    publicSubnets: publicSubnets.slice(0, 1), // Take first 1 public subnet
  };
}

```

```typescript
// web-server.ts
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import {
  Effect,
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import {
  DatabaseInstance,
  DatabaseInstanceEngine,
  MysqlEngineVersion,
  SubnetGroup,
} from 'aws-cdk-lib/aws-rds';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface WebServerProps extends cdk.StackProps {
  environmentSuffix?: string;
  vpcId: string;
  allowedSshCidr?: string;
  region?: string;
  enableMonitoring?: boolean;
  enableBackups?: boolean;
  backupRetentionDays?: number;
  enableAlarms?: boolean;
  alarmEmail?: string;
}

function generateUniqueBucketName(): string {
  const timestamp = Date.now().toString(36); // base36 for compactness
  const random = Math.random().toString(36).substring(2, 8); // 6-char random string
  return `webserver-assets-${timestamp}-${random}`;
}

export class WebServerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: WebServerProps) {
    super(scope, id, props);

    // Use parameterized region or default to us-east-1
    const region = props?.region || 'us-east-1';
    const enableMonitoring = props?.enableMonitoring ?? true;
    const enableBackups = props?.enableBackups ?? true;
    const backupRetentionDays = props?.backupRetentionDays || 7;
    const enableAlarms = props?.enableAlarms ?? true;
    const alarmEmail = props?.alarmEmail;

    Tags.of(this).add('Environment', 'Dev');
    Tags.of(this).add('Region', region);

    // Use existing VPC
    const vpc = Vpc.fromLookup(this, 'ExistingVPC', {
      vpcId: props?.vpcId,
    });
    const sshCidr = props?.allowedSshCidr ?? '10.0.0.0/16';

    // Security Group
    const securityGroup = new SecurityGroup(this, 'SecurityGroup', {
      vpc,
      allowAllOutbound: true,
      description: 'Allow SSH and HTTP access',
    });
    securityGroup.addIngressRule(
      Peer.ipv4(sshCidr),
      Port.tcp(22),
      `Secure SSH access from ${sshCidr}`
    );
    securityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(80),
      'Allow HTTP access from anywhere'
    );

    // S3 Bucket
    const bucketID = generateUniqueBucketName();
    const s3Bucket = new Bucket(this, 'S3Bucket', {
      bucketName: `webserver-assets-${bucketID}`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // CloudWatch Log Group for EC2
    const ec2LogGroup = new logs.LogGroup(this, 'EC2LogGroup', {
      logGroupName: `/aws/ec2/${props?.environmentSuffix || 'dev'}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Note: RDS logs are handled by the RDS instance configuration via cloudwatchLogsExports

    // SNS Topic for CloudWatch Alarms
    let alarmTopic: sns.Topic | undefined;
    if (enableAlarms && alarmEmail) {
      alarmTopic = new sns.Topic(this, 'AlarmTopic', {
        topicName: `${props?.environmentSuffix || 'dev'}-alarms`,
        displayName: `${props?.environmentSuffix || 'dev'} Infrastructure Alarms`,
      });

      // Add email subscription
      alarmTopic.addSubscription(
        new snsSubscriptions.EmailSubscription(alarmEmail)
      );
    }

    // EC2 Instance Role with enhanced monitoring permissions
    const ec2Role = new Role(this, 'EC2Role', {
      roleName: `ec2-instance-role-${props?.environmentSuffix}`,
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      inlinePolicies: {
        S3ReadOnlyAccess: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ['s3:GetObject', 's3:ListBucket'],
              resources: [s3Bucket.bucketArn, `${s3Bucket.bucketArn}/*`],
            }),
          ],
        }),
        CloudWatchLogs: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              resources: [ec2LogGroup.logGroupArn],
            }),
          ],
        }),
        CloudWatchMetrics: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                'cloudwatch:PutMetricData',
                'cloudwatch:GetMetricStatistics',
                'cloudwatch:ListMetrics',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonRDSReadOnlyAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });

    // EC2 Instance with enhanced monitoring
    const instanceName = `webserver-${props?.environmentSuffix}`;
    const ec2Instance = new cdk.aws_ec2.Instance(this, 'EC2Instance', {
      instanceName,
      vpc,
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      machineImage: new cdk.aws_ec2.AmazonLinuxImage({
        generation: cdk.aws_ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      securityGroup,
      role: ec2Role,
      userData: cdk.aws_ec2.UserData.forLinux({ shebang: '#!/bin/bash' }),
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
    });

    // Enhanced User Data script with CloudWatch agent installation
    ec2Instance.userData.addCommands(
      'yum update -y',
      'yum install -y httpd amazon-cloudwatch-agent',
      'systemctl start httpd',
      'systemctl enable httpd',
      'systemctl enable amazon-cloudwatch-agent',
      'echo "<html><body><h1>Hello, World!</h1><p>Region: ' +
        region +
        '</p></body></html>" > /var/www/html/index.html',
      // Configure CloudWatch agent
      "cat > /opt/aws/amazon-cloudwatch-agent/bin/config.json << 'EOF'",
      '{',
      '  "logs": {',
      '    "logs_collected": {',
      '      "files": {',
      '        "collect_list": [',
      '          {',
      '            "file_path": "/var/log/httpd/access_log",',
      '            "log_group_name": "' + ec2LogGroup.logGroupName + '",',
      '            "log_stream_name": "{instance_id}/httpd-access",',
      '            "timezone": "UTC"',
      '          },',
      '          {',
      '            "file_path": "/var/log/httpd/error_log",',
      '            "log_group_name": "' + ec2LogGroup.logGroupName + '",',
      '            "log_stream_name": "{instance_id}/httpd-error",',
      '            "timezone": "UTC"',
      '          }',
      '        ]',
      '      }',
      '    }',
      '  }',
      '}',
      'EOF',
      'systemctl start amazon-cloudwatch-agent'
    );

    // Elastic IP
    const eip = new cdk.aws_ec2.CfnEIP(this, 'EIP', {
      domain: 'vpc',
      instanceId: ec2Instance.instanceId,
    });

    // Create RDS Subnet Group
    const rdsSubnetGroup = new SubnetGroup(this, 'RdsSubnetGroup', {
      description: 'Subnet group for RDS',
      vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED }, // PRIVATE_ISOLATED
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      subnetGroupName: `rds-subnet-group-${props?.environmentSuffix || 'dev'}`,
    });

    // Enhanced RDS Instance with backup and monitoring
    const rdsInstance = new DatabaseInstance(this, 'RDSInstance', {
      engine: DatabaseInstanceEngine.mysql({
        version: MysqlEngineVersion.VER_8_0,
      }),
      vpc,
      multiAz: enableBackups, // Enable Multi-AZ for backup strategy
      allocatedStorage: 20,
      instanceType: cdk.aws_ec2.InstanceType.of(
        cdk.aws_ec2.InstanceClass.BURSTABLE3,
        cdk.aws_ec2.InstanceSize.MICRO
      ),
      databaseName: 'MyDatabase',
      credentials: cdk.aws_rds.Credentials.fromGeneratedSecret('admin'),
      publiclyAccessible: false,
      subnetGroup: rdsSubnetGroup,
      // Enhanced backup configuration
      backupRetention: enableBackups
        ? cdk.Duration.days(backupRetentionDays)
        : cdk.Duration.days(0),
      storageEncrypted: true,
      // Performance Insights is not supported on t3.micro instances
      // Only enable if monitoring is enabled and we're not using micro instance
      enablePerformanceInsights: false, // Disabled for t3.micro compatibility
      // CloudWatch logging (basic logs supported on t3.micro)
      cloudwatchLogsExports: enableMonitoring
        ? ['error', 'general']
        : undefined,
      cloudwatchLogsRetention: enableMonitoring
        ? logs.RetentionDays.ONE_WEEK
        : undefined,
      // Deletion protection for production
      deletionProtection: props?.environmentSuffix === 'prod',
    });

    // CloudWatch Alarms for EC2
    if (enableAlarms) {
      // CPU Utilization Alarm
      const cpuAlarm = new cloudwatch.Alarm(this, 'EC2CPUAlarm', {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            InstanceId: ec2Instance.instanceId,
          },
          statistic: 'Average',
        }),
        threshold: 80,
        evaluationPeriods: 2,
        alarmDescription: 'EC2 CPU utilization is high',
        alarmName: `${instanceName}-cpu-utilization`,
      });

      // Status Check Alarm
      const statusAlarm = new cloudwatch.Alarm(this, 'EC2StatusAlarm', {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'StatusCheckFailed',
          dimensionsMap: {
            InstanceId: ec2Instance.instanceId,
          },
          statistic: 'Maximum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: 'EC2 instance status check failed',
        alarmName: `${instanceName}-status-check`,
      });

      // Add SNS actions if topic exists
      if (alarmTopic) {
        cpuAlarm.addAlarmAction(new actions.SnsAction(alarmTopic));
        statusAlarm.addAlarmAction(new actions.SnsAction(alarmTopic));
      }
    }

    // CloudWatch Alarms for RDS
    if (enableAlarms) {
      // RDS CPU Utilization Alarm
      const rdsCpuAlarm = new cloudwatch.Alarm(this, 'RDSCPUAlarm', {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/RDS',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            DBInstanceIdentifier: rdsInstance.instanceIdentifier,
          },
          statistic: 'Average',
        }),
        threshold: 80,
        evaluationPeriods: 2,
        alarmDescription: 'RDS CPU utilization is high',
        alarmName: `${rdsInstance.instanceIdentifier}-cpu-utilization`,
      });

      // RDS Database Connections Alarm
      const rdsConnectionsAlarm = new cloudwatch.Alarm(
        this,
        'RDSConnectionsAlarm',
        {
          metric: new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'DatabaseConnections',
            dimensionsMap: {
              DBInstanceIdentifier: rdsInstance.instanceIdentifier,
            },
            statistic: 'Average',
          }),
          threshold: 80,
          evaluationPeriods: 2,
          alarmDescription: 'RDS database connections are high',
          alarmName: `${rdsInstance.instanceIdentifier}-connections`,
        }
      );

      // Add SNS actions if topic exists
      if (alarmTopic) {
        rdsCpuAlarm.addAlarmAction(new actions.SnsAction(alarmTopic));
        rdsConnectionsAlarm.addAlarmAction(new actions.SnsAction(alarmTopic));
      }
    }

    // CloudWatch Dashboard
    if (enableMonitoring) {
      new cloudwatch.Dashboard(this, 'InfrastructureDashboard', {
        dashboardName: `${props?.environmentSuffix || 'dev'}-infrastructure-dashboard`,
        widgets: [
          [
            new cloudwatch.GraphWidget({
              title: 'EC2 CPU Utilization',
              left: [
                new cloudwatch.Metric({
                  namespace: 'AWS/EC2',
                  metricName: 'CPUUtilization',
                  dimensionsMap: {
                    InstanceId: ec2Instance.instanceId,
                  },
                  statistic: 'Average',
                }),
              ],
              width: 12,
            }),
            new cloudwatch.GraphWidget({
              title: 'EC2 Network',
              left: [
                new cloudwatch.Metric({
                  namespace: 'AWS/EC2',
                  metricName: 'NetworkIn',
                  dimensionsMap: {
                    InstanceId: ec2Instance.instanceId,
                  },
                  statistic: 'Average',
                }),
              ],
              right: [
                new cloudwatch.Metric({
                  namespace: 'AWS/EC2',
                  metricName: 'NetworkOut',
                  dimensionsMap: {
                    InstanceId: ec2Instance.instanceId,
                  },
                  statistic: 'Average',
                }),
              ],
              width: 12,
            }),
          ],
          [
            new cloudwatch.GraphWidget({
              title: 'RDS CPU Utilization',
              left: [
                new cloudwatch.Metric({
                  namespace: 'AWS/RDS',
                  metricName: 'CPUUtilization',
                  dimensionsMap: {
                    DBInstanceIdentifier: rdsInstance.instanceIdentifier,
                  },
                  statistic: 'Average',
                }),
              ],
              width: 12,
            }),
            new cloudwatch.GraphWidget({
              title: 'RDS Database Connections',
              left: [
                new cloudwatch.Metric({
                  namespace: 'AWS/RDS',
                  metricName: 'DatabaseConnections',
                  dimensionsMap: {
                    DBInstanceIdentifier: rdsInstance.instanceIdentifier,
                  },
                  statistic: 'Average',
                }),
              ],
              width: 12,
            }),
          ],
        ],
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'EC2InstanceName', {
      value: instanceName,
      description: 'EC2 instance name',
    });

    new cdk.CfnOutput(this, 'EC2RoleName', {
      value: ec2Role.roleName,
      description: 'EC2RoleName use to access s3 and rds',
    });

    new cdk.CfnOutput(this, 'ElasticIP', {
      value: eip.ref,
      description: 'Elastic IP address of the instance',
    });

    new cdk.CfnOutput(this, 'RDSADDRESS', {
      value: rdsInstance.dbInstanceEndpointAddress,
      description: 'RDS DATABASE ENDPOINT ADDRESS',
    });

    new cdk.CfnOutput(this, 'RDSPORT', {
      value: rdsInstance.dbInstanceEndpointPort,
      description: 'RDS DATABASE PORT',
    });

    new cdk.CfnOutput(this, 'S3', {
      value: s3Bucket.bucketName,
      description: 'S3 BUCKET NAME',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: region,
      description: 'AWS Region',
    });

    new cdk.CfnOutput(this, 'CloudWatchLogGroup', {
      value: ec2LogGroup.logGroupName,
      description: 'CloudWatch Log Group for EC2',
    });

    if (alarmTopic) {
      new cdk.CfnOutput(this, 'AlarmTopicArn', {
        value: alarmTopic.topicArn,
        description: 'SNS Topic ARN for CloudWatch Alarms',
      });
    }
  }
}

```