import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';
const awsRegion = config.get('awsRegion') || process.env.AWS_REGION;
const region = awsRegion || 'us-east-1';

// Required tags for compliance
const REQUIRED_TAGS = ['Environment', 'Owner', 'Application'];

// S3 Bucket for compliance logs
const complianceLogsBucket = new aws.s3.Bucket(
  'complianceLogsBucket',
  {
    bucket: `compliance-logs-${environmentSuffix}`,
    serverSideEncryptionConfiguration: {
      rule: {
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'AES256',
        },
      },
    },
    lifecycleRules: [
      {
        enabled: true,
        expiration: {
          days: 30,
        },
      },
    ],
    tags: {
      Name: `compliance-logs-${environmentSuffix}`,
      Environment: 'test',
      Owner: 'synth-team',
      Application: 'tag-compliance-monitoring',
    },
  },
  {
    retainOnDelete: false,
  }
);

// Block public access to S3 bucket
const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
  'complianceLogsBucketPublicAccessBlock',
  {
    bucket: complianceLogsBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  }
);

// SNS Topic for compliance notifications
const complianceAlertsTopic = new aws.sns.Topic(
  'complianceAlertsTopic',
  {
    name: `compliance-alerts-${environmentSuffix}`,
    tags: {
      Name: `compliance-alerts-${environmentSuffix}`,
      Environment: 'test',
      Owner: 'synth-team',
      Application: 'tag-compliance-monitoring',
    },
  },
  {
    retainOnDelete: false,
  }
);

// IAM Role for Lambda
const lambdaRole = new aws.iam.Role('tagComplianceCheckerRole', {
  name: `tag-compliance-checker-role-${environmentSuffix}`,
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
    Name: `tag-compliance-checker-role-${environmentSuffix}`,
    Environment: 'test',
    Owner: 'synth-team',
    Application: 'tag-compliance-monitoring',
  },
});

// Attach AWS Lambda basic execution policy
const lambdaBasicExecution = new aws.iam.RolePolicyAttachment(
  'lambdaBasicExecution',
  {
    role: lambdaRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  }
);

// IAM Policy for Lambda to access EC2, S3, SNS, CloudWatch
const lambdaPolicy = new aws.iam.RolePolicy('tagComplianceCheckerPolicy', {
  role: lambdaRole.id,
  policy: pulumi
    .all([complianceLogsBucket.arn, complianceAlertsTopic.arn])
    .apply(([bucketArn, topicArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['ec2:DescribeInstances', 'ec2:DescribeTags'],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:PutObjectAcl'],
            Resource: `${bucketArn}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: topicArn,
          },
          {
            Effect: 'Allow',
            Action: ['cloudwatch:PutMetricData'],
            Resource: '*',
          },
        ],
      })
    ),
});

// Lambda function code
const lambdaCode = `const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

const REQUIRED_TAGS = process.env.REQUIRED_TAGS ? process.env.REQUIRED_TAGS.split(',') : ['Environment', 'Owner', 'Application'];
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const REGION = process.env.AWS_REGION || 'us-east-1';

const ec2Client = new EC2Client({ region: REGION });
const snsClient = new SNSClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });
const cloudwatchClient = new CloudWatchClient({ region: REGION });

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  try {
    let instanceId;

    // Extract instance ID from CloudWatch Event
    if (event.detail && event.detail['instance-id']) {
      instanceId = event.detail['instance-id'];
    } else if (event.instanceId) {
      instanceId = event.instanceId;
    } else {
      console.log('No instance ID found in event, scanning all instances');
      return await scanAllInstances();
    }

    console.log('Checking compliance for instance: ' + instanceId);

    // Describe the instance
    const describeCommand = new DescribeInstancesCommand({
      InstanceIds: [instanceId],
    });

    const response = await ec2Client.send(describeCommand);

    if (!response.Reservations || response.Reservations.length === 0) {
      console.log('Instance ' + instanceId + ' not found');
      return { statusCode: 404, body: 'Instance not found' };
    }

    const instance = response.Reservations[0].Instances[0];
    const tags = instance.Tags || [];

    // Check compliance
    const tagMap = {};
    tags.forEach(tag => {
      tagMap[tag.Key] = tag.Value;
    });

    const missingTags = REQUIRED_TAGS.filter(requiredTag => !tagMap[requiredTag]);
    const isCompliant = missingTags.length === 0;

    console.log('Instance ' + instanceId + ' compliance: ' + isCompliant);
    console.log('Tags found:', tagMap);
    console.log('Missing tags:', missingTags);

    // Create scan log
    const scanLog = {
      timestamp: new Date().toISOString(),
      instanceId: instanceId,
      state: instance.State.Name,
      isCompliant: isCompliant,
      requiredTags: REQUIRED_TAGS,
      tags: tagMap,
      missingTags: missingTags,
    };

    // Write log to S3
    const logKey = 'scans/' + new Date().toISOString().split('T')[0] + '/' + instanceId + '-' + Date.now() + '.json';
    const putObjectCommand = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: logKey,
      Body: JSON.stringify(scanLog, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(putObjectCommand);
    console.log('Scan log written to S3: ' + logKey);

    // Publish CloudWatch metrics
    const putMetricCommand = new PutMetricDataCommand({
      Namespace: 'TagCompliance',
      MetricData: [
        {
          MetricName: 'CompliantInstances',
          Value: isCompliant ? 1 : 0,
          Unit: 'Count',
          Timestamp: new Date(),
        },
        {
          MetricName: 'NonCompliantInstances',
          Value: isCompliant ? 0 : 1,
          Unit: 'Count',
          Timestamp: new Date(),
        },
      ],
    });

    await cloudwatchClient.send(putMetricCommand);
    console.log('CloudWatch metrics published');

    // Send SNS notification if non-compliant
    if (!isCompliant) {
      const message = 'EC2 Instance Non-Compliant Alert\\n\\n' +
        'Instance ID: ' + instanceId + '\\n' +
        'State: ' + instance.State.Name + '\\n' +
        'Region: ' + REGION + '\\n\\n' +
        'Missing Tags: ' + missingTags.join(', ') + '\\n\\n' +
        'Current Tags:\\n' +
        Object.entries(tagMap).map(([k, v]) => '  ' + k + ': ' + v).join('\\n') + '\\n\\n' +
        'Please add the missing tags to ensure compliance.';

      const publishCommand = new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Subject: 'Tag Compliance Alert: Instance ' + instanceId,
        Message: message,
      });

      await snsClient.send(publishCommand);
      console.log('SNS notification sent');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        instanceId: instanceId,
        isCompliant: isCompliant,
        missingTags: missingTags,
      }),
    };

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

async function scanAllInstances() {
  console.log('Scanning all running instances');

  const describeCommand = new DescribeInstancesCommand({
    Filters: [
      {
        Name: 'instance-state-name',
        Values: ['running'],
      },
    ],
  });

  const response = await ec2Client.send(describeCommand);

  let compliantCount = 0;
  let nonCompliantCount = 0;
  const nonCompliantInstances = [];

  for (const reservation of (response.Reservations || [])) {
    for (const instance of reservation.Instances) {
      const tags = instance.Tags || [];
      const tagMap = {};
      tags.forEach(tag => {
        tagMap[tag.Key] = tag.Value;
      });

      const missingTags = REQUIRED_TAGS.filter(requiredTag => !tagMap[requiredTag]);
      const isCompliant = missingTags.length === 0;

      if (isCompliant) {
        compliantCount++;
      } else {
        nonCompliantCount++;
        nonCompliantInstances.push({
          instanceId: instance.InstanceId,
          missingTags: missingTags,
        });
      }
    }
  }

  console.log('Scan complete. Compliant: ' + compliantCount + ', Non-compliant: ' + nonCompliantCount);

  // Publish aggregate metrics
  const putMetricCommand = new PutMetricDataCommand({
    Namespace: 'TagCompliance',
    MetricData: [
      {
        MetricName: 'CompliantInstances',
        Value: compliantCount,
        Unit: 'Count',
        Timestamp: new Date(),
      },
      {
        MetricName: 'NonCompliantInstances',
        Value: nonCompliantCount,
        Unit: 'Count',
        Timestamp: new Date(),
      },
    ],
  });

  await cloudwatchClient.send(putMetricCommand);

  return {
    statusCode: 200,
    body: JSON.stringify({
      compliantCount: compliantCount,
      nonCompliantCount: nonCompliantCount,
      nonCompliantInstances: nonCompliantInstances,
    }),
  };
}
`;

// Create Lambda function
const tagComplianceChecker = new aws.lambda.Function(
  'tagComplianceChecker',
  {
    name: `tag-compliance-checker-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: 'index.handler',
    role: lambdaRole.arn,
    timeout: 60,
    memorySize: 256,
    code: new pulumi.asset.AssetArchive({
      'index.js': new pulumi.asset.StringAsset(lambdaCode),
      'package.json': new pulumi.asset.StringAsset(
        JSON.stringify({
          name: 'tag-compliance-checker',
          version: '1.0.0',
          dependencies: {
            '@aws-sdk/client-ec2': '^3.0.0',
            '@aws-sdk/client-sns': '^3.0.0',
            '@aws-sdk/client-s3': '^3.0.0',
            '@aws-sdk/client-cloudwatch': '^3.0.0',
          },
        })
      ),
    }),
    environment: {
      variables: {
        REQUIRED_TAGS: REQUIRED_TAGS.join(','),
        SNS_TOPIC_ARN: complianceAlertsTopic.arn,
        S3_BUCKET_NAME: complianceLogsBucket.id,
      },
    },
    tags: {
      Name: `tag-compliance-checker-${environmentSuffix}`,
      Environment: 'test',
      Owner: 'synth-team',
      Application: 'tag-compliance-monitoring',
    },
  },
  {
    retainOnDelete: false,
    dependsOn: [lambdaBasicExecution, lambdaPolicy],
  }
);

// CloudWatch Events Rule for EC2 state changes
const ec2StateChangeRule = new aws.cloudwatch.EventRule('ec2StateChangeRule', {
  name: `ec2-state-change-${environmentSuffix}`,
  description: 'Trigger compliance check on EC2 state changes',
  eventPattern: JSON.stringify({
    source: ['aws.ec2'],
    'detail-type': ['EC2 Instance State-change Notification'],
    detail: {
      state: ['running', 'stopped'],
    },
  }),
  tags: {
    Name: `ec2-state-change-${environmentSuffix}`,
    Environment: 'test',
    Owner: 'synth-team',
    Application: 'tag-compliance-monitoring',
  },
});

// Permission for CloudWatch Events to invoke Lambda
const lambdaEventPermission = new aws.lambda.Permission(
  'lambdaEventPermission',
  {
    action: 'lambda:InvokeFunction',
    function: tagComplianceChecker.name,
    principal: 'events.amazonaws.com',
    sourceArn: ec2StateChangeRule.arn,
  }
);

// CloudWatch Events Target
const ec2StateChangeTarget = new aws.cloudwatch.EventTarget(
  'ec2StateChangeTarget',
  {
    rule: ec2StateChangeRule.name,
    arn: tagComplianceChecker.arn,
  },
  {
    dependsOn: [lambdaEventPermission],
  }
);

// CloudWatch Dashboard
const complianceDashboard = new aws.cloudwatch.Dashboard(
  'complianceDashboard',
  {
    dashboardName: `tag-compliance-${environmentSuffix}`,
    dashboardBody: JSON.stringify({
      widgets: [
        {
          type: 'metric',
          properties: {
            metrics: [
              [
                'TagCompliance',
                'CompliantInstances',
                { stat: 'Sum', label: 'Compliant Instances' },
              ],
              [
                '.',
                'NonCompliantInstances',
                { stat: 'Sum', label: 'Non-Compliant Instances' },
              ],
            ],
            period: 300,
            stat: 'Sum',
            region: region,
            title: 'Tag Compliance Status',
            yAxis: {
              left: {
                min: 0,
              },
            },
          },
        },
        {
          type: 'metric',
          properties: {
            metrics: [
              ['TagCompliance', 'NonCompliantInstances', { stat: 'Sum' }],
            ],
            period: 300,
            stat: 'Sum',
            region: region,
            title: 'Non-Compliant Instances Over Time',
            yAxis: {
              left: {
                min: 0,
              },
            },
          },
        },
      ],
    }),
  }
);

// CloudWatch Alarm for high non-compliance
const highNonComplianceAlarm = new aws.cloudwatch.MetricAlarm(
  'highNonComplianceAlarm',
  {
    name: `high-non-compliance-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 1,
    metricName: 'NonCompliantInstances',
    namespace: 'TagCompliance',
    period: 300,
    statistic: 'Sum',
    threshold: 5,
    alarmDescription: 'Alert when non-compliant instances exceed threshold',
    alarmActions: [complianceAlertsTopic.arn],
    tags: {
      Name: `high-non-compliance-${environmentSuffix}`,
      Environment: 'test',
      Owner: 'synth-team',
      Application: 'tag-compliance-monitoring',
    },
  }
);

// Export outputs
export const complianceLogsBucketName = complianceLogsBucket.id;
export const complianceLogsBucketArn = complianceLogsBucket.arn;
export const complianceAlertsTopicArn = complianceAlertsTopic.arn;
export const tagComplianceCheckerFunctionName = tagComplianceChecker.name;
export const tagComplianceCheckerFunctionArn = tagComplianceChecker.arn;
export const ec2StateChangeRuleName = ec2StateChangeRule.name;
export const complianceDashboardName = complianceDashboard.dashboardName;
export const highNonComplianceAlarmName = highNonComplianceAlarm.name;
export const bucketPublicAccessBlockId = bucketPublicAccessBlock.id;
export const ec2StateChangeTargetId = ec2StateChangeTarget.id;
