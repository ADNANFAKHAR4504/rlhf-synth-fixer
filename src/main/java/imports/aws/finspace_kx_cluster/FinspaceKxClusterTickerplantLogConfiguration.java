package imports.aws.finspace_kx_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.218Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxCluster.FinspaceKxClusterTickerplantLogConfiguration")
@software.amazon.jsii.Jsii.Proxy(FinspaceKxClusterTickerplantLogConfiguration.Jsii$Proxy.class)
public interface FinspaceKxClusterTickerplantLogConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tickerplant_log_volumes FinspaceKxCluster#tickerplant_log_volumes}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTickerplantLogVolumes();

    /**
     * @return a {@link Builder} of {@link FinspaceKxClusterTickerplantLogConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FinspaceKxClusterTickerplantLogConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FinspaceKxClusterTickerplantLogConfiguration> {
        java.util.List<java.lang.String> tickerplantLogVolumes;

        /**
         * Sets the value of {@link FinspaceKxClusterTickerplantLogConfiguration#getTickerplantLogVolumes}
         * @param tickerplantLogVolumes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tickerplant_log_volumes FinspaceKxCluster#tickerplant_log_volumes}. This parameter is required.
         * @return {@code this}
         */
        public Builder tickerplantLogVolumes(java.util.List<java.lang.String> tickerplantLogVolumes) {
            this.tickerplantLogVolumes = tickerplantLogVolumes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FinspaceKxClusterTickerplantLogConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FinspaceKxClusterTickerplantLogConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FinspaceKxClusterTickerplantLogConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FinspaceKxClusterTickerplantLogConfiguration {
        private final java.util.List<java.lang.String> tickerplantLogVolumes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.tickerplantLogVolumes = software.amazon.jsii.Kernel.get(this, "tickerplantLogVolumes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.tickerplantLogVolumes = java.util.Objects.requireNonNull(builder.tickerplantLogVolumes, "tickerplantLogVolumes is required");
        }

        @Override
        public final java.util.List<java.lang.String> getTickerplantLogVolumes() {
            return this.tickerplantLogVolumes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("tickerplantLogVolumes", om.valueToTree(this.getTickerplantLogVolumes()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.finspaceKxCluster.FinspaceKxClusterTickerplantLogConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FinspaceKxClusterTickerplantLogConfiguration.Jsii$Proxy that = (FinspaceKxClusterTickerplantLogConfiguration.Jsii$Proxy) o;

            return this.tickerplantLogVolumes.equals(that.tickerplantLogVolumes);
        }

        @Override
        public final int hashCode() {
            int result = this.tickerplantLogVolumes.hashCode();
            return result;
        }
    }
}
