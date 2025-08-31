package imports.aws.cloudformation_stack_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.220Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudformationStackSet.CloudformationStackSetAutoDeployment")
@software.amazon.jsii.Jsii.Proxy(CloudformationStackSetAutoDeployment.Jsii$Proxy.class)
public interface CloudformationStackSetAutoDeployment extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#enabled CloudformationStackSet#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#retain_stacks_on_account_removal CloudformationStackSet#retain_stacks_on_account_removal}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRetainStacksOnAccountRemoval() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudformationStackSetAutoDeployment}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudformationStackSetAutoDeployment}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudformationStackSetAutoDeployment> {
        java.lang.Object enabled;
        java.lang.Object retainStacksOnAccountRemoval;

        /**
         * Sets the value of {@link CloudformationStackSetAutoDeployment#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#enabled CloudformationStackSet#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetAutoDeployment#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#enabled CloudformationStackSet#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetAutoDeployment#getRetainStacksOnAccountRemoval}
         * @param retainStacksOnAccountRemoval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#retain_stacks_on_account_removal CloudformationStackSet#retain_stacks_on_account_removal}.
         * @return {@code this}
         */
        public Builder retainStacksOnAccountRemoval(java.lang.Boolean retainStacksOnAccountRemoval) {
            this.retainStacksOnAccountRemoval = retainStacksOnAccountRemoval;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetAutoDeployment#getRetainStacksOnAccountRemoval}
         * @param retainStacksOnAccountRemoval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#retain_stacks_on_account_removal CloudformationStackSet#retain_stacks_on_account_removal}.
         * @return {@code this}
         */
        public Builder retainStacksOnAccountRemoval(com.hashicorp.cdktf.IResolvable retainStacksOnAccountRemoval) {
            this.retainStacksOnAccountRemoval = retainStacksOnAccountRemoval;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudformationStackSetAutoDeployment}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudformationStackSetAutoDeployment build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudformationStackSetAutoDeployment}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudformationStackSetAutoDeployment {
        private final java.lang.Object enabled;
        private final java.lang.Object retainStacksOnAccountRemoval;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.retainStacksOnAccountRemoval = software.amazon.jsii.Kernel.get(this, "retainStacksOnAccountRemoval", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = builder.enabled;
            this.retainStacksOnAccountRemoval = builder.retainStacksOnAccountRemoval;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.Object getRetainStacksOnAccountRemoval() {
            return this.retainStacksOnAccountRemoval;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }
            if (this.getRetainStacksOnAccountRemoval() != null) {
                data.set("retainStacksOnAccountRemoval", om.valueToTree(this.getRetainStacksOnAccountRemoval()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudformationStackSet.CloudformationStackSetAutoDeployment"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudformationStackSetAutoDeployment.Jsii$Proxy that = (CloudformationStackSetAutoDeployment.Jsii$Proxy) o;

            if (this.enabled != null ? !this.enabled.equals(that.enabled) : that.enabled != null) return false;
            return this.retainStacksOnAccountRemoval != null ? this.retainStacksOnAccountRemoval.equals(that.retainStacksOnAccountRemoval) : that.retainStacksOnAccountRemoval == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled != null ? this.enabled.hashCode() : 0;
            result = 31 * result + (this.retainStacksOnAccountRemoval != null ? this.retainStacksOnAccountRemoval.hashCode() : 0);
            return result;
        }
    }
}
