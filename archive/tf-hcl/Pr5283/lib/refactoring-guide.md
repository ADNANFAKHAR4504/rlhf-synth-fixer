# VPC Infrastructure Refactoring Guide

## Overview
This guide provides step-by-step instructions for migrating from the legacy VPC setup to the new modular infrastructure without downtime.

## Prerequisites
- Terraform 1.5+ installed
- AWS CLI configured with appropriate credentials
- Access to existing infrastructure state files
- Backup of all current Terraform state files

## Migration Strategy
We'll use a blue-green approach, creating new resources alongside existing ones, then cutting over with minimal disruption.

## Step 1: State Preparation

### 1.1 Backup Current State
```bash
# For each region's state file
aws s3 cp s3://old-state-bucket/terraform.tfstate ./backup/terraform-$(date +%Y%m%d).tfstate

1.2 Initialize New Backend
# Create backend config file
cat > backend.hcl << EOF
bucket         = "example-corp-terraform-state"
key            = "networking/vpc/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "terraform-state-lock"
encrypt        = true
EOF

# Initialize with new backend
terraform init -backend-config=backend.hcl
Step 2: Import Existing Resources
2.1 Create Import Script
# Example for importing existing VPCs
terraform import module.vpc["us-east-1"].aws_vpc.main vpc-0123456789abcdef0
terraform import module.vpc["us-west-2"].aws_vpc.main vpc-0123456789abcdef1
terraform import module.vpc["eu-central-1"].aws_vpc.main vpc-0123456789abcdef2

# Import Internet Gateways
terraform import module.vpc["us-east-1"].aws_internet_gateway.main igw-0123456789abcdef0
2.2 Validate Import
terraform plan
# Should show no changes if imports are correct
Step 3: Incremental Migration
3.1 Phase 1: Non-Disruptive Changes
First, apply changes that don't affect connectivity:

Tags updates
Flow logs enablement
New security groups
terraform apply -target=module.vpc["us-east-1"].aws_flow_log.main
3.2 Phase 2: NAT Gateway Consolidation
Migrate to shared NAT Gateway pattern:

Create new NAT Gateways in primary region:
terraform apply -target=module.vpc["us-east-1"].aws_nat_gateway.main
Update route tables to use new NAT Gateways:
# Update private routes one at a time
terraform apply -target=module.vpc["us-west-2"].aws_route.private_nat
Delete old NAT Gateways after verification
3.3 Phase 3: VPC Peering Fix
Create new peering connections:
terraform apply -target=aws_vpc_peering_connection.peers
Update security groups to allow cross-VPC traffic
Test connectivity
Remove old peering connections
3.4 Phase 4: DNS Resolution
Deploy Route53 Resolver endpoints:

terraform apply -target=module.route53_resolver
Step 4: Validation
4.1 Connectivity Tests
# Test inter-VPC connectivity
aws ec2 describe-vpc-peering-connections --filters "Name=status-code,Values=active"

# Test NAT Gateway functionality
ssh ec2-user@bastion-host "curl -s http://checkip.amazonaws.com"
4.2 Cost Validation
# Check NAT Gateway count
terraform output nat_gateway_count

# Verify estimated costs
terraform output estimated_monthly_nat_cost
Step 5: Cleanup
5.1 Remove Old Resources
After confirming everything works:

Delete old NAT Gateways manually
Release unused Elastic IPs
Remove old peering connections
5.2 Update Documentation
Update network diagrams
Document new CIDR allocations
Update runbooks
Rollback Plan
If issues arise:

Revert route table changes to point back to old NAT Gateways
Re-enable old peering connections
Use backed-up state files if necessary
# Emergency rollback
terraform state pull > current-state.json
# Modify state if needed
terraform state push modified-state.json
Common Issues and Solutions
Issue: Circular Dependencies in Security Groups
Solution: Use separate security group rules instead of inline rules

resource "aws_security_group_rule" "example" {
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.other.id
  security_group_id        = aws_security_group.main.id
}
Issue: Route Table Conflicts
Solution: Use data sources to reference existing routes

data "aws_route_table" "existing" {
  vpc_id = data.aws_vpc.existing.id
  
  filter {
    name   = "tag:Name"
    values = ["existing-route-table"]
  }
}
Timeline
Week 1: State preparation and imports
Week 2: Non-disruptive changes and validation
Week 3: NAT Gateway migration (maintenance window required)
Week 4: VPC peering and DNS updates
Week 5: Cleanup and documentation
Success Criteria
✓ All VPCs using modular code
✓ NAT Gateway costs reduced by 60%
✓ No hardcoded CIDR blocks
✓ Working inter-VPC connectivity
✓ DNS resolution functional
✓ Zero downtime during migration