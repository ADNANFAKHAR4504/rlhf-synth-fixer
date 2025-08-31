package imports.aws.medialive_multiplex;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.893Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveMultiplex.MedialiveMultiplexMultiplexSettingsOutputReference")
public class MedialiveMultiplexMultiplexSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveMultiplexMultiplexSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveMultiplexMultiplexSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveMultiplexMultiplexSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetMaximumVideoBufferDelayMilliseconds() {
        software.amazon.jsii.Kernel.call(this, "resetMaximumVideoBufferDelayMilliseconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTransportStreamReservedBitrate() {
        software.amazon.jsii.Kernel.call(this, "resetTransportStreamReservedBitrate", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaximumVideoBufferDelayMillisecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumVideoBufferDelayMillisecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTransportStreamBitrateInput() {
        return software.amazon.jsii.Kernel.get(this, "transportStreamBitrateInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTransportStreamIdInput() {
        return software.amazon.jsii.Kernel.get(this, "transportStreamIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTransportStreamReservedBitrateInput() {
        return software.amazon.jsii.Kernel.get(this, "transportStreamReservedBitrateInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumVideoBufferDelayMilliseconds() {
        return software.amazon.jsii.Kernel.get(this, "maximumVideoBufferDelayMilliseconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaximumVideoBufferDelayMilliseconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maximumVideoBufferDelayMilliseconds", java.util.Objects.requireNonNull(value, "maximumVideoBufferDelayMilliseconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTransportStreamBitrate() {
        return software.amazon.jsii.Kernel.get(this, "transportStreamBitrate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTransportStreamBitrate(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "transportStreamBitrate", java.util.Objects.requireNonNull(value, "transportStreamBitrate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTransportStreamId() {
        return software.amazon.jsii.Kernel.get(this, "transportStreamId", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTransportStreamId(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "transportStreamId", java.util.Objects.requireNonNull(value, "transportStreamId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTransportStreamReservedBitrate() {
        return software.amazon.jsii.Kernel.get(this, "transportStreamReservedBitrate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTransportStreamReservedBitrate(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "transportStreamReservedBitrate", java.util.Objects.requireNonNull(value, "transportStreamReservedBitrate is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_multiplex.MedialiveMultiplexMultiplexSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_multiplex.MedialiveMultiplexMultiplexSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_multiplex.MedialiveMultiplexMultiplexSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
