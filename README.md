# homebridge-rfxtrx
## Homebridge RFXCOM RFXtrx433e plugin

The tranceiver details can be found here:
http://www.rfxcom.com/epages/78165469.sf/en_GB/?ViewObjectPath=%2FShops%2F78165469%2FProducts%2F14103

### Currently supports the following Homebridge accessory types:
* WindowCovering
* Outlet

### Tested with the following devices:
* [Brel curtain motors](https://www.brel-motors.nl/webshop/gordijnrailsysteem/)
* [Oase InScenio FM-Master 3](https://www.oase-livingwater.com/nl_BE/water-tuin/producten/p/inscenio-fm-master-3.1000079799.html) (special RFXCOM firmware required)

### Example config.json
```JSON
{
  "platform": "RFXtrx",
  "name": "RFXtrx433E",
  "manufacturer": "RFXCOM",
  "model": "RFXtrx433E USB 433MHz Transceiver",
  "serialNumber": "12345",
  "usbPort": "/dev/ttyUSB0",
  "windowCoverings": [
    {
      "name": "RFXCOM Curtain 1",
      "manufacturer": "Brel",
      "model": "MGLE-45",
      "serialNumber": "rfxcurtain1",
      "type": "Blinds1",
      "subtype": "BLINDS_T6",
      "deviceID": "0x1234567/1",
      "orientation": "horizontal",
      "duration": 4000
    },
    {
      "name": "RFXCOM Shade 1",
      "manufacturer": "Somfy",
      "model": "RTS",
      "serialNumber": "rfxshade1",
      "type": "Rfy",
      "subtype": "RFY",
      "deviceID": "0x012a03/1",
      "orientation": "vertical",
      "duration_up": 4000,
      "duration_down": 3000,
    }
  ],
  "outlets": [
    {
      "name": "Garden Outlet 1",
      "manufacturer": "Oase",
      "model": "InScenio FM-Master",
      "serialNumber": "outlet1",
      "type": "Lighting1",
      "subtype": "X10",
      "deviceID": "A1"
    }
  ]
}
```
