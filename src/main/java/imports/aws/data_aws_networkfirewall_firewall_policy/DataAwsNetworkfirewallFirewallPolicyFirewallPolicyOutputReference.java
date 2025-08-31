package imports.aws.data_aws_networkfirewall_firewall_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.770Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsNetworkfirewallFirewallPolicy.DataAwsNetworkfirewallFirewallPolicyFirewallPolicyOutputReference")
public class DataAwsNetworkfirewallFirewallPolicyFirewallPolicyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsNetworkfirewallFirewallPolicyFirewallPolicyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsNetworkfirewallFirewallPolicyFirewallPolicyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsNetworkfirewallFirewallPolicyFirewallPolicyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_networkfirewall_firewall_policy.DataAwsNetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesList getPolicyVariables() {
        return software.amazon.jsii.Kernel.get(this, "policyVariables", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_networkfirewall_firewall_policy.DataAwsNetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesList.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getStatefulDefaultActions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "statefulDefaultActions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_networkfirewall_firewall_policy.DataAwsNetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsList getStatefulEngineOptions() {
        return software.amazon.jsii.Kernel.get(this, "statefulEngineOptions", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_networkfirewall_firewall_policy.DataAwsNetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_networkfirewall_firewall_policy.DataAwsNetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReferenceList getStatefulRuleGroupReference() {
        return software.amazon.jsii.Kernel.get(this, "statefulRuleGroupReference", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_networkfirewall_firewall_policy.DataAwsNetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReferenceList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_networkfirewall_firewall_policy.DataAwsNetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionList getStatelessCustomAction() {
        return software.amazon.jsii.Kernel.get(this, "statelessCustomAction", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_networkfirewall_firewall_policy.DataAwsNetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionList.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getStatelessDefaultActions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "statelessDefaultActions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getStatelessFragmentDefaultActions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "statelessFragmentDefaultActions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_networkfirewall_firewall_policy.DataAwsNetworkfirewallFirewallPolicyFirewallPolicyStatelessRuleGroupReferenceList getStatelessRuleGroupReference() {
        return software.amazon.jsii.Kernel.get(this, "statelessRuleGroupReference", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_networkfirewall_firewall_policy.DataAwsNetworkfirewallFirewallPolicyFirewallPolicyStatelessRuleGroupReferenceList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTlsInspectionConfigurationArn() {
        return software.amazon.jsii.Kernel.get(this, "tlsInspectionConfigurationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_networkfirewall_firewall_policy.DataAwsNetworkfirewallFirewallPolicyFirewallPolicy getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_networkfirewall_firewall_policy.DataAwsNetworkfirewallFirewallPolicyFirewallPolicy.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_networkfirewall_firewall_policy.DataAwsNetworkfirewallFirewallPolicyFirewallPolicy value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
