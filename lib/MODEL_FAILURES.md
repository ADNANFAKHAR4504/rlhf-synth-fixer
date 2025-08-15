# Common Model Failures

This document outlines common failures and issues that AI models might encounter when responding to the PROMPT.md requirements.

## Infrastructure Failures

### 1. Missing Resource Dependencies
**Problem**: Resources created without proper dependencies
**Example**: NAT Gateway created before Elastic IP or public subnet
**Impact**: Deployment fails with dependency errors
**Solution**: Ensure proper resource ordering and explicit dependencies

### 2. Incorrect CIDR Block Conflicts
**Problem**: Overlapping CIDR blocks between subnets
**Example**: Public subnet 10.0.1.0/24 and private subnet 10.0.1.0/24
**Impact**: AWS rejects the subnet creation
**Solution**: Use non-overlapping CIDR blocks (10.0.1.0/24, 10.0.2.0/24, etc.)

### 3. Missing Route Table Associations
**Problem**: Subnets created but not associated with route tables
**Example**: Private subnets without route table association
**Impact**: Private subnets can't route traffic properly
**Solution**: Always associate subnets with appropriate route tables

## Security Failures

### 4. Overly Permissive Security Groups
**Problem**: Security groups allow too much access
**Example**: Allowing 0.0.0.0/0 on all ports
**Impact**: Security vulnerability
**Solution**: Use least privilege principle - only allow necessary ports

### 5. Missing Egress Rules
**Problem**: Security groups with no egress rules
**Example**: Private security group with no outbound access
**Impact**: Instances can't reach internet or other services
**Solution**: Always include appropriate egress rules

## Configuration Failures

### 6. Hardcoded Values
**Problem**: Environment-specific values hardcoded in script
**Example**: Hardcoded region, environment names, or CIDR blocks
**Impact**: Script not reusable across environments
**Solution**: Use Pulumi Config for all environment-specific values

### 7. Missing Tags
**Problem**: Resources created without proper tagging
**Example**: No Environment, Team, or Project tags
**Impact**: Poor cost tracking and resource management
**Solution**: Apply consistent tagging strategy to all resources

## Code Quality Failures

### 8. No Error Handling
**Problem**: Script doesn't handle potential failures
**Example**: No validation of availability zone availability
**Impact**: Deployment fails with unclear error messages
**Solution**: Add proper error handling and validation

### 9. Poor Documentation
**Problem**: Code lacks inline comments
**Example**: No explanation of what each resource does
**Impact**: Difficult to maintain and understand
**Solution**: Add clear comments explaining resource purpose

### 10. No Outputs
**Problem**: Resources created but IDs not exported
**Example**: VPC created but ID not available for other systems
**Impact**: Can't integrate with other infrastructure
**Solution**: Export all necessary resource identifiers

## Pulumi-Specific Failures

### 11. Incorrect Resource References
**Problem**: Using string IDs instead of Pulumi resource references
**Example**: `vpc_id="vpc-12345"` instead of `vpc_id=vpc.id`
**Impact**: Resources not properly linked, potential race conditions
**Solution**: Always use Pulumi resource references

### 12. Missing Resource Options
**Problem**: No explicit dependencies or resource options
**Example**: NAT Gateway created without waiting for subnet
**Impact**: Race conditions during deployment
**Solution**: Use explicit dependencies and resource options

### 13. Incorrect Import Statements
**Problem**: Missing or incorrect Pulumi imports
**Example**: `from pulumi_aws import ec2` missing
**Impact**: Import errors during execution
**Solution**: Include all necessary Pulumi imports

## Testing Failures

### 14. No Test Coverage
**Problem**: Infrastructure code without tests
**Example**: No unit or integration tests
**Impact**: Can't verify functionality before deployment
**Solution**: Include comprehensive test coverage

### 15. Inadequate Validation
**Problem**: No validation of configuration values
**Example**: No validation of CIDR block format
**Impact**: Runtime errors with invalid configuration
**Solution**: Add input validation for all configuration

## Best Practice Violations

### 16. Single Point of Failure
**Problem**: Only one NAT Gateway or subnet per AZ
**Example**: Single NAT Gateway for all private subnets
**Impact**: High availability issues
**Solution**: Consider multiple NAT Gateways for production

### 17. Cost Inefficiency
**Problem**: Resources that are unnecessarily expensive
**Example**: Multiple NAT Gateways when one is sufficient
**Impact**: Higher AWS costs
**Solution**: Balance cost and availability requirements

### 18. No Cleanup Strategy
**Problem**: No consideration for resource cleanup
**Example**: No way to destroy resources cleanly
**Impact**: Orphaned resources and costs
**Solution**: Ensure all resources can be properly destroyed

## Common Syntax Errors

### 19. Incorrect Pulumi Syntax
**Problem**: Using Terraform syntax instead of Pulumi
**Example**: Using `resource` instead of `ec2.Vpc`
**Impact**: Syntax errors during execution
**Solution**: Use correct Pulumi Python syntax

### 20. Missing Arguments
**Problem**: Required arguments not provided
**Example**: VPC without CIDR block
**Impact**: Resource creation fails
**Solution**: Provide all required arguments for each resource

## Recovery Strategies

### For Infrastructure Failures
1. Use `pulumi destroy` to clean up failed resources
2. Fix the issue in the code
3. Re-run `pulumi up`

### For Configuration Issues
1. Update Pulumi configuration values
2. Re-run deployment with correct values

### For Code Quality Issues
1. Add proper error handling and validation
2. Include comprehensive documentation
3. Add test coverage

### For Security Issues
1. Review and tighten security group rules
2. Implement least privilege access
3. Add proper tagging for audit trails