package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.882Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettingsOutputReference")
public class MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetColumnDepth() {
        software.amazon.jsii.Kernel.call(this, "resetColumnDepth", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeFec() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeFec", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRowLength() {
        software.amazon.jsii.Kernel.call(this, "resetRowLength", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getColumnDepthInput() {
        return software.amazon.jsii.Kernel.get(this, "columnDepthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIncludeFecInput() {
        return software.amazon.jsii.Kernel.get(this, "includeFecInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRowLengthInput() {
        return software.amazon.jsii.Kernel.get(this, "rowLengthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getColumnDepth() {
        return software.amazon.jsii.Kernel.get(this, "columnDepth", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setColumnDepth(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "columnDepth", java.util.Objects.requireNonNull(value, "columnDepth is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIncludeFec() {
        return software.amazon.jsii.Kernel.get(this, "includeFec", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIncludeFec(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "includeFec", java.util.Objects.requireNonNull(value, "includeFec is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRowLength() {
        return software.amazon.jsii.Kernel.get(this, "rowLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRowLength(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "rowLength", java.util.Objects.requireNonNull(value, "rowLength is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
