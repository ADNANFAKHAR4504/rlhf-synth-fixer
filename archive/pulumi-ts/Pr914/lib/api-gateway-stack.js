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
exports.ApiGatewayStack = void 0;
/**
 * api-gateway-stack.ts
 *
 * This module defines the REST API Gateway with secure integration to Lambda function.
 * Implements private integration, logging, and security best practices.
 */
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
class ApiGatewayStack extends pulumi.ComponentResource {
    api;
    stage;
    integration;
    method;
    resource;
    apiUrl;
    constructor(name, args, opts) {
        super('tap:apigateway:ApiGatewayStack', name, args, opts);
        const { environmentSuffix, lambdaFunctionArn, lambdaFunctionName, tags } = args;
        this.api = new aws.apigateway.RestApi(`secure-doc-api-${environmentSuffix}`, {
            name: `secure-doc-api-${environmentSuffix}`,
            description: `Secure Document Processing API - ${environmentSuffix}`,
            endpointConfiguration: {
                types: 'REGIONAL',
            },
            tags: {
                Name: `secure-doc-api-${environmentSuffix}`,
                Purpose: 'Secure document processing API',
                ...tags,
            },
        }, { parent: this });
        // Create the /documents resource
        this.resource = new aws.apigateway.Resource(`documents-resource-${environmentSuffix}`, {
            restApi: this.api.id,
            parentId: this.api.rootResourceId,
            pathPart: 'documents',
        }, { parent: this });
        // Create the Lambda integration
        this.integration = new aws.apigateway.Integration(`lambda-integration-${environmentSuffix}`, {
            restApi: this.api.id,
            resourceId: this.resource.id,
            httpMethod: 'POST',
            type: 'AWS_PROXY',
            integrationHttpMethod: 'POST',
            uri: pulumi.interpolate `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${lambdaFunctionArn}/invocations`,
            timeoutMilliseconds: 29000,
        }, { parent: this });
        // Create the POST method
        this.method = new aws.apigateway.Method(`post-documents-method-${environmentSuffix}`, {
            restApi: this.api.id,
            resourceId: this.resource.id,
            httpMethod: 'POST',
            authorization: 'NONE',
            requestParameters: {
                'method.request.header.Content-Type': true,
                'method.request.header.x-request-id': false,
            },
        }, { parent: this });
        // Create Lambda permission
        const lambdaPermission = new aws.lambda.Permission(`api-gateway-invoke-${environmentSuffix}`, {
            action: 'lambda:InvokeFunction',
            function: lambdaFunctionName,
            principal: 'apigateway.amazonaws.com',
            sourceArn: pulumi.interpolate `${this.api.executionArn}/*/*`,
        }, { parent: this });
        // Create deployment
        const deployment = new aws.apigateway.Deployment(`deployment-${environmentSuffix}`, {
            restApi: this.api.id,
            description: `Deployment for ${environmentSuffix}`,
        }, {
            parent: this,
            dependsOn: [this.method, this.integration, lambdaPermission],
        });
        // Create the stage
        this.stage = new aws.apigateway.Stage(`default-stage-${environmentSuffix}`, {
            restApi: this.api.id,
            stageName: 'dev',
            deployment: deployment.id,
            description: `Default stage for secure document API - ${environmentSuffix}`,
            // Note: Access logging requires CloudWatch Logs role to be configured in AWS account
            // If you get "CloudWatch Logs role ARN must be set in account settings" error,
            // you need to configure the role first or remove this section temporarily
            // accessLogSettings: {
            //   destinationArn: apiGatewayLogGroupArn,
            //   format: JSON.stringify({
            //     requestId: '$context.requestId',
            //     requestTime: '$context.requestTime',
            //     httpMethod: '$context.httpMethod',
            //     path: '$context.path',
            //     status: '$context.status',
            //     responseLength: '$context.responseLength',
            //     userAgent: '$context.identity.userAgent',
            //     sourceIp: '$context.identity.sourceIp',
            //     protocol: '$context.protocol',
            //     error: {
            //       message: '$context.error.message',
            //       messageString: '$context.error.messageString',
            //     },
            //     integration: {
            //       error: '$context.integration.error',
            //       latency: '$context.integration.latency',
            //       requestId: '$context.integration.requestId',
            //       status: '$context.integration.status',
            //     },
            //   }),
            // },
            tags: {
                Name: `default-stage-${environmentSuffix}`,
                Purpose: 'API Gateway default stage',
                ...tags,
            },
        }, {
            parent: this,
            dependsOn: [deployment],
        });
        // Construct the API URL
        this.apiUrl = pulumi
            .all([this.api.id, this.stage.stageName])
            .apply(([apiId, stageName]) => {
            const region = 'us-east-1'; // Hardcoded as per requirements
            return `https://${apiId}.execute-api.${region}.amazonaws.com/${stageName}`;
        });
        this.registerOutputs({
            apiId: this.api.id,
            apiArn: this.api.arn,
            apiUrl: this.apiUrl,
            stageId: this.stage.id,
            stageName: this.stage.stageName,
            integrationId: this.integration.id,
            methodId: this.method.id,
            resourceId: this.resource.id,
            executionArn: this.api.executionArn,
        });
    }
}
exports.ApiGatewayStack = ApiGatewayStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLWdhdGV3YXktc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhcGktZ2F0ZXdheS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7R0FLRztBQUNILGlEQUFtQztBQUNuQyx1REFBeUM7QUFVekMsTUFBYSxlQUFnQixTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDM0MsR0FBRyxDQUF5QjtJQUM1QixLQUFLLENBQXVCO0lBQzVCLFdBQVcsQ0FBNkI7SUFDeEMsTUFBTSxDQUF3QjtJQUM5QixRQUFRLENBQTBCO0lBQ2xDLE1BQU0sQ0FBd0I7SUFFOUMsWUFBWSxJQUFZLEVBQUUsSUFBeUIsRUFBRSxJQUFzQjtRQUN6RSxLQUFLLENBQUMsZ0NBQWdDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUUxRCxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsaUJBQWlCLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLEdBQ3RFLElBQUksQ0FBQztRQUVQLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FDbkMsa0JBQWtCLGlCQUFpQixFQUFFLEVBQ3JDO1lBQ0UsSUFBSSxFQUFFLGtCQUFrQixpQkFBaUIsRUFBRTtZQUMzQyxXQUFXLEVBQUUsb0NBQW9DLGlCQUFpQixFQUFFO1lBQ3BFLHFCQUFxQixFQUFFO2dCQUNyQixLQUFLLEVBQUUsVUFBVTthQUNsQjtZQUNELElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUUsa0JBQWtCLGlCQUFpQixFQUFFO2dCQUMzQyxPQUFPLEVBQUUsZ0NBQWdDO2dCQUN6QyxHQUFHLElBQUk7YUFDUjtTQUNGLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixpQ0FBaUM7UUFDakMsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLEdB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QUN0QixTQUFTLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTO1lBQy9CLGFBQWEsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDbEMsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUN4QixVQUFVLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQzVCLFlBQVksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVk7U0FDcEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBcktELDBDQXFLQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogYXBpLWdhdGV3YXktc3RhY2sudHNcbiAqXG4gKiBUaGlzIG1vZHVsZSBkZWZpbmVzIHRoZSBSRVNUIEFQSSBHYXRld2F5IHdpdGggc2VjdXJlIGludGVncmF0aW9uIHRvIExhbWJkYSBmdW5jdGlvbi5cbiAqIEltcGxlbWVudHMgcHJpdmF0ZSBpbnRlZ3JhdGlvbiwgbG9nZ2luZywgYW5kIHNlY3VyaXR5IGJlc3QgcHJhY3RpY2VzLlxuICovXG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IFJlc291cmNlT3B0aW9ucyB9IGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcblxuZXhwb3J0IGludGVyZmFjZSBBcGlHYXRld2F5U3RhY2tBcmdzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg6IHN0cmluZztcbiAgbGFtYmRhRnVuY3Rpb25Bcm46IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBsYW1iZGFGdW5jdGlvbk5hbWU6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICB0YWdzPzogcHVsdW1pLklucHV0PHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+O1xufVxuXG5leHBvcnQgY2xhc3MgQXBpR2F0ZXdheVN0YWNrIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGFwaTogYXdzLmFwaWdhdGV3YXkuUmVzdEFwaTtcbiAgcHVibGljIHJlYWRvbmx5IHN0YWdlOiBhd3MuYXBpZ2F0ZXdheS5TdGFnZTtcbiAgcHVibGljIHJlYWRvbmx5IGludGVncmF0aW9uOiBhd3MuYXBpZ2F0ZXdheS5JbnRlZ3JhdGlvbjtcbiAgcHVibGljIHJlYWRvbmx5IG1ldGhvZDogYXdzLmFwaWdhdGV3YXkuTWV0aG9kO1xuICBwdWJsaWMgcmVhZG9ubHkgcmVzb3VyY2U6IGF3cy5hcGlnYXRld2F5LlJlc291cmNlO1xuICBwdWJsaWMgcmVhZG9ubHkgYXBpVXJsOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBBcGlHYXRld2F5U3RhY2tBcmdzLCBvcHRzPzogUmVzb3VyY2VPcHRpb25zKSB7XG4gICAgc3VwZXIoJ3RhcDphcGlnYXRld2F5OkFwaUdhdGV3YXlTdGFjaycsIG5hbWUsIGFyZ3MsIG9wdHMpO1xuXG4gICAgY29uc3QgeyBlbnZpcm9ubWVudFN1ZmZpeCwgbGFtYmRhRnVuY3Rpb25Bcm4sIGxhbWJkYUZ1bmN0aW9uTmFtZSwgdGFncyB9ID1cbiAgICAgIGFyZ3M7XG5cbiAgICB0aGlzLmFwaSA9IG5ldyBhd3MuYXBpZ2F0ZXdheS5SZXN0QXBpKFxuICAgICAgYHNlY3VyZS1kb2MtYXBpLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHNlY3VyZS1kb2MtYXBpLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgZGVzY3JpcHRpb246IGBTZWN1cmUgRG9jdW1lbnQgUHJvY2Vzc2luZyBBUEkgLSAke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGVuZHBvaW50Q29uZmlndXJhdGlvbjoge1xuICAgICAgICAgIHR5cGVzOiAnUkVHSU9OQUwnLFxuICAgICAgICB9LFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgTmFtZTogYHNlY3VyZS1kb2MtYXBpLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBQdXJwb3NlOiAnU2VjdXJlIGRvY3VtZW50IHByb2Nlc3NpbmcgQVBJJyxcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSAvZG9jdW1lbnRzIHJlc291cmNlXG4gICAgdGhpcy5yZXNvdXJjZSA9IG5ldyBhd3MuYXBpZ2F0ZXdheS5SZXNvdXJjZShcbiAgICAgIGBkb2N1bWVudHMtcmVzb3VyY2UtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICByZXN0QXBpOiB0aGlzLmFwaS5pZCxcbiAgICAgICAgcGFyZW50SWQ6IHRoaXMuYXBpLnJvb3RSZXNvdXJjZUlkLFxuICAgICAgICBwYXRoUGFydDogJ2RvY3VtZW50cycsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgdGhlIExhbWJkYSBpbnRlZ3JhdGlvblxuICAgIHRoaXMuaW50ZWdyYXRpb24gPSBuZXcgYXdzLmFwaWdhdGV3YXkuSW50ZWdyYXRpb24oXG4gICAgICBgbGFtYmRhLWludGVncmF0aW9uLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgcmVzdEFwaTogdGhpcy5hcGkuaWQsXG4gICAgICAgIHJlc291cmNlSWQ6IHRoaXMucmVzb3VyY2UuaWQsXG4gICAgICAgIGh0dHBNZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgdHlwZTogJ0FXU19QUk9YWScsXG4gICAgICAgIGludGVncmF0aW9uSHR0cE1ldGhvZDogJ1BPU1QnLFxuICAgICAgICB1cmk6IHB1bHVtaS5pbnRlcnBvbGF0ZWBhcm46YXdzOmFwaWdhdGV3YXk6dXMtZWFzdC0xOmxhbWJkYTpwYXRoLzIwMTUtMDMtMzEvZnVuY3Rpb25zLyR7bGFtYmRhRnVuY3Rpb25Bcm59L2ludm9jYXRpb25zYCxcbiAgICAgICAgdGltZW91dE1pbGxpc2Vjb25kczogMjkwMDAsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgdGhlIFBPU1QgbWV0aG9kXG4gICAgdGhpcy5tZXRob2QgPSBuZXcgYXdzLmFwaWdhdGV3YXkuTWV0aG9kKFxuICAgICAgYHBvc3QtZG9jdW1lbnRzLW1ldGhvZC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHJlc3RBcGk6IHRoaXMuYXBpLmlkLFxuICAgICAgICByZXNvdXJjZUlkOiB0aGlzLnJlc291cmNlLmlkLFxuICAgICAgICBodHRwTWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGF1dGhvcml6YXRpb246ICdOT05FJyxcbiAgICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAnbWV0aG9kLnJlcXVlc3QuaGVhZGVyLkNvbnRlbnQtVHlwZSc6IHRydWUsXG4gICAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LmhlYWRlci54LXJlcXVlc3QtaWQnOiBmYWxzZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBMYW1iZGEgcGVybWlzc2lvblxuICAgIGNvbnN0IGxhbWJkYVBlcm1pc3Npb24gPSBuZXcgYXdzLmxhbWJkYS5QZXJtaXNzaW9uKFxuICAgICAgYGFwaS1nYXRld2F5LWludm9rZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGFjdGlvbjogJ2xhbWJkYTpJbnZva2VGdW5jdGlvbicsXG4gICAgICAgIGZ1bmN0aW9uOiBsYW1iZGFGdW5jdGlvbk5hbWUsXG4gICAgICAgIHByaW5jaXBhbDogJ2FwaWdhdGV3YXkuYW1hem9uYXdzLmNvbScsXG4gICAgICAgIHNvdXJjZUFybjogcHVsdW1pLmludGVycG9sYXRlYCR7dGhpcy5hcGkuZXhlY3V0aW9uQXJufS8qLypgLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIGRlcGxveW1lbnRcbiAgICBjb25zdCBkZXBsb3ltZW50ID0gbmV3IGF3cy5hcGlnYXRld2F5LkRlcGxveW1lbnQoXG4gICAgICBgZGVwbG95bWVudC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHJlc3RBcGk6IHRoaXMuYXBpLmlkLFxuICAgICAgICBkZXNjcmlwdGlvbjogYERlcGxveW1lbnQgZm9yICR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHBhcmVudDogdGhpcyxcbiAgICAgICAgZGVwZW5kc09uOiBbdGhpcy5tZXRob2QsIHRoaXMuaW50ZWdyYXRpb24sIGxhbWJkYVBlcm1pc3Npb25dLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgdGhlIHN0YWdlXG4gICAgdGhpcy5zdGFnZSA9IG5ldyBhd3MuYXBpZ2F0ZXdheS5TdGFnZShcbiAgICAgIGBkZWZhdWx0LXN0YWdlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgcmVzdEFwaTogdGhpcy5hcGkuaWQsXG4gICAgICAgIHN0YWdlTmFtZTogJ2RldicsXG4gICAgICAgIGRlcGxveW1lbnQ6IGRlcGxveW1lbnQuaWQsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBgRGVmYXVsdCBzdGFnZSBmb3Igc2VjdXJlIGRvY3VtZW50IEFQSSAtICR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgLy8gTm90ZTogQWNjZXNzIGxvZ2dpbmcgcmVxdWlyZXMgQ2xvdWRXYXRjaCBMb2dzIHJvbGUgdG8gYmUgY29uZmlndXJlZCBpbiBBV1MgYWNjb3VudFxuICAgICAgICAvLyBJZiB5b3UgZ2V0IFwiQ2xvdWRXYXRjaCBMb2dzIHJvbGUgQVJOIG11c3QgYmUgc2V0IGluIGFjY291bnQgc2V0dGluZ3NcIiBlcnJvcixcbiAgICAgICAgLy8geW91IG5lZWQgdG8gY29uZmlndXJlIHRoZSByb2xlIGZpcnN0IG9yIHJlbW92ZSB0aGlzIHNlY3Rpb24gdGVtcG9yYXJpbHlcbiAgICAgICAgLy8gYWNjZXNzTG9nU2V0dGluZ3M6IHtcbiAgICAgICAgLy8gICBkZXN0aW5hdGlvbkFybjogYXBpR2F0ZXdheUxvZ0dyb3VwQXJuLFxuICAgICAgICAvLyAgIGZvcm1hdDogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAvLyAgICAgcmVxdWVzdElkOiAnJGNvbnRleHQucmVxdWVzdElkJyxcbiAgICAgICAgLy8gICAgIHJlcXVlc3RUaW1lOiAnJGNvbnRleHQucmVxdWVzdFRpbWUnLFxuICAgICAgICAvLyAgICAgaHR0cE1ldGhvZDogJyRjb250ZXh0Lmh0dHBNZXRob2QnLFxuICAgICAgICAvLyAgICAgcGF0aDogJyRjb250ZXh0LnBhdGgnLFxuICAgICAgICAvLyAgICAgc3RhdHVzOiAnJGNvbnRleHQuc3RhdHVzJyxcbiAgICAgICAgLy8gICAgIHJlc3BvbnNlTGVuZ3RoOiAnJGNvbnRleHQucmVzcG9uc2VMZW5ndGgnLFxuICAgICAgICAvLyAgICAgdXNlckFnZW50OiAnJGNvbnRleHQuaWRlbnRpdHkudXNlckFnZW50JyxcbiAgICAgICAgLy8gICAgIHNvdXJjZUlwOiAnJGNvbnRleHQuaWRlbnRpdHkuc291cmNlSXAnLFxuICAgICAgICAvLyAgICAgcHJvdG9jb2w6ICckY29udGV4dC5wcm90b2NvbCcsXG4gICAgICAgIC8vICAgICBlcnJvcjoge1xuICAgICAgICAvLyAgICAgICBtZXNzYWdlOiAnJGNvbnRleHQuZXJyb3IubWVzc2FnZScsXG4gICAgICAgIC8vICAgICAgIG1lc3NhZ2VTdHJpbmc6ICckY29udGV4dC5lcnJvci5tZXNzYWdlU3RyaW5nJyxcbiAgICAgICAgLy8gICAgIH0sXG4gICAgICAgIC8vICAgICBpbnRlZ3JhdGlvbjoge1xuICAgICAgICAvLyAgICAgICBlcnJvcjogJyRjb250ZXh0LmludGVncmF0aW9uLmVycm9yJyxcbiAgICAgICAgLy8gICAgICAgbGF0ZW5jeTogJyRjb250ZXh0LmludGVncmF0aW9uLmxhdGVuY3knLFxuICAgICAgICAvLyAgICAgICByZXF1ZXN0SWQ6ICckY29udGV4dC5pbnRlZ3JhdGlvbi5yZXF1ZXN0SWQnLFxuICAgICAgICAvLyAgICAgICBzdGF0dXM6ICckY29udGV4dC5pbnRlZ3JhdGlvbi5zdGF0dXMnLFxuICAgICAgICAvLyAgICAgfSxcbiAgICAgICAgLy8gICB9KSxcbiAgICAgICAgLy8gfSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGBkZWZhdWx0LXN0YWdlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBQdXJwb3NlOiAnQVBJIEdhdGV3YXkgZGVmYXVsdCBzdGFnZScsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHBhcmVudDogdGhpcyxcbiAgICAgICAgZGVwZW5kc09uOiBbZGVwbG95bWVudF0sXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIENvbnN0cnVjdCB0aGUgQVBJIFVSTFxuICAgIHRoaXMuYXBpVXJsID0gcHVsdW1pXG4gICAgICAuYWxsKFt0aGlzLmFwaS5pZCwgdGhpcy5zdGFnZS5zdGFnZU5hbWVdKVxuICAgICAgLmFwcGx5KChbYXBpSWQsIHN0YWdlTmFtZV0pID0+IHtcbiAgICAgICAgY29uc3QgcmVnaW9uID0gJ3VzLWVhc3QtMSc7IC8vIEhhcmRjb2RlZCBhcyBwZXIgcmVxdWlyZW1lbnRzXG4gICAgICAgIHJldHVybiBgaHR0cHM6Ly8ke2FwaUlkfS5leGVjdXRlLWFwaS4ke3JlZ2lvbn0uYW1hem9uYXdzLmNvbS8ke3N0YWdlTmFtZX1gO1xuICAgICAgfSk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBhcGlJZDogdGhpcy5hcGkuaWQsXG4gICAgICBhcGlBcm46IHRoaXMuYXBpLmFybixcbiAgICAgIGFwaVVybDogdGhpcy5hcGlVcmwsXG4gICAgICBzdGFnZUlkOiB0aGlzLnN0YWdlLmlkLFxuICAgICAgc3RhZ2VOYW1lOiB0aGlzLnN0YWdlLnN0YWdlTmFtZSxcbiAgICAgIGludGVncmF0aW9uSWQ6IHRoaXMuaW50ZWdyYXRpb24uaWQsXG4gICAgICBtZXRob2RJZDogdGhpcy5tZXRob2QuaWQsXG4gICAgICByZXNvdXJjZUlkOiB0aGlzLnJlc291cmNlLmlkLFxuICAgICAgZXhlY3V0aW9uQXJuOiB0aGlzLmFwaS5leGVjdXRpb25Bcm4sXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==