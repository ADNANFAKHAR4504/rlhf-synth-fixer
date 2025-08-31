package imports.aws.rolesanywhere_trust_anchor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.194Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rolesanywhereTrustAnchor.RolesanywhereTrustAnchorSource")
@software.amazon.jsii.Jsii.Proxy(RolesanywhereTrustAnchorSource.Jsii$Proxy.class)
public interface RolesanywhereTrustAnchorSource extends software.amazon.jsii.JsiiSerializable {

    /**
     * source_data block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rolesanywhere_trust_anchor#source_data RolesanywhereTrustAnchor#source_data}
     */
    @org.jetbrains.annotations.NotNull imports.aws.rolesanywhere_trust_anchor.RolesanywhereTrustAnchorSourceSourceData getSourceData();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rolesanywhere_trust_anchor#source_type RolesanywhereTrustAnchor#source_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSourceType();

    /**
     * @return a {@link Builder} of {@link RolesanywhereTrustAnchorSource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RolesanywhereTrustAnchorSource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RolesanywhereTrustAnchorSource> {
        imports.aws.rolesanywhere_trust_anchor.RolesanywhereTrustAnchorSourceSourceData sourceData;
        java.lang.String sourceType;

        /**
         * Sets the value of {@link RolesanywhereTrustAnchorSource#getSourceData}
         * @param sourceData source_data block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rolesanywhere_trust_anchor#source_data RolesanywhereTrustAnchor#source_data}
         * @return {@code this}
         */
        public Builder sourceData(imports.aws.rolesanywhere_trust_anchor.RolesanywhereTrustAnchorSourceSourceData sourceData) {
            this.sourceData = sourceData;
            return this;
        }

        /**
         * Sets the value of {@link RolesanywhereTrustAnchorSource#getSourceType}
         * @param sourceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rolesanywhere_trust_anchor#source_type RolesanywhereTrustAnchor#source_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder sourceType(java.lang.String sourceType) {
            this.sourceType = sourceType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RolesanywhereTrustAnchorSource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RolesanywhereTrustAnchorSource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RolesanywhereTrustAnchorSource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RolesanywhereTrustAnchorSource {
        private final imports.aws.rolesanywhere_trust_anchor.RolesanywhereTrustAnchorSourceSourceData sourceData;
        private final java.lang.String sourceType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sourceData = software.amazon.jsii.Kernel.get(this, "sourceData", software.amazon.jsii.NativeType.forClass(imports.aws.rolesanywhere_trust_anchor.RolesanywhereTrustAnchorSourceSourceData.class));
            this.sourceType = software.amazon.jsii.Kernel.get(this, "sourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sourceData = java.util.Objects.requireNonNull(builder.sourceData, "sourceData is required");
            this.sourceType = java.util.Objects.requireNonNull(builder.sourceType, "sourceType is required");
        }

        @Override
        public final imports.aws.rolesanywhere_trust_anchor.RolesanywhereTrustAnchorSourceSourceData getSourceData() {
            return this.sourceData;
        }

        @Override
        public final java.lang.String getSourceType() {
            return this.sourceType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("sourceData", om.valueToTree(this.getSourceData()));
            data.set("sourceType", om.valueToTree(this.getSourceType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rolesanywhereTrustAnchor.RolesanywhereTrustAnchorSource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RolesanywhereTrustAnchorSource.Jsii$Proxy that = (RolesanywhereTrustAnchorSource.Jsii$Proxy) o;

            if (!sourceData.equals(that.sourceData)) return false;
            return this.sourceType.equals(that.sourceType);
        }

        @Override
        public final int hashCode() {
            int result = this.sourceData.hashCode();
            result = 31 * result + (this.sourceType.hashCode());
            return result;
        }
    }
}
