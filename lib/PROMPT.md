
I’m trying to design a serverless application on AWS using the CDK in Python (main.py - single stack), and I need some help putting everything together. The setup should live in the `us-east-1` region. I’d like to have a Lambda function running on Python, and it should be triggered by an API Gateway endpoint that allows CORS from anywhere. The Lambda has to be configurable through environment variables, and it needs a custom IAM role that only gives it the permissions it absolutely requires, nothing more.

For persistence, I want a DynamoDB table where the primary key is `itemId`. The table should be provisioned with at least 5 read and write capacity units, and it should be retained if the stack gets deleted. The Lambda should be able to read and write to this table.

Monitoring is also really important for me. I’d like CloudWatch Logs to capture the Lambda invocations, API Gateway request logging enabled, and an alarm that notifies me if the Lambda’s error rate goes above 5%. The API Gateway should also have version-controlled stages and allow me to define stage variables.

And one last thing — I want everything tagged with project name, environment, and owner so it’s easy to manage later.

Could you put together a single Python CDK stack that provisions all of this, following AWS best practices?

