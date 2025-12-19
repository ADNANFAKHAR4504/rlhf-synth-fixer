Prompt
You are tasked with designing and deploying a highly secure cloud infrastructure using AWS CloudFormation (YAML). The solution must strictly adhere to AWS security best practices and the following requirements:

Requirements
Region: All resources must be deployed in us-west-2.
Tagging: Every resource must include the tag:
Tags:
  - Key: Environment
    Value: Production
Encryption: Enable data encryption at rest and in transit where applicable.
IAM Security:
Use IAM roles for EC2 instances to access AWS services.
Do not embed credentials in the instance configuration.
IAM policies must follow the principle of least privilege.
S3 Logging Bucket:
Create an S3 bucket for application logs.
Must have versioning enabled.
Must have server access logging enabled.
RDS Security:
All RDS instances must be private (non-publicly accessible).
Encrypted storage enabled.
Network Security:
Apply security groups with rules allowing access only on required ports and protocols.
Output Expectations
Deliver a CloudFormation YAML template that defines this secure infrastructure.
The template must:
Pass AWS CloudFormation validation.
Be optimized for security, maintainability, and production-readiness.
Include only necessary permissions and configurations.
Be a single YAML CloudFormation template fulfilling all requirements above.
Ensure clarity, correctness, and compliance with AWS best practices.