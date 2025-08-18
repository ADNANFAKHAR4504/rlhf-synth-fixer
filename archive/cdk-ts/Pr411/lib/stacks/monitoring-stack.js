"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const cloudwatch = __importStar(require("aws-cdk-lib/aws-cloudwatch"));
const cloudwatchActions = __importStar(require("aws-cdk-lib/aws-cloudwatch-actions"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
const constructs_1 = require("constructs");
class MonitoringStack extends constructs_1.Construct {
    alarmTopic;
    dashboard;
    constructor(scope, id, props) {
        super(scope, id);
        const { environment, isPrimary } = props;
        const region = cdk.Stack.of(this).region;
        // Import existing resources from other stacks
        const dataProcessorFunction = lambda.Function.fromFunctionName(this, 'ImportedDataProcessorFunction', `serverless-data-processor-${environment}`);
        const dataIngestionBucket = s3.Bucket.fromBucketName(this, 'ImportedDataIngestionBucket', `serverless-data-ingestion-${environment}`);
        const processedDataTable = dynamodb.Table.fromTableName(this, 'ImportedProcessedDataTable', `serverless-processed-data-${environment}`);
        // Create SNS topic for alarms
        this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
            topicName: `serverless-alarms-${environment}`,
            displayName: `Serverless Pipeline Alarms - ${environment}`,
        });
        // Add tags for cost allocation and governance
        cdk.Tags.of(this.alarmTopic).add('Environment', environment);
        cdk.Tags.of(this.alarmTopic).add('Service', 'Monitoring');
        cdk.Tags.of(this.alarmTopic).add('Region', region);
        cdk.Tags.of(this.alarmTopic).add('IsPrimary', isPrimary.toString());
        // Create CloudWatch alarms for Lambda function
        const lambdaErrorsAlarm = new cloudwatch.Alarm(this, 'LambdaErrorsAlarm', {
            metric: dataProcessorFunction.metricErrors({
                period: cdk.Duration.minutes(5),
                statistic: 'Sum',
            }),
            threshold: 1,
            evaluationPeriods: 2,
            alarmDescription: 'Lambda function errors exceeded threshold',
            alarmName: `serverless-lambda-errors-${environment}`,
        });
        const lambdaDurationAlarm = new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
            metric: dataProcessorFunction.metricDuration({
                period: cdk.Duration.minutes(5),
                statistic: 'Average',
            }),
            threshold: 240000, // 4 minutes in milliseconds
            evaluationPeriods: 2,
            alarmDescription: 'Lambda function duration exceeded threshold',
            alarmName: `serverless-lambda-duration-${environment}`,
        });
        const lambdaThrottlesAlarm = new cloudwatch.Alarm(this, 'LambdaThrottlesAlarm', {
            metric: dataProcessorFunction.metricThrottles({
                period: cdk.Duration.minutes(5),
                statistic: 'Sum',
            }),
            threshold: 1,
            evaluationPeriods: 1,
            alarmDescription: 'Lambda function throttles detected',
            alarmName: `serverless-lambda-throttles-${environment}`,
        });
        // Create CloudWatch alarms for S3
        const s3ErrorsAlarm = new cloudwatch.Alarm(this, 'S3ErrorsAlarm', {
            metric: new cloudwatch.Metric({
                namespace: 'AWS/S3',
                metricName: '5xxError',
                dimensionsMap: {
                    BucketName: dataIngestionBucket.bucketName,
                },
                period: cdk.Duration.minutes(5),
                statistic: 'Sum',
            }),
            threshold: 1,
            evaluationPeriods: 1,
            alarmDescription: 'S3 bucket 5xx errors detected',
            alarmName: `serverless-s3-errors-${environment}`,
        });
        // Create CloudWatch alarms for DynamoDB
        const dynamoDBErrorsAlarm = new cloudwatch.Alarm(this, 'DynamoDBErrorsAlarm', {
            metric: new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'SystemErrors',
                dimensionsMap: {
                    TableName: processedDataTable.tableName,
                },
                period: cdk.Duration.minutes(5),
                statistic: 'Sum',
            }),
            threshold: 1,
            evaluationPeriods: 1,
            alarmDescription: 'DynamoDB system errors detected',
            alarmName: `serverless-dynamodb-errors-${environment}`,
        });
        const dynamoDBThrottlesAlarm = new cloudwatch.Alarm(this, 'DynamoDBThrottlesAlarm', {
            metric: new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'ThrottledRequests',
                dimensionsMap: {
                    TableName: processedDataTable.tableName,
                },
                period: cdk.Duration.minutes(5),
                statistic: 'Sum',
            }),
            threshold: 1,
            evaluationPeriods: 1,
            alarmDescription: 'DynamoDB throttled requests detected',
            alarmName: `serverless-dynamodb-throttles-${environment}`,
        });
        // Create CloudWatch alarms for SQS
        const sqsMessagesAlarm = new cloudwatch.Alarm(this, 'SQSMessagesAlarm', {
            metric: new cloudwatch.Metric({
                namespace: 'AWS/SQS',
                metricName: 'ApproximateNumberOfVisibleMessages',
                dimensionsMap: {
                    QueueName: `serverless-dlq-${environment}`,
                },
                period: cdk.Duration.minutes(5),
                statistic: 'Average',
            }),
            threshold: 10,
            evaluationPeriods: 2,
            alarmDescription: 'Dead letter queue has too many messages',
            alarmName: `serverless-sqs-messages-${environment}`,
        });
        // Add all alarms to SNS topic
        lambdaErrorsAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));
        lambdaDurationAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));
        lambdaThrottlesAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));
        s3ErrorsAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));
        dynamoDBErrorsAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));
        dynamoDBThrottlesAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));
        sqsMessagesAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));
        // Create CloudWatch dashboard
        this.dashboard = new cloudwatch.Dashboard(this, 'ServerlessPipelineDashboard', {
            dashboardName: `serverless-pipeline-${environment}`,
        });
        // Add widgets to dashboard
        this.dashboard.addWidgets(new cloudwatch.GraphWidget({
            title: 'Lambda Function Metrics',
            left: [
                dataProcessorFunction.metricInvocations(),
                dataProcessorFunction.metricErrors(),
                dataProcessorFunction.metricDuration(),
            ],
            right: [dataProcessorFunction.metricThrottles()],
        }), new cloudwatch.GraphWidget({
            title: 'S3 Bucket Metrics',
            left: [
                new cloudwatch.Metric({
                    namespace: 'AWS/S3',
                    metricName: 'NumberOfObjects',
                    dimensionsMap: {
                        BucketName: dataIngestionBucket.bucketName,
                    },
                }),
                new cloudwatch.Metric({
                    namespace: 'AWS/S3',
                    metricName: 'BucketSizeBytes',
                    dimensionsMap: {
                        BucketName: dataIngestionBucket.bucketName,
                    },
                }),
            ],
        }), new cloudwatch.GraphWidget({
            title: 'DynamoDB Table Metrics',
            left: [
                new cloudwatch.Metric({
                    namespace: 'AWS/DynamoDB',
                    metricName: 'ConsumedReadCapacityUnits',
                    dimensionsMap: {
                        TableName: processedDataTable.tableName,
                    },
                }),
                new cloudwatch.Metric({
                    namespace: 'AWS/DynamoDB',
                    metricName: 'ConsumedWriteCapacityUnits',
                    dimensionsMap: {
                        TableName: processedDataTable.tableName,
                    },
                }),
            ],
            right: [
                new cloudwatch.Metric({
                    namespace: 'AWS/DynamoDB',
                    metricName: 'ThrottledRequests',
                    dimensionsMap: {
                        TableName: processedDataTable.tableName,
                    },
                }),
            ],
        }), new cloudwatch.GraphWidget({
            title: 'SQS Queue Metrics',
            left: [
                new cloudwatch.Metric({
                    namespace: 'AWS/SQS',
                    metricName: 'ApproximateNumberOfVisibleMessages',
                    dimensionsMap: {
                        QueueName: `serverless-dlq-${environment}`,
                    },
                }),
            ],
        }));
        // Output the SNS topic ARN
        new cdk.CfnOutput(this, 'AlarmTopicArn', {
            value: this.alarmTopic.topicArn,
            description: 'ARN of the SNS topic for alarms',
            exportName: `serverless-alarm-topic-arn-${region}`,
        });
        new cdk.CfnOutput(this, 'DashboardName', {
            value: this.dashboard.dashboardName,
            description: 'Name of the CloudWatch dashboard',
            exportName: `serverless-dashboard-name-${region}`,
        });
    }
}
exports.MonitoringStack = MonitoringStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uaXRvcmluZy1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vbml0b3Jpbmctc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLHVFQUF5RDtBQUN6RCxzRkFBd0U7QUFDeEUsbUVBQXFEO0FBQ3JELCtEQUFpRDtBQUNqRCx1REFBeUM7QUFDekMseURBQTJDO0FBQzNDLDJDQUF1QztBQU92QyxNQUFhLGVBQWdCLFNBQVEsc0JBQVM7SUFDNUIsVUFBVSxDQUFZO0lBQ3RCLFNBQVMsQ0FBdUI7SUFFaEQsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUEyQjtRQUNuRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLE1BQU0sRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBQ3pDLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUV6Qyw4Q0FBOEM7UUFDOUMsTUFBTSxxQkFBcUIsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUM1RCxJQUFJLEVBQ0osK0JBQStCLEVBQy9CLDZCQUE2QixXQUFXLEVBQUUsQ0FDM0MsQ0FBQztRQUVGLE1BQU0sbUJBQW1CLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQ2xELElBQUksRUFDSiw2QkFBNkIsRUFDN0IsNkJBQTZCLFdBQVcsRUFBRSxDQUMzQyxDQUFDO1FBRUYsTUFBTSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FDckQsSUFBSSxFQUNKLDRCQUE0QixFQUM1Qiw2QkFBNkIsV0FBVyxFQUFFLENBQzNDLENBQUM7UUFFRiw4QkFBOEI7UUFDOUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FB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LENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUN2QyxLQUFLLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRO1lBQy9CLFdBQVcsRUFBRSxpQ0FBaUM7WUFDOUMsVUFBVSxFQUFFLDhCQUE4QixNQUFNLEVBQUU7U0FDbkQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDdkMsS0FBSyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYTtZQUNuQyxXQUFXLEVBQUUsa0NBQWtDO1lBQy9DLFVBQVUsRUFBRSw2QkFBNkIsTUFBTSxFQUFFO1NBQ2xELENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQW5SRCwwQ0FtUkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgY2xvdWR3YXRjaCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaCc7XG5pbXBvcnQgKiBhcyBjbG91ZHdhdGNoQWN0aW9ucyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaC1hY3Rpb25zJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgc25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zbnMnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmludGVyZmFjZSBNb25pdG9yaW5nU3RhY2tQcm9wcyB7XG4gIGVudmlyb25tZW50OiBzdHJpbmc7XG4gIGlzUHJpbWFyeTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIE1vbml0b3JpbmdTdGFjayBleHRlbmRzIENvbnN0cnVjdCB7XG4gIHB1YmxpYyByZWFkb25seSBhbGFybVRvcGljOiBzbnMuVG9waWM7XG4gIHB1YmxpYyByZWFkb25seSBkYXNoYm9hcmQ6IGNsb3Vkd2F0Y2guRGFzaGJvYXJkO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBNb25pdG9yaW5nU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICBjb25zdCB7IGVudmlyb25tZW50LCBpc1ByaW1hcnkgfSA9IHByb3BzO1xuICAgIGNvbnN0IHJlZ2lvbiA9IGNkay5TdGFjay5vZih0aGlzKS5yZWdpb247XG5cbiAgICAvLyBJbXBvcnQgZXhpc3RpbmcgcmVzb3VyY2VzIGZyb20gb3RoZXIgc3RhY2tzXG4gICAgY29uc3QgZGF0YVByb2Nlc3NvckZ1bmN0aW9uID0gbGFtYmRhLkZ1bmN0aW9uLmZyb21GdW5jdGlvbk5hbWUoXG4gICAgICB0aGlzLFxuICAgICAgJ0ltcG9ydGVkRGF0YVByb2Nlc3NvckZ1bmN0aW9uJyxcbiAgICAgIGBzZXJ2ZXJsZXNzLWRhdGEtcHJvY2Vzc29yLSR7ZW52aXJvbm1lbnR9YFxuICAgICk7XG5cbiAgICBjb25zdCBkYXRhSW5nZXN0aW9uQnVja2V0ID0gczMuQnVja2V0LmZyb21CdWNrZXROYW1lKFxuICAgICAgdGhpcyxcbiAgICAgICdJbXBvcnRlZERhdGFJbmdlc3Rpb25CdWNrZXQnLFxuICAgICAgYHNlcnZlcmxlc3MtZGF0YS1pbmdlc3Rpb24tJHtlbnZpcm9ubWVudH1gXG4gICAgKTtcblxuICAgIGNvbnN0IHByb2Nlc3NlZERhdGFUYWJsZSA9IGR5bmFtb2RiLlRhYmxlLmZyb21UYWJsZU5hbWUoXG4gICAgICB0aGlzLFxuICAgICAgJ0ltcG9ydGVkUHJvY2Vzc2VkRGF0YVRhYmxlJyxcbiAgICAgIGBzZXJ2ZXJsZXNzLXByb2Nlc3NlZC1kYXRhLSR7ZW52aXJvbm1lbnR9YFxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgU05TIHRvcGljIGZvciBhbGFybXNcbiAgICB0aGlzLmFsYXJtVG9waWMgPSBuZXcgc25zLlRvcGljKHRoaXMsICdBbGFybVRvcGljJywge1xuICAgICAgdG9waWNOYW1lOiBgc2VydmVybGVzcy1hbGFybXMtJHtlbnZpcm9ubWVudH1gLFxuICAgICAgZGlzcGxheU5hbWU6IGBTZXJ2ZXJsZXNzIFBpcGVsaW5lIEFsYXJtcyAtICR7ZW52aXJvbm1lbnR9YCxcbiAgICB9KTtcblxuICAgIC8vIEFkZCB0YWdzIGZvciBjb3N0IGFsbG9jYXRpb24gYW5kIGdvdmVybmFuY2VcbiAgICBjZGsuVGFncy5vZih0aGlzLmFsYXJtVG9waWMpLmFkZCgnRW52aXJvbm1lbnQnLCBlbnZpcm9ubWVudCk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcy5hbGFybVRvcGljKS5hZGQoJ1NlcnZpY2UnLCAnTW9uaXRvcmluZycpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMuYWxhcm1Ub3BpYykuYWRkKCdSZWdpb24nLCByZWdpb24pO1xuICAgIGNkay5UYWdzLm9mKHRoaXMuYWxhcm1Ub3BpYykuYWRkKCdJc1ByaW1hcnknLCBpc1ByaW1hcnkudG9TdHJpbmcoKSk7XG5cbiAgICAvLyBDcmVhdGUgQ2xvdWRXYXRjaCBhbGFybXMgZm9yIExhbWJkYSBmdW5jdGlvblxuICAgIGNvbnN0IGxhbWJkYUVycm9yc0FsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0odGhpcywgJ0xhbWJkYUVycm9yc0FsYXJtJywge1xuICAgICAgbWV0cmljOiBkYXRhUHJvY2Vzc29yRnVuY3Rpb24ubWV0cmljRXJyb3JzKHtcbiAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgIH0pLFxuICAgICAgdGhyZXNob2xkOiAxLFxuICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICBhbGFybURlc2NyaXB0aW9uOiAnTGFtYmRhIGZ1bmN0aW9uIGVycm9ycyBleGNlZWRlZCB0aHJlc2hvbGQnLFxuICAgICAgYWxhcm1OYW1lOiBgc2VydmVybGVzcy1sYW1iZGEtZXJyb3JzLSR7ZW52aXJvbm1lbnR9YCxcbiAgICB9KTtcblxuICAgIGNvbnN0IGxhbWJkYUR1cmF0aW9uQWxhcm0gPSBuZXcgY2xvdWR3YXRjaC5BbGFybShcbiAgICAgIHRoaXMsXG4gICAgICAnTGFtYmRhRHVyYXRpb25BbGFybScsXG4gICAgICB7XG4gICAgICAgIG1ldHJpYzogZGF0YVByb2Nlc3NvckZ1bmN0aW9uLm1ldHJpY0R1cmF0aW9uKHtcbiAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxuICAgICAgICB9KSxcbiAgICAgICAgdGhyZXNob2xkOiAyNDAwMDAsIC8vIDQgbWludXRlcyBpbiBtaWxsaXNlY29uZHNcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdMYW1iZGEgZnVuY3Rpb24gZHVyYXRpb24gZXhjZWVkZWQgdGhyZXNob2xkJyxcbiAgICAgICAgYWxhcm1OYW1lOiBgc2VydmVybGVzcy1sYW1iZGEtZHVyYXRpb24tJHtlbnZpcm9ubWVudH1gLFxuICAgICAgfVxuICAgICk7XG5cbiAgICBjb25zdCBsYW1iZGFUaHJvdHRsZXNBbGFybSA9IG5ldyBjbG91ZHdhdGNoLkFsYXJtKFxuICAgICAgdGhpcyxcbiAgICAgICdMYW1iZGFUaHJvdHRsZXNBbGFybScsXG4gICAgICB7XG4gICAgICAgIG1ldHJpYzogZGF0YVByb2Nlc3NvckZ1bmN0aW9uLm1ldHJpY1Rocm90dGxlcyh7XG4gICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICB9KSxcbiAgICAgICAgdGhyZXNob2xkOiAxLFxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ0xhbWJkYSBmdW5jdGlvbiB0aHJvdHRsZXMgZGV0ZWN0ZWQnLFxuICAgICAgICBhbGFybU5hbWU6IGBzZXJ2ZXJsZXNzLWxhbWJkYS10aHJvdHRsZXMtJHtlbnZpcm9ubWVudH1gLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgQ2xvdWRXYXRjaCBhbGFybXMgZm9yIFMzXG4gICAgY29uc3QgczNFcnJvcnNBbGFybSA9IG5ldyBjbG91ZHdhdGNoLkFsYXJtKHRoaXMsICdTM0Vycm9yc0FsYXJtJywge1xuICAgICAgbWV0cmljOiBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICBuYW1lc3BhY2U6ICdBV1MvUzMnLFxuICAgICAgICBtZXRyaWNOYW1lOiAnNXh4RXJyb3InLFxuICAgICAgICBkaW1lbnNpb25zTWFwOiB7XG4gICAgICAgICAgQnVja2V0TmFtZTogZGF0YUluZ2VzdGlvbkJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgICB9LFxuICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgfSksXG4gICAgICB0aHJlc2hvbGQ6IDEsXG4gICAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdTMyBidWNrZXQgNXh4IGVycm9ycyBkZXRlY3RlZCcsXG4gICAgICBhbGFybU5hbWU6IGBzZXJ2ZXJsZXNzLXMzLWVycm9ycy0ke2Vudmlyb25tZW50fWAsXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgQ2xvdWRXYXRjaCBhbGFybXMgZm9yIER5bmFtb0RCXG4gICAgY29uc3QgZHluYW1vREJFcnJvcnNBbGFybSA9IG5ldyBjbG91ZHdhdGNoLkFsYXJtKFxuICAgICAgdGhpcyxcbiAgICAgICdEeW5hbW9EQkVycm9yc0FsYXJtJyxcbiAgICAgIHtcbiAgICAgICAgbWV0cmljOiBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9EeW5hbW9EQicsXG4gICAgICAgICAgbWV0cmljTmFtZTogJ1N5c3RlbUVycm9ycycsXG4gICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgVGFibGVOYW1lOiBwcm9jZXNzZWREYXRhVGFibGUudGFibGVOYW1lLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICB9KSxcbiAgICAgICAgdGhyZXNob2xkOiAxLFxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ0R5bmFtb0RCIHN5c3RlbSBlcnJvcnMgZGV0ZWN0ZWQnLFxuICAgICAgICBhbGFybU5hbWU6IGBzZXJ2ZXJsZXNzLWR5bmFtb2RiLWVycm9ycy0ke2Vudmlyb25tZW50fWAsXG4gICAgICB9XG4gICAgKTtcblxuICAgIGNvbnN0IGR5bmFtb0RCVGhyb3R0bGVzQWxhcm0gPSBuZXcgY2xvdWR3YXRjaC5BbGFybShcbiAgICAgIHRoaXMsXG4gICAgICAnRHluYW1vREJUaHJvdHRsZXNBbGFybScsXG4gICAgICB7XG4gICAgICAgIG1ldHJpYzogbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvRHluYW1vREInLFxuICAgICAgICAgIG1ldHJpY05hbWU6ICdUaHJvdHRsZWRSZXF1ZXN0cycsXG4gICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgVGFibGVOYW1lOiBwcm9jZXNzZWREYXRhVGFibGUudGFibGVOYW1lLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICB9KSxcbiAgICAgICAgdGhyZXNob2xkOiAxLFxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ0R5bmFtb0RCIHRocm90dGxlZCByZXF1ZXN0cyBkZXRlY3RlZCcsXG4gICAgICAgIGFsYXJtTmFtZTogYHNlcnZlcmxlc3MtZHluYW1vZGItdGhyb3R0bGVzLSR7ZW52aXJvbm1lbnR9YCxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIENsb3VkV2F0Y2ggYWxhcm1zIGZvciBTUVNcbiAgICBjb25zdCBzcXNNZXNzYWdlc0FsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0odGhpcywgJ1NRU01lc3NhZ2VzQWxhcm0nLCB7XG4gICAgICBtZXRyaWM6IG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgIG5hbWVzcGFjZTogJ0FXUy9TUVMnLFxuICAgICAgICBtZXRyaWNOYW1lOiAnQXBwcm94aW1hdGVOdW1iZXJPZlZpc2libGVNZXNzYWdlcycsXG4gICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICBRdWV1ZU5hbWU6IGBzZXJ2ZXJsZXNzLWRscS0ke2Vudmlyb25tZW50fWAsXG4gICAgICAgIH0sXG4gICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxuICAgICAgfSksXG4gICAgICB0aHJlc2hvbGQ6IDEwLFxuICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICBhbGFybURlc2NyaXB0aW9uOiAnRGVhZCBsZXR0ZXIgcXVldWUgaGFzIHRvbyBtYW55IG1lc3NhZ2VzJyxcbiAgICAgIGFsYXJtTmFtZTogYHNlcnZlcmxlc3Mtc3FzLW1lc3NhZ2VzLSR7ZW52aXJvbm1lbnR9YCxcbiAgICB9KTtcblxuICAgIC8vIEFkZCBhbGwgYWxhcm1zIHRvIFNOUyB0b3BpY1xuICAgIGxhbWJkYUVycm9yc0FsYXJtLmFkZEFsYXJtQWN0aW9uKFxuICAgICAgbmV3IGNsb3Vkd2F0Y2hBY3Rpb25zLlNuc0FjdGlvbih0aGlzLmFsYXJtVG9waWMpXG4gICAgKTtcbiAgICBsYW1iZGFEdXJhdGlvbkFsYXJtLmFkZEFsYXJtQWN0aW9uKFxuICAgICAgbmV3IGNsb3Vkd2F0Y2hBY3Rpb25zLlNuc0FjdGlvbih0aGlzLmFsYXJtVG9waWMpXG4gICAgKTtcbiAgICBsYW1iZGFUaHJvdHRsZXNBbGFybS5hZGRBbGFybUFjdGlvbihcbiAgICAgIG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24odGhpcy5hbGFybVRvcGljKVxuICAgICk7XG4gICAgczNFcnJvcnNBbGFybS5hZGRBbGFybUFjdGlvbihcbiAgICAgIG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24odGhpcy5hbGFybVRvcGljKVxuICAgICk7XG4gICAgZHluYW1vREJFcnJvcnNBbGFybS5hZGRBbGFybUFjdGlvbihcbiAgICAgIG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24odGhpcy5hbGFybVRvcGljKVxuICAgICk7XG4gICAgZHluYW1vREJUaHJvdHRsZXNBbGFybS5hZGRBbGFybUFjdGlvbihcbiAgICAgIG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24odGhpcy5hbGFybVRvcGljKVxuICAgICk7XG4gICAgc3FzTWVzc2FnZXNBbGFybS5hZGRBbGFybUFjdGlvbihcbiAgICAgIG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24odGhpcy5hbGFybVRvcGljKVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgQ2xvdWRXYXRjaCBkYXNoYm9hcmRcbiAgICB0aGlzLmRhc2hib2FyZCA9IG5ldyBjbG91ZHdhdGNoLkRhc2hib2FyZChcbiAgICAgIHRoaXMsXG4gICAgICAnU2VydmVybGVzc1BpcGVsaW5lRGFzaGJvYXJkJyxcbiAgICAgIHtcbiAgICAgICAgZGFzaGJvYXJkTmFtZTogYHNlcnZlcmxlc3MtcGlwZWxpbmUtJHtlbnZpcm9ubWVudH1gLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBBZGQgd2lkZ2V0cyB0byBkYXNoYm9hcmRcbiAgICB0aGlzLmRhc2hib2FyZC5hZGRXaWRnZXRzKFxuICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICB0aXRsZTogJ0xhbWJkYSBGdW5jdGlvbiBNZXRyaWNzJyxcbiAgICAgICAgbGVmdDogW1xuICAgICAgICAgIGRhdGFQcm9jZXNzb3JGdW5jdGlvbi5tZXRyaWNJbnZvY2F0aW9ucygpLFxuICAgICAgICAgIGRhdGFQcm9jZXNzb3JGdW5jdGlvbi5tZXRyaWNFcnJvcnMoKSxcbiAgICAgICAgICBkYXRhUHJvY2Vzc29yRnVuY3Rpb24ubWV0cmljRHVyYXRpb24oKSxcbiAgICAgICAgXSxcbiAgICAgICAgcmlnaHQ6IFtkYXRhUHJvY2Vzc29yRnVuY3Rpb24ubWV0cmljVGhyb3R0bGVzKCldLFxuICAgICAgfSksXG4gICAgICBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICAgIHRpdGxlOiAnUzMgQnVja2V0IE1ldHJpY3MnLFxuICAgICAgICBsZWZ0OiBbXG4gICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9TMycsXG4gICAgICAgICAgICBtZXRyaWNOYW1lOiAnTnVtYmVyT2ZPYmplY3RzJyxcbiAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgICAgQnVja2V0TmFtZTogZGF0YUluZ2VzdGlvbkJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL1MzJyxcbiAgICAgICAgICAgIG1ldHJpY05hbWU6ICdCdWNrZXRTaXplQnl0ZXMnLFxuICAgICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgICBCdWNrZXROYW1lOiBkYXRhSW5nZXN0aW9uQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pLFxuICAgICAgICBdLFxuICAgICAgfSksXG4gICAgICBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICAgIHRpdGxlOiAnRHluYW1vREIgVGFibGUgTWV0cmljcycsXG4gICAgICAgIGxlZnQ6IFtcbiAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0R5bmFtb0RCJyxcbiAgICAgICAgICAgIG1ldHJpY05hbWU6ICdDb25zdW1lZFJlYWRDYXBhY2l0eVVuaXRzJyxcbiAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgICAgVGFibGVOYW1lOiBwcm9jZXNzZWREYXRhVGFibGUudGFibGVOYW1lLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0R5bmFtb0RCJyxcbiAgICAgICAgICAgIG1ldHJpY05hbWU6ICdDb25zdW1lZFdyaXRlQ2FwYWNpdHlVbml0cycsXG4gICAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7XG4gICAgICAgICAgICAgIFRhYmxlTmFtZTogcHJvY2Vzc2VkRGF0YVRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSksXG4gICAgICAgIF0sXG4gICAgICAgIHJpZ2h0OiBbXG4gICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9EeW5hbW9EQicsXG4gICAgICAgICAgICBtZXRyaWNOYW1lOiAnVGhyb3R0bGVkUmVxdWVzdHMnLFxuICAgICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgICBUYWJsZU5hbWU6IHByb2Nlc3NlZERhdGFUYWJsZS50YWJsZU5hbWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pLFxuICAgICAgICBdLFxuICAgICAgfSksXG4gICAgICBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICAgIHRpdGxlOiAnU1FTIFF1ZXVlIE1ldHJpY3MnLFxuICAgICAgICBsZWZ0OiBbXG4gICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9TUVMnLFxuICAgICAgICAgICAgbWV0cmljTmFtZTogJ0FwcHJveGltYXRlTnVtYmVyT2ZWaXNpYmxlTWVzc2FnZXMnLFxuICAgICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgICBRdWV1ZU5hbWU6IGBzZXJ2ZXJsZXNzLWRscS0ke2Vudmlyb25tZW50fWAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pLFxuICAgICAgICBdLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gT3V0cHV0IHRoZSBTTlMgdG9waWMgQVJOXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0FsYXJtVG9waWNBcm4nLCB7XG4gICAgICB2YWx1ZTogdGhpcy5hbGFybVRvcGljLnRvcGljQXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdBUk4gb2YgdGhlIFNOUyB0b3BpYyBmb3IgYWxhcm1zJyxcbiAgICAgIGV4cG9ydE5hbWU6IGBzZXJ2ZXJsZXNzLWFsYXJtLXRvcGljLWFybi0ke3JlZ2lvbn1gLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0Rhc2hib2FyZE5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5kYXNoYm9hcmQuZGFzaGJvYXJkTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnTmFtZSBvZiB0aGUgQ2xvdWRXYXRjaCBkYXNoYm9hcmQnLFxuICAgICAgZXhwb3J0TmFtZTogYHNlcnZlcmxlc3MtZGFzaGJvYXJkLW5hbWUtJHtyZWdpb259YCxcbiAgICB9KTtcbiAgfVxufVxuIl19