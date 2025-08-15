# IDEAL RESPONSE: Single-File Pulumi AWS Infrastructure

This is an example of what a perfect response to the PROMPT.md should look like - a single, production-ready Python file that creates comprehensive AWS infrastructure using Pulumi.

## Key Features of the Ideal Response:

### 1. **Single File Architecture**
- ✅ Single Python file (`tap_stack.py`) that can be run directly with `pulumi up`
- ✅ Function-based approach with `create_infrastructure()` function
- ✅ Conditional exports for testing compatibility
- ✅ Direct execution support with `if __name__ == "__main__"`

### 2. **Comprehensive AWS Infrastructure**
- ✅ VPC with DNS enabled
- ✅ 2 public subnets and 2 private subnets across 2 AZs
- ✅ Internet Gateway for public subnets
- ✅ NAT Gateway for private subnets
- ✅ Proper route table configuration
- ✅ Security groups with configurable rules

### 3. **Security Best Practices**
- ✅ Configurable SSH access via `ssh_allowed_cidrs` parameter
- ✅ Production environment defaults to VPC CIDR only
- ✅ Private security group uses VPC CIDR reference
- ✅ Proper ingress/egress rules

### 4. **Configuration Management**
- ✅ Pulumi Config integration for environment-specific settings
- ✅ Default values for development environments
- ✅ Environment-aware security settings
- ✅ Consistent tagging strategy

### 5. **Resource Management**
- ✅ Consistent tagging for cost tracking
- ✅ Environment-specific naming conventions
- ✅ Proper resource dependencies
- ✅ Stack outputs for key resource IDs

### 6. **Code Quality**
- ✅ Clear comments and documentation
- ✅ Proper error handling
- ✅ Production-ready code structure
- ✅ Testable design with conditional exports

## Example Implementation Structure:

```python
def create_infrastructure(export_outputs=True):
    """Create the complete AWS infrastructure."""
    # Configuration with security settings
    config = Config()
    environment = config.get('environment') or 'dev'
    ssh_allowed_cidrs = config.get('ssh_allowed_cidrs') or ['0.0.0.0/0']
    
    # Security: Restrict SSH in production
    if environment == 'prod' and ssh_allowed_cidrs == ['0.0.0.0/0']:
        ssh_allowed_cidrs = ['10.0.0.0/16']
    
    # Create VPC, subnets, gateways, security groups
    # ... (comprehensive infrastructure creation)
    
    # Conditional exports for testing
    if export_outputs:
        pulumi.export("vpc_id", vpc.id)
        # ... (other exports)
    
    return {"vpc": vpc, "subnets": subnets, ...}

if __name__ == "__main__":
    create_infrastructure()
```

## Testing Integration:
- ✅ Unit tests with mocked Pulumi resources
- ✅ Integration tests for complete infrastructure flow
- ✅ Configuration testing for different environments
- ✅ Security group rule validation
- ✅ Resource tagging verification

## Deployment Integration:
- ✅ Main entry point (`tap.py`) that imports and calls the function
- ✅ Environment variable configuration
- ✅ Pulumi stack management
- ✅ Proper error handling

This approach provides a complete, production-ready, single-file Pulumi infrastructure that meets all requirements while maintaining security, testability, and maintainability.