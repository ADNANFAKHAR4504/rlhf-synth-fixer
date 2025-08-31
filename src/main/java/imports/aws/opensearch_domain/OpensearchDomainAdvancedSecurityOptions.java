package imports.aws.opensearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.988Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opensearchDomain.OpensearchDomainAdvancedSecurityOptions")
@software.amazon.jsii.Jsii.Proxy(OpensearchDomainAdvancedSecurityOptions.Jsii$Proxy.class)
public interface OpensearchDomainAdvancedSecurityOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#enabled OpensearchDomain#enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#anonymous_auth_enabled OpensearchDomain#anonymous_auth_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAnonymousAuthEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#internal_user_database_enabled OpensearchDomain#internal_user_database_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInternalUserDatabaseEnabled() {
        return null;
    }

    /**
     * master_user_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#master_user_options OpensearchDomain#master_user_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainAdvancedSecurityOptionsMasterUserOptions getMasterUserOptions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OpensearchDomainAdvancedSecurityOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OpensearchDomainAdvancedSecurityOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OpensearchDomainAdvancedSecurityOptions> {
        java.lang.Object enabled;
        java.lang.Object anonymousAuthEnabled;
        java.lang.Object internalUserDatabaseEnabled;
        imports.aws.opensearch_domain.OpensearchDomainAdvancedSecurityOptionsMasterUserOptions masterUserOptions;

        /**
         * Sets the value of {@link OpensearchDomainAdvancedSecurityOptions#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#enabled OpensearchDomain#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchDomainAdvancedSecurityOptions#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#enabled OpensearchDomain#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchDomainAdvancedSecurityOptions#getAnonymousAuthEnabled}
         * @param anonymousAuthEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#anonymous_auth_enabled OpensearchDomain#anonymous_auth_enabled}.
         * @return {@code this}
         */
        public Builder anonymousAuthEnabled(java.lang.Boolean anonymousAuthEnabled) {
            this.anonymousAuthEnabled = anonymousAuthEnabled;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchDomainAdvancedSecurityOptions#getAnonymousAuthEnabled}
         * @param anonymousAuthEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#anonymous_auth_enabled OpensearchDomain#anonymous_auth_enabled}.
         * @return {@code this}
         */
        public Builder anonymousAuthEnabled(com.hashicorp.cdktf.IResolvable anonymousAuthEnabled) {
            this.anonymousAuthEnabled = anonymousAuthEnabled;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchDomainAdvancedSecurityOptions#getInternalUserDatabaseEnabled}
         * @param internalUserDatabaseEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#internal_user_database_enabled OpensearchDomain#internal_user_database_enabled}.
         * @return {@code this}
         */
        public Builder internalUserDatabaseEnabled(java.lang.Boolean internalUserDatabaseEnabled) {
            this.internalUserDatabaseEnabled = internalUserDatabaseEnabled;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchDomainAdvancedSecurityOptions#getInternalUserDatabaseEnabled}
         * @param internalUserDatabaseEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#internal_user_database_enabled OpensearchDomain#internal_user_database_enabled}.
         * @return {@code this}
         */
        public Builder internalUserDatabaseEnabled(com.hashicorp.cdktf.IResolvable internalUserDatabaseEnabled) {
            this.internalUserDatabaseEnabled = internalUserDatabaseEnabled;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchDomainAdvancedSecurityOptions#getMasterUserOptions}
         * @param masterUserOptions master_user_options block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#master_user_options OpensearchDomain#master_user_options}
         * @return {@code this}
         */
        public Builder masterUserOptions(imports.aws.opensearch_domain.OpensearchDomainAdvancedSecurityOptionsMasterUserOptions masterUserOptions) {
            this.masterUserOptions = masterUserOptions;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OpensearchDomainAdvancedSecurityOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OpensearchDomainAdvancedSecurityOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OpensearchDomainAdvancedSecurityOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OpensearchDomainAdvancedSecurityOptions {
        private final java.lang.Object enabled;
        private final java.lang.Object anonymousAuthEnabled;
        private final java.lang.Object internalUserDatabaseEnabled;
        private final imports.aws.opensearch_domain.OpensearchDomainAdvancedSecurityOptionsMasterUserOptions masterUserOptions;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.anonymousAuthEnabled = software.amazon.jsii.Kernel.get(this, "anonymousAuthEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.internalUserDatabaseEnabled = software.amazon.jsii.Kernel.get(this, "internalUserDatabaseEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.masterUserOptions = software.amazon.jsii.Kernel.get(this, "masterUserOptions", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainAdvancedSecurityOptionsMasterUserOptions.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = java.util.Objects.requireNonNull(builder.enabled, "enabled is required");
            this.anonymousAuthEnabled = builder.anonymousAuthEnabled;
            this.internalUserDatabaseEnabled = builder.internalUserDatabaseEnabled;
            this.masterUserOptions = builder.masterUserOptions;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.Object getAnonymousAuthEnabled() {
            return this.anonymousAuthEnabled;
        }

        @Override
        public final java.lang.Object getInternalUserDatabaseEnabled() {
            return this.internalUserDatabaseEnabled;
        }

        @Override
        public final imports.aws.opensearch_domain.OpensearchDomainAdvancedSecurityOptionsMasterUserOptions getMasterUserOptions() {
            return this.masterUserOptions;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("enabled", om.valueToTree(this.getEnabled()));
            if (this.getAnonymousAuthEnabled() != null) {
                data.set("anonymousAuthEnabled", om.valueToTree(this.getAnonymousAuthEnabled()));
            }
            if (this.getInternalUserDatabaseEnabled() != null) {
                data.set("internalUserDatabaseEnabled", om.valueToTree(this.getInternalUserDatabaseEnabled()));
            }
            if (this.getMasterUserOptions() != null) {
                data.set("masterUserOptions", om.valueToTree(this.getMasterUserOptions()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.opensearchDomain.OpensearchDomainAdvancedSecurityOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OpensearchDomainAdvancedSecurityOptions.Jsii$Proxy that = (OpensearchDomainAdvancedSecurityOptions.Jsii$Proxy) o;

            if (!enabled.equals(that.enabled)) return false;
            if (this.anonymousAuthEnabled != null ? !this.anonymousAuthEnabled.equals(that.anonymousAuthEnabled) : that.anonymousAuthEnabled != null) return false;
            if (this.internalUserDatabaseEnabled != null ? !this.internalUserDatabaseEnabled.equals(that.internalUserDatabaseEnabled) : that.internalUserDatabaseEnabled != null) return false;
            return this.masterUserOptions != null ? this.masterUserOptions.equals(that.masterUserOptions) : that.masterUserOptions == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled.hashCode();
            result = 31 * result + (this.anonymousAuthEnabled != null ? this.anonymousAuthEnabled.hashCode() : 0);
            result = 31 * result + (this.internalUserDatabaseEnabled != null ? this.internalUserDatabaseEnabled.hashCode() : 0);
            result = 31 * result + (this.masterUserOptions != null ? this.masterUserOptions.hashCode() : 0);
            return result;
        }
    }
}
