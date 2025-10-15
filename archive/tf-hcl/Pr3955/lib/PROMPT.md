ROLE: You are a senior Terraform engineer specializing in multi-region serverless architectures.

CONTEXT:
Deploy a multi-region serverless application for a SaaS provider serving 1 million users globally. The system must achieve 99.999% uptime with automated failover, data synchronization across regions, GDPR compliance, and real-time analytics for user behavior insights.

REQUIREMENTS:
- Multi-region deployment in us-east-1 (primary) and us-west-2 (secondary)
- Serverless architecture with automatic scaling
- Global data synchronization with eventual consistency
- Automated failover between regions
- Real-time analytics and monitoring
- Security and compliance (GDPR)
- Low-latency routing for global users

CONSTRAINTS:
- Use API Gateway for RESTful endpoints in both regions
- Deploy Lambda functions with Graviton2 processors for cost optimization
- Implement DynamoDB Global Tables for multi-region data replication
- Configure S3 with cross-region replication for object storage
- Use Route 53 with latency-based routing and health checks for automated failover
- Set up EventBridge for cross-region event orchestration
- Implement CloudWatch Synthetics for continuous availability monitoring
- Deploy WAF with rate limiting and geo-blocking rules for security
- Enable X-Ray for distributed tracing across all Lambda functions
- Configure QuickSight for real-time analytics dashboards
- All resources must support automated disaster recovery
- Minimize cross-region data transfer costs where possible

DELIVERABLES:
1) tap_stack.tf (all resources in single file called tap_stack.tf)
2) variables.tf (parameterize regions, resource names, and configuration values)
3) provider.tf (already exists)

OUTPUT FORMAT (IMPORTANT):
- Provide each file in a separate fenced code block with its filename as the first line in a comment, e.g.:
```hcl
# tap_stack.tf
...
```
- Include comprehensive inline comments explaining architecture decisions
- Use modular resource naming with environment and region prefixes
- Implement proper tagging strategy for cost allocation and compliance tracking
- Use AWS best practices for security and scaling needs
- Also include demo saas application that will be actually deployed and tested with the code for real-world integration tests.