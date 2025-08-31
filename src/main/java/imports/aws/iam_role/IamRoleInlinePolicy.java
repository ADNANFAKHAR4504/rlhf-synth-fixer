package imports.aws.iam_role;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.336Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iamRole.IamRoleInlinePolicy")
@software.amazon.jsii.Jsii.Proxy(IamRoleInlinePolicy.Jsii$Proxy.class)
public interface IamRoleInlinePolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#name IamRole#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#policy IamRole#policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPolicy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IamRoleInlinePolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IamRoleInlinePolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IamRoleInlinePolicy> {
        java.lang.String name;
        java.lang.String policy;

        /**
         * Sets the value of {@link IamRoleInlinePolicy#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#name IamRole#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link IamRoleInlinePolicy#getPolicy}
         * @param policy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iam_role#policy IamRole#policy}.
         * @return {@code this}
         */
        public Builder policy(java.lang.String policy) {
            this.policy = policy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IamRoleInlinePolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IamRoleInlinePolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IamRoleInlinePolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IamRoleInlinePolicy {
        private final java.lang.String name;
        private final java.lang.String policy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.policy = software.amazon.jsii.Kernel.get(this, "policy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = builder.name;
            this.policy = builder.policy;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getPolicy() {
            return this.policy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getPolicy() != null) {
                data.set("policy", om.valueToTree(this.getPolicy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.iamRole.IamRoleInlinePolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IamRoleInlinePolicy.Jsii$Proxy that = (IamRoleInlinePolicy.Jsii$Proxy) o;

            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            return this.policy != null ? this.policy.equals(that.policy) : that.policy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name != null ? this.name.hashCode() : 0;
            result = 31 * result + (this.policy != null ? this.policy.hashCode() : 0);
            return result;
        }
    }
}
