package imports.aws.auditmanager_framework;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.089Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.auditmanagerFramework.AuditmanagerFrameworkControlSetsControls")
@software.amazon.jsii.Jsii.Proxy(AuditmanagerFrameworkControlSetsControls.Jsii$Proxy.class)
public interface AuditmanagerFrameworkControlSetsControls extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_framework#id AuditmanagerFramework#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getId();

    /**
     * @return a {@link Builder} of {@link AuditmanagerFrameworkControlSetsControls}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AuditmanagerFrameworkControlSetsControls}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AuditmanagerFrameworkControlSetsControls> {
        java.lang.String id;

        /**
         * Sets the value of {@link AuditmanagerFrameworkControlSetsControls#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_framework#id AuditmanagerFramework#id}. This parameter is required.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AuditmanagerFrameworkControlSetsControls}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AuditmanagerFrameworkControlSetsControls build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AuditmanagerFrameworkControlSetsControls}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AuditmanagerFrameworkControlSetsControls {
        private final java.lang.String id;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.id = java.util.Objects.requireNonNull(builder.id, "id is required");
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("id", om.valueToTree(this.getId()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.auditmanagerFramework.AuditmanagerFrameworkControlSetsControls"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AuditmanagerFrameworkControlSetsControls.Jsii$Proxy that = (AuditmanagerFrameworkControlSetsControls.Jsii$Proxy) o;

            return this.id.equals(that.id);
        }

        @Override
        public final int hashCode() {
            int result = this.id.hashCode();
            return result;
        }
    }
}
