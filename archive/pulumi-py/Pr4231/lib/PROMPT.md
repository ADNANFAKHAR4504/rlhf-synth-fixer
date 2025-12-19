<system_role>
You are an expert AWS Solutions Architect and Senior DevOps Engineer with deep expertise in Pulumi Infrastructure as Code, Python development, and enterprise-grade FinTech infrastructure. You specialize in multi-environment configuration management and have extensive experience with microservices architectures, payment processing platforms, and regulatory compliance requirements.
</system_role>

<task_description>
Design and implement a comprehensive Pulumi program for ScalePayments, a FinTech startup that needs to deploy their payment processing platform across three environments (development, staging, production). The infrastructure must maintain consistency across environments while accommodating environment-specific requirements including scaling parameters, security configurations, and compliance requirements.
</task_description>

<infrastructure_requirements>
<core_services>
- Multiple microservices running on ECS Fargate
- RDS for transaction data storage
- ElastiCache for session management
- Environment-specific scaling and security configurations
- Compliance-ready architecture for FinTech operations
</core_services>

<base_requirements>
- AWS region: us-east-1
- Python 3.8+ with Pulumi
- Multi-environment configuration management
- Resource connectivity and dependency management
- Infrastructure consistency across environments
</base_requirements>
</infrastructure_requirements>

<file_constraints>
You must modify and output code ONLY for these specific files:
- lib/tap_stack.py (main stack implementation)
- tests/unit/test_tap_stack.py (unit tests with minimum 85% code coverage)
- tests/integration/test_tap_stack.py (integration tests with creative real-world scenarios)
</file_constraints>

<implementation_instructions>
1. **Infrastructure Architecture**: Design a scalable, secure, and compliant infrastructure that properly connects all AWS resources with appropriate networking, security groups, IAM roles, and resource dependencies.

2. **Multi-Environment Configuration**: Implement environment-specific configurations that maintain consistency while allowing for different scaling parameters, security policies, and compliance requirements across dev/staging/prod.

3. **Resource Connectivity**: Focus heavily on proper resource interconnection - ensure ECS services can communicate with RDS databases, ElastiCache clusters are properly networked, load balancers route correctly, and all security groups allow appropriate traffic flow.

4. **Code Structure**: Use clean, maintainable Python code with proper error handling, logging, and documentation. Implement configuration management that supports easy environment switching.

5. **Testing Requirements**:
   - **Unit Tests**: Achieve minimum 85% code coverage testing individual components, resource configurations, and environment-specific settings
   - **Integration Tests**: Create creative, realistic scenarios that test end-to-end workflows, cross-service communication, failover scenarios, security compliance, and environment promotion workflows
</implementation_instructions>

<testing_scenarios>
<unit_test_coverage>
- Resource creation and configuration validation
- Environment-specific parameter application
- IAM policy and security group rule validation
- Network configuration testing
- Resource tagging and naming convention compliance
- Configuration parameter validation across environments
Target: Minimum 85% code coverage with comprehensive edge case testing
</unit_test_coverage>

<integration_test_scenarios>
Create innovative, realistic test scenarios such as:
- Complete payment processing workflow from API Gateway to database
- Multi-AZ failover simulation and recovery testing
- Security breach simulation and containment validation
- Environment promotion pipeline testing (dev → staging → prod)
- Compliance audit simulation scenarios
- Load testing scenarios with auto-scaling validation
- Disaster recovery and backup restoration workflows
- Cross-service communication validation under various network conditions
</integration_test_scenarios>
</testing_scenarios>

<output_format>
For each file, provide:
1. Complete, production-ready code implementation
2. Comprehensive inline documentation
3. Clear separation of environment-specific configurations
4. Proper error handling and validation
5. Security best practices implementation

Structure your response as follows:
lib/tap_stack.py
[Complete stack implementation code]

tests/unit/test_tap_stack.py
[Comprehensive unit tests with 85%+ coverage]

tests/integration/test_tap_stack.py
[Creative integration test scenarios]


</output_format>

<success_criteria>
- All AWS resources properly connected with appropriate networking and security
- Environment-specific configurations cleanly separated and easily manageable
- Infrastructure supports FinTech compliance requirements
- Code achieves specified test coverage targets
- Integration tests validate real-world operational scenarios
- Infrastructure is production-ready and follows AWS Well-Architected principles
</success_criteria>

Think step by step through the architecture design, considering resource dependencies, security requirements, and environment-specific needs. Focus on creating robust, well-connected infrastructure that supports the payment processing platform's operational requirements across all environments.