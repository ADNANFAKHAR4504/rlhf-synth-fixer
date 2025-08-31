package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.672Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclDefaultActionOutputReference")
public class Wafv2WebAclDefaultActionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Wafv2WebAclDefaultActionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Wafv2WebAclDefaultActionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Wafv2WebAclDefaultActionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAllow(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclDefaultActionAllow value) {
        software.amazon.jsii.Kernel.call(this, "putAllow", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putBlock(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclDefaultActionBlock value) {
        software.amazon.jsii.Kernel.call(this, "putBlock", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAllow() {
        software.amazon.jsii.Kernel.call(this, "resetAllow", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBlock() {
        software.amazon.jsii.Kernel.call(this, "resetBlock", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclDefaultActionAllowOutputReference getAllow() {
        return software.amazon.jsii.Kernel.get(this, "allow", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclDefaultActionAllowOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclDefaultActionBlockOutputReference getBlock() {
        return software.amazon.jsii.Kernel.get(this, "block", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclDefaultActionBlockOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclDefaultActionAllow getAllowInput() {
        return software.amazon.jsii.Kernel.get(this, "allowInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclDefaultActionAllow.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclDefaultActionBlock getBlockInput() {
        return software.amazon.jsii.Kernel.get(this, "blockInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclDefaultActionBlock.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclDefaultAction getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclDefaultAction.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclDefaultAction value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
