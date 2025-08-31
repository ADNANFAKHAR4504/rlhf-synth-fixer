package imports.aws.elasticsearch_domain_saml_options;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.186Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticsearchDomainSamlOptions.ElasticsearchDomainSamlOptionsSamlOptions")
@software.amazon.jsii.Jsii.Proxy(ElasticsearchDomainSamlOptionsSamlOptions.Jsii$Proxy.class)
public interface ElasticsearchDomainSamlOptionsSamlOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain_saml_options#enabled ElasticsearchDomainSamlOptions#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * idp block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain_saml_options#idp ElasticsearchDomainSamlOptions#idp}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain_saml_options.ElasticsearchDomainSamlOptionsSamlOptionsIdp getIdp() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain_saml_options#master_backend_role ElasticsearchDomainSamlOptions#master_backend_role}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMasterBackendRole() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain_saml_options#master_user_name ElasticsearchDomainSamlOptions#master_user_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMasterUserName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain_saml_options#roles_key ElasticsearchDomainSamlOptions#roles_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRolesKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain_saml_options#session_timeout_minutes ElasticsearchDomainSamlOptions#session_timeout_minutes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSessionTimeoutMinutes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain_saml_options#subject_key ElasticsearchDomainSamlOptions#subject_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubjectKey() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElasticsearchDomainSamlOptionsSamlOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElasticsearchDomainSamlOptionsSamlOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElasticsearchDomainSamlOptionsSamlOptions> {
        java.lang.Object enabled;
        imports.aws.elasticsearch_domain_saml_options.ElasticsearchDomainSamlOptionsSamlOptionsIdp idp;
        java.lang.String masterBackendRole;
        java.lang.String masterUserName;
        java.lang.String rolesKey;
        java.lang.Number sessionTimeoutMinutes;
        java.lang.String subjectKey;

        /**
         * Sets the value of {@link ElasticsearchDomainSamlOptionsSamlOptions#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain_saml_options#enabled ElasticsearchDomainSamlOptions#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainSamlOptionsSamlOptions#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain_saml_options#enabled ElasticsearchDomainSamlOptions#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainSamlOptionsSamlOptions#getIdp}
         * @param idp idp block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain_saml_options#idp ElasticsearchDomainSamlOptions#idp}
         * @return {@code this}
         */
        public Builder idp(imports.aws.elasticsearch_domain_saml_options.ElasticsearchDomainSamlOptionsSamlOptionsIdp idp) {
            this.idp = idp;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainSamlOptionsSamlOptions#getMasterBackendRole}
         * @param masterBackendRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain_saml_options#master_backend_role ElasticsearchDomainSamlOptions#master_backend_role}.
         * @return {@code this}
         */
        public Builder masterBackendRole(java.lang.String masterBackendRole) {
            this.masterBackendRole = masterBackendRole;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainSamlOptionsSamlOptions#getMasterUserName}
         * @param masterUserName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain_saml_options#master_user_name ElasticsearchDomainSamlOptions#master_user_name}.
         * @return {@code this}
         */
        public Builder masterUserName(java.lang.String masterUserName) {
            this.masterUserName = masterUserName;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainSamlOptionsSamlOptions#getRolesKey}
         * @param rolesKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain_saml_options#roles_key ElasticsearchDomainSamlOptions#roles_key}.
         * @return {@code this}
         */
        public Builder rolesKey(java.lang.String rolesKey) {
            this.rolesKey = rolesKey;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainSamlOptionsSamlOptions#getSessionTimeoutMinutes}
         * @param sessionTimeoutMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain_saml_options#session_timeout_minutes ElasticsearchDomainSamlOptions#session_timeout_minutes}.
         * @return {@code this}
         */
        public Builder sessionTimeoutMinutes(java.lang.Number sessionTimeoutMinutes) {
            this.sessionTimeoutMinutes = sessionTimeoutMinutes;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainSamlOptionsSamlOptions#getSubjectKey}
         * @param subjectKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain_saml_options#subject_key ElasticsearchDomainSamlOptions#subject_key}.
         * @return {@code this}
         */
        public Builder subjectKey(java.lang.String subjectKey) {
            this.subjectKey = subjectKey;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ElasticsearchDomainSamlOptionsSamlOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElasticsearchDomainSamlOptionsSamlOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElasticsearchDomainSamlOptionsSamlOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElasticsearchDomainSamlOptionsSamlOptions {
        private final java.lang.Object enabled;
        private final imports.aws.elasticsearch_domain_saml_options.ElasticsearchDomainSamlOptionsSamlOptionsIdp idp;
        private final java.lang.String masterBackendRole;
        private final java.lang.String masterUserName;
        private final java.lang.String rolesKey;
        private final java.lang.Number sessionTimeoutMinutes;
        private final java.lang.String subjectKey;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.idp = software.amazon.jsii.Kernel.get(this, "idp", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain_saml_options.ElasticsearchDomainSamlOptionsSamlOptionsIdp.class));
            this.masterBackendRole = software.amazon.jsii.Kernel.get(this, "masterBackendRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.masterUserName = software.amazon.jsii.Kernel.get(this, "masterUserName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rolesKey = software.amazon.jsii.Kernel.get(this, "rolesKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sessionTimeoutMinutes = software.amazon.jsii.Kernel.get(this, "sessionTimeoutMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.subjectKey = software.amazon.jsii.Kernel.get(this, "subjectKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = builder.enabled;
            this.idp = builder.idp;
            this.masterBackendRole = builder.masterBackendRole;
            this.masterUserName = builder.masterUserName;
            this.rolesKey = builder.rolesKey;
            this.sessionTimeoutMinutes = builder.sessionTimeoutMinutes;
            this.subjectKey = builder.subjectKey;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final imports.aws.elasticsearch_domain_saml_options.ElasticsearchDomainSamlOptionsSamlOptionsIdp getIdp() {
            return this.idp;
        }

        @Override
        public final java.lang.String getMasterBackendRole() {
            return this.masterBackendRole;
        }

        @Override
        public final java.lang.String getMasterUserName() {
            return this.masterUserName;
        }

        @Override
        public final java.lang.String getRolesKey() {
            return this.rolesKey;
        }

        @Override
        public final java.lang.Number getSessionTimeoutMinutes() {
            return this.sessionTimeoutMinutes;
        }

        @Override
        public final java.lang.String getSubjectKey() {
            return this.subjectKey;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }
            if (this.getIdp() != null) {
                data.set("idp", om.valueToTree(this.getIdp()));
            }
            if (this.getMasterBackendRole() != null) {
                data.set("masterBackendRole", om.valueToTree(this.getMasterBackendRole()));
            }
            if (this.getMasterUserName() != null) {
                data.set("masterUserName", om.valueToTree(this.getMasterUserName()));
            }
            if (this.getRolesKey() != null) {
                data.set("rolesKey", om.valueToTree(this.getRolesKey()));
            }
            if (this.getSessionTimeoutMinutes() != null) {
                data.set("sessionTimeoutMinutes", om.valueToTree(this.getSessionTimeoutMinutes()));
            }
            if (this.getSubjectKey() != null) {
                data.set("subjectKey", om.valueToTree(this.getSubjectKey()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.elasticsearchDomainSamlOptions.ElasticsearchDomainSamlOptionsSamlOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElasticsearchDomainSamlOptionsSamlOptions.Jsii$Proxy that = (ElasticsearchDomainSamlOptionsSamlOptions.Jsii$Proxy) o;

            if (this.enabled != null ? !this.enabled.equals(that.enabled) : that.enabled != null) return false;
            if (this.idp != null ? !this.idp.equals(that.idp) : that.idp != null) return false;
            if (this.masterBackendRole != null ? !this.masterBackendRole.equals(that.masterBackendRole) : that.masterBackendRole != null) return false;
            if (this.masterUserName != null ? !this.masterUserName.equals(that.masterUserName) : that.masterUserName != null) return false;
            if (this.rolesKey != null ? !this.rolesKey.equals(that.rolesKey) : that.rolesKey != null) return false;
            if (this.sessionTimeoutMinutes != null ? !this.sessionTimeoutMinutes.equals(that.sessionTimeoutMinutes) : that.sessionTimeoutMinutes != null) return false;
            return this.subjectKey != null ? this.subjectKey.equals(that.subjectKey) : that.subjectKey == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled != null ? this.enabled.hashCode() : 0;
            result = 31 * result + (this.idp != null ? this.idp.hashCode() : 0);
            result = 31 * result + (this.masterBackendRole != null ? this.masterBackendRole.hashCode() : 0);
            result = 31 * result + (this.masterUserName != null ? this.masterUserName.hashCode() : 0);
            result = 31 * result + (this.rolesKey != null ? this.rolesKey.hashCode() : 0);
            result = 31 * result + (this.sessionTimeoutMinutes != null ? this.sessionTimeoutMinutes.hashCode() : 0);
            result = 31 * result + (this.subjectKey != null ? this.subjectKey.hashCode() : 0);
            return result;
        }
    }
}
