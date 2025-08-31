package imports.aws.data_aws_route53_traffic_policy_document;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.839Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsRoute53TrafficPolicyDocument.DataAwsRoute53TrafficPolicyDocumentRule")
@software.amazon.jsii.Jsii.Proxy(DataAwsRoute53TrafficPolicyDocumentRule.Jsii$Proxy.class)
public interface DataAwsRoute53TrafficPolicyDocumentRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#id DataAwsRoute53TrafficPolicyDocument#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getId();

    /**
     * geo_proximity_location block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#geo_proximity_location DataAwsRoute53TrafficPolicyDocument#geo_proximity_location}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getGeoProximityLocation() {
        return null;
    }

    /**
     * items block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#items DataAwsRoute53TrafficPolicyDocument#items}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getItems() {
        return null;
    }

    /**
     * location block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#location DataAwsRoute53TrafficPolicyDocument#location}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLocation() {
        return null;
    }

    /**
     * primary block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#primary DataAwsRoute53TrafficPolicyDocument#primary}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRulePrimary getPrimary() {
        return null;
    }

    /**
     * region block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#region DataAwsRoute53TrafficPolicyDocument#region}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRegion() {
        return null;
    }

    /**
     * secondary block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#secondary DataAwsRoute53TrafficPolicyDocument#secondary}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRuleSecondary getSecondary() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#type DataAwsRoute53TrafficPolicyDocument#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsRoute53TrafficPolicyDocumentRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsRoute53TrafficPolicyDocumentRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsRoute53TrafficPolicyDocumentRule> {
        java.lang.String id;
        java.lang.Object geoProximityLocation;
        java.lang.Object items;
        java.lang.Object location;
        imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRulePrimary primary;
        java.lang.Object region;
        imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRuleSecondary secondary;
        java.lang.String type;

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRule#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#id DataAwsRoute53TrafficPolicyDocument#id}. This parameter is required.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRule#getGeoProximityLocation}
         * @param geoProximityLocation geo_proximity_location block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#geo_proximity_location DataAwsRoute53TrafficPolicyDocument#geo_proximity_location}
         * @return {@code this}
         */
        public Builder geoProximityLocation(com.hashicorp.cdktf.IResolvable geoProximityLocation) {
            this.geoProximityLocation = geoProximityLocation;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRule#getGeoProximityLocation}
         * @param geoProximityLocation geo_proximity_location block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#geo_proximity_location DataAwsRoute53TrafficPolicyDocument#geo_proximity_location}
         * @return {@code this}
         */
        public Builder geoProximityLocation(java.util.List<? extends imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRuleGeoProximityLocation> geoProximityLocation) {
            this.geoProximityLocation = geoProximityLocation;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRule#getItems}
         * @param items items block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#items DataAwsRoute53TrafficPolicyDocument#items}
         * @return {@code this}
         */
        public Builder items(com.hashicorp.cdktf.IResolvable items) {
            this.items = items;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRule#getItems}
         * @param items items block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#items DataAwsRoute53TrafficPolicyDocument#items}
         * @return {@code this}
         */
        public Builder items(java.util.List<? extends imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRuleItems> items) {
            this.items = items;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRule#getLocation}
         * @param location location block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#location DataAwsRoute53TrafficPolicyDocument#location}
         * @return {@code this}
         */
        public Builder location(com.hashicorp.cdktf.IResolvable location) {
            this.location = location;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRule#getLocation}
         * @param location location block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#location DataAwsRoute53TrafficPolicyDocument#location}
         * @return {@code this}
         */
        public Builder location(java.util.List<? extends imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRuleLocation> location) {
            this.location = location;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRule#getPrimary}
         * @param primary primary block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#primary DataAwsRoute53TrafficPolicyDocument#primary}
         * @return {@code this}
         */
        public Builder primary(imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRulePrimary primary) {
            this.primary = primary;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRule#getRegion}
         * @param region region block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#region DataAwsRoute53TrafficPolicyDocument#region}
         * @return {@code this}
         */
        public Builder region(com.hashicorp.cdktf.IResolvable region) {
            this.region = region;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRule#getRegion}
         * @param region region block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#region DataAwsRoute53TrafficPolicyDocument#region}
         * @return {@code this}
         */
        public Builder region(java.util.List<? extends imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRuleRegion> region) {
            this.region = region;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRule#getSecondary}
         * @param secondary secondary block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#secondary DataAwsRoute53TrafficPolicyDocument#secondary}
         * @return {@code this}
         */
        public Builder secondary(imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRuleSecondary secondary) {
            this.secondary = secondary;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRoute53TrafficPolicyDocumentRule#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route53_traffic_policy_document#type DataAwsRoute53TrafficPolicyDocument#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsRoute53TrafficPolicyDocumentRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsRoute53TrafficPolicyDocumentRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsRoute53TrafficPolicyDocumentRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsRoute53TrafficPolicyDocumentRule {
        private final java.lang.String id;
        private final java.lang.Object geoProximityLocation;
        private final java.lang.Object items;
        private final java.lang.Object location;
        private final imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRulePrimary primary;
        private final java.lang.Object region;
        private final imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRuleSecondary secondary;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.geoProximityLocation = software.amazon.jsii.Kernel.get(this, "geoProximityLocation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.items = software.amazon.jsii.Kernel.get(this, "items", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.location = software.amazon.jsii.Kernel.get(this, "location", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.primary = software.amazon.jsii.Kernel.get(this, "primary", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRulePrimary.class));
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.secondary = software.amazon.jsii.Kernel.get(this, "secondary", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRuleSecondary.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.id = java.util.Objects.requireNonNull(builder.id, "id is required");
            this.geoProximityLocation = builder.geoProximityLocation;
            this.items = builder.items;
            this.location = builder.location;
            this.primary = builder.primary;
            this.region = builder.region;
            this.secondary = builder.secondary;
            this.type = builder.type;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getGeoProximityLocation() {
            return this.geoProximityLocation;
        }

        @Override
        public final java.lang.Object getItems() {
            return this.items;
        }

        @Override
        public final java.lang.Object getLocation() {
            return this.location;
        }

        @Override
        public final imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRulePrimary getPrimary() {
            return this.primary;
        }

        @Override
        public final java.lang.Object getRegion() {
            return this.region;
        }

        @Override
        public final imports.aws.data_aws_route53_traffic_policy_document.DataAwsRoute53TrafficPolicyDocumentRuleSecondary getSecondary() {
            return this.secondary;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("id", om.valueToTree(this.getId()));
            if (this.getGeoProximityLocation() != null) {
                data.set("geoProximityLocation", om.valueToTree(this.getGeoProximityLocation()));
            }
            if (this.getItems() != null) {
                data.set("items", om.valueToTree(this.getItems()));
            }
            if (this.getLocation() != null) {
                data.set("location", om.valueToTree(this.getLocation()));
            }
            if (this.getPrimary() != null) {
                data.set("primary", om.valueToTree(this.getPrimary()));
            }
            if (this.getRegion() != null) {
                data.set("region", om.valueToTree(this.getRegion()));
            }
            if (this.getSecondary() != null) {
                data.set("secondary", om.valueToTree(this.getSecondary()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsRoute53TrafficPolicyDocument.DataAwsRoute53TrafficPolicyDocumentRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsRoute53TrafficPolicyDocumentRule.Jsii$Proxy that = (DataAwsRoute53TrafficPolicyDocumentRule.Jsii$Proxy) o;

            if (!id.equals(that.id)) return false;
            if (this.geoProximityLocation != null ? !this.geoProximityLocation.equals(that.geoProximityLocation) : that.geoProximityLocation != null) return false;
            if (this.items != null ? !this.items.equals(that.items) : that.items != null) return false;
            if (this.location != null ? !this.location.equals(that.location) : that.location != null) return false;
            if (this.primary != null ? !this.primary.equals(that.primary) : that.primary != null) return false;
            if (this.region != null ? !this.region.equals(that.region) : that.region != null) return false;
            if (this.secondary != null ? !this.secondary.equals(that.secondary) : that.secondary != null) return false;
            return this.type != null ? this.type.equals(that.type) : that.type == null;
        }

        @Override
        public final int hashCode() {
            int result = this.id.hashCode();
            result = 31 * result + (this.geoProximityLocation != null ? this.geoProximityLocation.hashCode() : 0);
            result = 31 * result + (this.items != null ? this.items.hashCode() : 0);
            result = 31 * result + (this.location != null ? this.location.hashCode() : 0);
            result = 31 * result + (this.primary != null ? this.primary.hashCode() : 0);
            result = 31 * result + (this.region != null ? this.region.hashCode() : 0);
            result = 31 * result + (this.secondary != null ? this.secondary.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            return result;
        }
    }
}
