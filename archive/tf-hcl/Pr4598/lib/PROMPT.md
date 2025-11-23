Create a single Terraform configuration file named tap_stack.tf containing all variables, locals, resources, and outputs (no provider block, no module references) that fulfills the following security and infrastructure requirements:
1. There is requirement to have resources deployed in this region us-east-1 . So Please create proper VPC and set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16.
2. VPCs should have 2 private and 2 public subnets in VPC. Also  crate necessary Nat gateway, internet gateway, route table and route table association as per the network infrastructure requirements. Implement high availability with at least three availability zones, automatic failover, and robust redundancy plans. Use NAT Gateways to allow internet access for resources in private subnets. 
3. Provision an S3 bucket with server-side encryption enabled.
4. Set up an API Gateway with logging enabled for all stages
5.. Launch an EC2 instance using amazon linux2 latest ami into the  VPC with a security group that permits SSH access only from the IP range 203.0.113.0/24.
6. Attach an IAM role to the EC2 instance granting permissions to access S3 and CloudWatch.
7. Configure CloudWatch Alarms to monitor EC2 instance CPU and network usage
8. Use Base64 encoding for all user data scripts on the EC2 instance.
9. Deploy a Lambda function which is triggered by events from an S3 bucket.   with a Lambda function for data processing on upload events. But dont rely on any zip file infact use the basic code in the tap_stack.tf file itself for this lambda. But please ensure that  I dont need zip file for the lambda function just create it with inline code. so please create tap_stack.tf file accordingly. And this lambda function should logs messages to CloudWatch.
10. Apply Tagging to all resources "Environment:prd"
11.Ensure compliance with all security constraints including least privilege IAM roles.
12. Use consistent, descriptive naming conventions defined by locals or input variables for all resources for easier management.
13. Give character size 4 suffix in small letters only with each resource so that stack dont get error of "resource already exists". Also use small characters only for this suffix. 
14. S3 access logging, VPC flow logs and KMS encryption for S3 is not required as per the task requirement.
15. Only 2 AZs are required and 3 AZs are not required.
16. AWS WAF , Secret Manager and KMS key is not required as per the task requirement.
17. Monitoring and observability is not required as per the task requirement as such.
18. VPC Endpoints and cost opitimisation is not required as per task requirement.
19. VPC Flow Logs and Cloudtrail not required as per the task requirement.
20. KMS encryption for the S3 is also not required.
21. I dont need cloudwatch dashboard and custom metrices.
22. S3 life cycle policy is not needed as data is required for longer duration.
