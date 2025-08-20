Objective
Design and deploy a robust, geographically distributed AWS infrastructure across multiple regions using Pulumi Infrastructure as Code, ensuring consistent architecture, automated deployment capabilities, and cross-region replication for business continuity and disaster recovery.
Problem Statement
You are tasked with establishing a standardized, scalable cloud infrastructure that spans two primary AWS regions: us-west-1 and us-east-1. The solution must use Pulumi to provision identical infrastructure architectures in both regions, implement consistent resource naming conventions, and enable automated deployment processes. The infrastructure should support cross-region replication capabilities for critical services and maintain uniform security postures across all environments.
Functional Requirements

Multi-Region Architecture

Deploy identical infrastructure components in both us-west-1 and us-east-1 regions
Ensure consistent subnet configurations and network topologies across regions
Implement standardized resource naming conventions for all components


VPC and Network Configuration

Create VPCs with identical CIDR blocks and subnet layouts in both regions
Configure public and private subnets with consistent availability zone distribution
Establish internet gateways, NAT gateways, and route tables with matching configurations


Security Group Management

Deploy security groups with identical rulesets across both regions
Implement consistent ingress and egress rules for application tiers
Ensure uniform security posture and access controls


Cross-Region Replication

Configure AWS native replication services for databases and storage
Implement automated backup and disaster recovery mechanisms
Enable data synchronization between regions for critical services


Automated Deployment Pipeline

Use Pulumi's Infrastructure as Code capabilities for consistent deployments
Implement parameterized configurations to support multiple regions
Enable automated resource provisioning and updates


Single File Structure

Create a single Python file that contains all infrastructure resources
Do NOT use separate modules, classes, or external file imports
Implement all functionality within one comprehensive script
Use functions for organization but keep everything in the same file


Code Quality Requirements

Follow PEP 8 style guidelines with 2-space indentation
Use proper import ordering: standard library imports first, then third-party imports
Include only necessary imports - remove any unused imports
Ensure proper line endings (LF format) and include final newline
Do NOT define unnecessary classes - use simple functions and dictionaries


Test Compatibility Requirements

The code must be compatible with existing test infrastructure
Must define TapStack and TapStackArgs classes for test imports
Classes should be minimal but functional to satisfy test requirements
Ensure the main infrastructure logic works independently of class structure
Test files expect to import: from lib.tap_stack import TapStack, TapStackArgs



Constraints

Use Pulumi as the Infrastructure as Code tool for all resource provisioning
Deploy resources exclusively in us-west-1 and us-east-1 regions
Maintain identical architecture patterns across both target regions
Implement automated deployment processes to minimize manual intervention
Follow AWS Well-Architected Framework principles for reliability and security
Ensure all resources support cross-region replication where applicable
Code must pass PyLint with minimum score of 7.0/10
Use 2-space indentation throughout the codebase
Follow proper Python import conventions and remove unused imports
Single file implementation - no separate modules or class files
Avoid complex class hierarchies - use simple functions and data structures
Must satisfy existing test imports without breaking the single-file approach

Deliverable

A single Pulumi Python file that:

Provisions identical infrastructure in both us-west-1 and us-east-1 regions
Implements consistent naming conventions for all AWS resources
Creates VPCs, subnets, security groups, and supporting network infrastructure
Configures cross-region replication for stateful services
Supports automated deployment through parameterized configurations
Follows infrastructure best practices for scalability and maintainability
Passes PyLint validation with score ≥ 7.0/10
Uses 2-space indentation and proper Python formatting
Contains no unused imports or undefined references
Has proper line endings (LF) and final newline
Includes TapStack and TapStackArgs classes for test compatibility


The code structure must include:

Proper import statements in correct order (standard library first, then third-party)
Simple function-based organization without complex classes
Dictionary-based configuration for region-specific parameters
Clean, well-documented functions with appropriate docstrings
Consistent 2-space indentation throughout the entire file
All infrastructure resources defined in one file
Minimal TapStack and TapStackArgs classes that satisfy test requirements
Main infrastructure logic in functions that can be called independently


The deployment must demonstrate:

Regional consistency in architecture and configuration
Automated provisioning capabilities across multiple regions
Standardized resource naming and tagging strategies
Network connectivity and routing consistency
Disaster recovery and business continuity readiness
Single-file deployment that is easy to maintain and understand
Test compatibility without compromising the de-modularized approach



Implementation Notes

The TapStack and TapStackArgs classes should be minimal wrappers around the main function-based infrastructure
The core infrastructure logic should be implemented in standalone functions
Classes should primarily serve as interfaces for test compatibility
Ensure the infrastructure can be deployed both through class instantiation (for tests) and direct function calls
Maintain clean separation between test-compatibility code and core infrastructure logic