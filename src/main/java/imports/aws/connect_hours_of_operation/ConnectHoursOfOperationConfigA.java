package imports.aws.connect_hours_of_operation;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.384Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectHoursOfOperation.ConnectHoursOfOperationConfigA")
@software.amazon.jsii.Jsii.Proxy(ConnectHoursOfOperationConfigA.Jsii$Proxy.class)
public interface ConnectHoursOfOperationConfigA extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_hours_of_operation#day ConnectHoursOfOperation#day}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDay();

    /**
     * end_time block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_hours_of_operation#end_time ConnectHoursOfOperation#end_time}
     */
    @org.jetbrains.annotations.NotNull imports.aws.connect_hours_of_operation.ConnectHoursOfOperationConfigEndTime getEndTime();

    /**
     * start_time block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_hours_of_operation#start_time ConnectHoursOfOperation#start_time}
     */
    @org.jetbrains.annotations.NotNull imports.aws.connect_hours_of_operation.ConnectHoursOfOperationConfigStartTime getStartTime();

    /**
     * @return a {@link Builder} of {@link ConnectHoursOfOperationConfigA}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConnectHoursOfOperationConfigA}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConnectHoursOfOperationConfigA> {
        java.lang.String day;
        imports.aws.connect_hours_of_operation.ConnectHoursOfOperationConfigEndTime endTime;
        imports.aws.connect_hours_of_operation.ConnectHoursOfOperationConfigStartTime startTime;

        /**
         * Sets the value of {@link ConnectHoursOfOperationConfigA#getDay}
         * @param day Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_hours_of_operation#day ConnectHoursOfOperation#day}. This parameter is required.
         * @return {@code this}
         */
        public Builder day(java.lang.String day) {
            this.day = day;
            return this;
        }

        /**
         * Sets the value of {@link ConnectHoursOfOperationConfigA#getEndTime}
         * @param endTime end_time block. This parameter is required.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_hours_of_operation#end_time ConnectHoursOfOperation#end_time}
         * @return {@code this}
         */
        public Builder endTime(imports.aws.connect_hours_of_operation.ConnectHoursOfOperationConfigEndTime endTime) {
            this.endTime = endTime;
            return this;
        }

        /**
         * Sets the value of {@link ConnectHoursOfOperationConfigA#getStartTime}
         * @param startTime start_time block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_hours_of_operation#start_time ConnectHoursOfOperation#start_time}
         * @return {@code this}
         */
        public Builder startTime(imports.aws.connect_hours_of_operation.ConnectHoursOfOperationConfigStartTime startTime) {
            this.startTime = startTime;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConnectHoursOfOperationConfigA}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConnectHoursOfOperationConfigA build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConnectHoursOfOperationConfigA}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConnectHoursOfOperationConfigA {
        private final java.lang.String day;
        private final imports.aws.connect_hours_of_operation.ConnectHoursOfOperationConfigEndTime endTime;
        private final imports.aws.connect_hours_of_operation.ConnectHoursOfOperationConfigStartTime startTime;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.day = software.amazon.jsii.Kernel.get(this, "day", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endTime = software.amazon.jsii.Kernel.get(this, "endTime", software.amazon.jsii.NativeType.forClass(imports.aws.connect_hours_of_operation.ConnectHoursOfOperationConfigEndTime.class));
            this.startTime = software.amazon.jsii.Kernel.get(this, "startTime", software.amazon.jsii.NativeType.forClass(imports.aws.connect_hours_of_operation.ConnectHoursOfOperationConfigStartTime.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.day = java.util.Objects.requireNonNull(builder.day, "day is required");
            this.endTime = java.util.Objects.requireNonNull(builder.endTime, "endTime is required");
            this.startTime = java.util.Objects.requireNonNull(builder.startTime, "startTime is required");
        }

        @Override
        public final java.lang.String getDay() {
            return this.day;
        }

        @Override
        public final imports.aws.connect_hours_of_operation.ConnectHoursOfOperationConfigEndTime getEndTime() {
            return this.endTime;
        }

        @Override
        public final imports.aws.connect_hours_of_operation.ConnectHoursOfOperationConfigStartTime getStartTime() {
            return this.startTime;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("day", om.valueToTree(this.getDay()));
            data.set("endTime", om.valueToTree(this.getEndTime()));
            data.set("startTime", om.valueToTree(this.getStartTime()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.connectHoursOfOperation.ConnectHoursOfOperationConfigA"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConnectHoursOfOperationConfigA.Jsii$Proxy that = (ConnectHoursOfOperationConfigA.Jsii$Proxy) o;

            if (!day.equals(that.day)) return false;
            if (!endTime.equals(that.endTime)) return false;
            return this.startTime.equals(that.startTime);
        }

        @Override
        public final int hashCode() {
            int result = this.day.hashCode();
            result = 31 * result + (this.endTime.hashCode());
            result = 31 * result + (this.startTime.hashCode());
            return result;
        }
    }
}
