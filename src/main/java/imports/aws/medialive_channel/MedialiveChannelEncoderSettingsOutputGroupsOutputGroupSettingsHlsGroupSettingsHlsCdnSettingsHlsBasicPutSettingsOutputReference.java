package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.874Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsBasicPutSettingsOutputReference")
public class MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsBasicPutSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsBasicPutSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsBasicPutSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsBasicPutSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetConnectionRetryInterval() {
        software.amazon.jsii.Kernel.call(this, "resetConnectionRetryInterval", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFilecacheDuration() {
        software.amazon.jsii.Kernel.call(this, "resetFilecacheDuration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNumRetries() {
        software.amazon.jsii.Kernel.call(this, "resetNumRetries", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRestartDelay() {
        software.amazon.jsii.Kernel.call(this, "resetRestartDelay", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getConnectionRetryIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionRetryIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFilecacheDurationInput() {
        return software.amazon.jsii.Kernel.get(this, "filecacheDurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getNumRetriesInput() {
        return software.amazon.jsii.Kernel.get(this, "numRetriesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRestartDelayInput() {
        return software.amazon.jsii.Kernel.get(this, "restartDelayInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getConnectionRetryInterval() {
        return software.amazon.jsii.Kernel.get(this, "connectionRetryInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setConnectionRetryInterval(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "connectionRetryInterval", java.util.Objects.requireNonNull(value, "connectionRetryInterval is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFilecacheDuration() {
        return software.amazon.jsii.Kernel.get(this, "filecacheDuration", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFilecacheDuration(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "filecacheDuration", java.util.Objects.requireNonNull(value, "filecacheDuration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNumRetries() {
        return software.amazon.jsii.Kernel.get(this, "numRetries", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setNumRetries(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "numRetries", java.util.Objects.requireNonNull(value, "numRetries is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRestartDelay() {
        return software.amazon.jsii.Kernel.get(this, "restartDelay", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRestartDelay(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "restartDelay", java.util.Objects.requireNonNull(value, "restartDelay is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsBasicPutSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsBasicPutSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsBasicPutSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
