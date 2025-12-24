I need to create a secure serverless infrastructure using CloudFormation YAML that implements Security Configuration as Code with the following integrated components:

1. Create an encrypted S3 bucket named 'prod-app-data' with SSE-S3 encryption that stores application data, with all public access explicitly blocked and versioning enabled to maintain data integrity

2. Deploy a Lambda function using code from s3://my-cf-templates/lambda_function.zip that processes data from the S3 bucket, secured by IAM policies granting least-privilege access to only the specific 'prod-app-data' bucket for read/write operations

3. Configure IAM roles with minimal required permissions following security best practices: the Lambda execution role grants only S3:GetObject and S3:PutObject on the specific bucket, and includes CloudWatch Logs permissions for monitoring

4. Set up CloudWatch monitoring integrated with the Lambda function that captures execution metrics and errors, with a CloudWatch alarm monitoring Lambda error rates that automatically triggers SNS notifications to 'prod-alerts-topic' when errors exceed threshold for immediate incident response

5. Configure CloudWatch Logs with tiered pricing for the Lambda function logs to optimize costs while maintaining security audit trails

6. Enable VPC Flow Logs that capture network traffic patterns and integrate with the CloudWatch monitoring system for comprehensive security visibility, providing centralized logging of network communications

7. Tag all resources with 'Environment: Production' to enable proper resource governance and cost allocation across the security infrastructure

8. Ensure the deployment provisions quickly and all security controls are enforced from the moment of resource creation

Please provide the infrastructure code in CloudFormation YAML format showing how these security components work together as an integrated security monitoring and data processing pipeline. Create one code block per file that can be directly used for deployment.