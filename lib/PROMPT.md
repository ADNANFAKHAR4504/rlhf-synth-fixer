Hey there! I need your help setting up a serverless infrastructure using AWS CDK with Python(main.py- single stack). The goal is to create a RESTful API that allows users to upload files to an S3 bucket, with backend processing handled by AWS Lambda. Here's what we need to achieve:

First, we need an API Gateway to trigger the Lambda function. The Lambda function should have an IAM role with restricted permissions, allowing it to log to CloudWatch and access only the necessary AWS services. The S3 bucket should be configured to store uploaded files, with versioning and encryption enabled. The bucket should also have policies to restrict public access and allow access only from the Lambda function.

We also need a DynamoDB table for data retrieval, structured with a primary key and a sort key. The table should store product data with attributes like `productId`, `productName`, and `price`. Data in DynamoDB should be encrypted at rest using AWS KMS.

The API Gateway should have a rate limit of 1000 requests per second and should only accept POST requests with a JSON body payload. The Lambda function should be scalable based on the request rate, with environment variables securely storing the S3 bucket name and DynamoDB table name.

Finally, we need to ensure logging is enabled for both API Gateway and Lambda, with logs sent to CloudWatch. The CloudFormation template should output the API Gateway URL and Lambda ARN for reference.

Let me know if you need more details!