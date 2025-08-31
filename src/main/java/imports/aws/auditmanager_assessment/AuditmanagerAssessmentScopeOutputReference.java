package imports.aws.auditmanager_assessment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.086Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.auditmanagerAssessment.AuditmanagerAssessmentScopeOutputReference")
public class AuditmanagerAssessmentScopeOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AuditmanagerAssessmentScopeOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AuditmanagerAssessmentScopeOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public AuditmanagerAssessmentScopeOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putAwsAccounts(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.auditmanager_assessment.AuditmanagerAssessmentScopeAwsAccounts>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.auditmanager_assessment.AuditmanagerAssessmentScopeAwsAccounts> __cast_cd4240 = (java.util.List<imports.aws.auditmanager_assessment.AuditmanagerAssessmentScopeAwsAccounts>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.auditmanager_assessment.AuditmanagerAssessmentScopeAwsAccounts __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAwsAccounts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putAwsServices(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.auditmanager_assessment.AuditmanagerAssessmentScopeAwsServices>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.auditmanager_assessment.AuditmanagerAssessmentScopeAwsServices> __cast_cd4240 = (java.util.List<imports.aws.auditmanager_assessment.AuditmanagerAssessmentScopeAwsServices>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.auditmanager_assessment.AuditmanagerAssessmentScopeAwsServices __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAwsServices", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAwsAccounts() {
        software.amazon.jsii.Kernel.call(this, "resetAwsAccounts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAwsServices() {
        software.amazon.jsii.Kernel.call(this, "resetAwsServices", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.auditmanager_assessment.AuditmanagerAssessmentScopeAwsAccountsList getAwsAccounts() {
        return software.amazon.jsii.Kernel.get(this, "awsAccounts", software.amazon.jsii.NativeType.forClass(imports.aws.auditmanager_assessment.AuditmanagerAssessmentScopeAwsAccountsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.auditmanager_assessment.AuditmanagerAssessmentScopeAwsServicesList getAwsServices() {
        return software.amazon.jsii.Kernel.get(this, "awsServices", software.amazon.jsii.NativeType.forClass(imports.aws.auditmanager_assessment.AuditmanagerAssessmentScopeAwsServicesList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAwsAccountsInput() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAwsServicesInput() {
        return software.amazon.jsii.Kernel.get(this, "awsServicesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.auditmanager_assessment.AuditmanagerAssessmentScope value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
