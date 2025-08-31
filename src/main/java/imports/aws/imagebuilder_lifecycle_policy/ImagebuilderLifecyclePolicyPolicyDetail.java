package imports.aws.imagebuilder_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.366Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderLifecyclePolicy.ImagebuilderLifecyclePolicyPolicyDetail")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderLifecyclePolicyPolicyDetail.Jsii$Proxy.class)
public interface ImagebuilderLifecyclePolicyPolicyDetail extends software.amazon.jsii.JsiiSerializable {

    /**
     * action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#action ImagebuilderLifecyclePolicy#action}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAction() {
        return null;
    }

    /**
     * exclusion_rules block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#exclusion_rules ImagebuilderLifecyclePolicy#exclusion_rules}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getExclusionRules() {
        return null;
    }

    /**
     * filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#filter ImagebuilderLifecyclePolicy#filter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFilter() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderLifecyclePolicyPolicyDetail}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderLifecyclePolicyPolicyDetail}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderLifecyclePolicyPolicyDetail> {
        java.lang.Object action;
        java.lang.Object exclusionRules;
        java.lang.Object filter;

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetail#getAction}
         * @param action action block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#action ImagebuilderLifecyclePolicy#action}
         * @return {@code this}
         */
        public Builder action(com.hashicorp.cdktf.IResolvable action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetail#getAction}
         * @param action action block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#action ImagebuilderLifecyclePolicy#action}
         * @return {@code this}
         */
        public Builder action(java.util.List<? extends imports.aws.imagebuilder_lifecycle_policy.ImagebuilderLifecyclePolicyPolicyDetailAction> action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetail#getExclusionRules}
         * @param exclusionRules exclusion_rules block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#exclusion_rules ImagebuilderLifecyclePolicy#exclusion_rules}
         * @return {@code this}
         */
        public Builder exclusionRules(com.hashicorp.cdktf.IResolvable exclusionRules) {
            this.exclusionRules = exclusionRules;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetail#getExclusionRules}
         * @param exclusionRules exclusion_rules block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#exclusion_rules ImagebuilderLifecyclePolicy#exclusion_rules}
         * @return {@code this}
         */
        public Builder exclusionRules(java.util.List<? extends imports.aws.imagebuilder_lifecycle_policy.ImagebuilderLifecyclePolicyPolicyDetailExclusionRules> exclusionRules) {
            this.exclusionRules = exclusionRules;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetail#getFilter}
         * @param filter filter block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#filter ImagebuilderLifecyclePolicy#filter}
         * @return {@code this}
         */
        public Builder filter(com.hashicorp.cdktf.IResolvable filter) {
            this.filter = filter;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetail#getFilter}
         * @param filter filter block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#filter ImagebuilderLifecyclePolicy#filter}
         * @return {@code this}
         */
        public Builder filter(java.util.List<? extends imports.aws.imagebuilder_lifecycle_policy.ImagebuilderLifecyclePolicyPolicyDetailFilter> filter) {
            this.filter = filter;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderLifecyclePolicyPolicyDetail}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderLifecyclePolicyPolicyDetail build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderLifecyclePolicyPolicyDetail}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderLifecyclePolicyPolicyDetail {
        private final java.lang.Object action;
        private final java.lang.Object exclusionRules;
        private final java.lang.Object filter;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.action = software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.exclusionRules = software.amazon.jsii.Kernel.get(this, "exclusionRules", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.filter = software.amazon.jsii.Kernel.get(this, "filter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.action = builder.action;
            this.exclusionRules = builder.exclusionRules;
            this.filter = builder.filter;
        }

        @Override
        public final java.lang.Object getAction() {
            return this.action;
        }

        @Override
        public final java.lang.Object getExclusionRules() {
            return this.exclusionRules;
        }

        @Override
        public final java.lang.Object getFilter() {
            return this.filter;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAction() != null) {
                data.set("action", om.valueToTree(this.getAction()));
            }
            if (this.getExclusionRules() != null) {
                data.set("exclusionRules", om.valueToTree(this.getExclusionRules()));
            }
            if (this.getFilter() != null) {
                data.set("filter", om.valueToTree(this.getFilter()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderLifecyclePolicy.ImagebuilderLifecyclePolicyPolicyDetail"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderLifecyclePolicyPolicyDetail.Jsii$Proxy that = (ImagebuilderLifecyclePolicyPolicyDetail.Jsii$Proxy) o;

            if (this.action != null ? !this.action.equals(that.action) : that.action != null) return false;
            if (this.exclusionRules != null ? !this.exclusionRules.equals(that.exclusionRules) : that.exclusionRules != null) return false;
            return this.filter != null ? this.filter.equals(that.filter) : that.filter == null;
        }

        @Override
        public final int hashCode() {
            int result = this.action != null ? this.action.hashCode() : 0;
            result = 31 * result + (this.exclusionRules != null ? this.exclusionRules.hashCode() : 0);
            result = 31 * result + (this.filter != null ? this.filter.hashCode() : 0);
            return result;
        }
    }
}
