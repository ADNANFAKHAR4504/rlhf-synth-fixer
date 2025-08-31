package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.874Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsOutputReference")
public class MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putHlsAkamaiSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsAkamaiSettings value) {
        software.amazon.jsii.Kernel.call(this, "putHlsAkamaiSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHlsBasicPutSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsBasicPutSettings value) {
        software.amazon.jsii.Kernel.call(this, "putHlsBasicPutSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHlsMediaStoreSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsMediaStoreSettings value) {
        software.amazon.jsii.Kernel.call(this, "putHlsMediaStoreSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHlsS3Settings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsS3Settings value) {
        software.amazon.jsii.Kernel.call(this, "putHlsS3Settings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHlsWebdavSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings value) {
        software.amazon.jsii.Kernel.call(this, "putHlsWebdavSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetHlsAkamaiSettings() {
        software.amazon.jsii.Kernel.call(this, "resetHlsAkamaiSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHlsBasicPutSettings() {
        software.amazon.jsii.Kernel.call(this, "resetHlsBasicPutSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHlsMediaStoreSettings() {
        software.amazon.jsii.Kernel.call(this, "resetHlsMediaStoreSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHlsS3Settings() {
        software.amazon.jsii.Kernel.call(this, "resetHlsS3Settings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHlsWebdavSettings() {
        software.amazon.jsii.Kernel.call(this, "resetHlsWebdavSettings", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsAkamaiSettingsOutputReference getHlsAkamaiSettings() {
        return software.amazon.jsii.Kernel.get(this, "hlsAkamaiSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsAkamaiSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsBasicPutSettingsOutputReference getHlsBasicPutSettings() {
        return software.amazon.jsii.Kernel.get(this, "hlsBasicPutSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsBasicPutSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsMediaStoreSettingsOutputReference getHlsMediaStoreSettings() {
        return software.amazon.jsii.Kernel.get(this, "hlsMediaStoreSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsMediaStoreSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsS3SettingsOutputReference getHlsS3Settings() {
        return software.amazon.jsii.Kernel.get(this, "hlsS3Settings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsS3SettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettingsOutputReference getHlsWebdavSettings() {
        return software.amazon.jsii.Kernel.get(this, "hlsWebdavSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsAkamaiSettings getHlsAkamaiSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "hlsAkamaiSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsAkamaiSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsBasicPutSettings getHlsBasicPutSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "hlsBasicPutSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsBasicPutSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsMediaStoreSettings getHlsMediaStoreSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "hlsMediaStoreSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsMediaStoreSettings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsS3Settings getHlsS3SettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "hlsS3SettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsS3Settings.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings getHlsWebdavSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "hlsWebdavSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsHlsWebdavSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
