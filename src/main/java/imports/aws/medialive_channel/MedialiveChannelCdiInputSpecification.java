package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.859Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelCdiInputSpecification")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelCdiInputSpecification.Jsii$Proxy.class)
public interface MedialiveChannelCdiInputSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#resolution MedialiveChannel#resolution}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResolution();

    /**
     * @return a {@link Builder} of {@link MedialiveChannelCdiInputSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelCdiInputSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelCdiInputSpecification> {
        java.lang.String resolution;

        /**
         * Sets the value of {@link MedialiveChannelCdiInputSpecification#getResolution}
         * @param resolution Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#resolution MedialiveChannel#resolution}. This parameter is required.
         * @return {@code this}
         */
        public Builder resolution(java.lang.String resolution) {
            this.resolution = resolution;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelCdiInputSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelCdiInputSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelCdiInputSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelCdiInputSpecification {
        private final java.lang.String resolution;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.resolution = software.amazon.jsii.Kernel.get(this, "resolution", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.resolution = java.util.Objects.requireNonNull(builder.resolution, "resolution is required");
        }

        @Override
        public final java.lang.String getResolution() {
            return this.resolution;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("resolution", om.valueToTree(this.getResolution()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelCdiInputSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelCdiInputSpecification.Jsii$Proxy that = (MedialiveChannelCdiInputSpecification.Jsii$Proxy) o;

            return this.resolution.equals(that.resolution);
        }

        @Override
        public final int hashCode() {
            int result = this.resolution.hashCode();
            return result;
        }
    }
}
