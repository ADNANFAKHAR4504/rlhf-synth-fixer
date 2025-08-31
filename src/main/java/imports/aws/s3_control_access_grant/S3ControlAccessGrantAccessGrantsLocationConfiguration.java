package imports.aws.s3_control_access_grant;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.274Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlAccessGrant.S3ControlAccessGrantAccessGrantsLocationConfiguration")
@software.amazon.jsii.Jsii.Proxy(S3ControlAccessGrantAccessGrantsLocationConfiguration.Jsii$Proxy.class)
public interface S3ControlAccessGrantAccessGrantsLocationConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#s3_sub_prefix S3ControlAccessGrant#s3_sub_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3SubPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3ControlAccessGrantAccessGrantsLocationConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3ControlAccessGrantAccessGrantsLocationConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3ControlAccessGrantAccessGrantsLocationConfiguration> {
        java.lang.String s3SubPrefix;

        /**
         * Sets the value of {@link S3ControlAccessGrantAccessGrantsLocationConfiguration#getS3SubPrefix}
         * @param s3SubPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#s3_sub_prefix S3ControlAccessGrant#s3_sub_prefix}.
         * @return {@code this}
         */
        public Builder s3SubPrefix(java.lang.String s3SubPrefix) {
            this.s3SubPrefix = s3SubPrefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3ControlAccessGrantAccessGrantsLocationConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3ControlAccessGrantAccessGrantsLocationConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3ControlAccessGrantAccessGrantsLocationConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3ControlAccessGrantAccessGrantsLocationConfiguration {
        private final java.lang.String s3SubPrefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3SubPrefix = software.amazon.jsii.Kernel.get(this, "s3SubPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3SubPrefix = builder.s3SubPrefix;
        }

        @Override
        public final java.lang.String getS3SubPrefix() {
            return this.s3SubPrefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getS3SubPrefix() != null) {
                data.set("s3SubPrefix", om.valueToTree(this.getS3SubPrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3ControlAccessGrant.S3ControlAccessGrantAccessGrantsLocationConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3ControlAccessGrantAccessGrantsLocationConfiguration.Jsii$Proxy that = (S3ControlAccessGrantAccessGrantsLocationConfiguration.Jsii$Proxy) o;

            return this.s3SubPrefix != null ? this.s3SubPrefix.equals(that.s3SubPrefix) : that.s3SubPrefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3SubPrefix != null ? this.s3SubPrefix.hashCode() : 0;
            return result;
        }
    }
}
