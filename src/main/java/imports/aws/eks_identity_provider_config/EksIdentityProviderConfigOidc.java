package imports.aws.eks_identity_provider_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.160Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksIdentityProviderConfig.EksIdentityProviderConfigOidc")
@software.amazon.jsii.Jsii.Proxy(EksIdentityProviderConfigOidc.Jsii$Proxy.class)
public interface EksIdentityProviderConfigOidc extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_identity_provider_config#client_id EksIdentityProviderConfig#client_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClientId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_identity_provider_config#identity_provider_config_name EksIdentityProviderConfig#identity_provider_config_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIdentityProviderConfigName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_identity_provider_config#issuer_url EksIdentityProviderConfig#issuer_url}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIssuerUrl();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_identity_provider_config#groups_claim EksIdentityProviderConfig#groups_claim}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGroupsClaim() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_identity_provider_config#groups_prefix EksIdentityProviderConfig#groups_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGroupsPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_identity_provider_config#required_claims EksIdentityProviderConfig#required_claims}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getRequiredClaims() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_identity_provider_config#username_claim EksIdentityProviderConfig#username_claim}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUsernameClaim() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_identity_provider_config#username_prefix EksIdentityProviderConfig#username_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUsernamePrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EksIdentityProviderConfigOidc}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EksIdentityProviderConfigOidc}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EksIdentityProviderConfigOidc> {
        java.lang.String clientId;
        java.lang.String identityProviderConfigName;
        java.lang.String issuerUrl;
        java.lang.String groupsClaim;
        java.lang.String groupsPrefix;
        java.util.Map<java.lang.String, java.lang.String> requiredClaims;
        java.lang.String usernameClaim;
        java.lang.String usernamePrefix;

        /**
         * Sets the value of {@link EksIdentityProviderConfigOidc#getClientId}
         * @param clientId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_identity_provider_config#client_id EksIdentityProviderConfig#client_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder clientId(java.lang.String clientId) {
            this.clientId = clientId;
            return this;
        }

        /**
         * Sets the value of {@link EksIdentityProviderConfigOidc#getIdentityProviderConfigName}
         * @param identityProviderConfigName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_identity_provider_config#identity_provider_config_name EksIdentityProviderConfig#identity_provider_config_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder identityProviderConfigName(java.lang.String identityProviderConfigName) {
            this.identityProviderConfigName = identityProviderConfigName;
            return this;
        }

        /**
         * Sets the value of {@link EksIdentityProviderConfigOidc#getIssuerUrl}
         * @param issuerUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_identity_provider_config#issuer_url EksIdentityProviderConfig#issuer_url}. This parameter is required.
         * @return {@code this}
         */
        public Builder issuerUrl(java.lang.String issuerUrl) {
            this.issuerUrl = issuerUrl;
            return this;
        }

        /**
         * Sets the value of {@link EksIdentityProviderConfigOidc#getGroupsClaim}
         * @param groupsClaim Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_identity_provider_config#groups_claim EksIdentityProviderConfig#groups_claim}.
         * @return {@code this}
         */
        public Builder groupsClaim(java.lang.String groupsClaim) {
            this.groupsClaim = groupsClaim;
            return this;
        }

        /**
         * Sets the value of {@link EksIdentityProviderConfigOidc#getGroupsPrefix}
         * @param groupsPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_identity_provider_config#groups_prefix EksIdentityProviderConfig#groups_prefix}.
         * @return {@code this}
         */
        public Builder groupsPrefix(java.lang.String groupsPrefix) {
            this.groupsPrefix = groupsPrefix;
            return this;
        }

        /**
         * Sets the value of {@link EksIdentityProviderConfigOidc#getRequiredClaims}
         * @param requiredClaims Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_identity_provider_config#required_claims EksIdentityProviderConfig#required_claims}.
         * @return {@code this}
         */
        public Builder requiredClaims(java.util.Map<java.lang.String, java.lang.String> requiredClaims) {
            this.requiredClaims = requiredClaims;
            return this;
        }

        /**
         * Sets the value of {@link EksIdentityProviderConfigOidc#getUsernameClaim}
         * @param usernameClaim Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_identity_provider_config#username_claim EksIdentityProviderConfig#username_claim}.
         * @return {@code this}
         */
        public Builder usernameClaim(java.lang.String usernameClaim) {
            this.usernameClaim = usernameClaim;
            return this;
        }

        /**
         * Sets the value of {@link EksIdentityProviderConfigOidc#getUsernamePrefix}
         * @param usernamePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_identity_provider_config#username_prefix EksIdentityProviderConfig#username_prefix}.
         * @return {@code this}
         */
        public Builder usernamePrefix(java.lang.String usernamePrefix) {
            this.usernamePrefix = usernamePrefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EksIdentityProviderConfigOidc}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EksIdentityProviderConfigOidc build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EksIdentityProviderConfigOidc}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EksIdentityProviderConfigOidc {
        private final java.lang.String clientId;
        private final java.lang.String identityProviderConfigName;
        private final java.lang.String issuerUrl;
        private final java.lang.String groupsClaim;
        private final java.lang.String groupsPrefix;
        private final java.util.Map<java.lang.String, java.lang.String> requiredClaims;
        private final java.lang.String usernameClaim;
        private final java.lang.String usernamePrefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.clientId = software.amazon.jsii.Kernel.get(this, "clientId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.identityProviderConfigName = software.amazon.jsii.Kernel.get(this, "identityProviderConfigName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.issuerUrl = software.amazon.jsii.Kernel.get(this, "issuerUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.groupsClaim = software.amazon.jsii.Kernel.get(this, "groupsClaim", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.groupsPrefix = software.amazon.jsii.Kernel.get(this, "groupsPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.requiredClaims = software.amazon.jsii.Kernel.get(this, "requiredClaims", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.usernameClaim = software.amazon.jsii.Kernel.get(this, "usernameClaim", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.usernamePrefix = software.amazon.jsii.Kernel.get(this, "usernamePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.clientId = java.util.Objects.requireNonNull(builder.clientId, "clientId is required");
            this.identityProviderConfigName = java.util.Objects.requireNonNull(builder.identityProviderConfigName, "identityProviderConfigName is required");
            this.issuerUrl = java.util.Objects.requireNonNull(builder.issuerUrl, "issuerUrl is required");
            this.groupsClaim = builder.groupsClaim;
            this.groupsPrefix = builder.groupsPrefix;
            this.requiredClaims = builder.requiredClaims;
            this.usernameClaim = builder.usernameClaim;
            this.usernamePrefix = builder.usernamePrefix;
        }

        @Override
        public final java.lang.String getClientId() {
            return this.clientId;
        }

        @Override
        public final java.lang.String getIdentityProviderConfigName() {
            return this.identityProviderConfigName;
        }

        @Override
        public final java.lang.String getIssuerUrl() {
            return this.issuerUrl;
        }

        @Override
        public final java.lang.String getGroupsClaim() {
            return this.groupsClaim;
        }

        @Override
        public final java.lang.String getGroupsPrefix() {
            return this.groupsPrefix;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getRequiredClaims() {
            return this.requiredClaims;
        }

        @Override
        public final java.lang.String getUsernameClaim() {
            return this.usernameClaim;
        }

        @Override
        public final java.lang.String getUsernamePrefix() {
            return this.usernamePrefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("clientId", om.valueToTree(this.getClientId()));
            data.set("identityProviderConfigName", om.valueToTree(this.getIdentityProviderConfigName()));
            data.set("issuerUrl", om.valueToTree(this.getIssuerUrl()));
            if (this.getGroupsClaim() != null) {
                data.set("groupsClaim", om.valueToTree(this.getGroupsClaim()));
            }
            if (this.getGroupsPrefix() != null) {
                data.set("groupsPrefix", om.valueToTree(this.getGroupsPrefix()));
            }
            if (this.getRequiredClaims() != null) {
                data.set("requiredClaims", om.valueToTree(this.getRequiredClaims()));
            }
            if (this.getUsernameClaim() != null) {
                data.set("usernameClaim", om.valueToTree(this.getUsernameClaim()));
            }
            if (this.getUsernamePrefix() != null) {
                data.set("usernamePrefix", om.valueToTree(this.getUsernamePrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.eksIdentityProviderConfig.EksIdentityProviderConfigOidc"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EksIdentityProviderConfigOidc.Jsii$Proxy that = (EksIdentityProviderConfigOidc.Jsii$Proxy) o;

            if (!clientId.equals(that.clientId)) return false;
            if (!identityProviderConfigName.equals(that.identityProviderConfigName)) return false;
            if (!issuerUrl.equals(that.issuerUrl)) return false;
            if (this.groupsClaim != null ? !this.groupsClaim.equals(that.groupsClaim) : that.groupsClaim != null) return false;
            if (this.groupsPrefix != null ? !this.groupsPrefix.equals(that.groupsPrefix) : that.groupsPrefix != null) return false;
            if (this.requiredClaims != null ? !this.requiredClaims.equals(that.requiredClaims) : that.requiredClaims != null) return false;
            if (this.usernameClaim != null ? !this.usernameClaim.equals(that.usernameClaim) : that.usernameClaim != null) return false;
            return this.usernamePrefix != null ? this.usernamePrefix.equals(that.usernamePrefix) : that.usernamePrefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.clientId.hashCode();
            result = 31 * result + (this.identityProviderConfigName.hashCode());
            result = 31 * result + (this.issuerUrl.hashCode());
            result = 31 * result + (this.groupsClaim != null ? this.groupsClaim.hashCode() : 0);
            result = 31 * result + (this.groupsPrefix != null ? this.groupsPrefix.hashCode() : 0);
            result = 31 * result + (this.requiredClaims != null ? this.requiredClaims.hashCode() : 0);
            result = 31 * result + (this.usernameClaim != null ? this.usernameClaim.hashCode() : 0);
            result = 31 * result + (this.usernamePrefix != null ? this.usernamePrefix.hashCode() : 0);
            return result;
        }
    }
}
