package imports.aws.ecrpublic_repository;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.122Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecrpublicRepository.EcrpublicRepositoryCatalogDataOutputReference")
public class EcrpublicRepositoryCatalogDataOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EcrpublicRepositoryCatalogDataOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EcrpublicRepositoryCatalogDataOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EcrpublicRepositoryCatalogDataOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAboutText() {
        software.amazon.jsii.Kernel.call(this, "resetAboutText", software.amazon.jsii.NativeType.VOID);
    }

    public void resetArchitectures() {
        software.amazon.jsii.Kernel.call(this, "resetArchitectures", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogoImageBlob() {
        software.amazon.jsii.Kernel.call(this, "resetLogoImageBlob", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOperatingSystems() {
        software.amazon.jsii.Kernel.call(this, "resetOperatingSystems", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUsageText() {
        software.amazon.jsii.Kernel.call(this, "resetUsageText", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAboutTextInput() {
        return software.amazon.jsii.Kernel.get(this, "aboutTextInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getArchitecturesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "architecturesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogoImageBlobInput() {
        return software.amazon.jsii.Kernel.get(this, "logoImageBlobInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getOperatingSystemsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "operatingSystemsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUsageTextInput() {
        return software.amazon.jsii.Kernel.get(this, "usageTextInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAboutText() {
        return software.amazon.jsii.Kernel.get(this, "aboutText", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAboutText(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "aboutText", java.util.Objects.requireNonNull(value, "aboutText is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getArchitectures() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "architectures", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setArchitectures(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "architectures", java.util.Objects.requireNonNull(value, "architectures is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogoImageBlob() {
        return software.amazon.jsii.Kernel.get(this, "logoImageBlob", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogoImageBlob(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logoImageBlob", java.util.Objects.requireNonNull(value, "logoImageBlob is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getOperatingSystems() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "operatingSystems", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setOperatingSystems(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "operatingSystems", java.util.Objects.requireNonNull(value, "operatingSystems is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUsageText() {
        return software.amazon.jsii.Kernel.get(this, "usageText", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUsageText(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "usageText", java.util.Objects.requireNonNull(value, "usageText is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecrpublic_repository.EcrpublicRepositoryCatalogData getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ecrpublic_repository.EcrpublicRepositoryCatalogData.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ecrpublic_repository.EcrpublicRepositoryCatalogData value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
