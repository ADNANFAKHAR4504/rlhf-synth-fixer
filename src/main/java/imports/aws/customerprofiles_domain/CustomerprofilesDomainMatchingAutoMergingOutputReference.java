package imports.aws.customerprofiles_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.403Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.customerprofilesDomain.CustomerprofilesDomainMatchingAutoMergingOutputReference")
public class CustomerprofilesDomainMatchingAutoMergingOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CustomerprofilesDomainMatchingAutoMergingOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CustomerprofilesDomainMatchingAutoMergingOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CustomerprofilesDomainMatchingAutoMergingOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putConflictResolution(final @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConflictResolution value) {
        software.amazon.jsii.Kernel.call(this, "putConflictResolution", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putConsolidation(final @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConsolidation value) {
        software.amazon.jsii.Kernel.call(this, "putConsolidation", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetConflictResolution() {
        software.amazon.jsii.Kernel.call(this, "resetConflictResolution", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConsolidation() {
        software.amazon.jsii.Kernel.call(this, "resetConsolidation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinAllowedConfidenceScoreForMerging() {
        software.amazon.jsii.Kernel.call(this, "resetMinAllowedConfidenceScoreForMerging", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConflictResolutionOutputReference getConflictResolution() {
        return software.amazon.jsii.Kernel.get(this, "conflictResolution", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConflictResolutionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConsolidationOutputReference getConsolidation() {
        return software.amazon.jsii.Kernel.get(this, "consolidation", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConsolidationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConflictResolution getConflictResolutionInput() {
        return software.amazon.jsii.Kernel.get(this, "conflictResolutionInput", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConflictResolution.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConsolidation getConsolidationInput() {
        return software.amazon.jsii.Kernel.get(this, "consolidationInput", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMergingConsolidation.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinAllowedConfidenceScoreForMergingInput() {
        return software.amazon.jsii.Kernel.get(this, "minAllowedConfidenceScoreForMergingInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinAllowedConfidenceScoreForMerging() {
        return software.amazon.jsii.Kernel.get(this, "minAllowedConfidenceScoreForMerging", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinAllowedConfidenceScoreForMerging(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minAllowedConfidenceScoreForMerging", java.util.Objects.requireNonNull(value, "minAllowedConfidenceScoreForMerging is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMerging getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMerging.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainMatchingAutoMerging value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
