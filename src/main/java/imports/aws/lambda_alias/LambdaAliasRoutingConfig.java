package imports.aws.lambda_alias;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.497Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaAlias.LambdaAliasRoutingConfig")
@software.amazon.jsii.Jsii.Proxy(LambdaAliasRoutingConfig.Jsii$Proxy.class)
public interface LambdaAliasRoutingConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_alias#additional_version_weights LambdaAlias#additional_version_weights}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.Number> getAdditionalVersionWeights() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LambdaAliasRoutingConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LambdaAliasRoutingConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LambdaAliasRoutingConfig> {
        java.util.Map<java.lang.String, java.lang.Number> additionalVersionWeights;

        /**
         * Sets the value of {@link LambdaAliasRoutingConfig#getAdditionalVersionWeights}
         * @param additionalVersionWeights Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_alias#additional_version_weights LambdaAlias#additional_version_weights}.
         * @return {@code this}
         */
        @SuppressWarnings("unchecked")
        public Builder additionalVersionWeights(java.util.Map<java.lang.String, ? extends java.lang.Number> additionalVersionWeights) {
            this.additionalVersionWeights = (java.util.Map<java.lang.String, java.lang.Number>)additionalVersionWeights;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LambdaAliasRoutingConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LambdaAliasRoutingConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LambdaAliasRoutingConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LambdaAliasRoutingConfig {
        private final java.util.Map<java.lang.String, java.lang.Number> additionalVersionWeights;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.additionalVersionWeights = software.amazon.jsii.Kernel.get(this, "additionalVersionWeights", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.additionalVersionWeights = (java.util.Map<java.lang.String, java.lang.Number>)builder.additionalVersionWeights;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.Number> getAdditionalVersionWeights() {
            return this.additionalVersionWeights;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAdditionalVersionWeights() != null) {
                data.set("additionalVersionWeights", om.valueToTree(this.getAdditionalVersionWeights()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lambdaAlias.LambdaAliasRoutingConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LambdaAliasRoutingConfig.Jsii$Proxy that = (LambdaAliasRoutingConfig.Jsii$Proxy) o;

            return this.additionalVersionWeights != null ? this.additionalVersionWeights.equals(that.additionalVersionWeights) : that.additionalVersionWeights == null;
        }

        @Override
        public final int hashCode() {
            int result = this.additionalVersionWeights != null ? this.additionalVersionWeights.hashCode() : 0;
            return result;
        }
    }
}
