# Ideal Response for ScalePayments Infrastructure

## Overview
The ideal response should provide a complete, production-ready Pulumi infrastructure stack for a FinTech payment processing platform with the following characteristics:

## Infrastructure Architecture

### 1. Network Design
- **VPC Configuration**: Properly segmented VPC with environment-specific CIDR blocks (10.0.0.0/16 for dev, 10.1.0.0/16 for staging, 10.2.0.0/16 for prod)
- **Multi-AZ Deployment**: 2 AZs for dev, 2 for staging, 3 for production
- **Subnet Strategy**:
  - Public subnets for ALB with Internet Gateway
  - Private subnets for ECS services with NAT Gateways
  - Database subnets isolated without internet access
- **Route Tables**: Properly configured for each subnet type with correct routing rules

### 2. Security Architecture
- **Security Groups**:
  - ALB SG: Allow HTTPS (443) and HTTP (80) from internet
  - ECS SG: Allow traffic from ALB and inter-service communication
  - RDS SG: Allow PostgreSQL (5432) only from ECS services
  - ElastiCache SG: Allow Redis (6379) only from ECS services
- **Network Isolation**: Database resources in private subnets with no public access
- **IAM Roles**: Least privilege policies for ECS task execution and task roles
- **Encryption**: KMS keys for RDS, ElastiCache, and CloudWatch Logs with key rotation enabled

### 3. Compute Layer
- **ECS Fargate Cluster**: Container Insights enabled
- **Multiple Microservices**:
  - API service: Public-facing REST API
  - Payment service: Core payment processing logic
  - Notification service: Event-driven notifications
- **Environment-specific Scaling**:
  - Dev: 1-2 tasks per service
  - Staging: 2-4 tasks per service
  - Prod: 3-10 tasks per service with auto-scaling
- **Task Definitions**: Proper CPU/memory allocation based on environment

### 4. Data Layer
- **RDS Aurora PostgreSQL**:
  - Environment-specific instance classes (t3.micro for dev, r5.xlarge for prod)
  - Multi-AZ for staging and production
  - Automated backups (1 day for dev, 7 for staging, 30 for prod)
  - Encryption at rest with KMS
  - Performance Insights for staging/prod
- **ElastiCache Redis**:
  - Replication groups for HA
  - Encryption in transit and at rest
  - Multi-node clusters for staging/prod

### 5. Load Balancing
- **Application Load Balancer**:
  - Public-facing in public subnets
  - HTTPS listener with path-based routing
  - Target groups for each microservice
  - Health checks configured for each service
- **Listener Rules**: Path-based routing (/api/*, /payment/*, /notification/*)

### 6. Observability
- **CloudWatch Log Groups**: Per-service with environment-specific retention
- **Container Insights**: Enabled on ECS cluster
- **Performance Monitoring**: Enhanced monitoring for RDS in staging/prod
- **Metrics and Alarms**: CPU, memory, connection pool monitoring

### 7. Security & Compliance (Staging/Prod)
- **AWS WAF**: Rate limiting and common attack protection
- **AWS GuardDuty**: Threat detection enabled
- **AWS Config**: Compliance monitoring and resource tracking
- **Secrets Management**: Database credentials in Secrets Manager
- **Deletion Protection**: Enabled for critical resources in production

### 8. Environment Configuration
- **Dataclass-based Configuration**: Clean separation of environment settings
- **Environment Enum**: Type-safe environment selection
- **Resource Tagging**: Consistent tagging strategy across all resources
- **Naming Conventions**: `<project>-<component>-<environment>` pattern

## Code Quality Requirements

### 1. Main Stack (lib/tap_stack.py)
- **Clean Architecture**: Separate methods for each resource type
- **Proper Dependencies**: Use Pulumi ResourceOptions for explicit dependencies
- **Error Handling**: Validation of inputs and graceful error handling
- **Type Hints**: Complete type annotations throughout
- **Documentation**: Comprehensive docstrings for all classes and methods
- **Configuration Management**: Environment-specific configs in dedicated dataclass
- **Resource Organization**: Logical grouping of related resources

### 2. Unit Tests (tests/unit/test_tap_stack.py)
- **Coverage Target**: Minimum 85% code coverage
- **Test Categories**:
  - Environment validation and configuration loading
  - Resource creation and configuration validation
  - Security group rule validation
  - IAM policy validation
  - Network CIDR calculation
  - Tag generation
  - Environment-specific settings
- **Mocking Strategy**: Use Pulumi mocks for resource creation
- **Edge Cases**: Test invalid inputs, boundary conditions
- **Assertions**: Verify all critical configuration parameters

### 3. Integration Tests (tests/integration/test_tap_stack.py)
- **Real Deployment Testing**: Read from actual cfn-outputs/flat-outputs.json
- **Scenario-Based Testing**:
  - Payment processing workflow (API → ECS → RDS → Cache)
  - High availability validation (Multi-AZ, redundancy)
  - Security and compliance (PCI-DSS, network isolation)
  - Auto-scaling behavior (Black Friday surge scenarios)
  - Disaster recovery (backup, failover, recovery)
  - Monitoring and alerting (failure detection, connection monitoring)
  - Cost optimization (right-sizing, auto-scaling efficiency)
  - Performance benchmarks (latency, throughput, query performance)
- **No Mocking**: Tests should validate actual deployed infrastructure
- **Output Validation**: Verify all required outputs are present and correctly formatted
- **Cross-Environment Tests**: Validate environment isolation and progressive scaling

## Expected Test Results

### Unit Test Coverage
Name Stmts Miss Cover
lib/tap_stack.py 500 50 90%
TOTAL 500 50 90%


### Integration Test Scenarios
- 30+ test scenarios covering real-world operational cases
- All tests should pass against actual deployment
- Clear console output explaining what each test validates
- Business context for each test scenario

## Key Differentiators

### What Makes This Response Ideal:
1. **Complete Resource Connectivity**: All services properly networked and secured
2. **Environment Progression**: Clear scaling/security progression from dev → staging → prod
3. **Production-Ready**: Deletion protection, backups, monitoring, compliance
4. **Clean Code**: Well-structured, documented, type-safe Python
5. **Comprehensive Testing**: Both unit and integration tests with real scenarios
6. **Security First**: Encryption, least privilege, network isolation
7. **FinTech Compliance**: PCI-DSS considerations, audit logging, data protection
8. **Operational Excellence**: Monitoring, auto-scaling, disaster recovery
9. **Cost Optimization**: Right-sized resources per environment
10. **Documentation**: Clear comments, docstrings, and test descriptions

## Output Structure

### File 1: lib/tap_stack.py
- Complete stack implementation (~1500-2000 lines)
- All resources properly connected
- Environment-specific configurations
- KMS encryption for all sensitive data
- Comprehensive error handling

### File 2: tests/unit/test_tap_stack.py
- 30+ unit test methods
- 85%+ code coverage achieved
- Tests for all major components
- Environment configuration validation
- Mocked Pulumi resources

### File 3: tests/integration/test_tap_stack.py
- 40+ integration test scenarios
- Real deployment validation
- Payment processing workflows
- HA/DR scenarios
- Security and compliance tests
- Performance benchmarks
- Cost optimization validation
- No emojis, professional output

## Success Metrics

### Infrastructure Quality
- ✓ All resources deployed successfully
- ✓ No security group rule violations
- ✓ Proper network segmentation
- ✓ Encryption enabled everywhere
- ✓ Environment isolation maintained

### Code Quality
- ✓ Type hints throughout
- ✓ Comprehensive docstrings
- ✓ Error handling implemented
- ✓ Clean architecture patterns
- ✓ DRY principles followed

### Test Quality
- ✓ 85%+ unit test coverage
- ✓ 40+ integration scenarios
- ✓ Real-world test cases
- ✓ All tests passing
- ✓ Clear test documentation

### Operational Readiness
- ✓ Monitoring configured
- ✓ Auto-scaling working
- ✓ Backups scheduled
- ✓ Disaster recovery tested
- ✓ Compliance validated