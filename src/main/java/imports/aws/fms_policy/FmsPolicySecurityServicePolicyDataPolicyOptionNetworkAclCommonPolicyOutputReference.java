package imports.aws.fms_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.237Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fmsPolicy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyOutputReference")
public class FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putNetworkAclEntrySet(final @org.jetbrains.annotations.NotNull imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet value) {
        software.amazon.jsii.Kernel.call(this, "putNetworkAclEntrySet", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetNetworkAclEntrySet() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkAclEntrySet", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetOutputReference getNetworkAclEntrySet() {
        return software.amazon.jsii.Kernel.get(this, "networkAclEntrySet", software.amazon.jsii.NativeType.forClass(imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet getNetworkAclEntrySetInput() {
        return software.amazon.jsii.Kernel.get(this, "networkAclEntrySetInput", software.amazon.jsii.NativeType.forClass(imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
