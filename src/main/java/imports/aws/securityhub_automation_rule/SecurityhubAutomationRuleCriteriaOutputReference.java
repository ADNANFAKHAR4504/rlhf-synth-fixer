package imports.aws.securityhub_automation_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.380Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaOutputReference")
public class SecurityhubAutomationRuleCriteriaOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SecurityhubAutomationRuleCriteriaOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SecurityhubAutomationRuleCriteriaOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SecurityhubAutomationRuleCriteriaOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putAwsAccountId(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaAwsAccountId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaAwsAccountId> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaAwsAccountId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaAwsAccountId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAwsAccountId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putAwsAccountName(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaAwsAccountName>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaAwsAccountName> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaAwsAccountName>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaAwsAccountName __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAwsAccountName", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCompanyName(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaCompanyName>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaCompanyName> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaCompanyName>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaCompanyName __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCompanyName", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putComplianceAssociatedStandardsId(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putComplianceAssociatedStandardsId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putComplianceSecurityControlId(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaComplianceSecurityControlId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaComplianceSecurityControlId> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaComplianceSecurityControlId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaComplianceSecurityControlId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putComplianceSecurityControlId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putComplianceStatus(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaComplianceStatus>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaComplianceStatus> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaComplianceStatus>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaComplianceStatus __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putComplianceStatus", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putConfidence(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaConfidence>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaConfidence> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaConfidence>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaConfidence __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putConfidence", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCreatedAt(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaCreatedAt>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaCreatedAt> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaCreatedAt>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaCreatedAt __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCreatedAt", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCriticality(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaCriticality>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaCriticality> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaCriticality>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaCriticality __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCriticality", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDescription(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaDescription>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaDescription> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaDescription>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaDescription __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putDescription", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFirstObservedAt(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaFirstObservedAt>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaFirstObservedAt> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaFirstObservedAt>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaFirstObservedAt __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFirstObservedAt", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putGeneratorId(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaGeneratorId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaGeneratorId> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaGeneratorId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaGeneratorId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putGeneratorId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putId(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaId> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLastObservedAt(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaLastObservedAt>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaLastObservedAt> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaLastObservedAt>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaLastObservedAt __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLastObservedAt", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNoteText(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaNoteText>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaNoteText> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaNoteText>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaNoteText __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNoteText", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNoteUpdatedAt(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaNoteUpdatedAt>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaNoteUpdatedAt> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaNoteUpdatedAt>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaNoteUpdatedAt __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNoteUpdatedAt", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNoteUpdatedBy(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaNoteUpdatedBy>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaNoteUpdatedBy> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaNoteUpdatedBy>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaNoteUpdatedBy __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNoteUpdatedBy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putProductArn(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaProductArn>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaProductArn> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaProductArn>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaProductArn __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putProductArn", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putProductName(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaProductName>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaProductName> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaProductName>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaProductName __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putProductName", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRecordState(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaRecordState>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaRecordState> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaRecordState>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaRecordState __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRecordState", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRelatedFindingsId(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaRelatedFindingsId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaRelatedFindingsId> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaRelatedFindingsId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaRelatedFindingsId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRelatedFindingsId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRelatedFindingsProductArn(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaRelatedFindingsProductArn __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRelatedFindingsProductArn", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceApplicationArn(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceApplicationArn>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceApplicationArn> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceApplicationArn>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceApplicationArn __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceApplicationArn", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceApplicationName(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceApplicationName>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceApplicationName> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceApplicationName>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceApplicationName __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceApplicationName", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceDetailsOther(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceDetailsOther>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceDetailsOther> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceDetailsOther>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceDetailsOther __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceDetailsOther", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceId(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceId> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourcePartition(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourcePartition>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourcePartition> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourcePartition>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourcePartition __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourcePartition", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceRegion(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceRegion>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceRegion> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceRegion>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceRegion __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceRegion", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceTags(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceTags>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceTags> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceTags>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceTags __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceTags", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceType(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceType>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceType> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceType>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceType __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceType", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSeverityLabel(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaSeverityLabel>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaSeverityLabel> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaSeverityLabel>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaSeverityLabel __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSeverityLabel", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSourceUrl(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaSourceUrl>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaSourceUrl> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaSourceUrl>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaSourceUrl __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSourceUrl", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTitle(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaTitle>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaTitle> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaTitle>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaTitle __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTitle", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putType(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaType>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaType> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaType>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaType __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putType", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUpdatedAt(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaUpdatedAt>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaUpdatedAt> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaUpdatedAt>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaUpdatedAt __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putUpdatedAt", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUserDefinedFields(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaUserDefinedFields>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaUserDefinedFields> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaUserDefinedFields>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaUserDefinedFields __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putUserDefinedFields", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVerificationState(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaVerificationState>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaVerificationState> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaVerificationState>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaVerificationState __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putVerificationState", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putWorkflowStatus(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaWorkflowStatus>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaWorkflowStatus> __cast_cd4240 = (java.util.List<imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaWorkflowStatus>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaWorkflowStatus __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putWorkflowStatus", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAwsAccountId() {
        software.amazon.jsii.Kernel.call(this, "resetAwsAccountId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAwsAccountName() {
        software.amazon.jsii.Kernel.call(this, "resetAwsAccountName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCompanyName() {
        software.amazon.jsii.Kernel.call(this, "resetCompanyName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetComplianceAssociatedStandardsId() {
        software.amazon.jsii.Kernel.call(this, "resetComplianceAssociatedStandardsId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetComplianceSecurityControlId() {
        software.amazon.jsii.Kernel.call(this, "resetComplianceSecurityControlId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetComplianceStatus() {
        software.amazon.jsii.Kernel.call(this, "resetComplianceStatus", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConfidence() {
        software.amazon.jsii.Kernel.call(this, "resetConfidence", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCreatedAt() {
        software.amazon.jsii.Kernel.call(this, "resetCreatedAt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCriticality() {
        software.amazon.jsii.Kernel.call(this, "resetCriticality", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFirstObservedAt() {
        software.amazon.jsii.Kernel.call(this, "resetFirstObservedAt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGeneratorId() {
        software.amazon.jsii.Kernel.call(this, "resetGeneratorId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLastObservedAt() {
        software.amazon.jsii.Kernel.call(this, "resetLastObservedAt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNoteText() {
        software.amazon.jsii.Kernel.call(this, "resetNoteText", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNoteUpdatedAt() {
        software.amazon.jsii.Kernel.call(this, "resetNoteUpdatedAt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNoteUpdatedBy() {
        software.amazon.jsii.Kernel.call(this, "resetNoteUpdatedBy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProductArn() {
        software.amazon.jsii.Kernel.call(this, "resetProductArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProductName() {
        software.amazon.jsii.Kernel.call(this, "resetProductName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRecordState() {
        software.amazon.jsii.Kernel.call(this, "resetRecordState", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRelatedFindingsId() {
        software.amazon.jsii.Kernel.call(this, "resetRelatedFindingsId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRelatedFindingsProductArn() {
        software.amazon.jsii.Kernel.call(this, "resetRelatedFindingsProductArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceApplicationArn() {
        software.amazon.jsii.Kernel.call(this, "resetResourceApplicationArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceApplicationName() {
        software.amazon.jsii.Kernel.call(this, "resetResourceApplicationName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceDetailsOther() {
        software.amazon.jsii.Kernel.call(this, "resetResourceDetailsOther", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceId() {
        software.amazon.jsii.Kernel.call(this, "resetResourceId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourcePartition() {
        software.amazon.jsii.Kernel.call(this, "resetResourcePartition", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceRegion() {
        software.amazon.jsii.Kernel.call(this, "resetResourceRegion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceTags() {
        software.amazon.jsii.Kernel.call(this, "resetResourceTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceType() {
        software.amazon.jsii.Kernel.call(this, "resetResourceType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSeverityLabel() {
        software.amazon.jsii.Kernel.call(this, "resetSeverityLabel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceUrl() {
        software.amazon.jsii.Kernel.call(this, "resetSourceUrl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTitle() {
        software.amazon.jsii.Kernel.call(this, "resetTitle", software.amazon.jsii.NativeType.VOID);
    }

    public void resetType() {
        software.amazon.jsii.Kernel.call(this, "resetType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUpdatedAt() {
        software.amazon.jsii.Kernel.call(this, "resetUpdatedAt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserDefinedFields() {
        software.amazon.jsii.Kernel.call(this, "resetUserDefinedFields", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVerificationState() {
        software.amazon.jsii.Kernel.call(this, "resetVerificationState", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWorkflowStatus() {
        software.amazon.jsii.Kernel.call(this, "resetWorkflowStatus", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaAwsAccountIdList getAwsAccountId() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountId", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaAwsAccountIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaAwsAccountNameList getAwsAccountName() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountName", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaAwsAccountNameList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaCompanyNameList getCompanyName() {
        return software.amazon.jsii.Kernel.get(this, "companyName", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaCompanyNameList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsIdList getComplianceAssociatedStandardsId() {
        return software.amazon.jsii.Kernel.get(this, "complianceAssociatedStandardsId", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaComplianceAssociatedStandardsIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaComplianceSecurityControlIdList getComplianceSecurityControlId() {
        return software.amazon.jsii.Kernel.get(this, "complianceSecurityControlId", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaComplianceSecurityControlIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaComplianceStatusList getComplianceStatus() {
        return software.amazon.jsii.Kernel.get(this, "complianceStatus", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaComplianceStatusList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaConfidenceList getConfidence() {
        return software.amazon.jsii.Kernel.get(this, "confidence", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaConfidenceList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaCreatedAtList getCreatedAt() {
        return software.amazon.jsii.Kernel.get(this, "createdAt", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaCreatedAtList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaCriticalityList getCriticality() {
        return software.amazon.jsii.Kernel.get(this, "criticality", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaCriticalityList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaDescriptionList getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaDescriptionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaFirstObservedAtList getFirstObservedAt() {
        return software.amazon.jsii.Kernel.get(this, "firstObservedAt", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaFirstObservedAtList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaGeneratorIdList getGeneratorId() {
        return software.amazon.jsii.Kernel.get(this, "generatorId", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaGeneratorIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaIdList getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaLastObservedAtList getLastObservedAt() {
        return software.amazon.jsii.Kernel.get(this, "lastObservedAt", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaLastObservedAtList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaNoteTextList getNoteText() {
        return software.amazon.jsii.Kernel.get(this, "noteText", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaNoteTextList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaNoteUpdatedAtList getNoteUpdatedAt() {
        return software.amazon.jsii.Kernel.get(this, "noteUpdatedAt", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaNoteUpdatedAtList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaNoteUpdatedByList getNoteUpdatedBy() {
        return software.amazon.jsii.Kernel.get(this, "noteUpdatedBy", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaNoteUpdatedByList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaProductArnList getProductArn() {
        return software.amazon.jsii.Kernel.get(this, "productArn", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaProductArnList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaProductNameList getProductName() {
        return software.amazon.jsii.Kernel.get(this, "productName", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaProductNameList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaRecordStateList getRecordState() {
        return software.amazon.jsii.Kernel.get(this, "recordState", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaRecordStateList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaRelatedFindingsIdList getRelatedFindingsId() {
        return software.amazon.jsii.Kernel.get(this, "relatedFindingsId", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaRelatedFindingsIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaRelatedFindingsProductArnList getRelatedFindingsProductArn() {
        return software.amazon.jsii.Kernel.get(this, "relatedFindingsProductArn", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaRelatedFindingsProductArnList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceApplicationArnList getResourceApplicationArn() {
        return software.amazon.jsii.Kernel.get(this, "resourceApplicationArn", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceApplicationArnList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceApplicationNameList getResourceApplicationName() {
        return software.amazon.jsii.Kernel.get(this, "resourceApplicationName", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceApplicationNameList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceDetailsOtherList getResourceDetailsOther() {
        return software.amazon.jsii.Kernel.get(this, "resourceDetailsOther", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceDetailsOtherList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceIdList getResourceId() {
        return software.amazon.jsii.Kernel.get(this, "resourceId", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourcePartitionList getResourcePartition() {
        return software.amazon.jsii.Kernel.get(this, "resourcePartition", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourcePartitionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceRegionList getResourceRegion() {
        return software.amazon.jsii.Kernel.get(this, "resourceRegion", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceRegionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceTagsList getResourceTags() {
        return software.amazon.jsii.Kernel.get(this, "resourceTags", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceTagsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceTypeList getResourceType() {
        return software.amazon.jsii.Kernel.get(this, "resourceType", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaResourceTypeList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaSeverityLabelList getSeverityLabel() {
        return software.amazon.jsii.Kernel.get(this, "severityLabel", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaSeverityLabelList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaSourceUrlList getSourceUrl() {
        return software.amazon.jsii.Kernel.get(this, "sourceUrl", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaSourceUrlList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaTitleList getTitle() {
        return software.amazon.jsii.Kernel.get(this, "title", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaTitleList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaTypeList getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaTypeList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaUpdatedAtList getUpdatedAt() {
        return software.amazon.jsii.Kernel.get(this, "updatedAt", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaUpdatedAtList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaUserDefinedFieldsList getUserDefinedFields() {
        return software.amazon.jsii.Kernel.get(this, "userDefinedFields", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaUserDefinedFieldsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaVerificationStateList getVerificationState() {
        return software.amazon.jsii.Kernel.get(this, "verificationState", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaVerificationStateList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaWorkflowStatusList getWorkflowStatus() {
        return software.amazon.jsii.Kernel.get(this, "workflowStatus", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteriaWorkflowStatusList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAwsAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAwsAccountNameInput() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountNameInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCompanyNameInput() {
        return software.amazon.jsii.Kernel.get(this, "companyNameInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getComplianceAssociatedStandardsIdInput() {
        return software.amazon.jsii.Kernel.get(this, "complianceAssociatedStandardsIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getComplianceSecurityControlIdInput() {
        return software.amazon.jsii.Kernel.get(this, "complianceSecurityControlIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getComplianceStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "complianceStatusInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getConfidenceInput() {
        return software.amazon.jsii.Kernel.get(this, "confidenceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCreatedAtInput() {
        return software.amazon.jsii.Kernel.get(this, "createdAtInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCriticalityInput() {
        return software.amazon.jsii.Kernel.get(this, "criticalityInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFirstObservedAtInput() {
        return software.amazon.jsii.Kernel.get(this, "firstObservedAtInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getGeneratorIdInput() {
        return software.amazon.jsii.Kernel.get(this, "generatorIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLastObservedAtInput() {
        return software.amazon.jsii.Kernel.get(this, "lastObservedAtInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNoteTextInput() {
        return software.amazon.jsii.Kernel.get(this, "noteTextInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNoteUpdatedAtInput() {
        return software.amazon.jsii.Kernel.get(this, "noteUpdatedAtInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNoteUpdatedByInput() {
        return software.amazon.jsii.Kernel.get(this, "noteUpdatedByInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getProductArnInput() {
        return software.amazon.jsii.Kernel.get(this, "productArnInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getProductNameInput() {
        return software.amazon.jsii.Kernel.get(this, "productNameInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRecordStateInput() {
        return software.amazon.jsii.Kernel.get(this, "recordStateInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRelatedFindingsIdInput() {
        return software.amazon.jsii.Kernel.get(this, "relatedFindingsIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRelatedFindingsProductArnInput() {
        return software.amazon.jsii.Kernel.get(this, "relatedFindingsProductArnInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceApplicationArnInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceApplicationArnInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceApplicationNameInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceApplicationNameInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceDetailsOtherInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceDetailsOtherInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceIdInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourcePartitionInput() {
        return software.amazon.jsii.Kernel.get(this, "resourcePartitionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceRegionInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceRegionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceTagsInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceTagsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSeverityLabelInput() {
        return software.amazon.jsii.Kernel.get(this, "severityLabelInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSourceUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTitleInput() {
        return software.amazon.jsii.Kernel.get(this, "titleInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUpdatedAtInput() {
        return software.amazon.jsii.Kernel.get(this, "updatedAtInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUserDefinedFieldsInput() {
        return software.amazon.jsii.Kernel.get(this, "userDefinedFieldsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVerificationStateInput() {
        return software.amazon.jsii.Kernel.get(this, "verificationStateInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getWorkflowStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "workflowStatusInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleCriteria value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
