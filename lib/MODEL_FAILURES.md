# Model Failures and Fixes

### 1. CDK Infrastructure Implementation Errors

**Failure**: Model response contained several CDK API usage errors:
- Used `vpc` parameter in Subnet.Builder instead of `vpcId`
- Used incorrect `RouterType.gateway()` and `RouterType.natGateway()` methods
- Used high-level constructs where low-level CFn constructs were needed
- Attempted to use `MachineImage.latestAmazonLinux2()` with unnecessary complex parameters

**Root Cause**: Model mixed CDK v1 and v2 patterns and used non-existent API methods.

**Fix Applied**:
1. Corrected Subnet creation to use `.vpcId()` instead of `.vpc()`
2. Replaced Route.Builder with CfnRoute.Builder for proper routing configuration
3. Used correct CFn construct patterns for Internet Gateway and NAT Gateway setup
4. Simplified AMI selection to use `MachineImage.latestAmazonLinux2()` without parameters

### 2. Resource Configuration Logic Errors

**Failure**: Model response showed incorrect VPC configuration logic and resource creation patterns:
- Hardcoded boolean logic for EC2 creation
- Incorrect subnet CIDR calculation approach
- Missing proper resource dependencies

**Root Cause**: Model oversimplified the region-specific resource logic.

**Fix Applied**:
1. Improved region-based configuration logic with proper CIDR assignment
2. Corrected subnet creation to use proper CFn constructs
3. Fixed resource dependency chains (IGW, Subnets, NAT Gateway, Route Tables)

## Quality Improvements Made

1. **Architectural Simplicity**: Consolidated multi-file structure into single Main.java with inner classes
2. **Code Quality**: Fixed all checkstyle violations including imports, parameters, and class declarations
3. **API Correctness**: Corrected all CDK API usage to match actual v2 CDK patterns
4. **Resource Logic**: Implemented proper region-based resource creation with correct dependencies
5. **Configuration**: Added proper environment suffix support with context resolution
6. **Testing**: Created comprehensive unit and integration tests that actually work with the corrected implementation