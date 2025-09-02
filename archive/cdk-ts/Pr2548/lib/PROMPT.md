Objective:
Generate a single, complete, and well-commented cdk template with typescript named secure_infrastructure.ts. This template must provision a secure infrastructure for a web application, strictly adhering to the principles of least privilege, comprehensive logging, and defined security boundaries.

Persona:
You are a Cloud Security Architect tasked with creating a production-ready baseline for a new web application. Your focus is on security, governance, and operational integrity. The template must be robust, well-documented, and easy to review for compliance.

Output Requirements:

Format: A single, complete YAML file named secure_infrastructure.yaml.

Header: Begin with a Description block explaining the template's purpose and the security features it implements.

Comments: Include detailed comments throughout the template to explain the purpose of each resource, the security rationale behind its configuration, and how it meets the prompt's requirements.

Structure: Organize resources logically into sections (e.g., VPC, IAM, S3, EC2).

Detailed Requirements:
The template must define and configure the following AWS resources, with strict adherence to the specified security policies:

IAM Policy for Least Privilege:

Create an IAM Role for an EC2 instance.

Define an inline policy for this role that grants permissions for a typical web application. This policy must be scoped to the least privilege necessary. For example, allow the role to read from a specific S3 bucket and write logs to a CloudWatch Logs group. Do not use wildcards (\*) for actions or resources unless absolutely necessary for a specific service.

Resource Tagging:

All resources created in the template, including but not limited to EC2 instances, S3 buckets, and RDS instances, must be tagged.

Each resource must have two specific tags:

Environment: Prod

Department: Marketing

Security Groups:

Create a Security Group for the web application's EC2 instance.

Ingress Rules: The inbound rules must be parameterized to allow traffic only from a whitelisted IP range. Use parameter named WhitelistedIngressCidr, with a default value of 0.0.0.0/0 (for testing, but with a clear comment that it should be restricted in production). The ingress rules should only permit traffic on ports 80 (HTTP) and 443 (HTTPS).

Egress Rules: The outbound rules should be explicit and conform to a business-approved design. For this template, allow outbound traffic only to the internet on ports 80 and 443.

Logging and Monitoring:

Enable AWS CloudTrail: The trail must log all management events and store the logs in a new, dedicated S3 bucket.

Enable VPC Flow Logs: Configure the VPC to capture all traffic (ALL) and send the flow logs to a new CloudWatch Logs group.

Enable S3 Access Logs: Create a separate S3 bucket for access logs and configure the main application S3 bucket to deliver its access logs to this new bucket. Ensure the log delivery S3 bucket is also properly tagged.

Final Deliverable:
The full content of the secure_infrastructure.yaml file, ready for deployment. The template must be syntactically correct and logical, and all security configurations should be designed to be easily verifiable upon deployment within the AWS environment.
