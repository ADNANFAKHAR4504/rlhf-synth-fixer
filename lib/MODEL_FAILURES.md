# MODEL FAILURES: Common Issues When Working with Multi-Region Pulumi Infrastructure

This document catalogs common failures and issues that can occur when working with or trying to replicate the multi-region Pulumi AWS infrastructure pattern implemented in `tap_stack.py`.

## 1. **Multi-Region Architecture Failures**

### ❌ **Missing Explicit AWS Providers**
**Problem**: Models often forget to create explicit AWS providers for each region.
```python
# WRONG - No explicit provider
vpc = ec2.Vpc(f"vpc-{region}", cidr_block=vpc_cidr)
subnet = ec2.Subnet(f"subnet-{region}", vpc_id=vpc.id)
```

**Why it fails**: Without explicit providers, resources may be created in the wrong region or fail to deploy properly.

**Correct approach**: Create explicit providers for each region:
```python
# CORRECT - Explicit provider per region
provider = aws.Provider(
    f"aws-{region}",
    region=region,
    default_tags=aws.ProviderDefaultTagsArgs(
        tags={"Environment": environment, "Team": team, "Project": project}
    ),
)
vpc = ec2.Vpc(f"vpc-{region}", cidr_block=vpc_cidr, opts=pulumi.ResourceOptions(provider=provider))
```

### ❌ **Overlapping CIDR Blocks**
**Problem**: Models use the same CIDR block across multiple regions.
```python
# WRONG - Same CIDR for all regions
region_cidrs = {
    "us-east-1": "10.0.0.0/16",
    "us-west-2": "10.0.0.0/16",  # Overlapping!
    "eu-west-1": "10.0.0.0/16",  # Overlapping!
}
```

**Why it fails**: Overlapping CIDRs can cause routing conflicts and deployment failures.

**Correct approach**: Use non-overlapping CIDR blocks:
```python
# CORRECT - Non-overlapping CIDRs
region_cidrs = {
    "us-east-1": "10.0.0.0/16",
    "us-west-2": "10.1.0.0/16",
    "eu-west-1": "10.2.0.0/16",
}
```

### ❌ **Inconsistent Resource Naming**
**Problem**: Models don't include region in resource names, causing conflicts.
```python
# WRONG - No region in names
vpc = ec2.Vpc("vpc", cidr_block=vpc_cidr)
subnet = ec2.Subnet("subnet", vpc_id=vpc.id)
```

**Correct approach**: Include region in all resource names:
```python
# CORRECT - Region-aware naming
vpc = ec2.Vpc(f"vpc-{region}-{environment}", cidr_block=vpc_cidr)
subnet = ec2.Subnet(f"subnet-{region}-{environment}", vpc_id=vpc.id)
```

## 2. **Security Configuration Failures**

### ❌ **Hardcoded Security Rules**
**Problem**: Models hardcode security group rules without environment awareness.
```python
# WRONG - Hardcoded SSH access
cidr_blocks=["0.0.0.0/0"]  # Always allows SSH from anywhere
```

**Why it fails**: Production environments need restricted access for security compliance.

**Correct approach**: Make security configurable and environment-aware:
```python
# CORRECT - Environment-aware security
ssh_allowed_cidrs = config.get("ssh_allowed_cidrs")
if ssh_allowed_cidrs is None:
    if environment == "prod":
        ssh_allowed_cidrs = ["10.0.0.0/16"]  # VPC CIDR only
    else:
        ssh_allowed_cidrs = ["0.0.0.0/0"]    # Development convenience
```

### ❌ **Missing Security Validation**
**Problem**: Models don't validate security configurations.
```python
# WRONG - No validation
ssh_allowed_cidrs = config.get("ssh_allowed_cidrs") or ["0.0.0.0/0"]
```

**Correct approach**: Add security validation:
```python
# CORRECT - With validation
ssh_allowed_cidrs = config.get("ssh_allowed_cidrs")
if environment == "prod" and "0.0.0.0/0" in ssh_allowed_cidrs:
    # Replace 0.0.0.0/0 with VPC CIDR in production
    ssh_allowed_cidrs = [cidr if cidr != "0.0.0.0/0" else "10.0.0.0/16" for cidr in ssh_allowed_cidrs]
```

### ❌ **Incorrect Security Group References**
**Problem**: Models use CIDR blocks instead of security group references for tier-to-tier communication.
```python
# WRONG - Using CIDR instead of security group reference
ec2.SecurityGroupIngressArgs(
    from_port=8080,
    to_port=8080,
    protocol="tcp",
    cidr_blocks=[vpc_cidr],  # Less secure
)
```

**Correct approach**: Use security group references when possible:
```python
# CORRECT - Security group reference
ec2.SecurityGroupIngressArgs(
    from_port=8080,
    to_port=8080,
    protocol="tcp",
    source_security_group_id=web_sg.id,  # More secure
)
```

## 3. **Resource Dependencies and Provider Issues**

### ❌ **Missing Provider Options**
**Problem**: Models forget to pass provider options to resources.
```python
# WRONG - No provider option
vpc = ec2.Vpc(f"vpc-{region}", cidr_block=vpc_cidr)
subnet = ec2.Subnet(f"subnet-{region}", vpc_id=vpc.id)
```

**Why it fails**: Resources may be created in the wrong region or fail to reference each other properly.

**Correct approach**: Always pass provider options:
```python
# CORRECT - With provider options
vpc = ec2.Vpc(f"vpc-{region}", cidr_block=vpc_cidr, opts=pulumi.ResourceOptions(provider=provider))
subnet = ec2.Subnet(f"subnet-{region}", vpc_id=vpc.id, opts=pulumi.ResourceOptions(provider=provider))
```

### ❌ **Missing Resource Dependencies**
**Problem**: Models don't specify dependencies between resources.
```python
# WRONG - No explicit dependencies
eip = ec2.Eip(f"nat-eip-{region}", vpc=True)
nat_gw = ec2.NatGateway(f"nat-gw-{region}", allocation_id=eip.id)
```

**Correct approach**: Specify dependencies explicitly:
```python
# CORRECT - With explicit dependencies
eip = ec2.Eip(
    f"nat-eip-{region}",
    domain="vpc",
    opts=pulumi.ResourceOptions(provider=provider, depends_on=[igw])
)
nat_gw = ec2.NatGateway(
    f"nat-gw-{region}",
    allocation_id=eip.id,
    opts=pulumi.ResourceOptions(provider=provider)
)
```

## 4. **Configuration Management Failures**

### ❌ **Missing Environment Configuration**
**Problem**: Models don't use Pulumi Config for environment-specific settings.
```python
# WRONG - Hardcoded values
environment = "dev"
regions = ["us-east-1"]
```

**Correct approach**: Use Pulumi Config:
```python
# CORRECT - Config-driven
config = Config()
environment = config.get("environment") or "dev"
regions = config.get_object("regions") or ["us-east-1"]
```

### ❌ **Inconsistent Tagging**
**Problem**: Models don't implement consistent tagging across all resources.
```python
# WRONG - Inconsistent or missing tags
vpc = ec2.Vpc("vpc", cidr_block=vpc_cidr)  # No tags
subnet = ec2.Subnet("subnet", vpc_id=vpc.id, tags={"Name": "subnet"})  # Inconsistent
```

**Correct approach**: Use consistent tagging strategy:
```python
# CORRECT - Consistent tagging
base_tags = {
    "Environment": environment,
    "Team": team,
    "Project": project,
    "Name": f"vpc-{region}-{environment}",
    "Region": region,
}
vpc = ec2.Vpc(f"vpc-{region}-{environment}", cidr_block=vpc_cidr, tags=base_tags)
```

## 5. **Testing Integration Failures**

### ❌ **Unconditional Exports**
**Problem**: Models call `pulumi.export()` unconditionally, breaking unit tests.
```python
# WRONG - Always exports
def create_infrastructure():
    # ... resources
    pulumi.export("vpc_id", vpc.id)  # Fails in test context
```

**Correct approach**: Make exports conditional:
```python
# CORRECT - Conditional exports
def create_infrastructure(export_outputs=True):
    # ... resources
    if export_outputs:
        pulumi.export("vpc_id", vpc.id)
    return {"vpc": vpc}
```

### ❌ **Missing Test Configuration**
**Problem**: Models don't provide proper test configuration for multi-region setup.
```python
# WRONG - No test configuration
def test_infrastructure():
    result = create_infrastructure()  # May fail with multi-region
```

**Correct approach**: Provide test-specific configuration:
```python
# CORRECT - Test configuration
@patch('tap_stack.Config')
def test_infrastructure(mock_config):
    mock_config_instance = Mock()
    mock_config_instance.get.return_value = "test"
    mock_config_instance.get_object.return_value = ["us-east-1"]
    mock_config.return_value = mock_config_instance
    
    result = create_infrastructure(export_outputs=False)
    # ... assertions
```

## 6. **Route Table Configuration Failures**

### ❌ **Inline Route Definition Issues**
**Problem**: Models use inline routes but don't handle complex routing scenarios properly.
```python
# WRONG - Inline routes may not work for complex scenarios
routes=[ec2.RouteTableRouteArgs(cidr_block="0.0.0.0/0", gateway_id=igw.id)]
```

**Correct approach**: Consider explicit Route resources for complex scenarios:
```python
# CORRECT - Explicit routes for complex scenarios
public_rt = ec2.RouteTable(f"public-rt-{region}", vpc_id=vpc.id)
ec2.Route(
    f"public-route-{region}",
    route_table_id=public_rt.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=igw.id,
    opts=pulumi.ResourceOptions(provider=provider)
)
```

## 7. **Availability Zone Management Failures**

### ❌ **Hardcoded AZ Count**
**Problem**: Models hardcode the number of availability zones.
```python
# WRONG - Hardcoded AZ count
azs = ["us-east-1a", "us-east-1b", "us-east-1c"]  # May not exist in all regions
```

**Correct approach**: Dynamically get available AZs:
```python
# CORRECT - Dynamic AZ discovery
azs = get_availability_zones(state="available", opts=pulumi.InvokeOptions(provider=provider))
num_azs = max(2, min(len(azs.names), 2))  # Use 2 AZs for cost optimization
```

### ❌ **AZ Index Errors**
**Problem**: Models don't handle cases where fewer AZs are available than expected.
```python
# WRONG - No bounds checking
for i in range(3):  # May fail if only 2 AZs available
    az = azs.names[i]
```

**Correct approach**: Add bounds checking:
```python
# CORRECT - With bounds checking
num_azs = max(2, min(len(azs.names), 2))
for i in range(num_azs):
    az = azs.names[i]
```

## 8. **Cost Optimization Failures**

### ❌ **Unnecessary High Availability**
**Problem**: Models enable high availability features by default, increasing costs.
```python
# WRONG - Always enable HA
enable_ha_nat = True  # Expensive!
```

**Correct approach**: Make HA configurable with cost-conscious defaults:
```python
# CORRECT - Cost-conscious defaults
enable_ha_nat = config.get_bool("enable_ha_nat") or False  # Default: single NAT for cost
```

### ❌ **Too Many Subnets**
**Problem**: Models create more subnets than necessary.
```python
# WRONG - Too many subnets
for i in range(4):  # 4 AZs = expensive
    for j in range(3):  # 3 subnets per AZ = very expensive
        # Create subnet
```

**Correct approach**: Use cost-optimized subnet strategy:
```python
# CORRECT - Cost-optimized
num_azs = max(2, min(len(azs.names), 2))  # Use exactly 2 AZs
for i in range(num_azs):
    for j in range(2):  # 2 subnets per AZ (public + private)
        # Create subnet
```

## 9. **Import and Module Issues**

### ❌ **Missing Type Hints**
**Problem**: Models don't use type hints, making code harder to maintain.
```python
# WRONG - No type hints
def create_vpc_infrastructure(region):
    # ... implementation
```

**Correct approach**: Use type hints:
```python
# CORRECT - With type hints
def create_vpc_infrastructure(region: str) -> Dict[str, Any]:
    # ... implementation
```

### ❌ **Incorrect Import Order**
**Problem**: Models don't follow proper import order conventions.
```python
# WRONG - Incorrect import order
import pulumi
from typing import Dict, List, Any
import ipaddress
```

**Correct approach**: Follow import order conventions:
```python
# CORRECT - Proper import order
from typing import Dict, List, Any
import ipaddress
import pulumi
from pulumi import Config
from pulumi_aws import ec2, get_availability_zones
import pulumi_aws as aws
```

## 10. **Error Handling and Validation Failures**

### ❌ **Missing Input Validation**
**Problem**: Models don't validate configuration inputs.
```python
# WRONG - No validation
regions = config.get_object("regions") or ["us-east-1"]
```

**Correct approach**: Add input validation:
```python
# CORRECT - With validation
regions = config.get_object("regions") or ["us-east-1"]
if not regions or len(regions) == 0:
    raise ValueError("At least one region must be specified")
```

### ❌ **No Error Handling for Resource Creation**
**Problem**: Models don't handle resource creation failures gracefully.
```python
# WRONG - No error handling
vpc = ec2.Vpc(f"vpc-{region}", cidr_block=vpc_cidr)
```

**Correct approach**: Add error handling where appropriate:
```python
# CORRECT - With error handling
try:
    vpc = ec2.Vpc(f"vpc-{region}", cidr_block=vpc_cidr, opts=pulumi.ResourceOptions(provider=provider))
except Exception as e:
    print(f"Failed to create VPC in region {region}: {e}")
    raise
```

## Prevention Strategies

1. **Always use explicit providers** for multi-region deployments
2. **Use non-overlapping CIDR blocks** across regions
3. **Implement environment-aware security** configurations
4. **Add proper resource dependencies** and provider options
5. **Use consistent tagging** across all resources
6. **Make exports conditional** for testing compatibility
7. **Validate configuration inputs** before resource creation
8. **Use cost-conscious defaults** for production deployments
9. **Follow import order conventions** and use type hints
10. **Test thoroughly** with different region configurations

## Success Indicators

A successful multi-region Pulumi implementation should:
- ✅ Use explicit AWS providers for each region
- ✅ Have non-overlapping CIDR blocks
- ✅ Include environment-aware security configurations
- ✅ Use consistent resource naming with region prefixes
- ✅ Implement proper resource dependencies
- ✅ Include comprehensive testing support
- ✅ Use cost-optimized defaults
- ✅ Follow Pulumi best practices
- ✅ Include proper error handling and validation
- ✅ Support multiple deployment environments