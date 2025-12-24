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
exports.LambdaStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
class LambdaStack extends cdk.NestedStack {
    imageProcessorFunction;
    fileManagerFunction;
    notificationFunction;
    constructor(scope, id, props) {
        super(scope, id, props);
        const { environmentSuffix, imageBucket, detectionTable, notificationTopic, } = props;
        // Common Lambda configuration for security and performance
        const commonLambdaProps = {
            runtime: lambda.Runtime.NODEJS_20_X, // Latest stable Node.js version
            timeout: cdk.Duration.minutes(5),
            memorySize: 512,
            architecture: lambda.Architecture.ARM_64, // Better price-performance
            environment: {
                ENVIRONMENT: environmentSuffix,
                BUCKET_NAME: imageBucket.bucketName,
                TABLE_NAME: detectionTable.tableName,
                REGION: cdk.Aws.REGION,
                AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1', // Optimize SDK v3 connections
            },
            reservedConcurrentExecutions: environmentSuffix === 'prod' ? 100 : 10,
        };
        // Log groups for Lambda functions
        const imageProcessorLogGroup = new logs.LogGroup(this, 'ImageProcessorLogGroup', {
            logGroupName: `/aws/lambda/serverlessapp-image-processor-${environmentSuffix}`,
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        const fileManagerLogGroup = new logs.LogGroup(this, 'FileManagerLogGroup', {
            logGroupName: `/aws/lambda/serverlessapp-file-manager-${environmentSuffix}`,
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        const notificationLogGroup = new logs.LogGroup(this, 'NotificationLogGroup', {
            logGroupName: `/aws/lambda/serverlessapp-notification-service-${environmentSuffix}`,
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        // Image Processor Lambda - Main processing function
        this.imageProcessorFunction = new lambda.Function(this, 'ImageProcessor', {
            ...commonLambdaProps,
            functionName: `serverlessapp-image-processor-${environmentSuffix}`,
            code: lambda.Code.fromAsset('lib/lambdas/image-processor'),
            handler: 'index.handler',
            memorySize: 1024, // Higher memory for image processing
            timeout: cdk.Duration.minutes(10),
            logGroup: imageProcessorLogGroup,
            environment: {
                ...commonLambdaProps.environment,
                FILE_MANAGER_FUNCTION: `serverlessapp-file-manager-${environmentSuffix}`,
                NOTIFICATION_FUNCTION: `serverlessapp-notification-service-${environmentSuffix}`,
                SNS_TOPIC_ARN: notificationTopic.topicArn,
            },
        });
        // File Manager Lambda - Handles file organization
        this.fileManagerFunction = new lambda.Function(this, 'FileManager', {
            ...commonLambdaProps,
            functionName: `serverlessapp-file-manager-${environmentSuffix}`,
            code: lambda.Code.fromAsset('lib/lambdas/file-manager'),
            handler: 'index.handler',
            memorySize: 256,
            timeout: cdk.Duration.minutes(2),
            logGroup: fileManagerLogGroup,
        });
        // Notification Service Lambda - Handles uncertain classification alerts
        this.notificationFunction = new lambda.Function(this, 'NotificationService', {
            ...commonLambdaProps,
            functionName: `serverlessapp-notification-service-${environmentSuffix}`,
            code: lambda.Code.fromAsset('lib/lambdas/notification-service'),
            handler: 'index.handler',
            memorySize: 256,
            timeout: cdk.Duration.minutes(1),
            logGroup: notificationLogGroup,
            environment: {
                ...commonLambdaProps.environment,
                SNS_TOPIC_ARN: notificationTopic.topicArn,
            },
        });
        // Grant S3 permissions
        imageBucket.grantReadWrite(this.imageProcessorFunction);
        imageBucket.grantReadWrite(this.fileManagerFunction);
        imageBucket.grantRead(this.notificationFunction);
        // Grant DynamoDB permissions
        detectionTable.grantReadWriteData(this.imageProcessorFunction);
        detectionTable.grantReadData(this.fileManagerFunction);
        detectionTable.grantReadData(this.notificationFunction);
        // Grant SNS permissions
        notificationTopic.grantPublish(this.imageProcessorFunction);
        notificationTopic.grantPublish(this.notificationFunction);
        // Grant Rekognition permissions to image processor
        this.imageProcessorFunction.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'rekognition:DetectLabels',
                'rekognition:DetectModerationLabels',
            ],
            resources: ['*'],
        }));
        // Grant Lambda invoke permissions for cross-function calls
        this.fileManagerFunction.grantInvoke(this.imageProcessorFunction);
        this.notificationFunction.grantInvoke(this.imageProcessorFunction);
        // Add X-Ray tracing for observability
        this.imageProcessorFunction.addEnvironment('_X_AMZN_TRACE_ID', 'Root=1-5e1b4151-5ac6c58c1c5e2a4c3b2d1f5e');
        this.fileManagerFunction.addEnvironment('_X_AMZN_TRACE_ID', 'Root=1-5e1b4151-5ac6c58c1c5e2a4c3b2d1f5e');
        this.notificationFunction.addEnvironment('_X_AMZN_TRACE_ID', 'Root=1-5e1b4151-5ac6c58c1c5e2a4c3b2d1f5e');
        // Add resource tags
        cdk.Tags.of(this).add('Component', 'Compute');
        cdk.Tags.of(this).add('Environment', environmentSuffix);
        cdk.Tags.of(this).add('ManagedBy', 'CDK');
    }
}
exports.LambdaStack = LambdaStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGFtYmRhLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUVuQyx5REFBMkM7QUFDM0MsK0RBQWlEO0FBQ2pELDJEQUE2QztBQVk3QyxNQUFhLFdBQVksU0FBUSxHQUFHLENBQUMsV0FBVztJQUM5QixzQkFBc0IsQ0FBa0I7SUFDeEMsbUJBQW1CLENBQWtCO0lBQ3JDLG9CQUFvQixDQUFrQjtJQUV0RCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXVCO1FBQy9ELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sRUFDSixpQkFBaUIsRUFDakIsV0FBVyxFQUNYLGNBQWMsRUFDZCxpQkFBaUIsR0FDbEIsR0FBRyxLQUFLLENBQUM7UUFFViwyREFBMkQ7UUFDM0QsTUFBTSxpQkFBaUIsR0FBRztZQUN4QixPQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsZ0NBQWdDO1lBQ3JFLE9BQU8sRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDaEMsVUFBVSxFQUFFLEdBQUc7WUFDZixZQUFZLEVBQUUsTUFBTSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsMkJBQTJCO1lBQ3JFLFdBQVcsRUFBRTtnQkFDWCxXQUFXLEVBQUUsaUJBQWlCO2dCQUM5QixXQUFXLEVBQUUsV0FBVyxDQUFDLFVBQVU7Z0JBQ25DLFVBQVUsRUFBRSxjQUFjLENBQUMsU0FBUztnQkFDcEMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTTtnQkFDdEIsbUNBQW1DLEVBQUUsR0FBRyxFQUFFLDhCQUE4QjthQUN6RTtZQUNELDRCQUE0QixFQUFFLGlCQUFpQixLQUFLLE1BQU0sQ0FBQyxDQUFD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QUFvQixDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUVuRSxzQ0FBc0M7UUFDdEMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLGNBQWMsQ0FDeEMsa0JBQWtCLEVBQ2xCLDBDQUEwQyxDQUMzQyxDQUFDO1FBQ0YsSUFBSSxDQUFDLG1CQUFtQixDQUFDLGNBQWMsQ0FDckMsa0JBQWtCLEVBQ2xCLDBDQUEwQyxDQUMzQyxDQUFDO1FBQ0YsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FDdEMsa0JBQWtCLEVBQ2xCLDBDQUEwQyxDQUMzQyxDQUFDO1FBRUYsb0JBQW9CO1FBQ3BCLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDOUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3hELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDNUMsQ0FBQztDQUNGO0FBMUpELGtDQTBKQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgbG9ncyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbG9ncyc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgc25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zbnMnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTGFtYmRhU3RhY2tQcm9wcyBleHRlbmRzIGNkay5OZXN0ZWRTdGFja1Byb3BzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg6IHN0cmluZztcbiAgaW1hZ2VCdWNrZXQ6IHMzLkJ1Y2tldDtcbiAgZGV0ZWN0aW9uVGFibGU6IGR5bmFtb2RiLlRhYmxlO1xuICBub3RpZmljYXRpb25Ub3BpYzogc25zLlRvcGljO1xufVxuXG5leHBvcnQgY2xhc3MgTGFtYmRhU3RhY2sgZXh0ZW5kcyBjZGsuTmVzdGVkU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgaW1hZ2VQcm9jZXNzb3JGdW5jdGlvbjogbGFtYmRhLkZ1bmN0aW9uO1xuICBwdWJsaWMgcmVhZG9ubHkgZmlsZU1hbmFnZXJGdW5jdGlvbjogbGFtYmRhLkZ1bmN0aW9uO1xuICBwdWJsaWMgcmVhZG9ubHkgbm90aWZpY2F0aW9uRnVuY3Rpb246IGxhbWJkYS5GdW5jdGlvbjtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogTGFtYmRhU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3Qge1xuICAgICAgZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICBpbWFnZUJ1Y2tldCxcbiAgICAgIGRldGVjdGlvblRhYmxlLFxuICAgICAgbm90aWZpY2F0aW9uVG9waWMsXG4gICAgfSA9IHByb3BzO1xuXG4gICAgLy8gQ29tbW9uIExhbWJkYSBjb25maWd1cmF0aW9uIGZvciBzZWN1cml0eSBhbmQgcGVyZm9ybWFuY2VcbiAgICBjb25zdCBjb21tb25MYW1iZGFQcm9wcyA9IHtcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLk5PREVKU18yMF9YLCAvLyBMYXRlc3Qgc3RhYmxlIE5vZGUuanMgdmVyc2lvblxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICBtZW1vcnlTaXplOiA1MTIsXG4gICAgICBhcmNoaXRlY3R1cmU6IGxhbWJkYS5BcmNoaXRlY3R1cmUuQVJNXzY0LCAvLyBCZXR0ZXIgcHJpY2UtcGVyZm9ybWFuY2VcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIEVOVklST05NRU5UOiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgQlVDS0VUX05BTUU6IGltYWdlQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICAgIFRBQkxFX05BTUU6IGRldGVjdGlvblRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgUkVHSU9OOiBjZGsuQXdzLlJFR0lPTixcbiAgICAgICAgQVdTX05PREVKU19DT05ORUNUSU9OX1JFVVNFX0VOQUJMRUQ6ICcxJywgLy8gT3B0aW1pemUgU0RLIHYzIGNvbm5lY3Rpb25zXG4gICAgICB9LFxuICAgICAgcmVzZXJ2ZWRDb25jdXJyZW50RXhlY3V0aW9uczogZW52aXJvbm1lbnRTdWZmaXggPT09ICdwcm9kJyA/IDEwMCA6IDEwLFxuICAgIH07XG5cbiAgICAvLyBMb2cgZ3JvdXBzIGZvciBMYW1iZGEgZnVuY3Rpb25zXG4gICAgY29uc3QgaW1hZ2VQcm9jZXNzb3JMb2dHcm91cCA9IG5ldyBsb2dzLkxvZ0dyb3VwKFxuICAgICAgdGhpcyxcbiAgICAgICdJbWFnZVByb2Nlc3NvckxvZ0dyb3VwJyxcbiAgICAgIHtcbiAgICAgICAgbG9nR3JvdXBOYW1lOiBgL2F3cy9sYW1iZGEvc2VydmVybGVzc2FwcC1pbWFnZS1wcm9jZXNzb3ItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICByZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFSyxcbiAgICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgY29uc3QgZmlsZU1hbmFnZXJMb2dHcm91cCA9IG5ldyBsb2dzLkxvZ0dyb3VwKHRoaXMsICdGaWxlTWFuYWdlckxvZ0dyb3VwJywge1xuICAgICAgbG9nR3JvdXBOYW1lOiBgL2F3cy9sYW1iZGEvc2VydmVybGVzc2FwcC1maWxlLW1hbmFnZXItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgcmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgbm90aWZpY2F0aW9uTG9nR3JvdXAgPSBuZXcgbG9ncy5Mb2dHcm91cChcbiAgICAgIHRoaXMsXG4gICAgICAnTm90aWZpY2F0aW9uTG9nR3JvdXAnLFxuICAgICAge1xuICAgICAgICBsb2dHcm91cE5hbWU6IGAvYXdzL2xhbWJkYS9zZXJ2ZXJsZXNzYXBwLW5vdGlmaWNhdGlvbi1zZXJ2aWNlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgcmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXG4gICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIEltYWdlIFByb2Nlc3NvciBMYW1iZGEgLSBNYWluIHByb2Nlc3NpbmcgZnVuY3Rpb25cbiAgICB0aGlzLmltYWdlUHJvY2Vzc29yRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKHRoaXMsICdJbWFnZVByb2Nlc3NvcicsIHtcbiAgICAgIC4uLmNvbW1vbkxhbWJkYVByb3BzLFxuICAgICAgZnVuY3Rpb25OYW1lOiBgc2VydmVybGVzc2FwcC1pbWFnZS1wcm9jZXNzb3ItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KCdsaWIvbGFtYmRhcy9pbWFnZS1wcm9jZXNzb3InKSxcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgIG1lbW9yeVNpemU6IDEwMjQsIC8vIEhpZ2hlciBtZW1vcnkgZm9yIGltYWdlIHByb2Nlc3NpbmdcbiAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5taW51dGVzKDEwKSxcbiAgICAgIGxvZ0dyb3VwOiBpbWFnZVByb2Nlc3NvckxvZ0dyb3VwLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgLi4uY29tbW9uTGFtYmRhUHJvcHMuZW52aXJvbm1lbnQsXG4gICAgICAgIEZJTEVfTUFOQUdFUl9GVU5DVElPTjogYHNlcnZlcmxlc3NhcHAtZmlsZS1tYW5hZ2VyLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgTk9USUZJQ0FUSU9OX0ZVTkNUSU9OOiBgc2VydmVybGVzc2FwcC1ub3RpZmljYXRpb24tc2VydmljZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIFNOU19UT1BJQ19BUk46IG5vdGlmaWNhdGlvblRvcGljLnRvcGljQXJuLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIEZpbGUgTWFuYWdlciBMYW1iZGEgLSBIYW5kbGVzIGZpbGUgb3JnYW5pemF0aW9uXG4gICAgdGhpcy5maWxlTWFuYWdlckZ1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnRmlsZU1hbmFnZXInLCB7XG4gICAgICAuLi5jb21tb25MYW1iZGFQcm9wcyxcbiAgICAgIGZ1bmN0aW9uTmFtZTogYHNlcnZlcmxlc3NhcHAtZmlsZS1tYW5hZ2VyLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnbGliL2xhbWJkYXMvZmlsZS1tYW5hZ2VyJyksXG4gICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICBtZW1vcnlTaXplOiAyNTYsXG4gICAgICB0aW1lb3V0OiBjZGsuRHVyYXRpb24ubWludXRlcygyKSxcbiAgICAgIGxvZ0dyb3VwOiBmaWxlTWFuYWdlckxvZ0dyb3VwLFxuICAgIH0pO1xuXG4gICAgLy8gTm90aWZpY2F0aW9uIFNlcnZpY2UgTGFtYmRhIC0gSGFuZGxlcyB1bmNlcnRhaW4gY2xhc3NpZmljYXRpb24gYWxlcnRzXG4gICAgdGhpcy5ub3RpZmljYXRpb25GdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24oXG4gICAgICB0aGlzLFxuICAgICAgJ05vdGlmaWNhdGlvblNlcnZpY2UnLFxuICAgICAge1xuICAgICAgICAuLi5jb21tb25MYW1iZGFQcm9wcyxcbiAgICAgICAgZnVuY3Rpb25OYW1lOiBgc2VydmVybGVzc2FwcC1ub3RpZmljYXRpb24tc2VydmljZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGNvZGU6IGxhbWJkYS5Db2RlLmZyb21Bc3NldCgnbGliL2xhbWJkYXMvbm90aWZpY2F0aW9uLXNlcnZpY2UnKSxcbiAgICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgICBtZW1vcnlTaXplOiAyNTYsXG4gICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5taW51dGVzKDEpLFxuICAgICAgICBsb2dHcm91cDogbm90aWZpY2F0aW9uTG9nR3JvdXAsXG4gICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgLi4uY29tbW9uTGFtYmRhUHJvcHMuZW52aXJvbm1lbnQsXG4gICAgICAgICAgU05TX1RPUElDX0FSTjogbm90aWZpY2F0aW9uVG9waWMudG9waWNBcm4sXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIEdyYW50IFMzIHBlcm1pc3Npb25zXG4gICAgaW1hZ2VCdWNrZXQuZ3JhbnRSZWFkV3JpdGUodGhpcy5pbWFnZVByb2Nlc3NvckZ1bmN0aW9uKTtcbiAgICBpbWFnZUJ1Y2tldC5ncmFudFJlYWRXcml0ZSh0aGlzLmZpbGVNYW5hZ2VyRnVuY3Rpb24pO1xuICAgIGltYWdlQnVja2V0LmdyYW50UmVhZCh0aGlzLm5vdGlmaWNhdGlvbkZ1bmN0aW9uKTtcblxuICAgIC8vIEdyYW50IER5bmFtb0RCIHBlcm1pc3Npb25zXG4gICAgZGV0ZWN0aW9uVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKHRoaXMuaW1hZ2VQcm9jZXNzb3JGdW5jdGlvbik7XG4gICAgZGV0ZWN0aW9uVGFibGUuZ3JhbnRSZWFkRGF0YSh0aGlzLmZpbGVNYW5hZ2VyRnVuY3Rpb24pO1xuICAgIGRldGVjdGlvblRhYmxlLmdyYW50UmVhZERhdGEodGhpcy5ub3RpZmljYXRpb25GdW5jdGlvbik7XG5cbiAgICAvLyBHcmFudCBTTlMgcGVybWlzc2lvbnNcbiAgICBub3RpZmljYXRpb25Ub3BpYy5ncmFudFB1Ymxpc2godGhpcy5pbWFnZVByb2Nlc3NvckZ1bmN0aW9uKTtcbiAgICBub3RpZmljYXRpb25Ub3BpYy5ncmFudFB1Ymxpc2godGhpcy5ub3RpZmljYXRpb25GdW5jdGlvbik7XG5cbiAgICAvLyBHcmFudCBSZWtvZ25pdGlvbiBwZXJtaXNzaW9ucyB0byBpbWFnZSBwcm9jZXNzb3JcbiAgICB0aGlzLmltYWdlUHJvY2Vzc29yRnVuY3Rpb24uYWRkVG9Sb2xlUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAncmVrb2duaXRpb246RGV0ZWN0TGFiZWxzJyxcbiAgICAgICAgICAncmVrb2duaXRpb246RGV0ZWN0TW9kZXJhdGlvbkxhYmVscycsXG4gICAgICAgIF0sXG4gICAgICAgIHJlc291cmNlczogWycqJ10sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBHcmFudCBMYW1iZGEgaW52b2tlIHBlcm1pc3Npb25zIGZvciBjcm9zcy1mdW5jdGlvbiBjYWxsc1xuICAgIHRoaXMuZmlsZU1hbmFnZXJGdW5jdGlvbi5ncmFudEludm9rZSh0aGlzLmltYWdlUHJvY2Vzc29yRnVuY3Rpb24pO1xuICAgIHRoaXMubm90aWZpY2F0aW9uRnVuY3Rpb24uZ3JhbnRJbnZva2UodGhpcy5pbWFnZVByb2Nlc3NvckZ1bmN0aW9uKTtcblxuICAgIC8vIEFkZCBYLVJheSB0cmFjaW5nIGZvciBvYnNlcnZhYmlsaXR5XG4gICAgdGhpcy5pbWFnZVByb2Nlc3NvckZ1bmN0aW9uLmFkZEVudmlyb25tZW50KFxuICAgICAgJ19YX0FNWk5fVFJBQ0VfSUQnLFxuICAgICAgJ1Jvb3Q9MS01ZTFiNDE1MS01YWM2YzU4YzFjNWUyYTRjM2IyZDFmNWUnXG4gICAgKTtcbiAgICB0aGlzLmZpbGVNYW5hZ2VyRnVuY3Rpb24uYWRkRW52aXJvbm1lbnQoXG4gICAgICAnX1hfQU1aTl9UUkFDRV9JRCcsXG4gICAgICAnUm9vdD0xLTVlMWI0MTUxLTVhYzZjNThjMWM1ZTJhNGMzYjJkMWY1ZSdcbiAgICApO1xuICAgIHRoaXMubm90aWZpY2F0aW9uRnVuY3Rpb24uYWRkRW52aXJvbm1lbnQoXG4gICAgICAnX1hfQU1aTl9UUkFDRV9JRCcsXG4gICAgICAnUm9vdD0xLTVlMWI0MTUxLTVhYzZjNThjMWM1ZTJhNGMzYjJkMWY1ZSdcbiAgICApO1xuXG4gICAgLy8gQWRkIHJlc291cmNlIHRhZ3NcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ0NvbXBvbmVudCcsICdDb21wdXRlJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdFbnZpcm9ubWVudCcsIGVudmlyb25tZW50U3VmZml4KTtcbiAgICBjZGsuVGFncy5vZih0aGlzKS5hZGQoJ01hbmFnZWRCeScsICdDREsnKTtcbiAgfVxufVxuIl19