package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.869Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsMotionGraphicsConfiguration")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsMotionGraphicsConfiguration.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsMotionGraphicsConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * motion_graphics_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#motion_graphics_settings MedialiveChannel#motion_graphics_settings}
     */
    @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings getMotionGraphicsSettings();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#motion_graphics_insertion MedialiveChannel#motion_graphics_insertion}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMotionGraphicsInsertion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsMotionGraphicsConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsMotionGraphicsConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsMotionGraphicsConfiguration> {
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings motionGraphicsSettings;
        java.lang.String motionGraphicsInsertion;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsMotionGraphicsConfiguration#getMotionGraphicsSettings}
         * @param motionGraphicsSettings motion_graphics_settings block. This parameter is required.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#motion_graphics_settings MedialiveChannel#motion_graphics_settings}
         * @return {@code this}
         */
        public Builder motionGraphicsSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings motionGraphicsSettings) {
            this.motionGraphicsSettings = motionGraphicsSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsMotionGraphicsConfiguration#getMotionGraphicsInsertion}
         * @param motionGraphicsInsertion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#motion_graphics_insertion MedialiveChannel#motion_graphics_insertion}.
         * @return {@code this}
         */
        public Builder motionGraphicsInsertion(java.lang.String motionGraphicsInsertion) {
            this.motionGraphicsInsertion = motionGraphicsInsertion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsMotionGraphicsConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsMotionGraphicsConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsMotionGraphicsConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsMotionGraphicsConfiguration {
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings motionGraphicsSettings;
        private final java.lang.String motionGraphicsInsertion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.motionGraphicsSettings = software.amazon.jsii.Kernel.get(this, "motionGraphicsSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings.class));
            this.motionGraphicsInsertion = software.amazon.jsii.Kernel.get(this, "motionGraphicsInsertion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.motionGraphicsSettings = java.util.Objects.requireNonNull(builder.motionGraphicsSettings, "motionGraphicsSettings is required");
            this.motionGraphicsInsertion = builder.motionGraphicsInsertion;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsMotionGraphicsConfigurationMotionGraphicsSettings getMotionGraphicsSettings() {
            return this.motionGraphicsSettings;
        }

        @Override
        public final java.lang.String getMotionGraphicsInsertion() {
            return this.motionGraphicsInsertion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("motionGraphicsSettings", om.valueToTree(this.getMotionGraphicsSettings()));
            if (this.getMotionGraphicsInsertion() != null) {
                data.set("motionGraphicsInsertion", om.valueToTree(this.getMotionGraphicsInsertion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsMotionGraphicsConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsMotionGraphicsConfiguration.Jsii$Proxy that = (MedialiveChannelEncoderSettingsMotionGraphicsConfiguration.Jsii$Proxy) o;

            if (!motionGraphicsSettings.equals(that.motionGraphicsSettings)) return false;
            return this.motionGraphicsInsertion != null ? this.motionGraphicsInsertion.equals(that.motionGraphicsInsertion) : that.motionGraphicsInsertion == null;
        }

        @Override
        public final int hashCode() {
            int result = this.motionGraphicsSettings.hashCode();
            result = 31 * result + (this.motionGraphicsInsertion != null ? this.motionGraphicsInsertion.hashCode() : 0);
            return result;
        }
    }
}
