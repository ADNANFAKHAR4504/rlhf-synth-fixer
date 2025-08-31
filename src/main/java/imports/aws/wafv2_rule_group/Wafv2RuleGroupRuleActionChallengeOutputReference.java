package imports.aws.wafv2_rule_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.668Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionChallengeOutputReference")
public class Wafv2RuleGroupRuleActionChallengeOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Wafv2RuleGroupRuleActionChallengeOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Wafv2RuleGroupRuleActionChallengeOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Wafv2RuleGroupRuleActionChallengeOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCustomRequestHandling(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionChallengeCustomRequestHandling value) {
        software.amazon.jsii.Kernel.call(this, "putCustomRequestHandling", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCustomRequestHandling() {
        software.amazon.jsii.Kernel.call(this, "resetCustomRequestHandling", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingOutputReference getCustomRequestHandling() {
        return software.amazon.jsii.Kernel.get(this, "customRequestHandling", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionChallengeCustomRequestHandlingOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionChallengeCustomRequestHandling getCustomRequestHandlingInput() {
        return software.amazon.jsii.Kernel.get(this, "customRequestHandlingInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionChallengeCustomRequestHandling.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionChallenge getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionChallenge.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionChallenge value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
