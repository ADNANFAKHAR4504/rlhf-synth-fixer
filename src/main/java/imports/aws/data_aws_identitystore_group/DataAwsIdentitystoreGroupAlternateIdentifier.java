package imports.aws.data_aws_identitystore_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.679Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsIdentitystoreGroup.DataAwsIdentitystoreGroupAlternateIdentifier")
@software.amazon.jsii.Jsii.Proxy(DataAwsIdentitystoreGroupAlternateIdentifier.Jsii$Proxy.class)
public interface DataAwsIdentitystoreGroupAlternateIdentifier extends software.amazon.jsii.JsiiSerializable {

    /**
     * external_id block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_group#external_id DataAwsIdentitystoreGroup#external_id}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierExternalId getExternalId() {
        return null;
    }

    /**
     * unique_attribute block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_group#unique_attribute DataAwsIdentitystoreGroup#unique_attribute}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute getUniqueAttribute() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsIdentitystoreGroupAlternateIdentifier}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsIdentitystoreGroupAlternateIdentifier}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsIdentitystoreGroupAlternateIdentifier> {
        imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierExternalId externalId;
        imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute uniqueAttribute;

        /**
         * Sets the value of {@link DataAwsIdentitystoreGroupAlternateIdentifier#getExternalId}
         * @param externalId external_id block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_group#external_id DataAwsIdentitystoreGroup#external_id}
         * @return {@code this}
         */
        public Builder externalId(imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierExternalId externalId) {
            this.externalId = externalId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIdentitystoreGroupAlternateIdentifier#getUniqueAttribute}
         * @param uniqueAttribute unique_attribute block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_group#unique_attribute DataAwsIdentitystoreGroup#unique_attribute}
         * @return {@code this}
         */
        public Builder uniqueAttribute(imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute uniqueAttribute) {
            this.uniqueAttribute = uniqueAttribute;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsIdentitystoreGroupAlternateIdentifier}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsIdentitystoreGroupAlternateIdentifier build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsIdentitystoreGroupAlternateIdentifier}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsIdentitystoreGroupAlternateIdentifier {
        private final imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierExternalId externalId;
        private final imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute uniqueAttribute;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.externalId = software.amazon.jsii.Kernel.get(this, "externalId", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierExternalId.class));
            this.uniqueAttribute = software.amazon.jsii.Kernel.get(this, "uniqueAttribute", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute.class));
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
        public final imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierExternalId getExternalId() {
            return this.externalId;
        }

        @Override
        public final imports.aws.data_aws_identitystore_group.DataAwsIdentitystoreGroupAlternateIdentifierUniqueAttribute getUniqueAttribute() {
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
            struct.set("fqn", om.valueToTree("aws.dataAwsIdentitystoreGroup.DataAwsIdentitystoreGroupAlternateIdentifier"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsIdentitystoreGroupAlternateIdentifier.Jsii$Proxy that = (DataAwsIdentitystoreGroupAlternateIdentifier.Jsii$Proxy) o;

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
