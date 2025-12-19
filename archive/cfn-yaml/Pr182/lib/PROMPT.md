You are a highly skilled AWS architect and expert in authoring CloudFormation templates in YAML.

Generate a complete CloudFormation YAML template that does the following:

Region: Targets the us-west-2 AWS region.

EC2 Instances: Ensures all EC2 instances are of type t3.micro.

S3 Bucket: Creates an S3 bucket with versioning enabled.

VPC Setup:

Creates a VPC.

Adds both public and private subnets across two Availability Zones.

Attaches an Internet Gateway to the public subnets.

Adds route tables for public and private traffic.

Adds NAT Gateway(s) to allow private subnet outbound access.

Requirements:

Format the output strictly in YAML.

Follow AWS CloudFormation best practices.

Use parameterized values where applicable.

Add descriptive comments to explain each major section.

Output only the CloudFormation YAML templateno explanations.