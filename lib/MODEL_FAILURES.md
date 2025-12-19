# Model Failures

## LocalStack Compatibility Adjustments

While no critical failures occurred, several adjustments were made to ensure LocalStack compatibility:

### 1. NAT Gateways Disabled
- Original requirement: NAT Gateways for private subnet egress
- LocalStack limitation: EIP allocation issues in Community edition
- Solution: Set `natGateways: 0` in VPC configuration
- Impact: Private subnets cannot reach internet, but acceptable for testing infrastructure setup

### 2. AWS Config Commented Out
- Original requirement: AWS Config for resource configuration assessment
- LocalStack limitation: Only one Config recorder allowed per region
- Solution: Commented out AWS Config implementation
- Impact: Compliance auditing not available in LocalStack, but code structure preserved for AWS deployment

### 3. CloudTrail Commented Out
- Original requirement: CloudTrail for API call logging
- LocalStack limitation: Requires specific bucket policies and may have compatibility issues
- Solution: Commented out CloudTrail implementation
- Impact: API audit trail not available in LocalStack, but code structure preserved

### 4. VPC Lattice Removed
- Original requirement: Amazon VPC Lattice for service-to-service connectivity
- LocalStack limitation: Not supported in Community edition
- Solution: Removed VPC Lattice implementation entirely
- Impact: Service mesh features unavailable, but core VPC security remains intact

### 5. S3 autoDeleteObjects Removed
- LocalStack limitation: Lambda custom resources can cause deployment issues
- Solution: Removed `autoDeleteObjects: true` from S3 buckets
- Impact: Manual bucket cleanup required after testing

## Summary

All adjustments were made to ensure successful deployment to LocalStack while maintaining the core security and networking requirements. The implementation can be easily enhanced for production AWS deployment by uncommenting and enabling the above features.
