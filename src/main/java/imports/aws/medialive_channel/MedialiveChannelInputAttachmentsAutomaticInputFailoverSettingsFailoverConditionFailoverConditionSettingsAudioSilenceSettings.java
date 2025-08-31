package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.885Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings.Jsii$Proxy.class)
public interface MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_selector_name MedialiveChannel#audio_selector_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAudioSelectorName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_silence_threshold_msec MedialiveChannel#audio_silence_threshold_msec}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAudioSilenceThresholdMsec() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings> {
        java.lang.String audioSelectorName;
        java.lang.Number audioSilenceThresholdMsec;

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings#getAudioSelectorName}
         * @param audioSelectorName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_selector_name MedialiveChannel#audio_selector_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder audioSelectorName(java.lang.String audioSelectorName) {
            this.audioSelectorName = audioSelectorName;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings#getAudioSilenceThresholdMsec}
         * @param audioSilenceThresholdMsec Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_silence_threshold_msec MedialiveChannel#audio_silence_threshold_msec}.
         * @return {@code this}
         */
        public Builder audioSilenceThresholdMsec(java.lang.Number audioSilenceThresholdMsec) {
            this.audioSilenceThresholdMsec = audioSilenceThresholdMsec;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings {
        private final java.lang.String audioSelectorName;
        private final java.lang.Number audioSilenceThresholdMsec;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.audioSelectorName = software.amazon.jsii.Kernel.get(this, "audioSelectorName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.audioSilenceThresholdMsec = software.amazon.jsii.Kernel.get(this, "audioSilenceThresholdMsec", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.audioSelectorName = java.util.Objects.requireNonNull(builder.audioSelectorName, "audioSelectorName is required");
            this.audioSilenceThresholdMsec = builder.audioSilenceThresholdMsec;
        }

        @Override
        public final java.lang.String getAudioSelectorName() {
            return this.audioSelectorName;
        }

        @Override
        public final java.lang.Number getAudioSilenceThresholdMsec() {
            return this.audioSilenceThresholdMsec;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("audioSelectorName", om.valueToTree(this.getAudioSelectorName()));
            if (this.getAudioSilenceThresholdMsec() != null) {
                data.set("audioSilenceThresholdMsec", om.valueToTree(this.getAudioSilenceThresholdMsec()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings.Jsii$Proxy that = (MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings.Jsii$Proxy) o;

            if (!audioSelectorName.equals(that.audioSelectorName)) return false;
            return this.audioSilenceThresholdMsec != null ? this.audioSilenceThresholdMsec.equals(that.audioSilenceThresholdMsec) : that.audioSilenceThresholdMsec == null;
        }

        @Override
        public final int hashCode() {
            int result = this.audioSelectorName.hashCode();
            result = 31 * result + (this.audioSilenceThresholdMsec != null ? this.audioSilenceThresholdMsec.hashCode() : 0);
            return result;
        }
    }
}
