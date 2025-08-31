package imports.aws.networkfirewall_rule_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.955Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupRulesSourceOutputReference")
public class NetworkfirewallRuleGroupRuleGroupRulesSourceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected NetworkfirewallRuleGroupRuleGroupRulesSourceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected NetworkfirewallRuleGroupRuleGroupRulesSourceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public NetworkfirewallRuleGroupRuleGroupRulesSourceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putRulesSourceList(final @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct value) {
        software.amazon.jsii.Kernel.call(this, "putRulesSourceList", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStatefulRule(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule> __cast_cd4240 = (java.util.List<imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRule __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putStatefulRule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStatelessRulesAndCustomActions(final @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions value) {
        software.amazon.jsii.Kernel.call(this, "putStatelessRulesAndCustomActions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetRulesSourceList() {
        software.amazon.jsii.Kernel.call(this, "resetRulesSourceList", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRulesString() {
        software.amazon.jsii.Kernel.call(this, "resetRulesString", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatefulRule() {
        software.amazon.jsii.Kernel.call(this, "resetStatefulRule", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatelessRulesAndCustomActions() {
        software.amazon.jsii.Kernel.call(this, "resetStatelessRulesAndCustomActions", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStructOutputReference getRulesSourceList() {
        return software.amazon.jsii.Kernel.get(this, "rulesSourceList", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStructOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleList getStatefulRule() {
        return software.amazon.jsii.Kernel.get(this, "statefulRule", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatefulRuleList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsOutputReference getStatelessRulesAndCustomActions() {
        return software.amazon.jsii.Kernel.get(this, "statelessRulesAndCustomActions", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActionsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct getRulesSourceListInput() {
        return software.amazon.jsii.Kernel.get(this, "rulesSourceListInput", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceRulesSourceListStruct.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRulesStringInput() {
        return software.amazon.jsii.Kernel.get(this, "rulesStringInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStatefulRuleInput() {
        return software.amazon.jsii.Kernel.get(this, "statefulRuleInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions getStatelessRulesAndCustomActionsInput() {
        return software.amazon.jsii.Kernel.get(this, "statelessRulesAndCustomActionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSourceStatelessRulesAndCustomActions.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRulesString() {
        return software.amazon.jsii.Kernel.get(this, "rulesString", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRulesString(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rulesString", java.util.Objects.requireNonNull(value, "rulesString is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSource getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSource.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRulesSource value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
