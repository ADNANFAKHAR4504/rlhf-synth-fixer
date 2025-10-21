You need to build a fully serverless setup on AWS using the AWS CDK in Python (main.py - single stack). The idea is to create an infrastructure where a Lambda function automatically runs whenever a CSV file is uploaded to an S3 bucket, and you can also trigger that same function manually through an API Gateway endpoint.

Start by setting up an S3 bucket that stores incoming CSV files. Whenever a new file is uploaded, it should fire an event that invokes a Lambda function. The Lambda itself will be written in Python and should be capable of reading and parsing the CSV file, logging useful information about the contents and the process into CloudWatch. Think about error handling too — if a file is malformed or unreadable, the function shouldn’t crash. Instead, it should log what went wrong in a clear way.

You’ll also need to expose the Lambda function through an API Gateway so it can be triggered manually if needed. This API should only be accessible from specific IP addresses — implement some simple IP whitelisting directly through your CDK code. Make sure both the Lambda and API Gateway have the correct permissions and use IAM roles with the least privileges required — Lambda needs to read from S3 and write logs to CloudWatch, while the API Gateway needs to invoke the Lambda securely.

For the S3 bucket, enable versioning so you can easily roll back files if something goes wrong. You’ll also want to use environment variables inside the Lambda so that its behavior can be tuned without changing the code directly. Limit the function’s runtime to a reasonable amount — around three minutes should be enough.

Finally, add some unit tests in Python for your Lambda logic — especially for CSV parsing and error handling — so you can be confident it behaves as expected. Include a short README file that explains how to deploy and test the solution.

In short, this task is about designing a robust, secure, and cost-aware serverless system on AWS — all defined in Python using the AWS CDK, tying together S3, Lambda, API Gateway, and CloudWatch into a clean, automated workflow.
