# AWS Infrastructure Migration from us-east-1 to us-west-2

I need to migrate critical AWS infrastructure from us-east-1 to us-west-2 for regulatory compliance and performance optimization. The migration must maintain data integrity and ensure zero downtime during the transition.

## Requirements

The migration should include the following AWS resources:

### 1. EC2 Instance
- Create a new EC2 instance in us-west-2 
- Use a current generation instance type (C8 or R7 family if available, otherwise C6i or M6i)
- Configure proper security groups allowing HTTP (port 80) and SSH (port 22) access
- Use Amazon Linux 2023 AMI
- Instance should be in a public subnet for accessibility
- Enable detailed monitoring

### 2. S3 Bucket
- Create a new S3 bucket in us-west-2 region
- Configure versioning to preserve data history
- Enable server-side encryption (SSE-S3)
- Set up lifecycle policies for cost optimization
- Ensure the bucket name follows naming conventions and is globally unique

### 3. DynamoDB Table
- Create a new DynamoDB table in us-west-2
- Configure with multi-region strong consistency for enhanced availability
- Use on-demand billing mode for flexible scaling
- Set up proper partition and sort keys for optimal performance
- Enable point-in-time recovery for data protection

## Migration Considerations

### Data Integrity
- All existing data must be preserved during migration
- Implement proper backup strategies before migration begins
- Ensure data consistency across regions during transition

### Security Requirements  
- EC2 security groups must restrict SSH access to specific IP ranges (not 0.0.0.0/0)
- HTTP access should be allowed from anywhere for web traffic
- All resources should use proper IAM roles and policies
- Enable CloudTrail logging for audit purposes

### Performance & Connectivity
- Resources must be properly configured for inter-service communication
- Network configuration should optimize for low latency
- Use VPC endpoints where appropriate to reduce costs and improve performance

### Best Practices
- Follow AWS Well-Architected Framework principles
- Implement proper tagging strategy for resource management
- Use AWS native features for high availability and disaster recovery
- Consider cost optimization through rightsizing and reserved capacity

## Deliverables

Please provide Pulumi JavaScript infrastructure code that creates:
- Complete infrastructure setup in us-west-2 region
- All necessary networking components (VPC, subnets, security groups)
- Properly configured EC2, S3, and DynamoDB resources
- IAM roles and policies as needed
- Resource tagging for proper governance

The code should be production-ready and follow infrastructure as code best practices. Each resource should be properly documented and configured for the target environment.