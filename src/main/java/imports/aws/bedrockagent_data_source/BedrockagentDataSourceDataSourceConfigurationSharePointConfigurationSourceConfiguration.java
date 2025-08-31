package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.165Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfiguration.Jsii$Proxy.class)
public interface BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#auth_type BedrockagentDataSource#auth_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAuthType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#credentials_secret_arn BedrockagentDataSource#credentials_secret_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCredentialsSecretArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#domain BedrockagentDataSource#domain}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDomain();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#host_type BedrockagentDataSource#host_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHostType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#site_urls BedrockagentDataSource#site_urls}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSiteUrls();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#tenant_id BedrockagentDataSource#tenant_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTenantId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfiguration> {
        java.lang.String authType;
        java.lang.String credentialsSecretArn;
        java.lang.String domain;
        java.lang.String hostType;
        java.util.List<java.lang.String> siteUrls;
        java.lang.String tenantId;

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfiguration#getAuthType}
         * @param authType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#auth_type BedrockagentDataSource#auth_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder authType(java.lang.String authType) {
            this.authType = authType;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfiguration#getCredentialsSecretArn}
         * @param credentialsSecretArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#credentials_secret_arn BedrockagentDataSource#credentials_secret_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder credentialsSecretArn(java.lang.String credentialsSecretArn) {
            this.credentialsSecretArn = credentialsSecretArn;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfiguration#getDomain}
         * @param domain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#domain BedrockagentDataSource#domain}. This parameter is required.
         * @return {@code this}
         */
        public Builder domain(java.lang.String domain) {
            this.domain = domain;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfiguration#getHostType}
         * @param hostType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#host_type BedrockagentDataSource#host_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder hostType(java.lang.String hostType) {
            this.hostType = hostType;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfiguration#getSiteUrls}
         * @param siteUrls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#site_urls BedrockagentDataSource#site_urls}. This parameter is required.
         * @return {@code this}
         */
        public Builder siteUrls(java.util.List<java.lang.String> siteUrls) {
            this.siteUrls = siteUrls;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfiguration#getTenantId}
         * @param tenantId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#tenant_id BedrockagentDataSource#tenant_id}.
         * @return {@code this}
         */
        public Builder tenantId(java.lang.String tenantId) {
            this.tenantId = tenantId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfiguration {
        private final java.lang.String authType;
        private final java.lang.String credentialsSecretArn;
        private final java.lang.String domain;
        private final java.lang.String hostType;
        private final java.util.List<java.lang.String> siteUrls;
        private final java.lang.String tenantId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.authType = software.amazon.jsii.Kernel.get(this, "authType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.credentialsSecretArn = software.amazon.jsii.Kernel.get(this, "credentialsSecretArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domain = software.amazon.jsii.Kernel.get(this, "domain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hostType = software.amazon.jsii.Kernel.get(this, "hostType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.siteUrls = software.amazon.jsii.Kernel.get(this, "siteUrls", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tenantId = software.amazon.jsii.Kernel.get(this, "tenantId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.authType = java.util.Objects.requireNonNull(builder.authType, "authType is required");
            this.credentialsSecretArn = java.util.Objects.requireNonNull(builder.credentialsSecretArn, "credentialsSecretArn is required");
            this.domain = java.util.Objects.requireNonNull(builder.domain, "domain is required");
            this.hostType = java.util.Objects.requireNonNull(builder.hostType, "hostType is required");
            this.siteUrls = java.util.Objects.requireNonNull(builder.siteUrls, "siteUrls is required");
            this.tenantId = builder.tenantId;
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
        public final java.lang.String getDomain() {
            return this.domain;
        }

        @Override
        public final java.lang.String getHostType() {
            return this.hostType;
        }

        @Override
        public final java.util.List<java.lang.String> getSiteUrls() {
            return this.siteUrls;
        }

        @Override
        public final java.lang.String getTenantId() {
            return this.tenantId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("authType", om.valueToTree(this.getAuthType()));
            data.set("credentialsSecretArn", om.valueToTree(this.getCredentialsSecretArn()));
            data.set("domain", om.valueToTree(this.getDomain()));
            data.set("hostType", om.valueToTree(this.getHostType()));
            data.set("siteUrls", om.valueToTree(this.getSiteUrls()));
            if (this.getTenantId() != null) {
                data.set("tenantId", om.valueToTree(this.getTenantId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfiguration.Jsii$Proxy that = (BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfiguration.Jsii$Proxy) o;

            if (!authType.equals(that.authType)) return false;
            if (!credentialsSecretArn.equals(that.credentialsSecretArn)) return false;
            if (!domain.equals(that.domain)) return false;
            if (!hostType.equals(that.hostType)) return false;
            if (!siteUrls.equals(that.siteUrls)) return false;
            return this.tenantId != null ? this.tenantId.equals(that.tenantId) : that.tenantId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.authType.hashCode();
            result = 31 * result + (this.credentialsSecretArn.hashCode());
            result = 31 * result + (this.domain.hashCode());
            result = 31 * result + (this.hostType.hashCode());
            result = 31 * result + (this.siteUrls.hashCode());
            result = 31 * result + (this.tenantId != null ? this.tenantId.hashCode() : 0);
            return result;
        }
    }
}
