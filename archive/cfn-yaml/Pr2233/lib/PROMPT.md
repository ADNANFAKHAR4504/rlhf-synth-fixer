We're setting up a secure AWS infrastructure that needs to meet strict security and compliance requirements. Here are the key requirements:

S3 Storage:
- All S3 buckets must have server-side encryption enabled
- Follow naming convention 'myapp-<resource>'

IAM and Access Management:
- All IAM roles must enforce MFA for console access
- No overly permissive IAM policies (avoid 'Effect': 'Allow' with 'Action': '*')
- Follow principle of least privilege

EC2 and Compute:
- All EC2 instances must be within a VPC
- Use latest Amazon Linux AMI for security updates
- All EBS volumes must be encrypted
- Security groups must be properly configured
- CloudWatch Alarms for CPU utilization (>80%)

Networking and High Availability:
- Subnets must span at least two Availability Zones
- Proper network segmentation with security groups

Monitoring and Logging:
- CloudTrail enabled for all management events across regions
- AWS Config enabled for infrastructure change monitoring
- CloudWatch detailed monitoring for performance metrics

The goal is to create a CloudFormation template (YAML) that can be used across environments. The template should:
- Include parameters for environment-specific values
- Follow the 'myapp-<resource>' naming convention
- Be configured for the us-east-1 region
- Include proper Outputs section for resource references
- Implement all security controls and monitoring requirements

The template should be well-documented and include clear descriptions for each resource and parameter. Security group rules should be explicit and documented.