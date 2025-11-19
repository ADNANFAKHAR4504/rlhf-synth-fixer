# model_failure

## Common failure modes and how to avoid them

### Misuse of metric math functions

* Using functions that mix scalar and time series incorrectly can cause validation errors.
* Avoid constructs like nested aggregates that produce arrays where scalars are required.
* Prefer explicit `IF(total>0, expression, fallback)` for safe division over functions that accept heterogeneous inputs.

### Multiple expressions returning data in a single alarm

* Composite metric-math alarms must have exactly one expression with `ReturnData: true`.
* Ensure that all intermediate expressions and raw metrics specify `ReturnData: false`.

### Composite alarm rule formatting

* Multi-line or whitespace-padded `AlarmRule` strings can be rejected.
* Provide a single-line rule string with properly quoted ARNs and no leading or trailing spaces.

### External parameter dependencies

* Referencing SSM parameters that are not created by the stack can block deployment.
* Keep the stack self-contained by writing threshold values into Parameter Store as part of the same deployment and having alarms read template parameters directly.

### Optional features with regional schema variance

* Contributor Insights rule bodies for log-based contributions vary across regions and accounts; schema keys like filters and operations may differ.
* Treat this feature as optional and add it later with a verified rule body tailored to the account’s supported schema and actual log fields.

### Environment naming pitfalls

* Overly strict `AllowedValues` lists cause friction and prevent valid environments from deploying.
* Use a regex that permits lowercase letters, digits, and hyphens within a safe length range.

## Remediation checklist

* Validate that only one metric or expression returns data in alarms that use `Metrics`.
* Use basic arithmetic and `IF` constructs for rate calculations and normalization.
* Keep composite alarm rules on a single line and avoid indentation tricks.
* Confirm SNS subscription endpoints after deployment to receive notifications.
* Ensure application logs are valid JSON and contain the expected keys; metric filters rely on these fields.
* Scope the remediation Lambda role tightly in production by replacing wildcard resources with explicit ARNs where feasible.

## Quality gates

* Lint passes with no errors.
* CloudFormation validation passes before deployment.
* Stack creation completes without manual seeding of external parameters.
* Dashboards render with live data and show current metrics.
* Alarms transition to OK when conditions return to normal.
* Logs Insights queries return results against the application log group.

## Future enhancements

* Add Contributor Insights for top error-producing IPs once the exact schema and field naming are confirmed in the target account and region.
* Introduce metric streams or additional archival paths if long-term metric retention beyond CloudWatch is required by policy.
* Expand remediation to include runbooks, SSM Automation, or incident creation in ticketing systems.
