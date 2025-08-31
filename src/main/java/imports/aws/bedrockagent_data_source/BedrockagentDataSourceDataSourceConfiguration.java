package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.159Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentDataSourceDataSourceConfiguration.Jsii$Proxy.class)
public interface BedrockagentDataSourceDataSourceConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#type BedrockagentDataSource#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * confluence_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#confluence_configuration BedrockagentDataSource#confluence_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getConfluenceConfiguration() {
        return null;
    }

    /**
     * s3_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#s3_configuration BedrockagentDataSource#s3_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getS3Configuration() {
        return null;
    }

    /**
     * salesforce_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#salesforce_configuration BedrockagentDataSource#salesforce_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSalesforceConfiguration() {
        return null;
    }

    /**
     * share_point_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#share_point_configuration BedrockagentDataSource#share_point_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSharePointConfiguration() {
        return null;
    }

    /**
     * web_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#web_configuration BedrockagentDataSource#web_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getWebConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentDataSourceDataSourceConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentDataSourceDataSourceConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentDataSourceDataSourceConfiguration> {
        java.lang.String type;
        java.lang.Object confluenceConfiguration;
        java.lang.Object s3Configuration;
        java.lang.Object salesforceConfiguration;
        java.lang.Object sharePointConfiguration;
        java.lang.Object webConfiguration;

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfiguration#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#type BedrockagentDataSource#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfiguration#getConfluenceConfiguration}
         * @param confluenceConfiguration confluence_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#confluence_configuration BedrockagentDataSource#confluence_configuration}
         * @return {@code this}
         */
        public Builder confluenceConfiguration(com.hashicorp.cdktf.IResolvable confluenceConfiguration) {
            this.confluenceConfiguration = confluenceConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfiguration#getConfluenceConfiguration}
         * @param confluenceConfiguration confluence_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#confluence_configuration BedrockagentDataSource#confluence_configuration}
         * @return {@code this}
         */
        public Builder confluenceConfiguration(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationConfluenceConfiguration> confluenceConfiguration) {
            this.confluenceConfiguration = confluenceConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfiguration#getS3Configuration}
         * @param s3Configuration s3_configuration block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#s3_configuration BedrockagentDataSource#s3_configuration}
         * @return {@code this}
         */
        public Builder s3Configuration(com.hashicorp.cdktf.IResolvable s3Configuration) {
            this.s3Configuration = s3Configuration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfiguration#getS3Configuration}
         * @param s3Configuration s3_configuration block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#s3_configuration BedrockagentDataSource#s3_configuration}
         * @return {@code this}
         */
        public Builder s3Configuration(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationS3Configuration> s3Configuration) {
            this.s3Configuration = s3Configuration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfiguration#getSalesforceConfiguration}
         * @param salesforceConfiguration salesforce_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#salesforce_configuration BedrockagentDataSource#salesforce_configuration}
         * @return {@code this}
         */
        public Builder salesforceConfiguration(com.hashicorp.cdktf.IResolvable salesforceConfiguration) {
            this.salesforceConfiguration = salesforceConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfiguration#getSalesforceConfiguration}
         * @param salesforceConfiguration salesforce_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#salesforce_configuration BedrockagentDataSource#salesforce_configuration}
         * @return {@code this}
         */
        public Builder salesforceConfiguration(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationSalesforceConfiguration> salesforceConfiguration) {
            this.salesforceConfiguration = salesforceConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfiguration#getSharePointConfiguration}
         * @param sharePointConfiguration share_point_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#share_point_configuration BedrockagentDataSource#share_point_configuration}
         * @return {@code this}
         */
        public Builder sharePointConfiguration(com.hashicorp.cdktf.IResolvable sharePointConfiguration) {
            this.sharePointConfiguration = sharePointConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfiguration#getSharePointConfiguration}
         * @param sharePointConfiguration share_point_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#share_point_configuration BedrockagentDataSource#share_point_configuration}
         * @return {@code this}
         */
        public Builder sharePointConfiguration(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationSharePointConfiguration> sharePointConfiguration) {
            this.sharePointConfiguration = sharePointConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfiguration#getWebConfiguration}
         * @param webConfiguration web_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#web_configuration BedrockagentDataSource#web_configuration}
         * @return {@code this}
         */
        public Builder webConfiguration(com.hashicorp.cdktf.IResolvable webConfiguration) {
            this.webConfiguration = webConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfiguration#getWebConfiguration}
         * @param webConfiguration web_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#web_configuration BedrockagentDataSource#web_configuration}
         * @return {@code this}
         */
        public Builder webConfiguration(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationWebConfiguration> webConfiguration) {
            this.webConfiguration = webConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentDataSourceDataSourceConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentDataSourceDataSourceConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentDataSourceDataSourceConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentDataSourceDataSourceConfiguration {
        private final java.lang.String type;
        private final java.lang.Object confluenceConfiguration;
        private final java.lang.Object s3Configuration;
        private final java.lang.Object salesforceConfiguration;
        private final java.lang.Object sharePointConfiguration;
        private final java.lang.Object webConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.confluenceConfiguration = software.amazon.jsii.Kernel.get(this, "confluenceConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.s3Configuration = software.amazon.jsii.Kernel.get(this, "s3Configuration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.salesforceConfiguration = software.amazon.jsii.Kernel.get(this, "salesforceConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sharePointConfiguration = software.amazon.jsii.Kernel.get(this, "sharePointConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.webConfiguration = software.amazon.jsii.Kernel.get(this, "webConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.confluenceConfiguration = builder.confluenceConfiguration;
            this.s3Configuration = builder.s3Configuration;
            this.salesforceConfiguration = builder.salesforceConfiguration;
            this.sharePointConfiguration = builder.sharePointConfiguration;
            this.webConfiguration = builder.webConfiguration;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.Object getConfluenceConfiguration() {
            return this.confluenceConfiguration;
        }

        @Override
        public final java.lang.Object getS3Configuration() {
            return this.s3Configuration;
        }

        @Override
        public final java.lang.Object getSalesforceConfiguration() {
            return this.salesforceConfiguration;
        }

        @Override
        public final java.lang.Object getSharePointConfiguration() {
            return this.sharePointConfiguration;
        }

        @Override
        public final java.lang.Object getWebConfiguration() {
            return this.webConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getConfluenceConfiguration() != null) {
                data.set("confluenceConfiguration", om.valueToTree(this.getConfluenceConfiguration()));
            }
            if (this.getS3Configuration() != null) {
                data.set("s3Configuration", om.valueToTree(this.getS3Configuration()));
            }
            if (this.getSalesforceConfiguration() != null) {
                data.set("salesforceConfiguration", om.valueToTree(this.getSalesforceConfiguration()));
            }
            if (this.getSharePointConfiguration() != null) {
                data.set("sharePointConfiguration", om.valueToTree(this.getSharePointConfiguration()));
            }
            if (this.getWebConfiguration() != null) {
                data.set("webConfiguration", om.valueToTree(this.getWebConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentDataSourceDataSourceConfiguration.Jsii$Proxy that = (BedrockagentDataSourceDataSourceConfiguration.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            if (this.confluenceConfiguration != null ? !this.confluenceConfiguration.equals(that.confluenceConfiguration) : that.confluenceConfiguration != null) return false;
            if (this.s3Configuration != null ? !this.s3Configuration.equals(that.s3Configuration) : that.s3Configuration != null) return false;
            if (this.salesforceConfiguration != null ? !this.salesforceConfiguration.equals(that.salesforceConfiguration) : that.salesforceConfiguration != null) return false;
            if (this.sharePointConfiguration != null ? !this.sharePointConfiguration.equals(that.sharePointConfiguration) : that.sharePointConfiguration != null) return false;
            return this.webConfiguration != null ? this.webConfiguration.equals(that.webConfiguration) : that.webConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.confluenceConfiguration != null ? this.confluenceConfiguration.hashCode() : 0);
            result = 31 * result + (this.s3Configuration != null ? this.s3Configuration.hashCode() : 0);
            result = 31 * result + (this.salesforceConfiguration != null ? this.salesforceConfiguration.hashCode() : 0);
            result = 31 * result + (this.sharePointConfiguration != null ? this.sharePointConfiguration.hashCode() : 0);
            result = 31 * result + (this.webConfiguration != null ? this.webConfiguration.hashCode() : 0);
            return result;
        }
    }
}
