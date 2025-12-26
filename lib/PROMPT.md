You are an expert AWS architect.

Objective: Write a production-ready AWS CloudFormation YAML template.

Region: us-west-2

Constraints and Requirements:

Create a new VPC with the following:

At least one public and one private subnet (in different Availability Zones).

Proper route tables and NAT gateway setup to allow internet access from the private subnet via NAT.

All AWS resources must include tags with the keys:

Name

Environment

Launch EC2 instances (type t3.micro) in the public subnet.

Attach an IAM Role to the EC2 instances with a policy allowing read-only access to S3.

Provision an S3 bucket to store CloudWatch Logs.

Use best practices for IAM, logging, subnetting, and resource isolation.

Ensure the template passes AWS CloudFormation linter validation (e.g., cfn-lint) and is deployable without modification.

Expected Output:

A single, well-structured YAML CloudFormation template.

Use YAML anchors/aliases or Mappings for reusability if applicable.

Follow naming conventions and formatting standards.

Include metadata and comments to make the template self-explanatory.

Do not use hardcoded values for sensitive configurations.
Use pseudo parameters, mappings, or parameterized inputs for environment-specific values where necessary.

Begin with AWSTemplateFormatVersion: '2010-09-09'.
Provide only the YAML code – no additional explanation.