# TapStack Tests

This directory contains unit and integration tests for the TapStack CloudFormation template.

## Test Structure

- `tap-stack.unit.test.ts` - Unit tests that validate the CloudFormation template structure
- `tap-stack.int.test.ts` - Integration tests that validate deployed infrastructure

## Running Tests

### Unit Tests

```bash
npm run test:unit
```

Unit tests validate:

- Template structure and syntax
- Resource configurations
- Parameter definitions
- Output specifications
- Security settings
- Tagging compliance

### Integration Tests

```bash
npm run test:integration
```

Integration tests validate:

- Deployed infrastructure accessibility
- VPC and networking configuration
- Load balancer functionality
- RDS database availability
- S3 bucket security
- CloudFront distribution
- High availability setup

## Prerequisites

### For Unit Tests

- Node.js >= 22.17.0
- Template converted to JSON: `cfn-flip lib/TapStack.yml > lib/TapStack.json`

### For Integration Tests

- AWS credentials configured
- Stack deployed to AWS
- Optional: `cfn-outputs/flat-outputs.json` file with stack outputs

## Environment Variables

- `ENVIRONMENT_NAME` - Environment name (default: 'Production')
- `STACK_NAME` - CloudFormation stack name (default: 'TapStack-{ENVIRONMENT_NAME}')

## Test Coverage

The tests cover:

- ✅ Template validation
- ✅ Security configurations
- ✅ Network architecture
- ✅ Database setup
- ✅ Load balancing
- ✅ Storage encryption
- ✅ High availability
- ✅ Resource tagging
- ✅ Output validation

## Troubleshooting

If integration tests fail:

1. Ensure the stack is deployed and accessible
2. Check AWS credentials and permissions
3. Verify the stack name matches the expected pattern
4. Check that all resources are in 'available' state
