package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.877Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_group_id MedialiveChannel#audio_group_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAudioGroupId() {
        return null;
    }

    /**
     * audio_only_image block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_only_image MedialiveChannel#audio_only_image}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettingsAudioOnlyImage getAudioOnlyImage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_track_type MedialiveChannel#audio_track_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAudioTrackType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#segment_type MedialiveChannel#segment_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSegmentType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings> {
        java.lang.String audioGroupId;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettingsAudioOnlyImage audioOnlyImage;
        java.lang.String audioTrackType;
        java.lang.String segmentType;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings#getAudioGroupId}
         * @param audioGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_group_id MedialiveChannel#audio_group_id}.
         * @return {@code this}
         */
        public Builder audioGroupId(java.lang.String audioGroupId) {
            this.audioGroupId = audioGroupId;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings#getAudioOnlyImage}
         * @param audioOnlyImage audio_only_image block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_only_image MedialiveChannel#audio_only_image}
         * @return {@code this}
         */
        public Builder audioOnlyImage(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettingsAudioOnlyImage audioOnlyImage) {
            this.audioOnlyImage = audioOnlyImage;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings#getAudioTrackType}
         * @param audioTrackType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_track_type MedialiveChannel#audio_track_type}.
         * @return {@code this}
         */
        public Builder audioTrackType(java.lang.String audioTrackType) {
            this.audioTrackType = audioTrackType;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings#getSegmentType}
         * @param segmentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#segment_type MedialiveChannel#segment_type}.
         * @return {@code this}
         */
        public Builder segmentType(java.lang.String segmentType) {
            this.segmentType = segmentType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings {
        private final java.lang.String audioGroupId;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettingsAudioOnlyImage audioOnlyImage;
        private final java.lang.String audioTrackType;
        private final java.lang.String segmentType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.audioGroupId = software.amazon.jsii.Kernel.get(this, "audioGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.audioOnlyImage = software.amazon.jsii.Kernel.get(this, "audioOnlyImage", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettingsAudioOnlyImage.class));
            this.audioTrackType = software.amazon.jsii.Kernel.get(this, "audioTrackType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.segmentType = software.amazon.jsii.Kernel.get(this, "segmentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.audioGroupId = builder.audioGroupId;
            this.audioOnlyImage = builder.audioOnlyImage;
            this.audioTrackType = builder.audioTrackType;
            this.segmentType = builder.segmentType;
        }

        @Override
        public final java.lang.String getAudioGroupId() {
            return this.audioGroupId;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettingsAudioOnlyImage getAudioOnlyImage() {
            return this.audioOnlyImage;
        }

        @Override
        public final java.lang.String getAudioTrackType() {
            return this.audioTrackType;
        }

        @Override
        public final java.lang.String getSegmentType() {
            return this.segmentType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAudioGroupId() != null) {
                data.set("audioGroupId", om.valueToTree(this.getAudioGroupId()));
            }
            if (this.getAudioOnlyImage() != null) {
                data.set("audioOnlyImage", om.valueToTree(this.getAudioOnlyImage()));
            }
            if (this.getAudioTrackType() != null) {
                data.set("audioTrackType", om.valueToTree(this.getAudioTrackType()));
            }
            if (this.getSegmentType() != null) {
                data.set("segmentType", om.valueToTree(this.getSegmentType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsAudioOnlyHlsSettings.Jsii$Proxy) o;

            if (this.audioGroupId != null ? !this.audioGroupId.equals(that.audioGroupId) : that.audioGroupId != null) return false;
            if (this.audioOnlyImage != null ? !this.audioOnlyImage.equals(that.audioOnlyImage) : that.audioOnlyImage != null) return false;
            if (this.audioTrackType != null ? !this.audioTrackType.equals(that.audioTrackType) : that.audioTrackType != null) return false;
            return this.segmentType != null ? this.segmentType.equals(that.segmentType) : that.segmentType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.audioGroupId != null ? this.audioGroupId.hashCode() : 0;
            result = 31 * result + (this.audioOnlyImage != null ? this.audioOnlyImage.hashCode() : 0);
            result = 31 * result + (this.audioTrackType != null ? this.audioTrackType.hashCode() : 0);
            result = 31 * result + (this.segmentType != null ? this.segmentType.hashCode() : 0);
            return result;
        }
    }
}
