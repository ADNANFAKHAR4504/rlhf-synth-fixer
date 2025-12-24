# Model Failures Documentation

This document captures common failure patterns and solutions for the VPC CloudFormation infrastructure task.

## Common Failure Patterns

### 1. Missing Outputs Section

**Failure:** CloudFormation deployment succeeds but CI/CD fails with "No deployment outputs found"

**Cause:** The template lacks an Outputs section, which is required for downstream resource references and testing.

**Solution:** Add Outputs section with resource IDs:
```json
"Outputs": {
  "VpcId": {
    "Description": "VPC ID",
    "Value": { "Ref": "VPC" }
  }
}
```

### 2. Hardcoded Availability Zones

**Failure:** Template fails in regions with different AZ naming conventions.

**Cause:** Using hardcoded values like "us-east-1a" instead of dynamic selection.

**Solution:** Use Fn::GetAZs with Fn::Select:
```json
"AvailabilityZone": {
  "Fn::Select": [0, { "Fn::GetAZs": "us-east-1" }]
}
```

### 3. Missing VPCGatewayAttachment Dependency

**Failure:** PublicRoute creation fails with "Internet Gateway not attached to VPC"

**Cause:** Route to Internet Gateway created before the attachment completes.

**Solution:** Add DependsOn to the route resource:
```json
"PublicRoute": {
  "Type": "AWS::EC2::Route",
  "DependsOn": "VPCGatewayAttachment",
  "Properties": { ... }
}
```

### 4. Invalid Subnet CIDR Blocks

**Failure:** Subnet creation fails with CIDR overlap errors.

**Cause:** Subnet CIDR blocks overlap or exceed VPC CIDR range.

**Solution:** Ensure subnet CIDRs are within VPC range and do not overlap:
- VPC: 10.0.0.0/16
- Public Subnet 1: 10.0.1.0/24
- Public Subnet 2: 10.0.2.0/24
- Private Subnet 1: 10.0.101.0/24
- Private Subnet 2: 10.0.102.0/24

### 5. Missing Environment Tags

**Failure:** Compliance validation fails due to missing required tags.

**Cause:** Resources lack the required Environment tag.

**Solution:** Add Environment tag to all taggable resources:
```json
"Tags": [
  {
    "Key": "Environment",
    "Value": "Production"
  }
]
```

### 6. Public IP Assignment on Private Subnets

**Failure:** Security validation fails for private subnet configuration.

**Cause:** MapPublicIpOnLaunch set to true on private subnets.

**Solution:** Only enable MapPublicIpOnLaunch on public subnets. Private subnets should not have this property or set it to false.

## LocalStack-Specific Issues

### 7. DNS Hostnames Attribute

**Issue:** LocalStack may not fully support EnableDnsHostnames attribute verification.

**Workaround:** Integration tests should handle this gracefully by skipping DNS hostname verification in LocalStack environments.

### 8. Route Gateway ID Population

**Issue:** LocalStack may not populate GatewayId for routes in some cases.

**Workaround:** Integration tests should check for route existence by DestinationCidrBlock as fallback when GatewayId is not populated.
