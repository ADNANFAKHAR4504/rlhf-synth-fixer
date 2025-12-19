```typescript
import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput, Fn } from 'cdktf';
import * as aws from '@cdktf/provider-aws';

/**
 * Main DR Infrastructure Stack for Financial Transaction System
 * Implements 99.999% uptime with single-region Multi-AZ redundancy
 */
class FinancialDRStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    // ========================
    // Provider Configuration
    // ========================
    new aws.provider.AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [
        {
          tags: {
            Environment: 'production',
            Project: 'financial-dr-system',
            ManagedBy: 'cdktf',
            CostCenter: 'infrastructure',
          },
        },
      ],
    });

    // ========================
    // KMS Encryption Keys
    // ========================
    const kmsKey = new aws.kmsKey.KmsKey(this, 'master-key', {
      description: 'Master KMS key for Financial DR System',
      enableKeyRotation: true,
      deletionWindowInDays: 30,
    });

    const kmsAlias = new aws.kmsAlias.KmsAlias(this, 'master-key-alias', {
      name: 'alias/financial-dr-master',
      targetKeyId: kmsKey.id,
    });

    // ========================
    // VPC Module - Multi-AZ Network Foundation
    // ========================
    const vpc = new aws.vpc.Vpc(this, 'main-vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: 'financial-dr-vpc',
      },
    });

    // Availability Zones data source
    const azs = new aws.dataAwsAvailabilityZones.DataAwsAvailabilityZones(
      this,
      'azs',
      {
        state: 'available',
      }
    );

    // Public Subnets for ALB (Multi-AZ)
    const publicSubnets: aws.subnet.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      publicSubnets.push(
        new aws.subnet.Subnet(this, `public-subnet-${i}`, {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: Fn.element(azs.names, i),
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `public-subnet-az${i + 1}`,
            Type: 'public',
          },
        })
      );
    }

    // Private Subnets for ECS and Aurora (Multi-AZ)
    const privateSubnets: aws.subnet.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      privateSubnets.push(
        new aws.subnet.Subnet(this, `private-subnet-${i}`, {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: Fn.element(azs.names, i),
          tags: {
            Name: `private-subnet-az${i + 1}`,
            Type: 'private',
          },
        })
      );
    }

    // Database Subnets for Aurora (Multi-AZ)
    const dbSubnets: aws.subnet.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      dbSubnets.push(
        new aws.subnet.Subnet(this, `db-subnet-${i}`, {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 20}.0/24`,
          availabilityZone: Fn.element(azs.names, i),
          tags: {
            Name: `db-subnet-az${i + 1}`,
            Type: 'database',
          },
        })
      );
    }

    // Internet Gateway
    const igw = new aws.internetGateway.InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: 'financial-dr-igw',
      },
    });

    // Elastic IPs for NAT Gateways
    const eips: aws.eip.Eip[] = [];
    for (let i = 0; i < 3; i++) {
      eips.push(
        new aws.eip.Eip(this, `nat-eip-${i}`, {
          domain: 'vpc',
          tags: {
            Name: `nat-eip-az${i + 1}`,
          },
        })
      );
    }

    // NAT Gateways for High Availability
    const natGateways: aws.natGateway.NatGateway[] = [];
    for (let i = 0; i < 3; i++) {
      natGateways.push(
        new aws.natGateway.NatGateway(this, `nat-gateway-${i}`, {
          allocationId: eips[i].id,
          subnetId: publicSubnets[i].id,
          tags: {
            Name: `nat-gateway-az${i + 1}`,
          },
        })
      );
    }

    // Route Tables
    const publicRouteTable = new aws.routeTable.RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      tags: {
        Name: 'public-route-table',
      },
    });

    new aws.route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    publicSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `public-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    // Private Route Tables (one per AZ for HA)
    privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new aws.routeTable.RouteTable(
        this,
        `private-rt-${index}`,
        {
          vpcId: vpc.id,
          tags: {
            Name: `private-route-table-az${index + 1}`,
          },
        }
      );

      new aws.route.Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
      });

      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `private-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });

    // ========================
    // Security Groups
    // ========================
    const albSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'alb-sg',
      {
        vpcId: vpc.id,
        name: 'alb-security-group',
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from anywhere',
          },
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from anywhere',
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
          Name: 'alb-security-group',
        },
      }
    );

    const ecsSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'ecs-sg',
      {
        vpcId: vpc.id,
        name: 'ecs-security-group',
        description: 'Security group for ECS Fargate tasks',
        ingress: [
          {
            fromPort: 8080,
            toPort: 8080,
            protocol: 'tcp',
            securityGroups: [albSecurityGroup.id],
            description: 'Traffic from ALB',
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
          Name: 'ecs-security-group',
        },
      }
    );

    const auroraSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'aurora-sg',
      {
        vpcId: vpc.id,
        name: 'aurora-security-group',
        description: 'Security group for Aurora PostgreSQL',
        ingress: [
          {
            fromPort: 5432,
            toPort: 5432,
            protocol: 'tcp',
            securityGroups: [ecsSecurityGroup.id],
            description: 'PostgreSQL from ECS',
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
          Name: 'aurora-security-group',
        },
      }
    );

    // ========================
    // Secrets Manager - Database Credentials
    // ========================
    const dbMasterSecret = new aws.secretsmanagerSecret.SecretsmanagerSecret(
      this,
      'db-master-secret',
      {
        name: 'financial-dr/aurora/master',
        description: 'Master password for Aurora PostgreSQL',
        kmsKeyId: kmsKey.id,
        recoveryWindowInDays: 7,
      }
    );

    const dbMasterSecretVersion =
      new aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
        this,
        'db-master-secret-version',
        {
          secretId: dbMasterSecret.id,
          secretString: JSON.stringify({
            username: 'postgres',
            password: Fn.random_password({ length: 32, special: true }),
          }),
        }
      );

    // ========================
    // Aurora PostgreSQL Module - Multi-AZ with Read Replicas
    // ========================
    const dbSubnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(
      this,
      'aurora-subnet-group',
      {
        name: 'financial-dr-aurora-subnet',
        subnetIds: dbSubnets.map(subnet => subnet.id),
        tags: {
          Name: 'aurora-subnet-group',
        },
      }
    );

    const auroraCluster = new aws.rdsCluster.RdsCluster(
      this,
      'aurora-cluster',
      {
        clusterIdentifier: 'financial-dr-aurora-cluster',
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        databaseName: 'financial',
        masterUsername: 'postgres',
        masterPassword: Fn.jsonencode(
          Fn.jsondecode(dbMasterSecretVersion.secretString).password
        ),
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [auroraSecurityGroup.id],
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        backupRetentionPeriod: 30,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        enabledCloudwatchLogsExports: ['postgresql'],
        deletionProtection: true,
        skipFinalSnapshot: false,
        finalSnapshotIdentifier: 'financial-dr-final-snapshot-${Date.now()}',
        tags: {
          Name: 'financial-dr-aurora-cluster',
        },
      }
    );

    // Aurora Instances - Primary and Read Replicas
    const auroraInstances: aws.rdsClusterInstance.RdsClusterInstance[] = [];
    for (let i = 0; i < 3; i++) {
      auroraInstances.push(
        new aws.rdsClusterInstance.RdsClusterInstance(
          this,
          `aurora-instance-${i}`,
          {
            identifier: `financial-dr-aurora-instance-${i}`,
            clusterIdentifier: auroraCluster.clusterIdentifier,
            instanceClass: i === 0 ? 'db.r6g.2xlarge' : 'db.r6g.xlarge',
            engine: 'aurora-postgresql',
            engineVersion: '14.6',
            performanceInsightsEnabled: true,
            performanceInsightsKmsKeyId: kmsKey.arn,
            performanceInsightsRetentionPeriod: 7,
            monitoringInterval: 60,
            monitoringRoleArn: new aws.iamRole.IamRole(
              this,
              `rds-monitoring-role-${i}`,
              {
                name: `rds-enhanced-monitoring-${i}`,
                assumeRolePolicy: JSON.stringify({
                  Version: '2012-10-17',
                  Statement: [
                    {
                      Action: 'sts:AssumeRole',
                      Effect: 'Allow',
                      Principal: {
                        Service: 'monitoring.rds.amazonaws.com',
                      },
                    },
                  ],
                }),
                managedPolicyArns: [
                  'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
                ],
              }
            ).arn,
            tags: {
              Name: `aurora-instance-${i}`,
              Type: i === 0 ? 'primary' : 'replica',
            },
          }
        )
      );
    }

    // ========================
    // ECS Fargate Module - Container Orchestration
    // ========================
    const ecsCluster = new aws.ecsCluster.EcsCluster(this, 'ecs-cluster', {
      name: 'financial-dr-cluster',
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: {
        Name: 'financial-dr-ecs-cluster',
      },
    });

    // ECS Task Execution Role
    const taskExecutionRole = new aws.iamRole.IamRole(
      this,
      'task-execution-role',
      {
        name: 'financial-dr-task-execution-role',
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            },
          ],
        }),
      }
    );

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'task-execution-policy',
      {
        role: taskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      }
    );

    // ECS Task Role
    const taskRole = new aws.iamRole.IamRole(this, 'task-role', {
      name: 'financial-dr-task-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
          },
        ],
      }),
    });

    // Task Role Policies
    new aws.iamRolePolicy.IamRolePolicy(this, 'task-role-policy', {
      role: taskRole.name,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['secretsmanager:GetSecretValue', 'kms:Decrypt'],
            Resource: [dbMasterSecret.arn, kmsKey.arn],
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: '*',
          },
        ],
      }),
    });

    // CloudWatch Log Group for ECS
    const logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'ecs-log-group',
      {
        name: '/ecs/financial-dr',
        retentionInDays: 30,
        kmsKeyId: kmsKey.arn,
        tags: {
          Name: 'ecs-log-group',
        },
      }
    );

    // ECS Task Definition
    const taskDefinition = new aws.ecsTaskDefinition.EcsTaskDefinition(
      this,
      'task-definition',
      {
        family: 'financial-dr-app',
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '2048',
        memory: '4096',
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: taskRole.arn,
        containerDefinitions: JSON.stringify([
          {
            name: 'financial-app',
            image: 'public.ecr.aws/nginx/nginx:latest', // Replace with your application image
            essential: true,
            portMappings: [
              {
                containerPort: 8080,
                protocol: 'tcp',
              },
            ],
            environment: [
              {
                name: 'DB_HOST',
                value: auroraCluster.endpoint,
              },
              {
                name: 'DB_NAME',
                value: 'financial',
              },
            ],
            secrets: [
              {
                name: 'DB_PASSWORD',
                valueFrom: `${dbMasterSecret.arn}:password::`,
              },
            ],
            logConfiguration: {
              logDriver: 'awslogs',
              options: {
                'awslogs-group': logGroup.name,
                'awslogs-region': 'us-east-1',
                'awslogs-stream-prefix': 'ecs',
              },
            },
            healthCheck: {
              command: [
                'CMD-SHELL',
                'curl -f http://localhost:8080/health || exit 1',
              ],
              interval: 30,
              timeout: 5,
              retries: 3,
              startPeriod: 60,
            },
          },
        ]),
        tags: {
          Name: 'financial-dr-task-definition',
        },
      }
    );

    // Application Load Balancer
    const alb = new aws.lb.Lb(this, 'alb', {
      name: 'financial-dr-alb',
      loadBalancerType: 'application',
      subnets: publicSubnets.map(subnet => subnet.id),
      securityGroups: [albSecurityGroup.id],
      enableDeletionProtection: true,
      enableHttp2: true,
      enableCrossZoneLoadBalancing: true,
      tags: {
        Name: 'financial-dr-alb',
      },
    });

    // ALB Target Group
    const targetGroup = new aws.lbTargetGroup.LbTargetGroup(
      this,
      'target-group',
      {
        name: 'financial-dr-targets',
        port: 8080,
        protocol: 'HTTP',
        vpcId: vpc.id,
        targetType: 'ip',
        deregistrationDelay: 30,
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          timeout: 5,
          interval: 30,
          path: '/health',
          matcher: '200',
        },
        tags: {
          Name: 'financial-dr-target-group',
        },
      }
    );

    // ALB Listener
    const listener = new aws.lbListener.LbListener(this, 'alb-listener', {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
      tags: {
        Name: 'financial-dr-listener',
      },
    });

    // ECS Service with Auto Scaling
    const ecsService = new aws.ecsService.EcsService(this, 'ecs-service', {
      name: 'financial-dr-service',
      cluster: ecsCluster.id,
      taskDefinition: taskDefinition.arn,
      desiredCount: 6,
      launchType: 'FARGATE',
      deploymentMaximumPercent: 200,
      deploymentMinimumHealthyPercent: 100,
      healthCheckGracePeriodSeconds: 60,
      networkConfiguration: {
        subnets: privateSubnets.map(subnet => subnet.id),
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: false,
      },
      loadBalancer: [
        {
          targetGroupArn: targetGroup.arn,
          containerName: 'financial-app',
          containerPort: 8080,
        },
      ],
      deploymentCircuitBreaker: {
        enable: true,
        rollback: true,
      },
      tags: {
        Name: 'financial-dr-service',
      },
      dependsOn: [listener],
    });

    // Auto Scaling for ECS Service
    const scalingTarget = new aws.appautoscalingTarget.AppautoscalingTarget(
      this,
      'ecs-scaling-target',
      {
        maxCapacity: 20,
        minCapacity: 6,
        resourceId: `service/${ecsCluster.name}/${ecsService.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      }
    );

    new aws.appautoscalingPolicy.AppautoscalingPolicy(
      this,
      'ecs-scaling-policy-cpu',
      {
        name: 'cpu-scaling',
        policyType: 'TargetTrackingScaling',
        resourceId: scalingTarget.resourceId,
        scalableDimension: scalingTarget.scalableDimension,
        serviceNamespace: scalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          targetValue: 70,
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      }
    );

    // ========================
    // Route 53 Health Checks and DNS
    // ========================
    const healthCheck = new aws.route53HealthCheck.Route53HealthCheck(
      this,
      'alb-health-check',
      {
        fqdn: alb.dnsName,
        port: 80,
        type: 'HTTP',
        resourcePath: '/health',
        failureThreshold: 3,
        requestInterval: 30,
        tags: {
          Name: 'financial-dr-health-check',
        },
      }
    );

    // ========================
    // CloudWatch Alarms and Monitoring
    // ========================
    const snsAlarmTopic = new aws.snsTopic.SnsTopic(this, 'alarm-topic', {
      name: 'financial-dr-alarms',
      kmsKeyId: kmsKey.id,
      tags: {
        Name: 'financial-dr-alarm-topic',
      },
    });

    // Aurora CPU Alarm
    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'aurora-cpu-alarm',
      {
        alarmName: 'financial-dr-aurora-high-cpu',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'Aurora cluster CPU above 80%',
        alarmActions: [snsAlarmTopic.arn],
        dimensions: {
          DBClusterIdentifier: auroraCluster.clusterIdentifier,
        },
      }
    );

    // ECS Service Health Alarm
    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'ecs-health-alarm',
      {
        alarmName: 'financial-dr-ecs-unhealthy-tasks',
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HealthyTaskCount',
        namespace: 'AWS/ECS',
        period: 60,
        statistic: 'Average',
        threshold: 3,
        alarmDescription: 'ECS service has less than 3 healthy tasks',
        alarmActions: [snsAlarmTopic.arn],
        dimensions: {
          ClusterName: ecsCluster.name,
          ServiceName: ecsService.name,
        },
      }
    );

    // ALB Target Health Alarm
    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'alb-target-health-alarm',
      {
        alarmName: 'financial-dr-alb-unhealthy-targets',
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 2,
        alarmDescription: 'ALB has less than 2 healthy targets',
        alarmActions: [snsAlarmTopic.arn],
        dimensions: {
          TargetGroup: targetGroup.arnSuffix,
          LoadBalancer: alb.arnSuffix,
        },
      }
    );

    // ========================
    // Systems Manager - DR Testing Automation
    // ========================
    const ssmDrTestDocument = new aws.ssmDocument.SsmDocument(
      this,
      'dr-test-document',
      {
        name: 'financial-dr-failover-test',
        documentType: 'Automation',
        documentFormat: 'YAML',
        content: `
schemaVersion: '0.3'
description: Automated DR failover testing for financial system
parameters:
  ClusterIdentifier:
    type: String
    default: ${auroraCluster.clusterIdentifier}
  SnapshotIdentifier:
    type: String
    description: Snapshot ID to restore from
mainSteps:
  - name: CreateSnapshot
    action: aws:executeAwsApi
    inputs:
      Service: rds
      Api: CreateDBClusterSnapshot
      DBClusterIdentifier: '{{ ClusterIdentifier }}'
      DBClusterSnapshotIdentifier: 'dr-test-snapshot-{{ global:DATE_TIME }}'
    outputs:
      - Name: SnapshotId
        Selector: $.DBClusterSnapshot.DBClusterSnapshotIdentifier
        Type: String
  
  - name: WaitForSnapshot
    action: aws:waitForAwsResourceProperty
    timeoutSeconds: 3600
    inputs:
      Service: rds
      Api: DescribeDBClusterSnapshots
      DBClusterSnapshotIdentifier: '{{ CreateSnapshot.SnapshotId }}'
      PropertySelector: $.DBClusterSnapshots[0].Status
      DesiredValues:
        - available
  
  - name: RestoreFromSnapshot
    action: aws:executeAwsApi
    inputs:
      Service: rds
      Api: RestoreDBClusterFromSnapshot
      DBClusterIdentifier: 'financial-dr-standby-cluster'
      SnapshotIdentifier: '{{ CreateSnapshot.SnapshotId }}'
      Engine: aurora-postgresql
  
  - name: NotifySuccess
    action: aws:publishSNSMessage
    inputs:
      TopicArn: ${snsAlarmTopic.arn}
      Message: 'DR failover test completed successfully'
      Subject: 'DR Test Success'
`,
        tags: {
          Name: 'dr-test-automation',
        },
      }
    );

    // SSM Maintenance Window for Regular DR Testing
    const maintenanceWindow = new aws.ssmMaintenanceWindow.SsmMaintenanceWindow(
      this,
      'dr-test-window',
      {
        name: 'financial-dr-test-window',
        description: 'Weekly DR testing window',
        schedule: 'cron(0 2 ? * SUN *)',
        duration: 4,
        cutoff: 1,
        allowUnassociatedTargets: false,
        tags: {
          Name: 'dr-test-maintenance-window',
        },
      }
    );

    // ========================
    // Backup Configuration
    // ========================
    const backupVault = new aws.backupVault.BackupVault(this, 'backup-vault', {
      name: 'financial-dr-vault',
      kmsKeyArn: kmsKey.arn,
      tags: {
        Name: 'financial-dr-backup-vault',
      },
    });

    const backupPlan = new aws.backupPlan.BackupPlan(this, 'backup-plan', {
      name: 'financial-dr-backup-plan',
      rule: [
        {
          ruleName: 'hourly-backups',
          targetVaultName: backupVault.name,
          schedule: 'cron(0 * ? * * *)',
          lifecycle: {
            deleteAfter: 7,
            coldStorageAfter: 1,
          },
          recoveryPointTags: {
            Type: 'automated',
            Frequency: 'hourly',
          },
        },
      ],
      tags: {
        Name: 'financial-dr-backup-plan',
      },
    });

    const backupSelection = new aws.backupSelection.BackupSelection(
      this,
      'backup-selection',
      {
        name: 'financial-dr-resources',
        iamRoleArn: new aws.iamRole.IamRole(this, 'backup-role', {
          name: 'financial-dr-backup-role',
          assumeRolePolicy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Action: 'sts:AssumeRole',
                Effect: 'Allow',
                Principal: {
                  Service: 'backup.amazonaws.com',
                },
              },
            ],
          }),
          managedPolicyArns: [
            'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup',
            'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores',
          ],
        }).arn,
        planId: backupPlan.id,
        resources: [auroraCluster.arn],
        tags: {
          Name: 'financial-dr-backup-selection',
        },
      }
    );

    // ========================
    // Lambda Function for Automated Failover
    // ========================
    const failoverLambdaRole = new aws.iamRole.IamRole(
      this,
      'failover-lambda-role',
      {
        name: 'financial-dr-failover-lambda-role',
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
      }
    );

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'failover-lambda-policy',
      {
        role: failoverLambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      }
    );

    new aws.iamRolePolicy.IamRolePolicy(this, 'failover-lambda-custom-policy', {
      role: failoverLambdaRole.name,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'rds:FailoverDBCluster',
              'rds:DescribeDBClusters',
              'rds:DescribeDBInstances',
              'ecs:UpdateService',
              'ecs:DescribeServices',
              'sns:Publish',
            ],
            Resource: '*',
          },
        ],
      }),
    });

    const failoverLambda = new aws.lambdaFunction.LambdaFunction(
      this,
      'failover-lambda',
      {
        functionName: 'financial-dr-automated-failover',
        runtime: 'python3.9',
        handler: 'index.handler',
        role: failoverLambdaRole.arn,
        timeout: 60,
        memorySize: 256,
        environment: {
          variables: {
            CLUSTER_ID: auroraCluster.clusterIdentifier,
            SNS_TOPIC_ARN: snsAlarmTopic.arn,
            ECS_CLUSTER: ecsCluster.name,
            ECS_SERVICE: ecsService.name,
          },
        },
        filename: 'lambda_failover.zip',
        sourceCodeHash: Fn.base64sha256(`
import boto3
import json
import os

def handler(event, context):
    rds = boto3.client('rds')
    ecs = boto3.client('ecs')
    sns = boto3.client('sns')
    
    cluster_id = os.environ['CLUSTER_ID']
    sns_topic = os.environ['SNS_TOPIC_ARN']
    
    try:
        # Initiate Aurora failover
        response = rds.failover_db_cluster(
            DBClusterIdentifier=cluster_id
        )
        
        # Notify via SNS
        sns.publish(
            TopicArn=sns_topic,
            Subject='DR Failover Initiated',
            Message=f'Automated failover initiated for cluster {cluster_id}'
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps('Failover initiated successfully')
        }
    except Exception as e:
        sns.publish(
            TopicArn=sns_topic,
            Subject='DR Failover Failed',
            Message=f'Failover failed: {str(e)}'
        )
        raise e
`),
        tags: {
          Name: 'financial-dr-failover-lambda',
        },
      }
    );

    // CloudWatch Event Rule for Automated Failover
    const failoverEventRule = new aws.cloudwatchEventRule.CloudwatchEventRule(
      this,
      'failover-event-rule',
      {
        name: 'financial-dr-auto-failover',
        description: 'Trigger automated failover on critical alarms',
        eventPattern: JSON.stringify({
          source: ['aws.cloudwatch'],
          'detail-type': ['CloudWatch Alarm State Change'],
          detail: {
            alarmName: [
              'financial-dr-aurora-high-cpu',
              'financial-dr-ecs-unhealthy-tasks',
            ],
            state: {
              value: ['ALARM'],
            },
          },
        }),
        tags: {
          Name: 'financial-dr-failover-rule',
        },
      }
    );

    new aws.cloudwatchEventTarget.CloudwatchEventTarget(
      this,
      'failover-event-target',
      {
        rule: failoverEventRule.name,
        targetId: '1',
        arn: failoverLambda.arn,
      }
    );

    new aws.lambdaPermission.LambdaPermission(
      this,
      'failover-lambda-permission',
      {
        statementId: 'AllowExecutionFromCloudWatch',
        action: 'lambda:InvokeFunction',
        functionName: failoverLambda.functionName,
        principal: 'events.amazonaws.com',
        sourceArn: failoverEventRule.arn,
      }
    );

    // ========================
    // Outputs
    // ========================
    new TerraformOutput(this, 'alb_dns_name', {
      value: alb.dnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 'aurora_cluster_endpoint', {
      value: auroraCluster.endpoint,
      description: 'Aurora cluster write endpoint',
    });

    new TerraformOutput(this, 'aurora_reader_endpoint', {
      value: auroraCluster.readerEndpoint,
      description: 'Aurora cluster read endpoint',
    });

    new TerraformOutput(this, 'ecs_cluster_name', {
      value: ecsCluster.name,
      description: 'ECS cluster name',
    });

    new TerraformOutput(this, 'ecs_service_name', {
      value: ecsService.name,
      description: 'ECS service name',
    });

    new TerraformOutput(this, 'health_check_id', {
      value: healthCheck.id,
      description: 'Route 53 health check ID',
    });

    new TerraformOutput(this, 'sns_alarm_topic_arn', {
      value: snsAlarmTopic.arn,
      description: 'SNS topic ARN for alarms',
    });

    new TerraformOutput(this, 'backup_vault_name', {
      value: backupVault.name,
      description: 'AWS Backup vault name',
    });

    new TerraformOutput(this, 'ssm_document_name', {
      value: ssmDrTestDocument.name,
      description: 'SSM document name for DR testing',
    });

    new TerraformOutput(this, 'vpc_id', {
      value: vpc.id,
      description: 'VPC ID',
    });
  }
}

const app = new App();
new FinancialDRStack(app, 'financial-dr-infrastructure');
app.synth();
```
