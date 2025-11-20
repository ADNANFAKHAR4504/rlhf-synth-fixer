# Terraform State Migration Guide: us-west-1 → us-west-2

## Prerequisites

1. Ensure you have appropriate AWS credentials configured
2. Backup existing Terraform state files
3. Verify all resources exist in both regions
4. Have the old resource IDs documented (see id-mapping.csv)
5. Install Terraform version 1.0 or higher
6. Ensure S3 backend bucket and DynamoDB table exist

## Step 1: Backup Current State

```bash
# Backup current state from us-west-1
terraform workspace select myapp-us-west-1
terraform state pull > backup-us-west-1-$(date +%Y%m%d-%H%M%S).json

# List all resources in current state
terraform state list > resources-us-west-1.txt

# Verify backup
cat backup-us-west-1-*.json | jq '.version'
```

## Step 2: Create New Workspace for us-west-2

```bash
# Create new workspace for us-west-2
terraform workspace new myapp-us-west-2

# Or select if already exists
terraform workspace select myapp-us-west-2

# Initialize the new workspace
terraform init

# Verify workspace
terraform workspace show
```

## Step 3: Import Resources to New State

**Important**: Execute imports in dependency order (VPC → Subnets → Security Groups → etc.)

### Network Resources

```bash
# Import VPC
terraform import aws_vpc.main vpc-0123456789abcdef0

# Import Internet Gateway
terraform import aws_internet_gateway.main igw-0123456789abcdef0

# Import Subnets
terraform import 'aws_subnet.public[0]' subnet-0123456789abcdef0
terraform import 'aws_subnet.public[1]' subnet-0123456789abcdef1
terraform import 'aws_subnet.private[0]' subnet-0123456789abcdef2
terraform import 'aws_subnet.private[1]' subnet-0123456789abcdef3

# Import Route Tables
terraform import aws_route_table.public rtb-0123456789abcdef0
terraform import 'aws_route_table.private[0]' rtb-0123456789abcdef1
terraform import 'aws_route_table.private[1]' rtb-0123456789abcdef2

# Import Route Table Associations
terraform import 'aws_route_table_association.public[0]' subnet-0123456789abcdef0/rtb-0123456789abcdef0
terraform import 'aws_route_table_association.public[1]' subnet-0123456789abcdef1/rtb-0123456789abcdef0
terraform import 'aws_route_table_association.private[0]' subnet-0123456789abcdef2/rtb-0123456789abcdef1
terraform import 'aws_route_table_association.private[1]' subnet-0123456789abcdef3/rtb-0123456789abcdef2
```

### Security Groups

```bash
# Import Security Groups
terraform import aws_security_group.web sg-0123456789abcdef0
terraform import aws_security_group.app sg-0123456789abcdef1
terraform import aws_security_group.database sg-0123456789abcdef2
```

### Load Balancer Resources

```bash
# Import ALB
terraform import aws_lb.main arn:aws:elasticloadbalancing:us-west-2:123456789012:loadbalancer/app/myapp-alb/1234567890123456

# Import Target Group
terraform import aws_lb_target_group.app arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/myapp-app-tg/1234567890123456

# Import Listener
terraform import aws_lb_listener.app arn:aws:elasticloadbalancing:us-west-2:123456789012:listener/app/myapp-alb/1234567890123456/1234567890123456
```

### Auto Scaling Resources

```bash
# Import Launch Template
terraform import aws_launch_template.app lt-0123456789abcdef0

# Import Auto Scaling Group
terraform import aws_autoscaling_group.app myapp-app-asg
```

### Database Resources

```bash
# Import DB Subnet Group
terraform import aws_db_subnet_group.main myapp-db-subnet-group

# Import RDS Instance
terraform import aws_db_instance.main myapp-database
```

## Step 4: Verify State Consistency

```bash
# Plan should show no changes if import was successful
terraform plan

# If there are differences, review and adjust configuration
terraform show

# Verify all resources are in state
terraform state list

# Compare resource counts
echo "Expected resources: $(wc -l < resources-us-west-1.txt)"
echo "Imported resources: $(terraform state list | wc -l)"
```

## Step 5: Test Configuration

```bash
# Validate configuration
terraform validate

# Run plan to ensure no unexpected changes
terraform plan -out=migration-plan

# Review the plan carefully
terraform show migration-plan

# Apply only if plan shows expected results
# terraform apply migration-plan
```

## Step 6: State Verification Commands

```bash
# Compare resource counts
echo "Old region resources:"
wc -l resources-us-west-1.txt

echo "New region resources:"
terraform state list | wc -l

# Verify specific resources
terraform state show aws_vpc.main
terraform state show aws_db_instance.main
terraform state show aws_lb.main

# Check for any drift
terraform plan -detailed-exitcode

# Exit code 0: no changes
# Exit code 1: errors
# Exit code 2: changes detected
```

## Step 7: Update Backend Configuration

```bash
# Update backend.tf to point to new region state file
# Edit backend.tf:
#   key = "myapp/us-west-2/terraform.tfstate"

# Re-initialize with new backend
terraform init -reconfigure

# Verify backend configuration
terraform state list
```

## Rollback Procedure

If migration fails:

```bash
# Switch back to old workspace
terraform workspace select myapp-us-west-1

# Restore from backup if needed
terraform state push backup-us-west-1-TIMESTAMP.json

# Verify restoration
terraform state list

# Delete problematic new workspace
terraform workspace select default
terraform workspace delete myapp-us-west-2
```

## Post-Migration Cleanup

```bash
# After successful migration and testing
terraform workspace select myapp-us-west-1

# Document old resources for cleanup
terraform state list > old-resources-for-cleanup.txt

# Create a plan for destroying old resources
terraform plan -destroy -out=cleanup-plan

# Review the destroy plan carefully
terraform show cleanup-plan

# Eventually destroy old resources (after DNS cutover and validation)
# terraform apply cleanup-plan
```

## Troubleshooting

### Import Errors

If an import fails:

```bash
# Check if resource exists in target region
aws <service> describe-<resource> --region us-west-2

# Verify resource ID format
# Some resources require ARN format, others use resource ID

# Check Terraform resource address format
terraform state list
```

### State Lock Issues

If state is locked:

```bash
# Check lock status
aws dynamodb get-item \
  --table-name PLACEHOLDER-terraform-locks \
  --key '{"LockID": {"S": "PLACEHOLDER-terraform-state-bucket/myapp/us-west-2/terraform.tfstate"}}' \
  --region us-west-2

# Force unlock (use with caution)
terraform force-unlock <lock-id>
```

### Drift Detection

If plan shows unexpected changes:

```bash
# Show detailed differences
terraform plan -no-color > plan-diff.txt

# Review specific resource
terraform state show <resource-address>

# Update configuration to match actual state
# Or use terraform apply to align state with configuration
```

## Best Practices

1. Always backup state before modifications
2. Test import commands on a single resource first
3. Import resources in dependency order
4. Verify each import before proceeding
5. Use version control for state files
6. Enable state locking with DynamoDB
7. Use separate workspaces or state files per region
8. Document all resource ID mappings
9. Test rollback procedures before cutover
10. Monitor for drift after migration

## Validation Checklist

- [ ] All resources imported successfully
- [ ] terraform plan shows no changes
- [ ] Resource counts match between regions
- [ ] Security group rules preserved
- [ ] Network topology identical
- [ ] Tags and names consistent
- [ ] No drift detected
- [ ] Outputs return expected values
- [ ] State file backed up
- [ ] Rollback procedure tested
