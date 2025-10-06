# README.md

# Secure Content Delivery System for E-book Publishing

This Terraform configuration deploys a secure, scalable, and cost-effective content delivery system for serving e-books to 5,000 daily readers globally.

## Architecture Overview
┌─────────────────┐ ┌──────────────────┐ ┌─────────────────┐ │ Route 53 │────▶│ CloudFront │────▶│ S3 │ │ DNS │ │ CDN │ │ Storage │ └─────────────────┘ └──────────────────┘ └─────────────────┘ │ │ ▼ ▼ ┌─────────────┐ ┌──────────────┐ │ WAF │ │ KMS │ │ Protection │ │ Encryption │ └─────────────┘ └──────────────┘ │ ▼ ┌──────────────┐ │ CloudWatch │ │ Monitoring │ └──────────────┘


### Key Components

1. **Amazon S3**: Secure storage for e-books with server-side encryption
2. **Amazon CloudFront**: Global CDN for low-latency content delivery
3. **Route 53**: DNS management and routing
4. **AWS KMS**: Customer-managed keys for encryption
5. **AWS WAF**: Web Application Firewall for additional security
6. **CloudWatch**: Comprehensive monitoring and alerting
7. **CloudTrail**: Audit logging for compliance

## Features

### Security
- **Encryption at Rest**: All content encrypted using KMS customer-managed keys
- **HTTPS Only**: Enforced TLS 1.2+ for all connections
- **Origin Access Identity**: S3 bucket accessible only through CloudFront
- **WAF Protection**: Rate limiting and managed rule sets
- **Security Headers**: HSTS, X-Frame-Options, CSP headers
- **Audit Logging**: CloudTrail integration for compliance

### Performance
- **Global Edge Locations**: Content cached at 400+ edge locations
- **Optimized Caching**: Separate cache behaviors for different content types
- **Compression**: Automatic gzip compression for smaller file sizes
- **IPv6 Support**: Dual-stack support for modern networks

### Cost Optimization
- **S3 Lifecycle Policies**: Automatic transition to cheaper storage classes
- **CloudFront Price Class**: Configurable edge location selection
- **Log Retention**: Automatic cleanup of old logs
- **Cost Anomaly Detection**: Automated alerts for unusual spending

### Monitoring
- **Real-time Dashboard**: CloudWatch dashboard for key metrics
- **Automated Alerts**: SNS notifications for issues
- **Access Pattern Analysis**: Track content popularity
- **Performance Metrics**: Cache hit rate, origin latency, error rates

## Prerequisites

1. AWS Account with appropriate permissions
2. Terraform >= 1.0
3. Domain name (for Route 53 configuration)
4. AWS CLI configured with credentials

## Deployment Instructions

### 1. Clone and Configure

```bash
# Clone the repository
git clone <repository-url>
cd tap-content-delivery

# Create terraform.tfvars
cat > terraform.tfvars <<EOF
domain_name         = "example.com"
content_bucket_name = "my-ebook-content-bucket"
alarm_email         = "alerts@example.com"
aws_region          = "us-east-1"
environment         = "production"
EOF

2. Initialize Terraform
terraform init
3. Review the Plan
terraform plan
4. Deploy
terraform apply
5. Update DNS Nameservers
After deployment, update your domain registrar's nameservers to the Route 53 nameservers shown in the output.

6. Upload Content
# Upload an e-book
aws s3 cp my-ebook.epub s3://$(terraform output -raw s3_bucket_name)/books/my-ebook.epub

# Invalidate CloudFront cache (if updating existing content)
aws cloudfront create-invalidation \
  --distribution-id $(terraform output -raw cloudfront_distribution_id) \
  --paths "/books/my-ebook.epub"
Cost Estimates
For 5,000 daily readers with average e-book size of 2MB:

Service	Monthly Cost	Details
S3 Storage	~$5	1TB stored content
S3 Requests	~$2	GET requests
CloudFront	~$85	10TB monthly transfer
Route 53	~$1	1 hosted zone + queries
KMS	~$1	Key usage
CloudWatch	~$3	Logs and metrics
Total	~$97/month	
Note: Costs may vary based on actual usage and region

Scaling Considerations
The system automatically scales to handle increased traffic:

CloudFront: Automatically scales to any traffic level
S3: No scaling required, handles any request volume
Monitoring: CloudWatch metrics scale with usage
For significantly higher traffic (>50,000 daily users):

Consider upgrading CloudFront price class for better global coverage
Review WAF rate limits
Implement CloudFront origin request policies for better caching
Security Best Practices

Regular Key Rotation: KMS keys auto-rotate annually
Least Privilege IAM: Content managers have minimal required permissions
Audit Logging: CloudTrail logs all API calls
Encryption: All data encrypted in transit and at rest
Access Control: S3 bucket policy denies all direct access
Monitoring and Alerts
The system includes automated alerts for:

High error rates (>5%)
Low cache hit rates (<70%)
High origin latency (>1000ms)
Cost anomalies
Access the CloudWatch dashboard at the URL provided in the Terraform output.

Maintenance
Regular Tasks
Review CloudWatch Dashboards (Daily)
Check cache hit rates
Monitor error rates
Review traffic patterns
Cost Optimization (Monthly)
Review AWS Cost Explorer
Check S3 storage class distribution
Analyze CloudFront usage patterns
Security Audit (Quarterly)
Review CloudTrail logs
Update WAF rules if needed
Check for security advisories
Updating Content
# Upload new content
aws s3 cp new-ebook.epub s3://$(terraform output -raw s3_bucket_name)/books/

# For bulk updates, use sync
aws s3 sync ./local-books/ s3://$(terraform output -raw s3_bucket_name)/books/

Troubleshooting
Common Issues
403 Forbidden Errors
Check S3 bucket policy
Verify CloudFront OAI configuration
Ensure object permissions are correct
Slow Download Speeds
Check CloudWatch cache hit rate
Review CloudFront behaviors
Consider upgrading price class
High Costs
Review CloudWatch cost anomaly alerts
Check data transfer by region
Optimize caching policies


Disaster Recovery
S3 Versioning: Enabled for accidental deletion recovery
Cross-Region Replication: Can be enabled for critical content
Backup Strategy: Regular backups to Glacier for long-term storage
CloudFormation Backup: Infrastructure as code ensures quick rebuild
Support
For issues or questions:

Check CloudWatch logs and metrics
Review AWS service health dashboard
Contact AWS support for infrastructure issues
License

[Your License Here]


This comprehensive Terraform configuration provides a production-ready content delivery system with:

- **Security**: Multiple layers of protection including WAF, encryption, and access controls
- **Performance**: Global CDN with optimized caching strategies
- **Cost Optimization**: Lifecycle policies and monitoring to minimize costs
- **Scalability**: Automatically handles traffic spikes
- **Monitoring**: Real-time visibility into system health and performance

The system is designed to efficiently serve 5,000 daily readers while being able to scale to much higher traffic levels without architectural changes.
