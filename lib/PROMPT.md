Objective

Set up a serverless infrastructure using AWS Lambda, triggered by events from an S3 bucket. The solution should include IAM roles for security and permissions, as well as CloudFormation templates that are easily reusable across different environments.
Requirements
AWS Lambda:

    Deploy an AWS Lambda function that is triggered by ObjectCreated events in an S3 bucket.

    Use IAM roles to grant the Lambda function the necessary permissions to read from the S3 bucket.

S3 Bucket:

    Set up an S3 bucket that will store the objects and trigger Lambda on object creation events.

    Ensure the S3 bucket is reusable by parameterizing the bucket name.

IAM Roles:

    Create IAM roles that grant the Lambda function permissions to interact with the S3 bucket (like s3:GetObject).

CloudFormation Template:

    Use CloudFormation to define the Lambda function, the S3 bucket, and the IAM roles required for the Lambda function.

    Ensure the CloudFormation template is parameterized to allow deployment in different environments with different configurations.

Parameterization:

    Parameterize the following fields for reusability across environments:

        BucketName: The name of the S3 bucket.

        LambdaFunctionName: The name of the Lambda function.

        LambdaHandler: The handler for the Lambda function.

        LambdaRuntime: The runtime for the Lambda function.

CloudWatch Logs:

    Enable CloudWatch logs for the Lambda function to monitor execution and troubleshoot errors.

Outputs:

    Output the following values for use after deployment:

        LambdaFunctionName: The name of the Lambda function.

        LambdaExecutionRoleArn: The ARN of the IAM role for the Lambda function.

        S3BucketName: The name of the S3 bucket.