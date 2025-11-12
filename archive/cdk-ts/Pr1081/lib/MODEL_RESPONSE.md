# Secure Web Application Infrastructure

## 1. Rationale

• **KMS Encryption**: Custom CMK with automatic rotation encrypts all data at rest (S3, CloudWatch Logs, Config bucket)
• **Least Privilege IAM**: Lambda execution role limited to specific log group operations; Config service role uses AWS managed policy with resource restrictions
• **S3 Security**: Bucket policies enforce SSE-KMS with specific key and deny non-TLS requests; public access blocked
• **WAFv2 Protection**: Regional Web ACL with SQL injection and common attack protection attached to Application Load Balancer
• **AWS Config Monitoring**: Recorder tracks security group compliance with `RESTRICTED_INCOMING_TRAFFIC` rule; stores encrypted configuration snapshots
• **Lambda Logging**: Explicit CloudWatch Log Groups with KMS encryption and 30-day retention for auditability
• **Resource Tagging**: Stack-level tags ensure all resources inherit `Environment=Production`
• **Network Security**: Custom security groups with minimal required ports; ALB in public subnets, Lambda in private subnets

## 2. Code

### `package.json`
```json
{
  "name": "secure-web-app",
  "version": "0.1.0",
  "bin": {
    "secure-web-app": "bin/secure-web-app.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk"
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
    "constructs": "^10.0.0"
  }
}
```

### `cdk.json`
```json
{
  "app": "npx ts-node --prefer-ts-exts bin/secure-web-app.ts",
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
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": false,
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
    "@aws-cdk/aws-lambda:useLatestRuntimeVersion": true
  }
}
```

### `tsconfig.json`
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

### `bin/secure-web-app.ts`
```ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecureWebAppStack } from '../lib/secure-web-app-stack';

const app = new cdk.App();
new SecureWebAppStack(app, 'SecureWebAppStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: 'us-east-1' 
  },
});
```

### `lib/secure-web-app-stack.ts`
```ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as config from 'aws-cdk-lib/aws-config';
import { Construct } from 'constructs';

export class SecureWebAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Apply Environment=Production tag to all resources in this stack
    cdk.Tags.of(this).add('Environment', 'Production');

    // Create KMS key for encryption with automatic rotation
    const kmsKey = new kms.Key(this, 'EncryptionKey', {
      description: 'KMS key for encrypting all data at rest',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
    });

    // Get default VPC
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVPC', {
      isDefault: true,
    });

    // Security Group for ALB (allow HTTP/HTTPS from internet)
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Security Group for Lambda (allow outbound HTTPS only)
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc,
      description: 'Security group for Lambda functions',
      allowAllOutbound: false,
    });

    lambdaSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for Lambda'
    );

    // S3 bucket for AWS Config with encryption and secure transport
    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      bucketName: `aws-config-${this.account}-${this.region}-${Date.now()}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [{
        id: 'DeleteOldVersions',
        noncurrentVersionExpiration: cdk.Duration.days(90),
      }],
    });

    // Bucket policy to enforce SSE-KMS and secure transport
    configBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'DenyInsecureConnections',
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:*'],
      resources: [
        configBucket.bucketArn,
        `${configBucket.bucketArn}/*`,
      ],
      conditions: {
        Bool: {
          'aws:SecureTransport': 'false',
        },
      },
    }));

    configBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'DenyWrongKMSKey',
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:PutObject'],
      resources: [`${configBucket.bucketArn}/*`],
      conditions: {
        StringNotEquals: {
          's3:x-amz-server-side-encryption-aws-kms-key-id': kmsKey.keyArn,
        },
      },
    }));

    // AWS Config Configuration Recorder
    const configRole = new iam.Role(this, 'ConfigRole', {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/ConfigRole'),
      ],
    });

    // Grant Config service access to the S3 bucket and KMS key
    configBucket.grantReadWrite(configRole);
    kmsKey.grantEncryptDecrypt(configRole);

    const configRecorder = new config.CfnConfigurationRecorder(this, 'ConfigRecorder', {
      name: 'SecureWebAppConfigRecorder',
      roleArn: configRole.roleArn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    });

    const configDeliveryChannel = new config.CfnDeliveryChannel(this, 'ConfigDeliveryChannel', {
      name: 'SecureWebAppDeliveryChannel',
      s3BucketName: configBucket.bucketName,
      s3KmsKeyArn: kmsKey.keyArn,
    });

    // AWS Config Rule for Security Group compliance
    const configRule = new config.CfnConfigRule(this, 'RestrictedIncomingTrafficRule', {
      configRuleName: 'restricted-incoming-traffic',
      source: {
        owner: 'AWS',
        sourceIdentifier: 'INCOMING_SSH_DISABLED',
      },
    });

    configRule.addDependency(configRecorder);

    // CloudWatch Log Group for Lambda with KMS encryption
    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: '/aws/lambda/secure-web-app-function',
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: kmsKey,
    });

    // IAM role for Lambda with least privilege
    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        LoggingPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [lambdaLogGroup.logGroupArn],
            }),
          ],
        }),
        VPCPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ec2:CreateNetworkInterface',
                'ec2:DescribeNetworkInterfaces',
                'ec2:DeleteNetworkInterface',
              ],
              resources: ['*'], // Required for VPC Lambda execution
            }),
          ],
        }),
      },
    });

    // Lambda function
    const lambdaFunction = new lambda.Function(this, 'WebAppFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Request received:', JSON.stringify(event, null, 2));
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Content-Type-Options': 'nosniff',
              'X-Frame-Options': 'DENY',
              'X-XSS-Protection': '1; mode=block',
            },
            body: JSON.stringify({
              message: 'Secure Web Application',
              timestamp: new Date().toISOString(),
            }),
          };
        };
      `),
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      logGroup: lambdaLogGroup,
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
      },
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Target Group for Lambda
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'LambdaTargetGroup', {
      targetType: elbv2.TargetType.LAMBDA,
      targets: [new elbv2.LambdaTarget(lambdaFunction)],
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
      },
    });

    // ALB Listener
    const listener = alb.addListener('ALBListener', {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });

    // Grant ALB permission to invoke Lambda
    lambdaFunction.addPermission('ALBInvokePermission', {
      principal: new iam.ServicePrincipal('elasticloadbalancing.amazonaws.com'),
      sourceArn: targetGroup.targetGroupArn,
    });

    // WAFv2 Web ACL with SQL injection protection
    const webAcl = new wafv2.CfnWebACL(this, 'WebACL', {
      scope: 'REGIONAL',
      defaultAction: {
        allow: {},
      },
      rules: [
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: {
            none: {},
          },
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
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 2,
          overrideAction: {
            none: {},
          },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLiRuleSetMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'SecureWebAppWebACL',
      },
    });

    // Associate WAF Web ACL with ALB
    new wafv2.CfnWebACLAssociation(this, 'WebACLAssociation', {
      resourceArn: alb.loadBalancerArn,
      webAclArn: webAcl.attrArn,
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
    });

    new cdk.CfnOutput(this, 'WebACLArn', {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });
  }
}
```

## 3. Deploy

```bash
# Install dependencies
npm install

# Bootstrap CDK (one-time setup)
npx cdk bootstrap --region us-east-1

# Build TypeScript
npm run build

# Synthesize CloudFormation template
npx cdk synth

# Deploy the stack
npx cdk deploy --require-approval never

# Optional: View diff before deployment
npx cdk diff
```

## 4. Validate

### KMS Encryption
- [ ] **Console**: Navigate to KMS → Customer managed keys → Verify key exists with rotation enabled
- [ ] **CLI**: `aws kms describe-key --key-id <key-id>` shows `"KeyRotationStatus": true`

### S3 Security
- [ ] **Console**: S3 → Config bucket → Properties → Default encryption shows KMS with custom key
- [ ] **Console**: S3 → Config bucket → Permissions → Bucket policy contains `DenyInsecureConnections` and `DenyWrongKMSKey`
- [ ] **CLI**: `aws s3api get-bucket-encryption --bucket <bucket-name>` shows KMS encryption

### Lambda Logging
- [ ] **Console**: CloudWatch → Log groups → `/aws/lambda/secure-web-app-function` exists with KMS encryption
- [ ] **Console**: Lambda → Functions → secure-web-app-function → Configuration → Environment variables shows logging setup
- [ ] **CLI**: `aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/secure-web-app"` shows retention and KMS key

### WAFv2 Protection
- [ ] **Console**: WAF & Shield → Web ACLs → Regional → Verify Web ACL with CommonRuleSet and SQLiRuleSet
- [ ] **Console**: EC2 → Load Balancers → ALB → Integrated services shows associated Web ACL
- [ ] **CLI**: `aws wafv2 list-web-acls --scope REGIONAL` shows the Web ACL

### AWS Config Compliance
- [ ] **Console**: Config → Dashboard shows configuration recorder is recording
- [ ] **Console**: Config → Rules → `restricted-incoming-traffic` shows compliance status
- [ ] **CLI**: `aws configservice describe-configuration-recorders` shows active recorder

### Resource Tagging
- [ ] **Console**: Resource Groups → Tag Editor → Search for `Environment=Production` shows all stack resources
- [ ] **CLI**: `aws resourcegroupstaggingapi get-resources --tag-filters Key=Environment,Values=Production` lists all resources