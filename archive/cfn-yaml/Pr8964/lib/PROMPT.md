> Act as a cloud solution architect.
> Create a production-ready AWS CloudFormation template in YAML to provision a secure, tagged, and scalable serverless infrastructure. The solution must deploy in the us-east-1 region.
>
> Build a serverless API where API Gateway invokes a Lambda function to process requests. The Lambda function should interact with an S3 bucket for data storage and retrieval. When files are uploaded to S3, the bucket should trigger the Lambda function for processing.
>
> Infrastructure Requirements:
>
> 1. Create an S3 bucket with versioning enabled that sends event notifications to the Lambda function when objects are created.
> 2. Define an AWS Lambda function with inline code that handles API Gateway requests and processes S3 upload events.
> 3. Expose the Lambda function through API Gateway with GET and POST methods.
> 4. Enable CORS on API Gateway to allow cross-origin requests.
> 5. Set up IAM roles for Lambda with permissions to read/write to the S3 bucket and create CloudWatch logs.
>
> Output a single valid CloudFormation YAML file that deploys this integrated serverless architecture.