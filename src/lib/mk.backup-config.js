import "../lib/dotenv"
import MikrotikAPI from "../mikrotik/connection"
import CheckConnectionMikrotik from "./mk.check-connection"
import fs from "fs"
import path from "path"
import NameSaveBackup from "./save-name"

const params_ip = process.argv.includes("--hostname")? process.argv[process.argv.indexOf("--hostname")+1] : "192.168.88.1"
const params_username = process.argv.includes("--username")? process.argv[process.argv.indexOf("--username")+1] : "admin"
const params_password = process.argv.includes("--password")? process.argv[process.argv.indexOf("--password")+1] : ""
const params_port = process.argv.includes("--port")? parseInt(process.argv[process.argv.indexOf("--port")+1]||"8728") : 8728
const optionRunningCLI = process.argv.includes("--runningCLI")? true:false

const storagePath = path.join(String(process.env.BACKUP_STORAGE||"{pwd}/data/backup").replace(/{pwd}/g, process.cwd()))

async function BackupCronJobs({ host = params_ip, username = params_username, password = params_password, port = params_port, uuid_backup = "" } = {}) {
  const checking = await CheckConnectionMikrotik({ host, username, password, port })
  if(checking.status !== "connect") {
    return {
      ...checking,
      status: "error"
    }
  }
  const config_apis = {
    host: host,
    port: port,
    username: username,
    password: password,
    timeout: process.env?.MIKROTIK_TIMEOUT? parseInt(process.env?.MIKROTIK_TIMEOUT||"0") : 2500,
    debuggingLog: false
  }
  const mkapi = new MikrotikAPI(config_apis)
  const filename = NameSaveBackup(uuid_backup)
  // Make Backup
  await mkapi.request([`/export`, `=file=${filename}`])
  // Creating Folder
  const contextFolder = path.join(storagePath, `backup-${uuid_backup}`)
  if(!fs.existsSync(contextFolder) || !fs.lstatSync(contextFolder).isDirectory()) {
    fs.mkdirSync(contextFolder, { recursive: true })
  }
  // Check
  const saveFile = path.join(contextFolder, `${filename}`)
  await new Promise((t) => setTimeout(t, 2000))
  const fl_check = await mkapi.request(["/file/print", `?name=${filename}`])
  if(!fl_check?.data[0]?.id) {
    mkapi.close()
    return {
      status: "error",
      save: false,
      error: "File Not Found!",
      message: "File Not Found!",
    }
  }
  // Save
  try {
    fs.writeFileSync(saveFile, String(fl_check.data[0].contents), "utf-8")
  } catch(e) {
    console.log("[File Save Error!]:", e)
    return {
      status: "error",
      save: false,
      error: "File can't save!",
      message: "File can't save!",
    }
  }
  // Delete
  const rm_file = await mkapi.request(["/file/remove", `=.id=${fl_check?.data[0]?.id}`])
  if(!!rm_file?.data[0]?.message) {
    mkapi.close()
    return {
      status: "error",
      save: false,
      error: String(rm_file?.data[0]?.message||"Unknowing"),
      message: String(rm_file?.data[0]?.message||"Unknowing"),
    }
  }
  // Close
  mkapi.close()
  return {
    status: "success",
    save: true,
    data: [{
      filename: saveFile,
      success: true
    }]
  }
}

// DISABLE FOR NOW
if(optionRunningCLI && process.argv.find(a => a.match("mk.backup-config.js"))) {
  BackupCronJobs({ uuid_backup: "testing" }).then(a => console.log("[Result Test]:", a))
}

export function folderContextBackup(uuid) {
  const contextFolder = path.join(storagePath, `backup-${uuid}`)
  return contextFolder
}
export default BackupCronJobs