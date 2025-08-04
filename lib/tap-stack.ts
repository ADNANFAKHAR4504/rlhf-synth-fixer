import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import your stacks here
import { ApiStack } from './stacks/api-stack';
import { ComputeStack } from './stacks/compute-stack';
import { NetworkingStack } from './stacks/networking-stack';
import { StorageStack } from './stacks/storage-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'prod' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'prod';

    // Add your stack instantiations here
    // Do NOT create resources directly in this stack.
    // Instead, create separate stacks for each resource type.

    // 1. Networking Stack - VPC with private subnets and VPC endpoints
    const networkingStack = new NetworkingStack(this, 'NetworkingStack', {
      environmentSuffix,
    });

    // 2. Storage Stack - S3 bucket and DynamoDB tables
    const storageStack = new StorageStack(this, 'StorageStack', {
      environmentSuffix,
    });

    // 3. Compute Stack - Lambda functions
    const computeStack = new ComputeStack(this, 'ComputeStack', {
      environmentSuffix,
      vpc: networkingStack.vpc,
      lambdaSecurityGroup: networkingStack.lambdaSecurityGroup,
      documentBucket: storageStack.documentBucket,
      documentsTable: storageStack.documentsTable,
      apiKeysTable: storageStack.apiKeysTable,
    });

    // 4. API Stack - API Gateway with Lambda authorizer
    const apiStack = new ApiStack(this, 'ApiStack', {
      environmentSuffix,
      authorizerFunction: computeStack.authorizerFunction,
      apiHandlerFunction: computeStack.apiHandlerFunction,
    });

    // Comprehensive Stack Outputs for Integration Testing

    // === API Gateway Outputs ===
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: apiStack.api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: apiStack.api.restApiId,
      description: 'API Gateway REST API ID',
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiStack.apiKey.keyId,
      description: 'API Key ID for authentication',
    });

    new cdk.CfnOutput(this, 'UsagePlanId', {
      value: apiStack.usagePlan.usagePlanId,
      description: 'API Gateway Usage Plan ID',
    });

    // === Lambda Function Outputs ===
    new cdk.CfnOutput(this, 'AuthorizerFunctionName', {
      value: computeStack.authorizerFunction.functionName,
      description: 'Lambda Authorizer function name',
    });

    new cdk.CfnOutput(this, 'AuthorizerFunctionArn', {
      value: computeStack.authorizerFunction.functionArn,
      description: 'Lambda Authorizer function ARN',
    });

    new cdk.CfnOutput(this, 'DocumentProcessorFunctionName', {
      value: computeStack.documentProcessorFunction.functionName,
      description: 'Document Processor Lambda function name',
    });

    new cdk.CfnOutput(this, 'DocumentProcessorFunctionArn', {
      value: computeStack.documentProcessorFunction.functionArn,
      description: 'Document Processor Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'ApiHandlerFunctionName', {
      value: computeStack.apiHandlerFunction.functionName,
      description: 'API Handler Lambda function name',
    });

    new cdk.CfnOutput(this, 'ApiHandlerFunctionArn', {
      value: computeStack.apiHandlerFunction.functionArn,
      description: 'API Handler Lambda function ARN',
    });

    // === Storage Outputs ===
    new cdk.CfnOutput(this, 'DocumentsBucketName', {
      value: storageStack.documentBucket.bucketName,
      description: 'S3 bucket name for document storage',
    });

    new cdk.CfnOutput(this, 'DocumentsBucketArn', {
      value: storageStack.documentBucket.bucketArn,
      description: 'S3 bucket ARN for document storage',
    });

    new cdk.CfnOutput(this, 'DocumentsTableName', {
      value: storageStack.documentsTable.tableName,
      description: 'DynamoDB table name for document metadata',
    });

    new cdk.CfnOutput(this, 'DocumentsTableArn', {
      value: storageStack.documentsTable.tableArn,
      description: 'DynamoDB table ARN for document metadata',
    });

    new cdk.CfnOutput(this, 'DocumentsTableStreamArn', {
      value: storageStack.documentsTable.tableStreamArn || 'N/A',
      description: 'DynamoDB table stream ARN for document metadata',
    });

    new cdk.CfnOutput(this, 'ApiKeysTableName', {
      value: storageStack.apiKeysTable.tableName,
      description: 'DynamoDB table name for API keys',
    });

    new cdk.CfnOutput(this, 'ApiKeysTableArn', {
      value: storageStack.apiKeysTable.tableArn,
      description: 'DynamoDB table ARN for API keys',
    });

    // === VPC and Networking Outputs ===
    new cdk.CfnOutput(this, 'VpcId', {
      value: networkingStack.vpc.vpcId,
      description: 'VPC ID for the serverless infrastructure',
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: networkingStack.vpc.vpcCidrBlock,
      description: 'VPC CIDR block',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: networkingStack.vpc.privateSubnets
        .map(subnet => subnet.subnetId)
        .join(','),
      description: 'Comma-separated list of private subnet IDs',
    });

    new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
      value: networkingStack.lambdaSecurityGroup.securityGroupId,
      description: 'Security Group ID for Lambda functions',
    });

    new cdk.CfnOutput(this, 'S3VpcEndpointId', {
      value: networkingStack.s3Endpoint.vpcEndpointId,
      description: 'S3 VPC Endpoint ID',
    });

    new cdk.CfnOutput(this, 'DynamoDbVpcEndpointId', {
      value: networkingStack.dynamoEndpoint.vpcEndpointId,
      description: 'DynamoDB VPC Endpoint ID',
    });

    new cdk.CfnOutput(this, 'ApiGatewayVpcEndpointId', {
      value: networkingStack.apiGatewayEndpoint.vpcEndpointId,
      description: 'API Gateway VPC Endpoint ID',
    });

    // === Test Configuration Outputs ===
    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS region where resources are deployed',
    });

    new cdk.CfnOutput(this, 'AccountId', {
      value: this.account,
      description: 'AWS account ID where resources are deployed',
    });

    // === Integration Test Endpoints ===
    new cdk.CfnOutput(this, 'DocumentUploadEndpoint', {
      value: `${apiStack.api.url}documents`,
      description: 'Full URL for document upload endpoint',
    });

    new cdk.CfnOutput(this, 'DocumentListEndpoint', {
      value: `${apiStack.api.url}documents`,
      description: 'Full URL for document list endpoint',
    });

    new cdk.CfnOutput(this, 'DocumentRetrieveEndpoint', {
      value: `${apiStack.api.url}documents/{documentId}`,
      description: 'URL template for document retrieve endpoint',
    });
  }
}
