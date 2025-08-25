our last fix worked, but deployment still failed with a new error:

```
+  aws:cloudformation:StackSetInstance stackset-instance-123456789013-eu-west-1 creating (11s) error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating CloudFormation StackSet (multi-region-web-app-stackset) Instance: waiting for completion: unexpected state 'FAILED', wanted target 'SUCCEEDED'. last error: Account (123456789013), Region (eu-west-1), FAILED: Account 123456789013 should have 'AWSCloudFormationStackSetExecutionRole' role with trust relationship to Role 'AWSCloudFormationStackSetAdministrationRole'.: provider=aws@7.5.0
 +  aws:cloudformation:StackSetInstance stackset-instance-123456789013-eu-west-1 creating (11s) error: 1 error occurred:
 +  aws:cloudformation:StackSetInstance stackset-instance-123456789013-eu-west-1 **creating failed** error: 1 error occurred:
@ updating......
 +  aws:cloudformation:StackSetInstance stackset-instance-123456789012-us-east-1 creating (13s) error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating CloudFormation StackSet (multi-region-web-app-stackset) Instance: waiting for completion: unexpected state 'FAILED', wanted target 'SUCCEEDED'. last error: Account (123456789012), Region (us-east-1), FAILED: Account 123456789012 should have 'AWSCloudFormationStackSetExecutionRole' role with trust relationship to Role 'AWSCloudFormationStackSetAdministrationRole'.: provider=aws@7.5.0
 +  aws:cloudformation:StackSetInstance stackset-instance-123456789012-us-east-1 creating (13s) error: 1 error occurred:
 +  aws:cloudformation:StackSetInstance stackset-instance-123456789012-us-east-1 **creating failed** error: 1 error occurred:
@ updating.....
 +  aws:cloudformation:StackSetInstance stackset-instance-123456789012-us-west-2 creating (16s) error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating CloudFormation StackSet (multi-region-web-app-stackset) Instance: waiting for completion: unexpected state 'FAILED', wanted target 'SUCCEEDED'. last error: Account (123456789012), Region (us-west-2), FAILED: Account 123456789012 should have 'AWSCloudFormationStackSetExecutionRole' role with trust relationship to Role 'AWSCloudFormationStackSetAdministrationRole'.: provider=aws@7.5.0
 +  aws:cloudformation:StackSetInstance stackset-instance-123456789012-us-west-2 creating (16s) error: 1 error occurred:
 +  aws:cloudformation:StackSetInstance stackset-instance-123456789012-us-west-2 **creating failed** error: 1 error occurred:
@ updating..........
 +  aws:cloudformation:StackSetInstance stackset-instance-123456789012-eu-west-1 creating (22s) error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating CloudFormation StackSet (multi-region-web-app-stackset) Instance: waiting for completion: unexpected state 'FAILED', wanted target 'SUCCEEDED'. last error: Account (123456789012), Region (eu-west-1), FAILED: Account 123456789012 should have 'AWSCloudFormationStackSetExecutionRole' role with trust relationship to Role 'AWSCloudFormationStackSetAdministrationRole'.: provider=aws@7.5.0
 +  aws:cloudformation:StackSetInstance stackset-instance-123456789012-eu-west-1 creating (22s) error: 1 error occurred:
 +  aws:cloudformation:StackSetInstance stackset-instance-123456789012-eu-west-1 **creating failed** error: 1 error occurred:
@ updating.........
 +  aws:cloudformation:StackSetInstance stackset-instance-123456789013-us-east-1 creating (28s) error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating CloudFormation StackSet (multi-region-web-app-stackset) Instance: waiting for completion: unexpected state 'FAILED', wanted target 'SUCCEEDED'. last error: Account (123456789013), Region (us-east-1), FAILED: Account 123456789013 should have 'AWSCloudFormationStackSetExecutionRole' role with trust relationship to Role 'AWSCloudFormationStackSetAdministrationRole'.: provider=aws@7.5.0
 +  aws:cloudformation:StackSetInstance stackset-instance-123456789013-us-east-1 creating (28s) error: 1 error occurred:
 +  aws:cloudformation:StackSetInstance stackset-instance-123456789013-us-east-1 **creating failed** error: 1 error occurred:
@ updating.......
 +  aws:cloudformation:StackSetInstance stackset-instance-123456789013-us-west-2 creating (32s) error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating CloudFormation StackSet (multi-region-web-app-stackset) Instance: waiting for completion: unexpected state 'FAILED', wanted target 'SUCCEEDED'. last error: Account (123456789013), Region (us-west-2), FAILED: Account 123456789013 should have 'AWSCloudFormationStackSetExecutionRole' role with trust relationship to Role 'AWSCloudFormationStackSetAdministrationRole'.: provider=aws@7.5.0
 +  aws:cloudformation:StackSetInstance stackset-instance-123456789013-us-west-2 creating (32s) error: 1 error occurred:
 +  aws:cloudformation:StackSetInstance stackset-instance-123456789013-us-west-2 **creating failed** error: 1 error occurred:
    pulumi:pulumi:Stack TapStack-TapStackpr2140 running error: update failed
    pulumi:pulumi:Stack TapStack-TapStackpr2140 **failed** 1 error
    custom:aws:WebApplicationStackSet web-app-stackset  
    custom:aws:ObservabilityDashboard web-app-dashboard  
    custom:aws:IAMRoles stackset-iam-roles  
Diagnostics:
  aws:cloudformation:StackSetInstance (stackset-instance-123456789013-us-west-2):
    error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating CloudFormation StackSet (multi-region-web-app-stackset) Instance: waiting for completion: unexpected state 'FAILED', wanted target 'SUCCEEDED'. last error: Account (123456789013), Region (us-west-2), FAILED: Account 123456789013 should have 'AWSCloudFormationStackSetExecutionRole' role with trust relationship to Role 'AWSCloudFormationStackSetAdministrationRole'.: provider=aws@7.5.0
    error: 1 error occurred:
    	* creating urn:pulumi:TapStackpr2140::TapStack::custom:aws:WebApplicationStackSet$aws:cloudformation/stackSetInstance:StackSetInstance::stackset-instance-123456789013-us-west-2: 1 error occurred:
    	* creating CloudFormation StackSet (multi-region-web-app-stackset) Instance: waiting for completion: unexpected state 'FAILED', wanted target 'SUCCEEDED'. last error: Account (123456789013), Region (us-west-2), FAILED: Account 123456789013 should have 'AWSCloudFormationStackSetExecutionRole' role with trust relationship to Role 'AWSCloudFormationStackSetAdministrationRole'.
  aws:cloudformation:StackSetInstance (stackset-instance-123456789013-us-east-1):
    error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating CloudFormation StackSet (multi-region-web-app-stackset) Instance: waiting for completion: unexpected state 'FAILED', wanted target 'SUCCEEDED'. last error: Account (123456789013), Region (us-east-1), FAILED: Account 123456789013 should have 'AWSCloudFormationStackSetExecutionRole' role with trust relationship to Role 'AWSCloudFormationStackSetAdministrationRole'.: provider=aws@7.5.0
    error: 1 error occurred:
    	* creating urn:pulumi:TapStackpr2140::TapStack::custom:aws:WebApplicationStackSet$aws:cloudformation/stackSetInstance:StackSetInstance::stackset-instance-123456789013-us-east-1: 1 error occurred:
    	* creating CloudFormation StackSet (multi-region-web-app-stackset) Instance: waiting for completion: unexpected state 'FAILED', wanted target 'SUCCEEDED'. last error: Account (123456789013), Region (us-east-1), FAILED: Account 123456789013 should have 'AWSCloudFormationStackSetExecutionRole' role with trust relationship to Role 'AWSCloudFormationStackSetAdministrationRole'.
  aws:cloudformation:StackSetInstance (stackset-instance-123456789013-eu-west-1):
    error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating CloudFormation StackSet (multi-region-web-app-stackset) Instance: waiting for completion: unexpected state 'FAILED', wanted target 'SUCCEEDED'. last error: Account (123456789013), Region (eu-west-1), FAILED: Account 123456789013 should have 'AWSCloudFormationStackSetExecutionRole' role with trust relationship to Role 'AWSCloudFormationStackSetAdministrationRole'.: provider=aws@7.5.0
    error: 1 error occurred:
    	* creating urn:pulumi:TapStackpr2140::TapStack::custom:aws:WebApplicationStackSet$aws:cloudformation/stackSetInstance:StackSetInstance::stackset-instance-123456789013-eu-west-1: 1 error occurred:
    	* creating CloudFormation StackSet (multi-region-web-app-stackset) Instance: waiting for completion: unexpected state 'FAILED', wanted target 'SUCCEEDED'. last error: Account (123456789013), Region (eu-west-1), FAILED: Account 123456789013 should have 'AWSCloudFormationStackSetExecutionRole' role with trust relationship to Role 'AWSCloudFormationStackSetAdministrationRole'.
  aws:cloudformation:StackSetInstance (stackset-instance-123456789012-eu-west-1):
    error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating CloudFormation StackSet (multi-region-web-app-stackset) Instance: waiting for completion: unexpected state 'FAILED', wanted target 'SUCCEEDED'. last error: Account (123456789012), Region (eu-west-1), FAILED: Account 123456789012 should have 'AWSCloudFormationStackSetExecutionRole' role with trust relationship to Role 'AWSCloudFormationStackSetAdministrationRole'.: provider=aws@7.5.0
    error: 1 error occurred:
    	* creating urn:pulumi:TapStackpr2140::TapStack::custom:aws:WebApplicationStackSet$aws:cloudformation/stackSetInstance:StackSetInstance::stackset-instance-123456789012-eu-west-1: 1 error occurred:
    	* creating CloudFormation StackSet (multi-region-web-app-stackset) Instance: waiting for completion: unexpected state 'FAILED', wanted target 'SUCCEEDED'. last error: Account (123456789012), Region (eu-west-1), FAILED: Account 123456789012 should have 'AWSCloudFormationStackSetExecutionRole' role with trust relationship to Role 'AWSCloudFormationStackSetAdministrationRole'.
  aws:cloudformation:StackSetInstance (stackset-instance-123456789012-us-east-1):
    error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating CloudFormation StackSet (multi-region-web-app-stackset) Instance: waiting for completion: unexpected state 'FAILED', wanted target 'SUCCEEDED'. last error: Account (123456789012), Region (us-east-1), FAILED: Account 123456789012 should have 'AWSCloudFormationStackSetExecutionRole' role with trust relationship to Role 'AWSCloudFormationStackSetAdministrationRole'.: provider=aws@7.5.0
    error: 1 error occurred:
    	* creating urn:pulumi:TapStackpr2140::TapStack::custom:aws:WebApplicationStackSet$aws:cloudformation/stackSetInstance:StackSetInstance::stackset-instance-123456789012-us-east-1: 1 error occurred:
    	* creating CloudFormation StackSet (multi-region-web-app-stackset) Instance: waiting for completion: unexpected state 'FAILED', wanted target 'SUCCEEDED'. last error: Account (123456789012), Region (us-east-1), FAILED: Account 123456789012 should have 'AWSCloudFormationStackSetExecutionRole' role with trust relationship to Role 'AWSCloudFormationStackSetAdministrationRole'.
  aws:cloudformation:StackSetInstance (stackset-instance-123456789012-us-west-2):
    error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating CloudFormation StackSet (multi-region-web-app-stackset) Instance: waiting for completion: unexpected state 'FAILED', wanted target 'SUCCEEDED'. last error: Account (123456789012), Region (us-west-2), FAILED: Account 123456789012 should have 'AWSCloudFormationStackSetExecutionRole' role with trust relationship to Role 'AWSCloudFormationStackSetAdministrationRole'.: provider=aws@7.5.0
    error: 1 error occurred:
    	* creating urn:pulumi:TapStackpr2140::TapStack::custom:aws:WebApplicationStackSet$aws:cloudformation/stackSetInstance:StackSetInstance::stackset-instance-123456789012-us-west-2: 1 error occurred:
    	* creating CloudFormation StackSet (multi-region-web-app-stackset) Instance: waiting for completion: unexpected state 'FAILED', wanted target 'SUCCEEDED'. last error: Account (123456789012), Region (us-west-2), FAILED: Account 123456789012 should have 'AWSCloudFormationStackSetExecutionRole' role with trust relationship to Role 'AWSCloudFormationStackSetAdministrationRole'.
  pulumi:pulumi:Stack (TapStack-TapStackpr2140):
```