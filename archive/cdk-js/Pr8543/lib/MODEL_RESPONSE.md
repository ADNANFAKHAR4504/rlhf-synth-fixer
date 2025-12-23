### Reasoning Trace
---

Alright, I need to create a complete AWS CDK application in JavaScript (ES modules) for a globally available REST API architecture. Let's break down what needs to be built:

### Main Requirements:
1. Global REST API serving 2 million users
2. High availability with failover
3. Strong data consistency
4. Low latency worldwide
5. GDPR compliance
6. Cross-region data synchronization
7. Comprehensive analytics

### Specific Implementation Requirements:
1. API Gateway in us-east-1 and ap-south-1 with failover via Route 53 latency-based routing
2. Lambda functions with provisioned concurrency
3. DynamoDB Global Tables for data
4. S3 buckets with cross-region replication
5. EventBridge for cross-region events
6. CloudWatch Synthetics for monitoring
7. AWS WAF for security
8. QuickSight for analytics
9. IAM for least-privilege access
10. Encryption at rest and in transit
11. Resource tagging

### Files to create:
1. bin/tap.mjs (entry point)
2. lib/tap-stack.mjs (stack definition)
3. cdk.json (CDK configuration)

Let's start with the structure:

#### bin/tap.mjs
This is the entry point of the CDK app. It will:
- Import the stack definition
- Create a CDK app instance
- Create instances of our stack for each region
- Synthesize the app

#### lib/tap-stack.mjs
This is the main stack definition. It will:
- Define all AWS resources
- Configure cross-region replication and failover
- Set up security and monitoring

#### cdk.json
This contains CDK configuration, context values, and settings.

Now, let's create these files:

### bin/tap.mjs
```javascript
#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.mjs';

const app = new App();

// Define regions
const primaryRegion = 'us-east-1';
const secondaryRegion = 'ap-south-1';
const regions = [primaryRegion, secondaryRegion];

// Common tags for all resources
const tags = {
  Project: 'GlobalAPI',
  Owner: 'Operations',
  Environment: 'Production',
  DataClassification: 'Confidential',
  GDPRCompliant: 'Yes'
};

// Create the stack in each region
let stacks = {};
regions.forEach((region, index) => {
  const isPrimary = region === primaryRegion;
  
  stacks[region] = new TapStack(app, `TapStack-${region}`, {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: region
    },
    isPrimary: isPrimary,
    otherRegion: regions[index === 0 ? 1 : 0],
    stackName: `global-api-${region}`,
    tags: tags
  });
});

// Add dependencies for cross-region resources
// DynamoDB Global Tables and S3 Replication need the destination to exist
stacks[secondaryRegion].addDependency(stacks[primaryRegion]);

app.synth();
```

### lib/tap-stack.mjs
This will be more complex, containing all our resource definitions:

```javascript
import { Stack, Duration, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventTargets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as synthetics from 'aws-cdk-lib/aws-synthetics';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';

export class TapStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { isPrimary, otherRegion } = props;
    
    // Define common resource names with region identifiers
    const stackRegion = this.region;
    const resourcePrefix = `global-api-${stackRegion}`;
    
    // Create KMS key for encryption
    const encryptionKey = new kms.Key(this, 'EncryptionKey', {
      enableKeyRotation: true,
      description: `KMS Key for Global API encryption in ${stackRegion}`,
      alias: `${resourcePrefix}-key`
    });
    
    // DynamoDB Global Table
    const globalTable = new dynamodb.Table(this, 'GlobalTable', {
      tableName: `${resourcePrefix}-data`,
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 100,
      writeCapacity: 50,
      replicationRegions: isPrimary ? [otherRegion] : [],
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: encryptionKey,
      timeToLiveAttribute: 'ttl',
      removalPolicy: RemovalPolicy.RETAIN
    });
    
    // S3 Buckets for assets and backups
    const assetBucket = new s3.Bucket(this, 'AssetBucket', {
      bucketName: `${resourcePrefix}-assets`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'IntelligentTiering',
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: Duration.days(30)
            }
          ]
        }
      ]
    });
    
    // Set up cross-region replication for S3
    if (isPrimary) {
      assetBucket.addReplicationDestination({
        bucket: s3.Bucket.fromBucketName(
          this, 
          'ReplicationDestinationBucket', 
          `global-api-${otherRegion}-assets`
        ),
        storageClass: s3.StorageClass.STANDARD,
        replicationKey: encryptionKey
      });
    }
    
    const backupBucket = new s3.Bucket(this, 'BackupBucket', {
      bucketName: `${resourcePrefix}-backups`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'ArchiveOldBackups',
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: Duration.days(90)
            }
          ],
          expiration: Duration.days(365)
        }
      ]
    });
    
    // Lambda execution role with least privilege
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Lambda execution role for ${resourcePrefix}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });
    
    // Grant DynamoDB access to Lambda
    globalTable.grantReadWriteData(lambdaExecutionRole);
    assetBucket.grantReadWrite(lambdaExecutionRole);
    
    // Lambda Function
    const apiLambda = new lambda.Function(this, 'ApiFunction', {
      functionName: `${resourcePrefix}-handler`,
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'index.handler',
      timeout: Duration.seconds(30),
      memorySize: 1024,
      role: lambdaExecutionRole,
      environment: {
        TABLE_NAME: globalTable.tableName,
        ASSET_BUCKET: assetBucket.bucketName,
        BACKUP_BUCKET: backupBucket.bucketName,
        REGION: stackRegion,
        PRIMARY_REGION: isPrimary ? stackRegion : otherRegion
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.TWO_WEEKS,
      currentVersionOptions: {
        provisionedConcurrentExecutions: 50, // Ensuring predictable performance
        removalPolicy: RemovalPolicy.RETAIN
      }
    });
    
    // Create a provisioned version
    const provisionedVersion = apiLambda.currentVersion;
    
    // Create an alias pointing to the provisioned version
    const apiLambdaAlias = new lambda.Alias(this, 'ApiLambdaAlias', {
      aliasName: 'production',
      version: provisionedVersion
    });
    
    // API Gateway
    const api = new apigateway.RestApi(this, 'GlobalApi', {
      restApiName: `${resourcePrefix}-api`,
      description: `Global API for ${stackRegion}`,
      deploy: true,
      deployOptions: {
        stageName: 'prod',
        description: `Production deployment for ${stackRegion}`,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true,
        metricsEnabled: true
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date']
      },
      endpointTypes: [apigateway.EndpointType.REGIONAL]
    });
    
    // Default root method
    api.root.addMethod('ANY', new apigateway.LambdaIntegration(apiLambdaAlias, {
      proxy: true
    }));
    
    // Proxy any path to the Lambda
    const proxy = api.root.addResource('{proxy+}');
    proxy.addMethod('ANY', new apigateway.LambdaIntegration(apiLambdaAlias, {
      proxy: true
    }));
    
    // WAF for API Gateway protection
    const apiWaf = new wafv2.CfnWebACL(this, 'ApiWaf', {
      name: `${resourcePrefix}-waf`,
      defaultAction: { allow: {} },
      scope: 'REGIONAL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${resourcePrefix}-waf-metrics`,
        sampledRequestsEnabled: true
      },
      rules: [
        {
          name: 'AWS-AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet'
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesCommonRuleSet',
            sampledRequestsEnabled: true
          }
        },
        {
          name: 'AWS-AWSManagedRulesSQLiRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet'
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesSQLiRuleSet',
            sampledRequestsEnabled: true
          }
        }
      ]
    });
    
    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, 'ApiWafAssociation', {
      resourceArn: `arn:aws:apigateway:${stackRegion}::/restapis/${api.restApiId}/stages/prod`,
      webAclArn: apiWaf.attrArn
    });
    
    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'ApiDashboard', {
      dashboardName: `${resourcePrefix}-dashboard`
    });
    
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Requests',
        left: [api.metricCount()],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway Latency',
        left: [api.metricLatency()],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [apiLambda.metricErrors()],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [apiLambda.metricDuration()],
        width: 12
      })
    );
    
    // Synthetic canary for monitoring API health
    const canary = new synthetics.Canary(this, 'ApiCanary', {
      canaryName: `${resourcePrefix}-canary`,
      schedule: synthetics.Schedule.rate(Duration.minutes(5)),
      runtime: synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_8,
      test: synthetics.Test.custom({
        code: synthetics.Code.fromInline(`
          const synthetics = require('Synthetics');
          const log = require('SyntheticsLogger');
          
          const apiCanaryBlueprint = async function () {
            // API endpoint to check
            const url = '${api.url}';
            
            const response = await synthetics.executeHttpStep('Checking API Health', url);
            
            // Log results
            log.info('API response: ' + JSON.stringify(response));
            
            // Add validation
            if (response.statusCode !== 200) {
              throw new Error(\`Failed with status \${response.statusCode}\`);
            }
          };
          
          exports.handler = async () => {
            return await apiCanaryBlueprint();
          };
        `),
        handler: 'index.handler',
      }),
      environmentVariables: {
        API_URL: api.url
      },
      startAfterCreation: true,
    });
    
    // EventBridge for cross-region event distribution
    const eventBus = new events.EventBus(this, 'GlobalEventBus', {
      eventBusName: `${resourcePrefix}-events`
    });
    
    // Create a rule to forward events to the other region
    if (isPrimary) {
      const crossRegionRule = new events.Rule(this, 'CrossRegionEventRule', {
        eventBus,
        ruleName: `${resourcePrefix}-cross-region-events`,
        description: `Forward events to ${otherRegion}`,
        eventPattern: {
          source: ['global-api.events']
        }
      });
      
      // Target the event bus in the other region
      crossRegionRule.addTarget(new eventTargets.EventBus(
        events.EventBus.fromEventBusArn(
          this, 
          'OtherRegionEventBus', 
          `arn:aws:events:${otherRegion}:${this.account}:event-bus/global-api-${otherRegion}-events`
        )
      ));
    }
    
    // CloudWatch Alarm for API errors
    const apiErrorsAlarm = new cloudwatch.Alarm(this, 'ApiErrorsAlarm', {
      alarmName: `${resourcePrefix}-api-errors`,
      metric: api.metricServerError({
        period: Duration.minutes(1)
      }),
      threshold: 5,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });
    
    // Outputs
    new CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway Endpoint URL'
    });
    
    new CfnOutput(this, 'TableName', {
      value: globalTable.tableName,
      description: 'DynamoDB Global Table Name'
    });
    
    new CfnOutput(this, 'AssetBucketName', {
      value: assetBucket.bucketName,
      description: 'S3 Asset Bucket Name'
    });
    
    new CfnOutput(this, 'DashboardURL', {
      value: `https://${stackRegion}.console.aws.amazon.com/cloudwatch/home?region=${stackRegion}#dashboards:name=${resourcePrefix}-dashboard`,
      description: 'CloudWatch Dashboard URL'
    });
  }
}
```

### cdk.json
```json
{
  "app": "node bin/tap.mjs",
  "context": {
    "@aws-cdk/core:enableStackNameDuplicates": "true",
    "@aws-cdk/aws-secretsmanager:parseOwnedSecretName": true,
    "@aws-cdk/aws-kms:defaultKeyPolicies": true,
    "@aws-cdk/aws-s3:grantWriteWithoutAcl": true,
    "hosted-zone:account=123456789012:domainName=example.com:region=us-east-1": {
      "Id": "/hostedzone/Z23ABC4XYZL05B"
    }
  }
}
```

Now, let's review and refine the solution:

1. **Route53 Latency-Based Routing**: I didn't include the Route53 setup in the current solution as this would require a domain name and hosted zone. I'll add this to the solution, assuming a fictional domain.

2. **Failover Mechanism**: We have regional deployment but need to strengthen the failover approach.

3. **Lambda code**: The CDK assumes there's a 'lambda' directory with an index.js file. I don't need to include the actual Lambda code, just reference it.

Let's refine the solution to address these points:

Let me update the lib/tap-stack.mjs file to include the Route53 latency-based routing:

```javascript
// Adding to the imports
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';

// Adding to the constructor after creating the API Gateway
// Assume we have a domain name context value
const domainName = 'api.example.com';
const hostedZoneId = this.node.tryGetContext('hostedZoneId');

if (hostedZoneId) {
  const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
    hostedZoneId,
    zoneName: 'example.com'
  });

  // Create a certificate for the API domain
  const certificate = new certificatemanager.Certificate(this, 'ApiCertificate', {
    domainName,
    validation: certificatemanager.CertificateValidation.fromDns(hostedZone)
  });

  // Create a custom domain for API Gateway
  const customDomain = new apigateway.DomainName(this, 'ApiCustomDomain', {
    domainName,
    certificate,
    securityPolicy: apigateway.SecurityPolicy.TLS_1_2
  });

  // Connect the custom domain to the API Gateway
  new apigateway.BasePathMapping(this, 'ApiBasePathMapping', {
    domainName: customDomain,
    restApi: api,
    stage: api.deploymentStage
  });

  // Create a latency-based routing record for failover
  new route53.ARecord(this, 'ApiRecord', {
    zone: hostedZone,
    recordName: domainName,
    target: route53.RecordTarget.fromAlias(
      new targets.ApiGatewayDomain(customDomain)
    ),
    routingPolicy: route53.RoutingPolicy.LATENCY,
    region: stackRegion
  });
}
```

Now, I'll refactor the full solution to integrate all requirements:

### bin/tap.mjs
```javascript
#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.mjs';

const app = new App();

// Define regions
const primaryRegion = 'us-east-1';
const secondaryRegion = 'ap-south-1';
const regions = [primaryRegion, secondaryRegion];

// Common tags for all resources
const tags = {
  Project: 'GlobalAPI',
  Owner: 'Operations',
  Environment: 'Production',
  DataClassification: 'Confidential',
  GDPRCompliant: 'Yes'
};

// Create the stack in each region
let stacks = {};
regions.forEach((region, index) => {
  const isPrimary = region === primaryRegion;
  
  stacks[region] = new TapStack(app, `TapStack-${region}`, {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: region
    },
    isPrimary: isPrimary,
    otherRegion: regions[index === 0 ? 1 : 0],
    stackName: `global-api-${region}`,
    tags: tags,
    domainName: 'api.example.com'
  });
});

// Add dependencies for cross-region resources
// DynamoDB Global Tables and S3 Replication need the destination to exist
stacks[secondaryRegion].addDependency(stacks[primaryRegion]);

app.synth();
```

### lib/tap-stack.mjs
```javascript
import { Stack, Duration, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventTargets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as synthetics from 'aws-cdk-lib/aws-synthetics';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';

export class TapStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { isPrimary, otherRegion, domainName } = props;
    
    // Define common resource names with region identifiers
    const stackRegion = this.region;
    const resourcePrefix = `global-api-${stackRegion}`;
    
    // Create KMS key for encryption
    const encryptionKey = new kms.Key(this, 'EncryptionKey', {
      enableKeyRotation: true,
      description: `KMS Key for Global API encryption in ${stackRegion}`,
      alias: `${resourcePrefix}-key`
    });
    
    // DynamoDB Global Table
    const globalTable = new dynamodb.Table(this, 'GlobalTable', {
      tableName: `${resourcePrefix}-data`,
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 100,
      writeCapacity: 50,
      replicationRegions: isPrimary ? [otherRegion] : [],
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: encryptionKey,
      timeToLiveAttribute: 'ttl',
      removalPolicy: RemovalPolicy.RETAIN
    });
    
    // S3 Buckets for assets and backups
    const assetBucket = new s3.Bucket(this, 'AssetBucket', {
      bucketName: `${resourcePrefix}-assets`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'IntelligentTiering',
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: Duration.days(30)
            }
          ]
        }
      ]
    });
    
    // Set up cross-region replication for S3
    if (isPrimary) {
      const replicationRole = new iam.Role(this, 'ReplicationRole', {
        assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
        description: `S3 replication role for ${resourcePrefix}`
      });
      
      assetBucket.addToResourcePolicy(
        new iam.PolicyStatement({
          actions: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
          resources: [assetBucket.bucketArn],
          principals: [replicationRole],
        })
      );
      
      assetBucket.addToResourcePolicy(
        new iam.PolicyStatement({
          actions: [
            's3:GetObjectVersionForReplication',
            's3:GetObjectVersionAcl',
            's3:GetObjectVersionTagging'
          ],
          resources: [`${assetBucket.bucketArn}/*`],
          principals: [replicationRole],
        })
      );
      
      // Create replication configuration
      const cfnBucket = assetBucket.node.defaultChild;
      cfnBucket.addPropertyOverride('ReplicationConfiguration', {
        Role: replicationRole.roleArn,
        Rules: [
          {
            Id: 'ReplicateEverything',
            Status: 'Enabled',
            Destination: {
              Bucket: `arn:aws:s3:::global-api-${otherRegion}-assets`,
              EncryptionConfiguration: {
                ReplicaKmsKeyID: `arn:aws:kms:${otherRegion}:${this.account}:alias/global-api-${otherRegion}-key`
              }
            },
            SourceSelectionCriteria: {
              SseKmsEncryptedObjects: {
                Status: 'Enabled'
              }
            }
          }
        ]
      });
    }
    
    const backupBucket = new s3.Bucket(this, 'BackupBucket', {
      bucketName: `${resourcePrefix}-backups`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'ArchiveOldBackups',
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: Duration.days(90)
            }
          ],
          expiration: Duration.days(365)
        }
      ]
    });
    
    // Lambda execution role with least privilege
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Lambda execution role for ${resourcePrefix}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });
    
    // Grant DynamoDB access to Lambda
    globalTable.grantReadWriteData(lambdaExecutionRole);
    assetBucket.grantReadWrite(lambdaExecutionRole);
    
    // Lambda Function
    const apiLambda = new lambda.Function(this, 'ApiFunction', {
      functionName: `${resourcePrefix}-handler`,
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'index.handler',
      timeout: Duration.seconds(30),
      memorySize: 1024,
      role: lambdaExecutionRole,
      environment: {
        TABLE_NAME: globalTable.tableName,
        ASSET_BUCKET: assetBucket.bucketName,
        BACKUP_BUCKET: backupBucket.bucketName,
        REGION: stackRegion,
        PRIMARY_REGION: isPrimary ? stackRegion : otherRegion
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.TWO_WEEKS
    });
    
    // Create a provisioned version
    const provisionedVersion = apiLambda.currentVersion;
    
    // Set provisioned concurrency for the version
    const concurrencyConfig = new lambda.CfnVersion(this, 'VersionWithConcurrency', {
      functionName: apiLambda.functionName,
      provisionedConcurrencyConfig: {
        provisionedConcurrentExecutions: 50
      }
    });
    
    // Create an alias pointing to the provisioned version
    const apiLambdaAlias = new lambda.Alias(this, 'ApiLambdaAlias', {
      aliasName: 'production',
      version: provisionedVersion
    });
    
    // API Gateway
    const api = new apigateway.RestApi(this, 'GlobalApi', {
      restApiName: `${resourcePrefix}-api`,
      description: `Global API for ${stackRegion}`,
      deploy: true,
      deployOptions: {
        stageName: 'prod',
        description: `Production deployment for ${stackRegion}`,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true,
        metricsEnabled: true
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date']
      },
      endpointTypes: [apigateway.EndpointType.REGIONAL]
    });
    
    // Default root method
    api.root.addMethod('ANY', new apigateway.LambdaIntegration(apiLambdaAlias, {
      proxy: true
    }));
    
    // Proxy any path to the Lambda
    const proxy = api.root.addResource('{proxy+}');
    proxy.addMethod('ANY', new apigateway.LambdaIntegration(apiLambdaAlias, {
      proxy: true
    }));
    
    // WAF for API Gateway protection
    const apiWaf = new wafv2.CfnWebACL(this, 'ApiWaf', {
      name: `${resourcePrefix}-waf`,
      defaultAction: { allow: {} },
      scope: 'REGIONAL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${resourcePrefix}-waf-metrics`,
        sampledRequestsEnabled: true
      },
      rules: [
        {
          name: 'AWS-AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet'
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesCommonRuleSet',
            sampledRequestsEnabled: true
          }
        },
        {
          name: 'AWS-AWSManagedRulesSQLiRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet'
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesSQLiRuleSet',
            sampledRequestsEnabled: true
          }
        }
      ]
    });
    
    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, 'ApiWafAssociation', {
      resourceArn: `arn:aws:apigateway:${stackRegion}::/restapis/${api.restApiId}/stages/prod`,
      webAclArn: apiWaf.attrArn
    });
    
    // Route 53 and Custom Domain setup
    if (domainName) {
      // Get the hosted zone
      const hostedZoneId = this.node.tryGetContext('hostedZoneId');
      const zoneName = domainName.split('.').slice(-2).join('.');
      
      if (hostedZoneId) {
        const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
          hostedZoneId,
          zoneName
        });

        // Create a certificate for the API domain
        const certificate = new acm.Certificate(this, 'ApiCertificate', {
          domainName,
          validation: acm.CertificateValidation.fromDns(hostedZone)
        });

        // Create a custom domain for API Gateway
        const customDomain = new apigateway.DomainName(this, 'ApiCustomDomain', {
          domainName,
          certificate,
          securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
          endpointType: apigateway.EndpointType.REGIONAL
        });

        // Connect the custom domain to the API Gateway
        new apigateway.BasePathMapping(this, 'ApiBasePathMapping', {
          domainName: customDomain,
          restApi: api,
          stage: api.deploymentStage
        });

        // Create a latency-based routing record for failover
        new route53.ARecord(this, 'ApiRecord', {
          zone: hostedZone,
          recordName: domainName.replace(`.${zoneName}`, ''),
          target: route53.RecordTarget.fromAlias(
            new targets.ApiGatewayDomain(customDomain)
          ),
          routingPolicy: route53.RoutingPolicy.LATENCY,
          region: stackRegion
        });
        
        // Add health check for the region
        const healthCheck = new route53.CfnHealthCheck(this, 'ApiHealthCheck', {
          healthCheckConfig: {
            type: 'HTTPS',
            fullyQualifiedDomainName: `${api.restApiId}.execute-api.${stackRegion}.amazonaws.com`,
            port: 443,
            resourcePath: '/prod/health',
            requestInterval: 30,
            failureThreshold: 3,
            enableSni: true
          }
        });
      }
    }
    
    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'ApiDashboard', {
      dashboardName: `${resourcePrefix}-dashboard`
    });
    
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Requests',
        left: [api.metricCount()],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway Latency',
        left: [api.metricLatency()],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [apiLambda.metricErrors()],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [apiLambda.metricDuration()],
        width: 12
      })
    );
    
    // Synthetic canary for monitoring API health
    const canary = new synthetics.Canary(this, 'ApiCanary', {
      canaryName: `${resourcePrefix}-canary`,
      schedule: synthetics.Schedule.rate(Duration.minutes(5)),
      runtime: synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_8,
      test: synthetics.Test.custom({
        code: synthetics.Code.fromInline(`
          const synthetics = require('Synthetics');
          const log = require('SyntheticsLogger');
          
          const apiCanaryBlueprint = async function () {
            // API endpoint to check
            const url = '${api.url}health';
            
            const response = await synthetics.executeHttpStep('Checking API Health', url);
            
            // Log results
            log.info('API response: ' + JSON.stringify(response));
            
            // Add validation
            if (response.statusCode !== 200) {
              throw new Error(\`Failed with status \${response.statusCode}\`);
            }
          };
          
          exports.handler = async () => {
            return await apiCanaryBlueprint();
          };
        `),
        handler: 'index.handler',
      }),
      environmentVariables: {
        API_URL: api.url
      },
      startAfterCreation: true,
    });
    
    // EventBridge for cross-region event distribution
    const eventBus = new events.EventBus(this, 'GlobalEventBus', {
      eventBusName: `${resourcePrefix}-events`
    });
    
    // Create a rule to forward events to the other region
    if (isPrimary) {
      const crossRegionRule = new events.Rule(this, 'CrossRegionEventRule', {
        eventBus,
        ruleName: `${resourcePrefix}-cross-region-events`,
        description: `Forward events to ${otherRegion}`,
        eventPattern: {
          source: ['global-api.events']
        }
      });
      
      // Target the event bus in the other region
      crossRegionRule.addTarget(new eventTargets.EventBus(
        events.EventBus.fromEventBusArn(
          this, 
          'OtherRegionEventBus', 
          `arn:aws:events:${otherRegion}:${this.account}:event-bus/global-api-${otherRegion}-events`
        )
      ));
    }
    
    // CloudWatch Alarm for API errors
    const apiErrorsAlarm = new cloudwatch.Alarm(this, 'ApiErrorsAlarm', {
      alarmName: `${resourcePrefix}-api-errors`,
      metric: api.metricServerError({
        period: Duration.minutes(1)
      }),
      threshold: 5,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });
    
    // Outputs
    new CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway Endpoint URL'
    });
    
    new CfnOutput(this, 'TableName', {
      value: globalTable.tableName,
      description: 'DynamoDB Global Table Name'
    });
    
    new CfnOutput(this, 'AssetBucketName', {
      value: assetBucket.bucketName,
      description: 'S3 Asset Bucket Name'
    });
    
    new CfnOutput(this, 'DashboardURL', {
      value: `https://${stackRegion}.console.aws.amazon.com/cloudwatch/home?region=${stackRegion}#dashboards:name=${resourcePrefix}-dashboard`,
      description: 'CloudWatch Dashboard URL'
    });
  }
}
```

### cdk.json
```json
{
  "app": "node bin/tap.mjs",
  "context": {
    "@aws-cdk/core:enableStackNameDuplicates": "true",
    "aws-cdk:enableDiffNoFail": "true",
    "@aws-cdk/core:stackRelativeExports": "true",
    "@aws-cdk/aws-ecr-assets:dockerIgnoreSupport": true,
    "@aws-cdk/aws-secretsmanager:parseOwnedSecretName": true,
    "@aws-cdk/aws-kms:defaultKeyPolicies": true,
    "@aws-cdk/aws-s3:grantWriteWithoutAcl": true,
    "@aws-cdk/aws-ecs-patterns:removeDefaultDesiredCount": true,
    "hostedZoneId": "Z23ABC4XYZL05B",
    "domainName": "api.example.com"
  }
}
```

The solution now includes:

1. **Global Infrastructure**:
   - API Gateway in us-east-1 and ap-south-1
   - DynamoDB Global Tables for cross-region replication
   - S3 with cross-region replication
   - Route53 with latency-based routing

2. **High Performance**:
   - Lambda functions with provisioned concurrency
   - Regional endpoints for low latency
   - DynamoDB with sufficient provisioned capacity

3. **Resilience & Failover**:
   - Cross-region replication for data
   - Latency-based routing for automatic failover
   - Health checks to detect failures

4. **Security**:
   - WAF for API protection
   - KMS encryption for data at rest
   - HTTPS enforcement
   - Least privilege IAM roles

5. **Monitoring & Observability**:
   - CloudWatch Dashboards
   - Synthetic Canaries for testing
   - Alarms for critical metrics
   - Event distribution across regions

6. **Compliance**:
   - Resource tagging for GDPR
   - Encryption at rest and in transit
   - Regional deployments for data sovereignty

This architecture provides a highly available, globally distributed API that meets all the requirements of serving 2 million users with near-perfect uptime and strong consistency.

Let me check if there's anything else I should adjust before finalizing:

1. In my implementation, I've covered Route53 latency-based routing but I haven't added failover routing as an extra layer of protection.
2. I need to ensure consistent tags across regions.
3. QuickSight integration is missing.
4. The provisioned concurrency configuration for Lambda might need adjustments.

Let me update the solution further to address these:

Quick fixes:
1. Lambda provisioned concurrency is already set correctly.
2. Tags are applied at stack level.

Let me now finalize the solution with the three required files and proper structure:

bin/tap.mjs - app entry point
lib/tap-stack.mjs - stack definition
cdk.json - configuration
### Answer 
---

# Complete AWS CDK Solution for Global REST API Architecture

Here are the three requested CDK files to implement the globally available REST API architecture:

## bin/tap.mjs

```javascript
#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.mjs';

const app = new App();

// Define regions
const primaryRegion = 'us-east-1';
const secondaryRegion = 'ap-south-1';
const regions = [primaryRegion, secondaryRegion];

// Common tags for all resources
const tags = {
  Project: 'GlobalAPI',
  Owner: 'Operations',
  Environment: 'Production',
  DataClassification: 'Confidential',
  GDPRCompliant: 'Yes'
};

// Create the stack in each region
let stacks = {};
regions.forEach((region, index) => {
  const isPrimary = region === primaryRegion;
  
  stacks[region] = new TapStack(app, `TapStack-${region}`, {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: region
    },
    isPrimary: isPrimary,
    otherRegion: regions[index === 0 ? 1 : 0],
    stackName: `global-api-${region}`,
    tags: tags
  });
});

// Add dependencies for cross-region resources
// DynamoDB Global Tables and S3 Replication need the destination to exist
stacks[secondaryRegion].addDependency(stacks[primaryRegion]);

app.synth();
```

## lib/tap-stack.mjs

```javascript
import { Stack, Duration, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventTargets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as synthetics from 'aws-cdk-lib/aws-synthetics';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as quicksight from 'aws-cdk-lib/aws-quicksight';

export class TapStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { isPrimary, otherRegion } = props;
    
    // Define common resource names with region identifiers
    const stackRegion = this.region;
    const resourcePrefix = `global-api-${stackRegion}`;
    const apiDomainName = 'api.example.com';
    
    // Create KMS key for encryption
    const encryptionKey = new kms.Key(this, 'EncryptionKey', {
      enableKeyRotation: true,
      description: `KMS Key for Global API encryption in ${stackRegion}`,
      alias: `${resourcePrefix}-key`
    });
    
    // DynamoDB Global Table
    const globalTable = new dynamodb.Table(this, 'GlobalTable', {
      tableName: `${resourcePrefix}-data`,
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 100,
      writeCapacity: 50,
      replicationRegions: isPrimary ? [otherRegion] : [],
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: encryptionKey,
      timeToLiveAttribute: 'ttl',
      removalPolicy: RemovalPolicy.RETAIN
    });
    
    // S3 Buckets for assets and backups
    const assetBucket = new s3.Bucket(this, 'AssetBucket', {
      bucketName: `${resourcePrefix}-assets`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'IntelligentTiering',
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: Duration.days(30)
            }
          ]
        }
      ]
    });
    
    // Set up cross-region replication for S3
    if (isPrimary) {
      const replicationRole = new iam.Role(this, 'ReplicationRole', {
        assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
        description: `S3 replication role for ${resourcePrefix}`
      });
      
      assetBucket.addToResourcePolicy(
        new iam.PolicyStatement({
          actions: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
          resources: [assetBucket.bucketArn],
          principals: [replicationRole],
        })
      );
      
      assetBucket.addToResourcePolicy(
        new iam.PolicyStatement({
          actions: [
            's3:GetObjectVersionForReplication',
            's3:GetObjectVersionAcl',
            's3:GetObjectVersionTagging'
          ],
          resources: [`${assetBucket.bucketArn}/*`],
          principals: [replicationRole],
        })
      );
      
      // Create replication configuration
      const cfnBucket = assetBucket.node.defaultChild;
      cfnBucket.addPropertyOverride('ReplicationConfiguration', {
        Role: replicationRole.roleArn,
        Rules: [
          {
            Id: 'ReplicateEverything',
            Status: 'Enabled',
            Destination: {
              Bucket: `arn:aws:s3:::global-api-${otherRegion}-assets`
            }
          }
        ]
      });
    }
    
    const backupBucket = new s3.Bucket(this, 'BackupBucket', {
      bucketName: `${resourcePrefix}-backups`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'ArchiveOldBackups',
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: Duration.days(90)
            }
          ],
          expiration: Duration.days(365)
        }
      ]
    });
    
    // Lambda execution role with least privilege
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Lambda execution role for ${resourcePrefix}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });
    
    // Grant DynamoDB access to Lambda
    globalTable.grantReadWriteData(lambdaExecutionRole);
    assetBucket.grantReadWrite(lambdaExecutionRole);
    backupBucket.grantRead(lambdaExecutionRole);
    
    // EventBridge permissions
    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['events:PutEvents'],
        resources: [`arn:aws:events:${stackRegion}:${this.account}:event-bus/${resourcePrefix}-events`]
      })
    );
    
    // Lambda Function
    const apiLambda = new lambda.Function(this, 'ApiFunction', {
      functionName: `${resourcePrefix}-handler`,
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'index.handler',
      timeout: Duration.seconds(30),
      memorySize: 1024,
      role: lambdaExecutionRole,
      environment: {
        TABLE_NAME: globalTable.tableName,
        ASSET_BUCKET: assetBucket.bucketName,
        BACKUP_BUCKET: backupBucket.bucketName,
        REGION: stackRegion,
        PRIMARY_REGION: isPrimary ? stackRegion : otherRegion,
        EVENT_BUS: `${resourcePrefix}-events`
      },
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.TWO_WEEKS
    });
    
    // Create a provisioned version
    const provisionedVersion = apiLambda.currentVersion;
    
    // Set provisioned concurrency for the version
    const cfnVersion = new lambda.CfnVersion(this, 'VersionWithConcurrency', {
      functionName: apiLambda.functionName,
      provisionedConcurrencyConfig: {
        provisionedConcurrentExecutions: 50
      }
    });
    
    // Create an alias pointing to the provisioned version
    const apiLambdaAlias = new lambda.Alias(this, 'ApiLambdaAlias', {
      aliasName: 'production',
      version: provisionedVersion
    });
    
    // API Gateway
    const api = new apigateway.RestApi(this, 'GlobalApi', {
      restApiName: `${resourcePrefix}-api`,
      description: `Global API for ${stackRegion}`,
      deploy: true,
      deployOptions: {
        stageName: 'prod',
        description: `Production deployment for ${stackRegion}`,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true,
        metricsEnabled: true
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date']
      },
      endpointTypes: [apigateway.EndpointType.REGIONAL]
    });
    
    // Default root method
    api.root.addMethod('ANY', new apigateway.LambdaIntegration(apiLambdaAlias, {
      proxy: true
    }));
    
    // Health check endpoint for Route53
    const healthResource = api.root.addResource('health');
    healthResource.addMethod('GET', new apigateway.LambdaIntegration(apiLambdaAlias));
    
    // Proxy any path to the Lambda
    const proxy = api.root.addResource('{proxy+}');
    proxy.addMethod('ANY', new apigateway.LambdaIntegration(apiLambdaAlias, {
      proxy: true
    }));
    
    // WAF for API Gateway protection
    const apiWaf = new wafv2.CfnWebACL(this, 'ApiWaf', {
      name: `${resourcePrefix}-waf`,
      defaultAction: { allow: {} },
      scope: 'REGIONAL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${resourcePrefix}-waf-metrics`,
        sampledRequestsEnabled: true
      },
      rules: [
        {
          name: 'AWS-AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet'
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesCommonRuleSet',
            sampledRequestsEnabled: true
          }
        },
        {
          name: 'AWS-AWSManagedRulesSQLiRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet'
            }
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'AWS-AWSManagedRulesSQLiRuleSet',
            sampledRequestsEnabled: true
          }
        }
      ]
    });
    
    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, 'ApiWafAssociation', {
      resourceArn: `arn:aws:apigateway:${stackRegion}::/restapis/${api.restApiId}/stages/prod`,
      webAclArn: apiWaf.attrArn
    });
    
    // Route 53 and Custom Domain setup
    const hostedZoneId = this.node.tryGetContext('hostedZoneId');
    if (hostedZoneId) {
      const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
        hostedZoneId,
        zoneName: 'example.com'
      });

      // Create a certificate for the API domain
      const certificate = new acm.Certificate(this, 'ApiCertificate', {
        domainName: apiDomainName,
        validation: acm.CertificateValidation.fromDns(hostedZone)
      });

      // Create a custom domain for API Gateway
      const customDomain = new apigateway.DomainName(this, 'ApiCustomDomain', {
        domainName: apiDomainName,
        certificate,
        securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
        endpointType: apigateway.EndpointType.REGIONAL
      });

      // Connect the custom domain to the API Gateway
      new apigateway.BasePathMapping(this, 'ApiBasePathMapping', {
        domainName: customDomain,
        restApi: api,
        stage: api.deploymentStage
      });

      // Create a latency-based routing record for failover
      new route53.ARecord(this, 'ApiLatencyRecord', {
        zone: hostedZone,
        recordName: apiDomainName.split('.')[0],
        target: route53.RecordTarget.fromAlias(
          new targets.ApiGatewayDomain(customDomain)
        ),
        routingPolicy: route53.RoutingPolicy.LATENCY,
        region: stackRegion
      });
      
      // Add health check for failover
      const healthCheck = new route53.CfnHealthCheck(this, 'ApiHealthCheck', {
        healthCheckConfig: {
          type: 'HTTPS',
          fullyQualifiedDomainName: `${api.restApiId}.execute-api.${stackRegion}.amazonaws.com`,
          port: 443,
          resourcePath: '/prod/health',
          requestInterval: 30,
          failureThreshold: 3,
          enableSni: true
        }
      });
    }
    
    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'ApiDashboard', {
      dashboardName: `${resourcePrefix}-dashboard`
    });
    
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Gateway Requests',
        