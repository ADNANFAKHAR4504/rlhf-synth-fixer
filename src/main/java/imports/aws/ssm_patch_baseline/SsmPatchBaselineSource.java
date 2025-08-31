package imports.aws.ssm_patch_baseline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.505Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmPatchBaseline.SsmPatchBaselineSource")
@software.amazon.jsii.Jsii.Proxy(SsmPatchBaselineSource.Jsii$Proxy.class)
public interface SsmPatchBaselineSource extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#configuration SsmPatchBaseline#configuration}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConfiguration();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#name SsmPatchBaseline#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#products SsmPatchBaseline#products}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getProducts();

    /**
     * @return a {@link Builder} of {@link SsmPatchBaselineSource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmPatchBaselineSource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmPatchBaselineSource> {
        java.lang.String configuration;
        java.lang.String name;
        java.util.List<java.lang.String> products;

        /**
         * Sets the value of {@link SsmPatchBaselineSource#getConfiguration}
         * @param configuration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#configuration SsmPatchBaseline#configuration}. This parameter is required.
         * @return {@code this}
         */
        public Builder configuration(java.lang.String configuration) {
            this.configuration = configuration;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineSource#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#name SsmPatchBaseline#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link SsmPatchBaselineSource#getProducts}
         * @param products Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssm_patch_baseline#products SsmPatchBaseline#products}. This parameter is required.
         * @return {@code this}
         */
        public Builder products(java.util.List<java.lang.String> products) {
            this.products = products;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmPatchBaselineSource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmPatchBaselineSource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmPatchBaselineSource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmPatchBaselineSource {
        private final java.lang.String configuration;
        private final java.lang.String name;
        private final java.util.List<java.lang.String> products;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.configuration = software.amazon.jsii.Kernel.get(this, "configuration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.products = software.amazon.jsii.Kernel.get(this, "products", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.configuration = java.util.Objects.requireNonNull(builder.configuration, "configuration is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.products = java.util.Objects.requireNonNull(builder.products, "products is required");
        }

        @Override
        public final java.lang.String getConfiguration() {
            return this.configuration;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.util.List<java.lang.String> getProducts() {
            return this.products;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("configuration", om.valueToTree(this.getConfiguration()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("products", om.valueToTree(this.getProducts()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmPatchBaseline.SsmPatchBaselineSource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmPatchBaselineSource.Jsii$Proxy that = (SsmPatchBaselineSource.Jsii$Proxy) o;

            if (!configuration.equals(that.configuration)) return false;
            if (!name.equals(that.name)) return false;
            return this.products.equals(that.products);
        }

        @Override
        public final int hashCode() {
            int result = this.configuration.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.products.hashCode());
            return result;
        }
    }
}
