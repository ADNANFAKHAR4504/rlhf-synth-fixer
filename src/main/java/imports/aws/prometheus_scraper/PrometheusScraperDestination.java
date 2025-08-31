package imports.aws.prometheus_scraper;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.077Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.prometheusScraper.PrometheusScraperDestination")
@software.amazon.jsii.Jsii.Proxy(PrometheusScraperDestination.Jsii$Proxy.class)
public interface PrometheusScraperDestination extends software.amazon.jsii.JsiiSerializable {

    /**
     * amp block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_scraper#amp PrometheusScraper#amp}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAmp() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PrometheusScraperDestination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PrometheusScraperDestination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PrometheusScraperDestination> {
        java.lang.Object amp;

        /**
         * Sets the value of {@link PrometheusScraperDestination#getAmp}
         * @param amp amp block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_scraper#amp PrometheusScraper#amp}
         * @return {@code this}
         */
        public Builder amp(com.hashicorp.cdktf.IResolvable amp) {
            this.amp = amp;
            return this;
        }

        /**
         * Sets the value of {@link PrometheusScraperDestination#getAmp}
         * @param amp amp block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_scraper#amp PrometheusScraper#amp}
         * @return {@code this}
         */
        public Builder amp(java.util.List<? extends imports.aws.prometheus_scraper.PrometheusScraperDestinationAmp> amp) {
            this.amp = amp;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PrometheusScraperDestination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PrometheusScraperDestination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PrometheusScraperDestination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PrometheusScraperDestination {
        private final java.lang.Object amp;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.amp = software.amazon.jsii.Kernel.get(this, "amp", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.amp = builder.amp;
        }

        @Override
        public final java.lang.Object getAmp() {
            return this.amp;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAmp() != null) {
                data.set("amp", om.valueToTree(this.getAmp()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.prometheusScraper.PrometheusScraperDestination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PrometheusScraperDestination.Jsii$Proxy that = (PrometheusScraperDestination.Jsii$Proxy) o;

            return this.amp != null ? this.amp.equals(that.amp) : that.amp == null;
        }

        @Override
        public final int hashCode() {
            int result = this.amp != null ? this.amp.hashCode() : 0;
            return result;
        }
    }
}
