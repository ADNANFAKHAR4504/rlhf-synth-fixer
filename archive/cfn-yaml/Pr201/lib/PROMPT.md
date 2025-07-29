You are tasked with enhancing the security of a web application deployed on AWS by configuring IAM roles and policies using AWS CloudFormation. Your objective is to enforce the principle of least privilege while enabling specific access to AWS resources.

## Security Configuration Requirements:

### IAM Role for EC2 Instances

Create an IAM role that can be attached to EC2 instances.

The role must only allow read access to Amazon S3 buckets.

Explicitly deny write permissions to S3.

### IAM Policy for a Specific User

Define an IAM policy that grants read-only access to a specific S3 bucket.

Attach this policy to a specific IAM user.

### Least Privilege Enforcement

Ensure that all permissions granted (roles and policies) follow the principle of least privilege—only the necessary actions and resources should be specified.

### YAML Format Requirement

Use YAML syntax to author the CloudFormation template.

Name the file: security-configuration.yml.

## Expected Output:
A fully functional and valid CloudFormation template named security-configuration.yml that includes:

The EC2 IAM Role with appropriate permissions.

The read-only S3 policy for an IAM user.

All necessary logical IDs and resource definitions.

Valid syntax and structure deployable via the AWS CloudFormation console.