import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackProps {
  environmentSuffix: string;
  region?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly scanResults: pulumi.Output<string>;
  public readonly complianceReport: pulumi.Output<string>;
  public readonly lambdaFunctionName: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly eventRuleName: pulumi.Output<string>;

  constructor(
    name: string,
    props: TapStackProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:TapStack', name, {}, opts);

    // Note: region is passed to the stack but AWS region is controlled by the Pulumi AWS provider
    // The props.region can be used for resource naming or configuration if needed
    const _region = props.region || 'us-east-1';
    void _region; // Suppress unused variable warning - region available for future use

    // Create S3 bucket for storing compliance reports
    const reportBucket = new aws.s3.Bucket(
      `compliance-reports-${props.environmentSuffix}`,
      {
        bucket: `compliance-reports-${props.environmentSuffix}`,
        forceDestroy: true,
        tags: {
          Name: `compliance-reports-${props.environmentSuffix}`,
          Environment: props.environmentSuffix,
          Purpose: 'ComplianceReporting',
        },
      },
      { parent: this }
    );

    // Block public access for S3 bucket
    new aws.s3.BucketPublicAccessBlock(
      `compliance-reports-public-access-block-${props.environmentSuffix}`,
      {
        bucket: reportBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Create Lambda execution role
    const lambdaRole = new aws.iam.Role(
      `compliance-scanner-role-${props.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Effect: 'Allow',
            },
          ],
        }),
        tags: {
          Name: `compliance-scanner-role-${props.environmentSuffix}`,
          Environment: props.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Attach policies for resource scanning
    new aws.iam.RolePolicyAttachment(
      `compliance-scanner-basic-${props.environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `compliance-scanner-policy-${props.environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'ec2:DescribeInstances',
                'ec2:DescribeTags',
                'rds:DescribeDBInstances',
                'rds:DescribeDBClusters',
                'rds:ListTagsForResource',
                's3:ListAllMyBuckets',
                's3:GetBucketTagging',
                's3:GetBucketLocation',
                's3:PutObject',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Create CloudWatch Log Group for Lambda with retention policy
    const logGroup = new aws.cloudwatch.LogGroup(
      `compliance-scanner-logs-${props.environmentSuffix}`,
      {
        name: `/aws/lambda/compliance-scanner-${props.environmentSuffix}`,
        retentionInDays: 30,
        tags: {
          Name: `compliance-scanner-logs-${props.environmentSuffix}`,
          Environment: props.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create Lambda function for compliance scanning
    const scannerFunction = new aws.lambda.Function(
      `compliance-scanner-${props.environmentSuffix}`,
      {
        name: `compliance-scanner-${props.environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'index.handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { EC2Client, DescribeInstancesCommand, DescribeTagsCommand } = require('@aws-sdk/client-ec2');
const { RDSClient, DescribeDBInstancesCommand, DescribeDBClustersCommand, ListTagsForResourceCommand } = require('@aws-sdk/client-rds');
const { S3Client, ListBucketsCommand, GetBucketTaggingCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const REQUIRED_TAGS = ['Environment', 'Owner', 'CostCenter', 'Project'];
const NINETY_DAYS = 90;

exports.handler = async (event) => {
  const region = process.env.AWS_REGION || 'us-east-1';
  const reportBucket = process.env.REPORT_BUCKET;
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;

  const ec2Client = new EC2Client({ region });
  const rdsClient = new RDSClient({ region });
  const s3Client = new S3Client({ region });

  const results = {
    timestamp: new Date().toISOString(),
    environmentSuffix,
    region,
    summary: {},
    details: {
      ec2: { compliant: [], nonCompliant: [] },
      rds: { compliant: [], nonCompliant: [] },
      s3: { compliant: [], nonCompliant: [] }
    },
    recommendations: []
  };

  // Scan EC2 instances
  try {
    const ec2Data = await ec2Client.send(new DescribeInstancesCommand({}));
    const instances = ec2Data.Reservations?.flatMap(r => r.Instances) || [];

    for (const instance of instances) {
      const tags = instance.Tags || [];
      const tagMap = Object.fromEntries(tags.map(t => [t.Key, t.Value]));
      const missingTags = REQUIRED_TAGS.filter(t => !tagMap[t]);
      const launchTime = new Date(instance.LaunchTime);
      const ageInDays = Math.floor((Date.now() - launchTime.getTime()) / (1000 * 60 * 60 * 24));

      const resourceInfo = {
        resourceId: instance.InstanceId,
        resourceType: 'EC2 Instance',
        state: instance.State.Name,
        launchDate: instance.LaunchTime,
        ageInDays,
        region: region,
        tags: tagMap,
        missingTags
      };

      if (missingTags.length === 0) {
        results.details.ec2.compliant.push(resourceInfo);
      } else {
        results.details.ec2.nonCompliant.push(resourceInfo);
        if (ageInDays > NINETY_DAYS) {
          resourceInfo.flagged = true;
          resourceInfo.flagReason = 'Running >90 days without proper tags';
        }
      }
    }
  } catch (err) {
    console.error('Error scanning EC2:', err);
    results.errors = results.errors || [];
    results.errors.push({ service: 'EC2', error: err.message });
  }

  // Scan RDS instances
  try {
    const rdsInstances = await rdsClient.send(new DescribeDBInstancesCommand({}));

    for (const instance of rdsInstances.DBInstances || []) {
      const tagsData = await rdsClient.send(new ListTagsForResourceCommand({
        ResourceName: instance.DBInstanceArn
      }));

      const tagMap = Object.fromEntries(tagsData.TagList?.map(t => [t.Key, t.Value]) || []);
      const missingTags = REQUIRED_TAGS.filter(t => !tagMap[t]);
      const createTime = new Date(instance.InstanceCreateTime);
      const ageInDays = Math.floor((Date.now() - createTime.getTime()) / (1000 * 60 * 60 * 24));

      const resourceInfo = {
        resourceId: instance.DBInstanceIdentifier,
        resourceType: 'RDS Instance',
        engine: instance.Engine,
        createDate: instance.InstanceCreateTime,
        ageInDays,
        region: region,
        tags: tagMap,
        missingTags
      };

      if (missingTags.length === 0) {
        results.details.rds.compliant.push(resourceInfo);
      } else {
        results.details.rds.nonCompliant.push(resourceInfo);
        if (ageInDays > NINETY_DAYS) {
          resourceInfo.flagged = true;
          resourceInfo.flagReason = 'Running >90 days without proper tags';
        }
      }
    }

    // RDS clusters
    const rdsClusters = await rdsClient.send(new DescribeDBClustersCommand({}));
    for (const cluster of rdsClusters.DBClusters || []) {
      const tagsData = await rdsClient.send(new ListTagsForResourceCommand({
        ResourceName: cluster.DBClusterArn
      }));

      const tagMap = Object.fromEntries(tagsData.TagList?.map(t => [t.Key, t.Value]) || []);
      const missingTags = REQUIRED_TAGS.filter(t => !tagMap[t]);
      const createTime = new Date(cluster.ClusterCreateTime);
      const ageInDays = Math.floor((Date.now() - createTime.getTime()) / (1000 * 60 * 60 * 24));

      const resourceInfo = {
        resourceId: cluster.DBClusterIdentifier,
        resourceType: 'RDS Cluster',
        engine: cluster.Engine,
        createDate: cluster.ClusterCreateTime,
        ageInDays,
        region: region,
        tags: tagMap,
        missingTags
      };

      if (missingTags.length === 0) {
        results.details.rds.compliant.push(resourceInfo);
      } else {
        results.details.rds.nonCompliant.push(resourceInfo);
        if (ageInDays > NINETY_DAYS) {
          resourceInfo.flagged = true;
          resourceInfo.flagReason = 'Running >90 days without proper tags';
        }
      }
    }
  } catch (err) {
    console.error('Error scanning RDS:', err);
    results.errors = results.errors || [];
    results.errors.push({ service: 'RDS', error: err.message });
  }

  // Scan S3 buckets
  try {
    const bucketsData = await s3Client.send(new ListBucketsCommand({}));

    for (const bucket of bucketsData.Buckets || []) {
      try {
        const tagsData = await s3Client.send(new GetBucketTaggingCommand({ Bucket: bucket.Name }));
        const tagMap = Object.fromEntries(tagsData.TagSet?.map(t => [t.Key, t.Value]) || []);
        const missingTags = REQUIRED_TAGS.filter(t => !tagMap[t]);
        const createTime = new Date(bucket.CreationDate);
        const ageInDays = Math.floor((Date.now() - createTime.getTime()) / (1000 * 60 * 60 * 24));

        const resourceInfo = {
          resourceId: bucket.Name,
          resourceType: 'S3 Bucket',
          createDate: bucket.CreationDate,
          ageInDays,
          region: 'global',
          tags: tagMap,
          missingTags
        };

        if (missingTags.length === 0) {
          results.details.s3.compliant.push(resourceInfo);
        } else {
          results.details.s3.nonCompliant.push(resourceInfo);
          if (ageInDays > NINETY_DAYS) {
            resourceInfo.flagged = true;
            resourceInfo.flagReason = 'Exists >90 days without proper tags';
          }
        }
      } catch (err) {
        if (err.name === 'NoSuchTagSet') {
          const ageInDays = Math.floor((Date.now() - new Date(bucket.CreationDate).getTime()) / (1000 * 60 * 60 * 24));
          const resourceInfo = {
            resourceId: bucket.Name,
            resourceType: 'S3 Bucket',
            createDate: bucket.CreationDate,
            ageInDays,
            region: 'global',
            tags: {},
            missingTags: REQUIRED_TAGS
          };

          results.details.s3.nonCompliant.push(resourceInfo);
          if (ageInDays > NINETY_DAYS) {
            resourceInfo.flagged = true;
            resourceInfo.flagReason = 'Exists >90 days without proper tags';
          }
        }
      }
    }
  } catch (err) {
    console.error('Error scanning S3:', err);
    results.errors = results.errors || [];
    results.errors.push({ service: 'S3', error: err.message });
  }

  // Calculate compliance percentages
  const totalEc2 = results.details.ec2.compliant.length + results.details.ec2.nonCompliant.length;
  const totalRds = results.details.rds.compliant.length + results.details.rds.nonCompliant.length;
  const totalS3 = results.details.s3.compliant.length + results.details.s3.nonCompliant.length;

  results.summary = {
    ec2: {
      total: totalEc2,
      compliant: results.details.ec2.compliant.length,
      nonCompliant: results.details.ec2.nonCompliant.length,
      compliancePercentage: totalEc2 > 0 ? ((results.details.ec2.compliant.length / totalEc2) * 100).toFixed(2) : '0.00'
    },
    rds: {
      total: totalRds,
      compliant: results.details.rds.compliant.length,
      nonCompliant: results.details.rds.nonCompliant.length,
      compliancePercentage: totalRds > 0 ? ((results.details.rds.compliant.length / totalRds) * 100).toFixed(2) : '0.00'
    },
    s3: {
      total: totalS3,
      compliant: results.details.s3.compliant.length,
      nonCompliant: results.details.s3.nonCompliant.length,
      compliancePercentage: totalS3 > 0 ? ((results.details.s3.compliant.length / totalS3) * 100).toFixed(2) : '0.00'
    },
    overall: {
      total: totalEc2 + totalRds + totalS3,
      compliant: results.details.ec2.compliant.length + results.details.rds.compliant.length + results.details.s3.compliant.length,
      nonCompliant: results.details.ec2.nonCompliant.length + results.details.rds.nonCompliant.length + results.details.s3.nonCompliant.length,
      compliancePercentage: (totalEc2 + totalRds + totalS3) > 0 ?
        (((results.details.ec2.compliant.length + results.details.rds.compliant.length + results.details.s3.compliant.length) /
        (totalEc2 + totalRds + totalS3)) * 100).toFixed(2) : '0.00'
    }
  };

  // Generate recommendations
  const allNonCompliant = [
    ...results.details.ec2.nonCompliant,
    ...results.details.rds.nonCompliant,
    ...results.details.s3.nonCompliant
  ];

  // Group by service
  const byService = {
    'EC2 Instance': results.details.ec2.nonCompliant,
    'RDS Instance': results.details.rds.nonCompliant.filter(r => r.resourceType === 'RDS Instance'),
    'RDS Cluster': results.details.rds.nonCompliant.filter(r => r.resourceType === 'RDS Cluster'),
    'S3 Bucket': results.details.s3.nonCompliant
  };

  results.groupedByService = byService;

  for (const [service, resources] of Object.entries(byService)) {
    if (resources.length > 0) {
      results.recommendations.push({
        service,
        count: resources.length,
        action: \`Add required tags (Environment, Owner, CostCenter, Project) to \${resources.length} \${service} resource(s)\`,
        resourceIds: resources.map(r => r.resourceId).slice(0, 5),
        moreCount: Math.max(0, resources.length - 5)
      });
    }
  }

  // Flag old resources
  const flaggedResources = allNonCompliant.filter(r => r.flagged);
  if (flaggedResources.length > 0) {
    results.recommendations.push({
      priority: 'HIGH',
      action: \`\${flaggedResources.length} resource(s) have been running for >90 days without proper tags - prioritize remediation\`,
      resourceIds: flaggedResources.map(r => r.resourceId).slice(0, 5)
    });
  }

  // Save report to S3
  if (reportBucket) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportKey = \`compliance-report-\${timestamp}.json\`;

    await s3Client.send(new PutObjectCommand({
      Bucket: reportBucket,
      Key: reportKey,
      Body: JSON.stringify(results, null, 2),
      ContentType: 'application/json'
    }));

    results.reportLocation = \`s3://\${reportBucket}/\${reportKey}\`;
  }

  return {
    statusCode: 200,
    body: JSON.stringify(results, null, 2)
  };
};
          `),
          'package.json': new pulumi.asset.StringAsset(
            JSON.stringify({
              name: 'compliance-scanner',
              version: '1.0.0',
              dependencies: {
                '@aws-sdk/client-ec2': '^3.0.0',
                '@aws-sdk/client-rds': '^3.0.0',
                '@aws-sdk/client-s3': '^3.0.0',
              },
            })
          ),
        }),
        environment: {
          variables: {
            REPORT_BUCKET: reportBucket.id,
            ENVIRONMENT_SUFFIX: props.environmentSuffix,
          },
        },
        timeout: 300,
        memorySize: 512,
        tags: {
          Name: `compliance-scanner-${props.environmentSuffix}`,
          Environment: props.environmentSuffix,
        },
      },
      { parent: this, dependsOn: [logGroup] }
    );

    // Create EventBridge rule for scheduled scanning (optional)
    const scanRule = new aws.cloudwatch.EventRule(
      `compliance-scan-schedule-${props.environmentSuffix}`,
      {
        description: 'Trigger compliance scan daily',
        scheduleExpression: 'rate(1 day)',
        tags: {
          Name: `compliance-scan-schedule-${props.environmentSuffix}`,
          Environment: props.environmentSuffix,
        },
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `compliance-scan-target-${props.environmentSuffix}`,
      {
        rule: scanRule.name,
        arn: scannerFunction.arn,
      },
      { parent: this }
    );

    new aws.lambda.Permission(
      `compliance-scan-permission-${props.environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: scannerFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: scanRule.arn,
      },
      { parent: this }
    );

    // Export outputs
    this.scanResults = pulumi.interpolate`Compliance scanner deployed. Invoke function: ${scannerFunction.name}`;
    this.complianceReport = pulumi.interpolate`Reports saved to: s3://${reportBucket.id}/`;
    this.lambdaFunctionName = scannerFunction.name;
    this.s3BucketName = reportBucket.id;
    this.lambdaFunctionArn = scannerFunction.arn;
    this.eventRuleName = scanRule.name;

    this.registerOutputs({
      scanResults: this.scanResults,
      complianceReport: this.complianceReport,
      LambdaFunctionName: this.lambdaFunctionName,
      S3BucketName: this.s3BucketName,
      LambdaFunctionArn: this.lambdaFunctionArn,
      EventRuleName: this.eventRuleName,
    });
  }
}
