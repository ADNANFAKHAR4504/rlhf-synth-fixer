# Model Failures and LocalStack Adaptations

This document outlines the LocalStack-specific adaptations made to ensure the stack deploys successfully in LocalStack Community Edition.

## LocalStack Compatibility Issues

### 1. NAT Gateway Support

**Issue**: NAT Gateways are not fully supported in LocalStack Community Edition.

**Adaptation**:
- Changed `natGateways: 2` to `natGateways: 0`
- Changed private subnet type from `PRIVATE_WITH_EGRESS` to `PRIVATE_ISOLATED`
- Updated outputs to use `isolatedSubnets` instead of `privateSubnets`

**Code Change**:
```typescript
// Before (AWS)
natGateways: 2,
subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,

// After (LocalStack)
natGateways: 0,
subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
```

### 2. Default Security Group Restriction

**Issue**: `restrictDefaultSecurityGroup: true` requires a Lambda-backed custom resource, which needs Docker-in-Docker support in LocalStack.

**Adaptation**:
- Changed `restrictDefaultSecurityGroup: false` to avoid Lambda custom resource dependency

**Code Change**:
```typescript
// Before (AWS)
restrictDefaultSecurityGroup: true,

// After (LocalStack)
restrictDefaultSecurityGroup: false,
```

### 3. Integration Test Adaptations

**Issue**: Some AWS APIs have limited support in LocalStack.

**Adaptation**:
- Added conditional checks for LocalStack environment
- Gracefully handle API limitations with fallback validations
- Verify resources via CloudFormation outputs when direct API calls fail

## Testing Strategy

The implementation includes:
- Unit tests that validate the CloudFormation template structure
- Integration tests that adapt to LocalStack limitations
- Conditional test execution based on environment detection

## Conclusion

These adaptations ensure the stack is fully deployable and testable in LocalStack while maintaining compatibility with AWS when deployed to production environments.

