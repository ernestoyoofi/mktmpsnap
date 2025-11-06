const net = require("net")
const buildCMD = require("./command")
const decodeWord = require("./decode-word")
const HandleMessage = require("./handle-msg")
const GenerateTaskID = require("./generate-task-id")

class MikrotikAPI {
  constructor({ host = "192.168.88.1", timeout = 60000, port = 8728, username = "admin", password = "", useRetryConnect = false, debuggingLog = false } = {}) {
    this.config = {
      host: String(host).trim(),
      port: parseInt(port),
      username: String(username).trim(),
      password: String(password).trim(),
      timeout: timeout,
      useRetryConnect: useRetryConnect === true
    }
    this.function_listcall = {
      status: [],
      error: [],
      data: []
    }
    this.enable_debugging = debuggingLog
    this.process_pending = null
    this.process_list = []
    this.client = null
    this.statusConnect = false
    this._connect()
  }
  _sendquene(cb) {
    if(!this.process_list[0]) return;
    if(this.process_pending) return;
    // Send Next Quene Process
    const getFirstProcess = this.process_list[0]
    const setToCMD = buildCMD(getFirstProcess.cmd)
    this.process_list = this.process_list.filter(a => a.id !== getFirstProcess.id)
    this.process_pending = getFirstProcess
    this.client.write(setToCMD.data, cb)
  }
  _emitMsg(event, data) {
    this.function_listcall[event].forEach(a => {
      a(data)
    })
  }
  _connect() {
    this.client = new net.Socket()
    let client_timeout = setTimeout(() => {
      this._emitMsg("status", { code: "timeout", error: "Error timeout connection", status: "disconnect", isLogin: false })
      this.client.destroy()
    }, this.config.timeout)
    let receivedDataBuf = Buffer.alloc(0)

    const FncConnection = () => {
      this.statusConnect = true
      const _cmdMsg = [
        "/login",
        `=name=${this.config.username}`,
        `=password=${this.config.password}`
      ]
      if(this.enable_debugging) { console.log("[MikrotikAPI]: Login...") }
      this.sendtask(_cmdMsg)
    }
    const FncDataMessage = (data) => {
      receivedDataBuf = Buffer.concat([receivedDataBuf, data])
      const textDecode = decodeWord(receivedDataBuf, this.enable_debugging)
      const dataContext = HandleMessage(textDecode, this.enable_debugging)
      if(this.enable_debugging) { console.log("[MikrotikAPI]: Data:", textDecode, dataContext) }
      if(!textDecode?.find(a => a === "!done")) return; // Waiting new data...

      const IDProcess = this.process_pending.id

      receivedDataBuf = Buffer.alloc(0)
      this.process_pending = null
      this._sendquene()

      if(IDProcess.startsWith("login")) {
        if(client_timeout) {
          clearTimeout(client_timeout)
        }
        if(!!(dataContext[0]?.success)) {
          this._emitMsg("status", { status: "connect", isLogin: true })
        } else {
          this._emitMsg("status", { error: dataContext[0]?.message||"Uknowing", status: "disconnect", isLogin: false })
          this.client.end()
        }
        return; // Stop
      }
      if(!!dataContext?.error) {
        this._emitMsg("error", { error: dataContext.error, id: IDProcess })
        return; // Error Event
      }
      this._emitMsg("data", {
        id: IDProcess,
        data: dataContext
      })
    }
    const FncDisconnect = (error) => {
      this.statusConnect = false
      if(error) {
        this._emitMsg("error", { error: error?.message||error })
        this._emitMsg("status", { status: "disconnect", isLogin: false })
        if(this.enable_debugging) { console.log("[MikrotikAPI]: Error:", error) }
        return;
      }
      this._emitMsg("status", { status: "disconnect", isLogin: false })
      if(this.enable_debugging) { console.log("[MikrotikAPI]: Disconnect!") }
      if(this.config.useRetryConnect) {
        if(this.enable_debugging) { console.log("[MikrotikAPI]: Try again 3s..") }
        setTimeout(() => {
          this._connect()
        }, 3000)
      }
      this.client.off("data", FncDataMessage)
      this.client.off("end", FncDisconnect)
      this.client.off("close", FncDisconnect)
      this.client.off("error", FncDisconnect)
    }

    this.client.connect(this.config.port, this.config.host, FncConnection)
    this.client.on("data", FncDataMessage)
    this.client.on("end", FncDisconnect)
    this.client.on("close", FncDisconnect)
    this.client.on("error", FncDisconnect)
  }
  close() {
    if(!!this.client) {
      this.client.end()
    }
  }
  on(eventtype, callback) {
    const listKeyEvent = Object.keys(this.function_listcall)
    if(!this.function_listcall[eventtype]) {
      throw new Error(`Key event ${eventtype} not register, only ${listKeyEvent.join(", ")}`)
    }
    this.function_listcall[eventtype].push(callback)
  }
  off(eventtype, callback) {
    const listKeyEvent = Object.keys(this.function_listcall)
    if(!this.function_listcall[eventtype]) {
      throw new Error(`Key event ${eventtype} not register, only ${listKeyEvent.join(", ")}`)
    }
    this.function_listcall[eventtype] = this.function_listcall[eventtype].filter(a => a !== callback)
  }
  sendtask(rawTerminal = []) {
    if(this.enable_debugging) { console.log("[MikrotikAPI]: Push process:", rawTerminal) }
    const idGen = GenerateTaskID(rawTerminal[0])
    const dataPush = {
      id: idGen,
      cmd: rawTerminal
    }
    this.process_list.push(dataPush)
    this._sendquene()
    return idGen
  }
  async request(rawTerminal = []) {
    return new Promise((res, er) => {
      const requestdataemit = (type, data) => {
        this.off("data", data_emit)
        this.off("error", error_emit)
        if(type === "error") {
          return er(new Error(`${data.error} (${data.id})`))
        }
        return res(JSON.parse(JSON.stringify({
          ...data,
          id: undefined,
        })))
      }
      let processID = null
      const status_emit = (data) => {
        this.off("status", status_emit)
        if(!!data.isLogin) {
          processID = this.sendtask(rawTerminal)
        } else {
          if(typeof data.error === "string") {
            return er(new Error(`Error: ${data.error}`))
          }
          return er(new Error(`Connection Error!`))
        }
      }
      const data_emit = (data) => {
        if(data.id !== processID) return;
        requestdataemit("data", data)
      }
      const error_emit = (data) => {
        if(data.id !== processID) return;
        requestdataemit("error", data)
      }
      if(this.statusConnect) {
        processID = this.sendtask(rawTerminal)
      } else {
        this.on("status", status_emit)
      }
      this.on("data", data_emit)
      this.on("error", error_emit)
    })
  }
}

module.exports = MikrotikAPI