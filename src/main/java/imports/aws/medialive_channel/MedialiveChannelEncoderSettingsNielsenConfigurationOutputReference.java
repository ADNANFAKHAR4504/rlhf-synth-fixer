package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.869Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsNielsenConfigurationOutputReference")
public class MedialiveChannelEncoderSettingsNielsenConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsNielsenConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsNielsenConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsNielsenConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDistributorId() {
        software.amazon.jsii.Kernel.call(this, "resetDistributorId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNielsenPcmToId3Tagging() {
        software.amazon.jsii.Kernel.call(this, "resetNielsenPcmToId3Tagging", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDistributorIdInput() {
        return software.amazon.jsii.Kernel.get(this, "distributorIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNielsenPcmToId3TaggingInput() {
        return software.amazon.jsii.Kernel.get(this, "nielsenPcmToId3TaggingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDistributorId() {
        return software.amazon.jsii.Kernel.get(this, "distributorId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDistributorId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "distributorId", java.util.Objects.requireNonNull(value, "distributorId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNielsenPcmToId3Tagging() {
        return software.amazon.jsii.Kernel.get(this, "nielsenPcmToId3Tagging", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNielsenPcmToId3Tagging(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "nielsenPcmToId3Tagging", java.util.Objects.requireNonNull(value, "nielsenPcmToId3Tagging is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsNielsenConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsNielsenConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsNielsenConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
