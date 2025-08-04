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
exports.ApiStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const constructs_1 = require("constructs");
class ApiStack extends constructs_1.Construct {
    api;
    apiKey;
    usagePlan;
    constructor(scope, id, props) {
        super(scope, id);
        // API Gateway with Lambda Authorizer
        this.api = new apigateway.RestApi(this, 'ProdDocumentApi', {
            description: 'Serverless document processing API with Lambda authorizer',
            endpointConfiguration: {
                types: [apigateway.EndpointType.REGIONAL],
            },
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: [
                    'Content-Type',
                    'X-Amz-Date',
                    'Authorization',
                    'X-Api-Key',
                ],
            },
        });
        // Lambda Authorizer for API Gateway
        const authorizer = new apigateway.RequestAuthorizer(this, 'ProdApiAuthorizer', {
            handler: props.authorizerFunction,
            identitySources: [apigateway.IdentitySource.header('X-Api-Key')],
            resultsCacheTtl: cdk.Duration.seconds(0),
        });
        // API Gateway Integration
        const apiIntegration = new apigateway.LambdaIntegration(props.apiHandlerFunction, {
            proxy: true,
            allowTestInvoke: false,
        });
        // API Routes
        const documentsResource = this.api.root.addResource('documents');
        documentsResource.addMethod('POST', apiIntegration, {
            authorizer,
            apiKeyRequired: false,
        });
        documentsResource.addMethod('GET', apiIntegration, {
            authorizer,
            apiKeyRequired: false,
        });
        const documentResource = documentsResource.addResource('{documentId}');
        documentResource.addMethod('GET', apiIntegration, {
            authorizer,
            apiKeyRequired: false,
        });
        // API Key and Usage Plan
        this.apiKey = this.api.addApiKey('ProdApiKey', {
            description: 'API key for document processing system',
        });
        this.usagePlan = this.api.addUsagePlan('ProdUsagePlan', {
            description: 'Usage plan for document processing API',
            throttle: {
                rateLimit: 100,
                burstLimit: 200,
            },
            quota: {
                limit: 10000,
                period: apigateway.Period.MONTH,
            },
        });
        this.usagePlan.addApiKey(this.apiKey);
        this.usagePlan.addApiStage({
            stage: this.api.deploymentStage,
        });
    }
}
exports.ApiStack = ApiStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBpLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1RUFBeUQ7QUFFekQsMkNBQXVDO0FBUXZDLE1BQWEsUUFBUyxTQUFRLHNCQUFTO0lBQ3JCLEdBQUcsQ0FBcUI7SUFDeEIsTUFBTSxDQUFxQjtJQUMzQixTQUFTLENBQXVCO0lBRWhELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBb0I7UUFDNUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixxQ0FBcUM7UUFDckMsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ3pELFdBQVcsRUFBRSwyREFBMkQ7WUFDeEUscUJBQXFCLEVBQUU7Z0JBQ3JCLEtBQUssRUFBRSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDO2FBQzFDO1lBQ0QsMkJBQTJCLEVBQUU7Z0JBQzNCLFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVc7Z0JBQ3pDLFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVc7Z0JBQ3pDLFlBQVksRUFBRTtvQkFDWixjQUFjO29CQUNkLFlBQVk7b0JBQ1osZUFBZTtvQkFDZixXQUFXO2lCQUNaO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCxvQ0FBb0M7UUFDcEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQ2pELElBQUksRUFDSixtQkFBbUIsRUFDbkI7WUFDRSxPQUFPLEVBQUUsS0FBSyxDQUFDLGtCQUFrQjtZQUNqQyxlQUFlLEVBQUUsQ0FBQyxVQUFVLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNoRSxlQUFlLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1NBQ3pDLENBQ0YsQ0FBQztRQUVGLDBCQUEwQjtRQUMxQixNQUFNLGNBQWMsR0FBRyxJQUFJLFVBQVUsQ0FBQyxpQkFBaUIsQ0FDckQsS0FBSyxDQUFDLGtCQUFrQixFQUN4QjtZQUNFLEtBQUssRUFBRSxJQUFJO1lBQ1gsZUFBZSxFQUFFLEtBQUs7U0FDdkIsQ0FDRixDQUFDO1FBRUYsYUFBYTtRQUNiLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ2pFLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsY0FBYyxFQUFFO1lBQ2xELFVBQVU7WUFDVixjQUFjLEVBQUUsS0FBSztTQUN0QixDQUFDLENBQUM7UUFDSCxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLGNBQWMsRUFBRTtZQUNqRCxVQUFVO1lBQ1YsY0FBYyxFQUFFLEtBQUs7U0FDdEIsQ0FBQyxDQUFDO1FBRUgsTUFBTSxnQkFBZ0IsR0FBRyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDdkUsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxjQUFjLEVBQUU7WUFDaEQsVUFBVTtZQUNWLGNBQWMsRUFBRSxLQUFLO1NBQ3RCLENBQUMsQ0FBQztRQUVILHlCQUF5QjtRQUN6QixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRTtZQUM3QyxXQUFXLEVBQUUsd0NBQXdDO1NBQ3RELENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsZUFBZSxFQUFFO1lBQ3RELFdBQVcsRUFBRSx3Q0FBd0M7WUFDckQsUUFBUSxFQUFFO2dCQUNSLFNBQVMsRUFBRSxHQUFHO2dCQUNkLFVBQVUsRUFBRSxHQUFHO2FBQ2hCO1lBQ0QsS0FBSyxFQUFFO2dCQUNMLEtBQUssRUFBRSxLQUFLO2dCQUNaLE1BQU0sRUFBRSxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUs7YUFDaEM7U0FDRixDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUM7WUFDekIsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsZUFBZTtTQUNoQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFyRkQsNEJBcUZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXBpU3RhY2tQcm9wcyB7XG4gIGVudmlyb25tZW50U3VmZml4OiBzdHJpbmc7XG4gIGF1dGhvcml6ZXJGdW5jdGlvbjogbGFtYmRhLkZ1bmN0aW9uO1xuICBhcGlIYW5kbGVyRnVuY3Rpb246IGxhbWJkYS5GdW5jdGlvbjtcbn1cblxuZXhwb3J0IGNsYXNzIEFwaVN0YWNrIGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgcHVibGljIHJlYWRvbmx5IGFwaTogYXBpZ2F0ZXdheS5SZXN0QXBpO1xuICBwdWJsaWMgcmVhZG9ubHkgYXBpS2V5OiBhcGlnYXRld2F5LklBcGlLZXk7XG4gIHB1YmxpYyByZWFkb25seSB1c2FnZVBsYW46IGFwaWdhdGV3YXkuVXNhZ2VQbGFuO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBBcGlTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIEFQSSBHYXRld2F5IHdpdGggTGFtYmRhIEF1dGhvcml6ZXJcbiAgICB0aGlzLmFwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgJ1Byb2REb2N1bWVudEFwaScsIHtcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VydmVybGVzcyBkb2N1bWVudCBwcm9jZXNzaW5nIEFQSSB3aXRoIExhbWJkYSBhdXRob3JpemVyJyxcbiAgICAgIGVuZHBvaW50Q29uZmlndXJhdGlvbjoge1xuICAgICAgICB0eXBlczogW2FwaWdhdGV3YXkuRW5kcG9pbnRUeXBlLlJFR0lPTkFMXSxcbiAgICAgIH0sXG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcbiAgICAgICAgYWxsb3dPcmlnaW5zOiBhcGlnYXRld2F5LkNvcnMuQUxMX09SSUdJTlMsXG4gICAgICAgIGFsbG93TWV0aG9kczogYXBpZ2F0ZXdheS5Db3JzLkFMTF9NRVRIT0RTLFxuICAgICAgICBhbGxvd0hlYWRlcnM6IFtcbiAgICAgICAgICAnQ29udGVudC1UeXBlJyxcbiAgICAgICAgICAnWC1BbXotRGF0ZScsXG4gICAgICAgICAgJ0F1dGhvcml6YXRpb24nLFxuICAgICAgICAgICdYLUFwaS1LZXknLFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIExhbWJkYSBBdXRob3JpemVyIGZvciBBUEkgR2F0ZXdheVxuICAgIGNvbnN0IGF1dGhvcml6ZXIgPSBuZXcgYXBpZ2F0ZXdheS5SZXF1ZXN0QXV0aG9yaXplcihcbiAgICAgIHRoaXMsXG4gICAgICAnUHJvZEFwaUF1dGhvcml6ZXInLFxuICAgICAge1xuICAgICAgICBoYW5kbGVyOiBwcm9wcy5hdXRob3JpemVyRnVuY3Rpb24sXG4gICAgICAgIGlkZW50aXR5U291cmNlczogW2FwaWdhdGV3YXkuSWRlbnRpdHlTb3VyY2UuaGVhZGVyKCdYLUFwaS1LZXknKV0sXG4gICAgICAgIHJlc3VsdHNDYWNoZVR0bDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMCksXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIEFQSSBHYXRld2F5IEludGVncmF0aW9uXG4gICAgY29uc3QgYXBpSW50ZWdyYXRpb24gPSBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihcbiAgICAgIHByb3BzLmFwaUhhbmRsZXJGdW5jdGlvbixcbiAgICAgIHtcbiAgICAgICAgcHJveHk6IHRydWUsXG4gICAgICAgIGFsbG93VGVzdEludm9rZTogZmFsc2UsXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIEFQSSBSb3V0ZXNcbiAgICBjb25zdCBkb2N1bWVudHNSZXNvdXJjZSA9IHRoaXMuYXBpLnJvb3QuYWRkUmVzb3VyY2UoJ2RvY3VtZW50cycpO1xuICAgIGRvY3VtZW50c1Jlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsIGFwaUludGVncmF0aW9uLCB7XG4gICAgICBhdXRob3JpemVyLFxuICAgICAgYXBpS2V5UmVxdWlyZWQ6IGZhbHNlLFxuICAgIH0pO1xuICAgIGRvY3VtZW50c1Jlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgYXBpSW50ZWdyYXRpb24sIHtcbiAgICAgIGF1dGhvcml6ZXIsXG4gICAgICBhcGlLZXlSZXF1aXJlZDogZmFsc2UsXG4gICAgfSk7XG5cbiAgICBjb25zdCBkb2N1bWVudFJlc291cmNlID0gZG9jdW1lbnRzUmVzb3VyY2UuYWRkUmVzb3VyY2UoJ3tkb2N1bWVudElkfScpO1xuICAgIGRvY3VtZW50UmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBhcGlJbnRlZ3JhdGlvbiwge1xuICAgICAgYXV0aG9yaXplcixcbiAgICAgIGFwaUtleVJlcXVpcmVkOiBmYWxzZSxcbiAgICB9KTtcblxuICAgIC8vIEFQSSBLZXkgYW5kIFVzYWdlIFBsYW5cbiAgICB0aGlzLmFwaUtleSA9IHRoaXMuYXBpLmFkZEFwaUtleSgnUHJvZEFwaUtleScsIHtcbiAgICAgIGRlc2NyaXB0aW9uOiAnQVBJIGtleSBmb3IgZG9jdW1lbnQgcHJvY2Vzc2luZyBzeXN0ZW0nLFxuICAgIH0pO1xuXG4gICAgdGhpcy51c2FnZVBsYW4gPSB0aGlzLmFwaS5hZGRVc2FnZVBsYW4oJ1Byb2RVc2FnZVBsYW4nLCB7XG4gICAgICBkZXNjcmlwdGlvbjogJ1VzYWdlIHBsYW4gZm9yIGRvY3VtZW50IHByb2Nlc3NpbmcgQVBJJyxcbiAgICAgIHRocm90dGxlOiB7XG4gICAgICAgIHJhdGVMaW1pdDogMTAwLFxuICAgICAgICBidXJzdExpbWl0OiAyMDAsXG4gICAgICB9LFxuICAgICAgcXVvdGE6IHtcbiAgICAgICAgbGltaXQ6IDEwMDAwLFxuICAgICAgICBwZXJpb2Q6IGFwaWdhdGV3YXkuUGVyaW9kLk1PTlRILFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMudXNhZ2VQbGFuLmFkZEFwaUtleSh0aGlzLmFwaUtleSk7XG4gICAgdGhpcy51c2FnZVBsYW4uYWRkQXBpU3RhZ2Uoe1xuICAgICAgc3RhZ2U6IHRoaXMuYXBpLmRlcGxveW1lbnRTdGFnZSxcbiAgICB9KTtcbiAgfVxufVxuIl19