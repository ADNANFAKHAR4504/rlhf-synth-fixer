package imports.aws.fms_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.237Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fmsPolicy.FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicyOutputReference")
public class FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetFirewallDeploymentModel() {
        software.amazon.jsii.Kernel.call(this, "resetFirewallDeploymentModel", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFirewallDeploymentModelInput() {
        return software.amazon.jsii.Kernel.get(this, "firewallDeploymentModelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFirewallDeploymentModel() {
        return software.amazon.jsii.Kernel.get(this, "firewallDeploymentModel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFirewallDeploymentModel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "firewallDeploymentModel", java.util.Objects.requireNonNull(value, "firewallDeploymentModel is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
