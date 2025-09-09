# Serverless Infrastructure Design Challenge

## Overview
You need to build a complete serverless data processing pipeline on AWS using Pulumi Python. This system will automatically process files as they're uploaded to an S3 bucket, extract metadata, and store it in a database for further analysis.

## What You're Building
Imagine you're working for a company that receives thousands of documents, images, and files daily. Instead of manually processing each file, you need to create an automated system that:

1. **Detects new files** as soon as they're uploaded to a storage bucket
2. **Processes each file** to extract useful metadata (file size, type, upload time, etc.)
3. **Stores this information** in a database for reporting and analytics
4. **Handles errors gracefully** and provides visibility into what's happening

## Technical Requirements

### Core Infrastructure Components

**S3 Bucket Setup:**
- Create a secure S3 bucket that will receive uploaded files
- Enable versioning to protect against accidental deletions
- Configure server-side encryption using AES-256 for data security
- Set up CORS policies to allow web applications to interact with the bucket
- Apply proper resource tagging for cost tracking and management

**Lambda Function:**
- Build a Python Lambda function that processes S3 events
- The function should extract metadata from uploaded objects (filename, size, content type, upload timestamp)
- Implement robust error handling with retry logic for AWS SDK operations
- Use environment variables for configuration (like DynamoDB table name)
- Enable X-Ray tracing for performance monitoring and debugging

**DynamoDB Table:**
- Create a table to store the metadata collected by the Lambda function
- Configure with 100 read capacity units (RCU) and 100 write capacity units (WCU)
- Design appropriate primary key structure for efficient queries
- Ensure proper encryption at rest

**CloudWatch Integration:**
- Set up a dedicated CloudWatch Logs group for the Lambda function
- Configure the Lambda to write detailed logs for each processed event
- Implement monitoring and alerting for failed Lambda executions

### Security and Permissions

**IAM Configuration:**
- Create an IAM role for the Lambda function with minimal required permissions
- Grant S3 read access for the specific bucket
- Provide DynamoDB read/write permissions for the metadata table
- Allow CloudWatch Logs creation and writing
- Enable X-Ray tracing permissions

**S3-Lambda Integration:**
- Configure S3 bucket notifications to trigger the Lambda function on object creation
- Set up proper IAM permissions for S3 to invoke the Lambda function
- Ensure the Lambda can access the S3 objects that triggered the event

### Error Handling and Monitoring

**Lambda Error Management:**
- Implement try-catch blocks for all AWS SDK operations
- Add retry logic with exponential backoff for transient failures
- Log detailed error information for debugging
- Handle cases where DynamoDB writes fail

**Observability:**
- Enable AWS X-Ray tracing for the entire Lambda execution
- Create CloudWatch alarms for Lambda function errors
- Set up monitoring for DynamoDB throttling and capacity issues

## Implementation Details

**File Structure:**
- Create a single Python file called `tap_stack.py` that contains the entire Pulumi infrastructure code
- Use Pulumi's Python SDK to define all AWS resources
- Organize the code with clear sections for each component

**Resource Naming:**
- Use consistent naming conventions for all resources
- Include environment or project prefixes where appropriate
- Ensure resource names are descriptive and follow AWS best practices

**Configuration:**
- Use Pulumi configuration for environment-specific settings
- Make the DynamoDB table name configurable via environment variables
- Allow customization of S3 bucket name and other key parameters

## Expected Deliverable

You should produce a single `tap_stack.py` file that, when deployed with Pulumi, creates:

1. An S3 bucket with proper security settings and versioning
2. A Lambda function that processes S3 events and extracts metadata
3. A DynamoDB table for storing the collected metadata
4. All necessary IAM roles and policies
5. CloudWatch Logs group and monitoring setup
6. X-Ray tracing configuration
7. Proper resource tagging throughout

The infrastructure should be production-ready, following AWS security best practices, and include comprehensive error handling and monitoring capabilities.

## Success Criteria

Your solution will be considered successful if it:
- Deploys without errors using `pulumi up`
- Successfully processes test files uploaded to the S3 bucket
- Stores metadata in the DynamoDB table
- Generates appropriate CloudWatch logs
- Handles errors gracefully without crashing
- Includes proper security configurations
- Follows AWS tagging and naming conventions
