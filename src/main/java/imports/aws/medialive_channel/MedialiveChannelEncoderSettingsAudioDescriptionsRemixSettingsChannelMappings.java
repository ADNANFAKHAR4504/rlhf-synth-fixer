package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.866Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappings extends software.amazon.jsii.JsiiSerializable {

    /**
     * input_channel_levels block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_channel_levels MedialiveChannel#input_channel_levels}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getInputChannelLevels();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#output_channel MedialiveChannel#output_channel}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getOutputChannel();

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappings> {
        java.lang.Object inputChannelLevels;
        java.lang.Number outputChannel;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappings#getInputChannelLevels}
         * @param inputChannelLevels input_channel_levels block. This parameter is required.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_channel_levels MedialiveChannel#input_channel_levels}
         * @return {@code this}
         */
        public Builder inputChannelLevels(com.hashicorp.cdktf.IResolvable inputChannelLevels) {
            this.inputChannelLevels = inputChannelLevels;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappings#getInputChannelLevels}
         * @param inputChannelLevels input_channel_levels block. This parameter is required.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_channel_levels MedialiveChannel#input_channel_levels}
         * @return {@code this}
         */
        public Builder inputChannelLevels(java.util.List<? extends imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappingsInputChannelLevels> inputChannelLevels) {
            this.inputChannelLevels = inputChannelLevels;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappings#getOutputChannel}
         * @param outputChannel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#output_channel MedialiveChannel#output_channel}. This parameter is required.
         * @return {@code this}
         */
        public Builder outputChannel(java.lang.Number outputChannel) {
            this.outputChannel = outputChannel;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappings {
        private final java.lang.Object inputChannelLevels;
        private final java.lang.Number outputChannel;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.inputChannelLevels = software.amazon.jsii.Kernel.get(this, "inputChannelLevels", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.outputChannel = software.amazon.jsii.Kernel.get(this, "outputChannel", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.inputChannelLevels = java.util.Objects.requireNonNull(builder.inputChannelLevels, "inputChannelLevels is required");
            this.outputChannel = java.util.Objects.requireNonNull(builder.outputChannel, "outputChannel is required");
        }

        @Override
        public final java.lang.Object getInputChannelLevels() {
            return this.inputChannelLevels;
        }

        @Override
        public final java.lang.Number getOutputChannel() {
            return this.outputChannel;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("inputChannelLevels", om.valueToTree(this.getInputChannelLevels()));
            data.set("outputChannel", om.valueToTree(this.getOutputChannel()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappings.Jsii$Proxy) o;

            if (!inputChannelLevels.equals(that.inputChannelLevels)) return false;
            return this.outputChannel.equals(that.outputChannel);
        }

        @Override
        public final int hashCode() {
            int result = this.inputChannelLevels.hashCode();
            result = 31 * result + (this.outputChannel.hashCode());
            return result;
        }
    }
}
