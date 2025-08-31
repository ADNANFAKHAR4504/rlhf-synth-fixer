package imports.aws.s3_object;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.288Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3Object.S3ObjectOverrideProviderDefaultTags")
@software.amazon.jsii.Jsii.Proxy(S3ObjectOverrideProviderDefaultTags.Jsii$Proxy.class)
public interface S3ObjectOverrideProviderDefaultTags extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object#tags S3Object#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3ObjectOverrideProviderDefaultTags}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3ObjectOverrideProviderDefaultTags}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3ObjectOverrideProviderDefaultTags> {
        java.util.Map<java.lang.String, java.lang.String> tags;

        /**
         * Sets the value of {@link S3ObjectOverrideProviderDefaultTags#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object#tags S3Object#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3ObjectOverrideProviderDefaultTags}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3ObjectOverrideProviderDefaultTags build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3ObjectOverrideProviderDefaultTags}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3ObjectOverrideProviderDefaultTags {
        private final java.util.Map<java.lang.String, java.lang.String> tags;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.tags = builder.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3Object.S3ObjectOverrideProviderDefaultTags"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3ObjectOverrideProviderDefaultTags.Jsii$Proxy that = (S3ObjectOverrideProviderDefaultTags.Jsii$Proxy) o;

            return this.tags != null ? this.tags.equals(that.tags) : that.tags == null;
        }

        @Override
        public final int hashCode() {
            int result = this.tags != null ? this.tags.hashCode() : 0;
            return result;
        }
    }
}
