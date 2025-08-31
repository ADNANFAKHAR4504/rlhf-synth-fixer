package imports.aws.cloudformation_stack_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.221Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudformationStackSet.CloudformationStackSetManagedExecution")
@software.amazon.jsii.Jsii.Proxy(CloudformationStackSetManagedExecution.Jsii$Proxy.class)
public interface CloudformationStackSetManagedExecution extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#active CloudformationStackSet#active}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getActive() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudformationStackSetManagedExecution}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudformationStackSetManagedExecution}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudformationStackSetManagedExecution> {
        java.lang.Object active;

        /**
         * Sets the value of {@link CloudformationStackSetManagedExecution#getActive}
         * @param active Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#active CloudformationStackSet#active}.
         * @return {@code this}
         */
        public Builder active(java.lang.Boolean active) {
            this.active = active;
            return this;
        }

        /**
         * Sets the value of {@link CloudformationStackSetManagedExecution#getActive}
         * @param active Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudformation_stack_set#active CloudformationStackSet#active}.
         * @return {@code this}
         */
        public Builder active(com.hashicorp.cdktf.IResolvable active) {
            this.active = active;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudformationStackSetManagedExecution}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudformationStackSetManagedExecution build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudformationStackSetManagedExecution}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudformationStackSetManagedExecution {
        private final java.lang.Object active;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.active = software.amazon.jsii.Kernel.get(this, "active", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.active = builder.active;
        }

        @Override
        public final java.lang.Object getActive() {
            return this.active;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getActive() != null) {
                data.set("active", om.valueToTree(this.getActive()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudformationStackSet.CloudformationStackSetManagedExecution"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudformationStackSetManagedExecution.Jsii$Proxy that = (CloudformationStackSetManagedExecution.Jsii$Proxy) o;

            return this.active != null ? this.active.equals(that.active) : that.active == null;
        }

        @Override
        public final int hashCode() {
            int result = this.active != null ? this.active.hashCode() : 0;
            return result;
        }
    }
}
