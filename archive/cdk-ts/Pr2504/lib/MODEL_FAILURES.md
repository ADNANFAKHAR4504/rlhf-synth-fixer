### 1. **Custom Props Interface**

- Created `TapStackProps` interface that extends `StackProps`
- Added optional `environmentSuffix?: string` property
- Exported the interface for use in other files

### 2. **Updated Stack Constructor**

- Changed constructor parameter from `StackProps` to `TapStackProps`
- Added logic to use `environmentSuffix` from props with default fallback to 'dev'
- Integrated environment suffix into resource naming and descriptions

### 3. **Fixed bin/tap.ts**

- Imported `TapStackProps` interface
- Created properly typed `stackProps` object with `environmentSuffix`
- Added support for multiple environments
- Used environment suffix in stack naming

### 4. **Updated Tests**

- Used `TapStackProps` interface in all test cases
- Added tests for environment suffix functionality
- Added test cases for different environment suffixes
- Added test for default behavior when environment suffix is not provided

### 5. **Enhanced Resource Naming**

- All resources now include environment suffix in their names/descriptions
- SSM parameters use environment-specific paths
- Export names include environment suffix to avoid conflicts
- Added environment suffix as an output for reference

### 6. **Type Safety**

- All code is now fully type-safe
- Proper TypeScript interfaces used throughout
- No more compilation errors related to `environmentSuffix`

## Usage Examples:

### Deploy with specific environment:

```bash
cdk deploy -c environmentSuffix=prod
```

### Deploy multiple environments:

```bash
cdk deploy -c createMultipleEnvironments=true
```

### Run tests:

```bash
npm test
```

### Synthesize template:

````bash
npm run synth
### 🔧 **Fixed the S3 Bucket Policy Issue:**

1. **Removed the problematic bucket policy** that was trying to grant access to the Lambda role via bucket policy
2. **Used IAM role permissions instead** - this is more secure and doesn't conflict with `BlockPublicAccess`
3. **Kept `BlockPublicAccess.BLOCK_ALL`** for maximum security

### 🔒 **Improved Security:**

1. **IAM-based permissions** instead of bucket policies for Lambda access
2. **Origin Access Control (OAC)** for CloudFront instead of legacy OAI
3. **Proper service principal conditions** for CloudFront access

### ✅ **Enhanced Lambda Function:**

1. **Added actual S3 processing logic** in the Lambda code
2. **Better error handling** for S3 operations
3. **More realistic example** of reading and processing S3 objects

### 🧪 **Updated Tests:**

1. **Added test to verify no problematic bucket policies** are created
2. **Verified IAM permissions** are properly configured
3. **Checked Origin Access Control** is created correctly

## Deployment Instructions:

```bash
# Clean build
npm run build

# Run tests to ensure everything is working
npm test

# Synthesize to check CloudFormation template
npm run synth

# Deploy the stack
npm run deploy
````

This fix ensures that:

- ✅ S3 bucket remains private and secure with `BlockPublicAccess.BLOCK_ALL`
- ✅ Lambda function gets S3 access through IAM role permissions (not bucket policy)
- ✅ CloudFront gets S3 access through Origin Access Control with proper conditions
- ✅ No conflicts with AWS account-level Block Public Access policies
- ✅ Follows AWS security best practices

The deployment should now succeed without the `s3:PutBucketPolicy` error! 🎉
