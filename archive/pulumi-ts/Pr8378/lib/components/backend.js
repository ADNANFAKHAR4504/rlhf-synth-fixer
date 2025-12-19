"use strict";
// lib/components/backend.ts
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
exports.BackendInfrastructure = void 0;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class BackendInfrastructure extends pulumi.ComponentResource {
    table;
    lambdaRole;
    lambdaFunction;
    apiGateway;
    apiResource;
    apiResourceId;
    getMethod;
    postMethod;
    getItemMethod;
    getIntegration;
    postIntegration;
    getItemIntegration;
    apiDeployment;
    constructor(name, args, opts) {
        super('custom:backend:Infrastructure', name, {}, opts);
        // DynamoDB Table
        this.table = new aws.dynamodb.Table(`${name}-table`, {
            name: `${name}-app-data`,
            billingMode: 'PAY_PER_REQUEST',
            hashKey: 'id',
            attributes: [
                {
                    name: 'id',
                    type: 'S',
                },
            ],
            tags: args.tags,
        }, { parent: this });
        // Lambda IAM Role
        this.lambdaRole = new aws.iam.Role(`${name}-lambda-role`, {
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
        new aws.iam.RolePolicyAttachment(`${name}-lambda-vpc-policy`, {
            role: this.lambdaRole.name,
            policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
        }, { parent: this });
        // Lambda custom policy
        const lambdaPolicy = pulumi
            .all([this.table.arn, args.snsTopicArn])
            .apply(([tableArn, snsArn]) => JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Action: [
                        'dynamodb:PutItem',
                        'dynamodb:GetItem',
                        'dynamodb:UpdateItem',
                        'dynamodb:DeleteItem',
                        'dynamodb:Query',
                        'dynamodb:Scan',
                    ],
                    Resource: tableArn,
                },
                {
                    Effect: 'Allow',
                    Action: 'sns:Publish',
                    Resource: snsArn,
                },
                {
                    Effect: 'Allow',
                    Action: [
                        'logs:CreateLogGroup',
                        'logs:CreateLogStream',
                        'logs:PutLogEvents',
                    ],
                    Resource: '*',
                },
            ],
        }));
        new aws.iam.RolePolicy(`${name}-lambda-policy`, {
            role: this.lambdaRole.id,
            policy: lambdaPolicy,
        }, { parent: this });
        // Lambda Function
        const lambdaCode = this.getLambdaCode();
        this.lambdaFunction = new aws.lambda.Function(`${name}-function`, {
            name: `${name}-function`,
            runtime: 'nodejs18.x',
            code: new pulumi.asset.AssetArchive({
                'index.js': new pulumi.asset.StringAsset(lambdaCode),
            }),
            handler: 'index.handler',
            role: this.lambdaRole.arn,
            timeout: 30,
            memorySize: 256,
            vpcConfig: {
                subnetIds: args.privateSubnetIds,
                securityGroupIds: [args.vpcEndpointSgId],
            },
            environment: {
                variables: {
                    TABLE_NAME: this.table.name,
                    SNS_TOPIC_ARN: args.snsTopicArn,
                },
            },
            tags: args.tags,
        }, { parent: this });
        // API Gateway REST API
        this.apiGateway = new aws.apigateway.RestApi(`${name}-api`, {
            name: `${name}-api`,
            description: 'Multi-tier web application API',
            endpointConfiguration: {
                types: 'REGIONAL',
            },
            tags: args.tags,
        }, { parent: this });
        // API Gateway resource for /items
        this.apiResource = new aws.apigateway.Resource(`${name}-api-resource`, {
            restApi: this.apiGateway.id,
            parentId: this.apiGateway.rootResourceId,
            pathPart: 'items',
        }, { parent: this });
        // API Gateway resource for /items/{id}
        this.apiResourceId = new aws.apigateway.Resource(`${name}-api-resource-id`, {
            restApi: this.apiGateway.id,
            parentId: this.apiResource.id,
            pathPart: '{id}',
        }, { parent: this });
        // GET method for /items
        this.getMethod = new aws.apigateway.Method(`${name}-get-method`, {
            restApi: this.apiGateway.id,
            resourceId: this.apiResource.id,
            httpMethod: 'GET',
            authorization: 'NONE',
        }, { parent: this });
        // POST method for /items
        this.postMethod = new aws.apigateway.Method(`${name}-post-method`, {
            restApi: this.apiGateway.id,
            resourceId: this.apiResource.id,
            httpMethod: 'POST',
            authorization: 'NONE',
        }, { parent: this });
        // GET method for /items/{id}
        this.getItemMethod = new aws.apigateway.Method(`${name}-get-item-method`, {
            restApi: this.apiGateway.id,
            resourceId: this.apiResourceId.id,
            httpMethod: 'GET',
            authorization: 'NONE',
            requestParameters: {
                'method.request.path.id': true,
            },
        }, { parent: this });
        // Create Lambda integrations
        this.createLambdaIntegrations(name);
        // API Gateway deployment - Fixed: removed stageName and created separate stage
        this.apiDeployment = new aws.apigateway.Deployment(`${name}-api-deployment`, {
            restApi: this.apiGateway.id,
        }, {
            parent: this,
            dependsOn: [
                this.getMethod,
                this.postMethod,
                this.getItemMethod,
                this.getIntegration,
                this.postIntegration,
                this.getItemIntegration,
            ],
        });
        // Create a separate stage for the deployment
        new aws.apigateway.Stage(`${name}-api-stage`, {
            deployment: this.apiDeployment.id,
            restApi: this.apiGateway.id,
            stageName: 'v1',
        }, { parent: this });
        // Lambda permission for API Gateway
        new aws.lambda.Permission(`${name}-api-lambda-permission`, {
            action: 'lambda:InvokeFunction',
            function: this.lambdaFunction.name,
            principal: 'apigateway.amazonaws.com',
            sourceArn: pulumi.interpolate `${this.apiGateway.executionArn}/*/*`,
        }, { parent: this });
        this.registerOutputs({
            tableName: this.table.name,
            lambdaFunctionName: this.lambdaFunction.name,
            apiGatewayUrl: pulumi.interpolate `https://${this.apiGateway.id}.execute-api.${aws.getRegion().then(r => r.name)}.amazonaws.com/v1`,
            apiGatewayId: this.apiGateway.id,
        });
    }
    createLambdaIntegrations(name) {
        // GET /items integration
        const getIntegration = new aws.apigateway.Integration(`${name}-get-integration`, {
            restApi: this.apiGateway.id,
            resourceId: this.apiResource.id,
            httpMethod: this.getMethod.httpMethod,
            integrationHttpMethod: 'POST',
            type: 'AWS_PROXY',
            uri: this.lambdaFunction.invokeArn,
        }, { parent: this });
        // POST /items integration
        const postIntegration = new aws.apigateway.Integration(`${name}-post-integration`, {
            restApi: this.apiGateway.id,
            resourceId: this.apiResource.id,
            httpMethod: this.postMethod.httpMethod,
            integrationHttpMethod: 'POST',
            type: 'AWS_PROXY',
            uri: this.lambdaFunction.invokeArn,
        }, { parent: this });
        // GET /items/{id} integration
        const getItemIntegration = new aws.apigateway.Integration(`${name}-get-item-integration`, {
            restApi: this.apiGateway.id,
            resourceId: this.apiResourceId.id,
            httpMethod: this.getItemMethod.httpMethod,
            integrationHttpMethod: 'POST',
            type: 'AWS_PROXY',
            uri: this.lambdaFunction.invokeArn,
        }, { parent: this });
        // Assign to readonly properties using Object.defineProperty
        Object.defineProperty(this, 'getIntegration', {
            value: getIntegration,
            writable: false,
            enumerable: true,
            configurable: false,
        });
        Object.defineProperty(this, 'postIntegration', {
            value: postIntegration,
            writable: false,
            enumerable: true,
            configurable: false,
        });
        Object.defineProperty(this, 'getItemIntegration', {
            value: getItemIntegration,
            writable: false,
            enumerable: true,
            configurable: false,
        });
    }
    getLambdaCode() {
        return `
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

const TABLE_NAME = process.env.TABLE_NAME;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event));
    
    try {
        const httpMethod = event.httpMethod;
        const path = event.path;
        
        if (httpMethod === 'GET' && path === '/items') {
            return await getAllItems();
        } else if (httpMethod === 'POST' && path === '/items') {
            return await createItem(event);
        } else if (httpMethod === 'GET' && path.includes('/items/')) {
            const itemId = event.pathParameters.id;
            return await getItem(itemId);
        } else {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ message: 'Endpoint not found' })
            };
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        
        // Send error notification
        try {
            await sns.publish({
                TopicArn: SNS_TOPIC_ARN,
                Message: \`Lambda function error: \${error.message}\`,
                Subject: 'Backend API Error'
            }).promise();
        } catch (snsError) {
            console.error('Failed to send SNS notification:', snsError);
        }
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
};

async function getAllItems() {
    try {
        const response = await dynamodb.scan({
            TableName: TABLE_NAME
        }).promise();
        
        const items = response.Items || [];
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                items: items,
                count: items.length
            })
        };
    } catch (error) {
        console.error('Error getting items:', error.message);
        throw error;
    }
}

async function createItem(event) {
    try {
        const body = JSON.parse(event.body);
        const itemId = uuidv4();
        const now = new Date().toISOString();
        
        const item = {
            id: itemId,
            name: body.name || '',
            description: body.description || '',
            created_at: now,
            updated_at: now
        };
        
        await dynamodb.put({
            TableName: TABLE_NAME,
            Item: item
        }).promise();
        
        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(item)
        };
    } catch (error) {
        console.error('Error creating item:', error.message);
        throw error;
    }
}

async function getItem(itemId) {
    try {
        const response = await dynamodb.get({
            TableName: TABLE_NAME,
            Key: { id: itemId }
        }).promise();
        
        if (response.Item) {
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify(response.Item)
            };
        } else {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ message: 'Item not found' })
            };
        }
    } catch (error) {
        console.error('Error getting item:', error.message);
        throw error;
    }
}
`;
    }
}
exports.BackendInfrastructure = BackendInfrastructure;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2VuZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJhY2tlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDRCQUE0Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRTVCLHVEQUF5QztBQUN6QyxpREFBbUM7QUFVbkMsTUFBYSxxQkFBc0IsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ2pELEtBQUssQ0FBcUI7SUFDMUIsVUFBVSxDQUFlO0lBQ3pCLGNBQWMsQ0FBc0I7SUFDcEMsVUFBVSxDQUF5QjtJQUNuQyxXQUFXLENBQTBCO0lBQ3JDLGFBQWEsQ0FBMEI7SUFDdkMsU0FBUyxDQUF3QjtJQUNqQyxVQUFVLENBQXdCO0lBQ2xDLGFBQWEsQ0FBd0I7SUFDckMsY0FBYyxDQUE2QjtJQUMzQyxlQUFlLENBQTZCO0lBQzVDLGtCQUFrQixDQUE2QjtJQUMvQyxhQUFhLENBQTRCO0lBRXpELFlBQ0UsSUFBWSxFQUNaLElBQStCLEVBQy9CLElBQXNDO1FBRXRDLEtBQUssQ0FBQywrQkFBK0IsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXZELGlCQUFpQjtRQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQ2pDLEdBQUcsSUFBSSxRQUFRLEVBQ2Y7WUFDRSxJQUFJLEVBQUUsR0FBRyxJQUFJLFdBQVc7WUFDeEIsV0FBVyxFQUFFLGlCQUFpQjtZQUM5QixPQUFPLEVBQUUsSUFBSTtZQUNiLFVBQVUsRUFBRTtnQkFDVjtvQkFDRSxJQUFJLEVBQUUsSUFBSTtvQkFDVixJQUFJLEVBQUUsR0FBRztpQkFDVjthQUNGO1lBQ0QsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1NBQ2hCLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixrQkFBa0I7UUFDbEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUNoQyxHQUFHLElBQUksY0FBYyxFQUNyQjtZQUNFLGdCQUFnQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQy9CLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixTQUFTLEVBQUU7b0JBQ1Q7d0JBQ0UsTUFBTSxFQUFFLGdCQUFnQjt3QkFDeEIsTUFBTSxFQUFFLE9BQU87d0JBQ2YsU0FBUyxFQUFFOzRCQUNULE9BQU8sRUFBRSxzQkFBc0I7eUJBQ2hDO3FCQUNGO2lCQUNGO2FBQ0YsQ0FBQztZQUNGLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtTQUNoQixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsbUNBQW1DO1FBQ25DLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FDOUIsR0FBRyxJQUFJLG9CQUFvQixFQUMzQjtZQUNFLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUk7WUFDMUIsU0FBUyxFQUNQLHNFQUFzRTtTQUN6RSxFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsdUJBQXVCO1FBQ3ZCLE1BQU0sWUFBWSxHQUFHLE1BQU07YUFDeEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2FBQ3ZDLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FDNUIsSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUNiLE9BQU8sRUFBRSxZQUFZO1lBQ3JCLFNBQVMsRUFBRTtnQkFDVDtvQkFDRSxNQUFNLEVBQUUsT0FBTztvQkFDZixNQUFNLEVBQUU7d0JBQ04sa0JBQWtCO3dCQUNsQixrQkFBa0I7d0JBQ2xCLHFCQUFxQjt3QkFDckIscUJBQXFCO3dCQUNyQixnQkFBZ0I7d0JBQ2hCLGVBQWU7cUJBQ2hCO29CQUNELFFBQVEsRUFBRSxRQUFRO2lCQUNuQjtnQkFDRDtvQkFDRSxNQUFNLEVBQUUsT0FBTztvQkFDZixNQUFNLEVBQUUsYUFBYTtvQkFDckIsUUFBUSxFQUFFLE1BQU07aUJBQ2pCO2dCQUNEO29CQUNFLE1BQU0sRUFBRSxPQUFPO29CQUNmLE1BQU0sRUFBRTt3QkFDTixxQkFBcUI7d0JBQ3JCLHNCQUFzQjt3QkFDdEIsbUJBQW1CO3FCQUNwQjtvQkFDRCxRQUFRLEVBQUUsR0FBRztpQkFDZDthQUNGO1NBQ0YsQ0FBQyxDQUNILENBQUM7UUFFSixJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUNwQixHQUFHLElBQUksZ0JBQWdCLEVBQ3ZCO1lBQ0UsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUN4QixNQUFNLEVBQUUsWUFBWTtTQUNyQixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsa0JBQWtCO1FBQ2xCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUV4QyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQzNDLEdBQUcsSUFBSSxXQUFXLEVBQ2xCO1lBQ0UsSUFBSSxFQUFFLEdBQUcsSUFBSSxXQUFXO1lBQ3hCLE9BQU8sRUFBRSxZQUFZO1lBQ3JCLElBQUksRUFBRSxJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDO2dCQUNsQyxVQUFVLEVBQUUsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUM7YUFDckQsQ0FBQztZQUNGLE9BQU8sRUFBRSxlQUFlO1lBQ3hCLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUc7WUFDekIsT0FBTyxFQUFFLEVBQUU7WUFDWCxVQUFVLEVBQUUsR0FBRztZQUNmLFNBQVMsRUFBRTtnQkFDVCxTQUFTLEVBQUUsSUFBSSxDQUFDLGdCQUFnQjtnQkFDaEMsZ0JBQWdCLEVBQUUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDO2FBQ3pDO1lBQ0QsV0FBVyxFQUFFO2dCQUNYLFNBQVMsRUFBRTtvQkFDVCxVQUFVLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJO29CQUMzQixhQUFhLEVBQUUsSUFBSSxDQUFDLFdBQVc7aUJBQ2hDO2FBQ0Y7WUFDRCxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7U0FDaEIsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLHVCQUF1QjtRQUN2QixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQzFDLEdBQUcsSUFBSSxNQUFNLEVBQ2I7WUFDRSxJQUFJLEVBQUUsR0FBRyxJQUFJLE1BQU07WUFDbkIsV0FBVyxFQUFFLGdDQUFnQztZQUM3QyxxQkFBcUIsRUFBRTtnQkFDckIsS0FBSyxFQUFFLFVBQVU7YUFDbEI7WUFDRCxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7U0FDaEIsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLGtDQUFrQztRQUNsQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQzVDLEdBQUcsSUFBSSxlQUFlLEVBQ3RCO1lBQ0UsT0FBTyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUMzQixRQUFRLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxjQUFjO1lBQ3hDLFFBQVEsRUFBRSxPQUFPO1NBQ2xCLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRix1Q0FBdUM7UUFDdkMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUM5QyxHQUFHLElBQUksa0JBQWtCLEVBQ3pCO1lBQ0UsT0FBTyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUMzQixRQUFRLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQzdCLFFBQVEsRUFBRSxNQUFNO1NBQ2pCLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRix3QkFBd0I7UUFDeEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUN4QyxHQUFHLElBQUksYUFBYSxFQUNwQjtZQUNFLE9BQU8sRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDM0IsVUFBVSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUMvQixVQUFVLEVBQUUsS0FBSztZQUNqQixhQUFhLEVBQUUsTUFBTTtTQUN0QixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYseUJBQXlCO1FBQ3pCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FDekMsR0FBRyxJQUFJLGNBQWMsRUFDckI7WUFDRSxPQUFPLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQzNCLFVBQVUsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDL0IsVUFBVSxFQUFFLE1BQU07WUFDbEIsYUFBYSxFQUFFLE1BQU07U0FDdEIsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLDZCQUE2QjtRQUM3QixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQzVDLEdBQUcsSUFBSSxrQkFBa0IsRUFDekI7WUFDRSxPQUFPLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQzNCLFVBQVUsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUU7WUFDakMsVUFBVSxFQUFFLEtBQUs7WUFDakIsYUFBYSxFQUFFLE1BQU07WUFDckIsaUJBQWlCLEVBQUU7Z0JBQ2pCLHdCQUF3QixFQUFFLElBQUk7YUFDL0I7U0FDRixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsNkJBQTZCO1FBQzdCLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVwQywrRUFBK0U7UUFDL0UsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUNoRCxHQUFHLElBQUksaUJBQWlCLEVBQ3hCO1lBQ0UsT0FBTyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTtTQUM1QixFQUNEO1lBQ0UsTUFBTSxFQUFFLElBQUk7WUFDWixTQUFTLEVBQUU7Z0JBQ1QsSUFBSSxDQUFDLFNBQVM7Z0JBQ2QsSUFBSSxDQUFDLFVBQVU7Z0JBQ2YsSUFBSSxDQUFDLGFBQWE7Z0JBQ2xCLElBQUksQ0FBQyxjQUFjO2dCQUNuQixJQUFJLENBQUMsZUFBZTtnQkFDcEIsSUFBSSxDQUFDLGtCQUFrQjthQUN4QjtTQUNGLENBQ0YsQ0FBQztRQUVGLDZDQUE2QztRQUM3QyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUN0QixHQUFHLElBQUksWUFBWSxFQUNuQjtZQUNFLFVBQVUsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUU7WUFDakMsT0FBTyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUMzQixTQUFTLEVBQUUsSUFBSTtTQUNoQixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsb0NBQW9DO1FBQ3BDLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQ3ZCLEdBQUcsSUFBSSx3QkFBd0IsRUFDL0I7WUFDRSxNQUFNLEVBQUUsdUJBQXVCO1lBQy9CLFFBQVEsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUk7WUFDbEMsU0FBUyxFQUFFLDBCQUEwQjtZQUNyQyxTQUFTLEVBQUUsTUFBTSxDQUFDLFdBQVcsQ0FBQSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxNQUFNO1NBQ25FLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ25CLFNBQVMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUk7WUFDMUIsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJO1lBQzVDLGFBQWEsRUFBRSxNQUFNLENBQUMsV0FBVyxDQUFBLFdBQVcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLGdCQUFnQixHQUFHLENBQUMsU0FBUyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxtQkFBbUI7WUFDbEksWUFBWSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTtTQUNqQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRU8sd0JBQXdCLENBQUMsSUFBWTtRQUMzQyx5QkFBeUI7UUFDekIsTUFBTSxjQUFjLEdBQUcsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FDbkQsR0FBRyxJQUFJLGtCQUFrQixFQUN6QjtZQUNFLE9BQU8sRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDM0IsVUFBVSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUMvQixVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVO1lBQ3JDLHFCQUFxQixFQUFFLE1BQU07WUFDN0IsSUFBSSxFQUFFLFdBQVc7WUFDakIsR0FBRyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUztTQUNuQyxFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsMEJBQTBCO1FBQzFCLE1BQU0sZUFBZSxHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQ3BELEdBQUcsSUFBSSxtQkFBbUIsRUFDMUI7WUFDRSxPQUFPLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQzNCLFVBQVUsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDL0IsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVTtZQUN0QyxxQkFBcUIsRUFBRSxNQUFNO1lBQzdCLElBQUksRUFBRSxXQUFXO1lBQ2pCLEdBQUcsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVM7U0FDbkMsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLDhCQUE4QjtRQUM5QixNQUFNLGtCQUFrQixHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQ3ZELEdBQUcsSUFBSSx1QkFBdUIsRUFDOUI7WUFDRSxPQUFPLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQzNCLFVBQVUsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUU7WUFDakMsVUFBVSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVTtZQUN6QyxxQkFBcUIsRUFBRSxNQUFNO1lBQzdCLElBQUksRUFBRSxXQUFXO1lBQ2pCLEdBQUcsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVM7U0FDbkMsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLDREQUE0RDtRQUM1RCxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUM1QyxLQUFLLEVBQUUsY0FBYztZQUNyQixRQUFRLEVBQUUsS0FBSztZQUNmLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLFlBQVksRUFBRSxLQUFLO1NBQ3BCLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQzdDLEtBQUssRUFBRSxlQUFlO1lBQ3RCLFFBQVEsRUFBRSxLQUFLO1lBQ2YsVUFBVSxFQUFFLElBQUk7WUFDaEIsWUFBWSxFQUFFLEtBQUs7U0FDcEIsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDaEQsS0FBSyxFQUFFLGtCQUFrQjtZQUN6QixRQUFRLEVBQUUsS0FBSztZQUNmLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLFlBQVksRUFBRSxLQUFLO1NBQ3BCLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFTyxhQUFhO1FBQ25CLE9BQU87Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBcUpWLENBQUM7SUFDQSxDQUFDO0NBQ0Y7QUE5ZUQsc0RBOGVDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gbGliL2NvbXBvbmVudHMvYmFja2VuZC50c1xuXG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcblxuZXhwb3J0IGludGVyZmFjZSBCYWNrZW5kSW5mcmFzdHJ1Y3R1cmVBcmdzIHtcbiAgdnBjSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHJpdmF0ZVN1Ym5ldElkczogcHVsdW1pLk91dHB1dDxzdHJpbmc+W107XG4gIHZwY0VuZHBvaW50U2dJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBzbnNUb3BpY0FybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICB0YWdzOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9O1xufVxuXG5leHBvcnQgY2xhc3MgQmFja2VuZEluZnJhc3RydWN0dXJlIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IHRhYmxlOiBhd3MuZHluYW1vZGIuVGFibGU7XG4gIHB1YmxpYyByZWFkb25seSBsYW1iZGFSb2xlOiBhd3MuaWFtLlJvbGU7XG4gIHB1YmxpYyByZWFkb25seSBsYW1iZGFGdW5jdGlvbjogYXdzLmxhbWJkYS5GdW5jdGlvbjtcbiAgcHVibGljIHJlYWRvbmx5IGFwaUdhdGV3YXk6IGF3cy5hcGlnYXRld2F5LlJlc3RBcGk7XG4gIHB1YmxpYyByZWFkb25seSBhcGlSZXNvdXJjZTogYXdzLmFwaWdhdGV3YXkuUmVzb3VyY2U7XG4gIHB1YmxpYyByZWFkb25seSBhcGlSZXNvdXJjZUlkOiBhd3MuYXBpZ2F0ZXdheS5SZXNvdXJjZTtcbiAgcHVibGljIHJlYWRvbmx5IGdldE1ldGhvZDogYXdzLmFwaWdhdGV3YXkuTWV0aG9kO1xuICBwdWJsaWMgcmVhZG9ubHkgcG9zdE1ldGhvZDogYXdzLmFwaWdhdGV3YXkuTWV0aG9kO1xuICBwdWJsaWMgcmVhZG9ubHkgZ2V0SXRlbU1ldGhvZDogYXdzLmFwaWdhdGV3YXkuTWV0aG9kO1xuICBwdWJsaWMgcmVhZG9ubHkgZ2V0SW50ZWdyYXRpb246IGF3cy5hcGlnYXRld2F5LkludGVncmF0aW9uO1xuICBwdWJsaWMgcmVhZG9ubHkgcG9zdEludGVncmF0aW9uOiBhd3MuYXBpZ2F0ZXdheS5JbnRlZ3JhdGlvbjtcbiAgcHVibGljIHJlYWRvbmx5IGdldEl0ZW1JbnRlZ3JhdGlvbjogYXdzLmFwaWdhdGV3YXkuSW50ZWdyYXRpb247XG4gIHB1YmxpYyByZWFkb25seSBhcGlEZXBsb3ltZW50OiBhd3MuYXBpZ2F0ZXdheS5EZXBsb3ltZW50O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBCYWNrZW5kSW5mcmFzdHJ1Y3R1cmVBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdjdXN0b206YmFja2VuZDpJbmZyYXN0cnVjdHVyZScsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIC8vIER5bmFtb0RCIFRhYmxlXG4gICAgdGhpcy50YWJsZSA9IG5ldyBhd3MuZHluYW1vZGIuVGFibGUoXG4gICAgICBgJHtuYW1lfS10YWJsZWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGAke25hbWV9LWFwcC1kYXRhYCxcbiAgICAgICAgYmlsbGluZ01vZGU6ICdQQVlfUEVSX1JFUVVFU1QnLFxuICAgICAgICBoYXNoS2V5OiAnaWQnLFxuICAgICAgICBhdHRyaWJ1dGVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ2lkJyxcbiAgICAgICAgICAgIHR5cGU6ICdTJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBMYW1iZGEgSUFNIFJvbGVcbiAgICB0aGlzLmxhbWJkYVJvbGUgPSBuZXcgYXdzLmlhbS5Sb2xlKFxuICAgICAgYCR7bmFtZX0tbGFtYmRhLXJvbGVgLFxuICAgICAge1xuICAgICAgICBhc3N1bWVSb2xlUG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgU2VydmljZTogJ2xhbWJkYS5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEF0dGFjaCBWUEMgZXhlY3V0aW9uIHJvbGUgcG9saWN5XG4gICAgbmV3IGF3cy5pYW0uUm9sZVBvbGljeUF0dGFjaG1lbnQoXG4gICAgICBgJHtuYW1lfS1sYW1iZGEtdnBjLXBvbGljeWAsXG4gICAgICB7XG4gICAgICAgIHJvbGU6IHRoaXMubGFtYmRhUm9sZS5uYW1lLFxuICAgICAgICBwb2xpY3lBcm46XG4gICAgICAgICAgJ2Fybjphd3M6aWFtOjphd3M6cG9saWN5L3NlcnZpY2Utcm9sZS9BV1NMYW1iZGFWUENBY2Nlc3NFeGVjdXRpb25Sb2xlJyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIExhbWJkYSBjdXN0b20gcG9saWN5XG4gICAgY29uc3QgbGFtYmRhUG9saWN5ID0gcHVsdW1pXG4gICAgICAuYWxsKFt0aGlzLnRhYmxlLmFybiwgYXJncy5zbnNUb3BpY0Fybl0pXG4gICAgICAuYXBwbHkoKFt0YWJsZUFybiwgc25zQXJuXSkgPT5cbiAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAnZHluYW1vZGI6UHV0SXRlbScsXG4gICAgICAgICAgICAgICAgJ2R5bmFtb2RiOkdldEl0ZW0nLFxuICAgICAgICAgICAgICAgICdkeW5hbW9kYjpVcGRhdGVJdGVtJyxcbiAgICAgICAgICAgICAgICAnZHluYW1vZGI6RGVsZXRlSXRlbScsXG4gICAgICAgICAgICAgICAgJ2R5bmFtb2RiOlF1ZXJ5JyxcbiAgICAgICAgICAgICAgICAnZHluYW1vZGI6U2NhbicsXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIFJlc291cmNlOiB0YWJsZUFybixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgQWN0aW9uOiAnc25zOlB1Ymxpc2gnLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogc25zQXJuLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAnbG9nczpDcmVhdGVMb2dHcm91cCcsXG4gICAgICAgICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nU3RyZWFtJyxcbiAgICAgICAgICAgICAgICAnbG9nczpQdXRMb2dFdmVudHMnLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogJyonLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIG5ldyBhd3MuaWFtLlJvbGVQb2xpY3koXG4gICAgICBgJHtuYW1lfS1sYW1iZGEtcG9saWN5YCxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogdGhpcy5sYW1iZGFSb2xlLmlkLFxuICAgICAgICBwb2xpY3k6IGxhbWJkYVBvbGljeSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIExhbWJkYSBGdW5jdGlvblxuICAgIGNvbnN0IGxhbWJkYUNvZGUgPSB0aGlzLmdldExhbWJkYUNvZGUoKTtcblxuICAgIHRoaXMubGFtYmRhRnVuY3Rpb24gPSBuZXcgYXdzLmxhbWJkYS5GdW5jdGlvbihcbiAgICAgIGAke25hbWV9LWZ1bmN0aW9uYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYCR7bmFtZX0tZnVuY3Rpb25gLFxuICAgICAgICBydW50aW1lOiAnbm9kZWpzMTgueCcsXG4gICAgICAgIGNvZGU6IG5ldyBwdWx1bWkuYXNzZXQuQXNzZXRBcmNoaXZlKHtcbiAgICAgICAgICAnaW5kZXguanMnOiBuZXcgcHVsdW1pLmFzc2V0LlN0cmluZ0Fzc2V0KGxhbWJkYUNvZGUpLFxuICAgICAgICB9KSxcbiAgICAgICAgaGFuZGxlcjogJ2luZGV4LmhhbmRsZXInLFxuICAgICAgICByb2xlOiB0aGlzLmxhbWJkYVJvbGUuYXJuLFxuICAgICAgICB0aW1lb3V0OiAzMCxcbiAgICAgICAgbWVtb3J5U2l6ZTogMjU2LFxuICAgICAgICB2cGNDb25maWc6IHtcbiAgICAgICAgICBzdWJuZXRJZHM6IGFyZ3MucHJpdmF0ZVN1Ym5ldElkcyxcbiAgICAgICAgICBzZWN1cml0eUdyb3VwSWRzOiBbYXJncy52cGNFbmRwb2ludFNnSWRdLFxuICAgICAgICB9LFxuICAgICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgVEFCTEVfTkFNRTogdGhpcy50YWJsZS5uYW1lLFxuICAgICAgICAgICAgU05TX1RPUElDX0FSTjogYXJncy5zbnNUb3BpY0FybixcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBBUEkgR2F0ZXdheSBSRVNUIEFQSVxuICAgIHRoaXMuYXBpR2F0ZXdheSA9IG5ldyBhd3MuYXBpZ2F0ZXdheS5SZXN0QXBpKFxuICAgICAgYCR7bmFtZX0tYXBpYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYCR7bmFtZX0tYXBpYCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdNdWx0aS10aWVyIHdlYiBhcHBsaWNhdGlvbiBBUEknLFxuICAgICAgICBlbmRwb2ludENvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgICB0eXBlczogJ1JFR0lPTkFMJyxcbiAgICAgICAgfSxcbiAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQVBJIEdhdGV3YXkgcmVzb3VyY2UgZm9yIC9pdGVtc1xuICAgIHRoaXMuYXBpUmVzb3VyY2UgPSBuZXcgYXdzLmFwaWdhdGV3YXkuUmVzb3VyY2UoXG4gICAgICBgJHtuYW1lfS1hcGktcmVzb3VyY2VgLFxuICAgICAge1xuICAgICAgICByZXN0QXBpOiB0aGlzLmFwaUdhdGV3YXkuaWQsXG4gICAgICAgIHBhcmVudElkOiB0aGlzLmFwaUdhdGV3YXkucm9vdFJlc291cmNlSWQsXG4gICAgICAgIHBhdGhQYXJ0OiAnaXRlbXMnLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQVBJIEdhdGV3YXkgcmVzb3VyY2UgZm9yIC9pdGVtcy97aWR9XG4gICAgdGhpcy5hcGlSZXNvdXJjZUlkID0gbmV3IGF3cy5hcGlnYXRld2F5LlJlc291cmNlKFxuICAgICAgYCR7bmFtZX0tYXBpLXJlc291cmNlLWlkYCxcbiAgICAgIHtcbiAgICAgICAgcmVzdEFwaTogdGhpcy5hcGlHYXRld2F5LmlkLFxuICAgICAgICBwYXJlbnRJZDogdGhpcy5hcGlSZXNvdXJjZS5pZCxcbiAgICAgICAgcGF0aFBhcnQ6ICd7aWR9JyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEdFVCBtZXRob2QgZm9yIC9pdGVtc1xuICAgIHRoaXMuZ2V0TWV0aG9kID0gbmV3IGF3cy5hcGlnYXRld2F5Lk1ldGhvZChcbiAgICAgIGAke25hbWV9LWdldC1tZXRob2RgLFxuICAgICAge1xuICAgICAgICByZXN0QXBpOiB0aGlzLmFwaUdhdGV3YXkuaWQsXG4gICAgICAgIHJlc291cmNlSWQ6IHRoaXMuYXBpUmVzb3VyY2UuaWQsXG4gICAgICAgIGh0dHBNZXRob2Q6ICdHRVQnLFxuICAgICAgICBhdXRob3JpemF0aW9uOiAnTk9ORScsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBQT1NUIG1ldGhvZCBmb3IgL2l0ZW1zXG4gICAgdGhpcy5wb3N0TWV0aG9kID0gbmV3IGF3cy5hcGlnYXRld2F5Lk1ldGhvZChcbiAgICAgIGAke25hbWV9LXBvc3QtbWV0aG9kYCxcbiAgICAgIHtcbiAgICAgICAgcmVzdEFwaTogdGhpcy5hcGlHYXRld2F5LmlkLFxuICAgICAgICByZXNvdXJjZUlkOiB0aGlzLmFwaVJlc291cmNlLmlkLFxuICAgICAgICBodHRwTWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIGF1dGhvcml6YXRpb246ICdOT05FJyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEdFVCBtZXRob2QgZm9yIC9pdGVtcy97aWR9XG4gICAgdGhpcy5nZXRJdGVtTWV0aG9kID0gbmV3IGF3cy5hcGlnYXRld2F5Lk1ldGhvZChcbiAgICAgIGAke25hbWV9LWdldC1pdGVtLW1ldGhvZGAsXG4gICAgICB7XG4gICAgICAgIHJlc3RBcGk6IHRoaXMuYXBpR2F0ZXdheS5pZCxcbiAgICAgICAgcmVzb3VyY2VJZDogdGhpcy5hcGlSZXNvdXJjZUlkLmlkLFxuICAgICAgICBodHRwTWV0aG9kOiAnR0VUJyxcbiAgICAgICAgYXV0aG9yaXphdGlvbjogJ05PTkUnLFxuICAgICAgICByZXF1ZXN0UGFyYW1ldGVyczoge1xuICAgICAgICAgICdtZXRob2QucmVxdWVzdC5wYXRoLmlkJzogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBMYW1iZGEgaW50ZWdyYXRpb25zXG4gICAgdGhpcy5jcmVhdGVMYW1iZGFJbnRlZ3JhdGlvbnMobmFtZSk7XG5cbiAgICAvLyBBUEkgR2F0ZXdheSBkZXBsb3ltZW50IC0gRml4ZWQ6IHJlbW92ZWQgc3RhZ2VOYW1lIGFuZCBjcmVhdGVkIHNlcGFyYXRlIHN0YWdlXG4gICAgdGhpcy5hcGlEZXBsb3ltZW50ID0gbmV3IGF3cy5hcGlnYXRld2F5LkRlcGxveW1lbnQoXG4gICAgICBgJHtuYW1lfS1hcGktZGVwbG95bWVudGAsXG4gICAgICB7XG4gICAgICAgIHJlc3RBcGk6IHRoaXMuYXBpR2F0ZXdheS5pZCxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHBhcmVudDogdGhpcyxcbiAgICAgICAgZGVwZW5kc09uOiBbXG4gICAgICAgICAgdGhpcy5nZXRNZXRob2QsXG4gICAgICAgICAgdGhpcy5wb3N0TWV0aG9kLFxuICAgICAgICAgIHRoaXMuZ2V0SXRlbU1ldGhvZCxcbiAgICAgICAgICB0aGlzLmdldEludGVncmF0aW9uLFxuICAgICAgICAgIHRoaXMucG9zdEludGVncmF0aW9uLFxuICAgICAgICAgIHRoaXMuZ2V0SXRlbUludGVncmF0aW9uLFxuICAgICAgICBdLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgYSBzZXBhcmF0ZSBzdGFnZSBmb3IgdGhlIGRlcGxveW1lbnRcbiAgICBuZXcgYXdzLmFwaWdhdGV3YXkuU3RhZ2UoXG4gICAgICBgJHtuYW1lfS1hcGktc3RhZ2VgLFxuICAgICAge1xuICAgICAgICBkZXBsb3ltZW50OiB0aGlzLmFwaURlcGxveW1lbnQuaWQsXG4gICAgICAgIHJlc3RBcGk6IHRoaXMuYXBpR2F0ZXdheS5pZCxcbiAgICAgICAgc3RhZ2VOYW1lOiAndjEnLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gTGFtYmRhIHBlcm1pc3Npb24gZm9yIEFQSSBHYXRld2F5XG4gICAgbmV3IGF3cy5sYW1iZGEuUGVybWlzc2lvbihcbiAgICAgIGAke25hbWV9LWFwaS1sYW1iZGEtcGVybWlzc2lvbmAsXG4gICAgICB7XG4gICAgICAgIGFjdGlvbjogJ2xhbWJkYTpJbnZva2VGdW5jdGlvbicsXG4gICAgICAgIGZ1bmN0aW9uOiB0aGlzLmxhbWJkYUZ1bmN0aW9uLm5hbWUsXG4gICAgICAgIHByaW5jaXBhbDogJ2FwaWdhdGV3YXkuYW1hem9uYXdzLmNvbScsXG4gICAgICAgIHNvdXJjZUFybjogcHVsdW1pLmludGVycG9sYXRlYCR7dGhpcy5hcGlHYXRld2F5LmV4ZWN1dGlvbkFybn0vKi8qYCxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIHRhYmxlTmFtZTogdGhpcy50YWJsZS5uYW1lLFxuICAgICAgbGFtYmRhRnVuY3Rpb25OYW1lOiB0aGlzLmxhbWJkYUZ1bmN0aW9uLm5hbWUsXG4gICAgICBhcGlHYXRld2F5VXJsOiBwdWx1bWkuaW50ZXJwb2xhdGVgaHR0cHM6Ly8ke3RoaXMuYXBpR2F0ZXdheS5pZH0uZXhlY3V0ZS1hcGkuJHthd3MuZ2V0UmVnaW9uKCkudGhlbihyID0+IHIubmFtZSl9LmFtYXpvbmF3cy5jb20vdjFgLFxuICAgICAgYXBpR2F0ZXdheUlkOiB0aGlzLmFwaUdhdGV3YXkuaWQsXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUxhbWJkYUludGVncmF0aW9ucyhuYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAvLyBHRVQgL2l0ZW1zIGludGVncmF0aW9uXG4gICAgY29uc3QgZ2V0SW50ZWdyYXRpb24gPSBuZXcgYXdzLmFwaWdhdGV3YXkuSW50ZWdyYXRpb24oXG4gICAgICBgJHtuYW1lfS1nZXQtaW50ZWdyYXRpb25gLFxuICAgICAge1xuICAgICAgICByZXN0QXBpOiB0aGlzLmFwaUdhdGV3YXkuaWQsXG4gICAgICAgIHJlc291cmNlSWQ6IHRoaXMuYXBpUmVzb3VyY2UuaWQsXG4gICAgICAgIGh0dHBNZXRob2Q6IHRoaXMuZ2V0TWV0aG9kLmh0dHBNZXRob2QsXG4gICAgICAgIGludGVncmF0aW9uSHR0cE1ldGhvZDogJ1BPU1QnLFxuICAgICAgICB0eXBlOiAnQVdTX1BST1hZJyxcbiAgICAgICAgdXJpOiB0aGlzLmxhbWJkYUZ1bmN0aW9uLmludm9rZUFybixcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIFBPU1QgL2l0ZW1zIGludGVncmF0aW9uXG4gICAgY29uc3QgcG9zdEludGVncmF0aW9uID0gbmV3IGF3cy5hcGlnYXRld2F5LkludGVncmF0aW9uKFxuICAgICAgYCR7bmFtZX0tcG9zdC1pbnRlZ3JhdGlvbmAsXG4gICAgICB7XG4gICAgICAgIHJlc3RBcGk6IHRoaXMuYXBpR2F0ZXdheS5pZCxcbiAgICAgICAgcmVzb3VyY2VJZDogdGhpcy5hcGlSZXNvdXJjZS5pZCxcbiAgICAgICAgaHR0cE1ldGhvZDogdGhpcy5wb3N0TWV0aG9kLmh0dHBNZXRob2QsXG4gICAgICAgIGludGVncmF0aW9uSHR0cE1ldGhvZDogJ1BPU1QnLFxuICAgICAgICB0eXBlOiAnQVdTX1BST1hZJyxcbiAgICAgICAgdXJpOiB0aGlzLmxhbWJkYUZ1bmN0aW9uLmludm9rZUFybixcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEdFVCAvaXRlbXMve2lkfSBpbnRlZ3JhdGlvblxuICAgIGNvbnN0IGdldEl0ZW1JbnRlZ3JhdGlvbiA9IG5ldyBhd3MuYXBpZ2F0ZXdheS5JbnRlZ3JhdGlvbihcbiAgICAgIGAke25hbWV9LWdldC1pdGVtLWludGVncmF0aW9uYCxcbiAgICAgIHtcbiAgICAgICAgcmVzdEFwaTogdGhpcy5hcGlHYXRld2F5LmlkLFxuICAgICAgICByZXNvdXJjZUlkOiB0aGlzLmFwaVJlc291cmNlSWQuaWQsXG4gICAgICAgIGh0dHBNZXRob2Q6IHRoaXMuZ2V0SXRlbU1ldGhvZC5odHRwTWV0aG9kLFxuICAgICAgICBpbnRlZ3JhdGlvbkh0dHBNZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgdHlwZTogJ0FXU19QUk9YWScsXG4gICAgICAgIHVyaTogdGhpcy5sYW1iZGFGdW5jdGlvbi5pbnZva2VBcm4sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBBc3NpZ24gdG8gcmVhZG9ubHkgcHJvcGVydGllcyB1c2luZyBPYmplY3QuZGVmaW5lUHJvcGVydHlcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ2dldEludGVncmF0aW9uJywge1xuICAgICAgdmFsdWU6IGdldEludGVncmF0aW9uLFxuICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gICAgfSk7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ3Bvc3RJbnRlZ3JhdGlvbicsIHtcbiAgICAgIHZhbHVlOiBwb3N0SW50ZWdyYXRpb24sXG4gICAgICB3cml0YWJsZTogZmFsc2UsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICB9KTtcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCAnZ2V0SXRlbUludGVncmF0aW9uJywge1xuICAgICAgdmFsdWU6IGdldEl0ZW1JbnRlZ3JhdGlvbixcbiAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICBjb25maWd1cmFibGU6IGZhbHNlLFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRMYW1iZGFDb2RlKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBcbmNvbnN0IEFXUyA9IHJlcXVpcmUoJ2F3cy1zZGsnKTtcbmNvbnN0IHsgdjQ6IHV1aWR2NCB9ID0gcmVxdWlyZSgndXVpZCcpO1xuXG5jb25zdCBkeW5hbW9kYiA9IG5ldyBBV1MuRHluYW1vREIuRG9jdW1lbnRDbGllbnQoKTtcbmNvbnN0IHNucyA9IG5ldyBBV1MuU05TKCk7XG5cbmNvbnN0IFRBQkxFX05BTUUgPSBwcm9jZXNzLmVudi5UQUJMRV9OQU1FO1xuY29uc3QgU05TX1RPUElDX0FSTiA9IHByb2Nlc3MuZW52LlNOU19UT1BJQ19BUk47XG5cbmV4cG9ydHMuaGFuZGxlciA9IGFzeW5jIChldmVudCwgY29udGV4dCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdSZWNlaXZlZCBldmVudDonLCBKU09OLnN0cmluZ2lmeShldmVudCkpO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGh0dHBNZXRob2QgPSBldmVudC5odHRwTWV0aG9kO1xuICAgICAgICBjb25zdCBwYXRoID0gZXZlbnQucGF0aDtcbiAgICAgICAgXG4gICAgICAgIGlmIChodHRwTWV0aG9kID09PSAnR0VUJyAmJiBwYXRoID09PSAnL2l0ZW1zJykge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IGdldEFsbEl0ZW1zKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoaHR0cE1ldGhvZCA9PT0gJ1BPU1QnICYmIHBhdGggPT09ICcvaXRlbXMnKSB7XG4gICAgICAgICAgICByZXR1cm4gYXdhaXQgY3JlYXRlSXRlbShldmVudCk7XG4gICAgICAgIH0gZWxzZSBpZiAoaHR0cE1ldGhvZCA9PT0gJ0dFVCcgJiYgcGF0aC5pbmNsdWRlcygnL2l0ZW1zLycpKSB7XG4gICAgICAgICAgICBjb25zdCBpdGVtSWQgPSBldmVudC5wYXRoUGFyYW1ldGVycy5pZDtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBnZXRJdGVtKGl0ZW1JZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IDQwNCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKidcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgbWVzc2FnZTogJ0VuZHBvaW50IG5vdCBmb3VuZCcgfSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3I6JywgZXJyb3IubWVzc2FnZSk7XG4gICAgICAgIFxuICAgICAgICAvLyBTZW5kIGVycm9yIG5vdGlmaWNhdGlvblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgc25zLnB1Ymxpc2goe1xuICAgICAgICAgICAgICAgIFRvcGljQXJuOiBTTlNfVE9QSUNfQVJOLFxuICAgICAgICAgICAgICAgIE1lc3NhZ2U6IFxcYExhbWJkYSBmdW5jdGlvbiBlcnJvcjogXFwke2Vycm9yLm1lc3NhZ2V9XFxgLFxuICAgICAgICAgICAgICAgIFN1YmplY3Q6ICdCYWNrZW5kIEFQSSBFcnJvcidcbiAgICAgICAgICAgIH0pLnByb21pc2UoKTtcbiAgICAgICAgfSBjYXRjaCAoc25zRXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBzZW5kIFNOUyBub3RpZmljYXRpb246Jywgc25zRXJyb3IpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhdHVzQ29kZTogNTAwLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgbWVzc2FnZTogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSlcbiAgICAgICAgfTtcbiAgICB9XG59O1xuXG5hc3luYyBmdW5jdGlvbiBnZXRBbGxJdGVtcygpIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGR5bmFtb2RiLnNjYW4oe1xuICAgICAgICAgICAgVGFibGVOYW1lOiBUQUJMRV9OQU1FXG4gICAgICAgIH0pLnByb21pc2UoKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGl0ZW1zID0gcmVzcG9uc2UuSXRlbXMgfHwgW107XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICBpdGVtczogaXRlbXMsXG4gICAgICAgICAgICAgICAgY291bnQ6IGl0ZW1zLmxlbmd0aFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBnZXR0aW5nIGl0ZW1zOicsIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUl0ZW0oZXZlbnQpIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBib2R5ID0gSlNPTi5wYXJzZShldmVudC5ib2R5KTtcbiAgICAgICAgY29uc3QgaXRlbUlkID0gdXVpZHY0KCk7XG4gICAgICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGl0ZW0gPSB7XG4gICAgICAgICAgICBpZDogaXRlbUlkLFxuICAgICAgICAgICAgbmFtZTogYm9keS5uYW1lIHx8ICcnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGJvZHkuZGVzY3JpcHRpb24gfHwgJycsXG4gICAgICAgICAgICBjcmVhdGVkX2F0OiBub3csXG4gICAgICAgICAgICB1cGRhdGVkX2F0OiBub3dcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIGF3YWl0IGR5bmFtb2RiLnB1dCh7XG4gICAgICAgICAgICBUYWJsZU5hbWU6IFRBQkxFX05BTUUsXG4gICAgICAgICAgICBJdGVtOiBpdGVtXG4gICAgICAgIH0pLnByb21pc2UoKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGF0dXNDb2RlOiAyMDEsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoaXRlbSlcbiAgICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBjcmVhdGluZyBpdGVtOicsIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldEl0ZW0oaXRlbUlkKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBkeW5hbW9kYi5nZXQoe1xuICAgICAgICAgICAgVGFibGVOYW1lOiBUQUJMRV9OQU1FLFxuICAgICAgICAgICAgS2V5OiB7IGlkOiBpdGVtSWQgfVxuICAgICAgICB9KS5wcm9taXNlKCk7XG4gICAgICAgIFxuICAgICAgICBpZiAocmVzcG9uc2UuSXRlbSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAgICAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXNwb25zZS5JdGVtKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogNDA0LFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAgICAgICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBtZXNzYWdlOiAnSXRlbSBub3QgZm91bmQnIH0pXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZ2V0dGluZyBpdGVtOicsIGVycm9yLm1lc3NhZ2UpO1xuICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG59XG5gO1xuICB9XG59XG4iXX0=