Serverless infrastructure using single YAML CloudFormation template to be deployed in us-west-2 region

Here's the workflow we're building: it's an image processing service. When a user uploads a high-resolution image to an S3 bucket, it should automatically trigger our main Lambda function. That S3 bucket needs versioning turned on, and let's also add a lifecycle rule to transition non-current versions to an infrequent access tier after 90 days to save on costs.

The Lambda function, let's plan for a Python 3.12 runtime, will be responsible for creating a thumbnail of the uploaded image. It should get the name of our DynamoDB table from an environment variable to keep the code clean and reusable. We'll also need a way to re-process an image manually, so set up an API Gateway with a `POST` method at an endpoint like `/process-image`. This endpoint should also trigger the same Lambda function.

For tracking, the Lambda needs to write a record to a DynamoDB table after it successfully processes an image. The table should use a simple string primary key, let's call it `ImageID`. The Lambda should also log its progress and any errors to CloudWatch Logs. The log retention period is important for compliance, so please make that a template parameter that we can easily configure during deployment.

On the security side, the IAM role for the Lambda is critical and needs to be scoped down tightly. It will need specific permissions to get objects from our S3 bucket, write items to the DynamoDB table, and create log streams in CloudWatch. No other permissions should be granted.

Finally, make sure all the resources created by the stack get tagged with 'Environment: Production' and 'Project: ServerlessApp'. The deliverable is just the one clean, deployable YAML file that stands up this entire service.
