# AWS Multi-Environment CI/CD Pipeline with Pulumi

## Objective
Design and deploy a robust CI/CD pipeline infrastructure on AWS using Pulumi Infrastructure as Code, ensuring consistent resource management across multiple environments with automated deployments, standardized naming conventions, and multi-region support for improved scalability and disaster recovery.

## Problem Statement
You are tasked with establishing a standardized, scalable CI/CD pipeline infrastructure that supports multiple deployment environments (development and production) across different AWS regions (us-west-2 for development, eu-central-1 for production). The solution must use Pulumi to provision identical infrastructure patterns in both environments, implement consistent resource naming conventions following the ENV-ResourceName format, and enable automated deployment processes. The infrastructure should include S3 buckets for artifact storage, Lambda functions for deployment automation, and IAM roles for secure resource access management.

## Functional Requirements

### Multi-Environment Architecture
- Deploy infrastructure components in development (us-west-2) and production (eu-central-1) environments
- Ensure consistent resource configurations and deployment patterns across environments
- Implement standardized resource naming conventions following ENV-ResourceName format (dev-*, prod-*)

### S3 Bucket Configuration
- Create S3 buckets for artifact storage and deployment packages in each environment
- Configure appropriate bucket policies and access controls per environment
- Implement cross-region replication capabilities for critical deployment artifacts
- Enable versioning and lifecycle management for cost optimization

### Lambda Function Management
- Deploy Lambda functions for deployment automation and CI/CD pipeline triggers
- Implement environment-specific processing logic and configuration management
- Configure appropriate runtime environments and resource allocations per environment
- Establish proper error handling and logging mechanisms

### IAM Security Framework
- Create environment-specific IAM roles for Lambda execution and service access
- Implement least privilege access policies for cross-service permissions
- Configure service-specific execution roles with appropriate resource boundaries
- Ensure secure cross-environment access controls and policy inheritance

### Cross-Region Deployment Support
- Configure region-specific resource provisioning and management
- Implement automated deployment workflows across multiple AWS regions
- Enable environment promotion strategies and rollback mechanisms
- Support disaster recovery and business continuity requirements

### Single File Structure
- Create a single Python file that contains all infrastructure resources
- Do NOT use separate modules, classes, or external file imports
- Implement all functionality within one comprehensive script
- Use functions for organization but keep everything in the same file

### Code Quality Requirements
- Follow PEP 8 style guidelines with 2-space indentation
- Use proper import ordering: standard library imports first, then third-party imports
- Include only necessary imports - remove any unused imports
- Ensure proper line endings (LF format) and include final newline
- Do NOT define unnecessary classes - use simple functions and dictionaries

### Test Compatibility Requirements
- The code must be compatible with existing test infrastructure
- Must define TapStack and TapStackArgs classes for test imports
- Classes should be minimal but functional to satisfy test requirements
- Ensure the main infrastructure logic works independently of class structure
- Test files expect to import: `from lib.tap_stack import TapStack, TapStackArgs`

## Constraints

- Use Pulumi as the Infrastructure as Code tool for all resource provisioning
- Deploy resources in us-west-2 (development) and eu-central-1 (production) regions
- Maintain identical infrastructure patterns across both target environments
- Implement ENV-ResourceName naming convention for all AWS resources
- Follow AWS Well-Architected Framework principles for reliability and security
- Ensure all resources support automated CI/CD pipeline integration
- Code must pass PyLint with minimum score of 7.0/10
- Use 2-space indentation throughout the codebase
- Follow proper Python import conventions and remove unused imports
- Single file implementation - no separate modules or class files
- Avoid complex class hierarchies - use simple functions and data structures
- Must satisfy existing test imports without breaking the single-file approach

## Deliverable

A single Pulumi Python file that:

- Provisions CI/CD infrastructure in both development (us-west-2) and production (eu-central-1) environments
- Implements ENV-ResourceName naming conventions for all AWS resources
- Creates S3 buckets, Lambda functions, and IAM roles with appropriate configurations
- Configures cross-region deployment capabilities and environment-specific settings
- Supports automated CI/CD pipeline integration through parameterized configurations
- Follows infrastructure best practices for scalability and maintainability
- Passes PyLint validation with score ≥ 7.0/10
- Uses 2-space indentation and proper Python formatting
- Contains no unused imports or undefined references
- Has proper line endings (LF) and final newline
- Includes TapStack and TapStackArgs classes for test compatibility

### Code Structure Requirements

The code structure must include:

- Proper import statements in correct order (standard library first, then third-party)
- Simple function-based organization without complex classes
- Dictionary-based configuration for environment-specific parameters
- Clean, well-documented functions with appropriate docstrings
- Consistent 2-space indentation throughout the entire file
- All infrastructure resources defined in one file
- Minimal TapStack and TapStackArgs classes that satisfy test requirements
- Main infrastructure logic in functions that can be called independently

### Deployment Capabilities

The deployment must demonstrate:

- Environment consistency in CI/CD pipeline architecture and configuration
- Automated provisioning capabilities across multiple AWS regions
- Standardized resource naming and tagging strategies following ENV-ResourceName format
- Secure IAM role and policy management across environments
- CI/CD pipeline integration readiness with artifact storage and deployment automation
- Single-file deployment that is easy to maintain and understand
- Test compatibility without compromising the de-modularized approach

## Implementation Notes

- The TapStack and TapStackArgs classes should be minimal wrappers around the main function-based infrastructure
- The core CI/CD infrastructure logic should be implemented in standalone functions
- Classes should primarily serve as interfaces for test compatibility
- Ensure the infrastructure can be deployed both through class instantiation (for tests) and direct function calls
- Maintain clean separation between test-compatibility code and core infrastructure logic
- Environment configurations should be parameterized to support easy scaling to additional environments
- Resource naming must strictly follow ENV-ResourceName convention (e.g., dev-artifacts-bucket, prod-deployment-lambda)