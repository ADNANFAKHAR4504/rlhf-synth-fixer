import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface SchedulingConstructProps {
  environmentSuffix: string;
  reportTopic: sns.Topic;
  auditTable: dynamodb.Table;
}

export class SchedulingConstruct extends Construct {
  public readonly reportingLambda: lambda.Function;
  public readonly healthCheckLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: SchedulingConstructProps) {
    super(scope, id);

    // Create scheduled reporting Lambda
    this.reportingLambda = new lambda.Function(this, 'ReportingLambda', {
      functionName: `${cdk.Stack.of(this).stackName}-Reporting-${props.environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const { CloudWatchClient, GetMetricStatisticsCommand } = require('@aws-sdk/client-cloudwatch');
        const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
        
        const cloudwatch = new CloudWatchClient({});
        const sns = new SNSClient({});
        
        exports.handler = async (event) => {
          console.log('Generating daily monitoring report...');
          
          try {
            // Fetch key metrics from the last 24 hours
            const endTime = new Date();
            const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
            
            const metrics = await cloudwatch.send(new GetMetricStatisticsCommand({
              Namespace: 'AWS/ApiGateway',
              MetricName: 'Count',
              StartTime: startTime,
              EndTime: endTime,
              Period: 86400, // 24 hours
              Statistics: ['Sum']
            }));
            
            const totalRequests = metrics.Datapoints?.[0]?.Sum || 0;
            
            const reportData = {
              timestamp: endTime.toISOString(),
              period: '24 hours',
              totalApiRequests: totalRequests,
              dashboardUrl: \`https://console.aws.amazon.com/cloudwatch/home?region=\${process.env.AWS_REGION}#dashboards:name=\${process.env.DASHBOARD_NAME}\`,
              generatedBy: 'Automated Monitoring System'
            };
            
            const message = \`Daily Monitoring Report - \${endTime.toDateString()}
            
Period: \${reportData.period}
Total API Requests: \${reportData.totalApiRequests}
Dashboard: \${reportData.dashboardUrl}

This is an automated report from your CloudWatch monitoring system.
\`;
            
            await sns.send(new PublishCommand({
              TopicArn: process.env.TOPIC_ARN,
              Subject: \`Daily Monitoring Report - \${endTime.toDateString()}\`,
              Message: message
            }));
            
            console.log('Daily report sent successfully');
            return { 
              statusCode: 200, 
              body: JSON.stringify({ 
                message: 'Report sent successfully',
                data: reportData
              })
            };
          } catch (error) {
            console.error('Error generating report:', error);
            throw error;
          }
        };
      `),
      environment: {
        TOPIC_ARN: props.reportTopic.topicArn,
        DASHBOARD_NAME: `${cdk.Stack.of(this).stackName}-Dashboard-${props.environmentSuffix}`,
      },
      timeout: cdk.Duration.minutes(5),
    });

    // Grant permissions to reporting Lambda
    props.reportTopic.grantPublish(this.reportingLambda);
    this.reportingLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cloudwatch:GetMetricStatistics'],
        resources: ['*'],
        effect: iam.Effect.ALLOW,
      })
    );

    // Health check Lambda
    this.healthCheckLambda = new lambda.Function(this, 'HealthCheckLambda', {
      functionName: `${cdk.Stack.of(this).stackName}-HealthCheck-${props.environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
        const dynamodb = new DynamoDBClient({});
        
        exports.handler = async (event) => {
          const timestamp = new Date().toISOString();
          console.log(\`Running health check at \${timestamp}\`);
          
          try {
            await dynamodb.send(new PutItemCommand({
              TableName: process.env.TABLE_NAME,
              Item: {
                id: { S: 'health-check-' + timestamp },
                timestamp: { S: timestamp },
                type: { S: 'HEALTH_CHECK' },
                status: { S: 'OK' },
                message: { S: 'Monitoring system is healthy' },
                ttl: { N: String(Math.floor(Date.now() / 1000) + 86400) } // 24 hours
              }
            }));
            
            console.log('Health check completed successfully');
            return { 
              statusCode: 200, 
              body: JSON.stringify({ 
                status: 'OK',
                timestamp: timestamp,
                message: 'Health check completed successfully'
              })
            };
          } catch (error) {
            console.error('Health check failed:', error);
            throw error;
          }
        };
      `),
      environment: {
        TABLE_NAME: props.auditTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
    });

    props.auditTable.grantWriteData(this.healthCheckLambda);

    // Create EventBridge rules for scheduled reporting
    const dailyReportRule = new events.Rule(this, 'DailyReportRule', {
      ruleName: `${cdk.Stack.of(this).stackName}-DailyReport-${props.environmentSuffix}`,
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '9', // 9 AM UTC
      }),
      description: 'Trigger daily monitoring report',
    });

    dailyReportRule.addTarget(new targets.LambdaFunction(this.reportingLambda));

    // Create health check rule (every hour)
    const healthCheckRule = new events.Rule(this, 'HealthCheckRule', {
      ruleName: `${cdk.Stack.of(this).stackName}-HealthCheck-${props.environmentSuffix}`,
      schedule: events.Schedule.rate(cdk.Duration.hours(1)),
      description: 'Periodic health check of monitoring system',
    });

    healthCheckRule.addTarget(
      new targets.LambdaFunction(this.healthCheckLambda)
    );

    // Outputs
    new cdk.CfnOutput(this, 'ReportingLambdaArn', {
      value: this.reportingLambda.functionArn,
      description: 'ARN of the reporting Lambda function',
      exportName: `${cdk.Stack.of(this).stackName}-ReportingLambdaArn-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'HealthCheckLambdaArn', {
      value: this.healthCheckLambda.functionArn,
      description: 'ARN of the health check Lambda function',
      exportName: `${cdk.Stack.of(this).stackName}-HealthCheckLambdaArn-${props.environmentSuffix}`,
    });
  }
}
