package imports.aws.prometheus_scraper;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.077Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.prometheusScraper.PrometheusScraperSourceEks")
@software.amazon.jsii.Jsii.Proxy(PrometheusScraperSourceEks.Jsii$Proxy.class)
public interface PrometheusScraperSourceEks extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_scraper#cluster_arn PrometheusScraper#cluster_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClusterArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_scraper#subnet_ids PrometheusScraper#subnet_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_scraper#security_group_ids PrometheusScraper#security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PrometheusScraperSourceEks}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PrometheusScraperSourceEks}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PrometheusScraperSourceEks> {
        java.lang.String clusterArn;
        java.util.List<java.lang.String> subnetIds;
        java.util.List<java.lang.String> securityGroupIds;

        /**
         * Sets the value of {@link PrometheusScraperSourceEks#getClusterArn}
         * @param clusterArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_scraper#cluster_arn PrometheusScraper#cluster_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder clusterArn(java.lang.String clusterArn) {
            this.clusterArn = clusterArn;
            return this;
        }

        /**
         * Sets the value of {@link PrometheusScraperSourceEks#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_scraper#subnet_ids PrometheusScraper#subnet_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Sets the value of {@link PrometheusScraperSourceEks#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_scraper#security_group_ids PrometheusScraper#security_group_ids}.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PrometheusScraperSourceEks}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PrometheusScraperSourceEks build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PrometheusScraperSourceEks}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PrometheusScraperSourceEks {
        private final java.lang.String clusterArn;
        private final java.util.List<java.lang.String> subnetIds;
        private final java.util.List<java.lang.String> securityGroupIds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.clusterArn = software.amazon.jsii.Kernel.get(this, "clusterArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.clusterArn = java.util.Objects.requireNonNull(builder.clusterArn, "clusterArn is required");
            this.subnetIds = java.util.Objects.requireNonNull(builder.subnetIds, "subnetIds is required");
            this.securityGroupIds = builder.securityGroupIds;
        }

        @Override
        public final java.lang.String getClusterArn() {
            return this.clusterArn;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupIds() {
            return this.securityGroupIds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("clusterArn", om.valueToTree(this.getClusterArn()));
            data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
            if (this.getSecurityGroupIds() != null) {
                data.set("securityGroupIds", om.valueToTree(this.getSecurityGroupIds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.prometheusScraper.PrometheusScraperSourceEks"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PrometheusScraperSourceEks.Jsii$Proxy that = (PrometheusScraperSourceEks.Jsii$Proxy) o;

            if (!clusterArn.equals(that.clusterArn)) return false;
            if (!subnetIds.equals(that.subnetIds)) return false;
            return this.securityGroupIds != null ? this.securityGroupIds.equals(that.securityGroupIds) : that.securityGroupIds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.clusterArn.hashCode();
            result = 31 * result + (this.subnetIds.hashCode());
            result = 31 * result + (this.securityGroupIds != null ? this.securityGroupIds.hashCode() : 0);
            return result;
        }
    }
}
