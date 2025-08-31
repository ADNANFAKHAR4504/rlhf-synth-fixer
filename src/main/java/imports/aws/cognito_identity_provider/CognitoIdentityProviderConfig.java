package imports.aws.cognito_identity_provider;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.344Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoIdentityProvider.CognitoIdentityProviderConfig")
@software.amazon.jsii.Jsii.Proxy(CognitoIdentityProviderConfig.Jsii$Proxy.class)
public interface CognitoIdentityProviderConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_provider#provider_details CognitoIdentityProvider#provider_details}.
     */
    @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getProviderDetails();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_provider#provider_name CognitoIdentityProvider#provider_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProviderName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_provider#provider_type CognitoIdentityProvider#provider_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProviderType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_provider#user_pool_id CognitoIdentityProvider#user_pool_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUserPoolId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_provider#attribute_mapping CognitoIdentityProvider#attribute_mapping}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getAttributeMapping() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_provider#id CognitoIdentityProvider#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_provider#idp_identifiers CognitoIdentityProvider#idp_identifiers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIdpIdentifiers() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoIdentityProviderConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoIdentityProviderConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoIdentityProviderConfig> {
        java.util.Map<java.lang.String, java.lang.String> providerDetails;
        java.lang.String providerName;
        java.lang.String providerType;
        java.lang.String userPoolId;
        java.util.Map<java.lang.String, java.lang.String> attributeMapping;
        java.lang.String id;
        java.util.List<java.lang.String> idpIdentifiers;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CognitoIdentityProviderConfig#getProviderDetails}
         * @param providerDetails Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_provider#provider_details CognitoIdentityProvider#provider_details}. This parameter is required.
         * @return {@code this}
         */
        public Builder providerDetails(java.util.Map<java.lang.String, java.lang.String> providerDetails) {
            this.providerDetails = providerDetails;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityProviderConfig#getProviderName}
         * @param providerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_provider#provider_name CognitoIdentityProvider#provider_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder providerName(java.lang.String providerName) {
            this.providerName = providerName;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityProviderConfig#getProviderType}
         * @param providerType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_provider#provider_type CognitoIdentityProvider#provider_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder providerType(java.lang.String providerType) {
            this.providerType = providerType;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityProviderConfig#getUserPoolId}
         * @param userPoolId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_provider#user_pool_id CognitoIdentityProvider#user_pool_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder userPoolId(java.lang.String userPoolId) {
            this.userPoolId = userPoolId;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityProviderConfig#getAttributeMapping}
         * @param attributeMapping Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_provider#attribute_mapping CognitoIdentityProvider#attribute_mapping}.
         * @return {@code this}
         */
        public Builder attributeMapping(java.util.Map<java.lang.String, java.lang.String> attributeMapping) {
            this.attributeMapping = attributeMapping;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityProviderConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_provider#id CognitoIdentityProvider#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityProviderConfig#getIdpIdentifiers}
         * @param idpIdentifiers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_provider#idp_identifiers CognitoIdentityProvider#idp_identifiers}.
         * @return {@code this}
         */
        public Builder idpIdentifiers(java.util.List<java.lang.String> idpIdentifiers) {
            this.idpIdentifiers = idpIdentifiers;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityProviderConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityProviderConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityProviderConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityProviderConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityProviderConfig#getDependsOn}
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
         * Sets the value of {@link CognitoIdentityProviderConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityProviderConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityProviderConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityProviderConfig#getProvisioners}
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
         * @return a new instance of {@link CognitoIdentityProviderConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoIdentityProviderConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoIdentityProviderConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoIdentityProviderConfig {
        private final java.util.Map<java.lang.String, java.lang.String> providerDetails;
        private final java.lang.String providerName;
        private final java.lang.String providerType;
        private final java.lang.String userPoolId;
        private final java.util.Map<java.lang.String, java.lang.String> attributeMapping;
        private final java.lang.String id;
        private final java.util.List<java.lang.String> idpIdentifiers;
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
            this.providerDetails = software.amazon.jsii.Kernel.get(this, "providerDetails", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.providerName = software.amazon.jsii.Kernel.get(this, "providerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.providerType = software.amazon.jsii.Kernel.get(this, "providerType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userPoolId = software.amazon.jsii.Kernel.get(this, "userPoolId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.attributeMapping = software.amazon.jsii.Kernel.get(this, "attributeMapping", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.idpIdentifiers = software.amazon.jsii.Kernel.get(this, "idpIdentifiers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.providerDetails = java.util.Objects.requireNonNull(builder.providerDetails, "providerDetails is required");
            this.providerName = java.util.Objects.requireNonNull(builder.providerName, "providerName is required");
            this.providerType = java.util.Objects.requireNonNull(builder.providerType, "providerType is required");
            this.userPoolId = java.util.Objects.requireNonNull(builder.userPoolId, "userPoolId is required");
            this.attributeMapping = builder.attributeMapping;
            this.id = builder.id;
            this.idpIdentifiers = builder.idpIdentifiers;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getProviderDetails() {
            return this.providerDetails;
        }

        @Override
        public final java.lang.String getProviderName() {
            return this.providerName;
        }

        @Override
        public final java.lang.String getProviderType() {
            return this.providerType;
        }

        @Override
        public final java.lang.String getUserPoolId() {
            return this.userPoolId;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getAttributeMapping() {
            return this.attributeMapping;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.util.List<java.lang.String> getIdpIdentifiers() {
            return this.idpIdentifiers;
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

            data.set("providerDetails", om.valueToTree(this.getProviderDetails()));
            data.set("providerName", om.valueToTree(this.getProviderName()));
            data.set("providerType", om.valueToTree(this.getProviderType()));
            data.set("userPoolId", om.valueToTree(this.getUserPoolId()));
            if (this.getAttributeMapping() != null) {
                data.set("attributeMapping", om.valueToTree(this.getAttributeMapping()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIdpIdentifiers() != null) {
                data.set("idpIdentifiers", om.valueToTree(this.getIdpIdentifiers()));
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
            struct.set("fqn", om.valueToTree("aws.cognitoIdentityProvider.CognitoIdentityProviderConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoIdentityProviderConfig.Jsii$Proxy that = (CognitoIdentityProviderConfig.Jsii$Proxy) o;

            if (!providerDetails.equals(that.providerDetails)) return false;
            if (!providerName.equals(that.providerName)) return false;
            if (!providerType.equals(that.providerType)) return false;
            if (!userPoolId.equals(that.userPoolId)) return false;
            if (this.attributeMapping != null ? !this.attributeMapping.equals(that.attributeMapping) : that.attributeMapping != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.idpIdentifiers != null ? !this.idpIdentifiers.equals(that.idpIdentifiers) : that.idpIdentifiers != null) return false;
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
            int result = this.providerDetails.hashCode();
            result = 31 * result + (this.providerName.hashCode());
            result = 31 * result + (this.providerType.hashCode());
            result = 31 * result + (this.userPoolId.hashCode());
            result = 31 * result + (this.attributeMapping != null ? this.attributeMapping.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.idpIdentifiers != null ? this.idpIdentifiers.hashCode() : 0);
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
