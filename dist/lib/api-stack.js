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
const constructs_1 = require("constructs");
const apigatewayv2_api_1 = require("@cdktf/provider-aws/lib/apigatewayv2-api");
const apigatewayv2_stage_1 = require("@cdktf/provider-aws/lib/apigatewayv2-stage");
const apigatewayv2_route_1 = require("@cdktf/provider-aws/lib/apigatewayv2-route");
const apigatewayv2_integration_1 = require("@cdktf/provider-aws/lib/apigatewayv2-integration");
const iam_role_1 = require("@cdktf/provider-aws/lib/iam-role");
const iam_role_policy_1 = require("@cdktf/provider-aws/lib/iam-role-policy");
const lambda_function_1 = require("@cdktf/provider-aws/lib/lambda-function");
const lambda_permission_1 = require("@cdktf/provider-aws/lib/lambda-permission");
const data_archive_file_1 = require("@cdktf/provider-archive/lib/data-archive-file");
const path = __importStar(require("path"));
class ApiStack extends constructs_1.Construct {
    websocketApi;
    constructor(scope, id, props) {
        super(scope, id);
        const lambdaRole = new iam_role_1.IamRole(this, 'lambda-role', {
            name: `portfolio-ws-lambda-role-${props.environmentSuffix}`,
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
        });
        new iam_role_policy_1.IamRolePolicy(this, 'lambda-policy', {
            name: `portfolio-ws-lambda-policy-${props.environmentSuffix}`,
            role: lambdaRole.id,
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: [
                            'logs:CreateLogGroup',
                            'logs:CreateLogStream',
                            'logs:PutLogEvents',
                        ],
                        Resource: 'arn:aws:logs:*:*:*',
                    },
                    {
                        Effect: 'Allow',
                        Action: ['execute-api:ManageConnections', 'execute-api:Invoke'],
                        Resource: '*',
                    },
                ],
            }),
        });
        // Create Lambda deployment package
        const lambdaAsset = new data_archive_file_1.DataArchiveFile(this, 'websocket-lambda-archive', {
            type: 'zip',
            sourceDir: path.join(__dirname, 'lambda', 'websocket-handler'),
            outputPath: path.join(__dirname, '../.terraform', `websocket-handler-${props.environmentSuffix}.zip`),
        });
        const websocketLambda = new lambda_function_1.LambdaFunction(this, 'websocket-handler', {
            functionName: `portfolio-ws-handler-${props.environmentSuffix}`,
            runtime: 'nodejs18.x',
            handler: 'index.handler',
            role: lambdaRole.arn,
            filename: lambdaAsset.outputPath,
            sourceCodeHash: lambdaAsset.outputBase64Sha256,
            timeout: 30,
            memorySize: 256,
            environment: {
                variables: {
                    ALB_DNS: props.alb.dnsName,
                },
            },
        });
        this.websocketApi = new apigatewayv2_api_1.Apigatewayv2Api(this, 'websocket-api', {
            name: `portfolio-ws-api-${props.environmentSuffix}`,
            protocolType: 'WEBSOCKET',
            routeSelectionExpression: '$request.body.action',
            description: 'WebSocket API for real-time portfolio updates',
        });
        const integration = new apigatewayv2_integration_1.Apigatewayv2Integration(this, 'websocket-integration', {
            apiId: this.websocketApi.id,
            integrationType: 'AWS_PROXY',
            integrationUri: websocketLambda.invokeArn,
            integrationMethod: 'POST',
            connectionType: 'INTERNET',
        });
        new apigatewayv2_route_1.Apigatewayv2Route(this, 'connect-route', {
            apiId: this.websocketApi.id,
            routeKey: '$connect',
            target: `integrations/${integration.id}`,
        });
        new apigatewayv2_route_1.Apigatewayv2Route(this, 'disconnect-route', {
            apiId: this.websocketApi.id,
            routeKey: '$disconnect',
            target: `integrations/${integration.id}`,
        });
        new apigatewayv2_route_1.Apigatewayv2Route(this, 'default-route', {
            apiId: this.websocketApi.id,
            routeKey: '$default',
            target: `integrations/${integration.id}`,
        });
        new apigatewayv2_stage_1.Apigatewayv2Stage(this, 'websocket-stage', {
            apiId: this.websocketApi.id,
            name: 'prod',
            autoDeploy: true,
        });
        new lambda_permission_1.LambdaPermission(this, 'websocket-lambda-permission', {
            statementId: 'AllowAPIGatewayInvoke',
            action: 'lambda:InvokeFunction',
            functionName: websocketLambda.functionName,
            principal: 'apigateway.amazonaws.com',
            sourceArn: `${this.websocketApi.executionArn}/*/*`,
        });
    }
}
exports.ApiStack = ApiStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2FwaS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBdUM7QUFHdkMsK0VBQTJFO0FBQzNFLG1GQUErRTtBQUMvRSxtRkFBK0U7QUFDL0UsK0ZBQTJGO0FBQzNGLCtEQUEyRDtBQUMzRCw2RUFBd0U7QUFDeEUsNkVBQXlFO0FBQ3pFLGlGQUE2RTtBQUM3RSxxRkFBZ0Y7QUFDaEYsMkNBQTZCO0FBUzdCLE1BQWEsUUFBUyxTQUFRLHNCQUFTO0lBQ3JCLFlBQVksQ0FBa0I7SUFFOUMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFvQjtRQUM1RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLE1BQU0sVUFBVSxHQUFHLElBQUksa0JBQU8sQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO1lBQ2xELElBQUksRUFBRSw0QkFBNEIsS0FBSyxDQUFDLGlCQUFpQixFQUFFO1lBQzNELGdCQUFnQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQy9CLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixTQUFTLEVBQUU7b0JBQ1Q7d0JBQ0UsTUFBTSxFQUFFLGdCQUFnQjt3QkFDeEIsTUFBTSxFQUFFLE9BQU87d0JBQ2YsU0FBUyxFQUFFOzRCQUNULE9BQU8sRUFBRSxzQkFBc0I7eUJBQ2hDO3FCQUNGO2lCQUNGO2FBQ0YsQ0FBQztTQUNILENBQUMsQ0FBQztRQUVILElBQUksK0JBQWEsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ3ZDLElBQUksRUFBRSw4QkFBOEIsS0FBSyxDQUFDLGlCQUFpQixFQUFFO1lBQzdELElBQUksRUFBRSxVQUFVLENBQUMsRUFBRTtZQUNuQixNQUFNLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDckIsT0FBTyxFQUFFLFlBQVk7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Q0FBQyxDQUFDO1FBRUgsSUFBSSxzQ0FBaUIsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDN0MsS0FBSyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRTtZQUMzQixJQUFJLEVBQUUsTUFBTTtZQUNaLFVBQVUsRUFBRSxJQUFJO1NBQ2pCLENBQUMsQ0FBQztRQUVILElBQUksb0NBQWdCLENBQUMsSUFBSSxFQUFFLDZCQUE2QixFQUFFO1lBQ3hELFdBQVcsRUFBRSx1QkFBdUI7WUFDcEMsTUFBTSxFQUFFLHVCQUF1QjtZQUMvQixZQUFZLEVBQUUsZUFBZSxDQUFDLFlBQVk7WUFDMUMsU0FBUyxFQUFFLDBCQUEwQjtZQUNyQyxTQUFTLEVBQUUsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksTUFBTTtTQUNuRCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUE1SEQsNEJBNEhDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBWcGMgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi92cGMnO1xuaW1wb3J0IHsgQWxiIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvYWxiJztcbmltcG9ydCB7IEFwaWdhdGV3YXl2MkFwaSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2FwaWdhdGV3YXl2Mi1hcGknO1xuaW1wb3J0IHsgQXBpZ2F0ZXdheXYyU3RhZ2UgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9hcGlnYXRld2F5djItc3RhZ2UnO1xuaW1wb3J0IHsgQXBpZ2F0ZXdheXYyUm91dGUgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9hcGlnYXRld2F5djItcm91dGUnO1xuaW1wb3J0IHsgQXBpZ2F0ZXdheXYySW50ZWdyYXRpb24gfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9hcGlnYXRld2F5djItaW50ZWdyYXRpb24nO1xuaW1wb3J0IHsgSWFtUm9sZSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2lhbS1yb2xlJztcbmltcG9ydCB7IElhbVJvbGVQb2xpY3kgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9pYW0tcm9sZS1wb2xpY3knO1xuaW1wb3J0IHsgTGFtYmRhRnVuY3Rpb24gfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9sYW1iZGEtZnVuY3Rpb24nO1xuaW1wb3J0IHsgTGFtYmRhUGVybWlzc2lvbiB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2xhbWJkYS1wZXJtaXNzaW9uJztcbmltcG9ydCB7IERhdGFBcmNoaXZlRmlsZSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hcmNoaXZlL2xpYi9kYXRhLWFyY2hpdmUtZmlsZSc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuXG5pbnRlcmZhY2UgQXBpU3RhY2tQcm9wcyB7XG4gIHZwYzogVnBjO1xuICBhbGI6IEFsYjtcbiAgcmVnaW9uOiBzdHJpbmc7XG4gIGVudmlyb25tZW50U3VmZml4OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBBcGlTdGFjayBleHRlbmRzIENvbnN0cnVjdCB7XG4gIHB1YmxpYyByZWFkb25seSB3ZWJzb2NrZXRBcGk6IEFwaWdhdGV3YXl2MkFwaTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogQXBpU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICBjb25zdCBsYW1iZGFSb2xlID0gbmV3IElhbVJvbGUodGhpcywgJ2xhbWJkYS1yb2xlJywge1xuICAgICAgbmFtZTogYHBvcnRmb2xpby13cy1sYW1iZGEtcm9sZS0ke3Byb3BzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICBhc3N1bWVSb2xlUG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgQWN0aW9uOiAnc3RzOkFzc3VtZVJvbGUnLFxuICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgIFNlcnZpY2U6ICdsYW1iZGEuYW1hem9uYXdzLmNvbScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9KSxcbiAgICB9KTtcblxuICAgIG5ldyBJYW1Sb2xlUG9saWN5KHRoaXMsICdsYW1iZGEtcG9saWN5Jywge1xuICAgICAgbmFtZTogYHBvcnRmb2xpby13cy1sYW1iZGEtcG9saWN5LSR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHJvbGU6IGxhbWJkYVJvbGUuaWQsXG4gICAgICBwb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nR3JvdXAnLFxuICAgICAgICAgICAgICAnbG9nczpDcmVhdGVMb2dTdHJlYW0nLFxuICAgICAgICAgICAgICAnbG9nczpQdXRMb2dFdmVudHMnLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIFJlc291cmNlOiAnYXJuOmF3czpsb2dzOio6KjoqJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgIEFjdGlvbjogWydleGVjdXRlLWFwaTpNYW5hZ2VDb25uZWN0aW9ucycsICdleGVjdXRlLWFwaTpJbnZva2UnXSxcbiAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIExhbWJkYSBkZXBsb3ltZW50IHBhY2thZ2VcbiAgICBjb25zdCBsYW1iZGFBc3NldCA9IG5ldyBEYXRhQXJjaGl2ZUZpbGUodGhpcywgJ3dlYnNvY2tldC1sYW1iZGEtYXJjaGl2ZScsIHtcbiAgICAgIHR5cGU6ICd6aXAnLFxuICAgICAgc291cmNlRGlyOiBwYXRoLmpvaW4oX19kaXJuYW1lLCAnbGFtYmRhJywgJ3dlYnNvY2tldC1oYW5kbGVyJyksXG4gICAgICBvdXRwdXRQYXRoOiBwYXRoLmpvaW4oXG4gICAgICAgIF9fZGlybmFtZSxcbiAgICAgICAgJy4uLy50ZXJyYWZvcm0nLFxuICAgICAgICBgd2Vic29ja2V0LWhhbmRsZXItJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH0uemlwYFxuICAgICAgKSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHdlYnNvY2tldExhbWJkYSA9IG5ldyBMYW1iZGFGdW5jdGlvbih0aGlzLCAnd2Vic29ja2V0LWhhbmRsZXInLCB7XG4gICAgICBmdW5jdGlvbk5hbWU6IGBwb3J0Zm9saW8td3MtaGFuZGxlci0ke3Byb3BzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICBydW50aW1lOiAnbm9kZWpzMTgueCcsXG4gICAgICBoYW5kbGVyOiAnaW5kZXguaGFuZGxlcicsXG4gICAgICByb2xlOiBsYW1iZGFSb2xlLmFybixcbiAgICAgIGZpbGVuYW1lOiBsYW1iZGFBc3NldC5vdXRwdXRQYXRoLFxuICAgICAgc291cmNlQ29kZUhhc2g6IGxhbWJkYUFzc2V0Lm91dHB1dEJhc2U2NFNoYTI1NixcbiAgICAgIHRpbWVvdXQ6IDMwLFxuICAgICAgbWVtb3J5U2l6ZTogMjU2LFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgQUxCX0ROUzogcHJvcHMuYWxiLmRuc05hbWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGhpcy53ZWJzb2NrZXRBcGkgPSBuZXcgQXBpZ2F0ZXdheXYyQXBpKHRoaXMsICd3ZWJzb2NrZXQtYXBpJywge1xuICAgICAgbmFtZTogYHBvcnRmb2xpby13cy1hcGktJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgcHJvdG9jb2xUeXBlOiAnV0VCU09DS0VUJyxcbiAgICAgIHJvdXRlU2VsZWN0aW9uRXhwcmVzc2lvbjogJyRyZXF1ZXN0LmJvZHkuYWN0aW9uJyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnV2ViU29ja2V0IEFQSSBmb3IgcmVhbC10aW1lIHBvcnRmb2xpbyB1cGRhdGVzJyxcbiAgICB9KTtcblxuICAgIGNvbnN0IGludGVncmF0aW9uID0gbmV3IEFwaWdhdGV3YXl2MkludGVncmF0aW9uKFxuICAgICAgdGhpcyxcbiAgICAgICd3ZWJzb2NrZXQtaW50ZWdyYXRpb24nLFxuICAgICAge1xuICAgICAgICBhcGlJZDogdGhpcy53ZWJzb2NrZXRBcGkuaWQsXG4gICAgICAgIGludGVncmF0aW9uVHlwZTogJ0FXU19QUk9YWScsXG4gICAgICAgIGludGVncmF0aW9uVXJpOiB3ZWJzb2NrZXRMYW1iZGEuaW52b2tlQXJuLFxuICAgICAgICBpbnRlZ3JhdGlvbk1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBjb25uZWN0aW9uVHlwZTogJ0lOVEVSTkVUJyxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgbmV3IEFwaWdhdGV3YXl2MlJvdXRlKHRoaXMsICdjb25uZWN0LXJvdXRlJywge1xuICAgICAgYXBpSWQ6IHRoaXMud2Vic29ja2V0QXBpLmlkLFxuICAgICAgcm91dGVLZXk6ICckY29ubmVjdCcsXG4gICAgICB0YXJnZXQ6IGBpbnRlZ3JhdGlvbnMvJHtpbnRlZ3JhdGlvbi5pZH1gLFxuICAgIH0pO1xuXG4gICAgbmV3IEFwaWdhdGV3YXl2MlJvdXRlKHRoaXMsICdkaXNjb25uZWN0LXJvdXRlJywge1xuICAgICAgYXBpSWQ6IHRoaXMud2Vic29ja2V0QXBpLmlkLFxuICAgICAgcm91dGVLZXk6ICckZGlzY29ubmVjdCcsXG4gICAgICB0YXJnZXQ6IGBpbnRlZ3JhdGlvbnMvJHtpbnRlZ3JhdGlvbi5pZH1gLFxuICAgIH0pO1xuXG4gICAgbmV3IEFwaWdhdGV3YXl2MlJvdXRlKHRoaXMsICdkZWZhdWx0LXJvdXRlJywge1xuICAgICAgYXBpSWQ6IHRoaXMud2Vic29ja2V0QXBpLmlkLFxuICAgICAgcm91dGVLZXk6ICckZGVmYXVsdCcsXG4gICAgICB0YXJnZXQ6IGBpbnRlZ3JhdGlvbnMvJHtpbnRlZ3JhdGlvbi5pZH1gLFxuICAgIH0pO1xuXG4gICAgbmV3IEFwaWdhdGV3YXl2MlN0YWdlKHRoaXMsICd3ZWJzb2NrZXQtc3RhZ2UnLCB7XG4gICAgICBhcGlJZDogdGhpcy53ZWJzb2NrZXRBcGkuaWQsXG4gICAgICBuYW1lOiAncHJvZCcsXG4gICAgICBhdXRvRGVwbG95OiB0cnVlLFxuICAgIH0pO1xuXG4gICAgbmV3IExhbWJkYVBlcm1pc3Npb24odGhpcywgJ3dlYnNvY2tldC1sYW1iZGEtcGVybWlzc2lvbicsIHtcbiAgICAgIHN0YXRlbWVudElkOiAnQWxsb3dBUElHYXRld2F5SW52b2tlJyxcbiAgICAgIGFjdGlvbjogJ2xhbWJkYTpJbnZva2VGdW5jdGlvbicsXG4gICAgICBmdW5jdGlvbk5hbWU6IHdlYnNvY2tldExhbWJkYS5mdW5jdGlvbk5hbWUsXG4gICAgICBwcmluY2lwYWw6ICdhcGlnYXRld2F5LmFtYXpvbmF3cy5jb20nLFxuICAgICAgc291cmNlQXJuOiBgJHt0aGlzLndlYnNvY2tldEFwaS5leGVjdXRpb25Bcm59LyovKmAsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==