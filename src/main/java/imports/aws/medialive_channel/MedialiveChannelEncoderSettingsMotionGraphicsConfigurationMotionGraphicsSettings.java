package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.869Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * html_motion_graphics_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#html_motion_graphics_settings MedialiveChannel#html_motion_graphics_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettingsHtmlMotionGraphicsSettings getHtmlMotionGraphicsSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings> {
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettingsHtmlMotionGraphicsSettings htmlMotionGraphicsSettings;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings#getHtmlMotionGraphicsSettings}
         * @param htmlMotionGraphicsSettings html_motion_graphics_settings block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#html_motion_graphics_settings MedialiveChannel#html_motion_graphics_settings}
         * @return {@code this}
         */
        public Builder htmlMotionGraphicsSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettingsHtmlMotionGraphicsSettings htmlMotionGraphicsSettings) {
            this.htmlMotionGraphicsSettings = htmlMotionGraphicsSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings {
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettingsHtmlMotionGraphicsSettings htmlMotionGraphicsSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.htmlMotionGraphicsSettings = software.amazon.jsii.Kernel.get(this, "htmlMotionGraphicsSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettingsHtmlMotionGraphicsSettings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.htmlMotionGraphicsSettings = builder.htmlMotionGraphicsSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettingsHtmlMotionGraphicsSettings getHtmlMotionGraphicsSettings() {
            return this.htmlMotionGraphicsSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHtmlMotionGraphicsSettings() != null) {
                data.set("htmlMotionGraphicsSettings", om.valueToTree(this.getHtmlMotionGraphicsSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings.Jsii$Proxy) o;

            return this.htmlMotionGraphicsSettings != null ? this.htmlMotionGraphicsSettings.equals(that.htmlMotionGraphicsSettings) : that.htmlMotionGraphicsSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.htmlMotionGraphicsSettings != null ? this.htmlMotionGraphicsSettings.hashCode() : 0;
            return result;
        }
    }
}
