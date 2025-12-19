## Task: S3 Backup System with CDK TypeScript

You are tasked with implementing a comprehensive backup system for a consulting firm that handles client reports for 1,000 users daily. The system must prioritize data durability, cost efficiency, and operational simplicity while meeting strict retention and security requirements.

### Requirements

**Core Infrastructure:**
- S3 bucket optimized for backup storage with appropriate storage classes
- KMS encryption with customer-managed keys for enhanced security
- IAM roles and policies following least-privilege principles
- CloudWatch metrics and alarms for monitoring backup operations
- EventBridge rules for automated daily backup scheduling
- Lambda function for backup orchestration and metadata management

**Data Management:**
- Implement 60-day retention policy with automatic cleanup
- Support for versioning to enable point-in-time recovery
- Intelligent tiering to optimize storage costs over time
- Cross-region replication for disaster recovery scenarios
- Backup integrity verification and corruption detection

**Security & Compliance:**
- Encryption at rest and in transit for all backup data
- Access logging and audit trails for compliance requirements
- Network isolation using VPC endpoints where applicable
- Resource tagging strategy for cost allocation and governance
- Backup access controls that prevent accidental deletion

**Operational Excellence:**
- Automated backup scheduling with configurable frequency
- Monitoring and alerting for backup failures and anomalies
- Cost optimization through lifecycle transitions and compression
- Backup restoration procedures with documented recovery time objectives
- Integration with existing monitoring and notification systems

**Advanced Challenges:**
- Handle concurrent backup operations without conflicts
- Implement backup deduplication to reduce storage costs
- Support for incremental backups to minimize data transfer
- Backup encryption key rotation without service interruption
- Multi-account backup strategy for organizational separation
- Performance optimization for large file uploads and downloads
- Backup validation and automated testing of restore procedures

### Constraints

- Must use CDK TypeScript exclusively
- Total monthly cost should not exceed $500 for 1TB of backup data
- Backup operations must complete within 4-hour maintenance windows
- System must achieve 99.9% availability for backup operations
- Recovery time objective (RTO) of 2 hours for critical data restoration
- All resources must be deployed in us-east-1 region initially
- Solution must be easily replicable across multiple AWS accounts

### Deliverables

Implement a production-ready CDK application that includes comprehensive unit tests, integration tests, proper error handling, detailed documentation, and deployment automation. The solution should demonstrate advanced CDK patterns, AWS best practices, and enterprise-grade reliability.