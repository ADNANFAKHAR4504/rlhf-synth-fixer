package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.876Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbNitSettingsOutputReference")
public class MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbNitSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbNitSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbNitSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbNitSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetRepInterval() {
        software.amazon.jsii.Kernel.call(this, "resetRepInterval", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getNetworkIdInput() {
        return software.amazon.jsii.Kernel.get(this, "networkIdInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNetworkNameInput() {
        return software.amazon.jsii.Kernel.get(this, "networkNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRepIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "repIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNetworkId() {
        return software.amazon.jsii.Kernel.get(this, "networkId", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setNetworkId(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "networkId", java.util.Objects.requireNonNull(value, "networkId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNetworkName() {
        return software.amazon.jsii.Kernel.get(this, "networkName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNetworkName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "networkName", java.util.Objects.requireNonNull(value, "networkName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRepInterval() {
        return software.amazon.jsii.Kernel.get(this, "repInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRepInterval(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "repInterval", java.util.Objects.requireNonNull(value, "repInterval is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbNitSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbNitSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsArchiveOutputSettingsContainerSettingsM2TsSettingsDvbNitSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
