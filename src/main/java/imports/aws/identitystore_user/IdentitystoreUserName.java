package imports.aws.identitystore_user;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.347Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.identitystoreUser.IdentitystoreUserName")
@software.amazon.jsii.Jsii.Proxy(IdentitystoreUserName.Jsii$Proxy.class)
public interface IdentitystoreUserName extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#family_name IdentitystoreUser#family_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFamilyName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#given_name IdentitystoreUser#given_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getGivenName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#formatted IdentitystoreUser#formatted}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFormatted() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#honorific_prefix IdentitystoreUser#honorific_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHonorificPrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#honorific_suffix IdentitystoreUser#honorific_suffix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHonorificSuffix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#middle_name IdentitystoreUser#middle_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMiddleName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IdentitystoreUserName}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IdentitystoreUserName}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IdentitystoreUserName> {
        java.lang.String familyName;
        java.lang.String givenName;
        java.lang.String formatted;
        java.lang.String honorificPrefix;
        java.lang.String honorificSuffix;
        java.lang.String middleName;

        /**
         * Sets the value of {@link IdentitystoreUserName#getFamilyName}
         * @param familyName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#family_name IdentitystoreUser#family_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder familyName(java.lang.String familyName) {
            this.familyName = familyName;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserName#getGivenName}
         * @param givenName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#given_name IdentitystoreUser#given_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder givenName(java.lang.String givenName) {
            this.givenName = givenName;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserName#getFormatted}
         * @param formatted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#formatted IdentitystoreUser#formatted}.
         * @return {@code this}
         */
        public Builder formatted(java.lang.String formatted) {
            this.formatted = formatted;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserName#getHonorificPrefix}
         * @param honorificPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#honorific_prefix IdentitystoreUser#honorific_prefix}.
         * @return {@code this}
         */
        public Builder honorificPrefix(java.lang.String honorificPrefix) {
            this.honorificPrefix = honorificPrefix;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserName#getHonorificSuffix}
         * @param honorificSuffix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#honorific_suffix IdentitystoreUser#honorific_suffix}.
         * @return {@code this}
         */
        public Builder honorificSuffix(java.lang.String honorificSuffix) {
            this.honorificSuffix = honorificSuffix;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserName#getMiddleName}
         * @param middleName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#middle_name IdentitystoreUser#middle_name}.
         * @return {@code this}
         */
        public Builder middleName(java.lang.String middleName) {
            this.middleName = middleName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IdentitystoreUserName}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IdentitystoreUserName build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IdentitystoreUserName}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IdentitystoreUserName {
        private final java.lang.String familyName;
        private final java.lang.String givenName;
        private final java.lang.String formatted;
        private final java.lang.String honorificPrefix;
        private final java.lang.String honorificSuffix;
        private final java.lang.String middleName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.familyName = software.amazon.jsii.Kernel.get(this, "familyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.givenName = software.amazon.jsii.Kernel.get(this, "givenName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.formatted = software.amazon.jsii.Kernel.get(this, "formatted", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.honorificPrefix = software.amazon.jsii.Kernel.get(this, "honorificPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.honorificSuffix = software.amazon.jsii.Kernel.get(this, "honorificSuffix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.middleName = software.amazon.jsii.Kernel.get(this, "middleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.familyName = java.util.Objects.requireNonNull(builder.familyName, "familyName is required");
            this.givenName = java.util.Objects.requireNonNull(builder.givenName, "givenName is required");
            this.formatted = builder.formatted;
            this.honorificPrefix = builder.honorificPrefix;
            this.honorificSuffix = builder.honorificSuffix;
            this.middleName = builder.middleName;
        }

        @Override
        public final java.lang.String getFamilyName() {
            return this.familyName;
        }

        @Override
        public final java.lang.String getGivenName() {
            return this.givenName;
        }

        @Override
        public final java.lang.String getFormatted() {
            return this.formatted;
        }

        @Override
        public final java.lang.String getHonorificPrefix() {
            return this.honorificPrefix;
        }

        @Override
        public final java.lang.String getHonorificSuffix() {
            return this.honorificSuffix;
        }

        @Override
        public final java.lang.String getMiddleName() {
            return this.middleName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("familyName", om.valueToTree(this.getFamilyName()));
            data.set("givenName", om.valueToTree(this.getGivenName()));
            if (this.getFormatted() != null) {
                data.set("formatted", om.valueToTree(this.getFormatted()));
            }
            if (this.getHonorificPrefix() != null) {
                data.set("honorificPrefix", om.valueToTree(this.getHonorificPrefix()));
            }
            if (this.getHonorificSuffix() != null) {
                data.set("honorificSuffix", om.valueToTree(this.getHonorificSuffix()));
            }
            if (this.getMiddleName() != null) {
                data.set("middleName", om.valueToTree(this.getMiddleName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.identitystoreUser.IdentitystoreUserName"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IdentitystoreUserName.Jsii$Proxy that = (IdentitystoreUserName.Jsii$Proxy) o;

            if (!familyName.equals(that.familyName)) return false;
            if (!givenName.equals(that.givenName)) return false;
            if (this.formatted != null ? !this.formatted.equals(that.formatted) : that.formatted != null) return false;
            if (this.honorificPrefix != null ? !this.honorificPrefix.equals(that.honorificPrefix) : that.honorificPrefix != null) return false;
            if (this.honorificSuffix != null ? !this.honorificSuffix.equals(that.honorificSuffix) : that.honorificSuffix != null) return false;
            return this.middleName != null ? this.middleName.equals(that.middleName) : that.middleName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.familyName.hashCode();
            result = 31 * result + (this.givenName.hashCode());
            result = 31 * result + (this.formatted != null ? this.formatted.hashCode() : 0);
            result = 31 * result + (this.honorificPrefix != null ? this.honorificPrefix.hashCode() : 0);
            result = 31 * result + (this.honorificSuffix != null ? this.honorificSuffix.hashCode() : 0);
            result = 31 * result + (this.middleName != null ? this.middleName.hashCode() : 0);
            return result;
        }
    }
}
