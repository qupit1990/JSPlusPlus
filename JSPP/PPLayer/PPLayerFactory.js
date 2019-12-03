JSPP.ppinclude(function (__filepath__) {"use strict"
  let __public__ = {
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
      if (cfg) {
        if (cfg.length === 3) {
          return JSPP.ppnew(cfg[0], cfg[1],cfg[2], null)
        } else if (cfg.length === 4) {
          return JSPP.ppnew(cfg[0], cfg[1], cfg[2], cfg[3])
        }
      }
      JSPP.pperror('PPLayerFactory: key [' + key + ']\'s keyinfo can\'t be use !')
    },
    // 添加key 默认配置
    addKeyDefaultInfo: function (key, useclassname, ccspath, pathinfo, usedreslist) {
      this.keyDefaultMap[key] = [useclassname, ccspath, pathinfo, usedreslist]
    },
    // 添加key 项目配置
    addKeyPrejectInfo: function (key, useclassname, ccspath, pathinfo, usedreslist) {
      this.keyMap[key] = [useclassname, ccspath, pathinfo, usedreslist]
    },
    // 获取类配置
    getKeyInfo: function (key) {
      if (this.keyMap[key] !== undefined){
        return this.keyMap[key]
      }
      return this.keyDefaultMap[key]
    }
  }

  let __protected__ = {}

  let __private__ = {
    static: {
      instance: null,
      keyMap: {},
      keyDefaultMap: {}
    },
    PPLayerFactory: function () {

    },
    _PPLayerFactory: function () {

    }
  }

  JSPP.ppclass('PPLayerFactory', __public__, __protected__, __private__)
})