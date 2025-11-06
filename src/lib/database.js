import "dotenv"
import { Database } from "bun:sqlite"
import { v4 as uuidv4 } from "uuid"
import { folderContextBackup } from "./mk.backup-config"
import CheckConnectionMikrotik from "./mk.check-connection"
import validationform from "./validation.createsnapshot"
import path from "path"
import fs from "fs"
import parseFileBackup from "./parse-file"

const uriSqlite = String(process.env?.SQLITE_STORAGE||"{pwd}/data/database.sqlite").replace(/{pwd}/g, process.cwd())
const folderSqlite = String(path?.parse(uriSqlite)?.dir||"/app/data")

if(!fs.existsSync(folderSqlite) || !fs.lstatSync(folderSqlite).isDirectory()) {
  fs.mkdirSync(folderSqlite, { recursive: true })
}

const db = new Database(uriSqlite, { create: true })

// Setup Database
async function RunningSetupDatabase() {
  console.log("[SQLite]: Checking setup")
  try {
    db.query(`CREATE TABLE IF NOT EXISTS snapshot (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  uuid TEXT NOT NULL,
  status TEXT NOT NULL,
  mikrotik_hostname TEXT NOT NULL,
  mikrotik_username TEXT NOT NULL,
  mikrotik_password TEXT,
  mikrotik_port INTEGER NOT NULL,
  backup_end DATE NOT NULL,
  backup_last DATE
);`.trim()).run()
  } catch(e) {
    console.log("[SQLite]: Error:", e.stack)
  }
  return {}
}

// Checking By Cron Jobs
async function SnapShotCronJobs() {
  try {
    const querysb = db.query(`SELECT
  uuid,
  mikrotik_hostname,
  mikrotik_username,
  mikrotik_password,
  mikrotik_port,
  (CASE WHEN backup_end < datetime('now') THEN 1 ELSE 0 END) AS is_end,
  (CASE WHEN datetime('now') > datetime(backup_end, '+15 days') THEN 1 ELSE 0 END) AS is_temporary
FROM snapshot;`)
    const execute = Array.from(querysb.all()).map(a => ({
      uuid: String(a.uuid),
      mikrotik: {
        host: String(a.mikrotik_hostname),
        username: String(a.mikrotik_username||"admin"),
        password: String(a.mikrotik_password||""),
        port: a.mikrotik_port||8728,
      },
      isEnd: !!(a.is_end),
      isTemporaryRm: !!(a.is_temporary)
    }))
    return {
      data: execute
    }
  } catch(e) {
    console.log("[CronJobsCheckerError]:",e.stack)
    return {
      data: []
    }
  }
}

// Create Snapshot
async function CreateSnapShot({
  body = {
    mikrotik_hostname: "",
    mikrotik_username: "",
    mikrotik_password: "",
    mikrotik_port: 8728,
    backup_date: ""
  }
}) {
  const dataValidate = validationform(body)
  if(!!dataValidate) {
    return dataValidate
  }
  const validateFm = await CheckConnectionMikrotik({
    host: body.mikrotik_hostname,
    username: body.mikrotik_username,
    password: body.mikrotik_password,
    port: body.mikrotik_port,
  })
  if(validateFm.status !== "success") {
    return {
      status: "error",
      code: 400,
      message: "Can't connect to your mikrotik!"
    }
  }
  const cronjobuuid = uuidv4()
  const sqlquery = `INSERT INTO snapshot
(title, uuid, status, mikrotik_hostname, mikrotik_username, mikrotik_password, mikrotik_port, backup_end, backup_last)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL);`
  const stmt = db.prepare(sqlquery)
  const insertdata = [
    String(body?.title_snapshot||`Default Snapshot ${cronjobuuid}`),
    cronjobuuid,
    String("Waiting Execute By Cron Jobs..."),
    String(body.mikrotik_hostname),
    String(body.mikrotik_username),
    String(body.mikrotik_password),
    body.mikrotik_port || 8728,
    new Date(body.backup_date).toISOString()
  ]
  stmt.run(insertdata)
  return {
    status: "success",
    data: {
      api: String(`/api/v1/snapshot/view?uuid=${cronjobuuid}`),
      uuid: String(cronjobuuid),
    }
  }
}

// View Snapshot
async function ViewSnapShot({ body = { uuid: "" } }) {
  const uuidparams = String(body?.uuid||"").trim()
  const sqlquery = `SELECT * FROM snapshot WHERE uuid = ?;`
  const stmt = db.prepare(sqlquery)
  const request = stmt.get([uuidparams])

  if(!request) {
    return {
      status: "notfound",
      code: 404,
      message: "404 Not Found"
    }
  }

  const folder_backup = folderContextBackup(request.uuid)
  console.log(folder_backup)
  const list_file_backup = (
    fs.existsSync(folder_backup)? fs.readdirSync(folder_backup) : []
  ).map(a => parseFileBackup(a)).map(a => ({
    file: a.filename,
    date: a.date,
  }))

  return {
    status: "success",
    data: {
      uuid: String(request.uuid||"").trim(),
      header: {
        title: String(request.title||""),
        status: String(request.status||""),
        hostname: String(request.mikrotik_hostname||""),
        backup_is_end: new Date(request.backup_end||"").getTime() < new Date().getTime(),
        backup_end: new Date(request.backup_end||""),
        backup_last: request.backup_last? new Date(request.backup_last||""):null,
      },
      list: list_file_backup
    }
  }
}

// Delete Snapshot
async function DeleteSnapShot({ body = { uuid: "" } }) {
  const uuidparams = String(body?.uuid||"").trim()
  try {
    const sqlquery = `DELETE FROM snapshot WHERE uuid = ?;`
    const stmt = db.prepare(sqlquery)
    stmt.run([uuidparams])
    return {}
  } catch(e) {
    return {}
  }
}

// Update Status
async function UpdateStatusSnapShot({ body = { uuid: "", message: "" } }) {
  const uuidparams = String(body?.uuid||"").trim()
  try {
    const sqlquery = `UPDATE snapshot SET status = ? WHERE uuid = ?;`
    const stmt = db.prepare(sqlquery)
    stmt.run([String(body?.message||""), uuidparams])
    return {}
  } catch(e) {
    return {}
  }
}

export default {
  RunningSetupDatabase,
  SnapShotCronJobs,
  CreateSnapShot,
  UpdateStatusSnapShot,
  DeleteSnapShot,
  ViewSnapShot,
}