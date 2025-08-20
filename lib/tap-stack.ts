import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchactions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: cdk.StackProps & { environmentSuffix?: string }
  ) {
    super(scope, id, props);

    // Configuration
    const domainName = 'example.com'; // Replace with your domain
    const primaryRegion = 'us-east-2';
    const secondaryRegion = 'us-west-2';
    const currentRegion = this.region;
    const isPrimaryRegion = currentRegion === primaryRegion;
    const environmentSuffix = props?.environmentSuffix || '';

    // Common tags
    const commonTags = {
      Project: 'TapApp',
      Environment: 'Production',
      Region: currentRegion,
      Type: isPrimaryRegion ? 'Primary' : 'Secondary',
      EnvironmentSuffix: environmentSuffix,
    };

    // VPC
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      maxAzs: 3,
      natGateways: 2,
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
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
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

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });
    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL from EC2'
    );

    // IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, 'Ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
      inlinePolicies: {
        RDSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['rds:DescribeDBInstances', 'rds:DescribeDBClusters'],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Launch Template for EC2 instances
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      userData: ec2.UserData.custom(`#!/bin/bash
yum update -y
yum install -y httpd mysql
systemctl start httpd
systemctl enable httpd

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent
cat << 'EOF' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
  "metrics": {
    "namespace": "TapApp/EC2",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          "cpu_usage_idle",
          "cpu_usage_iowait",
          "cpu_usage_user",
          "cpu_usage_system"
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          "used_percent"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      },
      "mem": {
        "measurement": [
          "mem_used_percent"
        ],
        "metrics_collection_interval": 60
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/httpd/access_log",
            "log_group_name": "/aws/ec2/httpd/access",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
EOF
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Simple health check endpoint
cat << 'EOF' > /var/www/html/health
OK
EOF

# Simple app
cat << 'EOF' > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
    <title>Tap App - ${currentRegion}</title>
</head>
<body>
    <h1>Tap App Running in ${currentRegion}</h1>
    <p>This is the ${isPrimaryRegion ? 'PRIMARY' : 'SECONDARY'} region.</p>
    <p>Timestamp: $(date)</p>
</body>
</html>
EOF
`),
    });

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'AutoScalingGroup',
      {
        vpc,
        launchTemplate,
        minCapacity: 2,
        maxCapacity: 6,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },

      }
    );

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      'ApplicationLoadBalancer',
      {
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [autoScalingGroup],
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    // ALB Listener
    alb.addListener('Listener', {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DbSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // RDS Database
    let database: rds.DatabaseInstance | rds.DatabaseInstanceReadReplica;

    if (isPrimaryRegion) {
      // Primary database with automated backups
      database = new rds.DatabaseInstance(this, 'Database', {
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
        databaseName: 'tapapp',
        credentials: rds.Credentials.fromGeneratedSecret('admin'),
        backupRetention: cdk.Duration.days(7),
        deleteAutomatedBackups: false,
        deletionProtection: true,
        multiAz: true,
        storageEncrypted: true,
        monitoringInterval: cdk.Duration.minutes(1),
        enablePerformanceInsights: true,
        cloudwatchLogsExports: ['error', 'general', 'slowquery'],
      });
    } else {
      // Read replica in secondary region
      database = new rds.DatabaseInstanceReadReplica(this, 'DatabaseReplica', {
        sourceDatabaseInstance:
          rds.DatabaseInstance.fromDatabaseInstanceAttributes(
            this,
            'SourceDb',
            {
              instanceIdentifier: `${id.toLowerCase()}-database${environmentSuffix ? `-${environmentSuffix}` : ''}`,
              instanceEndpointAddress: 'placeholder', // This would be replaced with actual primary DB endpoint
              port: 3306,
              securityGroups: [],
            }
          ),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [rdsSecurityGroup],
        deleteAutomatedBackups: false,
        deletionProtection: true,
        monitoringInterval: cdk.Duration.minutes(1),
        enablePerformanceInsights: true,
      });
    }

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      displayName: `Tap App Alerts${environmentSuffix ? ` - ${environmentSuffix}` : ''}`,
    });

    // Lambda function for failover automation
    const failoverLambdaRole = new iam.Role(this, 'FailoverLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        Route53Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'route53:ChangeResourceRecordSets',
                'route53:GetHealthCheck',
                'route53:ListResourceRecordSets',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['rds:PromoteReadReplica', 'rds:DescribeDBInstances'],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    const failoverLambda = new lambda.Function(this, 'FailoverLambda', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      role: failoverLambdaRole,
      timeout: cdk.Duration.minutes(5),
      environment: {
        HOSTED_ZONE_ID: 'Z1234567890', // Replace with your hosted zone ID
        DOMAIN_NAME: domainName,
        PRIMARY_REGION: primaryRegion,
        SECONDARY_REGION: secondaryRegion,
        CURRENT_REGION: currentRegion,
        ENVIRONMENT_SUFFIX: environmentSuffix,
      },
      code: lambda.Code.fromInline(`
import json
import boto3
import os

def handler(event, context):
    route53 = boto3.client('route53')
    rds = boto3.client('rds')
    
    hosted_zone_id = os.environ['HOSTED_ZONE_ID']
    domain_name = os.environ['DOMAIN_NAME']
    current_region = os.environ['CURRENT_REGION']
    secondary_region = os.environ['SECONDARY_REGION']
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', '')
    
    try:
        # Only execute failover logic in secondary region
        if current_region == secondary_region:
            print(f"Executing failover to {current_region}")
            
            # Promote read replica to primary (if applicable)
            # This would need to be customized based on your RDS setup
            
            # Update Route 53 record to point to secondary region
            # This is a simplified example - you'd need to implement proper record management
            response = route53.change_resource_record_sets(
                HostedZoneId=hosted_zone_id,
                ChangeBatch={
                    'Changes': [{
                        'Action': 'UPSERT',
                        'ResourceRecordSet': {
                            'Name': domain_name,
                            'Type': 'A',
                            'SetIdentifier': 'Secondary',
                            'Failover': 'SECONDARY',
                            'TTL': 60,
                            'ResourceRecords': [{'Value': '1.2.3.4'}]  # Replace with actual ALB IP
                        }
                    }]
                }
            )
            
            print(f"Route 53 update response: {response}")
            
        return {
            'statusCode': 200,
            'body': json.dumps('Failover completed successfully')
        }
    except Exception as e:
        print(f"Error during failover: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Failover failed: {str(e)}')
        }
`),
    });

    // Route 53 Hosted Zone (only create in primary region)
    let hostedZone: route53.IHostedZone | undefined;
    if (isPrimaryRegion) {
      hostedZone = new route53.HostedZone(this, 'HostedZone', {
        zoneName: domainName,
      });
    }
    // Note: In secondary region, hosted zone lookup is skipped to avoid synthesis errors
    // In a real deployment, you would need to ensure the hosted zone exists or use a different approach

    // Health Check (only in primary region)
    let healthCheck: route53.HealthCheck | undefined;
    if (isPrimaryRegion) {
      healthCheck = new route53.HealthCheck(this, 'HealthCheck', {
        type: route53.HealthCheckType.HTTPS,
        resourcePath: '/health',
        fqdn: alb.loadBalancerDnsName,
        port: 80,
        requestInterval: cdk.Duration.seconds(30),
        failureThreshold: 3,
      });
    }

    // Route 53 Records (only create in primary region where hosted zone exists)
    if (hostedZone) {
      new route53.ARecord(this, 'AliasRecord', {
        zone: hostedZone,
        target: route53.RecordTarget.fromAlias(
          new route53targets.LoadBalancerTarget(alb)
        ),
        recordName: domainName,
        ttl: cdk.Duration.seconds(60),
      });
    }

    // CloudWatch Alarms
    const unhealthyHostsAlarm = new cloudwatch.Alarm(
      this,
      'UnhealthyHostsAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApplicationELB',
          metricName: 'UnHealthyHostCount',
          dimensionsMap: {
            TargetGroup: targetGroup.targetGroupFullName,
            LoadBalancer: alb.loadBalancerFullName,
          },
          period: cdk.Duration.minutes(1),
        }),
        threshold: 1,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        alarmDescription: 'Unhealthy hosts detected',
      }
    );

    const responseTimeAlarm = new cloudwatch.Alarm(this, 'ResponseTimeAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'TargetResponseTime',
        dimensionsMap: {
          TargetGroup: targetGroup.targetGroupFullName,
          LoadBalancer: alb.loadBalancerFullName,
        },
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'High response time detected',
    });

    const dbConnectionsAlarm = new cloudwatch.Alarm(
      this,
      'DbConnectionsAlarm',
      {
        metric: database.metricDatabaseConnections({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 80,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        alarmDescription: 'High database connections',
      }
    );

    // Add SNS actions to alarms
    unhealthyHostsAlarm.addAlarmAction(
      new cloudwatchactions.SnsAction(alertTopic)
    );
    responseTimeAlarm.addAlarmAction(
      new cloudwatchactions.SnsAction(alertTopic)
    );
    dbConnectionsAlarm.addAlarmAction(
      new cloudwatchactions.SnsAction(alertTopic)
    );

    // If this is the secondary region, add Lambda action for failover
    if (!isPrimaryRegion) {
      const failoverAlarm = new cloudwatch.Alarm(this, 'FailoverAlarm', {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/Route53',
          metricName: 'HealthCheckStatus',
          dimensionsMap: healthCheck
            ? {
                HealthCheckId: healthCheck.healthCheckId,
              }
            : {},
          period: cdk.Duration.minutes(1),
        }),
        threshold: 1,
        evaluationPeriods: 3,
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        alarmDescription: 'Primary region health check failed',
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      });

      failoverAlarm.addAlarmAction(
        new cloudwatchactions.LambdaAction(failoverLambda)
      );
      failoverAlarm.addAlarmAction(new cloudwatchactions.SnsAction(alertTopic));
    }

    // Apply tags to all resources
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
    });

    if (isPrimaryRegion && hostedZone) {
      new cdk.CfnOutput(this, 'HostedZoneId', {
        value: hostedZone.hostedZoneId,
        description: 'Route 53 Hosted Zone ID',
      });

      if (healthCheck) {
        new cdk.CfnOutput(this, 'HealthCheckId', {
          value: healthCheck.healthCheckId,
          description: 'Route 53 Health Check ID',
        });
      }
    }

    new cdk.CfnOutput(this, 'SNSTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Topic ARN for alerts',
    });
  }
}
