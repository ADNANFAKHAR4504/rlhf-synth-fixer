package imports.aws.imagebuilder_image_pipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.359Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderImagePipeline.ImagebuilderImagePipelineImageTestsConfigurationOutputReference")
public class ImagebuilderImagePipelineImageTestsConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ImagebuilderImagePipelineImageTestsConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ImagebuilderImagePipelineImageTestsConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ImagebuilderImagePipelineImageTestsConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetImageTestsEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetImageTestsEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeoutMinutes() {
        software.amazon.jsii.Kernel.call(this, "resetTimeoutMinutes", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getImageTestsEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "imageTestsEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutMinutesInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutMinutesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getImageTestsEnabled() {
        return software.amazon.jsii.Kernel.get(this, "imageTestsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setImageTestsEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "imageTestsEnabled", java.util.Objects.requireNonNull(value, "imageTestsEnabled is required"));
    }

    public void setImageTestsEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "imageTestsEnabled", java.util.Objects.requireNonNull(value, "imageTestsEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTimeoutMinutes() {
        return software.amazon.jsii.Kernel.get(this, "timeoutMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTimeoutMinutes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "timeoutMinutes", java.util.Objects.requireNonNull(value, "timeoutMinutes is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageTestsConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageTestsConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_image_pipeline.ImagebuilderImagePipelineImageTestsConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
