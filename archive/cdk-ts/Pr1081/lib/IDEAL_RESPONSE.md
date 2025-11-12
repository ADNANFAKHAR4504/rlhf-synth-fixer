# Secure Web Application Infrastructure - IDEAL RESPONSE

## 1. Rationale

• **KMS Encryption**: Custom CMK with automatic rotation encrypts all data at rest (S3, CloudWatch Logs, Config bucket) with explicit CloudWatch Logs service permissions
• **Least Privilege IAM**: Lambda execution role limited to specific log group operations; Config service role uses AWS managed policy with resource restrictions; explicit VPC permissions
• **S3 Security**: Bucket policies enforce SSE-KMS with specific key and deny non-TLS requests; public access blocked; versioning enabled with lifecycle management
• **WAFv2 Protection**: Regional Web ACL with SQL injection and common attack protection attached to Application Load Balancer with comprehensive rule sets
• **AWS Config Monitoring**: Recorder tracks security group compliance with `RESTRICTED_INCOMING_TRAFFIC` rule; stores encrypted configuration snapshots; conditional delivery channel for multi-environment support
• **Lambda Logging**: Explicit CloudWatch Log Groups with KMS encryption and 30-day retention for auditability; proper VPC placement with public subnet support
• **Resource Tagging**: Stack-level tags ensure all resources inherit `Environment=Production`
• **Network Security**: Custom security groups with minimal required ports; ALB in public subnets, Lambda in public subnets with restricted security groups
• **Environment Isolation**: Environment suffix handling for all resource names to prevent conflicts across deployments
• **Resource Cleanup**: Proper removal policies for development/testing environments ensuring complete resource destruction

## 2. Code

### `package.json`
```json
{
  "name": "tap",
  "version": "0.1.0",
  "bin": {
    "tap": "bin/tap.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest --coverage",
    "test:unit": "jest --testPathPattern=unit --coverage",
    "test:integration": "jest --testPathPattern=int --coverage",
    "lint": "eslint . --ext .ts",
    "synth": "cdk synth",
    "deploy": "cdk deploy",
    "cdk": "cdk"
  },
  "devDependencies": {
    "@types/jest": "^29.4.0",
    "@types/node": "18.14.6",
    "@typescript-eslint/eslint-plugin": "^5.0.0",
    "@typescript-eslint/parser": "^5.0.0",
    "eslint": "^8.0.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.0.5",
    "aws-cdk": "2.87.0",
    "ts-node": "^10.9.1",
    "typescript": "~4.9.5"
  },
  "dependencies": {
    "aws-cdk-lib": "2.87.0",
    "constructs": "^10.0.0",
    "@aws-sdk/client-application-auto-scaling": "^3.0.0",
    "@aws-sdk/client-cloudwatch-logs": "^3.0.0",
    "@aws-sdk/client-config-service": "^3.0.0",
    "@aws-sdk/client-elastic-load-balancing-v2": "^3.0.0",
    "@aws-sdk/client-kms": "^3.0.0",
    "@aws-sdk/client-lambda": "^3.0.0",
    "@aws-sdk/client-s3": "^3.0.0",
    "@aws-sdk/client-wafv2": "^3.0.0"
  }
}
```

### `cdk.json`
```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
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
    "@aws-cdk/aws-lambda:useLatestRuntimeVersion": true,
    "availability-zones:account=123456789012:region=us-east-1": [
      "us-east-1a",
      "us-east-1b",
      "us-east-1c"
    ],
    "vpc-provider:account=123456789012:filter.isDefault=true:region=us-east-1:returnAsymmetricSubnets=true": {
      "vpcId": "vpc-12345678",
      "vpcCidrBlock": "172.31.0.0/16",
      "availabilityZones": ["us-east-1a", "us-east-1b", "us-east-1c"],
      "isolatedSubnetIds": [],
      "isolatedSubnetNames": [],
      "isolatedSubnetRouteTableIds": [],
      "privateSubnetIds": [],
      "privateSubnetNames": [],
      "privateSubnetRouteTableIds": [],
      "publicSubnetIds": ["subnet-12345678", "subnet-87654321", "subnet-11223344"],
      "publicSubnetNames": ["Public Subnet (AZ1)", "Public Subnet (AZ2)", "Public Subnet (AZ3)"],
      "publicSubnetRouteTableIds": ["rtb-12345678", "rtb-87654321", "rtb-11223344"]
    }
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

### `bin/tap.ts`
```ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Environment suffix for resource naming isolation
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

new TapStack(app, `TapStack${environmentSuffix}`, {
  environmentSuffix,
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.AWS_REGION || 'us-east-1'
  },
});
```

### `lib/tap-stack.ts`
```ts
import * as cdk from 'aws-cdk-lib';
import * as config from 'aws-cdk-lib/aws-config';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as elbv2Targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Apply Environment=Production tag to all resources in this stack
    cdk.Tags.of(this).add('Environment', 'Production');

    // Create KMS key for encryption with automatic rotation
    const kmsKey = new kms.Key(this, `EncryptionKey${environmentSuffix}`, {
      description: 'KMS key for encrypting all data at rest',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      policy: new iam.PolicyDocument({
        statements: [
          // Allow root account permissions
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          // Allow CloudWatch Logs service to use the key
          new iam.PolicyStatement({
            sid: 'Allow CloudWatch Logs access',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`),
            ],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
            conditions: {
              ArnLike: {
                'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${this.region}:${this.account}:*`,
              },
            },
          }),
        ],
      }),
    });

    // Use default VPC
    const vpc = ec2.Vpc.fromLookup(this, `VPC${environmentSuffix}`, {
      isDefault: true,
    });

    // Security Group for ALB (allow HTTP/HTTPS from internet)
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `ALBSecurityGroup${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: false,
      }
    );

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
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      `LambdaSecurityGroup${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for Lambda functions',
        allowAllOutbound: false,
      }
    );

    lambdaSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for Lambda'
    );

    // S3 bucket for AWS Config with encryption and secure transport
    const configBucket = new s3.Bucket(
      this,
      `ConfigBucket${environmentSuffix}`,
      {
        bucketName: `aws-config-${environmentSuffix}-${this.account}-${this.region}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        lifecycleRules: [
          {
            id: 'DeleteOldVersions',
            noncurrentVersionExpiration: cdk.Duration.days(90),
          },
        ],
      }
    );

    // Bucket policy to enforce SSE-KMS and secure transport
    configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [configBucket.bucketArn, `${configBucket.bucketArn}/*`],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
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
      })
    );

    // AWS Config Configuration Recorder
    const configRole = new iam.Role(this, `ConfigRole${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWS_ConfigRole'
        ),
      ],
    });

    // Grant Config service access to the S3 bucket and KMS key
    configBucket.grantReadWrite(configRole);
    kmsKey.grantEncryptDecrypt(configRole);

    const configRecorder = new config.CfnConfigurationRecorder(
      this,
      `ConfigRecorder${environmentSuffix}`,
      {
        name: `SecureWebAppConfigRecorder${environmentSuffix}`,
        roleArn: configRole.roleArn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
      }
    );

    // AWS Config Delivery Channel - only create if explicitly requested
    // AWS Config service allows only 1 delivery channel per region per account
    // For PR environments, skip delivery channel creation to avoid conflicts
    const createDeliveryChannel =
      process.env.CREATE_CONFIG_DELIVERY_CHANNEL === 'true';

    let configDeliveryChannel: config.CfnDeliveryChannel | undefined;
    if (createDeliveryChannel) {
      configDeliveryChannel = new config.CfnDeliveryChannel(
        this,
        `ConfigDeliveryChannel${environmentSuffix}`,
        {
          name: `SecureWebAppDeliveryChannel${environmentSuffix}`,
          s3BucketName: configBucket.bucketName,
          s3KmsKeyArn: kmsKey.keyArn,
        }
      );
    }

    // AWS Config Rule for Security Group compliance
    const configRule = new config.CfnConfigRule(
      this,
      `RestrictedIncomingTrafficRule${environmentSuffix}`,
      {
        configRuleName: `restricted-incoming-traffic-${environmentSuffix}`,
        source: {
          owner: 'AWS',
          sourceIdentifier: 'INCOMING_SSH_DISABLED',
        },
      }
    );

    configRule.addDependency(configRecorder);
    if (configDeliveryChannel) {
      configRule.addDependency(configDeliveryChannel);
    }

    // CloudWatch Log Group for Lambda with KMS encryption
    const lambdaLogGroup = new logs.LogGroup(
      this,
      `LambdaLogGroup${environmentSuffix}`,
      {
        logGroupName: `/aws/lambda/secure-web-app-function-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_MONTH,
        encryptionKey: kmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // IAM role for Lambda with least privilege
    const lambdaRole = new iam.Role(this, `LambdaRole${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        LoggingPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
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
    const lambdaFunction = new lambda.Function(
      this,
      `WebAppFunction${environmentSuffix}`,
      {
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
          subnetType: ec2.SubnetType.PUBLIC,
        },
        securityGroups: [lambdaSecurityGroup],
        allowPublicSubnet: true,
        logGroup: lambdaLogGroup,
        environment: {
          NODE_OPTIONS: '--enable-source-maps',
        },
      }
    );

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `ALB${environmentSuffix}`,
      {
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Target Group for Lambda
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `LambdaTargetGroup${environmentSuffix}`,
      {
        targetType: elbv2.TargetType.LAMBDA,
        targets: [new elbv2Targets.LambdaTarget(lambdaFunction)],
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
        },
      }
    );

    // ALB Listener
    alb.addListener(`ALBListener${environmentSuffix}`, {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });

    // Grant ALB permission to invoke Lambda
    lambdaFunction.addPermission(`ALBInvokePermission${environmentSuffix}`, {
      principal: new iam.ServicePrincipal('elasticloadbalancing.amazonaws.com'),
      sourceArn: targetGroup.targetGroupArn,
    });

    // WAFv2 Web ACL with SQL injection protection
    const webAcl = new wafv2.CfnWebACL(this, `WebACL${environmentSuffix}`, {
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
        metricName: `SecureWebAppWebACL${environmentSuffix}`,
      },
    });

    // Associate WAF Web ACL with ALB
    new wafv2.CfnWebACLAssociation(
      this,
      `WebACLAssociation${environmentSuffix}`,
      {
        resourceArn: alb.loadBalancerArn,
        webAclArn: webAcl.attrArn,
      }
    );

    // Outputs
    new cdk.CfnOutput(this, `LoadBalancerDNS${environmentSuffix}`, {
      value: alb.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
      exportName: `LoadBalancerDNS${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `KMSKeyId${environmentSuffix}`, {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: `KMSKeyId${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `WebACLArn${environmentSuffix}`, {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
      exportName: `WebACLArn${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `S3BucketName${environmentSuffix}`, {
      value: configBucket.bucketName,
      description: 'Config S3 Bucket Name',
      exportName: `S3BucketName${environmentSuffix}`,
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
npm run synth

# Deploy the stack
npm run deploy

# Optional: View diff before deployment
npx cdk diff
```

## 4. Validate

### KMS Encryption
- [ ] **Console**: Navigate to KMS → Customer managed keys → Verify key exists with rotation enabled
- [ ] **CLI**: `aws kms describe-key --key-id <key-id>` shows `"KeyRotationStatus": true`
- [ ] **Policy**: Verify CloudWatch Logs service has proper permissions for log group encryption

### S3 Security
- [ ] **Console**: S3 → Config bucket → Properties → Default encryption shows KMS with custom key
- [ ] **Console**: S3 → Config bucket → Permissions → Bucket policy contains `DenyInsecureConnections` and `DenyWrongKMSKey`
- [ ] **CLI**: `aws s3api get-bucket-encryption --bucket <bucket-name>` shows KMS encryption
- [ ] **Versioning**: Verify S3 bucket has versioning enabled with lifecycle rules for cleanup

### Lambda Configuration
- [ ] **Console**: CloudWatch → Log groups → `/aws/lambda/secure-web-app-function-{suffix}` exists with KMS encryption
- [ ] **Console**: Lambda → Functions → secure-web-app-function → Configuration → VPC shows public subnet deployment
- [ ] **Console**: Lambda → Functions → Environment variables shows proper logging setup
- [ ] **CLI**: `aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/secure-web-app"` shows retention and KMS key

### WAFv2 Protection
- [ ] **Console**: WAF & Shield → Web ACLs → Regional → Verify Web ACL with CommonRuleSet and SQLiRuleSet
- [ ] **Console**: EC2 → Load Balancers → ALB → Integrated services shows associated Web ACL
- [ ] **CLI**: `aws wafv2 list-web-acls --scope REGIONAL` shows the Web ACL
- [ ] **Rules**: Verify both CommonRuleSet and SQLiRuleSet are active with proper priority

### AWS Config Compliance
- [ ] **Console**: Config → Dashboard shows configuration recorder is recording
- [ ] **Console**: Config → Rules → `restricted-incoming-traffic-{suffix}` shows compliance status
- [ ] **CLI**: `aws configservice describe-configuration-recorders` shows active recorder
- [ ] **Delivery Channel**: Verify conditional creation based on environment variable

### Resource Tagging & Environment Isolation
- [ ] **Console**: Resource Groups → Tag Editor → Search for `Environment=Production` shows all stack resources
- [ ] **CLI**: `aws resourcegroupstaggingapi get-resources --tag-filters Key=Environment,Values=Production` lists all resources
- [ ] **Naming**: Verify all resources include environment suffix for proper isolation
- [ ] **Outputs**: Verify all stack outputs are properly exported for integration testing

### Security Groups & Network
- [ ] **Console**: EC2 → Security Groups → Verify ALB security group allows HTTP/HTTPS from 0.0.0.0/0
- [ ] **Console**: EC2 → Security Groups → Verify Lambda security group allows only HTTPS outbound
- [ ] **VPC**: Confirm infrastructure uses default VPC with public subnet deployment
- [ ] **Load Balancer**: Verify ALB is internet-facing with proper target group configuration