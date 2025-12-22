## Serverless App Setup

We need a CloudFormation template, in YAML, for a serverless app. It'll use AWS Lambda and API Gateway to handle web requests.

Here's what it needs to do:

- **Define with AWS SAM:** You'll use **AWS SAM** to describe your Lambda functions and how your API Gateway endpoints work. SAM helps keep this all neat and tidy in one template.
- **Set up Lambda details:**
  - Make sure your Lambda functions have **environment variables** configured. These are useful for things like logging settings or feature flags.
  - Give your Lambda functions an **IAM role**. This role should have just the right permissions, specifically allowing them to run and to access DynamoDB.
- **Configure API Gateway routes:**
  - For **POST requests** that go to the `/user` path, set up API Gateway to send those straight to your `CreateUserFunction` Lambda.
  - For **GET requests** to `/user/{id}` where {id} is the user ID, configure API Gateway to direct those to your `GetUserFunction` Lambda.

This app is for AWS, and it needs functions with specific settings for each environment, handling web requests through API Gateway.

Give us a YAML file called `serverless-template.yaml`. It should be set up correctly, and pass validation when we check it with SAM or the AWS CLI.
