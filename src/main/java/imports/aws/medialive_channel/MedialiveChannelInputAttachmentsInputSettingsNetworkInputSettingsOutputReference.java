package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.890Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsOutputReference")
public class MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putHlsInputSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings value) {
        software.amazon.jsii.Kernel.call(this, "putHlsInputSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetHlsInputSettings() {
        software.amazon.jsii.Kernel.call(this, "resetHlsInputSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServerValidation() {
        software.amazon.jsii.Kernel.call(this, "resetServerValidation", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettingsOutputReference getHlsInputSettings() {
        return software.amazon.jsii.Kernel.get(this, "hlsInputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings getHlsInputSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "hlsInputSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServerValidationInput() {
        return software.amazon.jsii.Kernel.get(this, "serverValidationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServerValidation() {
        return software.amazon.jsii.Kernel.get(this, "serverValidation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServerValidation(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serverValidation", java.util.Objects.requireNonNull(value, "serverValidation is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
