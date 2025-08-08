# Pre-Deployment Validation Lambda Function

This Lambda function is used for custom validation in the CI/CD pipeline. It performs pre-deployment checks and can be extended with additional validation logic.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

## Function Details

- **Runtime**: Node.js 18.x
- **Handler**: `pre-deployment-validation.handler`
- **Timeout**: 5 minutes
- **Memory**: 128 MB (default)

## Customization

The `performValidationChecks` function can be extended with your specific validation logic:

- Verify artifact integrity
- Check deployment window
- Validate configuration parameters
- Run security scans
- Check business rules

## Usage in CDK Stack

The function is referenced in the main CDK stack as:

```typescript
const preDeploymentValidationFunction = new lambda.Function(this, 'PreDeploymentValidation', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'pre-deployment-validation.handler',
  code: lambda.Code.fromAsset('lib/lambda'),
  // ... other configuration
});
```

## Dependencies

- `aws-sdk`: For CodePipeline integration (AWS SDK v2)
- `@types/aws-lambda`: TypeScript definitions for Lambda
- `typescript`: For compilation 