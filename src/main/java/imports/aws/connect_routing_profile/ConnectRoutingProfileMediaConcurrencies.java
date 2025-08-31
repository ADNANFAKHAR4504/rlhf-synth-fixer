package imports.aws.connect_routing_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.389Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectRoutingProfile.ConnectRoutingProfileMediaConcurrencies")
@software.amazon.jsii.Jsii.Proxy(ConnectRoutingProfileMediaConcurrencies.Jsii$Proxy.class)
public interface ConnectRoutingProfileMediaConcurrencies extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_routing_profile#channel ConnectRoutingProfile#channel}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getChannel();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_routing_profile#concurrency ConnectRoutingProfile#concurrency}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getConcurrency();

    /**
     * @return a {@link Builder} of {@link ConnectRoutingProfileMediaConcurrencies}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConnectRoutingProfileMediaConcurrencies}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConnectRoutingProfileMediaConcurrencies> {
        java.lang.String channel;
        java.lang.Number concurrency;

        /**
         * Sets the value of {@link ConnectRoutingProfileMediaConcurrencies#getChannel}
         * @param channel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_routing_profile#channel ConnectRoutingProfile#channel}. This parameter is required.
         * @return {@code this}
         */
        public Builder channel(java.lang.String channel) {
            this.channel = channel;
            return this;
        }

        /**
         * Sets the value of {@link ConnectRoutingProfileMediaConcurrencies#getConcurrency}
         * @param concurrency Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_routing_profile#concurrency ConnectRoutingProfile#concurrency}. This parameter is required.
         * @return {@code this}
         */
        public Builder concurrency(java.lang.Number concurrency) {
            this.concurrency = concurrency;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConnectRoutingProfileMediaConcurrencies}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConnectRoutingProfileMediaConcurrencies build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConnectRoutingProfileMediaConcurrencies}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConnectRoutingProfileMediaConcurrencies {
        private final java.lang.String channel;
        private final java.lang.Number concurrency;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.channel = software.amazon.jsii.Kernel.get(this, "channel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.concurrency = software.amazon.jsii.Kernel.get(this, "concurrency", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.channel = java.util.Objects.requireNonNull(builder.channel, "channel is required");
            this.concurrency = java.util.Objects.requireNonNull(builder.concurrency, "concurrency is required");
        }

        @Override
        public final java.lang.String getChannel() {
            return this.channel;
        }

        @Override
        public final java.lang.Number getConcurrency() {
            return this.concurrency;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("channel", om.valueToTree(this.getChannel()));
            data.set("concurrency", om.valueToTree(this.getConcurrency()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.connectRoutingProfile.ConnectRoutingProfileMediaConcurrencies"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConnectRoutingProfileMediaConcurrencies.Jsii$Proxy that = (ConnectRoutingProfileMediaConcurrencies.Jsii$Proxy) o;

            if (!channel.equals(that.channel)) return false;
            return this.concurrency.equals(that.concurrency);
        }

        @Override
        public final int hashCode() {
            int result = this.channel.hashCode();
            result = 31 * result + (this.concurrency.hashCode());
            return result;
        }
    }
}
