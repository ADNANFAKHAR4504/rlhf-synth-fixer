package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.884Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * temporal_filter_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#temporal_filter_settings MedialiveChannel#temporal_filter_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettingsTemporalFilterSettings getTemporalFilterSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettings> {
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettingsTemporalFilterSettings temporalFilterSettings;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettings#getTemporalFilterSettings}
         * @param temporalFilterSettings temporal_filter_settings block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#temporal_filter_settings MedialiveChannel#temporal_filter_settings}
         * @return {@code this}
         */
        public Builder temporalFilterSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettingsTemporalFilterSettings temporalFilterSettings) {
            this.temporalFilterSettings = temporalFilterSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettings {
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettingsTemporalFilterSettings temporalFilterSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.temporalFilterSettings = software.amazon.jsii.Kernel.get(this, "temporalFilterSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettingsTemporalFilterSettings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.temporalFilterSettings = builder.temporalFilterSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettingsTemporalFilterSettings getTemporalFilterSettings() {
            return this.temporalFilterSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getTemporalFilterSettings() != null) {
                data.set("temporalFilterSettings", om.valueToTree(this.getTemporalFilterSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettings.Jsii$Proxy) o;

            return this.temporalFilterSettings != null ? this.temporalFilterSettings.equals(that.temporalFilterSettings) : that.temporalFilterSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.temporalFilterSettings != null ? this.temporalFilterSettings.hashCode() : 0;
            return result;
        }
    }
}
