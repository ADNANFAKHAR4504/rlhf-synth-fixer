package imports.aws.cleanrooms_membership;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.216Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cleanroomsMembership.CleanroomsMembershipDefaultResultConfigurationOutputConfigurationS3")
@software.amazon.jsii.Jsii.Proxy(CleanroomsMembershipDefaultResultConfigurationOutputConfigurationS3.Jsii$Proxy.class)
public interface CleanroomsMembershipDefaultResultConfigurationOutputConfigurationS3 extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_membership#bucket CleanroomsMembership#bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucket();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_membership#result_format CleanroomsMembership#result_format}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResultFormat();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_membership#key_prefix CleanroomsMembership#key_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKeyPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CleanroomsMembershipDefaultResultConfigurationOutputConfigurationS3}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CleanroomsMembershipDefaultResultConfigurationOutputConfigurationS3}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CleanroomsMembershipDefaultResultConfigurationOutputConfigurationS3> {
        java.lang.String bucket;
        java.lang.String resultFormat;
        java.lang.String keyPrefix;

        /**
         * Sets the value of {@link CleanroomsMembershipDefaultResultConfigurationOutputConfigurationS3#getBucket}
         * @param bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_membership#bucket CleanroomsMembership#bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucket(java.lang.String bucket) {
            this.bucket = bucket;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsMembershipDefaultResultConfigurationOutputConfigurationS3#getResultFormat}
         * @param resultFormat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_membership#result_format CleanroomsMembership#result_format}. This parameter is required.
         * @return {@code this}
         */
        public Builder resultFormat(java.lang.String resultFormat) {
            this.resultFormat = resultFormat;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsMembershipDefaultResultConfigurationOutputConfigurationS3#getKeyPrefix}
         * @param keyPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_membership#key_prefix CleanroomsMembership#key_prefix}.
         * @return {@code this}
         */
        public Builder keyPrefix(java.lang.String keyPrefix) {
            this.keyPrefix = keyPrefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CleanroomsMembershipDefaultResultConfigurationOutputConfigurationS3}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CleanroomsMembershipDefaultResultConfigurationOutputConfigurationS3 build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CleanroomsMembershipDefaultResultConfigurationOutputConfigurationS3}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CleanroomsMembershipDefaultResultConfigurationOutputConfigurationS3 {
        private final java.lang.String bucket;
        private final java.lang.String resultFormat;
        private final java.lang.String keyPrefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucket = software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resultFormat = software.amazon.jsii.Kernel.get(this, "resultFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keyPrefix = software.amazon.jsii.Kernel.get(this, "keyPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucket = java.util.Objects.requireNonNull(builder.bucket, "bucket is required");
            this.resultFormat = java.util.Objects.requireNonNull(builder.resultFormat, "resultFormat is required");
            this.keyPrefix = builder.keyPrefix;
        }

        @Override
        public final java.lang.String getBucket() {
            return this.bucket;
        }

        @Override
        public final java.lang.String getResultFormat() {
            return this.resultFormat;
        }

        @Override
        public final java.lang.String getKeyPrefix() {
            return this.keyPrefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucket", om.valueToTree(this.getBucket()));
            data.set("resultFormat", om.valueToTree(this.getResultFormat()));
            if (this.getKeyPrefix() != null) {
                data.set("keyPrefix", om.valueToTree(this.getKeyPrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cleanroomsMembership.CleanroomsMembershipDefaultResultConfigurationOutputConfigurationS3"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CleanroomsMembershipDefaultResultConfigurationOutputConfigurationS3.Jsii$Proxy that = (CleanroomsMembershipDefaultResultConfigurationOutputConfigurationS3.Jsii$Proxy) o;

            if (!bucket.equals(that.bucket)) return false;
            if (!resultFormat.equals(that.resultFormat)) return false;
            return this.keyPrefix != null ? this.keyPrefix.equals(that.keyPrefix) : that.keyPrefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucket.hashCode();
            result = 31 * result + (this.resultFormat.hashCode());
            result = 31 * result + (this.keyPrefix != null ? this.keyPrefix.hashCode() : 0);
            return result;
        }
    }
}
