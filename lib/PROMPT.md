# **Real Estate Platform Infrastructure as Code Generation**

## **System Context & Instructions**

You’re building a scalable, secure real estate platform. It needs to handle 50,000 listings (including 3D tours), support 30,000 monthly visitors at peak, and offer features like mortgage calculators, appointment booking, and map-based searches.

## **Project Requirements**

### **Business Context**

Generate a complete CloudFormation template for a **Real Estate Platform** with the following specifications:

- **Scale**: 50,000 property listings with 3D virtual tours
- **Traffic**: 30,000 monthly visitors with peak handling capability
- **Features**: Mortgage calculators, appointment scheduling, geospatial search
- **Region**: us-east-2 (primary deployment region)

### **Architecture Requirements**

#### **Core Infrastructure**

- **VPC**: 10.45.0.0/16 CIDR with public/private subnets across 2 AZs
- **Load Balancing**: Application Load Balancer with SSL termination and WAF integration
- **Compute**: ECS Fargate cluster for containerized web application with auto-scaling
- **CDN**: CloudFront distribution with signed URLs for premium 3D tour content

#### **Data Layer**

- **Primary Database**: Aurora MySQL cluster with automated backups and encryption
- **Read Replicas**: Aurora read replicas in separate AZ for search query optimization
- **NoSQL**: DynamoDB tables for user favorites and search history with GSI
- **Caching**: ElastiCache Redis cluster for search result caching and session management
- **Search Engine**: Amazon OpenSearch Service with geospatial query capabilities for property location searches

#### **Storage & Content**

- **Object Storage**: S3 buckets for property images and 3D tour files with lifecycle policies
- **Content Security**: S3 bucket policies with CloudFront OAI and signed URL generation
- **Media Processing**: Lambda triggers for image optimization and metadata extraction

#### **Serverless Functions**

- **Mortgage Calculator**: Lambda functions (Node.js 18.x runtime) with API Gateway integration
- **Image Analysis**: Amazon Rekognition integration for automatic room detection and property tagging
- **Data Processing**: Lambda functions for search indexing and user analytics

#### **API & Mobile Support**

- **API Gateway**: RESTful APIs with request validation, throttling, and CORS configuration
- **Authentication**: Amazon Cognito with separate User Pools for real estate agents and property buyers
- **Authorization**: Cognito Identity Pools with fine-grained IAM roles

#### **Communication Services**

- **Email**: Amazon SES for inquiry notifications and marketing campaigns
- **Scheduling**: EventBridge rules for appointment reminders and automated workflows
- **Notifications**: SNS topics for real-time alerts and mobile push notifications

#### **Monitoring & Analytics**

- **Metrics**: CloudWatch custom metrics for property view tracking and user engagement
- **Logging**: Centralized logging for all services with log retention policies
- **Alarms**: CloudWatch alarms for performance monitoring and cost optimization
- **Dashboard**: CloudWatch dashboard for operational visibility

#### **Security Requirements**

- **Encryption**: Data encryption at rest and in transit for all services
- **Access Control**: IAM roles with least privilege principle
- **Network Security**: Security groups with minimal required access
- **Secrets Management**: AWS Secrets Manager for database credentials and API keys
- **Compliance**: Enable AWS Config for compliance monitoring

### **Implementation Specifications**

#### **Performance Requirements**

- **Search Response**: Sub-100ms cached search queries via ElastiCache
- **Geospatial Queries**: OpenSearch with geo-point mapping for location-based property search
- **Image Delivery**: CloudFront global edge locations for fast 3D tour loading
- **Database Performance**: Aurora read replicas for read-heavy property listing queries

#### **Scalability Patterns**

- **Auto-scaling**: ECS Fargate with target tracking scaling policies
- **Database Scaling**: Aurora Serverless v2 for automatic compute scaling
- **Cache Strategy**: ElastiCache cluster mode for distributed caching
- **CDN Optimization**: CloudFront behaviors optimized for different content types

#### **Integration Requirements**

- **Rekognition Workflow**: Automated property image analysis pipeline
- **Mortgage Calculations**: Lambda-based complex financial calculations with DynamoDB caching
- **Search Indexing**: Real-time property updates to OpenSearch via Lambda triggers
- **Event-Driven Architecture**: EventBridge integration for appointment scheduling and notifications

## **Output Requirements**

### **Template Structure**

1. **Parameters**: Environment-specific variables with validation
2. **Mappings**: Region-specific AMI IDs and configuration values
3. **Conditions**: Environment-based conditional resource creation
4. **Resources**: All AWS resources with proper dependencies and tags
5. **Outputs**: Critical resource references and endpoint URLs

### **Quality Standards**

- **Security**: Follow AWS security best practices with encryption and access controls
- **Reliability**: Multi-AZ deployment with automated failover capabilities
- **Performance**: Optimized resource sizing and caching strategies
- **Cost Optimization**: Appropriate instance types and storage classes
- **Operational Excellence**: Comprehensive monitoring and logging setup

### **Documentation Requirements**

Include inline comments explaining:

- Resource purpose and configuration rationale
- Dependencies between services
- Scaling and performance considerations
- Security implementation details

Generate the complete CloudFormation template with all specified components, ensuring enterprise-grade security, scalability, and operational excellence for a production real estate platform deployment.
