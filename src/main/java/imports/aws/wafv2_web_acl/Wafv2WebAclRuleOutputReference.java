package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.679Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclRuleOutputReference")
public class Wafv2WebAclRuleOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Wafv2WebAclRuleOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Wafv2WebAclRuleOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Wafv2WebAclRuleOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putAction(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleAction value) {
        software.amazon.jsii.Kernel.call(this, "putAction", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCaptchaConfig(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleCaptchaConfig value) {
        software.amazon.jsii.Kernel.call(this, "putCaptchaConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putChallengeConfig(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleChallengeConfig value) {
        software.amazon.jsii.Kernel.call(this, "putChallengeConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOverrideAction(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideAction value) {
        software.amazon.jsii.Kernel.call(this, "putOverrideAction", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRuleLabel(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.wafv2_web_acl.Wafv2WebAclRuleRuleLabel>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.wafv2_web_acl.Wafv2WebAclRuleRuleLabel> __cast_cd4240 = (java.util.List<imports.aws.wafv2_web_acl.Wafv2WebAclRuleRuleLabel>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.wafv2_web_acl.Wafv2WebAclRuleRuleLabel __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRuleLabel", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVisibilityConfig(final @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleVisibilityConfig value) {
        software.amazon.jsii.Kernel.call(this, "putVisibilityConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAction() {
        software.amazon.jsii.Kernel.call(this, "resetAction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCaptchaConfig() {
        software.amazon.jsii.Kernel.call(this, "resetCaptchaConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetChallengeConfig() {
        software.amazon.jsii.Kernel.call(this, "resetChallengeConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOverrideAction() {
        software.amazon.jsii.Kernel.call(this, "resetOverrideAction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRuleLabel() {
        software.amazon.jsii.Kernel.call(this, "resetRuleLabel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatement() {
        software.amazon.jsii.Kernel.call(this, "resetStatement", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionOutputReference getAction() {
        return software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleActionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleCaptchaConfigOutputReference getCaptchaConfig() {
        return software.amazon.jsii.Kernel.get(this, "captchaConfig", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleCaptchaConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleChallengeConfigOutputReference getChallengeConfig() {
        return software.amazon.jsii.Kernel.get(this, "challengeConfig", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleChallengeConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideActionOutputReference getOverrideAction() {
        return software.amazon.jsii.Kernel.get(this, "overrideAction", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideActionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleRuleLabelList getRuleLabel() {
        return software.amazon.jsii.Kernel.get(this, "ruleLabel", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleRuleLabelList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getStatementInput() {
        return software.amazon.jsii.Kernel.get(this, "statementInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_web_acl.Wafv2WebAclRuleVisibilityConfigOutputReference getVisibilityConfig() {
        return software.amazon.jsii.Kernel.get(this, "visibilityConfig", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleVisibilityConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleAction getActionInput() {
        return software.amazon.jsii.Kernel.get(this, "actionInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleAction.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleCaptchaConfig getCaptchaConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "captchaConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleCaptchaConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleChallengeConfig getChallengeConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "challengeConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleChallengeConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideAction getOverrideActionInput() {
        return software.amazon.jsii.Kernel.get(this, "overrideActionInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleOverrideAction.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPriorityInput() {
        return software.amazon.jsii.Kernel.get(this, "priorityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRuleLabelInput() {
        return software.amazon.jsii.Kernel.get(this, "ruleLabelInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleVisibilityConfig getVisibilityConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "visibilityConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleVisibilityConfig.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPriority() {
        return software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPriority(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "priority", java.util.Objects.requireNonNull(value, "priority is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getStatement() {
        return software.amazon.jsii.Kernel.get(this, "statement", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setStatement(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        software.amazon.jsii.Kernel.set(this, "statement", java.util.Objects.requireNonNull(value, "statement is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRule value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
