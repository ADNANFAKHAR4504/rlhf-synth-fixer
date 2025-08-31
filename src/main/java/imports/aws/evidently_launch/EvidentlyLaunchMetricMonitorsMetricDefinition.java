package imports.aws.evidently_launch;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.214Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.evidentlyLaunch.EvidentlyLaunchMetricMonitorsMetricDefinition")
@software.amazon.jsii.Jsii.Proxy(EvidentlyLaunchMetricMonitorsMetricDefinition.Jsii$Proxy.class)
public interface EvidentlyLaunchMetricMonitorsMetricDefinition extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#entity_id_key EvidentlyLaunch#entity_id_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEntityIdKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#name EvidentlyLaunch#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#value_key EvidentlyLaunch#value_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getValueKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#event_pattern EvidentlyLaunch#event_pattern}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEventPattern() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#unit_label EvidentlyLaunch#unit_label}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUnitLabel() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EvidentlyLaunchMetricMonitorsMetricDefinition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EvidentlyLaunchMetricMonitorsMetricDefinition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EvidentlyLaunchMetricMonitorsMetricDefinition> {
        java.lang.String entityIdKey;
        java.lang.String name;
        java.lang.String valueKey;
        java.lang.String eventPattern;
        java.lang.String unitLabel;

        /**
         * Sets the value of {@link EvidentlyLaunchMetricMonitorsMetricDefinition#getEntityIdKey}
         * @param entityIdKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#entity_id_key EvidentlyLaunch#entity_id_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder entityIdKey(java.lang.String entityIdKey) {
            this.entityIdKey = entityIdKey;
            return this;
        }

        /**
         * Sets the value of {@link EvidentlyLaunchMetricMonitorsMetricDefinition#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#name EvidentlyLaunch#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link EvidentlyLaunchMetricMonitorsMetricDefinition#getValueKey}
         * @param valueKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#value_key EvidentlyLaunch#value_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder valueKey(java.lang.String valueKey) {
            this.valueKey = valueKey;
            return this;
        }

        /**
         * Sets the value of {@link EvidentlyLaunchMetricMonitorsMetricDefinition#getEventPattern}
         * @param eventPattern Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#event_pattern EvidentlyLaunch#event_pattern}.
         * @return {@code this}
         */
        public Builder eventPattern(java.lang.String eventPattern) {
            this.eventPattern = eventPattern;
            return this;
        }

        /**
         * Sets the value of {@link EvidentlyLaunchMetricMonitorsMetricDefinition#getUnitLabel}
         * @param unitLabel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#unit_label EvidentlyLaunch#unit_label}.
         * @return {@code this}
         */
        public Builder unitLabel(java.lang.String unitLabel) {
            this.unitLabel = unitLabel;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EvidentlyLaunchMetricMonitorsMetricDefinition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EvidentlyLaunchMetricMonitorsMetricDefinition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EvidentlyLaunchMetricMonitorsMetricDefinition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EvidentlyLaunchMetricMonitorsMetricDefinition {
        private final java.lang.String entityIdKey;
        private final java.lang.String name;
        private final java.lang.String valueKey;
        private final java.lang.String eventPattern;
        private final java.lang.String unitLabel;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.entityIdKey = software.amazon.jsii.Kernel.get(this, "entityIdKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.valueKey = software.amazon.jsii.Kernel.get(this, "valueKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.eventPattern = software.amazon.jsii.Kernel.get(this, "eventPattern", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.unitLabel = software.amazon.jsii.Kernel.get(this, "unitLabel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.entityIdKey = java.util.Objects.requireNonNull(builder.entityIdKey, "entityIdKey is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.valueKey = java.util.Objects.requireNonNull(builder.valueKey, "valueKey is required");
            this.eventPattern = builder.eventPattern;
            this.unitLabel = builder.unitLabel;
        }

        @Override
        public final java.lang.String getEntityIdKey() {
            return this.entityIdKey;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getValueKey() {
            return this.valueKey;
        }

        @Override
        public final java.lang.String getEventPattern() {
            return this.eventPattern;
        }

        @Override
        public final java.lang.String getUnitLabel() {
            return this.unitLabel;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("entityIdKey", om.valueToTree(this.getEntityIdKey()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("valueKey", om.valueToTree(this.getValueKey()));
            if (this.getEventPattern() != null) {
                data.set("eventPattern", om.valueToTree(this.getEventPattern()));
            }
            if (this.getUnitLabel() != null) {
                data.set("unitLabel", om.valueToTree(this.getUnitLabel()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.evidentlyLaunch.EvidentlyLaunchMetricMonitorsMetricDefinition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EvidentlyLaunchMetricMonitorsMetricDefinition.Jsii$Proxy that = (EvidentlyLaunchMetricMonitorsMetricDefinition.Jsii$Proxy) o;

            if (!entityIdKey.equals(that.entityIdKey)) return false;
            if (!name.equals(that.name)) return false;
            if (!valueKey.equals(that.valueKey)) return false;
            if (this.eventPattern != null ? !this.eventPattern.equals(that.eventPattern) : that.eventPattern != null) return false;
            return this.unitLabel != null ? this.unitLabel.equals(that.unitLabel) : that.unitLabel == null;
        }

        @Override
        public final int hashCode() {
            int result = this.entityIdKey.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.valueKey.hashCode());
            result = 31 * result + (this.eventPattern != null ? this.eventPattern.hashCode() : 0);
            result = 31 * result + (this.unitLabel != null ? this.unitLabel.hashCode() : 0);
            return result;
        }
    }
}
