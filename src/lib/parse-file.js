function parseFileBackup(filename) {
  const dataSplit = String(filename)?.split(".")[0]?.split("-")

  // Skip!
  if(dataSplit[0] !== "mktmpsnap" || dataSplit.length !== 10) {
    return undefined
  }
  if(filename.split(".")[1] !== "rsc") {
    return undefined
  }
  // Next
  const str_hour = String(dataSplit[7]).padStart(2,"0")
  const str_minute = String(dataSplit[8]).padStart(2,"0")
  const str_second = String(dataSplit[9]).padStart(2,"0")
  const str_day = String(dataSplit[3]).padStart(2,"0")
  const str_month = String(dataSplit[4]).padStart(2,"0")
  const str_year = String(dataSplit[5]).padStart(2,"0")
  const stringDate = `${str_month}-${str_day}-${str_year}`
  const stringTime = `${str_hour}:${str_minute}:${str_second}`
  const dateStg = new Date(`${stringDate} ${stringTime}`)

  if(isNaN(dateStg)) {
    return undefined
  }

  return {
    filename: filename,
    uuid: String(dataSplit[1]),
    date: dateStg
  }
}

export default parseFileBackup