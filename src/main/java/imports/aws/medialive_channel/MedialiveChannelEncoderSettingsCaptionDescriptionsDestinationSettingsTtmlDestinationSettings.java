package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.868Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTtmlDestinationSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTtmlDestinationSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTtmlDestinationSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#style_control MedialiveChannel#style_control}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStyleControl();

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTtmlDestinationSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTtmlDestinationSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTtmlDestinationSettings> {
        java.lang.String styleControl;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTtmlDestinationSettings#getStyleControl}
         * @param styleControl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#style_control MedialiveChannel#style_control}. This parameter is required.
         * @return {@code this}
         */
        public Builder styleControl(java.lang.String styleControl) {
            this.styleControl = styleControl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTtmlDestinationSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTtmlDestinationSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTtmlDestinationSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTtmlDestinationSettings {
        private final java.lang.String styleControl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.styleControl = software.amazon.jsii.Kernel.get(this, "styleControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.styleControl = java.util.Objects.requireNonNull(builder.styleControl, "styleControl is required");
        }

        @Override
        public final java.lang.String getStyleControl() {
            return this.styleControl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("styleControl", om.valueToTree(this.getStyleControl()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTtmlDestinationSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTtmlDestinationSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettingsTtmlDestinationSettings.Jsii$Proxy) o;

            return this.styleControl.equals(that.styleControl);
        }

        @Override
        public final int hashCode() {
            int result = this.styleControl.hashCode();
            return result;
        }
    }
}
