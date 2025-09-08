Build a robust serverless web application infrastructure on AWS using Pulumi Python that can handle real-world production workloads. The system should be designed to process thousands of requests efficiently while maintaining security, observability, and cost-effectiveness.

Create a complete serverless architecture that includes:

**Core Infrastructure Components:**
- AWS Lambda functions with Python runtime that can handle business logic and data processing
- API Gateway configured to route RESTful HTTP requests to the appropriate Lambda functions
- DynamoDB tables for persistent data storage with proper indexing for fast queries
- IAM roles and policies that follow the principle of least privilege for secure Lambda execution

**Security & Data Protection:**
- Encrypt all environment variables used by Lambda functions using AWS Systems Manager Parameter Store or AWS Secrets Manager
- Implement AWS KMS encryption for DynamoDB tables to protect sensitive data at rest
- Ensure all API endpoints are properly secured and only accessible to authorized users

**Monitoring & Observability:**
- CloudWatch alarms that trigger when Lambda functions encounter errors or exceed performance thresholds
- Comprehensive logging setup to track function execution, errors, and performance metrics
- Dashboards to visualize system health and usage patterns

**Operational Excellence:**
- Resource tagging strategy for cost allocation, environment identification, and resource management
- Zero-downtime deployment capabilities for Lambda function updates
- Auto-scaling configuration to handle traffic spikes up to 10,000 requests per hour
- Proper error handling and retry mechanisms for resilient operation

**Expected Deliverables:**
- A single, well-structured Pulumi Python file named `tap_stack.py` that defines all infrastructure components
- The solution must be contained entirely within this single file, including all AWS resource definitions, Lambda function code, and configuration
- Working demonstration showing successful deployment and basic functionality testing

The solution should be production-ready, following AWS best practices for security, performance, and cost optimization. Focus on creating maintainable, scalable code that can be easily extended for future requirements. All infrastructure components must be implemented within the single `tap_stack.py` file.
