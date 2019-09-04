const pump = require('pump')
const fs = require('fs')
const tar = require('tar-fs')
const rimraf = require('rimraf')
const low = require('last-one-wins')

module.exports = class Snapshot {
  constructor (dir, s3) {
    this.dir = dir
    this.s3 = s3

    // effectively mutex
    this.download = low(this._download.bind(this))
    this.snapshot = low(this._snapshot.bind(this))
  }

  _download (key, cb) {
    const tmp = this.dir + '-tmp'
    pump(this.s3.createReadStream(key), tar.extract(tmp), err => {
      if (err) return cb(err)
      rimraf(this.dir, (err) => {
        if (err) return cb(err)

        fs.rename(tmp, this.dir, cb)
      })
    })
  }

  _snapshot (cb) {
    const tarball = this.dir + '.tar'

    pump(tar.pack(this.dir), fs.createWriteStream(tarball), err => {
      if (err) return cb(err)

      fs.stat(tarball, (err, stat) => {
        if (err) return cb(err)

        pump(fs.createReadStream(tarball), this.s3.createWriteStream(tarball, {
          length: stat.size
        }), cb)
      })
    })
  }
}
