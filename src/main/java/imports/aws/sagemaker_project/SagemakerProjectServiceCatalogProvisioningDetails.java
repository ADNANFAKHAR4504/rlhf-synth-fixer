package imports.aws.sagemaker_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.340Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerProject.SagemakerProjectServiceCatalogProvisioningDetails")
@software.amazon.jsii.Jsii.Proxy(SagemakerProjectServiceCatalogProvisioningDetails.Jsii$Proxy.class)
public interface SagemakerProjectServiceCatalogProvisioningDetails extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_project#product_id SagemakerProject#product_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProductId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_project#path_id SagemakerProject#path_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPathId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_project#provisioning_artifact_id SagemakerProject#provisioning_artifact_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProvisioningArtifactId() {
        return null;
    }

    /**
     * provisioning_parameter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_project#provisioning_parameter SagemakerProject#provisioning_parameter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getProvisioningParameter() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerProjectServiceCatalogProvisioningDetails}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerProjectServiceCatalogProvisioningDetails}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerProjectServiceCatalogProvisioningDetails> {
        java.lang.String productId;
        java.lang.String pathId;
        java.lang.String provisioningArtifactId;
        java.lang.Object provisioningParameter;

        /**
         * Sets the value of {@link SagemakerProjectServiceCatalogProvisioningDetails#getProductId}
         * @param productId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_project#product_id SagemakerProject#product_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder productId(java.lang.String productId) {
            this.productId = productId;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerProjectServiceCatalogProvisioningDetails#getPathId}
         * @param pathId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_project#path_id SagemakerProject#path_id}.
         * @return {@code this}
         */
        public Builder pathId(java.lang.String pathId) {
            this.pathId = pathId;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerProjectServiceCatalogProvisioningDetails#getProvisioningArtifactId}
         * @param provisioningArtifactId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_project#provisioning_artifact_id SagemakerProject#provisioning_artifact_id}.
         * @return {@code this}
         */
        public Builder provisioningArtifactId(java.lang.String provisioningArtifactId) {
            this.provisioningArtifactId = provisioningArtifactId;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerProjectServiceCatalogProvisioningDetails#getProvisioningParameter}
         * @param provisioningParameter provisioning_parameter block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_project#provisioning_parameter SagemakerProject#provisioning_parameter}
         * @return {@code this}
         */
        public Builder provisioningParameter(com.hashicorp.cdktf.IResolvable provisioningParameter) {
            this.provisioningParameter = provisioningParameter;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerProjectServiceCatalogProvisioningDetails#getProvisioningParameter}
         * @param provisioningParameter provisioning_parameter block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_project#provisioning_parameter SagemakerProject#provisioning_parameter}
         * @return {@code this}
         */
        public Builder provisioningParameter(java.util.List<? extends imports.aws.sagemaker_project.SagemakerProjectServiceCatalogProvisioningDetailsProvisioningParameter> provisioningParameter) {
            this.provisioningParameter = provisioningParameter;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerProjectServiceCatalogProvisioningDetails}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerProjectServiceCatalogProvisioningDetails build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerProjectServiceCatalogProvisioningDetails}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerProjectServiceCatalogProvisioningDetails {
        private final java.lang.String productId;
        private final java.lang.String pathId;
        private final java.lang.String provisioningArtifactId;
        private final java.lang.Object provisioningParameter;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.productId = software.amazon.jsii.Kernel.get(this, "productId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.pathId = software.amazon.jsii.Kernel.get(this, "pathId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.provisioningArtifactId = software.amazon.jsii.Kernel.get(this, "provisioningArtifactId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.provisioningParameter = software.amazon.jsii.Kernel.get(this, "provisioningParameter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.productId = java.util.Objects.requireNonNull(builder.productId, "productId is required");
            this.pathId = builder.pathId;
            this.provisioningArtifactId = builder.provisioningArtifactId;
            this.provisioningParameter = builder.provisioningParameter;
        }

        @Override
        public final java.lang.String getProductId() {
            return this.productId;
        }

        @Override
        public final java.lang.String getPathId() {
            return this.pathId;
        }

        @Override
        public final java.lang.String getProvisioningArtifactId() {
            return this.provisioningArtifactId;
        }

        @Override
        public final java.lang.Object getProvisioningParameter() {
            return this.provisioningParameter;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("productId", om.valueToTree(this.getProductId()));
            if (this.getPathId() != null) {
                data.set("pathId", om.valueToTree(this.getPathId()));
            }
            if (this.getProvisioningArtifactId() != null) {
                data.set("provisioningArtifactId", om.valueToTree(this.getProvisioningArtifactId()));
            }
            if (this.getProvisioningParameter() != null) {
                data.set("provisioningParameter", om.valueToTree(this.getProvisioningParameter()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerProject.SagemakerProjectServiceCatalogProvisioningDetails"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerProjectServiceCatalogProvisioningDetails.Jsii$Proxy that = (SagemakerProjectServiceCatalogProvisioningDetails.Jsii$Proxy) o;

            if (!productId.equals(that.productId)) return false;
            if (this.pathId != null ? !this.pathId.equals(that.pathId) : that.pathId != null) return false;
            if (this.provisioningArtifactId != null ? !this.provisioningArtifactId.equals(that.provisioningArtifactId) : that.provisioningArtifactId != null) return false;
            return this.provisioningParameter != null ? this.provisioningParameter.equals(that.provisioningParameter) : that.provisioningParameter == null;
        }

        @Override
        public final int hashCode() {
            int result = this.productId.hashCode();
            result = 31 * result + (this.pathId != null ? this.pathId.hashCode() : 0);
            result = 31 * result + (this.provisioningArtifactId != null ? this.provisioningArtifactId.hashCode() : 0);
            result = 31 * result + (this.provisioningParameter != null ? this.provisioningParameter.hashCode() : 0);
            return result;
        }
    }
}
