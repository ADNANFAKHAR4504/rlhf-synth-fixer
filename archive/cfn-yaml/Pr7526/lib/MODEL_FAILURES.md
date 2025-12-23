# model_failure

# TapStack Compliance-Embedded CloudFormation — Failure Modes and Recovery

## Likely failure scenarios

* Reintroduction of hardcoded names for global or account-unique resources leads to early-validation failure loops.
* Using a KMS key ID instead of an ARN for Lambda environment encryption triggers Lambda Create failures.
* CloudTrail data event selectors include invalid wildcards for S3 object ARNs, causing Create failures.
* Custom resource Lambda omits or fails to deliver the response to the CloudFormation ResponseURL, resulting in long CREATE_IN_PROGRESS followed by timeout.
* Response payload exceeds CloudFormation limits when returning the full compliance findings in Data.
* Insufficient IAM permissions for the validator cause hidden AccessDenied exceptions that prevent a timely response.

## Symptoms and signals

* ChangeSet creation fails with AWS::EarlyValidation::ResourceExistenceCheck.
* Lambda creation fails with KmsKeyArn validation errors or malformed ARN patterns.
* CloudTrail fails with invalid DataResources.Values errors.
* Custom resource remains CREATE_IN_PROGRESS for several minutes, then times out.
* Error indicating response object is too long.

## Recovery actions

* Remove explicit names for unique resources; use logical IDs and tags instead.
* Ensure Lambda KmsKeyArn properties reference a full ARN and that the role can decrypt and generate data keys for that CMK.
* Limit CloudTrail initially to management events; add data events later with explicit bucket ARNs or AdvancedEventSelectors.
* Employ a robust response helper with retries and short timeouts, and ensure all code paths call SUCCESS or FAILED.
* Upload full compliance findings to S3; return only a brief summary in the CloudFormation response.
* Expand validator IAM minimally to include describe and report-upload actions required by the checks.

## Prevention

* Keep audit mode as default until remediation SLAs and ownership are defined.
* Validate templates with cfn-lint and small test stacks before promoting to shared environments.
* Automate unit and integration tests to verify critical outputs, encryption, logging, and networking invariants after each change.
