Common Model Failures to Avoid
Security Anti-Patterns
Overly permissive policies using * for actions/resources without justification
Missing permission boundaries allowing unrestricted privilege escalation
Weak trust policies accepting any principal or missing external ID validation
No MFA requirements for sensitive roles like breakglass access
Unrestricted regional access violating data residency requirements
Hardcoded secrets or sensitive values in configuration
Code Quality Issues
Inconsistent naming conventions making resources hard to identify
Poor variable validation allowing invalid inputs
Missing or inadequate documentation leaving security controls unexplained
Hardcoded values that should be parameterized
Complex, unreadable policy documents without clear structure
Missing tags preventing proper asset management
Operational Problems
No environment separation mixing dev/staging/prod configurations
Missing outputs preventing integration with other systems
Inflexible role definitions requiring code changes for new roles
No cross-account support limiting deployment flexibility
Missing provider configurations for multi-region deployments
No validation hooks for CI/CD integration
Compliance Gaps
Missing audit trails through inadequate tagging or logging
No compliance mapping showing how controls meet requirements
Insufficient access controls for sensitive operations
Missing data residency controls for international compliance
No emergency access procedures or breakglass capabilities
Inadequate session management with overly long durations
Terraform-Specific Issues
Incorrect resource dependencies causing deployment failures
Missing provider version constraints leading to inconsistent behavior
Improper use of dynamic blocks making code hard to understand
No state management considerations for team environments
Missing validation rules on variables
Incorrect use of for_each causing resource recreation issues
Testing & Validation Gaps
No unit testing of policy logic
Missing integration tests for cross-account scenarios
No compliance validation automated testing
Inadequate error handling in complex scenarios
No drift detection mechanisms
Missing disaster recovery procedures