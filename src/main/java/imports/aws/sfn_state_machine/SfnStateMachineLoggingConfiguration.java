package imports.aws.sfn_state_machine;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.465Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sfnStateMachine.SfnStateMachineLoggingConfiguration")
@software.amazon.jsii.Jsii.Proxy(SfnStateMachineLoggingConfiguration.Jsii$Proxy.class)
public interface SfnStateMachineLoggingConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sfn_state_machine#include_execution_data SfnStateMachine#include_execution_data}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeExecutionData() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sfn_state_machine#level SfnStateMachine#level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLevel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sfn_state_machine#log_destination SfnStateMachine#log_destination}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogDestination() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SfnStateMachineLoggingConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SfnStateMachineLoggingConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SfnStateMachineLoggingConfiguration> {
        java.lang.Object includeExecutionData;
        java.lang.String level;
        java.lang.String logDestination;

        /**
         * Sets the value of {@link SfnStateMachineLoggingConfiguration#getIncludeExecutionData}
         * @param includeExecutionData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sfn_state_machine#include_execution_data SfnStateMachine#include_execution_data}.
         * @return {@code this}
         */
        public Builder includeExecutionData(java.lang.Boolean includeExecutionData) {
            this.includeExecutionData = includeExecutionData;
            return this;
        }

        /**
         * Sets the value of {@link SfnStateMachineLoggingConfiguration#getIncludeExecutionData}
         * @param includeExecutionData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sfn_state_machine#include_execution_data SfnStateMachine#include_execution_data}.
         * @return {@code this}
         */
        public Builder includeExecutionData(com.hashicorp.cdktf.IResolvable includeExecutionData) {
            this.includeExecutionData = includeExecutionData;
            return this;
        }

        /**
         * Sets the value of {@link SfnStateMachineLoggingConfiguration#getLevel}
         * @param level Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sfn_state_machine#level SfnStateMachine#level}.
         * @return {@code this}
         */
        public Builder level(java.lang.String level) {
            this.level = level;
            return this;
        }

        /**
         * Sets the value of {@link SfnStateMachineLoggingConfiguration#getLogDestination}
         * @param logDestination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sfn_state_machine#log_destination SfnStateMachine#log_destination}.
         * @return {@code this}
         */
        public Builder logDestination(java.lang.String logDestination) {
            this.logDestination = logDestination;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SfnStateMachineLoggingConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SfnStateMachineLoggingConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SfnStateMachineLoggingConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SfnStateMachineLoggingConfiguration {
        private final java.lang.Object includeExecutionData;
        private final java.lang.String level;
        private final java.lang.String logDestination;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.includeExecutionData = software.amazon.jsii.Kernel.get(this, "includeExecutionData", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.level = software.amazon.jsii.Kernel.get(this, "level", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logDestination = software.amazon.jsii.Kernel.get(this, "logDestination", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.includeExecutionData = builder.includeExecutionData;
            this.level = builder.level;
            this.logDestination = builder.logDestination;
        }

        @Override
        public final java.lang.Object getIncludeExecutionData() {
            return this.includeExecutionData;
        }

        @Override
        public final java.lang.String getLevel() {
            return this.level;
        }

        @Override
        public final java.lang.String getLogDestination() {
            return this.logDestination;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIncludeExecutionData() != null) {
                data.set("includeExecutionData", om.valueToTree(this.getIncludeExecutionData()));
            }
            if (this.getLevel() != null) {
                data.set("level", om.valueToTree(this.getLevel()));
            }
            if (this.getLogDestination() != null) {
                data.set("logDestination", om.valueToTree(this.getLogDestination()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sfnStateMachine.SfnStateMachineLoggingConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SfnStateMachineLoggingConfiguration.Jsii$Proxy that = (SfnStateMachineLoggingConfiguration.Jsii$Proxy) o;

            if (this.includeExecutionData != null ? !this.includeExecutionData.equals(that.includeExecutionData) : that.includeExecutionData != null) return false;
            if (this.level != null ? !this.level.equals(that.level) : that.level != null) return false;
            return this.logDestination != null ? this.logDestination.equals(that.logDestination) : that.logDestination == null;
        }

        @Override
        public final int hashCode() {
            int result = this.includeExecutionData != null ? this.includeExecutionData.hashCode() : 0;
            result = 31 * result + (this.level != null ? this.level.hashCode() : 0);
            result = 31 * result + (this.logDestination != null ? this.logDestination.hashCode() : 0);
            return result;
        }
    }
}
