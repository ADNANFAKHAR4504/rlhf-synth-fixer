package imports.aws.codebuild_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.298Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildFleet.CodebuildFleetScalingConfigurationTargetTrackingScalingConfigs")
@software.amazon.jsii.Jsii.Proxy(CodebuildFleetScalingConfigurationTargetTrackingScalingConfigs.Jsii$Proxy.class)
public interface CodebuildFleetScalingConfigurationTargetTrackingScalingConfigs extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#metric_type CodebuildFleet#metric_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMetricType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#target_value CodebuildFleet#target_value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTargetValue() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodebuildFleetScalingConfigurationTargetTrackingScalingConfigs}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodebuildFleetScalingConfigurationTargetTrackingScalingConfigs}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodebuildFleetScalingConfigurationTargetTrackingScalingConfigs> {
        java.lang.String metricType;
        java.lang.Number targetValue;

        /**
         * Sets the value of {@link CodebuildFleetScalingConfigurationTargetTrackingScalingConfigs#getMetricType}
         * @param metricType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#metric_type CodebuildFleet#metric_type}.
         * @return {@code this}
         */
        public Builder metricType(java.lang.String metricType) {
            this.metricType = metricType;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetScalingConfigurationTargetTrackingScalingConfigs#getTargetValue}
         * @param targetValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#target_value CodebuildFleet#target_value}.
         * @return {@code this}
         */
        public Builder targetValue(java.lang.Number targetValue) {
            this.targetValue = targetValue;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodebuildFleetScalingConfigurationTargetTrackingScalingConfigs}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodebuildFleetScalingConfigurationTargetTrackingScalingConfigs build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodebuildFleetScalingConfigurationTargetTrackingScalingConfigs}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodebuildFleetScalingConfigurationTargetTrackingScalingConfigs {
        private final java.lang.String metricType;
        private final java.lang.Number targetValue;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.metricType = software.amazon.jsii.Kernel.get(this, "metricType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetValue = software.amazon.jsii.Kernel.get(this, "targetValue", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.metricType = builder.metricType;
            this.targetValue = builder.targetValue;
        }

        @Override
        public final java.lang.String getMetricType() {
            return this.metricType;
        }

        @Override
        public final java.lang.Number getTargetValue() {
            return this.targetValue;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMetricType() != null) {
                data.set("metricType", om.valueToTree(this.getMetricType()));
            }
            if (this.getTargetValue() != null) {
                data.set("targetValue", om.valueToTree(this.getTargetValue()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codebuildFleet.CodebuildFleetScalingConfigurationTargetTrackingScalingConfigs"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodebuildFleetScalingConfigurationTargetTrackingScalingConfigs.Jsii$Proxy that = (CodebuildFleetScalingConfigurationTargetTrackingScalingConfigs.Jsii$Proxy) o;

            if (this.metricType != null ? !this.metricType.equals(that.metricType) : that.metricType != null) return false;
            return this.targetValue != null ? this.targetValue.equals(that.targetValue) : that.targetValue == null;
        }

        @Override
        public final int hashCode() {
            int result = this.metricType != null ? this.metricType.hashCode() : 0;
            result = 31 * result + (this.targetValue != null ? this.targetValue.hashCode() : 0);
            return result;
        }
    }
}
