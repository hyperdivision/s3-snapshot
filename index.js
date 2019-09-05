const pump = require('pump')
const fs = require('fs')
const tar = require('tar-fs')
const rimraf = require('rimraf')
const low = require('last-one-wins')

module.exports = class Snapshot {
  constructor (dir, key, s3) {
    this.dir = dir
    this.s3 = s3
    this.key = key
    this.version = null

    // effectively mutex
    this.download = low(this._download.bind(this)).bind(this, this.key)
    this.snapshot = low(this._snapshot.bind(this)).bind(this, this.key)
  }

  rollback (cb) {
    this.s3.versions(this.key, (err, list) => {
      if (err) return cb(err)

      let next = false

      for (const { version } of list) {
        if (next) {
          this.version = version
          return cb(null, true)
        }
        if (version === this.version || !this.version) {
          next = true
        }
      }

      cb(null, false)
    })
  }

  exists (cb) {
    this.s3.exists(this.key, { version: this.version }, cb)
  }

  _download (key, cb) {
    const tmp = this.dir + '-tmp'
    pump(this.s3.createReadStream(key, { version: this.version }), tar.extract(tmp), err => {
      if (err) return cb(err)
      rimraf(this.dir, (err) => {
        if (err) return cb(err)

        fs.rename(tmp, this.dir, cb)
      })
    })
  }

  _snapshot (key, cb) {
    const tarball = this.dir + '.tar'

    pump(tar.pack(this.dir), fs.createWriteStream(tarball), err => {
      if (err) return cb(err)

      fs.stat(tarball, (err, stat) => {
        if (err) return cb(err)

        pump(fs.createReadStream(tarball), this.s3.createWriteStream(key, {
          length: stat.size
        }), (err) => {
          if (err) return cb(err)
          this.version = null
          cb(null)
        })
      })
    })
  }
}
