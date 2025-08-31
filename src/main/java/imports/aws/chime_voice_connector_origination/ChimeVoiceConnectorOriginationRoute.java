package imports.aws.chime_voice_connector_origination;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.203Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chimeVoiceConnectorOrigination.ChimeVoiceConnectorOriginationRoute")
@software.amazon.jsii.Jsii.Proxy(ChimeVoiceConnectorOriginationRoute.Jsii$Proxy.class)
public interface ChimeVoiceConnectorOriginationRoute extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_origination#host ChimeVoiceConnectorOrigination#host}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHost();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_origination#priority ChimeVoiceConnectorOrigination#priority}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPriority();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_origination#protocol ChimeVoiceConnectorOrigination#protocol}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProtocol();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_origination#weight ChimeVoiceConnectorOrigination#weight}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getWeight();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_origination#port ChimeVoiceConnectorOrigination#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ChimeVoiceConnectorOriginationRoute}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ChimeVoiceConnectorOriginationRoute}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ChimeVoiceConnectorOriginationRoute> {
        java.lang.String host;
        java.lang.Number priority;
        java.lang.String protocol;
        java.lang.Number weight;
        java.lang.Number port;

        /**
         * Sets the value of {@link ChimeVoiceConnectorOriginationRoute#getHost}
         * @param host Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_origination#host ChimeVoiceConnectorOrigination#host}. This parameter is required.
         * @return {@code this}
         */
        public Builder host(java.lang.String host) {
            this.host = host;
            return this;
        }

        /**
         * Sets the value of {@link ChimeVoiceConnectorOriginationRoute#getPriority}
         * @param priority Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_origination#priority ChimeVoiceConnectorOrigination#priority}. This parameter is required.
         * @return {@code this}
         */
        public Builder priority(java.lang.Number priority) {
            this.priority = priority;
            return this;
        }

        /**
         * Sets the value of {@link ChimeVoiceConnectorOriginationRoute#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_origination#protocol ChimeVoiceConnectorOrigination#protocol}. This parameter is required.
         * @return {@code this}
         */
        public Builder protocol(java.lang.String protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Sets the value of {@link ChimeVoiceConnectorOriginationRoute#getWeight}
         * @param weight Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_origination#weight ChimeVoiceConnectorOrigination#weight}. This parameter is required.
         * @return {@code this}
         */
        public Builder weight(java.lang.Number weight) {
            this.weight = weight;
            return this;
        }

        /**
         * Sets the value of {@link ChimeVoiceConnectorOriginationRoute#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_origination#port ChimeVoiceConnectorOrigination#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ChimeVoiceConnectorOriginationRoute}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ChimeVoiceConnectorOriginationRoute build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ChimeVoiceConnectorOriginationRoute}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ChimeVoiceConnectorOriginationRoute {
        private final java.lang.String host;
        private final java.lang.Number priority;
        private final java.lang.String protocol;
        private final java.lang.Number weight;
        private final java.lang.Number port;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.host = software.amazon.jsii.Kernel.get(this, "host", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.priority = software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.weight = software.amazon.jsii.Kernel.get(this, "weight", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.host = java.util.Objects.requireNonNull(builder.host, "host is required");
            this.priority = java.util.Objects.requireNonNull(builder.priority, "priority is required");
            this.protocol = java.util.Objects.requireNonNull(builder.protocol, "protocol is required");
            this.weight = java.util.Objects.requireNonNull(builder.weight, "weight is required");
            this.port = builder.port;
        }

        @Override
        public final java.lang.String getHost() {
            return this.host;
        }

        @Override
        public final java.lang.Number getPriority() {
            return this.priority;
        }

        @Override
        public final java.lang.String getProtocol() {
            return this.protocol;
        }

        @Override
        public final java.lang.Number getWeight() {
            return this.weight;
        }

        @Override
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("host", om.valueToTree(this.getHost()));
            data.set("priority", om.valueToTree(this.getPriority()));
            data.set("protocol", om.valueToTree(this.getProtocol()));
            data.set("weight", om.valueToTree(this.getWeight()));
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.chimeVoiceConnectorOrigination.ChimeVoiceConnectorOriginationRoute"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ChimeVoiceConnectorOriginationRoute.Jsii$Proxy that = (ChimeVoiceConnectorOriginationRoute.Jsii$Proxy) o;

            if (!host.equals(that.host)) return false;
            if (!priority.equals(that.priority)) return false;
            if (!protocol.equals(that.protocol)) return false;
            if (!weight.equals(that.weight)) return false;
            return this.port != null ? this.port.equals(that.port) : that.port == null;
        }

        @Override
        public final int hashCode() {
            int result = this.host.hashCode();
            result = 31 * result + (this.priority.hashCode());
            result = 31 * result + (this.protocol.hashCode());
            result = 31 * result + (this.weight.hashCode());
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            return result;
        }
    }
}
