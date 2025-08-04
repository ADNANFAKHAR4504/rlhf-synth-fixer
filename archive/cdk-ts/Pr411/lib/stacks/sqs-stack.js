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
exports.SQSStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const sqs = __importStar(require("aws-cdk-lib/aws-sqs"));
const constructs_1 = require("constructs");
class SQSStack extends constructs_1.Construct {
    deadLetterQueue;
    queueName;
    constructor(scope, id, props) {
        super(scope, id);
        const { environment, isPrimary } = props;
        const region = cdk.Stack.of(this).region;
        // Create SQS queue for dead letter queue
        this.queueName = `serverless-dlq-${environment}`;
        this.deadLetterQueue = new sqs.Queue(this, 'DeadLetterQueue', {
            queueName: this.queueName,
            visibilityTimeout: cdk.Duration.seconds(300),
            retentionPeriod: cdk.Duration.days(14),
            receiveMessageWaitTime: cdk.Duration.seconds(20),
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            encryption: sqs.QueueEncryption.SQS_MANAGED,
            dataKeyReuse: cdk.Duration.days(1),
        });
        // Add tags for cost allocation and governance
        cdk.Tags.of(this.deadLetterQueue).add('Environment', environment);
        cdk.Tags.of(this.deadLetterQueue).add('Service', 'DeadLetterQueue');
        cdk.Tags.of(this.deadLetterQueue).add('Region', region);
        cdk.Tags.of(this.deadLetterQueue).add('IsPrimary', isPrimary.toString());
        // Create queue policy for additional security
        const queuePolicy = new sqs.QueuePolicy(this, 'DeadLetterQueuePolicy', {
            queues: [this.deadLetterQueue],
        });
        queuePolicy.document.addStatements(new iam.PolicyStatement({
            effect: iam.Effect.DENY,
            principals: [new iam.AnyPrincipal()],
            actions: ['sqs:*'],
            resources: [this.deadLetterQueue.queueArn],
            conditions: {
                Bool: {
                    'aws:SecureTransport': 'false',
                },
            },
        }));
        // Output the queue name and ARN
        new cdk.CfnOutput(this, 'DeadLetterQueueName', {
            value: this.deadLetterQueue.queueName,
            description: 'Name of the dead letter queue',
            exportName: `serverless-dlq-name-${region}`,
        });
        new cdk.CfnOutput(this, 'DeadLetterQueueArn', {
            value: this.deadLetterQueue.queueArn,
            description: 'ARN of the dead letter queue',
            exportName: `serverless-dlq-arn-${region}`,
        });
        new cdk.CfnOutput(this, 'DeadLetterQueueUrl', {
            value: this.deadLetterQueue.queueUrl,
            description: 'URL of the dead letter queue',
            exportName: `serverless-dlq-url-${region}`,
        });
    }
}
exports.SQSStack = SQSStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3FzLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3FzLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx5REFBMkM7QUFDM0MseURBQTJDO0FBQzNDLDJDQUF1QztBQU92QyxNQUFhLFFBQVMsU0FBUSxzQkFBUztJQUNyQixlQUFlLENBQVk7SUFDM0IsU0FBUyxDQUFTO0lBRWxDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBb0I7UUFDNUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixNQUFNLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxHQUFHLEtBQUssQ0FBQztRQUN6QyxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFFekMseUNBQXlDO1FBQ3pDLElBQUksQ0FBQyxTQUFTLEdBQUcsa0JBQWtCLFdBQVcsRUFBRSxDQUFDO1FBRWpELElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUM1RCxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7WUFDekIsaUJBQWlCLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO1lBQzVDLGVBQWUsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDdEMsc0JBQXNCLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ2hELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU07WUFDdkMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxlQUFlLENBQUMsV0FBVztZQUMzQyxZQUFZLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1NBQ25DLENBQUMsQ0FBQztRQUVILDhDQUE4QztRQUM5QyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUNsRSxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3BFLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3hELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1FBRXpFLDhDQUE4QztRQUM5QyxNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLHVCQUF1QixFQUFFO1lBQ3JFLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUM7U0FDL0IsQ0FBQyxDQUFDO1FBRUgsV0FBVyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQ2hDLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUN0QixNQUFNLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJO1lBQ3ZCLFVBQVUsRUFBRSxDQUFDLElBQUksR0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3BDLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQztZQUNsQixTQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQztZQUMxQyxVQUFVLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFO29CQUNKLHFCQUFxQixFQUFFLE9BQU87aUJBQy9CO2FBQ0Y7U0FDRixDQUFDLENBQ0gsQ0FBQztRQUVGLGdDQUFnQztRQUNoQyxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO1lBQzdDLEtBQUssRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVM7WUFDckMsV0FBVyxFQUFFLCtCQUErQjtZQUM1QyxVQUFVLEVBQUUsdUJBQXVCLE1BQU0sRUFBRTtTQUM1QyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG9CQUFvQixFQUFFO1lBQzVDLEtBQUssRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVE7WUFDcEMsV0FBVyxFQUFFLDhCQUE4QjtZQUMzQyxVQUFVLEVBQUUsc0JBQXNCLE1BQU0sRUFBRTtTQUMzQyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG9CQUFvQixFQUFFO1lBQzVDLEtBQUssRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVE7WUFDcEMsV0FBVyxFQUFFLDhCQUE4QjtZQUMzQyxVQUFVLEVBQUUsc0JBQXNCLE1BQU0sRUFBRTtTQUMzQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFuRUQsNEJBbUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIHNxcyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3FzJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5pbnRlcmZhY2UgU1FTU3RhY2tQcm9wcyB7XG4gIGVudmlyb25tZW50OiBzdHJpbmc7XG4gIGlzUHJpbWFyeTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIFNRU1N0YWNrIGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgcHVibGljIHJlYWRvbmx5IGRlYWRMZXR0ZXJRdWV1ZTogc3FzLlF1ZXVlO1xuICBwdWJsaWMgcmVhZG9ubHkgcXVldWVOYW1lOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IFNRU1N0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgY29uc3QgeyBlbnZpcm9ubWVudCwgaXNQcmltYXJ5IH0gPSBwcm9wcztcbiAgICBjb25zdCByZWdpb24gPSBjZGsuU3RhY2sub2YodGhpcykucmVnaW9uO1xuXG4gICAgLy8gQ3JlYXRlIFNRUyBxdWV1ZSBmb3IgZGVhZCBsZXR0ZXIgcXVldWVcbiAgICB0aGlzLnF1ZXVlTmFtZSA9IGBzZXJ2ZXJsZXNzLWRscS0ke2Vudmlyb25tZW50fWA7XG5cbiAgICB0aGlzLmRlYWRMZXR0ZXJRdWV1ZSA9IG5ldyBzcXMuUXVldWUodGhpcywgJ0RlYWRMZXR0ZXJRdWV1ZScsIHtcbiAgICAgIHF1ZXVlTmFtZTogdGhpcy5xdWV1ZU5hbWUsXG4gICAgICB2aXNpYmlsaXR5VGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzAwKSxcbiAgICAgIHJldGVudGlvblBlcmlvZDogY2RrLkR1cmF0aW9uLmRheXMoMTQpLFxuICAgICAgcmVjZWl2ZU1lc3NhZ2VXYWl0VGltZTogY2RrLkR1cmF0aW9uLnNlY29uZHMoMjApLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxuICAgICAgZW5jcnlwdGlvbjogc3FzLlF1ZXVlRW5jcnlwdGlvbi5TUVNfTUFOQUdFRCxcbiAgICAgIGRhdGFLZXlSZXVzZTogY2RrLkR1cmF0aW9uLmRheXMoMSksXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgdGFncyBmb3IgY29zdCBhbGxvY2F0aW9uIGFuZCBnb3Zlcm5hbmNlXG4gICAgY2RrLlRhZ3Mub2YodGhpcy5kZWFkTGV0dGVyUXVldWUpLmFkZCgnRW52aXJvbm1lbnQnLCBlbnZpcm9ubWVudCk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcy5kZWFkTGV0dGVyUXVldWUpLmFkZCgnU2VydmljZScsICdEZWFkTGV0dGVyUXVldWUnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzLmRlYWRMZXR0ZXJRdWV1ZSkuYWRkKCdSZWdpb24nLCByZWdpb24pO1xuICAgIGNkay5UYWdzLm9mKHRoaXMuZGVhZExldHRlclF1ZXVlKS5hZGQoJ0lzUHJpbWFyeScsIGlzUHJpbWFyeS50b1N0cmluZygpKTtcblxuICAgIC8vIENyZWF0ZSBxdWV1ZSBwb2xpY3kgZm9yIGFkZGl0aW9uYWwgc2VjdXJpdHlcbiAgICBjb25zdCBxdWV1ZVBvbGljeSA9IG5ldyBzcXMuUXVldWVQb2xpY3kodGhpcywgJ0RlYWRMZXR0ZXJRdWV1ZVBvbGljeScsIHtcbiAgICAgIHF1ZXVlczogW3RoaXMuZGVhZExldHRlclF1ZXVlXSxcbiAgICB9KTtcblxuICAgIHF1ZXVlUG9saWN5LmRvY3VtZW50LmFkZFN0YXRlbWVudHMoXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5ERU5ZLFxuICAgICAgICBwcmluY2lwYWxzOiBbbmV3IGlhbS5BbnlQcmluY2lwYWwoKV0sXG4gICAgICAgIGFjdGlvbnM6IFsnc3FzOionXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbdGhpcy5kZWFkTGV0dGVyUXVldWUucXVldWVBcm5dLFxuICAgICAgICBjb25kaXRpb25zOiB7XG4gICAgICAgICAgQm9vbDoge1xuICAgICAgICAgICAgJ2F3czpTZWN1cmVUcmFuc3BvcnQnOiAnZmFsc2UnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBPdXRwdXQgdGhlIHF1ZXVlIG5hbWUgYW5kIEFSTlxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdEZWFkTGV0dGVyUXVldWVOYW1lJywge1xuICAgICAgdmFsdWU6IHRoaXMuZGVhZExldHRlclF1ZXVlLnF1ZXVlTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnTmFtZSBvZiB0aGUgZGVhZCBsZXR0ZXIgcXVldWUnLFxuICAgICAgZXhwb3J0TmFtZTogYHNlcnZlcmxlc3MtZGxxLW5hbWUtJHtyZWdpb259YCxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdEZWFkTGV0dGVyUXVldWVBcm4nLCB7XG4gICAgICB2YWx1ZTogdGhpcy5kZWFkTGV0dGVyUXVldWUucXVldWVBcm4sXG4gICAgICBkZXNjcmlwdGlvbjogJ0FSTiBvZiB0aGUgZGVhZCBsZXR0ZXIgcXVldWUnLFxuICAgICAgZXhwb3J0TmFtZTogYHNlcnZlcmxlc3MtZGxxLWFybi0ke3JlZ2lvbn1gLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0RlYWRMZXR0ZXJRdWV1ZVVybCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmRlYWRMZXR0ZXJRdWV1ZS5xdWV1ZVVybCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnVVJMIG9mIHRoZSBkZWFkIGxldHRlciBxdWV1ZScsXG4gICAgICBleHBvcnROYW1lOiBgc2VydmVybGVzcy1kbHEtdXJsLSR7cmVnaW9ufWAsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==