# AWS CloudFormation Template Requirements

I need a secure and scalable AWS CloudFormation YAML template for production infrastructure. The template should follow security best practices and ensure all resources are properly protected and managed.

## Environment Setup

Deploy all resources in the region provided as an environment variable. Do not hardcode the region anywhere in the template.

Create a VPC that restricts access to specific CIDR ranges. The VPC connects to EC2 instances through security groups that only allow traffic from those CIDR ranges. Security groups control how EC2 instances communicate with each other and with external resources.

Set up S3 buckets with server-side encryption enabled. These buckets will store application data and backups. Lambda functions should be able to read from and write to these buckets based on IAM permissions.

Configure IAM roles following least privilege principles. Each role should only have permissions for the specific resources it needs to access. Lambda functions assume these roles to access DynamoDB and S3.

Create DynamoDB tables with backup enabled and at least 7 days of retention. The tables will store application data. Lambda functions write data to these tables, and EC2 instances within the VPC can also access them through security group rules and IAM permissions.

Enable AWS Config to monitor and alert on root account credential usage. Config should send notifications when root credentials are used.

Deploy RDS instances with automatic minor version upgrades enabled. The RDS instances should be placed in private subnets within the VPC. EC2 instances connect to RDS through security group rules that allow database traffic. The security groups control which EC2 instances can reach the database.

Enable AWS CloudTrail to log all API calls across all regions for auditing. CloudTrail captures API calls made to AWS services and stores them in S3 buckets. Make sure the IsLogging property is set to true so logging is actually active.

Launch EC2 instances with termination protection enabled to prevent accidental deletion. These instances connect to the RDS database through security group rules. The instances also access S3 buckets and DynamoDB tables based on IAM instance profiles.

Configure Elastic Load Balancers with cross-zone load balancing enabled. The load balancers route incoming traffic to EC2 instances across availability zones. The load balancer sits in front of EC2 instances and distributes requests evenly.

Tag all resources with Environment:Production for cost tracking and resource management.

Set up Lambda functions with dead-letter queues for failed events. Lambda functions invoke DynamoDB to write data and access S3 buckets to read and write files. The functions assume IAM roles that grant permissions to these services. Dead-letter queues capture events when Lambda functions fail to process them.

## Constraints

Use dynamic references over parameters for secrets like database passwords. Do not hardcode sensitive values.

Do not use SUB function where there is no variable substitution needed.

All resources must be deployed in the region provided as an environment variable. Never hardcode region values.

Only allow VPC access from specified CIDR ranges through security group rules.

Enforce server-side encryption for all S3 buckets using bucket policies or encryption configuration.

IAM roles must follow least privilege and only grant access to required resources.

DynamoDB tables require backup with at least 7-day retention configured.

AWS Config must monitor root credential usage and send alerts.

RDS must have automatic minor version upgrades enabled.

CloudTrail must log all API calls across all regions and must have IsLogging set to true.

EC2 instances must have termination protection enabled.

ELBs must have cross-zone load balancing enabled.

All resources must be tagged with Environment:Production.

Lambda functions must have dead-letter queues configured.

Template must pass AWS CloudFormation validation and linting.

Do not hardcode region. Use environment variable or parameter instead.

Use dynamic references or parameters for secrets like passwords, not hardcoded values.

Do not use Fn::Sub unless variables are required for substitution.

Do not include additional properties not allowed by resource types. For example, BackupPolicy is not valid for DynamoDB tables.

## Output Expectations

Provide a single production-ready CloudFormation YAML template that implements all requirements above.

The template must deploy all specified AWS resources without error, use descriptive logical resource names, follow AWS best practices and security guidelines, and pass AWS CloudFormation validation and cfn-lint checks.
