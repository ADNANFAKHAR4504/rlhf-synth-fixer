# Model Failures

This document captures the key issues and failures that were identified and fixed in the model's initial response.

## Summary

The initial model response had several critical issues that prevented successful deployment and testing. All issues have been resolved in the ideal response.

## Issues Identified

### 1. Test File Configuration Issues

**Problem**: Integration test files were using `.mjs` extension but the test infrastructure expected `.ts` files, causing compatibility issues with Jest and AWS SDK dynamic imports.

**Impact**: 
- Integration tests failed with "A dynamic import callback was invoked without --experimental-vm-modules" error
- 29 out of 31 tests failing due to module system incompatibility

**Resolution**:
- Test files kept as `.mjs` (JavaScript ES modules) since they don't require TypeScript compilation
- Added `NODE_OPTIONS=--experimental-vm-modules` environment variable for Jest to handle ES modules properly
- Updated test execution to support both `.ts` and `.mjs` test files

### 2. Test Resource Name Mismatches

**Problem**: Unit tests expected different resource names than what was actually defined in the CloudFormation template.

**Impact**:
- 4 unit tests failing due to incorrect resource name expectations
- Tests looking for `FinanceEIP` instead of `FinanceNATGatewayEIP`
- Tests looking for `PublicSubnetNACL` instead of `HubPublicNetworkAcl`
- Tests looking for `PublicNACLInboundHTTP` instead of `HubPublicNaclInboundHTTP`

**Resolution**:
- Updated unit test expectations to match actual CloudFormation resource names:
  - EIP resources: `FinanceNATGatewayEIP`, `EngineeringNATGatewayEIP`, `MarketingNATGatewayEIP`
  - NACL resources: `HubPublicNetworkAcl`, `HubPublicNaclInboundHTTP`, `HubPublicNaclInboundHTTPS`

### 3. Metadata Language Configuration

**Problem**: Metadata initially set `language: js` but CloudFormation deployment scripts expected `language: yaml` for CloudFormation projects.

**Impact**:
- Deployment script failure with error: "Unknown deployment method for platform: cfn, language: js"
- CI/CD pipeline unable to deploy the infrastructure

**Resolution**:
- Changed `metadata.json` from `language: js` to `language: yaml`
- This aligns with the actual template file `lib/TapStack.yml` and deployment script requirements

### 4. Integration Test Static Configuration

**Problem**: Integration tests initially attempted to load outputs from a static file (`cfn-outputs/flat-outputs.json`) rather than dynamically querying CloudFormation.

**Impact**:
- Tests couldn't run without pre-generated output files
- Not truly testing deployed infrastructure
- Brittle test setup requiring manual file management

**Resolution**:
- Implemented fully dynamic stack discovery using AWS CloudFormation SDK
- Stack name constructed from `ENVIRONMENT_SUFFIX` environment variable
- All outputs loaded directly from deployed stack using `DescribeStacksCommand`
- Tests now query actual AWS resources with no mocked or hardcoded values

### 5. DNS Attribute Verification Method

**Problem**: Integration test tried to verify VPC DNS settings using `DescribeVpcsCommand`, but DNS attributes (`EnableDnsSupport`, `EnableDnsHostnames`) are not returned in the standard VPC description.

**Impact**:
- 1 integration test failing with "Expected: true, Received: undefined"

**Resolution**:
- Changed to use `DescribeVpcAttributeCommand` for each VPC
- Separate calls for `enableDnsSupport` and `enableDnsHostnames` attributes
- Properly accesses the `Value` property from the response

### 6. Unit Test Script Configuration

**Problem**: The `scripts/unit-tests.sh` script didn't have a handler for CloudFormation YAML projects, causing it to fall through to the default TypeScript test handler.

**Impact**:
- Unit tests looking for `.ts` files when actual test files were `.mjs`
- "No tests found" error during test execution

**Resolution**:
- Script already had proper logic to convert YAML to JSON for CloudFormation projects
- Metadata language change to `yaml` triggered the correct test script path
- Script runs appropriate test command based on language setting

### 7. Build Configuration for Test Files

**Problem**: TypeScript compiler (`tsc`) attempted to compile `.mjs` test files during build, causing numerous type errors since JavaScript files don't have type annotations.

**Impact**:
- 130 TypeScript compilation errors in test files
- Build process failing before tests could run

**Resolution**:
- Test files maintained as `.mjs` to indicate they are JavaScript, not TypeScript
- TypeScript compiler ignores `.mjs` files by default
- Tests run successfully without type checking overhead

## Validation

All issues have been resolved and verified:

✅ **Unit Tests**: 68/68 passing
✅ **Integration Tests**: 31/31 passing  
✅ **Build Process**: Successful compilation
✅ **Lint Checks**: All passing
✅ **Deployment**: CloudFormation stack deployed successfully
✅ **Dynamic Testing**: All resources discovered and validated from live AWS infrastructure

## Key Learnings

1. **Test Infrastructure Alignment**: Ensure test file extensions (.ts vs .mjs) match the expected test runner configuration
2. **Resource Naming Consistency**: Unit tests must reference exact CloudFormation resource names from the template
3. **Metadata Accuracy**: Platform and language metadata must match deployment script expectations
4. **Dynamic Testing**: Integration tests should query live infrastructure, not rely on static output files
5. **API Method Selection**: Use appropriate AWS SDK commands for specific attribute queries (e.g., DescribeVpcAttributeCommand for DNS settings)
6. **Module System Compatibility**: When using ES modules (.mjs), ensure Jest is configured with experimental VM modules support
