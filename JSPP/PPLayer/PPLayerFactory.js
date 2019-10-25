(function () {

  if (!window.JSPP) return

  let __FILE_PATH__ = JSPP.__core__.DebugInfo.FilePath

  let public = {
    static: {
      getInstance: function () {
        if (!this.instance) {
          this.instance = JSPP.ppnew('PPLayerFactory')
        }
        return this.instance
      }
    },
    // 构造函数不支持传参，界面要求有默认状态，需要特殊状态自行提供相应的方法
    createCCSView: function (key) {
      let cfg = this.getKeyInfo(key)
      if (cfg && cfg.length === 3) {
        return JSPP.ppnew(cfg[0], cfg[1], cfg[2])
      }
      JSPP.pperror('PPLayerFactory: key [' + key + ']\'s keyinfo can\'t be use !')
    },
    // 添加类配置
    addKeyToFactory: function (key, useclassname, ccspath, pathinfo) {
      this.ccsPathMap[key] = [useclassname, ccspath, pathinfo]
    },
    // 获取类配置
    getKeyInfo: function (key) {
      return this.ccsPathMap[key]
    }
  }

  let protected = {}

  let private = {
    static: {
      instance: null,
      ccsPathMap: {}
    },
    PPLayerFactory: function () {

    },
    _PPLayerFactory: function () {

    }
  }

  JSPP.ppclass('PPLayerFactory', public, protected, private)
})()