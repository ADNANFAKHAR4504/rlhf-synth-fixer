package imports.aws.bedrockagent_agent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.151Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgent.BedrockagentAgentMemoryConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentAgentMemoryConfiguration.Jsii$Proxy.class)
public interface BedrockagentAgentMemoryConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#enabled_memory_types BedrockagentAgent#enabled_memory_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEnabledMemoryTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#storage_days BedrockagentAgent#storage_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getStorageDays() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentAgentMemoryConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentAgentMemoryConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentAgentMemoryConfiguration> {
        java.util.List<java.lang.String> enabledMemoryTypes;
        java.lang.Number storageDays;

        /**
         * Sets the value of {@link BedrockagentAgentMemoryConfiguration#getEnabledMemoryTypes}
         * @param enabledMemoryTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#enabled_memory_types BedrockagentAgent#enabled_memory_types}.
         * @return {@code this}
         */
        public Builder enabledMemoryTypes(java.util.List<java.lang.String> enabledMemoryTypes) {
            this.enabledMemoryTypes = enabledMemoryTypes;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentAgentMemoryConfiguration#getStorageDays}
         * @param storageDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_agent#storage_days BedrockagentAgent#storage_days}.
         * @return {@code this}
         */
        public Builder storageDays(java.lang.Number storageDays) {
            this.storageDays = storageDays;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentAgentMemoryConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentAgentMemoryConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentAgentMemoryConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentAgentMemoryConfiguration {
        private final java.util.List<java.lang.String> enabledMemoryTypes;
        private final java.lang.Number storageDays;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabledMemoryTypes = software.amazon.jsii.Kernel.get(this, "enabledMemoryTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.storageDays = software.amazon.jsii.Kernel.get(this, "storageDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabledMemoryTypes = builder.enabledMemoryTypes;
            this.storageDays = builder.storageDays;
        }

        @Override
        public final java.util.List<java.lang.String> getEnabledMemoryTypes() {
            return this.enabledMemoryTypes;
        }

        @Override
        public final java.lang.Number getStorageDays() {
            return this.storageDays;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEnabledMemoryTypes() != null) {
                data.set("enabledMemoryTypes", om.valueToTree(this.getEnabledMemoryTypes()));
            }
            if (this.getStorageDays() != null) {
                data.set("storageDays", om.valueToTree(this.getStorageDays()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentAgent.BedrockagentAgentMemoryConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentAgentMemoryConfiguration.Jsii$Proxy that = (BedrockagentAgentMemoryConfiguration.Jsii$Proxy) o;

            if (this.enabledMemoryTypes != null ? !this.enabledMemoryTypes.equals(that.enabledMemoryTypes) : that.enabledMemoryTypes != null) return false;
            return this.storageDays != null ? this.storageDays.equals(that.storageDays) : that.storageDays == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabledMemoryTypes != null ? this.enabledMemoryTypes.hashCode() : 0;
            result = 31 * result + (this.storageDays != null ? this.storageDays.hashCode() : 0);
            return result;
        }
    }
}
