Design a secure and scalable serverless infrastructure in AWS using CDK for Terraform in Java with the following requirements: 

The solution should include a Python 3.8 Lambda function that can be triggered both through an API Gateway HTTP endpoint and on a scheduled basis every 24 hours. 
The API Gateway must support CORS and integrate cleanly with the Lambda. 
A DynamoDB table should be provisioned with both a partition key and a sort key, using provisioned throughput capacity mode. 
An S3 bucket should be set up with versioning enabled, and the Lambda must be granted read access to it through a VPC endpoint to avoid public internet exposure. 
All resources must be secured with KMS encryption, IAM roles must be created with least privilege, and CloudWatch should capture logs and metrics for every service. 
Notifications for errors should be routed through SNS. Environment variables must be used to pass configuration data into the Lambda, and resource policies, tags, and CloudFormation intrinsic functions should be applied where needed. 
The deployment must target the us-west-2 region and follow AWS best practices around security, cost management, and operational excellence