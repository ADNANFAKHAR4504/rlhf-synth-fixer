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
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const s3n = __importStar(require("aws-cdk-lib/aws-s3-notifications"));
const sqs = __importStar(require("aws-cdk-lib/aws-sqs"));
const constructs_1 = require("constructs");
class LambdaStack extends constructs_1.Construct {
    dataProcessorFunction;
    functionName;
    constructor(scope, id, props) {
        super(scope, id);
        const { environment, isPrimary } = props;
        const region = cdk.Stack.of(this).region;
        // Import existing resources from other stacks
        const dataIngestionBucket = s3.Bucket.fromBucketName(this, 'ImportedDataIngestionBucket', `serverless-data-ingestion-${environment}`);
        const processedDataTable = dynamodb.Table.fromTableName(this, 'ImportedProcessedDataTable', `serverless-processed-data-${environment}`);
        const deadLetterQueue = sqs.Queue.fromQueueArn(this, 'ImportedDeadLetterQueue', `arn:aws:sqs:${region}:${cdk.Stack.of(this).account}:serverless-dlq-${environment}`);
        // Create Lambda function for data processing
        this.functionName = `serverless-data-processor-${environment}`;
        this.dataProcessorFunction = new lambda.Function(this, 'DataProcessorFunction', {
            functionName: this.functionName,
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('lib/lambda-functions/data-processor'),
            timeout: cdk.Duration.minutes(5),
            memorySize: 512,
            environment: {
                DYNAMODB_TABLE_NAME: processedDataTable.tableName,
                AWS_REGION: region,
                ENVIRONMENT: environment,
                IS_PRIMARY: isPrimary.toString(),
            },
            deadLetterQueue: deadLetterQueue,
            reservedConcurrentExecutions: 10,
            logRetention: logs.RetentionDays.ONE_MONTH,
            tracing: lambda.Tracing.ACTIVE,
        });
        // Grant permissions to Lambda function
        dataIngestionBucket.grantRead(this.dataProcessorFunction);
        processedDataTable.grantWriteData(this.dataProcessorFunction);
        processedDataTable.grantReadData(this.dataProcessorFunction);
        deadLetterQueue.grantSendMessages(this.dataProcessorFunction);
        // Add additional IAM permissions for CloudWatch logging
        this.dataProcessorFunction.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
            ],
            resources: ['*'],
        }));
        // Add S3 event notification to trigger Lambda
        dataIngestionBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(this.dataProcessorFunction), {
            suffix: '.json',
        });
        dataIngestionBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(this.dataProcessorFunction), {
            suffix: '.csv',
        });
        // Add tags for cost allocation and governance
        cdk.Tags.of(this.dataProcessorFunction).add('Environment', environment);
        cdk.Tags.of(this.dataProcessorFunction).add('Service', 'DataProcessing');
        cdk.Tags.of(this.dataProcessorFunction).add('Region', region);
        cdk.Tags.of(this.dataProcessorFunction).add('IsPrimary', isPrimary.toString());
        // Output the function name and ARN
        new cdk.CfnOutput(this, 'DataProcessorFunctionName', {
            value: this.dataProcessorFunction.functionName,
            description: 'Name of the data processor Lambda function',
            exportName: `serverless-data-processor-function-name-${region}`,
        });
        new cdk.CfnOutput(this, 'DataProcessorFunctionArn', {
            value: this.dataProcessorFunction.functionArn,
            description: 'ARN of the data processor Lambda function',
            exportName: `serverless-data-processor-function-arn-${region}`,
        });
        new cdk.CfnOutput(this, 'DataProcessorFunctionRoleArn', {
            value: this.dataProcessorFunction.role?.roleArn || '',
            description: 'ARN of the data processor Lambda function role',
            exportName: `serverless-data-processor-function-role-arn-${region}`,
        });
    }
}
exports.LambdaStack = LambdaStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGFtYmRhLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyxtRUFBcUQ7QUFDckQseURBQTJDO0FBQzNDLCtEQUFpRDtBQUNqRCwyREFBNkM7QUFDN0MsdURBQXlDO0FBQ3pDLHNFQUF3RDtBQUN4RCx5REFBMkM7QUFDM0MsMkNBQXVDO0FBT3ZDLE1BQWEsV0FBWSxTQUFRLHNCQUFTO0lBQ3hCLHFCQUFxQixDQUFrQjtJQUN2QyxZQUFZLENBQVM7SUFFckMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUF1QjtRQUMvRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLE1BQU0sRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBQ3pDLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUV6Qyw4Q0FBOEM7UUFDOUMsTUFBTSxtQkFBbUIsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FDbEQsSUFBSSxFQUNKLDZCQUE2QixFQUM3Qiw2QkFBNkIsV0FBVyxFQUFFLENBQzNDLENBQUM7UUFFRixNQUFNLGtCQUFrQixHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUNyRCxJQUFJLEVBQ0osNEJBQTRCLEVBQzVCLDZCQUE2QixXQUFXLEVBQUUsQ0FDM0MsQ0FBQztRQUVGLE1BQU0sZUFBZSxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUM1QyxJQUFJLEVBQ0oseUJBQXlCLEVBQ3pCLGVBQWUsTUFBTSxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sbUJBQW1CLFdBQVcs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QUFDLENBQUMsR0FBRyxDQUN6QyxXQUFXLEVBQ1gsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUNyQixDQUFDO1FBRUYsbUNBQW1DO1FBQ25DLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsMkJBQTJCLEVBQUU7WUFDbkQsS0FBSyxFQUFFLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxZQUFZO1lBQzlDLFdBQVcsRUFBRSw0Q0FBNEM7WUFDekQsVUFBVSxFQUFFLDJDQUEyQyxNQUFNLEVBQUU7U0FDaEUsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSwwQkFBMEIsRUFBRTtZQUNsRCxLQUFLLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFdBQVc7WUFDN0MsV0FBVyxFQUFFLDJDQUEyQztZQUN4RCxVQUFVLEVBQUUsMENBQTBDLE1BQU0sRUFBRTtTQUMvRCxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLDhCQUE4QixFQUFFO1lBQ3RELEtBQUssRUFBRSxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLE9BQU8sSUFBSSxFQUFFO1lBQ3JELFdBQVcsRUFBRSxnREFBZ0Q7WUFDN0QsVUFBVSxFQUFFLCtDQUErQyxNQUFNLEVBQUU7U0FDcEUsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBdkhELGtDQXVIQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgbG9ncyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbG9ncyc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgczNuIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMy1ub3RpZmljYXRpb25zJztcbmltcG9ydCAqIGFzIHNxcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3FzJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5pbnRlcmZhY2UgTGFtYmRhU3RhY2tQcm9wcyB7XG4gIGVudmlyb25tZW50OiBzdHJpbmc7XG4gIGlzUHJpbWFyeTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIExhbWJkYVN0YWNrIGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgcHVibGljIHJlYWRvbmx5IGRhdGFQcm9jZXNzb3JGdW5jdGlvbjogbGFtYmRhLkZ1bmN0aW9uO1xuICBwdWJsaWMgcmVhZG9ubHkgZnVuY3Rpb25OYW1lOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IExhbWJkYVN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgY29uc3QgeyBlbnZpcm9ubWVudCwgaXNQcmltYXJ5IH0gPSBwcm9wcztcbiAgICBjb25zdCByZWdpb24gPSBjZGsuU3RhY2sub2YodGhpcykucmVnaW9uO1xuXG4gICAgLy8gSW1wb3J0IGV4aXN0aW5nIHJlc291cmNlcyBmcm9tIG90aGVyIHN0YWNrc1xuICAgIGNvbnN0IGRhdGFJbmdlc3Rpb25CdWNrZXQgPSBzMy5CdWNrZXQuZnJvbUJ1Y2tldE5hbWUoXG4gICAgICB0aGlzLFxuICAgICAgJ0ltcG9ydGVkRGF0YUluZ2VzdGlvbkJ1Y2tldCcsXG4gICAgICBgc2VydmVybGVzcy1kYXRhLWluZ2VzdGlvbi0ke2Vudmlyb25tZW50fWBcbiAgICApO1xuXG4gICAgY29uc3QgcHJvY2Vzc2VkRGF0YVRhYmxlID0gZHluYW1vZGIuVGFibGUuZnJvbVRhYmxlTmFtZShcbiAgICAgIHRoaXMsXG4gICAgICAnSW1wb3J0ZWRQcm9jZXNzZWREYXRhVGFibGUnLFxuICAgICAgYHNlcnZlcmxlc3MtcHJvY2Vzc2VkLWRhdGEtJHtlbnZpcm9ubWVudH1gXG4gICAgKTtcblxuICAgIGNvbnN0IGRlYWRMZXR0ZXJRdWV1ZSA9IHNxcy5RdWV1ZS5mcm9tUXVldWVBcm4oXG4gICAgICB0aGlzLFxuICAgICAgJ0ltcG9ydGVkRGVhZExldHRlclF1ZXVlJyxcbiAgICAgIGBhcm46YXdzOnNxczoke3JlZ2lvbn06JHtjZGsuU3RhY2sub2YodGhpcykuYWNjb3VudH06c2VydmVybGVzcy1kbHEtJHtlbnZpcm9ubWVudH1gXG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBMYW1iZGEgZnVuY3Rpb24gZm9yIGRhdGEgcHJvY2Vzc2luZ1xuICAgIHRoaXMuZnVuY3Rpb25OYW1lID0gYHNlcnZlcmxlc3MtZGF0YS1wcm9jZXNzb3ItJHtlbnZpcm9ubWVudH1gO1xuXG4gICAgdGhpcy5kYXRhUHJvY2Vzc29yRnVuY3Rpb24gPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKFxuICAgICAgdGhpcyxcbiAgICAgICdEYXRhUHJvY2Vzc29yRnVuY3Rpb24nLFxuICAgICAge1xuICAgICAgICBmdW5jdGlvbk5hbWU6IHRoaXMuZnVuY3Rpb25OYW1lLFxuICAgICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcbiAgICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoJ2xpYi9sYW1iZGEtZnVuY3Rpb25zL2RhdGEtcHJvY2Vzc29yJyksXG4gICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5taW51dGVzKDUpLFxuICAgICAgICBtZW1vcnlTaXplOiA1MTIsXG4gICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgRFlOQU1PREJfVEFCTEVfTkFNRTogcHJvY2Vzc2VkRGF0YVRhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgICBBV1NfUkVHSU9OOiByZWdpb24sXG4gICAgICAgICAgRU5WSVJPTk1FTlQ6IGVudmlyb25tZW50LFxuICAgICAgICAgIElTX1BSSU1BUlk6IGlzUHJpbWFyeS50b1N0cmluZygpLFxuICAgICAgICB9LFxuICAgICAgICBkZWFkTGV0dGVyUXVldWU6IGRlYWRMZXR0ZXJRdWV1ZSxcbiAgICAgICAgcmVzZXJ2ZWRDb25jdXJyZW50RXhlY3V0aW9uczogMTAsXG4gICAgICAgIGxvZ1JldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9NT05USCxcbiAgICAgICAgdHJhY2luZzogbGFtYmRhLlRyYWNpbmcuQUNUSVZFLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBHcmFudCBwZXJtaXNzaW9ucyB0byBMYW1iZGEgZnVuY3Rpb25cbiAgICBkYXRhSW5nZXN0aW9uQnVja2V0LmdyYW50UmVhZCh0aGlzLmRhdGFQcm9jZXNzb3JGdW5jdGlvbik7XG4gICAgcHJvY2Vzc2VkRGF0YVRhYmxlLmdyYW50V3JpdGVEYXRhKHRoaXMuZGF0YVByb2Nlc3NvckZ1bmN0aW9uKTtcbiAgICBwcm9jZXNzZWREYXRhVGFibGUuZ3JhbnRSZWFkRGF0YSh0aGlzLmRhdGFQcm9jZXNzb3JGdW5jdGlvbik7XG4gICAgZGVhZExldHRlclF1ZXVlLmdyYW50U2VuZE1lc3NhZ2VzKHRoaXMuZGF0YVByb2Nlc3NvckZ1bmN0aW9uKTtcblxuICAgIC8vIEFkZCBhZGRpdGlvbmFsIElBTSBwZXJtaXNzaW9ucyBmb3IgQ2xvdWRXYXRjaCBsb2dnaW5nXG4gICAgdGhpcy5kYXRhUHJvY2Vzc29yRnVuY3Rpb24uYWRkVG9Sb2xlUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAnbG9nczpDcmVhdGVMb2dHcm91cCcsXG4gICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nU3RyZWFtJyxcbiAgICAgICAgICAnbG9nczpQdXRMb2dFdmVudHMnLFxuICAgICAgICBdLFxuICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gQWRkIFMzIGV2ZW50IG5vdGlmaWNhdGlvbiB0byB0cmlnZ2VyIExhbWJkYVxuICAgIGRhdGFJbmdlc3Rpb25CdWNrZXQuYWRkRXZlbnROb3RpZmljYXRpb24oXG4gICAgICBzMy5FdmVudFR5cGUuT0JKRUNUX0NSRUFURUQsXG4gICAgICBuZXcgczNuLkxhbWJkYURlc3RpbmF0aW9uKHRoaXMuZGF0YVByb2Nlc3NvckZ1bmN0aW9uKSxcbiAgICAgIHtcbiAgICAgICAgc3VmZml4OiAnLmpzb24nLFxuICAgICAgfVxuICAgICk7XG5cbiAgICBkYXRhSW5nZXN0aW9uQnVja2V0LmFkZEV2ZW50Tm90aWZpY2F0aW9uKFxuICAgICAgczMuRXZlbnRUeXBlLk9CSkVDVF9DUkVBVEVELFxuICAgICAgbmV3IHMzbi5MYW1iZGFEZXN0aW5hdGlvbih0aGlzLmRhdGFQcm9jZXNzb3JGdW5jdGlvbiksXG4gICAgICB7XG4gICAgICAgIHN1ZmZpeDogJy5jc3YnLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBBZGQgdGFncyBmb3IgY29zdCBhbGxvY2F0aW9uIGFuZCBnb3Zlcm5hbmNlXG4gICAgY2RrLlRhZ3Mub2YodGhpcy5kYXRhUHJvY2Vzc29yRnVuY3Rpb24pLmFkZCgnRW52aXJvbm1lbnQnLCBlbnZpcm9ubWVudCk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcy5kYXRhUHJvY2Vzc29yRnVuY3Rpb24pLmFkZCgnU2VydmljZScsICdEYXRhUHJvY2Vzc2luZycpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMuZGF0YVByb2Nlc3NvckZ1bmN0aW9uKS5hZGQoJ1JlZ2lvbicsIHJlZ2lvbik7XG4gICAgY2RrLlRhZ3Mub2YodGhpcy5kYXRhUHJvY2Vzc29yRnVuY3Rpb24pLmFkZChcbiAgICAgICdJc1ByaW1hcnknLFxuICAgICAgaXNQcmltYXJ5LnRvU3RyaW5nKClcbiAgICApO1xuXG4gICAgLy8gT3V0cHV0IHRoZSBmdW5jdGlvbiBuYW1lIGFuZCBBUk5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRGF0YVByb2Nlc3NvckZ1bmN0aW9uTmFtZScsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmRhdGFQcm9jZXNzb3JGdW5jdGlvbi5mdW5jdGlvbk5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ05hbWUgb2YgdGhlIGRhdGEgcHJvY2Vzc29yIExhbWJkYSBmdW5jdGlvbicsXG4gICAgICBleHBvcnROYW1lOiBgc2VydmVybGVzcy1kYXRhLXByb2Nlc3Nvci1mdW5jdGlvbi1uYW1lLSR7cmVnaW9ufWAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRGF0YVByb2Nlc3NvckZ1bmN0aW9uQXJuJywge1xuICAgICAgdmFsdWU6IHRoaXMuZGF0YVByb2Nlc3NvckZ1bmN0aW9uLmZ1bmN0aW9uQXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdBUk4gb2YgdGhlIGRhdGEgcHJvY2Vzc29yIExhbWJkYSBmdW5jdGlvbicsXG4gICAgICBleHBvcnROYW1lOiBgc2VydmVybGVzcy1kYXRhLXByb2Nlc3Nvci1mdW5jdGlvbi1hcm4tJHtyZWdpb259YCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdEYXRhUHJvY2Vzc29yRnVuY3Rpb25Sb2xlQXJuJywge1xuICAgICAgdmFsdWU6IHRoaXMuZGF0YVByb2Nlc3NvckZ1bmN0aW9uLnJvbGU/LnJvbGVBcm4gfHwgJycsXG4gICAgICBkZXNjcmlwdGlvbjogJ0FSTiBvZiB0aGUgZGF0YSBwcm9jZXNzb3IgTGFtYmRhIGZ1bmN0aW9uIHJvbGUnLFxuICAgICAgZXhwb3J0TmFtZTogYHNlcnZlcmxlc3MtZGF0YS1wcm9jZXNzb3ItZnVuY3Rpb24tcm9sZS1hcm4tJHtyZWdpb259YCxcbiAgICB9KTtcbiAgfVxufVxuIl19