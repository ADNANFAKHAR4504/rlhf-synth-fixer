package imports.aws.data_aws_ecs_task_execution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.631Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsEcsTaskExecution.DataAwsEcsTaskExecutionPlacementStrategy")
@software.amazon.jsii.Jsii.Proxy(DataAwsEcsTaskExecutionPlacementStrategy.Jsii$Proxy.class)
public interface DataAwsEcsTaskExecutionPlacementStrategy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#type DataAwsEcsTaskExecution#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#field DataAwsEcsTaskExecution#field}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getField() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsEcsTaskExecutionPlacementStrategy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsEcsTaskExecutionPlacementStrategy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsEcsTaskExecutionPlacementStrategy> {
        java.lang.String type;
        java.lang.String field;

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionPlacementStrategy#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#type DataAwsEcsTaskExecution#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEcsTaskExecutionPlacementStrategy#getField}
         * @param field Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ecs_task_execution#field DataAwsEcsTaskExecution#field}.
         * @return {@code this}
         */
        public Builder field(java.lang.String field) {
            this.field = field;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsEcsTaskExecutionPlacementStrategy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsEcsTaskExecutionPlacementStrategy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsEcsTaskExecutionPlacementStrategy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsEcsTaskExecutionPlacementStrategy {
        private final java.lang.String type;
        private final java.lang.String field;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.field = software.amazon.jsii.Kernel.get(this, "field", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.field = builder.field;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getField() {
            return this.field;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getField() != null) {
                data.set("field", om.valueToTree(this.getField()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsEcsTaskExecution.DataAwsEcsTaskExecutionPlacementStrategy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsEcsTaskExecutionPlacementStrategy.Jsii$Proxy that = (DataAwsEcsTaskExecutionPlacementStrategy.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            return this.field != null ? this.field.equals(that.field) : that.field == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.field != null ? this.field.hashCode() : 0);
            return result;
        }
    }
}
