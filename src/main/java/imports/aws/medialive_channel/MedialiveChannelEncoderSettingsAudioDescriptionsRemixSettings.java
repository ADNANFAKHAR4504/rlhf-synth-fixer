package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.866Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * channel_mappings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#channel_mappings MedialiveChannel#channel_mappings}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getChannelMappings();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#channels_in MedialiveChannel#channels_in}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getChannelsIn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#channels_out MedialiveChannel#channels_out}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getChannelsOut() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings> {
        java.lang.Object channelMappings;
        java.lang.Number channelsIn;
        java.lang.Number channelsOut;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings#getChannelMappings}
         * @param channelMappings channel_mappings block. This parameter is required.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#channel_mappings MedialiveChannel#channel_mappings}
         * @return {@code this}
         */
        public Builder channelMappings(com.hashicorp.cdktf.IResolvable channelMappings) {
            this.channelMappings = channelMappings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings#getChannelMappings}
         * @param channelMappings channel_mappings block. This parameter is required.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#channel_mappings MedialiveChannel#channel_mappings}
         * @return {@code this}
         */
        public Builder channelMappings(java.util.List<? extends imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettingsChannelMappings> channelMappings) {
            this.channelMappings = channelMappings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings#getChannelsIn}
         * @param channelsIn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#channels_in MedialiveChannel#channels_in}.
         * @return {@code this}
         */
        public Builder channelsIn(java.lang.Number channelsIn) {
            this.channelsIn = channelsIn;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings#getChannelsOut}
         * @param channelsOut Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#channels_out MedialiveChannel#channels_out}.
         * @return {@code this}
         */
        public Builder channelsOut(java.lang.Number channelsOut) {
            this.channelsOut = channelsOut;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings {
        private final java.lang.Object channelMappings;
        private final java.lang.Number channelsIn;
        private final java.lang.Number channelsOut;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.channelMappings = software.amazon.jsii.Kernel.get(this, "channelMappings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.channelsIn = software.amazon.jsii.Kernel.get(this, "channelsIn", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.channelsOut = software.amazon.jsii.Kernel.get(this, "channelsOut", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.channelMappings = java.util.Objects.requireNonNull(builder.channelMappings, "channelMappings is required");
            this.channelsIn = builder.channelsIn;
            this.channelsOut = builder.channelsOut;
        }

        @Override
        public final java.lang.Object getChannelMappings() {
            return this.channelMappings;
        }

        @Override
        public final java.lang.Number getChannelsIn() {
            return this.channelsIn;
        }

        @Override
        public final java.lang.Number getChannelsOut() {
            return this.channelsOut;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("channelMappings", om.valueToTree(this.getChannelMappings()));
            if (this.getChannelsIn() != null) {
                data.set("channelsIn", om.valueToTree(this.getChannelsIn()));
            }
            if (this.getChannelsOut() != null) {
                data.set("channelsOut", om.valueToTree(this.getChannelsOut()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsAudioDescriptionsRemixSettings.Jsii$Proxy) o;

            if (!channelMappings.equals(that.channelMappings)) return false;
            if (this.channelsIn != null ? !this.channelsIn.equals(that.channelsIn) : that.channelsIn != null) return false;
            return this.channelsOut != null ? this.channelsOut.equals(that.channelsOut) : that.channelsOut == null;
        }

        @Override
        public final int hashCode() {
            int result = this.channelMappings.hashCode();
            result = 31 * result + (this.channelsIn != null ? this.channelsIn.hashCode() : 0);
            result = 31 * result + (this.channelsOut != null ? this.channelsOut.hashCode() : 0);
            return result;
        }
    }
}
