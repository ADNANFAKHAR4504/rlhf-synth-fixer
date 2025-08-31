package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.067Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeSourceParametersActivemqBrokerParametersCredentials")
@software.amazon.jsii.Jsii.Proxy(PipesPipeSourceParametersActivemqBrokerParametersCredentials.Jsii$Proxy.class)
public interface PipesPipeSourceParametersActivemqBrokerParametersCredentials extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#basic_auth PipesPipe#basic_auth}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBasicAuth();

    /**
     * @return a {@link Builder} of {@link PipesPipeSourceParametersActivemqBrokerParametersCredentials}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PipesPipeSourceParametersActivemqBrokerParametersCredentials}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PipesPipeSourceParametersActivemqBrokerParametersCredentials> {
        java.lang.String basicAuth;

        /**
         * Sets the value of {@link PipesPipeSourceParametersActivemqBrokerParametersCredentials#getBasicAuth}
         * @param basicAuth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#basic_auth PipesPipe#basic_auth}. This parameter is required.
         * @return {@code this}
         */
        public Builder basicAuth(java.lang.String basicAuth) {
            this.basicAuth = basicAuth;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PipesPipeSourceParametersActivemqBrokerParametersCredentials}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PipesPipeSourceParametersActivemqBrokerParametersCredentials build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PipesPipeSourceParametersActivemqBrokerParametersCredentials}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PipesPipeSourceParametersActivemqBrokerParametersCredentials {
        private final java.lang.String basicAuth;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.basicAuth = software.amazon.jsii.Kernel.get(this, "basicAuth", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.basicAuth = java.util.Objects.requireNonNull(builder.basicAuth, "basicAuth is required");
        }

        @Override
        public final java.lang.String getBasicAuth() {
            return this.basicAuth;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("basicAuth", om.valueToTree(this.getBasicAuth()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pipesPipe.PipesPipeSourceParametersActivemqBrokerParametersCredentials"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PipesPipeSourceParametersActivemqBrokerParametersCredentials.Jsii$Proxy that = (PipesPipeSourceParametersActivemqBrokerParametersCredentials.Jsii$Proxy) o;

            return this.basicAuth.equals(that.basicAuth);
        }

        @Override
        public final int hashCode() {
            int result = this.basicAuth.hashCode();
            return result;
        }
    }
}
