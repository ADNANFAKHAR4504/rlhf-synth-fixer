package imports.aws.imagebuilder_image_pipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.359Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderImagePipeline.ImagebuilderImagePipelineImageScanningConfigurationOutputReference")
public class ImagebuilderImagePipelineImageScanningConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ImagebuilderImagePipelineImageScanningConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ImagebuilderImagePipelineImageScanningConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ImagebuilderImagePipelineImageScanningConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putEcrConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageScanningConfigurationEcrConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putEcrConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEcrConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetEcrConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImageScanningEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetImageScanningEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageScanningConfigurationEcrConfigurationOutputReference getEcrConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "ecrConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageScanningConfigurationEcrConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageScanningConfigurationEcrConfiguration getEcrConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "ecrConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageScanningConfigurationEcrConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getImageScanningEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "imageScanningEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getImageScanningEnabled() {
        return software.amazon.jsii.Kernel.get(this, "imageScanningEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setImageScanningEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "imageScanningEnabled", java.util.Objects.requireNonNull(value, "imageScanningEnabled is required"));
    }

    public void setImageScanningEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "imageScanningEnabled", java.util.Objects.requireNonNull(value, "imageScanningEnabled is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageScanningConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageScanningConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageScanningConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
