# Model Failures - High-Availability Trading Platform (Single-Region)

This document catalogs common failure patterns and edge cases that AI models may encounter when implementing this high-availability trading platform infrastructure using AWS CDK with TypeScript in a single region (us-east-1).

## 1. Architecture and Design Failures

### 1.1 Multi-Region Confusion
**Failure**: Implementing a multi-region disaster recovery solution instead of a single-region, multi-AZ high-availability solution.

**Correct Implementation**: Deploy all resources in us-east-1 region only, using 3 availability zones for redundancy within that region.

**Detection**:
- Check if code contains references to multiple regions
- Verify no cross-region replication is configured
- Ensure all resource names use single region (us-east-1)
- VPC should be deployed in one region across 3 AZs

### 1.2 NAT Gateway Cost Optimization Oversight
**Failure**: Creating NAT Gateways in the VPC instead of using VPC endpoints for cost optimization.

**Correct Implementation**: Use `natGateways: 0` and create VPC endpoints for AWS services (RDS, Lambda).

**Detection**:
```typescript
template.resourceCountIs('AWS::EC2::NatGateway', 0)
```

### 1.3 Incorrect Subnet Type
**Failure**: Using public subnets or private subnets with NAT instead of private isolated subnets.

**Correct Implementation**: Use `ec2.SubnetType.PRIVATE_ISOLATED` with VPC endpoints.

**Detection**:
- Check VPC subnet configuration
- Verify `subnetType: ec2.SubnetType.PRIVATE_ISOLATED`

## 2. Database Configuration Failures

### 2.1 Aurora Engine Version Not Available
**Failure**: Using Aurora PostgreSQL versions that are no longer available (e.g., 15.4).

**Correct Implementation**: Use Aurora PostgreSQL 15.12 or later available version.

**Detection**:
- Deployment fails with "engine version not found"
- Check `rds.AuroraPostgresEngineVersion` value

###Human: continue