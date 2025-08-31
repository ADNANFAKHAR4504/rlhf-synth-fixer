package imports.aws.opsworks_custom_layer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.006Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opsworksCustomLayer.OpsworksCustomLayerLoadBasedAutoScalingOutputReference")
public class OpsworksCustomLayerLoadBasedAutoScalingOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected OpsworksCustomLayerLoadBasedAutoScalingOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OpsworksCustomLayerLoadBasedAutoScalingOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public OpsworksCustomLayerLoadBasedAutoScalingOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDownscaling(final @org.jetbrains.annotations.NotNull imports.aws.opsworks_custom_layer.OpsworksCustomLayerLoadBasedAutoScalingDownscaling value) {
        software.amazon.jsii.Kernel.call(this, "putDownscaling", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putUpscaling(final @org.jetbrains.annotations.NotNull imports.aws.opsworks_custom_layer.OpsworksCustomLayerLoadBasedAutoScalingUpscaling value) {
        software.amazon.jsii.Kernel.call(this, "putUpscaling", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDownscaling() {
        software.amazon.jsii.Kernel.call(this, "resetDownscaling", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnable() {
        software.amazon.jsii.Kernel.call(this, "resetEnable", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUpscaling() {
        software.amazon.jsii.Kernel.call(this, "resetUpscaling", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opsworks_custom_layer.OpsworksCustomLayerLoadBasedAutoScalingDownscalingOutputReference getDownscaling() {
        return software.amazon.jsii.Kernel.get(this, "downscaling", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_custom_layer.OpsworksCustomLayerLoadBasedAutoScalingDownscalingOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opsworks_custom_layer.OpsworksCustomLayerLoadBasedAutoScalingUpscalingOutputReference getUpscaling() {
        return software.amazon.jsii.Kernel.get(this, "upscaling", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_custom_layer.OpsworksCustomLayerLoadBasedAutoScalingUpscalingOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opsworks_custom_layer.OpsworksCustomLayerLoadBasedAutoScalingDownscaling getDownscalingInput() {
        return software.amazon.jsii.Kernel.get(this, "downscalingInput", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_custom_layer.OpsworksCustomLayerLoadBasedAutoScalingDownscaling.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableInput() {
        return software.amazon.jsii.Kernel.get(this, "enableInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opsworks_custom_layer.OpsworksCustomLayerLoadBasedAutoScalingUpscaling getUpscalingInput() {
        return software.amazon.jsii.Kernel.get(this, "upscalingInput", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_custom_layer.OpsworksCustomLayerLoadBasedAutoScalingUpscaling.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnable() {
        return software.amazon.jsii.Kernel.get(this, "enable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnable(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enable", java.util.Objects.requireNonNull(value, "enable is required"));
    }

    public void setEnable(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enable", java.util.Objects.requireNonNull(value, "enable is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opsworks_custom_layer.OpsworksCustomLayerLoadBasedAutoScaling getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_custom_layer.OpsworksCustomLayerLoadBasedAutoScaling.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.opsworks_custom_layer.OpsworksCustomLayerLoadBasedAutoScaling value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
