Hey team,

We need to build a production-ready API backend for our mobile app using Terraform. The app has about 1 million daily active users, so we need to make sure everything is secure, scalable, and properly monitored from day one.

The team has decided to go with a serverless architecture using API Gateway, Lambda, and Cognito for auth. We also need global scalability with DynamoDB Global Tables and CloudFront in front of everything for better performance worldwide.

## What we're building

A complete serverless API infrastructure with user authentication, global distribution, and comprehensive monitoring.

### Core Requirements

1. **User Authentication**
   - Cognito User Pools for managing user sign-up and login
   - Secure JWT token-based authentication
   - No custom auth implementations - keep it standard

2. **API Backend**
   - API Gateway REST API (not HTTP API) as the main endpoint
   - Lambda functions written in Python with actual working CRUD operations
   - User profile management (create, read, update, delete)
   - Proper request/response validation

3. **Data Storage**
   - DynamoDB table configured as Global Tables for multi-region replication
   - Support for user profiles with session data
   - Automatic backups and point-in-time recovery

4. **Global Distribution**
   - CloudFront distribution in front of API Gateway
   - Route 53 for custom domain management with health checks
   - Low latency access for users worldwide

5. **Security**
   - All Lambda functions use least-privilege IAM roles
   - No wildcards in IAM policies
   - Encryption at rest and in transit
   - API requests must be authenticated via Cognito

6. **Monitoring & Observability**
   - CloudWatch dashboards showing key metrics
   - Alarms for API errors, Lambda failures, and high latency
   - X-Ray tracing enabled across the entire request path
   - Logs for all Lambda invocations

### Technical Stack

- **Infrastructure**: Terraform (HCL)
- **API Layer**: API Gateway REST API + Lambda (Python 3.11)
- **Auth**: Amazon Cognito User Pools
- **Database**: DynamoDB with Global Tables
- **CDN**: CloudFront
- **DNS**: Route 53
- **Monitoring**: CloudWatch + X-Ray
- **Security**: IAM roles and policies

### Constraints

- Must follow AWS best practices for production workloads
- All configuration should be parameterized via Terraform variables
- Include comprehensive outputs for CI/CD integration
- Write actual working Python code - this needs to be testable
- Proper error handling and logging throughout
- Include both unit tests and end-to-end integration tests

## Success Criteria

- **Functionality**: Complete CRUD API with Cognito authentication working end-to-end
- **Security**: Proper IAM roles, no hardcoded credentials, authenticated endpoints only
- **Scalability**: DynamoDB Global Tables configured, CloudFront caching enabled
- **Observability**: CloudWatch dashboards, alarms, and X-Ray tracing operational
- **Code Quality**: Clean Terraform modules, working Python Lambda code, comprehensive tests
- **Documentation**: Clear deployment guide and testing instructions

## What to deliver

- Complete Terraform infrastructure code (modular structure preferred)
- Working Python Lambda functions with CRUD operations
- Comprehensive test suite (unit + integration tests)
- Deployment guide with step-by-step instructions
- All necessary configuration files and documentation

Make sure everything actually works when deployed - we need this to be production-ready, not just a proof of concept.
