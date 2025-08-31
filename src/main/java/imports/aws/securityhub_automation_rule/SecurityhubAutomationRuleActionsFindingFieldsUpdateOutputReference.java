package imports.aws.securityhub_automation_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.370Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsFindingFieldsUpdateOutputReference")
public class SecurityhubAutomationRuleActionsFindingFieldsUpdateOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SecurityhubAutomationRuleActionsFindingFieldsUpdateOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SecurityhubAutomationRuleActionsFindingFieldsUpdateOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SecurityhubAutomationRuleActionsFindingFieldsUpdateOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putNote(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateNote>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateNote> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateNote>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateNote __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNote", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRelatedFindings(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRelatedFindings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSeverity(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSeverity", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putWorkflow(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putWorkflow", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetConfidence() {
        software.amazon.jsii.Kernel.call(this, "resetConfidence", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCriticality() {
        software.amazon.jsii.Kernel.call(this, "resetCriticality", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNote() {
        software.amazon.jsii.Kernel.call(this, "resetNote", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRelatedFindings() {
        software.amazon.jsii.Kernel.call(this, "resetRelatedFindings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSeverity() {
        software.amazon.jsii.Kernel.call(this, "resetSeverity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTypes() {
        software.amazon.jsii.Kernel.call(this, "resetTypes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserDefinedFields() {
        software.amazon.jsii.Kernel.call(this, "resetUserDefinedFields", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVerificationState() {
        software.amazon.jsii.Kernel.call(this, "resetVerificationState", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWorkflow() {
        software.amazon.jsii.Kernel.call(this, "resetWorkflow", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateNoteList getNote() {
        return software.amazon.jsii.Kernel.get(this, "note", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateNoteList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindingsList getRelatedFindings() {
        return software.amazon.jsii.Kernel.get(this, "relatedFindings", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindingsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverityList getSeverity() {
        return software.amazon.jsii.Kernel.get(this, "severity", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverityList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflowList getWorkflow() {
        return software.amazon.jsii.Kernel.get(this, "workflow", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflowList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getConfidenceInput() {
        return software.amazon.jsii.Kernel.get(this, "confidenceInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCriticalityInput() {
        return software.amazon.jsii.Kernel.get(this, "criticalityInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNoteInput() {
        return software.amazon.jsii.Kernel.get(this, "noteInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRelatedFindingsInput() {
        return software.amazon.jsii.Kernel.get(this, "relatedFindingsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSeverityInput() {
        return software.amazon.jsii.Kernel.get(this, "severityInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTypesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "typesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getUserDefinedFieldsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "userDefinedFieldsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVerificationStateInput() {
        return software.amazon.jsii.Kernel.get(this, "verificationStateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getWorkflowInput() {
        return software.amazon.jsii.Kernel.get(this, "workflowInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getConfidence() {
        return software.amazon.jsii.Kernel.get(this, "confidence", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setConfidence(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "confidence", java.util.Objects.requireNonNull(value, "confidence is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCriticality() {
        return software.amazon.jsii.Kernel.get(this, "criticality", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setCriticality(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "criticality", java.util.Objects.requireNonNull(value, "criticality is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "types", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTypes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "types", java.util.Objects.requireNonNull(value, "types is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getUserDefinedFields() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "userDefinedFields", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setUserDefinedFields(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "userDefinedFields", java.util.Objects.requireNonNull(value, "userDefinedFields is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVerificationState() {
        return software.amazon.jsii.Kernel.get(this, "verificationState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVerificationState(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "verificationState", java.util.Objects.requireNonNull(value, "verificationState is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdate value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
