You need to build a complete serverless setup on AWS using the AWS CDK with Python (main.py - single stack). The idea is to create an API that lets users retrieve information from a DynamoDB table — everything should be fully automated and deployed as infrastructure as code.

The core of the system should be an AWS Lambda function written in Python, which is triggered through an API Gateway endpoint. The API should support HTTP requests and allow cross-origin calls, so make sure CORS is configured properly. When a request comes in, the Lambda should read data from a DynamoDB table that uses `userId` as its primary key. If the record doesn't exist, the function should return a clear, user-friendly response instead of failing silently.

All of this should be wrapped in a CDK stack that handles provisioning of the API Gateway, Lambda, and DynamoDB table. The table should use on-demand capacity, and you'll want to pass its name and any index info to the Lambda through environment variables. The Lambda should also include structured logging to CloudWatch, with log retention set to seven days.

IAM roles should follow the principle of least privilege — Lambda can only read from DynamoDB and write logs to CloudWatch. Similarly, API Gateway needs permission to log requests to CloudWatch as well. Use SSL/TLS for the endpoint to make sure requests are secure, and add validation rules in the API Gateway so that every request must include a `userId` before it even reaches Lambda.

Handle errors and exceptions gracefully in your Python code, and make sure all responses are returned as clean JSON with the right HTTP status codes. It would also be great to include a few lightweight unit tests for the Lambda to confirm that it behaves correctly when valid, invalid, or missing input is passed in.

In short, this is about creating a production-grade, testable, and secure serverless backend in AWS, written in Python, using CDK to define and manage every piece of the infrastructure.
