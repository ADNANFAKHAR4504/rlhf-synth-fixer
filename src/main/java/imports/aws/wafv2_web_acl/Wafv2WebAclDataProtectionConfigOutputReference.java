package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.671Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclDataProtectionConfigOutputReference")
public class Wafv2WebAclDataProtectionConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Wafv2WebAclDataProtectionConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Wafv2WebAclDataProtectionConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Wafv2WebAclDataProtectionConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDataProtection(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfigDataProtection>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfigDataProtection> __cast_cd4240 = (java.util.List<imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfigDataProtection>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfigDataProtection __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putDataProtection", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDataProtection() {
        software.amazon.jsii.Kernel.call(this, "resetDataProtection", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfigDataProtectionList getDataProtection() {
        return software.amazon.jsii.Kernel.get(this, "dataProtection", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfigDataProtectionList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDataProtectionInput() {
        return software.amazon.jsii.Kernel.get(this, "dataProtectionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclDataProtectionConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
