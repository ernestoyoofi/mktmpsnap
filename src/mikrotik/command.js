const encodeWord = require("./encode-word")

function buildCommand(command = []) {
  const parts = []
  if(!Array.isArray(command)) {
    return { error: "er_show_notarraycommand" }
  }
  for(let word of command) {
    parts.push(encodeWord(word))
  }
  parts.push(encodeWord(''))
  return { data: Buffer.concat(parts) }
}

module.exports = buildCommand