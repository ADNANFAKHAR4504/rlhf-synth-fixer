package imports.aws.networkfirewall_firewall_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.951Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallFirewallPolicy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReferenceOverrideOutputReference")
public class NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReferenceOverrideOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReferenceOverrideOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReferenceOverrideOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReferenceOverrideOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAction() {
        software.amazon.jsii.Kernel.call(this, "resetAction", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getActionInput() {
        return software.amazon.jsii.Kernel.get(this, "actionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAction() {
        return software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAction(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "action", java.util.Objects.requireNonNull(value, "action is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReferenceOverride getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReferenceOverride.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReferenceOverride value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
