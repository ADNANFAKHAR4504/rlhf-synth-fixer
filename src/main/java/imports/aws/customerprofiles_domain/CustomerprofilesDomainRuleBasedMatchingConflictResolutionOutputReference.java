package imports.aws.customerprofiles_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.403Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.customerprofilesDomain.CustomerprofilesDomainRuleBasedMatchingConflictResolutionOutputReference")
public class CustomerprofilesDomainRuleBasedMatchingConflictResolutionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CustomerprofilesDomainRuleBasedMatchingConflictResolutionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CustomerprofilesDomainRuleBasedMatchingConflictResolutionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CustomerprofilesDomainRuleBasedMatchingConflictResolutionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetSourceName() {
        software.amazon.jsii.Kernel.call(this, "resetSourceName", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConflictResolvingModelInput() {
        return software.amazon.jsii.Kernel.get(this, "conflictResolvingModelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceNameInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConflictResolvingModel() {
        return software.amazon.jsii.Kernel.get(this, "conflictResolvingModel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConflictResolvingModel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "conflictResolvingModel", java.util.Objects.requireNonNull(value, "conflictResolvingModel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceName() {
        return software.amazon.jsii.Kernel.get(this, "sourceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceName", java.util.Objects.requireNonNull(value, "sourceName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingConflictResolution getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingConflictResolution.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.customerprofiles_domain.CustomerprofilesDomainRuleBasedMatchingConflictResolution value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
