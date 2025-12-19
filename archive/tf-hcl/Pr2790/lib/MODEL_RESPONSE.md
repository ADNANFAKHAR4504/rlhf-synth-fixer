MODEL RESPONSE DOCUMENTATION

OVERVIEW
This document provides guidance on proper model responses and best practices for infrastructure as code deployments.

RESPONSE QUALITY STANDARDS

Clear Communication
- Provide explicit explanations for each action taken
- Use consistent terminology throughout responses
- Include context for decision-making processes

Technical Accuracy
- Validate all configuration changes before suggesting them
- Ensure resource references are correct and consistent
- Verify provider configurations match deployment requirements

Problem Resolution
- Identify root causes before proposing solutions
- Provide step-by-step troubleshooting guidance
- Include validation steps to confirm fixes

BEST PRACTICES

Configuration Management
- Use consistent naming conventions across all resources
- Implement proper tagging strategies for resource organization
- Maintain clear separation between environments

Multi-Region Deployments
- Properly configure provider aliases for each region
- Ensure resource assignments use correct provider references
- Validate cross-region dependencies and limitations

Security Considerations
- Implement least privilege access principles
- Use secure credential management practices
- Enable encryption for sensitive data and communications

Testing and Validation
- Always run terraform validate before deployment
- Use terraform plan to review proposed changes
- Implement automated testing for infrastructure code

ERROR HANDLING

Proactive Error Prevention
- Validate configurations before execution
- Check for common pitfalls and misconfigurations
- Provide clear error messages and resolution steps

Recovery Procedures
- Document rollback procedures for failed deployments
- Maintain backup configurations for critical infrastructure
- Implement monitoring and alerting for infrastructure health

DOCUMENTATION STANDARDS

Code Documentation
- Include clear comments explaining complex logic
- Document variable purposes and expected values
- Provide examples of proper usage patterns

Operational Documentation
- Maintain deployment procedures and prerequisites
- Document troubleshooting steps for common issues
- Include contact information for support escalation
