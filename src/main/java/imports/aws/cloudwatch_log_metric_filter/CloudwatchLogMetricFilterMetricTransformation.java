package imports.aws.cloudwatch_log_metric_filter;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.288Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchLogMetricFilter.CloudwatchLogMetricFilterMetricTransformation")
@software.amazon.jsii.Jsii.Proxy(CloudwatchLogMetricFilterMetricTransformation.Jsii$Proxy.class)
public interface CloudwatchLogMetricFilterMetricTransformation extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_metric_filter#name CloudwatchLogMetricFilter#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_metric_filter#namespace CloudwatchLogMetricFilter#namespace}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNamespace();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_metric_filter#value CloudwatchLogMetricFilter#value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getValue();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_metric_filter#default_value CloudwatchLogMetricFilter#default_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultValue() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_metric_filter#dimensions CloudwatchLogMetricFilter#dimensions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getDimensions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_metric_filter#unit CloudwatchLogMetricFilter#unit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUnit() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudwatchLogMetricFilterMetricTransformation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchLogMetricFilterMetricTransformation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchLogMetricFilterMetricTransformation> {
        java.lang.String name;
        java.lang.String namespace;
        java.lang.String value;
        java.lang.String defaultValue;
        java.util.Map<java.lang.String, java.lang.String> dimensions;
        java.lang.String unit;

        /**
         * Sets the value of {@link CloudwatchLogMetricFilterMetricTransformation#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_metric_filter#name CloudwatchLogMetricFilter#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogMetricFilterMetricTransformation#getNamespace}
         * @param namespace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_metric_filter#namespace CloudwatchLogMetricFilter#namespace}. This parameter is required.
         * @return {@code this}
         */
        public Builder namespace(java.lang.String namespace) {
            this.namespace = namespace;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogMetricFilterMetricTransformation#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_metric_filter#value CloudwatchLogMetricFilter#value}. This parameter is required.
         * @return {@code this}
         */
        public Builder value(java.lang.String value) {
            this.value = value;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogMetricFilterMetricTransformation#getDefaultValue}
         * @param defaultValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_metric_filter#default_value CloudwatchLogMetricFilter#default_value}.
         * @return {@code this}
         */
        public Builder defaultValue(java.lang.String defaultValue) {
            this.defaultValue = defaultValue;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogMetricFilterMetricTransformation#getDimensions}
         * @param dimensions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_metric_filter#dimensions CloudwatchLogMetricFilter#dimensions}.
         * @return {@code this}
         */
        public Builder dimensions(java.util.Map<java.lang.String, java.lang.String> dimensions) {
            this.dimensions = dimensions;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchLogMetricFilterMetricTransformation#getUnit}
         * @param unit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_log_metric_filter#unit CloudwatchLogMetricFilter#unit}.
         * @return {@code this}
         */
        public Builder unit(java.lang.String unit) {
            this.unit = unit;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchLogMetricFilterMetricTransformation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchLogMetricFilterMetricTransformation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchLogMetricFilterMetricTransformation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchLogMetricFilterMetricTransformation {
        private final java.lang.String name;
        private final java.lang.String namespace;
        private final java.lang.String value;
        private final java.lang.String defaultValue;
        private final java.util.Map<java.lang.String, java.lang.String> dimensions;
        private final java.lang.String unit;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.namespace = software.amazon.jsii.Kernel.get(this, "namespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultValue = software.amazon.jsii.Kernel.get(this, "defaultValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dimensions = software.amazon.jsii.Kernel.get(this, "dimensions", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.unit = software.amazon.jsii.Kernel.get(this, "unit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.namespace = java.util.Objects.requireNonNull(builder.namespace, "namespace is required");
            this.value = java.util.Objects.requireNonNull(builder.value, "value is required");
            this.defaultValue = builder.defaultValue;
            this.dimensions = builder.dimensions;
            this.unit = builder.unit;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getNamespace() {
            return this.namespace;
        }

        @Override
        public final java.lang.String getValue() {
            return this.value;
        }

        @Override
        public final java.lang.String getDefaultValue() {
            return this.defaultValue;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getDimensions() {
            return this.dimensions;
        }

        @Override
        public final java.lang.String getUnit() {
            return this.unit;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("namespace", om.valueToTree(this.getNamespace()));
            data.set("value", om.valueToTree(this.getValue()));
            if (this.getDefaultValue() != null) {
                data.set("defaultValue", om.valueToTree(this.getDefaultValue()));
            }
            if (this.getDimensions() != null) {
                data.set("dimensions", om.valueToTree(this.getDimensions()));
            }
            if (this.getUnit() != null) {
                data.set("unit", om.valueToTree(this.getUnit()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchLogMetricFilter.CloudwatchLogMetricFilterMetricTransformation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchLogMetricFilterMetricTransformation.Jsii$Proxy that = (CloudwatchLogMetricFilterMetricTransformation.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!namespace.equals(that.namespace)) return false;
            if (!value.equals(that.value)) return false;
            if (this.defaultValue != null ? !this.defaultValue.equals(that.defaultValue) : that.defaultValue != null) return false;
            if (this.dimensions != null ? !this.dimensions.equals(that.dimensions) : that.dimensions != null) return false;
            return this.unit != null ? this.unit.equals(that.unit) : that.unit == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.namespace.hashCode());
            result = 31 * result + (this.value.hashCode());
            result = 31 * result + (this.defaultValue != null ? this.defaultValue.hashCode() : 0);
            result = 31 * result + (this.dimensions != null ? this.dimensions.hashCode() : 0);
            result = 31 * result + (this.unit != null ? this.unit.hashCode() : 0);
            return result;
        }
    }
}
