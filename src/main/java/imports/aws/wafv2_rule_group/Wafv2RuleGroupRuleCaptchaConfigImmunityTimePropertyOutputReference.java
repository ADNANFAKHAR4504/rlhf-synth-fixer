package imports.aws.wafv2_rule_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.669Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2RuleGroup.Wafv2RuleGroupRuleCaptchaConfigImmunityTimePropertyOutputReference")
public class Wafv2RuleGroupRuleCaptchaConfigImmunityTimePropertyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Wafv2RuleGroupRuleCaptchaConfigImmunityTimePropertyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Wafv2RuleGroupRuleCaptchaConfigImmunityTimePropertyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Wafv2RuleGroupRuleCaptchaConfigImmunityTimePropertyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetImmunityTime() {
        software.amazon.jsii.Kernel.call(this, "resetImmunityTime", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getImmunityTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "immunityTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getImmunityTime() {
        return software.amazon.jsii.Kernel.get(this, "immunityTime", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setImmunityTime(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "immunityTime", java.util.Objects.requireNonNull(value, "immunityTime is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleCaptchaConfigImmunityTimeProperty getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleCaptchaConfigImmunityTimeProperty.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleCaptchaConfigImmunityTimeProperty value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
