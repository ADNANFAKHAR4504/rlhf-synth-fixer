package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.885Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettings.Jsii$Proxy.class)
public interface MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * audio_hls_rendition_selection block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_hls_rendition_selection MedialiveChannel#audio_hls_rendition_selection}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioHlsRenditionSelection getAudioHlsRenditionSelection() {
        return null;
    }

    /**
     * audio_language_selection block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_language_selection MedialiveChannel#audio_language_selection}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioLanguageSelection getAudioLanguageSelection() {
        return null;
    }

    /**
     * audio_pid_selection block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_pid_selection MedialiveChannel#audio_pid_selection}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection getAudioPidSelection() {
        return null;
    }

    /**
     * audio_track_selection block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_track_selection MedialiveChannel#audio_track_selection}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelection getAudioTrackSelection() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettings> {
        imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioHlsRenditionSelection audioHlsRenditionSelection;
        imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioLanguageSelection audioLanguageSelection;
        imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection audioPidSelection;
        imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelection audioTrackSelection;

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettings#getAudioHlsRenditionSelection}
         * @param audioHlsRenditionSelection audio_hls_rendition_selection block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_hls_rendition_selection MedialiveChannel#audio_hls_rendition_selection}
         * @return {@code this}
         */
        public Builder audioHlsRenditionSelection(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioHlsRenditionSelection audioHlsRenditionSelection) {
            this.audioHlsRenditionSelection = audioHlsRenditionSelection;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettings#getAudioLanguageSelection}
         * @param audioLanguageSelection audio_language_selection block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_language_selection MedialiveChannel#audio_language_selection}
         * @return {@code this}
         */
        public Builder audioLanguageSelection(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioLanguageSelection audioLanguageSelection) {
            this.audioLanguageSelection = audioLanguageSelection;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettings#getAudioPidSelection}
         * @param audioPidSelection audio_pid_selection block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_pid_selection MedialiveChannel#audio_pid_selection}
         * @return {@code this}
         */
        public Builder audioPidSelection(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection audioPidSelection) {
            this.audioPidSelection = audioPidSelection;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettings#getAudioTrackSelection}
         * @param audioTrackSelection audio_track_selection block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_track_selection MedialiveChannel#audio_track_selection}
         * @return {@code this}
         */
        public Builder audioTrackSelection(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelection audioTrackSelection) {
            this.audioTrackSelection = audioTrackSelection;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettings {
        private final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioHlsRenditionSelection audioHlsRenditionSelection;
        private final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioLanguageSelection audioLanguageSelection;
        private final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection audioPidSelection;
        private final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelection audioTrackSelection;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.audioHlsRenditionSelection = software.amazon.jsii.Kernel.get(this, "audioHlsRenditionSelection", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioHlsRenditionSelection.class));
            this.audioLanguageSelection = software.amazon.jsii.Kernel.get(this, "audioLanguageSelection", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioLanguageSelection.class));
            this.audioPidSelection = software.amazon.jsii.Kernel.get(this, "audioPidSelection", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection.class));
            this.audioTrackSelection = software.amazon.jsii.Kernel.get(this, "audioTrackSelection", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelection.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.audioHlsRenditionSelection = builder.audioHlsRenditionSelection;
            this.audioLanguageSelection = builder.audioLanguageSelection;
            this.audioPidSelection = builder.audioPidSelection;
            this.audioTrackSelection = builder.audioTrackSelection;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioHlsRenditionSelection getAudioHlsRenditionSelection() {
            return this.audioHlsRenditionSelection;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioLanguageSelection getAudioLanguageSelection() {
            return this.audioLanguageSelection;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioPidSelection getAudioPidSelection() {
            return this.audioPidSelection;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettingsAudioTrackSelection getAudioTrackSelection() {
            return this.audioTrackSelection;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAudioHlsRenditionSelection() != null) {
                data.set("audioHlsRenditionSelection", om.valueToTree(this.getAudioHlsRenditionSelection()));
            }
            if (this.getAudioLanguageSelection() != null) {
                data.set("audioLanguageSelection", om.valueToTree(this.getAudioLanguageSelection()));
            }
            if (this.getAudioPidSelection() != null) {
                data.set("audioPidSelection", om.valueToTree(this.getAudioPidSelection()));
            }
            if (this.getAudioTrackSelection() != null) {
                data.set("audioTrackSelection", om.valueToTree(this.getAudioTrackSelection()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettings.Jsii$Proxy that = (MedialiveChannelInputAttachmentsInputSettingsAudioSelectorSelectorSettings.Jsii$Proxy) o;

            if (this.audioHlsRenditionSelection != null ? !this.audioHlsRenditionSelection.equals(that.audioHlsRenditionSelection) : that.audioHlsRenditionSelection != null) return false;
            if (this.audioLanguageSelection != null ? !this.audioLanguageSelection.equals(that.audioLanguageSelection) : that.audioLanguageSelection != null) return false;
            if (this.audioPidSelection != null ? !this.audioPidSelection.equals(that.audioPidSelection) : that.audioPidSelection != null) return false;
            return this.audioTrackSelection != null ? this.audioTrackSelection.equals(that.audioTrackSelection) : that.audioTrackSelection == null;
        }

        @Override
        public final int hashCode() {
            int result = this.audioHlsRenditionSelection != null ? this.audioHlsRenditionSelection.hashCode() : 0;
            result = 31 * result + (this.audioLanguageSelection != null ? this.audioLanguageSelection.hashCode() : 0);
            result = 31 * result + (this.audioPidSelection != null ? this.audioPidSelection.hashCode() : 0);
            result = 31 * result + (this.audioTrackSelection != null ? this.audioTrackSelection.hashCode() : 0);
            return result;
        }
    }
}
