package imports.aws.kendra_index;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.435Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraIndex.KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration")
@software.amazon.jsii.Jsii.Proxy(KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration.Jsii$Proxy.class)
public interface KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#key_location KendraIndex#key_location}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKeyLocation();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#claim_regex KendraIndex#claim_regex}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClaimRegex() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#group_attribute_field KendraIndex#group_attribute_field}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGroupAttributeField() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#issuer KendraIndex#issuer}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIssuer() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#secrets_manager_arn KendraIndex#secrets_manager_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecretsManagerArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#url KendraIndex#url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUrl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#user_name_attribute_field KendraIndex#user_name_attribute_field}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserNameAttributeField() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration> {
        java.lang.String keyLocation;
        java.lang.String claimRegex;
        java.lang.String groupAttributeField;
        java.lang.String issuer;
        java.lang.String secretsManagerArn;
        java.lang.String url;
        java.lang.String userNameAttributeField;

        /**
         * Sets the value of {@link KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration#getKeyLocation}
         * @param keyLocation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#key_location KendraIndex#key_location}. This parameter is required.
         * @return {@code this}
         */
        public Builder keyLocation(java.lang.String keyLocation) {
            this.keyLocation = keyLocation;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration#getClaimRegex}
         * @param claimRegex Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#claim_regex KendraIndex#claim_regex}.
         * @return {@code this}
         */
        public Builder claimRegex(java.lang.String claimRegex) {
            this.claimRegex = claimRegex;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration#getGroupAttributeField}
         * @param groupAttributeField Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#group_attribute_field KendraIndex#group_attribute_field}.
         * @return {@code this}
         */
        public Builder groupAttributeField(java.lang.String groupAttributeField) {
            this.groupAttributeField = groupAttributeField;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration#getIssuer}
         * @param issuer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#issuer KendraIndex#issuer}.
         * @return {@code this}
         */
        public Builder issuer(java.lang.String issuer) {
            this.issuer = issuer;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration#getSecretsManagerArn}
         * @param secretsManagerArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#secrets_manager_arn KendraIndex#secrets_manager_arn}.
         * @return {@code this}
         */
        public Builder secretsManagerArn(java.lang.String secretsManagerArn) {
            this.secretsManagerArn = secretsManagerArn;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration#getUrl}
         * @param url Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#url KendraIndex#url}.
         * @return {@code this}
         */
        public Builder url(java.lang.String url) {
            this.url = url;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration#getUserNameAttributeField}
         * @param userNameAttributeField Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#user_name_attribute_field KendraIndex#user_name_attribute_field}.
         * @return {@code this}
         */
        public Builder userNameAttributeField(java.lang.String userNameAttributeField) {
            this.userNameAttributeField = userNameAttributeField;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration {
        private final java.lang.String keyLocation;
        private final java.lang.String claimRegex;
        private final java.lang.String groupAttributeField;
        private final java.lang.String issuer;
        private final java.lang.String secretsManagerArn;
        private final java.lang.String url;
        private final java.lang.String userNameAttributeField;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.keyLocation = software.amazon.jsii.Kernel.get(this, "keyLocation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.claimRegex = software.amazon.jsii.Kernel.get(this, "claimRegex", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.groupAttributeField = software.amazon.jsii.Kernel.get(this, "groupAttributeField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.issuer = software.amazon.jsii.Kernel.get(this, "issuer", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.secretsManagerArn = software.amazon.jsii.Kernel.get(this, "secretsManagerArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.url = software.amazon.jsii.Kernel.get(this, "url", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userNameAttributeField = software.amazon.jsii.Kernel.get(this, "userNameAttributeField", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.keyLocation = java.util.Objects.requireNonNull(builder.keyLocation, "keyLocation is required");
            this.claimRegex = builder.claimRegex;
            this.groupAttributeField = builder.groupAttributeField;
            this.issuer = builder.issuer;
            this.secretsManagerArn = builder.secretsManagerArn;
            this.url = builder.url;
            this.userNameAttributeField = builder.userNameAttributeField;
        }

        @Override
        public final java.lang.String getKeyLocation() {
            return this.keyLocation;
        }

        @Override
        public final java.lang.String getClaimRegex() {
            return this.claimRegex;
        }

        @Override
        public final java.lang.String getGroupAttributeField() {
            return this.groupAttributeField;
        }

        @Override
        public final java.lang.String getIssuer() {
            return this.issuer;
        }

        @Override
        public final java.lang.String getSecretsManagerArn() {
            return this.secretsManagerArn;
        }

        @Override
        public final java.lang.String getUrl() {
            return this.url;
        }

        @Override
        public final java.lang.String getUserNameAttributeField() {
            return this.userNameAttributeField;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("keyLocation", om.valueToTree(this.getKeyLocation()));
            if (this.getClaimRegex() != null) {
                data.set("claimRegex", om.valueToTree(this.getClaimRegex()));
            }
            if (this.getGroupAttributeField() != null) {
                data.set("groupAttributeField", om.valueToTree(this.getGroupAttributeField()));
            }
            if (this.getIssuer() != null) {
                data.set("issuer", om.valueToTree(this.getIssuer()));
            }
            if (this.getSecretsManagerArn() != null) {
                data.set("secretsManagerArn", om.valueToTree(this.getSecretsManagerArn()));
            }
            if (this.getUrl() != null) {
                data.set("url", om.valueToTree(this.getUrl()));
            }
            if (this.getUserNameAttributeField() != null) {
                data.set("userNameAttributeField", om.valueToTree(this.getUserNameAttributeField()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraIndex.KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration.Jsii$Proxy that = (KendraIndexUserTokenConfigurationsJwtTokenTypeConfiguration.Jsii$Proxy) o;

            if (!keyLocation.equals(that.keyLocation)) return false;
            if (this.claimRegex != null ? !this.claimRegex.equals(that.claimRegex) : that.claimRegex != null) return false;
            if (this.groupAttributeField != null ? !this.groupAttributeField.equals(that.groupAttributeField) : that.groupAttributeField != null) return false;
            if (this.issuer != null ? !this.issuer.equals(that.issuer) : that.issuer != null) return false;
            if (this.secretsManagerArn != null ? !this.secretsManagerArn.equals(that.secretsManagerArn) : that.secretsManagerArn != null) return false;
            if (this.url != null ? !this.url.equals(that.url) : that.url != null) return false;
            return this.userNameAttributeField != null ? this.userNameAttributeField.equals(that.userNameAttributeField) : that.userNameAttributeField == null;
        }

        @Override
        public final int hashCode() {
            int result = this.keyLocation.hashCode();
            result = 31 * result + (this.claimRegex != null ? this.claimRegex.hashCode() : 0);
            result = 31 * result + (this.groupAttributeField != null ? this.groupAttributeField.hashCode() : 0);
            result = 31 * result + (this.issuer != null ? this.issuer.hashCode() : 0);
            result = 31 * result + (this.secretsManagerArn != null ? this.secretsManagerArn.hashCode() : 0);
            result = 31 * result + (this.url != null ? this.url.hashCode() : 0);
            result = 31 * result + (this.userNameAttributeField != null ? this.userNameAttributeField.hashCode() : 0);
            return result;
        }
    }
}
