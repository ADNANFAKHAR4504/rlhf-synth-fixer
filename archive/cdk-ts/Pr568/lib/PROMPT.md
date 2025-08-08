I need to design an AWS CDK stack using TypeScript to set up an enterprise-level secure network infrastructure with a focus on security and monitoring. 

The infrastructure should include:

- A Virtual Private Cloud (VPC) with at least three subnets across at least two availability zones for high availability
- VPC Flow Logs to monitor traffic, stored securely in S3 bucket with KMS encryption
- Security Groups allowing only SSH on port 22 and HTTP on port 80 with specific CIDR blocks
- IAM role for logging bucket with limited permissions
- AWS Config to assess and audit VPC resource configurations
- CloudTrail to log API calls in the VPC
- All resources tagged for cost center and environment
- S3 bucket with SSL enforcement and no public access
- CloudWatch alarm for unauthorized SSH access detection

Please deploy across us-east-1 and us-west-2 regions for high availability. Include the latest AWS VPC Block Public Access feature and Amazon VPC Lattice for service-to-service connectivity and monitoring. Use AWS Well-Architected Framework security principles.

Please provide infrastructure code with one code block per file.