# Secure Web Application Infrastructure

This AWS CDK Python project creates a highly secure, scalable web application infrastructure incorporating the latest AWS security features and best practices for 2025.

## Architecture

### Core Components

- **VPC**: Multi-AZ deployment with public and private subnets
- **Application Load Balancer (ALB)**: Internet-facing load balancer in public subnets
- **Auto Scaling Group**: EC2 instances in private subnets for high availability
- **Security Groups**: Least privilege access controls
- **AWS WAF v2**: Web application firewall with managed rule sets
- **VPC Flow Logs**: Network traffic monitoring

### Security Features

#### Latest AWS Security Enhancements (2025)

- **AWS WAF v2 Managed Rules**: Protection against OWASP Top 10 and known bad inputs
- **Enhanced Security Groups**: Least privilege principle with specific port access
- **VPC Flow Logs**: Complete network traffic monitoring for security analysis
- **EBS Encryption**: All storage volumes encrypted at rest
- **IMDSv2**: Enhanced EC2 metadata security (Instance Metadata Service v2)
- **Systems Manager Integration**: Secure instance management without SSH

#### Security Best Practices Implemented

1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege Access**: IAM roles with minimal required permissions
3. **Encryption**: Data encrypted at rest and in transit
4. **Network Segmentation**: Private subnets for application servers
5. **Monitoring & Logging**: Comprehensive logging for security analysis
6. **High Availability**: Multi-AZ deployment for resilience

### Infrastructure Specifications

#### Networking

- **VPC CIDR**: 10.0.0.0/16
- **Availability Zones**: 3 (for high availability)
- **Public Subnets**: /24 networks for ALB
- **Private Subnets**: /24 networks for EC2 instances
- **NAT Gateways**: 2 (for redundancy)

#### Compute

- **AMI**: Latest Amazon Linux 2023 (latest generation)
- **Instance Type**: t3.micro (burstable performance)
- **Auto Scaling**: 2-6 instances (desired: 3)
- **Health Checks**: ELB health checks with 5-minute grace period

#### Load Balancing

- **Type**: Application Load Balancer (Layer 7)
- **Scheme**: Internet-facing
- **Health Check**: HTTP on port 80, path "/"
- **Security**: AWS WAF v2 protection enabled

#### Security Groups

- **ALB Security Group**: Allows HTTP (80) and HTTPS (443) from internet
- **EC2 Security Group**: Allows HTTP (80) only from ALB security group

## Deployment

### Prerequisites

- AWS CLI configured
- AWS CDK installed (`npm install -g aws-cdk`)
- Python 3.8+
- AWS account with appropriate permissions

### Deployment Steps

1. **Install Dependencies**

   ```bash
   pip install -r requirements.txt
   ```

2. **Bootstrap CDK (first time only)**

   ```bash
   cdk bootstrap
   ```

3. **Deploy the Stack**

   ```bash
   cdk deploy
   ```

4. **Access the Application**
   - The ALB DNS name will be output after deployment
   - Visit the URL to see the secure web application

### Customization

#### Environment Suffix

Set custom environment suffix:

```bash
cdk deploy --context environmentSuffix=prod
```

#### Region Deployment

```bash
export CDK_DEFAULT_REGION=us-west-2
cdk deploy
```

## Security Compliance

### AWS Well-Architected Framework

This architecture follows AWS Well-Architected principles:

- **Security**: Multi-layered security controls, least privilege access
- **Reliability**: Multi-AZ deployment, auto-scaling, health checks
- **Performance**: Application Load Balancer with health checks
- **Cost Optimization**: Right-sized instances, auto-scaling
- **Operational Excellence**: Infrastructure as Code, monitoring

### Compliance Features

- **Data Encryption**: EBS volumes encrypted
- **Network Security**: VPC Flow Logs, Security Groups
- **Access Control**: IAM roles with minimal permissions
- **Monitoring**: CloudWatch metrics and logs
- **Audit Trail**: CloudTrail integration via Systems Manager

## Monitoring & Maintenance

### Logging

- **VPC Flow Logs**: Network traffic analysis
- **ALB Access Logs**: HTTP request logging
- **CloudWatch**: Instance and application metrics
- **AWS WAF Logs**: Web application security events

### Monitoring

- **CloudWatch Dashboards**: Infrastructure metrics
- **Auto Scaling Metrics**: Instance health and performance
- **Load Balancer Metrics**: Request count, latency, errors
- **Security Metrics**: WAF blocked requests, unusual patterns

### Maintenance

- **Updates**: EC2 instances automatically updated on launch
- **Scaling**: Auto-scaling based on demand
- **Security**: WAF rules automatically updated by AWS
- **Patching**: Systems Manager for secure patch management

## Cost Considerations

- **Instance Type**: t3.micro for cost-effectiveness
- **NAT Gateways**: 2 for balance of cost and availability
- **EBS Volumes**: GP3 for cost-optimized performance
- **Monitoring**: Standard CloudWatch metrics included

## Security Incident Response

### Immediate Actions

1. Check AWS WAF metrics for blocked requests
2. Review VPC Flow Logs for unusual traffic
3. Monitor CloudWatch alarms for anomalies
4. Use Systems Manager for secure instance access

### Investigation Tools

- **VPC Flow Logs**: Network traffic analysis
- **AWS WAF Logs**: Web attack details
- **CloudWatch Logs**: Application and system logs
- **AWS Config**: Configuration change tracking

This infrastructure provides enterprise-grade security while maintaining simplicity and cost-effectiveness, incorporating the latest AWS security features and industry best practices.
