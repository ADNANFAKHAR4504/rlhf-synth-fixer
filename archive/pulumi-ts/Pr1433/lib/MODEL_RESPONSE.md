
Project Structure
src/
├── index.ts                 # Main entry point
├── components/
│   ├── network.ts          # VPC, subnets, security groups
│   ├── frontend.ts         # CloudFront, S3, Lambda@Edge
│   ├── backend.ts          # API Gateway, Lambda, DynamoDB
│   ├── streaming.ts        # Kinesis, processing Lambda
│   └── monitoring.ts       # CloudWatch, SNS
├── utils/
│   └── constants.ts        # Common constants and configurations
└── types/
    └── index.ts           # TypeScript type definitions
Implementation
```ts
1. Constants and Types (utils/constants.ts)
export const REGION = "us-west-2";
export const PROJECT_NAME = "secure-web-app";
export const ENVIRONMENT = "production";

export const TAGS = {
    Project: PROJECT_NAME,
    Environment: ENVIRONMENT,
    ManagedBy: "Pulumi",
};

export const VPC_CIDR = "10.0.0.0/16";
export const PUBLIC_SUBNET_CIDRS = ["10.0.1.0/24", "10.0.2.0/24"];
export const PRIVATE_SUBNET_CIDRS = ["10.0.10.0/24", "10.0.20.0/24"];

export const AVAILABILITY_ZONES = ["us-west-2a", "us-west-2b"];
2. Type Definitions (types/index.ts)
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export interface NetworkResources {
    vpc: aws.ec2.Vpc;
    publicSubnets: aws.ec2.Subnet[];
    privateSubnets: aws.ec2.Subnet[];
    internetGateway: aws.ec2.InternetGateway;
    natGateways: aws.ec2.NatGateway[];
    publicRouteTable: aws.ec2.RouteTable;
    privateRouteTables: aws.ec2.RouteTable[];
    lambdaSecurityGroup: aws.ec2.SecurityGroup;
    vpcEndpoints: {
        dynamodb: aws.ec2.VpcEndpoint;
        s3: aws.ec2.VpcEndpoint;
    };
}

export interface FrontendResources {
    bucket: aws.s3.Bucket;
    originAccessControl: aws.cloudfront.OriginAccessControl;
    distribution: aws.cloudfront.Distribution;
    edgeFunction?: aws.lambda.Function;
}

export interface BackendResources {
    api: aws.apigateway.RestApi;
    lambdaFunction: aws.lambda.Function;
    dynamoTable: aws.dynamodb.Table;
    lambdaRole: aws.iam.Role;
}

export interface StreamingResources {
    kinesisStream: aws.kinesis.Stream;
    processingLambda: aws.lambda.Function;
    outputBucket: aws.s3.Bucket;
    lambdaRole: aws.iam.Role;
}

export interface MonitoringResources {
    snsTopics: {
        alerts: aws.sns.Topic;
    };
    alarms: aws.cloudwatch.MetricAlarm[];
    logGroups: aws.cloudwatch.LogGroup[];
}
3. Network Infrastructure (components/network.ts)
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { NetworkResources } from "../types";
import { VPC_CIDR, PUBLIC_SUBNET_CIDRS, PRIVATE_SUBNET_CIDRS, AVAILABILITY_ZONES, TAGS } from "../utils/constants";

export class NetworkComponent extends pulumi.ComponentResource {
    public readonly resources: NetworkResources;

    constructor(name: string, opts?: pulumi.ComponentResourceOptions) {
        super("custom:network:NetworkComponent", name, {}, opts);

        // Create VPC
        const vpc = new aws.ec2.Vpc(`${name}-vpc`, {
            cidrBlock: VPC_CIDR,
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: { ...TAGS, Name: `${name}-vpc` },
        }, { parent: this });

        // Create Internet Gateway
        const internetGateway = new aws.ec2.InternetGateway(`${name}-igw`, {
            vpcId: vpc.id,
            tags: { ...TAGS, Name: `${name}-igw` },
        }, { parent: this });

        // Create public subnets
        const publicSubnets = PUBLIC_SUBNET_CIDRS.map((cidr, index) => 
            new aws.ec2.Subnet(`${name}-public-subnet-${index + 1}`, {
                vpcId: vpc.id,
                cidrBlock: cidr,
                availabilityZone: AVAILABILITY_ZONES[index],
                mapPublicIpOnLaunch: true,
                tags: { 
                    ...TAGS, 
                    Name: `${name}-public-subnet-${index + 1}`,
                    Type: "Public"
                },
            }, { parent: this })
        );

        // Create private subnets
        const privateSubnets = PRIVATE_SUBNET_CIDRS.map((cidr, index) => 
            new aws.ec2.Subnet(`${name}-private-subnet-${index + 1}`, {
                vpcId: vpc.id,
                cidrBlock: cidr,
                availabilityZone: AVAILABILITY_ZONES[index],
                tags: { 
                    ...TAGS, 
                    Name: `${name}-private-subnet-${index + 1}`,
                    Type: "Private"
                },
            }, { parent: this })
        );

        // Create Elastic IPs for NAT Gateways
        const eips = publicSubnets.map((_, index) => 
            new aws.ec2.Eip(`${name}-nat-eip-${index + 1}`, {
                domain: "vpc",
                tags: { ...TAGS, Name: `${name}-nat-eip-${index + 1}` },
            }, { parent: this })
        );

        // Create NAT Gateways
        const natGateways = publicSubnets.map((subnet, index) => 
            new aws.ec2.NatGateway(`${name}-nat-gw-${index + 1}`, {
                allocationId: eips[index].id,
                subnetId: subnet.id,
                tags: { ...TAGS, Name: `${name}-nat-gw-${index + 1}` },
            }, { parent: this })
        );

        // Create public route table
        const publicRouteTable = new aws.ec2.RouteTable(`${name}-public-rt`, {
            vpcId: vpc.id,
            routes: [{
                cidrBlock: "0.0.0.0/0",
                gatewayId: internetGateway.id,
            }],
            tags: { ...TAGS, Name: `${name}-public-rt` },
        }, { parent: this });

        // Associate public subnets with public route table
        publicSubnets.forEach((subnet, index) => 
            new aws.ec2.RouteTableAssociation(`${name}-public-rta-${index + 1}`, {
                subnetId: subnet.id,
                routeTableId: publicRouteTable.id,
            }, { parent: this })
        );

        // Create private route tables
        const privateRouteTables = natGateways.map((natGw, index) => 
            new aws.ec2.RouteTable(`${name}-private-rt-${index + 1}`, {
                vpcId: vpc.id,
                routes: [{
                    cidrBlock: "0.0.0.0/0",
                    natGatewayId: natGw.id,
                }],
                tags: { ...TAGS, Name: `${name}-private-rt-${index + 1}` },
            }, { parent: this })
        );

        // Associate private subnets with private route tables
        privateSubnets.forEach((subnet, index) => 
            new aws.ec2.RouteTableAssociation(`${name}-private-rta-${index + 1}`, {
                subnetId: subnet.id,
                routeTableId: privateRouteTables[index].id,
            }, { parent: this })
        );

        // Create security group for Lambda functions
        const lambdaSecurityGroup = new aws.ec2.SecurityGroup(`${name}-lambda-sg`, {
            vpcId: vpc.id,
            description: "Security group for Lambda functions",
            egress: [{
                protocol: "-1",
                fromPort: 0,
                toPort: 0,
                cidrBlocks: ["0.0.0.0/0"],
            }],
            tags: { ...TAGS, Name: `${name}-lambda-sg` },
        }, { parent: this });

        // Create VPC Endpoints
        const dynamodbEndpoint = new aws.ec2.VpcEndpoint(`${name}-dynamodb-endpoint`, {
            vpcId: vpc.id,
            serviceName: "com.amazonaws.us-west-2.dynamodb",
            vpcEndpointType: "Gateway",
            routeTableIds: privateRouteTables.map(rt => rt.id),
            tags: { ...TAGS, Name: `${name}-dynamodb-endpoint` },
        }, { parent: this });

        const s3Endpoint = new aws.ec2.VpcEndpoint(`${name}-s3-endpoint`, {
            vpcId: vpc.id,
            serviceName: "com.amazonaws.us-west-2.s3",
            vpcEndpointType: "Gateway",
            routeTableIds: privateRouteTables.map(rt => rt.id),
            tags: { ...TAGS, Name: `${name}-s3-endpoint` },
        }, { parent: this });

        this.resources = {
            vpc,
            publicSubnets,
            privateSubnets,
            internetGateway,
            natGateways,
            publicRouteTable,
            privateRouteTables,
            lambdaSecurityGroup,
            vpcEndpoints: {
                dynamodb: dynamodbEndpoint,
                s3: s3Endpoint,
            },
        };

        this.registerOutputs({
            vpcId: vpc.id,
            publicSubnetIds: pulumi.all(publicSubnets.map(s => s.id)),
            privateSubnetIds: pulumi.all(privateSubnets.map(s => s.id)),
        });
    }
}
4. Frontend Infrastructure (components/frontend.ts)
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { FrontendResources } from "../types";
import { TAGS } from "../utils/constants";

export class FrontendComponent extends pulumi.ComponentResource {
    public readonly resources: FrontendResources;

    constructor(name: string, opts?: pulumi.ComponentResourceOptions) {
        super("custom:frontend:FrontendComponent", name, {}, opts);

        // Create S3 bucket for static website hosting
        const bucket = new aws.s3.Bucket(`${name}-frontend-bucket`, {
            tags: TAGS,
        }, { parent: this });

        // Configure bucket for static website hosting
        new aws.s3.BucketWebsiteConfiguration(`${name}-website-config`, {
            bucket: bucket.id,
            indexDocument: {
                suffix: "index.html",
            },
            errorDocument: {
                key: "error.html",
            },
        }, { parent: this });

        // Block public access to S3 bucket (CloudFront will access via OAC)
        new aws.s3.BucketPublicAccessBlock(`${name}-bucket-pab`, {
            bucket: bucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, { parent: this });

        // Create Origin Access Control for CloudFront
        const originAccessControl = new aws.cloudfront.OriginAccessControl(`${name}-oac`, {
            name: `${name}-oac`,
            description: "OAC for S3 bucket access",
            originAccessControlOriginType: "s3",
            signingBehavior: "always",
            signingProtocol: "sigv4",
        }, { parent: this });

        // Create CloudFront distribution
        const distribution = new aws.cloudfront.Distribution(`${name}-distribution`, {
            origins: [{
                domainName: bucket.bucketDomainName,
                originId: "S3-origin",
                originAccessControlId: originAccessControl.id,
            }],
            enabled: true,
            isIpv6Enabled: true,
            defaultRootObject: "index.html",
            defaultCacheBehavior: {
                allowedMethods: ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
                cachedMethods: ["GET", "HEAD"],
                targetOriginId: "S3-origin",
                compress: true,
                viewerProtocolPolicy: "redirect-to-https",
                forwardedValues: {
                    queryString: false,
                    cookies: {
                        forward: "none",
                    },
                },
                trustedSigners: [],
                minTtl: 0,
                defaultTtl: 3600,
                maxTtl: 86400,
            },
            customErrorResponses: [{
                errorCode: 404,
                responseCode: 200,
                responsePagePath: "/index.html",
            }],
            restrictions: {
                geoRestriction: {
                    restrictionType: "none",
                },
            },
            viewerCertificate: {
                cloudfrontDefaultCertificate: true,
            },
            tags: TAGS,
        }, { parent: this });

        // Create bucket policy to allow CloudFront access
        const bucketPolicy = new aws.s3.BucketPolicy(`${name}-bucket-policy`, {
            bucket: bucket.id,
            policy: pulumi.all([bucket.arn, distribution.arn]).apply(([bucketArn, distributionArn]) => 
                JSON.stringify({
                    Version: "2012-10-17",
                    Statement: [{
                        Sid: "AllowCloudFrontServicePrincipal",
                        Effect: "Allow",
                        Principal: {
                            Service: "cloudfront.amazonaws.com"
                        },
                        Action: "s3:GetObject",
                        Resource: `${bucketArn}/*`,
                        Condition: {
                            StringEquals: {
                                "AWS:SourceArn": distributionArn
                            }
                        }
                    }]
                })
            ),
        }, { parent: this });

        // Optional Lambda@Edge function for request/response modification
        const edgeFunction = new aws.lambda.Function(`${name}-edge-function`, {
            runtime: aws.lambda.Runtime.NodeJS18dX,
            code: new pulumi.asset.AssetArchive({
                "index.js": new pulumi.asset.StringAsset(`
                    exports.handler = async (event) => {
                        const request = event.Records[0].cf.request;
                        
                        // Add security headers
                        const response = event.Records[0].cf.response;
                        const headers = response.headers;
                        
                        headers['strict-transport-security'] = [{
                            key: 'Strict-Transport-Security',
                            value: 'max-age=31536000; includeSubdomains; preload'
                        }];
                        
                        headers['x-content-type-options'] = [{
                            key: 'X-Content-Type-Options',
                            value: 'nosniff'
                        }];
                        
                        headers['x-frame-options'] = [{
                            key: 'X-Frame-Options',
                            value: 'DENY'
                        }];
                        
                        headers['x-xss-protection'] = [{
                            key: 'X-XSS-Protection',
                            value: '1; mode=block'
                        }];
                        
                        return response;
                    };
                `),
            }),
            handler: "index.handler",
            role: this.createEdgeLambdaRole().arn,
            publish: true,
            tags: TAGS,
        }, { parent: this });

        this.resources = {
            bucket,
            originAccessControl,
            distribution,
            edgeFunction,
        };

        this.registerOutputs({
            bucketName: bucket.id,
            distributionId: distribution.id,
            distributionDomainName: distribution.domainName,
        });
    }

    private createEdgeLambdaRole(): aws.iam.Role {
        const role = new aws.iam.Role(`edge-lambda-role`, {
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Effect: "Allow",
                        Principal: {
                            Service: ["lambda.amazonaws.com", "edgelambda.amazonaws.com"],
                        },
                    },
                ],
            }),
            tags: TAGS,
        }, { parent: this });

        new aws.iam.RolePolicyAttachment(`edge-lambda-basic-execution`, {
            role: role.name,
            policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        }, { parent: this });

        return role;
    }
}
5. Backend Infrastructure (components/backend.ts)
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { BackendResources, NetworkResources } from "../types";
import { TAGS } from "../utils/constants";

export class BackendComponent extends pulumi.ComponentResource {
    public readonly resources: BackendResources;

    constructor(name: string, networkResources: NetworkResources, opts?: pulumi.ComponentResourceOptions) {
        super("custom:backend:BackendComponent", name, {}, opts);

        // Create DynamoDB table
        const dynamoTable = new aws.dynamodb.Table(`${name}-table`, {
            attributes: [
                {
                    name: "id",
                    type: "S",
                },
            ],
            hashKey: "id",
            billingMode: "PAY_PER_REQUEST",
            serverSideEncryption: {
                enabled: true,
            },
            pointInTimeRecovery: {
                enabled: true,
            },
            tags: TAGS,
        }, { parent: this });

        // Create IAM role for Lambda
        const lambdaRole = new aws.iam.Role(`${name}-lambda-role`, {
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Effect: "Allow",
                        Principal: {
                            Service: "lambda.amazonaws.com",
                        },
                    },
                ],
            }),
            tags: TAGS,
        }, { parent: this });

        // Attach basic execution policy
        new aws.iam.RolePolicyAttachment(`${name}-lambda-basic-execution`, {
            role: lambdaRole.name,
            policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
        }, { parent: this });

        // Create custom policy for DynamoDB access
        const dynamoPolicy = new aws.iam.Policy(`${name}-dynamo-policy`, {
            policy: dynamoTable.arn.apply(tableArn => JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Action: [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:Query",
                            "dynamodb:Scan",
                        ],
                        Resource: tableArn,
                    },
                ],
            })),
            tags: TAGS,
        }, { parent: this });

        new aws.iam.RolePolicyAttachment(`${name}-lambda-dynamo-policy`, {
            role: lambdaRole.name,
            policyArn: dynamoPolicy.arn,
        }, { parent: this });

        // Create Lambda function
        const lambdaFunction = new aws.lambda.Function(`${name}-api-lambda`, {
            runtime: aws.lambda.Runtime.Python3d9,
            code: new pulumi.asset.AssetArchive({
                "lambda_function.py": new pulumi.asset.StringAsset(`
import json
import boto3
import os
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super(DecimalEncoder, self).default(o)

def lambda_handler(event, context):
    try:
        http_method = event['httpMethod']
        path = event['path']
        
        if http_method == 'GET' and path == '/health':
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
                },
                'body': json.dumps({'status': 'healthy'})
            }
        
        elif http_method == 'POST' and path == '/items':
            body = json.loads(event['body'])
            item_id = body.get('id')
            
            response = table.put_item(
                Item=body
            )
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
                },
                'body': json.dumps({'message': 'Item created successfully'})
            }
        
        elif http_method == 'GET' and path.startswith('/items/'):
            item_id = path.split('/')[-1]
            
            response = table.get_item(
                Key={'id': item_id}
            )
            
            if 'Item' in response:
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type',
                        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
                    },
                    'body': json.dumps(response['Item'], cls=DecimalEncoder)
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Item not found'})
                }
        
        else:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Not found'})
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
                `),
            }),
            handler: "lambda_function.lambda_handler",
            role: lambdaRole.arn,
            environment: {
                variables: {
                    TABLE_NAME: dynamoTable.name,
                },
            },
            vpcConfig: {
                securityGroupIds: [networkResources.lambdaSecurityGroup.id],
                subnetIds: networkResources.privateSubnets.map(subnet => subnet.id),
            },
            timeout: 30,
            tags: TAGS,
        }, { parent: this });

        // Create API Gateway
        const api = new aws.apigateway.RestApi(`${name}-api`, {
            description: "Backend API for web application",
            endpointConfiguration: {
                types: "REGIONAL",
            },
            tags: TAGS,
        }, { parent: this });

        // Create API Gateway resources and methods
        const proxyResource = new aws.apigateway.Resource(`${name}-proxy-resource`, {
            restApi: api.id,
            parentId: api.rootResourceId,
            pathPart: "{proxy+}",
        }, { parent: this });

        const proxyMethod = new aws.apigateway.Method(`${name}-proxy-method`, {
            restApi: api.id,
            resourceId: proxyResource.id,
            httpMethod: "ANY",
            authorization: "NONE",
        }, { parent: this });

        // Create Lambda integration
        const integration = new aws.apigateway.Integration(`${name}-lambda-integration`, {
            restApi: api.id,
            resourceId: proxyResource.id,
            httpMethod: proxyMethod.httpMethod,
            integrationHttpMethod: "POST",
            type: "AWS_PROXY",
            uri: lambdaFunction.invokeArn,
        }, { parent: this });

        // Grant API Gateway permission to invoke Lambda
        new aws.lambda.Permission(`${name}-api-lambda-permission`, {
            statement: "AllowExecutionFromAPIGateway",
            action: "lambda:InvokeFunction",
            function: lambdaFunction.name,
            principal: "apigateway.amazonaws.com",
            sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
        }, { parent: this });

        // Deploy API
        const deployment = new aws.apigateway.Deployment(`${name}-api-deployment`, {
            restApi: api.id,
            stageName: "prod",
        }, { 
            parent: this,
            dependsOn: [integration],
        });

        this.resources = {
            api,
            lambdaFunction,
            dynamoTable,
            lambdaRole,
        };

        this.registerOutputs({
            apiId: api.id,
            apiUrl: pulumi.interpolate`https://${api.id}.execute-api.us-west-2.amazonaws.com/prod`,
            lambdaFunctionName: lambdaFunction.name,
            dynamoTableName: dynamoTable.name,
        });
    }
}
6. Streaming Infrastructure (components/streaming.ts)
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { StreamingResources, NetworkResources } from "../types";
import { TAGS } from "../utils/constants";

export class StreamingComponent extends pulumi.ComponentResource {
    public readonly resources: StreamingResources;

    constructor(name: string, networkResources: NetworkResources, opts?: pulumi.ComponentResourceOptions) {
        super("custom:streaming:StreamingComponent", name, {}, opts);

        // Create Kinesis Data Stream
        const kinesisStream = new aws.kinesis.Stream(`${name}-stream`, {
            shardCount: 2,
            retentionPeriod: 24,
            encryption: {
                type: "KMS",
                keyId: "alias/aws/kinesis",
            },
            tags: TAGS,
        }, { parent: this });

        // Create S3 bucket for processed data
        const outputBucket = new aws.s3.Bucket(`${name}-processed-data`, {
            serverSideEncryptionConfiguration: {
                rule: {
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: "AES256",
                    },
                },
            },
            versioning: {
                enabled: true,
            },
            tags: TAGS,
        }, { parent: this });

        // Create IAM role for processing Lambda
        const lambdaRole = new aws.iam.Role(`${name}-processing-lambda-role`, {
            assumeRolePolicy: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Effect: "Allow",
                        Principal: {
                            Service: "lambda.amazonaws.com",
                        },
                    },
                ],
            }),
            tags: TAGS,
        }, { parent: this });

        // Attach VPC execution policy
        new aws.iam.RolePolicyAttachment(`${name}-lambda-vpc-execution`, {
            role: lambdaRole.name,
            policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
        }, { parent: this });

        // Create custom policy for Kinesis and S3 access
        const streamingPolicy = new aws.iam.Policy(`${name}-streaming-policy`, {
            policy: pulumi.all([kinesisStream.arn, outputBucket.arn]).apply(([streamArn, bucketArn]) => 
                JSON.stringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Action: [
                                "kinesis:GetRecords",
                                "kinesis:GetShardIterator",
                                "kinesis:DescribeStream",
                                "kinesis:ListStreams",
                            ],
                            Resource: streamArn,
                        },
                        {
                            Effect: "Allow",
                            Action: [
                                "s3:PutObject",
                                "s3:PutObjectAcl",
                            ],
                            Resource: `${bucketArn}/*`,
                        },
                    ],
                })
            ),
            tags: TAGS,
        }, { parent: this });

        new aws.iam.RolePolicyAttachment(`${name}-lambda-streaming-policy`, {
            role: lambdaRole.name,
            policyArn: streamingPolicy.arn,
        }, { parent: this });

        // Create processing Lambda function
        const processingLambda = new aws.lambda.Function(`${name}-processing-lambda`, {
            runtime: aws.lambda.Runtime.Python3d9,
            code: new pulumi.asset.AssetArchive({
                "lambda_function.py": new pulumi.asset.StringAsset(`
import json
import boto3
import base64
import os
from datetime import datetime

s3 = boto3.client('s3')

def lambda_handler(event, context):
    try:
        processed_records = []
        
        for record in event['Records']:
            # Decode the Kinesis data
            payload = base64.b64decode(record['kinesis']['data'])
            data = json.loads(payload)
            
            # Process the data (example: add timestamp and processing info)
            processed_data = {
                'original_data': data,
                'processed_at': datetime.utcnow().isoformat(),
                'partition_key': record['kinesis']['partitionKey'],
                'sequence_number': record['kin