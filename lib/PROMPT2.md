I got the errors below from your first response:

```
aws:iam:RolePolicyAttachment stackset-admin-policy-attachment creating (2s) error:   sdk-v2/provider2.go:572: sdk.helper_schema: attaching IAM Policy (arn:aws:iam::aws:policy/service-role/AWSCloudFormationStackSetAdministrationRole) to IAM Role (AWSCloudFormationStackSetAdministrationRole): operation error IAM: AttachRolePolicy, https response error StatusCode: 404, RequestID: 46a3a628-224d-4f68-a02d-1fe269cedce6, NoSuchEntity: Policy arn:aws:iam::aws:policy/service-role/AWSCloudFormationStackSetAdministrationRole does not exist or is not attachable.: provider=aws@7.5.0
+  aws:iam:RolePolicyAttachment stackset-admin-policy-attachment creating (2s) error: 1 error occurred:
```