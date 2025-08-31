package imports.aws.imagebuilder_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.366Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderLifecyclePolicy.ImagebuilderLifecyclePolicyPolicyDetailAction")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderLifecyclePolicyPolicyDetailAction.Jsii$Proxy.class)
public interface ImagebuilderLifecyclePolicyPolicyDetailAction extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#type ImagebuilderLifecyclePolicy#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * include_resources block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#include_resources ImagebuilderLifecyclePolicy#include_resources}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeResources() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderLifecyclePolicyPolicyDetailAction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderLifecyclePolicyPolicyDetailAction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderLifecyclePolicyPolicyDetailAction> {
        java.lang.String type;
        java.lang.Object includeResources;

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetailAction#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#type ImagebuilderLifecyclePolicy#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetailAction#getIncludeResources}
         * @param includeResources include_resources block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#include_resources ImagebuilderLifecyclePolicy#include_resources}
         * @return {@code this}
         */
        public Builder includeResources(com.hashicorp.cdktf.IResolvable includeResources) {
            this.includeResources = includeResources;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetailAction#getIncludeResources}
         * @param includeResources include_resources block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#include_resources ImagebuilderLifecyclePolicy#include_resources}
         * @return {@code this}
         */
        public Builder includeResources(java.util.List<? extends imports.aws.imagebuilder_lifecycle_policy.ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResources> includeResources) {
            this.includeResources = includeResources;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderLifecyclePolicyPolicyDetailAction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderLifecyclePolicyPolicyDetailAction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderLifecyclePolicyPolicyDetailAction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderLifecyclePolicyPolicyDetailAction {
        private final java.lang.String type;
        private final java.lang.Object includeResources;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.includeResources = software.amazon.jsii.Kernel.get(this, "includeResources", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.includeResources = builder.includeResources;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.Object getIncludeResources() {
            return this.includeResources;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getIncludeResources() != null) {
                data.set("includeResources", om.valueToTree(this.getIncludeResources()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderLifecyclePolicy.ImagebuilderLifecyclePolicyPolicyDetailAction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderLifecyclePolicyPolicyDetailAction.Jsii$Proxy that = (ImagebuilderLifecyclePolicyPolicyDetailAction.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            return this.includeResources != null ? this.includeResources.equals(that.includeResources) : that.includeResources == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.includeResources != null ? this.includeResources.hashCode() : 0);
            return result;
        }
    }
}
