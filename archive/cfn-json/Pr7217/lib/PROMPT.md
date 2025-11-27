Hello! I need you to act as an expert AWS Cloud Engineer. Your task is to generate a complete CloudFormation StackSet template in JSON format to orchestrate a cross-region migration from us-east-1 to eu-central-1 for a trading analytics platform.

### **Background**

A financial services company needs to migrate their trading analytics platform from us-east-1 to eu-central-1 due to new regulatory requirements. The existing infrastructure includes data processing pipelines, real-time dashboards, and historical data storage that must maintain operational continuity during the migration.

### **Environment**

Multi-region AWS deployment spanning us-east-1 (source) and eu-central-1 (target) for financial trading platform migration. Infrastructure includes buckets with 500TB of historical data, DynamoDB tables processing 10K TPS, Lambda functions for real-time analytics, and Data Streams for market data ingestion. Requires CloudFormation StackSets enabled, cross-region IAM roles configured, and AWS CLI v2 installed. VPCs in both regions with VPC peering for secure data transfer during migration phase.

### **Core Requirements (MANDATORY)**

Please provide a complete CloudFormation StackSet template that implements the following:

1. **CloudFormation StackSets Configuration (CORE)**
   - Define a StackSet template that deploys infrastructure in both regions simultaneously (us-east-1 and eu-central-1)
   - Ensure proper stack set deployment permissions and execution roles

2. **S3 Cross-Region Replication (CORE)**
   - Configure S3 buckets with cross-region replication rules and lifecycle policies
   - Implement versioning enabled on all buckets
   - Set up secure data transfer mechanisms for 500TB of historical data

3. **DynamoDB Global Tables**
   - Set up DynamoDB global tables with auto-scaling for both regions
   - Ensure seamless data migration capabilities
   - Configure for 10K TPS processing requirements

4. **Lambda Functions**
   - Create Lambda functions that can operate in either region with environment-specific configurations
   - Support real-time analytics workloads
   - Implement proper cross-region deployment mechanisms

5. **Systems Manager Parameter Store**
   - Implement Parameter Store for storing region-agnostic application settings
   - Centralize configuration management

6. **Custom CloudFormation Resources**
   - Define custom CloudFormation resources to track migration progress and validate data consistency
   - Implement state tracking mechanisms

7. **CloudWatch Dashboards**
   - Configure CloudWatch dashboards in both regions to monitor migration metrics
   - Implement comprehensive monitoring

8. **SNS Topics**
   - Set up SNS topics for migration event notifications with cross-region subscriptions
   - Enable multi-region notification delivery

9. **IAM Roles**
   - Create IAM roles with cross-region trust relationships for migration operations
   - Implement least-privilege access patterns

10. **CloudFormation Conditions**
    - Implement CloudFormation conditions to handle region-specific resource variations
    - Support different configurations per region

### **Optional Enhancements (If time permits)**

- Add Route 53 health checks with failover routing (OPTIONAL: Route 53) - enables automatic traffic switching
- Implement EventBridge rules for migration workflow orchestration (OPTIONAL: EventBridge) - improves automation
- Configure AWS Backup for cross-region backup verification (OPTIONAL: AWS Backup) - adds data protection

### **Technical Constraints**

- Use CloudFormation StackSets for multi-region deployment
- Implement cross-region replication for S3 buckets with versioning enabled
- Configure DynamoDB global tables for seamless data migration
- Use Parameter Store for region-agnostic configuration
- Implement CloudFormation custom resources for migration state tracking
- Ensure zero data loss during the migration window
- Maintain read access to historical data during migration
- Use CloudFormation outputs to expose region-specific endpoints

### **Expected Output**

A CloudFormation StackSet template in JSON format that can be deployed to orchestrate the complete migration process, including infrastructure replication, data synchronization, and cutover capabilities with rollback support. The template should be production-ready, well-structured, and include clear documentation of all resources and their purposes.
