package imports.aws.imagebuilder_image_recipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.360Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderImageRecipe.ImagebuilderImageRecipeComponent")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderImageRecipeComponent.Jsii$Proxy.class)
public interface ImagebuilderImageRecipeComponent extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#component_arn ImagebuilderImageRecipe#component_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getComponentArn();

    /**
     * parameter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#parameter ImagebuilderImageRecipe#parameter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getParameter() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderImageRecipeComponent}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderImageRecipeComponent}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderImageRecipeComponent> {
        java.lang.String componentArn;
        java.lang.Object parameter;

        /**
         * Sets the value of {@link ImagebuilderImageRecipeComponent#getComponentArn}
         * @param componentArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#component_arn ImagebuilderImageRecipe#component_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder componentArn(java.lang.String componentArn) {
            this.componentArn = componentArn;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeComponent#getParameter}
         * @param parameter parameter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#parameter ImagebuilderImageRecipe#parameter}
         * @return {@code this}
         */
        public Builder parameter(com.hashicorp.cdktf.IResolvable parameter) {
            this.parameter = parameter;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeComponent#getParameter}
         * @param parameter parameter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#parameter ImagebuilderImageRecipe#parameter}
         * @return {@code this}
         */
        public Builder parameter(java.util.List<? extends imports.aws.imagebuilder_image_recipe.ImagebuilderImageRecipeComponentParameter> parameter) {
            this.parameter = parameter;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderImageRecipeComponent}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderImageRecipeComponent build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderImageRecipeComponent}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderImageRecipeComponent {
        private final java.lang.String componentArn;
        private final java.lang.Object parameter;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.componentArn = software.amazon.jsii.Kernel.get(this, "componentArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parameter = software.amazon.jsii.Kernel.get(this, "parameter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.componentArn = java.util.Objects.requireNonNull(builder.componentArn, "componentArn is required");
            this.parameter = builder.parameter;
        }

        @Override
        public final java.lang.String getComponentArn() {
            return this.componentArn;
        }

        @Override
        public final java.lang.Object getParameter() {
            return this.parameter;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("componentArn", om.valueToTree(this.getComponentArn()));
            if (this.getParameter() != null) {
                data.set("parameter", om.valueToTree(this.getParameter()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderImageRecipe.ImagebuilderImageRecipeComponent"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderImageRecipeComponent.Jsii$Proxy that = (ImagebuilderImageRecipeComponent.Jsii$Proxy) o;

            if (!componentArn.equals(that.componentArn)) return false;
            return this.parameter != null ? this.parameter.equals(that.parameter) : that.parameter == null;
        }

        @Override
        public final int hashCode() {
            int result = this.componentArn.hashCode();
            result = 31 * result + (this.parameter != null ? this.parameter.hashCode() : 0);
            return result;
        }
    }
}
