package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.877Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_rendition_sets MedialiveChannel#audio_rendition_sets}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAudioRenditionSets() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#nielsen_id3_behavior MedialiveChannel#nielsen_id3_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNielsenId3Behavior() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#timed_metadata_behavior MedialiveChannel#timed_metadata_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTimedMetadataBehavior() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings> {
        java.lang.String audioRenditionSets;
        java.lang.String nielsenId3Behavior;
        java.lang.String timedMetadataBehavior;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings#getAudioRenditionSets}
         * @param audioRenditionSets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_rendition_sets MedialiveChannel#audio_rendition_sets}.
         * @return {@code this}
         */
        public Builder audioRenditionSets(java.lang.String audioRenditionSets) {
            this.audioRenditionSets = audioRenditionSets;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings#getNielsenId3Behavior}
         * @param nielsenId3Behavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#nielsen_id3_behavior MedialiveChannel#nielsen_id3_behavior}.
         * @return {@code this}
         */
        public Builder nielsenId3Behavior(java.lang.String nielsenId3Behavior) {
            this.nielsenId3Behavior = nielsenId3Behavior;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings#getTimedMetadataBehavior}
         * @param timedMetadataBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#timed_metadata_behavior MedialiveChannel#timed_metadata_behavior}.
         * @return {@code this}
         */
        public Builder timedMetadataBehavior(java.lang.String timedMetadataBehavior) {
            this.timedMetadataBehavior = timedMetadataBehavior;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings {
        private final java.lang.String audioRenditionSets;
        private final java.lang.String nielsenId3Behavior;
        private final java.lang.String timedMetadataBehavior;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.audioRenditionSets = software.amazon.jsii.Kernel.get(this, "audioRenditionSets", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nielsenId3Behavior = software.amazon.jsii.Kernel.get(this, "nielsenId3Behavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timedMetadataBehavior = software.amazon.jsii.Kernel.get(this, "timedMetadataBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.audioRenditionSets = builder.audioRenditionSets;
            this.nielsenId3Behavior = builder.nielsenId3Behavior;
            this.timedMetadataBehavior = builder.timedMetadataBehavior;
        }

        @Override
        public final java.lang.String getAudioRenditionSets() {
            return this.audioRenditionSets;
        }

        @Override
        public final java.lang.String getNielsenId3Behavior() {
            return this.nielsenId3Behavior;
        }

        @Override
        public final java.lang.String getTimedMetadataBehavior() {
            return this.timedMetadataBehavior;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAudioRenditionSets() != null) {
                data.set("audioRenditionSets", om.valueToTree(this.getAudioRenditionSets()));
            }
            if (this.getNielsenId3Behavior() != null) {
                data.set("nielsenId3Behavior", om.valueToTree(this.getNielsenId3Behavior()));
            }
            if (this.getTimedMetadataBehavior() != null) {
                data.set("timedMetadataBehavior", om.valueToTree(this.getTimedMetadataBehavior()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsFmp4HlsSettings.Jsii$Proxy) o;

            if (this.audioRenditionSets != null ? !this.audioRenditionSets.equals(that.audioRenditionSets) : that.audioRenditionSets != null) return false;
            if (this.nielsenId3Behavior != null ? !this.nielsenId3Behavior.equals(that.nielsenId3Behavior) : that.nielsenId3Behavior != null) return false;
            return this.timedMetadataBehavior != null ? this.timedMetadataBehavior.equals(that.timedMetadataBehavior) : that.timedMetadataBehavior == null;
        }

        @Override
        public final int hashCode() {
            int result = this.audioRenditionSets != null ? this.audioRenditionSets.hashCode() : 0;
            result = 31 * result + (this.nielsenId3Behavior != null ? this.nielsenId3Behavior.hashCode() : 0);
            result = 31 * result + (this.timedMetadataBehavior != null ? this.timedMetadataBehavior.hashCode() : 0);
            return result;
        }
    }
}
