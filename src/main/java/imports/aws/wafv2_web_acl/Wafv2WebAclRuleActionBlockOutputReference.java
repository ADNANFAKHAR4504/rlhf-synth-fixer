package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.677Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclRuleActionBlockOutputReference")
public class Wafv2WebAclRuleActionBlockOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Wafv2WebAclRuleActionBlockOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Wafv2WebAclRuleActionBlockOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Wafv2WebAclRuleActionBlockOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCustomResponse(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionBlockCustomResponse value) {
        software.amazon.jsii.Kernel.call(this, "putCustomResponse", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCustomResponse() {
        software.amazon.jsii.Kernel.call(this, "resetCustomResponse", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionBlockCustomResponseOutputReference getCustomResponse() {
        return software.amazon.jsii.Kernel.get(this, "customResponse", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionBlockCustomResponseOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionBlockCustomResponse getCustomResponseInput() {
        return software.amazon.jsii.Kernel.get(this, "customResponseInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionBlockCustomResponse.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionBlock getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionBlock.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionBlock value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
