We need to set up a production-ready serverless backend on AWS using CloudFormation in JSON format. It should include Lambda functions (Node.js), API Gateway (regional), DynamoDB (on-demand), and monitoring with CloudWatch and SNS.
Make sure all resources are secure, follow least privilege for IAM roles, and are properly tagged for the production environment. Use encryption where needed (like KMS for Lambda env variables), and include things like DLQs, usage plans, and alarms.
The template should be modular, parameterized, and pass cfn-lint checks. It must deploy successfully in us-west-2.
Let’s keep the structure clean and reusable for other environments too.
