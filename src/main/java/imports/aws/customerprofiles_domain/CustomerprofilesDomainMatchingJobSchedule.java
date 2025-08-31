package imports.aws.customerprofiles_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.403Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.customerprofilesDomain.CustomerprofilesDomainMatchingJobSchedule")
@software.amazon.jsii.Jsii.Proxy(CustomerprofilesDomainMatchingJobSchedule.Jsii$Proxy.class)
public interface CustomerprofilesDomainMatchingJobSchedule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#day_of_the_week CustomerprofilesDomain#day_of_the_week}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDayOfTheWeek();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#time CustomerprofilesDomain#time}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTime();

    /**
     * @return a {@link Builder} of {@link CustomerprofilesDomainMatchingJobSchedule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CustomerprofilesDomainMatchingJobSchedule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CustomerprofilesDomainMatchingJobSchedule> {
        java.lang.String dayOfTheWeek;
        java.lang.String time;

        /**
         * Sets the value of {@link CustomerprofilesDomainMatchingJobSchedule#getDayOfTheWeek}
         * @param dayOfTheWeek Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#day_of_the_week CustomerprofilesDomain#day_of_the_week}. This parameter is required.
         * @return {@code this}
         */
        public Builder dayOfTheWeek(java.lang.String dayOfTheWeek) {
            this.dayOfTheWeek = dayOfTheWeek;
            return this;
        }

        /**
         * Sets the value of {@link CustomerprofilesDomainMatchingJobSchedule#getTime}
         * @param time Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/customerprofiles_domain#time CustomerprofilesDomain#time}. This parameter is required.
         * @return {@code this}
         */
        public Builder time(java.lang.String time) {
            this.time = time;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CustomerprofilesDomainMatchingJobSchedule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CustomerprofilesDomainMatchingJobSchedule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CustomerprofilesDomainMatchingJobSchedule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CustomerprofilesDomainMatchingJobSchedule {
        private final java.lang.String dayOfTheWeek;
        private final java.lang.String time;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dayOfTheWeek = software.amazon.jsii.Kernel.get(this, "dayOfTheWeek", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.time = software.amazon.jsii.Kernel.get(this, "time", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dayOfTheWeek = java.util.Objects.requireNonNull(builder.dayOfTheWeek, "dayOfTheWeek is required");
            this.time = java.util.Objects.requireNonNull(builder.time, "time is required");
        }

        @Override
        public final java.lang.String getDayOfTheWeek() {
            return this.dayOfTheWeek;
        }

        @Override
        public final java.lang.String getTime() {
            return this.time;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("dayOfTheWeek", om.valueToTree(this.getDayOfTheWeek()));
            data.set("time", om.valueToTree(this.getTime()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.customerprofilesDomain.CustomerprofilesDomainMatchingJobSchedule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CustomerprofilesDomainMatchingJobSchedule.Jsii$Proxy that = (CustomerprofilesDomainMatchingJobSchedule.Jsii$Proxy) o;

            if (!dayOfTheWeek.equals(that.dayOfTheWeek)) return false;
            return this.time.equals(that.time);
        }

        @Override
        public final int hashCode() {
            int result = this.dayOfTheWeek.hashCode();
            result = 31 * result + (this.time.hashCode());
            return result;
        }
    }
}
