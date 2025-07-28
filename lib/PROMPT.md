Objective

Set up a serverless infrastructure using AWS Lambda, triggered by events from an S3 bucket. The solution should include an API Gateway, IAM roles, environment variables, and monitoring.
Requirements

    AWS Lambda:
        Lambda functions triggered by events from an S3 bucket.
        Use IAM roles for necessary permissions.

    API Gateway:
        Configure an API Gateway to act as a frontend for the Lambda functions.

    Environment Variables:
        Set up environment variables for Lambda functions to allow runtime configurations.

    Region:
        Deploy the infrastructure in the us-east-1 region. 

    Resource Tagging:
        Add tags to all resources for cost tracking.

    Fault Tolerance:
        Implement retry mechanisms for Lambda functions to ensure fault tolerance.

    CloudWatch Logs:
        Enable CloudWatch Logs for all Lambda functions for monitoring purposes.

    Outputs:
        Output the API endpoint URL and Lambda ARN.
