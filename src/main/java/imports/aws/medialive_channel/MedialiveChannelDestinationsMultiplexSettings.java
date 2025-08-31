package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.864Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelDestinationsMultiplexSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelDestinationsMultiplexSettings.Jsii$Proxy.class)
public interface MedialiveChannelDestinationsMultiplexSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#multiplex_id MedialiveChannel#multiplex_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMultiplexId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#program_name MedialiveChannel#program_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProgramName();

    /**
     * @return a {@link Builder} of {@link MedialiveChannelDestinationsMultiplexSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelDestinationsMultiplexSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelDestinationsMultiplexSettings> {
        java.lang.String multiplexId;
        java.lang.String programName;

        /**
         * Sets the value of {@link MedialiveChannelDestinationsMultiplexSettings#getMultiplexId}
         * @param multiplexId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#multiplex_id MedialiveChannel#multiplex_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder multiplexId(java.lang.String multiplexId) {
            this.multiplexId = multiplexId;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelDestinationsMultiplexSettings#getProgramName}
         * @param programName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#program_name MedialiveChannel#program_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder programName(java.lang.String programName) {
            this.programName = programName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelDestinationsMultiplexSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelDestinationsMultiplexSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelDestinationsMultiplexSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelDestinationsMultiplexSettings {
        private final java.lang.String multiplexId;
        private final java.lang.String programName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.multiplexId = software.amazon.jsii.Kernel.get(this, "multiplexId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.programName = software.amazon.jsii.Kernel.get(this, "programName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.multiplexId = java.util.Objects.requireNonNull(builder.multiplexId, "multiplexId is required");
            this.programName = java.util.Objects.requireNonNull(builder.programName, "programName is required");
        }

        @Override
        public final java.lang.String getMultiplexId() {
            return this.multiplexId;
        }

        @Override
        public final java.lang.String getProgramName() {
            return this.programName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("multiplexId", om.valueToTree(this.getMultiplexId()));
            data.set("programName", om.valueToTree(this.getProgramName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelDestinationsMultiplexSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelDestinationsMultiplexSettings.Jsii$Proxy that = (MedialiveChannelDestinationsMultiplexSettings.Jsii$Proxy) o;

            if (!multiplexId.equals(that.multiplexId)) return false;
            return this.programName.equals(that.programName);
        }

        @Override
        public final int hashCode() {
            int result = this.multiplexId.hashCode();
            result = 31 * result + (this.programName.hashCode());
            return result;
        }
    }
}
