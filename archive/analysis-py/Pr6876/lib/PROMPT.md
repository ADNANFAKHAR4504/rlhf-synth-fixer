Create a Python script using Boto3 that performs a comprehensive security and performance audit on API Gateway resources in a specified AWS region.

Audit Scope
Analyze production and staging stages only. Ignore APIs tagged with ExcludeFromAudit: true or Internal: true.

Security and Performance Checks

1. Authorization Gaps (CRITICAL): Methods where AuthorizationType = NONE
2. Data Integrity Risk (HIGH): Methods with Request Validation = NONE
3. Throttling Vulnerability (HIGH): APIs not in a Usage Plan with throttling limits
4. Perimeter Defense (CRITICAL): APIs without AWS WAF Web ACL (handle unavailability gracefully)
5. CORS Misconfig (HIGH): Production stages with Access-Control-Allow-Origin: *
6. Backend Timeout Risk (MEDIUM): Lambda integrations with timeout > 29 seconds
7. Performance Blind Spots: GET methods without Caching enabled
8. Tracing Deficit: APIs without AWS X-Ray tracing
9. Cost Optimization (LOW): REST APIs with simple proxy integrations (recommend HTTP API migration)
10. Unused APIs (FINOPS): APIs with zero/minimal requests (check available CloudWatch metrics, handle unavailability gracefully)

Output Requirements
Generate three outputs:

1. Console Report: Use tabulate library to display findings in a clean table format with columns: API Name, Stage, Resource Path, HTTP Method, Issue Type, Severity.

2. api_gateway_audit.json: Group findings by API/Stage with security impact, remediation steps, and cost optimization details (current monthly cost and potential savings).

3. api_gateway_resources.json: Complete resource inventory with fields: API ID, API Name, Stage, Resource Path, HTTP Method, Authorization Type, Request Validator, Throttling Status, WAF Status, CORS Config, Caching Status, X-Ray Tracing, CloudWatch Metrics, Issues, Severity.
