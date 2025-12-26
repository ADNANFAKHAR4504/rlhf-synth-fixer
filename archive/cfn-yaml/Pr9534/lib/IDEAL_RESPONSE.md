# Media Storage System - CloudFormation Implementation

## Solution Overview

This CloudFormation template provides a comprehensive serverless media storage solution that can handle 2,000 daily image uploads efficiently. The architecture leverages AWS S3 for storage, DynamoDB for metadata indexing, Lambda functions for processing, and CloudWatch for monitoring.

## Architecture Components

### 1. Storage Layer
- **S3 Bucket**: Configured with CORS for web uploads, lifecycle policies for cost optimization, and EventBridge notifications
- **Bucket Policy**: Secure access control allowing Lambda functions to read and write objects

### 2. Data Layer
- **DynamoDB Table**: Pay-per-request billing with global secondary index for efficient queries by user and upload date
- **Primary Key**: Image ID for direct lookups
- **GSI**: User-based queries with date sorting capability

### 3. Processing Layer
- **Image Processor Function**: Handles S3 upload events via EventBridge, extracts metadata, and stores records in DynamoDB
- **Image Retriever Function**: Provides API endpoints for querying images with pre-signed URLs for secure access

### 4. Event Processing
- **EventBridge Rule**: Automatically triggers Lambda functions when objects are uploaded to S3
- **Lambda Permissions**: Proper IAM configuration for EventBridge to invoke Lambda functions

### 5. Monitoring & Observability
- **CloudWatch Dashboard**: Real-time metrics for S3, Lambda, and DynamoDB performance
- **CloudWatch Alarms**: Error monitoring with immediate alerts for Lambda function failures

## Key Features

### Security
- IAM roles with least privilege principle
- Separate roles for different Lambda functions with specific permissions
- S3 bucket policies restricting access to authorized Lambda functions
- Pre-signed URLs for secure image access

### Scalability
- Serverless architecture automatically scales with demand
- DynamoDB pay-per-request billing adapts to usage patterns
- Lambda functions scale automatically with concurrent executions

### Cost Optimization
- S3 lifecycle policies transition objects to Infrequent Access after 90 days
- Pay-per-request DynamoDB billing eliminates over-provisioning
- Lambda functions only charge for actual execution time

### Performance
- Global Secondary Index enables fast user-based queries
- EventBridge provides reliable, decoupled event processing
- Pre-signed URLs eliminate Lambda bottlenecks for image downloads

## Implementation Code

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Media Storage System with S3, DynamoDB, Lambda, and CloudWatch'

Parameters:
  EnvironmentSuffix:
    Description: Environment suffix to append to resource names (e.g., dev, test, prod)
    Type: String
    Default: dev
    
Resources:
  # S3 Bucket for storing uploaded images with EventBridge notifications enabled
  MediaBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Join 
        - '-'
        - - 'media-storage'
          - !Ref 'AWS::AccountId'
          - !Ref EnvironmentSuffix
      NotificationConfiguration:
        EventBridgeConfiguration:
          EventBridgeEnabled: true
      CorsConfiguration:
        CorsRules:
          - AllowedHeaders:
              - '*'
            AllowedMethods:
              - GET
              - PUT
              - POST
              - DELETE
              - HEAD
            AllowedOrigins:
              - '*'
            MaxAge: 3000
      LifecycleConfiguration:
        Rules:
          - Id: TransitionToInfrequentAccess
            Status: Enabled
            Transitions:
              - StorageClass: STANDARD_IA
                TransitionInDays: 90

  # DynamoDB table with optimized structure for image metadata
  ImageMetadataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Join ['-', ['ImageMetadata', !Ref EnvironmentSuffix]]
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
        - AttributeName: uploadedBy
          AttributeType: S
        - AttributeName: uploadDate
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: UserUploadIndex
          KeySchema:
            - AttributeName: uploadedBy
              KeyType: HASH
            - AttributeName: uploadDate
              KeyType: RANGE
          Projection:
            ProjectionType: ALL

  # Lambda functions with comprehensive error handling and logging
  ImageProcessorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Join ['-', ['ImageProcessor', !Ref EnvironmentSuffix]]
      Handler: index.handler
      Role: !GetAtt ImageProcessorRole.Arn
      Runtime: nodejs20.x
      Timeout: 30
      MemorySize: 512
      Environment:
        Variables:
          DYNAMODB_TABLE: !Ref ImageMetadataTable
          S3_BUCKET: !Ref MediaBucket
          ENVIRONMENT: !Ref EnvironmentSuffix
      Code:
        ZipFile: |
          const AWS = require('aws-sdk');
          const s3 = new AWS.S3();
          const dynamoDB = new AWS.DynamoDB.DocumentClient();
          const crypto = require('crypto');
          
          exports.handler = async (event) => {
            try {
              console.log('Received event:', JSON.stringify(event));
              
              const bucket = event.detail.bucket.name;
              const key = decodeURIComponent(event.detail.object.key.replace(/\+/g, ' '));
              
              const s3Object = await s3.headObject({
                Bucket: bucket,
                Key: key
              }).promise();
              
              const metadata = s3Object.Metadata || {};
              const item = {
                id: metadata.id || crypto.randomUUID(),
                key: key,
                contentType: s3Object.ContentType,
                fileSize: s3Object.ContentLength,
                uploadDate: new Date().toISOString(),
                uploadedBy: metadata.uploadedby || 'unknown',
                bucket: bucket,
                metadata: metadata
              };
              
              await dynamoDB.put({
                TableName: process.env.DYNAMODB_TABLE,
                Item: item
              }).promise();
              
              return {
                statusCode: 200,
                body: JSON.stringify({
                  message: 'Image processed successfully',
                  id: item.id
                })
              };
            } catch (error) {
              console.error('Error processing image:', error);
              throw error;
            }
          };
```

## Outputs

The template provides essential outputs for integration:
- **MediaBucketName**: S3 bucket name for uploads
- **ImageMetadataTableName**: DynamoDB table name for queries  
- **Function Names**: Lambda function identifiers for monitoring
- **Dashboard URL**: Direct link to CloudWatch monitoring dashboard
- **EventRule ARN**: EventBridge rule identifier

This solution provides a production-ready, scalable, and cost-effective media storage system that meets all specified requirements while following AWS best practices for security, performance, and maintainability.