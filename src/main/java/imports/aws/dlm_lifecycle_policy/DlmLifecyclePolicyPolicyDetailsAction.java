package imports.aws.dlm_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.005Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsAction")
@software.amazon.jsii.Jsii.Proxy(DlmLifecyclePolicyPolicyDetailsAction.Jsii$Proxy.class)
public interface DlmLifecyclePolicyPolicyDetailsAction extends software.amazon.jsii.JsiiSerializable {

    /**
     * cross_region_copy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#cross_region_copy DlmLifecyclePolicy#cross_region_copy}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getCrossRegionCopy();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#name DlmLifecyclePolicy#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * @return a {@link Builder} of {@link DlmLifecyclePolicyPolicyDetailsAction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DlmLifecyclePolicyPolicyDetailsAction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DlmLifecyclePolicyPolicyDetailsAction> {
        java.lang.Object crossRegionCopy;
        java.lang.String name;

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsAction#getCrossRegionCopy}
         * @param crossRegionCopy cross_region_copy block. This parameter is required.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#cross_region_copy DlmLifecyclePolicy#cross_region_copy}
         * @return {@code this}
         */
        public Builder crossRegionCopy(com.hashicorp.cdktf.IResolvable crossRegionCopy) {
            this.crossRegionCopy = crossRegionCopy;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsAction#getCrossRegionCopy}
         * @param crossRegionCopy cross_region_copy block. This parameter is required.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#cross_region_copy DlmLifecyclePolicy#cross_region_copy}
         * @return {@code this}
         */
        public Builder crossRegionCopy(java.util.List<? extends imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopy> crossRegionCopy) {
            this.crossRegionCopy = crossRegionCopy;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsAction#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#name DlmLifecyclePolicy#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DlmLifecyclePolicyPolicyDetailsAction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DlmLifecyclePolicyPolicyDetailsAction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DlmLifecyclePolicyPolicyDetailsAction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DlmLifecyclePolicyPolicyDetailsAction {
        private final java.lang.Object crossRegionCopy;
        private final java.lang.String name;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.crossRegionCopy = software.amazon.jsii.Kernel.get(this, "crossRegionCopy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.crossRegionCopy = java.util.Objects.requireNonNull(builder.crossRegionCopy, "crossRegionCopy is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
        }

        @Override
        public final java.lang.Object getCrossRegionCopy() {
            return this.crossRegionCopy;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("crossRegionCopy", om.valueToTree(this.getCrossRegionCopy()));
            data.set("name", om.valueToTree(this.getName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsAction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DlmLifecyclePolicyPolicyDetailsAction.Jsii$Proxy that = (DlmLifecyclePolicyPolicyDetailsAction.Jsii$Proxy) o;

            if (!crossRegionCopy.equals(that.crossRegionCopy)) return false;
            return this.name.equals(that.name);
        }

        @Override
        public final int hashCode() {
            int result = this.crossRegionCopy.hashCode();
            result = 31 * result + (this.name.hashCode());
            return result;
        }
    }
}
