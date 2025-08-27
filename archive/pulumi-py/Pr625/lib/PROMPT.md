You are a Senior DevOps Engineer implementing a security-first AWS infrastructure using Pulumi with Python. You must create a production-grade, multi-region infrastructure that meets enterprise security standards and operational excellence requirements.

### **Project Structure Requirements**
You must implement the solution using exactly these three files:

```
├── lib/
│   └── tap_stack.py           # Main infrastructure stack implementation
├── tests/
│   ├── unit/
│   │   └── test_tap_stack.py     # Unit tests for stack components
│   └── integration/
│       └── test_tap_stack.py     # Integration tests for deployed resources
```

### **Core Infrastructure Requirements**

#### **lib/tap_stack.py Implementation**
Create a comprehensive Pulumi stack class that implements:

**1. Multi-Region Infrastructure (us-east-1, us-west-2, ap-south-1)**
- VPC with public/private subnets across multiple AZs
- Internet Gateway, NAT Gateways for private subnet internet access
- Route tables with proper routing configuration
- VPC peering connections between regions

**2. Compute Resources**
- EC2 instances with auto-scaling groups
- Application Load Balancer with target groups
- Lambda functions for automation tasks
- Security groups with least-privilege access

**3. Storage and Database**
- S3 buckets with cross-region replication and versioning
- RDS PostgreSQL instances with read replicas
- DynamoDB tables for session management
- EBS volumes with encryption

**4. Security Implementation**
- IAM roles and policies following least-privilege principle
- KMS keys for encryption at rest
- AWS Secrets Manager for database credentials
- TLS 1.2+ enforcement on all services
- Security groups with minimal required ports

**5. Monitoring and Compliance**
- CloudWatch log groups and metric filters
- CloudTrail for API logging
- VPC Flow Logs for network monitoring
- AWS Config rules for compliance checking
- SNS topics for alerting

**6. Resource Tagging and Naming**
- Implement naming convention: `PROD-{service}-{identifier}-{region}`
- Required tags: Environment, Owner, CostCenter, Project
- Consistent tagging across all resources

#### **Expected tap_stack.py Structure**
```python
import pulumi
import pulumi_aws as aws
from typing import Dict, List, Optional

class TapStack:
    def __init__(self, name: str, opts: Optional[pulumi.ResourceOptions] = None):
        # Initialize stack with security-first approach
        
    def create_networking(self) -> Dict:
        # VPC, subnets, gateways, routing
        
    def create_security_resources(self) -> Dict:
        # IAM roles, security groups, KMS keys
        
    def create_compute_resources(self, networking: Dict, security: Dict) -> Dict:
        # EC2, ASG, ALB, Lambda
        
    def create_storage_resources(self, security: Dict) -> Dict:
        # S3, RDS, DynamoDB
        
    def create_monitoring(self) -> Dict:
        # CloudWatch, CloudTrail, Config
        
    def apply_tags(self, resource_type: str, region: str) -> Dict:
        # Consistent tagging strategy
        
    def export_outputs(self):
        # Export important resource ARNs and endpoints
```

### **Testing Requirements**

#### **tests/unit/test_tap_stack.py**
Implement comprehensive unit tests that verify:

**1. Resource Creation Logic**
- Test that all required resources are created
- Validate resource naming conventions
- Check tag application correctness
- Verify security group rules
- Test IAM policy attachments

**2. Configuration Validation**
- Test input parameter validation
- Verify region-specific configurations
- Check resource dependencies
- Validate encryption settings

**3. Security Compliance**
- Test TLS 1.2+ enforcement
- Verify least-privilege IAM policies
- Check encryption at rest configuration
- Validate network security rules

**Expected Unit Test Structure:**
```python
import unittest
from unittest.mock import Mock, patch
import pulumi
from lib.tap_stack import TapStack

class TestTapStack(unittest.TestCase):
    def setUp(self):
        # Setup test environment
        
    def test_vpc_creation(self):
        # Test VPC and subnet creation
        
    def test_security_groups(self):
        # Test security group rules
        
    def test_iam_roles(self):
        # Test IAM role creation and policies
        
    def test_resource_tagging(self):
        # Test consistent tagging
        
    def test_encryption_settings(self):
        # Test encryption configuration
        
    def test_naming_conventions(self):
        # Test resource naming patterns
```

#### **tests/integration/test_tap_stack.py**
Create integration tests that validate deployed infrastructure:

**1. Connectivity Testing**
- Test inter-service connectivity
- Verify load balancer health checks
- Check database connectivity from applications
- Test cross-region replication

**2. Security Validation**
- Verify TLS certificate deployment
- Test network access controls
- Validate encryption in transit/at rest
- Check compliance rule execution

**3. Monitoring Verification**
- Test CloudWatch metrics collection
- Verify log aggregation
- Check alert configurations
- Test Config rule compliance

**Expected Integration Test Structure:**
```python
import boto3
import pytest
import time
from typing import Dict

class TestTapStackIntegration:
    @classmethod
    def setup_class(cls):
        # Initialize AWS clients for testing
        
    def test_vpc_connectivity(self):
        # Test network connectivity between resources
        
    def test_load_balancer_health(self):
        # Test ALB target health and routing
        
    def test_database_connectivity(self):
        # Test RDS connectivity and read replicas
        
    def test_s3_replication(self):
        # Test cross-region S3 replication
        
    def test_monitoring_pipeline(self):
        # Test CloudWatch metrics and alarms
        
    def test_compliance_rules(self):
        # Test AWS Config compliance checking
        
    def test_secrets_management(self):
        # Test Secrets Manager integration
```

### **Specific Implementation Requirements**

#### **Resource Connectivity Patterns**
Your `tap_stack.py` must demonstrate:
- ALB target groups connecting to EC2 instances across AZs
- RDS security groups allowing access only from application security groups
- Lambda functions with VPC connectivity and proper subnets
- S3 bucket policies restricting access to specific IAM roles
- Cross-region VPC peering for disaster recovery

#### **Security Implementation**
Include concrete examples of:
- IAM role trust relationships and policy documents
- Security group ingress/egress rules with specific sources
- KMS key policies for different resource types
- Secrets Manager automatic rotation configuration
- TLS certificate attachment to load balancers

#### **Error Handling and Validation**
Implement robust error handling for:
- Resource creation failures
- Dependency resolution issues
- Configuration validation errors
- Network connectivity problems
- Compliance violations

### **Success Criteria**
Your implementation must:
- Deploy successfully across all three regions (us-east-1, us-west-2, ap-south-1)
- Pass all unit tests with >90% code coverage
- Pass integration tests validating real infrastructure
- Implement all security requirements as code
- Follow PROD-{service}-{identifier}-{region} naming convention
- Include comprehensive resource tagging
- Demonstrate proper resource interconnectivity
- Handle IPv6 and dual-stack networking requirements

### **Output Deliverables**
Provide complete implementations of:
1. **lib/tap_stack.py** - Full infrastructure stack with all required resources
2. **tests/unit/test_tap_stack.py** - Comprehensive unit test suite
3. **tests/integration/test_tap_stack.py** - Real infrastructure validation tests

Each file should include:
- Detailed docstrings explaining functionality
- Proper error handling and logging
- Security-first implementation approach
- Clear separation of concerns
- Comprehensive test coverage

Focus on creating production-ready code that demonstrates enterprise-level infrastructure patterns while maintaining security, scalability, and operational excellence standards.