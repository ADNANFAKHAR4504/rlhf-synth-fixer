# Infrastructure Deployment Failures - Video Streaming Platform

**Project:** Video Streaming Platform Infrastructure  
**Environment:** Development  
**Terraform Version:** >= 1.5  
**AWS Provider Version:** ~> 5.0  
**Region:** us-west-2  
**Date:** 2025-11-14

***

## Error 1: Security Group Naming Convention Violation

### Description
Terraform plan failed with validation error when attempting to create security groups with names prefixed with `sg-`. AWS rejected the resource creation for all three security groups: ALB, EC2, and Aurora.

### Error Message
```
Error: invalid value for name (cannot begin with sg-)

  with aws_security_group.alb,
  on main.tf line 209, in resource "aws_security_group" "alb":
 209:   name        = "sg-alb-${var.environment}"
```

### Root Cause
AWS reserves the `sg-` prefix exclusively for system-generated security group identifiers. This naming restriction prevents conflicts between user-defined names and AWS-assigned resource IDs. The validation occurs at the AWS API level before resource creation.[1][2]

### Impact
**Category:** Configuration Error  
**Severity:** Critical - Blocks Infrastructure Deployment

- **Operational:** Complete deployment failure, no security groups created
- **Security:** Unable to establish network security boundaries
- **Timeline:** Immediate deployment blocker requiring code modification

### Fix Applied
```hcl
# Security Groups
resource "aws_security_group" "alb" {
  name        = "alb-${var.environment}"  # Removed sg- prefix
  description = "Security group for Application Load Balancer"
  vpc_id      = aws_vpc.main.id
  
  tags = {
    Name = "sg-alb-${var.environment}"  # Tag can still use sg- prefix
  }
}

resource "aws_security_group" "ec2" {
  name        = "ec2-${var.environment}"  # Removed sg- prefix
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id
  
  tags = {
    Name = "sg-ec2-${var.environment}"
  }
}

resource "aws_security_group" "aurora" {
  name        = "aurora-${var.environment}"  # Removed sg- prefix
  description = "Security group for Aurora database"
  vpc_id      = aws_vpc.main.id
  
  tags = {
    Name = "sg-aurora-${var.environment}"
  }
}
```

### Prevention Strategy
1. **Naming Convention Documentation:** Establish resource naming standards that explicitly avoid AWS reserved prefixes including `sg-`, `ami-`, `vpc-`, `subnet-`, `igw-`, `rtb-`[3][2]
2. **Pre-deployment Validation:** Implement validation rules in CI/CD pipeline using `terraform validate` and custom scripts checking naming patterns[4][1]
3. **Code Review Checklist:** Add AWS naming restrictions to pull request templates[5][6]
4. **Automation:** Use Terraform modules with pre-validated naming patterns[1][5]

---

## Error 2: Aurora MySQL Instance Class Compatibility

### Description
RDS cluster instance creation failed due to unsupported instance class and engine version combination. Aurora MySQL 8.0 (version 3.x) does not support `db.t3.small` instance class.

### Error Message
```
Error: creating RDS Cluster (aurora-cluster-dev) Instance (aurora-instance-dev-1): operation error RDS: CreateDBInstance, https response error StatusCode: 400, RequestID: 71a01cff-03a5-442e-833f-bc43161dbd9d, api error InvalidParameterCombination: RDS does not support creating a DB instance with the following combination: DBInstanceClass=db.t3.small, Engine=aurora-mysql, EngineVersion=8.0.mysql_aurora.3.04.0, LicenseModel=general-public-license
```

### Root Cause
Aurora MySQL version 3.x (MySQL 8.0 compatible) requires minimum instance class of `db.t3.medium`. The T3 small instance class was deprecated for Aurora MySQL 8.0 due to insufficient memory requirements for the MySQL 8.0 storage engine.[7][8][9]

### Impact
**Category:** Configuration Error  
**Severity:** Critical - Blocks Database Provisioning

- **Operational:** Database cluster created but instances failed, leaving cluster in incomplete state
- **Cost:** Increased operational cost from $0.041/hour to $0.082/hour per instance (100% increase)[10]
- **Performance:** Higher resource allocation than initially planned for development environment
- **Timeline:** Requires cluster recreation or instance class modification

### Fix Applied
```hcl
resource "aws_rds_cluster_instance" "aurora" {
  count              = 2
  identifier         = "aurora-instance-${var.environment}-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.aurora.id
  instance_class     = "db.t3.medium"  # Changed from db.t3.small
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version
  
  tags = {
    Name = "aurora-instance-${var.environment}-${count.index + 1}"
  }
}
```

### Prevention Strategy
1. **Documentation Review:** Maintain matrix of supported instance class and engine version combinations per AWS documentation[8][9][11]
2. **Automated Validation:** Implement pre-deployment validation checking instance class compatibility with engine versions[12][4]
3. **Cost Analysis:** Include cost impact assessment in infrastructure planning for minimum instance requirements[10]
4. **Alternative Architectures:** Consider Aurora Serverless v2 for development environments to reduce cost while maintaining compatibility[13][8]
5. **Testing Strategy:** Validate instance class selections in non-production environments before production deployment[6]

***

## Error 3: Route53 Reserved Domain Name

### Description
Route53 hosted zone creation failed because the domain `example.com` is reserved by AWS and cannot be used for custom hosted zones, even for testing purposes.

### Error Message
```
Error: creating Route53 Hosted Zone (streaming-platform-dev.example.com): operation error Route 53: CreateHostedZone, https response error StatusCode: 400, RequestID: e3a62c66-eb92-4a4c-a293-fc6d1dcec440, InvalidDomainName: streaming-platform-dev.example.com is reserved by AWS
```

### Root Cause
AWS reserves specific domain names including `example.com`, `example.net`, and `example.org` to prevent conflicts with RFC 2606 documentation domains. These domains cannot be registered or used in Route53 hosted zones.[14][15][16]

### Impact
**Category:** Configuration Error  
**Severity:** High - Blocks DNS Configuration

- **Operational:** DNS infrastructure unavailable, unable to create alias records for CloudFront and ALB
- **Testing:** Cannot validate end-to-end DNS resolution in development environment
- **Security:** No domain-based access controls or SSL certificate validation possible
- **Compliance:** Testing environment lacks DNS audit trail

### Fix Applied
```hcl
# Route53 Hosted Zone
resource "aws_route53_zone" "main" {
  name = "streaming-platform-${var.environment}-testdomain.local"  # Changed from example.com
  
  tags = {
    Name = "route53-zone-${var.environment}"
  }
}

# CloudFront CDN Record
resource "aws_route53_record" "cdn" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "cdn.streaming-platform-${var.environment}-testdomain.local"  # Updated subdomain
  type    = "A"
  
  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health = false
  }
}

# Application Load Balancer Record
resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.streaming-platform-${var.environment}-testdomain.local"  # Updated subdomain
  type    = "A"
  
  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
```