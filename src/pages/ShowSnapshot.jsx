import { useEffect, useRef, useState } from "react"
import { DatabaseBackupIcon, FileIcon } from "lucide-react"
import axios from "axios"
import { toast } from "sonner"

export default function ShowSnapshot() {
  const [data, setData] = useState({ isLoading: true, data: {} })
  const timeoutloop = useRef()

  async function LoadingDataRequest() {
    try {
      const uuid = new URL(location.href).pathname.split("/")[2]
      const apibaseurl = "/api/v1/snapshot/view?uuid="+uuid
      console.log(apibaseurl)
      const request = await axios.get(apibaseurl)
      if(request?.data?.status === "success") {
        setData(a => ({ ...a, isLoading: false, data: (request.data.data||{}) }))
        return;
      }
       setData(a => ({ ...a, isLoading: false, data: { error: String(request.data||{}) } }))
      toast.error("[ClientError]: The backend is not response properly.", {
        description: String(request?.data||"-")
      })
    } catch(e) {
      const axiosResponse = e.response
      if(axiosResponse) {
        if(axiosResponse.status === 404) {
          setData(a => ({ ...a, isLoading: false, data: { notfound: true } }))
        } else {
          setData(a => ({ ...a, isLoading: false, data: { error: String(axiosResponse.data) } }))
        }
        toast.error("[ServerError]: "+String(axiosResponse?.data?.message||axiosResponse?.data||"Unknowing"))
        return; // Stop On Ending
      }
      toast.error("[ClientError]: "+String(e?.stack||"Unkowning"))
    }
  }

  useEffect(() => {
    LoadingDataRequest()
  }, [])

  return <div className="w-full">
    <div className="w-full h-[120px] border-b border-neutral-100">
      <div className="w-full h-[120px] max-w-2xl m-auto flex items-center justify-center">
        <div className="w-[80px] h-[80px] flex items-center justify-center">
          <DatabaseBackupIcon size={36}/>
        </div>
        <div className="w-[calc(100%-80px)] px-3.5">
          <h2 className="text-2xl font-bold text-nowrap truncate">{data.isLoading? "Loading...": (data?.data?.header?.title||"Unknowing")}</h2>
          <p className="text-base mt-1 block">{data.isLoading? "Loading...":(data?.data?.header)? `IP: ${data?.data?.header?.hostname||"Unknowing"} ¦ Last Backup: ${data?.data?.header?.backup_last||"-"}`:"No data..."}</p>
          <small className="text-sm mt-1 block text-neutral-700 text-nowrap truncate">{data.isLoading? "Loading...":"Last Status: "+(data?.data?.header?.status||"Unknowing")}</small>
        </div>
      </div>
    </div>
    <div className="w-full min-h-[calc(100dvh-120px)] max-w-2xl m-auto py-1.5 px-3">
      {data?.data?.list && <>
        <p className="w-full block text-xl text-neutral-600 my-3.5 font-semibold">File Backup</p>
        {data?.data?.list?.map((items, key) => (
          <a className="w-full h-[60px] bg-neutral-200 rounded-md mb-2 flex items-center justify-center cursor-pointer" key={key} href={`http://localhost:3500/api/v1/snapshot/restore?uuid=${data.data.uuid}&file=${items.file}`}>
            <div className="w-[60px] h-[60px] flex items-center justify-center">
              <FileIcon size={20} />
            </div>
            <div className="w-[calc(100%-50px)] py-2 pr-3.5">
              <b className="w-full block text-base text-nowrap truncate">{items.file}</b>
              <small className="w-full block text-sm text-neutral-700 mt-0.5">{items.date}</small>
            </div>
          </a>
        ))}
      </>}
    </div>
  </div>
}