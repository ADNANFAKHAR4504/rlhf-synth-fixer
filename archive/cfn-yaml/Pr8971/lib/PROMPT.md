I need a CloudFormation YAML template for a secure web application infrastructure. Looking for a single template file at lib/tapstack.yaml with no placeholders - use safe defaults.

Here is what I need built:

VPC Setup: Create a VPC with two public subnets and two private subnets across availability zones. The public subnets connect to an Internet Gateway for external access. The private subnets route traffic through a NAT Gateway that sits in a public subnet.

Storage and Encryption: Create an S3 bucket with versioning enabled. The S3 bucket should be encrypted using a KMS key that I define in the same template. Add a bucket policy that enforces TLS connections.

Logging Pipeline: Set up CloudTrail to capture management and data events. CloudTrail writes logs to a dedicated S3 bucket and also sends events to a CloudWatch Logs group. Create an IAM role for CloudTrail with write access to the log group.

Access Monitoring: Create a CloudWatch metric filter that scans the CloudTrail log group for unauthorized access attempts. Connect this filter to a CloudWatch Alarm that triggers when access denials are detected.

VPC Flow Logs: Enable VPC Flow Logs that send traffic data to CloudWatch Logs for network monitoring.

Lambda Function: Include a sample Lambda function with an execution role. The Lambda role connects to SSM Parameter Store to retrieve configuration values. Create the Lambda log group explicitly.

Security Groups: Create a security group attached to the VPC that allows only HTTPS traffic on port 443 inbound and outbound.

Optional Services: Make AWS Config and Security Hub deployable via parameter toggles since they may already be enabled in some accounts.

IAM Requirements: Every IAM role should follow least privilege. Do not use named IAM resources like RoleName or UserName properties. The S3 bucket policy for CloudTrail logs should deny delete operations to prevent tampering.

KMS Key Policy: The KMS key policy should grant the root account administrator access to manage the key and limit other principals to only the services that need encryption capabilities.

The template should include Parameters for project name, environment, CIDRs, and service toggles. Include Conditions for the optional services. Output the VPC ID, subnet IDs, bucket names, and other key resource identifiers.
