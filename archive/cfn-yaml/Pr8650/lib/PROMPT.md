You are an experienced AWS Solutions Architect tasked with designing, building, and deploying a secure, resilient, and compliant cloud infrastructure for a new web application hosted entirely on AWS. The infrastructure must adhere strictly to security best practices and operational compliance standards. Your output will be a single CloudFormation YAML template that automates the entire provisioning process and meets the following detailed requirements:

Virtual Private Cloud (VPC) Setup:

Create a new VPC that spans at least two distinct Availability Zones (AZs) in your selected AWS Region.

Within the VPC, provision at least two subnets per AZ:

A public subnet configured to allow internet traffic by attaching an Internet Gateway and updating route tables accordingly.

A private subnet with no direct internet access, using a NAT Gateway (deployed in the public subnet) to provide outbound internet access for instances inside.

Ensure the route tables are configured correctly: public subnets route 0.0.0.0/0 traffic through the Internet Gateway; private subnets route outbound traffic through the NAT Gateway.

Implement appropriate subnet CIDR allocations to avoid overlap.

Security Groups (SGs):

Define Security Groups with a default inbound rule that denies all inbound traffic by default.

Add explicit inbound rules permitting only the specific ports required by the web application (for example, TCP 80 and 443 for HTTP/HTTPS, or any other specified application ports).

Outbound rules should allow all necessary traffic for the application to function correctly.

Attach these Security Groups to the appropriate resources (e.g., EC2 instances, Lambda functions).

IAM Role and Permissions:

Create an IAM Role intended for AWS Lambda or other compute resources that need programmatic access to the S3 bucket.

Assign a tightly scoped IAM policy granting only minimum required permissions to interact with the designated S3 bucket:

Permit necessary S3 actions such as GetObject, PutObject, ListBucket scoped strictly to the buckets ARN.

Deny any broader permissions beyond what is essential.

S3 Bucket Configuration:

Create an S3 bucket designed to securely store application data.

Ensure all objects stored in this bucket are encrypted at rest using AWS-managed encryption keys (SSE-S3).

Enable versioning on the S3 bucket to protect against accidental deletion or overwrites.

Implement bucket policies or ACLs as necessary to ensure data confidentiality and integrity.

Monitoring and Logging with CloudWatch:

Enable AWS CloudWatch to monitor security-related events, focusing on detecting unauthorized access attempts on resources such as the VPC, S3 bucket, and Lambda functions.

Set up CloudWatch Alarms, Metrics Filters, or Logs Insights queries to generate alerts for suspicious activities.

Configure appropriate CloudWatch Logs groups for Lambda function logging.

Lambda Function:

Provision a Lambda function configured to run within the private subnet of the VPC, allowing it to access internal resources securely.

Attach the previously created IAM Role to this Lambda.

Configure the Lambdas VPC configuration with references to the private subnet(s) and associated security groups.

Ensure the Lambda function has network connectivity as required for internal processing.

Resource Tagging:

Apply consistent resource tags to all AWS resources created by the CloudFormation template.

Tags should include, at minimum, Project, Environment (e.g., Dev, Test, Prod), and Owner keys to aid in resource identification, cost allocation, and management.

Additional Requirements:

The CloudFormation template must be valid YAML syntax, deploying successfully without errors.

It should follow AWS best practices for security and maintainability.

The template must be unit-test ready, ensuring resources are provisioned correctly and meet all stated security constraints.

Include clear logical resource naming conventions for readability and operational ease.

Please ensure the final CloudFormation YAML template reflects all these detailed instructions fully and accurately.
