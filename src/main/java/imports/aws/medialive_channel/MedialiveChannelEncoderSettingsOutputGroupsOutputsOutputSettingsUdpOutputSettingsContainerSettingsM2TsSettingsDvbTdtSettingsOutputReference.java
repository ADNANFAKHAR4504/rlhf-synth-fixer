package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.881Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettingsOutputReference")
public class MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetRepInterval() {
        software.amazon.jsii.Kernel.call(this, "resetRepInterval", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRepIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "repIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRepInterval() {
        return software.amazon.jsii.Kernel.get(this, "repInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRepInterval(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "repInterval", java.util.Objects.requireNonNull(value, "repInterval is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbTdtSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
