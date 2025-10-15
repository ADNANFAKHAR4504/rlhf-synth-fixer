Create a CloudFormation template in YAML that provisions a secure and highly available AWS production environment. The infrastructure must include:

-a EC2 instance running in a private subnet.

-an S3 buckets for storage with versioning enabled and AWS KMS encryption.

-a DynamoDB tables with auto-scaling.

-RDS instances configured for Multi-AZ high availability.


Follow these requirement for these resources:

-Tag all resources with Environment: Production.

-restrict all Security Groups to allow only HTTP (port 80) and HTTPS (port 443) inbound traffic.

-use IAM roles for EC2 access instead of root credentials.

-Implement an IAM policy that grants only least-privilege permissions.

-Validate the IAM policy using AWS Policy Simulator.

-Enable AWS CloudTrail logging for auditing.

-Ensure all data at rest is encrypted using AWS KMS.

-Ensure the template follows AWS best practices and passes CloudFormation validation.

Output:
create a single cloudformation yaml template that meets all the above requirements