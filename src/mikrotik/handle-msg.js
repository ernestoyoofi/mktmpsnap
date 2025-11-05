function HandleMessage(arrayMsg = [], debuggingEnable = false) {
  if(debuggingEnable) { console.log('[Mikrotik API/HandleMessage]: Data:', JSON.stringify(arrayMsg)) }
  if(!Array.isArray(arrayMsg) || arrayMsg.length === 0) {
    return []
  }
  if(arrayMsg[0] === "!done") {
    return [{ success: true, _action: "accept" }]
  }
  const msgErr = arrayMsg.find(a => a.match('=message='))
  if(!!msgErr && !!(arrayMsg.find(a => a === "!trap")[0])) {
    return [{ message: String(msgErr?.split("=message=")[1]||"") }]
  }
  const reIndices = arrayMsg
    .map((a, i) => a === "!re" ? i : -1)
    .filter(i => i !== -1)
  
  if(reIndices.length === 0 && arrayMsg.some(a => !a.startsWith('!') && a !== '')) {
    reIndices.push(-1) 
  }
  const processedData = reIndices.map((_, i) => {
    const start = reIndices[i] + 1 
    const end = reIndices[i + 1] !== undefined ? reIndices[i + 1] : arrayMsg.length
    if(start >= end) return null
    const entry = arrayMsg.slice(start, end).filter(a => !a.startsWith("!") && a !== "")
    return entry.reduce((obj, propString) => {
      const cleanedString = propString.startsWith('=.') 
        ? propString.substring(2)
        : propString.substring(1)
      const equalSignIndex = cleanedString.indexOf('=')
      if(equalSignIndex > 0) {
        const key = cleanedString.substring(0, equalSignIndex)
        const value = cleanedString.substring(equalSignIndex + 1)
        obj[key] = value
      }
      return obj
    }, {})
  })
  return processedData.filter(item => item !== null)
}

module.exports = HandleMessage