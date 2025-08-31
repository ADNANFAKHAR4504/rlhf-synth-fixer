package imports.aws.config_config_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.369Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configConfigRule.ConfigConfigRuleSourceOutputReference")
public class ConfigConfigRuleSourceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ConfigConfigRuleSourceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ConfigConfigRuleSourceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ConfigConfigRuleSourceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCustomPolicyDetails(final @org.jetbrains.annotations.NotNull imports.aws.config_config_rule.ConfigConfigRuleSourceCustomPolicyDetails value) {
        software.amazon.jsii.Kernel.call(this, "putCustomPolicyDetails", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSourceDetail(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.config_config_rule.ConfigConfigRuleSourceSourceDetail>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.config_config_rule.ConfigConfigRuleSourceSourceDetail> __cast_cd4240 = (java.util.List<imports.aws.config_config_rule.ConfigConfigRuleSourceSourceDetail>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.config_config_rule.ConfigConfigRuleSourceSourceDetail __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSourceDetail", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCustomPolicyDetails() {
        software.amazon.jsii.Kernel.call(this, "resetCustomPolicyDetails", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceDetail() {
        software.amazon.jsii.Kernel.call(this, "resetSourceDetail", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetSourceIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.config_config_rule.ConfigConfigRuleSourceCustomPolicyDetailsOutputReference getCustomPolicyDetails() {
        return software.amazon.jsii.Kernel.get(this, "customPolicyDetails", software.amazon.jsii.NativeType.forClass(imports.aws.config_config_rule.ConfigConfigRuleSourceCustomPolicyDetailsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.config_config_rule.ConfigConfigRuleSourceSourceDetailList getSourceDetail() {
        return software.amazon.jsii.Kernel.get(this, "sourceDetail", software.amazon.jsii.NativeType.forClass(imports.aws.config_config_rule.ConfigConfigRuleSourceSourceDetailList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.config_config_rule.ConfigConfigRuleSourceCustomPolicyDetails getCustomPolicyDetailsInput() {
        return software.amazon.jsii.Kernel.get(this, "customPolicyDetailsInput", software.amazon.jsii.NativeType.forClass(imports.aws.config_config_rule.ConfigConfigRuleSourceCustomPolicyDetails.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOwnerInput() {
        return software.amazon.jsii.Kernel.get(this, "ownerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSourceDetailInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceDetailInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOwner() {
        return software.amazon.jsii.Kernel.get(this, "owner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOwner(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "owner", java.util.Objects.requireNonNull(value, "owner is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "sourceIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceIdentifier", java.util.Objects.requireNonNull(value, "sourceIdentifier is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.config_config_rule.ConfigConfigRuleSource getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.config_config_rule.ConfigConfigRuleSource.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.config_config_rule.ConfigConfigRuleSource value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
