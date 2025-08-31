package imports.aws.data_aws_subnet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.898Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsSubnet.DataAwsSubnetConfig")
@software.amazon.jsii.Jsii.Proxy(DataAwsSubnetConfig.Jsii$Proxy.class)
public interface DataAwsSubnetConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#availability_zone DataAwsSubnet#availability_zone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZone() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#availability_zone_id DataAwsSubnet#availability_zone_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZoneId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#cidr_block DataAwsSubnet#cidr_block}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCidrBlock() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#default_for_az DataAwsSubnet#default_for_az}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDefaultForAz() {
        return null;
    }

    /**
     * filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#filter DataAwsSubnet#filter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFilter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#id DataAwsSubnet#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#ipv6_cidr_block DataAwsSubnet#ipv6_cidr_block}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpv6CidrBlock() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#state DataAwsSubnet#state}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getState() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#tags DataAwsSubnet#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#timeouts DataAwsSubnet#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_subnet.DataAwsSubnetTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#vpc_id DataAwsSubnet#vpc_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVpcId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsSubnetConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsSubnetConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsSubnetConfig> {
        java.lang.String availabilityZone;
        java.lang.String availabilityZoneId;
        java.lang.String cidrBlock;
        java.lang.Object defaultForAz;
        java.lang.Object filter;
        java.lang.String id;
        java.lang.String ipv6CidrBlock;
        java.lang.String state;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.data_aws_subnet.DataAwsSubnetTimeouts timeouts;
        java.lang.String vpcId;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DataAwsSubnetConfig#getAvailabilityZone}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#availability_zone DataAwsSubnet#availability_zone}.
         * @return {@code this}
         */
        public Builder availabilityZone(java.lang.String availabilityZone) {
            this.availabilityZone = availabilityZone;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSubnetConfig#getAvailabilityZoneId}
         * @param availabilityZoneId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#availability_zone_id DataAwsSubnet#availability_zone_id}.
         * @return {@code this}
         */
        public Builder availabilityZoneId(java.lang.String availabilityZoneId) {
            this.availabilityZoneId = availabilityZoneId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSubnetConfig#getCidrBlock}
         * @param cidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#cidr_block DataAwsSubnet#cidr_block}.
         * @return {@code this}
         */
        public Builder cidrBlock(java.lang.String cidrBlock) {
            this.cidrBlock = cidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSubnetConfig#getDefaultForAz}
         * @param defaultForAz Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#default_for_az DataAwsSubnet#default_for_az}.
         * @return {@code this}
         */
        public Builder defaultForAz(java.lang.Boolean defaultForAz) {
            this.defaultForAz = defaultForAz;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSubnetConfig#getDefaultForAz}
         * @param defaultForAz Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#default_for_az DataAwsSubnet#default_for_az}.
         * @return {@code this}
         */
        public Builder defaultForAz(com.hashicorp.cdktf.IResolvable defaultForAz) {
            this.defaultForAz = defaultForAz;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSubnetConfig#getFilter}
         * @param filter filter block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#filter DataAwsSubnet#filter}
         * @return {@code this}
         */
        public Builder filter(com.hashicorp.cdktf.IResolvable filter) {
            this.filter = filter;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSubnetConfig#getFilter}
         * @param filter filter block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#filter DataAwsSubnet#filter}
         * @return {@code this}
         */
        public Builder filter(java.util.List<? extends imports.aws.data_aws_subnet.DataAwsSubnetFilter> filter) {
            this.filter = filter;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSubnetConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#id DataAwsSubnet#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSubnetConfig#getIpv6CidrBlock}
         * @param ipv6CidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#ipv6_cidr_block DataAwsSubnet#ipv6_cidr_block}.
         * @return {@code this}
         */
        public Builder ipv6CidrBlock(java.lang.String ipv6CidrBlock) {
            this.ipv6CidrBlock = ipv6CidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSubnetConfig#getState}
         * @param state Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#state DataAwsSubnet#state}.
         * @return {@code this}
         */
        public Builder state(java.lang.String state) {
            this.state = state;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSubnetConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#tags DataAwsSubnet#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSubnetConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#timeouts DataAwsSubnet#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.data_aws_subnet.DataAwsSubnetTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSubnetConfig#getVpcId}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/subnet#vpc_id DataAwsSubnet#vpc_id}.
         * @return {@code this}
         */
        public Builder vpcId(java.lang.String vpcId) {
            this.vpcId = vpcId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSubnetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSubnetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSubnetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSubnetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSubnetConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSubnetConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSubnetConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSubnetConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSubnetConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsSubnetConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsSubnetConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsSubnetConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsSubnetConfig {
        private final java.lang.String availabilityZone;
        private final java.lang.String availabilityZoneId;
        private final java.lang.String cidrBlock;
        private final java.lang.Object defaultForAz;
        private final java.lang.Object filter;
        private final java.lang.String id;
        private final java.lang.String ipv6CidrBlock;
        private final java.lang.String state;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.data_aws_subnet.DataAwsSubnetTimeouts timeouts;
        private final java.lang.String vpcId;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.availabilityZone = software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.availabilityZoneId = software.amazon.jsii.Kernel.get(this, "availabilityZoneId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cidrBlock = software.amazon.jsii.Kernel.get(this, "cidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultForAz = software.amazon.jsii.Kernel.get(this, "defaultForAz", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.filter = software.amazon.jsii.Kernel.get(this, "filter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv6CidrBlock = software.amazon.jsii.Kernel.get(this, "ipv6CidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.state = software.amazon.jsii.Kernel.get(this, "state", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_subnet.DataAwsSubnetTimeouts.class));
            this.vpcId = software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.availabilityZone = builder.availabilityZone;
            this.availabilityZoneId = builder.availabilityZoneId;
            this.cidrBlock = builder.cidrBlock;
            this.defaultForAz = builder.defaultForAz;
            this.filter = builder.filter;
            this.id = builder.id;
            this.ipv6CidrBlock = builder.ipv6CidrBlock;
            this.state = builder.state;
            this.tags = builder.tags;
            this.timeouts = builder.timeouts;
            this.vpcId = builder.vpcId;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAvailabilityZone() {
            return this.availabilityZone;
        }

        @Override
        public final java.lang.String getAvailabilityZoneId() {
            return this.availabilityZoneId;
        }

        @Override
        public final java.lang.String getCidrBlock() {
            return this.cidrBlock;
        }

        @Override
        public final java.lang.Object getDefaultForAz() {
            return this.defaultForAz;
        }

        @Override
        public final java.lang.Object getFilter() {
            return this.filter;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getIpv6CidrBlock() {
            return this.ipv6CidrBlock;
        }

        @Override
        public final java.lang.String getState() {
            return this.state;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.data_aws_subnet.DataAwsSubnetTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getVpcId() {
            return this.vpcId;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAvailabilityZone() != null) {
                data.set("availabilityZone", om.valueToTree(this.getAvailabilityZone()));
            }
            if (this.getAvailabilityZoneId() != null) {
                data.set("availabilityZoneId", om.valueToTree(this.getAvailabilityZoneId()));
            }
            if (this.getCidrBlock() != null) {
                data.set("cidrBlock", om.valueToTree(this.getCidrBlock()));
            }
            if (this.getDefaultForAz() != null) {
                data.set("defaultForAz", om.valueToTree(this.getDefaultForAz()));
            }
            if (this.getFilter() != null) {
                data.set("filter", om.valueToTree(this.getFilter()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIpv6CidrBlock() != null) {
                data.set("ipv6CidrBlock", om.valueToTree(this.getIpv6CidrBlock()));
            }
            if (this.getState() != null) {
                data.set("state", om.valueToTree(this.getState()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getVpcId() != null) {
                data.set("vpcId", om.valueToTree(this.getVpcId()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsSubnet.DataAwsSubnetConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsSubnetConfig.Jsii$Proxy that = (DataAwsSubnetConfig.Jsii$Proxy) o;

            if (this.availabilityZone != null ? !this.availabilityZone.equals(that.availabilityZone) : that.availabilityZone != null) return false;
            if (this.availabilityZoneId != null ? !this.availabilityZoneId.equals(that.availabilityZoneId) : that.availabilityZoneId != null) return false;
            if (this.cidrBlock != null ? !this.cidrBlock.equals(that.cidrBlock) : that.cidrBlock != null) return false;
            if (this.defaultForAz != null ? !this.defaultForAz.equals(that.defaultForAz) : that.defaultForAz != null) return false;
            if (this.filter != null ? !this.filter.equals(that.filter) : that.filter != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.ipv6CidrBlock != null ? !this.ipv6CidrBlock.equals(that.ipv6CidrBlock) : that.ipv6CidrBlock != null) return false;
            if (this.state != null ? !this.state.equals(that.state) : that.state != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.vpcId != null ? !this.vpcId.equals(that.vpcId) : that.vpcId != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.availabilityZone != null ? this.availabilityZone.hashCode() : 0;
            result = 31 * result + (this.availabilityZoneId != null ? this.availabilityZoneId.hashCode() : 0);
            result = 31 * result + (this.cidrBlock != null ? this.cidrBlock.hashCode() : 0);
            result = 31 * result + (this.defaultForAz != null ? this.defaultForAz.hashCode() : 0);
            result = 31 * result + (this.filter != null ? this.filter.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.ipv6CidrBlock != null ? this.ipv6CidrBlock.hashCode() : 0);
            result = 31 * result + (this.state != null ? this.state.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.vpcId != null ? this.vpcId.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
