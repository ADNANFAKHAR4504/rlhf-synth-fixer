I need to create a secure serverless infrastructure using CloudFormation YAML with the following requirements:

1. Create an S3 bucket named 'prod-app-data' with SSE-S3 encryption enabled
2. Set up a Lambda function that can access the S3 bucket, using code from s3://my-cf-templates/lambda_function.zip
3. Configure proper IAM roles and policies for the Lambda function to access S3
4. Create a CloudWatch alarm that monitors Lambda errors and sends notifications to SNS topic 'prod-alerts-topic'
5. Use CloudWatch Logs tiered pricing for the Lambda function logs to optimize costs
6. Add VPC Flow Logs for enhanced security monitoring using the new centralized visibility features
7. All resources must be tagged with 'Environment: Production'
8. Ensure the deployment is optimized for fast provisioning

Please provide the infrastructure code in CloudFormation YAML format. Create one code block per file that can be directly used for deployment.