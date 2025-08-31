package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.677Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclRuleActionBlockCustomResponseOutputReference")
public class Wafv2WebAclRuleActionBlockCustomResponseOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Wafv2WebAclRuleActionBlockCustomResponseOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Wafv2WebAclRuleActionBlockCustomResponseOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Wafv2WebAclRuleActionBlockCustomResponseOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putResponseHeader(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionBlockCustomResponseResponseHeader>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionBlockCustomResponseResponseHeader> __cast_cd4240 = (java.util.List<imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionBlockCustomResponseResponseHeader>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionBlockCustomResponseResponseHeader __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResponseHeader", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCustomResponseBodyKey() {
        software.amazon.jsii.Kernel.call(this, "resetCustomResponseBodyKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResponseHeader() {
        software.amazon.jsii.Kernel.call(this, "resetResponseHeader", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionBlockCustomResponseResponseHeaderList getResponseHeader() {
        return software.amazon.jsii.Kernel.get(this, "responseHeader", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionBlockCustomResponseResponseHeaderList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomResponseBodyKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "customResponseBodyKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getResponseCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "responseCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResponseHeaderInput() {
        return software.amazon.jsii.Kernel.get(this, "responseHeaderInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomResponseBodyKey() {
        return software.amazon.jsii.Kernel.get(this, "customResponseBodyKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomResponseBodyKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customResponseBodyKey", java.util.Objects.requireNonNull(value, "customResponseBodyKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getResponseCode() {
        return software.amazon.jsii.Kernel.get(this, "responseCode", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setResponseCode(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "responseCode", java.util.Objects.requireNonNull(value, "responseCode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionBlockCustomResponse getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionBlockCustomResponse.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionBlockCustomResponse value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
