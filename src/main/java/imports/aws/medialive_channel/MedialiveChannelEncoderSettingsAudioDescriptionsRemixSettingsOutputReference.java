package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.866Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsOutputReference")
public class MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putChannelMappings(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappings>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappings> __cast_cd4240 = (java.util.List<imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappings>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappings __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putChannelMappings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetChannelsIn() {
        software.amazon.jsii.Kernel.call(this, "resetChannelsIn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetChannelsOut() {
        software.amazon.jsii.Kernel.call(this, "resetChannelsOut", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappingsList getChannelMappings() {
        return software.amazon.jsii.Kernel.get(this, "channelMappings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappingsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getChannelMappingsInput() {
        return software.amazon.jsii.Kernel.get(this, "channelMappingsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getChannelsInInput() {
        return software.amazon.jsii.Kernel.get(this, "channelsInInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getChannelsOutInput() {
        return software.amazon.jsii.Kernel.get(this, "channelsOutInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getChannelsIn() {
        return software.amazon.jsii.Kernel.get(this, "channelsIn", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setChannelsIn(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "channelsIn", java.util.Objects.requireNonNull(value, "channelsIn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getChannelsOut() {
        return software.amazon.jsii.Kernel.get(this, "channelsOut", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setChannelsOut(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "channelsOut", java.util.Objects.requireNonNull(value, "channelsOut is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
