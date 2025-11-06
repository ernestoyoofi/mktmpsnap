import "./lib/dotenv"
import { CronJob } from "cron"
import { serve } from "bun"
import fs from "fs"
import database from "./lib/database"
import BackupCronJobs, { folderContextBackup } from "./lib/mk.backup-config"
import index from "./index.html"
import path from "path"

const defaultheaders = {
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval'; connect-src 'self'",
  "Content-Type": "application/json; charset=utf-8",
}

const cron_config = {
  time: String(process.env?.CRON_TIME || "*/5 * * * *"), // By default is 5 minutes
  timezone: String(process.env?.TZ_TIME || "Asia/Jakarta")
}
let cron_info = {
  start_execute: null,
  finis_execute: null,
}

// Checking Database
database.RunningSetupDatabase()

async function CronJobExecutedBackup() {
  const time_start = new Date()
  console.log("[Cron Jobs]: 🕛 Start on "+(new Date()))
  // Process
  const data = await database.SnapShotCronJobs()
  if(Array.isArray(data.data)) {
    for(let a of Array.from(data.data||[])) {
      const jobs_id = String(a.uuid||"")
      const folderContext = folderContextBackup(jobs_id)

      if(!a.isEnd) {
        // Processing backup!
        console.log("[Cron Jobs]: 📂 Start Backup "+jobs_id+" ...")
        BackupCronJobs({ ...(a.mikrotik), uuid_backup: jobs_id }).then(res => {
          let statusMsg = `Success save configuration on ${new Date().toString()}`
          if(res.status !== "success") {
            statusMsg = String(res.message||"Unknowing error mikrotik backup!")
          }
          console.log("[Cron Jobs]: 📂 Jobs: "+jobs_id+" with status: "+String(statusMsg))
          database.UpdateStatusSnapShot({
            body: { uuid: jobs_id, message: statusMsg }
          })
        })
      }

      if(!!a.isTemporaryRm) {
        // Removing Folder
        console.log("[Cron Jobs]: 🗑️ Remove Folder:", jobs_id)
        fs.rmSync(folderContext, { recursive: true, force: true })
        console.log("[Cron Jobs]: 🗑️ Remove Database:", jobs_id)
        database.DeleteSnapShot({ body: { uuid: jobs_id }})
      }
    }
  }
  // Success
  const time_end = new Date()
  console.log("[Cron Jobs]: 🕛 Finish at "+(new Date()))
  cron_info = { start_execute: time_start, finis_execute: time_end }
}

// First Executed()
CronJobExecutedBackup()
// Cron Jobs
// new CronJob(
//   cron_config.time,
//   CronJobExecutedBackup,
//   null, true,
//   cron_config.timezone
// )

const server = serve({
  routes: {
    // React
    "/icon.ico": Bun.file("./icon.ico"),
    "/*": index,
    // API Access
    "/api/v1/cron-status": {
      async GET() {
        return Response.json({
          data: { config: cron_config, info: cron_info }
        }, { status: 200, headers: defaultheaders })
      }
    },
    // API Create Snapshot Backup
    "/api/v1/snapshot/create": {
      async POST(req) {
        try {
          const dataBody = await req.body.json()
          const dataResponse = await database.CreateSnapShot({
            body: dataBody
          })
          const statusRes = dataResponse.status !== "success"? 400 : dataResponse?.code? dataResponse.code : 200
          return Response.json(dataResponse, { status: statusRes, headers: defaultheaders })
        } catch(e) {
          console.log("[Debugging API Error]: /api/v1/temp-snap/create", e.stack)
          return Response.json(
            { status: "error", code: 500, message: "Internal Server Error" },
            { status: 500, headers: defaultheaders }
          )
        }
      }
    },
    // API View Snapshot Backup
    "/api/v1/snapshot/view": {
      async GET(req) {
        try {
          const turl = String(req?.url||"")
          const query = new URLSearchParams(turl.split("?")[1])
          const get_uuid = query.get("uuid")
          console.log("[API Request]: 🔥 Access Data:", get_uuid)
          const dataResponse = await database.ViewSnapShot({ body: { uuid: get_uuid }})
          const statusRes = dataResponse.status !== "success"? 400 : dataResponse?.code? dataResponse.code : 200
          return Response.json(dataResponse, { status: statusRes, headers: defaultheaders })
        } catch(e) {
          console.log("[Debugging API Error]: /api/v1/temp-snap/create", e.stack)
          return Response.json(
            { status: "error", code: 500, message: "Internal Server Error" },
            { status: 500, headers: defaultheaders }
          )
        }
      }
    },
    // API View Snapshot Backup
    "/api/v1/snapshot/restore": {
      async GET(req) {
        try {
          const turl = String(req?.url||"")
          const query = new URLSearchParams(turl.split("?")[1])
          const get_uuid = query.get("uuid")
          const get_file = query.get("file")

          const folderContext = folderContextBackup(get_uuid)
          const joinfolder = path.join(folderContext, get_file)

          if(!fs.existsSync(joinfolder)) {
            return Response.json({
              status: "error",
              code: 404,
              message: "Not Found!",
            }, { status: 404, headers: defaultheaders })
          }

          const filedown = fs.readFileSync(joinfolder)
          return new Response(filedown, {
            status: 200, headers: {
              ...defaultheaders,
              "Content-Disposition": `attachment; filename="${get_file}"`
            }
          })
        } catch(e) {
          console.log("[Debugging API Error]: /api/v1/temp-snap/restore", e.stack)
          return Response.json(
            { status: "error", code: 500, message: "Internal Server Error" },
            { status: 500, headers: defaultheaders }
          )
        }
      }
    }
  },
  port: process.env?.PORT || 3500,
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
})

console.log(`[Server]: 🚀 Server running at ${server.url}`)
