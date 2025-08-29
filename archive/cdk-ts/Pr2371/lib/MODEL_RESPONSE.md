I'll create a comprehensive AWS CDK application that meets all your requirements. Here's the complete solution:

## Project Structure

First, let's set up the basic project structure:

```bash
mkdir secure-aws-infrastructure
cd secure-aws-infrastructure
npm init -y
npm install aws-cdk-lib constructs
npm install -D @types/node typescript
```

## CDK Stack Implementation

Here's the complete `secure-infra-stack.ts` file:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class SecureInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: {
        region: 'us-west-2',
        account: process.env.CDK_DEFAULT_ACCOUNT,
      },
    });

    // Common tags for all resources
    const commonTags = {
      Environment: 'production',
      Owner: 'infrastructure-team',
    };

    // Apply tags to the entire stack
    cdk.Tags.of(this).add('Environment', commonTags.Environment);
    cdk.Tags.of(this).add('Owner', commonTags.Owner);

    // 1. NETWORKING - Custom VPC Configuration
    const vpc = new ec2.Vpc(this, 'SecureVPC', {
      ipProtocol: ec2.IpProtocol.IPV4_ONLY,
      maxAzs: 3,
      cidr: '10.0.0.0/16',
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      natGateways: 2, // For high availability
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Endpoints for Lambda functions to access AWS services without internet
    vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    vpc.addInterfaceEndpoint('LambdaEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.LAMBDA,
      privateDnsEnabled: true,
    });

    // 2. SECURITY GROUPS
    // Security group for EC2 instances (restrictive inbound access)
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    // Allow SSH access only from trusted IP ranges (replace with your actual IPs)
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'), // Example trusted IP range
      ec2.Port.tcp(22),
      'SSH access from trusted IPs'
    );

    // Allow HTTP/HTTPS from ALB only
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/16'), // VPC CIDR
      ec2.Port.tcp(80),
      'HTTP from VPC'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/16'),
      ec2.Port.tcp(443),
      'HTTPS from VPC'
    );

    // Security group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Security group for RDS instances',
      allowAllOutbound: false,
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'MySQL access from EC2'
    );

    // Security group for Lambda functions
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc,
        description: 'Security group for Lambda functions',
        allowAllOutbound: true,
      }
    );

    // 3. KMS KEYS for encryption
    const rdsKmsKey = new kms.Key(this, 'RDSKMSKey', {
      description: 'KMS key for RDS encryption',
      enableKeyRotation: true,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
        ],
      }),
    });

    const s3KmsKey = new kms.Key(this, 'S3KMSKey', {
      description: 'KMS key for S3 encryption',
      enableKeyRotation: true,
    });

    // 4. IAM ROLES following principle of least privilege

    // EC2 Instance Role
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for EC2 instances with minimal permissions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: ['arn:aws:s3:::secure-app-bucket-*/*'],
            }),
          ],
        }),
      },
    });

    const ec2InstanceProfile = new iam.InstanceProfile(
      this,
      'EC2InstanceProfile',
      {
        role: ec2Role,
      }
    );

    // Lambda Execution Role
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for Lambda functions with VPC access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
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

    // 5. S3 BUCKETS with encryption
    const appBucket = new s3.Bucket(this, 'SecureAppBucket', {
      bucketName: `secure-app-bucket-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3KmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    });

    const logsBucket = new s3.Bucket(this, 'CloudTrailLogsBucket', {
      bucketName: `cloudtrail-logs-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.AES256,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
    });

    // 6. RDS DATABASE with Multi-AZ and encryption
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const database = new rds.DatabaseInstance(this, 'SecureDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_35,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      multiAz: true, // High availability
      storageEncrypted: true,
      storageEncryptionKey: rdsKmsKey,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: true,
      databaseName: 'secureapp',
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        description: 'RDS admin credentials',
        excludeCharacters: '"@/\\\'',
      }),
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      cloudwatchLogsExports: ['error', 'general', 'slow-query'],
    });

    // 7. EC2 INSTANCES with IMDSv2
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      // Configure CloudWatch agent
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify({
        metrics: {
          namespace: 'SecureInfra/EC2',
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
      }),
      'EOF',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'SecureLaunchTemplate',
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        securityGroup: ec2SecurityGroup,
        role: ec2Role,
        userData,
        requireImdsv2: true, // Force IMDSv2
        httpTokens: ec2.LaunchTemplateHttpTokens.REQUIRED,
        httpEndpoint: ec2.LaunchTemplateHttpEndpoint.ENABLED,
        httpPutResponseHopLimit: 2,
      }
    );

    // Create EC2 instances in private subnets
    const ec2Instance1 = new ec2.Instance(this, 'SecureInstance1', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        availabilityZones: [vpc.availabilityZones[0]],
      },
      launchTemplate,
    });

    const ec2Instance2 = new ec2.Instance(this, 'SecureInstance2', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        availabilityZones: [vpc.availabilityZones[1]],
      },
      launchTemplate,
    });

    // 8. LAMBDA FUNCTIONS in private subnets
    const lambdaFunction = new lambda.Function(this, 'SecureLambdaFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import json
import boto3

def handler(event, context):
    # Lambda function running in private subnet
    # Can access RDS and other AWS services through VPC endpoints
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Lambda function executed successfully in private subnet',
            'vpc_config': 'enabled'
        })
    }
      `),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // 9. CLOUDTRAIL for auditing
    const cloudTrail = new cloudtrail.Trail(this, 'SecureCloudTrail', {
      bucket: logsBucket,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      sendToCloudWatchLogs: true,
      cloudWatchLogGroup: new logs.LogGroup(this, 'CloudTrailLogGroup', {
        retention: logs.RetentionDays.ONE_YEAR,
      }),
      eventRuleTargets: [],
    });

    // 10. CLOUDWATCH ALARMS for EC2 CPU monitoring
    const createCpuAlarm = (instance: ec2.Instance, instanceName: string) => {
      return new cloudwatch.Alarm(this, `${instanceName}CpuAlarm`, {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            InstanceId: instance.instanceId,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 80,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `High CPU utilization alarm for ${instanceName}`,
      });
    };

    const cpuAlarm1 = createCpuAlarm(ec2Instance1, 'Instance1');
    const cpuAlarm2 = createCpuAlarm(ec2Instance2, 'Instance2');

    // Additional CloudWatch Alarms for RDS
    const rdsAlarm = new cloudwatch.Alarm(this, 'RDSCpuAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          DBInstanceIdentifier: database.instanceIdentifier,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 75,
      evaluationPeriods: 2,
      alarmDescription: 'High CPU utilization alarm for RDS instance',
    });

    // 11. OUTPUTS
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: appBucket.bucketName,
      description: 'Application S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'Lambda Function Name',
    });
  }
}
```

## Additional Required Files

### `app.ts` (Main CDK App)

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecureInfraStack } from './secure-infra-stack';

const app = new cdk.App();
new SecureInfraStack(app, 'SecureInfraStack', {
  description: 'Secure production-ready infrastructure stack',
});
```

### `cdk.json` (CDK Configuration)

```json
{
  "app": "npx ts-node --prefer-ts-exts app.ts",
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
    "@aws-cdk/core:target": "aws-cdk-lib",
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
    "@aws-cdk/aws-stepfunctions-tasks:enableLoggingConfiguration": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForSourceAction": true
  }
}
```

### `tsconfig.json` (TypeScript Configuration)

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

### `package.json` (Package Configuration)

```json
{
  "name": "secure-aws-infrastructure",
  "version": "0.1.0",
  "bin": {
    "secure-aws-infrastructure": "bin/secure-aws-infrastructure.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "deploy": "cdk deploy",
    "destroy": "cdk destroy",
    "synth": "cdk synth"
  },
  "devDependencies": {
    "@types/jest": "^29.4.0",
    "@types/node": "20.1.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "aws-cdk": "2.100.0",
    "ts-node": "^10.9.1",
    "typescript": "~5.1.6"
  },
  "dependencies": {
    "aws-cdk-lib": "2.100.0",
    "constructs": "^10.0.0",
    "source-map-support": "^0.5.21"
  }
}
```

## Deployment Instructions

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Bootstrap CDK (if not done before):**

   ```bash
   npx cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
   ```

3. **Deploy the stack:**
   ```bash
   npx cdk deploy
   ```

## Key Security Features Implemented

### **Networking**

- Custom VPC with public, private, and isolated subnets
- NAT Gateways for high availability
- VPC endpoints for Lambda functions

### **IAM & Security**

- Principle of least privilege for all roles
- Restrictive security groups
- IMDSv2 enforced on all EC2 instances
- Lambda functions in private subnets

### **Storage & Databases**

- S3 buckets with KMS encryption
- RDS with Multi-AZ and KMS encryption
- Versioning and lifecycle policies

### **Monitoring & Compliance**

- CloudTrail for API auditing
- CloudWatch alarms for CPU monitoring
- Performance insights for RDS

### **Tagging**

- Environment and Owner tags on all resources
- Consistent tagging strategy

This infrastructure follows AWS Well-Architected Framework principles and provides a secure, production-ready foundation that can be extended based on specific application requirements.
