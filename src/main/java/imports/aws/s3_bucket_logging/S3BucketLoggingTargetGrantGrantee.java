package imports.aws.s3_bucket_logging;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.258Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketLogging.S3BucketLoggingTargetGrantGrantee")
@software.amazon.jsii.Jsii.Proxy(S3BucketLoggingTargetGrantGrantee.Jsii$Proxy.class)
public interface S3BucketLoggingTargetGrantGrantee extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_logging#type S3BucketLoggingA#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_logging#email_address S3BucketLoggingA#email_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEmailAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_logging#id S3BucketLoggingA#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_logging#uri S3BucketLoggingA#uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUri() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketLoggingTargetGrantGrantee}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketLoggingTargetGrantGrantee}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketLoggingTargetGrantGrantee> {
        java.lang.String type;
        java.lang.String emailAddress;
        java.lang.String id;
        java.lang.String uri;

        /**
         * Sets the value of {@link S3BucketLoggingTargetGrantGrantee#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_logging#type S3BucketLoggingA#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLoggingTargetGrantGrantee#getEmailAddress}
         * @param emailAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_logging#email_address S3BucketLoggingA#email_address}.
         * @return {@code this}
         */
        public Builder emailAddress(java.lang.String emailAddress) {
            this.emailAddress = emailAddress;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLoggingTargetGrantGrantee#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_logging#id S3BucketLoggingA#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketLoggingTargetGrantGrantee#getUri}
         * @param uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_logging#uri S3BucketLoggingA#uri}.
         * @return {@code this}
         */
        public Builder uri(java.lang.String uri) {
            this.uri = uri;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketLoggingTargetGrantGrantee}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketLoggingTargetGrantGrantee build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketLoggingTargetGrantGrantee}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketLoggingTargetGrantGrantee {
        private final java.lang.String type;
        private final java.lang.String emailAddress;
        private final java.lang.String id;
        private final java.lang.String uri;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.emailAddress = software.amazon.jsii.Kernel.get(this, "emailAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.uri = software.amazon.jsii.Kernel.get(this, "uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.emailAddress = builder.emailAddress;
            this.id = builder.id;
            this.uri = builder.uri;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getEmailAddress() {
            return this.emailAddress;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getUri() {
            return this.uri;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getEmailAddress() != null) {
                data.set("emailAddress", om.valueToTree(this.getEmailAddress()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getUri() != null) {
                data.set("uri", om.valueToTree(this.getUri()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketLogging.S3BucketLoggingTargetGrantGrantee"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketLoggingTargetGrantGrantee.Jsii$Proxy that = (S3BucketLoggingTargetGrantGrantee.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            if (this.emailAddress != null ? !this.emailAddress.equals(that.emailAddress) : that.emailAddress != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            return this.uri != null ? this.uri.equals(that.uri) : that.uri == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.emailAddress != null ? this.emailAddress.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.uri != null ? this.uri.hashCode() : 0);
            return result;
        }
    }
}
