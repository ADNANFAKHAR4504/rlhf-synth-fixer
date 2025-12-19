I need to create a serverless infrastructure using AWS CDK with TypeScript that supports a RESTful API for a web application. 

Requirements:
- Use Amazon API Gateway to provide RESTful API services with endpoints for CreateUser, GetUser, and DeleteUser
- Each API endpoint should trigger a distinct AWS Lambda function written in Python 3.8
- Use DynamoDB as the data storage solution with a string-type 'UserId' as the partition key
- Establish a stage-based deployment strategy using CDK stacks to manage different deployment stages (dev, test, prod)
- All AWS resources must be deployed in the us-west-2 region
- The entire setup must be managed through CDK TypeScript code

I want to take advantage of DynamoDB resource-based policies for access control and Lambda response streaming for better performance. Also incorporate DynamoDB on-demand billing mode for cost efficiency.

Please provide infrastructure code with one code block per file that I can copy-paste directly. Keep the file count minimal while meeting all requirements.