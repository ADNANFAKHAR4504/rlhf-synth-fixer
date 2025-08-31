package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.890Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsOutputReference")
public class MedialiveChannelInputAttachmentsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelInputAttachmentsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelInputAttachmentsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public MedialiveChannelInputAttachmentsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putAutomaticInputFailoverSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings value) {
        software.amazon.jsii.Kernel.call(this, "putAutomaticInputFailoverSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInputSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettings value) {
        software.amazon.jsii.Kernel.call(this, "putInputSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAutomaticInputFailoverSettings() {
        software.amazon.jsii.Kernel.call(this, "resetAutomaticInputFailoverSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInputSettings() {
        software.amazon.jsii.Kernel.call(this, "resetInputSettings", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsOutputReference getAutomaticInputFailoverSettings() {
        return software.amazon.jsii.Kernel.get(this, "automaticInputFailoverSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsOutputReference getInputSettings() {
        return software.amazon.jsii.Kernel.get(this, "inputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings getAutomaticInputFailoverSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "automaticInputFailoverSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputAttachmentNameInput() {
        return software.amazon.jsii.Kernel.get(this, "inputAttachmentNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputIdInput() {
        return software.amazon.jsii.Kernel.get(this, "inputIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettings getInputSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "inputSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettings.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInputAttachmentName() {
        return software.amazon.jsii.Kernel.get(this, "inputAttachmentName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInputAttachmentName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inputAttachmentName", java.util.Objects.requireNonNull(value, "inputAttachmentName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInputId() {
        return software.amazon.jsii.Kernel.get(this, "inputId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInputId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inputId", java.util.Objects.requireNonNull(value, "inputId is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachments value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
