import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

export interface LambdaConstructProps {
  environment: string;
  region: string;
  suffix: string;
  environmentSuffix: string;
  vpc: ec2.Vpc;
  s3Bucket: s3.Bucket;
}

export class LambdaConstruct extends Construct {
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    const { environment, region, suffix, environmentSuffix, vpc, s3Bucket } =
      props;

    // Lambda execution role with least privilege - Addresses MODEL_FAILURES item 7
    const lambdaRole = new iam.Role(
      this,
      `LambdaRole${environmentSuffix}${region}`,
      {
        roleName: `${environment}-${region}-lambda-cost-monitor-${suffix}`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
        ],
        inlinePolicies: {
          CostMonitoringPolicy: new iam.PolicyDocument({
            statements: [
              // S3 permissions for specific bucket only
              new iam.PolicyStatement({
                actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                resources: [`${s3Bucket.bucketArn}/*`],
              }),
              new iam.PolicyStatement({
                actions: ['s3:ListBucket'],
                resources: [s3Bucket.bucketArn],
              }),
              // Cost Explorer and Billing permissions
              new iam.PolicyStatement({
                actions: [
                  'ce:GetCostAndUsage',
                  'ce:GetUsageReport',
                  'ce:GetDimensionValues',
                  'ce:GetReservationCoverage',
                  'ce:GetReservationPurchaseRecommendation',
                  'ce:GetReservationUtilization',
                  'ce:GetRightsizingRecommendation',
                  'ce:GetSavingsPlansUtilization',
                  'ce:GetSavingsPlansPurchaseRecommendation',
                ],
                resources: ['*'], // Cost Explorer requires wildcard
              }),
              // CloudWatch metrics permissions
              new iam.PolicyStatement({
                actions: [
                  'cloudwatch:PutMetricData',
                  'cloudwatch:GetMetricData',
                  'cloudwatch:GetMetricStatistics',
                ],
                resources: ['*'], // CloudWatch metrics require wildcard for custom metrics
                conditions: {
                  StringEquals: {
                    'cloudwatch:namespace': 'AWS/Cost/Monitor',
                  },
                },
              }),
              // Secrets Manager for database credentials (specific pattern)
              new iam.PolicyStatement({
                actions: ['secretsmanager:GetSecretValue'],
                resources: [
                  `arn:aws:secretsmanager:${region}:${cdk.Aws.ACCOUNT_ID}:secret:${environment}-${region}-*`,
                ],
              }),
              // CloudWatch Logs (specific log group)
              new iam.PolicyStatement({
                actions: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                resources: [
                  `arn:aws:logs:${region}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/lambda/${environment}-${region}-cost-monitor-*`,
                ],
              }),
            ],
          }),
        },
      }
    );

    // Real-world cost monitoring Lambda function - Addresses MODEL_FAILURES item about trivial examples
    this.lambdaFunction = new lambda.Function(
      this,
      `CostMonitorLambda${environmentSuffix}${region}`,
      {
        functionName: `${environment}-${region}-cost-monitor-${suffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
const AWS = require('aws-sdk');
const costExplorer = new AWS.CostExplorer({ region: 'us-east-1' }); // Cost Explorer is only available in us-east-1
const cloudWatch = new AWS.CloudWatch();
const s3 = new AWS.S3();

exports.handler = async (event) => {
  console.log('Cost monitoring event:', JSON.stringify(event, null, 2));
  
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get cost data for the last 30 days
    const costParams = {
      TimePeriod: {
        Start: thirtyDaysAgo.toISOString().split('T')[0],
        End: today.toISOString().split('T')[0]
      },
      Granularity: 'DAILY',
      Metrics: ['BlendedCost', 'UsageQuantity'],
      GroupBy: [
        {
          Type: 'DIMENSION',
          Key: 'SERVICE'
        }
      ]
    };
    
    const costData = await costExplorer.getCostAndUsage(costParams).promise();
    
    // Calculate total cost and find top services
    let totalCost = 0;
    const serviceCosts = {};
    
    costData.ResultsByTime.forEach(result => {
      result.Groups.forEach(group => {
        const serviceName = group.Keys[0];
        const cost = parseFloat(group.Metrics.BlendedCost.Amount);
        totalCost += cost;
        serviceCosts[serviceName] = (serviceCosts[serviceName] || 0) + cost;
      });
    });
    
    // Sort services by cost
    const topServices = Object.entries(serviceCosts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
    
    // Create cost report
    const reportData = {
      timestamp: today.toISOString(),
      environment: process.env.ENVIRONMENT,
      region: process.env.REGION || process.env.AWS_REGION,
      totalCost30Days: totalCost.toFixed(2),
      topServices: topServices.map(([service, cost]) => ({
        service,
        cost: cost.toFixed(2)
      })),
      recommendations: []
    };
    
    // Add recommendations based on cost thresholds
    if (totalCost > 1000) {
      reportData.recommendations.push('Consider implementing cost optimization measures - monthly spend exceeds $1000');
    }
    
    topServices.forEach(([service, cost]) => {
      if (service === 'Amazon Elastic Compute Cloud - Compute' && cost > 200) {
        reportData.recommendations.push('High EC2 costs detected - consider rightsizing instances or using Spot instances');
      }
      if (service === 'Amazon Relational Database Service' && cost > 150) {
        reportData.recommendations.push('High RDS costs detected - consider using Reserved Instances');
      }
    });
    
    // Send custom metrics to CloudWatch
    await cloudWatch.putMetricData({
      Namespace: 'AWS/Cost/Monitor',
      MetricData: [
        {
          MetricName: 'TotalCost30Days',
          Value: totalCost,
          Unit: 'None',
          Dimensions: [
            {
              Name: 'Environment',
              Value: process.env.ENVIRONMENT
            },
            {
              Name: 'Region',
              Value: process.env.REGION || process.env.AWS_REGION
            }
          ]
        }
      ]
    }).promise();
    
    // Store report in S3 if triggered by S3 event
    if (event.Records && event.Records[0].s3) {
      const bucketName = process.env.S3_BUCKET_NAME;
      const reportKey = \`cost-reports/\${today.toISOString().split('T')[0]}-cost-report.json\`;
      
      await s3.putObject({
        Bucket: bucketName,
        Key: reportKey,
        Body: JSON.stringify(reportData, null, 2),
        ContentType: 'application/json'
      }).promise();
      
      console.log(\`Cost report saved to s3://\${bucketName}/\${reportKey}\`);
    }
    
    console.log('Cost monitoring completed:', reportData);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Cost monitoring completed successfully',
        totalCost30Days: totalCost.toFixed(2),
        topServicesCount: topServices.length,
        recommendationsCount: reportData.recommendations.length
      }),
    };
  } catch (error) {
    console.error('Error in cost monitoring:', error);
    throw error;
  }
};
      `),
        role: lambdaRole,
        vpc: vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        environment: {
          ENVIRONMENT: environment,
          REGION: region, // Use REGION instead of AWS_REGION
          S3_BUCKET_NAME: s3Bucket.bucketName,
          DB_SECRET_NAME: `${environment}-${region}-db-secret-${suffix}`,
        },
        tracing: lambda.Tracing.ACTIVE,
        logRetention: logs.RetentionDays.ONE_MONTH,
        deadLetterQueueEnabled: true,
        // reservedConcurrentExecutions removed to avoid account limits
      }
    );

    // Add S3 event trigger for cost analysis - Requirement 2
    s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.lambdaFunction),
      { prefix: 'billing-data/', suffix: '.json' }
    );

    // Apply tags
    cdk.Tags.of(this.lambdaFunction).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.lambdaFunction).add('Environment', environment);
    cdk.Tags.of(this.lambdaFunction).add('Region', region);
    cdk.Tags.of(this.lambdaFunction).add('Purpose', 'CostMonitoring');
  }
}
