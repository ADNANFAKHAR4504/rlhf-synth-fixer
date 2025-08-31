package imports.aws.imagebuilder_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.366Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderLifecyclePolicy.ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResources")
@software.amazon.jsii.Jsii.Proxy(ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResources.Jsii$Proxy.class)
public interface ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResources extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#amis ImagebuilderLifecyclePolicy#amis}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAmis() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#containers ImagebuilderLifecyclePolicy#containers}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getContainers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#snapshots ImagebuilderLifecyclePolicy#snapshots}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSnapshots() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResources}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResources}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResources> {
        java.lang.Object amis;
        java.lang.Object containers;
        java.lang.Object snapshots;

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResources#getAmis}
         * @param amis Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#amis ImagebuilderLifecyclePolicy#amis}.
         * @return {@code this}
         */
        public Builder amis(java.lang.Boolean amis) {
            this.amis = amis;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResources#getAmis}
         * @param amis Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#amis ImagebuilderLifecyclePolicy#amis}.
         * @return {@code this}
         */
        public Builder amis(com.hashicorp.cdktf.IResolvable amis) {
            this.amis = amis;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResources#getContainers}
         * @param containers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#containers ImagebuilderLifecyclePolicy#containers}.
         * @return {@code this}
         */
        public Builder containers(java.lang.Boolean containers) {
            this.containers = containers;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResources#getContainers}
         * @param containers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#containers ImagebuilderLifecyclePolicy#containers}.
         * @return {@code this}
         */
        public Builder containers(com.hashicorp.cdktf.IResolvable containers) {
            this.containers = containers;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResources#getSnapshots}
         * @param snapshots Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#snapshots ImagebuilderLifecyclePolicy#snapshots}.
         * @return {@code this}
         */
        public Builder snapshots(java.lang.Boolean snapshots) {
            this.snapshots = snapshots;
            return this;
        }

        /**
         * Sets the value of {@link ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResources#getSnapshots}
         * @param snapshots Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_lifecycle_policy#snapshots ImagebuilderLifecyclePolicy#snapshots}.
         * @return {@code this}
         */
        public Builder snapshots(com.hashicorp.cdktf.IResolvable snapshots) {
            this.snapshots = snapshots;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResources}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResources build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResources}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResources {
        private final java.lang.Object amis;
        private final java.lang.Object containers;
        private final java.lang.Object snapshots;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.amis = software.amazon.jsii.Kernel.get(this, "amis", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.containers = software.amazon.jsii.Kernel.get(this, "containers", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.snapshots = software.amazon.jsii.Kernel.get(this, "snapshots", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.amis = builder.amis;
            this.containers = builder.containers;
            this.snapshots = builder.snapshots;
        }

        @Override
        public final java.lang.Object getAmis() {
            return this.amis;
        }

        @Override
        public final java.lang.Object getContainers() {
            return this.containers;
        }

        @Override
        public final java.lang.Object getSnapshots() {
            return this.snapshots;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAmis() != null) {
                data.set("amis", om.valueToTree(this.getAmis()));
            }
            if (this.getContainers() != null) {
                data.set("containers", om.valueToTree(this.getContainers()));
            }
            if (this.getSnapshots() != null) {
                data.set("snapshots", om.valueToTree(this.getSnapshots()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.imagebuilderLifecyclePolicy.ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResources"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResources.Jsii$Proxy that = (ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResources.Jsii$Proxy) o;

            if (this.amis != null ? !this.amis.equals(that.amis) : that.amis != null) return false;
            if (this.containers != null ? !this.containers.equals(that.containers) : that.containers != null) return false;
            return this.snapshots != null ? this.snapshots.equals(that.snapshots) : that.snapshots == null;
        }

        @Override
        public final int hashCode() {
            int result = this.amis != null ? this.amis.hashCode() : 0;
            result = 31 * result + (this.containers != null ? this.containers.hashCode() : 0);
            result = 31 * result + (this.snapshots != null ? this.snapshots.hashCode() : 0);
            return result;
        }
    }
}
