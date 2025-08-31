package imports.aws.medialive_multiplex;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.893Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveMultiplex.MedialiveMultiplexMultiplexSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveMultiplexMultiplexSettings.Jsii$Proxy.class)
public interface MedialiveMultiplexMultiplexSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex#transport_stream_bitrate MedialiveMultiplex#transport_stream_bitrate}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getTransportStreamBitrate();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex#transport_stream_id MedialiveMultiplex#transport_stream_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getTransportStreamId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex#maximum_video_buffer_delay_milliseconds MedialiveMultiplex#maximum_video_buffer_delay_milliseconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumVideoBufferDelayMilliseconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex#transport_stream_reserved_bitrate MedialiveMultiplex#transport_stream_reserved_bitrate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTransportStreamReservedBitrate() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveMultiplexMultiplexSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveMultiplexMultiplexSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveMultiplexMultiplexSettings> {
        java.lang.Number transportStreamBitrate;
        java.lang.Number transportStreamId;
        java.lang.Number maximumVideoBufferDelayMilliseconds;
        java.lang.Number transportStreamReservedBitrate;

        /**
         * Sets the value of {@link MedialiveMultiplexMultiplexSettings#getTransportStreamBitrate}
         * @param transportStreamBitrate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex#transport_stream_bitrate MedialiveMultiplex#transport_stream_bitrate}. This parameter is required.
         * @return {@code this}
         */
        public Builder transportStreamBitrate(java.lang.Number transportStreamBitrate) {
            this.transportStreamBitrate = transportStreamBitrate;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveMultiplexMultiplexSettings#getTransportStreamId}
         * @param transportStreamId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex#transport_stream_id MedialiveMultiplex#transport_stream_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder transportStreamId(java.lang.Number transportStreamId) {
            this.transportStreamId = transportStreamId;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveMultiplexMultiplexSettings#getMaximumVideoBufferDelayMilliseconds}
         * @param maximumVideoBufferDelayMilliseconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex#maximum_video_buffer_delay_milliseconds MedialiveMultiplex#maximum_video_buffer_delay_milliseconds}.
         * @return {@code this}
         */
        public Builder maximumVideoBufferDelayMilliseconds(java.lang.Number maximumVideoBufferDelayMilliseconds) {
            this.maximumVideoBufferDelayMilliseconds = maximumVideoBufferDelayMilliseconds;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveMultiplexMultiplexSettings#getTransportStreamReservedBitrate}
         * @param transportStreamReservedBitrate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex#transport_stream_reserved_bitrate MedialiveMultiplex#transport_stream_reserved_bitrate}.
         * @return {@code this}
         */
        public Builder transportStreamReservedBitrate(java.lang.Number transportStreamReservedBitrate) {
            this.transportStreamReservedBitrate = transportStreamReservedBitrate;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveMultiplexMultiplexSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveMultiplexMultiplexSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveMultiplexMultiplexSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveMultiplexMultiplexSettings {
        private final java.lang.Number transportStreamBitrate;
        private final java.lang.Number transportStreamId;
        private final java.lang.Number maximumVideoBufferDelayMilliseconds;
        private final java.lang.Number transportStreamReservedBitrate;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.transportStreamBitrate = software.amazon.jsii.Kernel.get(this, "transportStreamBitrate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.transportStreamId = software.amazon.jsii.Kernel.get(this, "transportStreamId", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maximumVideoBufferDelayMilliseconds = software.amazon.jsii.Kernel.get(this, "maximumVideoBufferDelayMilliseconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.transportStreamReservedBitrate = software.amazon.jsii.Kernel.get(this, "transportStreamReservedBitrate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.transportStreamBitrate = java.util.Objects.requireNonNull(builder.transportStreamBitrate, "transportStreamBitrate is required");
            this.transportStreamId = java.util.Objects.requireNonNull(builder.transportStreamId, "transportStreamId is required");
            this.maximumVideoBufferDelayMilliseconds = builder.maximumVideoBufferDelayMilliseconds;
            this.transportStreamReservedBitrate = builder.transportStreamReservedBitrate;
        }

        @Override
        public final java.lang.Number getTransportStreamBitrate() {
            return this.transportStreamBitrate;
        }

        @Override
        public final java.lang.Number getTransportStreamId() {
            return this.transportStreamId;
        }

        @Override
        public final java.lang.Number getMaximumVideoBufferDelayMilliseconds() {
            return this.maximumVideoBufferDelayMilliseconds;
        }

        @Override
        public final java.lang.Number getTransportStreamReservedBitrate() {
            return this.transportStreamReservedBitrate;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("transportStreamBitrate", om.valueToTree(this.getTransportStreamBitrate()));
            data.set("transportStreamId", om.valueToTree(this.getTransportStreamId()));
            if (this.getMaximumVideoBufferDelayMilliseconds() != null) {
                data.set("maximumVideoBufferDelayMilliseconds", om.valueToTree(this.getMaximumVideoBufferDelayMilliseconds()));
            }
            if (this.getTransportStreamReservedBitrate() != null) {
                data.set("transportStreamReservedBitrate", om.valueToTree(this.getTransportStreamReservedBitrate()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveMultiplex.MedialiveMultiplexMultiplexSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveMultiplexMultiplexSettings.Jsii$Proxy that = (MedialiveMultiplexMultiplexSettings.Jsii$Proxy) o;

            if (!transportStreamBitrate.equals(that.transportStreamBitrate)) return false;
            if (!transportStreamId.equals(that.transportStreamId)) return false;
            if (this.maximumVideoBufferDelayMilliseconds != null ? !this.maximumVideoBufferDelayMilliseconds.equals(that.maximumVideoBufferDelayMilliseconds) : that.maximumVideoBufferDelayMilliseconds != null) return false;
            return this.transportStreamReservedBitrate != null ? this.transportStreamReservedBitrate.equals(that.transportStreamReservedBitrate) : that.transportStreamReservedBitrate == null;
        }

        @Override
        public final int hashCode() {
            int result = this.transportStreamBitrate.hashCode();
            result = 31 * result + (this.transportStreamId.hashCode());
            result = 31 * result + (this.maximumVideoBufferDelayMilliseconds != null ? this.maximumVideoBufferDelayMilliseconds.hashCode() : 0);
            result = 31 * result + (this.transportStreamReservedBitrate != null ? this.transportStreamReservedBitrate.hashCode() : 0);
            return result;
        }
    }
}
