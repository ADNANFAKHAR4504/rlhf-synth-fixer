package imports.aws.prometheus_scraper;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.077Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.prometheusScraper.PrometheusScraperRoleConfiguration")
@software.amazon.jsii.Jsii.Proxy(PrometheusScraperRoleConfiguration.Jsii$Proxy.class)
public interface PrometheusScraperRoleConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_scraper#source_role_arn PrometheusScraper#source_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_scraper#target_role_arn PrometheusScraper#target_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTargetRoleArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PrometheusScraperRoleConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PrometheusScraperRoleConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PrometheusScraperRoleConfiguration> {
        java.lang.String sourceRoleArn;
        java.lang.String targetRoleArn;

        /**
         * Sets the value of {@link PrometheusScraperRoleConfiguration#getSourceRoleArn}
         * @param sourceRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_scraper#source_role_arn PrometheusScraper#source_role_arn}.
         * @return {@code this}
         */
        public Builder sourceRoleArn(java.lang.String sourceRoleArn) {
            this.sourceRoleArn = sourceRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link PrometheusScraperRoleConfiguration#getTargetRoleArn}
         * @param targetRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_scraper#target_role_arn PrometheusScraper#target_role_arn}.
         * @return {@code this}
         */
        public Builder targetRoleArn(java.lang.String targetRoleArn) {
            this.targetRoleArn = targetRoleArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PrometheusScraperRoleConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PrometheusScraperRoleConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PrometheusScraperRoleConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PrometheusScraperRoleConfiguration {
        private final java.lang.String sourceRoleArn;
        private final java.lang.String targetRoleArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sourceRoleArn = software.amazon.jsii.Kernel.get(this, "sourceRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetRoleArn = software.amazon.jsii.Kernel.get(this, "targetRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sourceRoleArn = builder.sourceRoleArn;
            this.targetRoleArn = builder.targetRoleArn;
        }

        @Override
        public final java.lang.String getSourceRoleArn() {
            return this.sourceRoleArn;
        }

        @Override
        public final java.lang.String getTargetRoleArn() {
            return this.targetRoleArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSourceRoleArn() != null) {
                data.set("sourceRoleArn", om.valueToTree(this.getSourceRoleArn()));
            }
            if (this.getTargetRoleArn() != null) {
                data.set("targetRoleArn", om.valueToTree(this.getTargetRoleArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.prometheusScraper.PrometheusScraperRoleConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PrometheusScraperRoleConfiguration.Jsii$Proxy that = (PrometheusScraperRoleConfiguration.Jsii$Proxy) o;

            if (this.sourceRoleArn != null ? !this.sourceRoleArn.equals(that.sourceRoleArn) : that.sourceRoleArn != null) return false;
            return this.targetRoleArn != null ? this.targetRoleArn.equals(that.targetRoleArn) : that.targetRoleArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.sourceRoleArn != null ? this.sourceRoleArn.hashCode() : 0;
            result = 31 * result + (this.targetRoleArn != null ? this.targetRoleArn.hashCode() : 0);
            return result;
        }
    }
}
