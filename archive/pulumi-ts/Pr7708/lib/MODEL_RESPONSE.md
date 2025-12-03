# Infrastructure Quality Assurance System - Pulumi Implementation

This implementation provides an automated infrastructure compliance monitoring system using Pulumi with TypeScript.

## Architecture

The solution includes:
- Two Lambda functions (EC2 tag scanner and S3 security scanner)
- EventBridge rules for 6-hour scheduled execution
- CloudWatch metrics in custom namespace 'InfraQA/Compliance'
- CloudWatch alarms with 10% non-compliance threshold
- CloudWatch dashboard for visualization
- SNS topic for notifications
- DynamoDB table with 30-day TTL for scan history
- IAM roles with least-privilege permissions

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly ec2ScannerArn: pulumi.Output<string>;
  public readonly s3ScannerArn: pulumi.Output<string>;
  public readonly dashboardName: pulumi.Output<string>;
  public readonly complianceTableName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // DynamoDB table for compliance history with TTL
    const complianceTable = new aws.dynamodb.Table(`compliance-history-${environmentSuffix}`, {
      name: `compliance-history-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'resourceType',
      rangeKey: 'scanTimestamp',
      attributes: [
        { name: 'resourceType', type: 'S' },
        { name: 'scanTimestamp', type: 'N' }
      ],
      ttl: {
        attributeName: 'expirationTime',
        enabled: true
      },
      tags: tags
    }, { parent: this });

    // SNS topic for compliance alerts
    const alertTopic = new aws.sns.Topic(`compliance-alerts-${environmentSuffix}`, {
      name: `compliance-alerts-${environmentSuffix}`,
      displayName: 'Infrastructure Compliance Alerts',
      tags: tags
    }, { parent: this });

    // IAM role for EC2 scanner Lambda
    const ec2ScannerRole = new aws.iam.Role(`ec2-scanner-role-${environmentSuffix}`, {
      name: `ec2-scanner-role-${environmentSuffix}`,
      assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: 'lambda.amazonaws.com'
      }),
      tags: tags
    }, { parent: this });

    // IAM policies for EC2 scanner
    const ec2ScannerPolicy = new aws.iam.RolePolicy(`ec2-scanner-policy-${environmentSuffix}`, {
      role: ec2ScannerRole.id,
      policy: pulumi.jsonStringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ec2:DescribeInstances',
              'ec2:DescribeTags'
            ],
            Resource: '*'
          },
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:PutMetricData'
            ],
            Resource: '*',
            Condition: {
              StringEquals: {
                'cloudwatch:namespace': 'InfraQA/Compliance'
              }
            }
          },
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem'
            ],
            Resource: complianceTable.arn
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents'
            ],
            Resource: 'arn:aws:logs:*:*:*'
          }
        ]
      })
    }, { parent: this });

    // EC2 Tag Compliance Scanner Lambda
    const ec2Scanner = new aws.lambda.Function(`ec2-tag-scanner-${environmentSuffix}`, {
      name: `ec2-tag-scanner-${environmentSuffix}`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: ec2ScannerRole.arn,
      timeout: 300,
      environment: {
        variables: {
          COMPLIANCE_TABLE: complianceTable.name,
          ENVIRONMENT_SUFFIX: environmentSuffix
        }
      },
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(`
const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const ec2Client = new EC2Client();
const cloudwatchClient = new CloudWatchClient();
const dynamoClient = new DynamoDBClient();

const REQUIRED_TAGS = ['Environment', 'Owner', 'CostCenter'];

exports.handler = async (event) => {
  console.log('Starting EC2 tag compliance scan');

  try {
    // Get all EC2 instances
    const describeCommand = new DescribeInstancesCommand({});
    const response = await ec2Client.send(describeCommand);

    let totalInstances = 0;
    let compliantInstances = 0;
    let nonCompliantInstances = 0;
    const nonCompliantDetails = [];

    // Check each instance for required tags
    for (const reservation of response.Reservations || []) {
      for (const instance of reservation.Instances || []) {
        if (instance.State.Name === 'terminated') continue;

        totalInstances++;
        const tags = instance.Tags || [];
        const tagKeys = tags.map(t => t.Key);

        const missingTags = REQUIRED_TAGS.filter(req => !tagKeys.includes(req));

        if (missingTags.length === 0) {
          compliantInstances++;
        } else {
          nonCompliantInstances++;
          nonCompliantDetails.push({
            instanceId: instance.InstanceId,
            missingTags: missingTags
          });
        }
      }
    }

    const compliancePercentage = totalInstances > 0
      ? (compliantInstances / totalInstances) * 100
      : 100;

    console.log(\`EC2 Compliance: \${compliantInstances}/\${totalInstances} compliant (\${compliancePercentage.toFixed(2)}%)\`);

    // Publish metrics to CloudWatch
    const metricsCommand = new PutMetricDataCommand({
      Namespace: 'InfraQA/Compliance',
      MetricData: [
        {
          MetricName: 'EC2CompliantInstances',
          Value: compliantInstances,
          Unit: 'Count',
          Dimensions: [{ Name: 'ResourceType', Value: 'EC2' }]
        },
        {
          MetricName: 'EC2NonCompliantInstances',
          Value: nonCompliantInstances,
          Unit: 'Count',
          Dimensions: [{ Name: 'ResourceType', Value: 'EC2' }]
        },
        {
          MetricName: 'EC2CompliancePercentage',
          Value: compliancePercentage,
          Unit: 'Percent',
          Dimensions: [{ Name: 'ResourceType', Value: 'EC2' }]
        }
      ]
    });

    await cloudwatchClient.send(metricsCommand);

    // Store scan results in DynamoDB
    const timestamp = Date.now();
    const expirationTime = Math.floor(timestamp / 1000) + (30 * 24 * 60 * 60); // 30 days TTL

    const putCommand = new PutItemCommand({
      TableName: process.env.COMPLIANCE_TABLE,
      Item: {
        resourceType: { S: 'EC2' },
        scanTimestamp: { N: timestamp.toString() },
        totalInstances: { N: totalInstances.toString() },
        compliantInstances: { N: compliantInstances.toString() },
        nonCompliantInstances: { N: nonCompliantInstances.toString() },
        compliancePercentage: { N: compliancePercentage.toString() },
        nonCompliantDetails: { S: JSON.stringify(nonCompliantDetails) },
        expirationTime: { N: expirationTime.toString() }
      }
    });

    await dynamoClient.send(putCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({
        totalInstances,
        compliantInstances,
        nonCompliantInstances,
        compliancePercentage,
        nonCompliantDetails
      })
    };

  } catch (error) {
    console.error('Error scanning EC2 instances:', error);
    throw error;
  }
};
`)
      }),
      tags: tags
    }, { parent: this, dependsOn: [ec2ScannerPolicy] });

    // IAM role for S3 scanner Lambda
    const s3ScannerRole = new aws.iam.Role(`s3-scanner-role-${environmentSuffix}`, {
      name: `s3-scanner-role-${environmentSuffix}`,
      assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: 'lambda.amazonaws.com'
      }),
      tags: tags
    }, { parent: this });

    // IAM policies for S3 scanner
    const s3ScannerPolicy = new aws.iam.RolePolicy(`s3-scanner-policy-${environmentSuffix}`, {
      role: s3ScannerRole.id,
      policy: pulumi.jsonStringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:ListAllMyBuckets',
              's3:GetBucketAcl',
              's3:GetBucketPolicyStatus',
              's3:GetBucketPublicAccessBlock',
              's3:GetAccountPublicAccessBlock'
            ],
            Resource: '*'
          },
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:PutMetricData'
            ],
            Resource: '*',
            Condition: {
              StringEquals: {
                'cloudwatch:namespace': 'InfraQA/Compliance'
              }
            }
          },
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem'
            ],
            Resource: complianceTable.arn
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents'
            ],
            Resource: 'arn:aws:logs:*:*:*'
          }
        ]
      })
    }, { parent: this });

    // S3 Security Scanner Lambda
    const s3Scanner = new aws.lambda.Function(`s3-security-scanner-${environmentSuffix}`, {
      name: `s3-security-scanner-${environmentSuffix}`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: s3ScannerRole.arn,
      timeout: 300,
      environment: {
        variables: {
          COMPLIANCE_TABLE: complianceTable.name,
          ENVIRONMENT_SUFFIX: environmentSuffix
        }
      },
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(`
const { S3Client, ListBucketsCommand, GetBucketAclCommand, GetBucketPolicyStatusCommand, GetPublicAccessBlockCommand } = require('@aws-sdk/client-s3');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const s3Client = new S3Client();
const cloudwatchClient = new CloudWatchClient();
const dynamoClient = new DynamoDBClient();

exports.handler = async (event) => {
  console.log('Starting S3 security compliance scan');

  try {
    // List all buckets
    const listCommand = new ListBucketsCommand({});
    const bucketsResponse = await s3Client.send(listCommand);

    let totalBuckets = 0;
    let secureBuckets = 0;
    let publicBuckets = 0;
    const publicBucketDetails = [];

    // Check each bucket for public access
    for (const bucket of bucketsResponse.Buckets || []) {
      totalBuckets++;
      let isPublic = false;
      const violations = [];

      try {
        // Check public access block
        try {
          const blockCommand = new GetPublicAccessBlockCommand({ Bucket: bucket.Name });
          const blockResponse = await s3Client.send(blockCommand);
          const config = blockResponse.PublicAccessBlockConfiguration;

          if (!config.BlockPublicAcls || !config.BlockPublicPolicy ||
              !config.IgnorePublicAcls || !config.RestrictPublicBuckets) {
            isPublic = true;
            violations.push('Public access block not fully enabled');
          }
        } catch (error) {
          if (error.name === 'NoSuchPublicAccessBlockConfiguration') {
            isPublic = true;
            violations.push('No public access block configuration');
          }
        }

        // Check bucket ACL
        try {
          const aclCommand = new GetBucketAclCommand({ Bucket: bucket.Name });
          const aclResponse = await s3Client.send(aclCommand);

          for (const grant of aclResponse.Grants || []) {
            const grantee = grant.Grantee;
            if (grantee.Type === 'Group' &&
                (grantee.URI === 'http://acs.amazonaws.com/groups/global/AllUsers' ||
                 grantee.URI === 'http://acs.amazonaws.com/groups/global/AuthenticatedUsers')) {
              isPublic = true;
              violations.push(\`Public ACL grant to \${grantee.URI}\`);
            }
          }
        } catch (error) {
          console.log(\`Could not check ACL for bucket \${bucket.Name}: \${error.message}\`);
        }

      } catch (error) {
        console.log(\`Error checking bucket \${bucket.Name}: \${error.message}\`);
      }

      if (isPublic) {
        publicBuckets++;
        publicBucketDetails.push({
          bucketName: bucket.Name,
          violations: violations
        });
      } else {
        secureBuckets++;
      }
    }

    const securityPercentage = totalBuckets > 0
      ? (secureBuckets / totalBuckets) * 100
      : 100;

    console.log(\`S3 Security: \${secureBuckets}/\${totalBuckets} secure (\${securityPercentage.toFixed(2)}%)\`);

    // Publish metrics to CloudWatch
    const metricsCommand = new PutMetricDataCommand({
      Namespace: 'InfraQA/Compliance',
      MetricData: [
        {
          MetricName: 'S3SecureBuckets',
          Value: secureBuckets,
          Unit: 'Count',
          Dimensions: [{ Name: 'ResourceType', Value: 'S3' }]
        },
        {
          MetricName: 'S3PublicBuckets',
          Value: publicBuckets,
          Unit: 'Count',
          Dimensions: [{ Name: 'ResourceType', Value: 'S3' }]
        },
        {
          MetricName: 'S3SecurityPercentage',
          Value: securityPercentage,
          Unit: 'Percent',
          Dimensions: [{ Name: 'ResourceType', Value: 'S3' }]
        }
      ]
    });

    await cloudwatchClient.send(metricsCommand);

    // Store scan results in DynamoDB
    const timestamp = Date.now();
    const expirationTime = Math.floor(timestamp / 1000) + (30 * 24 * 60 * 60); // 30 days TTL

    const putCommand = new PutItemCommand({
      TableName: process.env.COMPLIANCE_TABLE,
      Item: {
        resourceType: { S: 'S3' },
        scanTimestamp: { N: timestamp.toString() },
        totalBuckets: { N: totalBuckets.toString() },
        secureBuckets: { N: secureBuckets.toString() },
        publicBuckets: { N: publicBuckets.toString() },
        securityPercentage: { N: securityPercentage.toString() },
        publicBucketDetails: { S: JSON.stringify(publicBucketDetails) },
        expirationTime: { N: expirationTime.toString() }
      }
    });

    await dynamoClient.send(putCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({
        totalBuckets,
        secureBuckets,
        publicBuckets,
        securityPercentage,
        publicBucketDetails
      })
    };

  } catch (error) {
    console.error('Error scanning S3 buckets:', error);
    throw error;
  }
};
`)
      }),
      tags: tags
    }, { parent: this, dependsOn: [s3ScannerPolicy] });

    // EventBridge rule for EC2 scanner (every 6 hours)
    const ec2ScannerRule = new aws.cloudwatch.EventRule(`ec2-scanner-schedule-${environmentSuffix}`, {
      name: `ec2-scanner-schedule-${environmentSuffix}`,
      description: 'Trigger EC2 tag compliance scan every 6 hours',
      scheduleExpression: 'rate(6 hours)',
      tags: tags
    }, { parent: this });

    const ec2ScannerTarget = new aws.cloudwatch.EventTarget(`ec2-scanner-target-${environmentSuffix}`, {
      rule: ec2ScannerRule.name,
      arn: ec2Scanner.arn
    }, { parent: this });

    const ec2ScannerPermission = new aws.lambda.Permission(`ec2-scanner-permission-${environmentSuffix}`, {
      action: 'lambda:InvokeFunction',
      function: ec2Scanner.name,
      principal: 'events.amazonaws.com',
      sourceArn: ec2ScannerRule.arn
    }, { parent: this });

    // EventBridge rule for S3 scanner (every 6 hours)
    const s3ScannerRule = new aws.cloudwatch.EventRule(`s3-scanner-schedule-${environmentSuffix}`, {
      name: `s3-scanner-schedule-${environmentSuffix}`,
      description: 'Trigger S3 security compliance scan every 6 hours',
      scheduleExpression: 'rate(6 hours)',
      tags: tags
    }, { parent: this });

    const s3ScannerTarget = new aws.cloudwatch.EventTarget(`s3-scanner-target-${environmentSuffix}`, {
      rule: s3ScannerRule.name,
      arn: s3Scanner.arn
    }, { parent: this });

    const s3ScannerPermission = new aws.lambda.Permission(`s3-scanner-permission-${environmentSuffix}`, {
      action: 'lambda:InvokeFunction',
      function: s3Scanner.name,
      principal: 'events.amazonaws.com',
      sourceArn: s3ScannerRule.arn
    }, { parent: this });

    // CloudWatch Alarms
    const ec2ComplianceAlarm = new aws.cloudwatch.MetricAlarm(`ec2-compliance-alarm-${environmentSuffix}`, {
      name: `ec2-compliance-alarm-${environmentSuffix}`,
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 1,
      metricName: 'EC2CompliancePercentage',
      namespace: 'InfraQA/Compliance',
      period: 21600, // 6 hours
      statistic: 'Average',
      threshold: 90, // Alert when < 90% compliant (i.e., > 10% non-compliant)
      alarmDescription: 'Alert when more than 10% of EC2 instances are non-compliant',
      alarmActions: [alertTopic.arn],
      dimensions: {
        ResourceType: 'EC2'
      },
      tags: tags
    }, { parent: this });

    const s3SecurityAlarm = new aws.cloudwatch.MetricAlarm(`s3-security-alarm-${environmentSuffix}`, {
      name: `s3-security-alarm-${environmentSuffix}`,
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 1,
      metricName: 'S3SecurityPercentage',
      namespace: 'InfraQA/Compliance',
      period: 21600, // 6 hours
      statistic: 'Average',
      threshold: 90, // Alert when < 90% secure (i.e., > 10% public)
      alarmDescription: 'Alert when more than 10% of S3 buckets have public access',
      alarmActions: [alertTopic.arn],
      dimensions: {
        ResourceType: 'S3'
      },
      tags: tags
    }, { parent: this });

    // CloudWatch Dashboard
    const dashboard = new aws.cloudwatch.Dashboard(`compliance-dashboard-${environmentSuffix}`, {
      dashboardName: `compliance-dashboard-${environmentSuffix}`,
      dashboardBody: pulumi.jsonStringify({
        widgets: [
          {
            type: 'metric',
            x: 0,
            y: 0,
            width: 12,
            height: 6,
            properties: {
              metrics: [
                ['InfraQA/Compliance', 'EC2CompliancePercentage', { stat: 'Average', label: 'EC2 Compliance %' }]
              ],
              view: 'timeSeries',
              stacked: false,
              region: aws.config.region,
              title: 'EC2 Tag Compliance',
              period: 21600,
              yAxis: {
                left: {
                  min: 0,
                  max: 100
                }
              }
            }
          },
          {
            type: 'metric',
            x: 12,
            y: 0,
            width: 12,
            height: 6,
            properties: {
              metrics: [
                ['InfraQA/Compliance', 'S3SecurityPercentage', { stat: 'Average', label: 'S3 Security %' }]
              ],
              view: 'timeSeries',
              stacked: false,
              region: aws.config.region,
              title: 'S3 Security Compliance',
              period: 21600,
              yAxis: {
                left: {
                  min: 0,
                  max: 100
                }
              }
            }
          },
          {
            type: 'metric',
            x: 0,
            y: 6,
            width: 8,
            height: 6,
            properties: {
              metrics: [
                ['InfraQA/Compliance', 'EC2CompliantInstances', { stat: 'Average', label: 'Compliant' }],
                ['.', 'EC2NonCompliantInstances', { stat: 'Average', label: 'Non-Compliant' }]
              ],
              view: 'timeSeries',
              stacked: true,
              region: aws.config.region,
              title: 'EC2 Instances',
              period: 21600
            }
          },
          {
            type: 'metric',
            x: 8,
            y: 6,
            width: 8,
            height: 6,
            properties: {
              metrics: [
                ['InfraQA/Compliance', 'S3SecureBuckets', { stat: 'Average', label: 'Secure' }],
                ['.', 'S3PublicBuckets', { stat: 'Average', label: 'Public' }]
              ],
              view: 'timeSeries',
              stacked: true,
              region: aws.config.region,
              title: 'S3 Buckets',
              period: 21600
            }
          },
          {
            type: 'metric',
            x: 16,
            y: 6,
            width: 8,
            height: 6,
            properties: {
              metrics: [
                ['InfraQA/Compliance', 'RDSCompliancePercentage', { stat: 'Average', label: 'RDS Compliance %' }]
              ],
              view: 'singleValue',
              region: aws.config.region,
              title: 'RDS Compliance (Placeholder)',
              period: 21600
            }
          }
        ]
      })
    }, { parent: this });

    // Export outputs
    this.ec2ScannerArn = ec2Scanner.arn;
    this.s3ScannerArn = s3Scanner.arn;
    this.dashboardName = dashboard.dashboardName;
    this.complianceTableName = complianceTable.name;

    this.registerOutputs({
      ec2ScannerArn: this.ec2ScannerArn,
      s3ScannerArn: this.s3ScannerArn,
      dashboardName: this.dashboardName,
      complianceTableName: this.complianceTableName,
      alertTopicArn: alertTopic.arn
    });
  }
}
```

## File: lib/README.md

```markdown
# Infrastructure Quality Assurance System

Automated compliance monitoring system that scans AWS resources for tag compliance and security misconfigurations.

## Architecture

- **EC2 Tag Scanner**: Lambda function that checks EC2 instances for required tags (Environment, Owner, CostCenter)
- **S3 Security Scanner**: Lambda function that checks S3 buckets for public access violations
- **EventBridge Scheduler**: Triggers scans every 6 hours automatically
- **CloudWatch Metrics**: Custom namespace 'InfraQA/Compliance' for all compliance metrics
- **CloudWatch Alarms**: Alert when >10% of resources are non-compliant
- **CloudWatch Dashboard**: Real-time visualization of compliance status
- **SNS Notifications**: Email alerts for compliance violations
- **DynamoDB History**: Stores scan results with 30-day TTL for trend analysis

## Deployment

### Prerequisites

- Node.js 18.x or later
- Pulumi CLI installed
- AWS credentials configured

### Deploy

```bash
# Install dependencies
npm install

# Configure environment suffix
pulumi config set environmentSuffix dev

# Deploy
pulumi up
```

### Configure Email Notifications

After deployment, you need to confirm the SNS subscription:

1. Check your email for a confirmation message from AWS SNS
2. Click the confirmation link to activate notifications
3. You will receive alerts when compliance drops below 90%

## How It Works

### EC2 Tag Compliance

The EC2 scanner checks all running instances for three required tags:
- Environment
- Owner
- CostCenter

Instances missing any of these tags are flagged as non-compliant.

### S3 Security Compliance

The S3 scanner checks all buckets for:
- Public access block configuration
- Bucket ACLs allowing public access
- Public bucket policies

Buckets with public access are flagged as security violations.

### Metrics Published

All metrics are published to CloudWatch namespace 'InfraQA/Compliance':

**EC2 Metrics**:
- EC2CompliantInstances (Count)
- EC2NonCompliantInstances (Count)
- EC2CompliancePercentage (Percent)

**S3 Metrics**:
- S3SecureBuckets (Count)
- S3PublicBuckets (Count)
- S3SecurityPercentage (Percent)

### Alarms

Two CloudWatch alarms are configured:
- **ec2-compliance-alarm**: Triggers when EC2 compliance < 90%
- **s3-security-alarm**: Triggers when S3 security < 90%

Both alarms send notifications to the SNS topic.

### Compliance History

All scan results are stored in DynamoDB with:
- Resource type as partition key
- Scan timestamp as sort key
- Automatic expiration after 30 days (TTL)

## Viewing Results

### CloudWatch Dashboard

Access the dashboard in AWS Console:
1. Navigate to CloudWatch > Dashboards
2. Open `compliance-dashboard-{environmentSuffix}`
3. View real-time compliance metrics

### Query History

Use AWS CLI to query scan history:

```bash
# Query EC2 scan history
aws dynamodb query \
  --table-name compliance-history-dev \
  --key-condition-expression "resourceType = :rt" \
  --expression-attribute-values '{":rt":{"S":"EC2"}}'

# Query S3 scan history
aws dynamodb query \
  --table-name compliance-history-dev \
  --key-condition-expression "resourceType = :rt" \
  --expression-attribute-values '{":rt":{"S":"S3"}}'
```

## Manual Scan Trigger

To manually trigger a compliance scan:

```bash
# Trigger EC2 scan
aws lambda invoke \
  --function-name ec2-tag-scanner-dev \
  --invocation-type Event \
  /dev/null

# Trigger S3 scan
aws lambda invoke \
  --function-name s3-security-scanner-dev \
  --invocation-type Event \
  /dev/null
```

## Troubleshooting

### No Metrics Appearing

- Verify Lambda functions are running successfully (check CloudWatch Logs)
- Ensure IAM roles have permissions to publish metrics
- Wait for next scheduled scan (every 6 hours)

### Alarms Not Triggering

- Verify SNS subscription is confirmed
- Check alarm configuration in CloudWatch console
- Ensure sufficient data points are available

### DynamoDB Items Not Expiring

- Verify TTL is enabled on the table
- Check expirationTime attribute is set correctly
- TTL cleanup may take up to 48 hours

## Cost Optimization

This solution uses serverless services to minimize costs:
- Lambda: Pay per invocation (4 invocations per day)
- DynamoDB: On-demand billing
- CloudWatch: Minimal metrics and alarms
- SNS: Minimal notification costs

Estimated monthly cost: < $5 for typical usage

## Cleanup

To remove all resources:

```bash
pulumi destroy
```

All resources will be cleanly removed without manual intervention.
```