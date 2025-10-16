ROLE: You are a senior Terraform engineer specializing in AWS Machine Learning infrastructure.

CONTEXT:
An AI startup processes 1TB of image data daily for model training. The system must automate model training, support A/B testing, and provide real-time inference capabilities. Compliance with data privacy laws is critical.

REQUIREMENTS:
Build a complete, production-ready ML pipeline using Terraform that includes:

- Automated model training and retraining workflows
- A/B testing capabilities for model versions
- Real-time inference with low latency
- Data privacy and compliance controls (encryption at rest and in transit)
- Comprehensive monitoring and alerting
- Scalable architecture to handle 1TB daily data processing

CONSTRAINTS:

- All Terraform resources MUST be in a single file (tap_stack.tf)
- Use AWS best practices for security (IAM least privilege, KMS encryption, VPC isolation where applicable)
- Implement proper error handling and retry logic in Lambda functions
- Design for high availability and fault tolerance
- Include proper tagging strategy for cost tracking and compliance
- Ensure resources are properly configured for production workloads (not just POC)
- Solutions must be deployable and functional in a real-world AWS environment

AWS SERVICES TO USE:

- SageMaker: Model training, hyperparameter tuning, and hosting endpoints
- S3: Data lake for raw images, processed data, model artifacts, and logs
- Lambda: Data preprocessing, validation, and post-processing functions
- Step Functions: Orchestrate end-to-end ML workflow (data prep → training → evaluation → deployment)
- DynamoDB: Store metadata (model versions, training metrics, experiment tracking, A/B test configurations)
- Kinesis: Stream real-time inference requests
- API Gateway: RESTful endpoints for model inference and management
- EventBridge: Event-driven triggers for retraining, monitoring alerts, and workflow coordination
- CloudWatch: Metrics, logs, dashboards, and alarms for model performance and system health
- IAM: Role-based access control with least privilege principles
- KMS: Encryption keys for data privacy compliance

DELIVERABLES:

1) tap_stack.tf (all resources in a single file with logical organization using comments)
2) variables.tf (configurable parameters like region, environment, bucket names, model parameters, etc.)

ARCHITECTURE REQUIREMENTS:

- S3 buckets with versioning, encryption, and lifecycle policies for data retention
- Lambda functions for data preprocessing with appropriate memory/timeout settings
- SageMaker training jobs configured with instance types, spot instances for cost optimization
- SageMaker endpoints with auto-scaling for inference
- Step Functions state machine orchestrating: data validation → preprocessing → training → model evaluation → conditional deployment
- DynamoDB tables with proper indexes for metadata queries
- Kinesis Data Stream for real-time inference request ingestion
- API Gateway with Lambda integration or direct SageMaker endpoint integration
- EventBridge rules for scheduled retraining and event-driven workflows
- CloudWatch dashboards with key ML metrics (model accuracy, inference latency, data drift)
- CloudWatch alarms for anomaly detection and operational issues
- IAM roles with appropriate trust relationships and policies
- KMS keys for S3, DynamoDB, SageMaker, and Kinesis encryption

FUNCTIONAL REQUIREMENTS:

- Data ingestion pipeline: S3 → EventBridge → Lambda → processed data in S3
- Training pipeline: EventBridge schedule → Step Functions → SageMaker training job → model artifacts in S3 → metadata in DynamoDB
- A/B testing: Multiple SageMaker endpoints with traffic splitting, tracked in DynamoDB
- Real-time inference: API Gateway → Lambda → Kinesis → Lambda consumer → SageMaker endpoint → response
- Model versioning and rollback capabilities
- Automated model evaluation and conditional deployment based on metrics

OUTPUT FORMAT (IMPORTANT):

- Provide each file in a separate fenced code block with its filename as the first line in a comment
- Use clear section comments to organize resources in tap_stack.tf (e.g., # ========== S3 RESOURCES ==========)
- Include inline comments explaining critical configurations
- Follow HCL best practices (consistent formatting, proper use of locals, data sources where appropriate)
- Ensure all resource dependencies are properly defined using Terraform references
- Include outputs for critical resource ARNs and endpoints

```hcl
# tap_stack.tf
...
```

```hcl
# variables.tf
...
```

VALIDATION CRITERIA:

- terraform init should run without errors
- terraform validate should pass
- terraform plan should show a valid execution plan
- All resources should be properly linked (no hardcoded ARNs)
- IAM policies should follow least privilege
- All sensitive data should be encrypted
- The infrastructure should be ready for terraform apply in a real AWS account
