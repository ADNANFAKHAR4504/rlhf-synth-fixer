We need a Python script using Boto3 to perform infrastructure QA validation across our AWS account. The script should analyze EC2 instances, VPC networking, and CloudWatch monitoring to verify that our infrastructure follows best practices and is properly configured.

Here's what the script needs to analyze:

EC2 Instance Validation: Check all EC2 instances and verify they are properly connected to VPCs with appropriate subnet placement. The script should identify instances running in public subnets that should be in private subnets, instances without proper security group configurations, and instances that are not sending logs to CloudWatch. For each instance, verify that its security groups allow outbound traffic to CloudWatch endpoints for log delivery.

VPC Network Analysis: Analyze VPC configurations and their relationship with EC2 instances. Check that VPCs have proper route tables configured, that instances in private subnets can reach CloudWatch through VPC endpoints or NAT gateways, and that security groups are correctly attached to instances. Identify VPCs that have EC2 instances but are missing CloudWatch VPC endpoints, which could cause monitoring gaps.

CloudWatch Integration Verification: Verify that EC2 instances are properly integrated with CloudWatch. Check that instances have CloudWatch agents installed and configured, that CloudWatch log groups exist for the instances, and that CloudWatch metrics are being collected. The script should identify instances that are not sending metrics to CloudWatch, instances with missing log groups, and instances where CloudWatch agent configuration is incorrect.

Cross-Service Connectivity: The script needs to validate the connectivity flow between services. Verify that EC2 instances can communicate with CloudWatch through their VPC configuration, that security groups allow CloudWatch traffic, and that IAM roles attached to instances are authorized to write to CloudWatch. Check that VPC flow logs are enabled and sending data to CloudWatch Logs, creating a connection between VPC networking and CloudWatch monitoring.

For the output, generate an infrastructure_qa_report.json file that includes:
- EC2 instances with configuration issues such as public subnet placement or missing CloudWatch integration
- VPCs with networking misconfigurations such as missing routes or security group issues
- CloudWatch integration gaps such as missing log groups or agent configuration problems
- Cross-service connectivity issues such as IAM authorization problems or VPC endpoint configuration

The JSON should include a summary section with:
- Total instances analyzed
- Count of instances properly integrated with CloudWatch
- Count of VPCs with proper monitoring configuration
- List of critical connectivity issues between EC2, VPC, and CloudWatch

Please provide the final Python code in lib/analyse.py.
