import makeLogger from '@natfaulk/supersimplelogger'
import React from 'react'
import './App.css'
import Canvasses from './Canvasses.js'
import checkKeyHasVal from './utils'
import { Sensor } from './sensor'
import Recording from './Recording'

const logger = makeLogger('App')

let settings = {
  interpFactor: 5,
  thresholdVal: 2,
  thresholdOn: false,
  numCalibVals: 0,
  tempRange: {min: 0, max: 30},
  camera: {width:8, height: 8},
  canvasSize: {x: 400, y: 400}
}

class App extends React.Component {
  constructor(props) {
    super()

    this.handleRecordingChange = this.handleRecordingChange.bind(this)

    this.devices = {}
    this.ws = null
    
    this.state = {
      deviceData: [],
      recording: false
    }
  }

  componentDidMount() {
    this.startWebsocket()
    // this.sensor = new Sensor(settings)

  }

  handleRecordingChange(recording) {
    if (this.ws !== null) {
      // this.setState({recording})
      if (recording){
        logger('Attempting to start recording')
        this.ws.send('start recording')
      } else {
        logger('Attempting to stop recording')
        this.ws.send('stop recording')
      }
    }
  }

  addDevice(_id) {
    this.devices[_id] = new Sensor(_id, settings)
    logger(`Added device with ID: ${_id}`)
  }

  updateDeviceData(_data) {
    let processedData = this.devices[_data.ID].process(_data.data)
    let newDeviceData = this.state.deviceData

    let devFound = false
    for (let i = 0; i < newDeviceData.length; ++i) {
      if (newDeviceData[i].id === _data.ID) {
        newDeviceData[i].data = processedData
        devFound = true
        break
      }
    }

    if (!devFound) {
      newDeviceData.push({id:_data.ID, data:processedData})
    }

    this.setState({deviceData: newDeviceData})
  }
  
  startWebsocket() {
    const ws = new WebSocket('ws://localhost:3001')
    ws.addEventListener('open', _event => {
      logger('WS connection made')
    })
  
    ws.addEventListener('message', _event => {
      // logger(`WS message: ${_event.data}`)
      let dataParsed = {}
      try {
        dataParsed = JSON.parse(_event.data)
      } catch(e) {
        logger(`Failed to parse incoming json, ${e}`)
        logger(`Incoming string: ${_event.data}`)
        return
      }

      if (checkKeyHasVal(dataParsed, 'info')) {
        logger(dataParsed)
        if (dataParsed.info === 'recording started') {
          this.setState({recording: true})
        }

        if (dataParsed.info === 'recording stopped') {
          this.setState({recording: false})
        }
      }
  
      if (!checkKeyHasVal(dataParsed, 'ID')) return
      if (!checkKeyHasVal(dataParsed, 'data')) return
      if (!checkKeyHasVal(this.devices, dataParsed.ID)) this.addDevice(dataParsed.ID)  
      this.updateDeviceData(dataParsed)
    })
  
    ws.addEventListener('error', _event=> {
      logger(`WS error: ${_event}`)
    })
  
    ws.addEventListener('close', _event=> {
      logger(`WS close: ${_event}`)
    })    
  
    this.ws = ws
  }

  render() {
    return <>
      <h1>Temperature sensors</h1>
      <Canvasses devices={this.state.deviceData} settings={settings} />
      <Recording recording={this.state.recording} setRecording={this.handleRecordingChange} />
    </>
    
  }
}

export default App
