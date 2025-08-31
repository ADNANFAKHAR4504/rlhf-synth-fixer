package imports.aws.ssmcontacts_rotation;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.514Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceShiftCoverages")
@software.amazon.jsii.Jsii.Proxy(SsmcontactsRotationRecurrenceShiftCoverages.Jsii$Proxy.class)
public interface SsmcontactsRotationRecurrenceShiftCoverages extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#map_block_key SsmcontactsRotation#map_block_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMapBlockKey();

    /**
     * coverage_times block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#coverage_times SsmcontactsRotation#coverage_times}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCoverageTimes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmcontactsRotationRecurrenceShiftCoverages}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmcontactsRotationRecurrenceShiftCoverages}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmcontactsRotationRecurrenceShiftCoverages> {
        java.lang.String mapBlockKey;
        java.lang.Object coverageTimes;

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrenceShiftCoverages#getMapBlockKey}
         * @param mapBlockKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#map_block_key SsmcontactsRotation#map_block_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder mapBlockKey(java.lang.String mapBlockKey) {
            this.mapBlockKey = mapBlockKey;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrenceShiftCoverages#getCoverageTimes}
         * @param coverageTimes coverage_times block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#coverage_times SsmcontactsRotation#coverage_times}
         * @return {@code this}
         */
        public Builder coverageTimes(com.hashicorp.cdktf.IResolvable coverageTimes) {
            this.coverageTimes = coverageTimes;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrenceShiftCoverages#getCoverageTimes}
         * @param coverageTimes coverage_times block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#coverage_times SsmcontactsRotation#coverage_times}
         * @return {@code this}
         */
        public Builder coverageTimes(java.util.List<? extends imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes> coverageTimes) {
            this.coverageTimes = coverageTimes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmcontactsRotationRecurrenceShiftCoverages}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmcontactsRotationRecurrenceShiftCoverages build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmcontactsRotationRecurrenceShiftCoverages}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmcontactsRotationRecurrenceShiftCoverages {
        private final java.lang.String mapBlockKey;
        private final java.lang.Object coverageTimes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.mapBlockKey = software.amazon.jsii.Kernel.get(this, "mapBlockKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.coverageTimes = software.amazon.jsii.Kernel.get(this, "coverageTimes", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.mapBlockKey = java.util.Objects.requireNonNull(builder.mapBlockKey, "mapBlockKey is required");
            this.coverageTimes = builder.coverageTimes;
        }

        @Override
        public final java.lang.String getMapBlockKey() {
            return this.mapBlockKey;
        }

        @Override
        public final java.lang.Object getCoverageTimes() {
            return this.coverageTimes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("mapBlockKey", om.valueToTree(this.getMapBlockKey()));
            if (this.getCoverageTimes() != null) {
                data.set("coverageTimes", om.valueToTree(this.getCoverageTimes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceShiftCoverages"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmcontactsRotationRecurrenceShiftCoverages.Jsii$Proxy that = (SsmcontactsRotationRecurrenceShiftCoverages.Jsii$Proxy) o;

            if (!mapBlockKey.equals(that.mapBlockKey)) return false;
            return this.coverageTimes != null ? this.coverageTimes.equals(that.coverageTimes) : that.coverageTimes == null;
        }

        @Override
        public final int hashCode() {
            int result = this.mapBlockKey.hashCode();
            result = 31 * result + (this.coverageTimes != null ? this.coverageTimes.hashCode() : 0);
            return result;
        }
    }
}
