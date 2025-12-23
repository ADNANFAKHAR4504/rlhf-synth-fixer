import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface InfrastructureOutputs {
  reportBucketName: pulumi.Output<string>;
  reportBucketArn: pulumi.Output<string>;
  auditLambdaArn: pulumi.Output<string>;
  auditLambdaName: pulumi.Output<string>;
  weeklyRuleName: pulumi.Output<string>;
  logGroupName: pulumi.Output<string>;
}

export function createInfrastructure(
  environmentSuffix: string
): InfrastructureOutputs {
  // S3 bucket for storing compliance reports with forceDestroy
  const reportsBucket = new aws.s3.Bucket(
    `tagging-audit-reports-${environmentSuffix}`,
    {
      bucket: `tagging-audit-reports-${environmentSuffix}`,
      forceDestroy: true,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
      tags: {
        Environment: 'audit',
        Purpose: 'tagging-compliance',
      },
    }
  );

  // Block public access to S3 bucket
  new aws.s3.BucketPublicAccessBlock(
    `tagging-audit-reports-block-${environmentSuffix}`,
    {
      bucket: reportsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }
  );

  // IAM role for Lambda
  const lambdaRole = new aws.iam.Role(
    `tagging-audit-role-${environmentSuffix}`,
    {
      name: `tagging-audit-role-${environmentSuffix}`,
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
    }
  );

  // Attach policies to Lambda role
  const lambdaPolicyAttachment = new aws.iam.RolePolicyAttachment(
    `tagging-audit-policy-${environmentSuffix}`,
    {
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    }
  );

  // Custom inline policy for resource scanning
  const scannerPolicy = new aws.iam.RolePolicy(
    `tagging-audit-scanner-policy-${environmentSuffix}`,
    {
      role: lambdaRole.id,
      policy: pulumi.all([reportsBucket.arn]).apply(([bucketArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'ec2:DescribeInstances',
                'ec2:DescribeTags',
                'rds:DescribeDBInstances',
                'rds:ListTagsForResource',
                's3:ListAllMyBuckets',
                's3:GetBucketTagging',
                's3:GetBucketLocation',
                'tag:GetResources',
                'pricing:GetProducts',
                'cloudformation:DescribeStacks',
                'cloudformation:DescribeStackResources',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['s3:PutObject'],
              Resource: `${bucketArn}/*`,
            },
            {
              Effect: 'Allow',
              Action: ['cloudwatch:PutMetricData'],
              Resource: '*',
            },
          ],
        })
      ),
    }
  );

  // Lambda function code with AWS SDK v3
  const lambdaCode = `
const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
const { RDSClient, DescribeDBInstancesCommand, ListTagsForResourceCommand } = require('@aws-sdk/client-rds');
const { S3Client, ListBucketsCommand, GetBucketTaggingCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');
const { PricingClient, GetProductsCommand } = require('@aws-sdk/client-pricing');

const REQUIRED_TAGS = ['Environment', 'CostCenter', 'Owner', 'Project'];
const REPORT_BUCKET = process.env.REPORT_BUCKET;
const TARGET_REGION = process.env.TARGET_REGION || process.env.AWS_REGION || 'us-east-1';
const HIGH_PRIORITY_AGE_DAYS = 90;

function suggestTags(resourceId, resourceType) {
    const suggestions = [];
    const lowerName = resourceId.toLowerCase();
    if (lowerName.includes('prod') || lowerName.includes('production')) {
        suggestions.push({ key: 'Environment', value: 'production', confidence: 0.9 });
    } else if (lowerName.includes('dev') || lowerName.includes('development')) {
        suggestions.push({ key: 'Environment', value: 'development', confidence: 0.9 });
    } else if (lowerName.includes('staging') || lowerName.includes('stage')) {
        suggestions.push({ key: 'Environment', value: 'staging', confidence: 0.9 });
    } else if (lowerName.includes('test')) {
        suggestions.push({ key: 'Environment', value: 'test', confidence: 0.8 });
    }
    const projectMatch = lowerName.match(/^([a-z0-9-]+)-(prod|dev|staging|test)/);
    if (projectMatch) {
        suggestions.push({ key: 'Project', value: projectMatch[1], confidence: 0.7 });
    }
    return suggestions;
}

function getResourceAge(launchTime) {
    if (!launchTime) return null;
    const now = new Date();
    const launch = new Date(launchTime);
    const diffMs = now - launch;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
}

async function estimateCost(resourceType, resourceDetails, pricingClient) {
    try {
        const costMap = {
            'ec2': { 't2.micro': 8.47, 't2.small': 16.79, 't2.medium': 33.58, 't3.micro': 7.59, 't3.small': 15.18, 't3.medium': 30.37 },
            'rds': { 'db.t2.micro': 14.00, 'db.t2.small': 28.00, 'db.t3.micro': 12.41, 'db.t3.small': 24.82 },
            's3': 0.023
        };
        if (resourceType === 'ec2' && resourceDetails.instanceType) {
            return costMap.ec2[resourceDetails.instanceType] || 50.00;
        } else if (resourceType === 'rds' && resourceDetails.instanceClass) {
            return costMap.rds[resourceDetails.instanceClass] || 100.00;
        } else if (resourceType === 's3') {
            return 10 * costMap.s3;
        }
        return 0;
    } catch (error) {
        console.error('Cost estimation error:', error);
        return 0;
    }
}

exports.handler = async (event) => {
    const ec2Client = new EC2Client({ region: TARGET_REGION });
    const rdsClient = new RDSClient({ region: TARGET_REGION });
    const s3Client = new S3Client({ region: TARGET_REGION });
    const cloudwatchClient = new CloudWatchClient({ region: TARGET_REGION });
    const pricingClient = new PricingClient({ region: 'us-east-1' });
    const results = { ec2: [], rds: [], s3: [], summary: {}, highPriorityCount: 0, totalEstimatedMonthlyCost: 0 };
    try {
        const ec2Response = await ec2Client.send(new DescribeInstancesCommand({}));
        for (const reservation of (ec2Response.Reservations || [])) {
            for (const instance of (reservation.Instances || [])) {
                const tags = instance.Tags || [];
                const tagKeys = tags.map(t => t.Key);
                const missingTags = REQUIRED_TAGS.filter(rt => !tagKeys.includes(rt));
                const resourceAge = getResourceAge(instance.LaunchTime);
                const isHighPriority = resourceAge && resourceAge > HIGH_PRIORITY_AGE_DAYS && missingTags.length > 0;
                const estimatedCost = await estimateCost('ec2', { instanceType: instance.InstanceType }, pricingClient);
                if (missingTags.length > 0) { results.totalEstimatedMonthlyCost += estimatedCost; }
                if (isHighPriority) { results.highPriorityCount++; }
                results.ec2.push({ resourceId: instance.InstanceId, resourceType: 'EC2 Instance', instanceType: instance.InstanceType, state: instance.State.Name, launchTime: instance.LaunchTime, ageDays: resourceAge, missingTags, existingTags: tags.reduce((acc, t) => ({ ...acc, [t.Key]: t.Value }), {}), compliant: missingTags.length === 0, highPriority: isHighPriority, suggestedTags: missingTags.length > 0 ? suggestTags(instance.InstanceId, 'ec2') : [], estimatedMonthlyCost: estimatedCost });
            }
        }
        const rdsResponse = await rdsClient.send(new DescribeDBInstancesCommand({}));
        for (const db of (rdsResponse.DBInstances || [])) {
            const dbArn = db.DBInstanceArn; let tags = [];
            try { const tagsResponse = await rdsClient.send(new ListTagsForResourceCommand({ ResourceName: dbArn })); tags = tagsResponse.TagList || []; }
            catch (error) { console.warn(\`Failed to fetch tags for RDS instance \${db.DBInstanceIdentifier}:\`, error.message); }
            const tagKeys = tags.map(t => t.Key);
            const missingTags = REQUIRED_TAGS.filter(rt => !tagKeys.includes(rt));
            const resourceAge = getResourceAge(db.InstanceCreateTime);
            const isHighPriority = resourceAge && resourceAge > HIGH_PRIORITY_AGE_DAYS && missingTags.length > 0;
            const estimatedCost = await estimateCost('rds', { instanceClass: db.DBInstanceClass }, pricingClient);
            if (missingTags.length > 0) { results.totalEstimatedMonthlyCost += estimatedCost; }
            if (isHighPriority) { results.highPriorityCount++; }
            results.rds.push({ resourceId: db.DBInstanceIdentifier, resourceType: 'RDS Instance', instanceClass: db.DBInstanceClass, engine: db.Engine, status: db.DBInstanceStatus, createTime: db.InstanceCreateTime, ageDays: resourceAge, missingTags, existingTags: tags.reduce((acc, t) => ({ ...acc, [t.Key]: t.Value }), {}), compliant: missingTags.length === 0, highPriority: isHighPriority, suggestedTags: missingTags.length > 0 ? suggestTags(db.DBInstanceIdentifier, 'rds') : [], estimatedMonthlyCost: estimatedCost });
        }
        const bucketsResponse = await s3Client.send(new ListBucketsCommand({}));
        for (const bucket of (bucketsResponse.Buckets || [])) {
            let tags = [];
            try { const tagsResponse = await s3Client.send(new GetBucketTaggingCommand({ Bucket: bucket.Name })); tags = tagsResponse.TagSet || []; }
            catch (error) { console.warn(\`Failed to fetch tags for S3 bucket \${bucket.Name}:\`, error.message); }
            const tagKeys = tags.map(t => t.Key);
            const missingTags = REQUIRED_TAGS.filter(rt => !tagKeys.includes(rt));
            const resourceAge = getResourceAge(bucket.CreationDate);
            const isHighPriority = resourceAge && resourceAge > HIGH_PRIORITY_AGE_DAYS && missingTags.length > 0;
            const estimatedCost = await estimateCost('s3', {}, pricingClient);
            if (missingTags.length > 0) { results.totalEstimatedMonthlyCost += estimatedCost; }
            if (isHighPriority) { results.highPriorityCount++; }
            results.s3.push({ resourceId: bucket.Name, resourceType: 'S3 Bucket', creationDate: bucket.CreationDate, ageDays: resourceAge, missingTags, existingTags: tags.reduce((acc, t) => ({ ...acc, [t.Key]: t.Value }), {}), compliant: missingTags.length === 0, highPriority: isHighPriority, suggestedTags: missingTags.length > 0 ? suggestTags(bucket.Name, 's3') : [], estimatedMonthlyCost: estimatedCost });
        }
        const totalEc2 = results.ec2.length, compliantEc2 = results.ec2.filter(r => r.compliant).length;
        const totalRds = results.rds.length, compliantRds = results.rds.filter(r => r.compliant).length;
        const totalS3 = results.s3.length, compliantS3 = results.s3.filter(r => r.compliant).length;
        const totalResources = totalEc2 + totalRds + totalS3, totalCompliant = compliantEc2 + compliantRds + compliantS3;
        results.summary = {
            ec2: { total: totalEc2, compliant: compliantEc2, nonCompliant: totalEc2 - compliantEc2, percentage: totalEc2 > 0 ? parseFloat((compliantEc2 / totalEc2 * 100).toFixed(2)) : 0 },
            rds: { total: totalRds, compliant: compliantRds, nonCompliant: totalRds - compliantRds, percentage: totalRds > 0 ? parseFloat((compliantRds / totalRds * 100).toFixed(2)) : 0 },
            s3: { total: totalS3, compliant: compliantS3, nonCompliant: totalS3 - compliantS3, percentage: totalS3 > 0 ? parseFloat((compliantS3 / totalS3 * 100).toFixed(2)) : 0 },
            overall: { total: totalResources, compliant: totalCompliant, nonCompliant: totalResources - totalCompliant, percentage: totalResources > 0 ? parseFloat((totalCompliant / totalResources * 100).toFixed(2)) : 0 },
            highPriorityCount: results.highPriorityCount, estimatedMonthlyCost: parseFloat(results.totalEstimatedMonthlyCost.toFixed(2))
        };
        const metricData = [ { MetricName: 'EC2CompliancePercentage', Value: results.summary.ec2.percentage, Unit: 'Percent', Timestamp: new Date() }, { MetricName: 'RDSCompliancePercentage', Value: results.summary.rds.percentage, Unit: 'Percent', Timestamp: new Date() }, { MetricName: 'S3CompliancePercentage', Value: results.summary.s3.percentage, Unit: 'Percent', Timestamp: new Date() }, { MetricName: 'OverallCompliancePercentage', Value: results.summary.overall.percentage, Unit: 'Percent', Timestamp: new Date() }, { MetricName: 'HighPriorityResourceCount', Value: results.highPriorityCount, Unit: 'Count', Timestamp: new Date() }, { MetricName: 'EstimatedMonthlyCost', Value: results.totalEstimatedMonthlyCost, Unit: 'None', Timestamp: new Date() } ];
        await cloudwatchClient.send(new PutMetricDataCommand({ Namespace: 'TaggingCompliance', MetricData: metricData }));
        const timestamp = new Date().toISOString(), reportKey = \`compliance-reports/\${timestamp}.json\`;
        await s3Client.send(new PutObjectCommand({ Bucket: REPORT_BUCKET, Key: reportKey, Body: JSON.stringify(results, null, 2), ContentType: 'application/json' }));
        console.log('Compliance audit completed successfully');
        console.log('Summary:', JSON.stringify(results.summary, null, 2));
        return { statusCode: 200, body: JSON.stringify({ message: 'Compliance audit completed', reportLocation: \`s3://\${REPORT_BUCKET}/\${reportKey}\`, summary: results.summary }) };
    } catch (error) {
        console.error('Error during compliance audit:', error);
        throw error;
    }
};
`;

  // Lambda function
  const auditLambda = new aws.lambda.Function(
    `tagging-audit-${environmentSuffix}`,
    {
      name: `tagging-audit-${environmentSuffix}`,
      runtime: aws.lambda.Runtime.NodeJS18dX,
      role: lambdaRole.arn,
      handler: 'index.handler',
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(lambdaCode),
        'package.json': new pulumi.asset.StringAsset(
          JSON.stringify({
            dependencies: {
              '@aws-sdk/client-ec2': '^3.0.0',
              '@aws-sdk/client-rds': '^3.0.0',
              '@aws-sdk/client-s3': '^3.0.0',
              '@aws-sdk/client-cloudwatch': '^3.0.0',
              '@aws-sdk/client-pricing': '^3.0.0',
            },
          })
        ),
      }),
      timeout: 900,
      memorySize: 512,
      environment: {
        variables: {
          REPORT_BUCKET: reportsBucket.bucket,
          TARGET_REGION: 'us-east-1',
        },
      },
    },
    { dependsOn: [lambdaPolicyAttachment, scannerPolicy] }
  );

  // CloudWatch Log Group with retention
  const logGroup = new aws.cloudwatch.LogGroup(
    `/aws/lambda/tagging-audit-${environmentSuffix}`,
    {
      name: `/aws/lambda/tagging-audit-${environmentSuffix}`,
      retentionInDays: 7,
    }
  );

  // EventBridge rule for weekly execution
  const weeklyRule = new aws.cloudwatch.EventRule(
    `tagging-audit-schedule-${environmentSuffix}`,
    {
      name: `tagging-audit-schedule-${environmentSuffix}`,
      description: 'Trigger tagging compliance audit weekly',
      scheduleExpression: 'rate(7 days)',
    }
  );

  // EventBridge target
  new aws.cloudwatch.EventTarget(`tagging-audit-target-${environmentSuffix}`, {
    rule: weeklyRule.name,
    arn: auditLambda.arn,
  });

  // Lambda permission for EventBridge
  new aws.lambda.Permission(`tagging-audit-permission-${environmentSuffix}`, {
    action: 'lambda:InvokeFunction',
    function: auditLambda.name,
    principal: 'events.amazonaws.com',
    sourceArn: weeklyRule.arn,
  });

  return {
    reportBucketName: reportsBucket.bucket,
    reportBucketArn: reportsBucket.arn,
    auditLambdaArn: auditLambda.arn,
    auditLambdaName: auditLambda.name,
    weeklyRuleName: weeklyRule.name,
    logGroupName: logGroup.name,
  };
}
