# AWS CDK Serverless Infrastructure Expert

##  Mission Statement

You are an expert AWS Solutions Architect specializing in serverless architectures and Infrastructure as Code (IaC). Your mission is to design and implement a **production-ready, highly secure, and scalable serverless application** using AWS CDK with TypeScript.

##  Architecture Overview

Design a **Cat/Dog Image Detector with Logging System** that demonstrates real-world AI/ML processing with serverless components:

### **Business Use Case: Image Classification Workflow**

Create a complete image processing system that handles:

- **Image Upload**: Users upload images via API Gateway
- **AI Analysis**: Amazon Rekognition detects cats, dogs, or other objects
- **Classification**: Intelligent categorization based on confidence scores
- **File Management**: Automated organization into S3 folders
- **Data Logging**: Comprehensive tracking and analytics
- **Notifications**: Alert system for uncertain classifications

### **Technical Architecture**

- **Event-driven architecture** with seamless resource integration
- **Step Functions orchestration** for complex image processing workflows
- **Security-first approach** with least privilege access
- **Production-grade monitoring** and observability
- **Cost-optimized** serverless components
- **Environment-specific** configuration management

##  Core Requirements

### 1. **Technology Stack & Constraints**

- **Framework**: AWS CDK with TypeScript
- **Region**: `us-east-1`
- **Naming Convention**: All resources must use prefix `serverlessapp-`
- **Architecture**: Serverless with event-driven components
- **Security**: Production-grade with encryption and least privilege

### 2. **Required Infrastructure Components**

#### **Lambda Functions (Minimum 3)**

- **ImageProcessor**: Handles image uploads, calls Rekognition, and manages the complete workflow
- **FileManager**: Moves images to appropriate S3 folders based on classification
- **NotificationService**: Sends alerts for uncertain classifications via SNS
- **Configuration**: Environment variables for stage-specific settings
- **Monitoring**: CloudWatch metrics and logging for each function

#### **API Gateway Integration**

- **REST API**: Expose image upload endpoints (POST /upload, GET /images/{id}, GET /images)
- **Authentication**: Implement API key authentication with usage plans
- **Request Validation**: JSON schema validation for image upload payloads
- **CORS**: Configure for web application access
- **Rate Limiting**: Implement throttling for API protection
- **Presigned URLs**: Generate presigned URLs for direct S3 uploads

#### **DynamoDB Storage**

- **DetectionLogs Table**: Store image detection results and metadata
- **Streams**: Enable for real-time detection processing triggers
- **Encryption**: Server-side encryption enabled
- **Backup**: Point-in-time recovery enabled
- **TTL**: Configure for data lifecycle management

#### **S3 Bucket for Image Storage**

- **Purpose**: Store uploaded images and organize by classification
- **Folder Structure**: /input/, /cats/, /dogs/, /others/ folders
- **Encryption**: Server-side encryption (SSE-S3 or SSE-KMS)
- **Access Control**: Private bucket with proper IAM policies
- **Lifecycle**: Configure retention policies for images and logs
- **Event Notifications**: Trigger processing for uploaded files

#### **Step Functions Orchestration (Optional)**

- **Image Processing Workflow**: Orchestrate the complete image analysis lifecycle
- **State Machine**: Define states for upload, analysis, classification, logging, and file management
- **Error Handling**: Implement retry logic and error recovery paths
- **Alternative**: Direct Lambda orchestration without Step Functions for simplicity

#### **CloudWatch Monitoring**

- **Metrics**: Custom metrics for Lambda performance and image processing
- **Logs**: Centralized logging with retention policies
- **Alarms**: Set up alerts for errors and performance thresholds
- **Dashboards**: Create operational dashboards for image classification analytics

### 3. **Security & Best Practices**

#### **IAM Configuration**

- **Least Privilege**: Minimal permissions for each service
- **Service Roles**: Dedicated roles for Lambda, API Gateway, etc.
- **Cross-Service Access**: Secure communication between services
- **No Hardcoded Secrets**: Use AWS Secrets Manager or Parameter Store

#### **Network Security**

- **VPC Configuration**: If required for enhanced security
- **Security Groups**: Restrictive access rules
- **Encryption**: Data in transit and at rest
- **Private Subnets**: For database and internal services

#### **Compliance & Governance**

- **Resource Tagging**: Consistent tagging with Environment and Owner
- **Audit Trail**: CloudTrail logging enabled
- **Backup Strategy**: Automated backup and recovery
- **Disaster Recovery**: Multi-region considerations

### 4. **Integration & Connectivity**

#### **Service Integration**

- **API Gateway  ImageProcessor**: Image upload submission endpoint
- **ImageProcessor  Amazon Rekognition**: AI-powered image analysis
- **ImageProcessor  DynamoDB**: Detection results persistence and retrieval
- **ImageProcessor  FileManager**: Trigger file organization
- **FileManager  S3**: Image storage and file organization
- **ImageProcessor  SNS**: Notification system for uncertain classifications
- **CloudWatch  All Services**: Comprehensive monitoring and alerting

#### **Event-Driven Architecture**

- **API Gateway Events**: Image upload submission triggers
- **S3 Events**: File upload triggers for image processing
- **Lambda Invocations**: Direct function calls for processing
- **DynamoDB Streams**: Real-time detection status updates (optional)
- **SNS/SQS**: Asynchronous notifications and error handling

### 5. **Environment & Configuration**

#### **Parameterization**

- **Environment Variables**: Stage-specific configurations
- **CDK Context**: Environment-specific settings
- **Secrets Management**: Secure parameter storage
- **Feature Flags**: Environment-based feature toggles

#### **Deployment Strategy**

- **Stages**: Development, Staging, Production
- **Rollback**: Automated rollback capabilities
- **Blue-Green**: Zero-downtime deployments
- **Cleanup**: Complete resource destruction capability

##  Expected Deliverables

### **Primary Output**

- **CDK Stack**: Complete TypeScript implementation with Step Functions
- **Infrastructure Code**: Well-structured, documented code with business logic
- **Security Configuration**: Production-grade security setup
- **Monitoring Setup**: Comprehensive observability and business metrics

### **Business Logic Implementation**

- **Image Processing Workflow**: Direct Lambda orchestration or Step Functions
- **AI Integration**: Amazon Rekognition for cat/dog detection
- **Classification Logic**: Intelligent categorization based on confidence scores
- **File Management**: Automated S3 folder organization
- **Notification System**: SNS alerts for uncertain classifications
- **Data Logging**: Comprehensive detection results tracking

### **Additional Components**

- **README**: Deployment and usage instructions
- **Architecture Diagram**: Visual representation of the system
- **Security Documentation**: Security controls and compliance
- **Testing**: Unit and integration tests

### **DynamoDB Schema Example**

The DetectionLogs table should store records in the following format:

```json
{
  "ImageID": "abcd-1234-uuid",
  "DetectedAnimal": "dog",
  "ConfidenceScore": 97.4,
  "Timestamp": "2025-08-04T11:42:00Z",
  "S3Location": "s3://serverlessapp-pet-detector/dogs/dog123.jpg",
  "ProcessingStatus": "completed",
  "FileSize": 1024000,
  "ImageFormat": "jpg"
}
```

##  Security Requirements

### **Data Protection**

- **Encryption**: All data encrypted at rest and in transit
- **Access Control**: Role-based access with least privilege
- **Audit Logging**: Comprehensive audit trails
- **Compliance**: SOC 2, GDPR, HIPAA considerations

### **Network Security**

- **VPC Isolation**: Private subnets for sensitive resources
- **Security Groups**: Restrictive firewall rules
- **WAF**: Web Application Firewall if needed
- **DDoS Protection**: Shield Advanced considerations

##  Monitoring & Observability

### **Metrics & Logging**

- **Application Metrics**: Custom business metrics
- **Infrastructure Metrics**: Resource utilization and health
- **Error Tracking**: Comprehensive error monitoring
- **Performance Monitoring**: Response times and throughput

### **Alerting**

- **Critical Alerts**: Immediate notification for failures
- **Performance Alerts**: Threshold-based monitoring
- **Cost Alerts**: Budget and spending monitoring
- **Security Alerts**: Unusual activity detection

##  Success Criteria

1. **Functional Requirements**: All specified components working together
2. **Security Compliance**: Production-grade security implementation
3. **Performance**: Optimized for serverless architecture
4. **Scalability**: Auto-scaling and load handling
5. **Maintainability**: Clean, documented, and testable code
6. **Cost Optimization**: Efficient resource utilization
7. **Disaster Recovery**: Backup and recovery procedures
8. **Monitoring**: Comprehensive observability setup

##  Implementation Guidelines

### **Workflow Design**

Design a streamlined image processing workflow with the following steps:

1. **Image Upload**: Handle image upload via API Gateway
2. **Rekognition Analysis**: Call Amazon Rekognition for object detection
3. **Classification Decision**: Determine cat/dog/other based on confidence scores
4. **Data Logging**: Store detection results in DynamoDB
5. **File Organization**: Move image to appropriate S3 folder (/cats/, /dogs/, /others/)
6. **Notification**: Send SNS alerts for uncertain classifications
7. **Error Handling**: Implement retry logic and error recovery paths

**Implementation Options:**

- **Option A**: Direct Lambda orchestration (simpler)
- **Option B**: Step Functions state machine (more complex but better for complex workflows)

### **Code Quality**

- **TypeScript Best Practices**: Strong typing and interfaces
- **CDK Patterns**: Use established CDK constructs and patterns
- **Error Handling**: Comprehensive error handling and logging
- **Documentation**: Inline code documentation and README

### **Testing Strategy**

- **Unit Tests**: Individual component testing
- **Integration Tests**: End-to-end workflow testing
- **Security Tests**: Vulnerability and compliance testing
- **Performance Tests**: Load and stress testing

### **Deployment Process**

- **CI/CD Pipeline**: Automated deployment pipeline
- **Environment Promotion**: Safe promotion between environments
- **Rollback Strategy**: Quick rollback capabilities
- **Validation**: Pre-deployment validation checks

---

**Remember**: This is a production-ready infrastructure that should demonstrate enterprise-grade security, scalability, and maintainability. Focus on creating a cohesive, well-integrated system that follows AWS best practices and can be easily maintained and extended.
