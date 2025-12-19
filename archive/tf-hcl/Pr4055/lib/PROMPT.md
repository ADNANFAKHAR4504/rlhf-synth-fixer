Set up a secure infrastructure environment using Terraform. 
The environment is intended to host a web application with the following requirements:
All resources must be provisioned in the us-west-2 AWS region. 
Implement IAM roles with policies confined to required actions only. 
Configure security groups to limit inbound access to specific IPs. 
Encrypt all data at rest using AWS KMS. 
Enable logging and monitoring through S3 for storage and CloudWatch for monitoring.
Ensure high availability by launching EC2 instances in subnets within at least two availability zones. Integrate an RDS instance with automatic backups.
Protect all public-facing resources using AWS WAF.
Ensure HIPAA compliance by encrypting all data transfers using HTTPS.