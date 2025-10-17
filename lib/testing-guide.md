# Testing Guide

This guide provides instructions for testing the deployed Secure API with Cognito authentication.

## Prerequisites

- AWS CLI configured with appropriate credentials
- `jq` for JSON processing (optional but recommended)
- `curl` for making HTTP requests
- Deployed infrastructure (see deployment-guide.md)

## Getting Started

### Retrieve Infrastructure Outputs

First, get the necessary values from your deployment:

```bash
cd lib

# Get all outputs
terraform output

# Get specific outputs
API_URL=$(terraform output -raw api_gateway_invoke_url)
USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
CLIENT_ID=$(terraform output -raw cognito_user_pool_client_id)
CF_DOMAIN=$(terraform output -raw cloudfront_domain_name)
```

## Testing Cognito Authentication

### Create a Test User

Use AWS CLI to create and confirm a test user:

```bash
# Sign up a new user
aws cognito-idp sign-up \
  --client-id ${CLIENT_ID} \
  --username testuser@example.com \
  --password "TestPass123!" \
  --user-attributes \
    Name=email,Value=testuser@example.com \
    Name=name,Value="Test User"

# Confirm the user (admin action for testing)
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id ${USER_POOL_ID} \
  --username testuser@example.com
```

### Authenticate and Get JWT Token

```bash
# Initiate authentication
AUTH_RESPONSE=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id ${CLIENT_ID} \
  --auth-parameters \
    USERNAME=testuser@example.com,PASSWORD="TestPass123!" \
  --query 'AuthenticationResult.IdToken' \
  --output text)

# Store the token
export AUTH_TOKEN=${AUTH_RESPONSE}

echo "Auth Token: ${AUTH_TOKEN}"
```

## Testing API Endpoints

### Test CORS Preflight Request

```bash
curl -X OPTIONS "${API_URL}/profiles" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v
```

Expected: 200 OK with CORS headers.

### Create a User Profile

```bash
curl -X POST "${API_URL}/profiles" \
  -H "Content-Type: application/json" \
  -H "Authorization: ${AUTH_TOKEN}" \
  -d '{
    "email": "testuser@example.com",
    "name": "Test User",
    "phoneNumber": "+1234567890",
    "bio": "This is a test profile"
  }' | jq '.'
```

Expected response:

```json
{
  "message": "Profile created successfully",
  "profile": {
    "userId": "...",
    "email": "testuser@example.com",
    "name": "Test User",
    "phoneNumber": "+1234567890",
    "bio": "This is a test profile",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Save the userId for subsequent operations:

```bash
PROFILE_ID="paste-userId-here"
```

### Get a User Profile

```bash
curl -X GET "${API_URL}/profiles/${PROFILE_ID}" \
  -H "Authorization: ${AUTH_TOKEN}" | jq '.'
```

Expected: 200 OK with profile data.

### List All Profiles

```bash
curl -X GET "${API_URL}/profiles" \
  -H "Authorization: ${AUTH_TOKEN}" | jq '.'
```

Expected: 200 OK with array of profiles.

### Update a User Profile

```bash
curl -X PUT "${API_URL}/profiles/${PROFILE_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: ${AUTH_TOKEN}" \
  -d '{
    "email": "testuser@example.com",
    "name": "Updated Test User",
    "phoneNumber": "+1234567890",
    "bio": "This profile has been updated"
  }' | jq '.'
```

Expected: 200 OK with updated profile data.

### Delete a User Profile

```bash
curl -X DELETE "${API_URL}/profiles/${PROFILE_ID}" \
  -H "Authorization: ${AUTH_TOKEN}" | jq '.'
```

Expected: 200 OK with deletion confirmation.

### Test Unauthorized Access

```bash
curl -X GET "${API_URL}/profiles" | jq '.'
```

Expected: 401 Unauthorized.

## Testing via CloudFront

Test the same endpoints through CloudFront for global edge delivery:

```bash
# Replace API Gateway URL with CloudFront domain
CF_URL="https://${CF_DOMAIN}"

curl -X GET "${CF_URL}/profiles" \
  -H "Authorization: ${AUTH_TOKEN}" | jq '.'
```

## Monitoring and Observability

### View CloudWatch Logs

#### Lambda Function Logs

```bash
# Get log group name
LOG_GROUP=$(terraform output -raw lambda_log_group)

# View recent logs
aws logs tail ${LOG_GROUP} --follow
```

#### API Gateway Logs

```bash
# List log streams
aws logs describe-log-streams \
  --log-group-name "/aws/apigateway/${ENVIRONMENT_SUFFIX}-api" \
  --order-by LastEventTime \
  --descending \
  --max-items 5
```

### View X-Ray Traces

```bash
# Get traces from the last 10 minutes
END_TIME=$(date -u +"%Y-%m-%dT%H:%M:%S")
START_TIME=$(date -u -d '10 minutes ago' +"%Y-%m-%dT%H:%M:%S")

aws xray get-trace-summaries \
  --start-time ${START_TIME} \
  --end-time ${END_TIME} \
  --query 'TraceSummaries[0:5]'
```

### Check CloudWatch Dashboard

Access the CloudWatch dashboard in AWS Console:

1. Navigate to CloudWatch
2. Click on "Dashboards"
3. Select `${ENVIRONMENT_SUFFIX}-api-dashboard`
4. Review metrics for API Gateway, Lambda, DynamoDB, and Cognito

### Test CloudWatch Alarms

Trigger an alarm by making many failed requests:

```bash
for i in {1..20}; do
  curl -X GET "${API_URL}/profiles" 
done
```

Check if the alarm triggered:

```bash
aws cloudwatch describe-alarms \
  --alarm-names "${ENVIRONMENT_SUFFIX}-api-5xx-errors" \
  --query 'MetricAlarms[0].StateValue'
```

## Testing DynamoDB Global Tables

### Verify Table in Primary Region

```bash
aws dynamodb describe-table \
  --table-name ${ENVIRONMENT_SUFFIX}-user-profiles \
  --query 'Table.TableStatus'
```

### Verify Table in Secondary Region

```bash
SECONDARY_REGION=$(terraform output -raw secondary_region)

aws dynamodb describe-table \
  --table-name ${ENVIRONMENT_SUFFIX}-user-profiles \
  --region ${SECONDARY_REGION} \
  --query 'Table.TableStatus'
```

### Check Replication Status

```bash
aws dynamodb describe-table \
  --table-name ${ENVIRONMENT_SUFFIX}-user-profiles \
  --query 'Table.Replicas'
```

## Performance Testing

### Load Testing with Apache Bench

Test API performance (requires Apache Bench):

```bash
# Create a file with auth header
echo "Authorization: ${AUTH_TOKEN}" > headers.txt

# Run load test
ab -n 100 -c 10 \
  -H "$(cat headers.txt)" \
  "${API_URL}/profiles"
```

### Stress Testing

Monitor Lambda concurrency and DynamoDB throttling:

```bash
# Run concurrent requests
for i in {1..100}; do
  curl -X GET "${API_URL}/profiles" \
    -H "Authorization: ${AUTH_TOKEN}" &
done
wait

# Check Lambda metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name ConcurrentExecutions \
  --dimensions Name=FunctionName,Value=${ENVIRONMENT_SUFFIX}-api-handler \
  --start-time $(date -u -d '5 minutes ago' +"%Y-%m-%dT%H:%M:%S") \
  --end-time $(date -u +"%Y-%m-%dT%H:%M:%S") \
  --period 300 \
  --statistics Maximum
```

## Common Testing Scenarios

### Scenario 1: User Registration and Profile Management

```bash
# 1. Create user
aws cognito-idp sign-up --client-id ${CLIENT_ID} \
  --username user1@example.com --password "Pass123!"

# 2. Confirm user
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id ${USER_POOL_ID} --username user1@example.com

# 3. Authenticate
TOKEN=$(aws cognito-idp initiate-auth --auth-flow USER_PASSWORD_AUTH \
  --client-id ${CLIENT_ID} \
  --auth-parameters USERNAME=user1@example.com,PASSWORD="Pass123!" \
  --query 'AuthenticationResult.IdToken' --output text)

# 4. Create profile
curl -X POST "${API_URL}/profiles" \
  -H "Authorization: ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@example.com","name":"User One"}'
```

### Scenario 2: Error Handling

Test various error conditions:

```bash
# Invalid authentication
curl -X GET "${API_URL}/profiles" \
  -H "Authorization: invalid-token"

# Invalid profile data
curl -X POST "${API_URL}/profiles" \
  -H "Authorization: ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","name":""}'

# Non-existent profile
curl -X GET "${API_URL}/profiles/non-existent-id" \
  -H "Authorization: ${AUTH_TOKEN}"
```

## Automated Testing

Run the integration test suite:

```bash
cd ..
npm run test:integration
```

This will execute comprehensive E2E tests including:

- Cognito user management
- CRUD operations
- CloudFront access
- DynamoDB replication
- CloudWatch logging
- X-Ray tracing

## Troubleshooting

### Issue: 401 Unauthorized

- Verify token is valid: `echo ${AUTH_TOKEN}`
- Check token hasn't expired (tokens expire after 60 minutes)
- Confirm user is confirmed in Cognito

### Issue: 500 Internal Server Error

- Check Lambda logs for errors
- Verify DynamoDB table is accessible
- Check IAM permissions

### Issue: Slow Response Times

- Check CloudWatch metrics for Lambda cold starts
- Review X-Ray traces for bottlenecks
- Verify DynamoDB is not throttled

### Issue: CORS Errors in Browser

- Verify OPTIONS method is working
- Check CORS headers in API Gateway response
- Ensure Authorization header is included in CORS config

## Cleanup

After testing, clean up test users:

```bash
# Delete test user
aws cognito-idp admin-delete-user \
  --user-pool-id ${USER_POOL_ID} \
  --username testuser@example.com
```

## Best Practices

- Use unique usernames/emails for each test run
- Clean up test data after testing
- Monitor costs during load testing
- Use CloudWatch Insights for log analysis
- Enable X-Ray sampling for production testing
- Set up alerts for critical failures
