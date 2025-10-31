Create a CloudFormation template in YAML that provisions a secure, production-ready AWS infrastructure for a financial services application. The setup must strictly follow AWS security best practices, ensuring encryption, least privelege access, monitoring, and multi-az redudancy.

Requirements:
tag all AWS resources with Environment: Production for consistent tracking and management.
implment IAM roles and policies with minimal permissions, adhering to the principle of least privilege.
Enable comprehensive logging for auditing across all AWS services used in the stack.
Encrypt all EBS volumes using AWS KMS-managed keys.
Ensure all S3 buckets are private — no public read or write access allowed.
deploy the infrastructure inside a VPC isolated from the internet, allowing outbound access only through a NAT Gateway where necessary.
Enable S3 versining on all buckets to protect against accidental deletions or overwrites.
Configure AWS CloudTrail to capture and monitoring all account and servicelevel activities for auditing purposes.
Set up CloudWatch Alarms to trigger alerts for significant changes or spikes in resource utilization.
restrict SSH access to a defined list of trusting IP ranges using Security Groups.
Distribute all critical resources across multiple Availability Zones to ensure high availability and redundancy.

expected Output is a single YAML cloudFormation template that provisions the described infrastructure securely and reliably, fully meeting all requirements. The template must pass AWS CloudFormation Linter (cfn-lint) and all related validation checks without errors. And create everything in a singel file