package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.315Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultUserSettingsStudioWebPortalSettingsOutputReference")
public class SagemakerDomainDefaultUserSettingsStudioWebPortalSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerDomainDefaultUserSettingsStudioWebPortalSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerDomainDefaultUserSettingsStudioWebPortalSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerDomainDefaultUserSettingsStudioWebPortalSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetHiddenAppTypes() {
        software.amazon.jsii.Kernel.call(this, "resetHiddenAppTypes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHiddenInstanceTypes() {
        software.amazon.jsii.Kernel.call(this, "resetHiddenInstanceTypes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHiddenMlTools() {
        software.amazon.jsii.Kernel.call(this, "resetHiddenMlTools", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getHiddenAppTypesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "hiddenAppTypesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getHiddenInstanceTypesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "hiddenInstanceTypesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getHiddenMlToolsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "hiddenMlToolsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getHiddenAppTypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "hiddenAppTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setHiddenAppTypes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "hiddenAppTypes", java.util.Objects.requireNonNull(value, "hiddenAppTypes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getHiddenInstanceTypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "hiddenInstanceTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setHiddenInstanceTypes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "hiddenInstanceTypes", java.util.Objects.requireNonNull(value, "hiddenInstanceTypes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getHiddenMlTools() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "hiddenMlTools", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setHiddenMlTools(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "hiddenMlTools", java.util.Objects.requireNonNull(value, "hiddenMlTools is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsStudioWebPortalSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsStudioWebPortalSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsStudioWebPortalSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
