package imports.aws.networkfirewall_firewall_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.950Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallFirewallPolicy.NetworkfirewallFirewallPolicyFirewallPolicyOutputReference")
public class NetworkfirewallFirewallPolicyFirewallPolicyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected NetworkfirewallFirewallPolicyFirewallPolicyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected NetworkfirewallFirewallPolicyFirewallPolicyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public NetworkfirewallFirewallPolicyFirewallPolicyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putPolicyVariables(final @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables value) {
        software.amazon.jsii.Kernel.call(this, "putPolicyVariables", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStatefulEngineOptions(final @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions value) {
        software.amazon.jsii.Kernel.call(this, "putStatefulEngineOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStatefulRuleGroupReference(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference> __cast_cd4240 = (java.util.List<imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putStatefulRuleGroupReference", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStatelessCustomAction(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomAction>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomAction> __cast_cd4240 = (java.util.List<imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomAction>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomAction __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putStatelessCustomAction", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStatelessRuleGroupReference(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessRuleGroupReference>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessRuleGroupReference> __cast_cd4240 = (java.util.List<imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessRuleGroupReference>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessRuleGroupReference __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putStatelessRuleGroupReference", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetPolicyVariables() {
        software.amazon.jsii.Kernel.call(this, "resetPolicyVariables", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatefulDefaultActions() {
        software.amazon.jsii.Kernel.call(this, "resetStatefulDefaultActions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatefulEngineOptions() {
        software.amazon.jsii.Kernel.call(this, "resetStatefulEngineOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatefulRuleGroupReference() {
        software.amazon.jsii.Kernel.call(this, "resetStatefulRuleGroupReference", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatelessCustomAction() {
        software.amazon.jsii.Kernel.call(this, "resetStatelessCustomAction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatelessRuleGroupReference() {
        software.amazon.jsii.Kernel.call(this, "resetStatelessRuleGroupReference", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTlsInspectionConfigurationArn() {
        software.amazon.jsii.Kernel.call(this, "resetTlsInspectionConfigurationArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesOutputReference getPolicyVariables() {
        return software.amazon.jsii.Kernel.get(this, "policyVariables", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariablesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsOutputReference getStatefulEngineOptions() {
        return software.amazon.jsii.Kernel.get(this, "statefulEngineOptions", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReferenceList getStatefulRuleGroupReference() {
        return software.amazon.jsii.Kernel.get(this, "statefulRuleGroupReference", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReferenceList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionList getStatelessCustomAction() {
        return software.amazon.jsii.Kernel.get(this, "statelessCustomAction", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessRuleGroupReferenceList getStatelessRuleGroupReference() {
        return software.amazon.jsii.Kernel.get(this, "statelessRuleGroupReference", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessRuleGroupReferenceList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables getPolicyVariablesInput() {
        return software.amazon.jsii.Kernel.get(this, "policyVariablesInput", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyPolicyVariables.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getStatefulDefaultActionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "statefulDefaultActionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions getStatefulEngineOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "statefulEngineOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulEngineOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStatefulRuleGroupReferenceInput() {
        return software.amazon.jsii.Kernel.get(this, "statefulRuleGroupReferenceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStatelessCustomActionInput() {
        return software.amazon.jsii.Kernel.get(this, "statelessCustomActionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getStatelessDefaultActionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "statelessDefaultActionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getStatelessFragmentDefaultActionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "statelessFragmentDefaultActionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStatelessRuleGroupReferenceInput() {
        return software.amazon.jsii.Kernel.get(this, "statelessRuleGroupReferenceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTlsInspectionConfigurationArnInput() {
        return software.amazon.jsii.Kernel.get(this, "tlsInspectionConfigurationArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getStatefulDefaultActions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "statefulDefaultActions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setStatefulDefaultActions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "statefulDefaultActions", java.util.Objects.requireNonNull(value, "statefulDefaultActions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getStatelessDefaultActions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "statelessDefaultActions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setStatelessDefaultActions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "statelessDefaultActions", java.util.Objects.requireNonNull(value, "statelessDefaultActions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getStatelessFragmentDefaultActions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "statelessFragmentDefaultActions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setStatelessFragmentDefaultActions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "statelessFragmentDefaultActions", java.util.Objects.requireNonNull(value, "statelessFragmentDefaultActions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTlsInspectionConfigurationArn() {
        return software.amazon.jsii.Kernel.get(this, "tlsInspectionConfigurationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTlsInspectionConfigurationArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tlsInspectionConfigurationArn", java.util.Objects.requireNonNull(value, "tlsInspectionConfigurationArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicy getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicy.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicy value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
