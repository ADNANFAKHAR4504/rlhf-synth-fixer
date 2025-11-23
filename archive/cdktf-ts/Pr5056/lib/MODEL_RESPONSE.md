```typescript
// main.ts - Multi-AZ Failure Recovery System with CDKTF

import { Construct } from 'constructs';
import { App, TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Alb } from '@cdktf/provider-aws/lib/alb';
import { AlbTargetGroup } from '@cdktf/provider-aws/lib/alb-target-group';
import { AlbListener } from '@cdktf/provider-aws/lib/alb-listener';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { CloudwatchEventRule } from '@cdktf/provider-aws/lib/cloudwatch-event-rule';
import { CloudwatchEventTarget } from '@cdktf/provider-aws/lib/cloudwatch-event-target';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';

class MultiAZFailureRecoveryStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // ===============================
    // PROVIDER CONFIGURATION
    // ===============================
    new AwsProvider(this, 'aws', {
      region: 'us-east-1',
    });

    // Configuration from requirements
    const config = {
      app: {
        healthcheckEndpoint: '/health',
        minHealthyInstances: 2,
        maxRetryAttempts: 3,
        recoveryTimeoutSeconds: 300,
      },
      infrastructure: {
        vpcCidr: '10.0.0.0/16',
        availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        instanceType: 't3.medium',
      },
    };

    // ===============================
    // NETWORKING - VPC & SUBNETS
    // ===============================
    const vpc = new Vpc(this, 'main-vpc', {
      cidrBlock: config.infrastructure.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: 'multi-az-recovery-vpc',
        Environment: 'production',
      },
    });

    const igw = new InternetGateway(this, 'main-igw', {
      vpcId: vpc.id,
      tags: {
        Name: 'multi-az-recovery-igw',
      },
    });

    // Create public subnets across 3 AZs for high availability
    const publicSubnets: Subnet[] = [];
    config.infrastructure.availabilityZones.forEach((az, index) => {
      const subnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${index + 1}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-${az}`,
          Type: 'public',
        },
      });
      publicSubnets.push(subnet);
    });

    // Create route table and associations
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      tags: {
        Name: 'public-route-table',
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // ===============================
    // SECURITY GROUPS
    // ===============================
    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: 'alb-security-group',
      description: 'Security group for Application Load Balancer',
      vpcId: vpc.id,
      tags: {
        Name: 'alb-sg',
      },
    });

    new SecurityGroupRule(this, 'alb-ingress-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'Allow HTTP traffic',
    });

    new SecurityGroupRule(this, 'alb-egress-all', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    const instanceSecurityGroup = new SecurityGroup(this, 'instance-sg', {
      name: 'instance-security-group',
      description: 'Security group for EC2 instances',
      vpcId: vpc.id,
      tags: {
        Name: 'instance-sg',
      },
    });

    new SecurityGroupRule(this, 'instance-ingress-alb', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      sourceSecurityGroupId: albSecurityGroup.id,
      securityGroupId: instanceSecurityGroup.id,
      description: 'Allow traffic from ALB',
    });

    new SecurityGroupRule(this, 'instance-egress-all', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: instanceSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // ===============================
    // LOAD BALANCER CONFIGURATION
    // ===============================
    const alb = new Alb(this, 'main-alb', {
      name: 'multi-az-recovery-alb',
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSecurityGroup.id],
      subnets: publicSubnets.map(s => s.id),
      enableDeletionProtection: false,
      enableHttp2: true,
      tags: {
        Name: 'multi-az-recovery-alb',
        ManagedBy: 'terraform',
      },
    });

    const targetGroup = new AlbTargetGroup(this, 'main-tg', {
      name: 'multi-az-recovery-tg',
      port: 80,
      protocol: 'HTTP',
      vpcId: vpc.id,
      targetType: 'instance',
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        path: config.app.healthcheckEndpoint,
        matcher: '200',
      },
      deregistrationDelay: 30, // Reduced for faster failover
      tags: {
        Name: 'multi-az-recovery-tg',
      },
    });

    new AlbListener(this, 'main-listener', {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    });

    // ===============================
    // IAM ROLES & POLICIES
    // ===============================
    const instanceRole = new IamRole(this, 'instance-role', {
      name: 'multi-az-recovery-instance-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'instance-role-ssm-policy', {
      role: instanceRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    new IamRolePolicyAttachment(this, 'instance-role-cloudwatch-policy', {
      role: instanceRole.name,
      policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
    });

    const instanceProfile = new IamInstanceProfile(this, 'instance-profile', {
      name: 'multi-az-recovery-instance-profile',
      role: instanceRole.name,
    });

    // ===============================
    // AUTO SCALING GROUP
    // ===============================
    const ami = new DataAwsAmi(this, 'amazon-linux-2', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // User data script for instance initialization
    const userData = Buffer.from(
      `#!/bin/bash
# Install dependencies
yum update -y
yum install -y httpd
yum install -y amazon-cloudwatch-agent

# Configure simple health check endpoint
cat <<'EOF' > /var/www/html${config.app.healthcheckEndpoint}
OK
EOF

# Start services
systemctl start httpd
systemctl enable httpd

# Configure CloudWatch agent for enhanced monitoring
cat <<'EOF' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
  "metrics": {
    "namespace": "MultiAZRecovery",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60
      },
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MEM_USAGE", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a query -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
`
    ).toString('base64');

    const launchTemplate = new LaunchTemplate(this, 'main-lt', {
      name: 'multi-az-recovery-lt',
      imageId: ami.id,
      instanceType: config.infrastructure.instanceType,
      iamInstanceProfile: {
        arn: instanceProfile.arn,
      },
      vpcSecurityGroupIds: [instanceSecurityGroup.id],
      userData: userData,
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            Name: 'multi-az-recovery-instance',
            ManagedBy: 'autoscaling',
          },
        },
      ],
      monitoring: {
        enabled: true, // Enable detailed monitoring for faster metric collection
      },
    });

    const asg = new AutoscalingGroup(this, 'main-asg', {
      name: 'multi-az-recovery-asg',
      minSize: config.app.minHealthyInstances,
      maxSize: 6, // Allow scaling for recovery
      desiredCapacity: 3, // One per AZ for redundancy
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 180,
      defaultCooldown: 60, // Reduced for faster recovery
      vpcZoneIdentifier: publicSubnets.map(s => s.id),
      targetGroupArns: [targetGroup.arn],
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      tag: [
        {
          key: 'Name',
          value: 'multi-az-recovery-instance',
          propagateAtLaunch: true,
        },
        {
          key: 'Environment',
          value: 'production',
          propagateAtLaunch: true,
        },
      ],
    });

    // ===============================
    // STATE MANAGEMENT - DYNAMODB
    // ===============================
    const stateTable = new DynamodbTable(this, 'state-table', {
      name: 'multi-az-recovery-state',
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'id',
      rangeKey: 'timestamp',
      attribute: [
        {
          name: 'id',
          type: 'S',
        },
        {
          name: 'timestamp',
          type: 'N',
        },
      ],
      pointInTimeRecovery: {
        enabled: true,
      },
      tags: {
        Name: 'multi-az-recovery-state',
        Purpose: 'failover-state-management',
      },
    });

    // ===============================
    // LAMBDA RECOVERY FUNCTION
    // ===============================
    const lambdaRole = new IamRole(this, 'lambda-role', {
      name: 'multi-az-recovery-lambda-role',
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
    });

    new IamRolePolicy(this, 'lambda-policy', {
      name: 'multi-az-recovery-lambda-policy',
      role: lambdaRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: 'arn:aws:logs:*:*:*',
          },
          {
            Effect: 'Allow',
            Action: [
              'autoscaling:*',
              'elasticloadbalancing:*',
              'ec2:*',
              'cloudwatch:*',
              'dynamodb:*',
            ],
            Resource: '*',
          },
        ],
      }),
    });

    const lambdaLogGroup = new CloudwatchLogGroup(this, 'lambda-logs', {
      name: '/aws/lambda/multi-az-recovery-function',
      retentionInDays: 7,
    });

    // Lambda function code for recovery automation
    const lambdaCode = `
const AWS = require('aws-sdk');
const autoscaling = new AWS.AutoScaling();
const elbv2 = new AWS.ELBv2();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const cloudwatch = new AWS.CloudWatch();

const CONFIG = {
  ASG_NAME: '${asg.name}',
  TARGET_GROUP_ARN: '${targetGroup.arn}',
  STATE_TABLE: '${stateTable.name}',
  MIN_HEALTHY_INSTANCES: ${config.app.minHealthyInstances},
  MAX_RETRY_ATTEMPTS: ${config.app.maxRetryAttempts},
  RECOVERY_TIMEOUT: ${config.app.recoveryTimeoutSeconds}
};

exports.handler = async (event) => {
  console.log('Recovery function triggered:', JSON.stringify(event));
  
  const startTime = Date.now();
  const recoveryId = 'recovery-' + startTime;
  
  try {
    // Log recovery initiation to DynamoDB
    await dynamodb.put({
      TableName: CONFIG.STATE_TABLE,
      Item: {
        id: recoveryId,
        timestamp: startTime,
        status: 'INITIATED',
        event: event,
        ttl: Math.floor(Date.now() / 1000) + 86400 // 24h TTL
      }
    }).promise();
    
    // Step 1: Get current ASG state
    const asgData = await autoscaling.describeAutoScalingGroups({
      AutoScalingGroupNames: [CONFIG.ASG_NAME]
    }).promise();
    
    const asg = asgData.AutoScalingGroups[0];
    const healthyInstances = asg.Instances.filter(i => 
      i.HealthStatus === 'Healthy' && i.LifecycleState === 'InService'
    );
    
    console.log(\`Healthy instances: \${healthyInstances.length}/\${asg.Instances.length}\`);
    
    // Step 2: Get unhealthy targets from ALB
    const targetHealth = await elbv2.describeTargetHealth({
      TargetGroupArn: CONFIG.TARGET_GROUP_ARN
    }).promise();
    
    const unhealthyTargets = targetHealth.TargetHealthDescriptions.filter(t => 
      t.TargetHealth.State !== 'healthy'
    );
    
    console.log(\`Unhealthy targets: \${unhealthyTargets.length}\`);
    
    // Step 3: Execute recovery actions
    const recoveryActions = [];
    
    // Action 1: Replace unhealthy instances
    for (const target of unhealthyTargets) {
      if (target.Target && target.Target.Id) {
        console.log(\`Terminating unhealthy instance: \${target.Target.Id}\`);
        recoveryActions.push(
          autoscaling.terminateInstanceInAutoScalingGroup({
            InstanceId: target.Target.Id,
            ShouldDecrementDesiredCapacity: false
          }).promise()
        );
      }
    }
    
    // Action 2: Scale up if below minimum
    if (healthyInstances.length < CONFIG.MIN_HEALTHY_INSTANCES) {
      const scaleUpCount = CONFIG.MIN_HEALTHY_INSTANCES - healthyInstances.length + 1;
      console.log(\`Scaling up by \${scaleUpCount} instances\`);
      
      recoveryActions.push(
        autoscaling.setDesiredCapacity({
          AutoScalingGroupName: CONFIG.ASG_NAME,
          DesiredCapacity: asg.DesiredCapacity + scaleUpCount,
          HonorCooldown: false
        }).promise()
      );
    }
    
    // Execute all recovery actions in parallel
    await Promise.all(recoveryActions);
    
    // Step 4: Wait and verify recovery
    let attempts = 0;
    let recovered = false;
    
    while (attempts < CONFIG.MAX_RETRY_ATTEMPTS && !recovered) {
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
      
      const checkHealth = await elbv2.describeTargetHealth({
        TargetGroupArn: CONFIG.TARGET_GROUP_ARN
      }).promise();
      
      const healthyCount = checkHealth.TargetHealthDescriptions.filter(t => 
        t.TargetHealth.State === 'healthy'
      ).length;
      
      if (healthyCount >= CONFIG.MIN_HEALTHY_INSTANCES) {
        recovered = true;
        console.log('Recovery successful');
      }
      
      attempts++;
    }
    
    // Update recovery status in DynamoDB
    await dynamodb.put({
      TableName: CONFIG.STATE_TABLE,
      Item: {
        id: recoveryId,
        timestamp: Date.now(),
        status: recovered ? 'COMPLETED' : 'FAILED',
        duration: Date.now() - startTime,
        attempts: attempts,
        ttl: Math.floor(Date.now() / 1000) + 86400
      }
    }).promise();
    
    // Publish custom metric
    await cloudwatch.putMetricData({
      Namespace: 'MultiAZRecovery',
      MetricData: [
        {
          MetricName: 'RecoveryTime',
          Value: (Date.now() - startTime) / 1000,
          Unit: 'Seconds',
          Timestamp: new Date()
        },
        {
          MetricName: 'RecoverySuccess',
          Value: recovered ? 1 : 0,
          Unit: 'Count',
          Timestamp: new Date()
        }
      ]
    }).promise();
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        recoveryId: recoveryId,
        status: recovered ? 'COMPLETED' : 'FAILED',
        duration: Date.now() - startTime,
        message: recovered ? 'Recovery completed successfully' : 'Recovery failed after maximum attempts'
      })
    };
    
  } catch (error) {
    console.error('Recovery error:', error);
    
    // Log error to DynamoDB
    await dynamodb.put({
      TableName: CONFIG.STATE_TABLE,
      Item: {
        id: recoveryId,
        timestamp: Date.now(),
        status: 'ERROR',
        error: error.message,
        ttl: Math.floor(Date.now() / 1000) + 86400
      }
    }).promise();
    
    throw error;
  }
};
`;

    const lambdaFunction = new LambdaFunction(this, 'recovery-function', {
      functionName: 'multi-az-recovery-function',
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: lambdaRole.arn,
      timeout: config.app.recoveryTimeoutSeconds,
      memorySize: 512,
      environment: {
        variables: {
          ASG_NAME: asg.name,
          TARGET_GROUP_ARN: targetGroup.arn,
          STATE_TABLE: stateTable.name,
        },
      },
      filename: 'lambda.zip', // You'll need to create this zip file
      sourceCodeHash: Buffer.from(lambdaCode).toString('base64'),
      dependsOn: [lambdaLogGroup],
    });

    // ===============================
    // MONITORING & ALERTING
    // ===============================

    // Alarm 1: Unhealthy targets
    const unhealthyTargetsAlarm = new CloudwatchMetricAlarm(
      this,
      'unhealthy-targets-alarm',
      {
        alarmName: 'multi-az-recovery-unhealthy-targets',
        alarmDescription: 'Triggers when unhealthy targets exceed threshold',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'UnHealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 0,
        treatMissingData: 'breaching',
        dimensions: {
          TargetGroup: targetGroup.arnSuffix,
          LoadBalancer: alb.arnSuffix,
        },
      }
    );

    // Alarm 2: High error rate
    const highErrorRateAlarm = new CloudwatchMetricAlarm(
      this,
      'high-error-rate-alarm',
      {
        alarmName: 'multi-az-recovery-high-error-rate',
        alarmDescription: 'Triggers when 5xx errors exceed threshold',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HTTPCode_Target_5XX_Count',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Sum',
        threshold: 10,
        treatMissingData: 'notBreaching',
        dimensions: {
          TargetGroup: targetGroup.arnSuffix,
          LoadBalancer: alb.arnSuffix,
        },
      }
    );

    // Alarm 3: Insufficient healthy instances
    const insufficientInstancesAlarm = new CloudwatchMetricAlarm(
      this,
      'insufficient-instances-alarm',
      {
        alarmName: 'multi-az-recovery-insufficient-instances',
        alarmDescription: 'Triggers when healthy instances drop below minimum',
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 1,
        metricName: 'HealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: config.app.minHealthyInstances,
        treatMissingData: 'breaching',
        dimensions: {
          TargetGroup: targetGroup.arnSuffix,
          LoadBalancer: alb.arnSuffix,
        },
      }
    );

    // ===============================
    // EVENT BRIDGE RULES
    // ===============================
    const recoveryEventRule = new CloudwatchEventRule(
      this,
      'recovery-event-rule',
      {
        name: 'multi-az-recovery-trigger',
        description: 'Triggers recovery Lambda on alarm state changes',
        eventPattern: JSON.stringify({
          source: ['aws.cloudwatch'],
          'detail-type': ['CloudWatch Alarm State Change'],
          detail: {
            alarmName: [
              unhealthyTargetsAlarm.alarmName,
              highErrorRateAlarm.alarmName,
              insufficientInstancesAlarm.alarmName,
            ],
            state: {
              value: ['ALARM'],
            },
          },
        }),
      }
    );

    new CloudwatchEventTarget(this, 'recovery-lambda-target', {
      rule: recoveryEventRule.name,
      arn: lambdaFunction.arn,
      retryPolicy: {
        maximumRetryAttempts: 2,
        maximumEventAge: 3600,
      },
    });

    new LambdaPermission(this, 'allow-eventbridge', {
      statementId: 'AllowExecutionFromEventBridge',
      action: 'lambda:InvokeFunction',
      functionName: lambdaFunction.functionName,
      principal: 'events.amazonaws.com',
      sourceArn: recoveryEventRule.arn,
    });

    // ===============================
    // OUTPUTS
    // ===============================
    new TerraformOutput(this, 'alb-dns', {
      value: alb.dnsName,
      description: 'DNS name of the Application Load Balancer',
    });

    new TerraformOutput(this, 'health-check-url', {
      value: `http://${alb.dnsName}${config.app.healthcheckEndpoint}`,
      description: 'Health check endpoint URL',
    });

    new TerraformOutput(this, 'state-table-name', {
      value: stateTable.name,
      description: 'DynamoDB table for state management',
    });

    new TerraformOutput(this, 'recovery-function-name', {
      value: lambdaFunction.functionName,
      description: 'Lambda function for recovery automation',
    });

    new TerraformOutput(this, 'asg-name', {
      value: asg.name,
      description: 'Auto Scaling Group name',
    });

    new TerraformOutput(this, 'target-group-arn', {
      value: targetGroup.arn,
      description: 'Target Group ARN',
    });
  }
}

const app = new App();
new MultiAZFailureRecoveryStack(app, 'multi-az-recovery');
app.synth();
```
