package imports.aws.imagebuilder_image_recipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.361Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderImageRecipe.ImagebuilderImageRecipeSystemsManagerAgent")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderImageRecipeSystemsManagerAgent.Jsii$Proxy.class)
public interface ImagebuilderImageRecipeSystemsManagerAgent extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#uninstall_after_build ImagebuilderImageRecipe#uninstall_after_build}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getUninstallAfterBuild();

    /**
     * @return a {@link Builder} of {@link ImagebuilderImageRecipeSystemsManagerAgent}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderImageRecipeSystemsManagerAgent}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderImageRecipeSystemsManagerAgent> {
        java.lang.Object uninstallAfterBuild;

        /**
         * Sets the value of {@link ImagebuilderImageRecipeSystemsManagerAgent#getUninstallAfterBuild}
         * @param uninstallAfterBuild Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#uninstall_after_build ImagebuilderImageRecipe#uninstall_after_build}. This parameter is required.
         * @return {@code this}
         */
        public Builder uninstallAfterBuild(java.lang.Boolean uninstallAfterBuild) {
            this.uninstallAfterBuild = uninstallAfterBuild;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderImageRecipeSystemsManagerAgent#getUninstallAfterBuild}
         * @param uninstallAfterBuild Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_image_recipe#uninstall_after_build ImagebuilderImageRecipe#uninstall_after_build}. This parameter is required.
         * @return {@code this}
         */
        public Builder uninstallAfterBuild(com.hashicorp.cdktf.IResolvable uninstallAfterBuild) {
            this.uninstallAfterBuild = uninstallAfterBuild;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderImageRecipeSystemsManagerAgent}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderImageRecipeSystemsManagerAgent build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderImageRecipeSystemsManagerAgent}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderImageRecipeSystemsManagerAgent {
        private final java.lang.Object uninstallAfterBuild;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.uninstallAfterBuild = software.amazon.jsii.Kernel.get(this, "uninstallAfterBuild", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.uninstallAfterBuild = java.util.Objects.requireNonNull(builder.uninstallAfterBuild, "uninstallAfterBuild is required");
        }

        @Override
        public final java.lang.Object getUninstallAfterBuild() {
            return this.uninstallAfterBuild;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("uninstallAfterBuild", om.valueToTree(this.getUninstallAfterBuild()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderImageRecipe.ImagebuilderImageRecipeSystemsManagerAgent"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderImageRecipeSystemsManagerAgent.Jsii$Proxy that = (ImagebuilderImageRecipeSystemsManagerAgent.Jsii$Proxy) o;

            return this.uninstallAfterBuild.equals(that.uninstallAfterBuild);
        }

        @Override
        public final int hashCode() {
            int result = this.uninstallAfterBuild.hashCode();
            return result;
        }
    }
}
