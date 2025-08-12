I'll create a comprehensive, production-ready CDK TypeScript infrastructure with all security best practices. Here's the complete solution:

## Project Structure

```
infrastructure/
├── lib/
│   └── production-infrastructure-stack.ts
├── bin/
│   └── app.ts
├── package.json
└── cdk.json
```

## 1. Main CDK App Entry Point

**bin/app.ts**
```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProductionInfrastructureStack } from '../lib/production-infrastructure-stack';

const app = new cdk.App();

new ProductionInfrastructureStack(app, 'ProductionInfrastructureStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
  description: 'Production-ready secure web application infrastructure',
});

// Add stack-level tags
cdk.Tags.of(app).add('Environment', 'Production');
cdk.Tags.of(app).add('Project', 'SecureWebApp');
cdk.Tags.of(app).add('ManagedBy', 'CDK');
```

## 2. Main Infrastructure Stack

**lib/production-infrastructure-stack.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export class ProductionInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Environment suffix for naming convention
    const envSuffix = 'production';

    // 1. Create VPC with security best practices
    const vpc = this.createSecureVPC(envSuffix);

    // 2. Create S3 bucket for artifacts/state
    const artifactsBucket = this.createSecureS3Bucket(envSuffix);

    // 3. Create IAM role for EC2 instances
    const ec2Role = this.createEC2IAMRole(envSuffix, artifactsBucket);

    // 4. Create security groups
    const securityGroups = this.createSecurityGroups(vpc, envSuffix);

    // 5. Create CloudWatch Log Group
    const logGroup = this.createLogGroup(envSuffix);

    // 6. Create SNS topic for alerts
    const alertsTopic = this.createSNSTopic(envSuffix);

    // 7. Create Launch Template
    const launchTemplate = this.createLaunchTemplate(
      vpc,
      ec2Role,
      securityGroups,
      logGroup,
      envSuffix
    );

    // 8. Create Auto Scaling Group
    const autoScalingGroup = this.createAutoScalingGroup(
      vpc,
      launchTemplate,
      envSuffix
    );

    // 9. Create CloudWatch Alarms and Monitoring
    this.createMonitoring(autoScalingGroup, alertsTopic, envSuffix);

    // 10. Create SSM Parameters for configuration
    this.createSSMParameters(vpc, artifactsBucket, envSuffix);

    // 11. Output important information
    this.createOutputs(vpc, artifactsBucket, autoScalingGroup);
  }

  private createSecureVPC(envSuffix: string): ec2.Vpc {
    const vpc = new ec2.Vpc(this, `SecureVPC-${envSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `PublicSubnet-${envSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `PrivateSubnet-${envSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      flowLogs: {
        [`VPCFlowLogs-${envSuffix}`]: {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(),
          trafficType: ec2.FlowLogTrafficType.ALL,
        },
      },
    });

    // Add VPC endpoint for S3 for secure access
    vpc.addGatewayEndpoint(`S3Endpoint-${envSuffix}`, {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    // Add VPC endpoint for SSM for secure parameter access
    vpc.addInterfaceEndpoint(`SSMEndpoint-${envSuffix}`, {
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
      privateDnsEnabled: true,
    });

    // Add VPC endpoint for CloudWatch Logs
    vpc.addInterfaceEndpoint(`CloudWatchLogsEndpoint-${envSuffix}`, {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      privateDnsEnabled: true,
    });

    return vpc;
  }

  private createSecureS3Bucket(envSuffix: string): s3.Bucket {
    return new s3.Bucket(this, `ArtifactsBucket-${envSuffix}`, {
      bucketName: `secure-webapp-artifacts-${envSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      serverAccessLogsPrefix: 'access-logs/',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
  }

  private createEC2IAMRole(envSuffix: string, bucket: s3.Bucket): iam.Role {
    const role = new iam.Role(this, `EC2Role-${envSuffix}`, {
      roleName: `EC2-WebApp-Role-${envSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Add custom policy for S3 bucket access
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
        ],
        resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
      })
    );

    // Add policy for CloudWatch Logs
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogStreams',
        ],
        resources: [`arn:aws:logs:${this.region}:${this.account}:*`],
      })
    );

    return role;
  }

  private createSecurityGroups(vpc: ec2.Vpc, envSuffix: string) {
    // Web tier security group
    const webSecurityGroup = new ec2.SecurityGroup(this, `WebSG-${envSuffix}`, {
      vpc,
      description: 'Security group for web tier',
      allowAllOutbound: false,
    });

    // Allow HTTP and HTTPS inbound
    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );
    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Allow SSH from specific CIDR (you should restrict this further)
    webSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/16'),
      ec2.Port.tcp(22),
      'Allow SSH from VPC'
    );

    // Allow outbound HTTPS for updates and API calls
    webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound'
    );

    // Allow outbound HTTP for package updates
    webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP outbound'
    );

    // Allow DNS
    webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udp(53),
      'Allow DNS'
    );

    return { webSecurityGroup };
  }

  private createLogGroup(envSuffix: string): logs.LogGroup {
    return new logs.LogGroup(this, `WebAppLogGroup-${envSuffix}`, {
      logGroupName: `/aws/ec2/webapp-${envSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }

  private createSNSTopic(envSuffix: string): sns.Topic {
    return new sns.Topic(this, `AlertsTopic-${envSuffix}`, {
      topicName: `webapp-alerts-${envSuffix}`,
      displayName: 'Web Application Alerts',
    });
  }

  private createLaunchTemplate(
    vpc: ec2.Vpc,
    role: iam.Role,
    securityGroups: { webSecurityGroup: ec2.SecurityGroup },
    logGroup: logs.LogGroup,
    envSuffix: string
  ): ec2.LaunchTemplate {
    // Create instance profile
    const instanceProfile = new iam.CfnInstanceProfile(this, `InstanceProfile-${envSuffix}`, {
      roles: [role.roleName],
      instanceProfileName: `EC2-WebApp-InstanceProfile-${envSuffix}`,
    });

    // User data script for instance initialization
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y awslogs',
      
      // Configure CloudWatch agent
      `cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "${logGroup.logGroupName}",
            "log_stream_name": "{instance_id}/messages"
          },
          {
            "file_path": "/var/log/secure",
            "log_group_name": "${logGroup.logGroupName}",
            "log_stream_name": "{instance_id}/secure"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "WebApp/Production",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": ["used_percent"],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF`,
      
      // Start CloudWatch agent
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s',
      
      // Install and start nginx (example web server)
      'amazon-linux-extras install -y nginx1',
      'systemctl start nginx',
      'systemctl enable nginx',
      
      // Create a simple health check page
      'echo "Healthy" > /usr/share/nginx/html/health',
      
      // Set up log rotation
      'echo "/var/log/webapp/*.log {" > /etc/logrotate.d/webapp',
      'echo "    daily" >> /etc/logrotate.d/webapp',
      'echo "    rotate 7" >> /etc/logrotate.d/webapp',
      'echo "    compress" >> /etc/logrotate.d/webapp',
      'echo "    delaycompress" >> /etc/logrotate.d/webapp',
      'echo "    missingok" >> /etc/logrotate.d/webapp',
      'echo "    notifempty" >> /etc/logrotate.d/webapp',
      'echo "}" >> /etc/logrotate.d/webapp'
    );

    return new ec2.LaunchTemplate(this, `LaunchTemplate-${envSuffix}`, {
      launchTemplateName: `webapp-launch-template-${envSuffix}`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      userData,
      securityGroup: securityGroups.webSecurityGroup,
      role,
      requireImdsv2: true, // Security best practice
      detailedMonitoring: true,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            encrypted: true,
            deleteOnTermination: true,
          }),
        },
      ],
    });
  }

  private createAutoScalingGroup(
    vpc: ec2.Vpc,
    launchTemplate: ec2.LaunchTemplate,
    envSuffix: string
  ): autoscaling.AutoScalingGroup {
    const asg = new autoscaling.AutoScalingGroup(this, `AutoScalingGroup-${envSuffix}`, {
      autoScalingGroupName: `webapp-asg-${envSuffix}`,
      vpc,
      launchTemplate,
      minCapacity: 1,
      maxCapacity: 6,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      healthCheck: autoscaling.HealthCheck.ec2({
        grace: cdk.Duration.minutes(5),
      }),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdateWithSignals({
        minInstancesInService: 1,
        maxBatchSize: 1,
        pauseTime: cdk.Duration.minutes(10),
      }),
    });

    // Add scaling policies
    const scaleUpPolicy = asg.scaleOnCpuUtilization(`ScaleUpPolicy-${envSuffix}`, {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(5),
    });

    return asg;
  }

  private createMonitoring(
    asg: autoscaling.AutoScalingGroup,
    alertsTopic: sns.Topic,
    envSuffix: string
  ): void {
    // High CPU utilization alarm
    const highCpuAlarm = new cloudwatch.Alarm(this, `HighCPUAlarm-${envSuffix}`, {
      alarmName: `webapp-high-cpu-${envSuffix}`,
      metric: asg.metricCpuUtilization({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    });

    highCpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertsTopic));

    // Low instance count alarm
    const lowInstanceAlarm = new cloudwatch.Alarm(this, `LowInstanceAlarm-${envSuffix}`, {
      alarmName: `webapp-low-instances-${envSuffix}`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/AutoScaling',
        metricName: 'GroupInServiceInstances',
        dimensionsMap: {
          AutoScalingGroupName: asg.autoScalingGroupName,
        },
        period: cdk.Duration.minutes(1),
        statistic: 'Average',
      }),
      threshold: 1,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    });

    lowInstanceAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertsTopic));

    // Create CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, `WebAppDashboard-${envSuffix}`, {
      dashboardName: `webapp-monitoring-${envSuffix}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'CPU Utilization',
        left: [asg.metricCpuUtilization()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Instance Count',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/AutoScaling',
            metricName: 'GroupInServiceInstances',
            dimensionsMap: {
              AutoScalingGroupName: asg.autoScalingGroupName,
            },
          }),
        ],
      })
    );
  }

  private createSSMParameters(
    vpc: ec2.Vpc,
    bucket: s3.Bucket,
    envSuffix: string
  ): void {
    new ssm.StringParameter(this, `VPCIdParameter-${envSuffix}`, {
      parameterName: `/webapp/${envSuffix}/vpc-id`,
      stringValue: vpc.vpcId,
      description: 'VPC ID for the web application',
    });

    new ssm.StringParameter(this, `S3BucketParameter-${envSuffix}`, {
      parameterName: `/webapp/${envSuffix}/s3-bucket`,
      stringValue: bucket.bucketName,
      description: 'S3 bucket for artifacts',
    });

    new ssm.StringParameter(this, `EnvironmentParameter-${envSuffix}`, {
      parameterName: `/webapp/${envSuffix}/environment`,
      stringValue: envSuffix,
      description: 'Environment name',
    });
  }

  private createOutputs(
    vpc: ec2.Vpc,
    bucket: s3.Bucket,
    asg: autoscaling.AutoScalingGroup
  ): void {
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: 'ProductionVPCId',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: bucket.bucketName,
      description: 'S3 Bucket for artifacts',
      exportName: 'ProductionS3Bucket',
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: asg.autoScalingGroupName,
      description: 'Auto Scaling Group Name',
      exportName: 'ProductionASGName',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
      exportName: 'ProductionRegion',
    });
  }
}
```

## 3. Package Configuration

**package.json**
```json
{
  "name": "secure-webapp-infrastructure",
  "version": "1.0.0",
  "bin": {
    "infrastructure": "bin/app.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "deploy": "cdk deploy --require-approval never",
    "destroy": "cdk destroy",
    "synth": "cdk synth",
    "diff": "cdk diff"
  },
  "devDependencies": {
    "@types/jest": "^29.4.0",
    "@types/node": "18.14.6",
    "jest": "^29.5.0",
    "ts-jest": "^29.0.5",
    "aws-cdk": "2.87.0",
    "ts-node": "^10.9.1",
    "typescript": "~4.9.5"
  },
  "dependencies": {
    "aws-cdk-lib": "2.87.0",
    "constructs": "^10.0.0",
    "source-map-support": "^0.5.21"
  }
}
```

**cdk.json**
```json
{
  "app": "npx ts-node --prefer-ts-exts bin/app.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-lambda:baseEnvironmentVariables": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-lambda:configureSqsDlq": true,
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true
  }
}
```

## 4. TypeScript Configuration

**tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": [
      "es2020"
    ],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": [
      "./node_modules/@types"
    ]
  },
  "exclude": [
    "node_modules",
    "cdk.out"
  ]
}
```

## 5. Deployment Instructions

Create a **deploy.sh** script:

```bash
#!/bin/bash

# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Bootstrap CDK (run once per account/region)
npx cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2

# Deploy the infrastructure
npx cdk deploy --require-approval never

# Show outputs
npx cdk list
```

## Key Security Features Implemented

### 🔒 **Network Security**
- VPC with proper CIDR segmentation
- Public and private subnets across multiple AZs
- VPC Flow Logs enabled
- Security groups with least privilege access
- VPC endpoints for secure AWS service access

### 🛡️ **Compute Security**
- IMDSv2 required on EC2 instances
- EBS volumes encrypted
- IAM roles instead of access keys
- Systems Manager for secure access
- CloudWatch agent for monitoring

### 📦 **Storage Security**
- S3 bucket with encryption at rest
- Versioning enabled
- Block public access
- SSL/TLS enforcement
- Lifecycle policies for cost optimization

### 📊 **Monitoring & Alerting**
- CloudWatch alarms for CPU and instance health
- SNS topic for notifications
- Comprehensive logging
- CloudWatch dashboard
- Auto Scaling based on metrics

### 🏷️ **Compliance**
- Consistent tagging strategy
- SSM parameters for configuration
- Proper naming conventions with environment suffix
- Resource retention policies

## Usage

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Deploy the infrastructure:**
   ```bash
   npm run build
   npx cdk deploy
   ```

3. **Monitor the deployment:**
   ```bash
   npx cdk diff  # Check changes before deployment
   ```

4. **Clean up:**
   ```bash
   npx cdk destroy
   ```

This infrastructure provides a production-ready, secure foundation for your web application with all AWS security best practices implemented. The Auto Scaling Group ensures high availability, while comprehensive monitoring provides visibility into system health and performance.