package imports.aws.api_gateway_domain_name_access_association;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.946Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayDomainNameAccessAssociation.ApiGatewayDomainNameAccessAssociationConfig")
@software.amazon.jsii.Jsii.Proxy(ApiGatewayDomainNameAccessAssociationConfig.Jsii$Proxy.class)
public interface ApiGatewayDomainNameAccessAssociationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name_access_association#access_association_source ApiGatewayDomainNameAccessAssociation#access_association_source}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAccessAssociationSource();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name_access_association#access_association_source_type ApiGatewayDomainNameAccessAssociation#access_association_source_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAccessAssociationSourceType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name_access_association#domain_name_arn ApiGatewayDomainNameAccessAssociation#domain_name_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDomainNameArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name_access_association#tags ApiGatewayDomainNameAccessAssociation#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApiGatewayDomainNameAccessAssociationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApiGatewayDomainNameAccessAssociationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApiGatewayDomainNameAccessAssociationConfig> {
        java.lang.String accessAssociationSource;
        java.lang.String accessAssociationSourceType;
        java.lang.String domainNameArn;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ApiGatewayDomainNameAccessAssociationConfig#getAccessAssociationSource}
         * @param accessAssociationSource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name_access_association#access_association_source ApiGatewayDomainNameAccessAssociation#access_association_source}. This parameter is required.
         * @return {@code this}
         */
        public Builder accessAssociationSource(java.lang.String accessAssociationSource) {
            this.accessAssociationSource = accessAssociationSource;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameAccessAssociationConfig#getAccessAssociationSourceType}
         * @param accessAssociationSourceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name_access_association#access_association_source_type ApiGatewayDomainNameAccessAssociation#access_association_source_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder accessAssociationSourceType(java.lang.String accessAssociationSourceType) {
            this.accessAssociationSourceType = accessAssociationSourceType;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameAccessAssociationConfig#getDomainNameArn}
         * @param domainNameArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name_access_association#domain_name_arn ApiGatewayDomainNameAccessAssociation#domain_name_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder domainNameArn(java.lang.String domainNameArn) {
            this.domainNameArn = domainNameArn;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameAccessAssociationConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_domain_name_access_association#tags ApiGatewayDomainNameAccessAssociation#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameAccessAssociationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameAccessAssociationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameAccessAssociationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameAccessAssociationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameAccessAssociationConfig#getDependsOn}
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
         * Sets the value of {@link ApiGatewayDomainNameAccessAssociationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameAccessAssociationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameAccessAssociationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayDomainNameAccessAssociationConfig#getProvisioners}
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
         * @return a new instance of {@link ApiGatewayDomainNameAccessAssociationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApiGatewayDomainNameAccessAssociationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApiGatewayDomainNameAccessAssociationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApiGatewayDomainNameAccessAssociationConfig {
        private final java.lang.String accessAssociationSource;
        private final java.lang.String accessAssociationSourceType;
        private final java.lang.String domainNameArn;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
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
            this.accessAssociationSource = software.amazon.jsii.Kernel.get(this, "accessAssociationSource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accessAssociationSourceType = software.amazon.jsii.Kernel.get(this, "accessAssociationSourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domainNameArn = software.amazon.jsii.Kernel.get(this, "domainNameArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.accessAssociationSource = java.util.Objects.requireNonNull(builder.accessAssociationSource, "accessAssociationSource is required");
            this.accessAssociationSourceType = java.util.Objects.requireNonNull(builder.accessAssociationSourceType, "accessAssociationSourceType is required");
            this.domainNameArn = java.util.Objects.requireNonNull(builder.domainNameArn, "domainNameArn is required");
            this.tags = builder.tags;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAccessAssociationSource() {
            return this.accessAssociationSource;
        }

        @Override
        public final java.lang.String getAccessAssociationSourceType() {
            return this.accessAssociationSourceType;
        }

        @Override
        public final java.lang.String getDomainNameArn() {
            return this.domainNameArn;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
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

            data.set("accessAssociationSource", om.valueToTree(this.getAccessAssociationSource()));
            data.set("accessAssociationSourceType", om.valueToTree(this.getAccessAssociationSourceType()));
            data.set("domainNameArn", om.valueToTree(this.getDomainNameArn()));
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
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
            struct.set("fqn", om.valueToTree("aws.apiGatewayDomainNameAccessAssociation.ApiGatewayDomainNameAccessAssociationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApiGatewayDomainNameAccessAssociationConfig.Jsii$Proxy that = (ApiGatewayDomainNameAccessAssociationConfig.Jsii$Proxy) o;

            if (!accessAssociationSource.equals(that.accessAssociationSource)) return false;
            if (!accessAssociationSourceType.equals(that.accessAssociationSourceType)) return false;
            if (!domainNameArn.equals(that.domainNameArn)) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
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
            int result = this.accessAssociationSource.hashCode();
            result = 31 * result + (this.accessAssociationSourceType.hashCode());
            result = 31 * result + (this.domainNameArn.hashCode());
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
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
