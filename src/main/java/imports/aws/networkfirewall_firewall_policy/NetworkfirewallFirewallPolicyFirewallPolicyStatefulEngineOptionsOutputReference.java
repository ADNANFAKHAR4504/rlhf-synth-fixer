package imports.aws.networkfirewall_firewall_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.951Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallFirewallPolicy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsOutputReference")
public class NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putFlowTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putFlowTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetFlowTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetFlowTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRuleOrder() {
        software.amazon.jsii.Kernel.call(this, "resetRuleOrder", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStreamExceptionPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetStreamExceptionPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeoutsOutputReference getFlowTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "flowTimeouts", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts getFlowTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "flowTimeoutsInput", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRuleOrderInput() {
        return software.amazon.jsii.Kernel.get(this, "ruleOrderInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStreamExceptionPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "streamExceptionPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRuleOrder() {
        return software.amazon.jsii.Kernel.get(this, "ruleOrder", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRuleOrder(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ruleOrder", java.util.Objects.requireNonNull(value, "ruleOrder is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStreamExceptionPolicy() {
        return software.amazon.jsii.Kernel.get(this, "streamExceptionPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStreamExceptionPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "streamExceptionPolicy", java.util.Objects.requireNonNull(value, "streamExceptionPolicy is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
