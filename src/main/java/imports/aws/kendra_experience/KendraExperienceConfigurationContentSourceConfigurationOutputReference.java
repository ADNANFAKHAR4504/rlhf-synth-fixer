package imports.aws.kendra_experience;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.432Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraExperience.KendraExperienceConfigurationContentSourceConfigurationOutputReference")
public class KendraExperienceConfigurationContentSourceConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KendraExperienceConfigurationContentSourceConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KendraExperienceConfigurationContentSourceConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KendraExperienceConfigurationContentSourceConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDataSourceIds() {
        software.amazon.jsii.Kernel.call(this, "resetDataSourceIds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDirectPutContent() {
        software.amazon.jsii.Kernel.call(this, "resetDirectPutContent", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFaqIds() {
        software.amazon.jsii.Kernel.call(this, "resetFaqIds", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDataSourceIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "dataSourceIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDirectPutContentInput() {
        return software.amazon.jsii.Kernel.get(this, "directPutContentInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getFaqIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "faqIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getDataSourceIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "dataSourceIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setDataSourceIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "dataSourceIds", java.util.Objects.requireNonNull(value, "dataSourceIds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDirectPutContent() {
        return software.amazon.jsii.Kernel.get(this, "directPutContent", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDirectPutContent(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "directPutContent", java.util.Objects.requireNonNull(value, "directPutContent is required"));
    }

    public void setDirectPutContent(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "directPutContent", java.util.Objects.requireNonNull(value, "directPutContent is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getFaqIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "faqIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setFaqIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "faqIds", java.util.Objects.requireNonNull(value, "faqIds is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kendra_experience.KendraExperienceConfigurationContentSourceConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kendra_experience.KendraExperienceConfigurationContentSourceConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kendra_experience.KendraExperienceConfigurationContentSourceConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
