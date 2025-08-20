You are a highly experienced AWS DevOps engineer specializing in secure, efficient, and production-ready cloud infrastructure using CloudFormation.

Based on the following infrastructure requirements, generate a fully functional and deployable CloudFormation YAML template that adheres to AWS best practices:

Problem Statement:
Set up a basic cloud environment in the us-west-2 AWS region for a development workload using standard tagging and naming conventions. Your stack must:

Create an S3 bucket with versioning enabled.

Provision an Amazon EC2 instance using the latest Amazon Linux 2 AMI, launched into a public subnet.

Allocate and associate an Elastic IP address with the EC2 instance.

Configure a Security Group that allows inbound traffic on port 22 (SSH) and port 80 (HTTP) from anywhere.

Assign appropriate tags (Environment: dev, Project: SampleProject) to all resources.

Ensure the template outputs:

The S3 bucket name

The EC2 instances public IP address

Constraints:
Use only AWS CloudFormation YAML format (not JSON or CDK).

Follow AWS best practices for security, modularity, and efficiency.

Use meaningful resource logical IDs and standard formatting.

Make sure resources are clearly grouped and documented with comments if necessary.

Provide the output as a single valid CloudFormation YAML template that can be deployed without modifications.