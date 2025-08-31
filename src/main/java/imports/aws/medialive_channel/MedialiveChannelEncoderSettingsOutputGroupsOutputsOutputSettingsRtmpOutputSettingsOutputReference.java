package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.881Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettingsOutputReference")
public class MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDestination(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettingsDestination value) {
        software.amazon.jsii.Kernel.call(this, "putDestination", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCertificateMode() {
        software.amazon.jsii.Kernel.call(this, "resetCertificateMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConnectionRetryInterval() {
        software.amazon.jsii.Kernel.call(this, "resetConnectionRetryInterval", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNumRetries() {
        software.amazon.jsii.Kernel.call(this, "resetNumRetries", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettingsDestinationOutputReference getDestination() {
        return software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettingsDestinationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCertificateModeInput() {
        return software.amazon.jsii.Kernel.get(this, "certificateModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getConnectionRetryIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionRetryIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettingsDestination getDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettingsDestination.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getNumRetriesInput() {
        return software.amazon.jsii.Kernel.get(this, "numRetriesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificateMode() {
        return software.amazon.jsii.Kernel.get(this, "certificateMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCertificateMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "certificateMode", java.util.Objects.requireNonNull(value, "certificateMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getConnectionRetryInterval() {
        return software.amazon.jsii.Kernel.get(this, "connectionRetryInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setConnectionRetryInterval(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "connectionRetryInterval", java.util.Objects.requireNonNull(value, "connectionRetryInterval is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNumRetries() {
        return software.amazon.jsii.Kernel.get(this, "numRetries", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setNumRetries(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "numRetries", java.util.Objects.requireNonNull(value, "numRetries is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsRtmpOutputSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
