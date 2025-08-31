package imports.aws.appmesh_virtual_node;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.044Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualNode.AppmeshVirtualNodeSpecListenerOutlierDetection")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualNodeSpecListenerOutlierDetection.Jsii$Proxy.class)
public interface AppmeshVirtualNodeSpecListenerOutlierDetection extends software.amazon.jsii.JsiiSerializable {

    /**
     * base_ejection_duration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#base_ejection_duration AppmeshVirtualNode#base_ejection_duration}
     */
    @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetectionBaseEjectionDuration getBaseEjectionDuration();

    /**
     * interval block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#interval AppmeshVirtualNode#interval}
     */
    @org.jetbrains.annotations.NotNull imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetectionInterval getInterval();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#max_ejection_percent AppmeshVirtualNode#max_ejection_percent}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxEjectionPercent();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#max_server_errors AppmeshVirtualNode#max_server_errors}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxServerErrors();

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualNodeSpecListenerOutlierDetection}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualNodeSpecListenerOutlierDetection}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualNodeSpecListenerOutlierDetection> {
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetectionBaseEjectionDuration baseEjectionDuration;
        imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetectionInterval interval;
        java.lang.Number maxEjectionPercent;
        java.lang.Number maxServerErrors;

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListenerOutlierDetection#getBaseEjectionDuration}
         * @param baseEjectionDuration base_ejection_duration block. This parameter is required.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#base_ejection_duration AppmeshVirtualNode#base_ejection_duration}
         * @return {@code this}
         */
        public Builder baseEjectionDuration(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetectionBaseEjectionDuration baseEjectionDuration) {
            this.baseEjectionDuration = baseEjectionDuration;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListenerOutlierDetection#getInterval}
         * @param interval interval block. This parameter is required.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#interval AppmeshVirtualNode#interval}
         * @return {@code this}
         */
        public Builder interval(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetectionInterval interval) {
            this.interval = interval;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListenerOutlierDetection#getMaxEjectionPercent}
         * @param maxEjectionPercent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#max_ejection_percent AppmeshVirtualNode#max_ejection_percent}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxEjectionPercent(java.lang.Number maxEjectionPercent) {
            this.maxEjectionPercent = maxEjectionPercent;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecListenerOutlierDetection#getMaxServerErrors}
         * @param maxServerErrors Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#max_server_errors AppmeshVirtualNode#max_server_errors}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxServerErrors(java.lang.Number maxServerErrors) {
            this.maxServerErrors = maxServerErrors;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualNodeSpecListenerOutlierDetection}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualNodeSpecListenerOutlierDetection build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualNodeSpecListenerOutlierDetection}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualNodeSpecListenerOutlierDetection {
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetectionBaseEjectionDuration baseEjectionDuration;
        private final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetectionInterval interval;
        private final java.lang.Number maxEjectionPercent;
        private final java.lang.Number maxServerErrors;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.baseEjectionDuration = software.amazon.jsii.Kernel.get(this, "baseEjectionDuration", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetectionBaseEjectionDuration.class));
            this.interval = software.amazon.jsii.Kernel.get(this, "interval", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetectionInterval.class));
            this.maxEjectionPercent = software.amazon.jsii.Kernel.get(this, "maxEjectionPercent", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maxServerErrors = software.amazon.jsii.Kernel.get(this, "maxServerErrors", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.baseEjectionDuration = java.util.Objects.requireNonNull(builder.baseEjectionDuration, "baseEjectionDuration is required");
            this.interval = java.util.Objects.requireNonNull(builder.interval, "interval is required");
            this.maxEjectionPercent = java.util.Objects.requireNonNull(builder.maxEjectionPercent, "maxEjectionPercent is required");
            this.maxServerErrors = java.util.Objects.requireNonNull(builder.maxServerErrors, "maxServerErrors is required");
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetectionBaseEjectionDuration getBaseEjectionDuration() {
            return this.baseEjectionDuration;
        }

        @Override
        public final imports.aws.appmesh_virtual_node.AppmeshVirtualNodeSpecListenerOutlierDetectionInterval getInterval() {
            return this.interval;
        }

        @Override
        public final java.lang.Number getMaxEjectionPercent() {
            return this.maxEjectionPercent;
        }

        @Override
        public final java.lang.Number getMaxServerErrors() {
            return this.maxServerErrors;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("baseEjectionDuration", om.valueToTree(this.getBaseEjectionDuration()));
            data.set("interval", om.valueToTree(this.getInterval()));
            data.set("maxEjectionPercent", om.valueToTree(this.getMaxEjectionPercent()));
            data.set("maxServerErrors", om.valueToTree(this.getMaxServerErrors()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualNode.AppmeshVirtualNodeSpecListenerOutlierDetection"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualNodeSpecListenerOutlierDetection.Jsii$Proxy that = (AppmeshVirtualNodeSpecListenerOutlierDetection.Jsii$Proxy) o;

            if (!baseEjectionDuration.equals(that.baseEjectionDuration)) return false;
            if (!interval.equals(that.interval)) return false;
            if (!maxEjectionPercent.equals(that.maxEjectionPercent)) return false;
            return this.maxServerErrors.equals(that.maxServerErrors);
        }

        @Override
        public final int hashCode() {
            int result = this.baseEjectionDuration.hashCode();
            result = 31 * result + (this.interval.hashCode());
            result = 31 * result + (this.maxEjectionPercent.hashCode());
            result = 31 * result + (this.maxServerErrors.hashCode());
            return result;
        }
    }
}
