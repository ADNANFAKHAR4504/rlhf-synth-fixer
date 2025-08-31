package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.877Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * hls_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#hls_settings MedialiveChannel#hls_settings}
     */
    @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings getHlsSettings();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#h265_packaging_type MedialiveChannel#h265_packaging_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getH265PackagingType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#name_modifier MedialiveChannel#name_modifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNameModifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#segment_modifier MedialiveChannel#segment_modifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSegmentModifier() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings> {
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings hlsSettings;
        java.lang.String h265PackagingType;
        java.lang.String nameModifier;
        java.lang.String segmentModifier;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings#getHlsSettings}
         * @param hlsSettings hls_settings block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#hls_settings MedialiveChannel#hls_settings}
         * @return {@code this}
         */
        public Builder hlsSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings hlsSettings) {
            this.hlsSettings = hlsSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings#getH265PackagingType}
         * @param h265PackagingType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#h265_packaging_type MedialiveChannel#h265_packaging_type}.
         * @return {@code this}
         */
        public Builder h265PackagingType(java.lang.String h265PackagingType) {
            this.h265PackagingType = h265PackagingType;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings#getNameModifier}
         * @param nameModifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#name_modifier MedialiveChannel#name_modifier}.
         * @return {@code this}
         */
        public Builder nameModifier(java.lang.String nameModifier) {
            this.nameModifier = nameModifier;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings#getSegmentModifier}
         * @param segmentModifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#segment_modifier MedialiveChannel#segment_modifier}.
         * @return {@code this}
         */
        public Builder segmentModifier(java.lang.String segmentModifier) {
            this.segmentModifier = segmentModifier;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings {
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings hlsSettings;
        private final java.lang.String h265PackagingType;
        private final java.lang.String nameModifier;
        private final java.lang.String segmentModifier;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.hlsSettings = software.amazon.jsii.Kernel.get(this, "hlsSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings.class));
            this.h265PackagingType = software.amazon.jsii.Kernel.get(this, "h265PackagingType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nameModifier = software.amazon.jsii.Kernel.get(this, "nameModifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.segmentModifier = software.amazon.jsii.Kernel.get(this, "segmentModifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.hlsSettings = java.util.Objects.requireNonNull(builder.hlsSettings, "hlsSettings is required");
            this.h265PackagingType = builder.h265PackagingType;
            this.nameModifier = builder.nameModifier;
            this.segmentModifier = builder.segmentModifier;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettings getHlsSettings() {
            return this.hlsSettings;
        }

        @Override
        public final java.lang.String getH265PackagingType() {
            return this.h265PackagingType;
        }

        @Override
        public final java.lang.String getNameModifier() {
            return this.nameModifier;
        }

        @Override
        public final java.lang.String getSegmentModifier() {
            return this.segmentModifier;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("hlsSettings", om.valueToTree(this.getHlsSettings()));
            if (this.getH265PackagingType() != null) {
                data.set("h265PackagingType", om.valueToTree(this.getH265PackagingType()));
            }
            if (this.getNameModifier() != null) {
                data.set("nameModifier", om.valueToTree(this.getNameModifier()));
            }
            if (this.getSegmentModifier() != null) {
                data.set("segmentModifier", om.valueToTree(this.getSegmentModifier()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettings.Jsii$Proxy) o;

            if (!hlsSettings.equals(that.hlsSettings)) return false;
            if (this.h265PackagingType != null ? !this.h265PackagingType.equals(that.h265PackagingType) : that.h265PackagingType != null) return false;
            if (this.nameModifier != null ? !this.nameModifier.equals(that.nameModifier) : that.nameModifier != null) return false;
            return this.segmentModifier != null ? this.segmentModifier.equals(that.segmentModifier) : that.segmentModifier == null;
        }

        @Override
        public final int hashCode() {
            int result = this.hlsSettings.hashCode();
            result = 31 * result + (this.h265PackagingType != null ? this.h265PackagingType.hashCode() : 0);
            result = 31 * result + (this.nameModifier != null ? this.nameModifier.hashCode() : 0);
            result = 31 * result + (this.segmentModifier != null ? this.segmentModifier.hashCode() : 0);
            return result;
        }
    }
}
