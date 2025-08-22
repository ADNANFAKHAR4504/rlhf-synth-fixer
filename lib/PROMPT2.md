Create a complete and functional CDK for Terraform stack with proper AWS provider imports and module configurations.

## Technical Requirements

### File Structure
- Provide a complete, non-corrupted tap-stack.ts file
- Ensure all TypeScript files compile without errors

### AWS Provider Import Requirements
The solution must use correct import syntax for @cdktf/provider-aws modules:
- Use `dataAwsCallerIdentity` instead of `DataAwsCallerIdentity` 
- Ensure all exported members match the actual provider API
- Verify import statements align with the installed provider version

### Module Configuration Standards
- All AWS service modules must be properly imported
- Constructor parameters must match the provider specifications
- Type definitions should be accurate and complete

## Deliverables
1. Complete tap-stack.ts file with all infrastructure components
2. Verified import statements for all AWS provider modules
3. Error-free compilation of TypeScript code
4. Proper typing for all constructs and resources

## Validation Criteria
- All import statements must resolve successfully
- No TypeScript compilation errors
- All AWS resources properly configured and instantiated