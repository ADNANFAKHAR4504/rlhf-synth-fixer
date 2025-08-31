package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.885Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsOutputReference")
public class MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putFailoverCondition(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverCondition>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverCondition> __cast_cd4240 = (java.util.List<imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverCondition>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverCondition __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFailoverCondition", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetErrorClearTimeMsec() {
        software.amazon.jsii.Kernel.call(this, "resetErrorClearTimeMsec", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFailoverCondition() {
        software.amazon.jsii.Kernel.call(this, "resetFailoverCondition", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInputPreference() {
        software.amazon.jsii.Kernel.call(this, "resetInputPreference", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionList getFailoverCondition() {
        return software.amazon.jsii.Kernel.get(this, "failoverCondition", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getErrorClearTimeMsecInput() {
        return software.amazon.jsii.Kernel.get(this, "errorClearTimeMsecInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFailoverConditionInput() {
        return software.amazon.jsii.Kernel.get(this, "failoverConditionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputPreferenceInput() {
        return software.amazon.jsii.Kernel.get(this, "inputPreferenceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSecondaryInputIdInput() {
        return software.amazon.jsii.Kernel.get(this, "secondaryInputIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getErrorClearTimeMsec() {
        return software.amazon.jsii.Kernel.get(this, "errorClearTimeMsec", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setErrorClearTimeMsec(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "errorClearTimeMsec", java.util.Objects.requireNonNull(value, "errorClearTimeMsec is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInputPreference() {
        return software.amazon.jsii.Kernel.get(this, "inputPreference", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInputPreference(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inputPreference", java.util.Objects.requireNonNull(value, "inputPreference is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecondaryInputId() {
        return software.amazon.jsii.Kernel.get(this, "secondaryInputId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSecondaryInputId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "secondaryInputId", java.util.Objects.requireNonNull(value, "secondaryInputId is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
