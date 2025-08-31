package imports.aws.customerprofiles_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.403Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingOutputReference")
public class CustomerprofilesDomainRuleBasedMatchingOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CustomerprofilesDomainRuleBasedMatchingOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CustomerprofilesDomainRuleBasedMatchingOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CustomerprofilesDomainRuleBasedMatchingOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAttributeTypesSelector(final @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector value) {
        software.amazon.jsii.Kernel.call(this, "putAttributeTypesSelector", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putConflictResolution(final @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingConflictResolution value) {
        software.amazon.jsii.Kernel.call(this, "putConflictResolution", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putExportingConfig(final @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingExportingConfig value) {
        software.amazon.jsii.Kernel.call(this, "putExportingConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMatchingRules(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingMatchingRules>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingMatchingRules> __cast_cd4240 = (java.util.List<imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingMatchingRules>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingMatchingRules __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putMatchingRules", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAttributeTypesSelector() {
        software.amazon.jsii.Kernel.call(this, "resetAttributeTypesSelector", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConflictResolution() {
        software.amazon.jsii.Kernel.call(this, "resetConflictResolution", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExportingConfig() {
        software.amazon.jsii.Kernel.call(this, "resetExportingConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMatchingRules() {
        software.amazon.jsii.Kernel.call(this, "resetMatchingRules", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxAllowedRuleLevelForMatching() {
        software.amazon.jsii.Kernel.call(this, "resetMaxAllowedRuleLevelForMatching", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxAllowedRuleLevelForMerging() {
        software.amazon.jsii.Kernel.call(this, "resetMaxAllowedRuleLevelForMerging", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatus() {
        software.amazon.jsii.Kernel.call(this, "resetStatus", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelectorOutputReference getAttributeTypesSelector() {
        return software.amazon.jsii.Kernel.get(this, "attributeTypesSelector", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelectorOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingConflictResolutionOutputReference getConflictResolution() {
        return software.amazon.jsii.Kernel.get(this, "conflictResolution", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingConflictResolutionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingExportingConfigOutputReference getExportingConfig() {
        return software.amazon.jsii.Kernel.get(this, "exportingConfig", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingExportingConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingMatchingRulesList getMatchingRules() {
        return software.amazon.jsii.Kernel.get(this, "matchingRules", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingMatchingRulesList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector getAttributeTypesSelectorInput() {
        return software.amazon.jsii.Kernel.get(this, "attributeTypesSelectorInput", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingAttributeTypesSelector.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingConflictResolution getConflictResolutionInput() {
        return software.amazon.jsii.Kernel.get(this, "conflictResolutionInput", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingConflictResolution.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingExportingConfig getExportingConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "exportingConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingExportingConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMatchingRulesInput() {
        return software.amazon.jsii.Kernel.get(this, "matchingRulesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxAllowedRuleLevelForMatchingInput() {
        return software.amazon.jsii.Kernel.get(this, "maxAllowedRuleLevelForMatchingInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxAllowedRuleLevelForMergingInput() {
        return software.amazon.jsii.Kernel.get(this, "maxAllowedRuleLevelForMergingInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "statusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxAllowedRuleLevelForMatching() {
        return software.amazon.jsii.Kernel.get(this, "maxAllowedRuleLevelForMatching", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxAllowedRuleLevelForMatching(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxAllowedRuleLevelForMatching", java.util.Objects.requireNonNull(value, "maxAllowedRuleLevelForMatching is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxAllowedRuleLevelForMerging() {
        return software.amazon.jsii.Kernel.get(this, "maxAllowedRuleLevelForMerging", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxAllowedRuleLevelForMerging(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxAllowedRuleLevelForMerging", java.util.Objects.requireNonNull(value, "maxAllowedRuleLevelForMerging is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "status", java.util.Objects.requireNonNull(value, "status is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatching getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatching.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatching value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
