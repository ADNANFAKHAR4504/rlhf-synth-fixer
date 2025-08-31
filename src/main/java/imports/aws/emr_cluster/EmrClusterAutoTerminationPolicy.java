package imports.aws.emr_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.195Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrCluster.EmrClusterAutoTerminationPolicy")
@software.amazon.jsii.Jsii.Proxy(EmrClusterAutoTerminationPolicy.Jsii$Proxy.class)
public interface EmrClusterAutoTerminationPolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#idle_timeout EmrCluster#idle_timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIdleTimeout() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrClusterAutoTerminationPolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrClusterAutoTerminationPolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrClusterAutoTerminationPolicy> {
        java.lang.Number idleTimeout;

        /**
         * Sets the value of {@link EmrClusterAutoTerminationPolicy#getIdleTimeout}
         * @param idleTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#idle_timeout EmrCluster#idle_timeout}.
         * @return {@code this}
         */
        public Builder idleTimeout(java.lang.Number idleTimeout) {
            this.idleTimeout = idleTimeout;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrClusterAutoTerminationPolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrClusterAutoTerminationPolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrClusterAutoTerminationPolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrClusterAutoTerminationPolicy {
        private final java.lang.Number idleTimeout;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.idleTimeout = software.amazon.jsii.Kernel.get(this, "idleTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.idleTimeout = builder.idleTimeout;
        }

        @Override
        public final java.lang.Number getIdleTimeout() {
            return this.idleTimeout;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIdleTimeout() != null) {
                data.set("idleTimeout", om.valueToTree(this.getIdleTimeout()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrCluster.EmrClusterAutoTerminationPolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrClusterAutoTerminationPolicy.Jsii$Proxy that = (EmrClusterAutoTerminationPolicy.Jsii$Proxy) o;

            return this.idleTimeout != null ? this.idleTimeout.equals(that.idleTimeout) : that.idleTimeout == null;
        }

        @Override
        public final int hashCode() {
            int result = this.idleTimeout != null ? this.idleTimeout.hashCode() : 0;
            return result;
        }
    }
}
