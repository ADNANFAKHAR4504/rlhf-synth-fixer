package imports.aws.data_aws_identitystore_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.679Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsIdentitystoreGroup.DataAwsIdentitystoreGroupAlternateIdentifierExternalId")
@software.amazon.jsii.Jsii.Proxy(DataAwsIdentitystoreGroupAlternateIdentifierExternalId.Jsii$Proxy.class)
public interface DataAwsIdentitystoreGroupAlternateIdentifierExternalId extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_group#id DataAwsIdentitystoreGroup#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_group#issuer DataAwsIdentitystoreGroup#issuer}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIssuer();

    /**
     * @return a {@link Builder} of {@link DataAwsIdentitystoreGroupAlternateIdentifierExternalId}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsIdentitystoreGroupAlternateIdentifierExternalId}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsIdentitystoreGroupAlternateIdentifierExternalId> {
        java.lang.String id;
        java.lang.String issuer;

        /**
         * Sets the value of {@link DataAwsIdentitystoreGroupAlternateIdentifierExternalId#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_group#id DataAwsIdentitystoreGroup#id}. This parameter is required.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsIdentitystoreGroupAlternateIdentifierExternalId#getIssuer}
         * @param issuer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/identitystore_group#issuer DataAwsIdentitystoreGroup#issuer}. This parameter is required.
         * @return {@code this}
         */
        public Builder issuer(java.lang.String issuer) {
            this.issuer = issuer;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsIdentitystoreGroupAlternateIdentifierExternalId}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsIdentitystoreGroupAlternateIdentifierExternalId build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsIdentitystoreGroupAlternateIdentifierExternalId}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsIdentitystoreGroupAlternateIdentifierExternalId {
        private final java.lang.String id;
        private final java.lang.String issuer;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.issuer = software.amazon.jsii.Kernel.get(this, "issuer", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.id = java.util.Objects.requireNonNull(builder.id, "id is required");
            this.issuer = java.util.Objects.requireNonNull(builder.issuer, "issuer is required");
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getIssuer() {
            return this.issuer;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("id", om.valueToTree(this.getId()));
            data.set("issuer", om.valueToTree(this.getIssuer()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsIdentitystoreGroup.DataAwsIdentitystoreGroupAlternateIdentifierExternalId"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsIdentitystoreGroupAlternateIdentifierExternalId.Jsii$Proxy that = (DataAwsIdentitystoreGroupAlternateIdentifierExternalId.Jsii$Proxy) o;

            if (!id.equals(that.id)) return false;
            return this.issuer.equals(that.issuer);
        }

        @Override
        public final int hashCode() {
            int result = this.id.hashCode();
            result = 31 * result + (this.issuer.hashCode());
            return result;
        }
    }
}
