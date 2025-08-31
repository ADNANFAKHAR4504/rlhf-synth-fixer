package imports.aws.imagebuilder_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.366Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderLifecyclePolicy.ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmis")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmis.Jsii$Proxy.class)
public interface ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmis extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#is_public ImagebuilderLifecyclePolicy#is_public}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIsPublic() {
        return null;
    }

    /**
     * last_launched block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#last_launched ImagebuilderLifecyclePolicy#last_launched}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLastLaunched() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#regions ImagebuilderLifecyclePolicy#regions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRegions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#shared_accounts ImagebuilderLifecyclePolicy#shared_accounts}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSharedAccounts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#tag_map ImagebuilderLifecyclePolicy#tag_map}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagMap() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmis}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmis}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmis> {
        java.lang.Object isPublic;
        java.lang.Object lastLaunched;
        java.util.List<java.lang.String> regions;
        java.util.List<java.lang.String> sharedAccounts;
        java.util.Map<java.lang.String, java.lang.String> tagMap;

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmis#getIsPublic}
         * @param isPublic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#is_public ImagebuilderLifecyclePolicy#is_public}.
         * @return {@code this}
         */
        public Builder isPublic(java.lang.Boolean isPublic) {
            this.isPublic = isPublic;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmis#getIsPublic}
         * @param isPublic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#is_public ImagebuilderLifecyclePolicy#is_public}.
         * @return {@code this}
         */
        public Builder isPublic(com.hashicorp.cdktf.IResolvable isPublic) {
            this.isPublic = isPublic;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmis#getLastLaunched}
         * @param lastLaunched last_launched block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#last_launched ImagebuilderLifecyclePolicy#last_launched}
         * @return {@code this}
         */
        public Builder lastLaunched(com.hashicorp.cdktf.IResolvable lastLaunched) {
            this.lastLaunched = lastLaunched;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmis#getLastLaunched}
         * @param lastLaunched last_launched block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#last_launched ImagebuilderLifecyclePolicy#last_launched}
         * @return {@code this}
         */
        public Builder lastLaunched(java.util.List<? extends imports.aws.imagebuilder_lifecycle_policy.ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmisLastLaunched> lastLaunched) {
            this.lastLaunched = lastLaunched;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmis#getRegions}
         * @param regions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#regions ImagebuilderLifecyclePolicy#regions}.
         * @return {@code this}
         */
        public Builder regions(java.util.List<java.lang.String> regions) {
            this.regions = regions;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmis#getSharedAccounts}
         * @param sharedAccounts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#shared_accounts ImagebuilderLifecyclePolicy#shared_accounts}.
         * @return {@code this}
         */
        public Builder sharedAccounts(java.util.List<java.lang.String> sharedAccounts) {
            this.sharedAccounts = sharedAccounts;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmis#getTagMap}
         * @param tagMap Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#tag_map ImagebuilderLifecyclePolicy#tag_map}.
         * @return {@code this}
         */
        public Builder tagMap(java.util.Map<java.lang.String, java.lang.String> tagMap) {
            this.tagMap = tagMap;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmis}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmis build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmis}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmis {
        private final java.lang.Object isPublic;
        private final java.lang.Object lastLaunched;
        private final java.util.List<java.lang.String> regions;
        private final java.util.List<java.lang.String> sharedAccounts;
        private final java.util.Map<java.lang.String, java.lang.String> tagMap;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.isPublic = software.amazon.jsii.Kernel.get(this, "isPublic", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.lastLaunched = software.amazon.jsii.Kernel.get(this, "lastLaunched", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.regions = software.amazon.jsii.Kernel.get(this, "regions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.sharedAccounts = software.amazon.jsii.Kernel.get(this, "sharedAccounts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagMap = software.amazon.jsii.Kernel.get(this, "tagMap", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.isPublic = builder.isPublic;
            this.lastLaunched = builder.lastLaunched;
            this.regions = builder.regions;
            this.sharedAccounts = builder.sharedAccounts;
            this.tagMap = builder.tagMap;
        }

        @Override
        public final java.lang.Object getIsPublic() {
            return this.isPublic;
        }

        @Override
        public final java.lang.Object getLastLaunched() {
            return this.lastLaunched;
        }

        @Override
        public final java.util.List<java.lang.String> getRegions() {
            return this.regions;
        }

        @Override
        public final java.util.List<java.lang.String> getSharedAccounts() {
            return this.sharedAccounts;
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

            if (this.getIsPublic() != null) {
                data.set("isPublic", om.valueToTree(this.getIsPublic()));
            }
            if (this.getLastLaunched() != null) {
                data.set("lastLaunched", om.valueToTree(this.getLastLaunched()));
            }
            if (this.getRegions() != null) {
                data.set("regions", om.valueToTree(this.getRegions()));
            }
            if (this.getSharedAccounts() != null) {
                data.set("sharedAccounts", om.valueToTree(this.getSharedAccounts()));
            }
            if (this.getTagMap() != null) {
                data.set("tagMap", om.valueToTree(this.getTagMap()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderLifecyclePolicy.ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmis"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmis.Jsii$Proxy that = (ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmis.Jsii$Proxy) o;

            if (this.isPublic != null ? !this.isPublic.equals(that.isPublic) : that.isPublic != null) return false;
            if (this.lastLaunched != null ? !this.lastLaunched.equals(that.lastLaunched) : that.lastLaunched != null) return false;
            if (this.regions != null ? !this.regions.equals(that.regions) : that.regions != null) return false;
            if (this.sharedAccounts != null ? !this.sharedAccounts.equals(that.sharedAccounts) : that.sharedAccounts != null) return false;
            return this.tagMap != null ? this.tagMap.equals(that.tagMap) : that.tagMap == null;
        }

        @Override
        public final int hashCode() {
            int result = this.isPublic != null ? this.isPublic.hashCode() : 0;
            result = 31 * result + (this.lastLaunched != null ? this.lastLaunched.hashCode() : 0);
            result = 31 * result + (this.regions != null ? this.regions.hashCode() : 0);
            result = 31 * result + (this.sharedAccounts != null ? this.sharedAccounts.hashCode() : 0);
            result = 31 * result + (this.tagMap != null ? this.tagMap.hashCode() : 0);
            return result;
        }
    }
}
