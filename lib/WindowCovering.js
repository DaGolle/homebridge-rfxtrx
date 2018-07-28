'use strict';

function WindowCovering(platform, config) {
	this.platform = platform;
	this.config = config;
	this._windowCoveringAccessory;
	this._hasRegistered = false;
	this._currentPosition = 0; // closed
	this._targetPosition = 0; // closed
	this._positionState = Characteristic.PositionState.STOPPED;
	this._transmitter = this.platform.getTransmitter(this.config.type, this.config.subtype);
};

WindowCovering.prototype.initializeAccessory = function() {
    const uuid = UUIDGen.generate(this.config.serialNumber);
    const windowCoveringAccessory = new Accessory(this.config.name, uuid);

    // save WindowCovering serialNumber and class name in context
    // for easy restoration from persistent storage in configureAccessory()
    windowCoveringAccessory.context.id = this.config.serialNumber;
	windowCoveringAccessory.context.class = "WindowCovering";

    // Set Information Service characteristics
    const windowCoveringInfoService = windowCoveringAccessory.getService(Service.AccessoryInformation);
    if (windowCoveringInfoService) {
		windowCoveringInfoService.setCharacteristic(Characteristic.Manufacturer, this.config.manufacturer);
		windowCoveringInfoService.setCharacteristic(Characteristic.Model, this.config.model);
		windowCoveringInfoService.setCharacteristic(Characteristic.SerialNumber, this.config.serialNumber);
    }

    const windowCoveringService = windowCoveringAccessory.addService(Service.WindowCovering, this.config.name);

    if (windowCoveringService) {
    	windowCoveringService.getCharacteristic(Characteristic.CurrentPosition).setValue(0);
		windowCoveringService.getCharacteristic(Characteristic.TargetPosition).setValue(0);
		windowCoveringService.getCharacteristic(Characteristic.PositionState).setValue(Characteristic.PositionState.STOPPED);
    }

    this.setAccessory(windowCoveringAccessory);

    return windowCoveringAccessory;
};

// get window covering accessory
WindowCovering.prototype.getAccessory = function() {
  return this._windowCoveringAccessory;
};

// set window covering accessory
WindowCovering.prototype.setAccessory = function(accessory) {
	this._windowCoveringAccessory = accessory;
	this.setAccessoryEventHandlers();
};

// has window covering registered it's accessory with homebridge?
WindowCovering.prototype.hasRegistered = function() {
	return this._hasRegistered;
};

// set window covering registered status of it's accessory with homebridge
WindowCovering.prototype.setRegistered = function(status) {
	this._hasRegistered = status;
};

// configure event handlers
WindowCovering.prototype.setAccessoryEventHandlers = function() {
	this.getAccessory().on('identify', function(paired, callback) {
		this.platform.log(this.getAccessory().displayName, "Identify Window Covering and paired = " + paired);
		callback();
	}.bind(this));

	const windowCoveringService = this.getAccessory().getService(Service.WindowCovering);

	if (windowCoveringService) {
    	windowCoveringService
        	.getCharacteristic(Characteristic.CurrentPosition)
        	.on('get', this.getCurrentPosition.bind(this));

    	windowCoveringService
	        .getCharacteristic(Characteristic.TargetPosition)
	        .on('get', this.getTargetPosition.bind(this))
	        .on('set', this.setTargetPosition.bind(this));

		windowCoveringService
		    .getCharacteristic(Characteristic.PositionState)
		    .on('get', this.getPositionState.bind(this));
	}
};

WindowCovering.prototype.getCurrentPosition = function(callback) {
	this.platform.log(this.getAccessory().displayName, "getCurrentPosition = " + this._currentPosition);
	callback(null, this._currentPosition);	
};

WindowCovering.prototype.getTargetPosition = function(callback) {
	this.platform.log(this.getAccessory().displayName, "getTargetPosition = " + this._targetPosition);
	callback(null, this._targetPosition);
};

WindowCovering.prototype.setTargetPosition = function(value, callback) {
	this.platform.log(this.getAccessory().displayName, "setTargetPosition to value = " + value);
	const currentPosition = this._currentPosition;
	this._targetPosition = value;

	if (currentPosition != value) {
		let command, duration;

		if (currentPosition > value) {
			this.setPositionState(Characteristic.PositionState.DECREASING);
			
			duration = this.config.time * (currentPosition - value) / 100;
			this.close(duration, this.setCurrentPosition.bind(this, value));
		}
		else if (currentPosition < value) {
			this.setPositionState(Characteristic.PositionState.INCREASING);

			duration = this.config.time * (value - currentPosition) / 100;
			this.open(duration, this.setCurrentPosition.bind(this, value));
		}
	}

	callback(null, value);
};

WindowCovering.prototype.getPositionState = function(callback) {
	this.platform.log(this.getAccessory().displayName, "getPositionState called with " + JSON.stringify(callback));
	callback(null, this._positionState);
};

// added setters
WindowCovering.prototype.setCurrentPosition = function(position) {
	this.stop();
	this._currentPosition = position;

	this.setPositionState(Characteristic.PositionState.STOPPED);
};

WindowCovering.prototype.setPositionState = function(state) {
	this._positionState = state;
};

// send open command and wait 'duration' milliseconds before sending the stop command
WindowCovering.prototype.open = function(duration, callback) {
	this._transmitter.open(this.config.deviceID);
	setTimeout(function () {
		callback();
	}.bind(this), duration);
};

// send close command and wait 'duration' milliseconds before sending the stop command
WindowCovering.prototype.close = function(duration, callback) {
	this._transmitter.close(this.config.deviceID);
	setTimeout(function () {
		callback();
	}.bind(this), duration);
};

// send stop command
WindowCovering.prototype.stop = function(callback) {
	this._transmitter.stop(this.config.deviceID, callback);
};

module.exports = WindowCovering;
