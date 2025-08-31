package imports.aws.imagebuilder_container_recipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.349Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderContainerRecipe.ImagebuilderContainerRecipeTargetRepository")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderContainerRecipeTargetRepository.Jsii$Proxy.class)
public interface ImagebuilderContainerRecipeTargetRepository extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#repository_name ImagebuilderContainerRecipe#repository_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRepositoryName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#service ImagebuilderContainerRecipe#service}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getService();

    /**
     * @return a {@link Builder} of {@link ImagebuilderContainerRecipeTargetRepository}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderContainerRecipeTargetRepository}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderContainerRecipeTargetRepository> {
        java.lang.String repositoryName;
        java.lang.String service;

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeTargetRepository#getRepositoryName}
         * @param repositoryName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#repository_name ImagebuilderContainerRecipe#repository_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder repositoryName(java.lang.String repositoryName) {
            this.repositoryName = repositoryName;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderContainerRecipeTargetRepository#getService}
         * @param service Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_container_recipe#service ImagebuilderContainerRecipe#service}. This parameter is required.
         * @return {@code this}
         */
        public Builder service(java.lang.String service) {
            this.service = service;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderContainerRecipeTargetRepository}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderContainerRecipeTargetRepository build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderContainerRecipeTargetRepository}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderContainerRecipeTargetRepository {
        private final java.lang.String repositoryName;
        private final java.lang.String service;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.repositoryName = software.amazon.jsii.Kernel.get(this, "repositoryName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.service = software.amazon.jsii.Kernel.get(this, "service", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.repositoryName = java.util.Objects.requireNonNull(builder.repositoryName, "repositoryName is required");
            this.service = java.util.Objects.requireNonNull(builder.service, "service is required");
        }

        @Override
        public final java.lang.String getRepositoryName() {
            return this.repositoryName;
        }

        @Override
        public final java.lang.String getService() {
            return this.service;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("repositoryName", om.valueToTree(this.getRepositoryName()));
            data.set("service", om.valueToTree(this.getService()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderContainerRecipe.ImagebuilderContainerRecipeTargetRepository"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderContainerRecipeTargetRepository.Jsii$Proxy that = (ImagebuilderContainerRecipeTargetRepository.Jsii$Proxy) o;

            if (!repositoryName.equals(that.repositoryName)) return false;
            return this.service.equals(that.service);
        }

        @Override
        public final int hashCode() {
            int result = this.repositoryName.hashCode();
            result = 31 * result + (this.service.hashCode());
            return result;
        }
    }
}
