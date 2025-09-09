```typescript
import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchactions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
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
    const domainName = (this.node.tryGetContext('domainName') as string) || '';
    const hostedZoneId =
      (this.node.tryGetContext('hostedZoneId') as string) || '';
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
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
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
      });
    }

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      displayName: `Tap App Alerts${environmentSuffix ? ` - ${environmentSuffix}` : ''}`,
    });

    // Note: Lambda-based failover logic will be added after hosted zone creation

    // Route 53 Hosted Zone (use context when provided, otherwise skip DNS)
    let hostedZone: route53.IHostedZone | undefined;
    if (domainName && hostedZoneId) {
      hostedZone = route53.HostedZone.fromHostedZoneAttributes(
        this,
        'HostedZone',
        {
          hostedZoneId,
          zoneName: domainName,
        }
      );
    }

    // Health Check (only in primary region and when DNS is configured)
    let healthCheck: route53.HealthCheck | undefined;
    if (isPrimaryRegion && hostedZone) {
      healthCheck = new route53.HealthCheck(this, 'HealthCheck', {
        type: route53.HealthCheckType.HTTP, // Changed to HTTP since we're using port 80
        resourcePath: '/health',
        fqdn: alb.loadBalancerDnsName,
        port: 80,
        requestInterval: cdk.Duration.seconds(30),
        failureThreshold: 3,
      });
    }

    // Route 53 Records (only in primary region and when DNS is configured)
    if (hostedZone && isPrimaryRegion && domainName) {
      // Primary region record with health check
      new route53.ARecord(this, 'PrimaryRecord', {
        zone: hostedZone,
        target: route53.RecordTarget.fromAlias(
          new route53targets.LoadBalancerTarget(alb)
        ),
        recordName: domainName,
        ttl: cdk.Duration.seconds(60),
      });

      // Add health check to the record
      if (healthCheck) {
        new route53.CfnRecordSet(this, 'PrimaryRecordSet', {
          hostedZoneId: hostedZone.hostedZoneId,
          name: domainName,
          type: 'A',
          aliasTarget: {
            dnsName: alb.loadBalancerDnsName,
            hostedZoneId: alb.loadBalancerCanonicalHostedZoneId,
            evaluateTargetHealth: true,
          },
          failover: 'PRIMARY',
          healthCheckId: healthCheck.healthCheckId,
          ttl: '60',
        });
      }
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

    // Lambda-based Failover Logic (only in primary region and when DNS is configured)
    if (isPrimaryRegion && hostedZone && domainName) {
      // IAM Role for Failover Lambda
      const failoverLambdaRole = new iam.Role(this, 'FailoverLambdaRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
        inlinePolicies: {
          Route53Access: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'route53:ChangeResourceRecordSets',
                  'route53:GetChange',
                  'route53:ListResourceRecordSets',
                ],
                resources: ['*'],
              }),
            ],
          }),
        },
      });

      // Failover Lambda Function
      const failoverLambda = new lambda.Function(this, 'FailoverLambda', {
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import json
import boto3
import os

def handler(event, context):
    """Lambda function to handle failover between regions"""
    
    # Parse the event
    alarm_name = event.get('detail', {}).get('alarmName', '')
    alarm_state = event.get('detail', {}).get('state', {}).get('value', '')
    
    print(f"Processing alarm: {alarm_name} with state: {alarm_state}")
    
    # Only process if alarm is in ALARM state
    if alarm_state != 'ALARM':
        print(f"Alarm {alarm_name} is not in ALARM state, skipping")
        return {
            'statusCode': 200,
            'body': json.dumps(f'Alarm {alarm_name} is not in ALARM state')
        }
    
    # Get configuration from environment variables
    hosted_zone_id = os.environ.get('HOSTED_ZONE_ID')
    domain_name = os.environ.get('DOMAIN_NAME')
    secondary_alb_dns = os.environ.get('SECONDARY_ALB_DNS')
    secondary_region = os.environ.get('SECONDARY_REGION', 'us-west-2')
    
    if not all([hosted_zone_id, domain_name, secondary_alb_dns]):
        print("Missing required environment variables")
        return {
            'statusCode': 400,
            'body': json.dumps('Missing required environment variables')
        }
    
    try:
        # Create Route 53 client
        route53_client = boto3.client('route53')
        
        # Create failover record pointing to secondary region
        change_batch = {
            'Changes': [
                {
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': domain_name,
                        'Type': 'A',
                        'TTL': 60,
                        'AliasTarget': {
                            'HostedZoneId': 'Z35SXDOTRQ7R7Y',  # ALB hosted zone ID for us-west-2
                            'DNSName': secondary_alb_dns,
                            'EvaluateTargetHealth': True
                        }
                    }
                }
            ]
        }
        
        # Submit the change
        response = route53_client.change_resource_record_sets(
            HostedZoneId=hosted_zone_id,
            ChangeBatch=change_batch
        )
        
        change_id = response['ChangeInfo']['Id']
        print(f"Route 53 change submitted: {change_id}")
        
        # Wait for change to be propagated
        waiter = route53_client.get_waiter('resource_record_sets_changed')
        waiter.wait(
            Id=change_id,
            WaiterConfig={'Delay': 30, 'MaxAttempts': 20}
        )
        
        print(f"Failover completed successfully to {secondary_region}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Failover completed to {secondary_region}',
                'changeId': change_id,
                'alarmName': alarm_name
            })
        }
        
    except Exception as e:
        print(f"Error during failover: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error during failover: {str(e)}')
        }
`),
        timeout: cdk.Duration.minutes(5),
        environment: {
          HOSTED_ZONE_ID: hostedZone.hostedZoneId,
          DOMAIN_NAME: domainName,
          SECONDARY_ALB_DNS: `TapSta-Appli-${secondaryRegion.toLowerCase()}-${environmentSuffix}.${secondaryRegion}.elb.amazonaws.com`,
          SECONDARY_REGION: secondaryRegion,
        },
        role: failoverLambdaRole,
      });

      // CloudWatch Alarm for Failover (only in primary region)
      const failoverAlarm = new cloudwatch.Alarm(this, 'FailoverAlarm', {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApplicationELB',
          metricName: 'HealthyHostCount',
          dimensionsMap: {
            TargetGroup: targetGroup.targetGroupFullName,
            LoadBalancer: alb.loadBalancerFullName,
          },
          period: cdk.Duration.minutes(1),
        }),
        threshold: 1,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.LESS_THAN_OR_EQUAL_TO_THRESHOLD,
        alarmDescription:
          'Trigger failover when healthy hosts drop below threshold',
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      });

      // Add SNS action to failover alarm
      failoverAlarm.addAlarmAction(new cloudwatchactions.SnsAction(alertTopic));

      // EventBridge Rule to trigger Lambda on alarm
      new events.Rule(this, 'FailoverRule', {
        eventPattern: {
          source: ['aws.cloudwatch'],
          detailType: ['CloudWatch Alarm State Change'],
          detail: {
            alarmName: [failoverAlarm.alarmName],
            state: {
              value: ['ALARM'],
            },
          },
        },
        targets: [new targets.LambdaFunction(failoverLambda)],
      });
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
```