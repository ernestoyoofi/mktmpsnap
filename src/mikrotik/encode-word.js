function encodeWord(word) {
  const textBuffer = Buffer.from(word)
  const textLength = textBuffer.length

  // 0x80 = 128
  if(textLength < 0x80) {
    return Buffer.concat([Buffer.from([textLength]), textBuffer])
  }
  // 0x4000 = 16384
  if(textLength < 0x4000) {
    return Buffer.concat([Buffer.from([((textLength >> 8) | 0x80), (textLength & 0xFF)]), textBuffer])
  }
  // 0x4000 = 2097152
  if(textLength < 0x200000) {
    return Buffer.concat([Buffer.from([((textLength >> 16) | 0xC0), ((textLength >> 8) & 0xFF), (textLength & 0xFF)]), textBuffer])
  }
  // 0x4000 = 268435456
  if(textLength < 0x10000000) {
    return Buffer.concat([Buffer.from([((textLength >> 24) | 0xE0), ((textLength >> 16) & 0xFF), ((textLength >> 8) & 0xFF), (textLength & 0xFF)]), textBuffer])
  }
  return Buffer.concat([Buffer.from([0xF0, ((textLength >> 24) & 0xFF), ((textLength >> 16) & 0xFF), ((textLength >> 8) & 0xFF), (textLength & 0xFF)]), textBuffer])
}

module.exports = encodeWord