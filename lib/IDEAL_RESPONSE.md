# CloudFormation Template for User Management API

This template sets up a serverless user management system using AWS Lambda, API Gateway, and DynamoDB. The infrastructure is designed to be deployable across different environments with proper IAM permissions and CORS support.

## Architecture

The solution uses a standard three-tier serverless architecture:
- API Gateway handles HTTP requests and responses
- Lambda functions process business logic  
- DynamoDB stores user data

## Key Components

### DynamoDB Table
- Uses PAY_PER_REQUEST billing for cost efficiency
- Single hash key on 'id' field
- Environment-specific naming with `${Environment}-users` pattern

### Lambda Functions
Both functions use Python 3.9 runtime with 128MB memory and 30-second timeout:

**CreateUserFunction**: Handles POST /user requests
- Generates UUID for new users
- Stores user data with timestamps
- Includes validation feature flag support

**GetUserFunction**: Handles GET /user/{id} requests  
- Retrieves users by ID from DynamoDB
- Returns 404 for missing users
- Includes caching feature flag (disabled by default)

### API Gateway Setup
The API uses explicit resource definitions rather than SAM shortcuts:
- REST API with regional endpoints
- Manual CORS implementation using OPTIONS methods
- Proper Lambda proxy integration
- Environment-specific deployment stage

### IAM Security
The Lambda execution role follows least privilege principles:
- Basic Lambda execution permissions
- Specific DynamoDB permissions scoped to the user table only
- No explicit role naming to avoid capability requirements

## Deployment Considerations

The template addresses several deployment challenges:

1. **Resource Naming**: All resources use environment prefixes to prevent naming conflicts
2. **Lambda Permissions**: Properly formatted SourceArn patterns for API Gateway integration
3. **CORS Handling**: Manual OPTIONS method implementation for browser compatibility
4. **Inline Code**: Lambda functions use ZipFile format to avoid external dependencies

## Testing Support

The template outputs all necessary values for integration testing:
- API Gateway URL for endpoint testing
- Lambda function ARNs for direct invocation
- DynamoDB table name for data validation

This approach enables comprehensive testing without hardcoded values or environment assumptions.
