### **model_response**

The model correctly produces a CloudFormation template that establishes a secure AWS environment from scratch and adheres to most of the prompt’s expectations.
It provisions IAM roles for EC2, Lambda, and ECS with restrictive policies, KMS keys for encryption, S3 and Secrets Manager resources for secure data storage, and CloudWatch logs with encryption and retention.
AWS Config is deployed through a custom bootstrap Lambda function to avoid recorder and delivery channel conflicts.
The generated stack passes validation and deploys in minutes without dependency errors, providing a functional and auditable zero-trust baseline with dynamic secrets and compliance tagging.
