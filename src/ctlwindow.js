'use strict'
let filename
let numPages
let page
let notes = {}

const enumCameras = async () => {
  const constraints = {
    audio: false,
    video: {
      width: 1280,
      height: 720
    }
  }
  let stream
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints)
  } catch (e) {
    stream = null
  }
  const devices = await navigator.mediaDevices.enumerateDevices()
  const elm = document.getElementById('camera')
  devices.forEach(device => {
    if (device.kind === 'videoinput') {
      const opt = document.createElement('option')
      opt.setAttribute('value', device.deviceId)
      opt.textContent = device.label
      elm.appendChild(opt)
    }
  })
  if (stream) stream.getTracks().forEach(track => track.stop())
}

const timer = (function () {
  let start = new Date()
  return (state) => {
    if (state === 'reset' || start === undefined) {
      start = new Date()
    }
    const span1 = document.getElementById('now')
    const span2 = document.getElementById('elapsed')
    const now = new Date()
    const p = ((now - start) / 1000) | 0
    const h = (p / 3600) | 0
    const m = ((p / 60) | 0) % 60
    const s = p % 60
    span1.textContent = now.toLocaleTimeString()
    span2.textContent = `${(h).toString().padStart(2, '0')}:${(m).toString().padStart(2, '0')}:${(s).toString().padStart('2', 0)}`
  }
})()

const basename = filename => {
  return (/([^\\/]*)$/.exec(filename) || ['', ''])[1]
}

const cameraSwitch = () => {
  const cameraId = document.getElementById('camera').value
  const cameraType = document.getElementById("cameraType").v.value
  window.electron.sendMessage({ msg: 'camera', cameraId, cameraType })
}

const pageChange = (newPage) => {
  if (newPage !== undefined) {
    page = newPage
    document.getElementById('page').value = page
  }
  document.getElementById('note').value = notes[page] !== undefined ? notes[page] : ''
}

document.addEventListener('DOMContentLoaded', () => {
  timer()
  setInterval(timer, 1000)
  document.getElementById('elapsed-reset').addEventListener('click', (evt) => {
    timer('reset')
  }, false)
  enumCameras()
  document.getElementById('prev-page').addEventListener('click', (evt) => {
    window.electron.sendMessage({ msg: 'page', absolute: false, value: -1 })
  }, false)
  document.getElementById('next-page').addEventListener('click', (evt) => {
    window.electron.sendMessage({ msg: 'page', absolute: false, value: 1 })
  }, false)
  document.getElementById('camera').addEventListener('change', (evt) => {
    cameraSwitch()
  }, false)
  let v_button = document.getElementsByName('v')
  for (let i = 0; i < v_button.length; i++) {
    v_button[i].addEventListener('click', (evt) => {
      cameraSwitch()
    }, false);
  }
  document.getElementById('jump').addEventListener('click', (evt) => {
    const value = document.getElementById('page').value | 0
    window.electron.sendMessage({ msg: 'page', absolute: true, value })
  }, false)
  window.addEventListener('message', (evt) => {
    const message = evt.data
    console.log(message)
    switch (message.msg) {
      case 'load':
        filename = message.filename
        numPages = message.pages
        document.title = `pp (ctrl) - ${basename(message.filename)}`
        document.getElementById('numPages').textContent = numPages
        break
      case 'page':
        pageChange(message.page)
        break
      case 'notes':
        notes = message.notes || {}
        pageChange()
        break
      case 'reload':
        window.electron.sendMessage({ msg: 'load', filename, page})
        cameraSwitch()
        break
    }
  }, false)
}, false)

window.addEventListener('keyup', (evt) => {
  if (['ArrowLeft', 'ArrowUp', 'p', 'PageUp', 'Backspace'].indexOf(evt.key) >= 0) {
    window.electron.sendMessage({ msg: 'page', absolute: false, value: -1 })
  } else if (['ArrowRight', 'ArrowDown', 'n', ' ', 'PageDown', 'Enter'].indexOf(evt.key) >= 0) {
    window.electron.sendMessage({ msg: 'page', absolute: false, value: 1 })
  }
}, false)
