You are an AWS Cloud Engineer tasked with provisioning a secure, development-ready web hosting environment using AWS CloudFormation.

Requirements:

Networking:

Define a new VPC with at least two subnets, each in a different Availability Zone.

Security:

Create a Security Group that allows inbound HTTP (port 80) and SSH (port 22) traffic only from a specified CIDR/IP range.

Compute:

Launch an EC2 instance with a public IP address in one of the subnets.

Storage:

Provision an S3 bucket with versioning and encryption enabled.

Access Management:

Define IAM roles and policies so the EC2 instance has access to the S3 bucket.

Monitoring:

Enable CloudWatch monitoring for the EC2 instance.

Configure a custom CloudWatch Alarm to trigger if CPU utilization exceeds 70% over a 5-minute period.

Tagging and Naming:

Tag all resources with Environment: Development.

Name all resources using the convention <ResourceType>-<Environment>-<UniqueId>.

Outputs:

Output the VPC ID, Subnet IDs, and EC2 instance Public IP.

Validation:

The template must be syntactically valid YAML, pass aws cloudformation validate-template, and deploy successfully.

Constraints:

Use best practices for security and least-privilege access.

Region: Use us-west-2 unless otherwise specified.

Use Parameters for values like SSH allowed IP and unique resource IDs where appropriate.