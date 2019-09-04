const Snapshot = require('.')
const s3 = require('s3-storage/fs')

const s = s3('fake-s3', { prefox: '' })

const snap = new Snapshot('./test', s)
const snap2 = new Snapshot('./test-down', s)

snap.snapshot(function (err) {
  if (err) throw err

  snap2.download('test.tar', console.log)
})
