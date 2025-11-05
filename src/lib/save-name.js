function NameSaveBackup(uuid) {
  const a = new Date()
  const uuidParse = String(uuid)?.trim()?.replace(/-/g, "")
  return `mktmpsnap-${uuidParse||""}-d-${a.getDate()}-${a.getMonth()}-${a.getFullYear()}-t-${a.getHours()}-${a.getMinutes()}-${a.getSeconds()}.rsc`
}

export default NameSaveBackup