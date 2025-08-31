package imports.aws.wafv2_rule_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.667Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2RuleGroup.Wafv2RuleGroupRuleActionAllowCustomRequestHandlingOutputReference")
public class Wafv2RuleGroupRuleActionAllowCustomRequestHandlingOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Wafv2RuleGroupRuleActionAllowCustomRequestHandlingOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Wafv2RuleGroupRuleActionAllowCustomRequestHandlingOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Wafv2RuleGroupRuleActionAllowCustomRequestHandlingOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putInsertHeader(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader> __cast_cd4240 = (java.util.List<imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeader __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putInsertHeader", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeaderList getInsertHeader() {
        return software.amazon.jsii.Kernel.get(this, "insertHeader", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionAllowCustomRequestHandlingInsertHeaderList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInsertHeaderInput() {
        return software.amazon.jsii.Kernel.get(this, "insertHeaderInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionAllowCustomRequestHandling getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionAllowCustomRequestHandling.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.wafv2_rule_group.Wafv2RuleGroupRuleActionAllowCustomRequestHandling value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
