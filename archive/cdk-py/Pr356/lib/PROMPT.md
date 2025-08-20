# CDK Comprehensive Infrastructure Platform (Python)

## Objective

Create a comprehensive, secure AWS infrastructure platform using **CDK with Python** that includes:

- **VPC** with public/private subnets across multiple AZs
- **EC2** instance with proper security groups and monitoring
- **RDS PostgreSQL** database in private subnets
- **Application Load Balancer** for high availability
- **S3** bucket with encryption and security policies
- **KMS** encryption for data at rest
- **IAM** roles following least privilege principles
- **VPC Flow Logs** for network monitoring

## Requirements

1. **Network Infrastructure**
   - VPC with CIDR 10.0.0.0/16 across 2 availability zones  
   - Public subnets (24-bit mask) for internet-facing resources
   - Private subnets (24-bit mask) for databases and internal services
   - Single NAT Gateway for cost optimization
   - DNS resolution enabled

2. **Security Configuration**
   - Security groups with restrictive ingress rules
   - Allow HTTP/HTTPS traffic from allowed IP ranges to ALB
   - Allow SSH access from allowed IP ranges to EC2
   - Allow PostgreSQL access only from EC2 to RDS
   - KMS encryption for S3 and RDS with key rotation enabled

3. **Compute Resources**
   - EC2 t3.micro instance in public subnet
   - Amazon Linux 2 with basic web server setup
   - CloudWatch detailed monitoring enabled
   - Elastic IP for stable external access
   - IAM role with minimal S3 and CloudWatch permissions

4. **Database**
   - RDS PostgreSQL 14.9 t3.micro instance
   - Deployed in private subnets with DB subnet group
   - Encrypted storage using KMS
   - Automated backups with 7-day retention
   - Performance Insights enabled
   - CloudWatch log exports for monitoring

5. **Load Balancing**
   - Application Load Balancer in public subnets
   - Target group pointing to EC2 instance
   - Health checks configured for port 80
   - Security group allowing HTTP/HTTPS from allowed IPs

6. **Storage & Encryption**
   - S3 bucket with KMS encryption
   - Versioning enabled with lifecycle policies
   - Block all public access
   - Secure transport enforced
   - Transition to Glacier after 30 days

7. **Monitoring & Logging**
   - VPC Flow Logs to CloudWatch
   - EC2 CloudWatch detailed monitoring
   - RDS Performance Insights
   - CloudWatch log groups with retention policies

8. **CDK Implementation**
   - Stack defined in `lib/tap_stack.py`
   - App entrypoint in `tap.py`
   - Environment-specific configurations
   - Proper resource tagging
   - CloudFormation outputs for key resources

## Folder Structure
```
.
├── tap.py                   # CDK app entrypoint
├── lib/
│   └── tap_stack.py        # Main stack definition
├── tests/
│   ├── unit/
│   │   └── test_tap_stack.py    # Unit tests
│   └── integration/
│       └── test_tap_stack.py    # Integration tests
└── cdk.json                # CDK configuration
```

## Test Expectations

The infrastructure should pass comprehensive testing covering:
- VPC and subnet creation across AZs
- Security group rules and access controls  
- EC2 instance deployment and configuration
- RDS database creation in private subnets
- ALB configuration and target group health
- S3 bucket encryption and security policies
- KMS key creation and usage
- IAM roles and permission scoping
- VPC Flow Logs and monitoring setup
- CloudFormation outputs and resource references