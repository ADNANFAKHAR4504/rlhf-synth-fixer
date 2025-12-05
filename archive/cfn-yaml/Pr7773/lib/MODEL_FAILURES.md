# model_failure

## Known failure modes addressed

* **ALB log delivery denied** if the bucket policy lacks the `logdelivery.elasticloadbalancing.amazonaws.com` principal or correct prefix. Fixed by explicit principal and prefix in the logs bucket policy, plus ownership controls.
* **CreateSet early validation failures** due to explicit names colliding with retained resources. Avoided by allowing CloudFormation to generate physical names.
* **Custom resource hangs** caused by `cfnresponse` absence or unhandled exceptions. Eliminated by implementing the CloudFormation response protocol inline on Python 3.12 and adding defensive error handling.

## Residual risks and how to mitigate

* **Email subscription pending**: If an alarm email is supplied, alerts do not fire until the subscription is confirmed. Mitigation: confirm the SNS email promptly.
* **KMS permissions drift**: Organization-level or SCP policies can still block KMS usage. Mitigation: review SCPs and KMS key policies if encryption errors surface.
* **External rotation Lambda**: If you enable rotation but provide an invalid ARN or insufficient permissions, rotation will fail. Mitigation: supply a tested rotation Lambda ARN or leave rotation disabled.
* **Regional service constraints**: Some managed rule groups or service features differ by region. Mitigation: deploy in regions where all selected features are supported.

## Operational considerations

* **Deletion protection on RDS** prevents accidental teardown during stack deletes. Intentionally disable if you need ephemeral environments.
* **Retain policy on logs bucket** preserves evidence and may block full stack deletion. Plan lifecycle and manual cleanup accordingly.
* **ASG health checks** rely on `/health`. If your AMI or user data does not expose this path, targets may flap. Adjust application bootstrap or health path as needed.

## What would cause failures outside this template

* **Account-wide guardrails** such as SCPs that deny required actions or principals.
* **Quotas** on EIPs, NAT gateways, or ALB per region.
* **Conflicting resources** manually created with the same subnets, routing, or security groups modified by out-of-band automation.

## Recovery steps if a failure occurs

* Inspect CloudFormation stack events to identify the logical resource and error text.
* For custom resources, open the Lambda’s recent CloudWatch Logs stream for the precise exception reason emitted by the handler.
* For ALB logging issues, verify the logs bucket policy and test by issuing requests through the ALB; check for new log objects under the expected prefix.
* For AWS Config, call `DescribeConfigurationRecorderStatus` and ensure `recording=true`; if not, review IAM role trust, permissions, and the delivery channel’s S3 access.
* For KMS-related errors, confirm the key policy contains the service principals shown in the template and no SCP blocks `kms:*` actions required for encryption.
