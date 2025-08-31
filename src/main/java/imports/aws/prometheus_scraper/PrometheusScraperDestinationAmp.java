package imports.aws.prometheus_scraper;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.077Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.prometheusScraper.PrometheusScraperDestinationAmp")
@software.amazon.jsii.Jsii.Proxy(PrometheusScraperDestinationAmp.Jsii$Proxy.class)
public interface PrometheusScraperDestinationAmp extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_scraper#workspace_arn PrometheusScraper#workspace_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getWorkspaceArn();

    /**
     * @return a {@link Builder} of {@link PrometheusScraperDestinationAmp}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PrometheusScraperDestinationAmp}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PrometheusScraperDestinationAmp> {
        java.lang.String workspaceArn;

        /**
         * Sets the value of {@link PrometheusScraperDestinationAmp#getWorkspaceArn}
         * @param workspaceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_scraper#workspace_arn PrometheusScraper#workspace_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder workspaceArn(java.lang.String workspaceArn) {
            this.workspaceArn = workspaceArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PrometheusScraperDestinationAmp}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PrometheusScraperDestinationAmp build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PrometheusScraperDestinationAmp}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PrometheusScraperDestinationAmp {
        private final java.lang.String workspaceArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.workspaceArn = software.amazon.jsii.Kernel.get(this, "workspaceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.workspaceArn = java.util.Objects.requireNonNull(builder.workspaceArn, "workspaceArn is required");
        }

        @Override
        public final java.lang.String getWorkspaceArn() {
            return this.workspaceArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("workspaceArn", om.valueToTree(this.getWorkspaceArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.prometheusScraper.PrometheusScraperDestinationAmp"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PrometheusScraperDestinationAmp.Jsii$Proxy that = (PrometheusScraperDestinationAmp.Jsii$Proxy) o;

            return this.workspaceArn.equals(that.workspaceArn);
        }

        @Override
        public final int hashCode() {
            int result = this.workspaceArn.hashCode();
            return result;
        }
    }
}
