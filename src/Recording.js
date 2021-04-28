import React from 'react'
import makeLogger from '@natfaulk/supersimplelogger'

const logger = makeLogger('Recording')

class Recording extends React.Component {
  constructor(props) {
    super()

    this.beginRecord = this.beginRecord.bind(this)
    this.endRecord = this.endRecord.bind(this)
  }

  beginRecord(e) {
    this.props.setRecording(true)
  }

  endRecord(e) {
    this.props.setRecording(false)
  }

  render() {
    if (!this.props.recording) {
      return <>
        <div>
          <button onClick={this.beginRecord}>Start recording</button>
        </div>
      </>
    } else {
      return <>
        <div>RECORDING</div>
        <div>
          <button onClick={this.endRecord}>Stop recording</button>
        </div>
      </>
    }
  }
}

export default Recording
