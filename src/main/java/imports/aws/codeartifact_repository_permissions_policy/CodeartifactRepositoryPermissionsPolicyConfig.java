package imports.aws.codeartifact_repository_permissions_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.297Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codeartifactRepositoryPermissionsPolicy.CodeartifactRepositoryPermissionsPolicyConfig")
@software.amazon.jsii.Jsii.Proxy(CodeartifactRepositoryPermissionsPolicyConfig.Jsii$Proxy.class)
public interface CodeartifactRepositoryPermissionsPolicyConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codeartifact_repository_permissions_policy#domain CodeartifactRepositoryPermissionsPolicy#domain}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDomain();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codeartifact_repository_permissions_policy#policy_document CodeartifactRepositoryPermissionsPolicy#policy_document}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPolicyDocument();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codeartifact_repository_permissions_policy#repository CodeartifactRepositoryPermissionsPolicy#repository}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRepository();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codeartifact_repository_permissions_policy#domain_owner CodeartifactRepositoryPermissionsPolicy#domain_owner}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDomainOwner() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codeartifact_repository_permissions_policy#id CodeartifactRepositoryPermissionsPolicy#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codeartifact_repository_permissions_policy#policy_revision CodeartifactRepositoryPermissionsPolicy#policy_revision}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPolicyRevision() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodeartifactRepositoryPermissionsPolicyConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodeartifactRepositoryPermissionsPolicyConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodeartifactRepositoryPermissionsPolicyConfig> {
        java.lang.String domain;
        java.lang.String policyDocument;
        java.lang.String repository;
        java.lang.String domainOwner;
        java.lang.String id;
        java.lang.String policyRevision;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CodeartifactRepositoryPermissionsPolicyConfig#getDomain}
         * @param domain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codeartifact_repository_permissions_policy#domain CodeartifactRepositoryPermissionsPolicy#domain}. This parameter is required.
         * @return {@code this}
         */
        public Builder domain(java.lang.String domain) {
            this.domain = domain;
            return this;
        }

        /**
         * Sets the value of {@link CodeartifactRepositoryPermissionsPolicyConfig#getPolicyDocument}
         * @param policyDocument Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codeartifact_repository_permissions_policy#policy_document CodeartifactRepositoryPermissionsPolicy#policy_document}. This parameter is required.
         * @return {@code this}
         */
        public Builder policyDocument(java.lang.String policyDocument) {
            this.policyDocument = policyDocument;
            return this;
        }

        /**
         * Sets the value of {@link CodeartifactRepositoryPermissionsPolicyConfig#getRepository}
         * @param repository Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codeartifact_repository_permissions_policy#repository CodeartifactRepositoryPermissionsPolicy#repository}. This parameter is required.
         * @return {@code this}
         */
        public Builder repository(java.lang.String repository) {
            this.repository = repository;
            return this;
        }

        /**
         * Sets the value of {@link CodeartifactRepositoryPermissionsPolicyConfig#getDomainOwner}
         * @param domainOwner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codeartifact_repository_permissions_policy#domain_owner CodeartifactRepositoryPermissionsPolicy#domain_owner}.
         * @return {@code this}
         */
        public Builder domainOwner(java.lang.String domainOwner) {
            this.domainOwner = domainOwner;
            return this;
        }

        /**
         * Sets the value of {@link CodeartifactRepositoryPermissionsPolicyConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codeartifact_repository_permissions_policy#id CodeartifactRepositoryPermissionsPolicy#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CodeartifactRepositoryPermissionsPolicyConfig#getPolicyRevision}
         * @param policyRevision Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codeartifact_repository_permissions_policy#policy_revision CodeartifactRepositoryPermissionsPolicy#policy_revision}.
         * @return {@code this}
         */
        public Builder policyRevision(java.lang.String policyRevision) {
            this.policyRevision = policyRevision;
            return this;
        }

        /**
         * Sets the value of {@link CodeartifactRepositoryPermissionsPolicyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CodeartifactRepositoryPermissionsPolicyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CodeartifactRepositoryPermissionsPolicyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CodeartifactRepositoryPermissionsPolicyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CodeartifactRepositoryPermissionsPolicyConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link CodeartifactRepositoryPermissionsPolicyConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CodeartifactRepositoryPermissionsPolicyConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CodeartifactRepositoryPermissionsPolicyConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CodeartifactRepositoryPermissionsPolicyConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodeartifactRepositoryPermissionsPolicyConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodeartifactRepositoryPermissionsPolicyConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodeartifactRepositoryPermissionsPolicyConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodeartifactRepositoryPermissionsPolicyConfig {
        private final java.lang.String domain;
        private final java.lang.String policyDocument;
        private final java.lang.String repository;
        private final java.lang.String domainOwner;
        private final java.lang.String id;
        private final java.lang.String policyRevision;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.domain = software.amazon.jsii.Kernel.get(this, "domain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.policyDocument = software.amazon.jsii.Kernel.get(this, "policyDocument", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.repository = software.amazon.jsii.Kernel.get(this, "repository", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domainOwner = software.amazon.jsii.Kernel.get(this, "domainOwner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.policyRevision = software.amazon.jsii.Kernel.get(this, "policyRevision", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.domain = java.util.Objects.requireNonNull(builder.domain, "domain is required");
            this.policyDocument = java.util.Objects.requireNonNull(builder.policyDocument, "policyDocument is required");
            this.repository = java.util.Objects.requireNonNull(builder.repository, "repository is required");
            this.domainOwner = builder.domainOwner;
            this.id = builder.id;
            this.policyRevision = builder.policyRevision;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDomain() {
            return this.domain;
        }

        @Override
        public final java.lang.String getPolicyDocument() {
            return this.policyDocument;
        }

        @Override
        public final java.lang.String getRepository() {
            return this.repository;
        }

        @Override
        public final java.lang.String getDomainOwner() {
            return this.domainOwner;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getPolicyRevision() {
            return this.policyRevision;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("domain", om.valueToTree(this.getDomain()));
            data.set("policyDocument", om.valueToTree(this.getPolicyDocument()));
            data.set("repository", om.valueToTree(this.getRepository()));
            if (this.getDomainOwner() != null) {
                data.set("domainOwner", om.valueToTree(this.getDomainOwner()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getPolicyRevision() != null) {
                data.set("policyRevision", om.valueToTree(this.getPolicyRevision()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codeartifactRepositoryPermissionsPolicy.CodeartifactRepositoryPermissionsPolicyConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodeartifactRepositoryPermissionsPolicyConfig.Jsii$Proxy that = (CodeartifactRepositoryPermissionsPolicyConfig.Jsii$Proxy) o;

            if (!domain.equals(that.domain)) return false;
            if (!policyDocument.equals(that.policyDocument)) return false;
            if (!repository.equals(that.repository)) return false;
            if (this.domainOwner != null ? !this.domainOwner.equals(that.domainOwner) : that.domainOwner != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.policyRevision != null ? !this.policyRevision.equals(that.policyRevision) : that.policyRevision != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.domain.hashCode();
            result = 31 * result + (this.policyDocument.hashCode());
            result = 31 * result + (this.repository.hashCode());
            result = 31 * result + (this.domainOwner != null ? this.domainOwner.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.policyRevision != null ? this.policyRevision.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
