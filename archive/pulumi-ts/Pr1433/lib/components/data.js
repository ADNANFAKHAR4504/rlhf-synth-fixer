"use strict";
// lib/components/data.ts
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
exports.DataProcessingInfrastructure = void 0;
/**
 * Data Processing Infrastructure Component
 * Creates Amazon Kinesis Data Stream, an AWS Lambda consumer, and an S3 bucket for processed data.
 */
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class DataProcessingInfrastructure extends pulumi.ComponentResource {
    kinesisStream;
    processedDataBucket;
    kinesisProcessorRole;
    kinesisProcessor;
    kinesisEventSourceMapping;
    constructor(name, args, opts) {
        super('custom:data_processing:Infrastructure', name, {}, opts);
        // Kinesis Data Stream
        this.kinesisStream = new aws.kinesis.Stream(`${name}-stream`, {
            name: `${name}-realtime-events`,
            shardCount: 1, // For demonstration; adjust for production scale
            retentionPeriod: 24, // 24 hours
            tags: args.tags,
        }, { parent: this });
        // S3 Bucket for processed data
        this.processedDataBucket = new aws.s3.Bucket(`${name}-processed-data`, {
            // Let AWS auto-generate a unique bucket name
            acl: 'private',
            serverSideEncryptionConfiguration: {
                rule: {
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: 'AES256',
                    },
                },
            },
            tags: args.tags,
        }, { parent: this });
        // IAM Role for Kinesis Processor Lambda
        this.kinesisProcessorRole = new aws.iam.Role(`${name}-processor-role`, {
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
            tags: args.tags,
        }, { parent: this });
        // Attach VPC execution role policy
        new aws.iam.RolePolicyAttachment(`${name}-processor-vpc-policy`, {
            role: this.kinesisProcessorRole.name,
            policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
        }, { parent: this });
        // Custom policy for Kinesis processor
        const kinesisProcessorPolicy = pulumi
            .all([
            this.kinesisStream.arn,
            this.processedDataBucket.arn,
            args.snsTopicArn,
        ])
            .apply(([kinesisArn, bucketArn, snsArn]) => JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: [
                        'kinesis:GetRecords',
                        'kinesis:GetShardIterator',
                        'kinesis:DescribeStream',
                        'kinesis:ListStreams',
                    ],
                    Resource: kinesisArn,
                },
                {
                    Effect: 'Allow',
                    Action: [
                        's3:PutObject',
                        's3:GetObject', // Added GetObject for potential read-back or validation
                    ],
                    Resource: `${bucketArn}/*`,
                },
                {
                    Effect: 'Allow',
                    Action: ['sns:Publish'],
                    Resource: snsArn,
                },
                {
                    Effect: 'Allow',
                    Action: [
                        'logs:CreateLogGroup',
                        'logs:CreateLogStream',
                        'logs:PutLogEvents',
                    ],
                    Resource: 'arn:aws:logs:*:*:*',
                },
            ],
        }));
        new aws.iam.RolePolicy(`${name}-processor-policy`, {
            role: this.kinesisProcessorRole.id,
            policy: kinesisProcessorPolicy,
        }, { parent: this });
        // Kinesis Processor Lambda Function
        const kinesisProcessorCode = this.getKinesisProcessorCode();
        this.kinesisProcessor = new aws.lambda.Function(`${name}-processor-function`, {
            name: `${name}-kinesis-processor`,
            runtime: 'nodejs18.x',
            code: new pulumi.asset.AssetArchive({
                'index.js': new pulumi.asset.StringAsset(kinesisProcessorCode),
            }),
            handler: 'index.handler',
            role: this.kinesisProcessorRole.arn,
            timeout: 60,
            memorySize: 256,
            vpcConfig: {
                subnetIds: args.privateSubnetIds,
                securityGroupIds: [args.vpcEndpointSgId],
            },
            environment: {
                variables: {
                    PROCESSED_DATA_BUCKET: this.processedDataBucket.id,
                    SNS_TOPIC_ARN: args.snsTopicArn,
                },
            },
            tags: args.tags,
        }, { parent: this });
        // Kinesis Event Source Mapping
        this.kinesisEventSourceMapping = new aws.lambda.EventSourceMapping(`${name}-kinesis-esm`, {
            eventSourceArn: this.kinesisStream.arn,
            functionName: this.kinesisProcessor.arn,
            startingPosition: 'LATEST',
            batchSize: 100,
        }, { parent: this });
        this.registerOutputs({
            kinesisStreamName: this.kinesisStream.name,
            processedDataBucketName: this.processedDataBucket.id,
            kinesisProcessorFunctionName: this.kinesisProcessor.name,
        });
    }
    getKinesisProcessorCode() {
        return `
const AWS = require('aws-sdk');

const s3Client = new AWS.S3();
const snsClient = new AWS.SNS();
const processedDataBucket = process.env.PROCESSED_DATA_BUCKET;
const snsTopicArn = process.env.SNS_TOPIC_ARN;

exports.handler = async (event, context) => {
    console.log('Received Kinesis event:', JSON.stringify(event));
    let recordsProcessed = 0;
    
    try {
        for (const record of event.Records) {
            // Kinesis data is base64 encoded
            const payload = Buffer.from(record.kinesis.data, 'base64').toString('utf-8');
            const data = JSON.parse(payload);
            
            // Add processing timestamp
            data.processed_at = new Date().toISOString();
            
            // Define S3 key (e.g., year/month/day/hour/lambda_request_id_record_sequence_number.json)
            const currentTime = new Date();
            const year = currentTime.getFullYear();
            const month = String(currentTime.getMonth() + 1).padStart(2, '0');
            const day = String(currentTime.getDate()).padStart(2, '0');
            const hour = String(currentTime.getHours()).padStart(2, '0');
            
            const s3Key = \`\${year}/\${month}/\${day}/\${hour}/\${context.awsRequestId}_\${record.kinesis.sequenceNumber}.json\`;
            
            await s3Client.putObject({
                Bucket: processedDataBucket,
                Key: s3Key,
                Body: JSON.stringify(data),
                ContentType: 'application/json'
            }).promise();
            
            console.log(\`Successfully processed record and saved to s3://\${processedDataBucket}/\${s3Key}\`);
            recordsProcessed++;
        }
    } catch (error) {
        console.error('Error processing Kinesis record:', error.message);
        
        // Publish an alert to SNS
        try {
            await snsClient.publish({
                TopicArn: snsTopicArn,
                Message: \`Error in Kinesis processor Lambda: \${error.message}\`,
                Subject: 'Kinesis Processor Error Alert'
            }).promise();
        } catch (snsError) {
            console.error('Failed to send SNS notification:', snsError);
        }
        
        throw error; // Re-raise to indicate failure to Kinesis, allowing retries
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify(\`Successfully processed \${recordsProcessed} records.\`)
    };
};
`;
    }
}
exports.DataProcessingInfrastructure = DataProcessingInfrastructure;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRhdGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHlCQUF5Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRXpCOzs7R0FHRztBQUVILHVEQUF5QztBQUN6QyxpREFBbUM7QUFVbkMsTUFBYSw0QkFBNkIsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ3hELGFBQWEsQ0FBcUI7SUFDbEMsbUJBQW1CLENBQWdCO0lBQ25DLG9CQUFvQixDQUFlO0lBQ25DLGdCQUFnQixDQUFzQjtJQUN0Qyx5QkFBeUIsQ0FBZ0M7SUFFekUsWUFDRSxJQUFZLEVBQ1osSUFBc0MsRUFDdEMsSUFBc0M7UUFFdEMsS0FBSyxDQUFDLHVDQUF1QyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFL0Qsc0JBQXNCO1FBQ3RCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FDekMsR0FBRyxJQUFJLFNBQVMsRUFDaEI7WUFDRSxJQUFJLEVBQUUsR0FBRyxJQUFJLGtCQUFrQjtZQUMvQixVQUFVLEVBQUUsQ0FBQyxFQUFFLGlEQUFpRDtZQUNoRSxlQUFlLEVBQUUsRUFBRSxFQUFFLFdBQVc7WUFDaEMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1NBQ2hCLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRiwrQkFBK0I7UUFDL0IsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQzFDLEdBQUcsSUFBSSxpQkFBaUIsRUFDeEI7WUFDRSw2Q0FBNkM7WUFDN0MsR0FBRyxFQUFFLFNBQVM7WUFDZCxpQ0FBaUMsRUFBRTtnQkFDakMsSUFBSSxFQUFFO29CQUNKLGtDQUFrQyxFQUFFO3dCQUNsQyxZQUFZLEVBQUUsUUFBUTtxQkFDdkI7aUJBQ0Y7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Q3BELDRCQUE0QixFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJO1NBQ3pELENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTyx1QkFBdUI7UUFDN0IsT0FBTzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E4RFYsQ0FBQztJQUNBLENBQUM7Q0FDRjtBQXRQRCxvRUFzUEMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBsaWIvY29tcG9uZW50cy9kYXRhLnRzXG5cbi8qKlxuICogRGF0YSBQcm9jZXNzaW5nIEluZnJhc3RydWN0dXJlIENvbXBvbmVudFxuICogQ3JlYXRlcyBBbWF6b24gS2luZXNpcyBEYXRhIFN0cmVhbSwgYW4gQVdTIExhbWJkYSBjb25zdW1lciwgYW5kIGFuIFMzIGJ1Y2tldCBmb3IgcHJvY2Vzc2VkIGRhdGEuXG4gKi9cblxuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YVByb2Nlc3NpbmdJbmZyYXN0cnVjdHVyZUFyZ3Mge1xuICB2cGNJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwcml2YXRlU3VibmV0SWRzOiBwdWx1bWkuT3V0cHV0PHN0cmluZz5bXTtcbiAgdnBjRW5kcG9pbnRTZ0lkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHNuc1RvcGljQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHRhZ3M6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH07XG59XG5cbmV4cG9ydCBjbGFzcyBEYXRhUHJvY2Vzc2luZ0luZnJhc3RydWN0dXJlIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGtpbmVzaXNTdHJlYW06IGF3cy5raW5lc2lzLlN0cmVhbTtcbiAgcHVibGljIHJlYWRvbmx5IHByb2Nlc3NlZERhdGFCdWNrZXQ6IGF3cy5zMy5CdWNrZXQ7XG4gIHB1YmxpYyByZWFkb25seSBraW5lc2lzUHJvY2Vzc29yUm9sZTogYXdzLmlhbS5Sb2xlO1xuICBwdWJsaWMgcmVhZG9ubHkga2luZXNpc1Byb2Nlc3NvcjogYXdzLmxhbWJkYS5GdW5jdGlvbjtcbiAgcHVibGljIHJlYWRvbmx5IGtpbmVzaXNFdmVudFNvdXJjZU1hcHBpbmc6IGF3cy5sYW1iZGEuRXZlbnRTb3VyY2VNYXBwaW5nO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBEYXRhUHJvY2Vzc2luZ0luZnJhc3RydWN0dXJlQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignY3VzdG9tOmRhdGFfcHJvY2Vzc2luZzpJbmZyYXN0cnVjdHVyZScsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIC8vIEtpbmVzaXMgRGF0YSBTdHJlYW1cbiAgICB0aGlzLmtpbmVzaXNTdHJlYW0gPSBuZXcgYXdzLmtpbmVzaXMuU3RyZWFtKFxuICAgICAgYCR7bmFtZX0tc3RyZWFtYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYCR7bmFtZX0tcmVhbHRpbWUtZXZlbnRzYCxcbiAgICAgICAgc2hhcmRDb3VudDogMSwgLy8gRm9yIGRlbW9uc3RyYXRpb247IGFkanVzdCBmb3IgcHJvZHVjdGlvbiBzY2FsZVxuICAgICAgICByZXRlbnRpb25QZXJpb2Q6IDI0LCAvLyAyNCBob3Vyc1xuICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBTMyBCdWNrZXQgZm9yIHByb2Nlc3NlZCBkYXRhXG4gICAgdGhpcy5wcm9jZXNzZWREYXRhQnVja2V0ID0gbmV3IGF3cy5zMy5CdWNrZXQoXG4gICAgICBgJHtuYW1lfS1wcm9jZXNzZWQtZGF0YWAsXG4gICAgICB7XG4gICAgICAgIC8vIExldCBBV1MgYXV0by1nZW5lcmF0ZSBhIHVuaXF1ZSBidWNrZXQgbmFtZVxuICAgICAgICBhY2w6ICdwcml2YXRlJyxcbiAgICAgICAgc2VydmVyU2lkZUVuY3J5cHRpb25Db25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgcnVsZToge1xuICAgICAgICAgICAgYXBwbHlTZXJ2ZXJTaWRlRW5jcnlwdGlvbkJ5RGVmYXVsdDoge1xuICAgICAgICAgICAgICBzc2VBbGdvcml0aG06ICdBRVMyNTYnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBJQU0gUm9sZSBmb3IgS2luZXNpcyBQcm9jZXNzb3IgTGFtYmRhXG4gICAgdGhpcy5raW5lc2lzUHJvY2Vzc29yUm9sZSA9IG5ldyBhd3MuaWFtLlJvbGUoXG4gICAgICBgJHtuYW1lfS1wcm9jZXNzb3Itcm9sZWAsXG4gICAgICB7XG4gICAgICAgIGFzc3VtZVJvbGVQb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIEFjdGlvbjogJ3N0czpBc3N1bWVSb2xlJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlOiAnbGFtYmRhLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQXR0YWNoIFZQQyBleGVjdXRpb24gcm9sZSBwb2xpY3lcbiAgICBuZXcgYXdzLmlhbS5Sb2xlUG9saWN5QXR0YWNobWVudChcbiAgICAgIGAke25hbWV9LXByb2Nlc3Nvci12cGMtcG9saWN5YCxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogdGhpcy5raW5lc2lzUHJvY2Vzc29yUm9sZS5uYW1lLFxuICAgICAgICBwb2xpY3lBcm46XG4gICAgICAgICAgJ2Fybjphd3M6aWFtOjphd3M6cG9saWN5L3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFWUENBY2Nlc3NFeGVjdXRpb25Sb2xlJyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEN1c3RvbSBwb2xpY3kgZm9yIEtpbmVzaXMgcHJvY2Vzc29yXG4gICAgY29uc3Qga2luZXNpc1Byb2Nlc3NvclBvbGljeSA9IHB1bHVtaVxuICAgICAgLmFsbChbXG4gICAgICAgIHRoaXMua2luZXNpc1N0cmVhbS5hcm4sXG4gICAgICAgIHRoaXMucHJvY2Vzc2VkRGF0YUJ1Y2tldC5hcm4sXG4gICAgICAgIGFyZ3Muc25zVG9waWNBcm4sXG4gICAgICBdKVxuICAgICAgLmFwcGx5KChba2luZXNpc0FybiwgYnVja2V0QXJuLCBzbnNBcm5dKSA9PlxuICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAgICdraW5lc2lzOkdldFJlY29yZHMnLFxuICAgICAgICAgICAgICAgICdraW5lc2lzOkdldFNoYXJkSXRlcmF0b3InLFxuICAgICAgICAgICAgICAgICdraW5lc2lzOkRlc2NyaWJlU3RyZWFtJyxcbiAgICAgICAgICAgICAgICAna2luZXNpczpMaXN0U3RyZWFtcycsXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIFJlc291cmNlOiBraW5lc2lzQXJuLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAnczM6UHV0T2JqZWN0JyxcbiAgICAgICAgICAgICAgICAnczM6R2V0T2JqZWN0JywgLy8gQWRkZWQgR2V0T2JqZWN0IGZvciBwb3RlbnRpYWwgcmVhZC1iYWNrIG9yIHZhbGlkYXRpb25cbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6IGAke2J1Y2tldEFybn0vKmAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIEFjdGlvbjogWydzbnM6UHVibGlzaCddLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogc25zQXJuLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAnbG9nczpDcmVhdGVMb2dHcm91cCcsXG4gICAgICAgICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nU3RyZWFtJyxcbiAgICAgICAgICAgICAgICAnbG9nczpQdXRMb2dFdmVudHMnLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogJ2Fybjphd3M6bG9nczoqOio6KicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgbmV3IGF3cy5pYW0uUm9sZVBvbGljeShcbiAgICAgIGAke25hbWV9LXByb2Nlc3Nvci1wb2xpY3lgLFxuICAgICAge1xuICAgICAgICByb2xlOiB0aGlzLmtpbmVzaXNQcm9jZXNzb3JSb2xlLmlkLFxuICAgICAgICBwb2xpY3k6IGtpbmVzaXNQcm9jZXNzb3JQb2xpY3ksXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBLaW5lc2lzIFByb2Nlc3NvciBMYW1iZGEgRnVuY3Rpb25cbiAgICBjb25zdCBraW5lc2lzUHJvY2Vzc29yQ29kZSA9IHRoaXMuZ2V0S2luZXNpc1Byb2Nlc3NvckNvZGUoKTtcblxuICAgIHRoaXMua2luZXNpc1Byb2Nlc3NvciA9IG5ldyBhd3MubGFtYmRhLkZ1bmN0aW9uKFxuICAgICAgYCR7bmFtZX0tcHJvY2Vzc29yLWZ1bmN0aW9uYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYCR7bmFtZX0ta2luZXNpcy1wcm9jZXNzb3JgLFxuICAgICAgICBydW50aW1lOiAnbm9kZWpzMTgueCcsXG4gICAgICAgIGNvZGU6IG5ldyBwdWx1bWkuYXNzZXQuQXNzZXRBcmNoaXZlKHtcbiAgICAgICAgICAnaW5kZXguanMnOiBuZXcgcHVsdW1pLmFzc2V0LlN0cmluZ0Fzc2V0KGtpbmVzaXNQcm9jZXNzb3JDb2RlKSxcbiAgICAgICAgfSksXG4gICAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgICAgcm9sZTogdGhpcy5raW5lc2lzUHJvY2Vzc29yUm9sZS5hcm4sXG4gICAgICAgIHRpbWVvdXQ6IDYwLFxuICAgICAgICBtZW1vcnlTaXplOiAyNTYsXG4gICAgICAgIHZwY0NvbmZpZzoge1xuICAgICAgICAgIHN1Ym5ldElkczogYXJncy5wcml2YXRlU3VibmV0SWRzLFxuICAgICAgICAgIHNlY3VyaXR5R3JvdXBJZHM6IFthcmdzLnZwY0VuZHBvaW50U2dJZF0sXG4gICAgICAgIH0sXG4gICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICBQUk9DRVNTRURfREFUQV9CVUNLRVQ6IHRoaXMucHJvY2Vzc2VkRGF0YUJ1Y2tldC5pZCxcbiAgICAgICAgICAgIFNOU19UT1BJQ19BUk46IGFyZ3Muc25zVG9waWNBcm4sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gS2luZXNpcyBFdmVudCBTb3VyY2UgTWFwcGluZ1xuICAgIHRoaXMua2luZXNpc0V2ZW50U291cmNlTWFwcGluZyA9IG5ldyBhd3MubGFtYmRhLkV2ZW50U291cmNlTWFwcGluZyhcbiAgICAgIGAke25hbWV9LWtpbmVzaXMtZXNtYCxcbiAgICAgIHtcbiAgICAgICAgZXZlbnRTb3VyY2VBcm46IHRoaXMua2luZXNpc1N0cmVhbS5hcm4sXG4gICAgICAgIGZ1bmN0aW9uTmFtZTogdGhpcy5raW5lc2lzUHJvY2Vzc29yLmFybixcbiAgICAgICAgc3RhcnRpbmdQb3NpdGlvbjogJ0xBVEVTVCcsXG4gICAgICAgIGJhdGNoU2l6ZTogMTAwLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAga2luZXNpc1N0cmVhbU5hbWU6IHRoaXMua2luZXNpc1N0cmVhbS5uYW1lLFxuICAgICAgcHJvY2Vzc2VkRGF0YUJ1Y2tldE5hbWU6IHRoaXMucHJvY2Vzc2VkRGF0YUJ1Y2tldC5pZCxcbiAgICAgIGtpbmVzaXNQcm9jZXNzb3JGdW5jdGlvbk5hbWU6IHRoaXMua2luZXNpc1Byb2Nlc3Nvci5uYW1lLFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRLaW5lc2lzUHJvY2Vzc29yQ29kZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiBgXG5jb25zdCBBV1MgPSByZXF1aXJlKCdhd3Mtc2RrJyk7XG5cbmNvbnN0IHMzQ2xpZW50ID0gbmV3IEFXUy5TMygpO1xuY29uc3Qgc25zQ2xpZW50ID0gbmV3IEFXUy5TTlMoKTtcbmNvbnN0IHByb2Nlc3NlZERhdGFCdWNrZXQgPSBwcm9jZXNzLmVudi5QUk9DRVNTRURfREFUQV9CVUNLRVQ7XG5jb25zdCBzbnNUb3BpY0FybiA9IHByb2Nlc3MuZW52LlNOU19UT1BJQ19BUk47XG5cbmV4cG9ydHMuaGFuZGxlciA9IGFzeW5jIChldmVudCwgY29udGV4dCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdSZWNlaXZlZCBLaW5lc2lzIGV2ZW50OicsIEpTT04uc3RyaW5naWZ5KGV2ZW50KSk7XG4gICAgbGV0IHJlY29yZHNQcm9jZXNzZWQgPSAwO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICAgIGZvciAoY29uc3QgcmVjb3JkIG9mIGV2ZW50LlJlY29yZHMpIHtcbiAgICAgICAgICAgIC8vIEtpbmVzaXMgZGF0YSBpcyBiYXNlNjQgZW5jb2RlZFxuICAgICAgICAgICAgY29uc3QgcGF5bG9hZCA9IEJ1ZmZlci5mcm9tKHJlY29yZC5raW5lc2lzLmRhdGEsICdiYXNlNjQnKS50b1N0cmluZygndXRmLTgnKTtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBKU09OLnBhcnNlKHBheWxvYWQpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBBZGQgcHJvY2Vzc2luZyB0aW1lc3RhbXBcbiAgICAgICAgICAgIGRhdGEucHJvY2Vzc2VkX2F0ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBEZWZpbmUgUzMga2V5IChlLmcuLCB5ZWFyL21vbnRoL2RheS9ob3VyL2xhbWJkYV9yZXF1ZXN0X2lkX3JlY29yZF9zZXF1ZW5jZV9udW1iZXIuanNvbilcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRUaW1lID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgIGNvbnN0IHllYXIgPSBjdXJyZW50VGltZS5nZXRGdWxsWWVhcigpO1xuICAgICAgICAgICAgY29uc3QgbW9udGggPSBTdHJpbmcoY3VycmVudFRpbWUuZ2V0TW9udGgoKSArIDEpLnBhZFN0YXJ0KDIsICcwJyk7XG4gICAgICAgICAgICBjb25zdCBkYXkgPSBTdHJpbmcoY3VycmVudFRpbWUuZ2V0RGF0ZSgpKS5wYWRTdGFydCgyLCAnMCcpO1xuICAgICAgICAgICAgY29uc3QgaG91ciA9IFN0cmluZyhjdXJyZW50VGltZS5nZXRIb3VycygpKS5wYWRTdGFydCgyLCAnMCcpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBjb25zdCBzM0tleSA9IFxcYFxcJHt5ZWFyfS9cXCR7bW9udGh9L1xcJHtkYXl9L1xcJHtob3VyfS9cXCR7Y29udGV4dC5hd3NSZXF1ZXN0SWR9X1xcJHtyZWNvcmQua2luZXNpcy5zZXF1ZW5jZU51bWJlcn0uanNvblxcYDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgYXdhaXQgczNDbGllbnQucHV0T2JqZWN0KHtcbiAgICAgICAgICAgICAgICBCdWNrZXQ6IHByb2Nlc3NlZERhdGFCdWNrZXQsXG4gICAgICAgICAgICAgICAgS2V5OiBzM0tleSxcbiAgICAgICAgICAgICAgICBCb2R5OiBKU09OLnN0cmluZ2lmeShkYXRhKSxcbiAgICAgICAgICAgICAgICBDb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgICAgICB9KS5wcm9taXNlKCk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFxcYFN1Y2Nlc3NmdWxseSBwcm9jZXNzZWQgcmVjb3JkIGFuZCBzYXZlZCB0byBzMzovL1xcJHtwcm9jZXNzZWREYXRhQnVja2V0fS9cXCR7czNLZXl9XFxgKTtcbiAgICAgICAgICAgIHJlY29yZHNQcm9jZXNzZWQrKztcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHByb2Nlc3NpbmcgS2luZXNpcyByZWNvcmQ6JywgZXJyb3IubWVzc2FnZSk7XG4gICAgICAgIFxuICAgICAgICAvLyBQdWJsaXNoIGFuIGFsZXJ0IHRvIFNOU1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgc25zQ2xpZW50LnB1Ymxpc2goe1xuICAgICAgICAgICAgICAgIFRvcGljQXJuOiBzbnNUb3BpY0FybixcbiAgICAgICAgICAgICAgICBNZXNzYWdlOiBcXGBFcnJvciBpbiBLaW5lc2lzIHByb2Nlc3NvciBMYW1iZGE6IFxcJHtlcnJvci5tZXNzYWdlfVxcYCxcbiAgICAgICAgICAgICAgICBTdWJqZWN0OiAnS2luZXNpcyBQcm9jZXNzb3IgRXJyb3IgQWxlcnQnXG4gICAgICAgICAgICB9KS5wcm9taXNlKCk7XG4gICAgICAgIH0gY2F0Y2ggKHNuc0Vycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gc2VuZCBTTlMgbm90aWZpY2F0aW9uOicsIHNuc0Vycm9yKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhyb3cgZXJyb3I7IC8vIFJlLXJhaXNlIHRvIGluZGljYXRlIGZhaWx1cmUgdG8gS2luZXNpcywgYWxsb3dpbmcgcmV0cmllc1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KFxcYFN1Y2Nlc3NmdWxseSBwcm9jZXNzZWQgXFwke3JlY29yZHNQcm9jZXNzZWR9IHJlY29yZHMuXFxgKVxuICAgIH07XG59O1xuYDtcbiAgfVxufVxuIl19