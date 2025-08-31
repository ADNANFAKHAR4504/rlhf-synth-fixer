package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.165Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfigurationCrawlerLimits")
@software.amazon.jsii.Jsii.Proxy(BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfigurationCrawlerLimits.Jsii$Proxy.class)
public interface BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfigurationCrawlerLimits extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#max_pages BedrockagentDataSource#max_pages}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxPages() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#rate_limit BedrockagentDataSource#rate_limit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRateLimit() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfigurationCrawlerLimits}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfigurationCrawlerLimits}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfigurationCrawlerLimits> {
        java.lang.Number maxPages;
        java.lang.Number rateLimit;

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfigurationCrawlerLimits#getMaxPages}
         * @param maxPages Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#max_pages BedrockagentDataSource#max_pages}.
         * @return {@code this}
         */
        public Builder maxPages(java.lang.Number maxPages) {
            this.maxPages = maxPages;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfigurationCrawlerLimits#getRateLimit}
         * @param rateLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#rate_limit BedrockagentDataSource#rate_limit}.
         * @return {@code this}
         */
        public Builder rateLimit(java.lang.Number rateLimit) {
            this.rateLimit = rateLimit;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfigurationCrawlerLimits}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfigurationCrawlerLimits build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfigurationCrawlerLimits}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfigurationCrawlerLimits {
        private final java.lang.Number maxPages;
        private final java.lang.Number rateLimit;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxPages = software.amazon.jsii.Kernel.get(this, "maxPages", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.rateLimit = software.amazon.jsii.Kernel.get(this, "rateLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxPages = builder.maxPages;
            this.rateLimit = builder.rateLimit;
        }

        @Override
        public final java.lang.Number getMaxPages() {
            return this.maxPages;
        }

        @Override
        public final java.lang.Number getRateLimit() {
            return this.rateLimit;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMaxPages() != null) {
                data.set("maxPages", om.valueToTree(this.getMaxPages()));
            }
            if (this.getRateLimit() != null) {
                data.set("rateLimit", om.valueToTree(this.getRateLimit()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfigurationCrawlerLimits"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfigurationCrawlerLimits.Jsii$Proxy that = (BedrockagentDataSourceDataSourceConfigurationWebConfigurationCrawlerConfigurationCrawlerLimits.Jsii$Proxy) o;

            if (this.maxPages != null ? !this.maxPages.equals(that.maxPages) : that.maxPages != null) return false;
            return this.rateLimit != null ? this.rateLimit.equals(that.rateLimit) : that.rateLimit == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maxPages != null ? this.maxPages.hashCode() : 0;
            result = 31 * result + (this.rateLimit != null ? this.rateLimit.hashCode() : 0);
            return result;
        }
    }
}
