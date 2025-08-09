I'll help you build a secure web application infrastructure on AWS using CDK TypeScript. Here's a comprehensive solution with all the security best practices you requested:

## Project Structure

First, let's set up the project structure:

```bash
mkdir secure-web-app-cdk
cd secure-web-app-cdk
npm init -y
npm install aws-cdk-lib constructs
npm install -D @types/node typescript
```

## 1. Main Stack Entry Point

**bin/app.ts**

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecureWebAppStack } from '../lib/secure-web-app-stack';

const app = new cdk.App();

// Get environment from context or default to 'prod'
const environment = app.node.tryGetContext('environment') || 'prod';

new SecureWebAppStack(app, `tf-secure-web-app-${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
  environment: environment,
});
```

## 2. Main Stack Implementation

**lib/secure-web-app-stack.ts**

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export interface SecureWebAppStackProps extends cdk.StackProps {
  environment: string;
}

export class SecureWebAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SecureWebAppStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // Common tags for all resources
    const commonTags = {
      Environment: 'Production',
      Project: 'SecureWebApp',
      ManagedBy: 'CDK',
    };

    // Apply tags to the stack
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'SecureWebApp');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // 1. KMS Key for encryption
    const kmsKey = new kms.Key(this, `tf-encryption-key-${environment}`, {
      alias: `tf-secure-web-app-key-${environment}`,
      description: `Encryption key for secure web app - ${environment}`,
      enableKeyRotation: true,
      keyPolicy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow CloudWatch Logs',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('logs.amazonaws.com')],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow S3 Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    // 2. VPC with public and private subnets
    const vpc = new ec2.Vpc(this, `tf-vpc-${environment}`, {
      vpcName: `tf-secure-vpc-${environment}`,
      cidr: '10.0.0.0/16',
      maxAzs: 3,
      natGateways: 2, // For high availability
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `tf-public-subnet-${environment}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `tf-private-subnet-${environment}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: `tf-isolated-subnet-${environment}`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Flow Logs for security monitoring
    const flowLogRole = new iam.Role(this, `tf-flow-log-role-${environment}`, {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/VPCFlowLogsDeliveryRolePolicy'
        ),
      ],
    });

    const flowLogGroup = new logs.LogGroup(
      this,
      `tf-vpc-flow-logs-${environment}`,
      {
        logGroupName: `/aws/vpc/flowlogs-${environment}`,
        retention: logs.RetentionDays.ONE_MONTH,
        encryptionKey: kmsKey,
      }
    );

    new ec2.FlowLog(this, `tf-vpc-flow-log-${environment}`, {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        flowLogGroup,
        flowLogRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // 3. Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `tf-alb-sg-${environment}`,
      {
        vpc,
        securityGroupName: `tf-alb-security-group-${environment}`,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: false,
      }
    );

    // Allow HTTP and HTTPS from anywhere (will be protected by WAF)
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );

    // Allow outbound to EC2 instances
    albSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow outbound HTTP to EC2 instances'
    );

    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `tf-ec2-sg-${environment}`,
      {
        vpc,
        securityGroupName: `tf-ec2-security-group-${environment}`,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true, // Allow outbound for updates and SSM
      }
    );

    // Allow traffic only from ALB
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB only'
    );

    // No SSH access - using SSM Session Manager instead

    // 4. IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, `tf-ec2-role-${environment}`, {
      roleName: `tf-ec2-instance-role-${environment}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Add S3 access policy
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: [`arn:aws:s3:::tf-secure-storage-${environment}/*`],
      })
    );

    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:ListBucket'],
        resources: [`arn:aws:s3:::tf-secure-storage-${environment}`],
      })
    );

    // KMS permissions for EC2 instances
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey', 'kms:DescribeKey'],
        resources: [kmsKey.keyArn],
      })
    );

    // 5. S3 Bucket with security configurations
    const s3Bucket = new s3.Bucket(this, `tf-secure-storage-${environment}`, {
      bucketName: `tf-secure-storage-${environment}`,
      versioning: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      serverAccessLogsPrefix: 'access-logs/',
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // S3 Bucket notification for security monitoring
    s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED
      // You can add SNS topic here for notifications
    );

    // 6. Launch Template for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',

      // Install and configure Apache
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',

      // Create a simple health check page
      'echo "<html><body><h1>Healthy</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p></body></html>" > /var/www/html/health.html',
      'echo "<html><body><h1>Secure Web Application</h1><p>Environment: ' +
        environment +
        '</p></body></html>" > /var/www/html/index.html',

      // Configure CloudWatch agent
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify(
        {
          metrics: {
            namespace: `SecureWebApp/${environment}`,
            metrics_collected: {
              cpu: {
                measurement: [
                  'cpu_usage_idle',
                  'cpu_usage_iowait',
                  'cpu_usage_user',
                  'cpu_usage_system',
                ],
                metrics_collection_interval: 60,
              },
              disk: {
                measurement: ['used_percent'],
                metrics_collection_interval: 60,
                resources: ['*'],
              },
              mem: {
                measurement: ['mem_used_percent'],
                metrics_collection_interval: 60,
              },
            },
          },
          logs: {
            logs_collected: {
              files: {
                collect_list: [
                  {
                    file_path: '/var/log/httpd/access_log',
                    log_group_name: `/aws/ec2/httpd/access-${environment}`,
                    log_stream_name: '{instance_id}',
                  },
                  {
                    file_path: '/var/log/httpd/error_log',
                    log_group_name: `/aws/ec2/httpd/error-${environment}`,
                    log_stream_name: '{instance_id}',
                  },
                ],
              },
            },
          },
        },
        null,
        2
      ),
      'EOF',

      // Start CloudWatch agent
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json',

      // Signal CloudFormation that the instance is ready
      `/opt/aws/bin/cfn-signal -e $? --stack ${this.stackName} --resource AutoScalingGroup --region ${this.region}`
    );

    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `tf-launch-template-${environment}`,
      {
        launchTemplateName: `tf-secure-launch-template-${environment}`,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        securityGroup: ec2SecurityGroup,
        role: ec2Role,
        userData: userData,
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
        requireImdsv2: true, // Enforce IMDSv2 for security
      }
    );

    // 7. Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `tf-alb-${environment}`,
      {
        loadBalancerName: `tf-secure-alb-${environment}`,
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // ALB Access Logs
    const albLogsBucket = new s3.Bucket(this, `tf-alb-logs-${environment}`, {
      bucketName: `tf-alb-access-logs-${environment}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    alb.logAccessLogs(albLogsBucket, 'alb-access-logs');

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `tf-target-group-${environment}`,
      {
        targetGroupName: `tf-secure-tg-${environment}`,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        vpc,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          path: '/health.html',
          protocol: elbv2.Protocol.HTTP,
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
        targetType: elbv2.TargetType.INSTANCE,
      }
    );

    // ALB Listener
    const listener = alb.addListener(`tf-listener-${environment}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // 8. Auto Scaling Group
    const asg = new autoscaling.AutoScalingGroup(
      this,
      `tf-asg-${environment}`,
      {
        autoScalingGroupName: `tf-secure-asg-${environment}`,
        vpc,
        launchTemplate,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        minCapacity: 2,
        maxCapacity: 10,
        desiredCapacity: 2,
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(5),
        }),
        signals: autoscaling.Signals.waitForAll({
          timeout: cdk.Duration.minutes(10),
        }),
      }
    );

    // Attach ASG to Target Group
    asg.attachToApplicationTargetGroup(targetGroup);

    // Auto Scaling Policies
    asg.scaleOnCpuUtilization(`tf-cpu-scaling-${environment}`, {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(5),
    });

    // 9. WAF v2 Configuration
    const webAcl = new wafv2.CfnWebACL(this, `tf-waf-${environment}`, {
      name: `tf-secure-waf-${environment}`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric',
          },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'KnownBadInputsRuleSetMetric',
          },
        },
        {
          name: 'RateLimitRule',
          priority: 3,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `tf-waf-metric-${environment}`,
      },
    });

    // Associate WAF with ALB
    new wafv2.CfnWebACLAssociation(this, `tf-waf-association-${environment}`, {
      resourceArn: alb.loadBalancerArn,
      webAclArn: webAcl.attrArn,
    });

    // 10. CloudWatch Alarms and Monitoring
    const httpCodeTarget4xxAlarm = new cloudwatch.Alarm(
      this,
      `tf-4xx-alarm-${environment}`,
      {
        alarmName: `tf-ALB-4xx-errors-${environment}`,
        metric: targetGroup.metricHttpCodeTarget(
          elbv2.HttpCodeTarget.TARGET_4XX_COUNT
        ),
        threshold: 10,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    const httpCodeTarget5xxAlarm = new cloudwatch.Alarm(
      this,
      `tf-5xx-alarm-${environment}`,
      {
        alarmName: `tf-ALB-5xx-errors-${environment}`,
        metric: targetGroup.metricHttpCodeTarget(
          elbv2.HttpCodeTarget.TARGET_5XX_COUNT
        ),
        threshold: 5,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    const responseTimeAlarm = new cloudwatch.Alarm(
      this,
      `tf-response-time-alarm-${environment}`,
      {
        alarmName: `tf-ALB-response-time-${environment}`,
        metric: targetGroup.metricTargetResponseTime(),
        threshold: 1, // 1 second
        evaluationPeriods: 3,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    // 11. Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the load balancer',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'Name of the S3 bucket',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'WAFWebACLArn', {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });
  }
}
```

## 3. Package Configuration

**package.json**

```json
{
  "name": "secure-web-app-cdk",
  "version": "0.1.0",
  "bin": {
    "secure-web-app-cdk": "bin/app.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "deploy": "cdk deploy",
    "deploy-prod": "cdk deploy --context environment=prod",
    "deploy-staging": "cdk deploy --context environment=staging"
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

**tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["es2020"],
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
    "typeRoots": ["./node_modules/@types"]
  },
  "exclude": ["node_modules", "cdk.out"]
}
```

**cdk.json**

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/app.ts",
  "watch": {
    "include": ["**"],
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
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
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
    "@aws-cdk/aws-normlizedkeys:props": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk/core:stackRelativeExports": true
  }
}
```

## 4. Deployment Instructions

1. **Install dependencies:**

```bash
npm install
```

2. **Build the project:**

```bash
npm run build
```

3. **Bootstrap CDK (if not done before):**

```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
```

4. **Deploy the stack:**

```bash
# For production environment
npm run deploy-prod

# Or for staging environment
npm run deploy-staging

# Or with custom environment
cdk deploy --context environment=dev
```

## 5. Security Features Implemented

### ✅ **Network Security:**

- VPC with proper subnet isolation
- Security groups with least privilege access
- VPC Flow Logs for monitoring
- NAT Gateways for outbound internet access from private subnets

### ✅ **Compute Security:**

- No SSH access - SSM Session Manager only
- IMDSv2 enforcement
- Encrypted EBS volumes
- Latest Amazon Linux 2023 AMI
- Proper IAM roles with minimal permissions

### ✅ **Data Security:**

- S3 bucket with KMS encryption
- Versioning enabled
- Block public access
- SSL enforcement
- Access logging

### ✅ **Application Security:**

- WAF v2 with managed rule sets
- Rate limiting
- ALB with security groups
- Health checks

### ✅ **Monitoring & Logging:**

- CloudWatch alarms for key metrics
- VPC Flow Logs
- ALB access logs
- Application logs via CloudWatch agent

### ✅ **Encryption:**

- KMS key with automatic rotation
- Encrypted storage (S3, EBS)
- Secure key policies

## 6. Post-Deployment Steps

1. **Verify the deployment:**

```bash
# Check the ALB DNS name from outputs
curl http://ALB-DNS-NAME/health.html
```

2. **Access instances via SSM:**

```bash
aws ssm start-
```
