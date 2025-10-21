I want to build a simple but production-ready serverless application using the AWS CDK in Python (main.py - single stack). The idea is to define everything — the Lambda function, API Gateway, S3 bucket, and DynamoDB table — as part of a single CDK stack.

The Lambda should run on the Python runtime, and I’d like to keep it lightweight with good logging practices. Make sure it sends all its logs to CloudWatch, so that if something goes wrong, we can easily trace the issue.

The API Gateway will sit in front of the Lambda and should have caching turned on — I’m thinking a 60-second TTL would work fine for this setup. Also, please create a “prod” stage for the API Gateway and make sure logging is enabled there too, so we can monitor request patterns and performance in detail.

We’ll need an S3 bucket as part of this stack — it should have versioning enabled, so older files aren’t lost if something gets overwritten. Alongside that, a DynamoDB table will be required with `id` as the partition key and `timestamp` as the sort key. This setup should handle basic read/write operations for our data layer.

As always, IAM permissions should follow least privilege — only give the Lambda, API Gateway, and other services the access they truly need. Every resource that’s created should also have the right tags attached for traceability — include tags for `Environment`, `Project`, and `Owner` to keep everything consistent with internal policies.

We’re using AWS CDK version 2, so make sure the imports and constructs follow the new style. Once deployed, I should end up with a fully working serverless environment where:

* API Gateway handles incoming requests with caching and logging,
* Lambda runs business logic on Python,
* DynamoDB stores structured data using an id/timestamp schema, and
* S3 holds versioned content.

The whole thing should be secure, well-organized, and ready to extend if we need to scale it later on.


