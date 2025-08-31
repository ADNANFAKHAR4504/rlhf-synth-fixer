package imports.aws.imagebuilder_image;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.357Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderImage.ImagebuilderImageImageScanningConfigurationEcrConfigurationOutputReference")
public class ImagebuilderImageImageScanningConfigurationEcrConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ImagebuilderImageImageScanningConfigurationEcrConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ImagebuilderImageImageScanningConfigurationEcrConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ImagebuilderImageImageScanningConfigurationEcrConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetContainerTags() {
        software.amazon.jsii.Kernel.call(this, "resetContainerTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRepositoryName() {
        software.amazon.jsii.Kernel.call(this, "resetRepositoryName", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getContainerTagsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "containerTagsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRepositoryNameInput() {
        return software.amazon.jsii.Kernel.get(this, "repositoryNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getContainerTags() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "containerTags", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setContainerTags(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "containerTags", java.util.Objects.requireNonNull(value, "containerTags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRepositoryName() {
        return software.amazon.jsii.Kernel.get(this, "repositoryName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRepositoryName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "repositoryName", java.util.Objects.requireNonNull(value, "repositoryName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_image.ImagebuilderImageImageScanningConfigurationEcrConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_image.ImagebuilderImageImageScanningConfigurationEcrConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_image.ImagebuilderImageImageScanningConfigurationEcrConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
