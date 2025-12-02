import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const region = aws.config.region || 'us-east-1';

// S3 bucket for storing compliance reports
const reportsBucket = new aws.s3.Bucket(
  `iam-compliance-reports-${environmentSuffix}`,
  {
    bucket: `iam-compliance-reports-${environmentSuffix}`,
    forceDestroy: true,
    serverSideEncryptionConfiguration: {
      rule: {
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'AES256',
        },
      },
    },
    versioning: {
      enabled: true,
    },
    tags: {
      Name: `iam-compliance-reports-${environmentSuffix}`,
      Environment: environmentSuffix,
      Purpose: 'IAM Compliance Reports',
    },
  }
);

// Block public access to the reports bucket
new aws.s3.BucketPublicAccessBlock(
  `iam-compliance-reports-public-access-block-${environmentSuffix}`,
  {
    bucket: reportsBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  }
);

// IAM role for the Lambda scanner function
const lambdaRole = new aws.iam.Role(`iam-scanner-role-${environmentSuffix}`, {
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
    Name: `iam-scanner-role-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

// Attach basic Lambda execution policy
new aws.iam.RolePolicyAttachment(
  `iam-scanner-basic-execution-${environmentSuffix}`,
  {
    role: lambdaRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  }
);

// Custom policy for IAM scanning and S3/CloudWatch access
const scannerPolicy = new aws.iam.Policy(
  `iam-scanner-policy-${environmentSuffix}`,
  {
    policy: reportsBucket.arn.apply(arn =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'iam:ListRoles',
              'iam:GetRole',
              'iam:ListAttachedRolePolicies',
              'iam:ListRolePolicies',
              'iam:GetRolePolicy',
              'iam:GetPolicy',
              'iam:GetPolicyVersion',
              'iam:ListPolicyVersions',
              'iam:TagRole',
              'iam:UntagRole',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:GetObject'],
            Resource: `${arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['cloudwatch:PutMetricData'],
            Resource: '*',
          },
        ],
      })
    ),
    tags: {
      Name: `iam-scanner-policy-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

new aws.iam.RolePolicyAttachment(
  `iam-scanner-policy-attachment-${environmentSuffix}`,
  {
    role: lambdaRole.name,
    policyArn: scannerPolicy.arn,
  }
);

// Lambda function for IAM scanning
const scannerLambda = new aws.lambda.Function(
  `iam-scanner-lambda-${environmentSuffix}`,
  {
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: 'index.handler',
    role: lambdaRole.arn,
    timeout: 300,
    memorySize: 512,
    code: new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive('./lambda'),
    }),
    environment: {
      variables: {
        REPORTS_BUCKET: reportsBucket.bucket,
        ENVIRONMENT_SUFFIX: environmentSuffix,
      },
    },
    tags: {
      Name: `iam-scanner-lambda-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// EventBridge rule to trigger scanner daily
const scannerSchedule = new aws.cloudwatch.EventRule(
  `iam-scanner-schedule-${environmentSuffix}`,
  {
    scheduleExpression: 'rate(1 day)',
    description: 'Triggers IAM compliance scanner daily',
    tags: {
      Name: `iam-scanner-schedule-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

new aws.cloudwatch.EventTarget(`iam-scanner-target-${environmentSuffix}`, {
  rule: scannerSchedule.name,
  arn: scannerLambda.arn,
});

new aws.lambda.Permission(
  `iam-scanner-eventbridge-permission-${environmentSuffix}`,
  {
    action: 'lambda:InvokeFunction',
    function: scannerLambda.name,
    principal: 'events.amazonaws.com',
    sourceArn: scannerSchedule.arn,
  }
);

// CloudWatch dashboard for compliance metrics
const dashboard = new aws.cloudwatch.Dashboard(
  `iam-compliance-dashboard-${environmentSuffix}`,
  {
    dashboardName: `iam-compliance-dashboard-${environmentSuffix}`,
    dashboardBody: pulumi.interpolate`{
        "widgets": [
            {
                "type": "metric",
                "properties": {
                    "metrics": [
                        ["IAMCompliance", "TotalRolesScanned", {"stat": "Sum"}],
                        [".", "WildcardPermissionsFound", {"stat": "Sum"}],
                        [".", "UnusedRoles", {"stat": "Sum"}],
                        [".", "InlinePolicies", {"stat": "Sum"}],
                        [".", "CrossAccountAccess", {"stat": "Sum"}]
                    ],
                    "view": "timeSeries",
                    "stacked": false,
                    "region": "${region}",
                    "title": "IAM Compliance Metrics",
                    "period": 300
                }
            },
            {
                "type": "metric",
                "properties": {
                    "metrics": [
                        ["IAMCompliance", "CompliantRoles", {"stat": "Sum"}],
                        [".", "NonCompliantRoles", {"stat": "Sum"}],
                        [".", "NeedsReviewRoles", {"stat": "Sum"}]
                    ],
                    "view": "pie",
                    "region": "${region}",
                    "title": "Compliance Status Distribution",
                    "period": 300
                }
            }
        ]
    }`,
  }
);

// Exports
export const reportsBucketName = reportsBucket.bucket;
export const scannerLambdaArn = scannerLambda.arn;
export const dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${dashboard.dashboardName}`;
export const complianceNamespace = 'IAMCompliance';
