<role>
You are an expert AWS CDK developer specializing in serverless machine learning infrastructure. You have deep expertise in TypeScript, AWS service integration, ML operations, and production-grade infrastructure design. Your focus is on building secure, scalable, and cost-optimized architectures that follow AWS Well-Architected Framework principles.
</role>

<task_context>
Build a production-ready machine learning inference pipeline for a platform that processes 100,000 daily predictions. The system requires batch processing capabilities, comprehensive model versioning with rollback support, and A/B testing functionality for model comparison. The infrastructure must support both real-time and batch inference patterns while maintaining high availability, security, and cost efficiency.
</task_context>

<project_specifications>
- AWS Region: us-east-1
- Programming Language: TypeScript
- Infrastructure as Code: AWS CDK
- Environment: Production (prod)
- Lambda Runtime: Python 3.11
- Daily Processing Volume: 100,000 predictions
- Deployment Pattern: Serverless architecture with managed services
- Testing Requirements: Both unit and integration test coverage required
</project_specifications>

<infrastructure_requirements>
### Storage & Data Management
- S3 buckets for model artifacts and input data with versioning enabled
- DynamoDB table for prediction results with TTL attribute configured for automatic data expiration
- Systems Manager Parameter Store for model version tracking and metadata storage
- Glue Data Catalog for automated data cataloging and schema management

### Machine Learning & Compute
- SageMaker multi-variant endpoints with auto-scaling based on InvocationsPerInstance metric
- Lambda functions (Python 3.11) for data preprocessing with appropriate memory and timeout configurations
- AWS Batch for large-scale batch processing with compute environments and job definitions
- Step Functions state machine for complex workflow orchestration with error handling and retry logic

### API & Streaming
- API Gateway REST API with caching enabled (configure TTL and cache key strategy)
- Kinesis Data Streams for real-time inference data ingestion with appropriate shard count

### Orchestration & Analytics
- EventBridge scheduled rules for triggering batch jobs at defined intervals
- Athena workgroup for running analytics queries on prediction results
- Step Functions for batch workflow management with parallel execution support

### Monitoring & Notifications
- CloudWatch dashboards for model performance metrics and operational visibility
- CloudWatch alarms for data drift detection, latency thresholds, and error rates
- SNS topics for alert notifications on model degradation and system errors
- CloudWatch Logs for centralized logging across all services

### Security & Networking
- IAM roles and policies following least privilege access principles
- VPC endpoints for S3 and DynamoDB to ensure private connectivity without internet gateway
- Security groups and NACLs for network-level access control
- KMS keys for encryption at rest where applicable
</infrastructure_requirements>

<tenant_isolation_requirements>
Not applicable for this single-tenant ML inference pipeline. Focus on service isolation and least privilege access patterns instead.
</tenant_isolation_requirements>

<resource_connection_focus>
**Critical Integration Points - Ensure proper connectivity and data flow:**

1. **API Gateway → Lambda → SageMaker**: REST API triggers preprocessing Lambda, which invokes SageMaker endpoint for inference
2. **Kinesis → Lambda → SageMaker**: Stream processing for real-time predictions
3. **S3 → EventBridge → Step Functions**: Batch workflow triggered by scheduled rules, orchestrating S3 data processing
4. **Step Functions → Batch → Lambda → SageMaker**: Complex workflow coordination for large-scale inference jobs
5. **SageMaker → DynamoDB**: Store prediction results with TTL attributes
6. **Parameter Store → Lambda/SageMaker**: Model version retrieval and configuration management
7. **CloudWatch → SNS**: Metric alarms trigger notification workflows
8. **Glue → Athena → S3**: Data catalog enables SQL queries on prediction results
9. **VPC Endpoints → S3/DynamoDB**: Private network access without NAT gateway
10. **IAM Roles**: Each service must have cross-service permissions with proper trust relationships

**A/B Testing Architecture**: Configure SageMaker endpoint with multiple production variants (ModelA, ModelB) using weighted traffic distribution. Implement CloudWatch metrics per variant for comparison.

**Model Versioning Flow**: Parameter Store stores active model version → Lambda retrieves version → Downloads model from S3 versioned bucket → Deploys to SageMaker → Rollback by updating parameter value

**Batch Processing Pipeline**: EventBridge triggers Step Functions → Parallel state invokes multiple Batch jobs → Jobs read from S3, preprocess with Lambda → Invoke SageMaker → Store results in DynamoDB → Glue catalogs output data
</resource_connection_focus>

<file_constraints>
**STRICT REQUIREMENT**: Generate code for ONLY these three files. Do not create additional files or suggest infrastructure outside these constraints.

1. **lib/tap-stack.ts**
   - Main CDK stack implementation
   - All AWS construct definitions and configurations
   - Resource dependencies and relationships
   - Stack outputs for cross-references

2. **tests/tap-stack.unit.test.ts**
   - Unit tests using AWS CDK assertions
   - Test resource creation and properties
   - Validate IAM policies and permissions
   - Mock external dependencies

3. **tests/tap-stack.int.test.ts**
   - Integration tests validating cross-service connectivity
   - End-to-end workflow testing
   - API Gateway through SageMaker flow validation
   - VPC endpoint accessibility verification
</file_constraints>

<implementation_instructions>
### A/B Testing Implementation
Create SageMaker endpoint with ProductionVariants array containing two variants with traffic distribution (e.g., 80/20 split). Implement CloudWatch metrics and alarms for per-variant monitoring (latency, invocations, errors).

### Auto-Scaling Configuration
Configure Application Auto Scaling for SageMaker endpoint targeting `SageMakerVariantInvocationsPerInstance` metric. Set target value (e.g., 1000), minimum capacity (1), maximum capacity (10), scale-in cooldown (300s), scale-out cooldown (60s).

### DynamoDB TTL Setup
Create DynamoDB table with `expirationTime` attribute. Enable TTL on this attribute. Lambda should calculate and set expiration timestamp when writing predictions (e.g., current_time + 30 days).

### Model Versioning System
Use Parameter Store hierarchy: `/ml-pipeline/models/active-version`, `/ml-pipeline/models/versions/{version-id}/metadata`. Store S3 model artifact paths, deployment timestamps, performance baselines. Implement rollback by updating active-version parameter.

### Step Functions Workflow Design
Create state machine with:
- Parallel state for concurrent batch processing
- Map state for iterating over input batches
- Choice states for conditional routing based on batch size
- Catch blocks for error handling with retry policies
- Integration patterns with Batch and Lambda

### Caching Strategy
Enable API Gateway caching with 300-second TTL. Configure cache key parameters based on inference input features. Set cache cluster size based on expected cache hit ratio and data volume.

### VPC Endpoint Configuration
Create VPC with private subnets. Deploy interface endpoints for SageMaker Runtime and gateway endpoints for S3 and DynamoDB. Configure security groups allowing HTTPS traffic from Lambda and Batch compute environments.

### CloudWatch Monitoring
Create custom metrics for:
- Model prediction latency (p50, p99)
- Inference throughput
- Data drift scores
- Model accuracy (if ground truth available)
Set composite alarms combining multiple metrics for alert fatigue reduction.

### Resource Naming Convention
Use pattern: `ml-pipeline-{resourceType}-{environment}-{region}`
Example: `ml-pipeline-sagemaker-endpoint-prod-us-east-1`
</implementation_instructions>

<code_quality_requirements>
- Enable TypeScript strict mode with explicit typing for all variables and functions
- Use AWS CDK L2 constructs where available; fallback to L1 only when necessary
- Implement comprehensive error handling with custom error types
- Add JSDoc comments for all public methods and complex logic
- Use CDK Aspects for cross-cutting concerns (tagging, encryption, removal policies)
- Organize code with clear separation: networking, storage, compute, monitoring sections
- Apply removal policies appropriate for production (RETAIN for data, DESTROY for compute)
- Use CDK context values for environment-specific configurations
- Implement custom CDK constructs for reusable patterns
- Follow SOLID principles and maintain single responsibility per construct
- Include inline comments explaining non-obvious AWS service configurations
- Use environment variables and parameter references instead of hardcoded values
- Implement proper dependency declarations using `node.addDependency()`
- Configure resource tags for cost allocation and resource management
- Use CDK grants methods for IAM permission management instead of manual policy creation
</code_quality_requirements>

<success_criteria>
Your implementation will be considered successful when:

1. **Functional Completeness**: All required AWS services are implemented and properly configured
2. **Resource Connectivity**: All integration points function correctly with proper IAM permissions
3. **A/B Testing**: SageMaker multi-variant endpoint successfully routes traffic with weighted distribution
4. **Auto-Scaling**: SageMaker endpoint scales based on invocation metrics within defined boundaries
5. **Model Versioning**: Parameter Store-based versioning system supports deployment and rollback
6. **Data Lifecycle**: DynamoDB TTL automatically expires old prediction records
7. **Security**: VPC endpoints enable private connectivity; IAM follows least privilege
8. **Monitoring**: CloudWatch dashboards, metrics, and alarms provide operational visibility
9. **Testing**: Unit tests achieve >80% coverage; integration tests validate end-to-end flows
10. **Code Quality**: TypeScript compiles without errors or warnings; passes linting rules
11. **Documentation**: Code includes clear comments explaining architectural decisions
12. **Deployment**: Stack can be deployed successfully using `cdk deploy` without manual intervention
</success_criteria>

<output_format>
Provide three complete, production-ready code files in the following sequence:

**File 1: lib/tap-stack.ts**
// Complete stack implementation
// Include all imports, class definition, constructor, and resource definitions


**File 2: tests/tap-stack.unit.test.ts**
// Comprehensive unit tests
// Include test setup, multiple test cases, and assertions


**File 3: tests/tap-stack.int.test.ts**
// Integration test suite
// Include test setup, integration scenarios, and cleanup

For each file:
- Start with necessary imports
- Include clear section comments dividing logical resource groups
- Add inline comments for complex configurations
- Ensure proper TypeScript typing throughout
- Format code with consistent indentation and spacing
</output_format>

<thinking_guidance>
Before writing code, consider:

1. **Service Integration Order**: Which services depend on others? (e.g., Lambda needs IAM role before function creation)
2. **IAM Permission Scope**: What's the minimum permission set each service needs to interact with others?
3. **Network Topology**: Which resources need VPC access vs public access?
4. **Data Flow**: Trace the path from API request through to prediction result storage
5. **Error Handling**: Where can failures occur? How should the system recover?
6. **Cost Optimization**: Are there opportunities to reduce costs (auto-scaling, caching, lifecycle policies)?
7. **Security Posture**: Are all data paths encrypted? Is network traffic private?
8. **Monitoring Gaps**: What metrics are critical for identifying issues before they impact users?
9. **Testing Strategy**: What are the highest-risk integration points that need integration test coverage?
10. **Rollback Procedure**: If a model deployment fails, how quickly can the system revert?

Structure your response to show clear architectural decisions and their rationale in comments.
</thinking_guidance>