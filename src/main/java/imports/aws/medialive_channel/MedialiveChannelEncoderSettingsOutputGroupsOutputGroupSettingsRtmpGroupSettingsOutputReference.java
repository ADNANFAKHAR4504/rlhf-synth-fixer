package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.875Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettingsOutputReference")
public class MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAdMarkers() {
        software.amazon.jsii.Kernel.call(this, "resetAdMarkers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAuthenticationScheme() {
        software.amazon.jsii.Kernel.call(this, "resetAuthenticationScheme", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCacheFullBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetCacheFullBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCacheLength() {
        software.amazon.jsii.Kernel.call(this, "resetCacheLength", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCaptionData() {
        software.amazon.jsii.Kernel.call(this, "resetCaptionData", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInputLossAction() {
        software.amazon.jsii.Kernel.call(this, "resetInputLossAction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRestartDelay() {
        software.amazon.jsii.Kernel.call(this, "resetRestartDelay", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAdMarkersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "adMarkersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthenticationSchemeInput() {
        return software.amazon.jsii.Kernel.get(this, "authenticationSchemeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCacheFullBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "cacheFullBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCacheLengthInput() {
        return software.amazon.jsii.Kernel.get(this, "cacheLengthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCaptionDataInput() {
        return software.amazon.jsii.Kernel.get(this, "captionDataInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputLossActionInput() {
        return software.amazon.jsii.Kernel.get(this, "inputLossActionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRestartDelayInput() {
        return software.amazon.jsii.Kernel.get(this, "restartDelayInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAdMarkers() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "adMarkers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAdMarkers(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "adMarkers", java.util.Objects.requireNonNull(value, "adMarkers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthenticationScheme() {
        return software.amazon.jsii.Kernel.get(this, "authenticationScheme", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthenticationScheme(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authenticationScheme", java.util.Objects.requireNonNull(value, "authenticationScheme is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCacheFullBehavior() {
        return software.amazon.jsii.Kernel.get(this, "cacheFullBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCacheFullBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cacheFullBehavior", java.util.Objects.requireNonNull(value, "cacheFullBehavior is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCacheLength() {
        return software.amazon.jsii.Kernel.get(this, "cacheLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setCacheLength(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "cacheLength", java.util.Objects.requireNonNull(value, "cacheLength is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCaptionData() {
        return software.amazon.jsii.Kernel.get(this, "captionData", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCaptionData(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "captionData", java.util.Objects.requireNonNull(value, "captionData is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInputLossAction() {
        return software.amazon.jsii.Kernel.get(this, "inputLossAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInputLossAction(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inputLossAction", java.util.Objects.requireNonNull(value, "inputLossAction is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRestartDelay() {
        return software.amazon.jsii.Kernel.get(this, "restartDelay", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRestartDelay(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "restartDelay", java.util.Objects.requireNonNull(value, "restartDelay is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
