package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.881Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettingsDestination")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettingsDestination.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettingsDestination extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#destination_ref_id MedialiveChannel#destination_ref_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDestinationRefId();

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettingsDestination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettingsDestination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettingsDestination> {
        java.lang.String destinationRefId;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettingsDestination#getDestinationRefId}
         * @param destinationRefId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#destination_ref_id MedialiveChannel#destination_ref_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder destinationRefId(java.lang.String destinationRefId) {
            this.destinationRefId = destinationRefId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettingsDestination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettingsDestination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettingsDestination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettingsDestination {
        private final java.lang.String destinationRefId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.destinationRefId = software.amazon.jsii.Kernel.get(this, "destinationRefId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.destinationRefId = java.util.Objects.requireNonNull(builder.destinationRefId, "destinationRefId is required");
        }

        @Override
        public final java.lang.String getDestinationRefId() {
            return this.destinationRefId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("destinationRefId", om.valueToTree(this.getDestinationRefId()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettingsDestination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettingsDestination.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMultiplexOutputSettingsDestination.Jsii$Proxy) o;

            return this.destinationRefId.equals(that.destinationRefId);
        }

        @Override
        public final int hashCode() {
            int result = this.destinationRefId.hashCode();
            return result;
        }
    }
}
