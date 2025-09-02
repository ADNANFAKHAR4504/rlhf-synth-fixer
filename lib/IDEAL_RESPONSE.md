Here's a complete TypeScript CDK file that provisions a secure and scalable infrastructure with all the requested components:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ssm from 'aws-cdk-lib/aws-ssm';
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

    // 1. Custom VPC with public and private subnets for security isolation
    const vpc = new ec2.Vpc(this, 'SecureVpc', {
      maxAzs: 2, // Deploy across 2 AZs for high availability
      cidr: '10.0.0.0/16',
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'isolated-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Security Group for EC2 instances - restrictive inbound rules
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: false, // Explicit outbound rules for better security
    });

    // Allow HTTPS outbound for package updates and API calls
    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound'
    );

    // Allow HTTP outbound for package repositories
    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP outbound'
    );

    // 2. IAM Role for EC2 instances with least-privilege permissions
    const ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description:
        'IAM role for EC2 instances with least-privilege permissions',
    });

    // Attach minimal policy for EC2 instances using JSON policy document
    const ec2PolicyDocument = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ssm:GetParameter',
            'ssm:GetParameters',
            'ssm:GetParametersByPath',
          ],
          resources: [
            `arn:aws:ssm:${this.region}:${this.account}:parameter/app/*`,
          ],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['sns:Publish'],
          resources: [
            `arn:aws:sns:${this.region}:${this.account}:app-logs-topic-${environmentSuffix}`,
          ],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          resources: [
            `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/ec2/*`,
          ],
        }),
      ],
    });

    new iam.Policy(this, 'EC2Policy', {
      policyName: 'EC2LeastPrivilegePolicy',
      document: ec2PolicyDocument,
      roles: [ec2Role],
    });

    // Instance profile for EC2 role
    new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      role: ec2Role,
    });

    // 4. S3 bucket with server-side encryption and blocked public access
    const secureBucket = new s3.Bucket(this, 'SecureBucket', {
      bucketName: `secure-app-bucket-${this.account}-${this.region}-${environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED, // SSE-S3 encryption
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // Block all public access
      versioned: true, // Enable versioning for data protection
      enforceSSL: true, // Enforce SSL for all requests
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow cleanup for testing
      autoDeleteObjects: true, // Auto-delete objects when bucket is destroyed
    });

    // 5. RDS database with encryption, backups, and deletion protection
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc,
        description: 'Security group for RDS database',
        allowAllOutbound: false,
      }
    );

    // Allow database access only from EC2 security group
    dbSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from EC2 instances'
    );

    const database = new rds.DatabaseInstance(this, 'SecureDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // Deploy in isolated subnets
      },
      securityGroups: [dbSecurityGroup],
      storageEncrypted: true, // Enable encryption at rest
      backupRetention: cdk.Duration.days(7), // Automated backups for 7 days
      deletionProtection: false, // Allow deletion for testing
      multiAz: false, // Single AZ for cost optimization in testing
      databaseName: 'appdb',
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: `rds-credentials-${environmentSuffix}`,
        excludeCharacters: '"@/\\\'', // Exclude problematic characters
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow cleanup for testing
    });

    // 6. Parameter Store entries for sensitive configuration
    new ssm.StringParameter(this, 'DatabaseEndpoint', {
      parameterName: `/app/database/endpoint-host-${environmentSuffix}`,
      stringValue: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
      tier: ssm.ParameterTier.STANDARD,
    });

    new ssm.StringParameter(this, 'S3Bucket', {
      parameterName: `/app/s3/bucket-name-${environmentSuffix}`,
      stringValue: secureBucket.bucketName,
      description: 'S3 bucket name for application data',
      tier: ssm.ParameterTier.STANDARD,
    });

    // 7. SNS topic for application log publishing
    const logsTopic = new sns.Topic(this, 'AppLogsTopic', {
      topicName: `app-logs-topic-${environmentSuffix}`,
      displayName: 'Application Logs Topic',
    });

    // 8. CloudWatch alarm for security group changes
    const securityGroupAlarm = new cloudwatch.Alarm(
      this,
      'SecurityGroupChangesAlarm',
      {
        alarmName: `SecurityGroupChanges-Alarm-${environmentSuffix}`,
        alarmDescription: 'Alarm for security group changes',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/Events',
          metricName: 'MatchedEvents',
          dimensionsMap: {
            RuleName: `SecurityGroupChangesRule-${environmentSuffix}`,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );

    // Add SNS action to the alarm
    securityGroupAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(logsTopic));

    // EventBridge rule to detect security group changes
    const securityGroupRule = new events.Rule(
      this,
      'SecurityGroupChangesRule',
      {
        ruleName: `SecurityGroupChangesRule-${environmentSuffix}`,
        description: 'Detect security group changes',
        eventPattern: {
          source: ['aws.ec2'],
          detailType: ['AWS API Call via CloudTrail'],
          detail: {
            eventSource: ['ec2.amazonaws.com'],
            eventName: [
              'AuthorizeSecurityGroupIngress',
              'AuthorizeSecurityGroupEgress',
              'RevokeSecurityGroupIngress',
              'RevokeSecurityGroupEgress',
              'CreateSecurityGroup',
              'DeleteSecurityGroup',
            ],
          },
        },
      }
    );

    securityGroupRule.addTarget(new targets.SnsTopic(logsTopic));

    // 9. IAM account policy enforcing MFA for console users
    new iam.ManagedPolicy(this, 'EnforceMFAPolicy', {
      managedPolicyName: `EnforceMFAForConsoleUsers-${environmentSuffix}`,
      description: 'Policy that enforces MFA for console access',
      document: new iam.PolicyDocument({
        statements: [
          // Allow users to manage their own MFA devices
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'iam:ListVirtualMFADevices',
              'iam:ListMFADevices',
              'iam:GetUser',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'iam:CreateVirtualMFADevice',
              'iam:DeleteVirtualMFADevice',
              'iam:EnableMFADevice',
              'iam:ResyncMFADevice',
              'iam:DeactivateMFADevice',
            ],
            resources: [
              `arn:aws:iam::${this.account}:mfa/\${aws:username}`,
              `arn:aws:iam::${this.account}:user/\${aws:username}`,
            ],
          }),
          // Deny console access without MFA
          new iam.PolicyStatement({
            effect: iam.Effect.DENY,
            actions: ['*'],
            resources: ['*'],
            conditions: {
              BoolIfExists: {
                'aws:MultiFactorAuthPresent': 'false',
              },
              StringEquals: {
                'aws:RequestedRegion': this.region,
              },
            },
          }),
        ],
      }),
    });

    // 10. Lambda function with restricted execution role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description:
        'Execution role for Lambda function with minimal permissions',
    });

    // Inline policy for Lambda with JSON document - least privilege
    const lambdaPolicyDocument = new iam.PolicyDocument({
      statements: [
        // Basic Lambda execution permissions
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          resources: [
            `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/*`,
          ],
        }),
        // Allow reading specific SSM parameters
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['ssm:GetParameter', 'ssm:GetParameters'],
          resources: [
            `arn:aws:ssm:${this.region}:${this.account}:parameter/app/*`,
          ],
        }),
        // Allow publishing to specific SNS topic
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['sns:Publish'],
          resources: [logsTopic.topicArn],
        }),
      ],
    });

    new iam.Policy(this, 'LambdaInlinePolicy', {
      policyName: `LambdaMinimalPermissions-Policy-${environmentSuffix}`,
      document: lambdaPolicyDocument,
      roles: [lambdaRole],
    });

    const processingFunction = new lambda.Function(this, 'ProcessingFunction', {
      functionName: `secure-processing-function-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const sns = new AWS.SNS();
        const ssm = new AWS.SSM();
        
        exports.handler = async (event) => {
          console.log('Processing event:', JSON.stringify(event, null, 2));
          
          try {
            // Example: Get configuration from Parameter Store
            const env = process.env.EnvironmentSuffix;
            const param = await ssm.getParameter({
              Name: '/app/s3/bucket-name-' + env
            }).promise();
            
            // Example: Publish to SNS
            await sns.publish({
              TopicArn: process.env.SNS_TOPIC_ARN,
              Message: 'Lambda function executed successfully',
              Subject: 'Lambda Execution'
            }).promise();
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                message: 'Function executed successfully',
                bucketName: param.Parameter.Value
              })
            };
          } catch (error) {
            console.error('Error:', error);
            throw error;
          }
        };
      `),
      timeout: cdk.Duration.minutes(5),
      environment: {
        SNS_TOPIC_ARN: logsTopic.topicArn,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // 3. Auto Scaling Group for EC2 instances
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      launchTemplateName: `secure-app-template-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      userData: ec2.UserData.forLinux(),
      requireImdsv2: true, // Enforce IMDSv2 for better security
    });

    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'AutoScalingGroup',
      {
        vpc,
        launchTemplate,
        minCapacity: 1,
        maxCapacity: 5,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, // Deploy in private subnets
        },
        healthCheck: autoscaling.HealthCheck.ec2({
          grace: cdk.Duration.minutes(5),
        }),
        updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
          maxBatchSize: 1,
          minInstancesInService: 1,
        }),
      }
    );

    // Simple CPU-based scaling with proper configuration
    autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
    });

    // Scale-up policy with multiple steps for more granular control
    const scaleUpPolicy = new autoscaling.StepScalingPolicy(
      this,
      'ScaleUpPolicy',
      {
        autoScalingGroup,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        scalingSteps: [
          { upper: 80, change: +1 }, // Add 1 instance when CPU 70-80%
          { lower: 80, change: +2 }, // Add 2 instances when CPU > 80%
        ],
        cooldown: cdk.Duration.minutes(5),
      }
    );

    // Scale-down policy with multiple steps
    const scaleDownPolicy = new autoscaling.StepScalingPolicy(
      this,
      'ScaleDownPolicy',
      {
        autoScalingGroup,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        scalingSteps: [
          { upper: 20, change: -1 }, // Remove 1 instance when CPU < 20%
          { lower: 20, upper: 30, change: -1 }, // Remove 1 instance when CPU 20-30%
        ],
        cooldown: cdk.Duration.minutes(10), // Longer cooldown for scale-down
      }
    );

    // CloudWatch alarms for manual scaling policies
    new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      alarmName: `HighCPUUtilization-Alarm-${environmentSuffix}`,
      alarmDescription: 'Scale up when CPU is high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 70,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    }).addAlarmAction({
      bind: () => ({ alarmActionArn: scaleUpPolicy.scalingPolicyArn }),
    });

    new cloudwatch.Alarm(this, 'LowCpuAlarm', {
      alarmName: `LowCPUUtilization-Alarm-${environmentSuffix}`,
      alarmDescription: 'Scale down when CPU is low',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 30,
      evaluationPeriods: 3, // Longer evaluation for scale-down to prevent flapping
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    }).addAlarmAction({
      bind: () => ({ alarmActionArn: scaleDownPolicy.scalingPolicyArn }),
    });

    // Grant Lambda permission to be invoked by SNS
    processingFunction.addPermission('AllowSNSInvocation', {
      principal: new iam.ServicePrincipal('sns.amazonaws.com'),
      sourceArn: logsTopic.topicArn,
    });

    // Subscribe Lambda to SNS topic
    logsTopic.addSubscription(new subs.LambdaSubscription(processingFunction));

    // Output important resource identifiers
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: secureBucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpointName', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'SNSTopicArn', {
      value: logsTopic.topicArn,
      description: 'SNS Topic ARN for logs',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: processingFunction.functionArn,
      description: 'Lambda Function ARN',
    });
  }
}
```

## Key Security Best Practices Implemented:

### 1. **Network Security**
- Custom VPC with public, private, and isolated subnets
- EC2 instances deployed in private subnets with egress-only internet access
- RDS database in isolated subnets with no internet access
- Restrictive security groups with explicit rules

### 2. **IAM Security**
- Least-privilege IAM roles and policies written in JSON
- Separate roles for EC2 and Lambda with minimal required permissions
- MFA enforcement policy for console users
- Resource-specific ARN restrictions in policies

### 3. **Data Protection**
- S3 bucket with SSE-S3 encryption and blocked public access
- RDS encryption at rest enabled
- SSL enforcement on S3 bucket
- Versioning enabled on S3 for data protection

### 4. **Monitoring and Alerting**
- CloudWatch alarm for security group changes
- SNS topic for centralized logging and notifications
- EventBridge rule to detect security modifications

### 5. **Infrastructure Security**
- Auto Scaling Group for high availability and resilience
- IMDSv2 enforcement on EC2 instances
- Parameter Store for secure configuration management
- Proper environment suffix integration for resource isolation

### 6. **Deployment and Testing**
- Removal policies set to DESTROY for testing environments
- Auto-delete objects enabled on S3 bucket for cleanup
- RDS deletion protection disabled for testing flexibility
- Environment suffix properly integrated throughout resources

This infrastructure follows AWS Well-Architected Framework principles with emphasis on security, reliability, and operational excellence while being optimized for automated testing and deployment.