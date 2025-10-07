Generate CloudFormation YAML infrastructure code for a hotel booking platform that needs to handle 4,800 daily reservations.

The system should be deployed in us-east-1 with:

Network setup:
- VPC with CIDR 10.170.0.0/16
- Public and private subnets across multiple availability zones
- Internet gateway and NAT gateways for outbound traffic

Application layer:
- Application Load Balancer with sticky sessions enabled for checkout flows
- Auto Scaling group with t3.medium instances (minimum 2, maximum 8)
- Target group health checks

Database layer:
- Aurora MySQL cluster with Multi-AZ deployment for high availability
- Automated backups enabled with 7 day retention
- Connection from application instances only

Caching layer:
- ElastiCache Redis cluster for inventory locking with TTL support
- Single node deployment is acceptable for this use case

Storage:
- S3 bucket for storing booking confirmation documents
- Versioning enabled for audit trail

Security:
- Security groups for each tier (web, app, database, cache)
- Proper ingress/egress rules following least privilege
- Enable VPC Flow Logs for monitoring

Monitoring:
- CloudWatch dashboard with booking success rate metrics
- Auto Scaling based on CPU utilization (target 60%)

Web Application Firewall:
- Implement AWS WAF v2 Web ACL to protect the Application Load Balancer
- Include AWS Managed Rules Core Rule Set for common web exploits protection
- Add rate-based rule limiting requests to 2000 per 5 minutes per IP address
- Configure geo-blocking to restrict access from high-risk countries
- Enable logging to CloudWatch Logs for WAF activity monitoring

Backup Strategy:
- Configure AWS Backup vault with KMS encryption for secure backup storage
- Create backup plan with daily scheduled backups at 2:00 AM UTC
- Apply backup plan to Aurora database cluster with 30-day retention
- Configure lifecycle transitions moving backups to cold storage after 7 days
- Enable cross-region backup copy to us-west-2 for disaster recovery

Additional requirements:
- Use AWS Systems Manager Session Manager for EC2 access
- Include IAM instance profile for EC2 instances to access S3 and CloudWatch
- Tag all resources with Environment=Production and Project=BookingPlatform
- Add CloudWatch dashboard widgets for WAF blocked requests metrics

Please provide the complete CloudFormation template in YAML format as a single file.