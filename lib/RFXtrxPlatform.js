'use strict';

const rfxcom = require('rfxcom');
const WindowCovering = require('./WindowCovering');
const Outlet = require('./Outlet');

function RFXtrxPlatform(log, config, api) {
  this.log = log;
  this.config = config;

  this.rfxtrx = new rfxcom.RfxCom(this.config.usbPort, { debug: true });

  this.rfxtrx.on('disconnect', () => this.log('ERROR: RFXtrx disconnect'));
  this.rfxtrx.on('connectfailed', () => this.log('ERROR: RFXtrx connect failed'));

  // initialize WindowCoverings
  this.windowCoverings = {};
  this.config.windowCoverings.forEach(function(windowCoveringConfig) {
    this.windowCoverings[windowCoveringConfig.serialNumber] = new WindowCovering(this, windowCoveringConfig);
  }.bind(this));

  // initialize Outlets
  this.outlets = {};
  this.config.outlets.forEach(function(outletConfig) {
    this.outlets[outletConfig.serialNumber] = new Outlet(this, outletConfig);
  }.bind(this));

  if (api) {
    // Save the API object as plugin needs to register new accessory via this object.
    this.api = api;

    // Listen to event "didFinishLaunching", this means homebridge already finished loading cached accessories
    // Platform Plugin should only register new accessory that doesn't exist in homebridge after this event.
    // Or start discover new accessories
    this.api.on('didFinishLaunching', this.registerAccessories.bind(this));
  }
};

RFXtrxPlatform.prototype.registerAccessories = function() {
  let newAccessories = [];
  
  // initialize windowCoverings accessories
  this.config.windowCoverings.forEach(function(windowCoveringConfig) {
    let windowCovering = this.windowCoverings[windowCoveringConfig.serialNumber];
    if (!windowCovering.hasRegistered()) {
      newAccessories.push(windowCovering.initializeAccessory());
    }
  }.bind(this));

  // initialize outlets accessories
  this.config.outlets.forEach(function(outletConfig) {
    let outlet = this.outlets[outletConfig.serialNumber];
    if (!outlet.hasRegistered()) {
      newAccessories.push(outlet.initializeAccessory());
    }
  }.bind(this));

  this.rfxtrx.initialise(() => {
      this.log('RFXtrx initialized.');
  })

  // collect all accessories after they have been initialized and register them with homebridge
  if (newAccessories.length > 0) {
    this.api.registerPlatformAccessories("homebridge-rfxtrx", "RFXtrx", newAccessories);
  }  
};

// restore from persistent storage
RFXtrxPlatform.prototype.configureAccessory = function(accessory) {
  this.log("Restoring accessory: " + accessory.displayName);
  if (accessory.context.class == "WindowCovering") {
    const windowCovering = this.windowCoverings[accessory.context.id];
    windowCovering.setAccessory(accessory);
    windowCovering.setRegistered(true);
  }
  else if (accessory.context.class == "Outlet") {
    const outlet = this.outlets[accessory.context.id];
    outlet.setAccessory(accessory);
    outlet.setRegistered(true);
  }
  else {
    this.log('Accessory ' + accessory.displayName + ' is of an unknown class "' + accessory.context.class + '"');
  }
  accessory.updateReachability(true);
};

// returns an RFXCOM transmitter to send Radio Frequency codes with
RFXtrxPlatform.prototype.getTransmitter = function(type, subtype) {
  return new rfxcom[type](this.rfxtrx, rfxcom[type.toLowerCase()][subtype]);
};

module.exports = RFXtrxPlatform;
