Please provide a detailed template in cdk with typescript format that provisions a serverless application on AWS. The template must satisfy the following requirements:

Serverless Components:

Deploy an AWS Lambda function with a Python 3.9 runtime.

Integrate this Lambda function with an Amazon API Gateway REST API, configured to trigger the Lambda function via a POST method on a /data path.

Configuration and Parameters:

Define a Parameter named Environment of type String, with AllowedValues of dev, stage, and prod, and a default value of dev.

Define a Parameter named LogLevel of type String, with AllowedValues of INFO, WARN, and ERROR, and a default value of INFO.

Lambda Function Specifics:

Set the Environment variables for the Lambda function to include STAGE (referencing the Environment parameter), REGION (referencing the current region, us-east-1), and LOG_LEVEL (referencing the LogLevel parameter).

Create an IAM Role for the Lambda function, strictly adhering to the principle of least privilege. This role should only grant the permissions necessary for the Lambda to write logs to CloudWatch and perform dynamodb:PutItem on the DynamoDB table.

Monitoring and Logging:

Provision a dedicated CloudWatch Log Group for the Lambda function.

Create a CloudWatch Alarm that monitors the Lambda function's error rate. The alarm should be triggered when the Errors metric is greater than 5% for a consecutive period of 5 minutes. The alarm should be named appropriately and include a descriptive message.

Data Storage:

Provision a new DynamoDB table with a primary key named id of type String.

Configure the table's ProvisionedThroughput with a ReadCapacityUnits of 5 and a WriteCapacityUnits of 5.

Enable DynamoDB Auto Scaling for the table, targeting a 70% utilization for both read and write capacity. The scaling policy should have a minimum capacity of 5 units and a maximum of 20 units for both read and write.

Region Constraint:

Ensure all resources are deployed in the us-east-1 region. The template must explicitly reference this region where necessary.
The final output should be a complete and verifiable cdk with typescript template.
