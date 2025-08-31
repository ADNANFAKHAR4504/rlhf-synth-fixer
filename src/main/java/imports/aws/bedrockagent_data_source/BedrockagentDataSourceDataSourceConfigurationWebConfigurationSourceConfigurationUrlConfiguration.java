package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.166Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfigurationUrlConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfigurationUrlConfiguration.Jsii$Proxy.class)
public interface BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfigurationUrlConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * seed_urls block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#seed_urls BedrockagentDataSource#seed_urls}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSeedUrls() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfigurationUrlConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfigurationUrlConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfigurationUrlConfiguration> {
        java.lang.Object seedUrls;

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfigurationUrlConfiguration#getSeedUrls}
         * @param seedUrls seed_urls block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#seed_urls BedrockagentDataSource#seed_urls}
         * @return {@code this}
         */
        public Builder seedUrls(com.hashicorp.cdktf.IResolvable seedUrls) {
            this.seedUrls = seedUrls;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfigurationUrlConfiguration#getSeedUrls}
         * @param seedUrls seed_urls block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#seed_urls BedrockagentDataSource#seed_urls}
         * @return {@code this}
         */
        public Builder seedUrls(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfigurationUrlConfigurationSeedUrls> seedUrls) {
            this.seedUrls = seedUrls;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfigurationUrlConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfigurationUrlConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfigurationUrlConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfigurationUrlConfiguration {
        private final java.lang.Object seedUrls;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.seedUrls = software.amazon.jsii.Kernel.get(this, "seedUrls", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.seedUrls = builder.seedUrls;
        }

        @Override
        public final java.lang.Object getSeedUrls() {
            return this.seedUrls;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSeedUrls() != null) {
                data.set("seedUrls", om.valueToTree(this.getSeedUrls()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfigurationUrlConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfigurationUrlConfiguration.Jsii$Proxy that = (BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfigurationUrlConfiguration.Jsii$Proxy) o;

            return this.seedUrls != null ? this.seedUrls.equals(that.seedUrls) : that.seedUrls == null;
        }

        @Override
        public final int hashCode() {
            int result = this.seedUrls != null ? this.seedUrls.hashCode() : 0;
            return result;
        }
    }
}
