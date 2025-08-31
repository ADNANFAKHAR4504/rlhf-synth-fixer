package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.885Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings.Jsii$Proxy.class)
public interface MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * audio_silence_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_silence_settings MedialiveChannel#audio_silence_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings getAudioSilenceSettings() {
        return null;
    }

    /**
     * input_loss_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_loss_settings MedialiveChannel#input_loss_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings getInputLossSettings() {
        return null;
    }

    /**
     * video_black_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#video_black_settings MedialiveChannel#video_black_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings getVideoBlackSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings> {
        imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings audioSilenceSettings;
        imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings inputLossSettings;
        imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings videoBlackSettings;

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings#getAudioSilenceSettings}
         * @param audioSilenceSettings audio_silence_settings block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_silence_settings MedialiveChannel#audio_silence_settings}
         * @return {@code this}
         */
        public Builder audioSilenceSettings(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings audioSilenceSettings) {
            this.audioSilenceSettings = audioSilenceSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings#getInputLossSettings}
         * @param inputLossSettings input_loss_settings block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_loss_settings MedialiveChannel#input_loss_settings}
         * @return {@code this}
         */
        public Builder inputLossSettings(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings inputLossSettings) {
            this.inputLossSettings = inputLossSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings#getVideoBlackSettings}
         * @param videoBlackSettings video_black_settings block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#video_black_settings MedialiveChannel#video_black_settings}
         * @return {@code this}
         */
        public Builder videoBlackSettings(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings videoBlackSettings) {
            this.videoBlackSettings = videoBlackSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings {
        private final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings audioSilenceSettings;
        private final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings inputLossSettings;
        private final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings videoBlackSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.audioSilenceSettings = software.amazon.jsii.Kernel.get(this, "audioSilenceSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings.class));
            this.inputLossSettings = software.amazon.jsii.Kernel.get(this, "inputLossSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings.class));
            this.videoBlackSettings = software.amazon.jsii.Kernel.get(this, "videoBlackSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.audioSilenceSettings = builder.audioSilenceSettings;
            this.inputLossSettings = builder.inputLossSettings;
            this.videoBlackSettings = builder.videoBlackSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsAudioSilenceSettings getAudioSilenceSettings() {
            return this.audioSilenceSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsInputLossSettings getInputLossSettings() {
            return this.inputLossSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettingsVideoBlackSettings getVideoBlackSettings() {
            return this.videoBlackSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAudioSilenceSettings() != null) {
                data.set("audioSilenceSettings", om.valueToTree(this.getAudioSilenceSettings()));
            }
            if (this.getInputLossSettings() != null) {
                data.set("inputLossSettings", om.valueToTree(this.getInputLossSettings()));
            }
            if (this.getVideoBlackSettings() != null) {
                data.set("videoBlackSettings", om.valueToTree(this.getVideoBlackSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings.Jsii$Proxy that = (MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings.Jsii$Proxy) o;

            if (this.audioSilenceSettings != null ? !this.audioSilenceSettings.equals(that.audioSilenceSettings) : that.audioSilenceSettings != null) return false;
            if (this.inputLossSettings != null ? !this.inputLossSettings.equals(that.inputLossSettings) : that.inputLossSettings != null) return false;
            return this.videoBlackSettings != null ? this.videoBlackSettings.equals(that.videoBlackSettings) : that.videoBlackSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.audioSilenceSettings != null ? this.audioSilenceSettings.hashCode() : 0;
            result = 31 * result + (this.inputLossSettings != null ? this.inputLossSettings.hashCode() : 0);
            result = 31 * result + (this.videoBlackSettings != null ? this.videoBlackSettings.hashCode() : 0);
            return result;
        }
    }
}
