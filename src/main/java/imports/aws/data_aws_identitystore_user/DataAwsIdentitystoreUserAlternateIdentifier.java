package imports.aws.data_aws_identitystore_user;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.681Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsIdentitystoreUser.DataAwsIdentitystoreUserAlternateIdentifier")
@software.amazon.jsii.Jsii.Proxy(DataAwsIdentitystoreUserAlternateIdentifier.Jsii$Proxy.class)
public interface DataAwsIdentitystoreUserAlternateIdentifier extends software.amazon.jsii.JsiiSerializable {

    /**
     * external_id block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_user#external_id DataAwsIdentitystoreUser#external_id}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierExternalId getExternalId() {
        return null;
    }

    /**
     * unique_attribute block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_user#unique_attribute DataAwsIdentitystoreUser#unique_attribute}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierUniqueAttribute getUniqueAttribute() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsIdentitystoreUserAlternateIdentifier}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsIdentitystoreUserAlternateIdentifier}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsIdentitystoreUserAlternateIdentifier> {
        imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierExternalId externalId;
        imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierUniqueAttribute uniqueAttribute;

        /**
         * Sets the value of {@link DataAwsIdentitystoreUserAlternateIdentifier#getExternalId}
         * @param externalId external_id block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_user#external_id DataAwsIdentitystoreUser#external_id}
         * @return {@code this}
         */
        public Builder externalId(imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierExternalId externalId) {
            this.externalId = externalId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIdentitystoreUserAlternateIdentifier#getUniqueAttribute}
         * @param uniqueAttribute unique_attribute block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_user#unique_attribute DataAwsIdentitystoreUser#unique_attribute}
         * @return {@code this}
         */
        public Builder uniqueAttribute(imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierUniqueAttribute uniqueAttribute) {
            this.uniqueAttribute = uniqueAttribute;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsIdentitystoreUserAlternateIdentifier}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsIdentitystoreUserAlternateIdentifier build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsIdentitystoreUserAlternateIdentifier}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsIdentitystoreUserAlternateIdentifier {
        private final imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierExternalId externalId;
        private final imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierUniqueAttribute uniqueAttribute;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.externalId = software.amazon.jsii.Kernel.get(this, "externalId", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierExternalId.class));
            this.uniqueAttribute = software.amazon.jsii.Kernel.get(this, "uniqueAttribute", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierUniqueAttribute.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.externalId = builder.externalId;
            this.uniqueAttribute = builder.uniqueAttribute;
        }

        @Override
        public final imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierExternalId getExternalId() {
            return this.externalId;
        }

        @Override
        public final imports.aws.data_aws_identitystore_user.DataAwsIdentitystoreUserAlternateIdentifierUniqueAttribute getUniqueAttribute() {
            return this.uniqueAttribute;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getExternalId() != null) {
                data.set("externalId", om.valueToTree(this.getExternalId()));
            }
            if (this.getUniqueAttribute() != null) {
                data.set("uniqueAttribute", om.valueToTree(this.getUniqueAttribute()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsIdentitystoreUser.DataAwsIdentitystoreUserAlternateIdentifier"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsIdentitystoreUserAlternateIdentifier.Jsii$Proxy that = (DataAwsIdentitystoreUserAlternateIdentifier.Jsii$Proxy) o;

            if (this.externalId != null ? !this.externalId.equals(that.externalId) : that.externalId != null) return false;
            return this.uniqueAttribute != null ? this.uniqueAttribute.equals(that.uniqueAttribute) : that.uniqueAttribute == null;
        }

        @Override
        public final int hashCode() {
            int result = this.externalId != null ? this.externalId.hashCode() : 0;
            result = 31 * result + (this.uniqueAttribute != null ? this.uniqueAttribute.hashCode() : 0);
            return result;
        }
    }
}
