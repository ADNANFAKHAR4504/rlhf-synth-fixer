package imports.aws.s3_object;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.288Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3Object.S3ObjectOverrideProvider")
@software.amazon.jsii.Jsii.Proxy(S3ObjectOverrideProvider.Jsii$Proxy.class)
public interface S3ObjectOverrideProvider extends software.amazon.jsii.JsiiSerializable {

    /**
     * default_tags block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object#default_tags S3Object#default_tags}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_object.S3ObjectOverrideProviderDefaultTags getDefaultTags() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3ObjectOverrideProvider}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3ObjectOverrideProvider}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3ObjectOverrideProvider> {
        imports.aws.s3_object.S3ObjectOverrideProviderDefaultTags defaultTags;

        /**
         * Sets the value of {@link S3ObjectOverrideProvider#getDefaultTags}
         * @param defaultTags default_tags block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_object#default_tags S3Object#default_tags}
         * @return {@code this}
         */
        public Builder defaultTags(imports.aws.s3_object.S3ObjectOverrideProviderDefaultTags defaultTags) {
            this.defaultTags = defaultTags;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3ObjectOverrideProvider}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3ObjectOverrideProvider build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3ObjectOverrideProvider}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3ObjectOverrideProvider {
        private final imports.aws.s3_object.S3ObjectOverrideProviderDefaultTags defaultTags;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.defaultTags = software.amazon.jsii.Kernel.get(this, "defaultTags", software.amazon.jsii.NativeType.forClass(imports.aws.s3_object.S3ObjectOverrideProviderDefaultTags.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.defaultTags = builder.defaultTags;
        }

        @Override
        public final imports.aws.s3_object.S3ObjectOverrideProviderDefaultTags getDefaultTags() {
            return this.defaultTags;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDefaultTags() != null) {
                data.set("defaultTags", om.valueToTree(this.getDefaultTags()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3Object.S3ObjectOverrideProvider"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3ObjectOverrideProvider.Jsii$Proxy that = (S3ObjectOverrideProvider.Jsii$Proxy) o;

            return this.defaultTags != null ? this.defaultTags.equals(that.defaultTags) : that.defaultTags == null;
        }

        @Override
        public final int hashCode() {
            int result = this.defaultTags != null ? this.defaultTags.hashCode() : 0;
            return result;
        }
    }
}
