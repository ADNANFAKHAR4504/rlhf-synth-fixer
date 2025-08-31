package imports.aws.data_aws_auditmanager_framework;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.459Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsAuditmanagerFramework.DataAwsAuditmanagerFrameworkControlSets")
@software.amazon.jsii.Jsii.Proxy(DataAwsAuditmanagerFrameworkControlSets.Jsii$Proxy.class)
public interface DataAwsAuditmanagerFrameworkControlSets extends software.amazon.jsii.JsiiSerializable {

    /**
     * controls block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/auditmanager_framework#controls DataAwsAuditmanagerFramework#controls}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getControls() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsAuditmanagerFrameworkControlSets}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsAuditmanagerFrameworkControlSets}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsAuditmanagerFrameworkControlSets> {
        java.lang.Object controls;

        /**
         * Sets the value of {@link DataAwsAuditmanagerFrameworkControlSets#getControls}
         * @param controls controls block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/auditmanager_framework#controls DataAwsAuditmanagerFramework#controls}
         * @return {@code this}
         */
        public Builder controls(com.hashicorp.cdktf.IResolvable controls) {
            this.controls = controls;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsAuditmanagerFrameworkControlSets#getControls}
         * @param controls controls block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/auditmanager_framework#controls DataAwsAuditmanagerFramework#controls}
         * @return {@code this}
         */
        public Builder controls(java.util.List<? extends imports.aws.data_aws_auditmanager_framework.DataAwsAuditmanagerFrameworkControlSetsControls> controls) {
            this.controls = controls;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsAuditmanagerFrameworkControlSets}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsAuditmanagerFrameworkControlSets build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsAuditmanagerFrameworkControlSets}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsAuditmanagerFrameworkControlSets {
        private final java.lang.Object controls;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.controls = software.amazon.jsii.Kernel.get(this, "controls", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.controls = builder.controls;
        }

        @Override
        public final java.lang.Object getControls() {
            return this.controls;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getControls() != null) {
                data.set("controls", om.valueToTree(this.getControls()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsAuditmanagerFramework.DataAwsAuditmanagerFrameworkControlSets"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsAuditmanagerFrameworkControlSets.Jsii$Proxy that = (DataAwsAuditmanagerFrameworkControlSets.Jsii$Proxy) o;

            return this.controls != null ? this.controls.equals(that.controls) : that.controls == null;
        }

        @Override
        public final int hashCode() {
            int result = this.controls != null ? this.controls.hashCode() : 0;
            return result;
        }
    }
}
