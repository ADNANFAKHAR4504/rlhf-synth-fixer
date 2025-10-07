# CI/CD Artifact Management Infrastructure

Create infrastructure code using CDKTF with TypeScript for a CI/CD platform artifact storage system in us-west-2 that handles 10,800 daily builds.

## Requirements

### Storage Infrastructure
- Create an S3 bucket for build artifacts with versioning enabled
- Configure S3 lifecycle policies for 90-day retention of current versions
- Set noncurrent version expiration to 30 days
- Use S3 Express One Zone storage class for frequently accessed recent builds
- Enable server-side encryption with AWS managed keys

### Automated Cleanup
- Create a Lambda function to delete artifacts older than 90 days
- Schedule the Lambda to run daily using EventBridge
- Use Lambda SnapStart for improved cold start performance
- Configure appropriate IAM role for Lambda with S3 permissions

### Metadata Management
- Create a DynamoDB table to store artifact metadata
- Include attributes: artifact_id, build_number, timestamp, size, version
- Set up global secondary index on timestamp for efficient queries
- Enable point-in-time recovery

### Package Management
- Set up CodeArtifact domain and repository for dependency management
- Configure upstream connections to public repositories (npm, PyPI)
- Create IAM policies for build system access

### Monitoring
- Create CloudWatch dashboard for storage metrics
- Set up CloudWatch alarms for storage threshold (80% of quota)
- Monitor Lambda execution errors and duration
- Track DynamoDB read/write capacity utilization

### Access Control
- Create IAM role for build systems with necessary permissions
- Implement least privilege access policies
- Enable S3 bucket policies restricting access to specific VPC endpoints
- Configure cross-account access if needed

### Additional Configuration
- Add tags for cost allocation and resource management
- Enable S3 Transfer Acceleration for faster uploads
- Configure S3 Object Lock for compliance requirements
- Set up S3 Intelligent-Tiering for cost optimization

Generate the complete infrastructure code with proper error handling and resource dependencies. Include all necessary imports and configurations. Provide one code block per file.