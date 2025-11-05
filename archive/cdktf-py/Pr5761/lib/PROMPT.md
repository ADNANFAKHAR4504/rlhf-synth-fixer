Hey team,

We need to build a serverless product review processing system that can handle customer reviews at scale. The business wants a fully managed solution that can process reviews, validate them, store them efficiently, and handle image attachments. This needs to be done using **CDKTF with Python** and deployed to the ap-southeast-1 region.

The system is getting a lot of traction from our product teams, so we need to make sure it's robust, secure, and cost-effective. They're particularly concerned about data durability and want to make sure review images are retained long-term but transitioned to cheaper storage when they're not actively accessed.

## What we need to build

Create a serverless product review processing system using **CDKTF with Python** that handles review submission, validation, storage, and image processing.

### Core Requirements

1. **Review Data Storage**
   - DynamoDB table for storing product reviews
   - Partition key: productId (string) to group reviews by product
   - Sort key: reviewId (string) for unique review identification
   - On-demand billing mode for automatic scaling
   - Point-in-time recovery enabled for data protection

2. **Image Storage**
   - S3 bucket for review image attachments
   - Block all public access for security
   - Lifecycle rules to transition objects to Glacier after 90 days
   - Server-side encryption enabled (AES256)

3. **Review Processing Function**
   - Lambda function to process and validate incoming reviews
   - Runtime: Node.js 18.x
   - Memory: 512MB
   - Timeout: 60 seconds
   - Must use AWS SDK v3 (not the older v2)
   - Environment variables for DynamoDB table name and S3 bucket name
   - Least-privilege IAM role with only necessary permissions

4. **API Gateway**
   - REST API for review submission and retrieval
   - POST /reviews endpoint for submitting new reviews
   - GET /reviews/{productId} endpoint for fetching product reviews
   - CORS headers in all responses for web application integration
   - AWS_IAM authorization for admin endpoints
   - Throttling configured at 100 requests per second

5. **Image Processing Pipeline**
   - S3 event notifications to trigger Lambda on new image uploads
   - Filter for common image file types (.jpg, .png, .jpeg, .gif)
   - Automated processing for image validation and metadata extraction

6. **Observability**
   - CloudWatch log groups for Lambda function logs
   - 7-day retention policy for log data
   - API Gateway access logs for request tracking

7. **Resource Management**
   - All resources must include **environmentSuffix** for uniqueness
   - Follow naming convention: `{resource-type}-{environment-suffix}`
   - Tags: Environment: Production for all resources
   - Apply CDK Aspects for security best practices enforcement

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Deploy to **ap-southeast-1** region
- Use **DynamoDB** with on-demand billing and point-in-time recovery
- Use **S3** with encryption and lifecycle policies
- Use **Lambda** (Node.js 18.x runtime with AWS SDK v3)
- Use **API Gateway** REST API with throttling and AWS_IAM authorization
- Use **CloudWatch** for logging with retention policies
- Resource names must include **environmentSuffix** for multi-environment deployments
- IAM roles must follow least-privilege principle
- All resources must be destroyable (no Retain deletion policies)

### Constraints

- Lambda runtime must be Node.js 18.x (not older versions)
- Lambda must use AWS SDK v3 (not v2)
- API responses must include CORS headers
- DynamoDB must have point-in-time recovery enabled
- S3 bucket must block all public access
- S3 lifecycle transition to Glacier after 90 days
- Least-privilege IAM roles for all services
- API Gateway must use AWS_IAM authorization for admin operations
- All resources must be tagged with Environment: Production
- CloudWatch logs must have 7-day retention
- S3 event notifications must filter for image file types
- CDK Aspects must be applied for security best practices

## Success Criteria

- **Functionality**: Complete review submission and retrieval workflow works end-to-end
- **Performance**: API Gateway throttling prevents overload at 100 req/s
- **Reliability**: DynamoDB point-in-time recovery enabled, multi-AZ automatically handled
- **Security**: Least-privilege IAM, S3 public access blocked, encryption enabled
- **Cost Optimization**: DynamoDB on-demand billing, S3 Glacier transition after 90 days
- **Resource Naming**: All resources include environmentSuffix for isolation
- **Observability**: CloudWatch logs capture all Lambda and API Gateway activity
- **Code Quality**: CDKTF Python code, well-structured, properly typed, includes error handling

## What to deliver

- Complete CDKTF Python implementation in lib/tap_stack.py
- Lambda function code for review processing (Node.js 18.x with AWS SDK v3)
- DynamoDB table with proper keys and settings
- S3 bucket with encryption, lifecycle, and event notifications
- API Gateway REST API with POST and GET endpoints
- CloudWatch log groups with retention
- IAM roles with least-privilege permissions
- CDK Aspects for security enforcement
- All resources properly tagged and named with environmentSuffix
- Code ready to deploy with `cdktf deploy`