package imports.aws.elastictranscoder_pipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.188Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elastictranscoderPipeline.ElastictranscoderPipelineThumbnailConfigPermissions")
@software.amazon.jsii.Jsii.Proxy(ElastictranscoderPipelineThumbnailConfigPermissions.Jsii$Proxy.class)
public interface ElastictranscoderPipelineThumbnailConfigPermissions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#access ElastictranscoderPipeline#access}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAccess() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#grantee ElastictranscoderPipeline#grantee}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGrantee() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#grantee_type ElastictranscoderPipeline#grantee_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGranteeType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElastictranscoderPipelineThumbnailConfigPermissions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElastictranscoderPipelineThumbnailConfigPermissions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElastictranscoderPipelineThumbnailConfigPermissions> {
        java.util.List<java.lang.String> access;
        java.lang.String grantee;
        java.lang.String granteeType;

        /**
         * Sets the value of {@link ElastictranscoderPipelineThumbnailConfigPermissions#getAccess}
         * @param access Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#access ElastictranscoderPipeline#access}.
         * @return {@code this}
         */
        public Builder access(java.util.List<java.lang.String> access) {
            this.access = access;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPipelineThumbnailConfigPermissions#getGrantee}
         * @param grantee Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#grantee ElastictranscoderPipeline#grantee}.
         * @return {@code this}
         */
        public Builder grantee(java.lang.String grantee) {
            this.grantee = grantee;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPipelineThumbnailConfigPermissions#getGranteeType}
         * @param granteeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_pipeline#grantee_type ElastictranscoderPipeline#grantee_type}.
         * @return {@code this}
         */
        public Builder granteeType(java.lang.String granteeType) {
            this.granteeType = granteeType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ElastictranscoderPipelineThumbnailConfigPermissions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElastictranscoderPipelineThumbnailConfigPermissions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElastictranscoderPipelineThumbnailConfigPermissions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElastictranscoderPipelineThumbnailConfigPermissions {
        private final java.util.List<java.lang.String> access;
        private final java.lang.String grantee;
        private final java.lang.String granteeType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.access = software.amazon.jsii.Kernel.get(this, "access", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.grantee = software.amazon.jsii.Kernel.get(this, "grantee", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.granteeType = software.amazon.jsii.Kernel.get(this, "granteeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.access = builder.access;
            this.grantee = builder.grantee;
            this.granteeType = builder.granteeType;
        }

        @Override
        public final java.util.List<java.lang.String> getAccess() {
            return this.access;
        }

        @Override
        public final java.lang.String getGrantee() {
            return this.grantee;
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

            if (this.getAccess() != null) {
                data.set("access", om.valueToTree(this.getAccess()));
            }
            if (this.getGrantee() != null) {
                data.set("grantee", om.valueToTree(this.getGrantee()));
            }
            if (this.getGranteeType() != null) {
                data.set("granteeType", om.valueToTree(this.getGranteeType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.elastictranscoderPipeline.ElastictranscoderPipelineThumbnailConfigPermissions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElastictranscoderPipelineThumbnailConfigPermissions.Jsii$Proxy that = (ElastictranscoderPipelineThumbnailConfigPermissions.Jsii$Proxy) o;

            if (this.access != null ? !this.access.equals(that.access) : that.access != null) return false;
            if (this.grantee != null ? !this.grantee.equals(that.grantee) : that.grantee != null) return false;
            return this.granteeType != null ? this.granteeType.equals(that.granteeType) : that.granteeType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.access != null ? this.access.hashCode() : 0;
            result = 31 * result + (this.grantee != null ? this.grantee.hashCode() : 0);
            result = 31 * result + (this.granteeType != null ? this.granteeType.hashCode() : 0);
            return result;
        }
    }
}
