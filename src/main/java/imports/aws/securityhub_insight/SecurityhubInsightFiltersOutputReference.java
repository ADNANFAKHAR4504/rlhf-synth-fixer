package imports.aws.securityhub_insight;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.401Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securityhubInsight.SecurityhubInsightFiltersOutputReference")
public class SecurityhubInsightFiltersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SecurityhubInsightFiltersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SecurityhubInsightFiltersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SecurityhubInsightFiltersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersAwsAccountId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersAwsAccountId> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersAwsAccountId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersAwsAccountId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAwsAccountId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersCompanyName>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersCompanyName> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersCompanyName>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersCompanyName __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCompanyName", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersComplianceStatus>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersComplianceStatus> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersComplianceStatus>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersComplianceStatus __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersConfidence>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersConfidence> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersConfidence>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersConfidence __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersCreatedAt>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersCreatedAt> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersCreatedAt>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersCreatedAt __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersCriticality>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersCriticality> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersCriticality>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersCriticality __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersDescription>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersDescription> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersDescription>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersDescription __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putDescription", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFindingProviderFieldsConfidence(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsConfidence>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsConfidence> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsConfidence>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsConfidence __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFindingProviderFieldsConfidence", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFindingProviderFieldsCriticality(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsCriticality>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsCriticality> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsCriticality>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsCriticality __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFindingProviderFieldsCriticality", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFindingProviderFieldsRelatedFindingsId(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsRelatedFindingsId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsRelatedFindingsId> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsRelatedFindingsId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsRelatedFindingsId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFindingProviderFieldsRelatedFindingsId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFindingProviderFieldsRelatedFindingsProductArn(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsRelatedFindingsProductArn>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsRelatedFindingsProductArn> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsRelatedFindingsProductArn>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsRelatedFindingsProductArn __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFindingProviderFieldsRelatedFindingsProductArn", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFindingProviderFieldsSeverityLabel(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsSeverityLabel>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsSeverityLabel> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsSeverityLabel>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsSeverityLabel __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFindingProviderFieldsSeverityLabel", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFindingProviderFieldsSeverityOriginal(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsSeverityOriginal>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsSeverityOriginal> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsSeverityOriginal>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsSeverityOriginal __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFindingProviderFieldsSeverityOriginal", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFindingProviderFieldsTypes(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsTypes>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsTypes> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsTypes>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsTypes __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFindingProviderFieldsTypes", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFirstObservedAt>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFirstObservedAt> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersFirstObservedAt>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersFirstObservedAt __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersGeneratorId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersGeneratorId> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersGeneratorId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersGeneratorId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersId> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKeyword(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersKeyword>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersKeyword> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersKeyword>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersKeyword __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putKeyword", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersLastObservedAt>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersLastObservedAt> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersLastObservedAt>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersLastObservedAt __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLastObservedAt", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMalwareName(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwareName>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwareName> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwareName>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwareName __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putMalwareName", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMalwarePath(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwarePath>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwarePath> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwarePath>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwarePath __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putMalwarePath", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMalwareState(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwareState>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwareState> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwareState>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwareState __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putMalwareState", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMalwareType(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwareType>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwareType> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwareType>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwareType __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putMalwareType", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkDestinationDomain(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationDomain>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationDomain> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationDomain>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationDomain __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNetworkDestinationDomain", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkDestinationIpv4(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationIpv4>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationIpv4> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationIpv4>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationIpv4 __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNetworkDestinationIpv4", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkDestinationIpv6(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationIpv6>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationIpv6> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationIpv6>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationIpv6 __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNetworkDestinationIpv6", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkDestinationPort(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationPort>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationPort> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationPort>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationPort __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNetworkDestinationPort", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkDirection(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDirection>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDirection> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDirection>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDirection __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNetworkDirection", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkProtocol(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkProtocol>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkProtocol> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkProtocol>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkProtocol __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNetworkProtocol", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkSourceDomain(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceDomain>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceDomain> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceDomain>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceDomain __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNetworkSourceDomain", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkSourceIpv4(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceIpv4>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceIpv4> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceIpv4>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceIpv4 __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNetworkSourceIpv4", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkSourceIpv6(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceIpv6>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceIpv6> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceIpv6>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceIpv6 __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNetworkSourceIpv6", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkSourceMac(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceMac>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceMac> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceMac>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceMac __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNetworkSourceMac", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkSourcePort(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourcePort>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourcePort> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourcePort>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourcePort __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNetworkSourcePort", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNoteText>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNoteText> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNoteText>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersNoteText __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNoteUpdatedAt>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNoteUpdatedAt> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNoteUpdatedAt>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersNoteUpdatedAt __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNoteUpdatedBy>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNoteUpdatedBy> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersNoteUpdatedBy>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersNoteUpdatedBy __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNoteUpdatedBy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putProcessLaunchedAt(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessLaunchedAt>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessLaunchedAt> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessLaunchedAt>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessLaunchedAt __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putProcessLaunchedAt", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putProcessName(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessName>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessName> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessName>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessName __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putProcessName", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putProcessParentPid(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessParentPid>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessParentPid> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessParentPid>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessParentPid __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putProcessParentPid", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putProcessPath(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessPath>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessPath> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessPath>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessPath __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putProcessPath", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putProcessPid(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessPid>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessPid> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessPid>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessPid __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putProcessPid", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putProcessTerminatedAt(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessTerminatedAt>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessTerminatedAt> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessTerminatedAt>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessTerminatedAt __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putProcessTerminatedAt", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProductArn>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProductArn> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProductArn>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersProductArn __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putProductArn", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putProductFields(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProductFields>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProductFields> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProductFields>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersProductFields __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putProductFields", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProductName>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProductName> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersProductName>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersProductName __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putProductName", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRecommendationText(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersRecommendationText>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersRecommendationText> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersRecommendationText>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersRecommendationText __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRecommendationText", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersRecordState>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersRecordState> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersRecordState>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersRecordState __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersRelatedFindingsId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersRelatedFindingsId> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersRelatedFindingsId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersRelatedFindingsId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersRelatedFindingsProductArn>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersRelatedFindingsProductArn> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersRelatedFindingsProductArn>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersRelatedFindingsProductArn __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRelatedFindingsProductArn", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceAwsEc2InstanceIamInstanceProfileArn(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceIamInstanceProfileArn>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceIamInstanceProfileArn> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceIamInstanceProfileArn>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceIamInstanceProfileArn __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceAwsEc2InstanceIamInstanceProfileArn", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceAwsEc2InstanceImageId(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceImageId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceImageId> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceImageId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceImageId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceAwsEc2InstanceImageId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceAwsEc2InstanceIpv4Addresses(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceIpv4Addresses>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceIpv4Addresses> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceIpv4Addresses>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceIpv4Addresses __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceAwsEc2InstanceIpv4Addresses", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceAwsEc2InstanceIpv6Addresses(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceIpv6Addresses>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceIpv6Addresses> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceIpv6Addresses>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceIpv6Addresses __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceAwsEc2InstanceIpv6Addresses", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceAwsEc2InstanceKeyName(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceKeyName>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceKeyName> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceKeyName>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceKeyName __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceAwsEc2InstanceKeyName", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceAwsEc2InstanceLaunchedAt(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAt>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAt> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAt>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAt __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceAwsEc2InstanceLaunchedAt", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceAwsEc2InstanceSubnetId(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceSubnetId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceSubnetId> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceSubnetId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceSubnetId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceAwsEc2InstanceSubnetId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceAwsEc2InstanceType(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceType>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceType> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceType>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceType __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceAwsEc2InstanceType", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceAwsEc2InstanceVpcId(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceVpcId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceVpcId> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceVpcId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceVpcId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceAwsEc2InstanceVpcId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceAwsIamAccessKeyCreatedAt(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyCreatedAt>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyCreatedAt> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyCreatedAt>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyCreatedAt __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceAwsIamAccessKeyCreatedAt", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceAwsIamAccessKeyStatus(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyStatus>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyStatus> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyStatus>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyStatus __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceAwsIamAccessKeyStatus", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceAwsIamAccessKeyUserName(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyUserName>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyUserName> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyUserName>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyUserName __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceAwsIamAccessKeyUserName", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceAwsS3BucketOwnerId(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsS3BucketOwnerId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsS3BucketOwnerId> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsS3BucketOwnerId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsS3BucketOwnerId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceAwsS3BucketOwnerId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceAwsS3BucketOwnerName(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsS3BucketOwnerName>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsS3BucketOwnerName> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsS3BucketOwnerName>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsS3BucketOwnerName __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceAwsS3BucketOwnerName", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceContainerImageId(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerImageId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerImageId> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerImageId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerImageId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceContainerImageId", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceContainerImageName(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerImageName>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerImageName> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerImageName>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerImageName __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceContainerImageName", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceContainerLaunchedAt(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerLaunchedAt>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerLaunchedAt> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerLaunchedAt>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerLaunchedAt __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceContainerLaunchedAt", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResourceContainerName(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerName>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerName> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerName>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerName __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceContainerName", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceDetailsOther>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceDetailsOther> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceDetailsOther>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceDetailsOther __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceId>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceId> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceId>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceId __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourcePartition>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourcePartition> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourcePartition>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourcePartition __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceRegion>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceRegion> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceRegion>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceRegion __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceTags>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceTags> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceTags>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceTags __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceType>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceType> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceType>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceType __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersSeverityLabel>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersSeverityLabel> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersSeverityLabel>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersSeverityLabel __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersSourceUrl>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersSourceUrl> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersSourceUrl>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersSourceUrl __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSourceUrl", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putThreatIntelIndicatorCategory(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorCategory>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorCategory> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorCategory>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorCategory __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putThreatIntelIndicatorCategory", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putThreatIntelIndicatorLastObservedAt(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorLastObservedAt>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorLastObservedAt> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorLastObservedAt>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorLastObservedAt __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putThreatIntelIndicatorLastObservedAt", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putThreatIntelIndicatorSource(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorSource>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorSource> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorSource>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorSource __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putThreatIntelIndicatorSource", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putThreatIntelIndicatorSourceUrl(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorSourceUrl>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorSourceUrl> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorSourceUrl>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorSourceUrl __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putThreatIntelIndicatorSourceUrl", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putThreatIntelIndicatorType(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorType>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorType> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorType>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorType __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putThreatIntelIndicatorType", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putThreatIntelIndicatorValue(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorValue>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorValue> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorValue>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorValue __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putThreatIntelIndicatorValue", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersTitle>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersTitle> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersTitle>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersTitle __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersType>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersType> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersType>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersType __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersUpdatedAt>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersUpdatedAt> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersUpdatedAt>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersUpdatedAt __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putUpdatedAt", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUserDefinedValues(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersUserDefinedValues>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersUserDefinedValues> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersUserDefinedValues>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersUserDefinedValues __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putUserDefinedValues", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersVerificationState>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersVerificationState> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersVerificationState>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersVerificationState __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersWorkflowStatus>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersWorkflowStatus> __cast_cd4240 = (java.util.List<imports.aws.securityhub_insight.SecurityhubInsightFiltersWorkflowStatus>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.securityhub_insight.SecurityhubInsightFiltersWorkflowStatus __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putWorkflowStatus", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAwsAccountId() {
        software.amazon.jsii.Kernel.call(this, "resetAwsAccountId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCompanyName() {
        software.amazon.jsii.Kernel.call(this, "resetCompanyName", software.amazon.jsii.NativeType.VOID);
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

    public void resetFindingProviderFieldsConfidence() {
        software.amazon.jsii.Kernel.call(this, "resetFindingProviderFieldsConfidence", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFindingProviderFieldsCriticality() {
        software.amazon.jsii.Kernel.call(this, "resetFindingProviderFieldsCriticality", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFindingProviderFieldsRelatedFindingsId() {
        software.amazon.jsii.Kernel.call(this, "resetFindingProviderFieldsRelatedFindingsId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFindingProviderFieldsRelatedFindingsProductArn() {
        software.amazon.jsii.Kernel.call(this, "resetFindingProviderFieldsRelatedFindingsProductArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFindingProviderFieldsSeverityLabel() {
        software.amazon.jsii.Kernel.call(this, "resetFindingProviderFieldsSeverityLabel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFindingProviderFieldsSeverityOriginal() {
        software.amazon.jsii.Kernel.call(this, "resetFindingProviderFieldsSeverityOriginal", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFindingProviderFieldsTypes() {
        software.amazon.jsii.Kernel.call(this, "resetFindingProviderFieldsTypes", software.amazon.jsii.NativeType.VOID);
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

    public void resetKeyword() {
        software.amazon.jsii.Kernel.call(this, "resetKeyword", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLastObservedAt() {
        software.amazon.jsii.Kernel.call(this, "resetLastObservedAt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMalwareName() {
        software.amazon.jsii.Kernel.call(this, "resetMalwareName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMalwarePath() {
        software.amazon.jsii.Kernel.call(this, "resetMalwarePath", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMalwareState() {
        software.amazon.jsii.Kernel.call(this, "resetMalwareState", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMalwareType() {
        software.amazon.jsii.Kernel.call(this, "resetMalwareType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkDestinationDomain() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkDestinationDomain", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkDestinationIpv4() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkDestinationIpv4", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkDestinationIpv6() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkDestinationIpv6", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkDestinationPort() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkDestinationPort", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkDirection() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkDirection", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkProtocol() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkProtocol", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkSourceDomain() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkSourceDomain", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkSourceIpv4() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkSourceIpv4", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkSourceIpv6() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkSourceIpv6", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkSourceMac() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkSourceMac", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkSourcePort() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkSourcePort", software.amazon.jsii.NativeType.VOID);
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

    public void resetProcessLaunchedAt() {
        software.amazon.jsii.Kernel.call(this, "resetProcessLaunchedAt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProcessName() {
        software.amazon.jsii.Kernel.call(this, "resetProcessName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProcessParentPid() {
        software.amazon.jsii.Kernel.call(this, "resetProcessParentPid", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProcessPath() {
        software.amazon.jsii.Kernel.call(this, "resetProcessPath", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProcessPid() {
        software.amazon.jsii.Kernel.call(this, "resetProcessPid", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProcessTerminatedAt() {
        software.amazon.jsii.Kernel.call(this, "resetProcessTerminatedAt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProductArn() {
        software.amazon.jsii.Kernel.call(this, "resetProductArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProductFields() {
        software.amazon.jsii.Kernel.call(this, "resetProductFields", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProductName() {
        software.amazon.jsii.Kernel.call(this, "resetProductName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRecommendationText() {
        software.amazon.jsii.Kernel.call(this, "resetRecommendationText", software.amazon.jsii.NativeType.VOID);
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

    public void resetResourceAwsEc2InstanceIamInstanceProfileArn() {
        software.amazon.jsii.Kernel.call(this, "resetResourceAwsEc2InstanceIamInstanceProfileArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceAwsEc2InstanceImageId() {
        software.amazon.jsii.Kernel.call(this, "resetResourceAwsEc2InstanceImageId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceAwsEc2InstanceIpv4Addresses() {
        software.amazon.jsii.Kernel.call(this, "resetResourceAwsEc2InstanceIpv4Addresses", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceAwsEc2InstanceIpv6Addresses() {
        software.amazon.jsii.Kernel.call(this, "resetResourceAwsEc2InstanceIpv6Addresses", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceAwsEc2InstanceKeyName() {
        software.amazon.jsii.Kernel.call(this, "resetResourceAwsEc2InstanceKeyName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceAwsEc2InstanceLaunchedAt() {
        software.amazon.jsii.Kernel.call(this, "resetResourceAwsEc2InstanceLaunchedAt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceAwsEc2InstanceSubnetId() {
        software.amazon.jsii.Kernel.call(this, "resetResourceAwsEc2InstanceSubnetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceAwsEc2InstanceType() {
        software.amazon.jsii.Kernel.call(this, "resetResourceAwsEc2InstanceType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceAwsEc2InstanceVpcId() {
        software.amazon.jsii.Kernel.call(this, "resetResourceAwsEc2InstanceVpcId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceAwsIamAccessKeyCreatedAt() {
        software.amazon.jsii.Kernel.call(this, "resetResourceAwsIamAccessKeyCreatedAt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceAwsIamAccessKeyStatus() {
        software.amazon.jsii.Kernel.call(this, "resetResourceAwsIamAccessKeyStatus", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceAwsIamAccessKeyUserName() {
        software.amazon.jsii.Kernel.call(this, "resetResourceAwsIamAccessKeyUserName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceAwsS3BucketOwnerId() {
        software.amazon.jsii.Kernel.call(this, "resetResourceAwsS3BucketOwnerId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceAwsS3BucketOwnerName() {
        software.amazon.jsii.Kernel.call(this, "resetResourceAwsS3BucketOwnerName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceContainerImageId() {
        software.amazon.jsii.Kernel.call(this, "resetResourceContainerImageId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceContainerImageName() {
        software.amazon.jsii.Kernel.call(this, "resetResourceContainerImageName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceContainerLaunchedAt() {
        software.amazon.jsii.Kernel.call(this, "resetResourceContainerLaunchedAt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceContainerName() {
        software.amazon.jsii.Kernel.call(this, "resetResourceContainerName", software.amazon.jsii.NativeType.VOID);
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

    public void resetThreatIntelIndicatorCategory() {
        software.amazon.jsii.Kernel.call(this, "resetThreatIntelIndicatorCategory", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThreatIntelIndicatorLastObservedAt() {
        software.amazon.jsii.Kernel.call(this, "resetThreatIntelIndicatorLastObservedAt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThreatIntelIndicatorSource() {
        software.amazon.jsii.Kernel.call(this, "resetThreatIntelIndicatorSource", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThreatIntelIndicatorSourceUrl() {
        software.amazon.jsii.Kernel.call(this, "resetThreatIntelIndicatorSourceUrl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThreatIntelIndicatorType() {
        software.amazon.jsii.Kernel.call(this, "resetThreatIntelIndicatorType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThreatIntelIndicatorValue() {
        software.amazon.jsii.Kernel.call(this, "resetThreatIntelIndicatorValue", software.amazon.jsii.NativeType.VOID);
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

    public void resetUserDefinedValues() {
        software.amazon.jsii.Kernel.call(this, "resetUserDefinedValues", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVerificationState() {
        software.amazon.jsii.Kernel.call(this, "resetVerificationState", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWorkflowStatus() {
        software.amazon.jsii.Kernel.call(this, "resetWorkflowStatus", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersAwsAccountIdList getAwsAccountId() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountId", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersAwsAccountIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersCompanyNameList getCompanyName() {
        return software.amazon.jsii.Kernel.get(this, "companyName", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersCompanyNameList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersComplianceStatusList getComplianceStatus() {
        return software.amazon.jsii.Kernel.get(this, "complianceStatus", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersComplianceStatusList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersConfidenceList getConfidence() {
        return software.amazon.jsii.Kernel.get(this, "confidence", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersConfidenceList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersCreatedAtList getCreatedAt() {
        return software.amazon.jsii.Kernel.get(this, "createdAt", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersCreatedAtList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersCriticalityList getCriticality() {
        return software.amazon.jsii.Kernel.get(this, "criticality", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersCriticalityList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersDescriptionList getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersDescriptionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsConfidenceList getFindingProviderFieldsConfidence() {
        return software.amazon.jsii.Kernel.get(this, "findingProviderFieldsConfidence", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsConfidenceList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsCriticalityList getFindingProviderFieldsCriticality() {
        return software.amazon.jsii.Kernel.get(this, "findingProviderFieldsCriticality", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsCriticalityList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsRelatedFindingsIdList getFindingProviderFieldsRelatedFindingsId() {
        return software.amazon.jsii.Kernel.get(this, "findingProviderFieldsRelatedFindingsId", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsRelatedFindingsIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsRelatedFindingsProductArnList getFindingProviderFieldsRelatedFindingsProductArn() {
        return software.amazon.jsii.Kernel.get(this, "findingProviderFieldsRelatedFindingsProductArn", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsRelatedFindingsProductArnList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsSeverityLabelList getFindingProviderFieldsSeverityLabel() {
        return software.amazon.jsii.Kernel.get(this, "findingProviderFieldsSeverityLabel", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsSeverityLabelList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsSeverityOriginalList getFindingProviderFieldsSeverityOriginal() {
        return software.amazon.jsii.Kernel.get(this, "findingProviderFieldsSeverityOriginal", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsSeverityOriginalList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsTypesList getFindingProviderFieldsTypes() {
        return software.amazon.jsii.Kernel.get(this, "findingProviderFieldsTypes", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersFindingProviderFieldsTypesList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersFirstObservedAtList getFirstObservedAt() {
        return software.amazon.jsii.Kernel.get(this, "firstObservedAt", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersFirstObservedAtList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersGeneratorIdList getGeneratorId() {
        return software.amazon.jsii.Kernel.get(this, "generatorId", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersGeneratorIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersIdList getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersKeywordList getKeyword() {
        return software.amazon.jsii.Kernel.get(this, "keyword", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersKeywordList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersLastObservedAtList getLastObservedAt() {
        return software.amazon.jsii.Kernel.get(this, "lastObservedAt", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersLastObservedAtList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwareNameList getMalwareName() {
        return software.amazon.jsii.Kernel.get(this, "malwareName", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwareNameList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwarePathList getMalwarePath() {
        return software.amazon.jsii.Kernel.get(this, "malwarePath", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwarePathList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwareStateList getMalwareState() {
        return software.amazon.jsii.Kernel.get(this, "malwareState", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwareStateList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwareTypeList getMalwareType() {
        return software.amazon.jsii.Kernel.get(this, "malwareType", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersMalwareTypeList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationDomainList getNetworkDestinationDomain() {
        return software.amazon.jsii.Kernel.get(this, "networkDestinationDomain", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationDomainList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationIpv4List getNetworkDestinationIpv4() {
        return software.amazon.jsii.Kernel.get(this, "networkDestinationIpv4", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationIpv4List.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationIpv6List getNetworkDestinationIpv6() {
        return software.amazon.jsii.Kernel.get(this, "networkDestinationIpv6", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationIpv6List.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationPortList getNetworkDestinationPort() {
        return software.amazon.jsii.Kernel.get(this, "networkDestinationPort", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDestinationPortList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDirectionList getNetworkDirection() {
        return software.amazon.jsii.Kernel.get(this, "networkDirection", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkDirectionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkProtocolList getNetworkProtocol() {
        return software.amazon.jsii.Kernel.get(this, "networkProtocol", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkProtocolList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceDomainList getNetworkSourceDomain() {
        return software.amazon.jsii.Kernel.get(this, "networkSourceDomain", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceDomainList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceIpv4List getNetworkSourceIpv4() {
        return software.amazon.jsii.Kernel.get(this, "networkSourceIpv4", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceIpv4List.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceIpv6List getNetworkSourceIpv6() {
        return software.amazon.jsii.Kernel.get(this, "networkSourceIpv6", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceIpv6List.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceMacList getNetworkSourceMac() {
        return software.amazon.jsii.Kernel.get(this, "networkSourceMac", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourceMacList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourcePortList getNetworkSourcePort() {
        return software.amazon.jsii.Kernel.get(this, "networkSourcePort", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersNetworkSourcePortList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersNoteTextList getNoteText() {
        return software.amazon.jsii.Kernel.get(this, "noteText", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersNoteTextList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersNoteUpdatedAtList getNoteUpdatedAt() {
        return software.amazon.jsii.Kernel.get(this, "noteUpdatedAt", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersNoteUpdatedAtList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersNoteUpdatedByList getNoteUpdatedBy() {
        return software.amazon.jsii.Kernel.get(this, "noteUpdatedBy", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersNoteUpdatedByList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessLaunchedAtList getProcessLaunchedAt() {
        return software.amazon.jsii.Kernel.get(this, "processLaunchedAt", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessLaunchedAtList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessNameList getProcessName() {
        return software.amazon.jsii.Kernel.get(this, "processName", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessNameList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessParentPidList getProcessParentPid() {
        return software.amazon.jsii.Kernel.get(this, "processParentPid", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessParentPidList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessPathList getProcessPath() {
        return software.amazon.jsii.Kernel.get(this, "processPath", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessPathList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessPidList getProcessPid() {
        return software.amazon.jsii.Kernel.get(this, "processPid", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessPidList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessTerminatedAtList getProcessTerminatedAt() {
        return software.amazon.jsii.Kernel.get(this, "processTerminatedAt", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersProcessTerminatedAtList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersProductArnList getProductArn() {
        return software.amazon.jsii.Kernel.get(this, "productArn", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersProductArnList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersProductFieldsList getProductFields() {
        return software.amazon.jsii.Kernel.get(this, "productFields", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersProductFieldsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersProductNameList getProductName() {
        return software.amazon.jsii.Kernel.get(this, "productName", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersProductNameList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersRecommendationTextList getRecommendationText() {
        return software.amazon.jsii.Kernel.get(this, "recommendationText", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersRecommendationTextList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersRecordStateList getRecordState() {
        return software.amazon.jsii.Kernel.get(this, "recordState", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersRecordStateList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersRelatedFindingsIdList getRelatedFindingsId() {
        return software.amazon.jsii.Kernel.get(this, "relatedFindingsId", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersRelatedFindingsIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersRelatedFindingsProductArnList getRelatedFindingsProductArn() {
        return software.amazon.jsii.Kernel.get(this, "relatedFindingsProductArn", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersRelatedFindingsProductArnList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceIamInstanceProfileArnList getResourceAwsEc2InstanceIamInstanceProfileArn() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsEc2InstanceIamInstanceProfileArn", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceIamInstanceProfileArnList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceImageIdList getResourceAwsEc2InstanceImageId() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsEc2InstanceImageId", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceImageIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceIpv4AddressesList getResourceAwsEc2InstanceIpv4Addresses() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsEc2InstanceIpv4Addresses", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceIpv4AddressesList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceIpv6AddressesList getResourceAwsEc2InstanceIpv6Addresses() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsEc2InstanceIpv6Addresses", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceIpv6AddressesList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceKeyNameList getResourceAwsEc2InstanceKeyName() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsEc2InstanceKeyName", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceKeyNameList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAtList getResourceAwsEc2InstanceLaunchedAt() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsEc2InstanceLaunchedAt", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAtList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceSubnetIdList getResourceAwsEc2InstanceSubnetId() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsEc2InstanceSubnetId", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceSubnetIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceTypeList getResourceAwsEc2InstanceType() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsEc2InstanceType", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceTypeList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceVpcIdList getResourceAwsEc2InstanceVpcId() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsEc2InstanceVpcId", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceVpcIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyCreatedAtList getResourceAwsIamAccessKeyCreatedAt() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsIamAccessKeyCreatedAt", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyCreatedAtList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyStatusList getResourceAwsIamAccessKeyStatus() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsIamAccessKeyStatus", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyStatusList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyUserNameList getResourceAwsIamAccessKeyUserName() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsIamAccessKeyUserName", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsIamAccessKeyUserNameList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsS3BucketOwnerIdList getResourceAwsS3BucketOwnerId() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsS3BucketOwnerId", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsS3BucketOwnerIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsS3BucketOwnerNameList getResourceAwsS3BucketOwnerName() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsS3BucketOwnerName", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsS3BucketOwnerNameList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerImageIdList getResourceContainerImageId() {
        return software.amazon.jsii.Kernel.get(this, "resourceContainerImageId", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerImageIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerImageNameList getResourceContainerImageName() {
        return software.amazon.jsii.Kernel.get(this, "resourceContainerImageName", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerImageNameList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerLaunchedAtList getResourceContainerLaunchedAt() {
        return software.amazon.jsii.Kernel.get(this, "resourceContainerLaunchedAt", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerLaunchedAtList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerNameList getResourceContainerName() {
        return software.amazon.jsii.Kernel.get(this, "resourceContainerName", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceContainerNameList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceDetailsOtherList getResourceDetailsOther() {
        return software.amazon.jsii.Kernel.get(this, "resourceDetailsOther", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceDetailsOtherList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceIdList getResourceId() {
        return software.amazon.jsii.Kernel.get(this, "resourceId", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceIdList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourcePartitionList getResourcePartition() {
        return software.amazon.jsii.Kernel.get(this, "resourcePartition", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourcePartitionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceRegionList getResourceRegion() {
        return software.amazon.jsii.Kernel.get(this, "resourceRegion", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceRegionList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceTagsList getResourceTags() {
        return software.amazon.jsii.Kernel.get(this, "resourceTags", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceTagsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceTypeList getResourceType() {
        return software.amazon.jsii.Kernel.get(this, "resourceType", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceTypeList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersSeverityLabelList getSeverityLabel() {
        return software.amazon.jsii.Kernel.get(this, "severityLabel", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersSeverityLabelList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersSourceUrlList getSourceUrl() {
        return software.amazon.jsii.Kernel.get(this, "sourceUrl", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersSourceUrlList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorCategoryList getThreatIntelIndicatorCategory() {
        return software.amazon.jsii.Kernel.get(this, "threatIntelIndicatorCategory", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorCategoryList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorLastObservedAtList getThreatIntelIndicatorLastObservedAt() {
        return software.amazon.jsii.Kernel.get(this, "threatIntelIndicatorLastObservedAt", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorLastObservedAtList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorSourceList getThreatIntelIndicatorSource() {
        return software.amazon.jsii.Kernel.get(this, "threatIntelIndicatorSource", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorSourceList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorSourceUrlList getThreatIntelIndicatorSourceUrl() {
        return software.amazon.jsii.Kernel.get(this, "threatIntelIndicatorSourceUrl", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorSourceUrlList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorTypeList getThreatIntelIndicatorType() {
        return software.amazon.jsii.Kernel.get(this, "threatIntelIndicatorType", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorTypeList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorValueList getThreatIntelIndicatorValue() {
        return software.amazon.jsii.Kernel.get(this, "threatIntelIndicatorValue", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersThreatIntelIndicatorValueList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersTitleList getTitle() {
        return software.amazon.jsii.Kernel.get(this, "title", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersTitleList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersTypeList getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersTypeList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersUpdatedAtList getUpdatedAt() {
        return software.amazon.jsii.Kernel.get(this, "updatedAt", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersUpdatedAtList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersUserDefinedValuesList getUserDefinedValues() {
        return software.amazon.jsii.Kernel.get(this, "userDefinedValues", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersUserDefinedValuesList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersVerificationStateList getVerificationState() {
        return software.amazon.jsii.Kernel.get(this, "verificationState", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersVerificationStateList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_insight.SecurityhubInsightFiltersWorkflowStatusList getWorkflowStatus() {
        return software.amazon.jsii.Kernel.get(this, "workflowStatus", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersWorkflowStatusList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAwsAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCompanyNameInput() {
        return software.amazon.jsii.Kernel.get(this, "companyNameInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.Object getFindingProviderFieldsConfidenceInput() {
        return software.amazon.jsii.Kernel.get(this, "findingProviderFieldsConfidenceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFindingProviderFieldsCriticalityInput() {
        return software.amazon.jsii.Kernel.get(this, "findingProviderFieldsCriticalityInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFindingProviderFieldsRelatedFindingsIdInput() {
        return software.amazon.jsii.Kernel.get(this, "findingProviderFieldsRelatedFindingsIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFindingProviderFieldsRelatedFindingsProductArnInput() {
        return software.amazon.jsii.Kernel.get(this, "findingProviderFieldsRelatedFindingsProductArnInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFindingProviderFieldsSeverityLabelInput() {
        return software.amazon.jsii.Kernel.get(this, "findingProviderFieldsSeverityLabelInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFindingProviderFieldsSeverityOriginalInput() {
        return software.amazon.jsii.Kernel.get(this, "findingProviderFieldsSeverityOriginalInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFindingProviderFieldsTypesInput() {
        return software.amazon.jsii.Kernel.get(this, "findingProviderFieldsTypesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.Object getKeywordInput() {
        return software.amazon.jsii.Kernel.get(this, "keywordInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLastObservedAtInput() {
        return software.amazon.jsii.Kernel.get(this, "lastObservedAtInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMalwareNameInput() {
        return software.amazon.jsii.Kernel.get(this, "malwareNameInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMalwarePathInput() {
        return software.amazon.jsii.Kernel.get(this, "malwarePathInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMalwareStateInput() {
        return software.amazon.jsii.Kernel.get(this, "malwareStateInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMalwareTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "malwareTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNetworkDestinationDomainInput() {
        return software.amazon.jsii.Kernel.get(this, "networkDestinationDomainInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNetworkDestinationIpv4Input() {
        return software.amazon.jsii.Kernel.get(this, "networkDestinationIpv4Input", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNetworkDestinationIpv6Input() {
        return software.amazon.jsii.Kernel.get(this, "networkDestinationIpv6Input", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNetworkDestinationPortInput() {
        return software.amazon.jsii.Kernel.get(this, "networkDestinationPortInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNetworkDirectionInput() {
        return software.amazon.jsii.Kernel.get(this, "networkDirectionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNetworkProtocolInput() {
        return software.amazon.jsii.Kernel.get(this, "networkProtocolInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNetworkSourceDomainInput() {
        return software.amazon.jsii.Kernel.get(this, "networkSourceDomainInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNetworkSourceIpv4Input() {
        return software.amazon.jsii.Kernel.get(this, "networkSourceIpv4Input", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNetworkSourceIpv6Input() {
        return software.amazon.jsii.Kernel.get(this, "networkSourceIpv6Input", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNetworkSourceMacInput() {
        return software.amazon.jsii.Kernel.get(this, "networkSourceMacInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNetworkSourcePortInput() {
        return software.amazon.jsii.Kernel.get(this, "networkSourcePortInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.Object getProcessLaunchedAtInput() {
        return software.amazon.jsii.Kernel.get(this, "processLaunchedAtInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getProcessNameInput() {
        return software.amazon.jsii.Kernel.get(this, "processNameInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getProcessParentPidInput() {
        return software.amazon.jsii.Kernel.get(this, "processParentPidInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getProcessPathInput() {
        return software.amazon.jsii.Kernel.get(this, "processPathInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getProcessPidInput() {
        return software.amazon.jsii.Kernel.get(this, "processPidInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getProcessTerminatedAtInput() {
        return software.amazon.jsii.Kernel.get(this, "processTerminatedAtInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getProductArnInput() {
        return software.amazon.jsii.Kernel.get(this, "productArnInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getProductFieldsInput() {
        return software.amazon.jsii.Kernel.get(this, "productFieldsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getProductNameInput() {
        return software.amazon.jsii.Kernel.get(this, "productNameInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRecommendationTextInput() {
        return software.amazon.jsii.Kernel.get(this, "recommendationTextInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceAwsEc2InstanceIamInstanceProfileArnInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsEc2InstanceIamInstanceProfileArnInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceAwsEc2InstanceImageIdInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsEc2InstanceImageIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceAwsEc2InstanceIpv4AddressesInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsEc2InstanceIpv4AddressesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceAwsEc2InstanceIpv6AddressesInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsEc2InstanceIpv6AddressesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceAwsEc2InstanceKeyNameInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsEc2InstanceKeyNameInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceAwsEc2InstanceLaunchedAtInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsEc2InstanceLaunchedAtInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceAwsEc2InstanceSubnetIdInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsEc2InstanceSubnetIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceAwsEc2InstanceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsEc2InstanceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceAwsEc2InstanceVpcIdInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsEc2InstanceVpcIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceAwsIamAccessKeyCreatedAtInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsIamAccessKeyCreatedAtInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceAwsIamAccessKeyStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsIamAccessKeyStatusInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceAwsIamAccessKeyUserNameInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsIamAccessKeyUserNameInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceAwsS3BucketOwnerIdInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsS3BucketOwnerIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceAwsS3BucketOwnerNameInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceAwsS3BucketOwnerNameInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceContainerImageIdInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceContainerImageIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceContainerImageNameInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceContainerImageNameInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceContainerLaunchedAtInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceContainerLaunchedAtInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceContainerNameInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceContainerNameInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.Object getThreatIntelIndicatorCategoryInput() {
        return software.amazon.jsii.Kernel.get(this, "threatIntelIndicatorCategoryInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getThreatIntelIndicatorLastObservedAtInput() {
        return software.amazon.jsii.Kernel.get(this, "threatIntelIndicatorLastObservedAtInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getThreatIntelIndicatorSourceInput() {
        return software.amazon.jsii.Kernel.get(this, "threatIntelIndicatorSourceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getThreatIntelIndicatorSourceUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "threatIntelIndicatorSourceUrlInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getThreatIntelIndicatorTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "threatIntelIndicatorTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getThreatIntelIndicatorValueInput() {
        return software.amazon.jsii.Kernel.get(this, "threatIntelIndicatorValueInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.Object getUserDefinedValuesInput() {
        return software.amazon.jsii.Kernel.get(this, "userDefinedValuesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVerificationStateInput() {
        return software.amazon.jsii.Kernel.get(this, "verificationStateInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getWorkflowStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "workflowStatusInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.securityhub_insight.SecurityhubInsightFilters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFilters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.securityhub_insight.SecurityhubInsightFilters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
