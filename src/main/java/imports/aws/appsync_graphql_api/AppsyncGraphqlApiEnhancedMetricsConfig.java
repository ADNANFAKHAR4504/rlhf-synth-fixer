package imports.aws.appsync_graphql_api;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.076Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncGraphqlApi.AppsyncGraphqlApiEnhancedMetricsConfig")
@software.amazon.jsii.Jsii.Proxy(AppsyncGraphqlApiEnhancedMetricsConfig.Jsii$Proxy.class)
public interface AppsyncGraphqlApiEnhancedMetricsConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#data_source_level_metrics_behavior AppsyncGraphqlApi#data_source_level_metrics_behavior}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDataSourceLevelMetricsBehavior();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#operation_level_metrics_config AppsyncGraphqlApi#operation_level_metrics_config}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOperationLevelMetricsConfig();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#resolver_level_metrics_behavior AppsyncGraphqlApi#resolver_level_metrics_behavior}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResolverLevelMetricsBehavior();

    /**
     * @return a {@link Builder} of {@link AppsyncGraphqlApiEnhancedMetricsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncGraphqlApiEnhancedMetricsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncGraphqlApiEnhancedMetricsConfig> {
        java.lang.String dataSourceLevelMetricsBehavior;
        java.lang.String operationLevelMetricsConfig;
        java.lang.String resolverLevelMetricsBehavior;

        /**
         * Sets the value of {@link AppsyncGraphqlApiEnhancedMetricsConfig#getDataSourceLevelMetricsBehavior}
         * @param dataSourceLevelMetricsBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#data_source_level_metrics_behavior AppsyncGraphqlApi#data_source_level_metrics_behavior}. This parameter is required.
         * @return {@code this}
         */
        public Builder dataSourceLevelMetricsBehavior(java.lang.String dataSourceLevelMetricsBehavior) {
            this.dataSourceLevelMetricsBehavior = dataSourceLevelMetricsBehavior;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncGraphqlApiEnhancedMetricsConfig#getOperationLevelMetricsConfig}
         * @param operationLevelMetricsConfig Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#operation_level_metrics_config AppsyncGraphqlApi#operation_level_metrics_config}. This parameter is required.
         * @return {@code this}
         */
        public Builder operationLevelMetricsConfig(java.lang.String operationLevelMetricsConfig) {
            this.operationLevelMetricsConfig = operationLevelMetricsConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncGraphqlApiEnhancedMetricsConfig#getResolverLevelMetricsBehavior}
         * @param resolverLevelMetricsBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_graphql_api#resolver_level_metrics_behavior AppsyncGraphqlApi#resolver_level_metrics_behavior}. This parameter is required.
         * @return {@code this}
         */
        public Builder resolverLevelMetricsBehavior(java.lang.String resolverLevelMetricsBehavior) {
            this.resolverLevelMetricsBehavior = resolverLevelMetricsBehavior;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppsyncGraphqlApiEnhancedMetricsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncGraphqlApiEnhancedMetricsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncGraphqlApiEnhancedMetricsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncGraphqlApiEnhancedMetricsConfig {
        private final java.lang.String dataSourceLevelMetricsBehavior;
        private final java.lang.String operationLevelMetricsConfig;
        private final java.lang.String resolverLevelMetricsBehavior;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dataSourceLevelMetricsBehavior = software.amazon.jsii.Kernel.get(this, "dataSourceLevelMetricsBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.operationLevelMetricsConfig = software.amazon.jsii.Kernel.get(this, "operationLevelMetricsConfig", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resolverLevelMetricsBehavior = software.amazon.jsii.Kernel.get(this, "resolverLevelMetricsBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dataSourceLevelMetricsBehavior = java.util.Objects.requireNonNull(builder.dataSourceLevelMetricsBehavior, "dataSourceLevelMetricsBehavior is required");
            this.operationLevelMetricsConfig = java.util.Objects.requireNonNull(builder.operationLevelMetricsConfig, "operationLevelMetricsConfig is required");
            this.resolverLevelMetricsBehavior = java.util.Objects.requireNonNull(builder.resolverLevelMetricsBehavior, "resolverLevelMetricsBehavior is required");
        }

        @Override
        public final java.lang.String getDataSourceLevelMetricsBehavior() {
            return this.dataSourceLevelMetricsBehavior;
        }

        @Override
        public final java.lang.String getOperationLevelMetricsConfig() {
            return this.operationLevelMetricsConfig;
        }

        @Override
        public final java.lang.String getResolverLevelMetricsBehavior() {
            return this.resolverLevelMetricsBehavior;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("dataSourceLevelMetricsBehavior", om.valueToTree(this.getDataSourceLevelMetricsBehavior()));
            data.set("operationLevelMetricsConfig", om.valueToTree(this.getOperationLevelMetricsConfig()));
            data.set("resolverLevelMetricsBehavior", om.valueToTree(this.getResolverLevelMetricsBehavior()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appsyncGraphqlApi.AppsyncGraphqlApiEnhancedMetricsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncGraphqlApiEnhancedMetricsConfig.Jsii$Proxy that = (AppsyncGraphqlApiEnhancedMetricsConfig.Jsii$Proxy) o;

            if (!dataSourceLevelMetricsBehavior.equals(that.dataSourceLevelMetricsBehavior)) return false;
            if (!operationLevelMetricsConfig.equals(that.operationLevelMetricsConfig)) return false;
            return this.resolverLevelMetricsBehavior.equals(that.resolverLevelMetricsBehavior);
        }

        @Override
        public final int hashCode() {
            int result = this.dataSourceLevelMetricsBehavior.hashCode();
            result = 31 * result + (this.operationLevelMetricsConfig.hashCode());
            result = 31 * result + (this.resolverLevelMetricsBehavior.hashCode());
            return result;
        }
    }
}
