Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in two different regions us-east-2 and us-west-1. So Please create proper VPC in each region and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for the primary and 10.1.0.0/16 for the secondary region. Please make us-east-2 primary and us-west-1 as secondary.
2. VPCs should have  private and  public subnets in each VPC for each region.
3. Include prior vulnerability assessment validation for AMIs before EC2 provisioning (simulate via appropriate tag or data source). Create all the resources for primary region. Include prior vulnerability assessment validation for AMIs before EC2 provisioning (simulate via appropriate tag or data source).
4. Implement IP whitelisting for SSH access restricted to a specific CIDR block variable.
5.Encrypt all EBS volumes and sensitive data at rest using AWS KMS with an AWS-managed key.
6. Define IAM roles and policies strictly following the principle of least privilege.
7.Adjust security groups to only allow incoming traffic on necessary ports defined by variables and specific CIDR only of the subnet or VPC CIDR only
8. Ensure all web-facing resources are accessible exclusively over HTTPS only.
9.Enable detailed logging for all possible AWS resources EC2, RDS, IAM with logs ceintralized in CloudWatch Logs. 
10.Configure CloudWatch Alarms to monitor and alert on security-related events based on customizable thresholds for CPU alarms only.Also no cloudtrail logging is needed as per the task requirement.
11. Apply S3 Buckets configuration enforcing Block Public Access to prevent unintended public exposure.
12. Create RDS in each region with RDS specific security groups.
13. NAT Gateway and routetable and route table association is needed in secondary region as well.
14.Automate scheduled backups for all RDS databases using native RDS snapshot features with configurable retention.
15. Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.

Declare all necessary input variables, locals, resources, and outputs within this single file, excluding sensitive outputs, and referencing the AWS region only via variable (assume AWS providers handled elsewhere).

Provide outputs for essential identifiers such as VPC IDs, Subnet IDs, RDS instance endpoints, S3 bucket, AMI related, IAM roles and all the other resources which will be created as part of the above requirements.

Ensure the entire Terraform code is well-commented, concise, fully deployable, and compliant with best security and infrastructure practices without using any external modules or pre-existing resources.
