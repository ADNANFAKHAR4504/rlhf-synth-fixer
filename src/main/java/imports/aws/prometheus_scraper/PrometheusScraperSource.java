package imports.aws.prometheus_scraper;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.077Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.prometheusScraper.PrometheusScraperSource")
@software.amazon.jsii.Jsii.Proxy(PrometheusScraperSource.Jsii$Proxy.class)
public interface PrometheusScraperSource extends software.amazon.jsii.JsiiSerializable {

    /**
     * eks block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_scraper#eks PrometheusScraper#eks}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEks() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PrometheusScraperSource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PrometheusScraperSource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PrometheusScraperSource> {
        java.lang.Object eks;

        /**
         * Sets the value of {@link PrometheusScraperSource#getEks}
         * @param eks eks block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_scraper#eks PrometheusScraper#eks}
         * @return {@code this}
         */
        public Builder eks(com.hashicorp.cdktf.IResolvable eks) {
            this.eks = eks;
            return this;
        }

        /**
         * Sets the value of {@link PrometheusScraperSource#getEks}
         * @param eks eks block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_scraper#eks PrometheusScraper#eks}
         * @return {@code this}
         */
        public Builder eks(java.util.List<? extends imports.aws.prometheus_scraper.PrometheusScraperSourceEks> eks) {
            this.eks = eks;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PrometheusScraperSource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PrometheusScraperSource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PrometheusScraperSource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PrometheusScraperSource {
        private final java.lang.Object eks;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.eks = software.amazon.jsii.Kernel.get(this, "eks", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.eks = builder.eks;
        }

        @Override
        public final java.lang.Object getEks() {
            return this.eks;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEks() != null) {
                data.set("eks", om.valueToTree(this.getEks()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.prometheusScraper.PrometheusScraperSource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PrometheusScraperSource.Jsii$Proxy that = (PrometheusScraperSource.Jsii$Proxy) o;

            return this.eks != null ? this.eks.equals(that.eks) : that.eks == null;
        }

        @Override
        public final int hashCode() {
            int result = this.eks != null ? this.eks.hashCode() : 0;
            return result;
        }
    }
}
