# Serverless Image Detector with Cat/Dog Classification

Need to build a serverless image processing app on AWS using CDK TypeScript. The app should detect cats and dogs in uploaded images using Rekognition, then organize the files into S3 folders based on what was detected.

## What It Should Do

Users upload images through an API Gateway endpoint. The system:
- Analyzes each image with Amazon Rekognition to detect cats, dogs, or other objects
- Stores the detection results in DynamoDB with confidence scores
- Moves images to the right S3 folder: /cats/, /dogs/, or /others/ depending on what was found
- Sends SNS notifications when confidence is low and we're not sure what was detected
- Logs everything to CloudWatch for monitoring

## Architecture

This needs to be event-driven serverless. Here's the flow:

1. User hits POST /upload on API Gateway
2. ImageProcessor Lambda receives the request
3. Lambda calls Rekognition to analyze the image
4. Based on confidence scores, decide if it's a cat, dog, or something else
5. Log results to DynamoDB
6. FileManager Lambda moves the image to the appropriate S3 folder
7. If confidence is below 80%, NotificationService Lambda sends an SNS alert
8. CloudWatch tracks all metrics and errors

## Required Components

### Lambda Functions
Three Lambdas are needed:
- **ImageProcessor** - main handler that coordinates everything, calls Rekognition, manages the workflow
- **FileManager** - moves images between S3 folders after classification
- **NotificationService** - sends SNS alerts when classification is uncertain

All Lambdas should have environment variables for stage config and log to CloudWatch.

### API Gateway
REST API with these endpoints:
- POST /upload - submit an image for processing
- GET /images/{id} - retrieve detection results for a specific image
- GET /images - list all processed images

Add API key authentication with usage plans for rate limiting. Configure CORS so web apps can call it. Also set up request validation to check JSON payloads.

### DynamoDB
Create a DetectionLogs table to store image analysis results. Enable point-in-time recovery and server-side encryption. The table should have TTL configured for automatic cleanup of old records. Also enable streams if you want real-time triggers.

Schema should look like:
```
ImageID: string (partition key)
DetectedAnimal: string (cat/dog/other)
ConfidenceScore: number
Timestamp: string
S3Location: string
ProcessingStatus: string
FileSize: number
ImageFormat: string
```

### S3 Bucket
Single bucket with folders for different classifications:
- /input/ - where images land initially
- /cats/ - high-confidence cat detections
- /dogs/ - high-confidence dog detections
- /others/ - everything else

Turn on encryption and make the bucket private. Set up lifecycle policies to clean up old files. Trigger Lambda when new files land in /input/.

### SNS Topic
For notifications when classification confidence is low. Subscribe an email or SMS endpoint for alerts.

### CloudWatch
Set up custom metrics for:
- Image processing duration
- Rekognition API calls
- Classification accuracy
- Error rates

Create alarms for Lambda errors and API Gateway 5xx responses. Build a dashboard showing image processing metrics.

## Security Requirements

Keep it secure but don't overcomplicate:
- Use least privilege IAM roles for each Lambda
- Encrypt everything at rest with KMS
- Encrypt data in transit with TLS
- No hardcoded credentials - use Secrets Manager if needed
- Private S3 bucket with proper bucket policies
- API keys for API Gateway authentication

Don't use wildcards in IAM policies. Be specific about which actions each Lambda can perform and which resources it can access.

## Configuration

Make it environment-aware. Use CDK context or environment variables for:
- Stage name (dev/staging/prod)
- S3 bucket names with stage suffix
- DynamoDB table names with stage suffix
- Rekognition confidence thresholds
- CloudWatch alarm thresholds

Prefix all resources with `serverlessapp-` for easy identification.

## Monitoring and Logging

Log everything important:
- Image upload events
- Rekognition API responses
- Classification decisions
- S3 move operations
- SNS notification sends
- Any errors or retries

Set retention policies on CloudWatch logs so they don't grow forever.

## Testing

Include both unit tests and integration tests. Unit tests should cover Lambda handler logic. Integration tests should verify the end-to-end workflow works.

## What I Don't Need

Keep it focused - we don't need:
- Step Functions unless the workflow gets more complex
- VPC unless there's a specific security requirement for it
- Multi-region setup for now
- WAF or Shield unless explicitly required

## Tech Stack

- AWS CDK with TypeScript
- Region: us-east-1
- Runtime: Node.js 18.x for Lambdas
- Amazon Rekognition for image analysis

## Expected Output

Working CDK stack that I can deploy with `cdk deploy`. Should include:
- All infrastructure code in TypeScript
- Lambda function code
- Unit and integration tests
- README with deployment instructions
- Architecture diagram showing how services connect

Make sure the code is clean and well-commented so it's easy to maintain and extend later.
