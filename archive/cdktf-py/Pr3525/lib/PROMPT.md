# Form Builder Service Infrastructure

Create infrastructure code for a form processing system that handles 4,500 daily form submissions.

## Requirements

### Core Services
- API Gateway REST API for form submissions
- Lambda function (Python 3.11) for form validation with custom business rules
- DynamoDB table for storing form responses
- S3 bucket for file attachments with versioning enabled
- SES for sending confirmation emails
- CloudWatch dashboard for submission metrics
- Step Functions state machine for multi-step workflows
- IAM roles and policies for service permissions

### Implementation Details

#### API Gateway
- Create REST API with /submit endpoint
- Enable request validation
- Configure CORS for web browser access
- Add API key and usage plan for rate limiting (500 requests per minute)

#### Lambda Validation Function
- Python 3.11 runtime
- Implement custom validation rules for email format, required fields, and file size limits
- Environment variables for configuration
- Error handling with detailed logging
- 30 second timeout

#### Step Functions Workflow
- Conditional routing based on form type
- Email notification step using SES
- File upload processing with presigned URL generation
- Use Distributed Map state for batch processing multiple submissions
- Error handling and retry logic

#### DynamoDB
- Single table design with partition key (submission_id) and sort key (timestamp)
- Global secondary index on email field
- Point-in-time recovery enabled
- Auto-scaling for read/write capacity

#### S3 Bucket
- Lifecycle policy to move old attachments to Glacier after 90 days
- Server-side encryption with AWS managed keys
- Versioning and MFA delete protection
- Presigned URL expiry of 1 hour

#### CloudWatch
- Custom metrics for submission count, validation failures, and processing time
- Log groups for Lambda and Step Functions
- Alarms for error rates above 5%

#### SES Configuration
- Verified sender email address
- HTML and text email templates
- Bounce and complaint handling

## Region
Deploy all resources in us-east-1 region.

## Output
Provide complete infrastructure code using CDKTF with Python. Include one code block per file with clear file paths.