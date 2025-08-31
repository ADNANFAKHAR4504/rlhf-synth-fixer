package imports.aws.s3_control_access_grant;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.274Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlAccessGrant.S3ControlAccessGrantGrantee")
@software.amazon.jsii.Jsii.Proxy(S3ControlAccessGrantGrantee.Jsii$Proxy.class)
public interface S3ControlAccessGrantGrantee extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#grantee_identifier S3ControlAccessGrant#grantee_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getGranteeIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#grantee_type S3ControlAccessGrant#grantee_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getGranteeType();

    /**
     * @return a {@link Builder} of {@link S3ControlAccessGrantGrantee}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3ControlAccessGrantGrantee}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3ControlAccessGrantGrantee> {
        java.lang.String granteeIdentifier;
        java.lang.String granteeType;

        /**
         * Sets the value of {@link S3ControlAccessGrantGrantee#getGranteeIdentifier}
         * @param granteeIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#grantee_identifier S3ControlAccessGrant#grantee_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder granteeIdentifier(java.lang.String granteeIdentifier) {
            this.granteeIdentifier = granteeIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlAccessGrantGrantee#getGranteeType}
         * @param granteeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#grantee_type S3ControlAccessGrant#grantee_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder granteeType(java.lang.String granteeType) {
            this.granteeType = granteeType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3ControlAccessGrantGrantee}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3ControlAccessGrantGrantee build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3ControlAccessGrantGrantee}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3ControlAccessGrantGrantee {
        private final java.lang.String granteeIdentifier;
        private final java.lang.String granteeType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.granteeIdentifier = software.amazon.jsii.Kernel.get(this, "granteeIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.granteeType = software.amazon.jsii.Kernel.get(this, "granteeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.granteeIdentifier = java.util.Objects.requireNonNull(builder.granteeIdentifier, "granteeIdentifier is required");
            this.granteeType = java.util.Objects.requireNonNull(builder.granteeType, "granteeType is required");
        }

        @Override
        public final java.lang.String getGranteeIdentifier() {
            return this.granteeIdentifier;
        }

        @Override
        public final java.lang.String getGranteeType() {
            return this.granteeType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("granteeIdentifier", om.valueToTree(this.getGranteeIdentifier()));
            data.set("granteeType", om.valueToTree(this.getGranteeType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3ControlAccessGrant.S3ControlAccessGrantGrantee"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3ControlAccessGrantGrantee.Jsii$Proxy that = (S3ControlAccessGrantGrantee.Jsii$Proxy) o;

            if (!granteeIdentifier.equals(that.granteeIdentifier)) return false;
            return this.granteeType.equals(that.granteeType);
        }

        @Override
        public final int hashCode() {
            int result = this.granteeIdentifier.hashCode();
            result = 31 * result + (this.granteeType.hashCode());
            return result;
        }
    }
}
