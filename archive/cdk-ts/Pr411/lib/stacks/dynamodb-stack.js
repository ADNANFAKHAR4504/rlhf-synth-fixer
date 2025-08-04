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
exports.DynamoDBStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const constructs_1 = require("constructs");
class DynamoDBStack extends constructs_1.Construct {
    processedDataTable;
    tableName;
    constructor(scope, id, props) {
        super(scope, id);
        const { environment, isPrimary } = props;
        const region = cdk.Stack.of(this).region;
        // Create DynamoDB table for processed data
        this.tableName = `serverless-processed-data-${environment}`;
        this.processedDataTable = new dynamodb.Table(this, 'ProcessedDataTable', {
            tableName: this.tableName,
            partitionKey: {
                name: 'recordId',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'timestamp',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true,
            stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            timeToLiveAttribute: 'ttl',
        });
        // Add Global Secondary Index for processing status
        this.processedDataTable.addGlobalSecondaryIndex({
            indexName: 'ProcessingStatusIndex',
            partitionKey: {
                name: 'processingStatus',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'timestamp',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        // Add Global Secondary Index for data type
        this.processedDataTable.addGlobalSecondaryIndex({
            indexName: 'DataTypeIndex',
            partitionKey: {
                name: 'dataType',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'timestamp',
                type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        // Configure Global Tables for multi-region replication
        if (isPrimary) {
            // Only configure Global Tables in the primary region
            const globalTable = new dynamodb.CfnGlobalTable(this, 'ProcessedDataGlobalTable', {
                tableName: this.tableName,
                billingMode: 'PAY_PER_REQUEST',
                streamSpecification: {
                    streamViewType: 'NEW_AND_OLD_IMAGES',
                },
                attributeDefinitions: [
                    {
                        attributeName: 'recordId',
                        attributeType: 'S',
                    },
                    {
                        attributeName: 'timestamp',
                        attributeType: 'S',
                    },
                    {
                        attributeName: 'processingStatus',
                        attributeType: 'S',
                    },
                    {
                        attributeName: 'dataType',
                        attributeType: 'S',
                    },
                ],
                keySchema: [
                    {
                        attributeName: 'recordId',
                        keyType: 'HASH',
                    },
                    {
                        attributeName: 'timestamp',
                        keyType: 'RANGE',
                    },
                ],
                globalSecondaryIndexes: [
                    {
                        indexName: 'ProcessingStatusIndex',
                        keySchema: [
                            {
                                attributeName: 'processingStatus',
                                keyType: 'HASH',
                            },
                            {
                                attributeName: 'timestamp',
                                keyType: 'RANGE',
                            },
                        ],
                        projection: {
                            projectionType: 'ALL',
                        },
                    },
                    {
                        indexName: 'DataTypeIndex',
                        keySchema: [
                            {
                                attributeName: 'dataType',
                                keyType: 'HASH',
                            },
                            {
                                attributeName: 'timestamp',
                                keyType: 'RANGE',
                            },
                        ],
                        projection: {
                            projectionType: 'ALL',
                        },
                    },
                ],
                replicas: [
                    {
                        region: 'us-east-1',
                        pointInTimeRecoverySpecification: {
                            pointInTimeRecoveryEnabled: true,
                        },
                    },
                    {
                        region: 'us-west-2',
                        pointInTimeRecoverySpecification: {
                            pointInTimeRecoveryEnabled: true,
                        },
                    },
                ],
            });
            // Add tags for cost allocation and governance
            cdk.Tags.of(globalTable).add('Environment', environment);
            cdk.Tags.of(globalTable).add('Service', 'DataStorage');
            cdk.Tags.of(globalTable).add('Region', region);
            cdk.Tags.of(globalTable).add('IsPrimary', isPrimary.toString());
            cdk.Tags.of(globalTable).add('GlobalTable', 'true');
        }
        // Add tags for cost allocation and governance
        cdk.Tags.of(this.processedDataTable).add('Environment', environment);
        cdk.Tags.of(this.processedDataTable).add('Service', 'DataStorage');
        cdk.Tags.of(this.processedDataTable).add('Region', region);
        cdk.Tags.of(this.processedDataTable).add('IsPrimary', isPrimary.toString());
        // Output the table name and ARN
        new cdk.CfnOutput(this, 'ProcessedDataTableName', {
            value: this.processedDataTable.tableName,
            description: 'Name of the processed data DynamoDB table',
            exportName: `serverless-processed-data-table-name-${region}`,
        });
        new cdk.CfnOutput(this, 'ProcessedDataTableArn', {
            value: this.processedDataTable.tableArn,
            description: 'ARN of the processed data DynamoDB table',
            exportName: `serverless-processed-data-table-arn-${region}`,
        });
        new cdk.CfnOutput(this, 'ProcessedDataTableStreamArn', {
            value: this.processedDataTable.tableStreamArn || '',
            description: 'Stream ARN of the processed data DynamoDB table',
            exportName: `serverless-processed-data-table-stream-arn-${region}`,
        });
    }
}
exports.DynamoDBStack = DynamoDBStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHluYW1vZGItc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkeW5hbW9kYi1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsbUVBQXFEO0FBQ3JELDJDQUF1QztBQU92QyxNQUFhLGFBQWMsU0FBUSxzQkFBUztJQUMxQixrQkFBa0IsQ0FBaUI7SUFDbkMsU0FBUyxDQUFTO0lBRWxDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBeUI7UUFDakUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixNQUFNLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxHQUFHLEtBQUssQ0FBQztRQUN6QyxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFFekMsMkNBQTJDO1FBQzNDLElBQUksQ0FBQyxTQUFTLEdBQUcsNkJBQTZCLFdBQVcsRUFBRSxDQUFDO1FBRTVELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLG9CQUFvQixFQUFFO1lBQ3ZFLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztZQUN6QixZQUFZLEVBQUU7Z0JBQ1osSUFBSSxFQUFFLFVBQVU7Z0JBQ2hCLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU07YUFDcEM7WUFDRCxPQUFPLEVBQUU7Z0JBQ1AsSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU07YUFDcEM7WUFDRCxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlO1lBQ2pELG1CQUFtQixFQUFFLElBQUk7WUFDekIsTUFBTSxFQUFFLFFBQVEsQ0FBQyxjQUFjLENBQUMsa0JBQWtCO1lBQ2xE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TUFBTSxDQUFDLENBQUM7UUFDM0QsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUU1RSxnQ0FBZ0M7UUFDaEMsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSx3QkFBd0IsRUFBRTtZQUNoRCxLQUFLLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFNBQVM7WUFDeEMsV0FBVyxFQUFFLDJDQUEyQztZQUN4RCxVQUFVLEVBQUUsd0NBQXdDLE1BQU0sRUFBRTtTQUM3RCxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLHVCQUF1QixFQUFFO1lBQy9DLEtBQUssRUFBRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsUUFBUTtZQUN2QyxXQUFXLEVBQUUsMENBQTBDO1lBQ3ZELFVBQVUsRUFBRSx1Q0FBdUMsTUFBTSxFQUFFO1NBQzVELENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsNkJBQTZCLEVBQUU7WUFDckQsS0FBSyxFQUFFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxjQUFjLElBQUksRUFBRTtZQUNuRCxXQUFXLEVBQUUsaURBQWlEO1lBQzlELFVBQVUsRUFBRSw4Q0FBOEMsTUFBTSxFQUFFO1NBQ25FLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXRMRCxzQ0FzTEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5pbnRlcmZhY2UgRHluYW1vREJTdGFja1Byb3BzIHtcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcbiAgaXNQcmltYXJ5OiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgRHluYW1vREJTdGFjayBleHRlbmRzIENvbnN0cnVjdCB7XG4gIHB1YmxpYyByZWFkb25seSBwcm9jZXNzZWREYXRhVGFibGU6IGR5bmFtb2RiLlRhYmxlO1xuICBwdWJsaWMgcmVhZG9ubHkgdGFibGVOYW1lOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IER5bmFtb0RCU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICBjb25zdCB7IGVudmlyb25tZW50LCBpc1ByaW1hcnkgfSA9IHByb3BzO1xuICAgIGNvbnN0IHJlZ2lvbiA9IGNkay5TdGFjay5vZih0aGlzKS5yZWdpb247XG5cbiAgICAvLyBDcmVhdGUgRHluYW1vREIgdGFibGUgZm9yIHByb2Nlc3NlZCBkYXRhXG4gICAgdGhpcy50YWJsZU5hbWUgPSBgc2VydmVybGVzcy1wcm9jZXNzZWQtZGF0YS0ke2Vudmlyb25tZW50fWA7XG5cbiAgICB0aGlzLnByb2Nlc3NlZERhdGFUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnUHJvY2Vzc2VkRGF0YVRhYmxlJywge1xuICAgICAgdGFibGVOYW1lOiB0aGlzLnRhYmxlTmFtZSxcbiAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICBuYW1lOiAncmVjb3JkSWQnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICBzb3J0S2V5OiB7XG4gICAgICAgIG5hbWU6ICd0aW1lc3RhbXAnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcG9pbnRJblRpbWVSZWNvdmVyeTogdHJ1ZSxcbiAgICAgIHN0cmVhbTogZHluYW1vZGIuU3RyZWFtVmlld1R5cGUuTkVXX0FORF9PTERfSU1BR0VTLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxuICAgICAgdGltZVRvTGl2ZUF0dHJpYnV0ZTogJ3R0bCcsXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgR2xvYmFsIFNlY29uZGFyeSBJbmRleCBmb3IgcHJvY2Vzc2luZyBzdGF0dXNcbiAgICB0aGlzLnByb2Nlc3NlZERhdGFUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdQcm9jZXNzaW5nU3RhdHVzSW5kZXgnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgIG5hbWU6ICdwcm9jZXNzaW5nU3RhdHVzJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgc29ydEtleToge1xuICAgICAgICBuYW1lOiAndGltZXN0YW1wJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgcHJvamVjdGlvblR5cGU6IGR5bmFtb2RiLlByb2plY3Rpb25UeXBlLkFMTCxcbiAgICB9KTtcblxuICAgIC8vIEFkZCBHbG9iYWwgU2Vjb25kYXJ5IEluZGV4IGZvciBkYXRhIHR5cGVcbiAgICB0aGlzLnByb2Nlc3NlZERhdGFUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdEYXRhVHlwZUluZGV4JyxcbiAgICAgIHBhcnRpdGlvbktleToge1xuICAgICAgICBuYW1lOiAnZGF0YVR5cGUnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICBzb3J0S2V5OiB7XG4gICAgICAgIG5hbWU6ICd0aW1lc3RhbXAnLFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyxcbiAgICAgIH0sXG4gICAgICBwcm9qZWN0aW9uVHlwZTogZHluYW1vZGIuUHJvamVjdGlvblR5cGUuQUxMLFxuICAgIH0pO1xuXG4gICAgLy8gQ29uZmlndXJlIEdsb2JhbCBUYWJsZXMgZm9yIG11bHRpLXJlZ2lvbiByZXBsaWNhdGlvblxuICAgIGlmIChpc1ByaW1hcnkpIHtcbiAgICAgIC8vIE9ubHkgY29uZmlndXJlIEdsb2JhbCBUYWJsZXMgaW4gdGhlIHByaW1hcnkgcmVnaW9uXG4gICAgICBjb25zdCBnbG9iYWxUYWJsZSA9IG5ldyBkeW5hbW9kYi5DZm5HbG9iYWxUYWJsZShcbiAgICAgICAgdGhpcyxcbiAgICAgICAgJ1Byb2Nlc3NlZERhdGFHbG9iYWxUYWJsZScsXG4gICAgICAgIHtcbiAgICAgICAgICB0YWJsZU5hbWU6IHRoaXMudGFibGVOYW1lLFxuICAgICAgICAgIGJpbGxpbmdNb2RlOiAnUEFZX1BFUl9SRVFVRVNUJyxcbiAgICAgICAgICBzdHJlYW1TcGVjaWZpY2F0aW9uOiB7XG4gICAgICAgICAgICBzdHJlYW1WaWV3VHlwZTogJ05FV19BTkRfT0xEX0lNQUdFUycsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBhdHRyaWJ1dGVEZWZpbml0aW9uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBhdHRyaWJ1dGVOYW1lOiAncmVjb3JkSWQnLFxuICAgICAgICAgICAgICBhdHRyaWJ1dGVUeXBlOiAnUycsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBhdHRyaWJ1dGVOYW1lOiAndGltZXN0YW1wJyxcbiAgICAgICAgICAgICAgYXR0cmlidXRlVHlwZTogJ1MnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgYXR0cmlidXRlTmFtZTogJ3Byb2Nlc3NpbmdTdGF0dXMnLFxuICAgICAgICAgICAgICBhdHRyaWJ1dGVUeXBlOiAnUycsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBhdHRyaWJ1dGVOYW1lOiAnZGF0YVR5cGUnLFxuICAgICAgICAgICAgICBhdHRyaWJ1dGVUeXBlOiAnUycsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgICAga2V5U2NoZW1hOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGF0dHJpYnV0ZU5hbWU6ICdyZWNvcmRJZCcsXG4gICAgICAgICAgICAgIGtleVR5cGU6ICdIQVNIJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGF0dHJpYnV0ZU5hbWU6ICd0aW1lc3RhbXAnLFxuICAgICAgICAgICAgICBrZXlUeXBlOiAnUkFOR0UnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIGdsb2JhbFNlY29uZGFyeUluZGV4ZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgaW5kZXhOYW1lOiAnUHJvY2Vzc2luZ1N0YXR1c0luZGV4JyxcbiAgICAgICAgICAgICAga2V5U2NoZW1hOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgYXR0cmlidXRlTmFtZTogJ3Byb2Nlc3NpbmdTdGF0dXMnLFxuICAgICAgICAgICAgICAgICAga2V5VHlwZTogJ0hBU0gnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgYXR0cmlidXRlTmFtZTogJ3RpbWVzdGFtcCcsXG4gICAgICAgICAgICAgICAgICBrZXlUeXBlOiAnUkFOR0UnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIHByb2plY3Rpb246IHtcbiAgICAgICAgICAgICAgICBwcm9qZWN0aW9uVHlwZTogJ0FMTCcsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBpbmRleE5hbWU6ICdEYXRhVHlwZUluZGV4JyxcbiAgICAgICAgICAgICAga2V5U2NoZW1hOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgYXR0cmlidXRlTmFtZTogJ2RhdGFUeXBlJyxcbiAgICAgICAgICAgICAgICAgIGtleVR5cGU6ICdIQVNIJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZU5hbWU6ICd0aW1lc3RhbXAnLFxuICAgICAgICAgICAgICAgICAga2V5VHlwZTogJ1JBTkdFJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICBwcm9qZWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgcHJvamVjdGlvblR5cGU6ICdBTEwnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICAgIHJlcGxpY2FzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHJlZ2lvbjogJ3VzLWVhc3QtMScsXG4gICAgICAgICAgICAgIHBvaW50SW5UaW1lUmVjb3ZlcnlTcGVjaWZpY2F0aW9uOiB7XG4gICAgICAgICAgICAgICAgcG9pbnRJblRpbWVSZWNvdmVyeUVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICByZWdpb246ICd1cy13ZXN0LTInLFxuICAgICAgICAgICAgICBwb2ludEluVGltZVJlY292ZXJ5U3BlY2lmaWNhdGlvbjoge1xuICAgICAgICAgICAgICAgIHBvaW50SW5UaW1lUmVjb3ZlcnlFbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9XG4gICAgICApO1xuXG4gICAgICAvLyBBZGQgdGFncyBmb3IgY29zdCBhbGxvY2F0aW9uIGFuZCBnb3Zlcm5hbmNlXG4gICAgICBjZGsuVGFncy5vZihnbG9iYWxUYWJsZSkuYWRkKCdFbnZpcm9ubWVudCcsIGVudmlyb25tZW50KTtcbiAgICAgIGNkay5UYWdzLm9mKGdsb2JhbFRhYmxlKS5hZGQoJ1NlcnZpY2UnLCAnRGF0YVN0b3JhZ2UnKTtcbiAgICAgIGNkay5UYWdzLm9mKGdsb2JhbFRhYmxlKS5hZGQoJ1JlZ2lvbicsIHJlZ2lvbik7XG4gICAgICBjZGsuVGFncy5vZihnbG9iYWxUYWJsZSkuYWRkKCdJc1ByaW1hcnknLCBpc1ByaW1hcnkudG9TdHJpbmcoKSk7XG4gICAgICBjZGsuVGFncy5vZihnbG9iYWxUYWJsZSkuYWRkKCdHbG9iYWxUYWJsZScsICd0cnVlJyk7XG4gICAgfVxuXG4gICAgLy8gQWRkIHRhZ3MgZm9yIGNvc3QgYWxsb2NhdGlvbiBhbmQgZ292ZXJuYW5jZVxuICAgIGNkay5UYWdzLm9mKHRoaXMucHJvY2Vzc2VkRGF0YVRhYmxlKS5hZGQoJ0Vudmlyb25tZW50JywgZW52aXJvbm1lbnQpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMucHJvY2Vzc2VkRGF0YVRhYmxlKS5hZGQoJ1NlcnZpY2UnLCAnRGF0YVN0b3JhZ2UnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzLnByb2Nlc3NlZERhdGFUYWJsZSkuYWRkKCdSZWdpb24nLCByZWdpb24pO1xuICAgIGNkay5UYWdzLm9mKHRoaXMucHJvY2Vzc2VkRGF0YVRhYmxlKS5hZGQoJ0lzUHJpbWFyeScsIGlzUHJpbWFyeS50b1N0cmluZygpKTtcblxuICAgIC8vIE91dHB1dCB0aGUgdGFibGUgbmFtZSBhbmQgQVJOXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1Byb2Nlc3NlZERhdGFUYWJsZU5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5wcm9jZXNzZWREYXRhVGFibGUudGFibGVOYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdOYW1lIG9mIHRoZSBwcm9jZXNzZWQgZGF0YSBEeW5hbW9EQiB0YWJsZScsXG4gICAgICBleHBvcnROYW1lOiBgc2VydmVybGVzcy1wcm9jZXNzZWQtZGF0YS10YWJsZS1uYW1lLSR7cmVnaW9ufWAsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnUHJvY2Vzc2VkRGF0YVRhYmxlQXJuJywge1xuICAgICAgdmFsdWU6IHRoaXMucHJvY2Vzc2VkRGF0YVRhYmxlLnRhYmxlQXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdBUk4gb2YgdGhlIHByb2Nlc3NlZCBkYXRhIER5bmFtb0RCIHRhYmxlJyxcbiAgICAgIGV4cG9ydE5hbWU6IGBzZXJ2ZXJsZXNzLXByb2Nlc3NlZC1kYXRhLXRhYmxlLWFybi0ke3JlZ2lvbn1gLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1Byb2Nlc3NlZERhdGFUYWJsZVN0cmVhbUFybicsIHtcbiAgICAgIHZhbHVlOiB0aGlzLnByb2Nlc3NlZERhdGFUYWJsZS50YWJsZVN0cmVhbUFybiB8fCAnJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU3RyZWFtIEFSTiBvZiB0aGUgcHJvY2Vzc2VkIGRhdGEgRHluYW1vREIgdGFibGUnLFxuICAgICAgZXhwb3J0TmFtZTogYHNlcnZlcmxlc3MtcHJvY2Vzc2VkLWRhdGEtdGFibGUtc3RyZWFtLWFybi0ke3JlZ2lvbn1gLFxuICAgIH0pO1xuICB9XG59XG4iXX0=