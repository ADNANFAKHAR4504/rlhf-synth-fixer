package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.881Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettingsOutputReference")
public class MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetOutputSdt() {
        software.amazon.jsii.Kernel.call(this, "resetOutputSdt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRepInterval() {
        software.amazon.jsii.Kernel.call(this, "resetRepInterval", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServiceName() {
        software.amazon.jsii.Kernel.call(this, "resetServiceName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServiceProviderName() {
        software.amazon.jsii.Kernel.call(this, "resetServiceProviderName", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOutputSdtInput() {
        return software.amazon.jsii.Kernel.get(this, "outputSdtInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRepIntervalInput() {
        return software.amazon.jsii.Kernel.get(this, "repIntervalInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceNameInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceProviderNameInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceProviderNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutputSdt() {
        return software.amazon.jsii.Kernel.get(this, "outputSdt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOutputSdt(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "outputSdt", java.util.Objects.requireNonNull(value, "outputSdt is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRepInterval() {
        return software.amazon.jsii.Kernel.get(this, "repInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRepInterval(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "repInterval", java.util.Objects.requireNonNull(value, "repInterval is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceName() {
        return software.amazon.jsii.Kernel.get(this, "serviceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceName", java.util.Objects.requireNonNull(value, "serviceName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceProviderName() {
        return software.amazon.jsii.Kernel.get(this, "serviceProviderName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceProviderName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceProviderName", java.util.Objects.requireNonNull(value, "serviceProviderName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsContainerSettingsM2TsSettingsDvbSdtSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
