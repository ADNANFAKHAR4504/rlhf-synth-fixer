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
exports.TapStack = void 0;
/**
 * tap-stack.ts
 *
 * Simplified version of the TapStack that uses AWS managed keys for S3 encryption
 * and removes the complexity of customer-managed KMS keys.
 */
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const api_gateway_stack_1 = require("./api-gateway-stack");
const cloudwatch_stack_1 = require("./cloudwatch-stack");
const lambda_stack_1 = require("./lambda-stack");
const networking_stack_1 = require("./networking-stack");
const s3_stack_1 = require("./s3-stack");
class TapStack extends pulumi.ComponentResource {
    vpcId;
    apiUrl;
    bucketName;
    lambdaFunctionName;
    // Networking outputs
    privateSubnetIds;
    publicSubnetIds;
    vpcSecurityGroupId;
    s3VpcEndpointId;
    vpcCidrBlock;
    // Lambda outputs
    lambdaFunctionUrl;
    lambdaFunctionArn;
    lambdaRoleArn;
    lambdaRoleName;
    // S3 outputs
    s3BucketArn;
    s3AccessLogsBucketName;
    s3AccessLogsBucketArn;
    // CloudWatch outputs
    lambdaLogGroupName;
    lambdaLogGroupArn;
    apiGatewayLogGroupName;
    apiGatewayLogGroupArn;
    // API Gateway outputs
    apiGatewayId;
    apiGatewayStageId;
    apiGatewayStageName;
    apiGatewayIntegrationId;
    apiGatewayMethodId;
    apiGatewayResourceId;
    // Environment and configuration
    region;
    environmentSuffix;
    tags;
    constructor(name, args, opts) {
        super('tap:stack:TapStack', name, opts);
        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = {
            Environment: environmentSuffix,
            Project: 'SecureDocumentAPI',
            ManagedBy: 'Pulumi',
            ...args.tags,
        };
        // Force AWS region to us-east-1 as per requirements
        const awsProvider = new aws.Provider('aws-us-east-1', {
            region: 'us-east-1',
        });
        // 1. Networking infrastructure
        const networking = new networking_stack_1.NetworkingStack('networking', {
            environmentSuffix,
            tags,
        }, { parent: this, provider: awsProvider });
        // 2. CloudWatch logging
        const cloudWatch = new cloudwatch_stack_1.CloudWatchStack('cloudwatch', {
            environmentSuffix,
            tags,
        }, { parent: this, provider: awsProvider });
        // 3. S3 bucket
        const s3 = new s3_stack_1.S3Stack('s3', {
            environmentSuffix,
            tags,
        }, { parent: this, provider: awsProvider });
        // 4. Lambda function with S3 bucket details
        const lambda = new lambda_stack_1.LambdaStack('lambda', {
            environmentSuffix,
            bucketArn: s3.bucket.arn,
            bucketName: s3.bucket.id,
            privateSubnetIds: networking.privateSubnets.map(subnet => subnet.id),
            vpcSecurityGroupId: networking.vpcSecurityGroup.id,
            logGroupArn: cloudWatch.lambdaLogGroup.arn,
            tags,
        }, {
            parent: this,
            dependsOn: [s3.bucket, cloudWatch.lambdaLogGroup],
            provider: awsProvider,
        });
        // 5. Update S3 bucket policy with real Lambda role
        s3.updateBucketPolicy(lambda.role.arn);
        // 6. API Gateway
        const apiGateway = new api_gateway_stack_1.ApiGatewayStack('api-gateway', {
            environmentSuffix,
            lambdaFunctionArn: lambda.function.arn,
            lambdaFunctionName: lambda.function.name,
            tags,
        }, { parent: this, dependsOn: [lambda.function], provider: awsProvider });
        // Expose outputs
        this.vpcId = networking.vpc.id;
        this.apiUrl = apiGateway.apiUrl;
        this.bucketName = s3.bucket.id;
        this.lambdaFunctionName = lambda.function.name;
        // Networking outputs
        this.privateSubnetIds = pulumi.all(networking.privateSubnets.map(subnet => subnet.id));
        this.publicSubnetIds = pulumi.all(networking.publicSubnets.map(subnet => subnet.id));
        this.vpcSecurityGroupId = networking.vpcSecurityGroup.id;
        this.s3VpcEndpointId = networking.s3VpcEndpoint.id;
        this.vpcCidrBlock = networking.vpc.cidrBlock;
        // Lambda outputs
        this.lambdaFunctionUrl = lambda.functionUrl.functionUrl;
        this.lambdaFunctionArn = lambda.function.arn;
        this.lambdaRoleArn = lambda.role.arn;
        this.lambdaRoleName = lambda.role.name;
        // S3 outputs
        this.s3BucketArn = s3.bucket.arn;
        this.s3AccessLogsBucketName = s3.accessLogsBucket.id;
        this.s3AccessLogsBucketArn = s3.accessLogsBucket.arn;
        // CloudWatch outputs
        this.lambdaLogGroupName = cloudWatch.lambdaLogGroup.name;
        this.lambdaLogGroupArn = cloudWatch.lambdaLogGroup.arn;
        this.apiGatewayLogGroupName = cloudWatch.apiGatewayLogGroup.name;
        this.apiGatewayLogGroupArn = cloudWatch.apiGatewayLogGroup.arn;
        // API Gateway outputs
        this.apiGatewayId = apiGateway.api.id;
        this.apiGatewayStageId = apiGateway.stage.id;
        this.apiGatewayStageName = apiGateway.stage.stageName;
        this.apiGatewayIntegrationId = apiGateway.integration.id;
        this.apiGatewayMethodId = apiGateway.method.id;
        this.apiGatewayResourceId = apiGateway.resource.id;
        // Environment and configuration
        this.region = 'us-east-1';
        this.environmentSuffix = environmentSuffix;
        this.tags = pulumi.output(tags);
        this.registerOutputs({
            // Core infrastructure outputs
            vpcId: this.vpcId,
            apiUrl: this.apiUrl,
            bucketName: this.bucketName,
            lambdaFunctionName: this.lambdaFunctionName,
            // Networking outputs
            privateSubnetIds: this.privateSubnetIds,
            publicSubnetIds: this.publicSubnetIds,
            vpcSecurityGroupId: this.vpcSecurityGroupId,
            s3VpcEndpointId: this.s3VpcEndpointId,
            vpcCidrBlock: this.vpcCidrBlock,
            // Lambda outputs
            lambdaFunctionUrl: this.lambdaFunctionUrl,
            lambdaFunctionArn: this.lambdaFunctionArn,
            lambdaRoleArn: this.lambdaRoleArn,
            lambdaRoleName: this.lambdaRoleName,
            // S3 outputs
            s3BucketArn: this.s3BucketArn,
            s3AccessLogsBucketName: this.s3AccessLogsBucketName,
            s3AccessLogsBucketArn: this.s3AccessLogsBucketArn,
            // CloudWatch outputs
            lambdaLogGroupName: this.lambdaLogGroupName,
            lambdaLogGroupArn: this.lambdaLogGroupArn,
            apiGatewayLogGroupName: this.apiGatewayLogGroupName,
            apiGatewayLogGroupArn: this.apiGatewayLogGroupArn,
            // API Gateway outputs
            apiGatewayId: this.apiGatewayId,
            apiGatewayStageId: this.apiGatewayStageId,
            apiGatewayStageName: this.apiGatewayStageName,
            apiGatewayIntegrationId: this.apiGatewayIntegrationId,
            apiGatewayMethodId: this.apiGatewayMethodId,
            apiGatewayResourceId: this.apiGatewayResourceId,
            // Environment and configuration
            region: this.region,
            environmentSuffix: this.environmentSuffix,
            // Tags for resource identification
            tags: this.tags,
        });
    }
}
exports.TapStack = TapStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7OztHQUtHO0FBQ0gsaURBQW1DO0FBQ25DLHVEQUF5QztBQUV6QywyREFBc0Q7QUFDdEQseURBQXFEO0FBQ3JELGlEQUE2QztBQUM3Qyx5REFBcUQ7QUFDckQseUNBQXFDO0FBT3JDLE1BQWEsUUFBUyxTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDcEMsS0FBSyxDQUF3QjtJQUM3QixNQUFNLENBQXdCO0lBQzlCLFVBQVUsQ0FBd0I7SUFDbEMsa0JBQWtCLENBQXdCO0lBQzFELHFCQUFxQjtJQUNMLGdCQUFnQixDQUEwQjtJQUMxQyxlQUFlLENBQTBCO0lBQ3pDLGtCQUFrQixDQUF3QjtJQUMxQyxlQUFlLENBQXdCO0lBQ3ZDLFlBQVksQ0FBd0I7SUFDcEQsaUJBQWlCO0lBQ0QsaUJBQWlCLENBQXdCO0lBQ3pDLGlCQUFpQixDQUF3QjtJQUN6QyxhQUFhLENBQXdCO0lBQ3JDLGNBQWMsQ0FBd0I7SUFDdEQsYUFBYTtJQUNHLFdBQVcsQ0FBd0I7SUFDbkMsc0JBQXNCLENBQXdCO0lBQzlDLHFCQUFxQixDQUF3QjtJQUM3RCxxQkFBcUI7SUFDTCxrQkFBa0IsQ0FBd0I7SUFDMUMsaUJBQWlCLENBQXdCO0lBQ3pDLHNCQUFzQixDQUF3QjtJQUM5QyxxQkFBcUIsQ0FBd0I7SUFDN0Qsc0JBQXNCO0lBQ04sWUFBWSxDQUF3QjtJQUNwQyxpQkFBaUIsQ0FBd0I7SUFDekMsbUJBQW1CLENBQXdCO0lBQzNDLHVCQUF1QixDQUF3QjtJQUMvQyxrQkFBa0IsQ0FBd0I7SUFDMUMsb0JBQW9CLENBQXdCO0lBQzVELGdDQUFnQztJQUNoQixNQUFNLENBQVM7SUFDZixpQkFBaUIsQ0FBUztJQUMxQixJQUFJLENBQTJDO0lBRS9ELFlBQVksSUFBWSxFQUFFLElBQWtC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LENBQUMsaUJBQWlCO1lBQ3pDLG1DQUFtQztZQUNuQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7U0FDaEIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBdk1ELDRCQXVNQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogdGFwLXN0YWNrLnRzXG4gKlxuICogU2ltcGxpZmllZCB2ZXJzaW9uIG9mIHRoZSBUYXBTdGFjayB0aGF0IHVzZXMgQVdTIG1hbmFnZWQga2V5cyBmb3IgUzMgZW5jcnlwdGlvblxuICogYW5kIHJlbW92ZXMgdGhlIGNvbXBsZXhpdHkgb2YgY3VzdG9tZXItbWFuYWdlZCBLTVMga2V5cy5cbiAqL1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBSZXNvdXJjZU9wdGlvbnMgfSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBBcGlHYXRld2F5U3RhY2sgfSBmcm9tICcuL2FwaS1nYXRld2F5LXN0YWNrJztcbmltcG9ydCB7IENsb3VkV2F0Y2hTdGFjayB9IGZyb20gJy4vY2xvdWR3YXRjaC1zdGFjayc7XG5pbXBvcnQgeyBMYW1iZGFTdGFjayB9IGZyb20gJy4vbGFtYmRhLXN0YWNrJztcbmltcG9ydCB7IE5ldHdvcmtpbmdTdGFjayB9IGZyb20gJy4vbmV0d29ya2luZy1zdGFjayc7XG5pbXBvcnQgeyBTM1N0YWNrIH0gZnJvbSAnLi9zMy1zdGFjayc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGFwU3RhY2tBcmdzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg/OiBzdHJpbmc7XG4gIHRhZ3M/OiBwdWx1bWkuSW5wdXQ8eyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT47XG59XG5cbmV4cG9ydCBjbGFzcyBUYXBTdGFjayBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSB2cGNJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgYXBpVXJsOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBidWNrZXROYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBsYW1iZGFGdW5jdGlvbk5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgLy8gTmV0d29ya2luZyBvdXRwdXRzXG4gIHB1YmxpYyByZWFkb25seSBwcml2YXRlU3VibmV0SWRzOiBwdWx1bWkuT3V0cHV0PHN0cmluZ1tdPjtcbiAgcHVibGljIHJlYWRvbmx5IHB1YmxpY1N1Ym5ldElkczogcHVsdW1pLk91dHB1dDxzdHJpbmdbXT47XG4gIHB1YmxpYyByZWFkb25seSB2cGNTZWN1cml0eUdyb3VwSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHMzVnBjRW5kcG9pbnRJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgdnBjQ2lkckJsb2NrOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIC8vIExhbWJkYSBvdXRwdXRzXG4gIHB1YmxpYyByZWFkb25seSBsYW1iZGFGdW5jdGlvblVybDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgbGFtYmRhRnVuY3Rpb25Bcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGxhbWJkYVJvbGVBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGxhbWJkYVJvbGVOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIC8vIFMzIG91dHB1dHNcbiAgcHVibGljIHJlYWRvbmx5IHMzQnVja2V0QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBzM0FjY2Vzc0xvZ3NCdWNrZXROYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBzM0FjY2Vzc0xvZ3NCdWNrZXRBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgLy8gQ2xvdWRXYXRjaCBvdXRwdXRzXG4gIHB1YmxpYyByZWFkb25seSBsYW1iZGFMb2dHcm91cE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGxhbWJkYUxvZ0dyb3VwQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBhcGlHYXRld2F5TG9nR3JvdXBOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBhcGlHYXRld2F5TG9nR3JvdXBBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgLy8gQVBJIEdhdGV3YXkgb3V0cHV0c1xuICBwdWJsaWMgcmVhZG9ubHkgYXBpR2F0ZXdheUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBhcGlHYXRld2F5U3RhZ2VJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgYXBpR2F0ZXdheVN0YWdlTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgYXBpR2F0ZXdheUludGVncmF0aW9uSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGFwaUdhdGV3YXlNZXRob2RJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgYXBpR2F0ZXdheVJlc291cmNlSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgLy8gRW52aXJvbm1lbnQgYW5kIGNvbmZpZ3VyYXRpb25cbiAgcHVibGljIHJlYWRvbmx5IHJlZ2lvbjogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgZW52aXJvbm1lbnRTdWZmaXg6IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IHRhZ3M6IHB1bHVtaS5PdXRwdXQ8eyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT47XG5cbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBUYXBTdGFja0FyZ3MsIG9wdHM/OiBSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICBzdXBlcigndGFwOnN0YWNrOlRhcFN0YWNrJywgbmFtZSwgb3B0cyk7XG5cbiAgICBjb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IGFyZ3MuZW52aXJvbm1lbnRTdWZmaXggfHwgJ2Rldic7XG4gICAgY29uc3QgdGFncyA9IHtcbiAgICAgIEVudmlyb25tZW50OiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgIFByb2plY3Q6ICdTZWN1cmVEb2N1bWVudEFQSScsXG4gICAgICBNYW5hZ2VkQnk6ICdQdWx1bWknLFxuICAgICAgLi4uYXJncy50YWdzLFxuICAgIH07XG5cbiAgICAvLyBGb3JjZSBBV1MgcmVnaW9uIHRvIHVzLWVhc3QtMSBhcyBwZXIgcmVxdWlyZW1lbnRzXG4gICAgY29uc3QgYXdzUHJvdmlkZXIgPSBuZXcgYXdzLlByb3ZpZGVyKCdhd3MtdXMtZWFzdC0xJywge1xuICAgICAgcmVnaW9uOiAndXMtZWFzdC0xJyxcbiAgICB9KTtcblxuICAgIC8vIDEuIE5ldHdvcmtpbmcgaW5mcmFzdHJ1Y3R1cmVcbiAgICBjb25zdCBuZXR3b3JraW5nID0gbmV3IE5ldHdvcmtpbmdTdGFjayhcbiAgICAgICduZXR3b3JraW5nJyxcbiAgICAgIHtcbiAgICAgICAgZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgIHRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBhd3NQcm92aWRlciB9XG4gICAgKTtcblxuICAgIC8vIDIuIENsb3VkV2F0Y2ggbG9nZ2luZ1xuICAgIGNvbnN0IGNsb3VkV2F0Y2ggPSBuZXcgQ2xvdWRXYXRjaFN0YWNrKFxuICAgICAgJ2Nsb3Vkd2F0Y2gnLFxuICAgICAge1xuICAgICAgICBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgdGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IGF3c1Byb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgLy8gMy4gUzMgYnVja2V0XG4gICAgY29uc3QgczMgPSBuZXcgUzNTdGFjayhcbiAgICAgICdzMycsXG4gICAgICB7XG4gICAgICAgIGVudmlyb25tZW50U3VmZml4LFxuICAgICAgICB0YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogYXdzUHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICAvLyA0LiBMYW1iZGEgZnVuY3Rpb24gd2l0aCBTMyBidWNrZXQgZGV0YWlsc1xuICAgIGNvbnN0IGxhbWJkYSA9IG5ldyBMYW1iZGFTdGFjayhcbiAgICAgICdsYW1iZGEnLFxuICAgICAge1xuICAgICAgICBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgYnVja2V0QXJuOiBzMy5idWNrZXQuYXJuLFxuICAgICAgICBidWNrZXROYW1lOiBzMy5idWNrZXQuaWQsXG4gICAgICAgIHByaXZhdGVTdWJuZXRJZHM6IG5ldHdvcmtpbmcucHJpdmF0ZVN1Ym5ldHMubWFwKHN1Ym5ldCA9PiBzdWJuZXQuaWQpLFxuICAgICAgICB2cGNTZWN1cml0eUdyb3VwSWQ6IG5ldHdvcmtpbmcudnBjU2VjdXJpdHlHcm91cC5pZCxcbiAgICAgICAgbG9nR3JvdXBBcm46IGNsb3VkV2F0Y2gubGFtYmRhTG9nR3JvdXAuYXJuLFxuICAgICAgICB0YWdzLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcGFyZW50OiB0aGlzLFxuICAgICAgICBkZXBlbmRzT246IFtzMy5idWNrZXQsIGNsb3VkV2F0Y2gubGFtYmRhTG9nR3JvdXBdLFxuICAgICAgICBwcm92aWRlcjogYXdzUHJvdmlkZXIsXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIDUuIFVwZGF0ZSBTMyBidWNrZXQgcG9saWN5IHdpdGggcmVhbCBMYW1iZGEgcm9sZVxuICAgIHMzLnVwZGF0ZUJ1Y2tldFBvbGljeShsYW1iZGEucm9sZS5hcm4pO1xuXG4gICAgLy8gNi4gQVBJIEdhdGV3YXlcbiAgICBjb25zdCBhcGlHYXRld2F5ID0gbmV3IEFwaUdhdGV3YXlTdGFjayhcbiAgICAgICdhcGktZ2F0ZXdheScsXG4gICAgICB7XG4gICAgICAgIGVudmlyb25tZW50U3VmZml4LFxuICAgICAgICBsYW1iZGFGdW5jdGlvbkFybjogbGFtYmRhLmZ1bmN0aW9uLmFybixcbiAgICAgICAgbGFtYmRhRnVuY3Rpb25OYW1lOiBsYW1iZGEuZnVuY3Rpb24ubmFtZSxcbiAgICAgICAgdGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgZGVwZW5kc09uOiBbbGFtYmRhLmZ1bmN0aW9uXSwgcHJvdmlkZXI6IGF3c1Byb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgLy8gRXhwb3NlIG91dHB1dHNcbiAgICB0aGlzLnZwY0lkID0gbmV0d29ya2luZy52cGMuaWQ7XG4gICAgdGhpcy5hcGlVcmwgPSBhcGlHYXRld2F5LmFwaVVybDtcbiAgICB0aGlzLmJ1Y2tldE5hbWUgPSBzMy5idWNrZXQuaWQ7XG4gICAgdGhpcy5sYW1iZGFGdW5jdGlvbk5hbWUgPSBsYW1iZGEuZnVuY3Rpb24ubmFtZTtcblxuICAgIC8vIE5ldHdvcmtpbmcgb3V0cHV0c1xuICAgIHRoaXMucHJpdmF0ZVN1Ym5ldElkcyA9IHB1bHVtaS5hbGwoXG4gICAgICBuZXR3b3JraW5nLnByaXZhdGVTdWJuZXRzLm1hcChzdWJuZXQgPT4gc3VibmV0LmlkKVxuICAgICk7XG4gICAgdGhpcy5wdWJsaWNTdWJuZXRJZHMgPSBwdWx1bWkuYWxsKFxuICAgICAgbmV0d29ya2luZy5wdWJsaWNTdWJuZXRzLm1hcChzdWJuZXQgPT4gc3VibmV0LmlkKVxuICAgICk7XG4gICAgdGhpcy52cGNTZWN1cml0eUdyb3VwSWQgPSBuZXR3b3JraW5nLnZwY1NlY3VyaXR5R3JvdXAuaWQ7XG4gICAgdGhpcy5zM1ZwY0VuZHBvaW50SWQgPSBuZXR3b3JraW5nLnMzVnBjRW5kcG9pbnQuaWQ7XG4gICAgdGhpcy52cGNDaWRyQmxvY2sgPSBuZXR3b3JraW5nLnZwYy5jaWRyQmxvY2s7XG4gICAgLy8gTGFtYmRhIG91dHB1dHNcbiAgICB0aGlzLmxhbWJkYUZ1bmN0aW9uVXJsID0gbGFtYmRhLmZ1bmN0aW9uVXJsLmZ1bmN0aW9uVXJsO1xuICAgIHRoaXMubGFtYmRhRnVuY3Rpb25Bcm4gPSBsYW1iZGEuZnVuY3Rpb24uYXJuO1xuICAgIHRoaXMubGFtYmRhUm9sZUFybiA9IGxhbWJkYS5yb2xlLmFybjtcbiAgICB0aGlzLmxhbWJkYVJvbGVOYW1lID0gbGFtYmRhLnJvbGUubmFtZTtcbiAgICAvLyBTMyBvdXRwdXRzXG4gICAgdGhpcy5zM0J1Y2tldEFybiA9IHMzLmJ1Y2tldC5hcm47XG4gICAgdGhpcy5zM0FjY2Vzc0xvZ3NCdWNrZXROYW1lID0gczMuYWNjZXNzTG9nc0J1Y2tldC5pZDtcbiAgICB0aGlzLnMzQWNjZXNzTG9nc0J1Y2tldEFybiA9IHMzLmFjY2Vzc0xvZ3NCdWNrZXQuYXJuO1xuICAgIC8vIENsb3VkV2F0Y2ggb3V0cHV0c1xuICAgIHRoaXMubGFtYmRhTG9nR3JvdXBOYW1lID0gY2xvdWRXYXRjaC5sYW1iZGFMb2dHcm91cC5uYW1lO1xuICAgIHRoaXMubGFtYmRhTG9nR3JvdXBBcm4gPSBjbG91ZFdhdGNoLmxhbWJkYUxvZ0dyb3VwLmFybjtcbiAgICB0aGlzLmFwaUdhdGV3YXlMb2dHcm91cE5hbWUgPSBjbG91ZFdhdGNoLmFwaUdhdGV3YXlMb2dHcm91cC5uYW1lO1xuICAgIHRoaXMuYXBpR2F0ZXdheUxvZ0dyb3VwQXJuID0gY2xvdWRXYXRjaC5hcGlHYXRld2F5TG9nR3JvdXAuYXJuO1xuICAgIC8vIEFQSSBHYXRld2F5IG91dHB1dHNcbiAgICB0aGlzLmFwaUdhdGV3YXlJZCA9IGFwaUdhdGV3YXkuYXBpLmlkO1xuICAgIHRoaXMuYXBpR2F0ZXdheVN0YWdlSWQgPSBhcGlHYXRld2F5LnN0YWdlLmlkO1xuICAgIHRoaXMuYXBpR2F0ZXdheVN0YWdlTmFtZSA9IGFwaUdhdGV3YXkuc3RhZ2Uuc3RhZ2VOYW1lO1xuICAgIHRoaXMuYXBpR2F0ZXdheUludGVncmF0aW9uSWQgPSBhcGlHYXRld2F5LmludGVncmF0aW9uLmlkO1xuICAgIHRoaXMuYXBpR2F0ZXdheU1ldGhvZElkID0gYXBpR2F0ZXdheS5tZXRob2QuaWQ7XG4gICAgdGhpcy5hcGlHYXRld2F5UmVzb3VyY2VJZCA9IGFwaUdhdGV3YXkucmVzb3VyY2UuaWQ7XG4gICAgLy8gRW52aXJvbm1lbnQgYW5kIGNvbmZpZ3VyYXRpb25cbiAgICB0aGlzLnJlZ2lvbiA9ICd1cy1lYXN0LTEnO1xuICAgIHRoaXMuZW52aXJvbm1lbnRTdWZmaXggPSBlbnZpcm9ubWVudFN1ZmZpeDtcbiAgICB0aGlzLnRhZ3MgPSBwdWx1bWkub3V0cHV0KHRhZ3MpO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgLy8gQ29yZSBpbmZyYXN0cnVjdHVyZSBvdXRwdXRzXG4gICAgICB2cGNJZDogdGhpcy52cGNJZCxcbiAgICAgIGFwaVVybDogdGhpcy5hcGlVcmwsXG4gICAgICBidWNrZXROYW1lOiB0aGlzLmJ1Y2tldE5hbWUsXG4gICAgICBsYW1iZGFGdW5jdGlvbk5hbWU6IHRoaXMubGFtYmRhRnVuY3Rpb25OYW1lLFxuICAgICAgLy8gTmV0d29ya2luZyBvdXRwdXRzXG4gICAgICBwcml2YXRlU3VibmV0SWRzOiB0aGlzLnByaXZhdGVTdWJuZXRJZHMsXG4gICAgICBwdWJsaWNTdWJuZXRJZHM6IHRoaXMucHVibGljU3VibmV0SWRzLFxuICAgICAgdnBjU2VjdXJpdHlHcm91cElkOiB0aGlzLnZwY1NlY3VyaXR5R3JvdXBJZCxcbiAgICAgIHMzVnBjRW5kcG9pbnRJZDogdGhpcy5zM1ZwY0VuZHBvaW50SWQsXG4gICAgICB2cGNDaWRyQmxvY2s6IHRoaXMudnBjQ2lkckJsb2NrLFxuICAgICAgLy8gTGFtYmRhIG91dHB1dHNcbiAgICAgIGxhbWJkYUZ1bmN0aW9uVXJsOiB0aGlzLmxhbWJkYUZ1bmN0aW9uVXJsLFxuICAgICAgbGFtYmRhRnVuY3Rpb25Bcm46IHRoaXMubGFtYmRhRnVuY3Rpb25Bcm4sXG4gICAgICBsYW1iZGFSb2xlQXJuOiB0aGlzLmxhbWJkYVJvbGVBcm4sXG4gICAgICBsYW1iZGFSb2xlTmFtZTogdGhpcy5sYW1iZGFSb2xlTmFtZSxcbiAgICAgIC8vIFMzIG91dHB1dHNcbiAgICAgIHMzQnVja2V0QXJuOiB0aGlzLnMzQnVja2V0QXJuLFxuICAgICAgczNBY2Nlc3NMb2dzQnVja2V0TmFtZTogdGhpcy5zM0FjY2Vzc0xvZ3NCdWNrZXROYW1lLFxuICAgICAgczNBY2Nlc3NMb2dzQnVja2V0QXJuOiB0aGlzLnMzQWNjZXNzTG9nc0J1Y2tldEFybixcbiAgICAgIC8vIENsb3VkV2F0Y2ggb3V0cHV0c1xuICAgICAgbGFtYmRhTG9nR3JvdXBOYW1lOiB0aGlzLmxhbWJkYUxvZ0dyb3VwTmFtZSxcbiAgICAgIGxhbWJkYUxvZ0dyb3VwQXJuOiB0aGlzLmxhbWJkYUxvZ0dyb3VwQXJuLFxuICAgICAgYXBpR2F0ZXdheUxvZ0dyb3VwTmFtZTogdGhpcy5hcGlHYXRld2F5TG9nR3JvdXBOYW1lLFxuICAgICAgYXBpR2F0ZXdheUxvZ0dyb3VwQXJuOiB0aGlzLmFwaUdhdGV3YXlMb2dHcm91cEFybixcbiAgICAgIC8vIEFQSSBHYXRld2F5IG91dHB1dHNcbiAgICAgIGFwaUdhdGV3YXlJZDogdGhpcy5hcGlHYXRld2F5SWQsXG4gICAgICBhcGlHYXRld2F5U3RhZ2VJZDogdGhpcy5hcGlHYXRld2F5U3RhZ2VJZCxcbiAgICAgIGFwaUdhdGV3YXlTdGFnZU5hbWU6IHRoaXMuYXBpR2F0ZXdheVN0YWdlTmFtZSxcbiAgICAgIGFwaUdhdGV3YXlJbnRlZ3JhdGlvbklkOiB0aGlzLmFwaUdhdGV3YXlJbnRlZ3JhdGlvbklkLFxuICAgICAgYXBpR2F0ZXdheU1ldGhvZElkOiB0aGlzLmFwaUdhdGV3YXlNZXRob2RJZCxcbiAgICAgIGFwaUdhdGV3YXlSZXNvdXJjZUlkOiB0aGlzLmFwaUdhdGV3YXlSZXNvdXJjZUlkLFxuICAgICAgLy8gRW52aXJvbm1lbnQgYW5kIGNvbmZpZ3VyYXRpb25cbiAgICAgIHJlZ2lvbjogdGhpcy5yZWdpb24sXG4gICAgICBlbnZpcm9ubWVudFN1ZmZpeDogdGhpcy5lbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgIC8vIFRhZ3MgZm9yIHJlc291cmNlIGlkZW50aWZpY2F0aW9uXG4gICAgICB0YWdzOiB0aGlzLnRhZ3MsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==