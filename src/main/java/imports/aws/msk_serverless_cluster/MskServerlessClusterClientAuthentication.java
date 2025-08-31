package imports.aws.msk_serverless_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.914Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskServerlessCluster.MskServerlessClusterClientAuthentication")
@software.amazon.jsii.Jsii.Proxy(MskServerlessClusterClientAuthentication.Jsii$Proxy.class)
public interface MskServerlessClusterClientAuthentication extends software.amazon.jsii.JsiiSerializable {

    /**
     * sasl block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_serverless_cluster#sasl MskServerlessCluster#sasl}
     */
    @org.jetbrains.annotations.NotNull imports.aws.msk_serverless_cluster.MskServerlessClusterClientAuthenticationSasl getSasl();

    /**
     * @return a {@link Builder} of {@link MskServerlessClusterClientAuthentication}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskServerlessClusterClientAuthentication}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskServerlessClusterClientAuthentication> {
        imports.aws.msk_serverless_cluster.MskServerlessClusterClientAuthenticationSasl sasl;

        /**
         * Sets the value of {@link MskServerlessClusterClientAuthentication#getSasl}
         * @param sasl sasl block. This parameter is required.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_serverless_cluster#sasl MskServerlessCluster#sasl}
         * @return {@code this}
         */
        public Builder sasl(imports.aws.msk_serverless_cluster.MskServerlessClusterClientAuthenticationSasl sasl) {
            this.sasl = sasl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskServerlessClusterClientAuthentication}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskServerlessClusterClientAuthentication build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskServerlessClusterClientAuthentication}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskServerlessClusterClientAuthentication {
        private final imports.aws.msk_serverless_cluster.MskServerlessClusterClientAuthenticationSasl sasl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sasl = software.amazon.jsii.Kernel.get(this, "sasl", software.amazon.jsii.NativeType.forClass(imports.aws.msk_serverless_cluster.MskServerlessClusterClientAuthenticationSasl.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sasl = java.util.Objects.requireNonNull(builder.sasl, "sasl is required");
        }

        @Override
        public final imports.aws.msk_serverless_cluster.MskServerlessClusterClientAuthenticationSasl getSasl() {
            return this.sasl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("sasl", om.valueToTree(this.getSasl()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskServerlessCluster.MskServerlessClusterClientAuthentication"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskServerlessClusterClientAuthentication.Jsii$Proxy that = (MskServerlessClusterClientAuthentication.Jsii$Proxy) o;

            return this.sasl.equals(that.sasl);
        }

        @Override
        public final int hashCode() {
            int result = this.sasl.hashCode();
            return result;
        }
    }
}
