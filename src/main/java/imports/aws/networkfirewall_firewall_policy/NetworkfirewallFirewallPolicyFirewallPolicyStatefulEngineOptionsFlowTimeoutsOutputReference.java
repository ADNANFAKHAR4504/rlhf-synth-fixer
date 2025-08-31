package imports.aws.networkfirewall_firewall_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.951Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallFirewallPolicy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeoutsOutputReference")
public class NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeoutsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeoutsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeoutsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeoutsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetTcpIdleTimeoutSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetTcpIdleTimeoutSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTcpIdleTimeoutSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "tcpIdleTimeoutSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTcpIdleTimeoutSeconds() {
        return software.amazon.jsii.Kernel.get(this, "tcpIdleTimeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTcpIdleTimeoutSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "tcpIdleTimeoutSeconds", java.util.Objects.requireNonNull(value, "tcpIdleTimeoutSeconds is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsFlowTimeouts value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
