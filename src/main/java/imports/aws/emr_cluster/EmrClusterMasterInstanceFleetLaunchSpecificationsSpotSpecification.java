package imports.aws.emr_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.198Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrCluster.EmrClusterMasterInstanceFleetLaunchSpecificationsSpotSpecification")
@software.amazon.jsii.Jsii.Proxy(EmrClusterMasterInstanceFleetLaunchSpecificationsSpotSpecification.Jsii$Proxy.class)
public interface EmrClusterMasterInstanceFleetLaunchSpecificationsSpotSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#allocation_strategy EmrCluster#allocation_strategy}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAllocationStrategy();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#timeout_action EmrCluster#timeout_action}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTimeoutAction();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#timeout_duration_minutes EmrCluster#timeout_duration_minutes}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getTimeoutDurationMinutes();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#block_duration_minutes EmrCluster#block_duration_minutes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBlockDurationMinutes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrClusterMasterInstanceFleetLaunchSpecificationsSpotSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrClusterMasterInstanceFleetLaunchSpecificationsSpotSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrClusterMasterInstanceFleetLaunchSpecificationsSpotSpecification> {
        java.lang.String allocationStrategy;
        java.lang.String timeoutAction;
        java.lang.Number timeoutDurationMinutes;
        java.lang.Number blockDurationMinutes;

        /**
         * Sets the value of {@link EmrClusterMasterInstanceFleetLaunchSpecificationsSpotSpecification#getAllocationStrategy}
         * @param allocationStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#allocation_strategy EmrCluster#allocation_strategy}. This parameter is required.
         * @return {@code this}
         */
        public Builder allocationStrategy(java.lang.String allocationStrategy) {
            this.allocationStrategy = allocationStrategy;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterMasterInstanceFleetLaunchSpecificationsSpotSpecification#getTimeoutAction}
         * @param timeoutAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#timeout_action EmrCluster#timeout_action}. This parameter is required.
         * @return {@code this}
         */
        public Builder timeoutAction(java.lang.String timeoutAction) {
            this.timeoutAction = timeoutAction;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterMasterInstanceFleetLaunchSpecificationsSpotSpecification#getTimeoutDurationMinutes}
         * @param timeoutDurationMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#timeout_duration_minutes EmrCluster#timeout_duration_minutes}. This parameter is required.
         * @return {@code this}
         */
        public Builder timeoutDurationMinutes(java.lang.Number timeoutDurationMinutes) {
            this.timeoutDurationMinutes = timeoutDurationMinutes;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterMasterInstanceFleetLaunchSpecificationsSpotSpecification#getBlockDurationMinutes}
         * @param blockDurationMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#block_duration_minutes EmrCluster#block_duration_minutes}.
         * @return {@code this}
         */
        public Builder blockDurationMinutes(java.lang.Number blockDurationMinutes) {
            this.blockDurationMinutes = blockDurationMinutes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrClusterMasterInstanceFleetLaunchSpecificationsSpotSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrClusterMasterInstanceFleetLaunchSpecificationsSpotSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrClusterMasterInstanceFleetLaunchSpecificationsSpotSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrClusterMasterInstanceFleetLaunchSpecificationsSpotSpecification {
        private final java.lang.String allocationStrategy;
        private final java.lang.String timeoutAction;
        private final java.lang.Number timeoutDurationMinutes;
        private final java.lang.Number blockDurationMinutes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.allocationStrategy = software.amazon.jsii.Kernel.get(this, "allocationStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeoutAction = software.amazon.jsii.Kernel.get(this, "timeoutAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeoutDurationMinutes = software.amazon.jsii.Kernel.get(this, "timeoutDurationMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.blockDurationMinutes = software.amazon.jsii.Kernel.get(this, "blockDurationMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.allocationStrategy = java.util.Objects.requireNonNull(builder.allocationStrategy, "allocationStrategy is required");
            this.timeoutAction = java.util.Objects.requireNonNull(builder.timeoutAction, "timeoutAction is required");
            this.timeoutDurationMinutes = java.util.Objects.requireNonNull(builder.timeoutDurationMinutes, "timeoutDurationMinutes is required");
            this.blockDurationMinutes = builder.blockDurationMinutes;
        }

        @Override
        public final java.lang.String getAllocationStrategy() {
            return this.allocationStrategy;
        }

        @Override
        public final java.lang.String getTimeoutAction() {
            return this.timeoutAction;
        }

        @Override
        public final java.lang.Number getTimeoutDurationMinutes() {
            return this.timeoutDurationMinutes;
        }

        @Override
        public final java.lang.Number getBlockDurationMinutes() {
            return this.blockDurationMinutes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("allocationStrategy", om.valueToTree(this.getAllocationStrategy()));
            data.set("timeoutAction", om.valueToTree(this.getTimeoutAction()));
            data.set("timeoutDurationMinutes", om.valueToTree(this.getTimeoutDurationMinutes()));
            if (this.getBlockDurationMinutes() != null) {
                data.set("blockDurationMinutes", om.valueToTree(this.getBlockDurationMinutes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrCluster.EmrClusterMasterInstanceFleetLaunchSpecificationsSpotSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrClusterMasterInstanceFleetLaunchSpecificationsSpotSpecification.Jsii$Proxy that = (EmrClusterMasterInstanceFleetLaunchSpecificationsSpotSpecification.Jsii$Proxy) o;

            if (!allocationStrategy.equals(that.allocationStrategy)) return false;
            if (!timeoutAction.equals(that.timeoutAction)) return false;
            if (!timeoutDurationMinutes.equals(that.timeoutDurationMinutes)) return false;
            return this.blockDurationMinutes != null ? this.blockDurationMinutes.equals(that.blockDurationMinutes) : that.blockDurationMinutes == null;
        }

        @Override
        public final int hashCode() {
            int result = this.allocationStrategy.hashCode();
            result = 31 * result + (this.timeoutAction.hashCode());
            result = 31 * result + (this.timeoutDurationMinutes.hashCode());
            result = 31 * result + (this.blockDurationMinutes != null ? this.blockDurationMinutes.hashCode() : 0);
            return result;
        }
    }
}
