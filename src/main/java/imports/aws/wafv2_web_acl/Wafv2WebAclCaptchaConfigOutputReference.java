package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.670Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclCaptchaConfigOutputReference")
public class Wafv2WebAclCaptchaConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Wafv2WebAclCaptchaConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Wafv2WebAclCaptchaConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Wafv2WebAclCaptchaConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putImmunityTimeProperty(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclCaptchaConfigImmunityTimeProperty value) {
        software.amazon.jsii.Kernel.call(this, "putImmunityTimeProperty", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetImmunityTimeProperty() {
        software.amazon.jsii.Kernel.call(this, "resetImmunityTimeProperty", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclCaptchaConfigImmunityTimePropertyOutputReference getImmunityTimeProperty() {
        return software.amazon.jsii.Kernel.get(this, "immunityTimeProperty", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclCaptchaConfigImmunityTimePropertyOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclCaptchaConfigImmunityTimeProperty getImmunityTimePropertyInput() {
        return software.amazon.jsii.Kernel.get(this, "immunityTimePropertyInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclCaptchaConfigImmunityTimeProperty.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclCaptchaConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclCaptchaConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclCaptchaConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
