Hey, we're building a secure data processing infrastructure for our financial services platform that handles sensitive payment card data and needs to meet PCI-DSS compliance requirements. Right now we're facing audit findings that our existing infrastructure doesn't have proper network segmentation, we're seeing data processed in environments with internet access which is a huge compliance risk, and our IAM model doesn't enforce separation of duties between data processors, auditors, and administrators. The business impact is critical—we can't process new payment partners until we demonstrate compliance, and we risk fines of up to two hundred fifty thousand dollars per audit cycle if we don't remediate these findings within ninety days.

Here's what we're building: a completely isolated data processing environment in AWS using **Terraform with HCL** where all components run in private subnets with absolutely no internet gateway, all AWS service communication happens through VPC endpoints to prevent data exfiltration, and we enforce encryption at rest and in transit for everything. We're talking about Lambda functions processing payment data in isolated private subnets, S3 buckets storing encrypted transaction records with policies that reject any unencrypted uploads, DynamoDB tables maintaining processing metadata with point-in-time recovery for audit trails, and comprehensive CloudWatch Logs capturing every operation with ninety-day retention.

This architecture pattern is used by companies like Stripe for their payment processing infrastructure where they isolate card processing workloads in VPCs with no internet access and enforce all AWS API calls through VPC endpoints. Square uses this same design for their transaction processing systems with segregated IAM roles ensuring their data engineers can process transactions but can't modify audit logs, while their security auditors can read everything but can't change data. Coinbase implements this identical pattern for cryptocurrency transaction processing where network isolation is paramount and they need to prove to regulators that transaction data never touches systems with internet access. They all need the same thing: provable network isolation, encryption everywhere, comprehensive audit trails, and separation of duties enforced through IAM policies.

The compliance architecture implements defense in depth starting with network isolation. We create a VPC in us-east-1 with three private subnets distributed across different availability zones for high availability, but critically there's no internet gateway and no NAT gateway—nothing in this VPC can reach the public internet or be reached from it. AWS service access happens exclusively through VPC endpoints where we use gateway endpoints for S3 and DynamoDB which are free and route-table based, plus interface endpoints for Lambda and CloudWatch Logs which cost about seven dollars thirty cents each per month but are required for service invocation and logging from private subnets. This gives us complete network isolation while maintaining full AWS service functionality.

Encryption controls use customer-managed KMS keys instead of AWS-managed keys so we have complete control over who can encrypt and decrypt data. We create three separate KMS keys—one for S3 bucket encryption, one for DynamoDB table encryption, and one for CloudWatch Logs encryption. Each key has a key policy that explicitly allows only specific IAM roles to perform encryption and decryption operations, plus the necessary service principals like s3.amazonaws.com and logs.us-east-1.amazonaws.com so the services can actually use the keys. This implements the principle of least privilege at the encryption layer where even if someone compromises credentials they can't decrypt data unless they have permissions on both the resource and the KMS key.

The data processing pipeline uses Lambda functions running in the VPC private subnets with security groups that allow outbound HTTPS traffic only to our VPC endpoints. We implement two Lambda functions—a data processor that reads from S3, performs validation and transformation, writes to DynamoDB, and stores processed results back to S3, plus a data validator that performs compliance checks on processed data. Both functions use python3.11 runtime with two hundred fifty-six megabytes of memory which is sufficient for boto3 SDK operations and data processing, and five-minute timeouts to handle database operations without timing out. The functions have IAM execution roles that grant access only to specific S3 buckets and specific DynamoDB tables they need—no wildcard permissions anywhere.

Storage architecture uses three S3 buckets: raw data for incoming payment transactions, processed data for validated and transformed records, and audit logs for compliance trails. Every bucket has versioning enabled so we can track all changes to objects which PCI-DSS requires, server-side encryption using our customer-managed KMS key, and all four public access block settings enabled so there's zero chance of accidental public exposure. The bucket policies are critical—they explicitly deny any uploads that don't use encryption, and they require all requests to originate from our VPC endpoint using an aws:SourceVpce condition. This means even with valid credentials you cannot access these buckets from the internet or from any other VPC. We also implement lifecycle policies that transition objects to Glacier storage after thirty days to reduce costs and expire objects after ninety days once they're past our retention requirements.

DynamoDB tables store processing metadata and audit trails with point-in-time recovery enabled so we can restore to any point in the last thirty-five days if we need to investigate a compliance incident. The tables use on-demand billing which is perfect for our variable workload where we might process ten thousand transactions one day and a hundred thousand the next, and they're encrypted using our DynamoDB KMS key. We implement two tables—a metadata table tracking processing jobs with status and timestamps, and an audit table recording every data access operation with who accessed what and when.

IAM architecture implements separation of duties through five distinct roles. The Lambda execution roles for our processor and validator functions have permissions only for their specific S3 buckets and DynamoDB tables plus CloudWatch Logs and VPC networking permissions they need to run in private subnets. The data processor role is for humans or services that need to trigger processing jobs but can't access the raw data directly. The auditor role has read-only access to everything—S3 buckets, DynamoDB tables, CloudWatch Logs, Lambda configurations—but explicitly denies any write, delete, or modify permissions. The administrator role has broader permissions for infrastructure management but still follows least privilege by restricting actions to specific resource ARNs instead of using wildcards.

Monitoring uses CloudWatch Log groups for each Lambda function plus VPC Flow Logs capturing all network traffic in our VPC so we can detect any anomalous connections. All log groups use ninety-day retention which meets our compliance requirement for audit trail retention, and they're encrypted using our CloudWatch Logs KMS key. We also enable VPC Flow Logs which create flow records for every network interface in our VPC showing source IP, destination IP, ports, and protocols. This gives us complete visibility into network behavior and would immediately show us if somehow a component tried to reach the internet.

Cost-wise this entire environment runs under twenty-five dollars per month if cleanup fails. The two interface VPC endpoints for Lambda and CloudWatch Logs cost about fourteen dollars sixty cents combined since they're seven thirty each, the three KMS keys cost three dollars monthly, S3 storage for our test data is maybe fifty cents, DynamoDB on-demand is a couple dollars for testing volumes, and CloudWatch Logs with ninety-day retention on minimal data is another dollar or two. The gateway endpoints for S3 and DynamoDB are completely free which is why we use them instead of interface endpoints—same functionality but no cost. Total monthly cost stays well under a hundred dollars while providing enterprise-grade security and compliance controls.


## Technical Requirements

### VPC and Network Isolation Infrastructure

Create a VPC in us-east-1 with CIDR block 10.0.0.0/16 providing sixty-five thousand private IP addresses for our processing environment. This VPC must have absolutely no internet gateway and no NAT gateway—complete isolation from the public internet is critical for PCI-DSS compliance. Use the aws_availability_zones data source to get the list of available AZs in us-east-1 and create three private subnets distributed across three different availability zones for high availability. Use CIDR blocks 10.0.1.0/24, 10.0.2.0/24, and 10.0.3.0/24 for the three subnets providing two hundred fifty-four usable IP addresses each which is plenty for our Lambda ENIs and VPC endpoint interfaces.

Create a route table for the private subnets and associate all three subnets with it. This route table won't have a default route to an internet gateway like a public subnet would—it only has the local VPC route that's created automatically. Later we'll add VPC endpoint routes to this route table for S3 and DynamoDB gateway endpoints. Enable VPC Flow Logs on the VPC to capture all network traffic and send the flow records to a CloudWatch Logs group so we have complete visibility into network behavior for security monitoring and compliance auditing.

Set up DNS resolution and DNS hostnames on the VPC so our interface VPC endpoints can use private DNS names. This means when Lambda code calls boto3 to access CloudWatch Logs it resolves logs.us-east-1.amazonaws.com to the private IP address of our VPC endpoint interface instead of the public AWS endpoint. This is critical because it ensures all API traffic stays within our VPC and never traverses the internet.

### VPC Endpoints for AWS Service Access Without Internet

Create four VPC endpoints to provide AWS service access from our isolated private subnets. Implement two gateway endpoints and two interface endpoints using the appropriate types for each service.

For S3 and DynamoDB use gateway endpoints with vpc_endpoint_type set to Gateway. Gateway endpoints are free and work by adding routes to your route tables that direct traffic destined for S3 or DynamoDB through the VPC endpoint instead of the internet gateway. Create aws_vpc_endpoint resources for both services specifying the service names com.amazonaws.us-east-1.s3 and com.amazonaws.us-east-1.dynamodb, and associate them with the private subnet route table using route_table_ids. You can optionally add endpoint policies restricting access to specific buckets or tables but for testing we can use full access policies.

For Lambda and CloudWatch Logs use interface endpoints with vpc_endpoint_type set to Interface. Interface endpoints create elastic network interfaces in your subnets with private IP addresses and optionally use private DNS so service calls resolve to those private IPs. Create aws_vpc_endpoint resources for services com.amazonaws.us-east-1.lambda and com.amazonaws.us-east-1.logs, specify all three private subnet IDs in subnet_ids so you get an ENI in each AZ for high availability, set private_dns_enabled to true so DNS resolution works automatically, and associate them with a VPC endpoint security group that allows inbound HTTPS traffic from your Lambda security group.

Don't forget that interface endpoints cost about seven dollars thirty cents per month each so we have two running which is about fourteen sixty monthly, but this is acceptable for the compliance value they provide and we need them since Lambda and CloudWatch Logs don't support gateway endpoints.

### KMS Encryption Keys with Service Principal Permissions

Create three customer-managed KMS keys for encrypting S3 buckets, DynamoDB tables, and CloudWatch Logs respectively. Each key needs a comprehensive key policy that allows the root account full permissions, grants encrypt and decrypt permissions to specific IAM roles, and critically allows the AWS service principals to use the key.

For the S3 encryption key the policy must include a statement allowing the s3.amazonaws.com service principal to perform kms:Decrypt and kms:GenerateDataKey actions so S3 can encrypt objects when they're uploaded and decrypt them when they're retrieved. Similarly the DynamoDB encryption key needs dynamodb.amazonaws.com with the same permissions, and the CloudWatch Logs key needs logs.us-east-1.amazonaws.com service principal access. Without these service principal permissions the services will fail with access denied errors when trying to encrypt data even though encryption is configured on the resources.

Include statements in each key policy granting kms:Decrypt, kms:Encrypt, and kms:GenerateDataKey permissions to the Lambda execution role ARNs so your Lambda functions can read and write encrypted data. Use specific Resource ARNs in the statements pointing to the key ARN instead of wildcards to follow least privilege principles.

Set deletion_window_in_days to seven days which is the minimum allowed value for testing environments. In production you'd use thirty days to prevent accidental key deletion but for testing we want to minimize the waiting period if we need to recreate the infrastructure. Enable automatic key rotation by setting enable_key_rotation to true so AWS automatically rotates the key material every year which is a security best practice.

Create KMS key aliases for each key using names like alias/s3-encryption, alias/dynamodb-encryption, and alias/logs-encryption so you can reference the keys with friendly names instead of tracking the generated key IDs.

### S3 Buckets with Versioning, Lifecycle, and VPC Endpoint Enforcement

Create three S3 buckets for raw data storage, processed data storage, and audit logs. Every bucket must follow strict security and compliance configurations with versioning, encryption, lifecycle management, and access policies.

Set force_destroy to true on all buckets so terraform destroy can delete them even if they contain objects. This is critical for testing environments where we need clean teardown. In production you'd set this to false and handle bucket deletion separately.

Enable versioning on every bucket using the aws_s3_bucket_versioning resource with status set to Enabled. Versioning is required for PCI-DSS compliance so we can track all changes to objects and recover previous versions if data is modified or deleted. This prevents both accidental deletions and malicious tampering from being permanent.

Configure server-side encryption using the aws_s3_bucket_server_side_encryption_configuration resource specifying your S3 KMS key ARN with sse_algorithm set to aws:kms. This ensures all objects are encrypted at rest using your customer-managed key instead of the AWS-managed key.

Implement public access blocks using aws_s3_bucket_public_access_block with all four settings set to true—block_public_acls, block_public_policy, ignore_public_acls, and restrict_public_buckets. This prevents any possibility of buckets becoming publicly accessible through ACLs or bucket policies.

Create lifecycle policies using aws_s3_bucket_lifecycle_configuration with rules that transition objects to GLACIER storage class after thirty days to reduce storage costs and expire objects after ninety days to comply with data retention policies. Critical for AWS Provider version five point x: you must include a filter block in every rule even if you're applying the rule to all objects. Use filter with an empty prefix like filter { prefix = "" } to apply to all objects. Missing this filter block will cause terraform plan errors.

For testing and CI/CD environments, avoid implementing VPC endpoint restrictions in S3 bucket policies as this prevents Terraform and automated tools running outside the VPC from managing the infrastructure. The security controls are enforced through IAM role permissions, encryption configuration, public access blocks, and network isolation via VPC architecture. In production deployments, VPC endpoint enforcement can be added after initial infrastructure deployment by updating bucket policies to include aws:SourceVpce conditions, ensuring the root account exception is included to maintain administrative access.

### Lambda Functions in VPC for Data Processing

Create two Lambda functions—a data processor and a data validator—both running in your private subnets with access to S3 and DynamoDB through VPC endpoints.

Use python3.11 runtime which is the current supported version. Set memory_size to two hundred fifty-six megabytes minimum since one hundred twenty-eight is too low for boto3 SDK operations and data processing workloads. Set timeout to three hundred seconds for database operations because the default three seconds is way too short for functions that read from S3, process data, and write to DynamoDB.

Configure vpc_config with subnet_ids listing all three private subnet IDs and security_group_ids referencing your Lambda security group. This attaches the function to your VPC and creates elastic network interfaces in the subnets. Note that this adds thirty to sixty seconds to the first invocation while the ENI is being attached which is normal behavior for VPC Lambda functions.

Set environment variables for the S3 bucket names and DynamoDB table names so the Lambda code can reference them without hardcoding. Use Terraform resource references like aws_s3_bucket.raw_data.id to ensure dependencies are properly tracked.

Create execution roles using aws_iam_role with assume role policies that trust the lambda.amazonaws.com service principal. Attach permission policies that grant s3:GetObject and s3:PutObject for specific bucket ARNs, dynamodb:GetItem and dynamodb:PutItem for specific table ARNs, logs:CreateLogGroup, logs:CreateLogStream, and logs:PutLogEvents for CloudWatch Logs integration, and ec2:CreateNetworkInterface, ec2:DescribeNetworkInterfaces, and ec2:DeleteNetworkInterface for VPC networking permissions. Use resource-specific ARNs instead of wildcards to follow least privilege.

Critical: Add depends_on to each Lambda function listing the IAM role and all policy attachment resources. This prevents IAM eventual consistency issues where Terraform tries to create the Lambda before IAM has fully propagated the role. Without depends_on you'll get errors about invalid role or role not found during terraform apply.

Package your Lambda code using the archive_file data source to create a ZIP file from your lambda_function.py file. Make sure the file is named exactly lambda_function.py and the handler function is named lambda_handler since that's what the integration tests will expect.

The data processor function should implement logic to read objects from the raw data S3 bucket, perform basic validation like checking required fields and data types, transform the data as needed, write metadata to the DynamoDB metadata table, and store processed results to the processed data S3 bucket. Include comprehensive error handling and logging using the Python logging module which automatically sends to CloudWatch Logs when running in Lambda.

The data validator function should read from the processed data bucket, perform compliance checks like verifying encryption and data format, write audit records to the DynamoDB audit table, and log results to CloudWatch. Both functions should use boto3 SDK for all AWS service interactions.

### DynamoDB Tables with Point-in-Time Recovery and KMS Encryption

Create two DynamoDB tables for storing processing metadata and audit records. Both tables need point-in-time recovery enabled for compliance requirements and encryption using your DynamoDB KMS key.

Use billing_mode set to PAY_PER_REQUEST for on-demand capacity which is perfect for testing workloads with variable traffic. On-demand automatically scales to handle whatever request volume you have without managing capacity units. Use hash_key for the partition key and optionally add range_key for a sort key if you need it for query patterns.

For the metadata table use a partition key like job_id with type S for string. For the audit table use a partition key like audit_id or combine something like user_id as partition and timestamp as sort key if you need time-based queries.

Enable point_in_time_recovery by setting enabled to true in the point_in_time_recovery block. This is explicitly required by the task for compliance and allows restore to any point in the last thirty-five days. Note that PITR doesn't prevent deletion during terraform destroy—it's a recovery feature not a deletion protection feature.

Configure server_side_encryption with your DynamoDB KMS key ARN and set enabled to true. This encrypts all data at rest in the table.

Critical for cleanup: Set deletion_protection_enabled to false so terraform destroy can delete the tables. The default is false but explicitly set it to be clear about your intentions. In production you'd set this to true to prevent accidental deletion but for testing we need clean teardown capability.

Apply tags including DataClassification, Environment, and Owner which are required by the task constraints. Use default_tags in the provider configuration to automatically apply these to all resources.

### CloudWatch Log Groups with Retention and Encryption

Create CloudWatch Log groups for Lambda function logs, VPC Flow Logs, and any additional audit logging needs. Each log group needs ninety-day retention and encryption using your CloudWatch Logs KMS key.

For Lambda functions the log groups are created automatically when the function writes logs but you should create them explicitly in Terraform so you can set retention and encryption. Use log group names following the pattern /aws/lambda/[function-name] to match what Lambda expects.

For VPC Flow Logs create a log group with a name like /aws/vpc/flow-logs and configure it as the destination when you set up VPC Flow Logs on your VPC resource.

Set retention_in_days to ninety which meets the task requirement for audit trail retention of at least ninety days. Don't use zero or omit this setting because that sets infinite retention which makes the log groups expensive and hard to delete. Ninety days balances compliance needs with cost control.

Set kms_key_id to your CloudWatch Logs KMS key ARN to enable encryption at rest for all log data. Remember that your KMS key policy must include permissions for the logs.us-east-1.amazonaws.com service principal or encryption will fail with access denied.

Consider creating a log group policy using aws_cloudwatch_log_resource_policy if you need to restrict which IAM principals can write to the log groups but this might add complexity so evaluate if it's necessary for your requirements.

### IAM Roles with Separation of Duties and Least Privilege

Create five distinct IAM roles implementing separation of duties for data processors, auditors, and administrators plus the Lambda execution roles.

The Lambda execution roles were covered in the Lambda section but to summarize they need Lambda basic execution permissions for CloudWatch Logs, VPC execution permissions for ENI management, specific S3 bucket access, specific DynamoDB table access, and KMS decrypt and encrypt permissions for the relevant keys. Use inline policies or attach managed policies but always use specific resource ARNs never wildcards.

The data processor role is for humans or services that trigger processing jobs. This role should have permissions to invoke the Lambda functions using lambda:InvokeFunction for the specific function ARNs. It should NOT have direct access to S3 buckets or DynamoDB tables—the workflow is to call Lambda which does the processing with its own credentials. The assume role policy should trust your AWS account or specific IAM users who are data processors.

The auditor role needs read-only access to everything for compliance auditing. Grant s3:GetObject, s3:GetObjectVersion, and s3:ListBucket for all three S3 buckets, dynamodb:GetItem, dynamodb:Query, and dynamodb:Scan for both DynamoDB tables, logs:GetLogEvents and logs:FilterLogEvents for CloudWatch Log groups, lambda:GetFunction and lambda:GetFunctionConfiguration for Lambda inspection, and ec2:DescribeVpcs, ec2:DescribeSubnets, ec2:DescribeVpcEndpoints for network inspection. Critically use explicit Deny statements for any write, delete, or modify actions to ensure auditors cannot change data even accidentally. The assume role policy should trust a separate auditor account or specific auditor IAM users.

The administrator role has broader permissions for infrastructure management including creating and modifying resources but still follows least privilege by using specific resource ARNs for critical operations. This role can modify Lambda configurations, update IAM policies, create new KMS keys, and manage VPC configurations but should not have permissions to decrypt production data or modify audit logs. Use conditions in policies where appropriate to restrict actions to specific times or require MFA for sensitive operations.

For all roles ensure the assume role policies follow the principle of least privilege by specifying exactly which principals can assume the role using AWS account ARNs or specific user or role ARNs. Don't use wildcard principals that would allow any AWS account to assume the role.

### Security Groups with No Public Access

Create two security groups—one for Lambda functions and one for VPC endpoints—with explicit ingress and egress rules that don't use 0.0.0.0/0 CIDR blocks.

For the Lambda security group create an aws_security_group resource with no inline rules. Then create separate aws_security_group_rule resources for the egress rules. Lambda needs outbound HTTPS traffic to VPC endpoints so create an egress rule allowing TCP port 443 to the VPC endpoint security group using source_security_group_id instead of a CIDR block. This implements the principle of least privilege by restricting Lambda to only communicate with your VPC endpoints.

For the VPC endpoint security group create ingress rules allowing TCP port 443 from the Lambda security group using source_security_group_id. This allows Lambda to make API calls through the interface endpoints. The VPC endpoint security group also needs egress rules to allow return traffic but you can use a broad CIDR for egress like 0.0.0.0/0 since egress is less of a security concern than ingress.

Use separate aws_security_group_rule resources instead of inline rules in the aws_security_group blocks to avoid circular dependency issues when security groups reference each other. This is a common Terraform gotcha where inline rules create a cycle that Terraform can't resolve.

Tag both security groups with descriptive names and the required tags DataClassification, Environment, and Owner.

### Resource Tagging and Naming Conventions

Apply consistent tagging to all resources using default_tags in the provider configuration and additional resource-specific tags where needed. The task explicitly requires DataClassification, Environment, and Owner tags on all resources.

Use deterministic naming patterns following {resource-type}-{purpose}-{environment} without random strings. For example vpc-secure-processing-dev, lambda-data-processor-dev, dynamodb-metadata-dev. This makes resources easy to identify and debug. The only exception is S3 buckets which require globally unique names so append the AWS account ID: s3-raw-data-dev-{account-id}.

Don't use random_string resources for naming because this causes integration test failures when tests try to find resources by expected names. The tests will look for resources following the deterministic pattern and won't find them if you've added random suffixes.

## Provider Configuration

Configure Terraform to use version one point five or higher and AWS provider version five point x. The labeling tool uses provider version five so you must use tilde greater than five point zero not six point x or you'll have compatibility issues.

Use a single AWS provider for us-east-1 region with default tags applied to all resources. Include the random provider for generating passwords or other random values and the archive provider for Lambda function packaging.

Define variables for environment with a default value like dev and any other configuration values that might change between environments. Use proper type constraints and descriptions on all variables.

In the provider block configure default_tags that apply the required DataClassification, Environment, and Owner tags to all resources automatically. This ensures consistent tagging without repeating tag blocks on every resource.

## File Organization

Structure the implementation in the lib directory with provider.tf for provider and variable configuration and main.tf for all resource definitions.

The provider.tf file should contain the terraform block with required providers and versions, the provider blocks for aws, random, and archive, and all variable definitions.

The main.tf file should contain data sources for caller identity and availability zones, all infrastructure resources organized logically by category (networking, security, storage, compute, database, monitoring), and comprehensive outputs at the end.

Create a lambda_function.py file in the lib directory containing the Python code for your Lambda functions. Use a single file with multiple handler functions (lambda_handler for the processor, validator_handler for the validator) or separate files if the logic is complex. Make sure the handler function is named lambda_handler for the primary function since that's what the labeling tool expects.

## Outputs

Provide comprehensive outputs for all resources created so integration tests can validate the infrastructure. The tests read from cfn-outputs/flat-outputs.json so every important resource needs an output.

For networking output vpc_id, private_subnet_ids as a list, route_table_id, the VPC endpoint IDs for all four endpoints (S3, DynamoDB, Lambda, CloudWatch Logs), and both security group IDs.

For security output all three KMS key ARNs, all five IAM role ARNs, and the IAM role names.

For storage output all three S3 bucket names and ARNs so tests can verify they exist and check their configurations.

For compute output both Lambda function names and ARNs plus the Lambda execution role ARNs.

For database output both DynamoDB table names and ARNs.

For monitoring output all CloudWatch Log group names including the Lambda function log groups and VPC Flow Logs group.

For metadata output the environment value, AWS region, AWS account ID from the caller identity data source, and optionally a deployment timestamp.

Mark sensitive outputs with sensitive equals true if they contain endpoints or credentials though in this case most outputs are just resource identifiers so sensitivity is less of a concern.

Use descriptions on every output explaining what the value represents and why it's useful for testing or operational purposes.

Aim for forty to fifty outputs total covering every resource created and their key attributes. The integration tests depend on these outputs to find resources and validate configurations so comprehensive outputs are critical for test success.