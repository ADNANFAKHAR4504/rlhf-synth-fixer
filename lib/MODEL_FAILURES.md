# MODEL FAILURES: Common Issues When Responding to PROMPT.md

This document catalogs common failures and issues that AI models encounter when trying to respond to the PROMPT.md requirements for creating a single-file Pulumi AWS infrastructure.

## 1. **Architecture Mismatch Failures**

### ❌ **ComponentResource Approach**
**Problem**: Models often create `Pulumi.ComponentResource` classes instead of single-file functions.
```python
# WRONG - ComponentResource approach
class TapStack(pulumi.ComponentResource):
    def __init__(self, name, args, opts=None):
        super().__init__('tap:stack:TapStack', name, None, opts)
        # ... resource creation
```

**Why it fails**: The requirement explicitly asks for "a single file that I can run with `pulumi up`" - ComponentResources require separate instantiation.

**Correct approach**: Use a function-based approach:
```python
# CORRECT - Single-file function
def create_infrastructure(export_outputs=True):
    # ... resource creation
    return {"vpc": vpc, "subnets": subnets}

if __name__ == "__main__":
    create_infrastructure()
```

### ❌ **Missing Entry Point**
**Problem**: Models create the infrastructure function but forget to add the execution entry point.
```python
# WRONG - No entry point
def create_infrastructure():
    # ... resources
# Missing: if __name__ == "__main__"
```

## 2. **Testing Integration Failures**

### ❌ **Unconditional pulumi.export Calls**
**Problem**: Models call `pulumi.export()` unconditionally, breaking unit tests.
```python
# WRONG - Always exports
def create_infrastructure():
    # ... resources
    pulumi.export("vpc_id", vpc.id)  # Fails in test context
```

**Why it fails**: `pulumi.export()` requires a Pulumi stack context, which doesn't exist during unit testing.

**Correct approach**: Make exports conditional:
```python
# CORRECT - Conditional exports
def create_infrastructure(export_outputs=True):
    # ... resources
    if export_outputs:
        pulumi.export("vpc_id", vpc.id)
    return {"vpc": vpc}
```

### ❌ **Incorrect Import Paths in Tests**
**Problem**: Test files use wrong import paths after refactoring.
```python
# WRONG - Old import path
from tap_stack import create_infrastructure  # Fails if file is in lib/
```

**Correct approach**: Use proper relative imports:
```python
# CORRECT - Proper import path
from lib.tap_stack import create_infrastructure
```

## 3. **Security Configuration Failures**

### ❌ **Hardcoded Security Rules**
**Problem**: Models hardcode security group rules without considering environment differences.
```python
# WRONG - Hardcoded SSH access
cidr_blocks=["0.0.0.0/0"]  # Always allows SSH from anywhere
```

**Why it fails**: Production environments need restricted access for security compliance.

**Correct approach**: Make security configurable:
```python
# CORRECT - Configurable security
ssh_allowed_cidrs = config.get('ssh_allowed_cidrs') or ['0.0.0.0/0']
if environment == 'prod' and ssh_allowed_cidrs == ['0.0.0.0/0']:
    ssh_allowed_cidrs = ['10.0.0.0/16']  # Restrict in production
```

## 4. **Configuration Management Failures**

### ❌ **Missing Environment Awareness**
**Problem**: Models don't consider different deployment environments.
```python
# WRONG - No environment configuration
vpc = ec2.Vpc("vpc", cidr_block="10.0.0.0/16")
```

**Correct approach**: Use Pulumi Config for environment-specific settings:
```python
# CORRECT - Environment-aware configuration
config = Config()
environment = config.get('environment') or 'dev'
vpc = ec2.Vpc(f"vpc-{environment}", cidr_block="10.0.0.0/16")
```

### ❌ **Inconsistent Tagging**
**Problem**: Models don't implement consistent tagging strategy.
```python
# WRONG - Inconsistent or missing tags
vpc = ec2.Vpc("vpc", cidr_block="10.0.0.0/16")  # No tags
```

**Correct approach**: Implement consistent tagging:
```python
# CORRECT - Consistent tagging
tags = {
    "Environment": environment,
    "Team": team,
    "Project": project,
    "Name": f"vpc-{environment}"
}
vpc = ec2.Vpc(f"vpc-{environment}", cidr_block="10.0.0.0/16", tags=tags)
```

## 5. **Deployment Integration Failures**

### ❌ **Missing Main Entry Point**
**Problem**: Models don't provide a proper entry point for `pulumi up`.
```python
# WRONG - No main entry point
def create_infrastructure():
    # ... resources
# Missing: tap.py or __main__.py
```

**Correct approach**: Provide proper entry point:
```python
# tap.py
from lib.tap_stack import create_infrastructure
create_infrastructure()
```

### ❌ **Incorrect Pulumi.yaml Configuration**
**Problem**: Models don't specify the correct main entry point.
```yaml
# WRONG - Incorrect main
name: TapStack
runtime:
  name: python
main: lib/tap_stack.py  # Should point to entry point, not implementation
```

**Correct approach**: Point to the entry point:
```yaml
# CORRECT - Proper main entry point
name: TapStack
runtime:
  name: python
main: tap.py  # Points to entry point that calls implementation
```

## 6. **Code Quality Failures**

### ❌ **Poor Documentation**
**Problem**: Models provide minimal or unclear documentation.
```python
# WRONG - Poor documentation
def create_infrastructure():
    vpc = ec2.Vpc("vpc", cidr_block="10.0.0.0/16")
    # ... more resources without explanation
```

**Correct approach**: Provide clear documentation:
```python
# CORRECT - Good documentation
def create_infrastructure(export_outputs=True):
    """
    Create the complete AWS infrastructure.
    
    Args:
        export_outputs (bool): Whether to export stack outputs (default: True)
    
    Returns:
        dict: Dictionary containing all created resources
    """
    # ... resources with inline comments
```

### ❌ **No Error Handling**
**Problem**: Models don't consider error scenarios or edge cases.
```python
# WRONG - No error handling
azs = get_availability_zones(state="available")
subnet1 = ec2.Subnet("subnet1", availability_zone=azs.names[0])
```

**Correct approach**: Add error handling:
```python
# CORRECT - With error handling
azs = get_availability_zones(state="available")
if len(azs.names) < 2:
    raise ValueError("Need at least 2 availability zones")
subnet1 = ec2.Subnet("subnet1", availability_zone=azs.names[0])
```

## 7. **Resource Management Failures**

### ❌ **Missing Resource Dependencies**
**Problem**: Models don't properly handle resource dependencies.
```python
# WRONG - Missing dependencies
vpc = ec2.Vpc("vpc", cidr_block="10.0.0.0/16")
subnet = ec2.Subnet("subnet", vpc_id=vpc.id)  # Should reference vpc.id
```

**Correct approach**: Use proper Pulumi resource references:
```python
# CORRECT - Proper dependencies
vpc = ec2.Vpc("vpc", cidr_block="10.0.0.0/16")
subnet = ec2.Subnet("subnet", vpc_id=vpc.id, cidr_block="10.0.1.0/24")
```

## 8. **Common Import and Path Issues**

### ❌ **Wrong Import Structure**
**Problem**: Models use incorrect import patterns for the single-file requirement.
```python
# WRONG - Complex import structure
from .components import VPCComponent
from .utils import get_config
```

**Correct approach**: Keep imports simple for single-file approach:
```python
# CORRECT - Simple imports
import pulumi
from pulumi import Config
from pulumi_aws import ec2, get_availability_zones
```

## Prevention Strategies

1. **Always test the single-file requirement** - Ensure the file can be run directly with `pulumi up`
2. **Implement conditional exports** - Make `pulumi.export()` calls conditional for testing
3. **Use configuration-driven security** - Never hardcode security rules
4. **Provide proper entry points** - Always include `tap.py` or equivalent
5. **Test thoroughly** - Include unit and integration tests
6. **Document clearly** - Provide inline comments and docstrings
7. **Consider environments** - Use Pulumi Config for environment-specific settings

## Success Indicators

A successful response should:
- ✅ Be a single Python file that runs with `pulumi up`
- ✅ Include comprehensive AWS infrastructure
- ✅ Have configurable security settings
- ✅ Include proper testing support
- ✅ Provide clear documentation
- ✅ Use consistent tagging and naming
- ✅ Handle different environments
- ✅ Include proper error handling