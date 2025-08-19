lib/IDEAL_RESPONSE.md
Ideal Response Characteristics
Code Quality Standards
Clean, readable Terraform code with consistent formatting and meaningful variable names
Comprehensive documentation through inline comments explaining security controls and business logic
Proper resource organization with logical grouping and clear separation of concerns
DRY principles applied through locals, variables, and data sources
Security Best Practices
Permission boundaries implemented to prevent privilege escalation
Least privilege access with granular, resource-scoped permissions
MFA enforcement for sensitive operations and breakglass scenarios
Regional restrictions to support data residency requirements
External ID support for secure cross-account access
Session duration limits appropriate to role purpose
Compliance & Governance
SOC 2 alignment with proper tagging, audit trails, and access controls
GDPR considerations through regional restrictions and data handling controls
Consistent resource naming following organizational conventions
Comprehensive tagging strategy for asset inventory and cost allocation
Audit-friendly outputs providing visibility into applied controls
Operational Excellence
Environment-specific configurations (dev/staging/prod)
Cross-account deployment support with role assumption
Multi-region capability with provider aliases
Flexible role definitions through structured variables
CI/CD integration with validation and testing hooks
Documentation Standards
Clear variable descriptions with validation rules
Comprehensive outputs for downstream consumption
Inline security rationale explaining control objectives
Usage examples in comments
Compliance mapping showing how controls meet requirements