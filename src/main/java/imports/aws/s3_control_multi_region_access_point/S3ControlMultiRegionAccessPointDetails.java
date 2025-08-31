package imports.aws.s3_control_multi_region_access_point;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.277Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlMultiRegionAccessPoint.S3ControlMultiRegionAccessPointDetails")
@software.amazon.jsii.Jsii.Proxy(S3ControlMultiRegionAccessPointDetails.Jsii$Proxy.class)
public interface S3ControlMultiRegionAccessPointDetails extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_multi_region_access_point#name S3ControlMultiRegionAccessPoint#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * region block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_multi_region_access_point#region S3ControlMultiRegionAccessPoint#region}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getRegion();

    /**
     * public_access_block block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_multi_region_access_point#public_access_block S3ControlMultiRegionAccessPoint#public_access_block}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_control_multi_region_access_point.S3ControlMultiRegionAccessPointDetailsPublicAccessBlock getPublicAccessBlock() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3ControlMultiRegionAccessPointDetails}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3ControlMultiRegionAccessPointDetails}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3ControlMultiRegionAccessPointDetails> {
        java.lang.String name;
        java.lang.Object region;
        imports.aws.s3_control_multi_region_access_point.S3ControlMultiRegionAccessPointDetailsPublicAccessBlock publicAccessBlock;

        /**
         * Sets the value of {@link S3ControlMultiRegionAccessPointDetails#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_multi_region_access_point#name S3ControlMultiRegionAccessPoint#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlMultiRegionAccessPointDetails#getRegion}
         * @param region region block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_multi_region_access_point#region S3ControlMultiRegionAccessPoint#region}
         * @return {@code this}
         */
        public Builder region(com.hashicorp.cdktf.IResolvable region) {
            this.region = region;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlMultiRegionAccessPointDetails#getRegion}
         * @param region region block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_multi_region_access_point#region S3ControlMultiRegionAccessPoint#region}
         * @return {@code this}
         */
        public Builder region(java.util.List<? extends imports.aws.s3_control_multi_region_access_point.S3ControlMultiRegionAccessPointDetailsRegion> region) {
            this.region = region;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlMultiRegionAccessPointDetails#getPublicAccessBlock}
         * @param publicAccessBlock public_access_block block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_multi_region_access_point#public_access_block S3ControlMultiRegionAccessPoint#public_access_block}
         * @return {@code this}
         */
        public Builder publicAccessBlock(imports.aws.s3_control_multi_region_access_point.S3ControlMultiRegionAccessPointDetailsPublicAccessBlock publicAccessBlock) {
            this.publicAccessBlock = publicAccessBlock;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3ControlMultiRegionAccessPointDetails}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3ControlMultiRegionAccessPointDetails build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3ControlMultiRegionAccessPointDetails}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3ControlMultiRegionAccessPointDetails {
        private final java.lang.String name;
        private final java.lang.Object region;
        private final imports.aws.s3_control_multi_region_access_point.S3ControlMultiRegionAccessPointDetailsPublicAccessBlock publicAccessBlock;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.publicAccessBlock = software.amazon.jsii.Kernel.get(this, "publicAccessBlock", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_multi_region_access_point.S3ControlMultiRegionAccessPointDetailsPublicAccessBlock.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.region = java.util.Objects.requireNonNull(builder.region, "region is required");
            this.publicAccessBlock = builder.publicAccessBlock;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getRegion() {
            return this.region;
        }

        @Override
        public final imports.aws.s3_control_multi_region_access_point.S3ControlMultiRegionAccessPointDetailsPublicAccessBlock getPublicAccessBlock() {
            return this.publicAccessBlock;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("region", om.valueToTree(this.getRegion()));
            if (this.getPublicAccessBlock() != null) {
                data.set("publicAccessBlock", om.valueToTree(this.getPublicAccessBlock()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3ControlMultiRegionAccessPoint.S3ControlMultiRegionAccessPointDetails"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3ControlMultiRegionAccessPointDetails.Jsii$Proxy that = (S3ControlMultiRegionAccessPointDetails.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!region.equals(that.region)) return false;
            return this.publicAccessBlock != null ? this.publicAccessBlock.equals(that.publicAccessBlock) : that.publicAccessBlock == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.region.hashCode());
            result = 31 * result + (this.publicAccessBlock != null ? this.publicAccessBlock.hashCode() : 0);
            return result;
        }
    }
}
