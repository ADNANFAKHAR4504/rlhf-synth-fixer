package imports.aws.glue_trigger;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.306Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueTrigger.GlueTriggerEventBatchingCondition")
@software.amazon.jsii.Jsii.Proxy(GlueTriggerEventBatchingCondition.Jsii$Proxy.class)
public interface GlueTriggerEventBatchingCondition extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#batch_size GlueTrigger#batch_size}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getBatchSize();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#batch_window GlueTrigger#batch_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBatchWindow() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueTriggerEventBatchingCondition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueTriggerEventBatchingCondition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueTriggerEventBatchingCondition> {
        java.lang.Number batchSize;
        java.lang.Number batchWindow;

        /**
         * Sets the value of {@link GlueTriggerEventBatchingCondition#getBatchSize}
         * @param batchSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#batch_size GlueTrigger#batch_size}. This parameter is required.
         * @return {@code this}
         */
        public Builder batchSize(java.lang.Number batchSize) {
            this.batchSize = batchSize;
            return this;
        }

        /**
         * Sets the value of {@link GlueTriggerEventBatchingCondition#getBatchWindow}
         * @param batchWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#batch_window GlueTrigger#batch_window}.
         * @return {@code this}
         */
        public Builder batchWindow(java.lang.Number batchWindow) {
            this.batchWindow = batchWindow;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueTriggerEventBatchingCondition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueTriggerEventBatchingCondition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueTriggerEventBatchingCondition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueTriggerEventBatchingCondition {
        private final java.lang.Number batchSize;
        private final java.lang.Number batchWindow;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.batchSize = software.amazon.jsii.Kernel.get(this, "batchSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.batchWindow = software.amazon.jsii.Kernel.get(this, "batchWindow", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.batchSize = java.util.Objects.requireNonNull(builder.batchSize, "batchSize is required");
            this.batchWindow = builder.batchWindow;
        }

        @Override
        public final java.lang.Number getBatchSize() {
            return this.batchSize;
        }

        @Override
        public final java.lang.Number getBatchWindow() {
            return this.batchWindow;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("batchSize", om.valueToTree(this.getBatchSize()));
            if (this.getBatchWindow() != null) {
                data.set("batchWindow", om.valueToTree(this.getBatchWindow()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueTrigger.GlueTriggerEventBatchingCondition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueTriggerEventBatchingCondition.Jsii$Proxy that = (GlueTriggerEventBatchingCondition.Jsii$Proxy) o;

            if (!batchSize.equals(that.batchSize)) return false;
            return this.batchWindow != null ? this.batchWindow.equals(that.batchWindow) : that.batchWindow == null;
        }

        @Override
        public final int hashCode() {
            int result = this.batchSize.hashCode();
            result = 31 * result + (this.batchWindow != null ? this.batchWindow.hashCode() : 0);
            return result;
        }
    }
}
