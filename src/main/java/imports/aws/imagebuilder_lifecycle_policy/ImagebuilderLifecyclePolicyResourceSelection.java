package imports.aws.imagebuilder_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.367Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderLifecyclePolicy.ImagebuilderLifecyclePolicyResourceSelection")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderLifecyclePolicyResourceSelection.Jsii$Proxy.class)
public interface ImagebuilderLifecyclePolicyResourceSelection extends software.amazon.jsii.JsiiSerializable {

    /**
     * recipe block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#recipe ImagebuilderLifecyclePolicy#recipe}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRecipe() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#tag_map ImagebuilderLifecyclePolicy#tag_map}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagMap() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderLifecyclePolicyResourceSelection}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderLifecyclePolicyResourceSelection}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderLifecyclePolicyResourceSelection> {
        java.lang.Object recipe;
        java.util.Map<java.lang.String, java.lang.String> tagMap;

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyResourceSelection#getRecipe}
         * @param recipe recipe block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#recipe ImagebuilderLifecyclePolicy#recipe}
         * @return {@code this}
         */
        public Builder recipe(com.hashicorp.cdktf.IResolvable recipe) {
            this.recipe = recipe;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyResourceSelection#getRecipe}
         * @param recipe recipe block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#recipe ImagebuilderLifecyclePolicy#recipe}
         * @return {@code this}
         */
        public Builder recipe(java.util.List<? extends imports.aws.imagebuilder_lifecycle_policy.ImagebuilderLifecyclePolicyResourceSelectionRecipe> recipe) {
            this.recipe = recipe;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyResourceSelection#getTagMap}
         * @param tagMap Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#tag_map ImagebuilderLifecyclePolicy#tag_map}.
         * @return {@code this}
         */
        public Builder tagMap(java.util.Map<java.lang.String, java.lang.String> tagMap) {
            this.tagMap = tagMap;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderLifecyclePolicyResourceSelection}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderLifecyclePolicyResourceSelection build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderLifecyclePolicyResourceSelection}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderLifecyclePolicyResourceSelection {
        private final java.lang.Object recipe;
        private final java.util.Map<java.lang.String, java.lang.String> tagMap;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.recipe = software.amazon.jsii.Kernel.get(this, "recipe", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tagMap = software.amazon.jsii.Kernel.get(this, "tagMap", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.recipe = builder.recipe;
            this.tagMap = builder.tagMap;
        }

        @Override
        public final java.lang.Object getRecipe() {
            return this.recipe;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagMap() {
            return this.tagMap;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getRecipe() != null) {
                data.set("recipe", om.valueToTree(this.getRecipe()));
            }
            if (this.getTagMap() != null) {
                data.set("tagMap", om.valueToTree(this.getTagMap()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderLifecyclePolicy.ImagebuilderLifecyclePolicyResourceSelection"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderLifecyclePolicyResourceSelection.Jsii$Proxy that = (ImagebuilderLifecyclePolicyResourceSelection.Jsii$Proxy) o;

            if (this.recipe != null ? !this.recipe.equals(that.recipe) : that.recipe != null) return false;
            return this.tagMap != null ? this.tagMap.equals(that.tagMap) : that.tagMap == null;
        }

        @Override
        public final int hashCode() {
            int result = this.recipe != null ? this.recipe.hashCode() : 0;
            result = 31 * result + (this.tagMap != null ? this.tagMap.hashCode() : 0);
            return result;
        }
    }
}
