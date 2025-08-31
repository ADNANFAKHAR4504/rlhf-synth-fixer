package imports.aws.s3_bucket;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.247Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3Bucket.S3BucketReplicationConfiguration")
@software.amazon.jsii.Jsii.Proxy(S3BucketReplicationConfiguration.Jsii$Proxy.class)
public interface S3BucketReplicationConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#role S3Bucket#role}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRole();

    /**
     * rules block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#rules S3Bucket#rules}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getRules();

    /**
     * @return a {@link Builder} of {@link S3BucketReplicationConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketReplicationConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketReplicationConfiguration> {
        java.lang.String role;
        java.lang.Object rules;

        /**
         * Sets the value of {@link S3BucketReplicationConfiguration#getRole}
         * @param role Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#role S3Bucket#role}. This parameter is required.
         * @return {@code this}
         */
        public Builder role(java.lang.String role) {
            this.role = role;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfiguration#getRules}
         * @param rules rules block. This parameter is required.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#rules S3Bucket#rules}
         * @return {@code this}
         */
        public Builder rules(com.hashicorp.cdktf.IResolvable rules) {
            this.rules = rules;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfiguration#getRules}
         * @param rules rules block. This parameter is required.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket#rules S3Bucket#rules}
         * @return {@code this}
         */
        public Builder rules(java.util.List<? extends imports.aws.s3_bucket.S3BucketReplicationConfigurationRules> rules) {
            this.rules = rules;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketReplicationConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketReplicationConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketReplicationConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketReplicationConfiguration {
        private final java.lang.String role;
        private final java.lang.Object rules;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.role = software.amazon.jsii.Kernel.get(this, "role", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rules = software.amazon.jsii.Kernel.get(this, "rules", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.role = java.util.Objects.requireNonNull(builder.role, "role is required");
            this.rules = java.util.Objects.requireNonNull(builder.rules, "rules is required");
        }

        @Override
        public final java.lang.String getRole() {
            return this.role;
        }

        @Override
        public final java.lang.Object getRules() {
            return this.rules;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("role", om.valueToTree(this.getRole()));
            data.set("rules", om.valueToTree(this.getRules()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3Bucket.S3BucketReplicationConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketReplicationConfiguration.Jsii$Proxy that = (S3BucketReplicationConfiguration.Jsii$Proxy) o;

            if (!role.equals(that.role)) return false;
            return this.rules.equals(that.rules);
        }

        @Override
        public final int hashCode() {
            int result = this.role.hashCode();
            result = 31 * result + (this.rules.hashCode());
            return result;
        }
    }
}
