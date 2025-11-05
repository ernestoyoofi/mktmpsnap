import axios from "axios"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

export default function HomeFormStartSnap() {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  async function CreateSnapshot(e) {
    e.preventDefault()
    if(isLoading) return; // Skip!
    setIsLoading(true)
    try {
      const apibaseurl = "/api/v1/snapshot/create"
      const dataform = Object.fromEntries(new FormData(e.target))
      const datajson = { ...dataform, mikrotik_port: Number(dataform.mikrotik_port) }
      const request = await axios.post(apibaseurl, datajson)
      if(request?.data?.status !== "success" && !!request?.data?.status) {
        toast.error(request?.data?.message||"Unknowing")
        return;
      }
      if(request?.data?.status === "success" && !!(request?.data?.data?.uuid||"")) {
        navigate(`/mktmp/${request.data.data.uuid||"error-route"}`)
        toast.success("Success create snapshot!")
        return;
      }
      toast.error("[ClientError]: The backend is not response properly.", {
        description: String(request?.data||"-")
      })
    } catch(e) {
      const axiosResponse = e.response
      if(axiosResponse) {
        toast.error("[ServerError]:"+String(axiosResponse?.data?.message||axiosResponse?.data||"Unknowing"))
        return; // Stop On Ending
      }
      toast.error("[ClientError]:"+String(e?.stack||"Unkowning"))
    } finally {
      setTimeout(() => {
        setIsLoading(false)
      }, 300)
    }
  }

  return <div className="w-full h-dvh min-h-[450px] flex items-center justify-center">
    <form className="w-full max-w-xs px-4.5" onSubmit={CreateSnapshot}>
      <h2 className="text-xl font-bold text-center">MKTMPSNAP</h2>
      <p className="text-center my-3.5 mb-5">Auto backup Mikrotik with Cronjobs.</p>
      <label className="w-full block mt-1.5">
        <span className="block w-full text-neutral-800 text-sm px-1 py-1.5">Mikrotik Host/IP <span className="text-red-500 text-sm">*</span></span>
        <input
          required
          type="text"
          className="w-full block p-1.5 px-3 rounded-md border border-neutral-300 text-base outline-0 focus:outline-2 outline-blue-700/50 duration-300 shadow-sm"
          placeholder="192.168.88.1"
          name="mikrotik_hostname"  
        />
      </label>
      <label className="w-full block mt-1.5">
        <span className="block w-full text-neutral-800 text-sm px-1 py-1.5">Mikrotik Username <span className="text-red-500 text-sm">*</span></span>
        <input
          required
          type="text"
          className="w-full block p-1.5 px-3 rounded-md border border-neutral-300 text-base outline-0 focus:outline-2 outline-blue-700/50 duration-300 shadow-sm"
          placeholder="admin"
          defaultValue="admin"
          name="mikrotik_username"  
        />
      </label>
      <label className="w-full block mt-1.5">
        <span className="block w-full text-neutral-800 text-sm px-1 py-1.5">Mikrotik Password</span>
        <input
          type="password"
          className="w-full block p-1.5 px-3 rounded-md border border-neutral-300 text-base outline-0 focus:outline-2 outline-blue-700/50 duration-300 shadow-sm"
          placeholder="*******"
          name="mikrotik_password"  
        />
      </label>
      <label className="w-full block mt-1.5">
        <span className="block w-full text-neutral-800 text-sm px-1 py-1.5">Mikrotik Port</span>
        <input
          type="number"
          className="w-full block p-1.5 px-3 rounded-md border border-neutral-300 text-base outline-0 focus:outline-2 outline-blue-700/50 duration-300 shadow-sm"
          placeholder="8728"
          defaultValue="8728"
          name="mikrotik_port"  
        />
      </label>
      <label className="w-full block mt-1.5">
        <span className="block w-full text-neutral-800 text-sm px-1 py-1.5">Time End Auto Backup <span className="text-red-500 text-sm">*</span></span>
        <input
          required
          type="datetime-local"
          className="w-full block p-1.5 px-3 rounded-md border border-neutral-300 text-base outline-0 focus:outline-2 outline-blue-700/50 duration-300 shadow-sm"
          placeholder="05/05/2025"
          name="backup_date"  
        />
      </label>
      <div className="my-5 border-t border-neutral-200"/>
      <button className="w-full block bg-blue-500 hover:bg-blue-700 text-white p-2 px-3.5 rounded-md mt-4.5 cursor-pointer shadow-md" type="submit">
        <span className="font-semibold pointer-events-none text-sm">{isLoading? "Waiting...":"Create Auto Backup!"}</span>
      </button>
    </form>
  </div>
}