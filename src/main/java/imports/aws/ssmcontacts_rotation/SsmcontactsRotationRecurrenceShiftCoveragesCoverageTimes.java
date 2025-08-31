package imports.aws.ssmcontacts_rotation;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.514Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes")
@software.amazon.jsii.Jsii.Proxy(SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes.Jsii$Proxy.class)
public interface SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes extends software.amazon.jsii.JsiiSerializable {

    /**
     * end block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#end SsmcontactsRotation#end}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnd() {
        return null;
    }

    /**
     * start block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#start SsmcontactsRotation#start}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStart() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes> {
        java.lang.Object end;
        java.lang.Object start;

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes#getEnd}
         * @param end end block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#end SsmcontactsRotation#end}
         * @return {@code this}
         */
        public Builder end(com.hashicorp.cdktf.IResolvable end) {
            this.end = end;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes#getEnd}
         * @param end end block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#end SsmcontactsRotation#end}
         * @return {@code this}
         */
        public Builder end(java.util.List<? extends imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesEnd> end) {
            this.end = end;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes#getStart}
         * @param start start block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#start SsmcontactsRotation#start}
         * @return {@code this}
         */
        public Builder start(com.hashicorp.cdktf.IResolvable start) {
            this.start = start;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes#getStart}
         * @param start start block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#start SsmcontactsRotation#start}
         * @return {@code this}
         */
        public Builder start(java.util.List<? extends imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimesStart> start) {
            this.start = start;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes {
        private final java.lang.Object end;
        private final java.lang.Object start;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.end = software.amazon.jsii.Kernel.get(this, "end", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.start = software.amazon.jsii.Kernel.get(this, "start", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.end = builder.end;
            this.start = builder.start;
        }

        @Override
        public final java.lang.Object getEnd() {
            return this.end;
        }

        @Override
        public final java.lang.Object getStart() {
            return this.start;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEnd() != null) {
                data.set("end", om.valueToTree(this.getEnd()));
            }
            if (this.getStart() != null) {
                data.set("start", om.valueToTree(this.getStart()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmcontactsRotation.SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes.Jsii$Proxy that = (SsmcontactsRotationRecurrenceShiftCoveragesCoverageTimes.Jsii$Proxy) o;

            if (this.end != null ? !this.end.equals(that.end) : that.end != null) return false;
            return this.start != null ? this.start.equals(that.start) : that.start == null;
        }

        @Override
        public final int hashCode() {
            int result = this.end != null ? this.end.hashCode() : 0;
            result = 31 * result + (this.start != null ? this.start.hashCode() : 0);
            return result;
        }
    }
}
