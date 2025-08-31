package imports.aws.lakeformation_opt_in;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.487Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lakeformationOptIn.LakeformationOptInResourceDataDataLocation")
@software.amazon.jsii.Jsii.Proxy(LakeformationOptInResourceDataDataLocation.Jsii$Proxy.class)
public interface LakeformationOptInResourceDataDataLocation extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#resource_arn LakeformationOptIn#resource_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResourceArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#catalog_id LakeformationOptIn#catalog_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCatalogId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LakeformationOptInResourceDataDataLocation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LakeformationOptInResourceDataDataLocation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LakeformationOptInResourceDataDataLocation> {
        java.lang.String resourceArn;
        java.lang.String catalogId;

        /**
         * Sets the value of {@link LakeformationOptInResourceDataDataLocation#getResourceArn}
         * @param resourceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#resource_arn LakeformationOptIn#resource_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder resourceArn(java.lang.String resourceArn) {
            this.resourceArn = resourceArn;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceDataDataLocation#getCatalogId}
         * @param catalogId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#catalog_id LakeformationOptIn#catalog_id}.
         * @return {@code this}
         */
        public Builder catalogId(java.lang.String catalogId) {
            this.catalogId = catalogId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LakeformationOptInResourceDataDataLocation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LakeformationOptInResourceDataDataLocation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LakeformationOptInResourceDataDataLocation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LakeformationOptInResourceDataDataLocation {
        private final java.lang.String resourceArn;
        private final java.lang.String catalogId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.resourceArn = software.amazon.jsii.Kernel.get(this, "resourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.catalogId = software.amazon.jsii.Kernel.get(this, "catalogId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.resourceArn = java.util.Objects.requireNonNull(builder.resourceArn, "resourceArn is required");
            this.catalogId = builder.catalogId;
        }

        @Override
        public final java.lang.String getResourceArn() {
            return this.resourceArn;
        }

        @Override
        public final java.lang.String getCatalogId() {
            return this.catalogId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("resourceArn", om.valueToTree(this.getResourceArn()));
            if (this.getCatalogId() != null) {
                data.set("catalogId", om.valueToTree(this.getCatalogId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lakeformationOptIn.LakeformationOptInResourceDataDataLocation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LakeformationOptInResourceDataDataLocation.Jsii$Proxy that = (LakeformationOptInResourceDataDataLocation.Jsii$Proxy) o;

            if (!resourceArn.equals(that.resourceArn)) return false;
            return this.catalogId != null ? this.catalogId.equals(that.catalogId) : that.catalogId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.resourceArn.hashCode();
            result = 31 * result + (this.catalogId != null ? this.catalogId.hashCode() : 0);
            return result;
        }
    }
}
