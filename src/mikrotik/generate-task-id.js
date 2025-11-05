function GenerateTaskID(firstCMD) {
  const stgr = "abcdef1234567890"
  const prefix = String(firstCMD?.slice(1)).replace(/[^a-zA-Z]/g, '-')
  const gnT = Array.from({ length: 15 }).map(() => {
    const gnS = Math.floor(Math.random() * stgr.length)
    return stgr[gnS]
  }).join("")

  return `${prefix}-${gnT}`
}

module.exports = GenerateTaskID