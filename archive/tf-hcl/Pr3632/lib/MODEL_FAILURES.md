# MODEL_FAILURES
---

## 1. Route53 Hosted Zone Dependency Failure

### Issue:
The MODEL_RESPONSE.md used Route53 for failover routing, but assumed a hosted zone exists:
```hcl
data "aws_route53_zone" "main" {
  provider = aws.route53
  name     = var.domain_name
  private_zone = false
}
```

### Error Encountered:
```
Error: no matching Route 53 Hosted Zone found
  with module.failover_mechanism.data.aws_route53_zone.main,
  on modules/failover/main.tf line 12
```

### Root Cause:
- Required domain name and pre-existing hosted zone
- Not suitable for testing or domain-independent deployments
- Added unnecessary complexity and external dependencies

### Fix in IDEAL_RESPONSE.md:
- **Replaced Route53 with AWS Global Accelerator**
- No domain required, though we can still use it.
- Uses IP addresses instead of DNS
- Simpler deployment without DNS prerequisites
- Removed `domain_name` variable entirely
- Added `enable_dns_failover` toggle variable

### Impact:
**Critical** - Prevented deployment without Route53 setup. Global Accelerator provides better solution with static IPs.

---

## 2. Route53 Health Checks Used HTTPS Instead of HTTP

### Issue:
MODEL_RESPONSE.md configured health checks for HTTPS (port 443):
```hcl
resource "aws_route53_health_check" "primary" {
  fqdn              = var.primary_alb_dns
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
}
```

### Root Cause:
- No SSL/TLS certificates were configured
- ALB only had HTTP listeners
- Health checks would fail due to certificate mismatch

### Fix in IDEAL_RESPONSE.md:
- Global Accelerator health checks use HTTP (port 80)
- Matches actual ALB listener configuration
- No certificate requirements

### Impact:
**High** - Health checks would fail, preventing failover from working.

---

## 3. ACM Certificate Validation Timeout

### Issue:
MODEL_RESPONSE.md attempted to create ACM certificates with DNS validation:
```hcl
resource "aws_acm_certificate" "main" {
  domain_name       = var.domain_name
  validation_method = "DNS"
}
```

### Error Encountered:
```
Error: waiting for ACM Certificate to be issued: timeout while waiting for state 
to become 'true' (last state: 'false', timeout: 5m0s)

Error: Missing Resource Identity After Create
```

### Root Cause:
- **Used a non-existent domain for certificate validation**
- DNS validation requires domain ownership and DNS records
- Without a real domain, validation cannot complete
- Validation process times out after 5 minutes

### Fix in IDEAL_RESPONSE.md:
- **Removed ACM certificates entirely**
- Use HTTP only (no HTTPS)
- No domain or certificate validation needed
- Faster deployment without domain prerequisites

### Impact:
**High** - Deployment would timeout and fail due to non-existent domain. Removing certificates eliminated the domain dependency entirely.

---

## 4. RDS Final Snapshot Identifier Invalid Characters

### Issue:
MODEL_RESPONSE.md used timestamp in snapshot identifier:
```hcl
final_snapshot_identifier = "${var.environment}-mysql-primary-final-${timestamp()}"
```

### Error Encountered:
```
Error: invalid value for final_snapshot_identifier 
(must only contain alphanumeric characters and hyphens)
```

### Root Cause:
- `timestamp()` includes colons which are not allowed
- Function evaluation in string interpolation

### Fix in IDEAL_RESPONSE.md:
```hcl
skip_final_snapshot = true
deletion_protection = false
```

### Impact:
**Medium** - Prevented database creation. Fixed by skipping final snapshot for testing environments.

---

## 5. VPC and EIP Limit Exceeded

### Issue:
During deployment, hit AWS service limits:

### Errors Encountered:
```
Error: creating EC2 VPC: VpcLimitExceeded: The maximum number of VPCs has been reached.

Error: creating EC2 EIP: AddressLimitExceeded: The maximum number of addresses has been reached.
```

### Root Cause:
- Default AWS limits: 5 VPCs per region, limited EIPs
- Creating new VPCs in multiple regions
- Multiple NAT Gateways requiring EIPs

### Attempted Fix (Rejected):
Initially added logic to use existing VPCs, but user requested fresh VPCs.

### Final Resolution:
- Cleanup of old VPCs and EIPs in the AWS account
- Infrastructure deployed successfully with new VPCs

### Impact:
**High** - Prevented deployment until resources were cleaned up.

---

## 6. Cross-Region RDS Replica Encryption Mismatch

### Issue:
MODEL_RESPONSE.md created read replica without specifying encryption:
```hcl
resource "aws_db_instance" "replica" {
  replicate_source_db = var.source_db_arn
  # Missing: storage_encrypted and kms_key_id
}
```

### Error Encountered:
```
Error: Cannot create a cross region unencrypted read replica from encrypted source.
```

### Root Cause:
- Primary database had `storage_encrypted = true`
- Replica didn't explicitly set encryption
- AWS requires explicit encryption configuration for cross-region replicas

### Fix in IDEAL_RESPONSE.md:
```hcl
resource "aws_db_instance" "replica" {
  storage_encrypted = true
  kms_key_id       = aws_kms_key.rds.arn
  # ... other config
}
```

### Impact:
**Critical** - Prevented read replica creation, breaking DR functionality.

---

## 7. RDS Read Replica Missing VPC Configuration

### Issue:
MODEL_RESPONSE.md created replica without VPC/subnet configuration:
```hcl
resource "aws_db_instance" "replica" {
  replicate_source_db = var.source_db_arn
  # Missing: db_subnet_group_name and vpc_security_group_ids
}
```

### Error Encountered:
```
Error: InvalidSubnet: No default subnet detected in VPC. 
Please contact AWS Support to recreate default Subnets.
```

### Root Cause:
- Replica tried to use default VPC/subnets
- Custom VPCs don't have default subnets
- Needed explicit subnet group and security group assignment

### Fix in IDEAL_RESPONSE.md:
```hcl
resource "aws_db_instance" "replica" {
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  # ... other config
}
```

### Impact:
**Critical** - Read replica creation failed completely.

---

## 8. VPC Flow Logs Incorrect Attribute Name

### Issue:
MODEL_RESPONSE.md used deprecated attribute:
```hcl
resource "aws_flow_log" "main" {
  log_destination_arn = aws_cloudwatch_log_group.flow_log.arn
  # ... other config
}
```

### Error Encountered:
```
Error: Unexpected attribute: An attribute named "log_destination_arn" is not expected here
```

### Root Cause:
- Terraform AWS provider updated the attribute name
- Changed from `log_destination_arn` to `log_destination`

### Fix in IDEAL_RESPONSE.md:
```hcl
resource "aws_flow_log" "main" {
  log_destination = aws_cloudwatch_log_group.flow_log.arn
  # ... other config
}
```

### Impact:
**Low** - Simple attribute name change.

---

## 9. Duplicate Terraform and Backend Blocks

### Issue:
MODEL_RESPONSE.md had terraform blocks in both `main.tf` and `provider.tf`:

**main.tf:**
```hcl
terraform {
  required_providers { ... }
  backend "s3" {}
}
```

**provider.tf:**
```hcl
terraform {
  required_providers { ... }
  backend "s3" {}
}
```

### Error Encountered:
```
Error: Duplicate required providers configuration
Error: Duplicate 'backend' configuration block
```

### Root Cause:
- Only one terraform block allowed per module
- Duplication between main.tf and provider.tf

### Fix in IDEAL_RESPONSE.md:
- Single terraform block in `provider.tf`
- Comment in `main.tf` noting block location
- Minimal terraform blocks in child modules (only `required_providers`)

### Impact:
**Medium** - Prevented Terraform initialization.

---

## 10. Missing Provider Configuration Aliases in Child Modules

### Issue:
MODEL_RESPONSE.md didn't declare configuration_aliases in failover module:
```hcl
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}
```

### Error Encountered:
```
Error: There is no explicit declaration for local provider name "aws.primary" in module.failover_mechanism

Warning: Reference to undefined provider
```

### Root Cause:
- Failover module uses multiple aliased providers (aws.primary, aws.secondary)
- Needed explicit declaration in module's terraform block

### Fix in IDEAL_RESPONSE.md:
```hcl
terraform {
  required_providers {
    aws = {
      source                = "hashicorp/aws"
      configuration_aliases = [aws.primary, aws.secondary]
    }
  }
}
```

### Impact:
**Medium** - Module couldn't use aliased providers properly.

---

## 11. EC2 User Data Script Failures

### Issue:
MODEL_RESPONSE.md user data required package installation:
```bash
#!/bin/bash
yum update -y
yum install -y httpd php php-mysqlnd git
systemctl start httpd
```

### Errors Encountered:
```
cloud-init: Cannot find a valid baseurl for repo: amzn2-core/2/x86_64
cloud-init: Connection timeout on repository mirrors
Failed to start httpd.service: Unit not found
/var/www/html/index.html: No such file or directory
```

### Root Cause:
- Instances in private subnets couldn't reach internet initially
- NAT Gateway connectivity not ready when instances launched
- Package installation required internet access
- No web server to handle health checks
- Directory `/var/www/html` doesn't exist without httpd package

### Fix in IDEAL_RESPONSE.md:
```bash
#!/bin/bash
# Create directory first
mkdir -p /var/www/html

# Create simple HTML files (no packages needed)
cat > /var/www/html/index.html << 'EOF'
... basic HTML ...
EOF

cat > /var/www/html/health << 'EOF'
OK
EOF

# Start Python HTTP server (pre-installed, no packages needed)
cd /var/www/html
if command -v python3 > /dev/null 2>&1; then
    nohup python3 -m http.server 80 > /var/log/simple-http-server.log 2>&1 &
elif command -v python2 > /dev/null 2>&1; then
    nohup python2 -m SimpleHTTPServer 80 > /var/log/simple-http-server.log 2>&1 &
fi

# Try package installation in background (non-blocking)
nohup bash -c '
    sleep 60
    if ping -c 3 8.8.8.8 > /dev/null 2>&1; then
        yum update -y || echo "Package update failed"
        yum install -y httpd php php-mysqlnd git || echo "Package installation failed"
    fi
' > /var/log/package-install.log 2>&1 &
```

### Impact:
**Critical** - Instances failed health checks and were terminated by ASG. Fixed by:
1. Creating directory before writing files
2. Using pre-installed Python HTTP server
3. Moving package installation to background
4. Adding network connectivity tests

---

## 12. Auto Scaling Group Timeout

### Issue:
ASG waited for instances that never became healthy.

### Error Encountered:
```
Error: waiting for Auto Scaling Group capacity satisfied: timeout 
(last state: 'want exactly 4 healthy instance(s), have 2', timeout: 10m0s)
```

### Root Cause:
- User data script failures (see #11)
- Instances couldn't pass health checks
- Health checks expected web server on port 80
- NAT Gateway not ready when instances launched

### Fix in IDEAL_RESPONSE.md:
1. Added NAT Gateway dependencies:
   ```hcl
   resource "aws_launch_template" "main" {
     depends_on = [var.nat_gateway_ids]
   }
   
   resource "aws_autoscaling_group" "main" {
     depends_on = [var.nat_gateway_ids]
   }
   ```

2. Fixed user data to start Python HTTP server immediately
3. Reduced desired_capacity from 4 to 1 for easier testing
4. Extended health check grace period to 300 seconds

### Impact:
**Critical** - ASG deployment would timeout after 10 minutes.

---

## 13. Global Accelerator Endpoint Groups Region Mismatch

### Issue:
MODEL_RESPONSE.md (after switching from Route53) created Global Accelerator with improper region configuration.

### Error Encountered:
```
Error: Endpoint arn:aws:elasticloadbalancing:eu-west-1:***:loadbalancer/app/...
must be in same AWS Region as endpoint group: us-east-1
```

### Root Cause:
- Global Accelerator created in default region (us-east-1)
- Tried to add ALBs from different regions (eu-west-1, eu-west-2) to same endpoint group
- AWS requires endpoint groups to be in same region as their endpoints

### Fix in IDEAL_RESPONSE.md:
```hcl
# Global Accelerator in primary region
resource "aws_globalaccelerator_accelerator" "main" {
  provider = aws.primary  # Use primary region
}

# Separate endpoint groups for each region
resource "aws_globalaccelerator_endpoint_group" "primary" {
  provider = aws.primary
  # Primary ALB
}

resource "aws_globalaccelerator_endpoint_group" "secondary" {
  provider = aws.secondary
  # Secondary ALB
}
```

### Impact:
**Critical** - Global Accelerator deployment failed. Fixed by creating separate endpoint groups with correct regional providers.

---

## 14. Global Accelerator Endpoint Group Tags Not Supported

### Issue:
MODEL_RESPONSE.md attempted to tag endpoint groups:
```hcl
resource "aws_globalaccelerator_endpoint_group" "primary" {
  # ... config ...
  tags = var.tags
}
```

### Error Encountered:
```
Error: Unexpected attribute: An attribute named "tags" is not expected here
```

### Root Cause:
- `aws_globalaccelerator_endpoint_group` resource doesn't support tags
- AWS API limitation

### Fix in IDEAL_RESPONSE.md:
Removed tags block from endpoint groups:
```hcl
resource "aws_globalaccelerator_endpoint_group" "primary" {
  # ... config without tags ...
}
```

### Impact:
**Low** - Simple removal of unsupported attribute.

---

## 15. Missing NAT Gateway Dependencies

### Issue:
MODEL_RESPONSE.md didn't ensure NAT Gateways were ready before EC2 instances launched.

### Symptoms:
- Instances couldn't reach internet
- Package installations failed with connection timeouts
- Instances terminated due to failed health checks

### Root Cause:
- No explicit dependency between EC2 instances and NAT Gateways
- Terraform might launch instances before NAT routes are fully configured

### Fix in IDEAL_RESPONSE.md:
1. Added `nat_gateway_ids` variable to compute module
2. Added dependencies in launch template and ASG:
   ```hcl
   resource "aws_launch_template" "main" {
     depends_on = [var.nat_gateway_ids]
   }
   
   resource "aws_autoscaling_group" "main" {
     depends_on = [var.nat_gateway_ids]
   }
   ```
3. Passed NAT Gateway IDs from networking to compute modules

### Impact:
**High** - EC2 instances would launch before NAT connectivity was available.

---

## 16. Lambda Function Missing Global Accelerator Permissions

### Issue:
MODEL_RESPONSE.md Lambda only had Route53 permissions:
```hcl
Action = [
  "route53:ChangeResourceRecordSets",
  "route53:GetHostedZone"
]
```

### Root Cause:
- After switching to Global Accelerator, Lambda needed different permissions
- Needed to update endpoint group weights
- Needed to describe accelerator configuration

### Fix in IDEAL_RESPONSE.md:
```hcl
Action = [
  "rds:PromoteReadReplica",
  "rds:ModifyDBInstance",
  "rds:DescribeDBInstances",
  "globalaccelerator:UpdateEndpointGroup",
  "globalaccelerator:DescribeAccelerator",
  "autoscaling:UpdateAutoScalingGroup"
]
```

### Impact:
**Medium** - Automated failover would fail due to insufficient permissions.

---

## 17. Lambda Environment Variables Missing Global Accelerator ARN

### Issue:
MODEL_RESPONSE.md Lambda environment variables were configured for Route53:
```hcl
environment {
  variables = {
    PRIMARY_REGION   = var.primary_region
    SECONDARY_REGION = var.secondary_region
    PRIMARY_DB_ARN   = var.primary_db_arn
    SECONDARY_DB_ARN = var.secondary_db_arn
  }
}
```

### Root Cause:
- Needed Global Accelerator ARN for updating endpoint groups
- Needed ALB ARNs for weight distribution

### Fix in IDEAL_RESPONSE.md:
```hcl
environment {
  variables = {
    PRIMARY_REGION    = var.primary_region
    SECONDARY_REGION  = var.secondary_region
    PRIMARY_DB_ARN    = var.primary_db_arn
    SECONDARY_DB_ARN  = var.secondary_db_arn
    ACCELERATOR_ARN   = aws_globalaccelerator_accelerator.main.arn
    PRIMARY_ALB_ARN   = var.primary_alb_arn
    SECONDARY_ALB_ARN = var.secondary_alb_arn
  }
}
```

### Impact:
**Medium** - Lambda couldn't perform failover operations without these ARNs.

---

## 18. Lambda Function Handler Mismatch

### Issue:
MODEL_RESPONSE.md referenced wrong handler in archive file:
```hcl
source {
  content  = file("${path.module}/lambda_function.py")
  filename = "lambda_function.py"  # Wrong filename in ZIP
}

handler = "lambda_function.lambda_handler"  # Mismatched handler
```

### Root Cause:
- Archive filename was `lambda_function.py` but handler expected `index.py`
- Handler path didn't match actual function

### Fix in IDEAL_RESPONSE.md:
```hcl
source {
  content  = file("${path.module}/lambda_function.py")
  filename = "index.py"  # Correct filename for handler
}

handler = "index.handler"  # Matches actual file structure
```

### Impact:
**Medium** - Lambda function would fail to execute.

---

## 19. Lambda Function Logic Used Route53 Instead of Global Accelerator

### Issue:
MODEL_RESPONSE.md Lambda function used Route53 API calls:
```python
route53 = boto3.client('route53')
response = route53.change_resource_record_sets(
    HostedZoneId=hosted_zone_id,
    ChangeBatch={
        'Changes': [{
            'Action': 'UPSERT',
            # ... Route53 record changes
        }]
    }
)
```

### Root Cause:
- Lambda was designed for Route53 failover
- Needed complete rewrite for Global Accelerator

### Fix in IDEAL_RESPONSE.md:
```python
globalaccelerator = boto3.client('globalaccelerator', region_name='us-west-2')
response = globalaccelerator.update_endpoint_group(
    EndpointGroupArn=endpoint_group_arn,
    EndpointConfigurations=[
        {
            'EndpointId': secondary_alb_arn,
            'Weight': 100,
            'ClientIPPreservationEnabled': True
        }
    ]
)
```

### Impact:
**Critical** - Automated failover wouldn't work with wrong service API.

---

## 20. Security Group References in Compute Module

### Issue:
MODEL_RESPONSE.md compute module didn't properly isolate EC2 instances.

### Best Practice Violation:
EC2 instances should only accept traffic from ALB security group, not from 0.0.0.0/0.

### Fix in IDEAL_RESPONSE.md:
```hcl
resource "aws_security_group" "ec2" {
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]  # Only from ALB
  }
}
```

### Impact:
**Medium** - Security best practice. Original might allow unwanted direct access.

---

## 21. Missing Compute Module NAT Gateway Variable

### Issue:
Added NAT Gateway dependency but variable wasn't declared in compute module.

### Error Would Have Been:
```
Error: Reference to undeclared input variable
```

### Fix in IDEAL_RESPONSE.md:
Added to `modules/compute/variables.tf`:
```hcl
variable "nat_gateway_ids" {
  description = "List of NAT Gateway IDs"
  type        = list(string)
}
```

### Impact:
**Medium** - Would prevent module from compiling.

---

## 22. Database Module Variable Name Mismatch

### Issue:
MODEL_RESPONSE.md used inconsistent variable names for subnet IDs:
- Sometimes `database_subnet_ids`
- Sometimes `subnet_ids`

### Root Cause:
- Inconsistent naming across modules
- Copy-paste errors

### Fix in IDEAL_RESPONSE.md:
Standardized to `subnet_ids` throughout:
```hcl
variable "subnet_ids" {
  description = "List of subnet IDs for database"
  type        = list(string)
}
```

### Impact:
**Low** - Consistency improvement.

---

## 23. Hardcoded Database Allocated Storage

### Issue:
MODEL_RESPONSE.md used variable reference that wasn't defined:
```hcl
allocated_storage = var.allocated_storage  # Variable doesn't exist
```

### Fix in IDEAL_RESPONSE.md:
```hcl
allocated_storage = 100  # Hardcoded reasonable value
```

### Impact:
**Low** - Could make it a variable for flexibility.

---

## 24. CloudWatch Alarm evaluation_periods Data Type

### Issue:
MODEL_RESPONSE.md used inconsistent data types for CloudWatch alarm periods:
```hcl
evaluation_periods = 2      # Sometimes number
evaluation_periods = "2"    # Sometimes string
```

### Root Cause:
- AWS API accepts both
- Terraform is flexible but unit tests expected consistency

### Fix in IDEAL_RESPONSE.md:
Used quoted strings consistently:
```hcl
evaluation_periods  = "2"
```

### Impact:
**Negligible** - Both work, but consistency is better.

---

## 25. Missing Module README.md

### Issue:
MODEL_RESPONSE.md didn't include README.md in the root directory.

### Fix in IDEAL_RESPONSE.md:
Created comprehensive README.md with:
- Architecture overview
- Deployment instructions
- Testing procedures
- Troubleshooting guide

### Impact:
**Low** - Documentation improvement for usability.

---

## 26. Outputs Used HTTPS Instead of HTTP

### Issue:
MODEL_RESPONSE.md outputs showed HTTPS URLs:
```hcl
output "failover_endpoint" {
  value = "https://${module.failover_mechanism.dns_name}"
}
```

### Root Cause:
- No SSL certificates configured
- ALB only listens on HTTP port 80
- Would confuse users trying to access endpoints

### Fix in IDEAL_RESPONSE.md:
```hcl
output "failover_endpoint" {
  value = "http://${module.failover_mechanism[0].global_accelerator_dns_name}"
}

output "health_check_urls" {
  value = {
    primary   = "http://${module.primary_compute.alb_dns}/health"
    secondary = "http://${module.secondary_compute.alb_dns}/health"
  }
}
```

### Impact:
**Low** - User experience issue.

