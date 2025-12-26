# Model Failures

## LocalStack Compatibility Adjustments

The following modifications were made to ensure LocalStack Community Edition compatibility. These are intentional architectural decisions, not bugs.

| Feature | Community Edition | Pro/Ultimate Edition | Solution Applied | Production Status |
|---------|-------------------|---------------------|------------------|-------------------|
| NAT Gateway | EIP allocation fails | Works | Conditional deployment with EnableNATGateway parameter | Enabled in AWS |
| Network ACLs | Limited support | Full support | Simplified rule structure | Enabled in AWS |

### Environment Detection Pattern

The template uses a parameter-based approach for LocalStack compatibility:

```yaml
Parameters:
  EnableNATGateway:
    Type: String
    Default: 'false'
    Description: 'Enable NAT Gateways (set to false for LocalStack)'
    AllowedValues:
      - 'true'
      - 'false'

Conditions:
  CreateNATGateway: !Equals [!Ref EnableNATGateway, 'true']
```

### Services Verified Working in LocalStack

- VPC (full support)
- Subnets (full support)
- Internet Gateway (full support)
- Security Groups (full support)
- Route Tables (full support)
- Network ACLs (basic support)

## Original CloudFormation Template Issues

### Issue 1: Missing LocalStack Compatibility

Original template didn't account for LocalStack limitations with NAT Gateways. Added conditional deployment to allow disabling NAT Gateways for LocalStack testing while maintaining full functionality in AWS.

### Issue 2: Resource Naming Conflicts

Original template didn't include environment suffix for resource names, which would cause conflicts in multi-deployment scenarios. Added EnvironmentSuffix parameter and incorporated it into all resource names.

### Issue 3: Security Group Egress Rules

Original design may have used blanket allow-all egress rules. Updated to restricted egress with specific port/protocol combinations for better security posture.
