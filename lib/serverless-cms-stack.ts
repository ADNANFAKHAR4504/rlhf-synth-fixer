import { File } from '@cdktf/provider-archive/lib/file';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { CloudfrontDistribution } from '@cdktf/provider-aws/lib/cloudfront-distribution';
import { CloudfrontOriginAccessControl } from '@cdktf/provider-aws/lib/cloudfront-origin-access-control';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';

export interface ServerlessCmsProps {
  environment: string;
  providerAws: AwsProvider;
  providerArchive: ArchiveProvider;
}

export class ServerlessCms extends Construct {
  public readonly apiGatewayUrl: string;
  public readonly cloudfrontDomainName: string;
  public readonly contentBucketName: string;
  public readonly contentTableName: string;

  constructor(scope: Construct, id: string, props: ServerlessCmsProps) {
    super(scope, id);

    // Get current region
    const currentRegion = new DataAwsRegion(this, 'current', {
      provider: props.providerAws,
    });

    // Generate resource names with region-specific naming convention
    const resourcePrefix = `cms-${props.environment}-${currentRegion.region}`;

    // Create Lambda function code
    this.createLambdaCode();

    // S3 Bucket for content storage
    const contentBucket = new S3Bucket(this, 'content_bucket', {
      provider: props.providerAws,
      bucket: `${resourcePrefix}-content`,
    });

    // Enable versioning on S3 bucket
    new S3BucketVersioningA(this, 'content_bucket_versioning', {
      provider: props.providerAws,
      bucket: contentBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Block public access to S3 bucket
    new S3BucketPublicAccessBlock(this, 'content_bucket_pab', {
      provider: props.providerAws,
      bucket: contentBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Enable server-side encryption
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'content_bucket_encryption',
      {
        provider: props.providerAws,
        bucket: contentBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    // DynamoDB table for content metadata
    const contentTable = new DynamodbTable(this, 'content_table', {
      provider: props.providerAws,
      name: `${resourcePrefix}-content-metadata`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'contentId',
      attribute: [
        {
          name: 'contentId',
          type: 'S',
        },
        {
          name: 'contentType',
          type: 'S',
        },
        {
          name: 'createdAt',
          type: 'S',
        },
      ],
      globalSecondaryIndex: [
        {
          name: 'ContentTypeIndex',
          hashKey: 'contentType',
          rangeKey: 'createdAt',
          projectionType: 'ALL',
        },
      ],
      tags: {
        Environment: props.environment,
        Service: 'cms',
        Region: currentRegion.region,
      },
    });

    // IAM Role for Lambda functions
    const lambdaRole = new IamRole(this, 'lambda_role', {
      provider: props.providerAws,
      name: `${resourcePrefix}-lambda-role`,
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
      tags: {
        Environment: props.environment,
        Service: 'cms',
      },
    });

    // Attach basic Lambda execution role
    new IamRolePolicyAttachment(this, 'lambda_basic_execution', {
      provider: props.providerAws,
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    // Custom IAM policy for Lambda to access DynamoDB and S3
    const lambdaPolicy = new IamPolicy(this, 'lambda_policy', {
      provider: props.providerAws,
      name: `${resourcePrefix}-lambda-policy`,
      description: 'IAM policy for CMS Lambda functions',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:Query',
              'dynamodb:Scan',
            ],
            Resource: [contentTable.arn, `${contentTable.arn}/index/*`],
          },
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:ListBucket',
            ],
            Resource: [contentBucket.arn, `${contentBucket.arn}/*`],
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'lambda_policy_attachment', {
      provider: props.providerAws,
      role: lambdaRole.name,
      policyArn: lambdaPolicy.arn,
    });

    // Package Lambda function code
    const lambdaZip = new File(this, 'lambda_zip', {
      provider: props.providerArchive,
      type: 'zip',
      sourceDir: path.join(__dirname, 'lambda'),
      outputPath: path.join(__dirname, 'lambda.zip'),
    });

    // Lambda function for content management
    const contentLambda = new LambdaFunction(this, 'content_lambda', {
      provider: props.providerAws,
      functionName: `${resourcePrefix}-content-handler`,
      role: lambdaRole.arn,
      handler: 'handler.lambda_handler',
      runtime: 'python3.9',
      filename: lambdaZip.outputPath,
      sourceCodeHash: lambdaZip.outputBase64Sha256,
      timeout: 30,
      environment: {
        variables: {
          CONTENT_TABLE: contentTable.name,
          CONTENT_BUCKET: contentBucket.bucket,
          REGION: currentRegion.region,
        },
      },
      tags: {
        Environment: props.environment,
        Service: 'cms',
      },
    });

    // API Gateway REST API
    const api = new ApiGatewayRestApi(this, 'cms_api', {
      provider: props.providerAws,
      name: `${resourcePrefix}-api`,
      description: 'CMS API Gateway',
      endpointConfiguration: {
        types: ['REGIONAL'],
      },
      tags: {
        Environment: props.environment,
        Service: 'cms',
      },
    });

    // API Gateway resources and methods
    const contentResource = new ApiGatewayResource(this, 'content_resource', {
      provider: props.providerAws,
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: 'content',
    });

    const contentIdResource = new ApiGatewayResource(
      this,
      'content_id_resource',
      {
        provider: props.providerAws,
        restApiId: api.id,
        parentId: contentResource.id,
        pathPart: '{contentId}',
      }
    );

    // GET method for retrieving content with Lambda integration
    const getMethod = new ApiGatewayMethod(this, 'get_content_method', {
      provider: props.providerAws,
      restApiId: api.id,
      resourceId: contentIdResource.id,
      httpMethod: 'GET',
      authorization: 'NONE',
    });

    new ApiGatewayIntegration(this, 'get_integration', {
      provider: props.providerAws,
      restApiId: api.id,
      resourceId: contentIdResource.id,
      httpMethod: getMethod.httpMethod,
      integrationHttpMethod: 'GET',
      type: 'AWS_PROXY',
      uri: contentLambda.invokeArn,
    });

    // POST method for creating content with Lambda integration
    const postMethod = new ApiGatewayMethod(this, 'post_content_method', {
      provider: props.providerAws,
      restApiId: api.id,
      resourceId: contentResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
    });

    new ApiGatewayIntegration(this, 'post_integration', {
      provider: props.providerAws,
      restApiId: api.id,
      resourceId: contentResource.id,
      httpMethod: postMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: contentLambda.invokeArn,
    });

    // PUT method for updating content with Lambda integration
    const putMethod = new ApiGatewayMethod(this, 'put_content_method', {
      provider: props.providerAws,
      restApiId: api.id,
      resourceId: contentIdResource.id,
      httpMethod: 'PUT',
      authorization: 'NONE',
    });

    new ApiGatewayIntegration(this, 'put_integration', {
      provider: props.providerAws,
      restApiId: api.id,
      resourceId: contentIdResource.id,
      httpMethod: putMethod.httpMethod,
      integrationHttpMethod: 'PUT',
      type: 'AWS_PROXY',
      uri: contentLambda.invokeArn,
    });

    // DELETE method for deleting content with Lambda integration
    const deleteMethod = new ApiGatewayMethod(this, 'delete_content_method', {
      provider: props.providerAws,
      restApiId: api.id,
      resourceId: contentIdResource.id,
      httpMethod: 'DELETE',
      authorization: 'NONE',
    });

    new ApiGatewayIntegration(this, 'delete_integration', {
      provider: props.providerAws,
      restApiId: api.id,
      resourceId: contentIdResource.id,
      httpMethod: deleteMethod.httpMethod,
      integrationHttpMethod: 'DELETE',
      type: 'AWS_PROXY',
      uri: contentLambda.invokeArn,
    });

    // Lambda permissions for API Gateway
    new LambdaPermission(this, 'api_gateway_lambda_permission', {
      provider: props.providerAws,
      statementId: 'AllowExecutionFromAPIGateway',
      action: 'lambda:InvokeFunction',
      functionName: contentLambda.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    // API Gateway deployment
    const deployment = new ApiGatewayDeployment(this, 'api_deployment', {
      provider: props.providerAws,
      restApiId: api.id,
      dependsOn: [getMethod, postMethod, putMethod, deleteMethod],
    });

    // API Gateway stage
    new ApiGatewayStage(this, 'api_stage', {
      provider: props.providerAws,
      deploymentId: deployment.id,
      restApiId: api.id,
      stageName: props.environment,
      tags: {
        Environment: props.environment,
        Service: 'cms',
      },
    });

    // CloudFront Origin Access Control
    const oac = new CloudfrontOriginAccessControl(this, 's3_oac', {
      provider: props.providerAws,
      name: `${resourcePrefix}-s3-oac`,
      description: 'OAC for S3 content bucket',
      originAccessControlOriginType: 's3',
      signingBehavior: 'always',
      signingProtocol: 'sigv4',
    });

    // CloudFront Distribution
    const distribution = new CloudfrontDistribution(this, 'cdn', {
      provider: props.providerAws,
      comment: `${resourcePrefix} CMS CloudFront Distribution`,
      enabled: true,
      isIpv6Enabled: true,
      defaultRootObject: 'index.html',

      origin: [
        {
          domainName: contentBucket.bucketDomainName,
          originId: 'S3-content',
          originAccessControlId: oac.id,
        },
        {
          domainName:
            api.id + '.execute-api.' + currentRegion.region + '.amazonaws.com',
          originId: 'API-Gateway',
          originPath: `/${props.environment}`,
          customOriginConfig: {
            httpPort: 443,
            httpsPort: 443,
            originProtocolPolicy: 'https-only',
            originSslProtocols: ['TLSv1.2'],
          },
        },
      ],

      defaultCacheBehavior: {
        targetOriginId: 'S3-content',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: [
          'DELETE',
          'GET',
          'HEAD',
          'OPTIONS',
          'PATCH',
          'POST',
          'PUT',
        ],
        cachedMethods: ['GET', 'HEAD'],
        compress: true,
        forwardedValues: {
          queryString: false,
          cookies: {
            forward: 'none',
          },
        },
        minTtl: 0,
        defaultTtl: 3600,
        maxTtl: 86400,
      },

      orderedCacheBehavior: [
        {
          pathPattern: '/api/*',
          targetOriginId: 'API-Gateway',
          viewerProtocolPolicy: 'https-only',
          allowedMethods: [
            'DELETE',
            'GET',
            'HEAD',
            'OPTIONS',
            'PATCH',
            'POST',
            'PUT',
          ],
          cachedMethods: ['GET', 'HEAD'],
          compress: true,
          forwardedValues: {
            queryString: true,
            headers: ['Authorization', 'Content-Type'],
            cookies: {
              forward: 'none',
            },
          },
          minTtl: 0,
          defaultTtl: 0,
          maxTtl: 0,
        },
      ],

      restrictions: {
        geoRestriction: {
          restrictionType: 'none',
        },
      },

      viewerCertificate: {
        cloudfrontDefaultCertificate: true,
      },

      tags: {
        Environment: props.environment,
        Service: 'cms',
      },
    });

    // Store important values for outputs
    new TerraformOutput(this, 'api_gateway_url', {
      value: `https://${api.id}.execute-api.${currentRegion.region}.amazonaws.com/${props.environment}`,
      description: 'API Gateway invoke URL',
    });

    new TerraformOutput(this, 'cloudfront_domain_name', {
      value: distribution.domainName,
      description: 'CloudFront distribution domain name',
    });

    new TerraformOutput(this, 'content_bucket_name', {
      value: contentBucket.bucket,
      description: 'S3 bucket name for content storage',
    });

    new TerraformOutput(this, 'content_table_name', {
      value: contentTable.name,
      description: 'DynamoDB table name for content metadata',
    });
  }

  /**
   * Creates the Lambda function code directory and handler file.
   */

  private createLambdaCode(): void {
    // Create lambda directory if it doesn't exist
    const lambdaDir = path.join(__dirname, 'lambda');
    if (!fs.existsSync(lambdaDir)) {
      fs.mkdirSync(lambdaDir, { recursive: true });
    }

    // Create Lambda function handler
    const handlerCode = `
import json
import boto3
import os
import uuid
from datetime import datetime
from botocore.exceptions import ClientError

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION'])
s3 = boto3.client('s3', region_name=os.environ['REGION'])

# Get environment variables
CONTENT_TABLE = os.environ['CONTENT_TABLE']
CONTENT_BUCKET = os.environ['CONTENT_BUCKET']

def lambda_handler(event, context):
    """
    Main Lambda handler for CMS content management operations
    Supports GET, POST, PUT, DELETE operations for content
    """
    try:
        http_method = event['httpMethod']
        path_parameters = event.get('pathParameters', {})
        query_parameters = event.get('queryStringParameters', {}) or {}
        body = event.get('body')
        
        # Parse request body if present
        if body:
            try:
                body = json.loads(body)
            except json.JSONDecodeError:
                return create_response(400, {'error': 'Invalid JSON in request body'})
        
        # Route based on HTTP method
        if http_method == 'GET':
            return handle_get_content(path_parameters, query_parameters)
        elif http_method == 'POST':
            return handle_create_content(body)
        elif http_method == 'PUT':
            return handle_update_content(path_parameters, body)
        elif http_method == 'DELETE':
            return handle_delete_content(path_parameters)
        else:
            return create_response(405, {'error': 'Method not allowed'})
            
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})

def handle_get_content(path_parameters, query_parameters):
    """Handle GET requests for content retrieval"""
    table = dynamodb.Table(CONTENT_TABLE)
    
    # If contentId is provided, get specific content
    if path_parameters and 'contentId' in path_parameters:
        content_id = path_parameters['contentId']
        try:
            response = table.get_item(Key={'contentId': content_id})
            if 'Item' in response:
                return create_response(200, response['Item'])
            else:
                return create_response(404, {'error': 'Content not found'})
        except ClientError as e:
            print(f"Error getting content: {str(e)}")
            return create_response(500, {'error': 'Failed to retrieve content'})
    
    # Otherwise, list content with optional filtering
    try:
        content_type = query_parameters.get('contentType')
        if content_type:
            # Query by content type using GSI
            response = table.query(
                IndexName='ContentTypeIndex',
                KeyConditionExpression='contentType = :ct',
                ExpressionAttributeValues={':ct': content_type},
                ScanIndexForward=False  # Sort by createdAt descending
            )
        else:
            # Scan all content
            response = table.scan()
        
        return create_response(200, {
            'items': response.get('Items', []),
            'count': response.get('Count', 0)
        })
    except ClientError as e:
        print(f"Error listing content: {str(e)}")
        return create_response(500, {'error': 'Failed to list content'})

def handle_create_content(body):
    """Handle POST requests for content creation"""
    if not body:
        return create_response(400, {'error': 'Request body is required'})
    
    # Validate required fields
    required_fields = ['title', 'contentType', 'content']
    for field in required_fields:
        if field not in body:
            return create_response(400, {'error': f'Missing required field: {field}'})
    
    table = dynamodb.Table(CONTENT_TABLE)
    content_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    # Prepare content item
    content_item = {
        'contentId': content_id,
        'title': body['title'],
        'contentType': body['contentType'],
        'content': body['content'],
        'createdAt': timestamp,
        'updatedAt': timestamp,
        'status': body.get('status', 'draft'),
        'author': body.get('author', 'anonymous'),
        'tags': body.get('tags', [])
    }
    
    try:
        # Store metadata in DynamoDB
        table.put_item(Item=content_item)
        
        # If there are file attachments, store them in S3
        if 'files' in body:
            for file_info in body['files']:
                s3_key = f"content/{content_id}/{file_info['filename']}"
                # In a real implementation, you'd handle file upload differently
                # This is a simplified example
                content_item['files'] = content_item.get('files', [])
                content_item['files'].append({
                    'filename': file_info['filename'],
                    's3Key': s3_key,
                    'contentType': file_info.get('contentType', 'application/octet-stream')
                })
        
        return create_response(201, content_item)
    except ClientError as e:
        print(f"Error creating content: {str(e)}")
        return create_response(500, {'error': 'Failed to create content'})

def handle_update_content(path_parameters, body):
    """Handle PUT requests for content updates"""
    if not path_parameters or 'contentId' not in path_parameters:
        return create_response(400, {'error': 'contentId is required'})
    
    if not body:
        return create_response(400, {'error': 'Request body is required'})
    
    content_id = path_parameters['contentId']
    table = dynamodb.Table(CONTENT_TABLE)
    
    try:
        # Check if content exists
        response = table.get_item(Key={'contentId': content_id})
        if 'Item' not in response:
            return create_response(404, {'error': 'Content not found'})
        
        existing_item = response['Item']
        timestamp = datetime.utcnow().isoformat()
        
        # Update fields
        update_expression = "SET updatedAt = :timestamp"
        expression_values = {':timestamp': timestamp}
        
        updatable_fields = ['title', 'content', 'status', 'author', 'tags']
        for field in updatable_fields:
            if field in body:
                update_expression += f", {field} = :{field}"
                expression_values[f":{field}"] = body[field]
        
        # Perform update
        table.update_item(
            Key={'contentId': content_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )
        
        # Get updated item
        response = table.get_item(Key={'contentId': content_id})
        return create_response(200, response['Item'])
        
    except ClientError as e:
        print(f"Error updating content: {str(e)}")
        return create_response(500, {'error': 'Failed to update content'})

def handle_delete_content(path_parameters):
    """Handle DELETE requests for content removal"""
    if not path_parameters or 'contentId' not in path_parameters:
        return create_response(400, {'error': 'contentId is required'})
    
    content_id = path_parameters['contentId']
    table = dynamodb.Table(CONTENT_TABLE)
    
    try:
        # Check if content exists and get associated files
        response = table.get_item(Key={'contentId': content_id})
        if 'Item' not in response:
            return create_response(404, {'error': 'Content not found'})
        
        content_item = response['Item']
        
        # Delete associated files from S3
        if 'files' in content_item:
            for file_info in content_item['files']:
                try:
                    s3.delete_object(Bucket=CONTENT_BUCKET, Key=file_info['s3Key'])
                except ClientError as s3_error:
                    print(f"Error deleting S3 object: {str(s3_error)}")
        
        # Delete content metadata from DynamoDB
        table.delete_item(Key={'contentId': content_id})
        
        return create_response(200, {'message': 'Content deleted successfully'})
        
    except ClientError as e:
        print(f"Error deleting content: {str(e)}")
        return create_response(500, {'error': 'Failed to delete content'})

def create_response(status_code, body):
    """Create standardized HTTP response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        'body': json.dumps(body, default=str)
    }
`;

    // Write the handler code to file
    fs.writeFileSync(path.join(lambdaDir, 'handler.py'), handlerCode.trim());
  }
}
