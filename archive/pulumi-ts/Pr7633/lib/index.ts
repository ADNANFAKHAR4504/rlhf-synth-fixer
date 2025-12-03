import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as fs from 'fs';
import * as path from 'path';

const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const region = aws.config.region || 'us-east-1';

// Required tags to check for compliance
const requiredTags = ['Environment', 'Owner', 'CostCenter', 'Project'];

// S3 Bucket for storing compliance reports
const reportsBucket = new aws.s3.Bucket(
  `ec2-compliance-reports-${environmentSuffix}`,
  {
    bucket: `ec2-compliance-reports-${environmentSuffix}`,
    versioning: {
      enabled: true,
    },
    lifecycleRules: [
      {
        enabled: true,
        noncurrentVersionExpiration: {
          days: 90,
        },
      },
    ],
    tags: {
      Name: `ec2-compliance-reports-${environmentSuffix}`,
      Purpose: 'EC2 Tag Compliance Reports',
    },
  }
);

// SNS Topic for compliance alerts
const complianceTopic = new aws.sns.Topic(
  `ec2-compliance-alerts-${environmentSuffix}`,
  {
    name: `ec2-compliance-alerts-${environmentSuffix}`,
    displayName: 'EC2 Tag Compliance Alerts',
    tags: {
      Name: `ec2-compliance-alerts-${environmentSuffix}`,
      Purpose: 'Tag Compliance Alerting',
    },
  }
);

// IAM Role for Lambda function
const lambdaRole = new aws.iam.Role(
  `ec2-compliance-lambda-role-${environmentSuffix}`,
  {
    name: `ec2-compliance-lambda-role-${environmentSuffix}`,
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
    tags: {
      Name: `ec2-compliance-lambda-role-${environmentSuffix}`,
      Purpose: 'Lambda Execution Role',
    },
  }
);

// IAM Policy for Lambda - EC2 read permissions
const ec2ReadPolicy = new aws.iam.RolePolicy(
  `ec2-read-policy-${environmentSuffix}`,
  {
    name: `ec2-read-policy-${environmentSuffix}`,
    role: lambdaRole.id,
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['ec2:DescribeInstances', 'ec2:DescribeTags'],
          Resource: '*',
        },
      ],
    }),
  }
);

// IAM Policy for Lambda - S3 write permissions
const s3WritePolicy = new aws.iam.RolePolicy(
  `s3-write-policy-${environmentSuffix}`,
  {
    name: `s3-write-policy-${environmentSuffix}`,
    role: lambdaRole.id,
    policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl"
            ],
            "Resource": "${reportsBucket.arn}/*"
        }]
    }`,
  }
);

// IAM Policy for Lambda - SNS publish permissions
const snsPublishPolicy = new aws.iam.RolePolicy(
  `sns-publish-policy-${environmentSuffix}`,
  {
    name: `sns-publish-policy-${environmentSuffix}`,
    role: lambdaRole.id,
    policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": "sns:Publish",
            "Resource": "${complianceTopic.arn}"
        }]
    }`,
  }
);

// Attach CloudWatch Logs policy
const logsPolicy = new aws.iam.RolePolicyAttachment(
  `lambda-logs-policy-${environmentSuffix}`,
  {
    role: lambdaRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  }
);

// Lambda function for tag compliance checking
const complianceLambda = new aws.lambda.Function(
  `ec2-compliance-checker-${environmentSuffix}`,
  {
    name: `ec2-compliance-checker-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: 'index.handler',
    role: lambdaRole.arn,
    timeout: 300,
    memorySize: 512,
    code: new pulumi.asset.AssetArchive({
      'index.js': new pulumi.asset.StringAsset(
        fs.readFileSync(
          path.join(__dirname, 'lambda', 'compliance-checker.js'),
          'utf8'
        )
      ),
    }),
    environment: {
      variables: {
        REPORTS_BUCKET: reportsBucket.id,
        SNS_TOPIC_ARN: complianceTopic.arn,
        REQUIRED_TAGS: requiredTags.join(','),
        AWS_REGION: region,
      },
    },
    tags: {
      Name: `ec2-compliance-checker-${environmentSuffix}`,
      Purpose: 'Tag Compliance Checking',
    },
  },
  { dependsOn: [ec2ReadPolicy, s3WritePolicy, snsPublishPolicy, logsPolicy] }
);

// CloudWatch Events rule for 6-hour schedule
const scheduleRule = new aws.cloudwatch.EventRule(
  `ec2-compliance-schedule-${environmentSuffix}`,
  {
    name: `ec2-compliance-schedule-${environmentSuffix}`,
    description: 'Trigger EC2 tag compliance check every 6 hours',
    scheduleExpression: 'rate(6 hours)',
    tags: {
      Name: `ec2-compliance-schedule-${environmentSuffix}`,
      Purpose: 'Compliance Check Schedule',
    },
  }
);

// EventBridge target - Lambda function
const scheduleTarget = new aws.cloudwatch.EventTarget(
  `ec2-compliance-target-${environmentSuffix}`,
  {
    rule: scheduleRule.name,
    arn: complianceLambda.arn,
  }
);
void scheduleTarget;

// Lambda permission for EventBridge
const lambdaPermission = new aws.lambda.Permission(
  `ec2-compliance-eventbridge-permission-${environmentSuffix}`,
  {
    action: 'lambda:InvokeFunction',
    function: complianceLambda.name,
    principal: 'events.amazonaws.com',
    sourceArn: scheduleRule.arn,
  }
);
void lambdaPermission;

// Glue Database for Athena queries
const glueDatabase = new aws.glue.CatalogDatabase(
  `ec2-compliance-db-${environmentSuffix}`,
  {
    name: `ec2_compliance_db_${environmentSuffix.replace(/-/g, '_')}`,
    description: 'Database for EC2 tag compliance reports',
  }
);

// IAM Role for Glue Crawler
const glueCrawlerRole = new aws.iam.Role(
  `glue-crawler-role-${environmentSuffix}`,
  {
    name: `glue-crawler-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'glue.amazonaws.com',
          },
        },
      ],
    }),
    tags: {
      Name: `glue-crawler-role-${environmentSuffix}`,
      Purpose: 'Glue Crawler Execution',
    },
  }
);

// Attach Glue service policy
const glueServicePolicy = new aws.iam.RolePolicyAttachment(
  `glue-service-policy-${environmentSuffix}`,
  {
    role: glueCrawlerRole.name,
    policyArn: 'arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole',
  }
);

// S3 access policy for Glue Crawler
const glueS3Policy = new aws.iam.RolePolicy(
  `glue-s3-policy-${environmentSuffix}`,
  {
    name: `glue-s3-policy-${environmentSuffix}`,
    role: glueCrawlerRole.id,
    policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "${reportsBucket.arn}",
                "${reportsBucket.arn}/*"
            ]
        }]
    }`,
  }
);

// Glue Crawler for S3 reports
const glueCrawler = new aws.glue.Crawler(
  `ec2-compliance-crawler-${environmentSuffix}`,
  {
    name: `ec2-compliance-crawler-${environmentSuffix}`,
    databaseName: glueDatabase.name,
    role: glueCrawlerRole.arn,
    s3Targets: [
      {
        path: pulumi.interpolate`s3://${reportsBucket.id}/`,
      },
    ],
    tags: {
      Name: `ec2-compliance-crawler-${environmentSuffix}`,
      Purpose: 'Catalog Compliance Reports',
    },
  },
  { dependsOn: [glueServicePolicy, glueS3Policy] }
);

// CloudWatch Dashboard
const dashboard = new aws.cloudwatch.Dashboard(
  `ec2-compliance-dashboard-${environmentSuffix}`,
  {
    dashboardName: `ec2-compliance-dashboard-${environmentSuffix}`,
    dashboardBody: pulumi.interpolate`{
        "widgets": [
            {
                "type": "metric",
                "properties": {
                    "metrics": [
                        ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Lambda Invocations"}],
                        [".", "Errors", {"stat": "Sum", "label": "Lambda Errors"}],
                        [".", "Duration", {"stat": "Average", "label": "Avg Duration (ms)"}]
                    ],
                    "view": "timeSeries",
                    "stacked": false,
                    "region": "${region}",
                    "title": "Lambda Execution Metrics",
                    "period": 300,
                    "dimensions": {
                        "FunctionName": "${complianceLambda.name}"
                    }
                }
            },
            {
                "type": "log",
                "properties": {
                    "query": "SOURCE '/aws/lambda/${complianceLambda.name}' | fields @timestamp, @message | filter @message like /compliance/ | sort @timestamp desc | limit 20",
                    "region": "${region}",
                    "stacked": false,
                    "title": "Recent Compliance Check Logs",
                    "view": "table"
                }
            },
            {
                "type": "metric",
                "properties": {
                    "metrics": [
                        ["AWS/SNS", "NumberOfMessagesPublished", {"stat": "Sum", "label": "Alerts Sent"}]
                    ],
                    "view": "timeSeries",
                    "stacked": false,
                    "region": "${region}",
                    "title": "Compliance Alerts",
                    "period": 300,
                    "dimensions": {
                        "TopicName": "${complianceTopic.name}"
                    }
                }
            }
        ]
    }`,
  }
);

// Athena Workgroup
const athenaWorkgroup = new aws.athena.Workgroup(
  `ec2-compliance-workgroup-${environmentSuffix}`,
  {
    name: `ec2-compliance-workgroup-${environmentSuffix}`,
    configuration: {
      resultConfiguration: {
        outputLocation: pulumi.interpolate`s3://${reportsBucket.id}/athena-results/`,
      },
    },
    tags: {
      Name: `ec2-compliance-workgroup-${environmentSuffix}`,
      Purpose: 'Compliance Analysis Queries',
    },
  }
);

// Exports
export const reportsBucketName = reportsBucket.id;
export const reportsBucketArn = reportsBucket.arn;
export const snsTopicArn = complianceTopic.arn;
export const snsTopicName = complianceTopic.name;
export const lambdaFunctionName = complianceLambda.name;
export const lambdaFunctionArn = complianceLambda.arn;
export const scheduleRuleName = scheduleRule.name;
export const glueDatabaseName = glueDatabase.name;
export const glueCrawlerName = glueCrawler.name;
export const dashboardName = dashboard.dashboardName;
export const athenaWorkgroupName = athenaWorkgroup.name;
