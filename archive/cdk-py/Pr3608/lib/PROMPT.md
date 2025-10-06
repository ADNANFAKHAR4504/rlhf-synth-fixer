I’d like you to create a CDK project in Python that sets up a small serverless stack in AWS CDK (main.py - single stack),  The main flow is this: an S3 bucket with versioning enabled should automatically trigger a Lambda function whenever someone uploads a JSON file. That Lambda will read the file, process the contents, handle bad or corrupt JSON gracefully, and then log results out to CloudWatch so I can trace what happened.

I also want an API Gateway in front so the Lambda can be triggered over HTTP too. The API Gateway should have a usage plan and an API key so that access is controlled. Please make sure the IAM roles and policies are locked down properly — the Lambda should only have permissions to write to the S3 bucket and nothing extra.

The Lambda code itself should be simple Python that reads JSON, writes results back to the bucket, and logs to CloudWatch. Make sure it has error handling in case the uploaded file isn’t valid JSON. I want all of this implemented in CDK with Python constructs, with the stack containing the bucket, Lambda, API Gateway, IAM role, and any policies needed.


