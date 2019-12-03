JSPP.ppinclude(function (__filepath__) {"use strict"
  let __public__ = {
    static: {
      getInstance: function () {
        if (!this.instance) {
          this.instance = JSPP.ppnew('PPResManager')
        }
        return this.instance
      }
    },
    // 标记使用资源
    addResUse: function (reslist) {
      if (!(reslist instanceof Array)) {
        reslist = [reslist]
      }
      for (let i = 0; i < reslist.length; i++) {
        let respath = reslist[i]
        if (this.ccResInfo[respath] && this.ccResInfo[respath] > 0) {
          this.ccResInfo[respath]++
        } else {
          this.ccResInfo[respath] = 1
          appInstance.resManager().addResConfig({ plist: respath + '.plist', png: respath + '.png' })
        }
      }
    },
    // 清除使用资源标记
    removeResUse: function (reslist) {
      if (!(reslist instanceof Array)) {
        reslist = [reslist]
      }
      for (let i = 0; i < reslist.length; i++) {
        let respath = reslist[i]
        if (this.ccResInfo[respath]) {
          this.ccResInfo[respath]--
          if (this.ccResInfo[respath] <= 0) {
            appInstance.resManager().removeLoadedResByKey({ plist: respath + '.plist', png: respath + '.png' })
          }
        }
      }
    }
  }

  let __protected__ = {}

  let __private__ = {
    static: {
      instance: null,
      ccResInfo: {}
    },
    PPResManager: function () {

    },
    _PPResManager: function () {

    }
  }

  JSPP.ppclass('PPResManager', __public__, __protected__, __private__)
})