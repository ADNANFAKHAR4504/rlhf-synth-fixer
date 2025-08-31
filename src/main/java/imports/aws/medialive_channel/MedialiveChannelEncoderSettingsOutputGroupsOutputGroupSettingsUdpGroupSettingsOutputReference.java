package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.875Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettingsOutputReference")
public class MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetInputLossAction() {
        software.amazon.jsii.Kernel.call(this, "resetInputLossAction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimedMetadataId3Frame() {
        software.amazon.jsii.Kernel.call(this, "resetTimedMetadataId3Frame", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimedMetadataId3Period() {
        software.amazon.jsii.Kernel.call(this, "resetTimedMetadataId3Period", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputLossActionInput() {
        return software.amazon.jsii.Kernel.get(this, "inputLossActionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimedMetadataId3FrameInput() {
        return software.amazon.jsii.Kernel.get(this, "timedMetadataId3FrameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTimedMetadataId3PeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "timedMetadataId3PeriodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInputLossAction() {
        return software.amazon.jsii.Kernel.get(this, "inputLossAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInputLossAction(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inputLossAction", java.util.Objects.requireNonNull(value, "inputLossAction is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimedMetadataId3Frame() {
        return software.amazon.jsii.Kernel.get(this, "timedMetadataId3Frame", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimedMetadataId3Frame(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timedMetadataId3Frame", java.util.Objects.requireNonNull(value, "timedMetadataId3Frame is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTimedMetadataId3Period() {
        return software.amazon.jsii.Kernel.get(this, "timedMetadataId3Period", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTimedMetadataId3Period(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "timedMetadataId3Period", java.util.Objects.requireNonNull(value, "timedMetadataId3Period is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsUdpGroupSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
