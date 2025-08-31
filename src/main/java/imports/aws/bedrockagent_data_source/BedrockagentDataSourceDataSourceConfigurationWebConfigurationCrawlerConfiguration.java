package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.165Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfiguration.Jsii$Proxy.class)
public interface BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * crawler_limits block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#crawler_limits BedrockagentDataSource#crawler_limits}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCrawlerLimits() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#exclusion_filters BedrockagentDataSource#exclusion_filters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExclusionFilters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#inclusion_filters BedrockagentDataSource#inclusion_filters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInclusionFilters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#scope BedrockagentDataSource#scope}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getScope() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#user_agent BedrockagentDataSource#user_agent}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserAgent() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfiguration> {
        java.lang.Object crawlerLimits;
        java.util.List<java.lang.String> exclusionFilters;
        java.util.List<java.lang.String> inclusionFilters;
        java.lang.String scope;
        java.lang.String userAgent;

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfiguration#getCrawlerLimits}
         * @param crawlerLimits crawler_limits block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#crawler_limits BedrockagentDataSource#crawler_limits}
         * @return {@code this}
         */
        public Builder crawlerLimits(com.hashicorp.cdktf.IResolvable crawlerLimits) {
            this.crawlerLimits = crawlerLimits;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfiguration#getCrawlerLimits}
         * @param crawlerLimits crawler_limits block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#crawler_limits BedrockagentDataSource#crawler_limits}
         * @return {@code this}
         */
        public Builder crawlerLimits(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfigurationCrawlerLimits> crawlerLimits) {
            this.crawlerLimits = crawlerLimits;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfiguration#getExclusionFilters}
         * @param exclusionFilters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#exclusion_filters BedrockagentDataSource#exclusion_filters}.
         * @return {@code this}
         */
        public Builder exclusionFilters(java.util.List<java.lang.String> exclusionFilters) {
            this.exclusionFilters = exclusionFilters;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfiguration#getInclusionFilters}
         * @param inclusionFilters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#inclusion_filters BedrockagentDataSource#inclusion_filters}.
         * @return {@code this}
         */
        public Builder inclusionFilters(java.util.List<java.lang.String> inclusionFilters) {
            this.inclusionFilters = inclusionFilters;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfiguration#getScope}
         * @param scope Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#scope BedrockagentDataSource#scope}.
         * @return {@code this}
         */
        public Builder scope(java.lang.String scope) {
            this.scope = scope;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfiguration#getUserAgent}
         * @param userAgent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#user_agent BedrockagentDataSource#user_agent}.
         * @return {@code this}
         */
        public Builder userAgent(java.lang.String userAgent) {
            this.userAgent = userAgent;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfiguration {
        private final java.lang.Object crawlerLimits;
        private final java.util.List<java.lang.String> exclusionFilters;
        private final java.util.List<java.lang.String> inclusionFilters;
        private final java.lang.String scope;
        private final java.lang.String userAgent;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.crawlerLimits = software.amazon.jsii.Kernel.get(this, "crawlerLimits", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.exclusionFilters = software.amazon.jsii.Kernel.get(this, "exclusionFilters", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.inclusionFilters = software.amazon.jsii.Kernel.get(this, "inclusionFilters", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.scope = software.amazon.jsii.Kernel.get(this, "scope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userAgent = software.amazon.jsii.Kernel.get(this, "userAgent", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.crawlerLimits = builder.crawlerLimits;
            this.exclusionFilters = builder.exclusionFilters;
            this.inclusionFilters = builder.inclusionFilters;
            this.scope = builder.scope;
            this.userAgent = builder.userAgent;
        }

        @Override
        public final java.lang.Object getCrawlerLimits() {
            return this.crawlerLimits;
        }

        @Override
        public final java.util.List<java.lang.String> getExclusionFilters() {
            return this.exclusionFilters;
        }

        @Override
        public final java.util.List<java.lang.String> getInclusionFilters() {
            return this.inclusionFilters;
        }

        @Override
        public final java.lang.String getScope() {
            return this.scope;
        }

        @Override
        public final java.lang.String getUserAgent() {
            return this.userAgent;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCrawlerLimits() != null) {
                data.set("crawlerLimits", om.valueToTree(this.getCrawlerLimits()));
            }
            if (this.getExclusionFilters() != null) {
                data.set("exclusionFilters", om.valueToTree(this.getExclusionFilters()));
            }
            if (this.getInclusionFilters() != null) {
                data.set("inclusionFilters", om.valueToTree(this.getInclusionFilters()));
            }
            if (this.getScope() != null) {
                data.set("scope", om.valueToTree(this.getScope()));
            }
            if (this.getUserAgent() != null) {
                data.set("userAgent", om.valueToTree(this.getUserAgent()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfiguration.Jsii$Proxy that = (BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfiguration.Jsii$Proxy) o;

            if (this.crawlerLimits != null ? !this.crawlerLimits.equals(that.crawlerLimits) : that.crawlerLimits != null) return false;
            if (this.exclusionFilters != null ? !this.exclusionFilters.equals(that.exclusionFilters) : that.exclusionFilters != null) return false;
            if (this.inclusionFilters != null ? !this.inclusionFilters.equals(that.inclusionFilters) : that.inclusionFilters != null) return false;
            if (this.scope != null ? !this.scope.equals(that.scope) : that.scope != null) return false;
            return this.userAgent != null ? this.userAgent.equals(that.userAgent) : that.userAgent == null;
        }

        @Override
        public final int hashCode() {
            int result = this.crawlerLimits != null ? this.crawlerLimits.hashCode() : 0;
            result = 31 * result + (this.exclusionFilters != null ? this.exclusionFilters.hashCode() : 0);
            result = 31 * result + (this.inclusionFilters != null ? this.inclusionFilters.hashCode() : 0);
            result = 31 * result + (this.scope != null ? this.scope.hashCode() : 0);
            result = 31 * result + (this.userAgent != null ? this.userAgent.hashCode() : 0);
            return result;
        }
    }
}
