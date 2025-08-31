package imports.aws.elasticsearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.179Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticsearchDomain.ElasticsearchDomainAdvancedSecurityOptions")
@software.amazon.jsii.Jsii.Proxy(ElasticsearchDomainAdvancedSecurityOptions.Jsii$Proxy.class)
public interface ElasticsearchDomainAdvancedSecurityOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#enabled ElasticsearchDomain#enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#internal_user_database_enabled ElasticsearchDomain#internal_user_database_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInternalUserDatabaseEnabled() {
        return null;
    }

    /**
     * master_user_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#master_user_options ElasticsearchDomain#master_user_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptionsMasterUserOptions getMasterUserOptions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElasticsearchDomainAdvancedSecurityOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElasticsearchDomainAdvancedSecurityOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElasticsearchDomainAdvancedSecurityOptions> {
        java.lang.Object enabled;
        java.lang.Object internalUserDatabaseEnabled;
        imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptionsMasterUserOptions masterUserOptions;

        /**
         * Sets the value of {@link ElasticsearchDomainAdvancedSecurityOptions#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#enabled ElasticsearchDomain#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainAdvancedSecurityOptions#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#enabled ElasticsearchDomain#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainAdvancedSecurityOptions#getInternalUserDatabaseEnabled}
         * @param internalUserDatabaseEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#internal_user_database_enabled ElasticsearchDomain#internal_user_database_enabled}.
         * @return {@code this}
         */
        public Builder internalUserDatabaseEnabled(java.lang.Boolean internalUserDatabaseEnabled) {
            this.internalUserDatabaseEnabled = internalUserDatabaseEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainAdvancedSecurityOptions#getInternalUserDatabaseEnabled}
         * @param internalUserDatabaseEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#internal_user_database_enabled ElasticsearchDomain#internal_user_database_enabled}.
         * @return {@code this}
         */
        public Builder internalUserDatabaseEnabled(com.hashicorp.cdktf.IResolvable internalUserDatabaseEnabled) {
            this.internalUserDatabaseEnabled = internalUserDatabaseEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainAdvancedSecurityOptions#getMasterUserOptions}
         * @param masterUserOptions master_user_options block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#master_user_options ElasticsearchDomain#master_user_options}
         * @return {@code this}
         */
        public Builder masterUserOptions(imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptionsMasterUserOptions masterUserOptions) {
            this.masterUserOptions = masterUserOptions;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ElasticsearchDomainAdvancedSecurityOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElasticsearchDomainAdvancedSecurityOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElasticsearchDomainAdvancedSecurityOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElasticsearchDomainAdvancedSecurityOptions {
        private final java.lang.Object enabled;
        private final java.lang.Object internalUserDatabaseEnabled;
        private final imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptionsMasterUserOptions masterUserOptions;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.internalUserDatabaseEnabled = software.amazon.jsii.Kernel.get(this, "internalUserDatabaseEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.masterUserOptions = software.amazon.jsii.Kernel.get(this, "masterUserOptions", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptionsMasterUserOptions.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = java.util.Objects.requireNonNull(builder.enabled, "enabled is required");
            this.internalUserDatabaseEnabled = builder.internalUserDatabaseEnabled;
            this.masterUserOptions = builder.masterUserOptions;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.Object getInternalUserDatabaseEnabled() {
            return this.internalUserDatabaseEnabled;
        }

        @Override
        public final imports.aws.elasticsearch_domain.ElasticsearchDomainAdvancedSecurityOptionsMasterUserOptions getMasterUserOptions() {
            return this.masterUserOptions;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("enabled", om.valueToTree(this.getEnabled()));
            if (this.getInternalUserDatabaseEnabled() != null) {
                data.set("internalUserDatabaseEnabled", om.valueToTree(this.getInternalUserDatabaseEnabled()));
            }
            if (this.getMasterUserOptions() != null) {
                data.set("masterUserOptions", om.valueToTree(this.getMasterUserOptions()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.elasticsearchDomain.ElasticsearchDomainAdvancedSecurityOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElasticsearchDomainAdvancedSecurityOptions.Jsii$Proxy that = (ElasticsearchDomainAdvancedSecurityOptions.Jsii$Proxy) o;

            if (!enabled.equals(that.enabled)) return false;
            if (this.internalUserDatabaseEnabled != null ? !this.internalUserDatabaseEnabled.equals(that.internalUserDatabaseEnabled) : that.internalUserDatabaseEnabled != null) return false;
            return this.masterUserOptions != null ? this.masterUserOptions.equals(that.masterUserOptions) : that.masterUserOptions == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled.hashCode();
            result = 31 * result + (this.internalUserDatabaseEnabled != null ? this.internalUserDatabaseEnabled.hashCode() : 0);
            result = 31 * result + (this.masterUserOptions != null ? this.masterUserOptions.hashCode() : 0);
            return result;
        }
    }
}
