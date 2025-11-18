# Lambda Functions

This directory contains the source code for the Lambda functions used in the Transaction Processing Pipeline.

## Functions

### validation/
- **Purpose**: Validates incoming CSV files from API Gateway
- **Runtime**: Python 3.11
- **Memory**: 512 MB
- **Timeout**: 60 seconds
- **Dependencies**: boto3, aws-xray-sdk

### transformation/
- **Purpose**: Transforms CSV data and stores in DynamoDB
- **Runtime**: Python 3.11
- **Memory**: 512 MB
- **Timeout**: 300 seconds (5 minutes)
- **Dependencies**: boto3, aws-xray-sdk

### notification/
- **Purpose**: Sends processing notifications via SNS
- **Runtime**: Python 3.11
- **Memory**: 512 MB
- **Timeout**: 60 seconds
- **Dependencies**: boto3, aws-xray-sdk

## Packaging Strategy

Lambda packages are **generated dynamically** during the CDK synthesis process. Do NOT commit pre-generated ZIP files to the repository.

### How It Works

1. During `cdktf synth` or deployment, the `package_lambda` function in `tap_stack.py`:
   - Creates a temporary directory
   - Copies the Lambda source code
   - Installs dependencies from `requirements.txt`
   - Creates a ZIP file in `lambda_packages/` directory

2. The ZIP file naming includes the environment suffix:
   - `validation-lambda-dev.zip`
   - `transformation-lambda-prod.zip`
   - `notification-lambda-test.zip`

### Local Development

To test Lambda packaging locally:

```bash
# Synthesize the stack (this will create the packages)
npm run cdktf:synth -- --env dev

# The packages will be in lambda_packages/
ls lambda_packages/
```

### Best Practices

1. **Don't commit ZIP files**: The `lambda_packages/` directory is in `.gitignore`
2. **Keep dependencies minimal**: Only include what's needed
3. **Use Lambda Layers**: For heavy dependencies (future improvement)
4. **Version dependencies**: Pin versions in `requirements.txt`

### Future Improvements

1. **Lambda Layers**: Move common dependencies (boto3, aws-xray-sdk) to a Lambda Layer
2. **Build caching**: Only rebuild if source files change
3. **Container images**: For functions > 50MB unzipped
4. **Native dependencies**: Use Docker for consistent builds across platforms
