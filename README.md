# `s3-snapshot`

>

## Usage

```js
var S3Snapshot = require('s3-snapshot')

```

## API

### `const snap = S3Snapshot(directory, s3path, s3)`

Create new instance that will snapshot `directory` using a `s3-storage` instance

### `snap.exists(cb)`

Check if a snapshot exists

### `snap.download(cb)`

Download a snapshot

### `snap.rollback(cb)`

Rollback to a previous version of a snapshot. `cb(null, true)`
if a previous version exists and `cb(null, false)` otherwise.

You have to redownload it afterwards

### `snap.snapshot(cb)`

Make a new snapshot. Resets any previous rollback.

## Install

```sh
npm install s3-snapshot
```

## License

[ISC](LICENSE)
