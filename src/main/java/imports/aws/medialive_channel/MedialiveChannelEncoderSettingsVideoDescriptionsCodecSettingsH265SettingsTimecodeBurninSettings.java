package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.884Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#prefix MedialiveChannel#prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#timecode_burnin_font_size MedialiveChannel#timecode_burnin_font_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTimecodeBurninFontSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#timecode_burnin_position MedialiveChannel#timecode_burnin_position}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTimecodeBurninPosition() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings> {
        java.lang.String prefix;
        java.lang.String timecodeBurninFontSize;
        java.lang.String timecodeBurninPosition;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings#getPrefix}
         * @param prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#prefix MedialiveChannel#prefix}.
         * @return {@code this}
         */
        public Builder prefix(java.lang.String prefix) {
            this.prefix = prefix;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings#getTimecodeBurninFontSize}
         * @param timecodeBurninFontSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#timecode_burnin_font_size MedialiveChannel#timecode_burnin_font_size}.
         * @return {@code this}
         */
        public Builder timecodeBurninFontSize(java.lang.String timecodeBurninFontSize) {
            this.timecodeBurninFontSize = timecodeBurninFontSize;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings#getTimecodeBurninPosition}
         * @param timecodeBurninPosition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#timecode_burnin_position MedialiveChannel#timecode_burnin_position}.
         * @return {@code this}
         */
        public Builder timecodeBurninPosition(java.lang.String timecodeBurninPosition) {
            this.timecodeBurninPosition = timecodeBurninPosition;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings {
        private final java.lang.String prefix;
        private final java.lang.String timecodeBurninFontSize;
        private final java.lang.String timecodeBurninPosition;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.prefix = software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timecodeBurninFontSize = software.amazon.jsii.Kernel.get(this, "timecodeBurninFontSize", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timecodeBurninPosition = software.amazon.jsii.Kernel.get(this, "timecodeBurninPosition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.prefix = builder.prefix;
            this.timecodeBurninFontSize = builder.timecodeBurninFontSize;
            this.timecodeBurninPosition = builder.timecodeBurninPosition;
        }

        @Override
        public final java.lang.String getPrefix() {
            return this.prefix;
        }

        @Override
        public final java.lang.String getTimecodeBurninFontSize() {
            return this.timecodeBurninFontSize;
        }

        @Override
        public final java.lang.String getTimecodeBurninPosition() {
            return this.timecodeBurninPosition;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getPrefix() != null) {
                data.set("prefix", om.valueToTree(this.getPrefix()));
            }
            if (this.getTimecodeBurninFontSize() != null) {
                data.set("timecodeBurninFontSize", om.valueToTree(this.getTimecodeBurninFontSize()));
            }
            if (this.getTimecodeBurninPosition() != null) {
                data.set("timecodeBurninPosition", om.valueToTree(this.getTimecodeBurninPosition()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings.Jsii$Proxy) o;

            if (this.prefix != null ? !this.prefix.equals(that.prefix) : that.prefix != null) return false;
            if (this.timecodeBurninFontSize != null ? !this.timecodeBurninFontSize.equals(that.timecodeBurninFontSize) : that.timecodeBurninFontSize != null) return false;
            return this.timecodeBurninPosition != null ? this.timecodeBurninPosition.equals(that.timecodeBurninPosition) : that.timecodeBurninPosition == null;
        }

        @Override
        public final int hashCode() {
            int result = this.prefix != null ? this.prefix.hashCode() : 0;
            result = 31 * result + (this.timecodeBurninFontSize != null ? this.timecodeBurninFontSize.hashCode() : 0);
            result = 31 * result + (this.timecodeBurninPosition != null ? this.timecodeBurninPosition.hashCode() : 0);
            return result;
        }
    }
}
