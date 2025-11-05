import "../lib/dotenv"
import MikrotikAPI from "../mikrotik/connection"

const params_ip = process.argv.includes("--hostname")? process.argv[process.argv.indexOf("--hostname")+1] : "192.168.88.1"
const params_username = process.argv.includes("--username")? process.argv[process.argv.indexOf("--username")+1] : "admin"
const params_password = process.argv.includes("--password")? process.argv[process.argv.indexOf("--password")+1] : ""
const params_port = process.argv.includes("--port")? parseInt(process.argv[process.argv.indexOf("--port")+1]||"8728") : 8728
const optionRunningCLI = process.argv.includes("--runningCLI")? true:false

async function CheckConnectionMikrotik({ host = params_ip, username = params_username, password = params_password, port = params_port } = {}) {
  return new Promise((res) => {
    try {
      const option_apis = {
        host: host,
        port: port,
        username: username,
        password: password,
        timeout: process.env?.MIKROTIK_TIMEOUT? parseInt(process.env?.MIKROTIK_TIMEOUT||"0") : 2500,
        debuggingLog: false
      }
      const mkapi = new MikrotikAPI(option_apis)
      const ev = (e) => {
        if(optionRunningCLI) { console.log("[Mikrotik Check Connection Result]: EmitEvent = "+JSON.stringify(e)) }
        if(e.status === "connect") {
          setTimeout(() => { mkapi.off("status", ev); mkapi.close() }, 50)
          return res({ status: "connect", save: true })
        }
        if(e.status === "disconnect") {
          return res({ status: "error", save: false, message: String(e?.error||"Uknowing Error")  })
        }
      }
      mkapi.on("status", ev)
    } catch(e) {
      if(optionRunningCLI) { console.error("[Mikrotik Check Connection Result]: Status = Error, Message =", e.stack) }
      return res({ status: "error", save: false, message: String(e?.message||"Uknowing Error!") })
    }
  })
}

// DISABLE FOR NOW
// if(optionRunningCLI && process.argv.find(a => a.match("mk.check-connection.js"))) {
//   CheckConnectionMikrotik()
// }

export default CheckConnectionMikrotik