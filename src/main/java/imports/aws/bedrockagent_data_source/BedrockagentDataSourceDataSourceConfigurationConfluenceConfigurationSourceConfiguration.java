package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.160Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationSourceConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationSourceConfiguration.Jsii$Proxy.class)
public interface BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationSourceConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#auth_type BedrockagentDataSource#auth_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAuthType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#credentials_secret_arn BedrockagentDataSource#credentials_secret_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCredentialsSecretArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#host_type BedrockagentDataSource#host_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHostType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#host_url BedrockagentDataSource#host_url}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHostUrl();

    /**
     * @return a {@link Builder} of {@link BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationSourceConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationSourceConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationSourceConfiguration> {
        java.lang.String authType;
        java.lang.String credentialsSecretArn;
        java.lang.String hostType;
        java.lang.String hostUrl;

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationSourceConfiguration#getAuthType}
         * @param authType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#auth_type BedrockagentDataSource#auth_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder authType(java.lang.String authType) {
            this.authType = authType;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationSourceConfiguration#getCredentialsSecretArn}
         * @param credentialsSecretArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#credentials_secret_arn BedrockagentDataSource#credentials_secret_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder credentialsSecretArn(java.lang.String credentialsSecretArn) {
            this.credentialsSecretArn = credentialsSecretArn;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationSourceConfiguration#getHostType}
         * @param hostType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#host_type BedrockagentDataSource#host_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder hostType(java.lang.String hostType) {
            this.hostType = hostType;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationSourceConfiguration#getHostUrl}
         * @param hostUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#host_url BedrockagentDataSource#host_url}. This parameter is required.
         * @return {@code this}
         */
        public Builder hostUrl(java.lang.String hostUrl) {
            this.hostUrl = hostUrl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationSourceConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationSourceConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationSourceConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationSourceConfiguration {
        private final java.lang.String authType;
        private final java.lang.String credentialsSecretArn;
        private final java.lang.String hostType;
        private final java.lang.String hostUrl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.authType = software.amazon.jsii.Kernel.get(this, "authType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.credentialsSecretArn = software.amazon.jsii.Kernel.get(this, "credentialsSecretArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hostType = software.amazon.jsii.Kernel.get(this, "hostType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hostUrl = software.amazon.jsii.Kernel.get(this, "hostUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.authType = java.util.Objects.requireNonNull(builder.authType, "authType is required");
            this.credentialsSecretArn = java.util.Objects.requireNonNull(builder.credentialsSecretArn, "credentialsSecretArn is required");
            this.hostType = java.util.Objects.requireNonNull(builder.hostType, "hostType is required");
            this.hostUrl = java.util.Objects.requireNonNull(builder.hostUrl, "hostUrl is required");
        }

        @Override
        public final java.lang.String getAuthType() {
            return this.authType;
        }

        @Override
        public final java.lang.String getCredentialsSecretArn() {
            return this.credentialsSecretArn;
        }

        @Override
        public final java.lang.String getHostType() {
            return this.hostType;
        }

        @Override
        public final java.lang.String getHostUrl() {
            return this.hostUrl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("authType", om.valueToTree(this.getAuthType()));
            data.set("credentialsSecretArn", om.valueToTree(this.getCredentialsSecretArn()));
            data.set("hostType", om.valueToTree(this.getHostType()));
            data.set("hostUrl", om.valueToTree(this.getHostUrl()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationSourceConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationSourceConfiguration.Jsii$Proxy that = (BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationSourceConfiguration.Jsii$Proxy) o;

            if (!authType.equals(that.authType)) return false;
            if (!credentialsSecretArn.equals(that.credentialsSecretArn)) return false;
            if (!hostType.equals(that.hostType)) return false;
            return this.hostUrl.equals(that.hostUrl);
        }

        @Override
        public final int hashCode() {
            int result = this.authType.hashCode();
            result = 31 * result + (this.credentialsSecretArn.hashCode());
            result = 31 * result + (this.hostType.hashCode());
            result = 31 * result + (this.hostUrl.hashCode());
            return result;
        }
    }
}
