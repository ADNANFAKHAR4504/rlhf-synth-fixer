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
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
class MonitoringStack extends cdk.NestedStack {
    dashboard;
    alarmTopic;
    constructor(scope, id, props) {
        super(scope, id, props);
        const { environmentSuffix, lambdaFunctions, restApi, detectionTable, imageBucket, } = props;
        // SNS Topic for CloudWatch Alarms
        this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
            topicName: `serverlessapp-alarms-${environmentSuffix}`,
            displayName: 'CloudWatch Alarms for Image Detector',
        });
        // CloudWatch Dashboard
        this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
            dashboardName: `serverlessapp-image-detector-${environmentSuffix}`,
            defaultInterval: cdk.Duration.hours(1),
        });
        // Lambda Functions Monitoring
        const lambdaWidgets = [];
        lambdaFunctions.forEach(func => {
            // Duration metrics
            const durationWidget = new cloudwatch.GraphWidget({
                title: `${func.functionName} - Duration`,
                left: [
                    func.metricDuration({
                        statistic: 'Average',
                        period: cdk.Duration.minutes(5),
                    }),
                ],
                width: 12,
                height: 6,
            });
            // Error rate metrics
            const errorWidget = new cloudwatch.GraphWidget({
                title: `${func.functionName} - Errors`,
                left: [
                    func.metricErrors({
                        statistic: 'Sum',
                        period: cdk.Duration.minutes(5),
                    }),
                    func.metricThrottles({
                        statistic: 'Sum',
                        period: cdk.Duration.minutes(5),
                    }),
                ],
                width: 12,
                height: 6,
            });
            // Invocation metrics
            const invocationWidget = new cloudwatch.GraphWidget({
                title: `${func.functionName} - Invocations`,
                left: [
                    func.metricInvocations({
                        statistic: 'Sum',
                        period: cdk.Duration.minutes(5),
                    }),
                ],
                width: 12,
                height: 6,
            });
            lambdaWidgets.push(durationWidget, errorWidget, invocationWidget);
            // Create alarms for each Lambda function
            const errorAlarm = new cloudwatch.Alarm(this, `${func.functionName}ErrorAlarm`, {
                alarmName: `${func.functionName}-errors-${environmentSuffix}`,
                alarmDescription: `High error rate for ${func.functionName}`,
                metric: func.metricErrors({
                    statistic: 'Sum',
                    period: cdk.Duration.minutes(5),
                }),
                threshold: environmentSuffix === 'prod' ? 10 : 5,
                evaluationPeriods: 2,
                treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
            });
            const durationAlarm = new cloudwatch.Alarm(this, `${func.functionName}DurationAlarm`, {
                alarmName: `${func.functionName}-duration-${environmentSuffix}`,
                alarmDescription: `High duration for ${func.functionName}`,
                metric: func.metricDuration({
                    statistic: 'Average',
                    period: cdk.Duration.minutes(5),
                }),
                threshold: 30000, // 30 seconds
                evaluationPeriods: 3,
                treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
            });
            errorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));
            durationAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));
        });
        // API Gateway Monitoring
        const apiLatencyWidget = new cloudwatch.GraphWidget({
            title: 'API Gateway - Latency',
            left: [
                restApi.metricLatency({
                    statistic: 'Average',
                    period: cdk.Duration.minutes(5),
                }),
            ],
            width: 12,
            height: 6,
        });
        const apiErrorWidget = new cloudwatch.GraphWidget({
            title: 'API Gateway - Errors',
            left: [
                new cloudwatch.Metric({
                    namespace: 'AWS/ApiGateway',
                    metricName: '4XXError',
                    dimensionsMap: {
                        ApiName: restApi.restApiName,
                    },
                    statistic: 'Sum',
                    period: cdk.Duration.minutes(5),
                }),
                new cloudwatch.Metric({
                    namespace: 'AWS/ApiGateway',
                    metricName: '5XXError',
                    dimensionsMap: {
                        ApiName: restApi.restApiName,
                    },
                    statistic: 'Sum',
                    period: cdk.Duration.minutes(5),
                }),
            ],
            width: 12,
            height: 6,
        });
        const apiCountWidget = new cloudwatch.GraphWidget({
            title: 'API Gateway - Request Count',
            left: [
                restApi.metricCount({
                    statistic: 'Sum',
                    period: cdk.Duration.minutes(5),
                }),
            ],
            width: 12,
            height: 6,
        });
        // DynamoDB Monitoring
        const dynamoReadWidget = new cloudwatch.GraphWidget({
            title: 'DynamoDB - Read Metrics',
            left: [
                detectionTable.metricConsumedReadCapacityUnits({
                    statistic: 'Sum',
                    period: cdk.Duration.minutes(5),
                }),
                detectionTable.metricSuccessfulRequestLatency({
                    statistic: 'Average',
                    period: cdk.Duration.minutes(5),
                    dimensionsMap: {
                        Operation: 'GetItem',
                    },
                }),
            ],
            width: 12,
            height: 6,
        });
        const dynamoWriteWidget = new cloudwatch.GraphWidget({
            title: 'DynamoDB - Write Metrics',
            left: [
                detectionTable.metricConsumedWriteCapacityUnits({
                    statistic: 'Sum',
                    period: cdk.Duration.minutes(5),
                }),
                detectionTable.metricSuccessfulRequestLatency({
                    statistic: 'Average',
                    period: cdk.Duration.minutes(5),
                    dimensionsMap: {
                        Operation: 'PutItem',
                    },
                }),
            ],
            width: 12,
            height: 6,
        });
        // S3 Monitoring
        const s3RequestsWidget = new cloudwatch.GraphWidget({
            title: 'S3 - Request Metrics',
            left: [
                new cloudwatch.Metric({
                    namespace: 'AWS/S3',
                    metricName: 'NumberOfObjects',
                    dimensionsMap: {
                        BucketName: imageBucket.bucketName,
                        StorageType: 'AllStorageTypes',
                    },
                    statistic: 'Average',
                    period: cdk.Duration.hours(1),
                }),
            ],
            width: 12,
            height: 6,
        });
        // Business Metrics Widget
        const businessMetricsWidget = new cloudwatch.GraphWidget({
            title: 'Business Metrics - Detection Results',
            left: [
                new cloudwatch.Metric({
                    namespace: 'ServerlessImageDetector',
                    metricName: 'CatsDetected',
                    statistic: 'Sum',
                    period: cdk.Duration.hours(1),
                }),
                new cloudwatch.Metric({
                    namespace: 'ServerlessImageDetector',
                    metricName: 'DogsDetected',
                    statistic: 'Sum',
                    period: cdk.Duration.hours(1),
                }),
                new cloudwatch.Metric({
                    namespace: 'ServerlessImageDetector',
                    metricName: 'OthersDetected',
                    statistic: 'Sum',
                    period: cdk.Duration.hours(1),
                }),
            ],
            width: 12,
            height: 6,
        });
        // Add all widgets to dashboard
        this.dashboard.addWidgets(
        // Lambda section
        new cloudwatch.TextWidget({
            markdown: '# Lambda Functions Monitoring',
            width: 24,
            height: 1,
        }), ...lambdaWidgets, 
        // API Gateway section
        new cloudwatch.TextWidget({
            markdown: '# API Gateway Monitoring',
            width: 24,
            height: 1,
        }), apiLatencyWidget, apiErrorWidget, apiCountWidget, 
        // DynamoDB section
        new cloudwatch.TextWidget({
            markdown: '# DynamoDB Monitoring',
            width: 24,
            height: 1,
        }), dynamoReadWidget, dynamoWriteWidget, 
        // S3 section
        new cloudwatch.TextWidget({
            markdown: '# S3 Storage Monitoring',
            width: 24,
            height: 1,
        }), s3RequestsWidget, 
        // Business metrics section
        new cloudwatch.TextWidget({
            markdown: '# Business Metrics',
            width: 24,
            height: 1,
        }), businessMetricsWidget);
        // API Gateway Alarms
        const apiErrorAlarm = new cloudwatch.Alarm(this, 'ApiErrorAlarm', {
            alarmName: `api-gateway-errors-${environmentSuffix}`,
            alarmDescription: 'High error rate in API Gateway',
            metric: new cloudwatch.Metric({
                namespace: 'AWS/ApiGateway',
                metricName: '5XXError',
                dimensionsMap: {
                    ApiName: restApi.restApiName,
                },
                statistic: 'Sum',
                period: cdk.Duration.minutes(5),
            }),
            threshold: environmentSuffix === 'prod' ? 50 : 10,
            evaluationPeriods: 2,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        });
        apiErrorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));
        // DynamoDB Alarms
        const dynamoThrottleAlarm = new cloudwatch.Alarm(this, 'DynamoThrottleAlarm', {
            alarmName: `dynamodb-throttles-${environmentSuffix}`,
            alarmDescription: 'DynamoDB throttling detected',
            metric: detectionTable.metricThrottledRequests({
                statistic: 'Sum',
                period: cdk.Duration.minutes(5),
            }),
            threshold: 0,
            evaluationPeriods: 1,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        });
        dynamoThrottleAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));
        // Add resource tags
        cdk.Tags.of(this).add('Component', 'Monitoring');
        cdk.Tags.of(this).add('Environment', environmentSuffix);
        cdk.Tags.of(this).add('ManagedBy', 'CDK');
    }
}
exports.MonitoringStack = MonitoringStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uaXRvcmluZy1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vbml0b3Jpbmctc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBRW5DLHVFQUF5RDtBQUN6RCxzRkFBd0U7QUFJeEUseURBQTJDO0FBVzNDLE1BQWEsZUFBZ0IsU0FBUSxHQUFHLENBQUMsV0FBVztJQUNsQyxTQUFTLENBQXVCO0lBQ2hDLFVBQVUsQ0FBWTtJQUV0QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTJCO1FBQ25FLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sRUFDSixpQkFBaUIsRUFDakIsZUFBZSxFQUNmLE9BQU8sRUFDUCxjQUFjLEVBQ2QsV0FBVyxHQUNaLEdBQUcsS0FBSyxDQUFDO1FBRVYsa0NBQWtDO1FBQ2xDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDbEQsU0FBUyxFQUFFLHdCQUF3QixpQkFBaUIsRUFBRTtZQUN0RCxXQUFXLEVBQUUsc0NBQXNDO1NBQ3BELENBQUMsQ0FBQztRQUVILHVCQUF1QjtRQUN2QixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksVUFBVSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO1lBQzNELGFBQWEsRUFBRSxnQ0FBZ0MsaUJBQWlCLEVBQUU7WUFDbEUsZUFBZSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUN2QyxDQUFDLENBQUM7UUFFSCw4QkFBOEI7UUFDOUIsTUFBTSxhQUFhLEdBQXlCLEVBQUUsQ0FBQztRQUUvQyxlQUFlLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzdCLG1CQUFtQjtZQUNuQixNQUFN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QkFBaUIsQ0FBQyxDQUFDO1FBQ3hELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDNUMsQ0FBQztDQUNGO0FBM1ZELDBDQTJWQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIGNsb3Vkd2F0Y2ggZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2gnO1xuaW1wb3J0ICogYXMgY2xvdWR3YXRjaEFjdGlvbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2gtYWN0aW9ucyc7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIHNucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIE1vbml0b3JpbmdTdGFja1Byb3BzIGV4dGVuZHMgY2RrLk5lc3RlZFN0YWNrUHJvcHMge1xuICBlbnZpcm9ubWVudFN1ZmZpeDogc3RyaW5nO1xuICBsYW1iZGFGdW5jdGlvbnM6IGxhbWJkYS5GdW5jdGlvbltdO1xuICByZXN0QXBpOiBhcGlnYXRld2F5LlJlc3RBcGk7XG4gIGRldGVjdGlvblRhYmxlOiBkeW5hbW9kYi5UYWJsZTtcbiAgaW1hZ2VCdWNrZXQ6IHMzLkJ1Y2tldDtcbn1cblxuZXhwb3J0IGNsYXNzIE1vbml0b3JpbmdTdGFjayBleHRlbmRzIGNkay5OZXN0ZWRTdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSBkYXNoYm9hcmQ6IGNsb3Vkd2F0Y2guRGFzaGJvYXJkO1xuICBwdWJsaWMgcmVhZG9ubHkgYWxhcm1Ub3BpYzogc25zLlRvcGljO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBNb25pdG9yaW5nU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3Qge1xuICAgICAgZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICBsYW1iZGFGdW5jdGlvbnMsXG4gICAgICByZXN0QXBpLFxuICAgICAgZGV0ZWN0aW9uVGFibGUsXG4gICAgICBpbWFnZUJ1Y2tldCxcbiAgICB9ID0gcHJvcHM7XG5cbiAgICAvLyBTTlMgVG9waWMgZm9yIENsb3VkV2F0Y2ggQWxhcm1zXG4gICAgdGhpcy5hbGFybVRvcGljID0gbmV3IHNucy5Ub3BpYyh0aGlzLCAnQWxhcm1Ub3BpYycsIHtcbiAgICAgIHRvcGljTmFtZTogYHNlcnZlcmxlc3NhcHAtYWxhcm1zLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIGRpc3BsYXlOYW1lOiAnQ2xvdWRXYXRjaCBBbGFybXMgZm9yIEltYWdlIERldGVjdG9yJyxcbiAgICB9KTtcblxuICAgIC8vIENsb3VkV2F0Y2ggRGFzaGJvYXJkXG4gICAgdGhpcy5kYXNoYm9hcmQgPSBuZXcgY2xvdWR3YXRjaC5EYXNoYm9hcmQodGhpcywgJ0Rhc2hib2FyZCcsIHtcbiAgICAgIGRhc2hib2FyZE5hbWU6IGBzZXJ2ZXJsZXNzYXBwLWltYWdlLWRldGVjdG9yLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIGRlZmF1bHRJbnRlcnZhbDogY2RrLkR1cmF0aW9uLmhvdXJzKDEpLFxuICAgIH0pO1xuXG4gICAgLy8gTGFtYmRhIEZ1bmN0aW9ucyBNb25pdG9yaW5nXG4gICAgY29uc3QgbGFtYmRhV2lkZ2V0czogY2xvdWR3YXRjaC5JV2lkZ2V0W10gPSBbXTtcblxuICAgIGxhbWJkYUZ1bmN0aW9ucy5mb3JFYWNoKGZ1bmMgPT4ge1xuICAgICAgLy8gRHVyYXRpb24gbWV0cmljc1xuICAgICAgY29uc3QgZHVyYXRpb25XaWRnZXQgPSBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICAgIHRpdGxlOiBgJHtmdW5jLmZ1bmN0aW9uTmFtZX0gLSBEdXJhdGlvbmAsXG4gICAgICAgIGxlZnQ6IFtcbiAgICAgICAgICBmdW5jLm1ldHJpY0R1cmF0aW9uKHtcbiAgICAgICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxuICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgXSxcbiAgICAgICAgd2lkdGg6IDEyLFxuICAgICAgICBoZWlnaHQ6IDYsXG4gICAgICB9KTtcblxuICAgICAgLy8gRXJyb3IgcmF0ZSBtZXRyaWNzXG4gICAgICBjb25zdCBlcnJvcldpZGdldCA9IG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgICAgdGl0bGU6IGAke2Z1bmMuZnVuY3Rpb25OYW1lfSAtIEVycm9yc2AsXG4gICAgICAgIGxlZnQ6IFtcbiAgICAgICAgICBmdW5jLm1ldHJpY0Vycm9ycyh7XG4gICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICBmdW5jLm1ldHJpY1Rocm90dGxlcyh7XG4gICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgXSxcbiAgICAgICAgd2lkdGg6IDEyLFxuICAgICAgICBoZWlnaHQ6IDYsXG4gICAgICB9KTtcblxuICAgICAgLy8gSW52b2NhdGlvbiBtZXRyaWNzXG4gICAgICBjb25zdCBpbnZvY2F0aW9uV2lkZ2V0ID0gbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICB0aXRsZTogYCR7ZnVuYy5mdW5jdGlvbk5hbWV9IC0gSW52b2NhdGlvbnNgLFxuICAgICAgICBsZWZ0OiBbXG4gICAgICAgICAgZnVuYy5tZXRyaWNJbnZvY2F0aW9ucyh7XG4gICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgXSxcbiAgICAgICAgd2lkdGg6IDEyLFxuICAgICAgICBoZWlnaHQ6IDYsXG4gICAgICB9KTtcblxuICAgICAgbGFtYmRhV2lkZ2V0cy5wdXNoKGR1cmF0aW9uV2lkZ2V0LCBlcnJvcldpZGdldCwgaW52b2NhdGlvbldpZGdldCk7XG5cbiAgICAgIC8vIENyZWF0ZSBhbGFybXMgZm9yIGVhY2ggTGFtYmRhIGZ1bmN0aW9uXG4gICAgICBjb25zdCBlcnJvckFsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0oXG4gICAgICAgIHRoaXMsXG4gICAgICAgIGAke2Z1bmMuZnVuY3Rpb25OYW1lfUVycm9yQWxhcm1gLFxuICAgICAgICB7XG4gICAgICAgICAgYWxhcm1OYW1lOiBgJHtmdW5jLmZ1bmN0aW9uTmFtZX0tZXJyb3JzLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBhbGFybURlc2NyaXB0aW9uOiBgSGlnaCBlcnJvciByYXRlIGZvciAke2Z1bmMuZnVuY3Rpb25OYW1lfWAsXG4gICAgICAgICAgbWV0cmljOiBmdW5jLm1ldHJpY0Vycm9ycyh7XG4gICAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgICB0aHJlc2hvbGQ6IGVudmlyb25tZW50U3VmZml4ID09PSAncHJvZCcgPyAxMCA6IDUsXG4gICAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICAgICAgdHJlYXRNaXNzaW5nRGF0YTogY2xvdWR3YXRjaC5UcmVhdE1pc3NpbmdEYXRhLk5PVF9CUkVBQ0hJTkcsXG4gICAgICAgIH1cbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IGR1cmF0aW9uQWxhcm0gPSBuZXcgY2xvdWR3YXRjaC5BbGFybShcbiAgICAgICAgdGhpcyxcbiAgICAgICAgYCR7ZnVuYy5mdW5jdGlvbk5hbWV9RHVyYXRpb25BbGFybWAsXG4gICAgICAgIHtcbiAgICAgICAgICBhbGFybU5hbWU6IGAke2Z1bmMuZnVuY3Rpb25OYW1lfS1kdXJhdGlvbi0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogYEhpZ2ggZHVyYXRpb24gZm9yICR7ZnVuYy5mdW5jdGlvbk5hbWV9YCxcbiAgICAgICAgICBtZXRyaWM6IGZ1bmMubWV0cmljRHVyYXRpb24oe1xuICAgICAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXG4gICAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICAgIH0pLFxuICAgICAgICAgIHRocmVzaG9sZDogMzAwMDAsIC8vIDMwIHNlY29uZHNcbiAgICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMyxcbiAgICAgICAgICB0cmVhdE1pc3NpbmdEYXRhOiBjbG91ZHdhdGNoLlRyZWF0TWlzc2luZ0RhdGEuTk9UX0JSRUFDSElORyxcbiAgICAgICAgfVxuICAgICAgKTtcblxuICAgICAgZXJyb3JBbGFybS5hZGRBbGFybUFjdGlvbihcbiAgICAgICAgbmV3IGNsb3Vkd2F0Y2hBY3Rpb25zLlNuc0FjdGlvbih0aGlzLmFsYXJtVG9waWMpXG4gICAgICApO1xuICAgICAgZHVyYXRpb25BbGFybS5hZGRBbGFybUFjdGlvbihcbiAgICAgICAgbmV3IGNsb3Vkd2F0Y2hBY3Rpb25zLlNuc0FjdGlvbih0aGlzLmFsYXJtVG9waWMpXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgLy8gQVBJIEdhdGV3YXkgTW9uaXRvcmluZ1xuICAgIGNvbnN0IGFwaUxhdGVuY3lXaWRnZXQgPSBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICB0aXRsZTogJ0FQSSBHYXRld2F5IC0gTGF0ZW5jeScsXG4gICAgICBsZWZ0OiBbXG4gICAgICAgIHJlc3RBcGkubWV0cmljTGF0ZW5jeSh7XG4gICAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXG4gICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgfSksXG4gICAgICBdLFxuICAgICAgd2lkdGg6IDEyLFxuICAgICAgaGVpZ2h0OiA2LFxuICAgIH0pO1xuXG4gICAgY29uc3QgYXBpRXJyb3JXaWRnZXQgPSBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICB0aXRsZTogJ0FQSSBHYXRld2F5IC0gRXJyb3JzJyxcbiAgICAgIGxlZnQ6IFtcbiAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQXBpR2F0ZXdheScsXG4gICAgICAgICAgbWV0cmljTmFtZTogJzRYWEVycm9yJyxcbiAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7XG4gICAgICAgICAgICBBcGlOYW1lOiByZXN0QXBpLnJlc3RBcGlOYW1lLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICB9KSxcbiAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQXBpR2F0ZXdheScsXG4gICAgICAgICAgbWV0cmljTmFtZTogJzVYWEVycm9yJyxcbiAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7XG4gICAgICAgICAgICBBcGlOYW1lOiByZXN0QXBpLnJlc3RBcGlOYW1lLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICB9KSxcbiAgICAgIF0sXG4gICAgICB3aWR0aDogMTIsXG4gICAgICBoZWlnaHQ6IDYsXG4gICAgfSk7XG5cbiAgICBjb25zdCBhcGlDb3VudFdpZGdldCA9IG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgIHRpdGxlOiAnQVBJIEdhdGV3YXkgLSBSZXF1ZXN0IENvdW50JyxcbiAgICAgIGxlZnQ6IFtcbiAgICAgICAgcmVzdEFwaS5tZXRyaWNDb3VudCh7XG4gICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICB9KSxcbiAgICAgIF0sXG4gICAgICB3aWR0aDogMTIsXG4gICAgICBoZWlnaHQ6IDYsXG4gICAgfSk7XG5cbiAgICAvLyBEeW5hbW9EQiBNb25pdG9yaW5nXG4gICAgY29uc3QgZHluYW1vUmVhZFdpZGdldCA9IG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgIHRpdGxlOiAnRHluYW1vREIgLSBSZWFkIE1ldHJpY3MnLFxuICAgICAgbGVmdDogW1xuICAgICAgICBkZXRlY3Rpb25UYWJsZS5tZXRyaWNDb25zdW1lZFJlYWRDYXBhY2l0eVVuaXRzKHtcbiAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgIH0pLFxuICAgICAgICBkZXRlY3Rpb25UYWJsZS5tZXRyaWNTdWNjZXNzZnVsUmVxdWVzdExhdGVuY3koe1xuICAgICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxuICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgT3BlcmF0aW9uOiAnR2V0SXRlbScsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICBdLFxuICAgICAgd2lkdGg6IDEyLFxuICAgICAgaGVpZ2h0OiA2LFxuICAgIH0pO1xuXG4gICAgY29uc3QgZHluYW1vV3JpdGVXaWRnZXQgPSBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICB0aXRsZTogJ0R5bmFtb0RCIC0gV3JpdGUgTWV0cmljcycsXG4gICAgICBsZWZ0OiBbXG4gICAgICAgIGRldGVjdGlvblRhYmxlLm1ldHJpY0NvbnN1bWVkV3JpdGVDYXBhY2l0eVVuaXRzKHtcbiAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgIH0pLFxuICAgICAgICBkZXRlY3Rpb25UYWJsZS5tZXRyaWNTdWNjZXNzZnVsUmVxdWVzdExhdGVuY3koe1xuICAgICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxuICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgT3BlcmF0aW9uOiAnUHV0SXRlbScsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICBdLFxuICAgICAgd2lkdGg6IDEyLFxuICAgICAgaGVpZ2h0OiA2LFxuICAgIH0pO1xuXG4gICAgLy8gUzMgTW9uaXRvcmluZ1xuICAgIGNvbnN0IHMzUmVxdWVzdHNXaWRnZXQgPSBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICB0aXRsZTogJ1MzIC0gUmVxdWVzdCBNZXRyaWNzJyxcbiAgICAgIGxlZnQ6IFtcbiAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvUzMnLFxuICAgICAgICAgIG1ldHJpY05hbWU6ICdOdW1iZXJPZk9iamVjdHMnLFxuICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgIEJ1Y2tldE5hbWU6IGltYWdlQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICAgICAgICBTdG9yYWdlVHlwZTogJ0FsbFN0b3JhZ2VUeXBlcycsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgICBwZXJpb2Q6IGNkay5EdXJhdGlvbi5ob3VycygxKSxcbiAgICAgICAgfSksXG4gICAgICBdLFxuICAgICAgd2lkdGg6IDEyLFxuICAgICAgaGVpZ2h0OiA2LFxuICAgIH0pO1xuXG4gICAgLy8gQnVzaW5lc3MgTWV0cmljcyBXaWRnZXRcbiAgICBjb25zdCBidXNpbmVzc01ldHJpY3NXaWRnZXQgPSBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICB0aXRsZTogJ0J1c2luZXNzIE1ldHJpY3MgLSBEZXRlY3Rpb24gUmVzdWx0cycsXG4gICAgICBsZWZ0OiBbXG4gICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgbmFtZXNwYWNlOiAnU2VydmVybGVzc0ltYWdlRGV0ZWN0b3InLFxuICAgICAgICAgIG1ldHJpY05hbWU6ICdDYXRzRGV0ZWN0ZWQnLFxuICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24uaG91cnMoMSksXG4gICAgICAgIH0pLFxuICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgIG5hbWVzcGFjZTogJ1NlcnZlcmxlc3NJbWFnZURldGVjdG9yJyxcbiAgICAgICAgICBtZXRyaWNOYW1lOiAnRG9nc0RldGVjdGVkJyxcbiAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLmhvdXJzKDEpLFxuICAgICAgICB9KSxcbiAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICBuYW1lc3BhY2U6ICdTZXJ2ZXJsZXNzSW1hZ2VEZXRlY3RvcicsXG4gICAgICAgICAgbWV0cmljTmFtZTogJ090aGVyc0RldGVjdGVkJyxcbiAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLmhvdXJzKDEpLFxuICAgICAgICB9KSxcbiAgICAgIF0sXG4gICAgICB3aWR0aDogMTIsXG4gICAgICBoZWlnaHQ6IDYsXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgYWxsIHdpZGdldHMgdG8gZGFzaGJvYXJkXG4gICAgdGhpcy5kYXNoYm9hcmQuYWRkV2lkZ2V0cyhcbiAgICAgIC8vIExhbWJkYSBzZWN0aW9uXG4gICAgICBuZXcgY2xvdWR3YXRjaC5UZXh0V2lkZ2V0KHtcbiAgICAgICAgbWFya2Rvd246ICcjIExhbWJkYSBGdW5jdGlvbnMgTW9uaXRvcmluZycsXG4gICAgICAgIHdpZHRoOiAyNCxcbiAgICAgICAgaGVpZ2h0OiAxLFxuICAgICAgfSksXG4gICAgICAuLi5sYW1iZGFXaWRnZXRzLFxuXG4gICAgICAvLyBBUEkgR2F0ZXdheSBzZWN0aW9uXG4gICAgICBuZXcgY2xvdWR3YXRjaC5UZXh0V2lkZ2V0KHtcbiAgICAgICAgbWFya2Rvd246ICcjIEFQSSBHYXRld2F5IE1vbml0b3JpbmcnLFxuICAgICAgICB3aWR0aDogMjQsXG4gICAgICAgIGhlaWdodDogMSxcbiAgICAgIH0pLFxuICAgICAgYXBpTGF0ZW5jeVdpZGdldCxcbiAgICAgIGFwaUVycm9yV2lkZ2V0LFxuICAgICAgYXBpQ291bnRXaWRnZXQsXG5cbiAgICAgIC8vIER5bmFtb0RCIHNlY3Rpb25cbiAgICAgIG5ldyBjbG91ZHdhdGNoLlRleHRXaWRnZXQoe1xuICAgICAgICBtYXJrZG93bjogJyMgRHluYW1vREIgTW9uaXRvcmluZycsXG4gICAgICAgIHdpZHRoOiAyNCxcbiAgICAgICAgaGVpZ2h0OiAxLFxuICAgICAgfSksXG4gICAgICBkeW5hbW9SZWFkV2lkZ2V0LFxuICAgICAgZHluYW1vV3JpdGVXaWRnZXQsXG5cbiAgICAgIC8vIFMzIHNlY3Rpb25cbiAgICAgIG5ldyBjbG91ZHdhdGNoLlRleHRXaWRnZXQoe1xuICAgICAgICBtYXJrZG93bjogJyMgUzMgU3RvcmFnZSBNb25pdG9yaW5nJyxcbiAgICAgICAgd2lkdGg6IDI0LFxuICAgICAgICBoZWlnaHQ6IDEsXG4gICAgICB9KSxcbiAgICAgIHMzUmVxdWVzdHNXaWRnZXQsXG5cbiAgICAgIC8vIEJ1c2luZXNzIG1ldHJpY3Mgc2VjdGlvblxuICAgICAgbmV3IGNsb3Vkd2F0Y2guVGV4dFdpZGdldCh7XG4gICAgICAgIG1hcmtkb3duOiAnIyBCdXNpbmVzcyBNZXRyaWNzJyxcbiAgICAgICAgd2lkdGg6IDI0LFxuICAgICAgICBoZWlnaHQ6IDEsXG4gICAgICB9KSxcbiAgICAgIGJ1c2luZXNzTWV0cmljc1dpZGdldFxuICAgICk7XG5cbiAgICAvLyBBUEkgR2F0ZXdheSBBbGFybXNcbiAgICBjb25zdCBhcGlFcnJvckFsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0odGhpcywgJ0FwaUVycm9yQWxhcm0nLCB7XG4gICAgICBhbGFybU5hbWU6IGBhcGktZ2F0ZXdheS1lcnJvcnMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ0hpZ2ggZXJyb3IgcmF0ZSBpbiBBUEkgR2F0ZXdheScsXG4gICAgICBtZXRyaWM6IG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgIG5hbWVzcGFjZTogJ0FXUy9BcGlHYXRld2F5JyxcbiAgICAgICAgbWV0cmljTmFtZTogJzVYWEVycm9yJyxcbiAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgIEFwaU5hbWU6IHJlc3RBcGkucmVzdEFwaU5hbWUsXG4gICAgICAgIH0sXG4gICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgIHBlcmlvZDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICB9KSxcbiAgICAgIHRocmVzaG9sZDogZW52aXJvbm1lbnRTdWZmaXggPT09ICdwcm9kJyA/IDUwIDogMTAsXG4gICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcbiAgICAgIHRyZWF0TWlzc2luZ0RhdGE6IGNsb3Vkd2F0Y2guVHJlYXRNaXNzaW5nRGF0YS5OT1RfQlJFQUNISU5HLFxuICAgIH0pO1xuXG4gICAgYXBpRXJyb3JBbGFybS5hZGRBbGFybUFjdGlvbihcbiAgICAgIG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24odGhpcy5hbGFybVRvcGljKVxuICAgICk7XG5cbiAgICAvLyBEeW5hbW9EQiBBbGFybXNcbiAgICBjb25zdCBkeW5hbW9UaHJvdHRsZUFsYXJtID0gbmV3IGNsb3Vkd2F0Y2guQWxhcm0oXG4gICAgICB0aGlzLFxuICAgICAgJ0R5bmFtb1Rocm90dGxlQWxhcm0nLFxuICAgICAge1xuICAgICAgICBhbGFybU5hbWU6IGBkeW5hbW9kYi10aHJvdHRsZXMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBhbGFybURlc2NyaXB0aW9uOiAnRHluYW1vREIgdGhyb3R0bGluZyBkZXRlY3RlZCcsXG4gICAgICAgIG1ldHJpYzogZGV0ZWN0aW9uVGFibGUubWV0cmljVGhyb3R0bGVkUmVxdWVzdHMoe1xuICAgICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgICAgcGVyaW9kOiBjZGsuRHVyYXRpb24ubWludXRlcyg1KSxcbiAgICAgICAgfSksXG4gICAgICAgIHRocmVzaG9sZDogMCxcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDEsXG4gICAgICAgIHRyZWF0TWlzc2luZ0RhdGE6IGNsb3Vkd2F0Y2guVHJlYXRNaXNzaW5nRGF0YS5OT1RfQlJFQUNISU5HLFxuICAgICAgfVxuICAgICk7XG5cbiAgICBkeW5hbW9UaHJvdHRsZUFsYXJtLmFkZEFsYXJtQWN0aW9uKFxuICAgICAgbmV3IGNsb3Vkd2F0Y2hBY3Rpb25zLlNuc0FjdGlvbih0aGlzLmFsYXJtVG9waWMpXG4gICAgKTtcblxuICAgIC8vIEFkZCByZXNvdXJjZSB0YWdzXG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdDb21wb25lbnQnLCAnTW9uaXRvcmluZycpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnRW52aXJvbm1lbnQnLCBlbnZpcm9ubWVudFN1ZmZpeCk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdNYW5hZ2VkQnknLCAnQ0RLJyk7XG4gIH1cbn1cbiJdfQ==