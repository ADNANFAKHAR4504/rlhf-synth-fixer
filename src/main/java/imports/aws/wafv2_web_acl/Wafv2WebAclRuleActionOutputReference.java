package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.678Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclRuleActionOutputReference")
public class Wafv2WebAclRuleActionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Wafv2WebAclRuleActionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Wafv2WebAclRuleActionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Wafv2WebAclRuleActionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAllow(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionAllow value) {
        software.amazon.jsii.Kernel.call(this, "putAllow", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putBlock(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionBlock value) {
        software.amazon.jsii.Kernel.call(this, "putBlock", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCaptcha(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionCaptcha value) {
        software.amazon.jsii.Kernel.call(this, "putCaptcha", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putChallenge(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionChallenge value) {
        software.amazon.jsii.Kernel.call(this, "putChallenge", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCount(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionCount value) {
        software.amazon.jsii.Kernel.call(this, "putCount", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAllow() {
        software.amazon.jsii.Kernel.call(this, "resetAllow", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBlock() {
        software.amazon.jsii.Kernel.call(this, "resetBlock", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCaptcha() {
        software.amazon.jsii.Kernel.call(this, "resetCaptcha", software.amazon.jsii.NativeType.VOID);
    }

    public void resetChallenge() {
        software.amazon.jsii.Kernel.call(this, "resetChallenge", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCount() {
        software.amazon.jsii.Kernel.call(this, "resetCount", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionAllowOutputReference getAllow() {
        return software.amazon.jsii.Kernel.get(this, "allow", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionAllowOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionBlockOutputReference getBlock() {
        return software.amazon.jsii.Kernel.get(this, "block", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionBlockOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionCaptchaOutputReference getCaptcha() {
        return software.amazon.jsii.Kernel.get(this, "captcha", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionCaptchaOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionChallengeOutputReference getChallenge() {
        return software.amazon.jsii.Kernel.get(this, "challenge", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionChallengeOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionCountOutputReference getCount() {
        return software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionCountOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionAllow getAllowInput() {
        return software.amazon.jsii.Kernel.get(this, "allowInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionAllow.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionBlock getBlockInput() {
        return software.amazon.jsii.Kernel.get(this, "blockInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionBlock.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionCaptcha getCaptchaInput() {
        return software.amazon.jsii.Kernel.get(this, "captchaInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionCaptcha.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionChallenge getChallengeInput() {
        return software.amazon.jsii.Kernel.get(this, "challengeInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionChallenge.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionCount getCountInput() {
        return software.amazon.jsii.Kernel.get(this, "countInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionCount.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleAction getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleAction.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleAction value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
