process.env.SSLOGGER_PROCESS_PREFIX = 'HTTP Bridge'

const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')
const Websocket = require('ws')
const path = require('path')
const fs = require('fs')

const logger = require('@natfaulk/supersimplelogger')('Index')

const MSG_HEADER = '[data] '
const WS_PORT = 3001

const FILE_PREFIX = 'out'
const DATA_DIR = path.join(__dirname, '..', 'data')

;(async ()=>{
  let state = {
    recording: false,
    filestream: null
  }

  logger('Process started')

  mkdir_p(DATA_DIR)

  logger('Starting Websocket server...')
  const wss = new Websocket.Server({port: WS_PORT})

  wss.on('connection', _ws => {
    logger('WS connection made.')
    
    _ws.on('message', _data => {
      logger(`Received: ${_data}`)
      if (_data === 'start recording') {
        startRecording(state)
        
        sendData(JSON.stringify({
          info: 'recording started'
        }))

        return
      }

      if (_data === 'stop recording') {
        stopRecording(state)
        
        sendData(JSON.stringify({
          info: 'recording stopped'
        }))

        return
      }
    })

    _ws.on('close', () => {
      logger('WS connection closed.')
    })

    _ws.on('error', (_ws, _err) => {
      logger(`WS error: ${_err}`)
    })
  })

  const sendData = _data => {
    wss.clients.forEach(_client => {
      if (_client.readyState === Websocket.OPEN) {
        _client.send(_data)
      }
    })
  }

  let ports = await SerialPort.list()
  ports.forEach(_port => {
    if (
      _port.manufacturer === 'wch.cn'     // windows
      || _port.manufacturer === '1a86'    // linux
    ) {
      logger(`Found port ${_port.path}`)
      openPort(_port.path, sendData, state)
    }
  })
  
})()

let openPort = (_path, _sendData, _state) => {
  logger(`Opening ${_path}...`)

  let isThermoBoard = false

  const port = new SerialPort(_path, {
    baudRate: 115200
  })

  const parser = port.pipe(new Readline({delimiter: '\n'}))
  parser.on('data', _data => {
    
    _data = _data.trim()
    
    if (isThermoBoard && _data.startsWith(MSG_HEADER)) {
      _sendData(_data.slice(MSG_HEADER.length))
      if (_state.recording && _state.filestream !== null) {
        _state.filestream.write(`Time|${Date.now()}|`)
        _state.filestream.write(_data)
        _state.filestream.write('\n')
      }
    }
    else if (!isThermoBoard && _data.includes('Thermo board')) isThermoBoard = true
    // else logger('Invalid serial data')
  })

  port.on('error', err => {
    logger(`[${_path}] Error: `, err.message)
  })

  port.on('open', () => {
    logger(`[${_path}] Port opened.`)
    logger(`[${_path}] Sending reset command...`)
    port.write('r')

    // wait for it to boot up
    setTimeout(() => {
      // request board type
      port.write('i')
    }, 5000)
  })

  setTimeout(()=>{
    if (!isThermoBoard) {
      logger(`[${_path}] Serial port is not a thermo board. Closing...`)
      port.close(_err => {
        if (_err) logger(`[${_path}] Failed to close port...`)
        else logger(`[${_path}] Port closed.`)
      })
    } else {
      port.write('s')
    }
  }, 10000)

  return port
}

function mkdir_p(_dir) {
  if (!fs.existsSync(_dir)) {
    fs.mkdirSync(_dir)
  }
}

function getNextFile(_dir, _prefix) {
  let currentFiles = fs.readdirSync(_dir)
  let makeFilename = _i => {
    return `${_prefix}_${_i}.txt`
  }

  let i = 0
  while (currentFiles.includes(makeFilename(i))) ++i

  return path.join(_dir, makeFilename(i))
}

function startRecording(_state) {
  let filename = getNextFile(DATA_DIR, FILE_PREFIX)
  logger(`Creating output file: ${filename}`)

  _state.recording = true
  _state.filestream = fs.createWriteStream(filename)
}

function stopRecording(_state) {
  _state.recording = false
  _state.filestream = null
}
