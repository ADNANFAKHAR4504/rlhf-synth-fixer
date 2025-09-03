/**
 * ApiGatewayStack - manages API Gateway for HTTP endpoints
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class ApiGatewayStack extends pulumi.ComponentResource {
    constructor(name, args = {}, opts) {
        super('tap:api:ApiGatewayStack', name, args, opts);

        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};
        const lambdaFunctions = args.lambdaFunctions;

        // Create API Gateway REST API
        this.api = new aws.apigateway.RestApi(`tap-api-${environmentSuffix}`, {
            name: `tap-serverless-api-${environmentSuffix}`,
            description: 'Serverless API for TAP application',
            endpointConfiguration: {
                types: 'REGIONAL'
            },
            tags: {
                ...tags,
                Purpose: 'ServerlessAPI'
            }
        }, { parent: this });

        // Create resources and methods
        this.setupApiResources(environmentSuffix, lambdaFunctions);

        // Create deployment
        this.deployment = new aws.apigateway.Deployment(`tap-api-deployment-${environmentSuffix}`, {
            restApi: this.api.id,
            stageName: environmentSuffix
        }, { 
            parent: this,
            dependsOn: [this.notificationMethod, this.statusMethod]
        });

        this.apiUrl = pulumi.interpolate`https://${this.api.id}.execute-api.us-east-1.amazonaws.com/${environmentSuffix}`;

        this.registerOutputs({
            apiId: this.api.id,
            apiUrl: this.apiUrl
        });
    }

    setupApiResources(environmentSuffix, lambdaFunctions) {
        // Create /notifications resource
        this.notificationResource = new aws.apigateway.Resource(`tap-notifications-resource-${environmentSuffix}`, {
            restApi: this.api.id,
            parentId: this.api.rootResourceId,
            pathPart: 'notifications'
        }, { parent: this });

        // Create /status resource
        this.statusResource = new aws.apigateway.Resource(`tap-status-resource-${environmentSuffix}`, {
            restApi: this.api.id,
            parentId: this.api.rootResourceId,
            pathPart: 'status'
        }, { parent: this });

        // Set up methods and integrations
        this.setupNotificationEndpoint(environmentSuffix, lambdaFunctions);
        this.setupStatusEndpoint(environmentSuffix, lambdaFunctions);
    }

    setupNotificationEndpoint(environmentSuffix, lambdaFunctions) {
        if (!lambdaFunctions || !lambdaFunctions.notificationHandler) {
            return;
        }
        
        // GET /notifications method
        this.notificationGetMethod = new aws.apigateway.Method(`tap-notifications-get-${environmentSuffix}`, {
            restApi: this.api.id,
            resourceId: this.notificationResource.id,
            httpMethod: 'GET',
            authorization: 'NONE'
        }, { parent: this });

        // POST /notifications method
        this.notificationPostMethod = new aws.apigateway.Method(`tap-notifications-post-${environmentSuffix}`, {
            restApi: this.api.id,
            resourceId: this.notificationResource.id,
            httpMethod: 'POST',
            authorization: 'NONE'
        }, { parent: this });

        // Lambda integration for GET
        this.notificationGetIntegration = new aws.apigateway.Integration(`tap-notifications-get-integration-${environmentSuffix}`, {
            restApi: this.api.id,
            resourceId: this.notificationResource.id,
            httpMethod: this.notificationGetMethod.httpMethod,
            integrationHttpMethod: 'POST',
            type: 'AWS_PROXY',
            uri: lambdaFunctions.notificationHandler.invokeArn
        }, { parent: this });

        // Lambda integration for POST
        this.notificationPostIntegration = new aws.apigateway.Integration(`tap-notifications-post-integration-${environmentSuffix}`, {
            restApi: this.api.id,
            resourceId: this.notificationResource.id,
            httpMethod: this.notificationPostMethod.httpMethod,
            integrationHttpMethod: 'POST',
            type: 'AWS_PROXY',
            uri: lambdaFunctions.notificationHandler.invokeArn
        }, { parent: this });

        // Lambda permissions for API Gateway
        this.notificationGetPermission = new aws.lambda.Permission(`tap-notification-api-permission-get-${environmentSuffix}`, {
            statementId: 'AllowExecutionFromAPIGatewayGET',
            action: 'lambda:InvokeFunction',
            function: lambdaFunctions.notificationHandler.name,
            principal: 'apigateway.amazonaws.com',
            sourceArn: pulumi.interpolate`${this.api.executionArn}/*/*`
        }, { parent: this });

        this.notificationPostPermission = new aws.lambda.Permission(`tap-notification-api-permission-post-${environmentSuffix}`, {
            statementId: 'AllowExecutionFromAPIGatewayPOST',
            action: 'lambda:InvokeFunction',
            function: lambdaFunctions.notificationHandler.name,
            principal: 'apigateway.amazonaws.com',
            sourceArn: pulumi.interpolate`${this.api.executionArn}/*/*`
        }, { parent: this });

        this.notificationMethod = this.notificationPostIntegration;
    }

    setupStatusEndpoint(environmentSuffix, lambdaFunctions) {
        // GET /status method
        this.statusGetMethod = new aws.apigateway.Method(`tap-status-get-${environmentSuffix}`, {
            restApi: this.api.id,
            resourceId: this.statusResource.id,
            httpMethod: 'GET',
            authorization: 'NONE'
        }, { parent: this });

        // Mock integration for status endpoint
        this.statusIntegration = new aws.apigateway.Integration(`tap-status-integration-${environmentSuffix}`, {
            restApi: this.api.id,
            resourceId: this.statusResource.id,
            httpMethod: this.statusGetMethod.httpMethod,
            type: 'MOCK',
            requestTemplates: {
                'application/json': '{"statusCode": 200}'
            }
        }, { parent: this });

        // Integration response
        this.statusIntegrationResponse = new aws.apigateway.IntegrationResponse(`tap-status-integration-response-${environmentSuffix}`, {
            restApi: this.api.id,
            resourceId: this.statusResource.id,
            httpMethod: this.statusGetMethod.httpMethod,
            statusCode: '200',
            responseTemplates: {
                'application/json': JSON.stringify({
                    status: 'healthy',
                    timestamp: '$context.requestTime',
                    environment: environmentSuffix
                })
            }
        }, { 
            parent: this,
            dependsOn: [this.statusIntegration]
        });

        // Method response
        this.statusMethodResponse = new aws.apigateway.MethodResponse(`tap-status-method-response-${environmentSuffix}`, {
            restApi: this.api.id,
            resourceId: this.statusResource.id,
            httpMethod: this.statusGetMethod.httpMethod,
            statusCode: '200'
        }, { parent: this });

        this.statusMethod = this.statusIntegrationResponse;
    }
}