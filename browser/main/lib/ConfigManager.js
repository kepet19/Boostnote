import _ from 'lodash'

const OSX = global.process.platform === 'darwin'
const electron = require('electron')
const { ipcRenderer } = electron

let isInitialized = false

const defaultConfig = {
  zoom: 1,
  isSideNavFolded: false,
  listWidth: 250,
  navWidth: 200,
  hotkey: {
    toggleFinder: OSX ? 'Cmd + Alt + S' : 'Super + Alt + S',
    toggleMain: OSX ? 'Cmd + Alt + L' : 'Super + Alt + E'
  },
  ui: {
    theme: 'default',
    disableDirectWrite: false,
    defaultNote: 'ALWAYS_ASK' // 'ALWAYS_ASK', 'SNIPPET_NOTE', 'MARKDOWN_NOTE'
  },
  editor: {
    theme: 'default',
    fontSize: '14',
    fontFamily: 'Monaco, Consolas',
    indentType: 'space',
    indentSize: '2',
    switchPreview: 'BLUR' // Available value: RIGHTCLICK, BLUR
  },
  preview: {
    fontSize: '14',
    fontFamily: 'Lato',
    codeBlockTheme: 'xcode',
    lineNumber: true
  }
}

function validate (config) {
  if (!_.isObject(config)) return false
  if (!_.isNumber(config.zoom) || config.zoom < 0) return false
  if (!_.isBoolean(config.isSideNavFolded)) return false
  if (!_.isNumber(config.listWidth) || config.listWidth <= 0) return false

  return true
}

function _save (config) {
  console.log(config)
  window.localStorage.setItem('config', JSON.stringify(config))
}

function get () {
  let config = window.localStorage.getItem('config')

  try {
    config = Object.assign({}, defaultConfig, JSON.parse(config))
    config.hotkey = Object.assign({}, defaultConfig.hotkey, config.hotkey)
    config.ui = Object.assign({}, defaultConfig.ui, config.ui)
    config.editor = Object.assign({}, defaultConfig.editor, config.editor)
    config.preview = Object.assign({}, defaultConfig.preview, config.preview)
    if (!validate(config)) throw new Error('INVALID CONFIG')
  } catch (err) {
    console.warn('Boostnote resets the malformed configuration.')
    config = defaultConfig
    _save(config)
  }

  if (!isInitialized) {
    isInitialized = true
    let editorTheme = document.getElementById('editorTheme')
    if (editorTheme == null) {
      editorTheme = document.createElement('link')
      editorTheme.setAttribute('id', 'editorTheme')
      editorTheme.setAttribute('rel', 'stylesheet')
      document.head.appendChild(editorTheme)
    }
    if (config.editor.theme !== 'default') {
      editorTheme.setAttribute('href', '../node_modules/codemirror/theme/' + config.editor.theme + '.css')
    }
  }

  return config
}

function set (updates) {
  let currentConfig = get()
  let newConfig = Object.assign({}, defaultConfig, currentConfig, updates)
  if (!validate(newConfig)) throw new Error('INVALID CONFIG')
  _save(newConfig)

  if (newConfig.ui.theme === 'dark') {
    document.body.setAttribute('data-theme', 'dark')
  } else {
    document.body.setAttribute('data-theme', 'default')
  }

  let editorTheme = document.getElementById('editorTheme')
  if (editorTheme == null) {
    editorTheme = document.createElement('link')
    editorTheme.setAttribute('id', 'editorTheme')
    editorTheme.setAttribute('rel', 'stylesheet')
    document.head.appendChild(editorTheme)
  }
  editorTheme.setAttribute('href', '../node_modules/codemirror/theme/' + newConfig.editor.theme + '.css')

  ipcRenderer.send('config-renew', {
    config: get()
  })
}

export default {
  get,
  set,
  validate
}
