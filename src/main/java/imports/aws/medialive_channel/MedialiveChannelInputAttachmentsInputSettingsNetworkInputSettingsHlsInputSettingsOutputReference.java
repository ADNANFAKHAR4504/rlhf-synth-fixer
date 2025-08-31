package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.890Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettingsOutputReference")
public class MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBandwidth() {
        software.amazon.jsii.Kernel.call(this, "resetBandwidth", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBufferSegments() {
        software.amazon.jsii.Kernel.call(this, "resetBufferSegments", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRetries() {
        software.amazon.jsii.Kernel.call(this, "resetRetries", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRetryInterval() {
        software.amazon.jsii.Kernel.call(this, "resetRetryInterval", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScte35Source() {
        software.amazon.jsii.Kernel.call(this, "resetScte35Source", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBandwidthInput() {
        return software.amazon.jsii.Kernel.get(this, "bandwidthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBufferSegmentsInput() {
        return software.amazon.jsii.Kernel.get(this, "bufferSegmentsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRetriesInput() {
        return software.amazon.jsii.Kernel.get(this, "retriesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRetryIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "retryIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScte35SourceInput() {
        return software.amazon.jsii.Kernel.get(this, "scte35SourceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBandwidth() {
        return software.amazon.jsii.Kernel.get(this, "bandwidth", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBandwidth(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "bandwidth", java.util.Objects.requireNonNull(value, "bandwidth is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBufferSegments() {
        return software.amazon.jsii.Kernel.get(this, "bufferSegments", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBufferSegments(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "bufferSegments", java.util.Objects.requireNonNull(value, "bufferSegments is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRetries() {
        return software.amazon.jsii.Kernel.get(this, "retries", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRetries(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "retries", java.util.Objects.requireNonNull(value, "retries is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRetryInterval() {
        return software.amazon.jsii.Kernel.get(this, "retryInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRetryInterval(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "retryInterval", java.util.Objects.requireNonNull(value, "retryInterval is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScte35Source() {
        return software.amazon.jsii.Kernel.get(this, "scte35Source", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScte35Source(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scte35Source", java.util.Objects.requireNonNull(value, "scte35Source is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
