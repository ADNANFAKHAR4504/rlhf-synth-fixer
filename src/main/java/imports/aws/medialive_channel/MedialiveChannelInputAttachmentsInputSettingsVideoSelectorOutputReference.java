package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.890Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsVideoSelectorOutputReference")
public class MedialiveChannelInputAttachmentsInputSettingsVideoSelectorOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelInputAttachmentsInputSettingsVideoSelectorOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelInputAttachmentsInputSettingsVideoSelectorOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelInputAttachmentsInputSettingsVideoSelectorOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetColorSpace() {
        software.amazon.jsii.Kernel.call(this, "resetColorSpace", software.amazon.jsii.NativeType.VOID);
    }

    public void resetColorSpaceUsage() {
        software.amazon.jsii.Kernel.call(this, "resetColorSpaceUsage", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getColorSpaceInput() {
        return software.amazon.jsii.Kernel.get(this, "colorSpaceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getColorSpaceUsageInput() {
        return software.amazon.jsii.Kernel.get(this, "colorSpaceUsageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getColorSpace() {
        return software.amazon.jsii.Kernel.get(this, "colorSpace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setColorSpace(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "colorSpace", java.util.Objects.requireNonNull(value, "colorSpace is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getColorSpaceUsage() {
        return software.amazon.jsii.Kernel.get(this, "colorSpaceUsage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setColorSpaceUsage(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "colorSpaceUsage", java.util.Objects.requireNonNull(value, "colorSpaceUsage is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsVideoSelector getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsVideoSelector.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsVideoSelector value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
