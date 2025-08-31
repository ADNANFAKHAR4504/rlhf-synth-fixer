package imports.aws.fms_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.237Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fmsPolicy.FmsPolicySecurityServicePolicyDataPolicyOptionOutputReference")
public class FmsPolicySecurityServicePolicyDataPolicyOptionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FmsPolicySecurityServicePolicyDataPolicyOptionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FmsPolicySecurityServicePolicyDataPolicyOptionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public FmsPolicySecurityServicePolicyDataPolicyOptionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putNetworkAclCommonPolicy(final @org.jetbrains.annotations.NotNull imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putNetworkAclCommonPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkFirewallPolicy(final @org.jetbrains.annotations.NotNull imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkFirewallPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putNetworkFirewallPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putThirdPartyFirewallPolicy(final @org.jetbrains.annotations.NotNull imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putThirdPartyFirewallPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetNetworkAclCommonPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkAclCommonPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkFirewallPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkFirewallPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThirdPartyFirewallPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetThirdPartyFirewallPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyOutputReference getNetworkAclCommonPolicy() {
        return software.amazon.jsii.Kernel.get(this, "networkAclCommonPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkFirewallPolicyOutputReference getNetworkFirewallPolicy() {
        return software.amazon.jsii.Kernel.get(this, "networkFirewallPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkFirewallPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicyOutputReference getThirdPartyFirewallPolicy() {
        return software.amazon.jsii.Kernel.get(this, "thirdPartyFirewallPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy getNetworkAclCommonPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "networkAclCommonPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkFirewallPolicy getNetworkFirewallPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "networkFirewallPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkFirewallPolicy.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy getThirdPartyFirewallPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "thirdPartyFirewallPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionThirdPartyFirewallPolicy.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOption getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOption.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOption value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
