# Model Failures for MODEL_RESPONSE.md

1. **Incorrect/Incomplete ALB Listener and Certificate Handling**
   - The model's `LoadBalancer` construct always creates both HTTP (port 80) and HTTPS (port 443) listeners, but the HTTPS listener is configured with protocol HTTP and does not use an ACM certificate. There is no logic for conditional HTTPS, no ACM certificate resource, and no redirect from HTTP to HTTPS.
   - The ideal solution conditionally creates the HTTPS listener only if a certificateArn is provided, uses an ACM certificate for HTTPS, and configures a redirect from HTTP to HTTPS. The protocol for the HTTPS listener is correctly set to HTTPS, not HTTP.

2. **Missing Tagging and Naming Conventions**
   - The model's resources (VPC, security groups, ASG, ALB, etc.) do not consistently apply required tags such as `Stage`, `Region`, `App`, or `ProblemID`. Resource names are inconsistent or missing, and tags are not propagated as required.
   - The ideal solution applies tags for `App`, `Stage`, `Region`, and `ProblemID` to all resources, ensuring traceability and compliance with best practices. Resource names follow a strict convention using stage and region.

3. **Lack of Modular, Reusable Constructs and Interface Compliance**
   - The model uses a single stack with large, monolithic constructs and does not expose or require the same interfaces as the ideal (e.g., missing `appName`, etc.). Constructs are not modular or reusable.
   - The ideal solution is highly modular, with each construct (VPC, security groups, launch template, ASG, ALB) in its own file, using clear interfaces and props. The stack and constructs are reusable and parameterized, supporting both HTTP-only and HTTPS scenarios.
