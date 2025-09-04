I'll help you create a well-structured prompt that aligns with Claude Sonnet's best practices for building AWS infrastructure with Pulumi and Python. Here's a comprehensive prompt template:

## Complete Multi-Region Serverless CI/CD Pipeline with Pulumi

**Context:** You are an expert DevOps engineer tasked with designing and implementing a production-ready, multi-region serverless application infrastructure on AWS using Pulumi (Python).

### Infrastructure Requirements

**Core Architecture:**
- Multi-region deployment across `us-east-1` and `us-west-2`
- Serverless backend using AWS Lambda functions and API Gateway
- S3 buckets for storage and deployment artifacts
- VPC configuration spanning both regions
- Infrastructure naming convention: `project-component-environment`

**Project Structure:**
```
project-root/
├── lib/
│ └── tap_stack.py
├── tests/
│ ├── unit/
│ │ └── test_tap_stack.py
│ └── integration/
│ └── test_tap_stack.py
```

### Deliverable Requirements

**1. Infrastructure Code (`lib/tap_stack.py`):**
- Define reusable Pulumi components for Lambda functions, API Gateway, and S3
- Implement cross-region resource deployment with proper dependency management
- Include VPC setup with appropriate subnets and security groups
- Ensure consistent resource tagging and naming conventions
- Add environment-specific configurations (dev, staging, prod)

**2. CI/CD Pipeline Configuration:**
- Support for rolling updates with zero-downtime deployment strategy
- Multi-stage pipeline: build test deploy-staging deploy-production
- Cross-region deployment orchestration
- Rollback mechanisms for failed deployments
- Integration with Pulumi state management

**3. Monitoring and Alerting Integration:**
- AWS CloudWatch metrics and alarms for Lambda performance
- API Gateway monitoring with custom metrics
- Cross-region health checks and failover alerts
- Deployment success/failure notifications
- Cost monitoring and budget alerts

**4. Testing Framework:**
- Unit tests (`tests/unit/test_tap_stack.py`) for infrastructure components
- Integration tests (`tests/integration/test_tap_stack.py`) for cross-region functionality
- Validation of rolling update mechanisms
- Monitoring system integration tests

### Technical Specifications

**Rolling Update Strategy:**
- Implement blue-green or canary deployment patterns
- Use AWS Lambda aliases and weighted routing
- API Gateway stage-based deployments
- Automated rollback on failure detection

**Resource Connectivity:**
- Lambda functions connected to API Gateway with proper IAM roles
- Cross-region S3 bucket replication
- VPC endpoints for secure service communication
- Route 53 health checks for multi-region failover

**Security Requirements:**
- Least privilege IAM policies
- Encryption at rest and in transit
- VPC security groups and NACLs
- Secrets management using AWS Secrets Manager

### Expected Output Format

Provide complete, production-ready code including:

1. **Main Infrastructure Code**: Fully implemented `lib/tap_stack.py` with modular design
2. **CI/CD Pipeline**: Complete workflow configuration (GitHub Actions, GitLab CI, or Jenkins)
3. **Test Suite**: Comprehensive unit and integration tests
4. **Documentation**: Deployment instructions, monitoring setup, and troubleshooting guide
5. **Configuration Files**: Pulumi project files, requirements, and environment configs

### Success Criteria

Your solution must demonstrate:
- Successful deployment to both regions simultaneously
- Zero-downtime rolling updates with automatic rollback
- Functional monitoring and alerting system
- Passing unit and integration test suites
- Proper error handling and logging throughout the pipeline
- Cost optimization and resource efficiency

**Constraints:**
- Use only AWS native services (no third-party tools except Pulumi)
- Follow AWS Well-Architected Framework principles
- Ensure all code is production-ready with proper error handling
- Include comprehensive logging and observability

**Project Name:** IaC - AWS Nova Model Breaking

Please provide the complete implementation with detailed explanations for each component and how they interconnect to form a cohesive, scalable infrastructure solution.

***

This prompt template follows Claude's best practices by:
- **Clear Structure**: Organized sections with specific requirements
- **Concrete Examples**: File structure and naming conventions
- **Specific Constraints**: Technical limitations and success criteria 
- **Action-Oriented**: Clear deliverables and expected outcomes
- **Context-Rich**: Complete background information for informed decisions
- **Measurable Results**: Testable success criteria and validation requirements

You can customize this template by adjusting the specific AWS services, regions, or testing requirements based on your project needs.