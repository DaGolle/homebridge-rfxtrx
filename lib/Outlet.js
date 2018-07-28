'use strict';

function Outlet(platform, config) {
	this.platform = platform;
	this.config = config;
	this._outletAccessory;
	this._hasRegistered = false;
	this._state = 0;
	this._transmitter = this.platform.getTransmitter(this.config.type, this.config.subtype);
};

Outlet.prototype.initializeAccessory = function() {
    const uuid = UUIDGen.generate(this.config.serialNumber);
    const OutletAccessory = new Accessory(this.config.name, uuid);

    // save Outlet serialNumber and class name in context
    // for easy restoration from persistent storage in configureAccessory()
    OutletAccessory.context = {
    	id: this.config.serialNumber,
		class: "Outlet"
	}

    // Set Information Service characteristics
    const OutletInfoService = OutletAccessory.getService(Service.AccessoryInformation);
    if (OutletInfoService) {
		OutletInfoService.setCharacteristic(Characteristic.Manufacturer, this.config.manufacturer);
		OutletInfoService.setCharacteristic(Characteristic.Model, this.config.model);
		OutletInfoService.setCharacteristic(Characteristic.SerialNumber, this.config.serialNumber);
    }

    const OutletService = OutletAccessory.addService(Service.Outlet, this.config.name);

    if (OutletService) {
    	OutletService.getCharacteristic(Characteristic.On).setValue(0);
    }

    this.setAccessory(OutletAccessory);

    return OutletAccessory;
};

// get outlet accessory
Outlet.prototype.getAccessory = function() {
  return this._OutletAccessory;
};

// set outlet accessory
Outlet.prototype.setAccessory = function(accessory) {
	this._OutletAccessory = accessory;
	this.setAccessoryEventHandlers();
};

// has outlet registered it's accessory with homebridge?
Outlet.prototype.hasRegistered = function() {
	return this._hasRegistered;
};

// set outlet registered status of it's accessory with homebridge
Outlet.prototype.setRegistered = function(status) {
	this._hasRegistered = status;
};

// configure event handlers
Outlet.prototype.setAccessoryEventHandlers = function() {
	this.getAccessory().on('identify', function(paired, callback) {
		this.platform.log(this.getAccessory().displayName, "Identify Outlet and paired = " + paired);
		callback();
	}.bind(this));

	const OutletService = this.getAccessory().getService(Service.Outlet);

	if (OutletService) {
    	OutletService
        	.getCharacteristic(Characteristic.On)
        	.on('get', this.getState.bind(this))
        	.on('set', this.setState.bind(this))
	}
};

Outlet.prototype.getState = function(callback) {
	this.platform.log(this.getAccessory().displayName, "getState = " + this._state);
	callback(null, this._state);	
};

Outlet.prototype.setState = function(value, callback) {
	this.platform.log(this.getAccessory().displayName, "setState to value = " + value);
	this._state = value;

	if (value == 1) {
		this.switchOn();
	}
	else if (value == 0) {
		this.switchOff();
	}

	callback(null, value);
};

// Switch on outlet
Outlet.prototype.switchOn = function(callback) {
	const deviceID = this.config.deviceID;

	this._transmitter.switchOn(deviceID, () => this.platform.log("Device " + deviceID + " switched on"));
};

// Switch off outlet
Outlet.prototype.switchOff = function(callback) {
	const deviceID = this.config.deviceID;

	this._transmitter.switchOff(deviceID, () => this.platform.log("Device " + deviceID + " switched off"));
};

module.exports = Outlet;
