# Emergency Alert Processing System for Federal Agency

I need to create infrastructure using **Pulumi with Python** for a federal emergency management agency's critical alert processing system. The system must handle natural disasters and public safety incidents while maintaining FedRAMP High compliance.

## Requirements

The system needs to process thousands of events per second from various government sources in the ap-southeast-1 region. Here are the specific requirements:

### Infrastructure Components

1. **VPC and Networking**: Set up a VPC with public and private subnets across multiple availability zones for network isolation and security boundaries.

2. **Kinesis Data Stream**: Configure a stream for real-time event ingestion that can handle thousands of events per second. The stream should have appropriate shard count and encryption enabled.

3. **ECS Fargate**: Deploy processing containers with automatic scaling to handle variable workloads. The cluster should span multiple AZs for high availability.

4. **RDS PostgreSQL**: Set up a database with Multi-AZ deployment and encryption at rest for storing alert data and system state.

5. **ElastiCache Redis**: Configure a Redis cluster for event correlation and caching, with cluster mode and Multi-AZ enabled.

6. **EFS**: Create shared storage for processing rules and configuration files, with encryption enabled.

7. **API Gateway**: Set up secure external access for alert submission with proper authentication.

8. **Secrets Manager**: Store database credentials, Redis auth tokens, and other sensitive configuration securely.

9. **KMS**: Create encryption keys that are FIPS 140-2 validated for encrypting data at rest.

10. **IAM**: Configure roles and policies following least privilege principles for all services.

11. **CloudWatch**: Set up logging and monitoring for all components with log encryption.

12. **SNS**: Create notification topics for system alerts and alarms.

13. **Application Auto Scaling**: Configure dynamic scaling policies based on CPU and other metrics for the ECS services.

### Compliance Requirements

- All data must be encrypted at rest using FIPS 140-2 validated encryption (KMS)
- All data must be encrypted in transit using TLS 1.2 or higher
- Multi-AZ architecture is required for high availability
- All resources must remain within the ap-southeast-1 region for data sovereignty
- Enable comprehensive audit logging to CloudWatch for all services
- Use network isolation with VPC, including private subnets for sensitive resources

### Performance and Scaling

- The Kinesis stream should be configured to handle high throughput
- ECS tasks should auto-scale based on load (minimum 2 tasks, maximum 10)
- Database and cache should be sized appropriately for the workload
- All stateful resources should have automated backups enabled

### Naming Convention

All resource names should include an environment suffix (environmentSuffix) to support multiple deployments. For example: emergency-alert-vpc-{environmentSuffix}, emergency-alert-stream-{environmentSuffix}, etc.

### Additional Notes

- The ECS task definition should mount the EFS volume for shared access to processing rules
- Security groups should be configured to allow only necessary traffic between components
- CloudWatch alarms should be created for critical metrics like CPU utilization and Kinesis iterator age
- The API Gateway should use IAM authentication
- Database and Redis passwords should be managed through Secrets Manager

Please implement this complete infrastructure using Pulumi with Python, ensuring all components are properly integrated and follow AWS best practices for security and high availability.
