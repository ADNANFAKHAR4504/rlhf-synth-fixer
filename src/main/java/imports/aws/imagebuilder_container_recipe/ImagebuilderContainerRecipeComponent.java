package imports.aws.imagebuilder_container_recipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.348Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderContainerRecipe.ImagebuilderContainerRecipeComponent")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderContainerRecipeComponent.Jsii$Proxy.class)
public interface ImagebuilderContainerRecipeComponent extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#component_arn ImagebuilderContainerRecipe#component_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getComponentArn();

    /**
     * parameter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#parameter ImagebuilderContainerRecipe#parameter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getParameter() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderContainerRecipeComponent}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderContainerRecipeComponent}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderContainerRecipeComponent> {
        java.lang.String componentArn;
        java.lang.Object parameter;

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeComponent#getComponentArn}
         * @param componentArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#component_arn ImagebuilderContainerRecipe#component_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder componentArn(java.lang.String componentArn) {
            this.componentArn = componentArn;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeComponent#getParameter}
         * @param parameter parameter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#parameter ImagebuilderContainerRecipe#parameter}
         * @return {@code this}
         */
        public Builder parameter(com.hashicorp.cdktf.IResolvable parameter) {
            this.parameter = parameter;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeComponent#getParameter}
         * @param parameter parameter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#parameter ImagebuilderContainerRecipe#parameter}
         * @return {@code this}
         */
        public Builder parameter(java.util.List<? extends imports.aws.imagebuilder_container_recipe.ImagebuilderContainerRecipeComponentParameter> parameter) {
            this.parameter = parameter;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderContainerRecipeComponent}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderContainerRecipeComponent build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderContainerRecipeComponent}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderContainerRecipeComponent {
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
            struct.set("fqn", om.valueToTree("aws.imagebuilderContainerRecipe.ImagebuilderContainerRecipeComponent"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderContainerRecipeComponent.Jsii$Proxy that = (ImagebuilderContainerRecipeComponent.Jsii$Proxy) o;

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
