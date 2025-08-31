package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.016Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowTriggerConfigTriggerProperties")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowTriggerConfigTriggerProperties.Jsii$Proxy.class)
public interface AppflowFlowTriggerConfigTriggerProperties extends software.amazon.jsii.JsiiSerializable {

    /**
     * scheduled block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#scheduled AppflowFlow#scheduled}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowTriggerConfigTriggerPropertiesScheduled getScheduled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppflowFlowTriggerConfigTriggerProperties}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowTriggerConfigTriggerProperties}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowTriggerConfigTriggerProperties> {
        imports.aws.appflow_flow.AppflowFlowTriggerConfigTriggerPropertiesScheduled scheduled;

        /**
         * Sets the value of {@link AppflowFlowTriggerConfigTriggerProperties#getScheduled}
         * @param scheduled scheduled block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#scheduled AppflowFlow#scheduled}
         * @return {@code this}
         */
        public Builder scheduled(imports.aws.appflow_flow.AppflowFlowTriggerConfigTriggerPropertiesScheduled scheduled) {
            this.scheduled = scheduled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowTriggerConfigTriggerProperties}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowTriggerConfigTriggerProperties build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowTriggerConfigTriggerProperties}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowTriggerConfigTriggerProperties {
        private final imports.aws.appflow_flow.AppflowFlowTriggerConfigTriggerPropertiesScheduled scheduled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.scheduled = software.amazon.jsii.Kernel.get(this, "scheduled", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowTriggerConfigTriggerPropertiesScheduled.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.scheduled = builder.scheduled;
        }

        @Override
        public final imports.aws.appflow_flow.AppflowFlowTriggerConfigTriggerPropertiesScheduled getScheduled() {
            return this.scheduled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getScheduled() != null) {
                data.set("scheduled", om.valueToTree(this.getScheduled()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowTriggerConfigTriggerProperties"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowTriggerConfigTriggerProperties.Jsii$Proxy that = (AppflowFlowTriggerConfigTriggerProperties.Jsii$Proxy) o;

            return this.scheduled != null ? this.scheduled.equals(that.scheduled) : that.scheduled == null;
        }

        @Override
        public final int hashCode() {
            int result = this.scheduled != null ? this.scheduled.hashCode() : 0;
            return result;
        }
    }
}
